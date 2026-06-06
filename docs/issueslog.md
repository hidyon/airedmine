# Issues Log

issue の検討ログ、判断理由、保留事項、代替案を記録する。

## 2026-06-06: アプリ目的の再定義

ユーザーから、Airedmaine は Redmine を活用したプロジェクトにおいて、AI エージェント経由で Redmine を利用する開発体験がどう変化し、どう改善されるかを明らかにするためのアプリだと共有された。

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

- モックデータは、単なる表示確認ではなく Airedmaine の体験説明に使える内容にする。
- 開発者向けには、高優先度、仕様確認待ち、ブロッカー、クローズ候補を含める。
- PM 向けには、停滞、判断待ち、リリース前の未検証、情報品質の不足を含める。
- 状態フィルタが実 Redmine 接続時と近い感覚になるよう、`open`、`closed`、`*` をサーバー側で反映する。

## 2026-06-06: ISS-010 クローズ

`.env` 未設定時のモックデータを、Airedmaine の体験説明に使える内容へ拡充した。

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
