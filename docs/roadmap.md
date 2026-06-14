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

## Milestone 14: チャットからの操作種別拡張

優先度: High
状態: Open

背景: 現状の Chat は照会・要約と、コメント/ステータス/担当変更の 3 操作のみ実行できる。
「起票する」「期日を設定する」などの操作もチャットから完結できるようにすることで、Redmine を直接開く場面をさらに減らす。

関連 issue:

- `ISS-079` Closed: チャットから issue を新規作成できるようにする。
- `ISS-080` Closed: チャットから期日・優先度を変更できるようにする。
- `ISS-081` Closed: チャットから進捗率を更新できるようにする。
- `ISS-082` Closed: チャットから issue をバージョン（スプリント）に割り当てられるようにする。
- `ISS-083` Closed: チャットから issue の関連を設定できるようにする。
- `ISS-084` Open: チャットから複数 issue を一括操作できるようにする。

期待成果:

- チャットで起票・期日設定・進捗更新・バージョン割当・関連付け・一括操作が完結し、Redmine を直接開く場面を大幅に減らす。

完了条件:

- ISS-079〜084 がすべてクローズされ、チャットから主要な Redmine 更新操作が「提案 → 確認 → 実行」フローで動作する。

## Milestone 20: 計測結果にもとづく性能改善

優先度: Medium
状態: Open

背景: M19 で API、Chat 内部、Frontend の計測手順と初回ベースラインがそろった。
次は、計測で見えた待ち時間の大きい箇所を小さく改善し、初回体験と PM Dashboard の体感速度を上げる。

関連 issue:

- `ISS-102` Open: semantic search の初回ロードを warm-up する。
- `ISS-103` Open: PM stats の集計ボトルネックを分解する。
- `ISS-104` Open: フロントエンド画面別 ready time の実測ベースラインを取る。
- `ISS-105` Closed: seed 再投入後に semantic index を洗い替える。
- `ISS-106` Closed: issue 更新が semantic index に与える影響を分析する。
- `ISS-107` Closed: semantic index の stale / orphan 状態を検出する。
- `ISS-108` Closed: 開発体験に合わせて embedding 対象を再設計する。
- `ISS-109` Closed: semantic index に説明・直近コメント・主要メタ情報を含める。
- `ISS-110` Closed: semantic search の代表質問評価スクリプトを追加する。

期待成果:

- semantic search 初回利用時の極端な待ち時間を減らす。
- seed 再投入後も意味検索が現在の Redmine issue を参照する。
- issue 更新後に意味検索がどの程度古い情報を返しうるか判断できる。
- semantic index の stale / orphan 状態を検出できる。
- 意味検索が件名だけでなく、背景、判断履歴、ブロッカー、未決事項を拾えるようになる。
- PM Dashboard の遅さが Redmine API 待ち、集計処理、描画のどこにあるか分かる。
- Chrome / Chromium がある環境で画面別の ready time を比較できる。

完了条件:

- ISS-102〜110 の結果が `docs/performance.md` または関連ドキュメントに追記され、次に最適化すべき箇所が更新されている。
