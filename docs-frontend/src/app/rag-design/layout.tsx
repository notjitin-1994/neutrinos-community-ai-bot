import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RAG Design Notes",
  description: "Deep dive into our Retrieval-Augmented Generation strategy, semantic chunking, and confidence scoring algorithms.",
  openGraph: {
    title: "RAG Design Notes | Neutrinos AI SLA Bot",
    description: "Deep dive into our Retrieval-Augmented Generation strategy, semantic chunking, and confidence scoring algorithms.",
    url: "https://neutrinosdeliverables.vercel.app/rag-design",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
