import { createFileRoute } from "@tanstack/react-router";

import PublicPartners from "@/components/site/pages/PublicPartners";

export const Route = createFileRoute("/_site/partners")({
  head: () => ({
    meta: [
      { title: "شركاؤنا | KemetRise" },
      { name: "description", content: "شبكة شركاء KemetRise التقنيين وبرنامج الشراكة المعتمد." },
      { property: "og:title", content: "شركاؤنا | KemetRise" },
      { property: "og:description", content: "شبكة شركاء KemetRise التقنيين وبرنامج الشراكة المعتمد." },
    ],
  }),
  component: PublicPartners,
});
