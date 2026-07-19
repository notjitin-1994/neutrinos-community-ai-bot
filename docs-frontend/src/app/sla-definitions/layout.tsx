import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SLA & Answered Definitions",
  description: "Detailed logic for SLA guardrails, grace periods, and idempotent state management in discourse.",
  openGraph: {
    title: "SLA & Answered Definitions | Neutrinos AI SLA Bot",
    description: "Detailed logic for SLA guardrails, grace periods, and idempotent state management in discourse.",
    url: "https://neutrinosdeliverables.vercel.app/sla-definitions",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
