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
状態: Completed

関連 issue:

- `ISS-002` Closed: 開発者向けの AI エージェント作業ビューを設計する。
- `ISS-003` Closed: PM 向けのプロジェクト観察ビューを設計する。
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
状態: Completed

関連 issue:

- `ISS-005` Closed: 自然言語対話の入口を設計する。
- `ISS-019` Closed: Chat UI の回答取得エラー表示を改善する。
- `ISS-020` Closed: Chat 回答の根拠リンクを詳しく表示する。
- `ISS-021` Closed: issue 番号指定の質問に対応する。
- `ISS-022` Closed: Chat の質問履歴を表示する。
- `ISS-023` Closed: docs 知識ベース検索の精度を改善する。
- `ISS-024` Closed: Chat 回答から Redmine 更新案の詳細下書きを作る。

期待成果:

- 開発者や PM が自然言語で Redmine と知識ベースに質問できる。
- 対話で得た要約や提案から、ブラウザー UI の根拠確認や承認画面へ移動できる。
- Chat-first, UI-confirmed の体験を検証できる。

完了条件:

- 自然言語の入力欄または Chat UI がある。
- Redmine issue と `docs/` の情報を使った回答のプロトタイプがある。
- Redmine 更新は対話から直接実行せず、更新案として Proposal & Audit Layer に渡す方針が明記されている。

追加改善候補:

- 回答の根拠をより詳しく確認できるようにする。
- issue 番号を指定した個別相談に対応する。
- 質問履歴を表示し、探索の流れを追えるようにする。
- docs 知識ベースの検索精度を上げる。
- 更新系の依頼から、確認しやすい更新案の詳細下書きを作る。

## Milestone 4: Redmine 更新体験の検証

優先度: Medium
状態: Completed

関連 issue:

- `ISS-004` Closed: Redmine 更新前の確認フローを検討する。
- `ISS-025` Closed: Redmine 更新案の確認画面を追加する。
- `ISS-026` Closed: Redmine コメント追加の確認フローを実装する。
- `ISS-027` Closed: 更新前後の差分表示を追加する。
- `ISS-028` Closed: 更新実行ログを記録する。
- `ISS-029` Closed: 更新失敗時のエラー表示と再試行導線を作る。
- `ISS-030` Closed: ステータス変更・クローズ操作の確認フローを検討する。

期待成果:

- AI エージェントが提案した Redmine 更新を、人間が確認して反映する体験を試せる。
- ステータス変更、コメント追加、担当変更などの操作に対する安全な確認フローを検証できる。

完了条件:

- Redmine 更新前に差分と意図を確認できる。
- 更新失敗時の扱いが明確である。
- 監査しやすいログが残る。
- コメント追加は確認後に実 Redmine へ反映できる。
- ステータス変更とクローズは安全条件の確認までに留める。

## Milestone 5: devcontainer / Docker Compose 検証環境

優先度: Medium
状態: Completed

関連 issue:

- `ISS-006` Closed: devcontainer / Docker Compose で OSS 版 Redmine 検証環境を作る。
- `ISS-031` Closed: Docker Compose 起動ヘルスチェックを追加する。
- `ISS-032` Closed: 初回セットアップ確認スクリプトを追加する。
- `ISS-033` Closed: Redmine デモデータ投入をワンコマンド化する。
- `ISS-034` Closed: Docker Compose 開発用 override を追加する。
- `ISS-035` Closed: Redmine 接続トラブルシュート画面を強化する。
- `ISS-036` Closed: devcontainer 対応を追加する。
- `ISS-037` Closed: Docker Compose v2 への移行準備を行う。

期待成果:

- 新しい開発者や PM が、ローカルで AIRedmine と OSS 版 Redmine をすぐ試せる。
- Redmine API 連携、モックデータ、知識ベース連携を同じ環境で検証できる。

完了条件:

- devcontainer または Docker Compose の構成がある。
- OSS 版 Redmine と database をローカル起動できる。
- AIRedmine からローカル Redmine に接続する手順が README にある。
- 起動状態、初回設定、デモデータ投入を迷わず確認できる。
- 開発者向けの編集しやすい Docker 環境がある。
- Compose v2 を優先しつつ、既存の docker-compose v1 環境でも動く。

## Milestone 6: 機能改善の洗い出しとアーキテクチャの検討

優先度: Medium
状態: Completed

関連 issue:

- `ISS-042` Closed: 既存機能の改善候補を棚卸しする。
- `ISS-043` Closed: 現在のアーキテクチャを記録する。
- `ISS-044` Closed: 次に分離すべき責務を検討する。
- `ISS-045` Closed: 改善候補の優先順位付け方法を決める。

期待成果:

- AIRedmine の既存機能について、使いにくさ、技術的負債、追加すべき機能を整理できる。
- Browser UI、App Server、Redmine Connector、Knowledge Connector、Proposal & Audit Layer、体験評価ループの責務を見直せる。
- 次に実装する issue を、思いつきではなく価値、リスク、依存関係、検証しやすさで選べる。

完了条件:

- 既存機能ごとの改善候補が docs に整理されている。
- 現在のアーキテクチャと課題が docs に記録されている。
- 次に分離または強化すべき責務が明確になっている。
- 改善候補を issue 化し、優先順位を付ける基準がある。

## Milestone 7: 機能改善の実装

優先度: High
状態: Partially Completed（ISS-046〜048 Closed / ISS-049〜051 は Milestone 8 で再検討）

関連 issue:

- `ISS-046` Closed: ダッシュボードビューを分ける。
- `ISS-047` Closed: Redmine issue 詳細と journals を取得する。
- `ISS-048` Closed: 対話フローに確認質問ステップを追加する。
- `ISS-049` On Hold: Chat intent 分類をモジュール化する（Python 移行で再設計）。
- `ISS-050` On Hold: docs 検索に用語辞書とスコア理由を追加する（Python 移行で再設計）。
- `ISS-051` On Hold: 体験メモを永続化する（Python + DB で対応）。

期待成果:

- 開発者と PM がそれぞれの目的で使いやすい画面導線を持つ。
- Redmine の件名だけでなく詳細・コメント履歴を使った判断支援ができる。
- 曖昧な依頼に対して AI が先に確認質問を返す対話品質になる。

完了条件:

- 開発者 / PM / 更新監査の各ビューへ切り替えられる。
- Redmine issue 詳細と journals を取得し Chat や Work Guide で使える。
- 曖昧な依頼で確認質問が返り、明確な依頼では従来通り回答・更新案が作られる。

## Milestone 8: フロント/バック刷新

優先度: High
状態: Completed

背景: フロントエンドを React + TypeScript + Vite に、バックエンドを Python + FastAPI に移行する。
AI ライブラリのエコシステム活用、型安全な開発、4 View への拡張を目的とする。
developer / pm ロール概念を設計に織り込む（認証実装は後続 Milestone）。

関連 issue:

- `ISS-052` Closed: プロジェクト構成の再編とビルド環境をセットアップする。
- `ISS-053` Closed: Python + FastAPI バックエンドに既存 API を移行する。
- `ISS-054` Closed: React + TypeScript フロントエンドの基盤を作る。
- `ISS-055` Closed: 4 View の UI を React コンポーネントで実装する。
- `ISS-056` Closed: developer / pm ロール設計を docs に記録する。
- `ISS-057` Closed: `__pycache__` を `.gitignore` に追加する。
- `ISS-058` Closed: 旧 Node.js サーバー (`src/`) を削除する。
- `ISS-059` Closed: Proposal カードから Redmine コメントを実行できるようにする。
- `ISS-060` Closed: Issue 詳細パネルを正式 issue として記録する。
- `ISS-061` Closed: README を最新化する。
- `ISS-062` Closed: 要求仕様・機能仕様・テスト仕様を文書化する。

期待成果:

- React + TypeScript + Vite で型安全にフロントを開発できる。
- Python + FastAPI で AI ライブラリと統合しやすいバックエンドになる。
- Developer Chat / Developer Dashboard / PM / Audit の 4 View が分離される。
- developer / pm ロールの概念が設計レベルで定義されている。

完了条件:

- frontend/ と backend/ にディレクトリが分割されている。
- Vite dev server の /api/* が FastAPI にプロキシされる。
- 既存の全 API エンドポイントが Python + FastAPI で動作する。
- React + TypeScript で 4 View が切り替えられる。
- developer / pm ロール設計が docs に記録されている。

## Milestone 9: AI Agent + Anthropic API 統合

優先度: High
状態: Open

背景: チャット UI を唯一の対話インターフェースとし、バックエンドを真の AI Agent に刷新する。
Anthropic API（claude-haiku-4-5）と tool_use を使い、Redmine 操作・知識検索・会話コンテキスト保持を実現する。
開発者も PM も同じチャット UI を使い、ロール別のシステムプロンプトで応答を最適化する。

関連 issue:

- `ISS-063` Open: Anthropic API を接続してヘルスチェックする。
- `ISS-064` Open: Redmine 操作ツールを tool_use 形式で定義する。
- `ISS-065` Open: 会話コンテキスト管理を実装する。
- `ISS-066` Open: AI Agent コアを実装する。
- `ISS-067` Open: フロントエンドをマルチターンチャット中心に整理する。
- `ISS-068` Open: ナレッジベース検索ツールを追加する。
- `ISS-069` Open: ロール別システムプロンプトを実装する。

期待成果:

- Chat がルールベースから本物の Claude 回答に変わる。
- 前の質問・回答を踏まえた連続対話ができる。
- Claude が Redmine を自律的に検索・参照し、必要に応じてコメント追加を提案できる。
- 開発者と PM で回答の切り口が変わる。

完了条件:

- `POST /api/chat` が Anthropic API を通じて Claude の回答を返す。
- 会話履歴が保持され、前の文脈を踏まえた回答ができる。
- Redmine ツール（list_issues / get_issue / add_comment）が tool_use で動く。
- フロントエンドが会話スレッドを表示し、messages[] をバックエンドに送る。
- developer / pm ロール別のシステムプロンプトが機能する。

## Milestone 10: 体験評価と改善ループ

優先度: Medium
状態: Open

関連 issue:

- `ISS-012` Closed: 体験評価と改善ループの記録方法を作る。
- `ISS-038` Open: 体験メモを永続化する。
- `ISS-039` Open: 体験メモから改善 issue 下書きを作る。
- `ISS-040` Open: 体験評価テンプレートを整備する。
- `ISS-041` Open: 体験評価サマリを役割別に可視化する。

期待成果:

- 開発者と PM の体験がどう変わったかを記録できる。
- 改善案を issue として継続的に管理できる。

完了条件:

- 体験メモ、観察項目、改善候補を記録する仕組みがある。
- 定期的に agent.md や docs の改善提案ができる。
- 記録した体験メモがサーバー再起動後も残る。
- 体験メモから改善 issue の候補を作れる。
- 開発者と PM の観察結果を分けて振り返れる。

## 変更履歴

- 2026-06-06: アプリの目的を「AI エージェント経由の Redmine 利用体験を明らかにするプロトタイプ」として定義した。
- 2026-06-06: ブラウザー UI に加えて自然言語対話を主要な入口として扱う方針を追加した。
- 2026-06-06: 開発環境は devcontainer または Docker Compose、Redmine は無料で利用できる OSS 版を前提にする方針を追加した。
- 2026-06-06: 各マイルストーンに関連 issue を記載し、ロードマップと issue の対応を追えるようにした。
- 2026-06-06: Milestone 5 の `ISS-006` として Docker Compose 検証環境を追加した。
- 2026-06-06: Milestone 1 を Completed とし、Milestone 2 の最初の作業支援 issue 群を追加した。
- 2026-06-06: `ISS-003` を完了し、Milestone 2 を Completed とした。
- 2026-06-06: `ISS-005` を完了し、Milestone 3 を Completed とした。
- 2026-06-06: `ISS-019` で Chat UI のエラー切り分けとキャッシュ対策を追加した。
- 2026-06-06: Milestone 3 の追加改善候補として `ISS-020` から `ISS-024` を追加した。
- 2026-06-06: `ISS-021` で issue 番号指定の質問に対応した。
- 2026-06-06: `ISS-024` で Chat 回答から確認待ちの Redmine 更新案下書きを作れるようにした。
- 2026-06-06: `ISS-020` で Chat 回答の根拠カードを詳しくした。
- 2026-06-06: `ISS-022` で Chat の質問履歴を表示できるようにした。
- 2026-06-06: `ISS-023` で docs 知識ベース検索を見出し単位に改善した。
- 2026-06-06: Milestone 4 の追加 issue として `ISS-025` から `ISS-030` を追加し、`ISS-025` を完了した。
- 2026-06-06: `ISS-026` で確認後に Redmine コメントを追加できるようにした。
- 2026-06-06: `ISS-004`, `ISS-027`, `ISS-028`, `ISS-029`, `ISS-030` を完了し、Milestone 4 を Completed とした。
- 2026-06-07: Milestone 5 の追加 issue として `ISS-031` から `ISS-036` を追加した。
- 2026-06-07: `ISS-031` で Docker Compose 起動ヘルスチェックを追加した。
- 2026-06-07: `ISS-037` を追加し、`ISS-032` から `ISS-037` を完了して Milestone 5 を Completed とした。
- 2026-06-07: `ISS-012` で体験メモ、観察観点、改善候補を記録する UI / API を追加し、Milestone 6 を Completed とした。
- 2026-06-07: Milestone 6 は体験メモの入口だけでは改善ループ全体として未完了と判断し、状態を Open に戻して `ISS-038` から `ISS-041` を候補 issue として追加した。
- 2026-06-07: Milestone 7 として、機能改善の洗い出しとアーキテクチャ検討を追加し、`ISS-042` から `ISS-045` を候補 issue とした。
- 2026-06-07: 実施順を見直し、機能改善とアーキテクチャ検討を Milestone 6、体験評価と改善ループを Milestone 7 に入れ替えた。
- 2026-06-07: 体験評価と改善ループを Milestone 10 に改番した。Milestone 7 は ISS-045 クローズ後に Milestone 6 の改善候補を issue 化して充当する。
- 2026-06-07: `ISS-042` で既存機能ごとの改善候補を `docs/improvement-inventory.md` に棚卸しした。
- 2026-06-07: `ISS-043` で現在のアーキテクチャと主要 API / データの流れを `docs/architecture.md` に記録した。
- 2026-06-07: `ISS-044` で次に分離すべき責務と先送り条件を `docs/responsibility-separation.md` に記録した。
- 2026-06-07: `ISS-045` で改善候補 7 件の評価軸比較と Milestone 7 推奨構成を `docs/issueslog.md` に記録し、Milestone 6 を Completed とした。
- 2026-06-07: Milestone 7 を追加し、`ISS-046` から `ISS-051` を候補 issue とした。
- 2026-06-07: `ISS-046` Closed。ダッシュボードビュー切り替え（Developer / PM / Audit）を実装した。
- 2026-06-07: `ISS-047` Closed。Redmine issue 詳細と journals の取得・Chat 連携を実装した。
- 2026-06-07: `ISS-048` Closed。曖昧な更新依頼への確認質問ステップを実装した。
- 2026-06-07: フロントエンドを React + TypeScript + Vite、バックエンドを Python + FastAPI に移行する方針を決定。Milestone 8 を追加し `ISS-052`〜`ISS-056` を候補 issue とした。ISS-049〜051 は On Hold とし Milestone 8 で再設計する。
- 2026-06-07: `ISS-052` Closed。frontend/（Vite + React + TS）と backend/（FastAPI）のスケルトンを作成し Docker Compose で両サービスが起動することを確認した。
- 2026-06-07: `ISS-062` Closed。`docs/spec.md` を新規作成し、要求仕様・機能仕様（エンドポイント一覧・View 構成・データ・Chat Engine・エラー処理）・テスト仕様（自動テスト一覧・手動確認チェックリスト）を文書化した。
- 2026-06-07: Milestone 9 を追加。チャット UI 一本化・Anthropic API tool_use による AI Agent 化・会話コンテキスト保持の方針を決定し、`ISS-063`〜`ISS-069` を候補 issue とした。
