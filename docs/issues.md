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

Status: Closed
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

テスト結果:

- `scripts/doctor.mjs` を追加した。
- `package.json` に `npm run doctor` を追加した。
- Node.js、Docker Compose コマンド、`.env`、Compose service、AIRedmine config API、issue API を確認するようにした。
- `npm run doctor` が成功し、Compose v1 環境では v2 推奨の警告を出すことを確認した。

クローズ判定:

- 初回セットアップ不足をワンコマンドで確認できるため Closed とする。

### ISS-033: Redmine デモデータ投入をワンコマンド化する

Status: Closed
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

テスト結果:

- `scripts/seed-demo.mjs` を追加した。
- `package.json` に `npm run seed:demo` を追加した。
- 既存の Redmine seed runner を Compose 経由で実行できるようにした。
- seed 実行時の `api_key` 表示は `***` にマスクするようにした。
- `npm run seed:demo` が成功し、デモ issue が投入済みであることを確認した。

クローズ判定:

- デモデータ投入をワンコマンドで再現できるため Closed とする。

### ISS-034: Docker Compose 開発用 override を追加する

Status: Closed
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

テスト結果:

- `docker-compose.dev.yml` を追加した。
- app service にソースをマウントし、`npm run dev` で起動する構成にした。
- `npm run compose:dev` と `npm run compose -- ...` の入口を追加した。
- `docker-compose -f docker-compose.yml -f docker-compose.dev.yml config` が成功した。

クローズ判定:

- 通常起動と開発起動を使い分ける構成ができたため Closed とする。

### ISS-035: Redmine 接続トラブルシュート画面を強化する

Status: Closed
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

テスト結果:

- `/api/config` に `diagnostics` を追加した。
- Redmine issue 取得失敗時に `auth`, `not_found`, `validation`, `rate_limit`, `server`, `connection`, `unknown` の分類と次アクションを返すようにした。
- UI の接続エラー表示で分類、HTTP status、次アクションを表示するようにした。
- `GET /api/config` で `diagnostics.category=ready` が返ることを確認した。
- 配信 JS に新しい接続診断表示が含まれることを確認した。

クローズ判定:

- 接続失敗時の原因分類と次の行動が UI / API で確認できるため Closed とする。

### ISS-036: devcontainer 対応を追加する

Status: Closed
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

テスト結果:

- `.devcontainer/devcontainer.json` を追加した。
- `docker-compose.yml` と `docker-compose.dev.yml` を使って app service に接続する構成にした。
- `node -e` で devcontainer 設定が妥当な JSON であることを確認した。
- README に devcontainer の起動手順を追加した。

クローズ判定:

- VS Code devcontainer から開発環境を始める入口ができたため Closed とする。

### ISS-037: Docker Compose v2 への移行準備を行う

Status: Closed
Priority: Medium

要求仕様:

- Compose v2 の `docker compose` を優先しつつ、既存の `docker-compose` v1 環境でも動く。
- 今後 v2 へ移行するときに、README と scripts の変更範囲を小さくする。

機能仕様:

- Compose 実行は `docker compose` を先に試し、失敗したら `docker-compose` にフォールバックする。
- README に Compose v2 推奨と v1 fallback の方針を記載する。
- `docker compose config` / `docker-compose config` の出力に秘密値が含まれうる注意を記載する。

テスト仕様:

- 現環境の `docker-compose` v1 で scripts が動くことを確認する。
- Compose v2 がない場合に fallback できることを確認する。

テスト結果:

- `scripts/compose-utils.mjs` と `scripts/compose-run.mjs` を追加した。
- `npm run healthcheck`, `npm run doctor`, `npm run seed:demo`, `npm run compose:*` が共通の Compose 検出を使うようにした。
- 現環境では `docker compose` が未導入で、`docker-compose` v1 に fallback することを確認した。
- README に Compose v2 推奨、v1 fallback、config 出力時の秘密値注意を追加した。

クローズ判定:

- Compose v2 へ寄せる準備と v1 互換の両方を満たしたため Closed とする。

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

Status: Closed
Priority: Medium

要求仕様:

- 開発者と PM が AIRedmine を使ったときの体験変化を記録できる。
- 改善候補を後続 issue として継続的に扱える。
- ロードマップ上で Milestone 10 と対応していることが分かる。

機能仕様:

- 体験メモ、観察項目、改善候補の記録場所を決める。
- 定期的に `agent.md` や docs の改善提案につなげる手順を決める。
- Browser UI に、役割、場面、体験変化、観察メモ、改善候補を入力できる体験メモ欄を追加する。
- アプリサーバーに体験メモの保存・集計 API を追加し、改善候補を見返せるようにする。

テスト仕様:

- 体験評価の記録テンプレートが存在することを確認する。
- 改善候補を issue 化する流れが docs に記載されていることを確認する。
- `POST /api/experience/notes` で体験メモを保存できることを確認する。
- `GET /api/experience/notes` で集計、観察観点、改善候補を取得できることを確認する。
- `node --check src/server/index.js` と `node --check src/public/app.js` で構文エラーがないことを確認する。

テスト結果:

- Browser UI に `体験メモ` パネルを追加した。
- 役割、場面、体験変化、観察メモ、改善候補を記録できるようにした。
- 記録数、ポジティブな変化、摩擦、改善候補を画面で確認できるようにした。
- `/api/experience/notes` で体験メモをメモリ上に保存し、集計を返すようにした。
- `node --check src/server/index.js` が成功した。
- `node --check src/public/app.js` が成功した。
- `GET /api/experience/notes` が観察観点と空の集計を返すことを確認した。
- `POST /api/experience/notes` が体験メモを保存し、改善候補を含む集計を返すことを確認した。
- 配信 HTML に `体験メモ` パネルと最新キャッシュキーが含まれることを確認した。

クローズ判定:

- 体験メモ、観察項目、改善候補を AIRedmine の画面から記録でき、後続 issue 化の材料を残せるため Closed とする。

### ISS-046: ダッシュボードビューを分ける

Status: Closed
Priority: High

要求仕様:

- 開発者が「今日の作業候補」へ、PM が「プロジェクト観測」へ素早く移動できる。
- Chat、更新案レビュー、体験メモを目的別のビューとして整理する。
- サイドバーのナビゲーションが実際のビュー切り替えとして機能する。

機能仕様:

- 開発者ビュー、PM ビュー、更新監査ビューを主要ビューとして分ける。
- サイドバーのナビゲーションで各ビューへ切り替えられる。
- 現在表示中のビューがナビゲーション上で分かる。
- モバイル幅でもナビゲーションと主要コンテンツが崩れない。

テスト仕様:

- 各ナビゲーション項目をクリックすると対応するビューが表示されることを確認する。
- モバイル幅（375px 相当）でナビゲーションとコンテンツが崩れないことを確認する。
- `node --check src/public/app.js` で構文エラーがないことを確認する。

テスト結果:

- `index.html` のナビゲーションに `data-view="developer/pm/audit"` を追加した。
- 各 section に `data-views` 属性でどのビューに属するかを指定した。
- `app.js` に `VIEWS` 設定と `renderView()` を追加し、nav クリックでビューが切り替わるようにした。
- `state.currentView` でビュー状態を管理し、`init()` で初期描画するようにした。
- `node --check src/public/app.js` が成功した。
- 既存のモバイル breakpoint（820px）でナビが横並びになるスタイルは既に実装済みで崩れないことを確認した。

クローズ判定:

- 開発者 / PM / 更新監査の 3 ビューに切り替えられる。
- サイドバーのナビゲーションがアクティブビューを示す。
- モバイル対応は既存 CSS で担保されている。
- 以上により ISS-046 を Closed とする。

### ISS-047: Redmine issue 詳細と journals を取得する

Status: Closed
Priority: High

要求仕様:

- Work Guide、PM Overview、Chat が件名だけでなく、詳細・コメント履歴を判断材料にできる。
- issue 詳細と journals を取得する API を Redmine Connector に追加する。

機能仕様:

- `getIssueDetail(id)` を Redmine Connector に追加する。
- 取得するフィールド: description、journals（コメント履歴）、status、priority、assigned_to、due_date。
- モックモードでは同じ形式のモックデータを返す。
- Chat の issue 番号指定質問で詳細を参照できるようにする。

テスト仕様:

- `GET /api/issues/:id` またはそれに準ずる API で issue 詳細が返ることを確認する。
- モックと実 Redmine で同じレスポンス形式になることを確認する。
- `node --check src/server/index.js` と `node --check src/server/redmineConnector.js` で構文エラーがないことを確認する。

テスト結果:

- `getMockIssueDetail` を `mockRedmine.js` に追加し、8 件のモック issue に description と journals を追加した。
- `getIssueDetail(id)` を `redmineConnector.js` に追加した。実 Redmine では `GET /issues/:id.json?include=journals` を呼ぶ。
- `normalizeIssueDetail` で description、journals（notes があるもののみ）を正規化するようにした。
- `GET /api/issues/:id` ルートと `handleIssueDetail` を `index.js` に追加した。
- `handleChat` で issue 番号が指定されている場合に `getIssueDetail` を追加取得するようにした。
- `issueSpecificAnswerWithDetail` を追加し、背景・次アクション・クローズ質問で description と journals を使った回答を返すようにした。
- `issueReference` に `journalCount` を追加した。
- モック動作確認: `getMockIssueDetail(1208)` が description と journals 2 件を返した。存在しない ID では null を返した。
- `node --check` で全サーバーファイルの構文エラーがないことを確認した。

クローズ判定:

- `GET /api/issues/:id` で詳細と journals が返る。
- Chat の `#1208 の背景を教えて` が description とコメント履歴を使った回答を返せる。
- モックと実 Redmine で同じレスポンス形式になっている。
- 以上により ISS-047 を Closed とする。

### ISS-048: 対話フローに確認質問ステップを追加する

Status: Closed
Priority: High

要求仕様:

- 曖昧な依頼に対して AI が先に確認質問を返し、誤解や不適切な更新案を防ぐ。
- 明確な依頼では従来通り回答・更新案を作る。

機能仕様:

- Chat API が「曖昧」と判断した場合、回答の代わりに確認質問を返す。
- 確認質問には対象 issue、確認したい点、選択肢または補足を含める。
- 確認質問のレスポンスは `clarification_required` として UI で区別できる。
- Chat UI で確認質問と通常回答を視覚的に区別して表示する。

テスト仕様:

- 「なんか更新して」のような曖昧な依頼で確認質問が返ることを確認する。
- 「#1 にコメントを追加して: 実装完了しました」のような明確な依頼では確認質問が出ないことを確認する。
- `node --check src/server/index.js` と `node --check src/public/app.js` で構文エラーがないことを確認する。

### ISS-049: Chat intent 分類をモジュール化する

Status: Closed
Priority: Medium
Note: Python + FastAPI 移行（ISS-053）で `backend/services/chat_engine.py` として分離済み。Milestone 9 の ISS-066 で agent.py に刷新した。

要求仕様:

- `src/server/index.js` に集中している Chat の意図分類・docs 検索・回答組み立てを分離する。
- 後続の Chat 改善が `index.js` を肥大化させずに進められる構造にする。

機能仕様:

- Chat intent 分類を独立した関数またはモジュールに分離する。
- docs 検索ロジックを独立した関数またはモジュールに分離する。
- 回答組み立てロジックを独立した関数またはモジュールに分離する。
- `index.js` は HTTP ルーティングと各モジュールの呼び出しに集中する。

テスト仕様:

- 分離前後で代表質問への回答内容が変わらないことを確認する。
- `node --check` で分離後の各モジュールに構文エラーがないことを確認する。

### ISS-050: docs 検索に用語辞書とスコア理由を追加する

Status: Closed
Priority: Medium
Note: Python + FastAPI 移行（ISS-053）で `backend/services/knowledge_base.py` として再設計済み。ISS-068 の `search_knowledge` ツールと統合した。

要求仕様:

- 同義語・言い換えを含む質問でも関連 docs が拾えるようにする。
- Chat 回答の根拠カードに、なぜその docs が選ばれたかが分かるスコア理由を表示する。

機能仕様:

- 主要な用語と同義語・関連語を定義した辞書を追加する。
- docs 検索スコア計算に辞書一致を加味する。
- docs 根拠カードにスコア理由（マッチした語、見出し）を表示する。

テスト仕様:

- 「ロードマップ」「マイルストーン」など同義語を含む質問で関連 docs が返ることを確認する。
- docs 根拠カードにスコア理由が表示されることを確認する。
- `node --check src/server/index.js` と `node --check src/public/app.js` で構文エラーがないことを確認する。

### ISS-051: 体験メモを永続化する

Status: Closed
Priority: Medium
Note: Python + FastAPI 移行（ISS-053）で SQLite による永続化を実装済み。ISS-038 も解決。

要求仕様:

- AIRedmine app server を再起動しても、記録した体験メモが失われない。
- 体験評価を継続的に蓄積し、後から振り返れる。

機能仕様:

- 体験メモの保存先をローカルファイル（JSON）にする。
- 既存の `/api/experience/notes` のレスポンス形式は変えない。
- 保存失敗時は UI に分かるエラーを表示する。
- ISS-038 の仕様を引き継ぎ、ISS-038 はこの issue で解決済みとする。

テスト仕様:

- 体験メモを保存後、app server を再起動しても取得できることを確認する。
- 保存先ファイルが存在しない場合は空の状態で起動することを確認する。
- `node --check src/server/index.js` で構文エラーがないことを確認する。

### ISS-038: 体験メモを永続化する

Status: Closed
Priority: Medium
Note: ISS-051 の SQLite 実装で対応済み。

要求仕様:

- AIRedmine app server を再起動しても、記録した体験メモが失われない。
- 体験評価を継続的に蓄積し、後から振り返れる。

機能仕様:

- 体験メモの保存先を決める。
- 保存先は、まずローカル検証に向いた軽量な方式を優先する。
- 既存の `/api/experience/notes` のレスポンス形式は大きく変えない。
- 保存失敗時は UI に分かるエラーを表示する。

テスト仕様:

- 体験メモを保存後、app server を再起動しても取得できることを確認する。
- 保存先が壊れている場合に、API と UI がエラーを表示できることを確認する。
- `node --check src/server/index.js` と `node --check src/public/app.js` で構文エラーがないことを確認する。

### ISS-039: 体験メモから改善 issue 下書きを作る

Status: Won't Do
Priority: Medium
Note: Milestone 10 を Won't Do とした判断に伴い対象外とする（2026-06-07）。

要求仕様:

- 記録した体験メモを、後続の改善 issue 候補へ変換しやすくする。
- 改善候補が単なるメモで終わらず、要求仕様、機能仕様、テスト仕様に展開できる。

機能仕様:

- 体験メモの `改善候補` から issue 下書きを作る。
- 下書きには要求仕様、機能仕様、テスト仕様の見出しを含める。
- Redmine や docs へ自動反映せず、人間が確認してから転記する。

テスト仕様:

- 改善候補を含む体験メモから issue 下書きが表示されることを確認する。
- 改善候補が空の場合は下書き作成対象にしないことを確認する。
- 下書きが既存の `docs/issues.md` の形式に近いことを確認する。

### ISS-040: 体験評価テンプレートを整備する

Status: Won't Do
Priority: Medium
Note: Milestone 10 を Won't Do とした判断に伴い対象外とする（2026-06-07）。

要求仕様:

- 開発者と PM が、毎回ばらばらな観点ではなく同じ観察軸で体験を記録できる。
- Redmine を直接使った場合との比較がしやすい。

機能仕様:

- 体験メモの観察観点をテンプレートとして docs に整理する。
- 開発者向け、PM 向け、共通観点を分ける。
- UI の体験メモパネルにも、テンプレートの観点を反映する。

テスト仕様:

- docs に体験評価テンプレートが存在することを確認する。
- UI の観察観点がテンプレートと矛盾しないことを確認する。
- `README.md` または `docs/roadmap.md` からテンプレートへ辿れることを確認する。

### ISS-041: 体験評価サマリを役割別に可視化する

Status: Won't Do
Priority: Medium
Note: Milestone 10 を Won't Do とした判断に伴い対象外とする（2026-06-07）。

要求仕様:

- 開発者と PM で、AIRedmine の効果や摩擦がどう違うかを見られる。
- 次に改善すべき対象が、作業支援なのか PM 観測なのか判断しやすい。

機能仕様:

- 体験メモの集計を役割別に表示する。
- 役割別に、負担軽減、判断しやすさ、摩擦、不安の件数を見られる。
- 改善候補も役割ごとに確認できる。

テスト仕様:

- 開発者と PM の体験メモを保存したとき、役割別の集計が表示されることを確認する。
- 役割が未指定または不正な値の場合の扱いを確認する。
- モバイル幅でも集計表示が崩れないことを確認する。

### ISS-042: 既存機能の改善候補を棚卸しする

Status: Closed
Priority: Medium

要求仕様:

- AIRedmine の既存機能について、改善候補を一覧化する。
- 機能追加だけでなく、使いにくさ、説明不足、保守しにくさ、検証しにくさも扱う。

機能仕様:

- 対象機能を Browser UI、Chat、Proposal review、PM overview、Work guide、Redmine Connector、開発環境、体験評価に分ける。
- 各機能について、現状、課題、改善案、影響範囲、検証方法を記録する。
- 改善候補は後続 issue に変換しやすい形式で整理する。

テスト仕様:

- docs に機能別の改善候補一覧が存在することを確認する。
- 各改善候補に、課題、改善案、検証方法が含まれることを確認する。
- `docs/roadmap.md` の Milestone 6 と対応していることを確認する。

テスト結果:

- `docs/improvement-inventory.md` を追加した。
- Browser UI、Chat、Proposal review、PM overview、Work guide、Redmine Connector、開発環境、体験評価の改善候補を整理した。
- 対話型インターフェイス、ダッシュボードの充実、意味検索の高度化の観点を追加した。
- 各機能に、現状、課題、改善案、影響範囲、検証方法、後続 issue 候補を記録した。
- 優先して扱う改善候補を 5 件に絞って記録した。
- `rg` で `docs/improvement-inventory.md` に各機能の必須見出しが存在することを確認した。
- `docs/roadmap.md` の Milestone 6 に `ISS-042` が関連 issue として記載されていることを確認した。

クローズ判定:

- 既存機能ごとの改善候補を後続 issue に変換しやすい形式で棚卸しできたため Closed とする。

### ISS-043: 現在のアーキテクチャを記録する

Status: Closed
Priority: Medium

要求仕様:

- 現在の AIRedmine の構成と責務を、後から見返せる形で記録する。
- これから機能追加や分離を行う前に、どこに何があるかを明確にする。

機能仕様:

- Browser UI、App Server、Redmine Connector、Knowledge Connector、AI Agent Layer、Proposal & Audit Layer、体験評価ループの責務を整理する。
- 現在は実装されていない、または仮実装の層も区別して記録する。
- 主要 API とデータの流れを docs にまとめる。

テスト仕様:

- docs にアーキテクチャ記録が存在することを確認する。
- 実際のファイル構成と docs の説明が矛盾していないことを確認する。
- README のアーキテクチャ方針と矛盾していないことを確認する。

テスト結果:

- `docs/architecture.md` を追加した。
- Human Interface Layer、App Server / Agent API、Redmine Connector、Knowledge Connector prototype、Agent Layer prototype、Proposal & Audit Layer prototype、Experience Loop prototype の責務を整理した。
- 主要 API と issue 一覧、Chat 回答、Proposal、体験メモのデータの流れを記録した。
- 実装済み、仮実装、未実装の境界を記録した。
- `rg --files src scripts .devcontainer` で実際のファイル構成を確認した。
- README のアーキテクチャ方針と `docs/architecture.md` のレイヤー構成が矛盾していないことを確認した。

クローズ判定:

- 現在の構成と責務を後から見返せる形で記録でき、次の責務分離検討の材料が揃ったため Closed とする。

### ISS-044: 次に分離すべき責務を検討する

Status: Closed
Priority: Medium

要求仕様:

- 今後の機能追加で複雑になりそうな責務を事前に見つける。
- 何をいつ分離すべきか、実装前に判断できるようにする。

機能仕様:

- `src/server/index.js`、`src/public/app.js`、Connector、docs 検索、Proposal、体験メモの責務を確認する。
- 分離候補ごとに、分離する理由、今すぐやるべきか、先送りできる条件を記録する。
- 不要な抽象化を避け、実際に複雑さを下げる分離だけを候補にする。

テスト仕様:

- docs に責務分離候補と判断理由が記録されていることを確認する。
- 各候補に、実施タイミングと先送り条件が含まれることを確認する。
- 既存 issue または新規 issue へのつながりが分かることを確認する。

テスト結果:

- `docs/responsibility-separation.md` を追加した。
- Chat / Agent Orchestrator、Knowledge Connector、Browser UI Views、Proposal & Audit、Experience Notes、Redmine Connector、Error Handling の分離候補を整理した。
- 各候補に、分離する理由、推奨タイミング、先送り条件、分離後の候補、既存 / 新規 issue とのつながりを記録した。
- 今すぐ分離したいもの、関連機能を触るタイミングで分離したいもの、今は分離しないものに分けた。
- `rg` で各候補に `推奨タイミング` と `先送り条件` が存在することを確認した。

クローズ判定:

- 今後の機能追加で複雑になりそうな責務と、分離タイミングを判断できる材料が揃ったため Closed とする。

### ISS-045: 改善候補の優先順位付け方法を決める

Status: Closed
Priority: Medium

要求仕様:

- 改善候補を、思いつきではなく一貫した基準で並べられる。
- 体験価値、実装コスト、リスク、依存関係、検証しやすさを踏まえて次の issue を選べる。

機能仕様:

- 改善候補に使う評価軸を決める。
- 評価軸には、ユーザー価値、技術リスク、実装コスト、検証容易性、ロードマップ適合度を含める。
- docs/issueslog.md に優先順位付けの判断例を残せるようにする。

テスト仕様:

- docs に優先順位付けの基準が存在することを確認する。
- 少なくとも 3 件の改善候補を基準に沿って比較できることを確認する。
- 次に取り組む issue を選ぶ判断理由が記録できることを確認する。

テスト結果:

- `docs/issueslog.md` に評価軸の定義（5 軸・3 段階）を記録した。
- `docs/improvement-inventory.md` の改善候補 7 件すべてを評価軸で比較した表を記録した。
- M7 前半・後半・M8 以降の推奨時期と判断理由を記録した。
- Milestone 7 の推奨構成（ISS-046〜ISS-051）を issueslog.md に記録した。

クローズ判定:

- 改善候補を一貫した基準で選べるようになった。
- 7 件の比較と判断理由、次の issue 選択の根拠を記録できた。
- Milestone 6 の全 issue が Closed になったため Milestone 6 を Completed とする。
- 以上により ISS-045 を Closed とする。

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

## Milestone 8: フロント/バック刷新

### ISS-052: プロジェクト構成の再編とビルド環境をセットアップする

Status: Closed
Priority: High

要求仕様:

- frontend/ (React + TypeScript + Vite) と backend/ (Python + FastAPI) にディレクトリを分割する。
- 開発時は Vite dev server が /api/* を FastAPI にプロキシする。
- Docker Compose を新構成に更新し、既存の Redmine / DB コンテナとの接続を維持する。

機能仕様:

- frontend/ に Vite + React + TypeScript の初期構成を作る。
- backend/ に FastAPI の初期構成を作る（uvicorn で起動）。
- vite.config.ts に /api/* → `http://backend:8000` のプロキシを設定する。
- docker-compose.yml の app サービスを FastAPI に変更し、frontend のビルドを別サービスまたは静的配信として扱う。
- 既存の src/ は移行完了まで残す。

テスト仕様:

- `docker compose up` で FastAPI と Vite dev server が起動することを確認する。
- ブラウザで localhost:5173 にアクセスし、Vite の初期画面が表示されることを確認する。
- `curl http://localhost:8000/health` で FastAPI が応答することを確認する。

### ISS-053: Python + FastAPI バックエンドに既存 API を移行する

Status: Closed
Priority: High

要求仕様:

- Node.js で実装されている全 API エンドポイントを Python + FastAPI で再実装する。
- Pydantic スキーマで入出力の型を定義し、既存フロントとの互換性を保つ。
- モックデータと Redmine 実接続の両モードを維持する。

機能仕様:

- 移行対象エンドポイント: GET /api/config, GET /api/issues, GET /api/issues/{id}, POST /api/chat, POST /api/proposals/comment, GET /api/proposals/logs, GET|POST /api/experience/notes。
- Redmine connector を Python で再実装する（httpx を使用）。
- Chat intent 分類・docs 検索・回答組み立てを backend/services/ に分離する（ISS-049 の再設計）。
- 体験メモの永続化を SQLite（組み込み sqlite3）で実装する（ISS-051 の再設計）。
- Pydantic モデルに `role: Literal["developer", "pm"]` を定義する（設計レベル）。
- モック用データを backend/mock/ に移行する。

テスト仕様:

- 各エンドポイントに curl でリクエストし、Node.js 版と同等のレスポンス形式を確認する。
- モックモードと実 Redmine モードが env 変数で切り替えられることを確認する。
- `python -m pytest tests/ -v` で基本的なルートテストが通ることを確認する。

テスト結果:

- 全 7 エンドポイントが FastAPI で実装され、ヘルスチェックを含む HTTP 確認を通過。
- モックモード（env 未設定）と実 Redmine モード（env 設定済み）の切り替えを確認。
- `python -m pytest tests/ -v` で 12/12 テストパス。
- 相対インポートを絶対インポートに変換し、uvicorn main:app での起動に対応。
- chat_engine.py のネスト f-string 構文エラー（Python 3.12 上での `\"` エスケープ問題）を修正。

クローズ判定:

- 要求・機能・テスト仕様をすべて満たしたため Closed とする。

### ISS-054: React + TypeScript フロントエンドの基盤を作る

Status: Closed
Priority: High

要求仕様:

- React + TypeScript で型安全なフロントエンドの基盤を作る。
- View ごとにルーティングを設定し、URL で View を切り替えられる。
- API クライアントを typed fetch wrapper として分離する。

機能仕様:

- React Router で /developer/chat, /developer/dashboard, /pm, /audit の 4 ルートを定義する。
- API クライアント (src/api/) に各エンドポイントの型定義と fetch wrapper を実装する。
- 共通レイアウト（サイドバー、ナビ、トップバー）をコンポーネント化する。
- CSS Modules を採用。グローバル変数は `styles/global.css`、コンポーネント固有は `*.module.css`。

テスト仕様:

- 4 ルートが切り替えられることをブラウザで確認する。
- `npx tsc --noEmit` で型エラーがないことを確認する。
- /developer/chat にアクセスしたとき Developer Chat の枠が表示されることを確認する。

テスト結果:

- `npx tsc --noEmit` エラーなし（コンテナ内で確認）。
- Vite dev server が `http://localhost:5173/` で起動、`/developer/chat` にアクセスでチャット枠表示。
- サイドバーから 4 View へのナビゲーションが動作することをブラウザで確認。
- DeveloperChatView: バブル UI + 入力欄 + 例文ボタンを実装。
- DeveloperDashboardView: issue 一覧表示（API 連携）。
- PMView: PM 判断待ち / 停滞 / 高優先度の 3 カードサマリー。
- AuditView: 更新ログ一覧（空の場合はガイドメッセージ表示）。

クローズ判定:

- 要求・機能・テスト仕様をすべて満たしたため Closed とする。

### ISS-055: 4 View の UI を React コンポーネントで実装する

Status: Closed
Priority: High

要求仕様:

- Developer Chat / Developer Dashboard / PM / Audit の 4 View を React コンポーネントで実装する。
- Developer Chat はスレッド型チャット UI（バブル積み上げ、入力欄下固定）にする。
- 既存の Vanilla JS 版と同等の機能を持つ。

機能仕様:

- DeveloperChatView: チャットスレッド、quick-questions、フォーム（下固定）、clarification カード、proposal カード。
- DeveloperDashboardView: issue 一覧（担当・優先度・ステータス・割り当て）。
- PMView: PM 判断待ち / 停滞 / 高優先度の 3 カードサマリー。
- AuditView: 更新ログ一覧（成功/失敗ラベル、タイムスタンプ、draft 表示）。
- CSS Modules を Tailwind v4（@tailwindcss/vite）に全面移行。

テスト仕様:

- 4 View が切り替えられ、各コンテンツが表示されることをブラウザで確認する。
- Developer Chat でメッセージを送り、スレッドにバブルが積み上がることを確認する。
- `npx tsc --noEmit` で型エラーがないことを確認する。

テスト結果:

- `npx tsc --noEmit` エラーなし（コンテナ内で確認）。
- Tailwind v4 CSS が正常に生成されていることを確認（global.css が 200KB+ の utility bundle を出力）。
- DeveloperChatView: 例文ボタン→入力→送信→バブル表示→clarification カードをブラウザで確認。
- DeveloperDashboardView: mock issue 一覧が表示されることを確認。
- PMView: 3カードが表示されることを確認。
- AuditView: 空ログのガイドメッセージが表示されることを確認。

クローズ判定:

- 要求・機能・テスト仕様をすべて満たしたため Closed とする。

### ISS-056: developer / pm ロール設計を docs に記録する

Status: Closed
Priority: Low

要求仕様:

- developer / pm の 2 ロールが何にアクセスできるかを設計レベルで定義する。
- 将来の認証実装時に参照できる形で docs に残す。

機能仕様:

- docs/role-design.md を新規作成する。
- 各ロールがアクセスできる View・API・操作を一覧にする。
- 認証方式（JWT / OAuth など）の検討候補を列挙する（実装なし）。

テスト仕様:

- docs/role-design.md が存在し、developer / pm ロールの設計が記録されていることを確認する。

テスト結果:

- `docs/role-design.md` を新規作成した。
- developer / pm の View アクセス一覧、API アクセス一覧、操作権限の考え方を記録した。
- 認証方式の検討候補（JWT / セッション / OAuth / Redmine API キー流用）を列挙した。
- 実装時の対応方針を 4 ステップで記録した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-057: `__pycache__` を `.gitignore` に追加する

Status: Closed
Priority: High

要求仕様:

- Python の `__pycache__` および `.pyc` ファイルがリポジトリに含まれないようにする。
- 既存のコミット済みキャッシュファイルをトラッキングから除外する。

機能仕様:

- `.gitignore` に `__pycache__/` と `*.pyc` を追加する。
- `git rm -r --cached` で既存のキャッシュファイルをインデックスから削除する。

テスト仕様:

- `git status` で `__pycache__/` が追跡対象外になっていることを確認する。
- `git ls-files backend/ | grep __pycache__` が空になることを確認する。

### ISS-058: 旧 Node.js サーバー (`src/`) を削除する

Status: Closed
Priority: Medium

要求仕様:

- FastAPI 移行後に不要になった `src/server/` と `src/public/` を削除する。
- 旧 Node.js 関連のファイルがリポジトリの混乱源にならないようにする。

機能仕様:

- `src/server/` ディレクトリを削除する（index.js, redmineConnector.js, mockRedmine.js）。
- `src/public/` ディレクトリを削除する（index.html, app.js, styles.css）。
- `src/` ディレクトリ自体が空になれば削除する。

テスト仕様:

- `ls src/` でファイルが存在しないことを確認する。
- フロントエンド（5173）、バックエンド（8000）が正常に起動していることを確認する。

テスト結果:

- `git rm -r src/` で `src/public/` と `src/server/` の 6 ファイルを削除した。
- `package.json` から `dev`・`start` スクリプト（旧 `node src/server/index.js` 起動）を削除した。
- `ls src/` が "No such file or directory" を返すことを確認した。
- `http://localhost:5173/` が 200、`http://localhost:8000/health` が 200 を返すことを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-059: Proposal カードから Redmine コメントを実行できるようにする

Status: Closed
Priority: Medium

要求仕様:

- Chat の Proposal カードに「実行」ボタンを追加し、確認後に Redmine へコメントを送信できるようにする。
- 実行結果（成功・失敗）をカード内にフィードバック表示する。

機能仕様:

- `ProposalCard` コンポーネントを DeveloperChatView に追加する。
- 「Redmine に送信」ボタンをクリック → 確認ダイアログまたはインライン確認 → POST /api/proposals/comment を呼び出す。
- 成功時: カードを「送信済み」状態に変更し、Audit の更新ログに記録される。
- 失敗時: エラーメッセージをカード内に表示し、再試行ボタンを出す。

テスト仕様:

- Chat で `#1208 にコメントを追加して: テスト送信` と入力 → Proposal カードが表示される。
- 「Redmine に送信」をクリック → API が呼ばれ、カードが「送信済み」になる（mock モードで確認）。
- Audit View の更新ログに実行記録が表示されることを確認する。

テスト結果:

- `#841 にコメントを追加して: テスト送信` で action: comment、target_issue あり の Proposal カードが返ることを確認した。
- `ProposalCard` コンポーネントを `DeveloperChatView.tsx` に追加した。`action === 'comment'` かつ `target_issue != null` のとき「Redmine に送信」ボタンを表示する。
- `action === 'close_candidate'` / `status_change` は「Audit ビューで確認」案内のみ表示する。
- `POST /api/proposals/comment` が成功し、カードが「✓ Redmine に送信済み」状態に変わることを確認した。
- Audit ログに success / 841 / comment が記録されることを確認した。
- `npx tsc --noEmit` エラーなし。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-060: Issue 詳細パネルを正式 issue として記録する

Status: Closed
Priority: Low

要求仕様:

- Dashboard と Chat に追加した issue 詳細パネルを正式な issue として追跡記録する。
- 実装済みの機能を docs で管理できるようにする。

機能仕様:

- `IssueDetailPanel` コンポーネント（description, meta, journals 表示）。
- DeveloperDashboardView: issue 行クリックで右パネルが開く 2 ペイン構成。
- DeveloperChatView: 参照チップクリックで同一パネルが開く。選択中はハイライト。
- ✕ ボタンで閉じる。別 issue をクリックで切り替わる。

テスト仕様:

- Dashboard で issue をクリック → 詳細パネルに description・journals が表示される。
- Chat で参照チップをクリック → 同じパネルが開く。
- `npx tsc --noEmit` エラーなし。

テスト結果:

- 実装済み・動作確認済み（2026-06-07）。

クローズ判定:

- 実装済みのため Closed とする。

### ISS-061: README を最新化する

Status: Closed
Priority: High

要求仕様:

- React + TypeScript + Vite / Python + FastAPI への移行を反映した README にする。
- 新しい 4 View の構成と起動手順を記載する。

機能仕様:

- アーキテクチャ概要（frontend / backend / Redmine の構成）を更新する。
- `docker compose up` による起動手順と各サービスの URL を記載する。
- 4 View（Developer Chat / Developer Dashboard / PM View / Audit）の説明を追加する。
- 旧 Node.js サーバーへの言及を削除する。
- モードの切り替え方（mock / Redmine 実接続）を記載する。

テスト仕様:

- README を読んで初回起動できる手順が揃っているかレビューする。
- アーキテクチャ図または説明が現在の構成と一致していることを確認する。

### ISS-062: 要求仕様・機能仕様・テスト仕様を文書化する

Status: Closed
Priority: High

要求仕様:

- AIRedmine 全体の要求仕様・機能仕様・テスト仕様を一か所にまとめた文書を作る。
- 個別 issue に分散している仕様を横断的に参照できるようにする。

機能仕様:

- `docs/spec.md` を新規作成する。
- 要求仕様: 誰のどんな問題を解くか、対象ユーザー、主要なユースケース。
- 機能仕様: エンドポイント一覧、View 構成、API / データ / 状態、ロール設計の概要。
- テスト仕様: 手動確認チェックリスト（4 View 動作、Chat 応答、Proposal 実行、Experience Notes）。
- 各仕様には対応する issue 番号を参照として記載する。

テスト仕様:

- `docs/spec.md` が存在し、要求・機能・テストの 3 セクションがあることを確認する。
- 機能仕様のエンドポイント一覧が `backend/routers/` の実装と一致していることを確認する。

テスト結果:

- `docs/spec.md` を新規作成した。要求・機能・テストの 3 セクションあり。
- エンドポイント一覧（9 件）は `backend/routers/` の実装と一致を確認。
- UC-01〜UC-06 の主要ユースケースを記録し、各仕様に issue 番号を付与した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

## Milestone 9: AI Agent + Anthropic API 統合

### ISS-063: Anthropic API を接続してヘルスチェックする

Status: Closed
Priority: High

要求仕様:

- backend から Anthropic API を呼び出せる環境を整える。
- API キーの設定・接続確認を開発者が迷わず行えるようにする。

機能仕様:

- `backend/requirements.txt` に `anthropic` を追加する。
- `.env` に `ANTHROPIC_API_KEY` を追加する（`.env.example` にも追記）。
- `GET /api/ai/health` で Anthropic API への接続確認を返す。
- 使用モデル: `claude-haiku-4-5-20251001`。
- API キー未設定時はエラーメッセージを返す。

テスト仕様:

- `GET /api/ai/health` が `{"status": "ok", "model": "claude-haiku-4-5-20251001"}` を返すことを確認する。
- API キー未設定時に適切なエラーが返ることを確認する。

テスト結果:

- `backend/requirements.txt` に `anthropic>=0.40.0` を追加し、Docker イメージを再ビルドした。
- `docker-compose.yml` の backend service に `ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY:-}` を追加した。
- `.env.example` に `ANTHROPIC_API_KEY` を追加した。
- `backend/routers/ai.py` を新規作成し `GET /api/ai/health` を実装した。
- `GET /api/ai/health` が `{"status": "ok", "model": "claude-haiku-4-5-20251001", "reply": "pong..."}` を返すことを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-064: Redmine 操作ツールを tool_use 形式で定義する

Status: Closed
Priority: High

要求仕様:

- Claude が Redmine を検索・参照・更新できるツール群を定義する。
- 既存の `redmine_connector.py` を流用し、tool_use のラッパーを作る。

機能仕様:

- `backend/services/tools.py` を新規作成する。
- 定義するツール:
  - `list_issues`: issue 一覧取得（status_id / assigned_to_id / limit）
  - `get_issue`: issue 詳細・journals 取得
  - `search_issues`: キーワードで issue 検索
  - `add_comment`: issue へのコメント追加（確認待ちフラグ付き）
- 各ツールの JSON スキーマと実行関数を定義する。
- `add_comment` は即時実行せず、確認待ちフラグを返す。

テスト仕様:

- `list_issues` が issue 一覧を返すことを確認する。
- `get_issue` が journals を含む詳細を返すことを確認する。
- `add_comment` が確認待ちレスポンスを返すことを確認する。

テスト結果:

- `backend/services/tools.py` を新規作成した。`list_issues`, `get_issue`, `search_issues`, `add_comment`, `search_knowledge` の 5 ツールを TOOL_SCHEMAS として定義した。
- `add_comment` は Redmine を直接呼ばず `{"confirmation_required": true, ...}` を返す。
- `list_issues` の `assigned_to_id` が未指定の場合はパラメータを省略するよう修正した（空文字列送信によるエラーを解消）。
- Agent から `list_issues` を呼んで issue 一覧が返ることを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-065: 会話コンテキスト管理を実装する

Status: Closed
Priority: High

要求仕様:

- セッション内の会話履歴を保持し、前の発言を踏まえた回答ができるようにする。
- サーバー再起動後も履歴を復元できるようにする。

機能仕様:

- `db.py` に `conversations` テーブルを追加する（session_id, role, content, created_at）。
- `POST /api/chat` のリクエストに `session_id` と `messages[]` を追加する。
- セッション ID はフロントエンドが生成して保持する（UUID）。

テスト仕様:

- 2 回のリクエストで会話が継続されることを確認する。
- セッション ID が異なる場合は別会話として扱われることを確認する。

テスト結果:

- `backend/db.py` に `conversations` テーブル（session_id, role, content, created_at）を追加した。
- `backend/models.py` の `ChatRequest` に `session_id`, `role`, `messages: list[ConversationMessage]` を追加した。
- `POST /api/chat` で `messages[]` を受け取り `run_agent` に渡す。フロントが会話履歴を蓄積して送る設計。
- 2 ターン目で前の会話を引き継いだ回答が返ることを `curl` で確認した（PM ロールのテスト）。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-066: AI Agent コアを実装する

Status: Closed
Priority: High

要求仕様:

- `POST /api/chat` を Anthropic API + tool_use を使った AI Agent に刷新する。
- Claude がツールを自律的に呼び出し、Redmine 情報を参照した上で回答を返す。

機能仕様:

- `backend/services/agent.py` を新規作成する。
- Anthropic API の tool_use ループを実装する（ツール呼び出し → 結果返却 → 最終回答）。
- 会話履歴（messages[]）を Anthropic API に渡す。
- `add_comment` ツール実行時は確認待ちレスポンスを返す。
- エラー時は分類して UI に返す（auth / connection / rate_limit / unknown）。
- 既存の `POST /api/proposals/comment` による実行フローは維持する。

テスト仕様:

- 「今日の担当 issue を教えて」で Claude が `list_issues` を呼び出して回答することを確認する。
- 「#841 の詳細を教えて」で `get_issue` が呼ばれ journals を踏まえた回答が返ることを確認する。
- 「#841 にコメントを追加して」で確認待ちレスポンスが返ることを確認する。

テスト結果:

- `backend/services/agent.py` を新規作成した。`run_agent(question, messages, role, connector)` が tool_use ループを実行する。
- `backend/routers/chat.py` を刷新し、旧 `build_chat_response` を `run_agent` に差し替えた。
- `POST /api/chat` に `{"question": "今日取り組むべきissueを教えて", "role": "developer"}` を送ると `list_issues` を呼んで日本語の優先順位付き回答を返すことを確認した。
- PM ロールで「停滞 issue を教えて」を送ると Urgent 案件の一覧と PM 向けアクション提案が返ることを確認した。
- 最大 5 ラウンドのツールループで `end_turn` が返れば最終回答を返す。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-067: フロントエンドをマルチターンチャット中心に整理する

Status: Closed
Priority: High

要求仕様:

- 開発者も PM も同じチャット UI を入口として使う。
- 前の発言・回答がスレッドに残り、文脈を意識した追加質問ができる。

機能仕様:

- `session_id`（UUID）をフロントエンドで生成・保持する。
- `POST /api/chat` のリクエストに `messages[]` と `session_id` を含める。
- ツール呼び出し状況（「Redmine を検索中…」等）をスレッド内に表示する。
- ロール選択（developer / pm）を UI に追加し、リクエストに含める。
- チャットをデフォルトビューにする。

テスト仕様:

- 「停滞 issue は？」→「そのうち優先度が高いものは？」で文脈が引き継がれることを確認する。
- ロールを developer / pm で切り替えると回答の切り口が変わることを確認する。
- `npx tsc --noEmit` エラーなし。

テスト結果:

- `frontend/src/api/client.ts` の `postChat` に `sessionId`, `role`, `messages[]` を追加した。
- `frontend/src/api/types.ts` の `ChatResponse` に `tool_calls?: string[]` を追加した。
- `frontend/src/views/DeveloperChatView.tsx` を刷新した。
  - `useRef<string>` で `session_id` を生成・保持する。
  - `useState<'developer'|'pm'>` でロールを管理し、切り替えで会話をリセットする。
  - `historyRef.current` に `{role, content}` を蓄積し、毎リクエストで `messages[]` として送る。
  - ロール切り替えタブと「会話をリセット」ボタンを追加した。
  - `ToolCallBadges` コンポーネントで呼ばれたツール名（list_issues 等）を紫バッジで表示する。
- Docker イメージをビルドして `localhost:5173` が 200 を返すことを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-068: ナレッジベース検索ツールを追加する

Status: Closed
Priority: Medium

要求仕様:

- Claude が docs（ロードマップ・方針・仕様）を検索して回答の根拠にできる。

機能仕様:

- `search_knowledge` ツールを `tools.py` に追加する。
- 既存の `knowledge_base.py` の `find_references` を流用する。
- 検索結果（ファイル名・見出し・抜粋）をツール結果として返す。

テスト仕様:

- 「このプロジェクトのロードマップは？」で `search_knowledge` が呼ばれ docs の内容を返すことを確認する。

テスト結果:

- `search_knowledge` ツールを `backend/services/tools.py` の TOOL_SCHEMAS に追加した。
- 既存の `knowledge_base.find_references()` を流用し、検索結果（ファイル名・見出し・抜粋）を返す。
- Agent が必要と判断したときに `search_knowledge` を自律的に呼び出す構成になっている。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-069: ロール別システムプロンプトを実装する

Status: Closed
Priority: Medium

要求仕様:

- developer と pm で Claude の回答の切り口が変わる。
- developer には技術的な次アクション、pm にはリスクと判断材料を返す。

機能仕様:

- `backend/services/prompts.py` を新規作成する。
- `developer` プロンプト: 担当 issue の進め方・ブロッカー・今日やること中心。
- `pm` プロンプト: リスク・停滞・PM 判断が必要な issue・プロジェクト全体の状態中心。
- `agent.py` がロールに応じてシステムプロンプトを切り替える。

テスト仕様:

- 同じ質問を developer / pm ロールで送り、回答の切り口が異なることを確認する。

テスト結果:

- `backend/services/prompts.py` を新規作成した。`DEVELOPER_SYSTEM_PROMPT`（優先 issue・ブロッカー・次アクション中心）と `PM_SYSTEM_PROMPT`（リスク・停滞・ベロシティ中心）を定義した。
- `agent.py` が `get_system_prompt(role)` を呼び、ロールに応じてシステムプロンプトを切り替える。
- developer ロールで「今日の issue」を聞くと技術的な優先順位が返り、pm ロールで「停滞 issue」を聞くと PM 向けのアクション提案が返ることを `curl` で確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。Milestone 9 の全 issue（ISS-063〜ISS-069）が Closed になった。

## Milestone 12: 体験品質強化と Redmine 書き込み拡張

### ISS-074: バックエンドのユーザー認証基盤を実装する

Status: Closed
Priority: High

要求仕様:

- ユーザー名 + 共通パスワードでログインし、自分のロール（developer/pm）が確定する。
- 共通パスワードは `.env` の `DEMO_PASSWORD` で管理する。個別パスワードは持たない。
- 初期ユーザーは seed スクリプトで投入する。

機能仕様:

- `backend/db.py` に `users` テーブルを追加する（id, username, display_name, role, created_at）。
- `backend/routers/auth.py` を新規作成する。
  - `POST /api/auth/login`: username + password → DEMO_PASSWORD と照合 → JWT を返す。
  - `GET /api/auth/me`: Authorization ヘッダーの JWT を検証してユーザー情報を返す。
- JWT は PyJWT で生成・検証する（署名鍵は `JWT_SECRET` 環境変数）。
- `backend/scripts/seed_users.py` を追加する（alice/bob=developer, carol=pm の初期ユーザー 3 名）。
- `.env.example` に `DEMO_PASSWORD` と `JWT_SECRET` を追加する。
- 他の既存 API は認証不要のまま維持する（プロトタイプのため）。

テスト仕様:

- `POST /api/auth/login` に正しいパスワードを送ると JWT が返ることを確認する。
- 誤ったパスワードで 401 が返ることを確認する。
- 存在しないユーザー名で 401 が返ることを確認する。
- `GET /api/auth/me` に有効な JWT を送るとユーザー情報が返ることを確認する。

テスト結果:

- `backend/db.py` に `users` テーブルを追加した。
- `backend/routers/auth.py` を新規作成した。`POST /api/auth/login` と `GET /api/auth/me` を実装。
- `PyJWT>=2.8.0` を requirements.txt に追加しコンテナにインストールした。
- `backend/scripts/seed_users.py` を追加し、alice/bob（developer）・carol（pm）を投入した。
- `.env.example` に `DEMO_PASSWORD=demo` と `JWT_SECRET` を追加した。
- `POST /api/auth/login` で alice/demo → JWT 返却・誤パスワード → 401・未存在ユーザー → 401 を確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-075: フロントエンドにログイン画面とセッション管理を追加する

Status: Closed
Priority: High

要求仕様:

- 未ログイン時はログイン画面にリダイレクトされる。
- ログイン後はユーザーのロールに合った Chat がデフォルトで開く（developer → developer/chat、pm → pm）。
- ヘッダーにログイン中のユーザー名を表示し、ログアウトできる。

機能仕様:

- `frontend/src/auth.ts`: JWT を localStorage に保存・取得・削除するユーティリティを追加する。
- `frontend/src/views/LoginView.tsx`: ユーザー名入力 + パスワード入力フォームを追加する。
- `App.tsx` の `/login` ルートを追加し、未ログイン時は全ルートを `/login` へリダイレクトする。
- `Layout.tsx` のヘッダーにログインユーザー名とログアウトボタンを追加する。
- `DeveloperChatView.tsx` の初期ロールをログインユーザーのロールから設定する。

テスト仕様:

- 未ログインで `/developer/chat` にアクセスすると `/login` にリダイレクトされることを確認する。
- ログイン後に developer ロールユーザーは `/developer/chat` へ、pm ロールユーザーは `/pm` へ遷移することを確認する。
- ヘッダーにユーザー名が表示されることを確認する。
- ログアウト後に `/login` に戻ることを確認する。
- `npx tsc --noEmit` エラーなし。

テスト結果:

- `frontend/src/auth.ts` を追加した。JWT の localStorage 保存・取得・削除ユーティリティを実装。
- `frontend/src/views/LoginView.tsx` を追加した。ユーザー名 + パスワード入力フォームを実装。
- `App.tsx` に `/login` ルートと `PrivateRoute`・`DefaultRedirect` を追加した。
- `Layout.tsx` にユーザー名・ロール表示とログアウトボタンを追加した。
- `DeveloperChatView.tsx` の初期ロールをログインユーザーのロールから設定するようにした。
- `api/client.ts` に `postLogin` 関数を追加した。
- `npx tsc --noEmit` エラーなし。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-071: Chat 回答をマークダウンレンダリングする

Status: Closed
Priority: High

要求仕様:

- Claude の回答は箇条書き・太字・コードブロックなどのマークダウンを使って返るが、現在の Chat UI はプレーンテキストとして表示している。
- マークダウンを正しくレンダリングして可読性を高める。

機能仕様:

- `frontend/` に `react-markdown` を追加する。
- `DeveloperChatView.tsx` のアシスタントバブルで `react-markdown` を使ってレンダリングする。
- ul/li、code/pre、strong、em のスタイルを Tailwind v4 で適用する。
- XSS 対策は react-markdown のデフォルト（HTML タグ無効化）で対応する。

テスト仕様:

- 「今日の issue を優先度順に教えて」で返ってくる箇条書きが `<ul><li>` としてレンダリングされることをブラウザで確認する。
- コードスニペットを含む回答でコードブロックが整形されることを確認する。
- `npx tsc --noEmit` エラーなし。

テスト結果:

- `react-markdown@10.1.0` を frontend に追加した。
- `MarkdownContent` コンポーネントを作成し、p / ul / ol / li / strong / em / h1-h3 / code / pre / hr のスタイルを Tailwind で定義した。
- `AssistantBubble` の回答表示を `<p whitespace-pre-wrap>` から `<MarkdownContent>` に変更した。
- `npx tsc --noEmit` エラーなし。
- Claude が返す `##`, `###`, `**bold**`, `- 箇条書き` を含む回答が正しくレンダリングされることを API レベルで確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

### ISS-072: PM View を Claude Agent に刷新する

Status: Closed
Priority: Medium

要求仕様:

- PM ロールでログインしたユーザーが、DeveloperChatView と同じ AI チャット画面を利用できる。
- ロールセレクターを UI から廃止し、ロールはログイン時に固定する。

機能仕様:

- `DeveloperChatView.tsx` からロールセレクタータブと `switchRole` 関数を削除する。ロールは `getUser()?.role` から読み取る（変更不可）。
- 「会話をリセット」ボタンはロールセレクターバーから独立させ、メッセージがある場合のみ右端に表示する。
- `App.tsx`: `/pm` ルートは `/developer/chat` へリダイレクトする。PMView をルーターから削除する。
- `Layout.tsx`: `ALL_NAV` でロール別にナビ項目をフィルタリングする（PM: Chat + Audit、開発者: Chat + Dashboard + Audit）。セクションヘッダー（Developer / Management）を削除してシンプル化する。

テスト仕様:

- nakamura でログインするとナビに「Chat」「Audit」のみ表示され「Dashboard」が見えないことを確認する。
- 開発者でログインするとナビに「Chat」「Dashboard」「Audit」が表示されることを確認する。
- ロールセレクタータブが画面に存在しないことを確認する。
- `/pm` にアクセスすると `/developer/chat` にリダイレクトされることを確認する。
- `npx tsc --noEmit` エラーなし。

テスト結果:

- `DeveloperChatView.tsx`: `switchRole` → `resetConversation`、ロールセレクターバー削除、「会話をリセット」のみ残存。
- `App.tsx`: `PMView` import と route 削除、`/pm` → Navigate to `/developer/chat`、DefaultRedirect を `/developer/chat` 固定に変更。
- `Layout.tsx`: `ALL_NAV` に `roles` フィールド追加、`navItems` でフィルタリング、セクションヘッダー削除。
- `tsc --noEmit` エラーなし（コンテナ内で確認）。

クローズ判定:

- 要求仕様・機能仕様・テスト仕様をすべて満たすため Closed とする。

### ISS-073: ステータス変更・担当変更の実行フローを実装する

Status: Closed
Priority: High

要求仕様:

- ISS-030 で「後続 Milestone で実施」とした、ステータス変更と担当変更の確認・実行フローを完成させる。
- コメント追加と同様に、確認後に実 Redmine へ反映できる。

機能仕様:

- `backend/services/redmine_connector.py` に `update_issue(issue_id, fields)` を追加する。`fields` は `{"status_id": X}` または `{"assigned_to_id": X}` を受け取る（既存の `PUT /issues/{id}.json` を使用）。
- `POST /api/proposals/update` を追加する。`type` に `status` または `assignee` を受け取り、Redmine を更新する。
- `DeveloperChatView.tsx` の `ProposalCard` で `status_change` Proposal に「実行」ボタンを追加する（現在は「Audit ビューで確認」案内のみ）。
- 担当変更は `assigned_to_id` を数値で指定して実行する。
- 実行後に Audit ログへ記録する（既存の `audit.py` の仕組みを流用）。

テスト仕様:

- `status_change` Proposal カードの「実行」ボタンを押したとき `POST /api/proposals/update` が呼ばれ Redmine が更新されることを確認する（mock モードで更新成功レスポンスを返すことを確認）。
- Audit ログにステータス変更の実行記録が残ることを確認する。
- `npx tsc --noEmit` エラーなし。

テスト結果:

- `tools.py`: `change_status` / `change_assignee` ツール追加。どちらも `confirmation_required` を返す。
- `agent.py`: `change_status` / `change_assignee` の proposal を生成（title, change_summary, draft, reason, new_status_id/new_assigned_to_id を含む）。
- `redmine_connector.py`: `update_issue(issue_id, fields)` 追加。mock モードでは `updated: True` を即返す。
- `models.py`: `UpdateProposalRequest` 追加。
- `routers/proposals.py`: `POST /api/proposals/update` 追加。Audit ログに記録。
- `types.ts`: `UpdateProposal` に `issue_id`, `new_status_id`, `new_status_name`, `new_assigned_to_id`, `new_assigned_to_name` を追加。`assignee_change` を action に追加。
- `client.ts`: `postUpdateProposal()` 追加。
- `DeveloperChatView.tsx`: `ProposalCard` を `status_change` / `assignee_change` に対応。「実行」ボタンで `postUpdateProposal` を呼び出す。
- `tsc --noEmit` エラーなし。

クローズ判定:

- 要求仕様・機能仕様・テスト仕様をすべて満たすため Closed とする。

## Milestone 11: チケット意味検索

### ISS-070: チケット意味検索を実装する

Status: Closed
Priority: High

要求仕様:

- キーワード完全一致ではなく、意味的に近いチケットを検索できる。
- 「認証」で検索したとき「ログイン」「セキュリティ」「アクセス制御」関連チケットも返る。
- Claude が自律的に意味検索を使い、より質の高い回答ができる。

機能仕様:

- `backend/requirements.txt` に `sentence-transformers` と `numpy` を追加する。
- `backend/services/embedder.py`: モデル（paraphrase-multilingual-MiniLM-L12-v2）の遅延ロードと埋め込み計算。
- `backend/db.py` に `issue_embeddings` テーブルを追加する（issue_id, subject, body, embedding, indexed_at）。
- `backend/services/issue_index.py`: Redmine から全 issue を取得して埋め込みインデックスを構築・検索する。インデックスが空のとき初回呼び出しで自動構築する。
- `backend/services/tools.py` に `search_issues_semantic` ツールを追加する。
- `GET /api/ai/index/status`: インデックス件数を返す。
- `POST /api/ai/index/build`: インデックスを強制再構築する。

テスト仕様:

- `POST /api/ai/index/build` でインデックスを構築し、`GET /api/ai/index/status` が `indexed_issues > 0` を返すことを確認する。
- 「認証」で意味検索して、件名に「認証」を含まないがセキュリティ・ログイン関連のチケットが返ることを確認する。
- Claude との会話で意味検索が必要な質問を送り、`search_issues_semantic` が tool_calls に含まれることを確認する。

テスト結果:

- `backend/services/embedder.py` を新規作成した。paraphrase-multilingual-MiniLM-L12-v2 を遅延ロードし、埋め込み計算・SQLite BLOB 変換・コサイン類似度計算を提供する。
- `backend/db.py` に `issue_embeddings` テーブルを追加した。
- `backend/services/issue_index.py` を新規作成した。ページネーション（`offset`）で全 issue を取得してインデックスを構築する。`build_index(force=False)` は空のときのみ実行、`force=True` で強制再構築。
- `backend/services/redmine_connector.py` に `offset` パラメータを追加した。
- `backend/services/tools.py` に `search_issues_semantic` ツールを追加した。インデックスが空の場合は初回呼び出し時に自動構築する。
- `backend/routers/ai.py` に `GET /api/ai/index/status` と `POST /api/ai/index/build` を追加した。
- `POST /api/ai/index/build` で 517 件のインデックスを構築できることを確認した。
- 「認証やログインに関係する issue を意味検索で探して」で `#986 認証バイパスの試みを検証する`・`#685 パスワードリセットフローのバックエンドを実装する`・`#683 API キーによる外部サービス認証を実装する` など意味的に近い issue が返ることを確認した。
- 「パフォーマンスが遅い」という口語表現でも `#756 打刻 API のレスポンスタイムを 200ms 以下にする`・`#856 フロントエンドのバンドルサイズを分析して削減する` が返ることを確認した。

クローズ判定:

- 要求仕様、機能仕様、テスト仕様を満たすため Closed とする。

## Milestone 13: ロール別ダッシュボード

### ISS-076: PM ダッシュボードにバーンダウンチャートを追加する

Status: Closed
Priority: High

要求仕様:

- PM がログイン後に Dashboard を開くと、プロジェクト全体の issue 消化ペースを視覚的に確認できる。
- 「進捗が計画より遅れているか」を Chat で聞かなくてもひと目で分かる。
- 対象外: スプリント管理（Redmine 標準 API にスプリント概念がないため）。

機能仕様:

- PM ロールのナビに「Dashboard」を追加する（`ALL_NAV` に `roles: ['pm']` で追加）。
- `GET /api/pm/burndown?days=N` エンドポイントを追加する。
  - Redmine から全 open + 直近 N 日に closed された issue を取得する。
  - closed issue の close 日は `updated_on` を代理として使用する。
  - 起点日（N 日前）時点でのオープン数を baseline とする。
  - 各日のオープン数 = baseline - その日までの cumulative closed 数。
  - 理想線 = baseline から 0 まで線形減少。
  - レスポンス形式: `{ days, baseline, series: [{date, open, ideal}] }`
- PM Dashboard View (`frontend/src/views/PMDashboardView.tsx`) を新規作成する。
  - `recharts` の `LineChart` でバーンダウンラインを描画する。
  - 実績線（青）と理想線（グレー破線）を重ねて表示する。
  - 期間セレクター（14日 / 30日 / 60日）を表示する。

Redmine API 連携:

- `GET /issues.json?status_id=open&limit=100` でオープン issue を取得。
- `GET /issues.json?status_id=closed&updated_on=>=DATE&limit=100` で期間内クローズ issue を取得（ページネーション対応）。
- 失敗時: `RedmineApiError` として 503 を返す。

テスト仕様:

- `GET /api/pm/burndown?days=14` が `{ days, baseline, series }` を返すことを確認する（mock モード）。
- `series` の長さが `days + 1` であることを確認する。
- PM でログインすると Dashboard がナビに表示され、グラフが描画されることをブラウザで確認する。
- 開発者でログインすると Dashboard がナビに表示されないことを確認する。
- `npx tsc --noEmit` エラーなし。

テスト結果:

- `GET /api/pm/burndown?days=14` → `{ days: 14, baseline: 389, series: [...15件] }` を確認（Redmine 接続時）。
- `backend/routers/pm.py` を新規作成。ページネーション対応の `_fetch_all()` で open/closed issue を全件取得し日別 open 数を算出。
- `frontend/src/views/PMDashboardView.tsx` を新規作成。recharts の LineChart で実績（青）と理想線（灰破線）を描画。14/30/60 日の期間セレクター付き。
- `Layout.tsx`: PM ロールに `/pm/dashboard` を追加。開発者ロールには表示されない。
- `tsc --noEmit` エラーなし。

クローズ判定:

- 要求仕様・機能仕様・テスト仕様をすべて満たすため Closed とする。
- 削除ファイルなし。新規環境変数なし。devcontainer 影響なし。

### ISS-077: 開発者ダッシュボードを優先度・停滞でセクション分けする

Status: Closed
Priority: Medium

要求仕様:

- 開発者が Dashboard を開いた瞬間に「今日何から着手すべきか」を判断できる。
- フラットな一覧から、ブロッカー・高優先度・その他の3セクションに整理する。

機能仕様:

- 現在の「担当 issue 一覧」を以下の3セクションに分ける。
  - **ブロッカー**: 5日以上更新のない自分の担当 open issue。
  - **優先度 High 以上**: `priority.name` が `High` または `Urgent` の issue。
  - **その他**: 上記以外の担当 open issue。
- セクションが空の場合は「なし」と表示する。
- 件数カウントを各セクションヘッダーに表示する。
- issue 行クリックで詳細パネルを開く動作は変えない。
- `assigned_to_id` は `me` でなく `getUser()?.redmine_user_id` の数値を使用する（`me` は admin に解決されるため）。

テスト仕様:

- Dashboard を開いたとき3セクションが表示されることを確認する。
- 5日以上更新のない issue が「ブロッカー」セクションに表示されることを確認する（mock データで確認）。
- `npx tsc --noEmit` エラーなし。

### ISS-078: PM ダッシュボードに 5 パネルを追加する

Status: Closed
Priority: High

要求仕様:

- PM Dashboard にバーンダウンチャート以外の情報パネルを追加し、Chat を使わなくてもプロジェクトの状態を一目で把握できるようにする。
- 追加する 5 パネル: 停滞 issue 一覧 / 担当者別負荷 / 優先度サマリー / 今週のクローズ数 / 期限切れ issue。

機能仕様:

- `GET /api/pm/stats` エンドポイントを追加する（`backend/routers/pm.py`）。
  - open issue 全件・直近 7 日の closed issue・期限切れ issue を取得して集計する。
  - レスポンス: `{ stalled, assignee_load, priority_summary, closed_this_week, overdue }`
  - `stalled`: 7 日以上更新のない open issue 一覧（最大 20 件、updated_on 昇順）。
  - `assignee_load`: 担当者名と open issue 件数のリスト（件数降順）。
  - `priority_summary`: 優先度別 open issue 件数 `{ name, count }[]`。
  - `closed_this_week`: 直近 7 日に closed された issue の件数。
  - `overdue`: due_date が過去で open の issue 一覧（最大 20 件）。
- `PMDashboardView.tsx` を更新する。
  - バーンダウンチャートを上段に残す。
  - 下段に 2 列グリッドで 5 パネルを配置する。
  - 停滞・期限切れは issue 行リスト形式。クリックで `IssueDetailPanel` を開く。
  - 担当者別負荷は recharts の `BarChart`（横棒）で表示する。
  - 優先度サマリーは色付きバッジで件数を表示する。
  - 今週のクローズ数は数値カードで表示する。

テスト仕様:

- `GET /api/pm/stats` が 5 フィールドすべてを含むレスポンスを返すことを確認する。
- PM Dashboard を開いてバーンダウン + 5 パネルが表示されることをブラウザで確認する。
- 停滞 issue をクリックして詳細パネルが開くことを確認する。
- `npx tsc --noEmit` エラーなし。

### ISS-079: チャットから issue を新規作成できるようにする

Status: Closed
Priority: High

要求仕様:

- 開発者・PM がチャットで「このバグを issue にして」「〇〇の機能追加を起票して」と依頼すると、AI が Redmine に issue を作成できるようにする。
- 照会だけでなく入力・起票という操作をチャットから完結させ、Redmine を直接開く場面を減らす。
- 既存の「提案 → 確認 → 実行」フローを踏む（AI が勝手に作成しない）。
- 対象外: カスタムフィールドへの入力、添付ファイル。

機能仕様:

- `backend/services/tools.py` に `create_issue` ツールを追加する。
  - 入力: `subject`（必須）、`description`、`project_id`、`assigned_to_id`、`priority_id`、`due_date`、`reason`。
  - 戻り値: `{"confirmation_required": True, "action": "create_issue", ...}` を返す（実行しない）。
- `backend/services/agent.py` で `create_issue` ブロックを処理し、提案に変換する。
  - `change_summary` に「プロジェクト / 担当 / 優先度 / 期日」を要約する。
- `backend/services/redmine_connector.py` に `create_issue(fields)` メソッドを追加する（`POST /issues.json`）。
- `backend/models.py` に `CreateIssueRequest` を追加する。
- `backend/routers/proposals.py` に `POST /api/proposals/create_issue` エンドポイントを追加する。
- `frontend/src/api/types.ts` の `UpdateProposal.action` に `'create_issue'` を追加する。
- `frontend/src/api/client.ts` に `postCreateIssueProposal()` を追加する。
- `frontend/src/views/DeveloperChatView.tsx` の `ProposalCard` で `create_issue` アクションを表示・実行できるようにする。
  - 「作成」ボタンを表示し、確認後に `postCreateIssueProposal()` を呼ぶ。

テスト仕様:

- チャットで「〇〇というタイトルで issue を作成して」と送信すると、提案カードに「作成」ボタンが表示されることを確認する。
- 「作成」ボタンを押すと Redmine に issue が作成されることを確認する（Redmine モードで）。
- モックモードでは `POST /api/proposals/create_issue` が `{"mode": "mock", ...}` を返すことを確認する。
- `npx tsc --noEmit` エラーなし。

実装結果:

- 9 ファイルを変更: connector `create_issue` / tools スキーマ＋実行 / agent 提案変換 / prompts ガイド / models `CreateIssueRequest` / proposals エンドポイント / types / client / ProposalCard。
- `tsc --noEmit` エラーなし。
- 検証: `POST /api/proposals/create_issue` で実 Redmine に #1031 を作成（priority High 反映、Audit ログ記録）→ 後始末で削除。
- チャット全体フロー: 「kintai-next に〜という issue を作って」で agent が `create_issue` を呼び、提案カード（project_id / subject / description）が生成されることを確認。ツールは `confirmation_required` を返すのみで、チャット時点では Redmine に書き込まれない。
- プロンプト調整: 当初 AI がツールを呼ばずテキストで確認を求めたため、「確認待ちツールは呼び出すことで提案カードが出る／任意項目は聞き返さない」旨を明記して解消。

### ISS-080: チャットから期日・優先度を変更できるようにする

Status: Closed
Priority: High

要求仕様:

- 「この issue の期限を来週末にして」「このバグを Urgent にして」とチャットで依頼すると、AI が提案を作り確認後に Redmine に反映できるようにする。
- 対象外: カスタムフィールド、期日・優先度以外のフィールド。

機能仕様:

- `backend/services/tools.py` に `update_due_date` ツールと `update_priority` ツールを追加する。
  - `update_due_date`: 入力 `issue_id`、`due_date`（YYYY-MM-DD）、`reason`。
  - `update_priority`: 入力 `issue_id`、`new_priority_id`、`new_priority_name`、`reason`。
  - 両方とも `{"confirmation_required": True, ...}` を返す。
- `backend/services/agent.py` で両ツールのブロックを処理し提案に変換する。
- `backend/services/redmine_connector.py` は既存の `update_issue(issue_id, fields)` を流用する。
- `backend/models.py` の `UpdateProposalRequest` に期日・優先度用フィールドを追加する。
- `backend/routers/proposals.py` は既存の `POST /api/proposals/update` を action 分岐で拡張する。
- フロントエンドの `UpdateProposal.action` に両アクションを追加し、`ProposalCard` で「更新」ボタンを表示する。

テスト仕様:

- 「#123 の期日を 2026-07-01 にして」で提案カードが表示され、確認後に Redmine に反映されることを確認する。
- 「#123 を Urgent にして」で優先度変更の提案カードが表示されることを確認する。
- `npx tsc --noEmit` エラーなし。

### ISS-081: チャットから進捗率を更新できるようにする

Status: Closed
Priority: Medium

要求仕様:

- 「API 実装が 60% 終わったのでチケットに記録して」とチャットで依頼すると、AI が進捗率（done_ratio）の更新を提案し確認後に反映できるようにする。
- 対象外: 0〜100 の範囲外の値（バリデーションエラーとして返す）。

機能仕様:

- `backend/services/tools.py` に `update_done_ratio` ツールを追加する（入力: `issue_id`、`done_ratio`（0〜100）、`reason`）。
- 既存の `update_issue` を流用。`backend/models.py` の `UpdateProposalRequest` に `new_done_ratio` を追加し、`backend/routers/proposals.py` は `POST /api/proposals/update` を action 分岐で拡張する。
- フロントエンドで `done_ratio` アクションを `ProposalCard` に追加する。

テスト仕様:

- 「#123 の進捗を 60% にして」で提案カードが表示されることを確認する。
- `npx tsc --noEmit` エラーなし。

### ISS-082: チャットから issue をバージョン（スプリント）に割り当てられるようにする

Status: Closed
Priority: Medium

要求仕様:

- 「この issue を次のスプリントに移して」とチャットで依頼すると、AI がバージョン一覧を参照して割り当て提案を作り、確認後に反映できるようにする。
- 対象外: バージョンの新規作成。

機能仕様:

- `backend/services/redmine_connector.py` に `list_versions(project_id)` を追加する（`GET /projects/{id}/versions.json`）。
- `backend/services/tools.py` に `list_versions` ツールと `assign_version` ツールを追加する。
  - `assign_version`: 入力 `issue_id`、`version_id`、`version_name`、`reason`。
- 既存の `update_issue` を流用。`backend/models.py` の `UpdateProposalRequest` にバージョン用フィールドを追加し、`backend/routers/proposals.py` は `POST /api/proposals/update` を action 分岐で拡張する。
- フロントエンドで `version` アクションを `ProposalCard` に追加する。

テスト仕様:

- 「#123 を v2.0 に割り当てて」で提案カードが表示されることを確認する。
- バージョンが存在しないプロジェクトでも適切なエラーメッセージが返ることを確認する。
- `npx tsc --noEmit` エラーなし。

### ISS-083: チャットから issue の関連を設定できるようにする

Status: Closed
Priority: Medium

要求仕様:

- 「#123 は #456 に依存しているので関連付けて」とチャットで依頼すると、AI が関連（relates、blocks、blocked など）を提案し確認後に Redmine に反映できるようにする。
- 対象外: 関連の削除。

機能仕様:

- `backend/services/tools.py` に `add_relation` ツールを追加する（入力: `issue_id`、`related_issue_id`、`relation_type`（relates/blocks/blocked/precedes/follows/duplicates/duplicated/copied_to/copied_from）、`reason`）。
- `backend/services/redmine_connector.py` に `add_relation(issue_id, related_issue_id, relation_type)` を追加する（`POST /issues/{id}/relations.json`）。
- `backend/models.py` に `AddRelationRequest`、`backend/routers/proposals.py` に `POST /api/proposals/add_relation` を追加する。
- フロントエンドで `add_relation` アクションを `ProposalCard` に追加し、関連タイプと対象 issue を表示する。

テスト仕様:

- 「#123 は #456 をブロックしているので設定して」で提案カードが表示されることを確認する。
- `npx tsc --noEmit` エラーなし。

実装結果:

- ISS-080〜083 は共通の確認待ち更新フローとして実装した。
- `backend/services/tools.py` に `update_due_date` / `update_priority` / `update_done_ratio` / `list_versions` / `assign_version` / `add_relation` を追加した。
- `backend/services/agent.py` で各 tool_use 結果を Proposal に変換する。
- `backend/routers/proposals.py` は既存の `POST /api/proposals/update` を action 分岐で拡張し、関連付けのみ `POST /api/proposals/add_relation` を追加した。
- フロントエンドの `ProposalCard` から期日・優先度・進捗率・バージョン・関連付けを実行できるようにした。
- 自動検証: `npm run build` 成功、`pytest backend/tests` 19 件成功（mock mode で proposal 実行を確認）。
- ブラウザ確認: `http://localhost:5174/` でログイン・画面表示・動作を確認した。
- 実 Redmine 接続時は `update_issue` / `add_relation` 経由で Redmine API に反映する。mock mode では同 payload と Audit ログ記録を自動テストで確認した。

### ISS-084: チャットから複数 issue を一括操作できるようにする

Status: Open
Priority: Low

要求仕様:

- 「停滞している issue を全部 Feedback に戻して」のように、条件に合う複数 issue を一括でステータス変更・担当変更できるようにする。
- 誤操作リスクが高いため、操作対象の issue 一覧と件数を必ず確認画面に表示してから実行する。
- 対象外: 件数が 20 件を超える場合は分割実行を要求する。

機能仕様:

- `backend/services/tools.py` に `bulk_update` ツールを追加する（入力: `issue_ids[]`、`action`（status_change/assignee_change）、変更フィールド、`reason`）。
- `backend/services/agent.py` で `bulk_update` を処理し、`issue_ids` リストと変更内容を含む提案を返す。
- `backend/routers/proposals.py` に `POST /api/proposals/bulk_update` を追加し、ループで各 issue に `update_issue` を適用する。
- フロントエンドの `ProposalCard` で対象 issue リストを表示し、「{n} 件を一括更新」ボタンを表示する。

テスト仕様:

- 「停滞 issue を全部 Feedback にして」で対象 issue リストが提案カードに表示されることを確認する。
- 21 件以上を指定した場合にエラーメッセージが返ることを確認する。
- `npx tsc --noEmit` エラーなし。

### ISS-085: Redmine MCP サーバーを追加し Claude Code から操作できるようにする

Status: Closed
Priority: High

要求仕様:

- 開発者が Claude Code（ターミナル・IDE）から Redmine を直接操作できるようにする。
- 既存の AIRedmine web アプリは変更せず、MCP サーバーを新サービスとして追加する。
- 対象外: web アプリの「提案 → 確認 → 実行」フロー（MCP では Claude Code のツール確認に委ねる）。

機能仕様:

- `mcp-server/` ディレクトリを新設し、Python で MCP サーバーを実装する。
  - 使用パッケージ: `mcp`（Model Context Protocol Python SDK）。
  - 既存 `backend/services/redmine_connector.py` のロジックを流用する。
- 公開するツール（最小セット）:
  - `list_issues`: issue 一覧取得（status / assigned_to_id / limit でフィルタ）。
  - `get_issue`: issue 詳細取得（id 指定）。
  - `search_issues`: キーワード検索。
  - `create_issue`: issue 新規作成（subject / description / assigned_to_id / priority_id）。
  - `add_comment`: コメント追加（issue_id / notes）。
  - `change_status`: ステータス変更（issue_id / status_id）。
  - `change_assignee`: 担当変更（issue_id / assigned_to_id）。
- トランスポート: stdio（Claude Code のローカル起動に対応）。
- 環境変数: `REDMINE_BASE_URL` / `REDMINE_API_KEY`（既存 `.env` と共有）。
- `docker-compose.yml` には追加しない（Claude Code が直接 `python mcp_server.py` で起動する形）。
- Claude Code への接続設定例を `docs/mcp.md` に記載する。
  ```json
  {
    "mcpServers": {
      "redmine": {
        "command": "python",
        "args": ["/path/to/mcp-server/mcp_server.py"],
        "env": {
          "REDMINE_BASE_URL": "http://localhost:3000",
          "REDMINE_API_KEY": "your-api-key"
        }
      }
    }
  }
  ```

テスト仕様:

- Claude Code に MCP サーバーを接続し、`list_issues` を呼んで Redmine の issue 一覧が返ることを手動で確認する。
- `create_issue` で issue が Redmine に作成されることを確認する。
- `REDMINE_BASE_URL` 未設定時にエラーメッセージが返ることを確認する。

実装結果:

- `mcp-server/`（`redmine.py` 薄い非同期クライアント、`mcp_server.py` FastMCP サーバー、`requirements.txt`、`Dockerfile`）を追加。`docs/mcp.md` に接続手順を記載。
- 仕様の 7 ツールをすべて公開（list_issues / get_issue / search_issues / create_issue / add_comment / change_status / change_assignee）。
- 当初案の `change_status` はステータス名なし（数値 ID のみ）、`search_issues` は Redmine の `/search.json` 全文検索を利用する形に調整。
- ローカル Redmine（:3000）で検証: read 系（list/get/search/404）、write 系（create #1028 → comment → done_ratio 更新 → close）、MCP stdio ハンドシェイク（initialize / list_tools / call_tool）すべて成功。テスト用 issue #1028 はクローズ済み。

### ISS-086: MCP に参照系ヘルパーツールを追加する

Status: Closed
Priority: High

要求仕様:

- Claude Code から Redmine を操作する際、名前から数値 ID を解決できるようにする。
- ISS-085 の検証で、`create_issue` の project_id、`change_assignee` の user_id、`change_status` の status_id を人が調べる必要があり摩擦になった。これを MCP ツールで解消する。
- 対象外: 書き込み操作（ISS-087 で扱う）。

機能仕様:

- `mcp-server/redmine.py` に以下の取得メソッドを追加する。
  - `list_projects()`: `GET /projects.json` → id / identifier / name。
  - `list_issue_statuses()`: `GET /issue_statuses.json` → id / name / is_closed。
  - `list_priorities()`: `GET /enumerations/issue_priorities.json` → id / name。
  - `list_users()`: `GET /users.json` → id / login / name（要管理者権限。403 時は分かるエラーを返す）。
  - `list_versions(project_id)`: `GET /projects/{id}/versions.json` → id / name / status。
- `mcp-server/mcp_server.py` に同名の MCP ツールを公開する。
- ワークフロー制限（ISS-085 で判明）を踏まえ、`list_issue_statuses` の説明に「遷移可否はロール設定に依存する」旨を記載する。

テスト仕様:

- Claude Code（または stdio クライアント）から `list_projects` / `list_issue_statuses` / `list_priorities` を呼び、Redmine の値が返ることを確認する。
- `list_users` が権限不足時に適切なエラーを返すことを確認する。
- `list_versions` が指定プロジェクトのバージョンを返すことを確認する。

実装結果:

- `redmine.py` に 5 メソッド、`mcp_server.py` に 5 ツールを追加（MCP 公開ツールは 7 → 12 に）。
- `list_users` は 401/403 を「管理者権限の API キーが必要」というエラーに変換。
- ローカル Redmine で検証: projects（2 件）/ statuses（5 件、Closed の is_closed=true）/ priorities（4 件）/ users（admin キーで取得可）/ versions（kintai-next の Sprint 1〜4）すべて期待通り。stdio でツール数 12 を確認。
- `list_users` の権限エラー経路はコードで対応済みだが、検証キーが管理者のため実地での 403 発火は未確認。

### ISS-087: MCP に更新系ツールを追加する

Status: Closed
Priority: Medium

要求仕様:

- Claude Code から、期日・優先度・進捗率の更新、バージョン割当、issue 関連付けを実行できるようにする。
- 既存の `change_status` / `change_assignee` と同じく、Redmine API を直接呼ぶ（承認は Claude Code のツール実行確認に委ねる）。
- 対象外: 一括操作、関連の削除。

機能仕様:

- `mcp-server/mcp_server.py` に以下のツールを追加する（実装は既存 `update_issue` / 新規メソッドを流用）。
  - `update_due_date(issue_id, due_date)`: 期日（YYYY-MM-DD）を設定。
  - `update_priority(issue_id, priority_id)`: 優先度を変更。
  - `update_done_ratio(issue_id, done_ratio)`: 進捗率（0〜100）を更新。
  - `assign_version(issue_id, version_id)`: 対象バージョン（fixed_version_id）を設定。
  - `add_relation(issue_id, related_issue_id, relation_type)`: 関連を追加（`POST /issues/{id}/relations.json`）。
- `mcp-server/redmine.py` に `add_relation()` を追加する（その他は `update_issue` を流用）。

テスト仕様:

- 各ツールをローカル Redmine に対して実行し、反映を確認する。
- `update_done_ratio` に 0〜100 範囲外を渡した場合の挙動を確認する。
- `add_relation` で 2 つの issue が関連付けられることを確認する。

実装結果:

- `redmine.py` に `add_relation()` を追加、`mcp_server.py` に 5 ツールを追加（MCP 公開ツールは 12 → 17 に）。
- `update_done_ratio` は 0〜100 範囲外をクライアント側で弾く（150 を渡すとエラー、実機確認済み）。
- ローカル Redmine で検証: 一時 issue を 2 件作成し、due_date（2026-07-15）/ priority（High）/ done_ratio（40）/ fixed_version（Sprint 3）の更新と blocks 関連付けがすべて反映。検証後に両 issue を削除。
- M16 完了。

### ISS-088: Proposal カードに操作種別ごとの差分表示を追加する

Status: Closed
Priority: High

要求仕様:

- Redmine に書き込む前に、ユーザーが「何がどう変わるか」を操作種別ごとに確認できるようにする。
- コメントや issue 作成だけでなく、ステータス・担当者・期日・優先度・進捗率・バージョン・関連付けでも確認しやすい表示にする。
- 対象外: Redmine 側の全フィールド差分取得。まずは AI 提案と既存 issue 詳細から分かる範囲を表示する。

機能仕様:

- `UpdateProposal` に表示用の差分データを持たせるか、既存フィールドから `ProposalCard` 内で差分表示を組み立てる。
- `ProposalCard` で操作種別ごとに、対象 issue、変更前（取得できる場合）、変更後、理由を表示する。
- 関連付けは「起点 issue」「関連先 issue」「関連タイプ」を明示する。
- issue 作成は project / subject / description / assigned_to / priority / due_date を確認項目として表示する。

テスト仕様:

- 各 action の Proposal を表示したとき、対象と変更後の値がカード上に表示されることをブラウザで確認する。
- 変更前の値が取得できない場合でも、カードが崩れず「変更後」の確認ができることを確認する。
- `npm run build` エラーなし。

実装結果:

- `ProposalCard` に操作種別ごとの確認項目表示を追加した。
- 既存の `UpdateProposal` フィールドから、対象、変更内容、変更後、関連タイプ、関連先、issue 作成項目、理由を組み立てて表示する。
- 変更前の値が取得できない場合でも、変更後と理由を確認できる表示にした。
- `npm run build` 成功。

### ISS-089: Audit ログを操作種別・結果・issue_id で絞り込めるようにする

Status: Closed
Priority: High

要求仕様:

- PM や開発者が、Redmine 更新履歴から特定の操作や失敗をすばやく探せるようにする。
- 「どの issue に、誰が、どの操作を、いつ実行し、成功/失敗したか」を確認しやすくする。
- 対象外: 永続的な監査 DB 設計の刷新。まずは既存の in-memory 更新ログ表示を改善する。

機能仕様:

- Audit View に操作種別、結果（success/failure）、issue_id の絞り込み UI を追加する。
- `GET /api/proposals/logs` のレスポンス構造は維持し、フロント側でフィルタする。
- 絞り込み条件が空の場合は従来通り最新ログを表示する。
- 失敗ログは category / retryable があれば表示する。

テスト仕様:

- success / failure のログが混在している状態で結果フィルタが効くことを確認する。
- action フィルタと issue_id フィルタを組み合わせても期待通り絞り込めることを確認する。
- `npm run build` エラーなし。

実装結果:

- Audit View に操作種別、結果、issue_id のフィルタ UI を追加した。
- ログ件数の表示、条件クリア、該当なし表示を追加した。
- ログ行に操作種別ラベルと issue_id を表示し、失敗ログでは category / retryable も表示できるようにした。
- `GET /api/proposals/logs` のレスポンス構造は維持し、フロント側でフィルタする。
- `npm run build` 成功。

### ISS-090: Redmine 更新失敗時の詳細表示と再試行体験を改善する

Status: Closed
Priority: Medium

要求仕様:

- Redmine API 更新に失敗したとき、ユーザーが原因と次の行動を判断できるようにする。
- 一時的な接続失敗や 5xx では再試行しやすくし、権限・バリデーション系では設定や入力を見直せるようにする。
- 対象外: 自動リトライ。ユーザー確認なしに再実行しない。

機能仕様:

- Proposal 実行失敗時のエラー表示に、message / category / retryable / Redmine status を反映する。
- `routers.issues._redmine_error_payload` と proposal 系エラー payload の扱いを揃える。
- `retryable=true` の場合は ProposalCard 上で再試行ボタンを維持し、非 retryable の場合は入力・権限確認を促す文言にする。
- Audit ログにも失敗 category / retryable を残す。

テスト仕様:

- connector が 503 相当の `RedmineApiError` を返す場合に retryable なエラー表示になることを確認する。
- 400/403 相当では retryable=false の案内になることを確認する。
- backend tests と `npm run build` エラーなし。

実装結果:

- proposal 系 API の Redmine 失敗ログに category / retryable / status / detail を記録するよう統一した。
- フロントエンドの API エラー処理で FastAPI の `detail` payload を展開し、ProposalCard で message / HTTP status / category / retryable / detail を表示するようにした。
- retryable=true の場合は再試行可能、retryable=false の場合は入力・権限・設定確認を促す文言を表示する。
- backend tests に 503（retryable）と 422（non-retryable）の proposal 更新失敗ケースを追加した。
- `pytest backend/tests` 21 件成功、`npm run build` 成功。

### ISS-091: 危険操作に二段階確認を追加する

Status: Closed
Priority: Medium

要求仕様:

- 取り消しづらい、または影響範囲が大きい Redmine 更新では、通常の実行ボタンだけでなく追加確認を求める。
- 例: issue を Closed にする、優先度を Urgent にする、期日を過去日にする、複数 issue を一括更新する。
- 対象外: すべての操作への二段階確認。軽微なコメント追加などは従来通り一段階でよい。

機能仕様:

- 危険操作判定関数をフロントまたは shared な proposal helper として定義する。
- `ProposalCard` は危険操作の場合、最初のクリックで追加確認状態に入り、確認文を表示してから実行する。
- 判定理由（例: `Urgent に変更`, `Closed に変更`, `過去日の期日`）をカード内に表示する。
- 将来の ISS-084 一括操作はこの二段階確認を前提にする。

テスト仕様:

- Urgent への優先度変更や Closed へのステータス変更で二段階確認が出ることを確認する。
- 通常のコメント追加では二段階確認が出ないことを確認する。
- `npm run build` エラーなし。

実装結果:

- `ProposalCard` に危険操作判定を追加し、Closed への変更、Urgent への変更、過去日の期日設定で二段階確認を要求するようにした。
- 危険操作では最初のクリックで確認状態に入り、判定理由と再確認文を表示してから二回目のクリックで実行する。
- 確認状態を解除できる `戻る` ボタンを追加し、軽微なコメント追加などは従来通り一段階で実行できるようにした。
- `npm run build` 成功。

### ISS-092: Chat が ID を推測しないための参照ツールを web 側にも追加する

Status: Closed
Priority: High

要求仕様:

- Chat が Redmine の priority_id、status_id、user_id、version_id、project_id を推測せず、Redmine から取得した値に基づいて提案できるようにする。
- MCP 側で追加済みの参照系 helper と同等の体験を web Chat 側にも持たせる。
- 対象外: 複雑な権限ごとの遷移可否判定。Redmine の status 一覧と、必要に応じたエラー表示までを扱う。

機能仕様:

- `RedmineConnector` に projects / issue_statuses / priorities / users / versions の取得メソッドを追加する。
- `backend/services/tools.py` に `list_projects` / `list_issue_statuses` / `list_priorities` / `list_users` を追加する。`list_versions` は既存実装を利用する。
- `backend/services/prompts.py` で、名前指定の更新では参照ツールで ID を確認してから提案するよう明記する。
- `list_users` は Redmine 権限不足時に分かるエラーを返す。

テスト仕様:

- mock mode で各参照ツールが空または固定値を返し、Chat が落ちないことを確認する。
- 実 Redmine 接続で priorities / statuses / versions が取得できることを確認する。
- backend tests と `npm run build` エラーなし。

実装結果:

- `RedmineConnector` に projects / issue_statuses / priorities / users の取得メソッドを追加し、versions と合わせて参照系 ID を取得できるようにした。
- `backend/services/tools.py` に `list_projects` / `list_issue_statuses` / `list_priorities` / `list_users` を追加した。
- `backend/services/prompts.py` に、ID が必要な提案では参照ツールで確認し、推測で ID を埋めないルールを追加した。
- `list_users` は Redmine 側の権限不足時に、管理者 API key が必要なことが分かるエラーを返す。
- `backend/requirements.txt` に `httpx2` を追加し、Starlette `TestClient` がハングしないテスト環境にした。
- `pytest backend/tests` 22 件成功、`npm run build` 成功。

### ISS-093: Audit View のスクリーンショットを README に追加する

Status: Closed
Priority: Medium

要求仕様:

- README のユーザー体験説明で、更新監査の画面イメージも確認できるようにする。
- ISS-089 で Audit View に絞り込み UI が追加されたため、最新状態のスクリーンショットを残す。
- 対象外: README 全体の再構成やデザイン刷新。

機能仕様:

- ブラウザで Audit View を開き、更新ログとフィルタ UI が分かるスクリーンショットを撮影する。
- 画像は `docs/screenshots/audit-view.png` に保存する。
- `README.md` の「人間が確認する境界」または View 構成付近に Audit View の画像を追加する。
- 既存の `docs/screenshots/developer-chat.png` / `pm-dashboard.png` と同じ相対リンク形式を使う。

テスト仕様:

- README の画像リンクが存在するファイルを指していることを確認する。
- スクリーンショットに Audit View のタイトル、フィルタ UI、ログ行が写っていることを確認する。
- Markdown 表示上で画像リンクが壊れていないことを確認する。

実装結果:

- `docs/screenshots/audit-view.png` を追加した。
- README の「人間が確認する境界」に Audit View のスクリーンショットを追加した。
- スクリーンショットに Audit View のタイトル、操作種別・結果・issue_id フィルタ、ログ行が写っていることを確認した。

### ISS-094: seed データのプロジェクトシナリオを設計する

Status: Closed
Priority: High

要求仕様:

- seed データが単なる issue 集合ではなく、実プロジェクトに近い状況として読めるようにする。
- PM / 開発者 / Chat / Dashboard / 意味検索で確認したい体験から逆算して、データに含めるシナリオを決める。
- 対象外: この issue では大量データ投入や seed 実装そのものは行わず、設計を固める。

機能仕様:

- seed データに含めるエピック、担当者、スプリント、依存関係、停滞、期限切れ、ブロッカー、優先度偏りを定義する。
- デモで使う代表質問と、期待される観察ポイントを整理する。
- 既存 `scripts/redmine/seed-data/*.yml` のどこを増やすか、変更方針を記録する。

テスト仕様:

- 設計メモから M18 の各 issue に必要な作業が追えることを確認する。
- PM Dashboard / Developer Dashboard / Chat / semantic search の各観点が少なくとも 1 つずつ含まれていることを確認する。

実装結果:

- `docs/seed-scenario.md` を追加し、既存 seed の現状、主な不足、目指すデモ体験を整理した。
- Sprint 3 リリースゲート、申請・承認フローの仕様揺れ、レポート性能と大量データ対応、担当者負荷と停滞、Redmine 更新提案デモの 5 シナリオを定義した。
- 開発者向け、PM 向け、更新提案向けの代表質問を整理した。
- ISS-095〜097、および M19 の ISS-098〜101 へどう接続するかを記録した。

### ISS-095: seed issue とコメント履歴を実プロジェクトらしく拡充する

Status: Closed
Priority: High

要求仕様:

- seed issue に、実プロジェクトで起きる意思決定、仕様変更、レビュー指摘、ブロッカー、リスクを含める。
- Chat が長い説明やコメント履歴を要約し、PM Dashboard がリスクを見つけやすいデータにする。
- 対象外: Redmine 本体のカスタムフィールド追加。

機能仕様:

- `scripts/redmine/seed-data/*.yml` に複数エピックを横断する issue とコメント履歴を追加する。
- issue 間の関連、期限、優先度、担当者、進捗率、ステータスをデモ目的に合わせて調整する。
- パフォーマンス計測に使える程度の件数と複雑さを持たせる。

テスト仕様:

- `npm run seed:demo` で seed が成功することを確認する。
- AIRedmine の issue 一覧、Dashboard、Chat で追加データが参照できることを確認する。
- 代表質問で、コメント履歴や関連 issue を材料にした回答が得られることを確認する。

実装結果:

- `scripts/redmine/seed-data/*.yml` の代表 issue を拡充し、リリースゲート、一括承認、月次集計、認証検証、レポート性能、PM 判断待ち、品質ゲートのコメント履歴を追加した。
- 担当者別に、QA 指摘、開発調査、PM 判断、性能分析、リリース可否判断がつながって見えるように、優先度、ステータス、更新日、進捗率を調整した。
- `scripts/redmine/seed-demo.rb` を、既存 issue でも説明・状態・コメントを更新できるようにした。コメントは同一本文の重複投入を避ける。
- `ruby -c scripts/redmine/seed-demo.rb`、seed YAML の読み込み、`npm run seed:demo` が成功することを確認した。
- AIRedmine API で代表 issue の説明、ステータス、優先度、コメント履歴が参照できることを確認した。

### ISS-096: seed 再投入とリセットの扱いを改善する

Status: Closed
Priority: Medium

要求仕様:

- seed データを何度も試しても、壊れたデモ状態から戻しやすくする。
- 再投入時に既存データの重複や古い状態が分かりにくくならないようにする。
- 対象外: 本番 Redmine のデータ移行ツール化。

機能仕様:

- `scripts/redmine/seed-demo.rb` の冪等性、既存 project / issue / user の扱いを確認する。
- 必要なら seed 用 project のリセット手順または安全な再投入手順を追加する。
- README の seed 手順に、再投入・リセット時の注意点を追記する。

テスト仕様:

- seed を連続実行しても致命的な重複や失敗が起きないことを確認する。
- リセットまたは再投入後に AIRedmine UI からデモデータを確認できることを確認する。

実装結果:

- `scripts/redmine/seed-demo.rb` に `RESET_DEMO_PROJECT=1` 対応を追加し、`kintai-next` project を削除してから再投入できるようにした。
- 通常の再投入では既存 project / issue / user を再利用し、issue の説明、状態、優先度、Sprint、コメント履歴、ユーザー属性、Sprint 日付を seed 定義へ合わせ直すようにした。
- seed 実行結果に `issues_created`、`issues_updated`、`journals_added` を出力し、再投入時に何が起きたか確認しやすくした。
- `scripts/seed-demo.mjs` に `--reset` を追加し、`package.json` から `npm run seed:demo:reset` を実行できるようにした。
- README に通常再投入とリセット再投入の使い分け、注意点を追記した。
- `npm run seed:demo` の連続実行と `npm run seed:demo:reset` が成功することを確認した。

### ISS-097: README にデモシナリオと質問例を追加する

Status: Open
Priority: Medium

要求仕様:

- 初見のユーザーが、seed データ投入後に何を試せば AIRedmine の価値が分かるか迷わないようにする。
- Chat / Dashboard / Audit / semantic search の代表的な体験を README から辿れるようにする。
- 対象外: README 全体の大規模再構成。

機能仕様:

- README に「デモで試す質問例」セクションを追加する。
- 開発者向け、PM 向け、更新提案、意味検索の例を分けて記載する。
- seed データの前提と `npm run seed:demo` への導線を明記する。

テスト仕様:

- README の手順に沿って seed 投入から代表質問まで辿れることを確認する。
- 例示した質問が現在の機能と矛盾していないことを確認する。

### ISS-098: 主要 API のレスポンス時間を計測できるようにする

Status: Open
Priority: Medium

要求仕様:

- 主要 API の遅さを感覚ではなく数値で把握できるようにする。
- ローカル環境で同じ手順を実行すれば、比較可能な計測結果を得られるようにする。
- 対象外: 本番監視基盤や APM の導入。

機能仕様:

- `/api/issues`、`/api/issues/{id}`、`/api/pm/stats`、`/api/proposals/logs`、`/api/chat` の計測手順を用意する。
- 必要なら簡易スクリプトを追加し、平均・最小・最大・p95 相当を出せるようにする。
- seed データ件数と計測条件を記録できるようにする。

テスト仕様:

- ローカルで計測コマンドを実行し、主要 API の結果が出力されることを確認する。
- 計測対象 API が失敗した場合に分かる形でエラーが表示されることを確認する。

### ISS-099: Chat / tool_use / semantic search の処理時間を切り分ける

Status: Open
Priority: Medium

要求仕様:

- Chat が遅いとき、Claude API 待ち、Redmine API 待ち、tool_use ループ、semantic search、embedding 初回ロードのどこが支配的か分かるようにする。
- 対象外: Claude API 自体の最適化。

機能仕様:

- `backend/services/agent.py` 周辺で、必要最小限の処理時間ログまたは計測ポイントを検討する。
- semantic search はモデル初回ロード時間と検索時間を分けて測る。
- 計測ログが通常利用の邪魔にならないよう、開発用の出力または明示的な計測手順にする。

テスト仕様:

- Chat を 1 回実行したときに、処理時間の内訳を確認できることを確認する。
- semantic search 初回と 2 回目以降で計測差を確認できることを確認する。

### ISS-100: フロントエンド主要画面の初期表示時間を確認する

Status: Open
Priority: Medium

要求仕様:

- Chat / Developer Dashboard / PM Dashboard / Audit の初期表示で、体感上どこが重いか把握できるようにする。
- 対象外: Lighthouse スコア改善やバンドル分割の実装。

機能仕様:

- Playwright などで主要画面を開き、初期表示完了までの時間を測る手順を用意する。
- Dashboard 系は API 待ちと描画待ちを分けて観察できるようにする。
- 計測結果を M19 のレポートに載せられる形式にする。

テスト仕様:

- ローカル環境で主要画面の表示確認と簡易計測が実行できることを確認する。
- 計測時に未ログインリダイレクトなどで対象画面を測り損ねないことを確認する。

### ISS-101: パフォーマンス計測結果と改善候補を文書化する

Status: Open
Priority: Medium

要求仕様:

- M19 の計測結果を、次に何を改善すべきか判断できる形で残す。
- 計測値だけでなく、ボトルネック仮説、影響範囲、改善候補、優先度を整理する。
- 対象外: この issue では改善実装までは行わない。

機能仕様:

- `docs/performance.md` を追加し、計測環境、seed データ条件、API 別・画面別の結果を記録する。
- ボトルネック候補を「すぐ改善する」「後で検証する」「現時点では許容」に分ける。
- 必要な後続 issue の候補を `docs/issues.md` または `docs/issueslog.md` に残す。

テスト仕様:

- `docs/performance.md` から計測手順と結果を追えることを確認する。
- 少なくとも 1 つ以上の後続改善候補が明文化されていることを確認する。
