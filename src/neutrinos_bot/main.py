"""FastAPI app + CLI entrypoints.

Provides:
  - GET  /health  — health check
  - POST /run     — trigger one SLA monitor cycle
  - POST /webhook — optional event-driven trigger (bonus)
  - CLI: python -m neutrinos_bot.main run [--once|--watch] [--dry-run]
"""

import argparse
import asyncio
import logging
import sys

from fastapi import FastAPI

from neutrinos_bot.config import get_settings
from neutrinos_bot.discourse_client import DiscourseClient
from neutrinos_bot.state import StateStore

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="Neutrinos SLA Bot", version="0.1.0")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "neutrinos-sla-bot"}


@app.post("/run")
async def run_one_cycle(dry_run: bool = False) -> dict:
    """Trigger one SLA scan + RAG + post cycle."""
    from neutrinos_bot.confidence import evaluate
    from neutrinos_bot.generator import generate_answer
    from neutrinos_bot.post_back import post_reply
    from neutrinos_bot.retriever import retrieve
    from neutrinos_bot.sla_monitor import run_cycle

    settings = get_settings()
    state = StateStore(settings.state_db_path)
    state.connect()

    async with DiscourseClient(dry_run=dry_run) as client:
        candidates = await run_cycle(client, state, dry_run=dry_run)
        results = []
        for candidate in candidates:
            chunks = await retrieve(candidate.question)
            conf = evaluate(chunks)
            if conf.confident:
                human_replies = [
                    p.get("cooked", p.get("raw", ""))
                    for p in candidate.posts[1:]
                    if p.get("username") != "neutrinos_bot"
                ]
                
                # Build full conversation history for context
                conversation = [f"Title: {candidate.title}"]
                for p in candidate.posts:
                    author = p.get("username", "user")
                    body = p.get("cooked", p.get("raw", ""))
                    conversation.append(f"{author}: {body}")
                conversation_text = "\n\n".join(conversation)
                
                gen = await generate_answer(conversation_text, chunks, human_replies=human_replies)
                
                # If the LLM generated an answer but failed to cite any sources, it hallucinated.
                # Force an escalation instead of posting an un-cited answer.
                if not gen.citations or "don't have a confident source" in gen.answer:
                    conf.confident = False
            else:
                from neutrinos_bot.generator import GenerationResult
                gen = GenerationResult(answer="I don't have a confident source.", citations=[])
            try:
                result = await post_reply(
                    candidate.topic_id, candidate.question, gen, conf, client, state
                )
                results.append(result)
            except Exception as e:
                logger.error("Failed to post reply for topic #%d: %s", candidate.topic_id, e)
                
            # Sleep to prevent hitting Discourse 429 Too Many Requests rate limiter
            if len(candidates) > 1:
                await asyncio.sleep(10)
        return {"candidates": len(candidates), "results": results}


@app.post("/webhook")
async def webhook(payload: dict) -> dict:
    """Optional webhook endpoint for event-driven triggering."""
    event = payload.get("event", "unknown")
    if event == "post_created":
        return await run_one_cycle()
    return {"status": "ignored", "event": event}


def cli() -> None:
    """CLI entrypoint: python -m neutrinos_bot.main run [--once|--watch] [--dry-run]"""
    parser = argparse.ArgumentParser(description="Neutrinos SLA Bot")
    sub = parser.add_subparsers(dest="command")
    run_parser = sub.add_parser("run", help="Run the SLA monitor")
    run_parser.add_argument("--once", action="store_true", help="Run one cycle then exit")
    run_parser.add_argument("--watch", action="store_true", help="Run continuously")
    run_parser.add_argument("--dry-run", action="store_true", help="Log instead of posting")
    args = parser.parse_args()

    if args.command == "run":
        if args.once:
            asyncio.run(run_one_cycle(dry_run=args.dry_run))
        elif args.watch:
            asyncio.run(_watch_loop(args.dry_run))
        else:
            parser.print_help()
    else:
        parser.print_help()


async def _watch_loop(dry_run: bool) -> None:
    settings = get_settings()
    state = StateStore(settings.state_db_path)
    state.connect()
    
    cycle = 0
    while True:
        cycle += 1
        logger.info("=== SLA monitor cycle %d ===", cycle)
        await run_one_cycle(dry_run=dry_run)
        await asyncio.sleep(30)


if __name__ == "__main__":
    cli()
