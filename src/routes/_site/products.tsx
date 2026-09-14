import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-kit";
import { egp } from "@/lib/format";
import { siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/products")({
  head: () => ({
    meta: [
      { title: "منتجاتنا | KemetRise" },
      {
        name: "description",
        content: "منتجات وباقات KemetRise الرقمية والإنتاجية مع إمكانية طلب عرض سعر فوري.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "منتجاتنا | KemetRise" },
      { property: "og:description", content: "منتجات وحلول جاهزة مع عرض سعر سريع." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="منتجاتنا" subtitle="حلول جاهزة يمكن تخصيصها حسب احتياجك." />
      <SiteSection>
        {data.products.length === 0 ? (
          <EmptyState title="لا توجد منتجات منشورة بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.products.map((p) => (
              <SiteCard key={p.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-primary">{p.category}</p>
                    <h2 className="mt-1 text-lg font-semibold">{p.name}</h2>
                  </div>
                  {p.is_new ? (
                    <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
                      جديد
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                  {((p.features as string[]) ?? []).map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <p className="num mt-4 text-base font-bold">
                  {p.price ? egp(Number(p.price)) : "بعد دراسة المتطلبات"}
                </p>
                <Button asChild size="sm" className="mt-3 self-start">
                  <Link
                    to="/request"
                    search={{ service: undefined, product: p.slug, plan: undefined }}
                  >
                    اطلب عرض سعر
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
