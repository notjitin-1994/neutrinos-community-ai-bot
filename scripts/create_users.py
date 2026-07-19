import asyncio
import logging
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from neutrinos_bot.discourse_client import DiscourseClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

USERS = [
    {"username": "dev_amit", "name": "Dev Amit"},
    {"username": "champion_sara", "name": "Sara"},
    {"username": "newbie_priya", "name": "Priya"},
    {"username": "ops_karan", "name": "Karan"},
    {"username": "champion_leo", "name": "Leo"},
    {"username": "builder_meera", "name": "Meera"},
    {"username": "partner_dev_ravi", "name": "Ravi"},
]

async def create_users(client: DiscourseClient):
    for u in USERS:
        payload = {
            "name": u["name"],
            "email": f"{u['username']}@example.com",
            "password": "Password123!@",
            "username": u["username"],
            "active": True,
            "approved": True
        }
        try:
            # We must post this as system or neutrinos_bot. The default client uses neutrinos_bot.
            res = await client._post("/users.json", json=payload, api_username="system")
            logger.info(f"Created {u['username']}: {res}")
        except Exception as e:
            logger.error(f"Failed to create {u['username']}: {e}")
            
        # Optional: upgrade trust level to bypass new user limits
        try:
            # We can get user ID from username
            user_data = await client._get(f"/u/{u['username']}.json")
            user_id = user_data["user"]["id"]
            await client._http.put(f"/admin/users/{user_id}/trust_level", json={"level": 4}, headers={"Api-Username": "system"})
            logger.info(f"Upgraded {u['username']} to trust level 4")
        except Exception as e:
            logger.error(f"Failed to upgrade {u['username']}: {e}")

async def main():
    async with DiscourseClient() as client:
        await create_users(client)

if __name__ == "__main__":
    asyncio.run(main())
