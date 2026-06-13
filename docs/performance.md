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
```

計測対象:

- `GET /api/issues`
- `GET /api/issues/{id}`
- `GET /api/pm/stats`
- `GET /api/proposals/logs`
- `POST /api/chat`

出力には、計測条件、seed issue 件数、平均、最小、最大、p95 相当、エラー件数が含まれる。
Chat は Claude API 待ちを含むため、通常 API と分けて読む。

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
commit: ISS-098 実装中
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

継続的な数値比較、Chat 内部の切り分け、改善候補の整理は ISS-099〜101 で扱う。
