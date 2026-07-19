"use client";

import Link from "next/link";
import { Database, Search, Cpu, ShieldAlert } from "lucide-react";
import gsap from "gsap";
import { useEffect, useRef } from "react";

import Navigation from "@/components/Navigation";

export default function RagDesign() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".stagger-block", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="max-w-3xl mx-auto w-full pb-32 px-4 md:px-0 mt-8 md:mt-12" ref={containerRef}>
      
      <header className="stagger-block mb-24">
        <h1 className="text-[2.75rem] leading-[1.1] md:text-6xl font-black tracking-tight text-slate-900 mb-6 text-balance">
          RAG Pipeline Design
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light text-balance">
          A deep dive into the underlying mechanics of our Retrieval-Augmented Generation strategy. Eschewing black-box wrappers, we built a deterministic pipeline optimized for extreme technical accuracy.
        </p>
      </header>

      <div className="relative">
        {/* Continuous architectural line */}
        <div className="absolute left-6 top-2 bottom-0 w-px bg-slate-200 hidden md:block" />

        <div className="flex flex-col gap-20">
          
          {/* Section 1: Chunking Strategy */}
          <section className="stagger-block relative md:pl-20">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <Database className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3 mb-6 md:hidden text-blue-600">
              <Database className="w-6 h-6" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight text-balance">Data Ingestion & Chunking</h2>
            <div className="prose prose-lg prose-slate prose-a:text-blue-600 max-w-none text-slate-600 leading-relaxed">
              <p>
                The foundation of our pipeline relies on high-fidelity knowledge extraction. To preserve the structure of Neutrinos&apos; API schemas and JSON objects, we rely on a precise token overlap mechanism rather than naive splitting.
              </p>
              <ul className="mt-6 space-y-3">
                <li><strong className="text-slate-900 font-semibold tracking-tight">Algorithm:</strong> Recursive Character Text Splitting ensures we don&apos;t shatter critical code blocks mid-sentence.</li>
                <li><strong className="text-slate-900 font-semibold tracking-tight">Density Parameters:</strong> We enforce a strict <code>chunk_size</code> of 600 tokens with a 100-token overlap, optimizing for deep context over shallow breadth.</li>
                <li><strong className="text-slate-900 font-semibold tracking-tight">Community Autonomy:</strong> The system organically ingests newly solved Discourse threads on the fly. As the community resolves complex edge cases, the bot learns them instantly.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Retrieval Method */}
          <section className="stagger-block relative md:pl-20">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <Search className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3 mb-6 md:hidden text-blue-600">
              <Search className="w-6 h-6" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight text-balance">Semantic Vector Search</h2>
            <div className="prose prose-lg prose-slate prose-a:text-blue-600 max-w-none text-slate-600 leading-relaxed">
              <p>
                Traditional BM25 keyword search fails spectacularly when users describe errors using unconventional terminology. To solve this, we operate entirely in dense vector space.
              </p>
              <ul className="mt-6 space-y-3">
                <li><strong className="text-slate-900 font-semibold tracking-tight">Embedding Model:</strong> We utilize NVIDIA&apos;s <code>nv-embed-v1</code>. Its high dimensionality maps highly specific engineering concepts—like Node permutations—into mathematically neighboring space.</li>
                <li><strong className="text-slate-900 font-semibold tracking-tight">Storage:</strong> A localized, persistent instance of <code>ChromaDB</code> guarantees sub-millisecond retrieval latency without network round-trips.</li>
                <li><strong className="text-slate-900 font-semibold tracking-tight">Cosine Similarity:</strong> We retrieve exactly 5 chunks by computing the squared L2 distance, guaranteeing mathematical proximity to the user&apos;s intent.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: AI Model Selection */}
          <section className="stagger-block relative md:pl-20">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3 mb-6 md:hidden text-blue-600">
              <Cpu className="w-6 h-6" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight text-balance">Generative Backend</h2>
            <div className="prose prose-lg prose-slate prose-a:text-blue-600 max-w-none text-slate-600 leading-relaxed">
              <p>
                The retrieved vector context, paired with the full Discourse conversation history, is channeled into a rigidly constrained generative pass.
              </p>
              <div className="my-8 p-6 bg-slate-100/50 rounded-xl border border-slate-200/60">
                <p className="font-mono text-sm text-slate-700 m-0">
                  <span className="text-blue-600 font-bold">MODEL_ID</span> = &quot;meta/llama-3.1-70b-instruct&quot;<br/>
                  <span className="text-blue-600 font-bold">TEMPERATURE</span> = 0.1
                </p>
              </div>
              <p>
                We selected the 70B parameter variant of Llama 3.1 via NVIDIA NIM. It possesses the vast reasoning capabilities required to parse technical documentation, yet runs fast enough to maintain conversational cadence. By locking the temperature to 0.1, we eliminate creative deviation, forcing the model into an aggressively deterministic state.
              </p>
            </div>
          </section>

          {/* Section 4: Hallucination Mitigation */}
          <section className="stagger-block relative md:pl-20">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-slate-900 border border-slate-900 rounded-full items-center justify-center text-white shadow-sm z-10">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3 mb-6 md:hidden text-slate-900">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight text-balance">Zero-Tolerance Hallucination Guardrails</h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                The single greatest threat to community trust is an AI confidently distributing incorrect engineering advice. We mitigate this through a multi-tiered rejection system.
              </p>
              
              <div className="mt-8 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">1. Pre-Flight Scoring</h3>
                  <p>Before the LLM even boots, we evaluate the vector cosine similarity. If the retrieved chunks fail to meet our strict relevance threshold, the generation is instantly aborted.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">2. Explicit Citation Locking</h3>
                  <p>Our system prompts mandate that the model cite the exact Discourse Thread ID or PDF page number inline. Generic placeholders like <code>[1]</code> are programmatically rejected.</p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">3. Post-Generation Audits</h3>
                  <p>We run a regex sweep over the generated text. If the model outputs an answer but fails to include a mathematically verifiable citation from the payload, we revoke confidence entirely. The answer is destroyed, and the bot publicly escalates to a human engineer.</p>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
