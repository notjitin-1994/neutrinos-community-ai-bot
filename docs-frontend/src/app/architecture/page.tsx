"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import mermaid from "mermaid";
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

const MERMAID_CHART = `
graph TD
    %% Styling
    classDef default fill:#ffffff,stroke:#cbd5e1,stroke-width:2px,color:#0f172a,rx:8px,ry:8px,font-family:Inter;
    classDef highlight fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a;
    classDef db fill:#f8fafc,stroke:#94a3b8,stroke-width:2px,color:#0f172a;

    %% Entry points
    subgraph trigger[Trigger Layer]
        CLI["CLI Watch Loop<br/>(main.py)"]:::highlight
        Webhook["FastAPI /webhook<br/>(main.py)"]:::highlight
    end

    %% Engine
    subgraph sla_engine[SLA Engine]
        SLA["SLA Monitor<br/>(sla_monitor.py)"]:::default
        State[("SQLite StateStore")]:::db
        DiscourseAPI["Discourse API<br/>(discourse_client.py)"]:::default
    end

    %% RAG Pipeline
    subgraph rag[RAG Pipeline]
        Retriever["Vector Retriever<br/>(retriever.py)"]:::highlight
        Embed["NV-Embed-v1<br/>(nvidia_client.py)"]:::default
        Chroma[("ChromaDB")]:::db
        Gen["LLM Generator<br/>(generator.py)"]:::highlight
        Llama["Llama 3.1 70B<br/>(nvidia_client.py)"]:::default
        Conf{"Confidence<br/>Evaluator"}:::default
    end

    %% Action
    subgraph action[Action Layer]
        PostBack["Discourse Post-back<br/>(post_back.py)"]:::highlight
        Human["Human Escalation<br/>(@neutrinos_champion)"]:::default
    end

    %% Flows
    CLI --> SLA
    Webhook --> SLA
    SLA <--> DiscourseAPI
    SLA <--> State
    
    SLA -- "Breached Topics" --> Retriever
    Retriever <--> Embed
    Retriever <--> Chroma
    
    Retriever -- "Top-K Context" --> Conf
    
    Conf -- "High Score" --> Gen
    Conf -- "Low Score" --> Human
    
    Gen <--> Llama
    Gen -- "Formatted Answer + Citations" --> PostBack
    
    PostBack --> DiscourseAPI
    PostBack -- "Mark Answered" --> State
    
    %% Dynamic Ingestion Loop
    DiscourseAPI -. "New Resolved Human Threads" .-> Ingest["Ingestion Engine<br/>(ingest.py)"]:::highlight
    Ingest -. "Upsert Embeddings" .-> Chroma
`;

import Navigation from "@/components/Navigation";

export default function Architecture() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"interactive" | "mermaid">("interactive");

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        fontFamily: "Inter, sans-serif",
        primaryColor: "#ffffff",
        primaryTextColor: "#0f172a",
        primaryBorderColor: "#cbd5e1",
        lineColor: "#94a3b8",
        secondaryColor: "#f8fafc",
        tertiaryColor: "#eff6ff"
      },
    });
  }, []);

  useEffect(() => {
    if (activeTab === "mermaid" && mermaidRef.current) {
      mermaidRef.current.innerHTML = MERMAID_CHART;
      mermaid.contentLoaded();
      mermaid.init(undefined, mermaidRef.current);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "interactive") {
      const ctx = gsap.context(() => {
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
    }
  }, [activeTab]);

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
    <div className="flex flex-col gap-8 w-full pb-12 px-4 md:px-0" ref={containerRef}>
      <Navigation />
      
      <div className="page-header bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
          <Layers className="w-64 h-64 text-blue-900" />
        </div>

        <h1 className="text-3xl font-bold mb-3 text-slate-900">System Architecture</h1>
        <p className="text-slate-600 max-w-3xl leading-relaxed mb-8">
          Explore the architectural design of the Community AI SLA Bot. Both views below are derived entirely from the Python source code, offering true visibility into the active pipeline mechanics.
        </p>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit relative z-10">
          <button 
            onClick={() => setActiveTab("interactive")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "interactive" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Interactive Flow
          </button>
          <button 
            onClick={() => setActiveTab("mermaid")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === "mermaid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Mermaid Diagram
          </button>
        </div>
      </div>

      {activeTab === "interactive" && (
        <div className="flex flex-col lg:flex-row gap-8 items-start animate-fade-in-up">
          <div className="w-full lg:w-2/3 bg-slate-50 border border-slate-200 rounded-2xl p-4 md:p-12 relative shadow-inner">
            <div className="flex flex-col gap-4 md:gap-6 relative z-10">
              {ARCHITECTURE_NODES.map((node, i) => (
                <div key={node.id} className="relative flex flex-col items-center justify-center w-full">
                  <div 
                    onClick={() => handleNodeClick(node.id)}
                    className={`arch-node relative z-10 flex items-center gap-4 p-4 md:p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer w-full max-w-md shadow-sm ${
                      activeNode === node.id 
                        ? "bg-blue-50 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.15)] md:scale-105" 
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-3 rounded-lg flex-shrink-0 transition-colors ${activeNode === node.id ? "bg-blue-600 text-white" : "bg-slate-100 text-blue-600"}`}>
                      {node.icon}
                    </div>
                    <div>
                      <h3 className={`font-bold transition-colors text-sm md:text-base ${activeNode === node.id ? "text-blue-700" : "text-slate-800"}`}>
                        {node.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{node.subtitle}</p>
                    </div>
                  </div>

                  {/* Inline Mobile Details Panel */}
                  {activeNode === node.id && (
                    <div className="w-full max-w-md mt-4 mb-2 lg:hidden bg-white border border-blue-200 rounded-xl p-5 shadow-md animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-3 w-fit">
                        {node.subtitle}
                      </div>
                      <p className="text-slate-600 leading-relaxed text-sm m-0">
                        {node.details}
                      </p>
                    </div>
                  )}

                  {i < ARCHITECTURE_NODES.length - 1 && (
                    <div className={`absolute left-1/2 -translate-x-1/2 h-6 w-0.5 z-0 flex flex-col justify-end overflow-hidden ${activeNode === node.id ? 'top-[100%] mt-[150px] lg:mt-0' : 'top-[100%]'}`}>
                      <div className="connector-line bg-slate-300 w-full h-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block w-full lg:w-1/3 sticky top-28">
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
      )}

      {activeTab === "mermaid" && (
        <div className="w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex items-center justify-center min-h-[600px] animate-fade-in-up">
          <div ref={mermaidRef} className="mermaid flex items-center justify-center w-full"></div>
        </div>
      )}

    </div>
  );
}
