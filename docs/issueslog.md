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
