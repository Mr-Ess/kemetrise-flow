import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { CHANGE_REQUEST_STATUS } from "@/lib/constants";
import { egp, formatDateTime, num } from "@/lib/format";
import { EmptyState, InlineLoading, SectionCard, StatusPill } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/integrations/supabase/types";

type Status = Database["public"]["Enums"]["change_request_status"];

export function ChangeRequestsPanel({ requestId }: { requestId: string }) {
  const queryClient = useQueryClient();
  const [replies, setReplies] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["change-requests", requestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotation_change_requests")
        .select("*, quotations(code)")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const resolve = useMutation({
    mutationFn: async (input: { id: string; status: Status }) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("quotation_change_requests")
        .update({
          status: input.status,
          response: replies[input.id] || null,
          resolved_by: auth.user?.id ?? null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم تحديث طلب التعديل");
      queryClient.invalidateQueries({ queryKey: ["change-requests", requestId] });
      queryClient.invalidateQueries({ queryKey: ["control-tower"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  if (isLoading) return <InlineLoading />;

  return (
    <SectionCard title="طلبات التعديل من العميل">
      {(data ?? []).length === 0 ? (
        <EmptyState title="لا توجد طلبات تعديل" />
      ) : (
        <ul className="divide-y divide-border">
          {(data ?? []).map((c) => (
            <li key={c.id} className="space-y-2 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  label={CHANGE_REQUEST_STATUS[c.status]?.label ?? c.status}
                  tone={CHANGE_REQUEST_STATUS[c.status]?.tone}
                />
                <span className="num text-xs text-muted-foreground">
                  {(c.quotations as { code: string } | null)?.code ?? ""} ·{" "}
                  {formatDateTime(c.created_at)}
                </span>
              </div>
              <p className="text-sm">{c.message}</p>
              <p className="text-xs text-muted-foreground">
                {c.requested_price ? `سعر مقترح: ${egp(Number(c.requested_price))} · ` : ""}
                {c.requested_delivery_days
                  ? `مدة تسليم مطلوبة: ${num(c.requested_delivery_days)} يوم`
                  : ""}
              </p>
              {c.response ? (
                <p className="text-xs text-muted-foreground">الرد: {c.response}</p>
              ) : null}
              {c.status === "open" || c.status === "in_review" ? (
                <div className="space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="رد الفريق على العميل"
                    value={replies[c.id] ?? ""}
                    onChange={(e) => setReplies({ ...replies, [c.id]: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ id: c.id, status: "accepted" })}
                    >
                      قبول التعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolve.isPending}
                      onClick={() => resolve.mutate({ id: c.id, status: "rejected" })}
                    >
                      رفض
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
