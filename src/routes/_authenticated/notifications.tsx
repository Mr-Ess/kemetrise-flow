import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  SectionCard,
} from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | KemetRise" },
      { name: "description", content: "إشعارات الطلبات والتسعير والاعتمادات والمدفوعات." },
      { property: "og:title", content: "الإشعارات | KemetRise" },
      { property: "og:description", content: "تنبيهات فريق KemetRise اللحظية." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
    },
    onError: (e: Error) => toast.error("تعذّر التحديث", { description: e.message }),
  });

  const unread = (data ?? []).filter((n) => !n.is_read);

  return (
    <>
      <PageHeader
        title="الإشعارات"
        subtitle={`${unread.length} إشعار غير مقروء`}
        actions={
          unread.length > 0 ? (
            <Button size="sm" variant="outline" onClick={() => markRead.mutate(unread.map((n) => n.id))}>
              <CheckCheck className="size-4" />
              تعليم الكل كمقروء
            </Button>
          ) : null
        }
      />

      {error ? <ErrorState error={error} onRetry={() => refetch()} /> : null}
      {isLoading ? <LoadingState /> : null}
      {data && data.length === 0 ? <EmptyState title="لا توجد إشعارات" /> : null}

      {data && data.length > 0 ? (
        <SectionCard>
          <ul className="divide-y divide-border">
            {data.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 px-2 py-3 transition-colors hover:bg-muted/40",
                  !n.is_read && "bg-primary/5",
                )}
                onClick={() => {
                  if (!n.is_read) markRead.mutate([n.id]);
                  if (n.link) navigate({ to: n.link as "/dashboard" });
                }}
              >
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.is_read ? "bg-muted-foreground/40" : "bg-primary",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{n.title}</p>
                  {n.body ? <p className="text-sm text-muted-foreground">{n.body}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(n.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </>
  );
}
