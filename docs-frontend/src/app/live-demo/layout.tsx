import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Working Bot Demo",
  description: "Watch a live video demonstration of the Community AI SLA Bot interacting with discourse in real-time.",
  openGraph: {
    title: "Live Working Bot Demo | Neutrinos AI SLA Bot",
    description: "Watch a live video demonstration of the Community AI SLA Bot interacting with discourse in real-time.",
    url: "https://neutrinosdeliverables.vercel.app/live-demo",
  }
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
