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

## 現在のロードマップ

終了したマイルストーンと変更履歴は [`docs/roadmaplog.md`](roadmaplog.md) に移動した。

当面は実 Redmine 運用検証マイルストーンは置かず、デモ環境の説得力と計測可能性を先に高める。

## Milestone 22: 文書最新化と仕様整合性レビュー

優先度: Medium
状態: Open

背景: M14 と M21 で Chat の更新操作、セッション、issue 詳細表示、seed / semantic search 周辺の実装が進んだ。
一方で README、`docs/spec.md`、`docs/architecture.md` 相当の説明、スクリーンショット、手動確認チェックリストが実装の速度に追いつかないと、初見の利用者や将来の Codex が現状を誤解しやすくなる。

関連 issue:

- `ISS-115` Closed: README とデモ手順を最新の Chat / Dashboard / Audit 体験に合わせる。
- `ISS-116` Closed: `docs/spec.md` と実装済み API / View / データ構造の差分を点検する。
- `ISS-117` Closed: アーキテクチャ説明と主要データフローを最新化する。
- `ISS-118` In Progress: スクリーンショットと手動確認チェックリストを更新する。

期待成果:

- 初見のユーザーが README から現在の主要体験を迷わず試せる。
- 仕様書、ロードマップ、issue、実装の説明が矛盾しない。
- Chat の更新提案、セッション、issue 詳細、Audit、semantic search の現在の責務が文書から追える。
- ブラウザ確認で見るべき画面と代表操作が明確になる。

完了条件:

- ISS-115〜118 が完了し、README / docs / screenshots / 手動確認チェックリストが現在の実装と整合している。
- `agent.md` の開発ループに沿って、文書更新の対象と検証結果が `docs/issues.md` に記録されている。

## Milestone 23: Chat Session の履歴体験を磨く

優先度: Medium
状態: Open

背景: M21 で Chat session の一覧・詳細 API、UI の切替、同一 session の文脈投入が入った。
一方で、再開時の表示は assistant text が中心で、proposal、references、tool calls、関連 issue など「その会話で何を判断したか」を後から追いにくい。

関連 issue:

- `ISS-119` Closed: Chat session 再開時に assistant 応答 payload を復元する。
- `ISS-120` Closed: Chat session に関連 issue と最後の proposal action を表示する。
- `ISS-121` Open: Chat session のリネーム・アーカイブ・削除の初期方針を決める。

期待成果:

- 過去 session を開いたとき、回答本文だけでなく、根拠 issue、proposal、tool call の代表情報も見返せる。
- セッション一覧から、どの issue や更新提案に関する相談だったかを判断しやすくなる。
- 履歴が増えても、不要な session を整理する方針が立つ。

完了条件:

- ISS-119〜121 が完了し、Chat session の保存・再開・整理方針が UI / API / docs で整合している。
