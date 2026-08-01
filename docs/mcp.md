# Redmine MCP サーバー

Claude Code などの MCP クライアントから Redmine を直接操作するためのサーバーです。
AIRedmine の web アプリ（ブラウザ体験）とは独立して動作します。

- web アプリ: ブラウザ → AIRedmine（React + FastAPI）→ Redmine
- MCP サーバー: Claude Code → Redmine MCP Server → Redmine

実装は [`mcp-server/`](../mcp-server/) にあります。トランスポートは 2 つから選べます（`MCP_TRANSPORT`）。

- **stdio**（既定）: ローカルの単一ユーザー利用。単一 API キーで動作（従来どおり）。
- **http**: ステートレスな Streamable HTTP ＋ JWT(Bearer) 認証の**共有エンドポイント**。認証ユーザーとして Redmine を操作する（後述）。

## 公開ツール

参照系:

| ツール | 説明 |
| --- | --- |
| `list_issues` | issue 一覧取得（status / assigned_to_id / limit でフィルタ） |
| `get_issue` | issue 詳細取得（説明・コメント履歴を含む） |
| `search_issues` | キーワードで全文検索 |
| `list_projects` | プロジェクト一覧（create_issue の project_id 解決用） |
| `list_issue_statuses` | ステータス一覧（id / name / is_closed） |
| `list_priorities` | 優先度一覧（id / name） |
| `list_users` | ユーザー一覧（担当者の user_id 解決用、要管理者権限） |
| `list_versions` | バージョン（スプリント）一覧 |

更新系:

| ツール | 説明 |
| --- | --- |
| `create_issue` | issue 新規作成 |
| `add_comment` | コメント追加 |
| `change_status` | ステータス変更 |
| `change_assignee` | 担当者変更 |
| `update_due_date` | 期日を設定 |
| `update_priority` | 優先度を変更 |
| `update_done_ratio` | 進捗率（0〜100）を更新 |
| `assign_version` | バージョン（スプリント）に割り当て |
| `add_relation` | issue 間の関連を設定 |

> web アプリの「提案 → 確認 → 実行」フローと違い、MCP では Claude Code のツール実行確認（Allow / Deny）が承認の境界になります。

## 環境変数

| 変数 | 説明 |
| --- | --- |
| `REDMINE_BASE_URL` | 接続先 Redmine の URL（例: `http://localhost:3000`） |
| `REDMINE_API_KEY` | Redmine の API キー（個人設定から取得） |

## セットアップ（Docker、推奨）

ローカルの Python バージョンに依存しないため Docker 起動を推奨します。

1. イメージをビルドする。

```bash
docker build -t airedmaine-mcp ./mcp-server
```

2. Claude Code に MCP サーバーを登録する。`docker compose` で Redmine を起動している場合は、同じネットワーク（`airedmaine_default`）に接続し `redmine:3000` を参照します。

```bash
claude mcp add redmine -- \
  docker run -i --rm --network airedmaine_default \
  -e REDMINE_BASE_URL=http://redmine:3000 \
  -e REDMINE_API_KEY=your-redmine-api-key \
  airedmaine-mcp
```

外部の Redmine に接続する場合は `--network` を外し、`REDMINE_BASE_URL` に公開 URL を設定します。

```bash
claude mcp add redmine -- \
  docker run -i --rm \
  -e REDMINE_BASE_URL=https://redmine.example.com \
  -e REDMINE_API_KEY=your-redmine-api-key \
  airedmaine-mcp
```

`.mcp.json`（プロジェクトスコープ）に直接書く場合:

```json
{
  "mcpServers": {
    "redmine": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm", "--network", "airedmaine_default",
        "-e", "REDMINE_BASE_URL=http://redmine:3000",
        "-e", "REDMINE_API_KEY=your-redmine-api-key",
        "airedmaine-mcp"
      ]
    }
  }
}
```

## セットアップ（ローカル Python、3.10 以上）

Python 3.10 以上が使える環境では直接起動もできます。

```bash
pip install -r mcp-server/requirements.txt
```

```json
{
  "mcpServers": {
    "redmine": {
      "command": "python",
      "args": ["/absolute/path/to/mcp-server/mcp_server.py"],
      "env": {
        "REDMINE_BASE_URL": "http://localhost:3000",
        "REDMINE_API_KEY": "your-redmine-api-key"
      }
    }
  }
}
```

## 共有サーバー（HTTP + 認証）

チームで1つの MCP エンドポイントを共有する場合は http モードで起動します。ステートレスな
Streamable HTTP で動き、リクエストは **JWT(Bearer) 認証**で保護されます。トークンは
AIRedmine backend が発行する JWT をそのまま使えます（同じ `JWT_SECRET`）。

```bash
docker compose --profile mcp up -d --build mcp
# → http://localhost:8848/mcp で待ち受け
```

追加の環境変数:

| 変数 | 説明 |
| --- | --- |
| `MCP_TRANSPORT` | `http` で HTTP モード（既定 `stdio`） |
| `MCP_HTTP_PORT` | 待受ポート（既定 `8848`） |
| `JWT_SECRET` | Bearer JWT の検証鍵（backend と共有） |
| `REDMINE_SWITCH_USER` | `1` で `X-Redmine-Switch-User` による本人操作を有効化 |

### 認証と identity

- リクエストは `Authorization: Bearer <JWT>` が必須。無効・欠落なら **401**（ツールに到達しない）。
- `REDMINE_SWITCH_USER=1` かつ `REDMINE_API_KEY` が **admin 権限**のとき、ツールは JWT の `username` を
  `X-Redmine-Switch-User` に載せて**認証ユーザー本人として** Redmine を操作する。監査ログも本人に記録される。
- `REDMINE_SWITCH_USER` を空にすると、全リクエストが単一 API キーのユーザーとして動作する。
- 書き込み（コメント・更新等）は Redmine 側で**その本人のロール権限**が必要。権限が無いと 403 になる
  （読み取りは本人として成功する）。共有運用では対象ロールに必要な権限を付与する。

### クライアント登録例

```json
{
  "mcpServers": {
    "redmine": {
      "type": "http",
      "url": "http://localhost:8848/mcp",
      "headers": { "Authorization": "Bearer <JWT>" }
    }
  }
}
```

> セキュリティ: 認証を有効にする HTTP モードは、公開時は必ず TLS（リバースプロキシ）越しにする。
> `REDMINE_API_KEY` に admin キーを使うため、エンドポイントとキーの保護が前提。

## backend の AI Agent を MCP 経由に一本化する（任意）

web アプリの backend は既定では自前の Redmine Connector で Redmine を操作するが、
`MCP_SERVER_URL` を設定すると **AI Agent の Redmine 参照ツールと、承認された更新の実行**を
この共有 MCP サーバー経由に一本化できる（「Redmine と話す実装」を MCP 側に集約）。

```yaml
# docker-compose の backend に設定（未設定なら従来の Connector・モックも動く）
environment:
  MCP_SERVER_URL: http://mcp:8848/mcp
```

- 有効化には共有 MCP サーバー（http モード）を起動しておく: `docker compose --profile mcp up -d mcp`
- backend はログインユーザーの JWT を MCP に転送し、MCP 側が `X-Redmine-Switch-User` で**本人として**操作する。
- **更新は従来どおり proposal → 人間が承認 → 実行**の順で、承認されたものだけが MCP 経由で反映される（AI 呼び出し時点では実行しない）。
- PM のバーンダウン/統計や issue 詳細 API は、豊富なフィールドとモックが必要なため backend の Connector のまま。
- 注意: `MCP_SERVER_URL` を設定したまま MCP サーバーを起動しないと、Chat / 更新実行が失敗する。無効化するには `MCP_SERVER_URL` を空にする。

## 動作確認

接続後、Claude Code で次のように依頼すると Redmine を操作できます。

- 「未完了の issue を 5 件見せて」（`list_issues`）
- 「#123 の詳細とコメント履歴を教えて」（`get_issue`）
- 「"ログイン" に関する issue を検索して」（`search_issues`）
- 「kintai-next プロジェクトに『○○のバグ』という issue を作って」（`create_issue`）

接続状態は `claude mcp list` で確認できます。
