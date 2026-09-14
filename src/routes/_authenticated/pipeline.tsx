import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { PIPELINE_STAGES, REQUEST_STATUS } from "@/lib/constants";
import { age, egp, num } from "@/lib/format";
import { ErrorState, LoadingState, PageHeader, StatusPill } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/pipeline")({
  head: () => ({
    meta: [
      { title: "خط سير المبيعات | KemetRise" },
      {
        name: "description",
        content: "متابعة مراحل طلبات البيع من الإنشاء حتى التحويل إلى أمر تنفيذ.",
      },
      { property: "og:title", content: "خط سير المبيعات | KemetRise" },
      { property: "og:description", content: "مراحل الطلبات وقيمتها وأعمارها في نظام KemetRise." },
    ],
  }),
  component: PipelinePage,
});

function PipelinePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_requests")
        .select("id, code, title, status, estimated_value, created_at, customers(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <PageHeader
        title="خط سير المبيعات"
        subtitle="عدد الطلبات وقيمتها التقديرية وعمرها في كل مرحلة"
      />

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState rows={3} /> : null}

      {data ? (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage) => {
            const items = data.filter((r) => stage.statuses.includes(r.status));
            const value = items.reduce((s, r) => s + Number(r.estimated_value ?? 0), 0);
            return (
              <div key={stage.key} className="panel w-72 shrink-0 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">{stage.label}</p>
                  <span className="num rounded-md bg-muted px-2 py-0.5 text-xs">
                    {num(items.length)}
                  </span>
                </div>
                <p className="num mb-3 text-xs text-muted-foreground">{egp(value)}</p>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      لا توجد طلبات في هذه المرحلة
                    </p>
                  ) : (
                    items.slice(0, 20).map((r) => (
                      <Link
                        key={r.id}
                        to="/requests/$id"
                        params={{ id: r.id }}
                        className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary/50"
                      >
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {(r.customers as { full_name: string } | null)?.full_name}
                        </p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="num text-xs font-semibold">
                            {egp(Number(r.estimated_value))}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            عمر {age(r.created_at)}
                          </span>
                        </div>
                        <div className="mt-2">
                          <StatusPill
                            label={REQUEST_STATUS[r.status]?.label ?? r.status}
                            tone={REQUEST_STATUS[r.status]?.tone}
                          />
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
