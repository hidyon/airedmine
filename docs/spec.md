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
| observer | 更新ログや体験メモの閲覧 |

ロール認証は未実装。将来の認証実装の設計は `docs/role-design.md` に記録。
現状はチャット UI のロール切り替えボタンでロールを選択する（認証なし）。

### 解く問題

1. Redmine の issue 一覧を自分で読み解いて優先度を判断するコストが高い。
2. 背景・判断理由・仕様が issue の外（docs, PR, 議事録）に散らばっていて参照しにくい。
3. Redmine への更新（コメント・ステータス変更）を安全に確認する導線がない。
4. AI が Redmine を直接更新したとき、人間が確認する境界が不明確になりやすい。
5. キーワードが一致しないと関連チケットを発見できない（意味的な検索ができない）。

### 主要ユースケース

| # | ユースケース | 関連 issue |
| --- | --- | --- |
| UC-01 | 開発者が「今日何からやればいい？」と質問し、Claude が Redmine を参照して優先 issue の推薦を受け取る | ISS-066, ISS-069 |
| UC-02 | 開発者が issue 番号を指定して詳細・背景・次アクションを質問する | ISS-021, ISS-047, ISS-066 |
| UC-03 | 開発者が Chat の提案から Redmine コメント案を確認し、承認する | ISS-026, ISS-059 |
| UC-04 | 開発者が Dashboard で担当 issue 一覧を確認し、詳細パネルで内容を読む | ISS-046, ISS-060 |
| UC-05 | PM が PM View でプロジェクト全体の停滞・高優先・判断待ちを一覧する | ISS-055 |
| UC-06 | PM または開発者が Audit で更新ログを確認する | ISS-028, ISS-055 |
| UC-07 | 開発者が概念（「認証」「パフォーマンス」など）で関連 issue を意味検索する | ISS-070 |
| UC-08 | 開発者・PM が前の発言を踏まえた連続した質問をする（マルチターン会話） | ISS-065, ISS-067 |

### 対象外

- Redmine 以外の外部システム（GitHub, Slack 等）との連携
- ユーザー認証・認可の実装（設計のみ: `docs/role-design.md`）
- AI モデルの自己学習・ファインチューニング
- Redmine でのステータス変更・クローズ操作の実行（提案表示のみ）

---

## 機能仕様

### アーキテクチャ

```text
ブラウザ (React + TypeScript + Vite, :5173)
        | /api/* proxy
        v
FastAPI バックエンド (:8000)
        |
        +--> AI Agent (Anthropic API / Claude Haiku)
        |       +--> tool: list_issues           Redmine issue 一覧取得
        |       +--> tool: get_issue             Redmine issue 詳細・journals 取得
        |       +--> tool: search_issues         キーワード検索
        |       +--> tool: search_issues_semantic  意味検索 (sentence-transformers)
        |       +--> tool: add_comment           コメント追加（確認待ちを返す）
        |       +--> tool: search_knowledge      docs 検索
        |
        +--> Redmine Connector (httpx) → Redmine (:3000)
        +--> Knowledge Base (docs/ 読み込み)
        +--> Semantic Index (SQLite + paraphrase-multilingual-MiniLM-L12-v2)
        +--> Proposal & Audit Layer (in-memory)
        +--> Experience Notes (SQLite)
```

### View 構成

| View | URL | 対象ロール | 主な機能 |
| --- | --- | --- | --- |
| Developer Chat | `/developer/chat` | developer / pm | マルチターン AI チャット、ロール切り替え、ツール呼び出し表示、proposal カード |
| Developer Dashboard | `/developer/dashboard` | developer | 担当 issue 一覧、issue 詳細パネル |
| PM View | `/pm` | pm | 停滞・高優先・PM 判断待ちのサマリーカード |
| Audit | `/audit` | 全員 | 更新提案ログ一覧 |

`/` にアクセスすると `/developer/chat` にリダイレクトされる。

### API エンドポイント

| メソッド | パス | 説明 | 関連 issue |
| --- | --- | --- | --- |
| GET | `/health` | ヘルスチェック | ISS-052 |
| GET | `/api/config` | 接続状態・モード・診断情報 | ISS-007 |
| GET | `/api/issues` | issue 一覧（assigned_to_id, status_id, limit, sort, offset でフィルタ） | ISS-008 |
| GET | `/api/issues/{id}` | issue 詳細（description, journals 含む） | ISS-047 |
| POST | `/api/chat` | 自然言語質問 → AI Agent が Redmine を参照して回答・提案を返す | ISS-066 |
| POST | `/api/proposals/comment` | 提案を Redmine に実行する | ISS-026 |
| GET | `/api/proposals/logs` | 更新提案の実行ログ（直近 20 件） | ISS-028 |
| GET | `/api/experience/notes` | 体験メモ一覧・サマリー | ISS-051 |
| POST | `/api/experience/notes` | 体験メモ作成 | ISS-051 |
| GET | `/api/ai/health` | Anthropic API 疎通確認 | ISS-063 |
| GET | `/api/ai/index/status` | 意味検索インデックスの件数・状態 | ISS-070 |
| POST | `/api/ai/index/build` | 意味検索インデックスの強制再構築 | ISS-070 |

#### POST /api/chat リクエスト形式

```json
{
  "question": "今日取り組むべき issue を教えて",
  "session_id": "uuid-or-any-string",
  "role": "developer",
  "messages": [
    {"role": "user", "content": "前の質問"},
    {"role": "assistant", "content": "前の回答"}
  ]
}
```

- `session_id`: フロントエンドが生成・保持するセッション識別子
- `role`: `"developer"` または `"pm"`（システムプロンプトの切り替えに使う）
- `messages`: 会話履歴（省略可）。フロントエンドが蓄積して毎回送る

#### Redmine API 連携

| 操作 | Redmine エンドポイント | 入力 | 出力 | 失敗時 |
| --- | --- | --- | --- | --- |
| issue 一覧取得 | `GET /issues.json` | status_id, limit, sort, offset, assigned_to_id（任意） | issues[], total_count | RedmineApiError |
| issue 詳細取得 | `GET /issues/{id}.json?include=journals` | issue_id | issue + journals | 404 → None |
| コメント追加 | `PUT /issues/{id}.json` | issue_id, notes | updated: true | RedmineApiError |

`REDMINE_BASE_URL` または `REDMINE_API_KEY` が未設定の場合、mock モードで動作する（`backend/mock/mock_redmine.py`）。

### AI Agent の動作（`backend/services/agent.py`）

`POST /api/chat` の処理フロー：

1. **システムプロンプト選択**: `role` に応じて developer / pm 向けプロンプトを選択する（`backend/services/prompts.py`）。
2. **会話履歴の組み立て**: `messages[]` を Anthropic API 形式に変換し、今回の `question` を末尾に追加する。
3. **tool_use ループ（最大 5 ラウンド）**:
   - Anthropic API に `TOOL_SCHEMAS`（6 ツール）と `messages` を渡す。
   - `stop_reason == "end_turn"` になったら最終回答を返す。
   - `tool_use` ブロックがある場合は `execute_tool()` を実行し、結果を `tool_result` として履歴に追加して再度 API を呼ぶ。
   - `add_comment` ツールは Redmine を直接更新せず、`confirmation_required` フラグ付きの proposal を返す。
4. **レスポンス**: `{"answer", "proposal", "tool_calls"}` を返す。

#### ロール別システムプロンプト

| ロール | 回答の切り口 |
| --- | --- |
| developer | 今日の優先 issue・ブロッカー・技術的な次アクション・依存関係 |
| pm | プロジェクト全体のリスク・停滞 issue・担当者負荷・PM 判断が必要な事項 |

#### ツール定義（`backend/services/tools.py`）

| ツール名 | 説明 | 主な入力 |
| --- | --- | --- |
| `list_issues` | issue 一覧取得 | status_id, assigned_to_id（任意）, limit |
| `get_issue` | issue 詳細・journals 取得 | issue_id |
| `search_issues` | キーワードで件名を全文検索 | query, limit |
| `search_issues_semantic` | 意味的に近い issue を検索 | query, top_k |
| `add_comment` | コメント追加（確認待ちを返す） | issue_id, notes |
| `search_knowledge` | docs をキーワード検索 | query |

### 意味検索インデックス（`backend/services/issue_index.py`）

- モデル: `paraphrase-multilingual-MiniLM-L12-v2`（日本語対応、384 次元）
- 格納先: SQLite `issue_embeddings` テーブル
- 構築: `POST /api/ai/index/build` またはツール初回呼び出し時に自動構築
- ページネーションで全チケット（510+ 件）を取得してインデックスを作成する
- 類似度 0.3 未満は結果から除外する

### データ

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

#### 起動確認

- [ ] トップバーに「Mock」または「Redmine」バッジが表示される
- [ ] サイドバーに 4 つのナビリンクが表示される
- [ ] `/` にアクセスすると `/developer/chat` にリダイレクトされる

#### Developer Chat — 基本動作

- [ ] ロール切り替えタブ（開発者 / PM）が表示される
- [ ] 例文ボタンをクリックすると入力欄にテキストが入る
- [ ] Enter で送信 → ユーザーバブルが右に表示される
- [ ] ローディングアニメーション（「Redmine を確認しています…」）が表示される
- [ ] AI の回答バブルが左に表示される
- [ ] 回答の下にツール呼び出しバッジ（「issue 一覧」等）が紫色で表示される

#### Developer Chat — AI Agent 動作

- [ ] 「今日取り組むべき issue を教えて」→ Claude が Redmine を参照して優先順位付きで回答する
- [ ] 「認証関連の issue を探して」→ `search_issues_semantic` ツールが呼ばれ、意味的に近い issue が返る
- [ ] 「#841 にコメントを追加して: テスト送信」→ proposal カード（緑）が表示される
- [ ] proposal カードの「Redmine に送信」をクリック → 「✓ Redmine に送信済み」になる

#### Developer Chat — マルチターン会話

- [ ] 「停滞 issue は？」→ 回答を受け取る
- [ ] 続けて「そのうち優先度が高いものは？」→ 前の文脈を踏まえた回答が返る
- [ ] ロールを「PM」に切り替えると例文と説明文が変わる
- [ ] 「会話をリセット」ボタンで履歴がクリアされる

#### Developer Dashboard

- [ ] 担当 issue 一覧が表示される
- [ ] issue 行をクリック → 右に詳細パネル（description, meta, journals）が開く
- [ ] 別の issue をクリック → パネルが切り替わる
- [ ] ✕ ボタンでパネルが閉じる

#### PM View

- [ ] 「PM 判断待ち」「停滞 (5日超)」「高優先度」の 3 カードが表示される
- [ ] 各カードに件数と issue 一覧が表示される

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
