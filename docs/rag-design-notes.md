# RAG Design Notes

## Chunking Strategy

**Method:** Fixed-size recursive character splitting with overlap.

- **Chunk size:** ~600 characters (approximately 100-150 tokens)
- **Overlap:** 100 characters between consecutive chunks
- **Rationale:** Balances retrieval precision (smaller chunks = more specific matches) with context completeness (overlap prevents splitting key information across chunk boundaries). The Neutrinos documentation is structured in sections with headings, so 600-char chunks typically capture a complete concept or instruction.

**Implementation:** `neutrinos_bot.ingest.chunk_text()` — simple sliding window over extracted text.

## Retrieval Method

**Vector similarity search** using NVIDIA `nv-embed-v1` for both query and passage embeddings.

- **Query embedding:** `input_type=query` — optimized for search queries
- **Passage embedding:** `input_type=passage` — optimized for stored documents
- **Vector store:** Chroma (local, disk-persisted at `chroma/`)
- **Top-K:** 5 chunks retrieved per query (configurable)
- **Distance metric:** Cosine distance (Chroma default), converted to similarity via `1.0 - distance`

The asymmetric embedding (different input types for query vs. passage) improves retrieval quality over symmetric embedding, as NVIDIA's model is specifically trained for this pattern.

## Model Choice

| Component | Model | Why |
|-----------|-------|-----|
| Embeddings | `nvidia/nv-embed-v1` | NVIDIA's state-of-the-art retrieval model; optimized for technical/Q&A retrieval via `input_type` parameter |
| Generation | `nvidia/llama-3.1-70b-instruct` | Strong instruction-following with good citation discipline; OpenAI-compatible API; free tier via NVIDIA NIM |
| Vector store | Chroma (local) | Zero infrastructure; disk-persisted (survives restarts, no re-embedding); sufficient for this corpus size |

## Hallucination Mitigation (Three Layers)

### Layer 1: Strict Context-Only Prompting
The system prompt explicitly forbids fabrication:
- "Answer STRICTLY using only the context provided"
- "If the context does not contain enough information, say: 'I don't have a confident source'"
- Temperature set to 0.1 (near-deterministic generation)

### Layer 2: Confidence Gate
A weighted scoring function evaluates retrieval quality before generation:
- **Score** = 0.5 × max_similarity + 0.3 × mean_top3_similarity + 0.2 × source_bonus
- **Threshold** (default 0.35): below threshold → decline + escalate, no answer generated
- **Source bonus:** Documentation chunks (weight 1.0) score higher than community threads (weight 0.5), preventing unverified community advice from appearing as authoritative answers

### Layer 3: Inline Citations
Every answer must include source references (e.g., `[Neutrinos_API_Integration_Guide.pdf p3]`). The citation extraction step verifies that referenced sources appear in the retrieved chunks.

## Topic-2 Trap: The "No Documentation" Case

Topic 2 ("Test Run button greyed out") has no corresponding Getting Started documentation in the knowledge base. The system is designed to:
1. Retrieve low-similarity chunks (if any) from unrelated docs
2. Score below the confidence threshold
3. Decline to answer → post escalation message instead

This is the critical honesty test: the bot must NOT fabricate a plausible-sounding answer from general knowledge.
