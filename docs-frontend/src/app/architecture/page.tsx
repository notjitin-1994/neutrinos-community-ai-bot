import Link from "next/link";

export default function Architecture() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in-up opacity-0">
      <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 w-fit flex items-center gap-2">
        <span>←</span> Back to Dashboard
      </Link>
      <div className="glass-panel p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-4">Architectural Diagram</h1>
        <p className="text-white/60 mb-8">High-level system architecture outlining FastApi, LangChain, NVIDIA NIMs, and ChromaDB integrations.</p>
        
        <div className="w-full h-96 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
          <span className="text-white/40">Mermaid Diagram / Image Placeholder</span>
        </div>
      </div>
    </div>
  );
}
