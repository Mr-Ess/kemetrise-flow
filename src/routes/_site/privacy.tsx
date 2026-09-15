import { createFileRoute } from "@tanstack/react-router";

import PrivacyPolicy from "@/components/site/pages/PrivacyPolicy";

export const Route = createFileRoute("/_site/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية | KemetRise" },
      { name: "description", content: "سياسة الخصوصية وحماية البيانات في منصة KemetRise." },
      { property: "og:title", content: "سياسة الخصوصية | KemetRise" },
      { property: "og:description", content: "سياسة الخصوصية وحماية البيانات في منصة KemetRise." },
    ],
  }),
  component: PrivacyPolicy,
});
