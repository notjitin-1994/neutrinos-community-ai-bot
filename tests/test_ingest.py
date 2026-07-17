"""Tests for text chunking and PDF extraction logic (no external APIs)."""

from pathlib import Path

from neutrinos_bot.ingest import chunk_text, extract_pdf_text


def test_chunk_text_basic():
    text = "A" * 1500
    chunks = chunk_text(text, size=600, overlap=100)
    assert len(chunks) >= 2
    assert all(len(c) <= 600 for c in chunks)


def test_chunk_text_empty():
    assert chunk_text("") == []
    assert chunk_text("   ") == []


def test_chunk_text_short():
    text = "Short text."
    chunks = chunk_text(text, size=600, overlap=100)
    assert len(chunks) == 1
    assert chunks[0] == "Short text."


def test_chunk_text_overlap():
    text = "0123456789" * 100
    chunks = chunk_text(text, size=100, overlap=20)
    if len(chunks) > 1:
        overlap_region = chunks[0][-20:]
        assert overlap_region in chunks[1]


def test_extract_pdf_text_real():
    pdf_path = Path("data/knowledge_base/Neutrinos_API_Integration_Guide.pdf")
    if pdf_path.exists():
        pages = extract_pdf_text(pdf_path)
        assert len(pages) > 0
        assert all("text" in p and "page" in p for p in pages)
        full_text = " ".join(p["text"] for p in pages)
        assert len(full_text) > 100
