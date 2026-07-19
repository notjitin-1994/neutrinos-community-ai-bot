import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from neutrinos_bot.discourse_client import DiscourseClient

async def main():
    async with DiscourseClient() as c:
        settings = {
            "unique_posts_mins": 0,
            "min_title_similar_length": 0,
            "min_body_similar_length": 0,
            "rate_limit_create_topic": 0,
            "rate_limit_create_post": 0,
            "max_topics_in_first_day": 0,
            "max_replies_in_first_day": 0,
        }
        for k, v in settings.items():
            try:
                await c._http.put(f"/admin/site_settings/{k}", json={k: v}, headers={"Api-Username": "system"})
                print(f"Set {k} = {v}")
            except Exception as e:
                print(f"Failed to set {k}: {e}")

if __name__ == "__main__":
    asyncio.run(main())
