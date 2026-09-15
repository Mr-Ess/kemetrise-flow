import { createFileRoute } from "@tanstack/react-router";

import PublicAgents from "@/components/site/pages/PublicAgents";

export const Route = createFileRoute("/_site/our-agents")({
  head: () => ({
    meta: [
      { title: "وكلاؤنا | KemetRise" },
      { name: "description", content: "شبكة وكلاء KemetRise الإقليميين حول العالم وفرص التوزيع." },
      { property: "og:title", content: "وكلاؤنا | KemetRise" },
      { property: "og:description", content: "شبكة وكلاء KemetRise الإقليميين حول العالم وفرص التوزيع." },
    ],
  }),
  component: PublicAgents,
});
