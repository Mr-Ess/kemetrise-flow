import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS, QUOTATION_STATUS, REQUEST_STATUS } from "@/lib/constants";
import { egp, formatDate } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "نتائج البحث | KemetRise" },
      { name: "description", content: "بحث موحّد في العملاء والطلبات والعروض والأوامر والمدفوعات." },
      { property: "og:title", content: "نتائج البحث | KemetRise" },
      { property: "og:description", content: "بحث سريع داخل نظام KemetRise." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["search", q],
    enabled: q.length > 0,
    queryFn: async () => {
      const like = `%${q}%`;
      const [customers, requests, quotations, orders, payments] = await Promise.all([
        supabase
          .from("customers")
          .select("id, code, full_name, phone")
          .or(`full_name.ilike.${like},phone.ilike.${like},code.ilike.${like},company_name.ilike.${like}`)
          .limit(20),
        supabase
          .from("sales_requests")
          .select("id, code, title, status, estimated_value")
          .or(`title.ilike.${like},code.ilike.${like}`)
          .limit(20),
        supabase
          .from("quotations")
          .select("id, code, total, status, request_id")
          .ilike("code", like)
          .limit(20),
        supabase
          .from("orders")
          .select("id, code, title, status, total_price")
          .or(`title.ilike.${like},code.ilike.${like}`)
          .limit(20),
        supabase
          .from("payments")
          .select("id, code, amount, payment_date, order_id")
          .or(`code.ilike.${like},reference.ilike.${like}`)
          .limit(20),
      ]);
      return {
        customers: customers.data ?? [],
        requests: requests.data ?? [],
        quotations: quotations.data ?? [],
        orders: orders.data ?? [],
        payments: payments.data ?? [],
      };
    },
  });

  const total = data
    ? data.customers.length +
      data.requests.length +
      data.quotations.length +
      data.orders.length +
      data.payments.length
    : 0;

  return (
    <>
      <PageHeader title="نتائج البحث" subtitle={q ? `عن: ${q}` : "اكتب كلمة للبحث"} />

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}
      {data && total === 0 ? (
        <EmptyState title="لا توجد نتائج" description="جرّب كلمة أو كودًا مختلفًا." />
      ) : null}

      <div className="space-y-4">
        {data && data.customers.length > 0 ? (
          <SectionCard title={`العملاء (${data.customers.length})`}>
            <ul className="divide-y divide-border">
              {data.customers.map((c) => (
                <li key={c.id} className="py-2">
                  <Link
                    to="/customers/$id"
                    params={{ id: c.id }}
                    className="flex justify-between hover:text-primary"
                  >
                    <span>{c.full_name}</span>
                    <span className="num text-xs text-muted-foreground">
                      {c.code} · {c.phone}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {data && data.requests.length > 0 ? (
          <SectionCard title={`طلبات البيع (${data.requests.length})`}>
            <ul className="divide-y divide-border">
              {data.requests.map((r) => (
                <li key={r.id} className="py-2">
                  <Link
                    to="/requests/$id"
                    params={{ id: r.id }}
                    className="flex items-center justify-between gap-2 hover:text-primary"
                  >
                    <span className="truncate">{r.title}</span>
                    <span className="flex items-center gap-2">
                      <span className="num text-xs">{egp(Number(r.estimated_value))}</span>
                      <StatusPill
                        label={REQUEST_STATUS[r.status]?.label ?? r.status}
                        tone={REQUEST_STATUS[r.status]?.tone}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {data && data.quotations.length > 0 ? (
          <SectionCard title={`عروض الأسعار (${data.quotations.length})`}>
            <ul className="divide-y divide-border">
              {data.quotations.map((qq) => (
                <li key={qq.id} className="py-2">
                  <Link
                    to="/requests/$id"
                    params={{ id: qq.request_id }}
                    className="flex items-center justify-between gap-2 hover:text-primary"
                  >
                    <span className="num">{qq.code}</span>
                    <span className="flex items-center gap-2">
                      <span className="num text-xs">{egp(Number(qq.total))}</span>
                      <StatusPill
                        label={QUOTATION_STATUS[qq.status]?.label ?? qq.status}
                        tone={QUOTATION_STATUS[qq.status]?.tone}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {data && data.orders.length > 0 ? (
          <SectionCard title={`الأوامر (${data.orders.length})`}>
            <ul className="divide-y divide-border">
              {data.orders.map((o) => (
                <li key={o.id} className="py-2">
                  <Link
                    to="/orders/$id"
                    params={{ id: o.id }}
                    className="flex items-center justify-between gap-2 hover:text-primary"
                  >
                    <span className="truncate">{o.title}</span>
                    <span className="flex items-center gap-2">
                      <span className="num text-xs">{egp(Number(o.total_price))}</span>
                      <StatusPill
                        label={ORDER_STATUS[o.status]?.label ?? o.status}
                        tone={ORDER_STATUS[o.status]?.tone}
                      />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}

        {data && data.payments.length > 0 ? (
          <SectionCard title={`المدفوعات (${data.payments.length})`}>
            <ul className="divide-y divide-border">
              {data.payments.map((p) => (
                <li key={p.id} className="flex justify-between py-2">
                  <span className="num">{p.code}</span>
                  <span className="num text-xs text-muted-foreground">
                    {egp(Number(p.amount))} · {formatDate(p.payment_date)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        ) : null}
      </div>
    </>
  );
}
