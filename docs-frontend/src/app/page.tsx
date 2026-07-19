import Link from "next/link";
import { Play, Layers, Brain, Clock, Rocket } from "lucide-react";

const DELIVERABLES = [
  {
    id: "live-demo",
    title: "Live Working Bot Demo",
    description: "Watch a live video demonstration of the Community AI SLA Bot interacting with discourse in real-time.",
    href: "/live-demo",
    icon: <Play className="w-8 h-8" />,
  },
  {
    id: "architecture",
    title: "Architectural Diagram",
    description: "High-level system architecture outlining FastApi, LangChain, NVIDIA NIMs, and ChromaDB integrations.",
    href: "/architecture",
    icon: <Layers className="w-8 h-8" />,
  },
  {
    id: "rag-design",
    title: "RAG Design Notes",
    description: "Deep dive into our Retrieval-Augmented Generation strategy, semantic chunking, and confidence scoring algorithms.",
    href: "/rag-design",
    icon: <Brain className="w-8 h-8" />,
  },
  {
    id: "sla-definitions",
    title: "SLA & Answered Definitions",
    description: "Detailed logic for SLA guardrails, grace periods, and idempotent state management in discourse.",
    href: "/sla-definitions",
    icon: <Clock className="w-8 h-8" />,
  },
  {
    id: "production-plan",
    title: "Go-to-Production Plan",
    description: "Design document detailing how this system scales to production grade for community issue resolution.",
    href: "/production-plan",
    icon: <Rocket className="w-8 h-8" />,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-12 w-full animate-fade-in-up opacity-0">
      <header className="flex flex-col gap-4 max-w-3xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
          Community AI SLA <span className="text-accent">Bot</span>
        </h1>
        <p className="text-xl text-slate-600 leading-relaxed font-light">
          Welcome to the project deliverables dashboard. This interface provides access to the complete documentation, design notes, and live demonstrations for the Neutrinos SLA integration.
        </p>
        <div className="flex items-center gap-4 mt-2">
          <a href="https://nutrinosbotdemo.discourse.group/" target="_blank" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm w-fit flex items-center gap-2">
            Open Discourse Demo Community
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DELIVERABLES.map((item, i) => (
          <Link
            key={item.id}
            href={item.href}
            className={`glass-panel p-8 flex flex-col gap-4 hover-glow cursor-pointer group opacity-0 animate-fade-in-up stagger-${i + 1}`}
          >
            <div className="text-blue-600 bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-100 group-hover:text-blue-700 transition-all duration-300">
              {item.icon}
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors text-slate-900">
                {item.title}
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
