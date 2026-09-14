import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, InlineLoading, SectionCard } from "@/components/ui-kit";

export function CommentsPanel({
  entityType,
  entityId,
}: {
  entityType: string;
  entityId: string;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const key = ["comments", entityType, entityId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, body, created_at, author_id, profiles:author_id(full_name)")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!body.trim()) throw new Error("اكتب تعليقًا أولًا");
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase.from("comments").insert({
        entity_type: entityType,
        entity_id: entityId,
        body: body.trim(),
        author_id: auth.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody("");
      queryClient.invalidateQueries({ queryKey: key });
    },
    onError: (e: Error) => toast.error("تعذّر إضافة التعليق", { description: e.message }),
  });

  return (
    <SectionCard title="التعليقات الداخلية">
      <div className="mb-4 space-y-2">
        <Textarea
          rows={3}
          placeholder="اكتب ملاحظة للفريق..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending}>
          <Send className="size-4" />
          إضافة تعليق
        </Button>
      </div>

      {isLoading ? <InlineLoading /> : null}
      {data && data.length === 0 ? <EmptyState title="لا توجد تعليقات بعد" /> : null}

      <ul className="space-y-3">
        {(data ?? []).map((c) => (
          <li key={c.id} className="rounded-lg border border-border bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-primary">
                {(c.profiles as { full_name: string } | null)?.full_name ?? "مستخدم"}
              </p>
              <span className="text-xs text-muted-foreground">{formatDateTime(c.created_at)}</span>
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap">{c.body}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
