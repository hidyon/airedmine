# Issues Log

issue の検討ログ、判断理由、保留事項、代替案を記録する。

## 2026-06-06: アプリ目的の再定義

ユーザーから、AIRedmine は Redmine を活用したプロジェクトにおいて、AI エージェント経由で Redmine を利用する開発体験がどう変化し、どう改善されるかを明らかにするためのアプリだと共有された。

このため、アプリを単なる Redmine チケットダッシュボードとして扱わず、次の方向に再定義した。

- 開発者向け: 自分の担当 issue、次アクション、ブロッカーを AI エージェント越しに把握する体験。
- PM 向け: プロジェクトの停滞、リスク、負荷偏りを AI エージェント越しに観察する体験。
- 共通: Redmine 更新を AI が支援する場合、人間の確認境界を明らかにする体験。

## 判断

最初のロードマップでは、Redmine API 連携の完成度よりも「AI エージェントを介した Redmine 利用体験」を優先する。

理由:

- アプリの価値は Redmine の代替 UI ではなく、AI 駆動開発で Redmine がどう使われるかを体験できる点にある。
- 既存のチケット一覧は入口として有効だが、それだけでは開発体験の変化を示しにくい。
- 次に作るべきものは、issue を作業判断に変換するビューである。

## 保留事項

- 実際の AI モデル連携をいつ入れるか。
- 最初はルールベースの要約や次アクション生成で体験を作るか。
- Redmine への書き込み操作をどこまで早期に扱うか。
- 開発者向けビューと PM 向けビューのどちらを先に作るか。

## 次の候補

次に取り組む issue の第一候補は `ISS-002: 開発者向けの AI エージェント作業ビューを設計する`。

理由:

- 現在のチケット一覧実装から自然に拡張できる。
- AI エージェント経由で Redmine を使う体験の変化を最短で見せられる。
- PM 向けビューの前に、issue 単位の解釈と次アクション提示の型を作れる。

## 2026-06-06: Milestone 1 の対象 issue 検討

Milestone 1 は「Redmine 情報を体験できる入口」であるため、まず実 Redmine とモックデータのどちらを見ているのかが分かることを優先する。

候補として次を追加した。

- `ISS-007`: Redmine 接続状態と初期セットアップ導線を改善する。
- `ISS-008`: Redmine issue 取得 API を Connector として分離する。
- `ISS-009`: PM が全体状態をざっくり把握できるサマリを追加する。
- `ISS-010`: モックデータを体験説明用に拡充する。
- `ISS-011`: README にローカル Redmine 接続手順を追加する。

最初に取り組む issue は `ISS-007` とする。

理由:

- 既存実装にはチケット一覧、検索、状態フィルタ、サマリがあるため、入口体験を改善するには接続状態の明示が最も効果的である。
- `.env` 未設定でもモックデータで体験できる方針を、UI 上で明確に伝えられる。
- 実 Redmine 接続時のトラブルシュート導線があると、後続の Docker Compose / OSS Redmine 検証環境にもつながる。

## 2026-06-06: ISS-007 クローズ

Redmine 接続状態と初期セットアップ導線を改善した。

実装内容:

- `/api/config` が `mode`、接続先、未設定項目、セットアップ手順を返すようにした。
- Browser UI に接続状態パネルを追加した。
- モックデータ表示中、実 Redmine 接続中、Redmine API エラーの状態を表示できるようにした。
- issue 取得エラー時は、URL、API キー、REST API 設定を確認する案内を表示するようにした。

確認結果:

- `node --check src/server/index.js` 成功。
- `node --check src/public/app.js` 成功。
- `GET /api/config` がモックモード、未設定項目、セットアップ手順を返した。
- `GET /api/issues` がモックデータを返した。
- `GET /` が HTML を返した。

保留事項:

- 実 Redmine 接続済み環境での疎通確認は、OSS 版 Redmine 検証環境を作る `ISS-006` 以降で行う。

## 2026-06-06: ISS-010 着手

Milestone 1 の入口体験を強くするため、`.env` 未設定時のモックデータを拡充する。

方針:

- モックデータは、単なる表示確認ではなく AIRedmine の体験説明に使える内容にする。
- 開発者向けには、高優先度、仕様確認待ち、ブロッカー、クローズ候補を含める。
- PM 向けには、停滞、判断待ち、リリース前の未検証、情報品質の不足を含める。
- 状態フィルタが実 Redmine 接続時と近い感覚になるよう、`open`、`closed`、`*` をサーバー側で反映する。

## 2026-06-06: ISS-010 クローズ

`.env` 未設定時のモックデータを、AIRedmine の体験説明に使える内容へ拡充した。

実装内容:

- モック issue を 3 件から 8 件に増やした。
- 仕様確認待ち、PM 判断待ち、未回答質問、停滞リスク、仕様ズレ、クローズ候補、完了済み issue を含めた。
- `/api/issues` の `status_id=open`、`status_id=closed`、`status_id=*` をモックデータにも反映した。
- モックデータを更新日時順に並べるようにした。

確認結果:

- `node --check src/server/index.js` 成功。
- `GET /api/issues?status_id=open` は未完了 issue 6 件を返した。
- `GET /api/issues?status_id=closed` は完了 issue 2 件を返した。
- `GET /api/issues?status_id=*` は全 issue 8 件を返した。
- `GET /` は HTML を返した。

保留事項:

- 次に PM 向けサマリを作る場合、今回追加した停滞リスクや PM 判断待ちのモックデータを利用できる。

## 2026-06-06: ISS-009 着手

Milestone 1 の「PM が全体の状態をざっくり把握するための土台」を作るため、PM 向けの観測サマリを追加する。

方針:

- 既存のメトリクスは開発者にも PM にも使えるため残す。
- 追加する PM 観測パネルでは、件数だけでなく「PM が確認すべき観点」を短く提示する。
- `ISS-010` で追加したモックデータの件名、優先度、更新日時を使って、PM 判断待ち、停滞、仕様ズレ、クローズ候補を抽出する。
- まずはルールベースで実装し、後続の AI エージェント視点の作業支援につなげる。

## 2026-06-06: ISS-009 クローズ

PM が全体状態をざっくり把握できる観測パネルを追加した。

実装内容:

- チケット一覧の前に `プロジェクト観測` パネルを追加した。
- PM 判断待ち、停滞候補、高優先度、情報品質の 4 観点を表示するようにした。
- 各観点に件数、短い説明、代表 issue を最大 2 件表示するようにした。
- 検索や状態フィルタ後の issue 集合に合わせて観測内容が変わるようにした。

確認結果:

- `node --check src/public/app.js` 成功。
- `node --check src/server/index.js` 成功。
- `GET /` が PM 観測パネルを含む HTML を返した。
- `GET /app.js` が `renderPmOverview` を含む JavaScript を返した。
- `GET /api/issues?status_id=open` が PM 判断待ち、停滞リスク、仕様ズレ、クローズ候補を含むモック issue を返した。

保留事項:

- 現在の観測は件名、優先度、更新日時に基づくルールベースである。
- 後続の `ISS-003` では PM 向けビューとして、担当者負荷や優先度の偏りをより明示的に扱う。

## 2026-06-06: ISS-008 着手

Redmine issue 取得 API を Connector として分離する。

方針:

- `src/server/index.js` は HTTP ルーティング、静的ファイル配信、JSON レスポンスに集中させる。
- Redmine 接続、Redmine API エラー、モックデータ切り替えは `redmineConnector` に寄せる。
- モックデータは `mockRedmine` に分離し、今後のデモデータ拡充やテストに使いやすくする。
- Redmine API のレスポンスは UI が使う issue 形状に正規化する。

## 2026-06-06: ISS-008 クローズ

Redmine issue 取得 API を Connector として分離した。

実装内容:

- `src/server/redmineConnector.js` を追加した。
- `src/server/mockRedmine.js` を追加した。
- `src/server/index.js` から Redmine API 呼び出しとモックデータ定義を分離した。
- Redmine 接続設定、issue 取得、Redmine API エラー、モック fallback を Connector に寄せた。
- Redmine API の issue レスポンスを UI が使う形に正規化するようにした。

確認結果:

- `node --check src/server/index.js` 成功。
- `node --check src/server/redmineConnector.js` 成功。
- `node --check src/server/mockRedmine.js` 成功。
- `GET /api/config` がモックモード、未設定項目、セットアップ手順を返した。
- `GET /api/issues?status_id=open` が未完了 issue 6 件を返した。
- `GET /api/issues?status_id=closed` が完了 issue 2 件を返した。
- `GET /` が HTML を返した。

保留事項:

- 実 Redmine 接続時の疎通確認は `ISS-006` の OSS 版 Redmine 検証環境で行う。
- journal、wiki、project などの Connector 拡張は後続 issue で扱う。

## 2026-06-06: ISS-011 着手

Docker Compose で OSS 版 Redmine を同梱する前に、外部 Redmine または手元の Redmine へ接続して試せる状態を README に整理する。

方針:

- Redmine 側の REST API 有効化と API キー取得を最初に明記する。
- AIRedmine 側の `.env` 設定は `.env.example` と同じ環境変数名で説明する。
- 接続後に UI と API の両方で確認できるようにする。
- 失敗時に、モックモード、URL、API キー、権限、issue 条件を順に確認できるようにする。

## 2026-06-06: ISS-011 クローズ

README に Redmine 接続手順を追加した。

実装内容:

- Redmine 側の REST API 有効化、API キー取得手順を追加した。
- AIRedmine 側の `.env` 設定例と環境変数の意味を追加した。
- ブラウザー UI と `curl` による接続確認手順を追加した。
- 接続できない場合の確認観点を追加した。
- Docker Compose 版 Redmine 環境は後続の `ISS-006` で扱うことを明記した。

確認結果:

- README に必要な設定項目が揃っていることを確認した。
- README と `.env.example` の環境変数名が一致していることを確認した。

保留事項:

- 実 Redmine との疎通確認は、`ISS-006` でローカル Redmine 検証環境を作った後に行う。

## 2026-06-06: ロードマップと issue の対応整理

ユーザーから、ロードマップの各マイルストーンと issue の関連が分かるようにしたいと共有された。

対応:

- `docs/roadmap.md` の各マイルストーンに「関連 issue」を追加した。
- Milestone 6 に対応する issue がなかったため、`ISS-012: 体験評価と改善ループの記録方法を作る` を追加した。
- 今後はマイルストーンを更新したら、関連 issue の状態も合わせて見直す。

## 2026-06-06: ISS-006 着手

Milestone 5 の Docker Compose 検証環境を追加する。

方針:

- devcontainer ではなく、まず Docker Compose を追加する。
- AIRedmine app server、OSS 版 Redmine、PostgreSQL database の 3 service 構成にする。
- AIRedmine コンテナから Redmine へは Docker Compose の service 名 `redmine` で接続する。
- ブラウザーからは `localhost:5173` で AIRedmine、`localhost:3000` で Redmine を開けるようにする。
- Redmine API キーは `.env` から Compose の `REDMINE_API_KEY` として渡す。

## 2026-06-06: ISS-006 クローズ

Docker Compose で OSS 版 Redmine 検証環境を起動できる構成を追加した。

実装内容:

- `docker-compose.yml` を追加した。
- AIRedmine app server、Redmine、PostgreSQL の 3 service を定義した。
- Redmine の添付ファイル領域と database を named volume にした。
- README に Docker Compose 起動、Redmine REST API 有効化、API キー設定、接続確認の手順を追加した。
- Milestone 5 の関連 issue として `ISS-006` を Closed に更新した。

確認結果:

- `env REDMINE_API_KEY=placeholder docker-compose config` が成功した。
- Compose 構成に `REDMINE_BASE_URL=http://redmine:3000` と `REDMINE_API_KEY` が含まれることを確認した。
- README に必要な起動手順と接続確認手順があることを確認した。

保留事項:

- この環境では `docker compose` サブコマンドが使えなかったため、`docker-compose config` で構成解釈を確認した。
- 実際のコンテナ起動と Redmine 画面操作は、Docker 実行環境での手動確認が必要である。

## 2026-06-06: ISS-013 着手

実 Redmine 接続はできたが、初期状態では project、tracker、status、issue が存在せず、AIRedmine の実データ体験を確認しづらかった。
このため、ローカル Redmine に AIRedmine の体験説明用デモデータを投入する仕組みを追加する。

方針:

- Redmine の画面操作に依存せず、Rails runner で再現可能にする。
- Redmine の初期マスタが空でも動くよう、status、priority、tracker も seed する。
- issue は PM 判断待ち、仕様確認待ち、停滞リスク、クローズ候補、完了済みを含める。
- AIRedmine app server から実 Redmine API で取得できることを確認する。

## 2026-06-06: ISS-013 クローズ

ローカル Redmine に AIRedmine の実データ体験用デモデータを投入した。

実装内容:

- `scripts/redmine/seed-demo.rb` を追加した。
- Redmine service へ `./scripts/redmine:/demo-scripts:ro` をマウントした。
- seed スクリプトで REST API 有効化、API キー、status、priority、tracker、project、issue を作成するようにした。
- README にサンプルデータ投入手順を追加した。

確認結果:

- seed スクリプトの実行に成功した。
- `GET /api/config` が `mode: redmine` を返した。
- `GET /api/issues?status_id=open` が実 Redmine の未完了サンプル issue 6 件を返した。
- `GET /api/issues?status_id=*` が実 Redmine のサンプル issue 7 件を返した。

保留事項:

- seed 実行時に Redmine のメールジョブログが出るため、必要なら後続で通知設定を抑制する。

## 2026-06-06: ISS-014 着手

ユーザーから、AIRedmine app 自体も Docker で動かすようにしたいと共有された。
これまでは Compose の app service が `node:20-bookworm` にリポジトリをマウントして `npm run dev` していたため、アプリイメージとしての境界が曖昧だった。

方針:

- AIRedmine app 用の `Dockerfile` を追加する。
- Compose の app service は `build` で AIRedmine app image を作って起動する。
- `.dockerignore` で `.env`、`.git`、docs、scripts など実行に不要なものを build context から除外する。
- Redmine 接続用の環境変数は従来通り Compose から渡す。

## 2026-06-06: ISS-014 クローズ

AIRedmine app を Docker イメージとして build し、Docker Compose で起動する構成へ変更した。

実装内容:

- `Dockerfile` を追加した。
- `.dockerignore` を追加した。
- Compose の app service を `build` 指定と `airedmine-app:local` image 指定に変更した。
- README に app image の build 手順を追加した。

確認結果:

- `docker-compose build app` が成功した。
- `docker-compose up -d app` が成功した。
- `docker-compose images` で app が `airedmine-app:local` を使っていることを確認した。
- `GET /api/config` が `mode: redmine` を返した。
- `GET /api/issues?status_id=open` が実 Redmine の未完了サンプル issue 6 件を返した。

保留事項:

- 開発中にホットリロードやソースマウントが必要になった場合は、後続で development 用 override Compose を検討する。

## 2026-06-06: ISS-015 着手

ここまでの進め方を振り返り、運用として良かった点と改善点を整理した。

良かった点:

- issue 単位で仕様、実装、確認、クローズ判定まで回せた。
- Docker Compose、実 Redmine 接続、デモデータ投入、AIRedmine app の Docker 化まで、手順を README と docs に残しながら進められた。
- ロードマップに関連 issue を載せたことで、マイルストーンとの対応が追いやすくなった。

改善点:

- 今後もロードマップの各マイルストーンと issue の対応を維持する必要がある。
- Docker や Redmine のような外部サービス接続で得た手順は、その場限りにせず再現可能な形で残す必要がある。
- `docs/issues.md` は Status と見出しがずれやすいため、定期的な整理ルールが必要である。

## 2026-06-06: ISS-015 クローズ

振り返りで得た共同開発ルールを `agent.md` に反映した。

実装内容:

- マイルストーンには対応 issue と状態を記載するルールを追加した。
- Docker や外部サービス接続で得た手順を README または docs に残すルールを追加した。
- issue 一覧は Status と見出しが矛盾しないよう定期的に整理するルールを追加した。

確認結果:

- `agent.md` に上記 3 点が記載されていることを確認した。
- `docs/issues.md` にISS-015のクローズ判定を記録した。

## 2026-06-06: Milestone 2 着手

Milestone 1 は、Docker Compose、実 Redmine 接続、デモデータ投入、AIRedmine app の Docker 化まで完了したため Completed とする。

Milestone 2 では、Redmine issue を「読む」だけでなく、AI エージェント視点で作業判断に変換する体験を作る。
ユーザーからまとめて進めてよいと共有されたため、`ISS-002` を軸に次の補助 issue も同時に扱う。

- `ISS-016`: issue ごとの AI 要約カードを追加する。
- `ISS-017`: 次アクション判定ルールを実装する。
- `ISS-018`: AI判断と人間確認の境界をUIで分ける。

方針:

- 実 AI モデル連携はまだ入れず、Redmine issue の subject、status、priority、updated_on に基づくルールベースで体験を作る。
- 最初の成果物は `今日の作業候補` パネルにする。
- 各 issue カードにも AI 要約、次アクション、人間が確認すべき点を表示する。
- AI の根拠と人間の確認責任をUI上で分ける。

## 2026-06-06: ISS-002 / ISS-016 / ISS-017 / ISS-018 クローズ

開発者向けの AI エージェント作業ビューの初版を追加した。

実装内容:

- `今日の作業候補` パネルを追加した。
- Redmine issue を分析する `analyzeIssue` を追加した。
- PM判断待ち、仕様確認、停滞リスク、クローズ候補、高優先度を判定するルールを追加した。
- 最優先候補に AI の根拠、次アクション、人間が確認すべき点を表示した。
- 各 issue カードに AI 要約、次アクション、人間確認を追加した。

確認結果:

- 実 Redmine のサンプル issue で作業候補が表示されることを確認した。
- `GET /api/issues?status_id=open` が未完了サンプル issue 6 件を返した。
- `node --check src/public/app.js` が成功した。
- Docker image を rebuild し、app service が起動することを確認した。

保留事項:

- 現在の AI 表示はルールベースである。
- 後続で自然言語対話や知識ベース連携を入れると、要約と根拠の精度を高められる。

## 2026-06-06: ISS-003 クローズ

PM 向けのプロジェクト観察ビューを、朝会やリリース判断前に使う確認キューとして拡張した。

実装内容:

- PM overview に `PMが今日確認すること` を追加した。
- `analyzeIssue` の結果を利用し、PM判断待ち、停滞リスク、仕様確認、高優先度 issue を PM 確認キューに並べた。
- 担当者負荷と優先度の偏りを棒グラフで表示した。
- 5日以上未更新の issue を、担当者と未更新日数つきで表示した。
- PM 観測ビューから Redmine の元 issue に移動できるようにした。

確認結果:

- 実 Redmine のサンプル issue で PM 判断待ち、仕様確認待ち、停滞リスクが PM 確認キューに表示されることを確認した。
- 担当者負荷、優先度の偏り、未更新 issue が表示されることを確認した。
- `node --check src/public/app.js` が成功した。

クローズ判定:

- PM が AI エージェント経由で詰まりやリスクを確認できる状態になったため、`ISS-003` を Closed とする。
- Milestone 2 の関連 issue がすべて Closed になったため、Milestone 2 を Completed とする。

## 2026-06-06: ISS-005 クローズ

自然言語対話の入口として、Browser UI 内に軽量な Chat UI と `POST /api/chat` を追加した。

方針:

- この段階では外部 LLM 連携は入れず、Redmine issue と docs の参照体験を優先する。
- 対話は探索、要約、次アクション相談に使う。
- 更新系の依頼は直接実行せず、確認待ちの更新案として返す。

実装内容:

- `AIRedmine に聞く` セクションを追加した。
- 質問例として、今日の作業、リスク、定例、更新案を用意した。
- `POST /api/chat` で Redmine の未完了 issue と `README.md`, `docs/roadmap.md`, `docs/issues.md`, `docs/issueslog.md` を参照するようにした。
- 回答には根拠となる issue または docs を含めるようにした。
- 更新系の質問では `confirmation_required` の更新案を返すようにした。
- Docker image に `README.md` と `docs/` を含め、コンテナ上の Chat API が知識ベースを読めるようにした。

確認結果:

- 「今日まず何からやればいい？」に対して、実 Redmine の issue を根拠に回答することを確認した。
- 「自然言語対話の方針を教えて」に対して、README と docs を根拠に回答することを確認した。
- 「Redmineコメント案を書いて」のような更新系の質問で、直接更新せず確認待ちの更新案を返すことを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 開発者や PM が自然言語で Redmine と知識ベースについて質問でき、更新系依頼が確認待ちとして扱われるため、`ISS-005` を Closed とする。
- Milestone 3 の関連 issue が Closed になったため、Milestone 3 を Completed とする。

## 2026-06-06: ISS-019 クローズ

Chat UI で「回答を取得できませんでした」と表示される報告を受け、原因切り分けとキャッシュ対策を追加した。

確認したこと:

- `POST /api/chat` を直接実行すると 200 で回答が返る。
- app コンテナは起動しており、サーバーログにも起動エラーはない。
- `/app.js` は最新の Chat UI 実装を返している。

実装内容:

- Chat UI のエラー処理を、通信失敗と回答描画失敗に分けた。
- 通信失敗時に HTTP ステータスやエラーメッセージを表示するようにした。
- 静的ファイルに `Cache-Control: no-store` を付けた。
- `index.html` の CSS / JS 参照にバージョンを付け、古いファイルを掴みにくくした。

確認結果:

- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。
- `docker-compose build app` と `docker-compose up -d app` が成功した。
- `/app.js` が `Cache-Control: no-store` を返した。
- `POST /api/chat` が「今日まず何からやればいい？」に対して 200 と回答を返した。

クローズ判定:

- Chat UI の失敗原因を画面上で切り分けられ、キャッシュ起因の再発も抑えられるため、`ISS-019` を Closed とする。

## 2026-06-06: Milestone 3 追加 issue 提案

Milestone 3 は自然言語対話の入口として Completed になったが、体験を深めるための追加改善候補を整理した。

追加した issue:

- `ISS-020`: Chat 回答の根拠リンクを詳しく表示する。
- `ISS-021`: issue 番号指定の質問に対応する。
- `ISS-022`: Chat の質問履歴を表示する。
- `ISS-023`: docs 知識ベース検索の精度を改善する。
- `ISS-024`: Chat 回答から Redmine 更新案の詳細下書きを作る。

判断理由:

- `ISS-020` と `ISS-023` は、AI の回答を信頼するための根拠確認を強化する。
- `ISS-021` は、開発者が個別 issue について自然に相談できる入口になる。
- `ISS-022` は、PM や開発者が探索の流れを追えるようにする。
- `ISS-024` は、Milestone 4 の Redmine 更新前確認フローに直結する。

優先案:

- 次に実装するなら、`ISS-021` か `ISS-024` がよい。
- `ISS-021` は Chat の実用性をすぐ上げる。
- `ISS-024` は Milestone 4 へ進む橋渡しになる。

## 2026-06-06: ISS-021 クローズ

Chat API が issue 番号指定の質問を扱えるようにした。

実装内容:

- `POST /api/chat` で Redmine issue を全状態から取得するようにした。
- 質問文から `#1`, `issue 1`, `チケット1` などの issue 番号を抽出するようにした。
- 該当 issue がある場合、その issue を優先して回答と根拠に使うようにした。
- 背景、次アクション、クローズ可否の質問に応じて回答を変えるようにした。
- 該当 issue が見つからない場合は、その旨を明示するようにした。
- UI の質問例に `#1 の次アクションは？` を追加した。

確認結果:

- `#1 の背景を教えて` に対して #1 を根拠に回答することを確認した。
- `#1 の次アクションは？` に対して #1 の次アクションを返すことを確認した。
- `#999 の背景を教えて` に対して該当 issue なしを返すことを確認した。
- `#1 をクローズしていい？` に対して直接更新せず確認待ちの更新案を返すことを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 開発者が個別 issue について自然言語で相談できる状態になったため、`ISS-021` を Closed とする。

## 2026-06-06: ISS-024 クローズ

Chat の更新系依頼から、確認待ちの Redmine 更新案下書きを作れるようにした。

実装内容:

- 更新系依頼を `comment`, `status_change`, `close_candidate` に分類するようにした。
- 更新案に対象 issue、変更内容、下書き本文、理由、確認事項、次ステップを含めた。
- Chat UI で更新案の詳細を表示できるようにした。
- 更新案は `confirmation_required` のままとし、Redmine API への更新は行わない。

確認結果:

- `この実装が終わったのでRedmineコメント案を書いて` でコメント案が返ることを確認した。
- `#1 をクローズしていい？` でクローズ確認案と確認事項が返ることを確認した。
- `#1 のステータス変更案を作って` でステータス変更案が返ることを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 自然言語対話から Redmine 更新前確認フローへ渡せる下書きを作れるようになったため、`ISS-024` を Closed とする。

## 2026-06-06: ISS-020 クローズ

Chat 回答の根拠カードを詳しくし、回答の理由を追いやすくした。

実装内容:

- issue 根拠にプロジェクト、担当者、状態、優先度、更新日、回答理由を含めた。
- docs 根拠に種類ラベル、ファイル名、抜粋を表示するようにした。
- UI では `Redmine issue` と `Knowledge doc` のラベルを分けて表示した。

確認結果:

- `今日まず何からやればいい？` の回答で issue 根拠の詳細が返ることを確認した。
- `自然言語対話の方針を教えて` の回答で docs 根拠の詳細が返ることを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- Chat 回答の根拠を issue と docs で区別して追えるようになったため、`ISS-020` を Closed とする。

## 2026-06-06: ISS-022 クローズ

Chat UI にセッション中の質問履歴を追加した。

実装内容:

- 回答成功時に質問、回答要約、根拠件数、更新案有無を履歴へ追加するようにした。
- 履歴は最大 8 件を保持するようにした。
- 履歴をクリックすると過去回答を再表示できるようにした。
- ページ再読み込み時は履歴を保持しない方針とした。

確認結果:

- 複数回質問したときに履歴が追加されることを確認した。
- 履歴項目に根拠件数と更新案有無が表示されることを確認した。
- `node --check src/public/app.js` が成功した。

クローズ判定:

- PM や開発者が探索の流れを追えるようになったため、`ISS-022` を Closed とする。

## 2026-06-06: ISS-023 クローズ

docs 知識ベース検索を、ファイル単位の単純一致から見出し単位の検索へ改善した。

実装内容:

- docs を Markdown 見出しごとに分割するようにした。
- 質問語が見出しに一致した場合は、本文一致より高く評価するようにした。
- docs 根拠にファイル名、見出し、抜粋、score を含めるようにした。
- Chat UI では docs 根拠カードに見出しを表示するようにした。

確認結果:

- 「ロードマップ」「自然言語対話」「更新確認」で関連 docs が返ることを確認した。
- Docker image 上でも docs 検索が動くことを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- docs の方針や仕様をより適切な根拠として返せるようになったため、`ISS-023` を Closed とする。
- Milestone 3 の追加改善 issue はすべて Closed になった。

## 2026-06-06: Milestone 4 着手 / ISS-025 クローズ

Milestone 4 では、Chat が作成した Redmine 更新案を人間が確認してから反映する体験を検証する。
まずは更新実行ではなく、確認画面の土台を作る。

追加した issue:

- `ISS-025`: Redmine 更新案の確認画面を追加する。
- `ISS-026`: Redmine コメント追加の確認フローを実装する。
- `ISS-027`: 更新前後の差分表示を追加する。
- `ISS-028`: 更新実行ログを記録する。
- `ISS-029`: 更新失敗時のエラー表示と再試行導線を作る。
- `ISS-030`: ステータス変更・クローズ操作の確認フローを検討する。

`ISS-025` 実装内容:

- Chat UI の下に `Redmine 更新案レビュー` パネルを追加した。
- Chat が `confirmation_required` の更新案を返したとき、レビューへ同期するようにした。
- 履歴から更新案つき回答を再表示したときも、レビュー対象に戻せるようにした。
- 更新案を破棄できるようにした。
- この段階では Redmine API への更新は行わない。

確認結果:

- `この実装が終わったのでRedmineコメント案を書いて` で更新案レビューが表示されることを確認した。
- `node --check src/public/app.js` が成功した。
- Docker image を rebuild し、app service が起動することを確認した。

クローズ判定:

- Chat から Redmine 更新案レビューへ移る確認画面の土台ができたため、`ISS-025` を Closed とする。

## 2026-06-06: ISS-026 クローズ

Redmine 更新案レビューから、コメント追加だけを確認後に実行できるようにした。

実装内容:

- Redmine Connector に issue コメント追加を追加した。
- `POST /api/proposals/comment` を追加した。
- `comment` 更新案にだけ `確認してコメント追加` ボタンを表示するようにした。
- 実行中、成功、失敗の表示をレビュー画面に追加した。
- `status_change` と `close_candidate` はまだ実行できない操作として表示する。

確認結果:

- 実 Redmine に対してコメント追加 API が成功することを確認した。
- モックモードでは成功相当の結果を返す設計にした。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。
- Docker image を rebuild し、app service が起動することを確認した。

クローズ判定:

- コメント追加に限り、確認後に Redmine へ反映する最初の安全な更新フローを試せるようになったため、`ISS-026` を Closed とする。

## 2026-06-06: Milestone 4 残り issue クローズ

Redmine 更新案レビューを、差分確認、実行ログ、失敗時の再試行、高リスク操作の安全条件まで含む確認フローへ拡張した。

対象 issue:

- `ISS-004`: Redmine 更新前の確認フローを検討する。
- `ISS-027`: 更新前後の差分表示を追加する。
- `ISS-028`: 更新実行ログを記録する。
- `ISS-029`: 更新失敗時のエラー表示と再試行導線を作る。
- `ISS-030`: ステータス変更・クローズ操作の確認フローを検討する。

実装内容:

- 更新案レビューに `更新前後の差分` を追加した。
- コメント追加、ステータス変更、クローズ候補で差分表示を分けた。
- アプリサーバーのメモリ上に更新実行ログを保存し、`GET /api/proposals/logs` で取得できるようにした。
- レビュー画面に実行ログと再読み込みボタンを追加した。
- Redmine 更新失敗を `auth`, `not_found`, `validation`, `rate_limit`, `server`, `connection`, `unknown` に分類するようにした。
- 失敗結果に分類、再試行可否、再試行ボタンを表示するようにした。
- ステータス変更とクローズは実行せず、安全条件を確認する対象として整理した。

確認結果:

- `node --check src/server/index.js` が成功した。
- `node --check src/server/redmineConnector.js` が成功した。
- `node --check src/public/app.js` が成功した。
- Docker image を rebuild し、app service が起動することを確認した。
- 実 Redmine issue へのコメント追加が成功し、成功ログが追加されることを確認した。
- 存在しない issue へのコメント追加が `not_found` として失敗し、失敗ログが追加されることを確認した。
- クローズ候補の Chat 更新案を作成でき、安全条件を表示できることを確認した。
- ブラウザー配信用の HTML, JS, CSS に最新キャッシュキーと追加表示が含まれることを確認した。

クローズ判定:

- Redmine 更新前に差分、意図、確認事項、実行結果を人間が確認できる。
- 更新失敗時の分類と再試行導線がある。
- コメント追加は実行可能、高リスク操作は安全条件確認までに留める方針が整理できた。
- 以上により `ISS-004`, `ISS-027`, `ISS-028`, `ISS-029`, `ISS-030` を Closed とし、Milestone 4 を Completed とする。

## 2026-06-07: Milestone 5 追加 issue 提案

Milestone 5 は `ISS-006` で Docker Compose の基本構成はできている。
次は、新しい開発者や PM が迷わず試せること、壊れたときに復旧できること、開発環境として継続的に使えることを強化する。

追加した issue:

- `ISS-031`: Docker Compose 起動ヘルスチェックを追加する。
- `ISS-032`: 初回セットアップ確認スクリプトを追加する。
- `ISS-033`: Redmine デモデータ投入をワンコマンド化する。
- `ISS-034`: Docker Compose 開発用 override を追加する。
- `ISS-035`: Redmine 接続トラブルシュート画面を強化する。
- `ISS-036`: devcontainer 対応を追加する。

優先順:

- まず `ISS-031` で起動確認を固める。
- 次に `ISS-032` で初回セットアップの不足を機械的に見つけられるようにする。
- その後 `ISS-033` で体験確認用データを再現しやすくする。

判断理由:

- Milestone 5 の価値は、単に Docker Compose ファイルがあることではなく、誰が試しても同じ体験にたどり着けることにある。
- Redmine は初期設定や REST API 有効化で詰まりやすいため、確認と復旧の導線を issue として独立させる。

## 2026-06-07: ISS-031 クローズ

Docker Compose 起動後に、AIRedmine、Redmine、PostgreSQL、app 経由 API の状態をまとめて確認するヘルスチェックを追加した。

実装内容:

- `scripts/healthcheck.mjs` を追加した。
- `package.json` に `npm run healthcheck` を追加した。
- `docker-compose ps --services --filter status=running` で `app`, `redmine`, `redmine-db` の起動状態を確認する。
- `http://localhost:5173` と `http://localhost:3000` の HTTP 応答を確認する。
- `/api/config` と `/api/issues?status_id=open` で AIRedmine app 経由の API 疎通を確認する。
- README に実行方法、期待結果、URL 上書き用の環境変数を追加した。

確認結果:

- `node --check scripts/healthcheck.mjs` が成功した。
- `npm run healthcheck` が成功し、全項目 `OK` になることを確認した。
- サンドボックス内の通常実行では Docker daemon と localhost HTTP に接続できないため、実環境確認として権限付きで実行した。

クローズ判定:

- Docker Compose 検証環境が起動できているかを、新しい開発者や PM がワンコマンドで確認できるため `ISS-031` を Closed とする。
