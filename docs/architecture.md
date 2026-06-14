# AIRedmine Architecture

この文書は、現在の AIRedmine の実装構成、責務分担、主要データフローを開発者と Codex が追えるようにまとめる。
要求・機能・テスト仕様の全体像は `docs/spec.md`、ユーザー向けの起動・デモ手順は `README.md` を参照する。

## Runtime Topology

```text
Browser (React + TypeScript + Vite, :5173)
        | /api/* proxy (frontend/vite.config.ts, BACKEND_URL)
        v
FastAPI backend (backend/main.py, :8000)
        |
        +--> Routers
        |       +--> auth        /api/auth/login, /api/auth/me
        |       +--> config      /api/config
        |       +--> issues      /api/issues, /api/issues/{issue_id}
        |       +--> chat        /api/chat, /api/chat/sessions
        |       +--> proposals   /api/proposals/*
        |       +--> ai          /api/ai/*
        |       +--> pm          /api/pm/*
        |       +--> experience  /api/experience/notes
        |
        +--> Services
        |       +--> Chat Agent        backend/services/agent.py
        |       +--> Tool definitions  backend/services/tools.py
        |       +--> System prompts    backend/services/prompts.py
        |       +--> Redmine Connector backend/services/redmine_connector.py
        |       +--> Semantic Index    backend/services/issue_index.py
        |       +--> Embedder          backend/services/embedder.py
        |       +--> Knowledge Base    backend/services/knowledge_base.py
        |
        +--> SQLite (backend/db.py, DB_PATH)
        |       +--> users
        |       +--> chat_sessions
        |       +--> conversations
        |       +--> issue_embeddings
        |       +--> experience_notes
        |
        v
Redmine (:3000) or mock connector data
```

Redmine 接続は `REDMINE_BASE_URL` と `REDMINE_API_KEY` が設定されている場合は `backend/services/redmine_connector.py` の httpx 経由で行う。
未設定の場合は `backend/mock/mock_redmine.py` のモックデータで、issue 一覧・詳細・更新確認フローを試せる。

`mcp-server/` は Claude Code などから Redmine を操作する独立した MCP サーバーで、AIRedmine web アプリの FastAPI / React とは別プロセスとして扱う。

## Responsibilities

| Layer | Files | Responsibility |
| --- | --- | --- |
| Frontend shell | `frontend/src/App.tsx`, `frontend/src/components/Layout.tsx`, `frontend/src/auth.ts` | ルーティング、保護ルート、ロール別ナビゲーション、JWT 保存 |
| Chat UI | `frontend/src/views/DeveloperChatView.tsx` | セッション選択、チャット送信、tool_use 表示、proposal 承認、`#NNN` からの issue 詳細表示 |
| Dashboards | `frontend/src/views/DeveloperDashboardView.tsx`, `frontend/src/views/PMDashboardView.tsx` | 担当 issue 一覧、PM 統計、issue 詳細表示 |
| Audit UI | `frontend/src/views/AuditView.tsx` | Proposal 実行ログ、失敗 category / retryable / HTTP status の表示 |
| Issue detail UI | `frontend/src/components/IssueDetailPanel.tsx` | 選択 issue の詳細取得と description / journals / tracker / version / dates の表示 |
| API client/types | `frontend/src/api/client.ts`, `frontend/src/api/types.ts` | FastAPI への request と TypeScript 型 |
| API routers | `backend/routers/*.py` | HTTP endpoint とリクエスト検証、サービス呼び出し |
| Agent | `backend/services/agent.py` | Anthropic tool_use ループ、proposal への変換、回答整形 |
| Tools | `backend/services/tools.py` | Redmine 参照ツール、確認待ち更新ツール、ナレッジ検索、意味検索 |
| Connector | `backend/services/redmine_connector.py` | Redmine REST API 呼び出し、mock との差し替え境界 |
| Proposal / Audit | `backend/routers/proposals.py` | 人間が承認した更新の実行、Audit 用のインメモリログ生成 |
| Semantic Index | `backend/services/issue_index.py`, `backend/services/embedder.py` | issue embedding の構築、検索、freshness 判定 |
| SQLite | `backend/db.py` | app-local users、chat session、conversation、embedding、experience note の永続化 |

## Core Data Flows

### 1. Login and Role Context

1. Browser は `/api/auth/login` に username / password を送る。
2. Backend は SQLite `users` から role、display_name、`redmine_user_id` を取得し、JWT を返す。
3. Frontend は JWT と user 情報を localStorage に保存する。
4. `Layout` は role に応じて Chat / Dashboard / Audit の導線を表示する。
5. Chat 送信時は role、display_name、`redmine_user_id` が `/api/chat` に渡され、role 別 system prompt と「自分の issue」解決に使われる。

### 2. Issue List and Issue Detail

Issue 一覧と詳細は取得目的が違う。

- `GET /api/issues` は `backend/routers/issues.py` から `RedmineConnector.list_issues()` を呼び、一覧表示向けの issue を返す。description / journals を前提にしない。
- `GET /api/issues/{issue_id}` は `RedmineConnector.get_issue_detail()` を呼び、Redmine の `include=journals` 付き詳細を返す。`IssueDetailPanel` はこの endpoint を使って description、journals、tracker、fixed_version、updated_on などを表示する。
- Chat / Dashboard / PM Dashboard の `#NNN` リンクや行選択は、右サイドの `IssueDetailPanel` を開いて詳細 endpoint を読む。

この分離により、一覧は軽く保ちつつ、選択時だけ説明と更新履歴を読める。

### 3. Chat Answer and Tool Use

1. `DeveloperChatView` が question、role、session_id、user context を `POST /api/chat` に送る。
2. `backend/routers/chat.py` は同じ `session_id` の `conversations` を読み込み、直近 10 messages / 6000 文字までに切り詰める。保存済み履歴がない場合だけ request の `messages[]` を fallback として使う。
3. `run_agent()` が Anthropic API の tool_use ループを実行する。
4. 参照系ツールは Redmine Connector / Knowledge Base / Semantic Index から情報を取得する。
5. 更新系ツールは Redmine を直接更新せず、`confirmation_required` を含む proposal を返す。
6. Backend は回答または proposal を返し、`chat_sessions` と `conversations` に user / assistant turn を保存する。

### 4. Proposal, Redmine Update, and Audit Log

Chat からの更新依頼は、人間の確認を境界にしている。

1. Agent が `add_comment`、`create_issue`、`change_status`、`change_assignee`、`bulk_update`、`update_due_date`、`update_priority`、`update_done_ratio`、`assign_version`、`add_relation` などの proposal を返す。
2. Frontend は `ProposalCard` として差分を表示する。Closed 化、Urgent 化、過去日期日などの高リスク更新は追加確認を要求する。
3. ユーザーが承認すると、Frontend は `/api/proposals/comment`、`/api/proposals/update`、`/api/proposals/create_issue`、`/api/proposals/add_relation`、`/api/proposals/bulk_update` のいずれかを呼ぶ。
4. `backend/routers/proposals.py` が Redmine Connector 経由で Redmine を更新する。
5. 成功・失敗の結果は `_update_logs` にインメモリで保存され、`GET /api/proposals/logs` から Audit に表示される。

Audit log は現在のプロセス内メモリであり、backend 再起動後の永続監査履歴ではない。

### 5. Chat Sessions

Chat session は相談トピック単位の履歴である。

- 一覧は `GET /api/chat/sessions`、詳細は `GET /api/chat/sessions/{session_id}`。
- session metadata は SQLite `chat_sessions`、message は `conversations` に保存される。
- `/api/chat` は同じ `session_id` の履歴だけを AI 文脈に渡す。別セッションの履歴は混ぜない。
- session title は最初の question から生成される。

詳細は `docs/chat-sessions.md` を参照する。

### 6. Semantic Index and Freshness

Semantic Index は Redmine issue を embedding 化して、キーワードが一致しない関連 issue を探すためのローカルインデックスである。

1. `POST /api/ai/index/build` または初回の意味検索で `backend/services/issue_index.py` が Redmine から全 issue を取得する。
2. 一覧取得後、可能なら各 issue の詳細を `get_issue_detail()` で取り直し、description と journals も embedding 対象に含める。
3. embedding 対象は subject、tracker、status、priority、assigned_to、fixed_version、due_date、description、直近 journals notes。
4. 結果は SQLite `issue_embeddings` に保存される。
5. `GET /api/ai/index/freshness` は Redmine の `updated_on` と `issue_embeddings.indexed_at` を比較して stale / orphan / missing を返す。

Redmine 更新後、Semantic Index は自動で即時更新されない。seed 入れ替えや Redmine 更新後に意味検索の精度を揃えるには、index rebuild を実行する。
対象範囲と freshness 方針は `docs/semantic-embedding-scope.md` と `docs/semantic-index-freshness.md` を参照する。

### 7. Seed Data

Demo seed は実プロジェクトに近いチケット集合と履歴を Redmine に投入する。

1. `npm run seed:demo` が `scripts/seed-demo.mjs` を実行する。
2. script は docker compose 上の Redmine runner で `scripts/redmine/seed-demo.rb` を起動する。
3. seed 本体は `scripts/redmine/seed-data/*.yml` に定義される。
4. seed 後は意味検索の stale を避けるため、通常は Semantic Index rebuild も行う。

seed のシナリオ設計は `docs/seed-scenario.md` を参照する。

### 8. PM Stats and Performance

PM Dashboard は `/api/pm/burndown` と `/api/pm/stats` を使い、Redmine issue 一覧からバーンダウン、停滞 issue、担当者別負荷、優先度サマリーを組み立てる。
API / frontend の計測とボトルネック分析は `docs/performance.md` に記録する。

## Current Boundaries

- Chat の更新系 tool は Redmine に直接書き込まない。書き込みは proposal endpoint だけが実行する。
- Audit log はインメモリであり、SQLite には永続化していない。
- Proposal と Chat session は厳密な外部キーで結びついていない。
- Semantic Index は Redmine 更新・seed 入れ替え後に stale になりうる。freshness 確認または rebuild が必要。
- 認証は AIRedmine ローカルの JWT と SQLite `users` であり、Redmine OAuth ではない。
- `mcp-server/` は web アプリから独立している。

## Related Documents

- `README.md`: 起動方法、デモ手順、利用者向けの概要。
- `docs/spec.md`: 要求仕様、機能仕様、テスト仕様。
- `docs/chat-sessions.md`: Chat session の体験要件と実装方針。
- `docs/semantic-embedding-scope.md`: embedding 対象範囲。
- `docs/semantic-index-freshness.md`: stale / rebuild 方針。
- `docs/performance.md`: 性能計測とボトルネック分析。
- `docs/seed-scenario.md`: demo seed のシナリオ設計。
- `docs/mcp.md`: Redmine MCP サーバー。
