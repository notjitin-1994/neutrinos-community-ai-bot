"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Server, Database, BrainCircuit, MessageSquare, ShieldAlert, Cpu, Activity, Send, Layers, RefreshCw } from "lucide-react";

const ARCHITECTURE_NODES = [
  {
    id: "entry",
    icon: <Server className="w-6 h-6" />,
    title: "1. Orchestration & Entry",
    subtitle: "FastAPI & CLI Loop",
    details: "The system is driven by a FastAPI server for webhook triggers and a continuous CLI watch loop (main.py). It orchestrates the asynchronous execution of the entire pipeline while managing rate limits."
  },
  {
    id: "sla",
    icon: <Activity className="w-6 h-6" />,
    title: "2. SLA Engine & Idempotency",
    subtitle: "Discourse Client + SQLite",
    details: "Polls Discourse for the latest topics. An SQLite StateStore ensures strict idempotency. Evaluates topics against a configured SLA window and grace period—guarding against premature bot intervention if a human recently replied."
  },
  {
    id: "retriever",
    icon: <Database className="w-6 h-6" />,
    title: "3. Vector Retriever",
    subtitle: "ChromaDB + NV-Embed",
    details: "When an SLA breach is detected, the query is embedded using NVIDIA's nv-embed-v1. It executes a cosine-similarity search against a local ChromaDB collection containing pre-ingested community threads and documentation."
  },
  {
    id: "generator",
    icon: <Cpu className="w-6 h-6" />,
    title: "4. LLM Generation",
    subtitle: "Llama 3.1 70B NIM",
    details: "Passes the retrieved context and full conversation history into Llama 3.1 70B. Uses strict system prompting to forbid hallucination, forcing the model to generate concise answers with inline source citations."
  },
  {
    id: "guardrails",
    icon: <ShieldAlert className="w-6 h-6" />,
    title: "5. Safety Guardrails",
    subtitle: "Confidence & Hallucination Checks",
    details: "Evaluates the top-k similarity scores deterministically. Furthermore, if the LLM fails to cite a source or outputs the fallback phrase, the confidence flag is immediately revoked, forcing a human escalation."
  },
  {
    id: "action",
    icon: <Send className="w-6 h-6" />,
    title: "6. Discourse Post-back",
    subtitle: "Resolution & Escalation",
    details: "If confident, posts the generated, cited answer back to the Discourse thread. If unconfident, posts a fallback message pinging a human expert (@neutrinos_champion). Records final state to prevent duplicate runs."
  },
  {
    id: "feedback",
    icon: <RefreshCw className="w-6 h-6" />,
    title: "7. Self-Learning & Feedback Loop",
    subtitle: "Dynamic Ingestion & Community UX",
    details: "The bot autonomously ingests newly resolved human threads into its vector database, dynamically growing its knowledge base. It also appends a 'Was this helpful?' prompt to all replies, establishing a continuous human-in-the-loop UX."
  }
];

export default function Architecture() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline for initial render
      const tl = gsap.timeline();
      
      tl.fromTo(".page-header", 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
      )
      .fromTo(".arch-node", 
        { opacity: 0, scale: 0.9, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "back.out(1.2)" },
        "-=0.2"
      )
      .fromTo(".connector-line", 
        { width: 0, opacity: 0 },
        { width: "100%", opacity: 1, duration: 0.4, stagger: 0.1, ease: "power2.out" },
        "-=0.5"
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const handleNodeClick = (id: string) => {
    setActiveNode(id === activeNode ? null : id);
    if (id !== activeNode) {
      gsap.fromTo("#details-panel", 
        { opacity: 0, y: 10 }, 
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  };

  const activeNodeData = ARCHITECTURE_NODES.find(n => n.id === activeNode);

  return (
    <div className="flex flex-col gap-8 w-full pb-12" ref={containerRef}>
      <Link href="/" className="page-header text-sm text-blue-600 hover:text-blue-500 w-fit flex items-center gap-2 transition-colors">
        <span>←</span> Back to Dashboard
      </Link>
      
      <div className="page-header bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm mb-4 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
          <Layers className="w-64 h-64 text-blue-900" />
        </div>

        <h1 className="text-3xl font-bold mb-3 text-slate-900">System Architecture</h1>
        <p className="text-slate-600 max-w-3xl leading-relaxed">
          Interactive architectural diagram derived directly from the production Python codebase. 
          Click on any node in the data pipeline to understand the underlying technical implementation, state management, and LLM integrations.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Interactive Diagram Canvas */}
        <div className="w-full lg:w-2/3 bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-12 relative shadow-inner">
          <div className="flex flex-col gap-6 relative z-10">
            {ARCHITECTURE_NODES.map((node, i) => (
              <div key={node.id} className="relative flex items-center justify-center w-full">
                {/* Node Box */}
                <div 
                  onClick={() => handleNodeClick(node.id)}
                  className={`arch-node relative z-10 flex items-center gap-4 p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer w-full max-w-md shadow-sm ${
                    activeNode === node.id 
                      ? "bg-blue-50 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)] scale-105" 
                      : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                  }`}
                >
                  <div className={`p-3 rounded-lg flex-shrink-0 transition-colors ${activeNode === node.id ? "bg-blue-600 text-white" : "bg-slate-100 text-blue-600"}`}>
                    {node.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold transition-colors ${activeNode === node.id ? "text-blue-700" : "text-slate-800"}`}>
                      {node.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{node.subtitle}</p>
                  </div>
                </div>

                {/* Connector Line to next node */}
                {i < ARCHITECTURE_NODES.length - 1 && (
                  <div className="absolute top-[100%] left-1/2 -translate-x-1/2 h-6 w-0.5 z-0 flex flex-col justify-end overflow-hidden">
                    <div className="connector-line bg-slate-300 w-full h-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Details Panel */}
        <div className="w-full lg:w-1/3 sticky top-28">
          <div 
            id="details-panel"
            className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md min-h-[350px] flex flex-col transition-all duration-300"
          >
            {activeNodeData ? (
              <>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  {activeNodeData.icon}
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{activeNodeData.title}</h2>
                <div className="inline-block px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full mb-6 w-fit">
                  {activeNodeData.subtitle}
                </div>
                <p className="text-slate-600 leading-relaxed text-sm">
                  {activeNodeData.details}
                </p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full flex-grow text-center opacity-60">
                <BrainCircuit className="w-16 h-16 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">Select a node in the architectural flow to view its deep-dive technical implementation details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
