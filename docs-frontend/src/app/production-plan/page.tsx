import Link from "next/link";

export default function ProductionPlan() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in-up opacity-0">
      <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 w-fit flex items-center gap-2">
        <span>←</span> Back to Dashboard
      </Link>
      <div className="glass-panel p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-4">Go-to-Production Plan</h1>
        <p className="text-white/60 mb-8">Design document detailing how this system scales to production grade for community issue resolution.</p>
        
        <div className="w-full min-h-[300px] bg-white/5 rounded-xl border border-white/10 p-8">
          <span className="text-white/40">Markdown Content Placeholder</span>
        </div>
      </div>
    </div>
  );
}
