import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))
from neutrinos_bot.discourse_client import DiscourseClient

async def seed_test_case_3():
    async with DiscourseClient() as client:
        print("Fetching categories...")
        cats = await client.get_categories()
        cat_id = next((c["id"] for c in cats if c["name"] == "Bugs & Troubleshooting"), None)
        if not cat_id:
            print("Category 'Bugs & Troubleshooting' not found.")
            return

        print("1. Creating the main topic as user 'ops_karan'...")
        topic_resp = await client.create_topic(
            title="Global Error Handler is swallowing business logic errors",
            raw="I attached a Global Error Handler to my workflow, but it's catching absolutely everything—even validation errors that I want to return to the user. How do I restrict it to only catch external API timeouts?",
            category=cat_id,
            api_username="ops_karan"
        )
        topic_id = topic_resp.get("topic_id") or topic_resp.get("id")
        print(f"Created topic ID: {topic_id}")
        await asyncio.sleep(3)

        print("2. Creating the partial human reply from 'champion_sara'...")
        await client.create_post(
            topic_id=topic_id,
            raw="There should be an 'Error Type' dropdown on the handler node where you can filter what it catches.",
            api_username="champion_sara"
        )
        await asyncio.sleep(3)

        print("3. Creating the OP's follow-up question as 'ops_karan'...")
        await client.create_post(
            topic_id=topic_id,
            raw="I see the dropdown, but how do I specifically filter by an HTTP 504 status code using a custom condition?",
            api_username="ops_karan"
        )
        print("Successfully seeded Test Case 3!")

if __name__ == "__main__":
    asyncio.run(seed_test_case_3())
