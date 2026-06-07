"""
初期ユーザーを DB に投入するスクリプト。
既存ユーザーはスキップされる（INSERT OR IGNORE）。
redmine_user_id は実際の Redmine インスタンスに合わせて変更してください。

実行方法:
    docker compose exec backend python scripts/seed_users.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import init_db, get_connection

SEED_USERS = [
    {"username": "alice", "display_name": "Alice", "role": "developer", "redmine_user_id": 3},
    {"username": "bob",   "display_name": "Bob",   "role": "developer", "redmine_user_id": 4},
    {"username": "carol", "display_name": "Carol",  "role": "pm",        "redmine_user_id": 5},
]


def main() -> None:
    init_db()
    with get_connection() as conn:
        for u in SEED_USERS:
            conn.execute(
                """
                INSERT OR IGNORE INTO users (username, display_name, role, redmine_user_id, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                """,
                (u["username"], u["display_name"], u["role"], u["redmine_user_id"]),
            )
            # 既存ユーザーの redmine_user_id を更新する
            conn.execute(
                "UPDATE users SET redmine_user_id=? WHERE username=? AND redmine_user_id IS NULL",
                (u["redmine_user_id"], u["username"]),
            )
        conn.commit()

    print(f"✓ {len(SEED_USERS)} ユーザーを投入しました（既存はスキップ）")
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT username, display_name, role, redmine_user_id FROM users ORDER BY id"
        ).fetchall()
        for r in rows:
            rid = r["redmine_user_id"] or "未設定"
            print(f"  {r['username']:10s} {r['display_name']:20s} {r['role']:10s} Redmine ID: {rid}")


if __name__ == "__main__":
    main()
