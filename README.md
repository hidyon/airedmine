# AIRedmine

AIRedmine は、AI エージェントを通じて Redmine を利用する未来の開発体験を試すためのプロトタイプです。

Redmine を活用したプロジェクトでは、issue、進捗、担当、判断履歴、リリース計画などが Redmine に集約されます。
今後の AI 駆動開発では、開発者や PM が Redmine を直接操作するだけでなく、AI エージェントを通じて Redmine の情報を読み、整理し、更新し、次の作業を決めることが増えると考えます。

このアプリの目的は、そのとき開発者や PM の体験がどう変化するか、どこが改善されるか、どんな不安や摩擦が残るかを体験できる形で明らかにすることです。

現在の実装は、Redmine REST API を使う軽量なチケットダッシュボードから始めています。

## ユーザー体験

AIRedmine が目指す体験は、Redmine を便利に見ることだけではありません。
Redmine に集約された issue、進捗、担当、判断履歴に加えて、設計ドキュメント、議事録、仕様書、PR、CI 結果、過去の意思決定などの知識ベースを AI エージェントが横断し、開発者や PM が次に判断・行動すべきことを分かるようにすることです。

Redmine は「何をするか」「誰が担当か」「今どういう状態か」を持ちます。
知識ベースは「なぜそうするのか」「過去に何を決めたのか」「実装上の注意は何か」を持ちます。
AIRedmine はこの 2 つをつなぎ、プロジェクトの状態を単なる一覧ではなく、作業と判断の文脈として体験できるようにします。

### 開発者の体験

開発者は、朝に AIRedmine を開くと、Redmine の未完了チケット一覧を自分で読み解く代わりに、AI エージェントから今日の作業候補、優先理由、ブロッカー、確認すべき仕様を受け取ります。

たとえば、AI エージェントは次のように支援します。

- 今日取り組むべき issue を優先度、依存関係、更新状況から並べ替える。
- 長いコメント履歴や関連ドキュメントを要約する。
- ブロッカー、未回答質問、仕様の曖昧さを抽出する。
- 実装前に要求仕様、機能仕様、テスト仕様の下書きを作る。
- 作業後に Redmine コメントや進捗更新の文案を作る。
- テスト結果や完了条件と照らして、issue をクローズできるか判定を補助する。

開発者にとって Redmine は、管理される場所ではなく、自分の作業を始めやすくしてくれるプロジェクトの記憶になります。

### PM の体験

PM は、Redmine の一覧やガントチャートを細かく巡回する代わりに、AI エージェントからプロジェクトの兆候を受け取ります。

たとえば、AI エージェントは次のように支援します。

- 停滞している issue を検出する。
- 担当者ごとの負荷や優先度の偏りを要約する。
- PM の判断待ちになっている issue を集約する。
- 仕様書、議事録、Redmine の状態にズレがないか確認する。
- 次の定例で話すべき議題を作る。
- リリース前に未完了、未検証、仕様未確定の項目を洗い出す。
- Redmine の記述不足やテスト未記載など、AI 活用を妨げる情報品質の問題を見つける。

PM にとって Redmine は、入力された管理台帳ではなく、プロジェクトのリスクや詰まりを早く見つける観測装置になります。

### 知識ベースを含めた体験

Redmine だけでは、issue の状態は分かっても、背景や判断理由までは十分に分かりません。
AIRedmine では、Redmine を中心に置きながら、周辺の知識ベースも扱います。

対象となる知識ベースの例:

- `README.md` や `docs/` 配下の設計ドキュメント
- Redmine wiki
- GitHub / GitLab の PR、commit、CI 結果
- Slack / Teams の意思決定ログ
- 議事録、仕様書、ADR
- 障害報告、リリースノート
- API ドキュメント
- 過去の issue 解決履歴

これにより、AI エージェントは「この issue は何か」だけでなく、「なぜ重要か」「どの仕様と関係するか」「過去に何が決まったか」「次に誰が何を確認すべきか」まで提示できるようになります。

### 自然言語での対話

AIRedmine はブラウザー UI だけでなく、自然言語対話も主要な入口として扱います。
ユーザーは AI エージェントに Redmine や知識ベースについて質問し、要約や次アクション提案を受け取り、重要な更新はブラウザー UI 上で根拠と差分を確認してから実行します。

自然言語対話は、探索、相談、要約、次アクション決定に向いています。
ブラウザー UI は、一覧、比較、根拠確認、承認に向いています。
AIRedmine はこの 2 つを組み合わせ、気軽に聞いて、重要な判断は画面で確認する体験を目指します。

開発者の対話例:

- 「今日まず何からやればいい？」
- 「#123 の背景を教えて」
- 「この issue はクローズしていい？」
- 「未回答の質問が残っている issue はある？」
- 「この実装が終わったので Redmine コメント案を書いて」

PM の対話例:

- 「今週のリスクを教えて」
- 「止まっている issue は？」
- 「誰かに作業が偏っている？」
- 「次の定例で話すべきことをまとめて」
- 「仕様書と Redmine の内容にズレはある？」

### 人間が確認する境界

AIRedmine では、AI が勝手に Redmine を操作する体験を目指しません。
AI は情報収集、要約、比較、更新案の作成を支援し、人間は判断、承認、クローズ、Redmine への反映を確認します。

たとえば、AI エージェントは次のように振る舞います。

- 「この issue はクローズ候補です。ただし、テスト結果の記録がないため確認が必要です。」
- 「このコメントを Redmine に投稿できます。内容は、実装完了、確認したテスト、残リスクです。」
- 「仕様書では方針が決まっていますが、Redmine の説明が古い可能性があります。」

この境界を明確にすることで、AI に任せる部分と人間が責任を持つ部分を分け、安心して AI 駆動開発を体験できるようにします。

## 体験させたいこと

- 開発者が AI エージェント経由で自分の作業状況を把握する。
- PM が AI エージェント経由でプロジェクトの詰まり、優先度、リスクを確認する。
- Redmine の issue を、単なる一覧ではなく「次に何をすべきか」を判断する材料として扱う。
- Redmine 以外の知識ベースを横断し、issue の背景や判断理由を把握する。
- ブラウザー UI と自然言語対話を組み合わせ、探索、要約、確認、承認を自然に行う。
- AI が Redmine を操作するときに、人間が確認すべき境界を明らかにする。
- 従来の Redmine 操作と比べて、開発体験がどう軽くなるか、逆にどこに新しい注意が必要かを観察する。

## できること

- 自分に割り当てられた Redmine チケットを一覧表示
- 件名、プロジェクト、担当者、ステータスで検索
- ステータス別の件数サマリ
- API キーをブラウザに出さないサーバー側プロキシ
- `.env` 未設定でも動作確認できるモックデータ
- Redmine issue と docs を参照する自然言語の質問入口
- 更新系の依頼を直接実行せず、確認待ちの更新案として表示
- コメント追加案は差分を確認してから実 Redmine へ反映
- 更新実行ログ、失敗分類、再試行導線を表示
- ステータス変更とクローズ候補は安全条件を確認する段階に留める

## アーキテクチャ方針

AIRedmine は、ブラウザー画面だけを frontend と見なさず、人間との接点全体を Human Interface Layer として扱います。

```text
[Human Interface Layer]
  Browser UI / Chat UI / CLI / IDE agent / Slack or Teams bot
        |
        v
[App Server / Agent API]
        |
        +--> Redmine Connector
        +--> Knowledge Connector
        +--> AI Agent Layer
        +--> Proposal & Audit Layer
```

- Browser UI: 一覧、比較、根拠確認、承認に使う。
- Chat UI: 質問、探索、要約、次アクション相談に使う。
- App Server / Agent API: Redmine API キーを隠し、UI と対話インターフェースへ共通 API を提供する。
- Redmine Connector: issue、project、user、journal、wiki、time entry などを扱う。
- Knowledge Connector: `docs/`、Redmine wiki、PR、CI、議事録、仕様書などを扱う。
- AI Agent Layer: 要約、関連情報探索、次アクション提案、リスク検出、更新案作成を行う。
- Proposal & Audit Layer: Redmine 更新前の確認、承認、実行ログを扱う。

重要な Redmine 更新は、自然言語対話から直接実行せず、更新案として作成し、ブラウザー UI で差分、理由、影響範囲を確認してから反映します。

## 開発環境

開発環境は devcontainer または Docker Compose を前提に整備します。
Redmine は無料で利用できる OSS 版を使用し、ローカル検証環境では Docker Compose で AIRedmine と Redmine を一緒に起動できる構成を目指します。

想定する環境:

- AIRedmine app server
- AIRedmine browser UI
- OSS 版 Redmine
- Redmine 用 database
- 将来的な AI / knowledge index 用 service

## 開発ドキュメント

- `agent.md`: 共同開発ルール
- `docs/roadmap.md`: ロードマップ
- `docs/issues.md`: issue 管理
- `docs/issueslog.md`: issue の検討ログ

## 起動

```bash
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

## Docker Compose でローカル Redmine と起動する

AIRedmine、OSS 版 Redmine、PostgreSQL をまとめて起動できます。
AIRedmine app server は `Dockerfile` から Docker イメージとして build されます。

```bash
docker compose up
```

`docker compose` が使えない環境では、`docker-compose up` を使います。

app image だけを build する場合:

```bash
docker compose build app
```

`docker compose` が使えない環境では、`docker-compose build app` を使います。

起動後に開く画面:

- AIRedmine: `http://localhost:5173`
- Redmine: `http://localhost:3000`

最初は `REDMINE_API_KEY` が未設定のため、AIRedmine はモックデータで起動します。
Redmine 側で REST API を有効にし、API キーを取得してから `.env` に設定します。

```bash
REDMINE_API_KEY=your-redmine-api-key
```

`.env` を更新したら AIRedmine コンテナを再起動します。

```bash
docker compose up app
```

`docker compose` が使えない環境では、`docker-compose up app` を使います。

Docker Compose では、AIRedmine app server から Redmine へ `http://redmine:3000` で接続します。
ブラウザーから Redmine を見る場合は `http://localhost:3000` を使います。

接続確認:

```bash
curl http://localhost:5173/api/config
curl "http://localhost:5173/api/issues?status_id=open"
```

### サンプルデータを投入する

ローカル Redmine に、AIRedmine の体験確認用プロジェクトと issue を投入できます。

```bash
docker-compose exec -T redmine bundle exec rails runner /demo-scripts/seed-demo.rb
docker-compose up -d app
```

投入される主なデータ:

- `AIRedmine Demo` プロジェクト
- PM 判断待ち、仕様確認待ち、停滞リスク、クローズ候補を含む issue
- Redmine の REST API 有効化
- admin ユーザーの API キー

API キーはコマンド出力の `api_key` を `.env` の `REDMINE_API_KEY` に設定します。
すでに `.env` 設定済みの場合は、app コンテナの再起動だけで実 Redmine の issue が表示されます。

## Redmine と接続する

外部で利用できる OSS 版 Redmine または手元で起動した Redmine に AIRedmine を接続して試すこともできます。

### Redmine 側の準備

Redmine の管理画面で REST API を有効にします。

一般的な流れ:

1. 管理者で Redmine にログインする。
2. 管理、設定、API の画面を開く。
3. REST API を有効にする。
4. 接続確認に使うユーザーでログインし、個人設定から API キーを取得する。

API キーはサーバー側の環境変数として扱い、ブラウザーには直接渡しません。

### AIRedmine 側の設定

`.env.example` を参考に `.env` を作成します。

```bash
REDMINE_BASE_URL=http://localhost:3000
REDMINE_API_KEY=your-redmine-api-key
PORT=5173
```

設定項目:

- `REDMINE_BASE_URL`: 接続先 Redmine の URL。末尾の `/` は不要。
- `REDMINE_API_KEY`: Redmine の個人設定で取得した API キー。
- `PORT`: AIRedmine の起動ポート。

設定後に AIRedmine を再起動します。

```bash
npm run dev
```

### 接続確認

ブラウザーで `http://localhost:5173` を開きます。
接続状態パネルに「実 Redmine に接続中」と表示されれば、Redmine API を利用しています。

API で確認する場合:

```bash
curl http://localhost:5173/api/config
curl "http://localhost:5173/api/issues?status_id=open"
```

`.env` が未設定、または `REDMINE_BASE_URL` と `REDMINE_API_KEY` のどちらかが未設定の場合、AIRedmine はモックデータで起動します。
その場合は接続状態パネルにモックデータ表示中であることが表示されます。

### うまく接続できないとき

- モックデータ表示のままになる場合は、`.env` の `REDMINE_BASE_URL` と `REDMINE_API_KEY` が設定されているか確認する。
- Redmine API エラーになる場合は、Redmine の URL、API キー、REST API 有効化を確認する。
- `401` または `403` が返る場合は、API キーのユーザー権限と対象プロジェクトへのアクセス権を確認する。
- issue が空の場合は、Redmine 側に対象 issue が存在するか、担当者やステータス条件に合う issue があるか確認する。

## 参考

- Redmine REST API: https://www.redmine.org/projects/redmine/wiki/Rest_api
- Issues API: https://www.redmine.org/projects/redmine/wiki/Rest_Issues
