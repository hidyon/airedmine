# Issues

このファイルでは Airedmaine の開発 issue を管理する。
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

- Airedmaine が何を体験させるアプリなのかを README に明記する。
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

- `.env` 未設定でも、Airedmaine の狙いが伝わる Redmine プロジェクト体験を再現できる。

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

Status: Open
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

### ISS-003: PM 向けのプロジェクト観察ビューを設計する

Status: Open
Priority: High

要求仕様:

- PM が AI エージェント経由でプロジェクトの詰まりやリスクを把握できる。

機能仕様:

- 停滞 issue、担当者ごとの負荷、優先度の偏り、未更新 issue を表示する。
- PM が確認すべき観点を短く提示する。

テスト仕様:

- モックデータでリスク候補が表示されることを確認する。
- 表示が Redmine の元データと対応していることを確認する。

### ISS-004: Redmine 更新前の確認フローを検討する

Status: Open
Priority: Medium

要求仕様:

- AI エージェントが Redmine を更新する前に、人間が意図と差分を確認できる。

機能仕様:

- コメント追加、ステータス変更、担当変更の候補を扱う。
- 実行前に変更内容、理由、影響範囲を表示する。
- キャンセルできる。

テスト仕様:

- モック更新で確認画面が出ることを確認する。
- API 失敗時にユーザーへ分かるエラーを表示する。

### ISS-005: 自然言語対話の入口を設計する

Status: Open
Priority: High

要求仕様:

- 開発者や PM が Redmine と知識ベースについて自然言語で質問できる。
- 対話で得た回答から、根拠確認や Redmine 更新案の確認に進める。

機能仕様:

- Browser UI とは別に Chat UI または対話入力欄を用意する。
- 対話は Redmine issue と `docs/` 配下の知識ベースを参照できる。
- Redmine 更新は対話から直接実行せず、更新案として作成する。

テスト仕様:

- モックデータで「今日まず何からやればいい？」に回答できることを確認する。
- 回答に根拠となる issue または docs の参照が含まれることを確認する。
- 更新系の依頼が直接実行されず、確認待ちの提案になることを確認する。

### ISS-006: devcontainer / Docker Compose で OSS 版 Redmine 検証環境を作る

Status: Open
Priority: Medium

要求仕様:

- 開発者や PM がローカルで Airedmaine と無料で利用できる OSS 版 Redmine を試せる。
- Redmine API 連携を実データに近い形で検証できる。

機能仕様:

- devcontainer または Docker Compose の構成を追加する。
- OSS 版 Redmine と database を起動できる。
- Airedmaine からローカル Redmine に接続する `.env` 設定例を用意する。

テスト仕様:

- Docker Compose または devcontainer で環境が起動することを確認する。
- Redmine にログインし、REST API を有効化できることを確認する。
- Airedmaine がローカル Redmine の issue を取得できることを確認する。

### ISS-008: Redmine issue 取得 API を Connector として分離する

Status: Open
Priority: Medium

要求仕様:

- 今後 journal、project、wiki などを増やせるように Redmine 連携を整理する。

機能仕様:

- `src/server/index.js` から Redmine API 呼び出しを Redmine Connector に分離する。
- issue 取得をアプリ内の共通モデルに変換する。
- モックデータも同じ形で扱えるようにする。

テスト仕様:

- モック時と Redmine 接続時で `/api/issues` のレスポンス互換性を確認する。
- 既存 UI のチケット一覧、検索、状態フィルタが壊れないことを確認する。

### ISS-009: PM が全体状態をざっくり把握できるサマリを追加する

Status: Open
Priority: High

要求仕様:

- PM がプロジェクト全体の未完了数、優先度、停滞候補を一目で把握できる。

機能仕様:

- ステータス別件数、優先度別件数、更新が古い issue 数を表示する。
- PM が確認すべき観点を短く表示する。

テスト仕様:

- モックデータで件数と停滞候補が期待通り表示されることを確認する。
- 検索や状態フィルタと矛盾しない表示になることを確認する。

### ISS-011: README にローカル Redmine 接続手順を追加する

Status: Open
Priority: Medium

要求仕様:

- OSS 版 Redmine を使って試す流れが README だけで分かる。

機能仕様:

- Redmine REST API 有効化、API キー取得、`.env` 設定、起動確認を記載する。
- Docker Compose 実装前でも、外部 Redmine または手元の Redmine に接続できる情報を用意する。

テスト仕様:

- README の手順に必要な設定項目が揃っていることを確認する。
- `.env.example` と README の環境変数名が一致していることを確認する。
