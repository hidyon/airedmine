"""
初期ユーザーを DB に投入するスクリプト。
Redmine のログイン名・ユーザー ID と合わせて管理する。
既存ユーザーは全削除して再投入する。

実行方法:
    docker compose exec backend python scripts/seed_users.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db import init_db, get_connection

SEED_USERS = [
    {"username": "admin",    "display_name": "Redmine Admin", "role": "developer", "redmine_user_id": 1},
    {"username": "tanaka",   "display_name": "田中 健太",      "role": "developer", "redmine_user_id": 5},
    {"username": "sato",     "display_name": "佐藤 誠",        "role": "developer", "redmine_user_id": 6},
    {"username": "ito",      "display_name": "伊藤 大輔",      "role": "developer", "redmine_user_id": 7},
    {"username": "yamada",   "display_name": "山田 真由美",     "role": "developer", "redmine_user_id": 8},
    {"username": "nakamura", "display_name": "中村 雄二",       "role": "pm",        "redmine_user_id": 9},
]


def main() -> None:
    init_db()
    with get_connection() as conn:
        conn.execute("DELETE FROM users")
        for u in SEED_USERS:
            conn.execute(
                """
                INSERT INTO users (username, display_name, role, redmine_user_id, created_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                """,
                (u["username"], u["display_name"], u["role"], u["redmine_user_id"]),
            )
        conn.commit()

    print(f"✓ {len(SEED_USERS)} ユーザーを投入しました")
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT username, display_name, role, redmine_user_id FROM users ORDER BY id"
        ).fetchall()
        for r in rows:
            print(f"  {r['username']:12s} {r['display_name']:16s} {r['role']:10s} Redmine ID: {r['redmine_user_id']}")


if __name__ == "__main__":
    main()
