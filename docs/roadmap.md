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
状態: Completed（ISS-049〜051 は Milestone 8・9 で Python 移行として対応済み）

関連 issue:

- `ISS-046` Closed: ダッシュボードビューを分ける。
- `ISS-047` Closed: Redmine issue 詳細と journals を取得する。
- `ISS-048` Closed: 対話フローに確認質問ステップを追加する。
- `ISS-049` Closed: Chat intent 分類をモジュール化する（Milestone 8 Python 移行 + Milestone 9 agent.py で対応）。
- `ISS-050` Closed: docs 検索に用語辞書とスコア理由を追加する（Milestone 8 knowledge_base.py + Milestone 9 search_knowledge ツールで対応）。
- `ISS-051` Closed: 体験メモを永続化する（Milestone 8 SQLite で対応）。

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
状態: Completed

背景: チャット UI を唯一の対話インターフェースとし、バックエンドを真の AI Agent に刷新する。
Anthropic API（claude-haiku-4-5）と tool_use を使い、Redmine 操作・知識検索・会話コンテキスト保持を実現する。
開発者も PM も同じチャット UI を使い、ロール別のシステムプロンプトで応答を最適化する。

関連 issue:

- `ISS-063` Closed: Anthropic API を接続してヘルスチェックする。
- `ISS-064` Closed: Redmine 操作ツールを tool_use 形式で定義する。
- `ISS-065` Closed: 会話コンテキスト管理を実装する。
- `ISS-066` Closed: AI Agent コアを実装する。
- `ISS-067` Closed: フロントエンドをマルチターンチャット中心に整理する。
- `ISS-068` Closed: ナレッジベース検索ツールを追加する。
- `ISS-069` Closed: ロール別システムプロンプトを実装する。

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

## Milestone 11: チケット意味検索

優先度: High
状態: Completed

背景: `search_issues` はキーワード完全一致のみ。「認証」で「ログイン」「セキュリティ」関連チケットを拾えない。
sentence-transformers（paraphrase-multilingual-MiniLM-L12-v2）でベクトル埋め込みを生成し、意味的な近さで検索できるようにする。

関連 issue:

- `ISS-070` Closed: チケット意味検索を実装する。

期待成果:

- Claude が意味検索ツールを使い、キーワードが異なっていても関連チケットを見つけられる。
- 「このバグに似た過去の issue は？」「セキュリティ関連の issue をまとめて」のような質問に答えられる。

完了条件:

- `search_issues_semantic` ツールが tool_use で動く。
- 510 件の Redmine チケットの埋め込みインデックスが SQLite に保存される。
- 意味的に近いチケットがキーワード不一致でも返る。

## Milestone 10: 体験評価と改善ループ

優先度: Medium
状態: Won't Do（2026-06-07 判断）

判断理由: 体験評価 UI（ISS-039〜041）は、このアプリには組み込む必要がないと判断した。
体験メモの永続化（ISS-038）は ISS-051 の SQLite 実装で解決済み。
ISS-012 の記録の入口は残っているが、可視化・テンプレート化・issue 下書き自動化は行わない。

関連 issue:

- `ISS-012` Closed: 体験評価と改善ループの記録方法を作る。
- `ISS-038` Closed: 体験メモを永続化する（ISS-051 で対応済み）。
- `ISS-039` Won't Do: 体験メモから改善 issue 下書きを作る。
- `ISS-040` Won't Do: 体験評価テンプレートを整備する。
- `ISS-041` Won't Do: 体験評価サマリを役割別に可視化する。

## Milestone 12: 体験品質強化と Redmine 書き込み拡張

優先度: High
状態: Completed

背景: AI Agent の回答品質は整ったが、Chat UI でのマークダウン表示・PM View の AI 連携・
ユーザー認証・ステータス変更や担当変更の実行フローが未完成のため、体験の仕上げとして実施した。

関連 issue:

- `ISS-071` Closed: Chat 回答をマークダウンレンダリングする。
- `ISS-072` Closed: PM View を廃止し、ロール固定のチャット体験に刷新する。
- `ISS-073` Closed: ステータス変更・担当変更の実行フローを実装する。
- `ISS-074` Closed: バックエンドのユーザー認証基盤を実装する。
- `ISS-075` Closed: フロントエンドにログイン画面とセッション管理を追加する。

期待成果:

- Claude の回答が箇条書き・表・コードブロックを含むマークダウンとして正しく表示される。
- PM はログイン後、同じチャット UI で PM ロールの回答を受け取る。
- コメント追加に加えて、ステータス変更と担当変更も確認後に実 Redmine へ反映できる。
- ログインユーザーの情報（redmine_user_id・チームメンバー一覧）がシステムプロンプトに注入される。

完了条件:

- Chat の回答バブルでマークダウンがレンダリングされる。
- issue 番号 `#NNN` がリンクになり、クリックで詳細パネルが開く。
- ログインしないと全画面にアクセスできない（JWT による認証ガード）。
- ロールはログインユーザーに紐づき、UI で変更できない。
- Proposal カードでステータス変更・担当変更を確認して実行できる。
- 「私の issue」で自動的にログインユーザーの assigned_to_id が使われる。
- 名前（username / 表示名）で担当者を指定した issue 検索ができる。
- 実行後に Audit ログに記録が残る。

## Milestone 13: ロール別ダッシュボード

優先度: High
状態: Completed

背景: Chat は質問しないと情報が得られない。ダッシュボードは「開くだけで今日の状況が分かる」補完的な体験を提供する。
開発者は自分の担当状況を、PM はプロジェクト全体の進捗・停滞をひと目で把握できるようにする。

関連 issue:

- `ISS-076` Closed: PM ダッシュボードにバーンダウンチャートを追加する。
- `ISS-077` Closed: 開発者ダッシュボードを優先度・停滞でセクション分けする。
- `ISS-078` Closed: PM ダッシュボードに 5 パネルを追加する（停滞一覧・担当者別負荷・優先度サマリー・今週クローズ数・期限切れ）。

期待成果:

- PM が Chat で聞かなくてもバーンダウンから進捗の遅れを視覚的に把握できる。
- PM Dashboard で停滞・期限切れ・担当者別負荷をひと目で確認できる。
- 開発者が Dashboard を開いた瞬間に「今日は何から着手すべきか」を判断できる。

完了条件:

- PM Dashboard にバーンダウンチャート（実績線 + 理想線）が表示される。
- PM Dashboard に停滞 issue・担当者別負荷・優先度サマリー・今週クローズ数・期限切れの 5 パネルが表示される。
- 開発者 Dashboard がブロッカー・高優先度・その他でセクション分けされる。

## Milestone 14: チャットからの操作種別拡張

優先度: High
状態: Open

背景: 現状の Chat は照会・要約と、コメント/ステータス/担当変更の 3 操作のみ実行できる。
「起票する」「期日を設定する」などの操作もチャットから完結できるようにすることで、Redmine を直接開く場面をさらに減らす。

関連 issue:

- `ISS-079` Open: チャットから issue を新規作成できるようにする。
- `ISS-080` Open: チャットから期日・優先度を変更できるようにする。
- `ISS-081` Open: チャットから進捗率を更新できるようにする。
- `ISS-082` Open: チャットから issue をバージョン（スプリント）に割り当てられるようにする。
- `ISS-083` Open: チャットから issue の関連を設定できるようにする。
- `ISS-084` Open: チャットから複数 issue を一括操作できるようにする。

期待成果:

- チャットで起票・期日設定・進捗更新・バージョン割当・関連付け・一括操作が完結し、Redmine を直接開く場面を大幅に減らす。

完了条件:

- ISS-079〜084 がすべてクローズされ、チャットから主要な Redmine 更新操作が「提案 → 確認 → 実行」フローで動作する。

## Milestone 15: Redmine MCP サーバー

優先度: High
状態: Open

背景: AIRedmine web アプリは PM・開発者がブラウザで使う体験を提供する。一方で Claude Code ユーザーはターミナルや IDE から直接 Redmine を操作したい。MCP サーバーとして Redmine を公開することで、両方の体験を並行して提供できる。

関連 issue:

- `ISS-085` Open: Redmine MCP サーバーを追加し Claude Code から操作できるようにする。

期待成果:

- Claude Code から `list_issues` / `create_issue` などのツールで Redmine を直接操作できる。
- web アプリを開かなくても、ターミナル・IDE から Redmine のコンテキストを Claude に渡せる。

完了条件:

- Claude Code に MCP サーバーを接続し、issue の照会・作成・更新が動作する。
- 接続手順が `docs/mcp.md` に記載されている。

## 変更履歴

- 2026-06-06: アプリの目的を「AI エージェント経由の Redmine 利用体験を明らかにするプロトタイプ」として定義した。
- 2026-06-06: ブラウザー UI に加えて自然言語対話を主要な入口として扱う方針を追加した。
- 2026-06-06: 開発環境は devcontainer または Docker Compose、Redmine は無料で利用できる OSS 版を前提にする方針を追加した。
- 2026-06-08: ISS-077 を完了し、開発者 Dashboard をブロッカー・高優先度・その他の 3 セクションに整理した。`assigned_to_id` に数値 user_id を使用するよう修正。
- 2026-06-08: ISS-078 を完了し、PM Dashboard に停滞・担当者別負荷・優先度サマリー・今週クローズ数・期限切れの 5 パネルを追加した。
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
- 2026-06-07: Milestone 9 Completed。ISS-063〜069 をすべてクローズした。backend に tools.py / prompts.py / agent.py を追加し、chat router を run_agent に刷新。frontend にロール切り替え・マルチターン会話・ツール呼び出し表示を追加。ISS-049〜051 も Python 移行で解決済みとし Milestone 7 を Completed とした。
- 2026-06-07: Milestone 11 追加・Completed。ISS-070 をクローズした。sentence-transformers (paraphrase-multilingual-MiniLM-L12-v2) で 517 件の埋め込みインデックスを構築し、`search_issues_semantic` ツールを agent に追加。「認証」→「パスワードリセット・API キー認証」などの意味検索が動作することを確認した。
- 2026-06-07: Milestone 10 を Won't Do とした。体験評価 UI（ISS-039〜041）はこのアプリには不要と判断。ISS-038 は ISS-051 で解決済みとしてクローズ。
- 2026-06-07: Milestone 12 を追加した。Chat マークダウンレンダリング（ISS-071）・PM View AI 化（ISS-072）・ステータス変更・担当変更実行（ISS-073）を候補 issue とした。
- 2026-06-07: ISS-071 Closed。react-markdown + remark-gfm でマークダウン・表をレンダリング。#NNN をクリックで詳細パネルを開けるリンクに変換。
- 2026-06-07: ISS-074/075 Closed。JWT 認証基盤・ログイン画面・セッション管理を実装。seed_users.py で Redmine ログイン名を使った初期ユーザーを投入。
- 2026-06-07: ISS-072 Closed。PM View を廃止。ロールはログイン時に固定。ナビをロール別フィルタリングに変更（PM: Chat + Audit、開発者: Chat + Dashboard + Audit）。
- 2026-06-07: assigned_to_id="me" が admin に解決されるバグを修正。ツール説明から "me" を削除し、システムプロンプトで数値 user_id の使用を強制。
- 2026-06-07: チームメンバー一覧（username・表示名・redmine_user_id）をシステムプロンプトに注入。名前で担当者を指定した issue 検索が可能に。
- 2026-06-07: ISS-073 Closed。change_status / change_assignee ツールを追加。Proposal カードから Redmine のステータス変更・担当変更を確認して実行できるようにした。
- 2026-06-07: Milestone 12 Completed。
