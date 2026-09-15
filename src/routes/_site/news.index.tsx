import { createFileRoute } from "@tanstack/react-router";

import PublicNews from "@/components/site/pages/PublicNews";

export const Route = createFileRoute("/_site/news/")({
  head: () => ({
    meta: [
      { title: "آخر أخبارنا | KemetRise" },
      { name: "description", content: "أحدث أخبار ومقالات KemetRise حول المنصة والقطاعات والتحديثات." },
      { property: "og:title", content: "آخر أخبارنا | KemetRise" },
      { property: "og:description", content: "أحدث أخبار ومقالات KemetRise حول المنصة والقطاعات والتحديثات." },
    ],
  }),
  component: PublicNews,
});
