# Neutrinos SLA Bot

AI SLA-Escalation Bot for Discourse. Auto-replies to unanswered community questions using grounded RAG (NVIDIA NIM + LangChain + Chroma).

## Quick Start

1. `cp .env.example .env` and fill in your keys
2. `python -m venv .venv && source .venv/bin/activate`
3. `pip install -e ".[dev]"`
4. `pytest`

## Stack

- Python 3.11+ / FastAPI
- NVIDIA NIM (nv-embed-v1 + llama-3.1-70b-instruct)
- LangChain + Chroma vector store
- Discourse API (polling-based SLA monitor)
