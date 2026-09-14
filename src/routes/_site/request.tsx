import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { SalesRequestForm } from "@/components/SalesRequestForm";
import { siteContentQuery } from "@/lib/site.functions";

type Search = { service?: string; product?: string; plan?: string };

export const Route = createFileRoute("/_site/request")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    service: typeof s['service'] === "string" ? s['service'] : undefined,
    product: typeof s['product'] === "string" ? s['product'] : undefined,
    plan: typeof s['plan'] === "string" ? s['plan'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "اطلب الآن | KemetRise" },
      {
        name: "description",
        content: "أرسل طلبك إلى فريق KemetRise واحصل على عرض سعر، وتابع طلبك من بوابة العميل.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "اطلب الآن | KemetRise" },
      { property: "og:description", content: "نموذج طلب واحد موحّد لكل الخدمات والمنتجات." },
    ],
  }),
  component: RequestPage,
});

function RequestPage() {
  const search = Route.useSearch();
  const { data } = useSuspenseQuery(siteContentQuery);

  const service = data.services.find((s) => s.slug === search.service) ?? null;
  const product = data.products.find((p) => p.slug === search.product) ?? null;
  const presetTitle = service
    ? `طلب خدمة: ${service.name}`
    : product
      ? `طلب منتج: ${product.name}`
      : search.plan
        ? `طلب باقة: ${search.plan}`
        : "";

  return (
    <>
      <SiteHero
        title="اطلب الآن"
        subtitle="أكمل البيانات وسيصلك رقم الطلب فورًا، ويتواصل معك فريق المبيعات خلال 24 ساعة عمل."
      />
      <SiteSection className="max-w-3xl">
        <SiteCard>
          <SalesRequestForm
            mode="public"
            presetTitle={presetTitle}
            sourceDetail={service?.slug ?? product?.slug ?? search.plan ?? null}
            originPage="/request"
            websiteServiceId={service?.id ?? null}
            websiteProductId={product?.id ?? null}
          />
        </SiteCard>
      </SiteSection>
    </>
  );
}
