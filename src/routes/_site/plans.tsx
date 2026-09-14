import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui-kit";
import { egp } from "@/lib/format";
import { siteContentQuery } from "@/lib/site.functions";
import { cn } from "@/lib/utils";

const PERIOD: Record<string, string> = {
  monthly: "شهريًا",
  yearly: "سنويًا",
  one_time: "دفعة واحدة",
  custom: "حسب الاتفاق",
};

export const Route = createFileRoute("/_site/plans")({
  head: () => ({
    meta: [
      { title: "باقاتنا | KemetRise" },
      {
        name: "description",
        content: "باقات اشتراك KemetRise: الأساسية والاحترافية والمؤسسية بمزايا واضحة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "باقاتنا | KemetRise" },
      { property: "og:description", content: "اختر الباقة المناسبة لحجم أعمالك." },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  return (
    <>
      <SiteHero title="باقاتنا" subtitle="اختر ما يناسب حجم أعمالك، وقابل للتخصيص دائمًا." />
      <SiteSection>
        {data.plans.length === 0 ? (
          <EmptyState title="لا توجد باقات منشورة بعد" />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {data.plans.map((p) => (
              <SiteCard
                key={p.id}
                className={cn("flex flex-col", p.is_featured && "border-primary/60 bg-primary/5")}
              >
                {p.is_featured ? (
                  <span className="mb-2 self-start rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
                    الأكثر طلبًا
                  </span>
                ) : null}
                <h2 className="text-lg font-semibold">{p.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                <p className="num mt-4 text-2xl font-bold">
                  {p.price ? egp(Number(p.price)) : "سعر مخصص"}
                </p>
                <p className="text-xs text-muted-foreground">{PERIOD[p.billing_period] ?? ""}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm">
                  {((p.features as string[]) ?? []).map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="size-3.5 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild size="sm" className="mt-5">
                  <Link
                    to="/request"
                    search={{ service: undefined, product: undefined, plan: p.name }}
                  >
                    {p.cta_label}
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
