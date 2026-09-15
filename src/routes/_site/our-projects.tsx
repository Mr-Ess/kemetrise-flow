import { createFileRoute } from "@tanstack/react-router";

import PublicProjects from "@/components/site/pages/PublicProjects";

export const Route = createFileRoute("/_site/our-projects")({
  head: () => ({
    meta: [
      { title: "مشاريعنا | KemetRise" },
      { name: "description", content: "مشاريع KemetRise المنفذة عبر العلامات والقطاعات المختلفة." },
      { property: "og:title", content: "مشاريعنا | KemetRise" },
      { property: "og:description", content: "مشاريع KemetRise المنفذة عبر العلامات والقطاعات المختلفة." },
    ],
  }),
  component: PublicProjects,
});
