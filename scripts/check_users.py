import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

import asyncio
from neutrinos_bot.discourse_client import DiscourseClient

async def main():
    async with DiscourseClient() as c:
        users = await c.get_users()
        print([u.get('username') for u in users])

if __name__ == "__main__":
    asyncio.run(main())
