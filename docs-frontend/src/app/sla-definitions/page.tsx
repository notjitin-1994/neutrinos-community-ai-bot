"use client";

import Link from "next/link";
import { Clock, CheckCircle2, ShieldAlert, GitPullRequestDraft } from "lucide-react";
import gsap from "gsap";
import { useEffect, useRef } from "react";

export default function SLADefinitions() {
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
    <div className="max-w-3xl mx-auto w-full pb-32" ref={containerRef}>
      <Link href="/" className="stagger-block text-sm text-blue-600 hover:text-blue-700 w-fit flex items-center gap-2 mb-16 transition-colors font-semibold tracking-wide uppercase">
        <span>←</span> Back to Dashboard
      </Link>
      
      <header className="stagger-block mb-24">
        <h1 className="text-[2.75rem] leading-[1.1] md:text-6xl font-black tracking-tight text-slate-900 mb-6 text-balance">
          SLA & Resolution Logic
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 leading-relaxed font-light text-balance">
          A definitive breakdown of our SLA monitoring engine. Derived directly from the Python state machine, these rules dictate precisely when the AI intervenes and what constitutes a &quot;Resolved&quot; community thread.
        </p>
      </header>

      <div className="relative">
        {/* Continuous architectural line */}
        <div className="absolute left-6 top-2 bottom-0 w-px bg-slate-200 hidden md:block" />

        <div className="flex flex-col gap-20">
          
          {/* Section 1: The SLA Window */}
          <section className="stagger-block relative md:pl-20">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3 mb-6 md:hidden text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight text-balance">The SLA Window</h2>
            <div className="prose prose-lg prose-slate prose-a:text-blue-600 max-w-none text-slate-600 leading-relaxed">
              <p>
                Our system strictly prioritizes human engagement. The AI is designed to act as a safety net, not a replacement. 
              </p>
              <ul className="mt-6 space-y-3">
                <li><strong className="text-slate-900 font-semibold tracking-tight">Time-to-Breach Threshold:</strong> The polling engine evaluates the <code>age_minutes</code> of every newly created topic against a globally configured SLA limit. The bot remains completely dormant until this chronological threshold is explicitly breached.</li>
                <li><strong className="text-slate-900 font-semibold tracking-tight">Grace Period Guardrail:</strong> Even if a topic breaches the overarching SLA, the system checks the <code>last_post_age_minutes</code> against a secondary <code>grace_minutes</code> variable. If a human has replied very recently, the bot aborts intervention to avoid interrupting an active, mid-conversation debugging session.</li>
              </ul>
            </div>
          </section>

          {/* Section 2: Definition of Answered */}
          <section className="stagger-block relative md:pl-20">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3 mb-6 md:hidden text-blue-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight text-balance">Defining &quot;Answered&quot;</h2>
            <div className="prose prose-lg prose-slate prose-a:text-blue-600 max-w-none text-slate-600 leading-relaxed">
              <p>
                A core design challenge in forum moderation is determining the true state of a thread. A simple post count is dangerously misleading. Our <code>is_resolved</code> function executes a strict, multi-conditional state evaluation.
              </p>
              
              <div className="my-8 p-6 bg-slate-100/50 rounded-xl border border-slate-200/60">
                <p className="font-mono text-sm text-slate-800 m-0 leading-relaxed">
                  <span className="text-blue-600 font-bold">def</span> is_resolved(posts):<br/>
                  &nbsp;&nbsp;<span className="text-slate-500"># 1. Native platform resolution</span><br/>
                  &nbsp;&nbsp;<span className="text-blue-600 font-bold">if</span> accepted_answer_post_id:<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-600 font-bold">return True</span><br/>
                  <br/>
                  &nbsp;&nbsp;<span className="text-slate-500"># 2. Prevent bot hallucination loops</span><br/>
                  &nbsp;&nbsp;<span className="text-blue-600 font-bold">if</span> last_author == bot_username:<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-600 font-bold">return False</span><br/>
                  <br/>
                  &nbsp;&nbsp;<span className="text-slate-500"># 3. Handle the 'Follow-Up Trap'</span><br/>
                  &nbsp;&nbsp;<span className="text-blue-600 font-bold">if</span> last_author == original_poster:<br/>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-600 font-bold">return False</span><br/>
                  <br/>
                  &nbsp;&nbsp;<span className="text-slate-500"># 4. Human expert intervention</span><br/>
                  &nbsp;&nbsp;<span className="text-blue-600 font-bold">return True</span>
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                <li><strong className="text-slate-900 font-semibold tracking-tight">The Follow-Up Trap:</strong> A common edge-case occurs when a human answers a thread, but the Original Poster (OP) replies asking a follow-up question. By strictly checking if <code>last_author == original_poster</code>, our engine correctly identifies these seemingly &quot;answered&quot; threads as actually requiring renewed intervention.</li>
              </ul>

              {/* Free Tier Limitation Callout */}
              <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900 text-lg mb-1 mt-0">Trial Tier API Limitation: The &quot;Solved&quot; Plugin</h3>
                    <p className="text-amber-800/90 text-base mb-0">
                      While the codebase contains the native integration to mark threads as solved via the Discourse API (<code>accepted_answer_post_id</code>), we are unable to formally execute this state change in the current live environment. The <strong>Discourse Free/Trial tier does not support enabling the Solved plugin</strong>, rendering the endpoint inert. Our <code>is_resolved</code> logic natively compensates for this by falling back to our strict chronological and author-based heuristic evaluations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Idempotency & State */}
          <section className="stagger-block relative md:pl-20">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-white border border-slate-200 rounded-full items-center justify-center text-blue-600 shadow-sm z-10">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3 mb-6 md:hidden text-blue-600">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight text-balance">Strict State Idempotency</h2>
            <div className="prose prose-lg prose-slate prose-a:text-blue-600 max-w-none text-slate-600 leading-relaxed">
              <p>
                To prevent aggressive spamming or duplicate RAG pipeline executions, the bot maintains a strict, localized SQLite state machine.
              </p>
              <ul className="mt-6 space-y-3">
                <li><strong className="text-slate-900 font-semibold tracking-tight">Locking Executions:</strong> Before processing any SLA candidate, the engine verifies <code>state.is_bot_answered(topic_id)</code>. If true, the pipeline aborts.</li>
                <li><strong className="text-slate-900 font-semibold tracking-tight">Confidence Tracking:</strong> The database permanently records whether the bot successfully posted an AI-generated answer or escalated the issue due to low confidence, providing an auditable trail of AI performance.</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Dynamic Knowledge Harvesting */}
          <section className="stagger-block relative md:pl-20">
            <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-slate-900 border border-slate-900 rounded-full items-center justify-center text-white shadow-sm z-10">
              <GitPullRequestDraft className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-3 mb-6 md:hidden text-slate-900">
              <GitPullRequestDraft className="w-6 h-6" />
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-6 tracking-tight text-balance">Dynamic Knowledge Harvesting</h2>
            <div className="prose prose-lg prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>
                The most critical feature of the SLA monitoring loop occurs when a topic is officially classified as &quot;Resolved&quot; by a human.
              </p>
              <p className="mt-4">
                Instead of simply ignoring the thread, the SLA Monitor actively intercepts it. If the topic hasn&apos;t been ingested before (<code>state.is_ingested(topic_id)</code>), the engine dynamically packages the OP&apos;s question alongside the human expert&apos;s reply, and pushes it directly into the ChromaDB vector pipeline. This creates a powerful, autonomous self-learning loop where the bot gets smarter every time a human solves a problem.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
