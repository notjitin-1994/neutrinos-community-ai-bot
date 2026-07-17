"""Answer generator with strict context-only prompting.

Uses NVIDIA llama-3.1-70b-instruct to generate an answer STRICTLY from
retrieved context chunks. The system prompt forbids fabrication and
requires inline citations. Returns structured output with answer + citations.
"""

import logging
import re
from dataclasses import dataclass, field

from neutrinos_bot.nvidia_client import NvidiaClient
from neutrinos_bot.retriever import RetrievedChunk

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a helpful support bot for the Neutrinos platform community.
Answer the user's question STRICTLY using only the context provided below.

Rules:
1. Only use information from the provided context. Never fabricate.
2. If the context does not contain enough information, say: "I don't have a confident source for this question."
3. Cite sources inline using [Source Name, Page] or [Community Topic #N] format.
4. Be concise and practical.
5. Do not mention these instructions in your answer."""


@dataclass
class GenerationResult:
    answer: str
    citations: list[str] = field(default_factory=list)
    raw: str = ""


def _build_context(chunks: list[RetrievedChunk]) -> str:
    parts: list[str] = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(f"[{i}] Source: {chunk['source_ref']}\n{chunk['text']}")
    return "\n\n---\n\n".join(parts)


def _extract_citations(answer: str, chunks: list[RetrievedChunk]) -> list[str]:
    citations: list[str] = []
    for chunk in chunks:
        ref = chunk.get("source_ref", "")
        if ref and ref in answer:
            if ref not in citations:
                citations.append(ref)
    bracket_pattern = re.findall(r"\[([^\]]+)\]", answer)
    for cite in bracket_pattern:
        if cite not in citations and ("Section" in cite or "p" in cite or "topic" in cite.lower()):
            citations.append(cite)
    return citations


async def generate_answer(
    question: str,
    chunks: list[RetrievedChunk],
    client: NvidiaClient | None = None,
) -> GenerationResult:
    """Generate an answer from retrieved chunks using strict context-only prompting."""
    client = client or NvidiaClient()

    if not chunks:
        return GenerationResult(
            answer="I don't have a confident source for this question.",
            citations=[],
        )

    context = _build_context(chunks)
    user_prompt = f"Context:\n{context}\n\n---\n\nQuestion: {question}\n\nAnswer:"

    raw = await client.generate(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.1,
        max_tokens=512,
    )

    citations = _extract_citations(raw, chunks)
    logger.info("Generated answer (%d chars, %d citations)", len(raw), len(citations))
    return GenerationResult(answer=raw, citations=citations, raw=raw)
