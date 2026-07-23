import asyncio
import sys
import sqlite3
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from neutrinos_bot.discourse_client import DiscourseClient

async def main():
    async with DiscourseClient() as client:
        # 1. Find the topic
        data = await client.list_latest_topics()
        topics = data.get("topic_list", {}).get("topics", [])
        
        target_topic = None
        for t in topics:
            if "ServiceNow" in t.get("title", ""):
                target_topic = t
                break
                
        if not target_topic:
            print("Could not find a topic with 'ServiceNow' in the title.")
            # fallback: look inside the posts?
            # Actually, the user's title might be different. Let's just grab the latest topics and fetch their first post.
            for t in topics:
                posts = await client.get_topic_posts(t["id"])
                if any("ServiceNow" in p["cooked"] for p in posts):
                    target_topic = t
                    break

        if not target_topic:
            print("Could not find the ServiceNow topic at all.")
            return
            
        topic_id = target_topic["id"]
        print(f"Found topic: {topic_id} - {target_topic['title']}")
        
        # 2. Get post_id from state.db
        conn = sqlite3.connect("state.db")
        conn.row_factory = sqlite3.Row
        row = conn.execute("SELECT post_id FROM bot_state WHERE topic_id = ?", (topic_id,)).fetchone()
        
        if row and row["post_id"]:
            post_id = row["post_id"]
            print(f"Deleting bot post {post_id}...")
            # Delete post
            try:
                await client._delete(f"/posts/{post_id}.json")
                print("Post deleted successfully.")
            except Exception as e:
                print(f"Failed to delete post: {e}")
        else:
            print("No bot post ID found in state.db for this topic.")
            
        # 3. Clear from state.db
        print(f"Removing topic {topic_id} from state.db...")
        conn.execute("DELETE FROM bot_state WHERE topic_id = ?", (topic_id,))
        conn.commit()
        conn.close()
        print("Done. State cleared.")
        
if __name__ == "__main__":
    asyncio.run(main())
