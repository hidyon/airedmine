# Issues Log

issue の検討ログ、判断理由、保留事項、代替案を記録する。

## 2026-06-21: Milestone 31 ユーザー体験改善候補の検討

M30 でデモ体験の自動確認が整ったため、次は「使い始める」「判断する」「更新後に次へ進む」場面の摩擦を下げるマイルストーンを設定する。
候補は、初見ユーザー、日常利用する開発者、PM の定例準備、更新 proposal の承認後体験に分けて比較した。

### 評価軸

| 軸 | 意味 |
| --- | --- |
| ユーザー価値 | 開発者 / PM が迷わず次の行動に進める度合い |
| 実装リスク | 既存 API / Chat / Dashboard / Audit への影響 |
| 検証容易性 | smoke test、手動確認、既存テストで確認しやすいか |
| M31 適合度 | 日常利用の迷いを減らす目的に直接つながるか |

### 候補比較

| issue | 候補 | ユーザー価値 | 実装リスク | 検証容易性 | M31 適合度 | 推奨 |
| --- | --- | --- | --- | --- | --- | --- |
| ISS-133 | Chat の開始体験と質問候補を改善する | High | Low | High | High | 最初に着手 |
| ISS-134 | Proposal 実行後の次アクション表示を改善する | High | Medium | Medium | High | 次に着手 |
| ISS-135 | issue 詳細パネルから関連する Chat / Dashboard 操作へ移りやすくする | Medium | Medium | Medium | Medium | ISS-133/134 後 |
| ISS-136 | PM Dashboard の停滞・期限切れ issue から定例アジェンダを作りやすくする | Medium | Medium | Medium | Medium | PM 体験強化時 |
| ISS-137 | Chat session の検索・絞り込み候補を検討する | Medium | Low | High | Low | 後続検討 |

### 判断

最初に取り組む候補は `ISS-133` とする。
理由は、初見ユーザーが Chat を開いた瞬間の迷いを減らせるうえ、既存 API への影響が小さく、M30 の smoke test にも確認観点を追加しやすいため。

次点は `ISS-134` とする。
AIRedmine の中心価値は「AI が更新案を作り、人間が確認して反映する」流れにあるため、proposal 実行後に Audit や issue 詳細へ進める体験を改善すると、安心感と作業継続性が上がる。

`ISS-135` と `ISS-136` は、Chat / Dashboard 間の文脈移動を強める改善として価値がある。
ただし導線設計の影響範囲がやや広いため、ISS-133/134 で入口と更新後体験を整えてから取り組む。

`ISS-137` は session が増えた後に効く改善で、現時点では実装より方針整理を優先する。

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

## 2026-06-07: Milestone 5 残り issue クローズ

Compose v2 移行準備を `ISS-037` として追加し、Milestone 5 の残り issue をまとめて対応した。

対象 issue:

- `ISS-032`: 初回セットアップ確認スクリプトを追加する。
- `ISS-033`: Redmine デモデータ投入をワンコマンド化する。
- `ISS-034`: Docker Compose 開発用 override を追加する。
- `ISS-035`: Redmine 接続トラブルシュート画面を強化する。
- `ISS-036`: devcontainer 対応を追加する。
- `ISS-037`: Docker Compose v2 への移行準備を行う。

実装内容:

- `scripts/compose-utils.mjs` を追加し、`docker compose` 優先、`docker-compose` fallback の共通処理を作った。
- `scripts/compose-run.mjs` を追加し、任意の Compose コマンドを fallback 付きで実行できるようにした。
- `scripts/doctor.mjs` と `npm run doctor` を追加した。
- `scripts/seed-demo.mjs` と `npm run seed:demo` を追加した。
- seed 出力の `api_key` を `***` にマスクするようにした。
- `docker-compose.dev.yml` を追加し、開発時はソースマウントと `npm run dev` で起動できるようにした。
- `.devcontainer/devcontainer.json` を追加した。
- `/api/config` に `diagnostics` を追加した。
- Redmine issue 取得失敗時に分類と次アクションを返すようにした。
- UI の接続エラー表示で分類、HTTP status、次アクションを表示するようにした。
- README に doctor、seed、開発用 Compose、devcontainer、Compose v2 移行準備を追記した。

確認結果:

- `node --check` で追加 scripts と変更した server / public JS の構文を確認した。
- devcontainer 設定が妥当な JSON であることを確認した。
- `docker-compose -f docker-compose.yml -f docker-compose.dev.yml config` が成功した。
- `npm run doctor` が成功し、Compose v1 環境では v2 推奨の warning が出ることを確認した。
- `npm run seed:demo` が成功し、API キーがマスク表示されることを確認した。
- Docker image を rebuild し、app service を再起動した。
- `npm run healthcheck` が成功した。
- `/api/config` が接続診断情報を返すことを確認した。
- 配信 HTML / JS に最新 cache key と接続診断表示が含まれることを確認した。

クローズ判定:

- 初回設定、起動確認、デモデータ投入、開発起動、devcontainer、Compose v2 移行準備が一通り揃った。
- 新しい開発者や PM がローカルで AIRedmine と Redmine を試す導線が整ったため、`ISS-032` から `ISS-037` を Closed とし、Milestone 5 を Completed とする。

## 2026-06-07: ISS-012 クローズ

Milestone 6 の体験評価と改善ループとして、AIRedmine を使ったあとに観察メモを残す UI / API を追加した。

実装内容:

- Browser UI に `体験メモ` パネルを追加した。
- 役割、場面、体験変化、観察メモ、改善候補を入力できるようにした。
- 記録数、判断しやすさ、負担軽減、摩擦の件数を集計表示するようにした。
- 改善候補を最新 5 件まで見返せるようにした。
- `GET /api/experience/notes` と `POST /api/experience/notes` を追加した。
- 体験メモは検証用プロトタイプとしてアプリサーバーのメモリ上に保持する。

確認結果:

- `node --check src/server/index.js` が成功した。
- `node --check src/public/app.js` が成功した。
- `GET /api/experience/notes` が観察観点と空の集計を返すことを確認した。
- `POST /api/experience/notes` が体験メモを保存し、改善候補を含む集計を返すことを確認した。
- 配信 HTML に `体験メモ` パネルと最新キャッシュキーが含まれることを確認した。

クローズ判定:

- 体験メモ、観察観点、改善候補を AIRedmine の画面から記録できる。
- 記録した改善候補を後続 issue 化の材料として見返せる。
- 以上により `ISS-012` を Closed とし、Milestone 6 を Completed とする。

## 2026-06-07: Milestone 6 再オープンと候補 issue 提案

`ISS-012` で体験メモの入口はできたが、体験評価と改善ループ全体としてはまだ未完了と判断した。
特に、記録の永続化、改善 issue 化、評価テンプレート、役割別サマリが残っている。

判断:

- Milestone 6 の状態を `Completed` から `Open` に戻す。
- `ISS-012` は体験メモの入口として `Closed` のまま残す。
- Milestone 6 の候補 issue として `ISS-038` から `ISS-041` を追加する。

候補 issue:

- `ISS-038`: 体験メモを永続化する。
- `ISS-039`: 体験メモから改善 issue 下書きを作る。
- `ISS-040`: 体験評価テンプレートを整備する。
- `ISS-041`: 体験評価サマリを役割別に可視化する。

優先順:

- まず `ISS-038` で記録が消えないようにする。
- 次に `ISS-039` で改善候補を issue 化しやすくする。
- その後 `ISS-040` と `ISS-041` で観察品質と振り返りの見やすさを上げる。

## 2026-06-07: Milestone 7 追加

機能追加が進み、Browser UI、Chat、Proposal review、PM overview、Work guide、Redmine Connector、docs 検索、体験評価が同じプロトタイプ内に増えてきた。
次に実装する前に、改善候補とアーキテクチャ上の責務を整理するマイルストーンを追加する。

追加したマイルストーン:

- Milestone 7: 機能改善の洗い出しとアーキテクチャの検討

追加した issue:

- `ISS-042`: 既存機能の改善候補を棚卸しする。
- `ISS-043`: 現在のアーキテクチャを記録する。
- `ISS-044`: 次に分離すべき責務を検討する。
- `ISS-045`: 改善候補の優先順位付け方法を決める。

優先順:

- まず `ISS-042` で機能ごとの改善候補を洗い出す。
- 次に `ISS-043` で現在の構成と責務を記録する。
- その後 `ISS-044` で分離すべき責務を検討する。
- 最後に `ISS-045` で改善候補を選ぶ基準を固める。

判断理由:

- 既存機能の増加に対して、場当たり的に改修を続けると体験検証の意図が薄くなる。
- アーキテクチャを先に巨大化させるのではなく、現状の痛みと次の改善候補を見て必要な分離を決める。
- Milestone 6 の体験評価ループともつながり、記録された体験メモを改善候補の根拠にできる。

## 2026-06-07: Milestone 6 と 7 の入れ替え

実施順を見直し、機能改善の洗い出しとアーキテクチャ検討を先に行うことにした。
体験評価ループは重要だが、既存機能と責務を整理してから進めるほうが、改善候補の質が上がると判断した。

変更内容:

- `Milestone 6`: 機能改善の洗い出しとアーキテクチャの検討。
- `Milestone 7`: 体験評価と改善ループ。
- `ISS-042` から `ISS-045` は Milestone 6 の候補 issue とする。
- `ISS-012` と `ISS-038` から `ISS-041` は Milestone 7 の候補 issue とする。

判断理由:

- 既存機能の改善候補を先に棚卸しすると、体験メモから出る改善候補も分類しやすくなる。
- アーキテクチャ上の責務を整理してから永続化や役割別サマリを進めるほうが、後戻りが少ない。
- Milestone 7 は、Milestone 6 で整理した改善候補と責務を使って、より継続的な評価ループにできる。

## 2026-06-07: ISS-042 開始

Milestone 6 の最初の作業として、既存機能の改善候補を棚卸しする。
実装を増やす前に、現在の UI、Chat、更新案レビュー、PM overview、Work guide、Redmine Connector、開発環境、体験評価の痛みを整理する。

仕様:

- 対象機能ごとに、現状、課題、改善案、影響範囲、検証方法を記録する。
- 改善候補は後続 issue に変換しやすい粒度で書く。
- 成果物は `docs/improvement-inventory.md` とする。

判断理由:

- Milestone 6 はアーキテクチャ検討の前に、まず既存機能の痛みを集める必要がある。
- 先に棚卸しを行うことで、`ISS-043` 以降のアーキテクチャ記録や責務分離の判断材料になる。

## 2026-06-07: ISS-042 クローズ

既存機能ごとの改善候補を `docs/improvement-inventory.md` に整理した。

実装内容:

- Browser UI、Chat、Proposal review、PM overview、Work guide、Redmine Connector、開発環境、体験評価に分けて棚卸しした。
- 各機能について、現状、課題、改善案、影響範囲、検証方法、後続 issue 候補を記録した。
- 優先して扱う改善候補を 5 件に絞った。

確認結果:

- `rg` で `docs/improvement-inventory.md` に各機能の必須見出しが存在することを確認した。
- `docs/roadmap.md` の Milestone 6 に `ISS-042` が関連 issue として記載されていることを確認した。

クローズ判定:

- 機能追加、使いにくさ、説明不足、保守しにくさ、検証しにくさを含めて改善候補を棚卸しできた。
- 後続 issue に変換しやすい形式で記録できたため `ISS-042` を Closed とする。

## 2026-06-07: ISS-042 棚卸し観点の追補

改善候補の棚卸しに、次の観点を追加した。

- 対話型のインターフェイス
- ダッシュボードの充実
- 意味検索の高度化

反映内容:

- `docs/improvement-inventory.md` に専用セクションを追加した。
- 優先して扱う改善候補に、ダッシュボードビュー分割、確認質問ステップ、docs 検索のスコア理由を追加した。
- `ISS-042` のテスト結果に、追加観点を反映した。

## 2026-06-07: 対話型インターフェイスの Agent Backend 方針

対話型インターフェイスは、将来的に Codex のような AI エージェントがバックエンドで稼働する構成を前提に検討する。
ただし Redmine 更新を自律実行するのではなく、調査、整理、提案を行い、人間の確認を通して反映する確認型エージェントとして扱う。

方針:

- App Server 内に Agent Orchestrator を置く構成を検討する。
- Agent は Redmine Connector、Knowledge Connector、Proposal Builder、Experience Notes などの tool を使う。
- Agent の出力は自由文だけでなく、根拠、次アクション、更新案、人間承認要否を含む構造化レスポンスにする。
- Redmine 更新は Proposal review と Audit log を経由し、Agent が直接反映しない。
- Agent session と audit trail を記録し、どの根拠と tool から提案が生まれたかを追えるようにする。

反映:

- `docs/improvement-inventory.md` の `対話型インターフェイス` に Agent Orchestrator、tool 境界、human approval、audit trail の観点を追加した。
- 詳細な責務整理は `ISS-043` のアーキテクチャ記録で扱う。

## 2026-06-07: ISS-043 クローズ

現在の AIRedmine のアーキテクチャを `docs/architecture.md` に記録した。

実装内容:

- Human Interface Layer、App Server / Agent API、Redmine Connector、Knowledge Connector prototype、Agent Layer prototype、Proposal & Audit Layer prototype、Experience Loop prototype の責務を整理した。
- `/api/config`、`/api/issues`、`/api/chat`、`/api/proposals/*`、`/api/experience/notes` の用途を記録した。
- issue 一覧表示、Chat 回答、コメント追加 Proposal、体験メモのデータの流れを記録した。
- 実装済み、仮実装、未実装の境界を整理した。
- Agent Orchestrator、tool registry、Agent session / audit trail を未実装の将来層として明記した。

確認結果:

- `rg --files src scripts .devcontainer` で実ファイル構成を確認した。
- `rg` で主要 API と Connector の実装箇所を確認した。
- README のアーキテクチャ方針と `docs/architecture.md` のレイヤー構成が矛盾していないことを確認した。

クローズ判定:

- 現在の構成と責務、主要 API、データの流れ、実装済みと未実装の境界を後から見返せる形で記録できた。
- `ISS-044` の責務分離検討に進む材料が揃ったため `ISS-043` を Closed とする。

## 2026-06-07: ISS-044 クローズ

次に分離すべき責務を `docs/responsibility-separation.md` に整理した。

実装内容:

- Chat / Agent Orchestrator、Knowledge Connector、Browser UI Views、Proposal & Audit、Experience Notes、Redmine Connector、Error Handling を分離候補として整理した。
- 各候補に、現在の場所、分離する理由、推奨タイミング、先送り条件、分離後の候補、既存 / 新規 issue とのつながりを記録した。
- 今すぐ分離したいもの、関連機能を触るタイミングで分離したいもの、今は分離しないものに分類した。

判断:

- 今すぐ分離したいものは、Chat / Agent Orchestrator、Knowledge Connector、Browser UI Views とする。
- Proposal & Audit、Experience Notes、Redmine Connector は関連機能を触るタイミングで分離する。
- Error Handling は対象 API が増えるまで分離しない。

確認結果:

- `wc -l` で `src/server/index.js` と `src/public/app.js` が大きくなっていることを確認した。
- `docs/architecture.md` と `docs/improvement-inventory.md` を参照し、分離候補が既存課題と対応していることを確認した。
- `rg` で各候補に `推奨タイミング` と `先送り条件` が存在することを確認した。

クローズ判定:

- 何をいつ分離すべきか、どこまで先送りできるかを判断できる材料が揃ったため `ISS-044` を Closed とする。

## 2026-06-07: ISS-045 着手 — 改善候補の優先順位付け方法を決める

`docs/improvement-inventory.md` に 7 件の改善候補が揃った。
次の Milestone 7 でどれから着手するかを、思いつきではなく一貫した基準で選べるようにする。

### 評価軸の定義

各改善候補を以下 5 軸で評価する。

| 軸 | 意味 | 高い (H) | 中 (M) | 低い (L) |
| --- | --- | --- | --- | --- |
| ユーザー価値 | 開発者・PM の判断・探索・確認・承認がどれだけ楽になるか | 体験が大きく変わる | 部分的に改善 | 内部改善のみ |
| 技術リスク | 既存機能への影響範囲、失敗時の影響 | 広範囲に影響の可能性 | 一部機能に影響の可能性 | 追加変更のみで影響小 |
| 実装コスト | 変更規模・複数ファイルへの影響・新規設計の必要性 | 大規模な設計変更が必要 | 複数ファイルの修正が必要 | 小規模な追加・修正で済む |
| 検証容易性 | モックデータ・API 確認・ブラウザー確認で完了確認できるか | ブラウザー or API で即確認 | 複数手順が必要 | 環境や条件が限られる |
| ロードマップ適合度 | 次のマイルストーン目標と直接つながるか | M7 の核心になる | M7 の補助になる | M8 以降が適切 |

優先しやすい候補の特徴: ユーザー価値 H、技術リスク L-M、実装コスト L-M、検証容易性 H、ロードマップ適合度 H。

### 改善候補の比較

`docs/improvement-inventory.md` の「優先して扱う改善候補」7 件を評価軸で比較する。

| # | 改善候補 | ユーザー価値 | 技術リスク | 実装コスト | 検証容易性 | ロードマップ適合度 | 推奨時期 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | ダッシュボードビューを分ける | H | M | M | H | H | M7 前半 |
| 2 | 対話フローに確認質問ステップを追加する | H | L | M | H | H | M7 前半 |
| 3 | Redmine issue 詳細と journals を取得する | H | L | M | H | H | M7 前半 |
| 4 | Chat intent 分類をモジュール化する | L | M | M | H | M | M7 後半 |
| 5 | docs 検索に用語辞書とスコア理由を追加する | M | L | L | H | M | M7 後半 |
| 6 | 体験メモを永続化する（ISS-038） | M | L | L | H | H | M7 後半 |
| 7 | Proposal と Chat 履歴を関連付ける | M | M | M | M | M | M8 以降 |

### 判断理由

**M7 前半候補（#1, #2, #3）を先に進める理由:**

- #1 ダッシュボードビュー分割: 現状は全機能が 1 画面に並んでおり、開発者と PM がそれぞれの目的で使いにくい。最初に役割ごとの導線を整えることで、後続の改善が「誰向けか」を意識しやすくなる。
- #2 確認質問ステップ: 曖昧な依頼に AI が即答する現状は、誤解や不適切な更新案の起点になりやすい。早期に対話の質を上げることで体験リスクを下げられる。
- #3 Redmine 詳細 + journals: Work Guide、PM Overview、Chat の全員が件名だけで判断している。詳細とコメント履歴を取得することで、複数の後続改善（#2, #5, #7）の判断材料が同時に整う。

**M7 後半候補（#4, #5, #6）の位置付け:**

- #4 Chat モジュール化: ユーザーには直接見えないが、#2 や #3 の実装で `src/server/index.js` がさらに肥大化することが予想されるため、関連機能を触るタイミングで分離する。
- #5 docs 検索改善: #3 の journals 取得と組み合わせると効果が大きい。コスト低なので #3 完了後に連続して進める。
- #6 体験メモ永続化: Milestone 10 の改善ループの前提。M7 後半に進めて M10 への準備を整える。

**M8 以降（#7）:**

- #7 Proposal/Chat 関連付け: 監査性の改善として価値はあるが、ステータス変更・クローズの実行フローが整ってから取り組む方が効果的。現段階では先送りできる。

### Milestone 7 推奨構成

M7 前半（最初に着手する issue）:

- `ISS-046`: ダッシュボードビューを分ける（開発者 / PM / 更新監査）
- `ISS-047`: Redmine issue 詳細と journals を取得する
- `ISS-048`: 対話フローに確認質問ステップを追加する

M7 後半（前半完了後に着手する issue）:

- `ISS-049`: Chat intent 分類をモジュール化する（#3 完了後のタイミング）
- `ISS-050`: docs 検索に用語辞書とスコア理由を追加する
- `ISS-051`: 体験メモを永続化する（ISS-038 に統合）

issue 番号と詳細仕様は Milestone 7 着手時に確定する。

## 2026-06-07: ISS-045 クローズ

評価軸の定義と 7 件の改善候補比較を issueslog.md に記録した。

確認結果:

- issueslog.md に評価軸定義（5 軸・3 段階）が存在することを確認した。
- 7 件の改善候補すべてを評価軸で比較した表が存在することを確認する。
- 次に取り組む issue を選ぶ判断理由を M7 前半・後半・M8 以降に分けて記録した。

クローズ判定:

- 改善候補を一貫した基準で選べるようになった。
- 少なくとも 3 件（実際は 7 件）の比較と判断理由を記録できた。
- Milestone 7 の推奨構成まで導ける状態になったため `ISS-045` を Closed とする。
- Milestone 6 の全 issue が Closed になったため、Milestone 6 を Completed とする。

## 2026-06-07: ISS-048 クローズ

対話フローに確認質問ステップを追加した。

実装内容:

- `isClarificationNeeded(question)`: `isUpdateRequest` が true かつ issue ID が未指定のとき、または曖昧ワード（「なんか」「適当に」「とりあえず」など）が含まれるとき `true` を返す。
- `buildClarificationResponse(question)`: `clarification_required` 型レスポンスを構築する。issue ID の有無に応じてメッセージとヒントを分岐する。
- `buildChatResponse` の先頭で `isClarificationNeeded` を評価し、該当すれば早期 return する。
- `isUpdateRequest` に「更新して」「コメントを追加」を追加し、口語的な依頼を捕捉するようにした。
- `renderChatAnswer`（app.js）に `data.clarification` ブランチを追加し、`.chat-clarification` カードを描画する。
- `.chat-clarification` スタイルを styles.css に追加した（青系、`#eff6ff` 背景）。

確認結果:

- 「なんか更新して」→ `clarification: true`、メッセージとヒント 4 件を返す。
- 「#1 にコメントを追加して: 実装完了しました」→ `clarification: false`、`proposal: true`。
- 「コメントを追加して」（issue ID なし、コメント系）→ `clarification: true`、コメント向けヒントに分岐する。
- 「#1201 を更新して」（issue ID あり、曖昧ワードなし）→ `clarification: false`、`proposal: true`。

クローズ判定:

- 曖昧な依頼で確認質問が返ることを確認した。
- 明確な依頼では確認質問が出ないことを確認した。
- `ISS-048` を Closed とする。
