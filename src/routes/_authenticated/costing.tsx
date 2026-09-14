import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PRIORITY, REQUEST_STATUS } from "@/lib/constants";
import { age, egp, num } from "@/lib/format";
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
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/costing")({
  head: () => ({
    meta: [
      { title: "قائمة التسعير | KemetRise" },
      { name: "description", content: "الطلبات المنتظرة للتسعير الداخلي وحالة كل تسعير." },
      { property: "og:title", content: "قائمة التسعير | KemetRise" },
      { property: "og:description", content: "إدارة تسعير الطلبات داخليًا في KemetRise." },
    ],
  }),
  component: CostingQueue,
});

function CostingQueue() {
  const { canSeeCosts } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["costing-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_requests")
        .select(
          "id, code, title, status, priority, quantity, unit, created_at, status_changed_at, estimated_value, customers(full_name), costings(id, total_cost, suggested_price, is_submitted, approved_at)",
        )
        .in("status", ["costing_in_progress", "costing_completed", "pending_approval"])
        .order("status_changed_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!canSeeCosts) {
    return (
      <EmptyState
        title="لا تملك صلاحية عرض التسعير"
        description="التسعير الداخلي متاح لمدير النظام والإدارة وفريق التسعير فقط."
      />
    );
  }

  const waiting = (data ?? []).filter((r) => r.status === "costing_in_progress");
  const submitted = (data ?? []).filter((r) => r.status === "pending_approval");
  const done = (data ?? []).filter((r) => r.status === "costing_completed");

  return (
    <>
      <PageHeader title="قائمة التسعير" subtitle="الطلبات التي تحتاج تسعيرًا داخليًا" />

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}

      {data ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <KpiCard label="بانتظار التسعير" value={num(waiting.length)} tone="warning" />
            <KpiCard label="بانتظار الاعتماد" value={num(submitted.length)} tone="info" />
            <KpiCard label="تسعير مكتمل" value={num(done.length)} tone="success" />
          </div>

          <div className="mt-4 space-y-4">
            {[
              { title: "بانتظار التسعير", rows: waiting },
              { title: "بانتظار الاعتماد الإداري", rows: submitted },
              { title: "تسعير مكتمل", rows: done },
            ].map((group) => (
              <SectionCard key={group.title} title={group.title}>
                {group.rows.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">لا توجد طلبات</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {group.rows.map((r) => {
                      const costing = (r.costings as unknown as { total_cost: number; suggested_price: number }[] | null)?.[0];
                      return (
                        <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{r.title}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="num">{r.code}</span> ·{" "}
                              {(r.customers as { full_name: string } | null)?.full_name} ·{" "}
                              <span className="num">
                                {r.quantity} {r.unit}
                              </span>{" "}
                              · انتظار {age(r.status_changed_at)}
                            </p>
                          </div>
                          {costing ? (
                            <div className="text-xs text-muted-foreground">
                              تكلفة <span className="num">{egp(Number(costing.total_cost))}</span> ·
                              سعر <span className="num">{egp(Number(costing.suggested_price))}</span>
                            </div>
                          ) : null}
                          <StatusPill
                            label={PRIORITY[r.priority]?.label ?? r.priority}
                            tone={PRIORITY[r.priority]?.tone}
                          />
                          <StatusPill
                            label={REQUEST_STATUS[r.status]?.label ?? r.status}
                            tone={REQUEST_STATUS[r.status]?.tone}
                          />
                          <Button asChild size="sm" variant="outline">
                            <Link to="/requests/$id" params={{ id: r.id }}>
                              فتح التسعير
                            </Link>
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </SectionCard>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
