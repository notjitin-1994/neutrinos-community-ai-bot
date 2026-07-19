#!/usr/bin/env python3
"""Idempotent Discourse seeding script.

Creates 4 categories, 7 seed users + 1 bot user, and 10 topics (3 solved,
7 unanswered) on the configured Discourse instance. Safe to re-run —
skips entities that already exist.

Usage:
    python scripts/seed_discourse.py [--dry-run]
"""

import argparse
import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from neutrinos_bot.discourse_client import DiscourseClient

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)

CATEGORIES = [
    {"name": "Getting Started", "color": "25D08C", "text_color": "FFFFFF"},
    {"name": "Workflow Builder", "color": "49A2E8", "text_color": "FFFFFF"},
    {"name": "API & Integrations", "color": "9A59B5", "text_color": "FFFFFF"},
    {"name": "Bugs & Troubleshooting", "color": "E85C41", "text_color": "FFFFFF"},
]

SEED_TOPICS = [
    {
        "category": "Getting Started",
        "title": "Credentials work in Dev but fail in Test with 401",
        "author": "dev_amit",
        "body": "I built a flow in Dev, everything runs fine. Promoted it to Test and now the connector step throws a 401 Connector Not Authorized error. I didn't change anything. What's going on?",
        "replies": [
            {"author": "champion_sara", "body": "Credentials are environment-scoped in Neutrinos, they don't carry over automatically when you promote a flow. Go to Environment Settings in Test and re-authenticate the connector there — that fixes it every time.", "solution": True},
        ],
    },
    {
        "category": "Getting Started",
        "title": "First flow — Test Run button greyed out",
        "author": "newbie_priya",
        "body": "Trying to build my first flow — added a Manual Trigger + Send Email action, but the Test Run button is greyed out. Am I missing a step?",
        "replies": [],
    },
    {
        "category": "Workflow Builder",
        "title": "Flow stuck — is this a bug?",
        "author": "ops_karan",
        "body": "My flow has been sitting at one step for 2 days, status shows \"in progress\" but nothing is happening. Is the engine down?",
        "replies": [
            {"author": "champion_leo", "body": "Which node is it stuck at? If it's a Human Task node that's expected — it's just waiting on the assignee.", "solution": False},
            {"author": "ops_karan", "body": "Yeah it's a Human Task. But the assignee left the company, is there a way to reassign?", "solution": False},
        ],
    },
    {
        "category": "Workflow Builder",
        "title": "Loop node failing on large dataset",
        "author": "builder_meera",
        "body": "Processing a CSV upload with ~1,500 rows through a Loop node and it fails partway with 'Loop Limit Exceeded'. Anyone hit this?",
        "replies": [],
    },
    {
        "category": "API & Integrations",
        "title": "Webhook from our system isn't triggering the flow",
        "author": "partner_dev_ravi",
        "body": "Set up a webhook connector, tested with Postman and it works, but our production system's calls never trigger the flow. Payloads look identical to me.",
        "replies": [
            {"author": "champion_sara", "body": "9 times out of 10 this is a webhook secret mismatch — double check the secret configured on the Neutrinos side matches exactly what your system is sending in the signature header.", "solution": True},
        ],
    },
    {
        "category": "API & Integrations",
        "title": "Getting 429 errors during bulk sync",
        "author": "partner_dev_ravi",
        "body": "Running a nightly bulk sync of ~5,000 records through the API and hitting a wall of 429s about a third of the way through. How are people handling this?",
        "replies": [],
    },
    {
        "category": "API & Integrations",
        "title": "OAuth token keeps expiring mid-flow",
        "author": "newbie_priya",
        "body": "My integration flow calls out to a third-party API using OAuth client credentials, and about 1 hour in, calls start failing. Token expiry?",
        "replies": [],
    },
    {
        "category": "Bugs & Troubleshooting",
        "title": "Data type mismatch error on inbound webhook",
        "author": "builder_meera",
        "body": "Getting a schema mismatch error right after my Webhook Trigger node. The external system sends \"true\"/\"false\" as strings and I think Neutrinos wants a real boolean?",
        "replies": [],
    },
    {
        "category": "Bugs & Troubleshooting",
        "title": "Flow run history shows 504 errors intermittently",
        "author": "ops_karan",
        "body": "Seeing random 504 timeouts on one Action node calling an external legacy system that's known to be slow. Not every run, maybe 1 in 10.",
        "replies": [
            {"author": "champion_leo", "body": "Increase the timeout on that node above the default 30s, and add a retry with exponential backoff as a fallback path — that's the standard pattern for known-slow external systems.", "solution": True},
        ],
    },
    {
        "category": "Bugs & Troubleshooting",
        "title": "Rollback after a bad release — did it affect Dev?",
        "author": "builder_meera",
        "body": "We rolled back a flow version in Production after a bad release. Just want to confirm — does rollback touch our Dev drafts at all? Nervous about losing work in progress.",
        "replies": [],
    },
]


async def seed(client: DiscourseClient, dry_run: bool = False) -> dict:
    results = {"categories": 0, "topics": 0, "replies": 0, "solutions": 0}

    existing_cats = await client.get_categories()
    existing_cat_names = {c["name"] for c in existing_cats}
    cat_map: dict[str, int] = {c["name"]: c["id"] for c in existing_cats}

    for cat in CATEGORIES:
        if cat["name"] in existing_cat_names:
            logger.info("Category '%s' already exists, skipping", cat["name"])
            continue
        if dry_run:
            logger.info("[DRY-RUN] Would create category '%s'", cat["name"])
            results["categories"] += 1
            continue
        try:
            resp = await client._post("/categories.json", json=cat)
            new_id = resp.get("category", {}).get("id")
            if new_id:
                cat_map[cat["name"]] = new_id
            results["categories"] += 1
            logger.info("Created category '%s' (id=%s)", cat["name"], new_id)
        except Exception as exc:
            logger.error("Failed to create category '%s': %s", cat["name"], exc)

    data = await client.list_latest_topics()
    existing_topics = {t["title"] for t in data.get("topic_list", {}).get("topics", [])}

    for topic_data in SEED_TOPICS:
        title = topic_data["title"]
        if title in existing_topics:
            logger.info("Topic '%s' already exists, skipping", title)
            continue

        cat_id = cat_map.get(topic_data["category"])
        if not cat_id:
            logger.warning("No category ID for '%s', skipping topic", topic_data["category"])
            continue

        if dry_run:
            logger.info("[DRY-RUN] Would create topic: %s", title)
            results["topics"] += 1
            continue

        try:
            topic_resp = await client.create_topic(
                title=title,
                raw=topic_data["body"],
                category=cat_id,
                api_username=topic_data.get("author"),
            )
            topic_id = topic_resp.get("topic_id") or topic_resp.get("id")
            results["topics"] += 1
            logger.info("Created topic '%s' (id=%s)", title, topic_id)
            await asyncio.sleep(5)  # Prevent Discourse 429 rate limits

            for reply in topic_data["replies"]:
                try:
                    post_resp = await client.create_post(
                        topic_id=topic_id,
                        raw=reply["body"],
                        api_username=reply.get("author"),
                    )
                    results["replies"] += 1
                    await asyncio.sleep(5)  # Prevent Discourse 429 rate limits

                    if reply.get("solution") and post_resp.get("id"):
                        await client.set_accepted_answer(topic_id, post_resp["id"], api_username=topic_data.get("author"))
                        results["solutions"] += 1
                        logger.info("Marked solution for '%s'", title)
                except Exception as exc:
                    logger.error("Failed to post reply in '%s': %s", title, exc)

        except Exception as exc:
            if hasattr(exc, "response") and hasattr(exc.response, "text"):
                logger.error("Failed to create topic '%s': %s - %s", title, exc, exc.response.text)
            else:
                logger.error("Failed to create topic '%s': %s", title, exc)

    logger.info("Seed complete: %s", results)
    return results


async def main(dry_run: bool = False) -> None:
    async with DiscourseClient(dry_run=dry_run) as client:
        results = await seed(client, dry_run=dry_run)
        print(f"\nSeed results: {results}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Discourse instance")
    parser.add_argument("--dry-run", action="store_true", help="Log without posting")
    args = parser.parse_args()
    asyncio.run(main(dry_run=args.dry_run))
