# Chat Sessions

AIRedmine の Chat は、Redmine issue の探索、PM 判断、更新提案の確認を一問一答ではなく相談トピック単位で進める。
チャットセッションは、その相談トピックを保存・再開・整理するための作業単位である。

## 現状

現行 UI は Chat 画面にセッション一覧を表示し、新規セッション作成、既存セッション切替、保存済み履歴からの再開に対応している。

backend は `chat_sessions` を metadata、`conversations` を message 履歴として使う。
`POST /api/chat` は user / assistant message を保存し、同じ `session_id` の直近履歴を AI 文脈として読み込む。

## セッション単位

初期スコープでは、1 セッションを「1 つの相談トピック」とみなす。

| ユースケース | セッション単位 | 例 |
| --- | --- | --- |
| 今日の担当 issue 相談 | その日の作業計画 | 「私の今日の issue を優先順に教えて」から始まる会話 |
| Sprint 3 リリース判断 | 1 回の判断・準備作業 | 「Sprint 3 のリリース判断で残っているリスクは？」 |
| 更新提案の確認 | 1 つまたは少数の関連操作 | 「一括承認バグに PM 確認待ちコメントを追加する提案」 |
| 調査・深掘り | 1 つのテーマ | 「月次カレンダーのパフォーマンス改善について要約して」 |

複数 issue をまたぐ会話でも、ユーザーの意図が同じ作業なら同一セッションにまとめる。
別の目的に移る場合は新規セッションにする。

## セッション metadata

初期実装で持つべき metadata:

- `session_id`: UI または backend が発行する一意 ID
- `title`: セッション一覧に表示する短い名前
- `role`: `developer` / `pm`
- `created_at`
- `updated_at`
- `message_count`
- `related_issue_ids`: assistant payload の proposal / references から抽出した issue ID（最大 5 件）
- `last_proposal_action`: 最後に提示された proposal の action

初期 title は最初の user message から作る。
後続で LLM 要約や手動リネームを検討するが、ISS-112 では単純な切り詰めでよい。

## 表示と AI 文脈の分離

セッション再開時に UI に表示する履歴と、AI に渡す履歴は分けて考える。

UI 表示:

- セッション内の user / assistant message を時系列に表示する。
- assistant message は `content` に回答本文、`payload` に ChatResponse 相当 JSON を保存する。
- `payload` がある履歴では proposal、tool call、references を assistant message の一部として見返せる。
- 古い履歴や user message では `payload` が null になり、text 表示に fallback する。
- proposal / audit との厳密な結合は後続で扱う。

AI 文脈:

- 同じ `session_id` の直近 message のみを渡す。
- 別セッションの会話は混ぜない。
- 直近 10 message、合計 6000 文字で切り詰める。
- tool result や proposal payload は、そのまま全量を渡さず、必要な要約または assistant text を優先する。
- Redmine は更新されうるため、古い会話内の issue 状態を事実として扱いすぎない。必要なら最新 issue を tool で再取得する。

## 初期スコープ

ISS-112〜114 で扱う初期スコープ:

- セッション一覧 API
- セッション詳細 API
- Chat UI での新規セッション作成
- Chat UI での既存セッション切替・再開
- 同一セッションの直近履歴を AI 文脈に渡す
- 履歴の件数または文字数上限

初期スコープ外:

- セッション検索
- ピン留め
- 削除 UI
- セッション名の LLM 自動生成
- セッション要約の永続化
- ユーザー横断の長期記憶
- proposal / audit log との厳密な DB リレーション

## 整理操作の方針

セッションが増えたときの整理操作は、履歴の追跡性を壊さずに一覧の見通しをよくすることを優先する。
Redmine 更新や Audit log の意味を後から確認できるよう、破壊的な削除は初期スコープに入れない。

| 操作 | 初期判断 | 理由 | 想定変更 |
| --- | --- | --- | --- |
| リネーム | 実装候補 | 最初の質問から作る title は便利だが、相談が長引くと内容とずれる。履歴の意味を失わずに見つけやすくできる。 | `PATCH /api/chat/sessions/{session_id}` で `title` を更新し、Chat UI の一覧または詳細ヘッダーから編集する |
| アーカイブ | 実装候補 | 完了した相談を通常一覧から隠せると、削除せずに整理できる。監査性を保ちやすい。 | `chat_sessions.archived_at` を nullable で追加し、一覧 API は初期表示で未アーカイブのみ返す。必要なら `include_archived` query を追加する |
| 削除 | 当面やらない | proposal / audit / Redmine 更新判断の文脈を消すリスクが高い。削除は監査方針が固まるまで避ける。 | 将来扱う場合は soft delete を前提にし、物理削除や Audit log 削除とは分ける |

初期実装順は、まずリネーム、次にアーカイブとする。
削除は、監査ログ永続化や proposal との関連付け方針が決まるまで対象外にする。

ISS-123:

- `chat_sessions.archived_at` を nullable で追加する。
- `GET /api/chat/sessions` は通常、未アーカイブ session のみ返す。
- `GET /api/chat/sessions?include_archived=true` はアーカイブ済み session も返す。
- `POST /api/chat/sessions/{session_id}/archive` は session を通常一覧から隠し、messages と assistant payload は保持する。
- `GET /api/chat/sessions/{session_id}` はアーカイブ済み session でも履歴を取得できる。
- Chat UI は現在開いている session をアーカイブでき、実行後は新規 session に戻る。

ISS-124:

- Chat UI の session sidebar で通常表示と全履歴表示を切り替えられるようにする。
- 全履歴表示では `include_archived=true` を使い、アーカイブ済み session も一覧に出す。
- アーカイブ済み session は一覧と詳細ヘッダーでラベル表示し、通常 session と区別する。
- アーカイブ済み session の再アーカイブ、アーカイブ解除、削除は初期スコープ外にする。

### 後続 issue 候補

- 削除が必要かを、Audit log 永続化や proposal 関連付けの設計後に再評価する。

## 後続 issue への分割

ISS-112:

- `conversations` をセッション履歴として使う。
- `chat_sessions` metadata テーブルを追加した。
- セッション一覧と詳細 API を追加した。
- `POST /api/chat` が user / assistant message を保存し、session metadata を更新するようにした。

ISS-113:

- Chat UI にセッション一覧・新規作成・切替を追加した。
- 選択した session の messages を読み込み、会話を再開できるようにした。
- モバイルではセッション一覧を上部に縦積みし、会話領域を潰しすぎないようにした。

ISS-114:

- backend 側で session_id から直近 messages を読み込み、AI 文脈に含めるようにした。
- frontend から送る `messages[]` は保存済み履歴がない場合の fallback とし、履歴送信依存を弱めた。
- 文脈は直近 10 messages、合計 6000 文字までに制限し、別セッションの履歴を混ぜないようにした。

ISS-119:

- `conversations.payload` に assistant 応答の ChatResponse 相当 JSON を保存する。
- session detail API は message ごとに `payload` を返す。payload がない既存履歴では null を返す。
- Chat UI は assistant message の payload があれば、ProposalCard、references、tool call badges を復元して表示する。
- AI 文脈には従来通り `content` のみを渡し、payload 全量は渡さない。

ISS-120:

- session 一覧 API は保存済み assistant payload から `related_issue_ids` と `last_proposal_action` を返す。
- `related_issue_ids` は proposal の `issue_id` / `issue_ids` / `target_issue` / `related_issue_id` / `issue_targets` と、issue references から重複なしで抽出する。
- Chat UI の session 一覧は関連 issue と最後の proposal action を小さな badge として表示する。
- payload がない古い session では `related_issue_ids: []`、`last_proposal_action: null` として従来表示に fallback する。

ISS-121:

- session 整理操作は、リネームとアーカイブを初期実装候補、削除を当面対象外とする。
- リネームは `chat_sessions.title` の手動更新として、小さな API / UI 変更で実装できる。
- アーカイブは `archived_at` による soft state とし、通常一覧から隠す方針にする。
- 削除は監査性と履歴追跡への影響が大きいため、Audit log 永続化や proposal 関連付け方針が決まるまで先送りする。

ISS-122:

- `PATCH /api/chat/sessions/{session_id}` で `chat_sessions.title` を手動更新する。
- title は空白のみを拒否し、80 文字を上限にする。
- Chat UI は現在選択中の session ヘッダーから名前変更でき、更新後に session 一覧へ反映する。
- 履歴、assistant payload、proposal / audit log は変更しない。
