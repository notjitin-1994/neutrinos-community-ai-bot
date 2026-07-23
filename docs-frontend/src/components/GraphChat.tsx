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

const MermaidRenderer = ({ chart }: { chart: string }) => {
  const [svg, setSvg] = useState<string>('');
  const id = React.useId().replace(/:/g, '');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({ startOnLoad: false, theme: "default" });
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, chart);
        if (isMounted) setSvg(renderedSvg);
      } catch (err) {
        console.error("Mermaid syntax error:", err);
        if (isMounted) setSvg(`<div class="text-red-500 p-2 text-xs font-mono">Syntax Error in graph</div>`);
      }
    })();
    return () => { isMounted = false; };
  }, [chart, id]);

  if (!svg) {
    return <div className="p-4 text-slate-400 text-xs text-center animate-pulse">Rendering diagram...</div>;
  }

  return <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />;
};

export default function GraphChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState(LOADING_PHRASES[0]);
  const [fullscreenDiagram, setFullscreenDiagram] = useState<string | null>(null);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textScrambleRef = useRef<HTMLSpanElement>(null);

  // Persistence: Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jitin-ai-chat-history");
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }, []);

  // Persistence: Save to localStorage on change
  useEffect(() => {
    try {
      if (messages.length > 0) {
        localStorage.setItem("jitin-ai-chat-history", JSON.stringify(messages));
      } else {
        localStorage.removeItem("jitin-ai-chat-history");
      }
    } catch (e) {
      console.error("Failed to save chat history", e);
    }
  }, [messages]);

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([]);
      localStorage.removeItem("jitin-ai-chat-history");
    }
  };

  // Loading randomizer
  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % LOADING_PHRASES.length;
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

  // Message enter animation & scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    
    // Animate the last message in using GSAP
    const msgElements = document.querySelectorAll('.message-bubble');
    if (msgElements.length > 0) {
      const lastMsg = msgElements[msgElements.length - 1];
      if (!lastMsg.hasAttribute('data-animated')) {
        lastMsg.setAttribute('data-animated', 'true');
        gsap.fromTo(lastMsg, 
          { opacity: 0, y: 15, scale: 0.98 }, 
          { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.2)" }
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
          delay *= 2; // Exponential backoff
          return attemptFetch();
        }

        const data = await res.json();
        const responseText = data.error || data.message || "No response received from server.";
        setMessages((prev) => [
          ...prev.filter((m) => !m.content.startsWith("Rate limit hit. Queueing request...")),
          { role: "assistant", content: responseText },
        ]);
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
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {isOpen ? (
        <div
          ref={chatRef}
          className="pointer-events-auto origin-bottom-right animate-in zoom-in-95 fade-in slide-in-from-bottom-10 duration-300 ease-out mb-2 w-[calc(100vw-48px)] sm:w-[420px] h-[600px] bg-white/90 backdrop-blur-2xl border border-slate-200/60 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_20px_0_rgba(37,99,235,0.05)] flex flex-col overflow-hidden text-slate-800 ring-1 ring-black/5"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50">
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <img src="/favicon.svg" alt="Jitin's AI Assistant" className="w-8 h-8 object-contain drop-shadow-sm" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900 tracking-tight leading-tight">Project Oracle</h3>
                <p className="text-[11px] font-medium text-slate-500 tracking-wide mt-0.5">An interactive architecture demo by Jitin</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50 active:scale-95"
                  title="Clear chat history"
                  aria-label="Clear chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-full hover:bg-slate-100/80 active:scale-95"
                aria-label="Close chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-5 text-[14px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-200">
            {messages.length === 0 && (
              <div className="my-auto text-center flex flex-col items-center gap-4 animate-in fade-in duration-1000">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-inner mb-1">
                  <img src="/favicon.svg" alt="Jitin's Demo" className="w-8 h-8 opacity-80" />
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-[15px] tracking-tight">Welcome to Project Oracle</p>
                  <p className="text-[13px] text-slate-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
                    An AI agent built by Jitin to explain this codebase. Ask me to map out the RAG pipeline, dissect the AST engine, or explain the production scaling.
                  </p>
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`message-bubble p-4 rounded-2xl ${
                  m.role === "user"
                    ? "bg-blue-600 text-white self-end rounded-tr-sm max-w-[85%] shadow-md shadow-blue-600/20"
                    : "bg-white border border-slate-100 text-slate-700 self-start rounded-tl-sm max-w-[95%] shadow-sm"
                }`}
              >
                <ReactMarkdown
                  components={{
                    code({ node, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      const isInline = !match && !String(children).includes("\n");
                      if (!isInline && match && match[1] === "mermaid") {
                        const diagramText = String(children).replace(/\n$/, "");
                        return (
                          <div className="relative group my-3">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[12px] overflow-x-auto text-slate-800">
                              <MermaidRenderer chart={diagramText} />
                            </div>
                            <button
                              onClick={() => setFullscreenDiagram(diagramText)}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-slate-200 text-slate-600 hover:text-blue-600 shadow-sm px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium"
                              aria-label="Expand diagram"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                              Expand
                            </button>
                          </div>
                        );
                      }
                      return isInline ? (
                        <code className="bg-slate-100 border border-slate-200/60 px-1.5 py-0.5 rounded text-[13px] text-blue-700 font-mono tracking-tight" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200 overflow-x-auto text-[13px] font-mono my-3 text-slate-800 leading-relaxed scrollbar-thin scrollbar-thumb-slate-200">
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
              <div className="message-bubble bg-white border border-slate-100 text-slate-500 self-start rounded-2xl rounded-tl-sm py-3 px-4 shadow-sm flex items-center gap-3">
                <svg className="w-4 h-4 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span ref={textScrambleRef} className="text-[13px] font-medium tracking-wide">
                  {loadingText}
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/60 border-t border-slate-100 backdrop-blur-md">
            <div className="relative flex items-center gap-2">
              <input
                className="flex-1 bg-white border border-slate-200 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 rounded-2xl pl-5 pr-12 py-3.5 text-[14px] text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Message Project Oracle..."
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="absolute right-1.5 w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-blue-600 active:scale-95 shadow-sm"
              >
                <svg className="w-4 h-4 -mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* FAB Button */
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto origin-bottom-right animate-in zoom-in fade-in duration-300 w-15 h-15 p-4 bg-blue-600 hover:bg-blue-700 rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.3)] flex items-center justify-center text-white transition-all transform hover:scale-105 active:scale-95 border border-blue-500/50 group"
          aria-label="Open chat"
        >
          <img 
            src="/favicon.svg" 
            alt="Project Oracle" 
            className="w-7 h-7 object-contain drop-shadow-md brightness-0 invert group-hover:rotate-12 transition-transform duration-300" 
          />
        </button>
      )}
      </div>

      {/* Fullscreen Diagram Modal */}
      {fullscreenDiagram && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-200">
          <button 
            onClick={() => setFullscreenDiagram(null)}
            className="absolute top-6 right-6 p-3 text-slate-500 hover:text-slate-900 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <div className="w-full max-w-6xl max-h-[90vh] bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-auto p-8 flex items-center justify-center">
             <div className="text-base scale-110 origin-center">
               <MermaidRenderer chart={fullscreenDiagram} />
             </div>
          </div>
        </div>
      )}
    </>
  );
}
