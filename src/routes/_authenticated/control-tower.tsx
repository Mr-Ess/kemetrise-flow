import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { REQUEST_STATUS } from "@/lib/constants";
import { age, egp, formatDateTime, hoursSince, num } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/control-tower")({
  head: () => ({
    meta: [
      { title: "برج التحكم الإداري | KemetRise" },
      { name: "description", content: "الاختناقات والتأخيرات وتجاوزات مدة الاستجابة في دورة العمل." },
      { property: "og:title", content: "برج التحكم الإداري | KemetRise" },
      { property: "og:description", content: "رصد الاختناقات التشغيلية في KemetRise." },
    ],
  }),
  component: ControlTower,
});

function ControlTower() {
  const { isManager } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["control-tower"],
    queryFn: async () => {
      const [requests, orders, financials, tasks, rules, activities] = await Promise.all([
        supabase
          .from("sales_requests")
          .select("id, code, title, status, updated_at, estimated_value, customers(full_name)"),
        supabase.from("orders").select("id, code, title, status, expected_delivery, total_price"),
        supabase.from("order_financials").select("*"),
        supabase.from("tasks").select("id, title, due_date, status"),
        supabase.from("pricing_rules").select("*").eq("is_active", true).maybeSingle(),
        supabase
          .from("activities")
          .select("id, action, description, created_at, entity_code")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      if (requests.error) throw requests.error;
      return {
        requests: requests.data ?? [],
        orders: orders.data ?? [],
        financials: financials.data ?? [],
        tasks: tasks.data ?? [],
        rules: rules.data,
        activities: activities.data ?? [],
      };
    },
    refetchInterval: 120000,
  });

  if (!isManager) {
    return (
      <EmptyState
        title="برج التحكم للإدارة فقط"
        description="هذه الشاشة متاحة لمدير النظام والإدارة."
      />
    );
  }

  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (isLoading || !data) return <LoadingState rows={6} />;

  const costingSla = Number(data.rules?.costing_sla_hours ?? 48);
  const approvalSla = Number(data.rules?.approval_sla_hours ?? 24);
  const followupSla = Number(data.rules?.followup_sla_hours ?? 72);
  const today = new Date().toISOString().slice(0, 10);

  const lateCosting = data.requests.filter(
    (r) => r.status === "costing_in_progress" && hoursSince(r.updated_at) > costingSla,
  );
  const lateApproval = data.requests.filter(
    (r) => r.status === "pending_approval" && hoursSince(r.updated_at) > approvalSla,
  );
  const stalledQuotes = data.requests.filter(
    (r) =>
      ["quotation_sent", "negotiation"].includes(r.status) &&
      hoursSince(r.updated_at) > followupSla,
  );
  const lateOrders = data.orders.filter(
    (o) =>
      o.expected_delivery &&
      o.expected_delivery < today &&
      !["completed", "delivered", "cancelled"].includes(o.status),
  );
  const overdueTasks = data.tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== "completed",
  );
  const unpaid = data.financials.filter((f) => Number(f.remaining_amount ?? 0) > 0);

  const groups = [
    { title: `تسعير متأخر (أكثر من ${costingSla} ساعة)`, rows: lateCosting },
    { title: `اعتماد متأخر (أكثر من ${approvalSla} ساعة)`, rows: lateApproval },
    { title: `عروض بلا رد (أكثر من ${followupSla} ساعة)`, rows: stalledQuotes },
  ];

  return (
    <>
      <PageHeader
        title="برج التحكم الإداري"
        subtitle="أين تتعطل دورة العمل الآن ومن يحتاج تدخلًا"
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="تسعير متأخر" value={num(lateCosting.length)} tone="danger" />
        <KpiCard label="اعتماد متأخر" value={num(lateApproval.length)} tone="danger" />
        <KpiCard label="عروض بلا رد" value={num(stalledQuotes.length)} tone="warning" />
        <KpiCard label="أوامر متأخرة" value={num(lateOrders.length)} tone="danger" to="/orders" />
        <KpiCard label="متابعات متأخرة" value={num(overdueTasks.length)} tone="warning" to="/tasks" />
        <KpiCard
          label="مستحقات غير محصّلة"
          value={egp(unpaid.reduce((s, f) => s + Number(f.remaining_amount ?? 0), 0))}
          tone="danger"
          to="/payments"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {groups.map((g) => (
          <SectionCard key={g.title} title={g.title}>
            {g.rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-success">لا توجد تجاوزات</p>
            ) : (
              <ul className="divide-y divide-border">
                {g.rows.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="num">{r.code}</span> ·{" "}
                        {(r.customers as { full_name: string } | null)?.full_name} · متوقف منذ{" "}
                        {age(r.updated_at)}
                      </p>
                    </div>
                    <StatusPill
                      label={REQUEST_STATUS[r.status]?.label ?? r.status}
                      tone={REQUEST_STATUS[r.status]?.tone}
                    />
                    <Button asChild size="sm" variant="outline">
                      <Link to="/requests/$id" params={{ id: r.id }}>
                        متابعة
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        ))}

        <SectionCard title="أوامر تجاوزت موعد التسليم">
          {lateOrders.length === 0 ? (
            <p className="py-6 text-center text-sm text-success">كل الأوامر ضمن مواعيدها</p>
          ) : (
            <ul className="divide-y divide-border">
              {lateOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{o.title}</p>
                    <p className="num text-xs text-muted-foreground">{o.code}</p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link to="/orders/$id" params={{ id: o.id }}>
                      فتح
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="أحدث الأنشطة في النظام" className="lg:col-span-2">
          <ol className="space-y-3">
            {data.activities.map((a) => (
              <li key={a.id} className="flex items-start gap-3">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-sm">{a.description ?? a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="num">{a.entity_code ?? ""}</span>{" "}
                    {formatDateTime(a.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </SectionCard>
      </div>
    </>
  );
}
