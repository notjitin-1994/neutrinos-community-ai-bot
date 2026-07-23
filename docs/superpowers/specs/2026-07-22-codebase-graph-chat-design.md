# Codebase Graph Chat Button Design

## Overview
A Floating Action Button (FAB) embedded on the frontend (`neutrinosdeliverables.vercel.app`) that initiates an AI chatbot. This chatbot uses a "Graph RAG" architecture to answer highly technical questions about the codebase. It employs a multi-step agentic LLM pipeline (via NVIDIA APIs) to strictly adhere to rate limits while providing verbose, world-class responses including charts, graphs, infographics, and code snippets.

## Architecture

### 1. The Codebase Graphifier (Pre-Compute)
- **Component:** A lightweight Python script (`graphify.py`).
- **Function:** Parses the AST (Abstract Syntax Tree) of the backend and frontend codebases.
- **Output:** Extracts functions, classes, and their `import`/`call` dependencies into a static `codebase_graph.json` file.
- **Why:** Avoids heavy graph DB infrastructure (like Neo4j) while enabling ultra-fast, read-only graph traversal.

### 2. The Agentic RAG Pipeline (Backend)
- **Endpoint:** `/api/chat` (FastAPI or Next.js API Route)
- **Phase 1 (The Router Pass):** A cheap, fast model (e.g., `Llama-3.1-8b-instruct` via NVIDIA API) analyzes the user's question alongside a high-level index of graph nodes. It outputs a JSON array of the most relevant entry nodes.
- **Phase 2 (Graph Traversal):** The backend local logic opens `codebase_graph.json` and extracts the exact code and 1st-degree dependencies starting from those entry nodes.
- **Phase 3 (Verbose Generation):** The highly pruned graph context is sent to a frontier model (e.g., `Llama-3.1-70b-instruct`) with a system prompt demanding verbose, educational responses formatted with markdown (for code) and mermaid.js (for charts/graphs/infographics).

### 3. Rate Limiting & Throttling
- **Problem:** NVIDIA API rate limits trigger 429 errors during heavy context generation.
- **Backend Strategy:** Implement exponential backoff on the server-side LLM calls.
- **Frontend UX Strategy:** Instead of timing out, the UI gracefully transitions to a branded, GSAP-animated "Analyzing Codebase... Queueing request" state, polling or waiting on a socket until the backoff succeeds.

## UI/UX Design (Frontend)

### Visual Aesthetic
- **Style:** "Emil Design Eng / Pro Max" — glassmorphism, dark themes, high-contrast Neutrinos blue accents, sweeping typography.
- **Animations:** Powered by GSAP for buttery smooth mounting, unmounting, and transitions.

### Components
1. **The FAB (Floating Action Button):** Pinned to the bottom right. A sleek, pulsing button.
2. **The Chat Popover:** Expands from the FAB.
   - **Header:** Clean branding, close button.
   - **Message Feed:** Smoothly animates new messages from the bottom.
   - **Message Bubbles:** 
     - Renders rich markdown (code syntax highlighting).
     - Renders Mermaid.js for embedded charts, graphs, and infographics dynamically based on LLM output.
   - **Loading State:** Premium skeleton loaders or pulsing abstract shapes during the "Queueing" phase.

## Dependencies
- **Frontend:** Next.js, React, GSAP (for animations), `react-markdown` (for code), `mermaid` (for graphs/infographics).
- **Backend:** Python, `ast` module, FastAPI (or Next.js API), NVIDIA NIM endpoints.

## Implementation Phases
1. **Graphifier Pipeline:** Build the AST parser and generate `codebase_graph.json`.
2. **Backend API:** Build the 2-step LLM pipeline with NVIDIA rate-limit handling.
3. **Frontend Component:** Build the GSAP FAB and Chat window.
4. **Integration:** Connect UI to backend, implement Mermaid.js rendering for charts.
