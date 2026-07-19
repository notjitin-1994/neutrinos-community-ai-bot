import Link from "next/link";

export default function LiveDemo() {
  return (
    <div className="flex flex-col gap-8 animate-fade-in-up opacity-0">
      <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 w-fit flex items-center gap-2">
        <span>←</span> Back to Dashboard
      </Link>
      <div className="glass-panel p-8 md:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold mb-3">Live Working Bot Demo</h1>
            <p className="text-white/60 leading-relaxed">
              Watch our Community AI SLA Bot interact with the Neutrinos Discourse forum in real-time. This demo showcases the end-to-end flow of the bot identifying unanswered threads, checking SLA grace periods, and autonomously generating responses based on the provided technical documentation.
            </p>
          </div>
          <a 
            href="https://github.com/notjitin-1994/neutrinos-community-ai-bot" 
            target="_blank" 
            rel="noopener noreferrer"
            className="shrink-0 px-6 py-3 bg-white/5 hover:bg-white/15 border border-white/20 rounded-xl font-medium transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center gap-3 group"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current group-hover:scale-110 transition-transform"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            View Codebase on GitHub
          </a>
        </div>
        
        <div className="w-full aspect-video bg-black/50 rounded-xl border border-white/10 overflow-hidden shadow-2xl relative group">
          <iframe 
            width="100%" 
            height="100%" 
            src="https://www.youtube.com/embed/PF-zR0HmbeI" 
            title="Neutrinos Community AI SLA Bot Live Demo" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            referrerPolicy="strict-origin-when-cross-origin" 
            allowFullScreen
            className="absolute inset-0"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
