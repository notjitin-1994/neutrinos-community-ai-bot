import Link from "next/link";
import { Database, Search, Cpu, ShieldAlert } from "lucide-react";

export default function RagDesign() {
  return (
    <div className="flex flex-col max-w-4xl mx-auto w-full pb-20 animate-fade-in-up opacity-0">
      <Link href="/" className="text-sm text-blue-600 hover:text-blue-500 w-fit flex items-center gap-2 mb-8 transition-colors font-medium">
        <span>←</span> Back to Dashboard
      </Link>
      
      <header className="mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
          RAG Pipeline Design
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed font-light">
          A deep dive into the underlying mechanics of our Retrieval-Augmented Generation strategy. This document outlines our approach to semantic chunking, embedding generation, model selection, and hallucination guardrails.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        
        {/* Section 1: Chunking Strategy */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">1. Data Ingestion & Chunking Strategy</h2>
          </div>
          <div className="prose prose-slate max-w-none text-slate-600">
            <p>
              The foundation of our RAG pipeline relies on high-fidelity knowledge extraction from both static documentation (PDFs) and dynamic community knowledge (solved Discourse threads).
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li><strong>Algorithm:</strong> LangChain&apos;s <code>RecursiveCharacterTextSplitter</code>.</li>
              <li><strong>Parameters:</strong> <code>chunk_size = 600</code> and <code>chunk_overlap = 100</code>.</li>
              <li><strong>Rationale:</strong> A 600-token chunk size optimally encapsulates technical API contexts and JSON structures without losing semantic meaning. The 100-token overlap prevents context fracturing at sentence boundaries.</li>
              <li><strong>Dynamic Growth:</strong> Unlike static implementations, our bot autonomously parses and chunks newly solved community threads, actively growing the vector database from the community itself.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Retrieval Method */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Search className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">2. Vector Retrieval Engine</h2>
          </div>
          <div className="prose prose-slate max-w-none text-slate-600">
            <p>
              We opted for dense vector embeddings rather than traditional keyword (BM25) search, given the nuanced, semantic nature of community troubleshooting.
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li><strong>Embedding Model:</strong> NVIDIA <code>nv-embed-v1</code>. Its high dimensionality and technical comprehension make it ideal for mapping highly specific engineering concepts.</li>
              <li><strong>Vector Database:</strong> Local <code>ChromaDB (PersistentClient)</code> for sub-millisecond retrieval without network latency.</li>
              <li><strong>Execution:</strong> We retrieve the top-K (K=5) chunks based on Cosine Similarity (derived from Chroma&apos;s squared L2 distance).</li>
            </ul>
          </div>
        </section>

        {/* Section 3: AI Model Selection */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">3. Generation (LLM)</h2>
          </div>
          <div className="prose prose-slate max-w-none text-slate-600">
            <p>
              The retrieved context, alongside the complete conversation history of the thread, is passed to our generative backend to formulate a response.
            </p>
            <ul className="mt-4 space-y-2 list-disc pl-5">
              <li><strong>Model:</strong> <code>llama-3.1-70b-instruct</code> hosted via NVIDIA NIM.</li>
              <li><strong>Why Llama 3.1 70B?</strong> It strikes the perfect balance of reasoning depth and latency. It possesses the instruction-following capabilities required to strictly adhere to context-only generation without the overhead of larger, slower proprietary models.</li>
              <li><strong>Determinism:</strong> The temperature is strictly locked to <code>0.1</code> to prevent creative deviation and ensure consistent, factual technical answers.</li>
            </ul>
          </div>
        </section>

        {/* Section 4: Hallucination Mitigation */}
        <section className="bg-white border border-slate-200 rounded-2xl p-8 md:p-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <ShieldAlert className="w-48 h-48 text-blue-900" />
          </div>
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">4. Hallucination Mitigation Guardrails</h2>
          </div>
          <div className="prose prose-slate max-w-none text-slate-600 relative z-10">
            <p>
              To protect the integrity of the Neutrinos Community, we implemented a robust, multi-layered defense mechanism against AI hallucinations.
            </p>
            <ol className="mt-4 space-y-4 list-decimal pl-5">
              <li>
                <strong>Pre-generation Confidence Scoring:</strong> Before the LLM is even invoked, a deterministic algorithm evaluates the vector similarity scores of the retrieved chunks. If the relevance is below a strict threshold, generation is aborted entirely.
              </li>
              <li>
                <strong>Prompt Engineering constraints:</strong> The system prompt explicitly commands the model to cite exact source names (e.g., <code>[Topic #195]</code>) inline, and explicitly forbids generic placeholders (e.g., <code>[1]</code>).
              </li>
              <li>
                <strong>Post-generation Validation:</strong> The pipeline extracts citations from the LLM output using regex and string matching against the valid <code>source_ref</code> list. If the LLM generates an answer but fails to include valid citations—or if it outputs the fallback phrase—the system retroactively revokes confidence and scraps the answer.
              </li>
              <li>
                <strong>Human Escalation Fallback:</strong> When guardrails are triggered, the bot refuses to guess. Instead, it posts an escalation message pinging a human expert (<code>@neutrinos_champion</code>), guaranteeing zero hallucination bleed into the community.
              </li>
            </ol>
          </div>
        </section>

      </div>
    </div>
  );
}
