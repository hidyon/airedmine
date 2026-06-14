# Semantic Index Freshness

AIRedmine の semantic search は `issue_embeddings` に保存した embedding を検索する。
この index は Redmine issue の更新と自動同期されないため、issue の変更後に古い検索結果を返す可能性がある。

## 現状の index 内容

`backend/services/issue_index.py` の現在の embedding text は次の範囲に限られる。

- `subject`
- `status.name`
- `priority.name`

`issue_embeddings.body` には `status priority` の文字列だけが保存される。
説明、コメント履歴、担当者、期日、バージョン、関連 issue は embedding 対象に含まれていない。

## 2026-06-14 時点の観察

現在の semantic index:

- 件数: `517`
- issue_id 範囲: `1〜1027`
- indexed_at: `2026-06-07T12:21:02Z`

現在の Redmine `kintai-next` project:

- 件数: `510`
- issue_id 範囲: `1035〜1544`
- updated_on 範囲: `2026-04-14〜2026-06-12`

このため、現在の semantic index は seed reset 前の issue を指しており、`kintai-next` の現在 issue とは整合していない。

## 更新種別ごとの影響

| 更新種別 | 現在の検索品質への影響 | 再 embedding 必要性 |
| --- | --- | --- |
| 件名変更 | embedding text が直接変わるため、古い検索語に寄る | 必要 |
| ステータス変更 | `body` と embedding text が変わる | 必要 |
| 優先度変更 | `body` と embedding text が変わる | 必要 |
| 説明変更 | 現在は embedding 対象外なので検索結果には反映されない | 対象に含めるなら必要 |
| コメント追加 | 現在は embedding 対象外なので検索結果には反映されない | 対象に含めるなら必要 |
| 担当者変更 | 現在は embedding 対象外 | 原則不要 |
| 期日変更 | 現在は embedding 対象外 | 原則不要 |
| バージョン変更 | 現在は embedding 対象外 | 原則不要 |
| 関連 issue 変更 | 現在は embedding 対象外 | 原則不要 |
| issue 作成 | index に存在しないため検索されない | 必要 |
| issue 削除 / seed reset | orphan embedding が残る | 全体洗い替えが必要 |

## 更新経路ごとのリスク

### AIRedmine からの更新

Proposal 実行後に Redmine は更新されるが、`issue_embeddings` は更新されない。
現在の embedding 対象に影響する操作は、ステータス変更、優先度変更、issue 作成である。
コメント追加は検索品質上は現状影響しないが、将来コメントを embedding 対象に入れるなら影響する。

### Redmine UI / API からの直接更新

AIRedmine は更新を検知しない。
件名、ステータス、優先度が変わっても index は古いままになる。
`indexed_at` と Redmine `updated_on` を比較すれば、同じ issue_id が残っている場合の stale 判定はできる。

### seed 再投入 / reset

通常の `seed:demo` は既存 issue を更新するため、件名が同じなら issue_id は保たれやすい。
`seed:demo:reset` は project を削除して作り直すため、issue_id が変わり、古い embedding は orphan になる。
この場合は `indexed_at < updated_on` だけでは検出できず、Redmine 側に存在しない issue_id を検出する必要がある。

## stale 判定方針

短期的には次の 2 種類を分けて扱う。

1. stale issue

   `issue_embeddings.issue_id` が Redmine に存在し、Redmine `updated_on` が `indexed_at` より新しい。

2. orphan embedding

   `issue_embeddings.issue_id` が Redmine に存在しない。
   seed reset 後に特に発生しやすい。

## 実装候補

### 全再構築

最も単純で安全。
seed reset 後、または大きなデータ変更後に `POST /api/ai/index/build` を実行する。
件数が増えると重くなるが、現在の 510 件規模では扱いやすい。

### issue 単位再構築

Redmine issue 1 件を取得し、その issue_id の embedding だけを更新する。
AIRedmine からのステータス変更、優先度変更、issue 作成後に呼ぶと効率が良い。

### stale 検出 API

`issue_embeddings` と Redmine issue の差分を返す API を追加する。
例:

- indexed count
- current Redmine count
- stale issue count
- orphan embedding count
- oldest indexed_at

### embedding 対象の再検討

コメント履歴や説明を意味検索に含める場合、更新影響は大きくなる。
検索品質は上がる可能性があるが、コメント追加のたびに再 embedding が必要になる。
まずは件名、ステータス、優先度の freshness を正しく保つのが現実的。

## 推奨

1. ISS-105 で seed 後の全再構築導線を追加する。
2. 後続 issue で stale / orphan 検出 API を追加する。
3. その後、AIRedmine の更新実行後に issue 単位再構築するか検討する。
