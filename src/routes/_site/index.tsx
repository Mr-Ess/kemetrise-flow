import { createFileRoute } from "@tanstack/react-router";

import PublicLanding from "@/components/site/pages/PublicLanding";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "KemetRise: Legacy Nexus | المنصة الموحدة متعددة المستأجرين" },
      { name: "description", content: "منصة SaaS + ERP موحدة تجمع إحدى عشرة بوابة في نظام واحد — قطاعات متعددة، وكلاء، شركاء، وذكاء اصطناعي." },
      { property: "og:title", content: "KemetRise: Legacy Nexus | المنصة الموحدة متعددة المستأجرين" },
      { property: "og:description", content: "منصة SaaS + ERP موحدة تجمع إحدى عشرة بوابة في نظام واحد — قطاعات متعددة، وكلاء، شركاء، وذكاء اصطناعي." },
    ],
  }),
  component: PublicLanding,
});
