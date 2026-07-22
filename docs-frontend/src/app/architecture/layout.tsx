import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Architectural Diagram",
  description: "High-level system architecture outlining the Python Watch Loop, SQLite StateStore, NVIDIA NIMs, and ChromaDB integrations.",
  openGraph: {
    title: "Architectural Diagram | Neutrinos AI SLA Bot",
    description: "High-level system architecture outlining the Python Watch Loop, SQLite StateStore, NVIDIA NIMs, and ChromaDB integrations.",
    url: "https://neutrinosdeliverables.vercel.app/architecture",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
