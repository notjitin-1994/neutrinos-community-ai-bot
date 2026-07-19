#!/usr/bin/env python3
import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from neutrinos_bot.discourse_client import DiscourseClient
from seed_discourse import SEED_TOPICS

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

async def unseed(client: DiscourseClient, dry_run: bool = False):
    data = await client.list_latest_topics()
    existing_topics = {t["title"]: t["id"] for t in data.get("topic_list", {}).get("topics", [])}
    
    seed_titles = {t["title"] for t in SEED_TOPICS}
    
    deleted = 0
    for title, topic_id in existing_topics.items():
        if title in seed_titles:
            if dry_run:
                logger.info(f"[DRY-RUN] Would delete topic '{title}' (id={topic_id})")
                deleted += 1
                continue
            
            try:
                await client.delete_topic(topic_id, api_username="system")
                logger.info(f"Deleted topic '{title}' (id={topic_id})")
                deleted += 1
            except Exception as e:
                logger.error(f"Failed to delete topic '{title}': {e}")
                
    logger.info(f"Unseed complete: {deleted} topics deleted.")

async def main(dry_run: bool = False):
    async with DiscourseClient(dry_run=dry_run) as client:
        await unseed(client, dry_run=dry_run)

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    asyncio.run(main(dry_run=args.dry_run))
