# AIRedmine 仕様書

このドキュメントは AIRedmine の要求仕様・機能仕様・テスト仕様をまとめたものです。
各仕様は対応する issue を参照しており、詳細な判断履歴は `docs/issueslog.md` に記録されています。

---

## 要求仕様

### 目的

AI エージェントを通じて Redmine を利用したとき、開発者や PM の体験がどう変化するかを明らかにするプロトタイプを構築する。

### 対象ユーザー

| ロール | 主な関心事 |
| --- | --- |
| developer | 自分の担当 issue の状況・優先度・次アクション・技術的なコンテキスト |
| pm | プロジェクト全体の停滞・リスク・判断待ち issue・担当者負荷 |

ロールはログイン時に決まる。同じチャット UI でロール別のシステムプロンプトが適用される。

### 解く問題

1. Redmine の issue 一覧を自分で読み解いて優先度を判断するコストが高い。
2. 背景・判断理由・仕様が issue の外（docs, PR, 議事録）に散らばっていて参照しにくい。
3. Redmine への更新（issue 作成、コメント、ステータス、担当者、期日、優先度、進捗率、バージョン、関連付け）を安全に確認してから反映する必要がある。
4. AI が Redmine 更新案を作るとき、人間が確認する境界と実行後の監査履歴を明確にする必要がある。
5. キーワードが一致しないと関連チケットを発見できない（意味的な検索ができない）。
6. 「自分の issue」を聞いても誰の issue か特定できない（担当者の紐づけがない）。

### 主要ユースケース

| # | ユースケース | 関連 issue |
| --- | --- | --- |
| UC-01 | 開発者が「今日何からやればいい？」と質問し、Claude が Redmine を参照して優先 issue の推薦を受け取る | ISS-066, ISS-069 |
| UC-02 | 開発者が issue 番号を指定して詳細・背景・次アクションを質問する | ISS-021, ISS-047, ISS-066 |
| UC-03 | 開発者が Chat の提案から Redmine 更新案を確認し、承認する | ISS-026, ISS-059, ISS-073, ISS-079〜083 |
| UC-04 | 開発者が Dashboard で担当 issue 一覧を確認し、詳細パネルで内容を読む | ISS-046, ISS-060 |
| UC-05 | PM がログイン後、Chat で「停滞 issue は？」「リスクは？」など PM 視点の質問をする | ISS-072 |
| UC-06 | 開発者・PM が Audit で更新ログを確認する | ISS-028, ISS-055 |
| UC-07 | 開発者が概念（「認証」「パフォーマンス」など）で関連 issue を意味検索する | ISS-070 |
| UC-08 | 開発者・PM が前の発言を踏まえた連続した質問をする（マルチターン会話） | ISS-065, ISS-067 |
| UC-09 | ユーザーがログインし、自分のロールに合った画面・回答を受け取る | ISS-074, ISS-075 |
| UC-10 | 開発者が「#1208 のステータスを進行中にして」「期日を来週にして」などを依頼し、確認後に Redmine に反映する | ISS-073, ISS-080〜083 |
| UC-11 | 開発者が「私の今日の issue を教えて」と質問し、ログインユーザーの担当 issue を受け取る | ISS-074 |
| UC-12 | 開発者が「田中の issue を見せて」と質問し、名前から担当者 ID を解決して絞り込む | — |

### 対象外

- Redmine 以外の外部システム（GitHub, Slack 等）との連携
- AI モデルの自己学習・ファインチューニング
- Redmine での複数 issue の一括更新（単一 issue の主要更新操作は対応済み）

---

## 機能仕様

### アーキテクチャ

```text
ブラウザ (React + TypeScript + Vite, :5173)
        | /api/* proxy
        v
FastAPI バックエンド (:8000)
        |
        +--> Auth Layer (JWT / PyJWT / SQLite users テーブル)
        |
        +--> AI Agent (Anthropic API / Claude Haiku)
        |       +--> tool: list_issues             Redmine issue 一覧取得
        |       +--> tool: get_issue               Redmine issue 詳細・journals 取得
        |       +--> tool: search_issues           キーワード検索
        |       +--> tool: search_issues_semantic  意味検索 (sentence-transformers)
        |       +--> tool: list_projects           project_id 参照
        |       +--> tool: list_issue_statuses     status_id 参照
        |       +--> tool: list_priorities         priority_id 参照
        |       +--> tool: list_users              user_id 参照
        |       +--> tool: list_versions           version_id 参照
        |       +--> tool: add_comment             コメント追加（確認待ちを返す）
        |       +--> tool: change_status           ステータス変更（確認待ちを返す）
        |       +--> tool: change_assignee         担当者変更（確認待ちを返す）
        |       +--> tool: create_issue            issue 作成（確認待ちを返す）
        |       +--> tool: update_due_date         期日変更（確認待ちを返す）
        |       +--> tool: update_priority         優先度変更（確認待ちを返す）
        |       +--> tool: update_done_ratio       進捗率更新（確認待ちを返す）
        |       +--> tool: assign_version          バージョン割当（確認待ちを返す）
        |       +--> tool: add_relation            関連付け（確認待ちを返す）
        |       +--> tool: search_knowledge        docs 検索
        |
        +--> Redmine Connector (httpx) → Redmine (:3000)
        +--> Knowledge Base (docs/ 読み込み)
        +--> Semantic Index (SQLite + paraphrase-multilingual-MiniLM-L12-v2)
        +--> Proposal & Audit Layer (差分表示 / 二段階確認 / 実行ログ / 再試行判断)
        +--> Experience Notes (SQLite)
```

### View 構成

| View | URL | 対象ロール | 主な機能 |
| --- | --- | --- | --- |
| Login | `/login` | 全員 | ユーザー名・パスワードでログイン。JWT をローカルストレージに保存 |
| Chat | `/developer/chat` | developer / pm | マルチターン AI チャット、ツール呼び出し表示、proposal カード |
| Dashboard | `/developer/dashboard` | developer | 担当 issue 一覧、issue 詳細パネル |
| Dashboard | `/pm/dashboard` | pm | バーンダウン、停滞 issue、担当者別負荷、優先度サマリー |
| Audit | `/audit` | 全員 | 更新提案ログ一覧 |

ナビゲーションはロール別にフィルタリングされる（PM: Chat + Audit、開発者: Chat + Dashboard + Audit）。
未ログイン状態で保護ルートにアクセスすると `/login` にリダイレクトされる。

### API エンドポイント

| メソッド | パス | 説明 | 関連 issue |
| --- | --- | --- | --- |
| GET | `/health` | ヘルスチェック | ISS-052 |
| GET | `/api/config` | 接続状態・モード・診断情報 | ISS-007 |
| POST | `/api/auth/login` | ユーザー名・パスワードで JWT を取得 | ISS-074 |
| GET | `/api/auth/me` | JWT からログイン中ユーザー情報を取得 | ISS-074 |
| GET | `/api/issues` | issue 一覧（assigned_to_id, status_id, limit, sort, offset でフィルタ） | ISS-008 |
| GET | `/api/issues/{id}` | issue 詳細（description, journals 含む） | ISS-047 |
| GET | `/api/pm/burndown` | PM Dashboard 用バーンダウン系列 | ISS-076 |
| GET | `/api/pm/stats` | PM Dashboard 用統計（timings / cache 状態を含む） | ISS-078, ISS-103 |
| POST | `/api/chat` | 自然言語質問 → AI Agent が Redmine を参照して回答・提案を返す | ISS-066 |
| GET | `/api/chat/sessions` | チャットセッション一覧 | ISS-112 |
| GET | `/api/chat/sessions/{session_id}` | チャットセッション詳細・メッセージ履歴 | ISS-112 |
| POST | `/api/proposals/comment` | コメント追加を Redmine に実行する | ISS-026 |
| POST | `/api/proposals/update` | ステータス・担当者・期日・優先度・進捗率・バージョンを Redmine に実行する | ISS-073, ISS-080, ISS-081, ISS-082 |
| POST | `/api/proposals/create_issue` | issue 作成を Redmine に実行する | ISS-079 |
| POST | `/api/proposals/add_relation` | issue 関連付けを Redmine に実行する | ISS-083 |
| GET | `/api/proposals/logs` | 更新提案の実行ログ（直近 20 件） | ISS-028 |
| GET | `/api/experience/notes` | 体験メモ一覧・サマリー | ISS-051 |
| POST | `/api/experience/notes` | 体験メモ作成 | ISS-051 |
| GET | `/api/ai/health` | Anthropic API 疎通確認 | ISS-063 |
| GET | `/api/ai/index/status` | 意味検索インデックスの件数・状態・モデル warm-up 状態 | ISS-070, ISS-102 |
| GET | `/api/ai/index/freshness` | 意味検索インデックスと Redmine の stale / orphan 診断 | ISS-107 |
| POST | `/api/ai/index/build` | 意味検索インデックスの強制再構築 | ISS-070 |

#### POST /api/auth/login

```json
{ "username": "tanaka", "password": "demo" }
```

レスポンス:

```json
{
  "token": "<JWT>",
  "user": {
    "user_id": 1,
    "username": "tanaka",
    "display_name": "田中 健太",
    "role": "developer",
    "redmine_user_id": 5
  }
}
```

#### POST /api/chat リクエスト形式

```json
{
  "question": "今日取り組むべき issue を教えて",
  "session_id": "uuid-or-any-string",
  "role": "developer",
  "messages": [
    {"role": "user", "content": "前の質問"},
    {"role": "assistant", "content": "前の回答"}
  ],
  "redmine_user_id": 5,
  "display_name": "田中 健太"
}
```

- `role`: JWT のロールを使用（UI での変更不可）
- `session_id`: 空の場合は backend が `chat-{uuid}` 形式で発行し、レスポンスにも含める
- `redmine_user_id`: ログインユーザーの Redmine user_id。システムプロンプトに注入されて「私の issue」の解決に使われる
- `display_name`: ユーザーの表示名

#### POST /api/proposals/update リクエスト形式

```json
{
  "issue_id": 1208,
  "action": "status_change",
  "new_status_id": 2,
  "new_status_name": "進行中",
  "reason": "着手したため"
}
```

`action` は `"status_change"` / `"assignee_change"` / `"due_date"` / `"priority"` / `"done_ratio"` / `"version"` に対応する。担当変更時は `new_assigned_to_id` / `new_assigned_to_name` を使う。

#### POST /api/proposals/create_issue リクエスト形式

```json
{
  "project_id": "1",
  "subject": "リリース前チェックリストを整備する",
  "description": "QA 前に確認項目を整理する",
  "assigned_to_id": 5,
  "priority_id": 3,
  "due_date": "2026-07-01"
}
```

#### POST /api/proposals/add_relation リクエスト形式

```json
{
  "issue_id": 1208,
  "related_issue_id": 1207,
  "relation_type": "blocks",
  "reason": "先に API 側の修正が必要"
}
```

#### Redmine API 連携

| 操作 | Redmine エンドポイント | 入力 | 出力 | 失敗時 |
| --- | --- | --- | --- | --- |
| issue 一覧取得 | `GET /issues.json` | status_id, limit, sort, offset, assigned_to_id（任意） | issues[], total_count | RedmineApiError |
| issue 詳細取得 | `GET /issues/{id}.json?include=journals` | issue_id | issue + journals | 404 → None |
| プロジェクト一覧取得 | `GET /projects.json` | limit | projects[], total_count | RedmineApiError |
| ステータス一覧取得 | `GET /issue_statuses.json` | なし | statuses[] | RedmineApiError |
| 優先度一覧取得 | `GET /enumerations/issue_priorities.json` | なし | priorities[] | RedmineApiError |
| ユーザー一覧取得 | `GET /users.json` | limit | users[] | 401/403 → 権限不足エラー |
| バージョン一覧取得 | `GET /projects/{id}/versions.json` | project_id | versions[] | RedmineApiError |
| issue 作成 | `POST /issues.json` | project_id, subject, description, assigned_to_id, priority_id, due_date | issue | RedmineApiError |
| コメント追加 | `PUT /issues/{id}.json` | issue_id, notes | updated: true | RedmineApiError |
| issue 更新 | `PUT /issues/{id}.json` | status_id, assigned_to_id, due_date, priority_id, done_ratio, fixed_version_id | updated: true | RedmineApiError |
| 関連付け追加 | `POST /issues/{id}/relations.json` | issue_id, related_issue_id, relation_type | relation | RedmineApiError |

`REDMINE_BASE_URL` または `REDMINE_API_KEY` が未設定の場合、mock モードで動作する（`backend/mock/mock_redmine.py`）。

### 認証（`backend/routers/auth.py`）

- `POST /api/auth/login`: username + DEMO_PASSWORD で照合し、PyJWT で署名した JWT を返す
- JWT ペイロード: `{ user_id, username, display_name, role, redmine_user_id }`
- `GET /api/auth/me`: Authorization ヘッダーの Bearer トークンを検証してユーザー情報を返す
- フロントエンドは JWT を `localStorage` に保存し、期限切れまたはログアウトで削除する

### AI Agent の動作（`backend/services/agent.py`）

`POST /api/chat` の処理フロー：

1. **ユーザー情報取得**: `get_all_users()` でチームメンバー一覧を取得する。
2. **システムプロンプト生成** (`backend/services/prompts.py`):
   - ロール別プロンプト（developer / pm）にユーザー情報ブロックを追加する。
   - ログインユーザーの `display_name`, `redmine_user_id` を注入する。
   - チームメンバー一覧（username・表示名・redmine_user_id）を注入する（名前→ID解決に使用）。
   - `assigned_to_id="me"` の使用を禁止し、数値 ID の使用を指示する。
3. **会話履歴の組み立て**: `messages[]` を Anthropic API 形式に変換し、今回の `question` を末尾に追加する。
4. **tool_use ループ（最大 5 ラウンド）**:
   - Anthropic API に `TOOL_SCHEMAS`（19 ツール）と `messages` を渡す。
   - `stop_reason == "end_turn"` になったら最終回答を返す。
   - `tool_use` ブロックがある場合は `execute_tool()` を実行し、結果を `tool_result` として履歴に追加して再度 API を呼ぶ。
   - `add_comment` / `create_issue` / `change_status` / `change_assignee` / `update_due_date` / `update_priority` / `update_done_ratio` / `assign_version` / `add_relation` ツールは Redmine を直接更新せず、`confirmation_required` フラグ付きの proposal を返す。
   - project/status/priority/user/version の ID が必要な場合は参照ツールで確認し、推測した ID では proposal を作らない。
5. **レスポンス**: `{"answer", "proposal", "tool_calls"}` を返す。

#### ロール別システムプロンプト

| ロール | 回答の切り口 |
| --- | --- |
| developer | 今日の優先 issue・ブロッカー・技術的な次アクション・依存関係 |
| pm | プロジェクト全体のリスク・停滞 issue・担当者負荷・PM 判断が必要な事項 |

#### ツール定義（`backend/services/tools.py`）

| ツール名 | 説明 | 主な入力 |
| --- | --- | --- |
| `list_issues` | issue 一覧取得 | status_id, assigned_to_id（数値）, limit |
| `get_issue` | issue 詳細・journals 取得 | issue_id |
| `search_issues` | キーワードで件名を全文検索 | query, limit |
| `search_issues_semantic` | 意味的に近い issue を検索 | query, top_k |
| `list_projects` | project_id 参照用のプロジェクト一覧取得 | なし |
| `list_issue_statuses` | status_id 参照用のステータス一覧取得 | なし |
| `list_priorities` | priority_id 参照用の優先度一覧取得 | なし |
| `list_users` | user_id 参照用のユーザー一覧取得 | なし |
| `list_versions` | version_id 参照用のバージョン一覧取得 | project_id |
| `add_comment` | コメント追加（確認待ちを返す） | issue_id, notes |
| `change_status` | ステータス変更（確認待ちを返す） | issue_id, new_status_id, new_status_name, reason |
| `change_assignee` | 担当者変更（確認待ちを返す） | issue_id, new_assigned_to_id, new_assigned_to_name, reason |
| `create_issue` | issue 作成（確認待ちを返す） | project_id, subject, description, assigned_to_id, priority_id, due_date |
| `update_due_date` | 期日変更（確認待ちを返す） | issue_id, due_date, reason |
| `update_priority` | 優先度変更（確認待ちを返す） | issue_id, new_priority_id, new_priority_name, reason |
| `update_done_ratio` | 進捗率更新（確認待ちを返す） | issue_id, done_ratio, reason |
| `assign_version` | バージョン割当（確認待ちを返す） | issue_id, version_id, version_name, reason |
| `add_relation` | issue 関連付け（確認待ちを返す） | issue_id, related_issue_id, relation_type, reason |
| `search_knowledge` | docs をキーワード検索 | query |

### マークダウンレンダリング（`frontend/src/views/DeveloperChatView.tsx`）

- `react-markdown` + `remark-gfm` でアシスタントの回答をレンダリングする。
- `#NNN` パターンを検出して `[#NNN](#issue-NNN)` リンクに変換する（`linkifyIssues()` 関数）。
- リンクをクリックすると右サイドに issue 詳細パネルが開く（`IssueDetailPanel`）。

### 意味検索インデックス（`backend/services/issue_index.py`）

- モデル: `paraphrase-multilingual-MiniLM-L12-v2`（日本語対応、384 次元）
- 格納先: SQLite `issue_embeddings` テーブル
- 構築: `POST /api/ai/index/build` またはツール初回呼び出し時に自動構築
- ページネーションで全チケット（510+ 件）を取得してインデックスを作成する
- 類似度 0.3 未満は結果から除外する

### データ

#### SQLite: users

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | INTEGER PK | 自動採番 |
| username | TEXT UNIQUE | Redmine のログイン名と一致させる |
| display_name | TEXT | 表示名（日本語） |
| role | TEXT | developer / pm |
| redmine_user_id | INTEGER | Redmine の user.id。システムプロンプトへの注入・assigned_to_id の解決に使用 |
| created_at | TEXT | ISO 8601 UTC |

初期ユーザーは `backend/scripts/seed_users.py` で投入する。パスワードは `DEMO_PASSWORD` 環境変数で全員共通。

#### SQLite: experience_notes

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | TEXT PK | `exp-{timestamp}` |
| created_at | TEXT | ISO 8601 UTC |
| role | TEXT | developer / pm / observer |
| moment | TEXT | morning / triage / handoff / update / review |
| signal | TEXT | lighter / clearer / blocked / risky / unclear |
| note | TEXT | 体験メモ本文 |
| next_action | TEXT | 次のアクション |

#### SQLite: conversations

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | INTEGER PK | 自動採番 |
| session_id | TEXT | フロントが生成するセッション ID |
| role | TEXT | user / assistant |
| content | TEXT | メッセージ本文 |
| created_at | TEXT | ISO 8601 UTC |

#### SQLite: chat_sessions

| カラム | 型 | 説明 |
| --- | --- | --- |
| session_id | TEXT PK | セッション ID |
| title | TEXT | 一覧表示用タイトル |
| role | TEXT | developer / pm |
| created_at | TEXT | ISO 8601 UTC |
| updated_at | TEXT | ISO 8601 UTC |

チャットセッション体験の要件と初期スコープは [`chat-sessions.md`](chat-sessions.md) に記録する。
初期方針では、UI に表示する履歴と AI に渡す文脈を分け、AI には同一 `session_id` の直近 message のみを渡す。

#### SQLite: issue_embeddings

| カラム | 型 | 説明 |
| --- | --- | --- |
| issue_id | INTEGER PK | Redmine issue ID |
| subject | TEXT | チケット件名 |
| body | TEXT | ステータス・優先度テキスト |
| embedding | BLOB | numpy float32 配列（384 次元） |
| indexed_at | TEXT | インデックス構築日時 |

#### In-memory: proposal logs

更新提案の実行ログ。直近 50 件を保持（`backend/routers/proposals.py`）。
コンテナ再起動でリセットされる（永続化は後続課題）。

### エラー処理

Redmine API エラーは `RedmineApiError` でラップし、カテゴリ別にメッセージを返す。

| カテゴリ | 条件 | retryable |
| --- | --- | --- |
| auth | HTTP 401 / 403 | false |
| not_found | HTTP 404 | false |
| validation | HTTP 422 | false |
| rate_limit | HTTP 429 | true |
| server | HTTP 5xx | true |
| connection | httpx.RequestError | true |

---

## テスト仕様

### 自動テスト（バックエンド）

```bash
docker compose exec backend python -m pytest tests/ -v
```

| テスト名 | 確認内容 |
| --- | --- |
| test_health | GET /health → `{"status": "ok"}` |
| test_config_mock_mode | GET /api/config → mode == "mock" |
| test_issues_list_mock | GET /api/issues → issues[] が返る |
| test_issue_detail_mock | GET /api/issues/1208 → id=1208 + journals |
| test_issue_detail_not_found | GET /api/issues/9999 → 404 |
| test_chat_basic | POST /api/chat → answer が返る（Anthropic API が必要） |
| test_proposals_logs_empty | GET /api/proposals/logs → logs[] |
| test_experience_notes_get | GET /api/experience/notes → notes + total |
| test_experience_notes_create | POST /api/experience/notes → 201 + note |
| test_experience_notes_create_missing_note | POST (note 空) → 400 |

### 手動確認チェックリスト

`http://localhost:5173` をブラウザで開き、以下を確認する。

#### ログイン

- [ ] 未ログインで `/developer/chat` にアクセスすると `/login` にリダイレクトされる
- [ ] `tanaka` / `demo` でログインできる
- [ ] ログイン後、ヘッダーに表示名と「開発者」バッジが表示される
- [ ] `nakamura` でログインすると「PM」バッジが表示される
- [ ] 「ログアウト」でセッションが削除され `/login` に戻る

#### ナビゲーション（ロール別）

- [ ] 開発者でログイン → Chat / Dashboard / Audit の 3 リンクが表示される
- [ ] PM でログイン → Chat / Audit の 2 リンクが表示される

#### Developer Chat — 基本動作

- [ ] 例文ボタンをクリックすると入力欄にテキストが入る
- [ ] Enter で送信 → ユーザーバブルが右に表示される
- [ ] ローディングアニメーションが表示される
- [ ] AI の回答バブルが左にマークダウンでレンダリングされる（箇条書き・表）
- [ ] 回答の下にツール呼び出しバッジ（「issue 一覧」等）が表示される

#### Developer Chat — AI Agent 動作

- [ ] 「今日の作業ダッシュボードを見せて」→ Claude が Redmine を参照して優先順位付きで回答する
- [ ] `tanaka` でログインして「私の今日の issue を教えて」→ tanaka（redmine_user_id=5）の担当 issue が返る
- [ ] 「田中の issue を見せて」→ 表示名から user_id=5 を解決して担当 issue が返る
- [ ] 「認証関連の issue を探して」→ `search_issues_semantic` ツールが呼ばれ、意味的に近い issue が返る
- [ ] 回答内の `#NNN` をクリック → 右に issue 詳細パネルが開く
- [ ] 「#841 にコメントを追加して: テスト送信」→ proposal カード（緑）が表示される
- [ ] proposal カードの「Redmine に送信」をクリック → 「✓ Redmine に送信済み」になる
- [ ] 「#1208 のステータスを進行中にして」→ ステータス変更 proposal カードが表示される
- [ ] ステータス変更 proposal の「実行」をクリック → 「✓ Redmine を更新しました」になる

#### Developer Chat — マルチターン会話

- [ ] 「停滞 issue は？」→ 回答を受け取る
- [ ] 続けて「そのうち優先度が高いものは？」→ 前の文脈を踏まえた回答が返る
- [ ] 「会話をリセット」ボタンで履歴がクリアされる

#### Developer Dashboard

- [ ] 担当 issue 一覧が表示される
- [ ] issue 行をクリック → 右に詳細パネル（description, meta, journals）が開く
- [ ] 別の issue をクリック → パネルが切り替わる
- [ ] ✕ ボタンでパネルが閉じる

#### Audit

- [ ] ログがない場合はガイドメッセージが表示される
- [ ] Chat で proposal を実行後、ログが表示される

#### 意味検索インデックス

- [ ] `curl -X POST http://localhost:8000/api/ai/index/build` が `indexed_issues > 0` を返す
- [ ] `curl http://localhost:8000/api/ai/index/status` が `ready: true` を返す

---

## 変更履歴

- 2026-06-07: 初版作成（ISS-062）。Milestone 8 時点の仕様を記録。
- 2026-06-07: Milestone 9・11 の仕様を追加。AI Agent (Anthropic API + tool_use)、マルチターン会話、ロール別プロンプト、意味検索インデックス（sentence-transformers）を反映した。
- 2026-06-07: Milestone 12 の仕様を追加。JWT 認証、マークダウンレンダリング、issue リンク、ロール固定ナビ、change_status / change_assignee ツール、チームメンバーリストのシステムプロンプト注入を反映した。
