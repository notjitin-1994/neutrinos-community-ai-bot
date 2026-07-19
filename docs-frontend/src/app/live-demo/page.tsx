"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ChevronDown, ChevronUp, Github, Activity, Database, Search, ShieldCheck, CheckCircle } from "lucide-react";

export default function LiveDemo() {
  const [expanded, setExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial entrance animations
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gsap-fade",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Expand/Collapse animation
    if (!contentRef.current) return;
    
    if (expanded) {
      gsap.to(contentRef.current, {
        height: "auto",
        opacity: 1,
        duration: 0.5,
        ease: "power3.out",
      });
      gsap.to(".step-item", {
        opacity: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.2
      });
    } else {
      gsap.to(contentRef.current, {
        height: "80px", // Collapsed height
        duration: 0.4,
        ease: "power3.inOut",
      });
      gsap.to(".step-item", {
        opacity: 0,
        x: -20,
        duration: 0.2,
      });
    }
  }, [expanded]);

  const steps = [
    {
      icon: <Activity className="w-5 h-5 text-blue-400" />,
      title: "1. Continuous SLA Monitoring",
      desc: "The bot interfaces with the Discourse API via asynchronous polling, continuously analyzing thread timestamps against the strict, globally configured SLA grace windows."
    },
    {
      icon: <Database className="w-5 h-5 text-cyan-400" />,
      title: "2. Contextual Knowledge Ingestion",
      desc: "Verified technical documentation and historically solved community threads are processed via semantic chunking and ingested into a local ChromaDB vector environment."
    },
    {
      icon: <Search className="w-5 h-5 text-blue-400" />,
      title: "3. Retrieval-Augmented Generation",
      desc: "Upon detecting an SLA breach, the bot executes a vector similarity search using NVIDIA's nv-embed-v1 model to instantly retrieve the most contextually relevant engineering documentation."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
      title: "4. Confidence Scoring Guardrails",
      desc: "A proprietary, deterministic confidence algorithm evaluates the retrieval quality. Only when the safety threshold is met does the Llama 3.1 70B model formulate a cited response."
    },
    {
      icon: <CheckCircle className="w-5 h-5 text-blue-400" />,
      title: "5. Idempotent Resolution",
      desc: "The response is seamlessly posted back to Discourse. The internal SQLite state machine immediately registers the thread as resolved to guarantee strict idempotency."
    }
  ];

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full pb-20" ref={containerRef}>
      {/* Navigation */}
      <Link href="/" className="gsap-fade text-sm text-blue-600 hover:text-blue-500 w-fit flex items-center gap-2 mb-6 transition-colors">
        <span>←</span> Back to Dashboard
      </Link>

      {/* Video Player */}
      <div className="gsap-fade w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg mb-6 ring-1 ring-slate-200">
        <iframe 
          width="100%" 
          height="100%" 
          src="https://www.youtube.com/embed/PF-zR0HmbeI" 
          title="Neutrinos Community AI SLA Bot Live Demo" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          referrerPolicy="strict-origin-when-cross-origin" 
          allowFullScreen
        ></iframe>
      </div>

      {/* Title & Actions Row */}
      <div className="gsap-fade flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 mb-1">
            End-to-End Execution: Neutrinos SLA Bot
          </h1>
          <p className="text-slate-600 text-sm">
            Demonstrating real-time community support automation and RAG integrations.
          </p>
        </div>
        
        <a 
          href="https://github.com/notjitin-1994/neutrinos-community-ai-bot" 
          target="_blank" 
          rel="noopener noreferrer"
          className="shrink-0 px-5 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-full font-medium transition-all flex items-center gap-2 text-sm shadow-sm hover:shadow-md hover:scale-105"
        >
          <Github className="w-4 h-4" />
          View Repository
        </a>
      </div>

      {/* YouTube-style Expandable Description */}
      <div className="gsap-fade bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200 rounded-2xl p-6 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-2 text-slate-800 font-semibold mb-3">
          <span className="text-sm">Architecture & Workflow Breakdown</span>
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">System Design</span>
        </div>

        <div 
          ref={contentRef} 
          className="overflow-hidden"
          style={{ height: "80px" }} // Initial collapsed height
        >
          <p className="text-slate-700 text-sm leading-relaxed mb-6 font-medium">
            This live demonstration captures the Community AI SLA Bot operating in a simulated production environment. It monitors the Discourse platform for unanswered technical queries that have breached the service-level agreement threshold, and automatically intercepts them with highly accurate, context-aware engineering solutions.
          </p>

          <div className="flex flex-col gap-6 mt-8 pb-4">
            <h3 className="text-slate-900 font-semibold text-lg border-b border-slate-300 pb-2 mb-2">Technical Execution Flow</h3>
            {steps.map((step, idx) => (
              <div key={idx} className="step-item flex gap-4 opacity-0 -translate-x-5">
                <div className="mt-1 p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0 h-fit">
                  {step.icon}
                </div>
                <div>
                  <h4 className="text-slate-900 font-semibold mb-1 text-base">{step.title}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle Button */}
        <button className="mt-2 text-sm font-semibold text-blue-600 flex items-center gap-1 hover:text-blue-700 transition-colors">
          {expanded ? "Show less" : "Show more"}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
