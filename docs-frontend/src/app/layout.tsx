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
    <html lang="en" className="dark">
      <body className={`${poppins.className} min-h-screen flex flex-col relative`}>
        {/* Abstract Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />
        </div>

        {/* Global Navigation */}
        <header className="sticky top-0 z-50 glass-panel !rounded-none !border-x-0 !border-t-0 py-4 px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/favicon.svg" alt="Neutrinos Logo" width={32} height={32} className="group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xl tracking-wide text-white/90 group-hover:text-white transition-colors">
              Neutrinos
            </span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-white/60">
            <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="https://github.com/notjitin-1994/neutrinos-community-ai-bot" target="_blank" className="hover:text-white transition-colors">Repository</a>
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
