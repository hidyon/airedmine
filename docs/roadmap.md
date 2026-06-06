# Roadmap

AIRedmine は、AI エージェントを通じて Redmine を利用する開発体験を探索するためのアプリである。
ロードマップは「Redmine クライアントを作る」ではなく、「開発者や PM の体験変化を観察できるプロトタイプを育てる」ことを軸に管理する。

## 目的

Redmine を活用したプロジェクトにおいて、開発者や PM が AI エージェント経由で Redmine を使うと、開発体験がどう変わるかを明らかにする。

特に次を観察する。

- 情報収集の負担がどれだけ減るか。
- issue の優先順位や次アクションを決めやすくなるか。
- PM がプロジェクトのリスクや詰まりを早く見つけられるか。
- ブラウザー UI と自然言語対話を組み合わせることで、探索、要約、確認、承認がどう変わるか。
- AI が Redmine を更新する場合、人間の確認がどこに必要か。
- Redmine に蓄積された情報の品質が、AI 活用でどう重要になるか。

## Milestone 1: Redmine 情報を体験できる入口

優先度: High
状態: Completed

関連 issue:

- `ISS-001` Closed: アプリの目的と共同開発ループを文書化する。
- `ISS-007` Closed: Redmine 接続状態と初期セットアップ導線を改善する。
- `ISS-008` Closed: Redmine issue 取得 API を Connector として分離する。
- `ISS-009` Closed: PM が全体状態をざっくり把握できるサマリを追加する。
- `ISS-010` Closed: モックデータを体験説明用に拡充する。
- `ISS-011` Closed: README にローカル Redmine 接続手順を追加する。

期待成果:

- Redmine の issue を取得し、開発者が自分の作業状況を把握できる。
- PM が全体の状態をざっくり把握するための土台がある。
- `.env` 未設定でもモックデータで体験を説明できる。

完了条件:

- チケット一覧、検索、状態フィルタ、サマリが動く。
- README にアプリの目的と起動方法がある。
- 開発ループを管理する docs がある。
- devcontainer または Docker Compose で開発環境を再現できる方針がある。
- 無料で利用できる OSS 版 Redmine を検証環境の前提としている。

## Milestone 2: AI エージェント視点の作業支援

優先度: High
状態: In Progress

関連 issue:

- `ISS-002` Closed: 開発者向けの AI エージェント作業ビューを設計する。
- `ISS-003` Open: PM 向けのプロジェクト観察ビューを設計する。
- `ISS-016` Closed: issue ごとの AI 要約カードを追加する。
- `ISS-017` Closed: 次アクション判定ルールを実装する。
- `ISS-018` Closed: AI判断と人間確認の境界をUIで分ける。

期待成果:

- issue を「読む」だけでなく、次に取り組む候補として評価できる。
- 開発者向けに、担当 issue の状況、ブロッカー、次アクションを提示できる。
- PM 向けに、停滞 issue、優先度の偏り、担当者の負荷を提示できる。

完了条件:

- issue ごとの要約ビューがある。
- 次アクション候補を表示できる。
- 人間が確認すべき判断と、AI に任せられる補助作業が区別されている。

## Milestone 3: 自然言語対話の入口

優先度: High

関連 issue:

- `ISS-005` Open: 自然言語対話の入口を設計する。

期待成果:

- 開発者や PM が自然言語で Redmine と知識ベースに質問できる。
- 対話で得た要約や提案から、ブラウザー UI の根拠確認や承認画面へ移動できる。
- Chat-first, UI-confirmed の体験を検証できる。

完了条件:

- 自然言語の入力欄または Chat UI がある。
- Redmine issue と `docs/` の情報を使った回答のプロトタイプがある。
- Redmine 更新は対話から直接実行せず、更新案として Proposal & Audit Layer に渡す方針が明記されている。

## Milestone 4: Redmine 更新体験の検証

優先度: Medium

関連 issue:

- `ISS-004` Open: Redmine 更新前の確認フローを検討する。

期待成果:

- AI エージェントが提案した Redmine 更新を、人間が確認して反映する体験を試せる。
- ステータス変更、コメント追加、担当変更などの操作に対する安全な確認フローを検証できる。

完了条件:

- Redmine 更新前に差分と意図を確認できる。
- 更新失敗時の扱いが明確である。
- 監査しやすいログが残る。

## Milestone 5: devcontainer / Docker Compose 検証環境

優先度: Medium

関連 issue:

- `ISS-006` Closed: devcontainer / Docker Compose で OSS 版 Redmine 検証環境を作る。

期待成果:

- 新しい開発者や PM が、ローカルで AIRedmine と OSS 版 Redmine をすぐ試せる。
- Redmine API 連携、モックデータ、知識ベース連携を同じ環境で検証できる。

完了条件:

- devcontainer または Docker Compose の構成がある。
- OSS 版 Redmine と database をローカル起動できる。
- AIRedmine からローカル Redmine に接続する手順が README にある。

## Milestone 6: 体験評価と改善ループ

優先度: Medium

関連 issue:

- `ISS-012` Open: 体験評価と改善ループの記録方法を作る。

期待成果:

- 開発者と PM の体験がどう変わったかを記録できる。
- 改善案を issue として継続的に管理できる。

完了条件:

- 体験メモ、観察項目、改善候補を記録する仕組みがある。
- 定期的に agent.md や docs の改善提案ができる。

## 変更履歴

- 2026-06-06: アプリの目的を「AI エージェント経由の Redmine 利用体験を明らかにするプロトタイプ」として定義した。
- 2026-06-06: ブラウザー UI に加えて自然言語対話を主要な入口として扱う方針を追加した。
- 2026-06-06: 開発環境は devcontainer または Docker Compose、Redmine は無料で利用できる OSS 版を前提にする方針を追加した。
- 2026-06-06: 各マイルストーンに関連 issue を記載し、ロードマップと issue の対応を追えるようにした。
- 2026-06-06: Milestone 5 の `ISS-006` として Docker Compose 検証環境を追加した。
- 2026-06-06: Milestone 1 を Completed とし、Milestone 2 の最初の作業支援 issue 群を追加した。
