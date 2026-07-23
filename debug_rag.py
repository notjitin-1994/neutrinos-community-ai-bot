import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from neutrinos_bot.retriever import retrieve
from neutrinos_bot.confidence import evaluate
from neutrinos_bot.generator import generate_answer

async def main():
    title = "Pre-built connector for ServiceNow?"
    cooked_question = "<p>We want to trigger a workflow that automatically creates an incident ticket in ServiceNow when a specific database record is updated.</p>\n<p>Do I have to build a custom REST API call to do this, or is there a pre-built connector for ServiceNow?</p>"
    
    print(f"Retrieving with cooked HTML...")
    chunks = await retrieve(cooked_question)
    
    print("\n--- RETRIEVED CHUNKS ---")
    for i, c in enumerate(chunks):
        print(f"\nChunk {i+1} [Sim: {c['similarity']:.3f}] [Source: {c['source_ref']}]")
        
    conf = evaluate(chunks)
    print("\n--- CONFIDENCE EVALUATION ---")
    print(f"Confident: {conf.confident}")
    print(f"Score: {conf.score:.3f}")
    
    print("\n--- LLM GENERATION ---")
    conversation_text = f"Title: {title}\nnot.jitin: {cooked_question}"
    gen = await generate_answer(conversation_text, chunks)
    print(f"\nRaw Answer:\n{gen.answer}")
    print(f"Citations Extracted: {gen.citations}")

if __name__ == "__main__":
    asyncio.run(main())
