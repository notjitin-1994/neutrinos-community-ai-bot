import asyncio
import chromadb
from neutrinos_bot.nvidia_client import NvidiaClient

async def main():
    client = NvidiaClient()
    query = "Flow stuck"
    embed = await client.embed_query(query)
    
    db = chromadb.PersistentClient(path='chroma')
    col = db.get_collection('neutrinos_knowledge')
    res = col.query(query_embeddings=[embed], n_results=1, include=["distances"])
    
    dist = res["distances"][0][0]
    print(f"dist: {dist}")
    print(f"1 - dist: {1.0 - dist}")
    print(f"1 - (dist / 2): {1.0 - (dist / 2.0)}")

asyncio.run(main())
