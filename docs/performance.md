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

### すぐ改善する

1. semantic search の初回モデルロード

   初回の `semantic.search.encode_query` が約 75 秒かかっており、初回 Chat 体験を大きく阻害する。
   2 回目以降は約 70ms まで下がるため、モデル自体の常時性能ではなく初回ロードが支配的。

   改善候補:

   - backend 起動時または semantic index build 後に sentence-transformers を warm-up する。
   - `/api/ai/index/status` などでモデルロード状態を見えるようにする。
   - 初回ロード中は UI / Chat 応答で「semantic model warming」相当の状態を返す。

2. `GET /api/pm/stats`

   初回ベースラインで約 1.8 秒、追加計測でも約 2 秒台になっており、PM Dashboard の初期表示を支配しやすい。

   改善候補:

   - Redmine API 呼び出し回数とページングを分解して測る。
   - PM stats 用の短時間キャッシュを検討する。
   - 集計対象を seed project に絞れているか確認する。

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

- `ISS-102`: semantic search の初回ロードを warm-up して、初回 Chat 体験の待ち時間を削減する。
- `ISS-103`: PM stats の Redmine API 呼び出しと集計処理を分解し、キャッシュまたは取得範囲最適化を検討する。
- `ISS-104`: Chrome / Chromium が使える環境で `npm run perf:frontend` を実行し、画面別 ready time のベースラインを記録する。
