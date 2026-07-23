# Codebase Graph Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a Graph-RAG powered AI chat assistant embedded on the documentation frontend that answers codebase questions via NVIDIA LLMs.

**Architecture:** A Python script pre-computes the codebase AST into a static JSON graph. A Next.js API route uses a multi-step agentic LLM pipeline (8B router -> Graph lookup -> 70B generation) to answer user questions, while the frontend uses GSAP, react-markdown, and mermaid.js to deliver a premium chat experience that gracefully handles rate limiting.

**Tech Stack:** Python (ast), Next.js (App Router), React, GSAP, react-markdown, mermaid, OpenAI SDK (for NVIDIA NIMs).

## Global Constraints
- Target Frontend: `docs-frontend` (Next.js app router)
- API Keys: Use `NVIDIA_API_KEY` in environment
- LLMs: `meta/llama-3.1-8b-instruct` for routing, `meta/llama-3.1-70b-instruct` for generation
- UI: GSAP for animations, dark theme, "Emil Design / Pro Max" aesthetic.

---

### Task 1: The Graphifier Pre-Compute Script (Python)

**Files:**
- Create: `scripts/graphify.py`
- Test: `tests/test_graphify.py`
- Modify: `package.json:scripts`

**Interfaces:**
- Consumes: Raw Python/TS files in the project
- Produces: `docs-frontend/public/codebase_graph.json`

- [ ] **Step 1: Write the failing test**
```python
import os
import json
import pytest
from scripts.graphify import extract_graph

def test_extract_graph(tmp_path):
    test_file = tmp_path / "test.py"
    test_file.write_text("def my_func():\n    pass")
    
    graph = extract_graph([str(test_file)])
    assert "test.py" in graph["nodes"]
    assert "my_func" in graph["nodes"]["test.py"]["functions"]
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pytest tests/test_graphify.py -v`
Expected: FAIL with "ModuleNotFoundError: No module named 'scripts'"

- [ ] **Step 3: Write minimal implementation**
```python
import ast
import json
import os
import sys

def extract_graph(file_paths):
    graph = {"nodes": {}}
    for path in file_paths:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            tree = ast.parse(content)
            funcs = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
            graph["nodes"][os.path.basename(path)] = {"functions": funcs, "content": content[:1000]}
        except Exception:
            continue
    return graph

if __name__ == "__main__":
    # Scrape specific dirs for demo
    paths = [os.path.join("src/neutrinos_bot", f) for f in os.listdir("src/neutrinos_bot") if f.endswith(".py")]
    g = extract_graph(paths)
    with open("docs-frontend/public/codebase_graph.json", "w") as f:
        json.dump(g, f)
```

- [ ] **Step 4: Run test to verify it passes**
Run: `pytest tests/test_graphify.py -v`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add scripts/graphify.py tests/test_graphify.py
git commit -m "feat: add graphify script for codebase AST extraction"
```

### Task 2: Next.js API Route for Chat (Routing & Generation)

**Files:**
- Create: `docs-frontend/src/app/api/chat/route.ts`

**Interfaces:**
- Consumes: `docs-frontend/public/codebase_graph.json`, `NVIDIA_API_KEY`
- Produces: JSON response `{ "message": "...", "status": "success" }`

- [ ] **Step 1: Install OpenAI SDK**
```bash
cd docs-frontend && npm install openai && cd ..
```

- [ ] **Step 2: Write implementation**
```typescript
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    const graphPath = path.join(process.cwd(), 'public', 'codebase_graph.json');
    let graphContext = "";
    if (fs.existsSync(graphPath)) {
      const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
      graphContext = JSON.stringify(graph).substring(0, 4000); // Truncated context for safety
    }

    const completion = await openai.chat.completions.create({
      model: 'meta/llama-3.1-70b-instruct',
      messages: [
        { role: 'system', content: `You are an expert dev assistant. Use this codebase graph context: ${graphContext}. Be verbose and include Mermaid.js graphs where useful.` },
        { role: 'user', content: message }
      ],
      temperature: 0.2,
      max_tokens: 1024,
    });

    return NextResponse.json({ status: "success", message: completion.choices[0].message.content });
  } catch (error: any) {
    if (error?.status === 429) {
      return NextResponse.json({ status: "rate_limit", message: "Queueing request..." }, { status: 429 });
    }
    return NextResponse.json({ status: "error", message: "Server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**
```bash
git add docs-frontend/src/app/api/chat/route.ts docs-frontend/package.json docs-frontend/package-lock.json
git commit -m "feat: add api route for chat handling with nvidia api"
```

### Task 3: Chat Interface Component (Frontend)

**Files:**
- Create: `docs-frontend/src/components/GraphChat.tsx`
- Modify: `docs-frontend/src/app/layout.tsx`

**Interfaces:**
- Consumes: `/api/chat`
- Produces: Global chat widget

- [ ] **Step 1: Install markdown & mermaid deps**
```bash
cd docs-frontend && npm install react-markdown mermaid gsap && cd ..
```

- [ ] **Step 2: Write GraphChat Component**
```typescript
"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";

export default function GraphChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
  }, []);

  useEffect(() => {
    if (isOpen && chatRef.current) {
      gsap.fromTo(chatRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out" });
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      // Re-run mermaid after render
      setTimeout(() => mermaid.contentLoaded(), 100);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error communicating with server." }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div ref={chatRef} className="mb-4 w-96 h-[500px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
          <div className="p-4 bg-slate-800 font-bold flex justify-between">
            <span>Codebase Chat</span>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-blue-600 self-end' : 'bg-slate-800 self-start'}`}>
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ))}
            {loading && <div className="text-slate-400 animate-pulse">Analyzing Codebase...</div>}
          </div>
          <div className="p-4 bg-slate-800 flex gap-2">
            <input 
              className="flex-1 bg-slate-700 rounded px-3 py-2 outline-none" 
              value={input} onChange={e => setInput(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about the architecture..." 
            />
            <button onClick={sendMessage} className="bg-blue-600 px-4 py-2 rounded font-bold">Ask</button>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-110">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Inject into Layout**
Modify `docs-frontend/src/app/layout.tsx`:
```typescript
import GraphChat from '@/components/GraphChat';

// inside the body tag:
<GraphChat />
```

- [ ] **Step 4: Commit**
```bash
git add docs-frontend/src/components/GraphChat.tsx docs-frontend/src/app/layout.tsx docs-frontend/package.json docs-frontend/package-lock.json
git commit -m "feat: add animated graph chat UI component"
```

### Task 4: Exponential Backoff Retry (Throttling UX)

**Files:**
- Modify: `docs-frontend/src/components/GraphChat.tsx`

**Interfaces:**
- Consumes: 429 Status Codes from `/api/chat`

- [ ] **Step 1: Implement retry logic in sendMessage**
```typescript
  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { role: "user", content: input };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    
    let attempts = 0;
    let delay = 2000;
    
    const attemptFetch = async (): Promise<void> => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: input })
        });
        
        if (res.status === 429) {
          attempts++;
          if (attempts > 5) throw new Error("Rate limit exceeded permanently.");
          setMessages(prev => [...prev.filter(m => !m.content.includes("Queueing")), { role: "assistant", content: `Rate limit hit. Queueing request... (Attempt ${attempts}/5)` }]);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          return attemptFetch();
        }
        
        const data = await res.json();
        setMessages(prev => [...prev.filter(m => !m.content.includes("Queueing")), { role: "assistant", content: data.message }]);
        setTimeout(() => mermaid.contentLoaded(), 100);
      } catch (e) {
        setMessages(prev => [...prev, { role: "assistant", content: "Error communicating with server." }]);
      }
      setLoading(false);
    };
    
    await attemptFetch();
  };
```

- [ ] **Step 2: Commit**
```bash
git add docs-frontend/src/components/GraphChat.tsx
git commit -m "feat: add graceful exponential backoff for chat rate limits"
```
