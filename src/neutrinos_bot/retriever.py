"""RAG retriever — query embedding to Chroma top-k.

Embeds the search query via NVIDIA nv-embed-v1 (input_type=query), queries
the local Chroma collection for top-k similar chunks, and returns
metadata-rich results for downstream citation and confidence scoring.
"""

import logging
from typing import Any

import chromadb

from neutrinos_bot.config import get_settings
from neutrinos_bot.nvidia_client import NvidiaClient

logger = logging.getLogger(__name__)

COLLECTION_NAME = "neutrinos_knowledge"
DEFAULT_TOP_K = 5


class RetrievedChunk(dict[str, Any]):
    """Typed dict for a retrieved chunk with metadata and similarity score."""


async def retrieve(
    query: str,
    client: NvidiaClient | None = None,
    top_k: int = DEFAULT_TOP_K,
    chroma_dir: str | None = None,
) -> list[RetrievedChunk]:
    """Embed the query and retrieve top-k chunks from Chroma."""
    settings = get_settings()
    chroma_dir = chroma_dir or settings.chroma_persist_dir
    client = client or NvidiaClient()

    query_embedding = await client.embed_query(query)

    db = chromadb.PersistentClient(path=chroma_dir)
    collection = db.get_or_create_collection(COLLECTION_NAME)

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    chunks: list[RetrievedChunk] = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    dists = results.get("distances", [[]])[0]

    for doc, meta, dist in zip(docs, metas, dists, strict=False):
        similarity = 1.0 - dist
        chunks.append(RetrievedChunk(
            text=doc,
            source=meta.get("source", "unknown"),
            source_ref=meta.get("source_ref", "unknown"),
            similarity=similarity,
            metadata=meta,
        ))

    logger.info("Retrieved %d chunks for query: %s", len(chunks), query[:100])
    return chunks
