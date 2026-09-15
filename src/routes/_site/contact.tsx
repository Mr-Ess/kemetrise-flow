import { createFileRoute } from "@tanstack/react-router";

import PublicContact from "@/components/site/pages/PublicContact";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | KemetRise" },
      { name: "description", content: "تواصل مع فريق KemetRise — مكاتبنا وبيانات الاتصال ونموذج المراسلة." },
      { property: "og:title", content: "تواصل معنا | KemetRise" },
      { property: "og:description", content: "تواصل مع فريق KemetRise — مكاتبنا وبيانات الاتصال ونموذج المراسلة." },
    ],
  }),
  component: PublicContact,
});
