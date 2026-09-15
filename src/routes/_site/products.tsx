import { createFileRoute } from "@tanstack/react-router";

import PublicProducts from "@/components/site/pages/PublicProducts";

export const Route = createFileRoute("/_site/products")({
  head: () => ({
    meta: [
      { title: "منتجاتنا | KemetRise" },
      { name: "description", content: "كتالوج منتجات وخدمات KemetRise مع الأسعار والمزايا وطلب مباشر." },
      { property: "og:title", content: "منتجاتنا | KemetRise" },
      { property: "og:description", content: "كتالوج منتجات وخدمات KemetRise مع الأسعار والمزايا وطلب مباشر." },
    ],
  }),
  component: PublicProducts,
});
