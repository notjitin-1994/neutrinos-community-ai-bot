"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import ReactMarkdown from "react-markdown";

const LOADING_PHRASES = [
  "Analyzing codebase...",
  "Traversing AST...",
  "Computing embeddings...",
  "Querying graph...",
  "Parsing context...",
  "Synthesizing response...",
  "Thinking..."
];

export default function GraphChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_PHRASES[0]);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textScrambleRef = useRef<HTMLSpanElement>(null);

  // Loading randomizer
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
      
      // GSAP fade transition for the text change
      if (textScrambleRef.current) {
        gsap.to(textScrambleRef.current, {
          opacity: 0,
          y: -4,
          duration: 0.15,
          onComplete: () => {
            setLoadingText(LOADING_PHRASES[i]);
            gsap.fromTo(textScrambleRef.current, 
              { opacity: 0, y: 4 }, 
              { opacity: 1, y: 0, duration: 0.15 }
            );
          }
        });
      } else {
        setLoadingText(LOADING_PHRASES[i]);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: true, theme: "dark" });
      } catch (e) {
        console.error("Mermaid initialization error:", e);
      }
    })();
  }, []);

  // Removed GSAP container morphing useEffect to prevent layout race conditions

  // Message enter animation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Animate the last message in using GSAP
    const msgElements = document.querySelectorAll('.message-bubble');
    if (msgElements.length > 0) {
      const lastMsg = msgElements[msgElements.length - 1];
      // Only animate if it hasn't been animated yet
      if (!lastMsg.hasAttribute('data-animated')) {
        lastMsg.setAttribute('data-animated', 'true');
        gsap.fromTo(lastMsg, 
          { opacity: 0, y: 20, scale: 0.97 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.2)" }
        );
      }
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMessage = input.trim();
    const newMsg = { role: "user", content: userMessage };

    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    let attempts = 0;
    let delay = 2000;

    const attemptFetch = async (): Promise<void> => {
      setLoading(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage }),
        });

        if (res.status === 429) {
          attempts++;
          if (attempts > 5) throw new Error("Rate limit exceeded permanently.");
          setMessages((prev) => [
            ...prev.filter((m) => !m.content.startsWith("Rate limit hit. Queueing request...")),
            {
              role: "assistant",
              content: `Rate limit hit. Queueing request... (Attempt ${attempts}/5)`,
            },
          ]);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          return attemptFetch();
        }

        const data = await res.json();
        const responseText = data.error || data.message || "No response received from server.";
        setMessages((prev) => [
          ...prev.filter((m) => !m.content.startsWith("Rate limit hit. Queueing request...")),
          { role: "assistant", content: responseText },
        ]);

        setTimeout(async () => {
          try {
            const mermaid = (await import("mermaid")).default;
            mermaid.contentLoaded();
          } catch (err) {}
        }, 150);
      } catch (e: any) {
        setMessages((prev) => [
          ...prev.filter((m) => !m.content.startsWith("Rate limit hit. Queueing request...")),
          { role: "assistant", content: e?.message || "Error communicating with server." },
        ]);
      } finally {
        setLoading(false);
      }
    };

    await attemptFetch();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Morphing Container */}
      <div 
        ref={containerRef}
        className={`relative bg-[#0a0a0c]/80 backdrop-blur-3xl border border-white/[0.08] shadow-[0_16px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden flex items-end justify-end transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'w-[calc(100vw-48px)] sm:w-[420px] h-[600px] rounded-3xl' : 'w-14 h-14 rounded-full'
        }`}
      >
        {/* Expanded Content */}
        <div 
          ref={contentRef} 
          className={`absolute inset-0 z-10 flex flex-col w-full h-full transition-all duration-500 ${
            isOpen ? 'opacity-100 translate-y-0 pointer-events-auto delay-100' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-60"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </div>
              <div>
                <h3 className="text-[14px] font-medium text-slate-100 tracking-wide leading-tight">Neutrinos RAG</h3>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Architecture Bot</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 text-[13.5px] leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 && (
              <div className="my-auto text-center flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-200 font-medium text-sm tracking-wide">System Ready</p>
                  <p className="text-[13px] text-slate-400 mt-1.5 max-w-[220px] mx-auto leading-relaxed">
                    Ask me anything about the codebase architecture, AST graph, or API routes.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`message-bubble p-4 rounded-2xl ${
                  m.role === "user"
                    ? "bg-blue-600 text-white self-end rounded-tr-sm max-w-[85%] shadow-md"
                    : "bg-white/[0.04] border border-white/[0.05] text-slate-200 self-start rounded-tl-sm max-w-[95%] shadow-sm"
                }`}
              >
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match && !String(children).includes("\n");
                      if (!isInline && match && match[1] === "mermaid") {
                        return (
                          <div className="mermaid bg-black/50 p-4 rounded-xl border border-white/10 text-[12px] overflow-x-auto my-3 text-slate-200 shadow-inner">
                            {String(children).replace(/\n$/, "")}
                          </div>
                        );
                      }
                      return isInline ? (
                        <code className="bg-black/40 border border-white/10 px-1.5 py-0.5 rounded text-[12px] text-blue-300 font-mono tracking-tight" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-black/50 p-4 rounded-xl border border-white/10 overflow-x-auto text-[12px] font-mono my-3 text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-white/10 shadow-inner">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      );
                    },
                  }}
                >
                  {m.content}
                </ReactMarkdown>
              </div>
            ))}

            {loading && (
              <div className="message-bubble bg-white/[0.02] border border-white/[0.05] text-slate-400 self-start rounded-2xl rounded-tl-sm py-3 px-4 shadow-sm flex items-center gap-3">
                <svg className="w-4 h-4 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span ref={textScrambleRef} className="text-[13px] tracking-wide font-medium">
                  {loadingText}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/[0.01] border-t border-white/[0.05]">
            <div className="relative flex items-center">
              <input
                className="w-full bg-white/[0.03] border border-white/10 focus:border-blue-500/50 focus:bg-white/[0.06] rounded-full pl-5 pr-12 py-3.5 text-[13.5px] text-slate-100 placeholder-slate-500 outline-none transition-all shadow-inner"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Message architecture bot..."
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="absolute right-1.5 w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-all disabled:opacity-30 disabled:hover:bg-blue-600"
              >
                <svg className="w-4 h-4 -mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* FAB Button Content */}
        <button
          ref={fabRef}
          onClick={() => setIsOpen(true)}
          className={`absolute inset-0 z-20 w-full h-full flex items-center justify-center text-white bg-gradient-to-tr from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 transition-all duration-300 ease-out ${
            isOpen ? 'opacity-0 scale-75 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'
          }`}
          aria-label="Open chat"
        >
          <svg className="w-6 h-6 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
