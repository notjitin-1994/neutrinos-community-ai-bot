"use client";

import Link from "next/link";
import { 
  Server, ActivitySquare, AlertTriangle, 
  Workflow, LineChart, Users, Zap, HeartHandshake,
  Database, Activity, RefreshCw
} from "lucide-react";
import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import Navigation from "@/components/Navigation";

export default function ProductionPlan() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"continuous" | "measurement" | "risk">("continuous");

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".stagger-block", 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Re-trigger animation on tab change
    if (containerRef.current) {
      const elements = containerRef.current.querySelectorAll(".tab-content-element");
      gsap.fromTo(elements, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }
      );
    }
  }, [activeTab]);

  return (
    <div className="max-w-4xl mx-auto w-full pb-32 px-4 md:px-0 mt-8 md:mt-12" ref={containerRef}>
      
      <header className="stagger-block mb-16">
        <h1 className="text-[3rem] leading-[1.1] md:text-7xl font-black tracking-tight text-slate-900 mb-6 text-balance">
          Production Strategy
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light text-balance max-w-3xl">
          Addressing the three core requirements for deploying the SLA Bot against the live, 10,000+ member Neutrinos Community.
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="stagger-block w-full overflow-x-auto hide-scrollbar mb-12 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl w-fit min-w-max shadow-inner">
          <button 
            onClick={() => setActiveTab("continuous")}
            className={`px-4 md:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "continuous" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            1. Continuous Execution
          </button>
          <button 
            onClick={() => setActiveTab("measurement")}
            className={`px-4 md:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "measurement" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            2. Success Measurement
          </button>
          <button 
            onClick={() => setActiveTab("risk")}
            className={`px-4 md:px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === "risk" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            3. Human Engagement Risk
          </button>
        </div>
      </div>

      <div className="relative min-h-[500px]">
        {/* Continuous Execution Tab */}
        {activeTab === "continuous" && (
          <div className="flex flex-col gap-12">
            <div className="tab-content-element bg-amber-50 border border-amber-200 rounded-2xl p-8 shadow-sm">
              <h3 className="font-bold text-amber-900 text-xl mb-4 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                The Problem: Why the Demo Can&apos;t Scale
              </h3>
              <p className="text-amber-800/90 leading-relaxed m-0">
                The current codebase executes a synchronous <code>asyncio.sleep(30)</code> polling loop. Against a live forum of 10,000 users, polling the <code>latest.json</code> endpoint this aggressively will instantly trigger an Nginx <code>429 Too Many Requests</code> IP ban. Furthermore, the <code>StateStore</code> (SQLite) and ChromaDB are using local filesystem storage, meaning the bot cannot be scaled across multiple worker nodes to handle traffic spikes.
              </p>
            </div>

            <div className="tab-content-element">
              <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">The Production Solution</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
                  <Workflow className="w-8 h-8 text-blue-600 mb-6" />
                  <h3 className="font-bold text-slate-900 text-xl mb-3 mt-0">Event-Driven Webhooks</h3>
                  <p className="text-slate-600 leading-relaxed text-sm m-0">Deprecate the polling loop entirely. We will configure the live Discourse Admin dashboard to push <code>post_created</code> webhooks to a Redis/Celery Message Queue. Stateless FastAPI workers will consume this queue, implementing exponential backoff to perfectly respect Discourse API limits.</p>
                </div>
                
                <div className="bg-white p-8 border border-slate-200 rounded-2xl shadow-sm">
                  <Server className="w-8 h-8 text-blue-600 mb-6" />
                  <h3 className="font-bold text-slate-900 text-xl mb-3 mt-0">Distributed Infrastructure</h3>
                  <p className="text-slate-600 leading-relaxed text-sm m-0">Replace local SQLite with a highly-available PostgreSQL cluster for idempotency locking. Migrate ChromaDB from <code>PersistentClient</code> to a managed Cloud instance (or Client-Server HTTP mode), allowing Kubernetes to dynamically scale Python worker nodes based on real-time SLA queue depth.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Measurement Tab */}
        {activeTab === "measurement" && (
          <div className="flex flex-col gap-12">
            <div className="tab-content-element">
              <p className="text-xl text-slate-600 leading-relaxed text-balance">
                How do we mathematically prove the bot is actually helping the Neutrinos community? We must track both operational efficiency and qualitative human satisfaction to avoid optimizing for vanity metrics.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="tab-content-element bg-white p-8 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <Zap className="w-10 h-10 text-amber-500 mb-4" />
                  <h3 className="font-bold text-slate-900 text-xl m-0">Operational KPIs</h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium">Measuring technical efficacy</p>
                </div>
                <div className="md:w-2/3 flex flex-col gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block mb-1">1. Tier-1 Deflection Rate</strong>
                    <span className="text-slate-600 text-sm">The percentage of queries fully resolved by the AI without requiring a human @neutrinos_champion to intervene.</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block mb-1">2. Knowledge Gap Reporting</strong>
                    <span className="text-slate-600 text-sm">Automatically logging and clustering queries that yielded a vector cosine similarity of &lt;0.70. This creates a data-driven backlog for engineers to write better documentation.</span>
                  </div>
                </div>
              </div>

              <div className="tab-content-element bg-white p-8 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3">
                  <HeartHandshake className="w-10 h-10 text-rose-500 mb-4" />
                  <h3 className="font-bold text-slate-900 text-xl m-0">Qualitative KPIs</h3>
                  <p className="text-slate-500 text-sm mt-2 font-medium">Measuring user sentiment</p>
                </div>
                <div className="md:w-2/3 flex flex-col gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block mb-1">1. Net CSAT via Polling</strong>
                    <span className="text-slate-600 text-sm">Utilizing the native Discourse Polling plugin to append a discreet &quot;Was this helpful? (Yes/No)&quot; to every bot reply, tracking sentiment over time.</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <strong className="text-slate-900 block mb-1">2. Resolution Velocity Delta (Δ)</strong>
                    <span className="text-slate-600 text-sm">Tracking the reduction in average time-to-resolution for complex issues before the bot deployment vs. after.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Human Engagement Risk Tab */}
        {activeTab === "risk" && (
          <div className="flex flex-col gap-12">
            <div className="tab-content-element bg-slate-900 text-white p-8 rounded-2xl shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Users className="w-48 h-48" />
              </div>
              <h3 className="font-bold text-2xl mb-4 relative z-10">The &quot;Dead Forum&quot; Effect</h3>
              <p className="text-slate-300 leading-relaxed text-lg m-0 relative z-10 max-w-2xl">
                The greatest existential risk to this project isn&apos;t technical—it&apos;s sociological. If the bot answers every question perfectly and instantly, <strong>human members will stop bothering to help each other</strong>. The vibrant community culture will atrophy into a sterile, transactional helpdesk.
              </p>
            </div>

            <div className="tab-content-element">
              <h2 className="text-3xl font-bold text-slate-900 mb-8 tracking-tight">Mitigation Strategies</h2>
              
              <div className="space-y-8">
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">1. Tracking H2H Interaction Volume</h3>
                    <p className="text-slate-600 leading-relaxed">
                      We must actively monitor the <strong>Human-to-Human (H2H) reply ratio</strong>. We will establish a pre-launch baseline of how often community members reply to each other. If the sheer volume of peer-to-peer replies drops by more than 20% post-launch, it is a definitive signal that the bot is cannibalizing the community culture, triggering an immediate strategic rollback.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">2. Variable &quot;Breathing Room&quot; SLAs</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Instead of a flat 30-minute SLA for all queries, we will implement dynamic, tag-based thresholds. Complex tags (e.g., <code>architecture</code>, <code>custom-nodes</code>) will be assigned a 4-to-8 hour grace period. This intentionally introduces friction, giving human experts the &quot;breathing room&quot; required to engage, mentor junior devs, and build relationships <em>before</em> the AI acts as a safety net.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
