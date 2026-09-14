import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-kit";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/services")({
  head: () => ({
    meta: [
      { title: "خدماتنا | KemetRise" },
      {
        name: "description",
        content: "خدمات KemetRise في الهوية البصرية وتطوير المواقع والتطبيقات والإنتاج والتسويق.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "خدماتنا | KemetRise" },
      { property: "og:description", content: "حلول متكاملة تغطي التصميم والتقنية والإنتاج." },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="خدماتنا" subtitle="اختر الخدمة وابدأ طلبك في دقيقة واحدة." />
      <SiteSection>
        {data.services.length === 0 ? (
          <EmptyState title="لا توجد خدمات منشورة بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.services.map((s) => (
              <SiteCard key={s.id} className="flex flex-col">
                <p className="text-xs text-primary">{s.category}</p>
                <h2 className="mt-1 text-lg font-semibold">{s.name}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {((s.features as string[]) ?? []).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="size-3.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" className="mt-4 self-start">
                  <Link
                    to="/request"
                    search={{ service: s.slug, product: undefined, plan: undefined }}
                  >
                    اطلب الخدمة
                  </Link>
                </Button>
              </SiteCard>
            ))}
          </div>
        )}
      </SiteSection>
    </>
  );
}
