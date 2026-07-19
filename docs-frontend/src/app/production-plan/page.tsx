"use client";

import Link from "next/link";
import { 
  Rocket, Server, Database, ActivitySquare, AlertTriangle, 
  Workflow, GitMerge, Network, Zap
} from "lucide-react";
import gsap from "gsap";
import { useEffect, useRef } from "react";

export default function ProductionPlan() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Elegant staggered entrance
      gsap.fromTo(".stagger-block", 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power4.out" }
      );
      
      // Animate the vertical timeline line
      gsap.fromTo(".timeline-line",
        { scaleY: 0 },
        { scaleY: 1, duration: 1.5, ease: "power3.inOut", delay: 0.5 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="max-w-4xl mx-auto w-full pb-32" ref={containerRef}>
      <Link href="/" className="stagger-block text-sm text-blue-600 hover:text-blue-700 w-fit flex items-center gap-2 mb-16 transition-colors font-semibold tracking-wide uppercase">
        <span>←</span> Back to Dashboard
      </Link>
      
      <header className="stagger-block mb-24">
        <h1 className="text-[3rem] leading-[1.1] md:text-7xl font-black tracking-tight text-slate-900 mb-6 text-balance">
          Go-to-Production
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light text-balance max-w-3xl">
          Scaling from a single-threaded local prototype to an enterprise-grade, distributed AI agent capable of supporting 10,000+ active community members.
        </p>
      </header>

      <div className="relative">
        {/* Continuous architectural timeline line */}
        <div className="timeline-line absolute left-6 top-8 bottom-8 w-px bg-slate-200 hidden md:block origin-top" />

        <div className="flex flex-col gap-24">
          
          {/* Diagnostic: Why is it currently a Demo? */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-amber-50 border border-amber-200 rounded-full items-center justify-center text-amber-600 shadow-sm z-10">
              <AlertTriangle className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <span className="md:hidden text-amber-600"><AlertTriangle className="w-6 h-6" /></span>
              Current Architecture Limitations
            </h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                The current implementation is an exceptional proof-of-concept, but it harbors structural bottlenecks that would catastrophically fail under a 10,000-user load:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
                  <Database className="w-6 h-6 text-slate-400 mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2 mt-0">Localized State</h3>
                  <p className="text-sm m-0">SQLite and ChromaDB are currently running via <code>PersistentClient</code> bound to the local filesystem. This prohibits horizontal scaling across multiple worker nodes.</p>
                </div>
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
                  <ActivitySquare className="w-6 h-6 text-slate-400 mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2 mt-0">Naive Polling</h3>
                  <p className="text-sm m-0">The <code>_watch_loop</code> executes an <code>asyncio.sleep(30)</code> cycle to poll the Discourse API. At scale, this guarantees a <code>429 Too Many Requests</code> ban from Discourse&apos;s Nginx reverse proxy.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 1: Infrastructure Modernization */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-blue-600 border border-blue-600 rounded-full items-center justify-center text-white shadow-sm z-10">
              <Server className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <span className="md:hidden text-blue-600"><Server className="w-6 h-6" /></span>
              Phase 1: Distributed Infrastructure
            </h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                To support 10,000+ users, we must decouple the application logic from the persistence layer to allow elastic scaling of the Python workers.
              </p>
              <ul className="mt-6 space-y-4">
                <li><strong className="text-slate-900 font-semibold tracking-tight">Database Migration:</strong> Replace the local SQLite <code>StateStore</code> with PostgreSQL to manage distributed locking and idempotency tracking across multiple stateless FastAPI instances.</li>
                <li><strong className="text-slate-900 font-semibold tracking-tight">Client-Server Vector DB:</strong> Migrate ChromaDB from in-process mode to Client-Server (HTTP) mode, or offload entirely to a managed provider like Pinecone or Qdrant for guaranteed high-availability vector retrieval.</li>
              </ul>
            </div>
          </section>

          {/* Phase 2: Event-Driven Architecture */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <Workflow className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <span className="md:hidden text-blue-600"><Workflow className="w-6 h-6" /></span>
              Phase 2: Event-Driven Triggers
            </h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                We will entirely deprecate the 30-second API polling loop. 
              </p>
              <p>
                Instead, we will configure the Discourse Admin dashboard to push <code>post_created</code> webhooks directly to our FastAPI <code>/webhook</code> endpoint. These payloads will be immediately offloaded into a <strong>Redis/Celery Message Queue</strong>.
              </p>
              <p>
                Worker nodes will then securely process the SLA countdowns asynchronously, implementing strict <strong>exponential backoff and jitter</strong> when hitting Discourse and NVIDIA NIM APIs to perfectly manage rate limits.
              </p>
            </div>
          </section>

          {/* Phase 3: The Human Engagement Risk (Crucial) */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-slate-900 border border-slate-900 rounded-full items-center justify-center text-white shadow-sm z-10">
              <Network className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <span className="md:hidden text-slate-900"><Network className="w-6 h-6" /></span>
              Phase 3: Mitigating the &quot;Dead Forum&quot; Effect
            </h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                The greatest existential risk to this project isn&apos;t technical—it&apos;s sociological. If the bot answers every question perfectly and instantly, <strong>human members will stop bothering to answer each other</strong>. The community becomes a sterile helpdesk.
              </p>
              
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">1. Variable SLA Windows</h3>
                  <p className="m-0">We will implement dynamic SLA thresholds based on tags. Complex topics (<code>architecture</code>, <code>custom-nodes</code>) will receive a longer human grace period (e.g., 4 hours) than simple billing queries, giving human experts room to engage.</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">2. Engagement Telemetry</h3>
                  <p className="m-0">Beyond the &quot;Was this helpful?&quot; prompt, we will track the <strong>Human-to-AI Reply Ratio</strong>. If human replies drop by more than 20% post-launch, the bot is cannibalizing the community, and we will deliberately throttle its response times to re-encourage peer-to-peer interaction.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Conclusion */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <Rocket className="w-5 h-5" />
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-8 md:p-10">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 tracking-tight">Production Ready</h2>
              <p className="text-blue-800/80 leading-relaxed m-0 text-lg">
                By transitioning to a distributed, event-driven infrastructure and strictly policing the sociological impact of the AI, this system will seamlessly scale to 10,000+ users while preserving the authentic human core of the Neutrinos community.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
