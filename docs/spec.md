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
| developer | 自分の担当 issue の状況・優先度・次アクション |
| pm | プロジェクト全体の停滞・リスク・判断待ち issue |
| observer | 更新ログや体験メモの閲覧 |

ロール認証は未実装。将来の認証実装の設計は `ISS-056` で定義する。

### 解く問題

1. Redmine の issue 一覧を自分で読み解いて優先度を判断するコストが高い。
2. 背景・判断理由・仕様が issue の外（docs, PR, 議事録）に散らばっていて参照しにくい。
3. Redmine への更新（コメント・ステータス変更）を安全に確認する導線がない。
4. AI が Redmine を直接更新したとき、人間が確認する境界が不明確になりやすい。

### 主要ユースケース

| # | ユースケース | 関連 issue |
| --- | --- | --- |
| UC-01 | 開発者が「今日何からやればいい？」と質問し、優先 issue の推薦を受け取る | ISS-024, ISS-048 |
| UC-02 | 開発者が issue 番号を指定して詳細・背景・次アクションを質問する | ISS-021, ISS-047 |
| UC-03 | 開発者が Chat の提案から Redmine コメント案を確認し、承認する | ISS-026, ISS-059 |
| UC-04 | 開発者が Dashboard で担当 issue 一覧を確認し、詳細パネルで内容を読む | ISS-046, ISS-060 |
| UC-05 | PM が PM View でプロジェクト全体の停滞・高優先・判断待ちを一覧する | ISS-055 |
| UC-06 | PM または開発者が Audit で更新ログを確認する | ISS-028, ISS-055 |

### 対象外

- Redmine 以外の外部システム（GitHub, Slack 等）との連携
- ユーザー認証・認可の実装（設計のみ: ISS-056）
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
        +--> Redmine Connector (httpx) → Redmine (:3000)
        +--> Knowledge Base (docs/ 読み込み)
        +--> Chat Engine (intent 分類・回答生成)
        +--> Proposal & Audit Layer (in-memory)
        +--> Experience Notes (SQLite)
```

### View 構成

| View | URL | 対象ロール | 主な機能 |
| --- | --- | --- | --- |
| Developer Chat | `/developer/chat` | developer | 自然言語チャット、clarification、proposal カード、issue 詳細パネル |
| Developer Dashboard | `/developer/dashboard` | developer | 担当 issue 一覧、issue 詳細パネル |
| PM View | `/pm` | pm | 停滞・高優先・PM 判断待ちのサマリーカード |
| Audit | `/audit` | 全員 | 更新提案ログ一覧 |

`/` にアクセスすると `/developer/chat` にリダイレクトされる。

### API エンドポイント

| メソッド | パス | 説明 | 関連 issue |
| --- | --- | --- | --- |
| GET | `/health` | ヘルスチェック | ISS-052 |
| GET | `/api/config` | 接続状態・モード・診断情報 | ISS-007 |
| GET | `/api/issues` | issue 一覧（assigned_to_id, status_id, limit, sort でフィルタ） | ISS-008 |
| GET | `/api/issues/{id}` | issue 詳細（description, journals 含む） | ISS-047 |
| POST | `/api/chat` | 自然言語質問 → 回答・提案・参照を返す | ISS-005 |
| POST | `/api/proposals/comment` | 提案を Redmine に実行する | ISS-026 |
| GET | `/api/proposals/logs` | 更新提案の実行ログ（直近 20 件） | ISS-028 |
| GET | `/api/experience/notes` | 体験メモ一覧・サマリー | ISS-051 |
| POST | `/api/experience/notes` | 体験メモ作成 | ISS-051 |

#### Redmine API 連携

| 操作 | Redmine エンドポイント | 入力 | 出力 | 失敗時 |
| --- | --- | --- | --- | --- |
| issue 一覧取得 | `GET /issues.json` | assigned_to_id, status_id, limit, sort | issues[], total_count | RedmineApiError (503/401/etc) |
| issue 詳細取得 | `GET /issues/{id}.json?include=journals` | issue_id | issue + journals | 404 → None, その他 → RedmineApiError |
| コメント追加 | `PUT /issues/{id}.json` | issue_id, notes | updated: true | RedmineApiError |

`REDMINE_BASE_URL` または `REDMINE_API_KEY` が未設定の場合、mock モードで動作する（`backend/mock/mock_redmine.py`）。

### データ

#### SQLite: experience_notes

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | TEXT PK | `exp-{timestamp}` |
| created_at | TEXT | ISO 8601 UTC |
| role | TEXT | developer / pm / observer |
| moment | TEXT | morning / triage / handoff / update / review |
| signal | TEXT | lighter / clearer / blocked / risky / unclear |
| note | TEXT | 体験メモ本文（最大 600 文字） |
| next_action | TEXT | 次のアクション（最大 240 文字） |

#### In-memory: proposal logs

更新提案の実行ログ。直近 50 件を保持（`backend/routers/proposals.py`）。
コンテナ再起動でリセットされる（永続化は後続課題）。

### Chat Engine の動作

`POST /api/chat` の処理フロー（`backend/services/chat_engine.py`）:

1. **clarification 判定**: 更新依頼かつ issue 番号なし、または曖昧語句 → clarification レスポンスを返す（ISS-048）。
2. **issue 特定**: `#番号` パターンから issue ID を抽出し、詳細を取得する（ISS-021, ISS-047）。
3. **intent 分類**: 質問の intent（今日の優先、リスク、PM 判断、高優先、更新）を判定する。
4. **回答生成**: intent に応じた回答テキストと参照 issue リストを生成する。
5. **proposal 生成**: 更新 intent の場合、コメント案・ステータス変更案・クローズ候補を生成する（ISS-024）。

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

### モードの切り替え

| 環境変数 | 設定値 | 動作 |
| --- | --- | --- |
| REDMINE_BASE_URL + REDMINE_API_KEY | 両方設定済み | redmine モード（実 Redmine に接続） |
| どちらか未設定 | — | mock モード（mock_redmine.py のデータを使用） |

---

## テスト仕様

### 自動テスト（バックエンド）

ファイル: `backend/tests/test_routes.py`

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
| test_chat_basic | POST /api/chat (優先質問) → answer + references |
| test_chat_clarification | POST /api/chat (曖昧更新依頼) → clarification |
| test_chat_no_clarification_with_issue_id | POST /api/chat (#1208 コメント依頼) → proposal |
| test_proposals_logs_empty | GET /api/proposals/logs → logs[] |
| test_experience_notes_get | GET /api/experience/notes → notes + total |
| test_experience_notes_create | POST /api/experience/notes → 201 + note |
| test_experience_notes_create_missing_note | POST (note 空) → 400 |

現在のパス状況: **12/12**

### 型チェック（フロントエンド）

```bash
docker compose exec frontend npx tsc --noEmit
```

エラーゼロを維持する。

### 手動確認チェックリスト

`http://localhost:5173` をブラウザで開き、以下を確認する。

#### 起動確認

- [ ] トップバーに「Mock」または「Redmine」バッジが表示される
- [ ] サイドバーに 4 つのナビリンクが表示される
- [ ] `/` にアクセスすると `/developer/chat` にリダイレクトされる

#### Developer Chat

- [ ] 例文ボタンをクリックすると入力欄にテキストが入る
- [ ] Enter で送信 → ユーザーバブルが右に表示される
- [ ] ローディングアニメーション（3ドット）が表示される
- [ ] AI の回答バブルが左に表示される
- [ ] `「なんか更新して」` → clarification カード（青）が表示される
- [ ] `「#1208 にコメントを追加して: テスト」` → proposal カード（緑）が表示される
- [ ] 参照チップ（`#1208 ...`）をクリック → 右に issue 詳細パネルが開く
- [ ] 同じチップを再クリック → パネルが閉じる

#### Developer Dashboard

- [ ] 担当 issue 一覧が表示される（モック: 8 件）
- [ ] issue 行をクリック → 右に詳細パネル（description, meta, journals）が開く
- [ ] 別の issue をクリック → パネルが切り替わる
- [ ] ✕ ボタンでパネルが閉じる

#### PM View

- [ ] 「PM 判断待ち」「停滞 (5日超)」「高優先度」の 3 カードが表示される
- [ ] 各カードに件数と issue 一覧が表示される

#### Audit

- [ ] ログがない場合はガイドメッセージが表示される
- [ ] Chat で proposal を実行後、ログが表示される（ISS-059 実装後）

---

## 変更履歴

- 2026-06-07: 初版作成（ISS-062）。Milestone 8 時点の仕様を記録。
