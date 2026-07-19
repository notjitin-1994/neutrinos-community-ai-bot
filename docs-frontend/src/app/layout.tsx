import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Neutrinos AI SLA Bot | Project Deliverables",
  description: "Documentation and Deliverables for the Neutrinos Community AI SLA Bot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col relative`}>
        {/* Abstract Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Global Navigation */}
        <header className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 py-4 px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xl shadow-[0_0_15px_rgba(0,102,255,0.5)] group-hover:shadow-[0_0_25px_rgba(0,102,255,0.8)] transition-all">
              N
            </div>
            <span className="font-semibold text-lg tracking-wide text-white/90 group-hover:text-white transition-colors">
              Neutrinos
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="https://github.com" target="_blank" className="hover:text-white transition-colors">Repository</a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow p-8 md:p-12 lg:p-24 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
