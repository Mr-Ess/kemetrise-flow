import { createFileRoute } from "@tanstack/react-router";

import PublicServices from "@/components/site/pages/PublicServices";

export const Route = createFileRoute("/_site/services")({
  head: () => ({
    meta: [
      { title: "خدماتنا | KemetRise" },
      { name: "description", content: "وحدات وخدمات KemetRise المتكاملة: ERP، الموارد البشرية، البائعين، التسويق، الذكاء الاصطناعي والمزيد." },
      { property: "og:title", content: "خدماتنا | KemetRise" },
      { property: "og:description", content: "وحدات وخدمات KemetRise المتكاملة: ERP، الموارد البشرية، البائعين، التسويق، الذكاء الاصطناعي والمزيد." },
    ],
  }),
  component: PublicServices,
});
