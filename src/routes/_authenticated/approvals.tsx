import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { logActivity, notify } from "@/lib/actions";
import { useAuth } from "@/lib/auth";
import { egp, hoursSince, num, pct } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  PageHeader,
  SectionCard,
  StatusPill,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({
    meta: [
      { title: "الاعتمادات | KemetRise" },
      { name: "description", content: "طلبات التسعير التي تحتاج اعتماد الإدارة قبل عرض السعر." },
      { property: "og:title", content: "الاعتمادات | KemetRise" },
      { property: "og:description", content: "اعتماد أو رفض التسعير الإداري في KemetRise." },
    ],
  }),
  component: ApprovalsPage,
});

function ApprovalsPage() {
  const { isManager } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      const [requests, rules] = await Promise.all([
        supabase
          .from("sales_requests")
          .select(
            "id, code, title, status, status_changed_at, quantity, unit, customers(full_name), costings(id, total_cost, suggested_price, target_margin, delivery_days, notes)",
          )
          .eq("status", "pending_approval")
          .order("status_changed_at", { ascending: true }),
        supabase.from("pricing_rules").select("*").eq("is_active", true).maybeSingle(),
      ]);
      if (requests.error) throw requests.error;
      return { rows: requests.data ?? [], rules: rules.data };
    },
  });

  const decide = useMutation({
    mutationFn: async (input: { requestId: string; code: string; costingId?: string; price?: number; approve: boolean }) => {
      const { data: auth } = await supabase.auth.getUser();
      if (input.costingId) {
        await supabase
          .from("costings")
          .update(
            input.approve
              ? {
                  approved_at: new Date().toISOString(),
                  approved_by: auth.user?.id ?? null,
                  approved_price: input.price ?? null,
                }
              : { approved_at: null, approved_by: null, approved_price: null, is_submitted: false },
          )
          .eq("id", input.costingId);
      }
      const { error } = await supabase
        .from("sales_requests")
        .update({
          status: input.approve ? "costing_completed" : "costing_in_progress",
          status_changed_at: new Date().toISOString(),
        })
        .eq("id", input.requestId);
      if (error) throw error;

      await logActivity({
        entityType: "sales_request",
        entityId: input.requestId,
        entityCode: input.code,
        action: input.approve ? "approved" : "rejected",
        description: input.approve
          ? `تم اعتماد التسعير بسعر ${egp(input.price ?? 0)}`
          : "تم رفض التسعير وإعادته للتسعير",
      });
      await notify({
        title: input.approve ? "تم اعتماد التسعير" : "تم رفض التسعير",
        body: input.code,
        link: `/requests/${input.requestId}`,
        targetRole: input.approve ? "sales" : "costing",
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل القرار");
      queryClient.invalidateQueries();
    },
    onError: (e: Error) => toast.error("تعذّر التنفيذ", { description: e.message }),
  });

  if (!isManager) {
    return (
      <EmptyState
        title="صفحة الاعتمادات للإدارة فقط"
        description="تواصل مع مدير النظام إذا كنت تحتاج هذه الصلاحية."
      />
    );
  }

  const sla = Number(data?.rules?.approval_sla_hours ?? 24);

  return (
    <>
      <PageHeader
        title="الاعتمادات"
        subtitle={`${data?.rows.length ?? 0} تسعير بانتظار قرار الإدارة`}
      />

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}

      {data && data.rows.length === 0 ? (
        <EmptyState title="لا توجد اعتمادات معلّقة" description="كل التسعيرات تمت معالجتها." />
      ) : null}

      <div className="space-y-4">
        {(data?.rows ?? []).map((r) => {
          const costing = (r.costings as unknown as {
            id: string;
            total_cost: number;
            suggested_price: number;
            target_margin: number;
            delivery_days: number | null;
            notes: string | null;
          }[] | null)?.[0];
          const price = Number(costing?.suggested_price ?? 0);
          const cost = Number(costing?.total_cost ?? 0);
          const margin = price ? ((price - cost) / price) * 100 : 0;
          const late = hoursSince(r.status_changed_at) > sla;

          return (
            <SectionCard
              key={r.id}
              title={r.title}
              actions={
                late ? <StatusPill label="تجاوز مدة الاعتماد" tone="danger" /> : (
                  <StatusPill label="ضمن المدة" tone="success" />
                )
              }
            >
              <p className="mb-3 text-xs text-muted-foreground">
                <span className="num">{r.code}</span> ·{" "}
                {(r.customers as { full_name: string } | null)?.full_name} ·{" "}
                <span className="num">
                  {r.quantity} {r.unit}
                </span>
              </p>
              <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-surface p-4 sm:grid-cols-5">
                <Field label="إجمالي التكلفة" value={<span className="num">{egp(cost)}</span>} />
                <Field label="سعر البيع المقترح" value={<span className="num">{egp(price)}</span>} />
                <Field label="الربح" value={<span className="num">{egp(price - cost)}</span>} />
                <Field label="هامش الربح" value={<span className="num">{pct(margin)}</span>} />
                <Field
                  label="مدة التنفيذ"
                  value={costing?.delivery_days ? `${costing.delivery_days} يوم` : "—"}
                />
              </div>
              {costing?.notes ? (
                <p className="mt-3 text-sm text-muted-foreground">{costing.notes}</p>
              ) : null}
              {data?.rules && margin < Number(data.rules.min_margin) ? (
                <p className="mt-3 text-xs text-destructive">
                  تحذير: الهامش أقل من الحد الأدنى المسموح (
                  <span className="num">{num(Number(data.rules.min_margin), 1)}%</span>)
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={decide.isPending}
                  onClick={() =>
                    decide.mutate({
                      requestId: r.id,
                      code: r.code,
                      costingId: costing?.id,
                      price,
                      approve: true,
                    })
                  }
                >
                  اعتماد
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={decide.isPending}
                  onClick={() =>
                    decide.mutate({
                      requestId: r.id,
                      code: r.code,
                      costingId: costing?.id,
                      approve: false,
                    })
                  }
                >
                  رفض وإعادة التسعير
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/requests/$id" params={{ id: r.id }}>
                    عرض التفاصيل
                  </Link>
                </Button>
              </div>
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
