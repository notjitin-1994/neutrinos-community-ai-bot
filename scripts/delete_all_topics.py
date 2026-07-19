#!/usr/bin/env python3
import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from neutrinos_bot.discourse_client import DiscourseClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

async def delete_all(client: DiscourseClient):
    data = await client.list_latest_topics()
    existing_topics = {t["title"]: t["id"] for t in data.get("topic_list", {}).get("topics", [])}
    
    deleted = 0
    for title, topic_id in existing_topics.items():
        # Optional: you can uncomment the next lines to skip the default welcome topic
        # if "Welcome to Discourse" in title or "Welcome to your new community" in title:
        #     continue
            
        try:
            await client.delete_topic(topic_id, api_username="system")
            logger.info(f"Deleted topic '{title}' (id={topic_id})")
            deleted += 1
        except Exception as e:
            logger.error(f"Failed to delete topic '{title}': {e}")
                
    logger.info(f"Cleanup complete: {deleted} topics deleted.")

async def main():
    async with DiscourseClient() as client:
        await delete_all(client)

if __name__ == "__main__":
    asyncio.run(main())
