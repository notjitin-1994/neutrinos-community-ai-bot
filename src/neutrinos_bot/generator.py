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

SYSTEM_PROMPT = """You are a helpful, expert support bot for the Neutrinos platform community.
Your goal is to provide verbose, highly conversational, and well-structured answers using ONLY the provided context.

Rules:
1. Only use information from the provided context. Never fabricate or hallucinate.
2. If the context does not contain enough information, set the "answer" field to: "I don't have a confident source for this question."
3. Do NOT include inline citations in the "answer" text. Instead, list the EXACT source strings (e.g., "Neutrinos_API_Integration_Guide.pdf p1" or "topic #202") in the "citations_used" array.
4. Make your "answer" verbose, friendly, and structured (use bullet points or bold text where helpful).
5. Output your response STRICTLY as a JSON object matching this schema, with no markdown code blocks or extra text:
{
  "answer": "Your conversational answer here...",
  "citations_used": ["exact source string 1"]
}"""


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
    valid_refs = {chunk.get("source_ref") for chunk in chunks if chunk.get("source_ref")}
    citations: list[str] = []
    
    # Check if any valid ref appears anywhere in the answer (e.g., inside brackets)
    for ref in valid_refs:
        if ref and ref in answer:
            citations.append(ref)
            
    return citations


async def generate_answer(
    question: str,
    chunks: list[RetrievedChunk],
    client: NvidiaClient | None = None,
    human_replies: list[str] | None = None,
) -> GenerationResult:
    """Generate an answer from retrieved chunks using strict context-only prompting."""
    client = client or NvidiaClient()

    if not chunks:
        return GenerationResult(
            answer="I don't have a confident source for this question.",
            citations=[],
        )

    context = _build_context(chunks)
    
    replies_context = ""
    if human_replies:
        replies_text = "\n".join([f"- {r}" for r in human_replies])
        replies_context = f"\n\nExisting Human Replies (do not contradict these or simply repeat them):\n{replies_text}"

    user_prompt = f"Context:\n{context}{replies_context}\n\n---\n\nConversation Thread (Answer the latest unanswered question):\n{question}\n\nAnswer:"


    raw = await client.generate(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.2,
        max_tokens=1024,
    )

    import json
    import re
    
    try:
        # Strip markdown json block if present
        cleaned_raw = raw.strip()
        if cleaned_raw.startswith("```json"):
            cleaned_raw = cleaned_raw[7:]
        if cleaned_raw.endswith("```"):
            cleaned_raw = cleaned_raw[:-3]
            
        # Fix smart quotes that LLMs sometimes generate
        cleaned_raw = cleaned_raw.replace('“', '"').replace('”', '"').strip()
        
        # Use strict=False to allow unescaped newlines (\n) inside the JSON string
        data = json.loads(cleaned_raw, strict=False)
        answer_text = data.get("answer", raw)
        citations_array = data.get("citations_used", [])
        citations = _extract_citations(" ".join(citations_array), chunks)
    except Exception as e:
        logger.error(f"Failed to parse JSON response: {e}")
        
        # Fallback: manually extract the answer text using regex to avoid dumping raw JSON
        match = re.search(r'"answer"\s*:\s*"(.*?)"\s*,\s*"citations_used"', raw, re.DOTALL)
        if match:
            answer_text = match.group(1).strip()
        else:
            answer_text = raw
            
        citations = _extract_citations(raw, chunks)

    logger.info("Generated answer (%d chars, %d citations)", len(answer_text), len(citations))
    return GenerationResult(answer=answer_text, citations=citations, raw=raw)
