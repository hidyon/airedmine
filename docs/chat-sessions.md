# Chat Sessions

AIRedmine の Chat は、Redmine issue の探索、PM 判断、更新提案の確認を一問一答ではなく相談トピック単位で進める。
チャットセッションは、その相談トピックを保存・再開・整理するための作業単位である。

## 現状

現行 UI は `DeveloperChatView` 内で `sessionIdRef` を生成し、`POST /api/chat` に `session_id` と `messages[]` を送っている。
ただし、セッション一覧や過去セッションの再開 UI はない。

backend には `conversations` テーブルがあるが、現時点の `/api/chat` は受け取った `messages[]` を AI に渡すだけで、session metadata や履歴取得 API はまだ持っていない。

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
- `related_issue_ids`: 会話中に参照・提案された issue ID の候補
- `last_proposal_action`: 最後に提示された proposal の action 候補

初期 title は最初の user message から作る。
後続で LLM 要約や手動リネームを検討するが、ISS-112 では単純な切り詰めでよい。

## 表示と AI 文脈の分離

セッション再開時に UI に表示する履歴と、AI に渡す履歴は分けて考える。

UI 表示:

- セッション内の user / assistant message を時系列に表示する。
- proposal、tool call、references は assistant message の一部として見返せるのが望ましい。
- 初期スコープでは text と response payload の保存範囲を小さくし、proposal / audit との厳密な結合は後続で扱う。

AI 文脈:

- 同じ `session_id` の直近 message のみを渡す。
- 別セッションの会話は混ぜない。
- 直近 8〜12 message または一定文字数で切り詰める。
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
- アーカイブ
- 削除 UI
- セッション名の LLM 自動生成
- セッション要約の永続化
- ユーザー横断の長期記憶
- proposal / audit log との厳密な DB リレーション

## 後続 issue への分割

ISS-112:

- `conversations` をセッション履歴として使う。
- `chat_sessions` metadata テーブルを追加した。
- セッション一覧と詳細 API を追加した。
- `POST /api/chat` が user / assistant message を保存し、session metadata を更新するようにした。

ISS-113:

- Chat UI にセッション一覧・新規作成・切替を追加する。
- 選択した session の messages を読み込み、会話を再開できるようにする。
- モバイルでは一覧を折りたたむ。

ISS-114:

- backend 側で session_id から直近 messages を読み込み、AI 文脈に含める。
- frontend から送る `messages[]` 依存を弱める。
- 件数・文字数上限と切り詰めルールを実装する。
