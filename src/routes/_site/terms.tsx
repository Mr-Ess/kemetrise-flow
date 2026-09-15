import { createFileRoute } from "@tanstack/react-router";

import TermsOfService from "@/components/site/pages/TermsOfService";

export const Route = createFileRoute("/_site/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام | KemetRise" },
      { name: "description", content: "شروط وأحكام استخدام منصة KemetRise: Legacy Nexus." },
      { property: "og:title", content: "الشروط والأحكام | KemetRise" },
      { property: "og:description", content: "شروط وأحكام استخدام منصة KemetRise: Legacy Nexus." },
    ],
  }),
  component: TermsOfService,
});
