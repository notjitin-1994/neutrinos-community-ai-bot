import asyncio
from neutrinos_bot.retriever import retrieve
from neutrinos_bot.confidence import compute_score
from neutrinos_bot.nvidia_client import NvidiaClient

async def main():
    query = "Getting a schema mismatch error right after my Webhook Trigger node. The external system sends 'true'/'false' as strings and I think Neutrinos wants a real boolean?"
    client = NvidiaClient()
    print("Retrieving chunks...")
    chunks = await retrieve(query, client=client, top_k=5)
    
    print(f"\nFound {len(chunks)} chunks:")
    for i, c in enumerate(chunks):
        print(f"\n--- Chunk {i+1} [Sim: {c['similarity']:.3f}, Source: {c['source']}] ---")
        print(c['text'])
        
    score = compute_score(chunks)
    print(f"\nFinal Confidence Score: {score:.3f}")

if __name__ == '__main__':
    asyncio.run(main())
