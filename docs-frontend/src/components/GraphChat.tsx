"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import ReactMarkdown from "react-markdown";
import mermaid from "mermaid";

export default function GraphChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      mermaid.initialize({ startOnLoad: true, theme: "dark" });
    } catch (e) {
      console.error("Mermaid initialization error:", e);
    }
  }, []);

  useEffect(() => {
    if (isOpen && chatRef.current) {
      gsap.fromTo(
        chatRef.current,
        { y: 20, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          delay *= 2; // Exponential backoff
          return attemptFetch();
        }

        const data = await res.json();
        const responseText = data.error || data.message || "No response received from server.";
        setMessages((prev) => [
          ...prev.filter((m) => !m.content.startsWith("Rate limit hit. Queueing request...")),
          { role: "assistant", content: responseText },
        ]);

        setTimeout(() => {
          try {
            mermaid.contentLoaded();
          } catch (err) {
            console.error("Mermaid render error:", err);
          }
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
      {isOpen && (
        <div
          ref={chatRef}
          className="mb-4 w-[380px] sm:w-[420px] h-[540px] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 ring-1 ring-white/10"
        >
          {/* Header */}
          <div className="p-4 bg-slate-800/90 border-b border-slate-700/60 font-semibold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-100 leading-none">Codebase Chat</h3>
                <p className="text-[11px] font-normal text-slate-400 mt-0.5">Powered by Llama 3.1 & Graph RAG</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-700/50"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3.5 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
            {messages.length === 0 && (
              <div className="my-auto text-center p-6 text-slate-400 flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-1">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-slate-200 font-medium text-sm">Ask about the Architecture</p>
                <p className="text-xs text-slate-400 max-w-[240px]">
                  Explore relationships, SLA monitoring, discourse integration, or component design.
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl ${
                  m.role === "user"
                    ? "bg-blue-600 text-white self-end rounded-tr-xs max-w-[85%] shadow-md"
                    : "bg-slate-800/90 border border-slate-700/60 text-slate-200 self-start rounded-tl-xs max-w-[92%] shadow-md"
                }`}
              >
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match && !String(children).includes("\n");
                      if (!isInline && match && match[1] === "mermaid") {
                        return (
                          <div className="mermaid bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs overflow-x-auto my-2 text-slate-200">
                            {String(children).replace(/\n$/, "")}
                          </div>
                        );
                      }
                      return isInline ? (
                        <code
                          className="bg-slate-950/60 border border-slate-700/50 px-1.5 py-0.5 rounded text-xs text-blue-300 font-mono"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto text-xs font-mono my-2 text-slate-200">
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
              <div className="bg-slate-800/90 border border-slate-700/60 text-slate-400 self-start rounded-2xl rounded-tl-xs p-3.5 max-w-[85%] shadow-md flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-medium animate-pulse text-slate-300">
                  Analyzing Codebase...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3.5 bg-slate-800/90 border-t border-slate-700/60 flex gap-2">
            <input
              className="flex-1 bg-slate-900/90 border border-slate-700/80 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-400 outline-none transition-colors"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about the architecture..."
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Ask
            </button>
          </div>
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-full shadow-xl shadow-blue-600/25 flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 border border-white/20"
        aria-label="Toggle codebase chat"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          ></path>
        </svg>
      </button>
    </div>
  );
}
