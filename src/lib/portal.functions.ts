import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ChangeInput = {
  quotationId: string;
  message: string;
  requestedPrice?: number | null;
  requestedDeliveryDays?: number | null;
};

type PayInput = {
  orderId: string;
  gatewayKey: string;
  amount: number;
  reference?: string | null;
  payerName?: string | null;
  note?: string | null;
};

/* ---------------- token-based (secure share link) ---------------- */

export const portalLoadByToken = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const m = await import("./portal.server");
    return m.loadPortal(await m.resolveToken(data.token));
  });

export const portalChangeByToken = createServerFn({ method: "POST" })
  .inputValidator((d: ChangeInput & { token: string }) => d)
  .handler(async ({ data }) => {
    const m = await import("./portal.server");
    const scope = await m.resolveToken(data.token);
    return m.createChangeRequest({ ...data, customerId: scope.customerId });
  });

export const portalAcceptByToken = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; quotationId: string }) => d)
  .handler(async ({ data }) => {
    const m = await import("./portal.server");
    const scope = await m.resolveToken(data.token);
    return m.acceptQuotationByCustomer({
      customerId: scope.customerId,
      quotationId: data.quotationId,
    });
  });

export const portalPayByToken = createServerFn({ method: "POST" })
  .inputValidator((d: PayInput & { token: string }) => d)
  .handler(async ({ data }) => {
    const m = await import("./portal.server");
    const scope = await m.resolveToken(data.token);
    return m.submitPaymentIntent({ ...data, customerId: scope.customerId, source: "portal_link" });
  });

/* ---------------- account-based (customer login) ---------------- */

export const portalClaimAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./portal.server");
    const email = (context.claims as { email?: string } | null)?.email ?? "";
    const customerId = await m.claimByEmail(context.userId, email);
    return { linked: !!customerId };
  });

export const portalLoadMine = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const m = await import("./portal.server");
    const scope = await m.resolveUserOptional(context.userId);
    if (!scope) return null;
    return m.loadPortal(scope);
  });

export const portalChangeMine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: ChangeInput) => d)
  .handler(async ({ data, context }) => {
    const m = await import("./portal.server");
    const scope = await m.resolveUser(context.userId);
    return m.createChangeRequest({ ...data, customerId: scope.customerId });
  });

export const portalAcceptMine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quotationId: string }) => d)
  .handler(async ({ data, context }) => {
    const m = await import("./portal.server");
    const scope = await m.resolveUser(context.userId);
    return m.acceptQuotationByCustomer({
      customerId: scope.customerId,
      quotationId: data.quotationId,
    });
  });

export const portalPayMine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: PayInput) => d)
  .handler(async ({ data, context }) => {
    const m = await import("./portal.server");
    const scope = await m.resolveUser(context.userId);
    return m.submitPaymentIntent({
      ...data,
      customerId: scope.customerId,
      source: "portal_account",
    });
  });
