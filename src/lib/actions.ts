import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/** Append-only activity log entry. Never blocks the main flow. */
export async function logActivity(input: {
  entityType: string;
  entityId?: string | null;
  entityCode?: string | null;
  action: string;
  description?: string | null;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("activities").insert({
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    entity_code: input.entityCode ?? null,
    action: input.action,
    description: input.description ?? null,
    user_id: auth.user?.id ?? null,
  });
  if (error) console.error("activity log failed", error);
}

/** Create a notification for a specific user or a whole role. */
export async function notify(input: {
  title: string;
  body?: string | null;
  link?: string | null;
  userId?: string | null;
  targetRole?: AppRole | null;
}) {
  const { error } = await supabase.from("notifications").insert({
    title: input.title,
    body: input.body ?? null,
    link: input.link ?? null,
    user_id: input.userId ?? null,
    target_role: input.targetRole ?? null,
  });
  if (error) console.error("notification failed", error);
}
