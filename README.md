# AIRedmine

AIRedmine は、AI エージェントを通じて Redmine を利用する未来の開発体験を試すためのプロトタイプです。

Redmine を活用したプロジェクトでは、issue、進捗、担当、判断履歴、リリース計画などが Redmine に集約されます。
今後の AI 駆動開発では、開発者や PM が Redmine を直接操作するだけでなく、AI エージェントを通じて Redmine の情報を読み、整理し、更新し、次の作業を決めることが増えると考えます。

このアプリの目的は、そのとき開発者や PM の体験がどう変化するか、どこが改善されるか、どんな不安や摩擦が残るかを体験できる形で明らかにすることです。

## ユーザー体験

AIRedmine が目指す体験は、Redmine を便利に見ることだけではありません。
Redmine に集約された issue、進捗、担当、判断履歴に加えて、設計ドキュメント、議事録、仕様書、PR、CI 結果、過去の意思決定などの知識ベースを AI エージェントが横断し、開発者や PM が次に判断・行動すべきことを分かるようにすることです。

### 開発者の体験

開発者は、朝に AIRedmine を開くと、Redmine の未完了チケット一覧を自分で読み解く代わりに、AI エージェントから今日の作業候補、優先理由、ブロッカー、確認すべき仕様を受け取ります。

- 今日取り組むべき issue を優先度・依存関係・更新状況から並べ替える。
- 長いコメント履歴や関連ドキュメントを要約する。
- ブロッカー、未回答質問、仕様の曖昧さを抽出する。
- 作業後に Redmine コメントや進捗更新の文案を作る。
- テスト結果や完了条件と照らして、issue をクローズできるか判定を補助する。

### PM の体験

PM は、Redmine の一覧やガントチャートを細かく巡回する代わりに、AI エージェントからプロジェクトの兆候を受け取ります。

- 停滞している issue を検出する。
- PM の判断待ちになっている issue を集約する。
- 担当者ごとの負荷や優先度の偏りを要約する。
- 次の定例で話すべき議題を作る。

### 人間が確認する境界

AIRedmine では、AI が勝手に Redmine を操作する体験を目指しません。
AI は情報収集・要約・更新案の作成を支援し、人間は判断・承認・クローズ・Redmine への反映を確認します。

## 4 View 構成

| View | URL | 対象 | 概要 |
| --- | --- | --- | --- |
| Developer Chat | `/developer/chat` | 開発者 | 自然言語で issue について質問・更新依頼ができるスレッド型チャット |
| Developer Dashboard | `/developer/dashboard` | 開発者 | 担当 issue 一覧。クリックで詳細（説明・コメント履歴）を表示 |
| PM View | `/pm` | PM | PM 判断待ち・停滞・高優先度の issue をカードサマリーで確認 |
| Audit | `/audit` | 全員 | Redmine への更新提案の実行履歴を確認 |

## できること

- 担当 issue 一覧を表示（Dashboard）
- issue をクリックして説明・コメント履歴を詳細パネルで確認
- 自然言語で issue を質問・探索（Chat）
- 停滞 issue、優先度、PM 判断待ちをサマリーで把握（PM View）
- Redmine への更新を、確認待ちの提案として作成してから実行
- 更新実行ログを Audit で確認
- `.env` 未設定のモックモードで全機能を体験可能

## アーキテクチャ

```text
ブラウザ (React + TypeScript + Vite, :5173)
        |  /api/* proxy
        v
FastAPI バックエンド (:8000)
        |
        +--> Redmine Connector (httpx)
        +--> Knowledge Base (docs/ 読み込み)
        +--> Chat Engine (intent 分類・回答生成)
        +--> Proposal & Audit Layer
        +--> Experience Notes (SQLite)
        |
        v
OSS 版 Redmine (:3000)
```

- **frontend/**: React + TypeScript + Vite。Tailwind CSS v4 でスタイリング。
- **backend/**: Python + FastAPI。`/api/*` へのリクエストを処理する。
- **Redmine**: `REDMINE_BASE_URL` / `REDMINE_API_KEY` が未設定の場合、モックデータで動作する。

## 起動

```bash
docker compose up
```

| サービス | URL |
| --- | --- |
| AIRedmine フロントエンド | `http://localhost:5173` |
| AIRedmine バックエンド API | `http://localhost:8000` |
| Redmine | `http://localhost:3000` |

### モックモードで試す（Redmine 未接続）

`.env` 未設定のままでも、モックデータで全機能を試せます。

```bash
docker compose up
```

`http://localhost:5173` をブラウザで開きます。
トップバーに「Mock」バッジが表示されていればモックモードで動作しています。

### 実 Redmine に接続する

1. Redmine の管理画面で REST API を有効にする。
1. 個人設定から API キーを取得する。
1. `.env` を作成する（`.env.example` を参考にする）。

```bash
REDMINE_BASE_URL=http://localhost:3000
REDMINE_API_KEY=your-redmine-api-key
```

1. バックエンドコンテナを再起動する。

```bash
docker compose restart backend
```

トップバーのバッジが「Redmine」になれば接続成功です。

### ヘルスチェック

```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/config
```

### Redmine デモデータを投入する

ローカル Redmine に体験確認用のプロジェクトと issue を投入できます。

```bash
docker compose exec redmine bash /demo-scripts/seed_demo.sh
```

投入後、出力された API キーを `.env` の `REDMINE_API_KEY` に設定してバックエンドを再起動します。

## 開発

ソースを変更すると Vite（フロントエンド）と uvicorn（バックエンド）が自動でリロードします。

```bash
docker compose up          # 全サービス起動
docker compose logs -f frontend backend   # ログ確認
docker compose exec backend python -m pytest tests/ -v   # バックエンドテスト
```

### 環境変数

| 変数 | 説明 | デフォルト |
| --- | --- | --- |
| `REDMINE_BASE_URL` | 接続先 Redmine の URL | （未設定 → モック） |
| `REDMINE_API_KEY` | Redmine API キー | （未設定 → モック） |
| `DOCS_ROOT` | ナレッジベースの読み込み先 | `/project` |
| `DB_PATH` | SQLite DB のパス | `/app/data/airedmaine.db` |
| `BACKEND_URL` | フロントエンドからバックエンドへのプロキシ先 | `http://backend:8000` |

## 開発ドキュメント

- `CLAUDE.md`: 共同開発ルール
- `docs/roadmap.md`: ロードマップ
- `docs/issues.md`: issue 管理
- `docs/issueslog.md`: issue の検討ログ

## 参考

- [Redmine REST API](https://www.redmine.org/projects/redmine/wiki/Rest_api)
- [FastAPI](https://fastapi.tiangolo.com)
- [React + Vite](https://vite.dev)
