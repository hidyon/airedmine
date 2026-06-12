# Redmine MCP サーバー

Claude Code などの MCP クライアントから Redmine を直接操作するためのサーバーです。
AIRedmine の web アプリ（ブラウザ体験）とは独立して動作します。

- web アプリ: ブラウザ → AIRedmine（React + FastAPI）→ Redmine
- MCP サーバー: Claude Code → Redmine MCP Server → Redmine

実装は [`mcp-server/`](../mcp-server/) にあります。トランスポートは stdio です。

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

## 動作確認

接続後、Claude Code で次のように依頼すると Redmine を操作できます。

- 「未完了の issue を 5 件見せて」（`list_issues`）
- 「#123 の詳細とコメント履歴を教えて」（`get_issue`）
- 「"ログイン" に関する issue を検索して」（`search_issues`）
- 「kintai-next プロジェクトに『○○のバグ』という issue を作って」（`create_issue`）

接続状態は `claude mcp list` で確認できます。
