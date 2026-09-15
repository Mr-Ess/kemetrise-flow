import { createFileRoute } from "@tanstack/react-router";

import PublicPortfolio from "@/components/site/pages/PublicPortfolio";

export const Route = createFileRoute("/_site/portfolio")({
  head: () => ({
    meta: [
      { title: "أعمالنا السابقة | KemetRise" },
      { name: "description", content: "قصص نجاح حقيقية نفذتها KemetRise في قطاعات متعددة." },
      { property: "og:title", content: "أعمالنا السابقة | KemetRise" },
      { property: "og:description", content: "قصص نجاح حقيقية نفذتها KemetRise في قطاعات متعددة." },
    ],
  }),
  component: PublicPortfolio,
});
