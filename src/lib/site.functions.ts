import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ContactInput, PublicRequestInput } from "./site.server";

export const getSiteContent = createServerFn({ method: "GET" }).handler(async () => {
  const m = await import("./site.server");
  return m.loadSiteContent();
});

export const getNewsArticle = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const m = await import("./site.server");
    return m.loadNewsArticle(data.slug);
  });

export const createPublicRequest = createServerFn({ method: "POST" })
  .inputValidator((d: PublicRequestInput) => d)
  .handler(async ({ data }) => {
    const m = await import("./site.server");
    return m.submitPublicRequest(data);
  });

export const createContactMessage = createServerFn({ method: "POST" })
  .inputValidator((d: ContactInput) => d)
  .handler(async ({ data }) => {
    const m = await import("./site.server");
    return m.submitContact(data);
  });

export const convertContactMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: staff } = await context.supabase.rpc("is_staff");
    if (!staff) throw new Error("غير مصرح");
    const m = await import("./site.server");
    return m.convertContact(data.id, context.userId);
  });

export const siteContentQuery = queryOptions({
  queryKey: ["site-content"],
  queryFn: () => getSiteContent(),
  staleTime: 60_000,
});

export type SiteContent = Awaited<ReturnType<typeof getSiteContent>>;
