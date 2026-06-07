"""
初期ユーザーを DB に投入するスクリプト。
既存ユーザーはスキップされる（INSERT OR IGNORE）。

実行方法:
    docker compose exec backend python scripts/seed_users.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import init_db, get_connection

SEED_USERS = [
    {"username": "alice", "display_name": "Alice", "role": "developer"},
    {"username": "bob", "display_name": "Bob", "role": "developer"},
    {"username": "carol", "display_name": "Carol", "role": "pm"},
]


def main() -> None:
    init_db()
    with get_connection() as conn:
        for u in SEED_USERS:
            conn.execute(
                """
                INSERT OR IGNORE INTO users (username, display_name, role, created_at)
                VALUES (?, ?, ?, datetime('now'))
                """,
                (u["username"], u["display_name"], u["role"]),
            )
        conn.commit()

    print(f"✓ {len(SEED_USERS)} ユーザーを投入しました（既存はスキップ）")
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT username, display_name, role FROM users ORDER BY id"
        ).fetchall()
        for r in rows:
            print(f"  {r['username']:10s} {r['display_name']:20s} {r['role']}")


if __name__ == "__main__":
    main()
