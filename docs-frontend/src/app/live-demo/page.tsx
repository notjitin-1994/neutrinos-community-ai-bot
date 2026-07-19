import Link from "next/link";

export default function LiveDemo() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in-up opacity-0">
      <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 w-fit flex items-center gap-2">
        <span>←</span> Back to Dashboard
      </Link>
      <div className="glass-panel p-8 md:p-12">
        <h1 className="text-3xl font-bold mb-4">Live Working Bot Demo</h1>
        <p className="text-white/60 mb-8">Video demonstration of the Community AI SLA Bot interacting with discourse in real-time.</p>
        
        <div className="w-full aspect-video bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
          <span className="text-white/40">Video Player Placeholder</span>
        </div>
      </div>
    </div>
  );
}
