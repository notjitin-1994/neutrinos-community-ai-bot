import asyncio
import sys
import sqlite3
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from neutrinos_bot.discourse_client import DiscourseClient

async def main():
    async with DiscourseClient() as client:
        # Get all answered topics from state.db
        conn = sqlite3.connect("state.db")
        conn.row_factory = sqlite3.Row
        
        # Select all bot posts
        # We can just fetch all rows where post_id is not null
        rows = conn.execute("SELECT topic_id, post_id, created_at FROM bot_state WHERE post_id IS NOT NULL").fetchall()
        
        now = time.time()
        one_day = 24 * 60 * 60
        
        deleted_count = 0
        for row in rows:
            topic_id = row["topic_id"]
            post_id = row["post_id"]
            created_at = row["created_at"]
            
            # Check if it's from "today" (e.g. last 24 hours)
            if now - created_at < one_day:
                print(f"Deleting bot post {post_id} for topic {topic_id}...")
                try:
                    await client._delete(f"/posts/{post_id}.json")
                    print("Post deleted successfully.")
                    deleted_count += 1
                except Exception as e:
                    print(f"Failed to delete post: {e}")
                
                print(f"Removing topic {topic_id} from state.db...")
                conn.execute("DELETE FROM bot_state WHERE topic_id = ?", (topic_id,))
        
        conn.commit()
        conn.close()
        print(f"Done. Deleted {deleted_count} recent bot answers and cleared their state.")

if __name__ == "__main__":
    asyncio.run(main())
