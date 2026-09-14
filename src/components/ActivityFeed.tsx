import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import { EmptyState, InlineLoading, SectionCard } from "@/components/ui-kit";

export function ActivityFeed({
  entityId,
  title = "سجل النشاط",
  limit = 50,
}: {
  entityId: string;
  title?: string;
  limit?: number;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["activity", entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("id, action, description, created_at, profiles:user_id(full_name)")
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <SectionCard title={title}>
      {isLoading ? <InlineLoading /> : null}
      {data && data.length === 0 ? <EmptyState title="لا يوجد نشاط مسجل" /> : null}
      <ol className="relative space-y-4 pr-4">
        {(data ?? []).map((a) => (
          <li key={a.id} className="relative">
            <span className="absolute top-1.5 -right-4 size-2 rounded-full bg-primary" />
            <p className="text-sm">{a.description ?? a.action}</p>
            <p className="text-xs text-muted-foreground">
              {(a.profiles as { full_name: string } | null)?.full_name ?? "النظام"} ·{" "}
              {formatDateTime(a.created_at)}
            </p>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
