# Issues

このファイルでは AIRedmine の開発 issue を管理する。
各 issue は、要求仕様、機能仕様、テスト仕様を決めてから実装する。

## Status

- Open: 未着手
- In Progress: 作業中
- Review: 実装とテストが終わり、クローズ判定中
- Closed: 完了

## Closed

### ISS-001: アプリの目的と共同開発ループを文書化する

Status: Closed
Priority: High

要求仕様:

- AIRedmine が何を体験させるアプリなのかを README に明記する。
- 今後の開発で参照するロードマップ、issue 管理、検討ログの置き場を作る。
- `agent.md` の共同開発ルールと整合する形にする。

機能仕様:

- `README.md` にアプリ概要、体験させたいこと、開発ドキュメントへの導線を追加する。
- `docs/roadmap.md` に目的、マイルストーン、完了条件を記録する。
- `docs/issues.md` に issue 管理の形式と初期 issue を記録する。
- `docs/issueslog.md` に今回の判断理由を記録する。

テスト仕様:

- 重要ファイルが存在することを確認する。
- README と roadmap にアプリ目的が記載されていることを確認する。
- issue のクローズ判定に必要な仕様が記録されていることを確認する。

テスト結果:

- `README.md`, `docs/roadmap.md`, `docs/issues.md`, `docs/issueslog.md` を追加または更新した。
- アプリ目的と開発ループを文書化した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-007: Redmine 接続状態と初期セットアップ導線を改善する

Status: Closed
Priority: High

要求仕様:

- 開発者や PM が、今モックデータを見ているのか、実 Redmine に接続できているのかを迷わず分かる。
- Redmine 未接続時に、次に何を設定すればよいか分かる。
- Redmine API エラー時に、URL、API キー、REST API 設定を確認すべきことが分かる。

機能仕様:

- `/api/config` が接続モード、接続先、未設定項目、セットアップ手順を返す。
- Browser UI に接続状態パネルを表示する。
- `.env` 未設定時はモックデータ表示中であることと、必要な環境変数を表示する。
- Redmine 接続設定済み時は接続先 URL を表示する。
- issue 取得に失敗した場合は、接続状態パネルにもエラー状態を反映する。

テスト仕様:

- `.env` 未設定時に、UI と `/api/config` がモックモードを示すことを確認する。
- `REDMINE_BASE_URL` と `REDMINE_API_KEY` が未設定項目として返ることを確認する。
- `node --check src/server/index.js` で構文エラーがないことを確認する。
- `/api/issues` がモックデータを返し、既存のチケット一覧が壊れないことを確認する。

テスト結果:

- `node --check src/server/index.js` が成功した。
- `node --check src/public/app.js` が成功した。
- `GET /api/config` が `mode: mock`、未設定項目、セットアップ手順を返した。
- `GET /api/issues` がモックデータを返した。
- `GET /` が HTML を返した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-010: モックデータを体験説明用に拡充する

Status: Closed
Priority: Medium

要求仕様:

- `.env` 未設定でも、AIRedmine の狙いが伝わる Redmine プロジェクト体験を再現できる。

機能仕様:

- 開発者向け、PM 向け、停滞 issue、仕様確認待ち、高優先度 issue などを含むモックデータにする。
- モックデータで検索、状態フィルタ、サマリの体験を確認できるようにする。
- `/api/issues` の `status_id` に応じて、モックデータも `open`、`closed`、`*` を絞り込む。

テスト仕様:

- モック表示で検索、状態フィルタ、サマリが破綻しないことを確認する。
- 体験説明に必要な状態の issue が含まれることを確認する。
- `GET /api/issues?status_id=open` が未完了 issue を返すことを確認する。
- `GET /api/issues?status_id=closed` が完了 issue を返すことを確認する。
- `GET /api/issues?status_id=*` が全 issue を返すことを確認する。

テスト結果:

- `node --check src/server/index.js` が成功した。
- `GET /api/issues?status_id=open` が未完了 issue 6 件を返した。
- `GET /api/issues?status_id=closed` が完了 issue 2 件を返した。
- `GET /api/issues?status_id=*` が全 issue 8 件を返した。
- `GET /` が HTML を返した。
- モックデータに仕様確認待ち、PM 判断待ち、停滞リスク、クローズ候補、完了済み issue を含めた。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

## Open

### ISS-002: 開発者向けの AI エージェント作業ビューを設計する

Status: Closed
Priority: High

要求仕様:

- 開発者が AI エージェント経由で「今日何をすべきか」を把握できる。
- Redmine の issue 一覧を、単なる一覧ではなく作業判断の材料として見られる。

機能仕様:

- 担当 issue の要約、優先度、停滞状況、次アクション候補を表示する。
- AI が判断した根拠と、人間が確認すべき点を分けて表示する。

テスト仕様:

- モックデータで、次アクション候補と根拠が表示されることを確認する。
- Redmine 接続時に既存の issue 一覧表示を壊さないことを確認する。

テスト結果:

- チケット一覧の前に `今日の作業候補` パネルを追加した。
- Redmine issue の優先度、ステータス、更新日時、件名から作業候補を順位付けするようにした。
- 最優先候補に AI の根拠、次アクション、人間が確認すべき点を表示した。
- Redmine 接続時に既存のチケット一覧、検索、状態フィルタが動くことを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-003: PM 向けのプロジェクト観察ビューを設計する

Status: Closed
Priority: High

要求仕様:

- PM が AI エージェント経由でプロジェクトの詰まりやリスクを把握できる。
- PM が朝会、リリース判断、優先順位調整の前に確認すべき issue を把握できる。

機能仕様:

- 停滞 issue、担当者ごとの負荷、優先度の偏り、未更新 issue を表示する。
- PM が確認すべき観点を短く提示する。
- 判断待ち、停滞リスク、仕様確認、高優先度 issue を PM の確認キューとして表示する。
- 表示項目から Redmine の元 issue に移動できる。

テスト仕様:

- モックデータでリスク候補が表示されることを確認する。
- 表示が Redmine の元データと対応していることを確認する。
- 実 Redmine のサンプル issue で、担当者負荷、優先度の偏り、未更新 issue が表示されることを確認する。
- `node --check src/public/app.js` で構文エラーがないことを確認する。

テスト結果:

- PM overview に `PMが今日確認すること`、担当者負荷、優先度の偏り、未更新 issue を追加した。
- 判断待ち、停滞リスク、仕様確認、高優先度 issue を `analyzeIssue` の結果から PM 確認キューに表示した。
- 実 Redmine のサンプル issue で、PM判断待ち、仕様確認待ち、停滞リスクが表示されることを確認した。
- `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-004: Redmine 更新前の確認フローを検討する

Status: Closed
Priority: Medium

要求仕様:

- AI エージェントが Redmine を更新する前に、人間が意図と差分を確認できる。
- 低リスクなコメント追加は確認後に実行できる。
- 高リスクなステータス変更とクローズは、安全条件を確認する段階に留める。

機能仕様:

- コメント追加、ステータス変更、担当変更の候補を扱う。
- 実行前に変更内容、理由、影響範囲を表示する。
- キャンセルできる。
- 更新前後の差分、確認事項、実行結果、実行ログを表示する。
- 更新失敗時は分類、再試行可否、再試行導線を表示する。

テスト仕様:

- モック更新で確認画面が出ることを確認する。
- API 失敗時にユーザーへ分かるエラーを表示する。
- 実 Redmine へのコメント追加が成功することを確認する。
- 存在しない issue への更新失敗がログに残ることを確認する。

実装メモ:

- `ISS-025` から `ISS-030` の実装により、更新前確認フローの最小体験が成立した。
- コメント追加は実行可能、ステータス変更とクローズは安全条件を表示する確認対象とした。

確認結果:

- Chat からコメント追加、ステータス変更、クローズ候補の更新案を作成できる。
- Redmine 更新案レビューで差分、下書き、確認事項、安全条件、実行ログを確認できる。
- 実 Redmine issue へのコメント追加が成功した。
- 存在しない issue へのコメント追加が `not_found` として失敗し、失敗ログが残った。

クローズ判定:

- Redmine 更新前に人間が意図、差分、結果を確認する体験を試せるため Closed とする。

### ISS-005: 自然言語対話の入口を設計する

Status: Closed
Priority: High

要求仕様:

- 開発者や PM が Redmine と知識ベースについて自然言語で質問できる。
- 対話で得た回答から、根拠確認や Redmine 更新案の確認に進める。
- Redmine 更新系の依頼は直接実行せず、人間の確認待ちとして扱う。

機能仕様:

- Browser UI とは別に Chat UI または対話入力欄を用意する。
- 対話は Redmine issue と `docs/` 配下の知識ベースを参照できる。
- Redmine 更新は対話から直接実行せず、更新案として作成する。
- `POST /api/chat` を追加し、質問、回答、根拠、確認待ちの更新案を返す。
- Chat UI に質問例、回答、参照 issue / docs、確認待ちの更新案を表示する。

テスト仕様:

- モックデータで「今日まず何からやればいい？」に回答できることを確認する。
- 回答に根拠となる issue または docs の参照が含まれることを確認する。
- 更新系の依頼が直接実行されず、確認待ちの提案になることを確認する。
- 実 Redmine 接続時に `POST /api/chat` が未完了 issue を参照できることを確認する。
- `node --check src/server/index.js` と `node --check src/public/app.js` で構文エラーがないことを確認する。

テスト結果:

- Browser UI に `AIRedmine に聞く` セクションを追加した。
- `POST /api/chat` を追加し、Redmine issue と `README.md`, `docs/roadmap.md`, `docs/issues.md`, `docs/issueslog.md` を参照するようにした。
- 「今日まず何からやればいい？」への回答に Redmine issue の根拠が含まれることを確認した。
- 更新系の質問では Redmine を直接更新せず、`confirmation_required` の更新案を返すことを確認した。
- 「自然言語対話の方針を教えて」への回答に `README.md`, `docs/roadmap.md`, `docs/issues.md` の参照が含まれることを確認した。
- Docker image に `README.md` と `docs/` を含め、コンテナ上でも知識ベース参照が動くことを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-020: Chat 回答の根拠リンクを詳しく表示する

Status: Closed
Priority: High

要求仕様:

- ユーザーが Chat の回答を読んだあと、なぜその回答になったのかをすぐ確認できる。
- issue と docs の根拠を区別して追える。

機能仕様:

- Chat 回答の根拠カードに、issue の状態、優先度、更新日、docs の抜粋を表示する。
- issue 根拠は Redmine の元 issue へ移動できる。
- docs 根拠はファイル名と抜粋を表示し、将来的な詳細表示に備える。
- issue 根拠にはプロジェクト、担当者、更新日、回答理由を含める。
- docs 根拠には種類ラベル、ファイル名、抜粋を含める。

テスト仕様:

- 「今日まず何からやればいい？」で issue 根拠が表示されることを確認する。
- 「自然言語対話の方針を教えて」で docs 根拠が表示されることを確認する。
- 根拠カードの表示がモバイル幅でも崩れないことを確認する。

テスト結果:

- `POST /api/chat` の issue 根拠に project, assignee, updatedLabel, reason が含まれることを確認した。
- `POST /api/chat` の docs 根拠に source と excerpt が含まれることを確認した。
- Chat UI の根拠カードで `Redmine issue` と `Knowledge doc` のラベルを分けて表示するようにした。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-021: issue 番号指定の質問に対応する

Status: Closed
Priority: High

要求仕様:

- ユーザーが `#1` や `issue 1` のように指定したとき、その issue に絞って質問できる。
- 開発者が個別 issue の背景、次アクション、クローズ可否を自然言語で確認できる。

機能仕様:

- Chat API が質問文から issue 番号を抽出する。
- 該当 issue がある場合、その issue を優先して回答と根拠に使う。
- 該当 issue がない場合は、見つからないことを明示する。
- `#1`, `issue 1`, `チケット1` の表記を扱う。
- 背景、次アクション、クローズ可否の質問種別に応じて回答を変える。

テスト仕様:

- `#1 の背景を教えて` に対して #1 を根拠に回答することを確認する。
- 存在しない issue 番号に対して、見つからない旨を返すことを確認する。
- 更新系の質問でも直接更新せず確認待ちの更新案になることを確認する。

テスト結果:

- `POST /api/chat` で `#1 の背景を教えて` が #1 を根拠に回答することを確認した。
- `POST /api/chat` で `#1 の次アクションは？` が #1 の次アクションを返すことを確認した。
- `POST /api/chat` で `#999 の背景を教えて` が該当 issue なしを返すことを確認した。
- `POST /api/chat` で `#1 をクローズしていい？` が直接更新せず `confirmation_required` の更新案を返すことを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-022: Chat の質問履歴を表示する

Status: Closed
Priority: Medium

要求仕様:

- ユーザーが直前の質問と回答を振り返れる。
- PM や開発者が探索の流れを失わずに追加質問できる。

機能仕様:

- ブラウザー UI にセッション中の質問履歴を表示する。
- 各履歴には質問、回答の短い要約、根拠件数を表示する。
- 履歴をクリックすると回答を再表示できる。
- 更新案を含む履歴には、更新案があることを表示する。
- 履歴はセッション内だけで保持し、最大 8 件を表示する。

テスト仕様:

- 複数回質問したときに履歴が増えることを確認する。
- 履歴クリックで過去回答が再表示されることを確認する。
- ページ再読み込み時は履歴が消えてもよい。

テスト結果:

- Chat UI に質問履歴パネルを追加した。
- 回答成功時に質問、回答要約、根拠件数、更新案有無を履歴へ追加するようにした。
- 履歴クリックで過去回答を再表示できるようにした。
- `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-023: docs 知識ベース検索の精度を改善する

Status: Closed
Priority: Medium

要求仕様:

- docs に書かれた方針、仕様、ロードマップを Chat がより適切に参照できる。
- 日本語の短い質問でも関連 docs を拾いやすくする。

機能仕様:

- docs を見出し単位で分割して検索する。
- 質問語と見出し、本文の一致度で根拠候補を並べる。
- 返す根拠にはファイル名、見出し、抜粋を含める。
- 見出し一致を本文一致より高く評価する。

テスト仕様:

- 「ロードマップ」「自然言語対話」「更新確認」などの質問で関連 docs が返ることを確認する。
- 無関係な docs が上位に出すぎないことを確認する。
- Docker image 上でも docs 検索が動くことを確認する。

テスト結果:

- docs を見出し単位で分割し、見出しと本文の一致度で score を付けるようにした。
- docs 根拠にファイル名、見出し、抜粋、score を含めるようにした。
- 「ロードマップ」「自然言語対話」「更新確認」で関連 docs が返ることを確認した。
- Docker image 上でも docs 検索が動くことを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-024: Chat 回答から Redmine 更新案の詳細下書きを作る

Status: Closed
Priority: High

要求仕様:

- 更新系の自然言語依頼に対して、単に確認待ちと返すだけでなく、確認しやすい更新案の下書きを作れる。
- Milestone 4 の Redmine 更新前確認フローにつながる形にする。

機能仕様:

- コメント追加、ステータス変更、クローズ候補を更新案の種類として分類する。
- 更新案には対象 issue、変更内容、理由、確認事項を含める。
- 実行はまだ行わず、確認待ちとして表示する。
- 更新案には下書き本文を含める。
- Chat UI で対象 issue、変更内容、下書き本文、確認事項を表示する。

テスト仕様:

- `この実装が終わったのでRedmineコメント案を書いて` でコメント案が返ることを確認する。
- `#1 をクローズしていい？` でクローズ候補の確認事項が返ることを確認する。
- Redmine API への更新リクエストが発生しないことを確認する。

テスト結果:

- `POST /api/chat` で `この実装が終わったのでRedmineコメント案を書いて` がコメント案を返すことを確認した。
- `POST /api/chat` で `#1 をクローズしていい？` がクローズ確認案と確認事項を返すことを確認した。
- `POST /api/chat` で `#1 のステータス変更案を作って` がステータス変更案を返すことを確認した。
- 更新案は `confirmation_required` のままで、Redmine API への更新リクエストを行わないことを確認した。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-025: Redmine 更新案の確認画面を追加する

Status: Closed
Priority: High

要求仕様:

- Chat で作成した Redmine 更新案を、専用の確認画面で確認できる。
- 人間が確認するまで Redmine 更新は実行されないことが分かる。

機能仕様:

- Chat が `confirmation_required` の更新案を返した場合、更新案レビューに表示する。
- 更新案レビューには対象 issue、種別、状態、変更内容、下書き、確認事項、次ステップを表示する。
- 履歴から過去の更新案を再表示した場合も、レビュー対象に戻せる。
- 更新案を破棄できる。

テスト仕様:

- `この実装が終わったのでRedmineコメント案を書いて` で更新案レビューが表示されることを確認する。
- 履歴から更新案つき回答を再表示すると、レビュー対象に戻ることを確認する。
- 破棄操作でレビューが空状態に戻ることを確認する。
- Redmine API への更新リクエストが発生しないことを確認する。

テスト結果:

- Chat UI の下に `Redmine 更新案レビュー` パネルを追加した。
- 更新案を受け取ったときにレビューへ同期するようにした。
- 履歴クリックで更新案をレビューへ戻せるようにした。
- 更新案を破棄できるようにした。
- `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-026: Redmine コメント追加の確認フローを実装する

Status: Closed
Priority: High

要求仕様:

- コメント追加だけを、確認後に Redmine へ反映できる。

機能仕様:

- `comment` 更新案を対象にする。
- 実行前に対象 issue、コメント本文、理由、確認事項を表示する。
- 実行後に Redmine API の結果を表示する。
- ステータス変更やクローズ候補は、この issue では実行対象にしない。
- モックモードでは Redmine 更新を行わず、成功相当の結果を返す。

テスト仕様:

- 確認後に Redmine コメント追加 API が呼ばれることを確認する。
- 実行前にキャンセルできることを確認する。
- API エラー時にエラー表示されることを確認する。

テスト結果:

- `POST /api/proposals/comment` を追加した。
- `Redmine 更新案レビュー` で `comment` 更新案にだけ `確認してコメント追加` ボタンを表示するようにした。
- 実 Redmine に対してコメント追加 API が成功することを確認した。
- コメント追加結果をレビュー画面に表示できるようにした。
- ステータス変更やクローズ候補は実行対象外として表示するようにした。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-027: 更新前後の差分表示を追加する

Status: Closed
Priority: Medium

要求仕様:

- Redmine に反映される内容を、実行前に差分として確認できる。

機能仕様:

- 現在の Redmine 情報と更新案の差分を表示する。
- コメント追加、ステータス変更、クローズ候補で差分の見せ方を分ける。

テスト仕様:

- コメント追加案で追加本文が差分として見えることを確認する。
- ステータス変更案で現在状態と変更候補が見えることを確認する。

実装メモ:

- Redmine 更新案レビューに `更新前後の差分` ブロックを追加した。
- コメント追加は追加される本文、ステータス変更は現在状態と候補、クローズは現在状態と判断条件を表示する。

確認結果:

- `comment` 更新案で、更新前と更新後のコメント本文を確認できる。
- `status_change` と `close_candidate` 更新案で、現在状態と候補の見え方を確認できる。

クローズ判定:

- 実行前に差分を確認できるため Closed とする。

### ISS-028: 更新実行ログを記録する

Status: Closed
Priority: Medium

要求仕様:

- 誰が、いつ、どの更新案を確認し、何を反映したか追える。

機能仕様:

- 実行ログに日時、対象 issue、更新種別、下書き、結果を残す。
- まずはブラウザー内またはアプリサーバーのメモリ上で扱う。

テスト仕様:

- 更新実行後にログが増えることを確認する。
- 失敗時にも失敗結果が残ることを確認する。

実装メモ:

- アプリサーバーのメモリ上に更新実行ログを保存する。
- `GET /api/proposals/logs` で最新ログを取得できる。
- レビュー画面に実行ログを表示し、再読み込みできる。

確認結果:

- 実 Redmine issue へのコメント追加後、成功ログが追加された。
- 存在しない issue へのコメント追加失敗後、失敗ログが追加された。

クローズ判定:

- 検証用として、誰が、いつ、どの更新を試し、結果がどうなったか追えるため Closed とする。

### ISS-029: 更新失敗時のエラー表示と再試行導線を作る

Status: Closed
Priority: Medium

要求仕様:

- Redmine API への更新に失敗したとき、原因と次の行動が分かる。

機能仕様:

- 認証エラー、権限不足、接続失敗、バリデーションエラーを区別する。
- 再試行または下書きに戻る導線を表示する。

テスト仕様:

- API キー不正時のエラー表示を確認する。
- Redmine 停止時のエラー表示を確認する。

実装メモ:

- Redmine 更新失敗を `auth`, `not_found`, `validation`, `rate_limit`, `server`, `connection`, `unknown` に分類する。
- 失敗結果に分類と再試行可否を含める。
- レビュー画面の失敗表示に再試行ボタンを追加した。

確認結果:

- 存在しない issue へのコメント追加で `not_found` が表示され、失敗ログに残ることを確認した。
- 接続失敗は Connector で `connection` として扱えるようにした。
- API キー不正と Redmine 停止の実操作は、既存のローカル検証環境を壊さないため未実施。分類ロジック上は `auth` と `connection` として表示される。

クローズ判定:

- 更新失敗時に原因分類、再試行可否、再試行導線を確認できるため Closed とする。

### ISS-030: ステータス変更・クローズ操作の確認フローを検討する

Status: Closed
Priority: Medium

要求仕様:

- コメント追加よりリスクが高いステータス変更とクローズ操作の安全条件を整理する。

機能仕様:

- ステータス変更とクローズに必要な確認事項を定義する。
- 実装前に、どの状態変更を許可するか整理する。

テスト仕様:

- 許可する操作と保留する操作が docs に整理されていることを確認する。

実装メモ:

- ステータス変更とクローズは、現段階では Redmine API への実行対象にしない。
- ステータス変更では、変更先ステータス、担当者、理由コメントを確認する。
- クローズでは、完了条件、テスト結果、残リスク、フォローアップ issue の要否を確認する。

許可する操作:

- コメント追加: 確認後に実 Redmine へ反映できる。

保留する操作:

- ステータス変更: 安全条件の表示まで。
- クローズ: 安全条件の表示まで。
- 担当変更: Milestone 4 では未実行。後続で権限と通知影響を整理する。

確認結果:

- クローズ候補の Chat 更新案で、レビュー画面にクローズ安全条件が表示されることを確認した。
- ステータス変更候補は実行せず、現在状態と変更候補の確認に留める設計にした。

クローズ判定:

- 高リスク操作を実行せずに確認対象として扱う方針を整理できたため Closed とする。

### ISS-006: devcontainer / Docker Compose で OSS 版 Redmine 検証環境を作る

Status: Closed
Priority: Medium

要求仕様:

- 開発者や PM がローカルで AIRedmine と無料で利用できる OSS 版 Redmine を試せる。
- Redmine API 連携を実データに近い形で検証できる。
- ロードマップ上で Milestone 5 と対応していることが分かる。

機能仕様:

- Docker Compose の構成を追加する。
- OSS 版 Redmine、database、AIRedmine app server を起動できる。
- AIRedmine app server から Redmine コンテナへ接続できる環境変数を用意する。
- README に Docker Compose 起動、Redmine 初期設定、API キー設定、接続確認の手順を追加する。

テスト仕様:

- `docker compose config` または `docker-compose config` で Compose 構成が解釈できることを確認する。
- README に Docker Compose 起動、Redmine REST API 有効化、API キー設定、接続確認の手順があることを確認する。
- AIRedmine がローカル Redmine に接続するための環境変数が Compose 構成にあることを確認する。

テスト結果:

- `env REDMINE_API_KEY=placeholder docker-compose config` が成功し、Compose 構成を解釈できることを確認した。
- Compose 構成に AIRedmine app server、OSS 版 Redmine、PostgreSQL database の 3 service があることを確認した。
- Compose 構成に `REDMINE_BASE_URL=http://redmine:3000` と `REDMINE_API_KEY` があることを確認した。
- README に Docker Compose 起動、Redmine REST API 有効化、API キー設定、接続確認の手順を追加した。
- ロードマップの Milestone 5 に `ISS-006` を関連 issue として記載した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-031: Docker Compose 起動ヘルスチェックを追加する

Status: Closed
Priority: High

要求仕様:

- 新しい開発者や PM が、Docker Compose 環境の起動状態を迷わず確認できる。
- AIRedmine、Redmine、PostgreSQL のどこで詰まっているか切り分けられる。

機能仕様:

- AIRedmine app の HTTP 応答を確認する。
- Redmine の HTTP 応答を確認する。
- Redmine API への app 経由疎通を確認する。
- README に確認コマンドと期待結果を記載する。
- `npm run healthcheck` でまとめて確認できる。
- 確認対象 URL は `AIREDMINE_APP_URL` と `REDMINE_PUBLIC_URL` で変更できる。

テスト仕様:

- `docker-compose ps` で各 service が Up になることを確認する。
- AIRedmine app と Redmine の HTTP 応答を確認する。
- `/api/config` または `/api/issues` で app 側の接続状態を確認する。

テスト結果:

- `scripts/healthcheck.mjs` を追加した。
- `package.json` に `npm run healthcheck` を追加した。
- README にヘルスチェックの実行方法と期待結果を追加した。
- `node --check scripts/healthcheck.mjs` が成功した。
- `npm run healthcheck` が成功し、Docker Compose services、AIRedmine HTTP、Redmine HTTP、AIRedmine config API、AIRedmine issues API がすべて `OK` になることを確認した。

クローズ判定:

- Docker Compose 起動後の主要な疎通確認をワンコマンドで実行できるため Closed とする。

### ISS-032: 初回セットアップ確認スクリプトを追加する

Status: Open
Priority: High

要求仕様:

- 初回セットアップ時に、必要な設定が揃っているか一度に確認できる。
- `.env`、Redmine API キー、REST API 有効化、app 接続の不足を分かりやすく表示する。

機能仕様:

- `npm run doctor` 相当の確認コマンドを追加する。
- `.env` の必須項目を確認する。
- AIRedmine app の `/api/config` と `/api/issues` を確認する。
- 失敗時は次に確認すべき操作を表示する。

テスト仕様:

- `.env` が揃っている場合に成功結果が表示されることを確認する。
- 必須項目がない場合に不足項目が表示されることを確認する。

### ISS-033: Redmine デモデータ投入をワンコマンド化する

Status: Open
Priority: Medium

要求仕様:

- AIRedmine の体験確認に必要な Redmine project と issue を、迷わず投入できる。
- PM判断待ち、仕様確認、停滞リスク、クローズ候補などのサンプル issue を再現できる。

機能仕様:

- 既存の Redmine seed スクリプトを Docker Compose 経由で実行しやすくする。
- README にデモデータ投入、再投入、確認の手順を記載する。
- 既存データがある場合の扱いを明記する。

テスト仕様:

- Compose 環境で seed スクリプトを実行できることを確認する。
- AIRedmine UI にデモ issue が表示されることを確認する。

### ISS-034: Docker Compose 開発用 override を追加する

Status: Open
Priority: Medium

要求仕様:

- 開発中にソース変更をすぐ確認できる Docker 環境を用意する。
- 本番寄り app image 起動と、開発用ホットリロード起動を使い分けられる。

機能仕様:

- 開発用 Compose override または別 compose ファイルを追加する。
- app service でソースをマウントし、開発サーバーを起動できるようにする。
- README に通常起動と開発起動の違いを記載する。

テスト仕様:

- 開発用 Compose で AIRedmine app が起動することを確認する。
- ソース変更後に再ビルドなしで画面または API に反映されることを確認する。

### ISS-035: Redmine 接続トラブルシュート画面を強化する

Status: Open
Priority: Medium

要求仕様:

- Redmine 接続に失敗したとき、ユーザーが原因と次の行動を画面上で判断できる。

機能仕様:

- API キー未設定、REST API 無効、Redmine 停止、権限不足を区別して表示する。
- `/api/config` と `/api/issues` の結果をもとに、確認すべき手順を出す。
- README のトラブルシュート手順と表示内容を対応させる。

テスト仕様:

- `.env` 未設定時に不足項目が表示されることを確認する。
- Redmine API エラー時にステータスに応じた表示が出ることを確認する。

### ISS-036: devcontainer 対応を追加する

Status: Open
Priority: Low

要求仕様:

- VS Code devcontainer から AIRedmine の開発と Docker Compose 検証環境を始められる。

機能仕様:

- `.devcontainer/devcontainer.json` を追加する。
- 必要に応じて Docker Compose service と連携する。
- README に devcontainer での起動手順を記載する。

テスト仕様:

- devcontainer 設定ファイルが妥当な JSON であることを確認する。
- README に devcontainer 起動手順があることを確認する。

### ISS-008: Redmine issue 取得 API を Connector として分離する

Status: Closed
Priority: Medium

要求仕様:

- 今後 journal、project、wiki などを増やせるように Redmine 連携を整理する。
- HTTP サーバーの責務と Redmine / モックデータ取得の責務を分ける。

機能仕様:

- `src/server/index.js` から Redmine API 呼び出しを Redmine Connector に分離する。
- issue 取得をアプリ内の共通モデルに変換する。
- モックデータも同じ形で扱えるようにする。
- Redmine 未接続時は Connector がモックデータを返す。
- Redmine API エラー時は HTTP ステータスと本文を UI 側へ返せるようにする。

テスト仕様:

- モック時と Redmine 接続時で `/api/issues` のレスポンス互換性を確認する。
- 既存 UI のチケット一覧、検索、状態フィルタが壊れないことを確認する。
- `node --check src/server/index.js`、`src/server/redmineConnector.js`、`src/server/mockRedmine.js` で構文エラーがないことを確認する。
- モック時に `/api/config` と `/api/issues` が従来と互換のレスポンスを返すことを確認する。

テスト結果:

- `node --check src/server/index.js` が成功した。
- `node --check src/server/redmineConnector.js` が成功した。
- `node --check src/server/mockRedmine.js` が成功した。
- `GET /api/config` がモックモード、未設定項目、セットアップ手順を返した。
- `GET /api/issues?status_id=open` が未完了 issue 6 件を返した。
- `GET /api/issues?status_id=closed` が完了 issue 2 件を返した。
- `GET /` が HTML を返した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-009: PM が全体状態をざっくり把握できるサマリを追加する

Status: Closed
Priority: High

要求仕様:

- PM がプロジェクト全体の未完了数、優先度、停滞候補を一目で把握できる。
- PM が確認すべき issue と観点を、チケット一覧を読む前に把握できる。

機能仕様:

- ステータス別件数、優先度別件数、更新が古い issue 数を表示する。
- PM が確認すべき観点を短く表示する。
- モックデータでは、PM 判断待ち、停滞リスク、仕様ズレ、クローズ候補を観測項目として表示する。

テスト仕様:

- モックデータで件数と停滞候補が期待通り表示されることを確認する。
- 検索や状態フィルタと矛盾しない表示になることを確認する。
- `node --check src/public/app.js` で構文エラーがないことを確認する。

テスト結果:

- `node --check src/public/app.js` が成功した。
- `node --check src/server/index.js` が成功した。
- `GET /` が PM 観測パネルを含む HTML を返した。
- `GET /app.js` が `renderPmOverview` を含む JavaScript を返した。
- `GET /api/issues?status_id=open` が PM 判断待ち、停滞リスク、仕様ズレ、クローズ候補を含むモック issue を返した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-011: README にローカル Redmine 接続手順を追加する

Status: Closed
Priority: Medium

要求仕様:

- OSS 版 Redmine を使って試す流れが README だけで分かる。

機能仕様:

- Redmine REST API 有効化、API キー取得、`.env` 設定、起動確認を記載する。
- Docker Compose 実装前でも、外部 Redmine または手元の Redmine に接続できる情報を用意する。

テスト仕様:

- README の手順に必要な設定項目が揃っていることを確認する。
- `.env.example` と README の環境変数名が一致していることを確認する。

テスト結果:

- README に Redmine REST API 有効化、API キー取得、`.env` 設定、再起動、接続確認、トラブルシュートを記載した。
- README と `.env.example` の環境変数名が `REDMINE_BASE_URL`、`REDMINE_API_KEY`、`PORT` で一致することを確認した。
- Docker Compose 実装前でも、外部 Redmine または手元の Redmine に接続して試せる手順を記載した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-012: 体験評価と改善ループの記録方法を作る

Status: Open
Priority: Medium

要求仕様:

- 開発者と PM が AIRedmine を使ったときの体験変化を記録できる。
- 改善候補を後続 issue として継続的に扱える。
- ロードマップ上で Milestone 6 と対応していることが分かる。

機能仕様:

- 体験メモ、観察項目、改善候補の記録場所を決める。
- 定期的に `agent.md` や docs の改善提案につなげる手順を決める。

テスト仕様:

- 体験評価の記録テンプレートが存在することを確認する。
- 改善候補を issue 化する流れが docs に記載されていることを確認する。

### ISS-013: ローカル Redmine にデモデータを投入する

Status: Closed
Priority: Medium

要求仕様:

- ローカル Redmine 接続後に、AIRedmine の実データ表示をすぐ試せる。
- PM 判断待ち、仕様確認待ち、停滞リスク、クローズ候補など、AIRedmine の体験説明に必要な issue が実 Redmine に存在する。
- サンプルデータ投入を手順化し、再実行しても重複しにくい形にする。

機能仕様:

- Redmine コンテナ内で実行する seed スクリプトを追加する。
- seed スクリプトは tracker、status、priority、project、issue、API キーを用意する。
- Docker Compose の Redmine service から seed スクリプトを参照できるようにする。
- README にサンプルデータ投入手順を追加する。

テスト仕様:

- seed スクリプトを Redmine コンテナ内で実行できることを確認する。
- `GET /api/config` が `mode: redmine` を返すことを確認する。
- `GET /api/issues?status_id=*` が実 Redmine のサンプル issue を返すことを確認する。
- README にサンプルデータ投入手順があることを確認する。

テスト結果:

- `docker-compose exec -T redmine bundle exec rails runner /demo-scripts/seed-demo.rb` が成功した。
- `GET /api/config` が `connected: true`、`mode: redmine` を返した。
- `GET /api/issues?status_id=open` が実 Redmine の未完了サンプル issue 6 件を返した。
- `GET /api/issues?status_id=*` が実 Redmine のサンプル issue 7 件を返した。
- サンプル issue に PM 判断待ち、仕様確認待ち、停滞リスク、クローズ候補、完了済み issue が含まれることを確認した。
- README にサンプルデータ投入手順を追加した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-014: AIRedmine app を Docker イメージとして起動する

Status: Closed
Priority: Medium

要求仕様:

- AIRedmine app server を、ホストの Node.js 実行環境に依存せず Docker で起動できる。
- Docker Compose の app service が、汎用 Node イメージへのソースマウントではなく、AIRedmine app のイメージとして起動する。
- 既存の Redmine / PostgreSQL 検証環境と一緒に動く。

機能仕様:

- AIRedmine app 用の `Dockerfile` を追加する。
- Docker build context から不要なファイルや秘密情報を除外する `.dockerignore` を追加する。
- `docker-compose.yml` の app service を `build` 指定に変更する。
- README に app image の build / 起動手順を記載する。

テスト仕様:

- `docker-compose build app` が成功することを確認する。
- `docker-compose up -d app` で app service が起動することを確認する。
- `GET /api/config` が応答することを確認する。
- `GET /api/issues?status_id=open` が Redmine 接続時の issue を返すことを確認する。

テスト結果:

- `docker-compose build app` が成功し、`airedmine-app:local` が作成された。
- `docker-compose up -d app` が成功し、app service が再作成された。
- `docker-compose ps` で app service が `npm start` で起動していることを確認した。
- `GET /api/config` が `connected: true`、`mode: redmine` を返した。
- `GET /api/issues?status_id=open` が実 Redmine の未完了サンプル issue 6 件を返した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-015: 振り返りで得た共同開発ルールを agent.md に反映する

Status: Closed
Priority: Medium

要求仕様:

- ここまでの進め方の振り返りから得た改善点を、次回以降の開発ループで使えるルールにする。
- ロードマップと issue の対応、Docker / 外部サービス手順の記録、issue 一覧整理を忘れにくくする。

機能仕様:

- `agent.md` に、各マイルストーンへ対応 issue と状態を記載するルールを追加する。
- `agent.md` に、Docker や外部サービス接続で得た手順を README または docs に残すルールを追加する。
- `agent.md` に、issue 一覧の Status と見出しの矛盾を定期的に整理するルールを追加する。

テスト仕様:

- `agent.md` に上記 3 点が記載されていることを確認する。
- `docs/issueslog.md` に振り返りの判断理由が残っていることを確認する。

テスト結果:

- `agent.md` にロードマップ、Docker / 外部サービス手順、issue 一覧整理のルールを追加した。
- `docs/issueslog.md` にISS-015の着手とクローズを記録した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-016: issue ごとの AI 要約カードを追加する

Status: Closed
Priority: High

要求仕様:

- 開発者が issue 一覧を読むだけでなく、各 issue の意味と扱い方を短く把握できる。

機能仕様:

- 各 issue カードに AI 要約、次アクション、人間が確認すべき点を表示する。
- 実 AI 連携前は、Redmine の subject、status、priority、updated_on に基づくルールベース分析で表示する。

テスト仕様:

- 実 Redmine のサンプル issue で各 issue カードに要約が表示されることを確認する。
- 既存の Redmine issue リンクとメタ情報が壊れないことを確認する。

テスト結果:

- 各 issue カードに AI 要約、次アクション、人間が確認すべき点を追加した。
- 実 Redmine のサンプル issue で表示されることを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-017: 次アクション判定ルールを実装する

Status: Closed
Priority: High

要求仕様:

- AIRedmine が issue を単なる一覧ではなく、次に何をすべきかの候補として評価できる。

機能仕様:

- PM判断待ち、仕様確認、停滞リスク、クローズ候補、高優先度を判定する。
- 判定は score、category、summary、nextAction、humanCheck、reason を返す。
- 今日の作業候補パネルは score に基づいて候補を並べる。

テスト仕様:

- サンプル issue で PM判断待ち、仕様確認、停滞リスク、クローズ候補が判定されることを確認する。
- `node --check src/public/app.js` で構文エラーがないことを確認する。

テスト結果:

- `analyzeIssue` に次アクション判定ルールを実装した。
- 実 Redmine のサンプル issue で作業候補が並ぶことを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-018: AI判断と人間確認の境界をUIで分ける

Status: Closed
Priority: High

要求仕様:

- AI の提案をそのまま実行するのではなく、人間が確認すべき判断を明確に分けて体験できる。

機能仕様:

- 今日の作業候補パネルで `AIの根拠` と `人間が確認` を別枠で表示する。
- issue カードでも `次アクション` と `人間が確認` を分ける。

テスト仕様:

- 最優先候補に AI の根拠と人間が確認すべき点が表示されることを確認する。
- issue カードに人間確認欄が表示されることを確認する。

テスト結果:

- 今日の作業候補パネルと issue カードで、AI判断と人間確認の表示を分けた。
- 実 Redmine のサンプル issue で表示されることを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-019: Chat UI の回答取得エラー表示を改善する

Status: Closed
Priority: High

要求仕様:

- Chat UI で回答取得に失敗したように見える場合、原因の切り分けができる。
- ブラウザーが古い `app.js` を保持していても、更新後に新しいファイルを取得しやすい。

機能仕様:

- Chat API の通信失敗と回答描画失敗を別々に表示する。
- 通信失敗時は HTTP ステータスやエラーメッセージを表示する。
- 静的ファイルに `Cache-Control: no-store` を付ける。
- `index.html` の CSS / JS 参照にバージョンを付ける。

テスト仕様:

- `POST /api/chat` が 200 を返すことを確認する。
- `/app.js` が `Cache-Control: no-store` を返すことを確認する。
- `node --check src/server/index.js` と `node --check src/public/app.js` で構文エラーがないことを確認する。

テスト結果:

- `POST /api/chat` が「今日まず何からやればいい？」に対して 200 と回答を返した。
- `/app.js` が `Cache-Control: no-store` を返した。
- Chat UI の catch 範囲を通信と描画に分けた。
- `node --check src/server/index.js` と `node --check src/public/app.js` が成功した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。
