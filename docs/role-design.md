# ロール設計

AIRedmine における `developer` / `pm` 2 ロールのアクセス設計を記録する。
認証の実装は後続 Milestone で行う。このドキュメントは設計レベルの定義として使う。

## ロール定義

| ロール | 対象ユーザー | 主な目的 |
|--------|-------------|---------|
| developer | 開発担当者 | 自分の担当 issue の把握、Chat での質問、Redmine へのコメント送信 |
| pm | プロジェクトマネージャー | プロジェクト全体の状態把握、停滞・リスクの観測、PM 判断待ち issue の確認 |

## View アクセス

| View | パス | developer | pm |
|------|------|-----------|-----|
| Developer Chat | `/developer/chat` | ○ | △ 読み取り可（更新案実行は除く） |
| Developer Dashboard | `/developer/dashboard` | ○ | × |
| PM View | `/pm` | × | ○ |
| Audit View | `/audit` | ○ 自分の操作ログ | ○ プロジェクト全体のログ |

## API アクセス

| エンドポイント | 説明 | developer | pm |
|--------------|------|-----------|-----|
| `GET /api/config` | 接続状態・設定情報 | ○ | ○ |
| `GET /api/issues` | issue 一覧 | ○ | ○ |
| `GET /api/issues/{id}` | issue 詳細・journals | ○ | ○ |
| `POST /api/chat` | 自然言語質問・更新案生成 | ○ | ○ |
| `POST /api/proposals/comment` | Redmine コメント送信 | ○ | × |
| `GET /api/proposals/logs` | 更新実行ログ | ○ 自分の操作 | ○ 全操作 |
| `GET /api/experience/notes` | 体験メモ一覧・集計 | ○ | ○ |
| `POST /api/experience/notes` | 体験メモ保存 | ○ | ○ |

## 操作権限の考え方

**developer が持つ権限:**

- 担当 issue を Chat で照会し、コメント更新案を生成できる。
- Proposal カードの「Redmine に送信」ボタンで実際にコメントを送信できる。
- 自分が送信した操作の Audit ログを確認できる。

**pm が持つ権限:**

- プロジェクト全体の issue を Chat で照会できる。
- PM View で停滞・リスク・PM 判断待ちを観測できる。
- Audit ログ全体を読み取れる（自分では Redmine を直接更新しない）。
- Redmine コメントの送信（`POST /api/proposals/comment`）は行わない。
  - PM が更新したい場合は developer に依頼するフローを想定する。

## 認証方式の検討候補

実装時には以下から選定する（現時点は未実装）。

| 方式 | メリット | デメリット |
|------|---------|-----------|
| JWT (Bearer token) | ステートレス・API クライアントと相性が良い | トークン失効の管理が必要 |
| セッション Cookie | ブラウザ向けにシンプル | API クライアントからの利用が煩雑 |
| OAuth 2.0 (GitHub / Google) | SSO でユーザー管理が不要 | 外部依存が増える |
| Redmine API キーをそのまま流用 | 追加の認証基盤が不要 | ロール管理が Redmine 側に依存する |

現在のプロトタイプ段階では認証なし。ロール切り替えは URL ルーティング (`/developer/*` / `/pm`) で代替している。

## 実装時の対応方針

1. バックエンドに `role` クレームを含む JWT を導入する。
2. `POST /api/proposals/comment` に `developer` ロールのみアクセス可能なガードを追加する。
3. `GET /api/proposals/logs` に pm ロールが全ログを、developer ロールが自分のログのみ取得できるフィルタを追加する。
4. フロントエンドはルーティング層でロールに応じたリダイレクトを行う。

関連 issue: ISS-056, ISS-053（FastAPI バックエンド）, ISS-054（React フロントエンド基盤）
