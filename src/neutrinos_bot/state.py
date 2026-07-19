"""SQLite idempotency store for tracking bot-answered topics.

Prevents the bot from double-posting to the same topic across runs.
Uses a simple topics table keyed by topic_id.
"""

import logging
import sqlite3
import time
from pathlib import Path

logger = logging.getLogger(__name__)

_SCHEMA = """
CREATE TABLE IF NOT EXISTS bot_state (
    topic_id      INTEGER PRIMARY KEY,
    bot_answered  INTEGER DEFAULT 0,
    post_id       INTEGER,
    answer_type   TEXT,
    confidence    REAL,
    first_seen    REAL,
    last_human_at REAL,
    last_checked  REAL,
    created_at    REAL DEFAULT (strftime('%s','now')),
    ingested      INTEGER DEFAULT 0
);

"""


class StateStore:
    """SQLite-backed idempotency store."""

    def __init__(self, db_path: str = "state.db") -> None:
        self._db_path = db_path
        self._conn: sqlite3.Connection | None = None

    def connect(self) -> None:
        """Open the database connection and ensure schema exists."""
        Path(self._db_path).parent.mkdir(parents=True, exist_ok=True)
        self._conn = sqlite3.connect(self._db_path)
        self._conn.row_factory = sqlite3.Row
        self._conn.executescript(_SCHEMA)
        try:
            self._conn.execute("ALTER TABLE bot_state ADD COLUMN ingested INTEGER DEFAULT 0;")
        except sqlite3.OperationalError:
            pass # column might already exist
        self._conn.commit()
        logger.info("StateStore connected to %s", self._db_path)

    @property
    def conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self.connect()
        assert self._conn is not None
        return self._conn

    def close(self) -> None:
        if self._conn:
            self._conn.close()
            self._conn = None

    # ---- Queries ----

    def is_bot_answered(self, topic_id: int) -> bool:
        """Check if the bot already answered this topic."""
        row = self.conn.execute(
            "SELECT bot_answered FROM bot_state WHERE topic_id = ?", (topic_id,)
        ).fetchone()
        return bool(row and row["bot_answered"])

    def is_ingested(self, topic_id: int) -> bool:
        """Check if the topic has been ingested into vector DB."""
        row = self.conn.execute(
            "SELECT ingested FROM bot_state WHERE topic_id = ?", (topic_id,)
        ).fetchone()
        return bool(row and row["ingested"])


    def get_state(self, topic_id: int) -> dict | None:
        """Get full state row for a topic, or None if unknown."""
        row = self.conn.execute(
            "SELECT * FROM bot_state WHERE topic_id = ?", (topic_id,)
        ).fetchone()
        return dict(row) if row else None

    def get_all_answered(self) -> list[int]:
        """Get all topic_ids the bot has answered."""
        rows = self.conn.execute(
            "SELECT topic_id FROM bot_state WHERE bot_answered = 1"
        ).fetchall()
        return [r["topic_id"] for r in rows]

    # ---- Mutations ----

    def record_topic_seen(self, topic_id: int, last_human_at: float | None = None) -> None:
        """Insert or update a topic's first_seen / last_human_at. Idempotent."""
        now = time.time()
        if last_human_at is None:
            last_human_at = now
        self.conn.execute(
            """
            INSERT INTO bot_state (topic_id, first_seen, last_human_at, last_checked)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(topic_id) DO UPDATE SET
                last_human_at = excluded.last_human_at,
                last_checked = excluded.last_checked
            """,
            (topic_id, now, last_human_at, now),
        )
        self.conn.commit()

    def mark_answered(
        self,
        topic_id: int,
        post_id: int | None = None,
        answer_type: str = "answer",
        confidence: float | None = None,
    ) -> None:
        """Mark a topic as bot-answered. Idempotent."""
        now = time.time()
        self.conn.execute(
            """
            INSERT INTO bot_state (topic_id, bot_answered, post_id, answer_type, confidence, last_checked)
            VALUES (?, 1, ?, ?, ?, ?)
            ON CONFLICT(topic_id) DO UPDATE SET
                bot_answered = 1,
                post_id = excluded.post_id,
                answer_type = excluded.answer_type,
                confidence = excluded.confidence,
                last_checked = excluded.last_checked
            """,
            (topic_id, post_id, answer_type, confidence, now),
        )
        self.conn.commit()
        logger.info("Marked topic %d as answered (type=%s, conf=%s)", topic_id, answer_type, confidence)

    def mark_ingested(self, topic_id: int) -> None:
        """Mark a topic as ingested into vector DB. Idempotent."""
        self.conn.execute(
            """
            INSERT INTO bot_state (topic_id, ingested)
            VALUES (?, 1)
            ON CONFLICT(topic_id) DO UPDATE SET ingested = 1
            """,
            (topic_id,)
        )
        self.conn.commit()
        logger.info("Marked topic %d as ingested", topic_id)


    def update_last_checked(self, topic_id: int) -> None:
        """Update last_checked timestamp for a topic."""
        now = time.time()
        self.conn.execute(
            "UPDATE bot_state SET last_checked = ? WHERE topic_id = ?",
            (now, topic_id),
        )
        self.conn.commit()
