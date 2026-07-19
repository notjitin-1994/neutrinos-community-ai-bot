"use client";

import Link from "next/link";
import { 
  Rocket, Server, Database, ActivitySquare, AlertTriangle, 
  Workflow, GitMerge, Network, Zap, LineChart, Users, HeartHandshake
} from "lucide-react";
import gsap from "gsap";
import { useEffect, useRef } from "react";

export default function ProductionPlan() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".stagger-block", 
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: "power4.out" }
      );
      
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
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-amber-300">
                  <Database className="w-6 h-6 text-slate-400 mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2 mt-0">Localized State</h3>
                  <p className="text-sm m-0">SQLite and ChromaDB are running via <code>PersistentClient</code> bound to the local filesystem, explicitly prohibiting horizontal scaling across multiple stateless worker nodes.</p>
                </div>
                <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm transition-all hover:shadow-md hover:border-amber-300">
                  <ActivitySquare className="w-6 h-6 text-slate-400 mb-4" />
                  <h3 className="font-bold text-slate-900 text-lg mb-2 mt-0">Naive Polling</h3>
                  <p className="text-sm m-0">The <code>_watch_loop</code> executes a synchronous <code>asyncio.sleep(30)</code> cycle. At scale, this guarantees a <code>429 Too Many Requests</code> ban from Discourse&apos;s Nginx reverse proxy.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 1: Infrastructure Modernization */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
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
                <li><strong className="text-slate-900 font-semibold tracking-tight">Event-Driven Webhooks:</strong> Deprecate the polling loop. Configure the Discourse Admin dashboard to push <code>post_created</code> webhooks to a Redis/Celery Message Queue. Worker nodes will process SLA countdowns asynchronously, implementing strict exponential backoff and jitter to manage Discourse API rate limits perfectly.</li>
              </ul>
            </div>
          </section>

          {/* Phase 2: KPIs & Measurement */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <LineChart className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <span className="md:hidden text-blue-600"><LineChart className="w-6 h-6" /></span>
              Phase 2: Success Telemetry (KPIs)
            </h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                How do we mathematically prove the bot is helping? We must balance Operational Efficiency with Interaction Quality to avoid optimizing for &quot;vanity metrics.&quot;
              </p>
              
              <div className="mt-8 space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Operational Metrics
                  </h3>
                  <ul className="space-y-2 m-0 mt-3">
                    <li><strong>Deflection Rate:</strong> The percentage of tier-1 support queries fully resolved by the bot without human escalation.</li>
                    <li><strong>Knowledge Gap Reports:</strong> Automatically clustering vector queries that yielded &lt;0.70 confidence scores to inform human engineers which documentation needs updating.</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <HeartHandshake className="w-5 h-5 text-rose-500" /> Qualitative Metrics
                  </h3>
                  <ul className="space-y-2 m-0 mt-3">
                    <li><strong>Net CSAT (User Satisfaction):</strong> Measured directly via the inline &quot;Was this helpful?&quot; Discourse polling plugin attached to every bot response.</li>
                    <li><strong>Resolution Velocity:</strong> Tracking the Delta (Δ) in average-time-to-resolution for complex issues before vs. after bot deployment.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Phase 3: The Human Engagement Risk (Crucial) */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-slate-900 border border-slate-900 rounded-full items-center justify-center text-white shadow-sm z-10">
              <Users className="w-5 h-5" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight flex items-center gap-3">
              <span className="md:hidden text-slate-900"><Users className="w-6 h-6" /></span>
              Phase 3: Mitigating the &quot;Dead Forum&quot; Effect
            </h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                The greatest existential risk to this project isn&apos;t technical—it&apos;s sociological. If the bot answers every question perfectly and instantly, <strong>human members will stop bothering to answer each other</strong>. The community becomes a sterile, transactional helpdesk.
              </p>
              
              <div className="mt-8 space-y-6">
                <div className="pl-6 border-l-2 border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">1. Tracking H2H Interaction Volume</h3>
                  <p className="m-0">We must actively monitor the Human-to-Human (H2H) reply ratio. If the sheer volume of peer-to-peer replies drops by more than 20% post-launch, the bot is cannibalizing the community culture.</p>
                </div>
                
                <div className="pl-6 border-l-2 border-slate-200">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">2. Variable &quot;Breathing Room&quot; SLAs</h3>
                  <p className="m-0">To counter this, we will implement dynamic SLA thresholds based on topic tags. Complex tags (<code>architecture</code>, <code>custom-nodes</code>) will receive a longer human grace period (e.g., 4 to 8 hours) than simple billing queries. This gives the human experts room to engage, mentor, and foster relationships before the bot sweeps in.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Conclusion */}
          <section className="stagger-block relative md:pl-24">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <Rocket className="w-5 h-5" />
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-200/60 rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 tracking-tight">Production Ready</h2>
              <p className="text-blue-900/80 leading-relaxed m-0 text-lg">
                By transitioning to an event-driven architecture, tracking rigorous operational KPIs, and strictly policing the sociological impact of the AI via H2H volume metrics, this system will seamlessly scale to 10,000+ users while preserving the authentic human core of the Neutrinos community.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
