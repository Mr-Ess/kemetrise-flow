import { createFileRoute } from "@tanstack/react-router";

import PublicAbout from "@/components/site/pages/PublicAbout";

export const Route = createFileRoute("/_site/about")({
  head: () => ({
    meta: [
      { title: "من نحن | KemetRise" },
      { name: "description", content: "رؤية KemetRise وفريق القيادة ومسيرة تطوير منصة Legacy Nexus." },
      { property: "og:title", content: "من نحن | KemetRise" },
      { property: "og:description", content: "رؤية KemetRise وفريق القيادة ومسيرة تطوير منصة Legacy Nexus." },
    ],
  }),
  component: PublicAbout,
});
