# Semantic Embedding Scope

AIRedmine の semantic search は、開発者や PM が「正確な件名を知らない状態」でも関連 issue にたどり着くための入口である。
現状は `subject + status + priority` だけを embedding しているため、件名に近い概念は拾えるが、説明やコメント履歴にだけ存在する背景、原因、判断履歴、未決事項は検索対象にならない。

## 現行 embedding の観察

2026-06-14 に現在の semantic index へ代表質問を投げた結果:

| 質問 | 上位結果の傾向 | 評価 |
| --- | --- | --- |
| 承認フローの仕様揺れ | `申請・承認フローの詳細仕様を確定する`、`一括承認で一部が承認されないバグを報告する` など | 件名に近い語があるため比較的拾える |
| PM判断待ち | `PM判断待ち:*` issue が上位に並ぶ | 件名 prefix に依存して強く拾える |
| リリースリスク | `リリース遅延リスクを評価して対応策を立案する` など | 件名にリスク語がある範囲では拾える |
| 性能劣化の原因 | `フロントエンドのバンドルサイズを分析して削減する`、`フレックス計算で端数誤差が出るバグを報告する` など | 原因や計測値がコメントにある issue を十分に拾えない |

特に「性能劣化の原因」は、seed data のコメントに `isHoliday()`、Lighthouse、WebSocket cleanup、スロークエリなど具体的な原因が残っているが、現行 index ではコメントが embedding 対象外なので検索品質に反映されない。

## 代表質問ごとの必要情報

| 質問カテゴリ | 必要な embedding 対象 | 理由 |
| --- | --- | --- |
| 開発者: 次に触るべき関連 issue を探す | subject、description、直近コメント、status、priority、assigned_to | 件名だけでは背景や現在の詰まりが分からない |
| 開発者: 原因調査や類似不具合を探す | subject、description、直近コメント、重要コメント | 原因、再現条件、調査結果はコメントに残りやすい |
| PM: リリースリスクを探す | subject、description、priority、status、due_date、fixed_version、直近コメント | リスク語、期限、リリース対象、未完了状態を同時に見る必要がある |
| PM: 判断待ちや未決事項を探す | subject、description、直近コメント、assigned_to、status | 判断者、未決事項、合意内容は本文・コメントに分散する |
| 更新提案: 変更対象 issue を特定する | subject、description、status、priority、assigned_to | 操作対象の誤特定を避けるため、メタ情報も検索手がかりにする |

## 候補フィールド比較

| フィールド | 検索品質への寄与 | コスト | freshness 影響 | 採用方針 |
| --- | --- | --- | --- | --- |
| subject | 高 | 低 | 件名変更で stale | 必須 |
| status.name | 中 | 低 | ステータス変更で stale | 必須 |
| priority.name | 中 | 低 | 優先度変更で stale | 必須 |
| tracker.name | 中 | 低 | 変更頻度は低い | 採用 |
| assigned_to.name | 中 | 低 | 担当変更で stale | 採用 |
| fixed_version.name | 中 | 低〜中 | バージョン変更で stale | 採用候補 |
| due_date | 中 | 低〜中 | 期日変更で stale | 採用候補 |
| description | 高 | 中 | 説明変更で stale | 必須 |
| journals latest 3〜5 件 | 高 | 高 | コメント追加で stale | 採用 |
| journals 全件 | 中〜高 | 高 | コメント追加で stale、ノイズ増 | 不採用 |
| relations | 中 | 高 | 関連変更で stale | 後続検討 |

## 推奨 v1

次の text を 1 issue につき 1 embedding として作る。

```text
件名: {subject}
種別: {tracker.name}
状態: {status.name}
優先度: {priority.name}
担当: {assigned_to.name}
バージョン: {fixed_version.name}
期日: {due_date}

説明:
{description の先頭 1200 文字}

直近コメント:
- {created_on}: {notes の先頭 400 文字}
- ...
```

制約:

- コメントは notes があるものだけを対象にし、直近 5 件までにする。
- コメント合計は 1600〜2000 文字程度に抑える。
- Redmine のフィールド変更だけの journal は対象にしない。
- 個人名は Redmine の担当者名・コメント投稿者名をそのまま入れすぎず、まずは担当者名だけにする。
- `issue_embeddings.body` には検索結果の説明にも使える readable text を保存する。

## 取得方式

`list_issues` は description / journals を返さない。
description と journals を含めるには `get_issue_detail(issue_id)` が必要になる。

v1 では demo scale を優先し、index build 時に全 issue の detail を取得する方式を採用する。
現在の 500 件程度では許容範囲だが、`semantic.build.fetch_issue_details` と `semantic.build.encode` の計測を追加して、詳細取得が遅くなった場合は後続で分割する。

代替案:

- 全 issue detail を取る: 検索品質が安定するが、index build が遅い。
- 更新が新しい issue だけ detail を取る: 速いが、検索品質が issue ごとにばらつく。
- コメントを別 embedding にする: 精度は上がる可能性があるが、DB 構造と検索結果統合が複雑になる。

## freshness 影響

推奨 v1 では、次の更新で再 embedding が必要になる。

- 件名変更
- ステータス変更
- 優先度変更
- 担当者変更
- バージョン変更
- 期日変更
- 説明変更
- コメント追加

このため、ISS-107 の freshness API で stale を検出できることは前提になる。
ただし `updated_on` は説明変更やコメント追加でも更新されるため、v1 の freshness 判定にはそのまま利用できる。

## 後続実装候補

1. ISS-109 で `_issue_text()` / `_issue_body()` を推奨 v1 に拡張した。
2. ISS-109 で index build 時に issue detail を取得し、description と直近コメントを含めるようにした。
3. 代表質問セットを固定し、検索結果の上位 issue を記録する評価スクリプトを追加する。
4. index build の detail fetch / encode / write の計測を継続し、500 件規模での許容時間を確認する。

## ISS-109 実装後の観察

2026-06-14 に demo DB の semantic index を再構築し、`issue_embeddings.body` に description、直近コメント、担当、バージョン、期日が保存されることを確認した。

例: `月次勤怠カレンダーの初期描画パフォーマンスを改善する` は、説明と直近コメントに `isHoliday()`、React DevTools Profiler、初期レンダリング 340ms、改善後 85ms などの文脈を含む。

検索確認:

| 質問 | 結果 | 評価 |
| --- | --- | --- |
| 月次カレンダーのパフォーマンス改善について、これまでの議論を要約して | `#1327 月次勤怠カレンダーの初期描画パフォーマンスを改善する` が top 1 | 具体的な文脈付き質問では改善を確認 |
| 性能劣化の原因 | `#1327` は top 5 に入らず、リスク評価やコスト最適化 issue が上位 | 短い抽象クエリはまだ不安定 |

このため、ISS-109 は embedding 対象拡張として完了とし、検索品質の比較・クエリセット調整・必要なら同義語や評価観点の追加は ISS-110 で扱う。
