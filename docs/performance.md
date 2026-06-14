# Performance Notes

AIRedmine の性能改善は、体感だけではなく同じ手順で取った計測値をもとに判断する。
このドキュメントはローカル環境での計測手順、条件、結果、改善候補を記録する。

## API 計測

主要 API の簡易計測は次のコマンドで実行する。

```bash
npm run perf:api
```

既定では `http://localhost:8000` のバックエンド API を対象に、Redmine 接続系 API を 5 回ずつ、Chat を 1 回計測する。

調整例:

```bash
npm run perf:api -- --runs=10
npm run perf:api -- --skip-chat
npm run perf:api -- --api-url=http://localhost:8000 --runs=5 --chat-runs=2
npm run perf:api -- --runs=1 --chat-runs=1 --chat-question=パフォーマンスが遅いという相談に関係する issue を探して
```

計測対象:

- `GET /api/issues`
- `GET /api/issues/{id}`
- `GET /api/pm/stats`
- `GET /api/proposals/logs`
- `POST /api/chat`

出力には、計測条件、seed issue 件数、平均、最小、最大、p95 相当、エラー件数が含まれる。
Chat は Claude API 待ちを含むため、通常 API と分けて読む。
`POST /api/chat` のレスポンスには `timings` が含まれ、`npm run perf:api` の出力にも次の内訳が表示される。

- `total_ms`: Chat API 全体の処理時間。
- `claude_ms`: Claude API 呼び出しの合計時間。
- `tool_total_ms`: tool_use 実行の合計時間。
- `tools`: tool 名、分類、実行時間。
- `semantic`: semantic search の DB 読み込み、embedding encode、類似度計算などの詳細時間。

semantic search の初回ロード差を見るときは、バックエンドを再起動してから semantic search を使う質問を 2 回実行する。

```bash
docker compose restart backend
npm run perf:api -- --runs=1 --chat-runs=1 --chat-question=パフォーマンスが遅いという相談に関係する issue を探して
npm run perf:api -- --runs=1 --chat-runs=1 --chat-question=パフォーマンスが遅いという相談に関係する issue を探して
```

`semantic.search.encode_query` の `model_was_loaded=false` が初回ロードを含む計測、`true` がロード済み状態の計測を示す。

## Semantic Search 評価

embedding 対象を変えた前後の検索品質は、固定した代表質問セットで比較する。

```bash
npm run eval:semantic
npm run eval:semantic -- --format json
```

既定の質問:

- 承認フローの仕様揺れ
- PM判断待ち
- リリースリスク
- 性能劣化の原因

ISS-110 時点の確認:

日時: 2026-06-14
commit: `98280bb` の index 再構築後
seed issue 件数: 517
コマンド: `docker compose exec -T backend python scripts/evaluate_semantic_search.py --format markdown`
条件: ローカル Docker Compose、semantic index rebuilt after ISS-109

| 質問 | top 1 | 評価 |
| --- | --- | --- |
| 承認フローの仕様揺れ | `#1477 一括承認で一部が承認されないバグを報告する` | 承認系 issue は拾うが、仕様確定 issue は top 5 |
| PM判断待ち | `#1167 PM判断待ち: v1.0 のリリース日程を最終確定する` | prefix により安定 |
| リリースリスク | `#1146 リリース遅延リスクを評価して対応策を立案する` | 意図に近い |
| 性能劣化の原因 | `#1528 欠陥密度を計算してコンポーネント別リスクを評価する` | 抽象クエリではまだズレる |

## 記録テンプレート

```text
日時:
commit:
seed issue 件数:
コマンド:
条件:

| API | count | avg ms | min ms | p95 ms | max ms | errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
```

## 初回ベースライン

ISS-098 では計測手順とスクリプトを追加した。
初回確認として、次の条件で主要 API が計測できることを確認した。

日時: 2026-06-13
commit: `e39dca0`
seed issue 件数: 517
コマンド: `npm run perf:api -- --runs=1 --chat-runs=1`
条件: ローカル Docker Compose、`http://localhost:8000`、Node.js v20.20.2

| API | count | avg ms | min ms | p95 ms | max ms | errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `GET /api/issues` | 1 | 449.2 | 449.2 | 449.2 | 449.2 | 0 |
| `GET /api/issues/{id}` | 1 | 48.3 | 48.3 | 48.3 | 48.3 | 0 |
| `GET /api/pm/stats` | 1 | 1850.2 | 1850.2 | 1850.2 | 1850.2 | 0 |
| `GET /api/proposals/logs` | 1 | 2.8 | 2.8 | 2.8 | 2.8 | 0 |
| `POST /api/chat` | 1 | 11686.1 | 11686.1 | 11686.1 | 11686.1 | 0 |

継続的な数値比較、画面側の計測、改善候補の整理は ISS-100〜101 で扱う。

## Chat timing baseline

ISS-099 で `/api/chat` の内部 timing を追加した。
semantic search を含む質問で、初回モデルロードとロード済み状態の差を確認した。

質問: `パフォーマンスが遅いという相談に関係する issue を探して`

| 状態 | total ms | Claude ms | tool ms | semantic encode ms | model_was_loaded |
| --- | ---: | ---: | ---: | ---: | --- |
| 初回 | 80852.2 | 5514.2 | 75337.8 | 75209.2 | false |
| 2 回目 | 6781.6 | 6511.6 | 269.7 | 70.1 | true |

観察:

- semantic search の初回は sentence-transformers モデルロードが支配的だった。
- 2 回目以降は Claude API 待ちが支配的になり、semantic search 自体は 200ms 前後まで下がった。

## M20 follow-up results

### ISS-102: semantic model warm-up

backend 起動後に sentence-transformers model warm-up を background task として開始するようにした。
`GET /api/ai/index/status` で model load 状態を確認できる。

2026-06-14 の確認:

- `model.state`: `ready`
- `model.loaded`: `true`
- `model.started_at`: `2026-06-14T01:29:25.669272+00:00`
- `model.finished_at`: `2026-06-14T01:29:41.071415+00:00`
- warm-up 所要時間: 約 15.4 秒

`docker compose exec backend python ...` で直接 Python を起動した場合は、uvicorn の backend プロセスとは別プロセスになるため warm-up 状態は共有されない。
確認は `/api/ai/index/status` の model field で行う。

### ISS-103: PM stats timing

PM stats は Redmine API 待ちと集計処理を分けて timing を返すようにした。
また、15 秒の短時間メモリキャッシュで連続表示時の体感を軽くした。

日時: 2026-06-14
コマンド: `npm run perf:api -- --api-url=http://127.0.0.1:8000 --runs=2 --skip-chat`
seed issue 件数: 517

| API | count | avg ms | min ms | p95 ms | max ms | errors |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `GET /api/issues` | 2 | 590.4 | 550.0 | 630.8 | 630.8 | 0 |
| `GET /api/issues/{id}` | 2 | 85.3 | 79.3 | 91.4 | 91.4 | 0 |
| `GET /api/pm/stats` | 2 | 1308.1 | 3.9 | 2612.2 | 2612.2 | 0 |
| `GET /api/proposals/logs` | 2 | 3.8 | 3.8 | 3.8 | 3.8 | 0 |

PM stats breakdown:

| timing | duration ms | notes |
| --- | ---: | --- |
| `pm.stats.fetch_open` | 1930.8 | open issue 385 件 |
| `pm.stats.fetch_closed` | 674.8 | closed issue 132 件 |
| `pm.stats.aggregate` | 1.4 | 集計処理 |
| `pm.stats.total` | 2607.1 | 初回 total |
| `pm.stats.cache_hit` | 0.0 | 2 回目 |

観察:

- ボトルネックは Python 集計ではなく Redmine API fetch、特に open issue のページング。
- 連続表示では短時間キャッシュで PM Dashboard の再表示は大幅に軽くなる。
- さらなる改善候補は project 絞り込み、ページサイズ調整、PM Dashboard 用の集計 API キャッシュ期間調整。

### ISS-104: Frontend ready baseline

`npm run perf:frontend` を実行したが、この環境には Chrome / Chromium が入っていないため実測できなかった。

確認結果:

- frontend service: `http://localhost:5173` は `200 OK`
- `docker compose ps`: frontend / backend / redmine / redmine-db は稼働中
- `npm run perf:frontend`: `Frontend measurement needs Chrome/Chromium.`

Chrome / Chromium がある環境では次で再実行する。

```bash
BROWSER_PATH=/path/to/chrome npm run perf:frontend
```

## Frontend 計測

主要画面の初期表示は、Chrome / Chromium の DevTools Protocol を使って計測する。

```bash
npm run perf:frontend
```

Chrome / Chromium が自動検出できない場合は、`BROWSER_PATH` で実行ファイルを指定する。

```bash
BROWSER_PATH=/path/to/chrome npm run perf:frontend
npm run perf:frontend -- --app-url=http://localhost:5173 --timeout-ms=30000
```

計測対象:

- `/developer/chat`
- `/developer/dashboard`
- `/pm/dashboard`
- `/audit`

出力には次を含める。

- `load ms`: ブラウザの load event まで。
- `ready ms`: 読み込み表示が消え、未ログインリダイレクトではない状態になるまで。
- `API count`: 初期表示中に発生した `/api/*` リクエスト数。
- `API total ms`: API リクエスト時間の合計。
- `slowest API`: 初期表示中でもっとも遅かった API。

Dashboard 系は `API total ms` と `ready ms` を比べることで、API 待ちが支配的か、描画側が支配的かをざっくり切り分ける。

## Bottleneck Summary

M19 の計測で、現時点の主なボトルネック候補は次のように整理できる。

### 改善済み / 継続観察

1. semantic search の初回モデルロード

   ISS-102 で backend 起動後の warm-up と model status を追加した。
   warm-up 完了後は初回ユーザー検索にモデルロードが乗りにくくなる。

2. `GET /api/pm/stats`

   ISS-103 で Redmine API fetch と集計処理の timing を分け、15 秒キャッシュを追加した。
   初回は Redmine API fetch が支配的で、連続表示は cache hit で軽くなる。

### 後で検証する

1. `/api/chat` の Claude API 待ち

   semantic search が warm 状態になると、Chat 全体では Claude API 待ちが支配的になる。
   外部 API 自体の最適化より先に、tool_use round 数や質問別の傾向を継続観察する。

2. Frontend 初期表示

   `npm run perf:frontend` で手順は用意したが、この実行環境には Chrome / Chromium が無く、実測値はまだない。
   Chrome がある環境で Chat / Developer Dashboard / PM Dashboard / Audit の ready time を取り、API 待ちと描画待ちを比較する。

### 現時点では許容

1. `GET /api/issues/{id}`

   初回ベースラインでは約 48ms、追加計測でもおおむね 50〜80ms 程度で、単体では主要ボトルネックではない。

2. `GET /api/proposals/logs`

   数ms程度であり、Audit 初期表示の主要ボトルネックではない。

## Follow-up Candidates

- Chrome / Chromium が使える環境で `npm run perf:frontend` を再実行し、画面別 ready time の実数を記録する。
- PM stats の open issue fetch をさらに軽くする場合は、project 絞り込みや page size の見直しを検討する。
