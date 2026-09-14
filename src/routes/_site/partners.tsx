import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { EmptyState } from "@/components/ui-kit";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/partners")({
  head: () => ({
    meta: [
      { title: "شركاؤنا | KemetRise" },
      {
        name: "description",
        content: "شبكة شركاء KemetRise في التقنية والإنتاج والاستشارات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "شركاؤنا | KemetRise" },
      { property: "og:description", content: "شركاء نجاح في التقنية والإنتاج والاستشارات." },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="شركاؤنا" subtitle="نعمل مع شركاء موثوقين لضمان جودة التنفيذ." />
      <SiteSection>
        {data.partners.length === 0 ? (
          <EmptyState title="لا يوجد شركاء منشورون بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.partners.map((p) => (
              <SiteCard key={p.id}>
                <p className="text-xs text-primary">{p.partner_type}</p>
                <h2 className="mt-1 text-lg font-semibold">{p.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
              </SiteCard>
            ))}
          </div>
        )}
      </SiteSection>
    </>
  );
}
