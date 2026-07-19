"""PDF and community thread ingestion into Chroma.

Parses PDFs and Discourse threads, chunks them, embeds via NVIDIA nv-embed-v1,
and persists to a local Chroma collection with rich metadata for citation.
"""

import logging
from pathlib import Path
from typing import Any

import chromadb
from pypdf import PdfReader

from neutrinos_bot.config import get_settings
from neutrinos_bot.nvidia_client import NvidiaClient

logger = logging.getLogger(__name__)

CHUNK_SIZE = 600
CHUNK_OVERLAP = 100
COLLECTION_NAME = "neutrinos_knowledge"


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """Split text intelligently using LangChain's RecursiveCharacterTextSplitter."""
    if not text.strip():
        return []
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)


def extract_pdf_text(pdf_path: Path) -> list[dict[str, Any]]:
    """Extract text from a PDF, returning list of {page, text} dicts."""
    reader = PdfReader(str(pdf_path))
    pages: list[dict[str, Any]] = []
    for i, page in enumerate(reader.pages, 1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append({"page": i, "text": text})
    return pages


async def ingest_pdfs(
    pdf_dir: str | Path | None = None,
    client: NvidiaClient | None = None,
    chroma_dir: str | None = None,
) -> int:
    """Ingest all PDFs from *pdf_dir* into Chroma. Returns chunk count."""
    settings = get_settings()
    pdf_dir = Path(pdf_dir or "data/knowledge_base")
    chroma_dir = chroma_dir or settings.chroma_persist_dir
    client = client or NvidiaClient()

    db = chromadb.PersistentClient(path=chroma_dir)
    collection = db.get_or_create_collection(COLLECTION_NAME)

    all_chunks: list[str] = []
    all_metadata: list[dict[str, Any]] = []
    all_ids: list[str] = []

    for pdf_path in sorted(pdf_dir.glob("*.pdf")):
        logger.info("Ingesting %s", pdf_path.name)
        pages = extract_pdf_text(pdf_path)
        for page_info in pages:
            chunks = chunk_text(page_info["text"])
            for j, chunk in enumerate(chunks):
                chunk_id = f"{pdf_path.stem}_p{page_info['page']}_c{j}"
                all_chunks.append(chunk)
                all_metadata.append({
                    "source": "doc",
                    "source_ref": f"{pdf_path.name} p{page_info['page']}",
                    "doc_name": pdf_path.stem,
                })
                all_ids.append(chunk_id)

    if not all_chunks:
        logger.warning("No chunks extracted from PDFs in %s", pdf_dir)
        return 0

    logger.info("Embedding %d chunks from %d PDFs", len(all_chunks), len(list(pdf_dir.glob("*.pdf"))))
    embeddings = await client.embed_passages(all_chunks)

    collection.upsert(ids=all_ids, documents=all_chunks, embeddings=embeddings, metadatas=all_metadata)
    logger.info("Ingested %d chunks into Chroma collection '%s'", len(all_chunks), COLLECTION_NAME)
    return len(all_chunks)


async def ingest_community_thread(
    topic_id: int,
    title: str,
    question: str,
    answer: str,
    client: NvidiaClient | None = None,
    chroma_dir: str | None = None,
) -> int:
    """Ingest a solved community thread into Chroma. Returns chunk count."""
    settings = get_settings()
    chroma_dir = chroma_dir or settings.chroma_persist_dir
    client = client or NvidiaClient()

    db = chromadb.PersistentClient(path=chroma_dir)
    collection = db.get_or_create_collection(COLLECTION_NAME)

    combined = f"Q: {title}\n{question}\n\nA: {answer}"
    chunks = chunk_text(combined)
    if not chunks:
        return 0

    ids = [f"topic_{topic_id}_c{j}" for j in range(len(chunks))]
    metadata = [{"source": "community", "source_ref": f"topic #{topic_id}", "solved": True} for _ in chunks]

    embeddings = await client.embed_passages(chunks)
    collection.upsert(ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadata)
    logger.info("Ingested topic #%d (%d chunks) into Chroma", topic_id, len(chunks))
    return len(chunks)
