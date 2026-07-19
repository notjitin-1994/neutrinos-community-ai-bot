import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Go-to-Production Plan",
  description: "Design document detailing how this system scales to production grade for community issue resolution.",
  openGraph: {
    title: "Go-to-Production Plan | Neutrinos AI SLA Bot",
    description: "Design document detailing how this system scales to production grade for community issue resolution.",
    url: "https://neutrinosdeliverables.vercel.app/production-plan",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
