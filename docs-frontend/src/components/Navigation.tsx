"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const ROUTES = [
  { path: "/", label: "Dashboard" },
  { path: "/live-demo", label: "Live Demo" },
  { path: "/architecture", label: "Architecture Diagram" },
  { path: "/rag-design", label: "RAG Design Notes" },
  { path: "/sla-definitions", label: "SLA Definitions" },
  { path: "/production-plan", label: "Production Plan" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableRoutes = ROUTES.filter((r) => r.path !== pathname);
  const currentRoute = ROUTES.find((r) => r.path === pathname) || ROUTES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-[100] mb-12 md:mb-16 w-full stagger-block" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:w-64 gap-3 bg-white/90 backdrop-blur-sm border border-slate-200 px-5 py-3 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
      >
        <div className="flex flex-col items-start">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">Navigation</span>
          <span className="font-semibold text-slate-900 text-sm">{currentRoute.label}</span>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-full md:w-64 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl overflow-hidden origin-top animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 flex flex-col gap-1">
            {availableRoutes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                onClick={() => setIsOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-between"
              >
                {route.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
