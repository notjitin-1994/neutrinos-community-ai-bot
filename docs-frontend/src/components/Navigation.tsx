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
    <div className="relative z-[100] w-[180px] md:w-[220px]" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 md:py-2 rounded-lg shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
      >
        <div className="flex flex-col items-start truncate overflow-hidden">
          <span className="font-semibold text-slate-800 text-xs md:text-sm truncate w-full text-left">{currentRoute.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-600" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-[240px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1.5 flex flex-col gap-0.5">
            {availableRoutes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                onClick={() => setIsOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-between"
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
