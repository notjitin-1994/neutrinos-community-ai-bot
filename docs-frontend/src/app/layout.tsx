import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  title: "Neutrinos AI SLA Bot | Project Deliverables",
  description: "Documentation and Deliverables for the Neutrinos Community AI SLA Bot",
  icons: {
    icon: '/favicon.svg'
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.className} min-h-screen flex flex-col bg-slate-50 relative`}>
        {/* Global Navigation */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 py-4 px-8 flex items-center justify-between shadow-sm">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/favicon.svg" alt="Neutrinos Logo" width={32} height={32} className="group-hover:scale-105 transition-transform" />
            <span className="font-semibold text-xl tracking-wide text-slate-900 transition-colors">
              Neutrinos
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-blue-600 transition-colors">Dashboard</Link>
            <a href="https://github.com/notjitin-1994/neutrinos-community-ai-bot" target="_blank" className="hover:text-blue-600 transition-colors">Repository</a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow py-4 md:py-5 lg:py-10 px-8 md:px-12 lg:px-24 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </body>
    </html>
  );
}
