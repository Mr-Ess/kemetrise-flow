import { createFileRoute } from "@tanstack/react-router";

import Pricing from "@/components/site/pages/Pricing";

export const Route = createFileRoute("/_site/pricing")({
  head: () => ({
    meta: [
      { title: "باقاتنا | KemetRise" },
      { name: "description", content: "باقات اشتراك KemetRise والمنتجات والخدمات وحلول القطاعات." },
      { property: "og:title", content: "باقاتنا | KemetRise" },
      { property: "og:description", content: "باقات اشتراك KemetRise والمنتجات والخدمات وحلول القطاعات." },
    ],
  }),
  component: Pricing,
});
