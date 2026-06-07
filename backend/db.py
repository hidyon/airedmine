import os
import sqlite3
from pathlib import Path

DB_PATH = Path(os.getenv("DB_PATH", "/app/data/airedmaine.db"))


def get_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS experience_notes (
                id          TEXT PRIMARY KEY,
                created_at  TEXT NOT NULL,
                role        TEXT NOT NULL,
                moment      TEXT NOT NULL,
                signal      TEXT NOT NULL,
                note        TEXT NOT NULL,
                next_action TEXT NOT NULL DEFAULT ''
            )
        """)
        conn.commit()
