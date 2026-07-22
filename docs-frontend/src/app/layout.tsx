import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import GraphChat from "@/components/GraphChat";

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ["latin"] 
});

export const metadata: Metadata = {
  metadataBase: new URL('https://neutrinosdeliverables.vercel.app'),
  title: {
    default: "Neutrinos AI SLA Bot | Project Deliverables",
    template: "%s | Neutrinos AI SLA Bot"
  },
  description: "Documentation and Deliverables for the Neutrinos Community AI SLA Bot. Explore the RAG pipeline, Architecture, and Production scale plan.",
  icons: {
    icon: '/favicon.svg'
  },
  openGraph: {
    title: "Neutrinos AI SLA Bot | Project Deliverables",
    description: "Documentation and Deliverables for the Neutrinos Community AI SLA Bot.",
    url: "https://neutrinosdeliverables.vercel.app",
    siteName: "Neutrinos AI Deliverables",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Neutrinos AI SLA Bot | Project Deliverables",
    description: "Documentation and Deliverables for the Neutrinos Community AI SLA Bot.",
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
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Navigation />
            <a href="https://github.com/notjitin-1994/neutrinos-community-ai-bot" target="_blank" className="hidden md:block hover:text-blue-600 transition-colors ml-4">Repository</a>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow py-4 md:py-5 lg:py-10 px-8 md:px-12 lg:px-24 max-w-7xl mx-auto w-full">
          {children}
        </main>

        <GraphChat />
      </body>
    </html>
  );
}
