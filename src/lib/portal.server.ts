import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PortalScope = {
  customerId: string;
  requestId: string | null;
  orderId: string | null;
  lastSeen: string | null;
};

export async function resolveToken(token: string): Promise<PortalScope> {
  const { data, error } = await supabaseAdmin
    .from("portal_links")
    .select("id, customer_id, request_id, order_id, expires_at, is_active, last_seen_at")
    .eq("token", token)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.is_active) throw new Error("الرابط غير صالح أو تم إيقافه");
  if (data.expires_at && new Date(data.expires_at) < new Date())
    throw new Error("انتهت صلاحية الرابط، تواصل مع فريق المبيعات");
  const scope: PortalScope = {
    customerId: data.customer_id,
    requestId: data.request_id,
    orderId: data.order_id,
    lastSeen: data.last_seen_at,
  };
  await supabaseAdmin
    .from("portal_links")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", data.id);
  return scope;
}

/** Returns the portal scope for a signed-in customer account, or null when unlinked. */
export async function resolveUserOptional(userId: string): Promise<PortalScope | null> {
  const { data } = await supabaseAdmin
    .from("customer_users")
    .select("customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  return { customerId: data.customer_id, requestId: null, orderId: null, lastSeen: null };
}

export async function resolveUser(userId: string): Promise<PortalScope> {
  const scope = await resolveUserOptional(userId);
  if (!scope) throw new Error("هذا الحساب غير مرتبط بأي ملف عميل");
  return scope;
}

/** Links a signed-in customer account to a customer record by matching email. */
export async function claimByEmail(userId: string, email: string) {
  const existing = await supabaseAdmin
    .from("customer_users")
    .select("customer_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing.data) return existing.data.customer_id;
  const { data } = await supabaseAdmin
    .from("customers")
    .select("id")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  await supabaseAdmin.from("customer_users").insert({ user_id: userId, customer_id: data.id });
  return data.id;
}

export async function loadPortal(scope: PortalScope) {
  const { customerId, requestId, orderId } = scope;

  const customerQ = supabaseAdmin
    .from("customers")
    .select("id, code, full_name, company_name, phone, email")
    .eq("id", customerId)
    .maybeSingle();

  let requestsQ = supabaseAdmin
    .from("sales_requests")
    .select("id, code, title, description, status, quantity, unit, required_delivery_date, created_at, updated_at")
    .eq("customer_id", customerId)
    .neq("status", "draft")
    .order("created_at", { ascending: false });
  if (requestId) requestsQ = requestsQ.eq("id", requestId);

  let ordersQ = supabaseAdmin
    .from("orders")
    .select("id, code, title, description, status, quantity, total_price, expected_delivery, actual_delivery, created_at, updated_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (orderId) ordersQ = ordersQ.eq("id", orderId);

  const [customer, requests, orders, gateways] = await Promise.all([
    customerQ,
    requestsQ,
    ordersQ,
    supabaseAdmin
      .from("payment_gateways")
      .select("key, name, method, instructions, account_ref, requires_reference, requires_receipt")
      .eq("is_active", true)
      .order("sort_order"),
  ]);
  if (customer.error) throw new Error(customer.error.message);
  if (!customer.data) throw new Error("العميل غير موجود");

  const requestIds = (requests.data ?? []).map((r) => r.id);
  const orderIds = (orders.data ?? []).map((o) => o.id);

  const [quotations, changes, payments, intents, steps, logs, activities] = await Promise.all([
    requestIds.length
      ? supabaseAdmin
          .from("quotations")
          .select("id, code, request_id, version, is_current, selling_price, discount, tax, total, delivery_days, payment_terms, valid_until, status, created_at")
          .in("request_id", requestIds)
          .in("status", ["sent", "viewed", "negotiation", "accepted", "rejected", "expired", "superseded"])
          .order("version", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    requestIds.length
      ? supabaseAdmin
          .from("quotation_change_requests")
          .select("id, quotation_id, message, requested_price, requested_delivery_days, status, response, created_at")
          .in("request_id", requestIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    orderIds.length
      ? supabaseAdmin
          .from("payments")
          .select("id, order_id, code, amount, method, payment_date")
          .in("order_id", orderIds)
          .eq("is_void", false)
      : Promise.resolve({ data: [] as never[] }),
    orderIds.length
      ? supabaseAdmin
          .from("payment_intents")
          .select("id, order_id, code, amount, method, gateway_key, status, reference, created_at, review_notes")
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    orderIds.length
      ? supabaseAdmin
          .from("order_execution_steps")
          .select("id, order_id, seq, name, status, planned_end, actual_end, delay_days")
          .in("order_id", orderIds)
          .order("seq")
      : Promise.resolve({ data: [] as never[] }),
    orderIds.length
      ? supabaseAdmin
          .from("order_daily_logs")
          .select("id, order_id, log_date, progress_note, created_at")
          .in("order_id", orderIds)
          .eq("is_customer_visible", true)
          .order("log_date", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    requestIds.length || orderIds.length
      ? supabaseAdmin
          .from("activities")
          .select("id, entity_id, entity_code, entity_type, action, description, created_at")
          .in("entity_id", [...requestIds, ...orderIds])
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] as never[] }),
  ]);

  return {
    customer: customer.data,
    requests: requests.data ?? [],
    orders: orders.data ?? [],
    quotations: quotations.data ?? [],
    changes: changes.data ?? [],
    payments: payments.data ?? [],
    intents: intents.data ?? [],
    steps: steps.data ?? [],
    logs: logs.data ?? [],
    timeline: activities.data ?? [],
    gateways: gateways.data ?? [],
    lastSeen: scope.lastSeen,
  };
}

async function assertQuotationOwned(quotationId: string, customerId: string) {
  const { data } = await supabaseAdmin
    .from("quotations")
    .select("id, code, request_id, customer_id, total")
    .eq("id", quotationId)
    .maybeSingle();
  if (!data || data.customer_id !== customerId) throw new Error("عرض السعر غير متاح");
  return data;
}

export async function createChangeRequest(input: {
  customerId: string;
  quotationId: string;
  message: string;
  requestedPrice?: number | null;
  requestedDeliveryDays?: number | null;
}) {
  const q = await assertQuotationOwned(input.quotationId, input.customerId);
  const { error } = await supabaseAdmin.from("quotation_change_requests").insert({
    quotation_id: q.id,
    request_id: q.request_id,
    customer_id: input.customerId,
    message: input.message,
    requested_price: input.requestedPrice ?? null,
    requested_delivery_days: input.requestedDeliveryDays ?? null,
  });
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("quotations").update({ status: "negotiation" }).eq("id", q.id);
  await supabaseAdmin.from("sales_requests").update({ status: "negotiation" }).eq("id", q.request_id);
  await supabaseAdmin.from("activities").insert({
    entity_type: "quotation",
    entity_id: q.request_id,
    entity_code: q.code,
    action: "customer_change_request",
    description: `طلب العميل تعديلًا على عرض السعر ${q.code}`,
  });
  await supabaseAdmin.from("notifications").insert({
    title: "طلب تعديل من العميل",
    body: input.message.slice(0, 160),
    link: `/requests/${q.request_id}`,
    target_role: "sales",
  });
  return { ok: true };
}

export async function acceptQuotationByCustomer(input: { customerId: string; quotationId: string }) {
  const q = await assertQuotationOwned(input.quotationId, input.customerId);
  await supabaseAdmin.from("quotations").update({ status: "accepted" }).eq("id", q.id);
  await supabaseAdmin
    .from("sales_requests")
    .update({ status: "customer_approved" })
    .eq("id", q.request_id);
  await supabaseAdmin.from("activities").insert({
    entity_type: "quotation",
    entity_id: q.request_id,
    entity_code: q.code,
    action: "customer_accepted",
    description: `وافق العميل على عرض السعر ${q.code}`,
  });
  await supabaseAdmin.from("notifications").insert({
    title: "موافقة العميل على عرض سعر",
    body: q.code,
    link: `/requests/${q.request_id}`,
    target_role: "sales",
  });
  return { ok: true };
}

export async function submitPaymentIntent(input: {
  customerId: string;
  orderId: string;
  gatewayKey: string;
  amount: number;
  reference?: string | null;
  payerName?: string | null;
  note?: string | null;
  source?: string;
}) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("id, code, customer_id, title")
    .eq("id", input.orderId)
    .maybeSingle();
  if (!order || order.customer_id !== input.customerId) throw new Error("أمر التنفيذ غير متاح");
  if (!(input.amount > 0)) throw new Error("أدخل مبلغًا صحيحًا");

  const { data: gw } = await supabaseAdmin
    .from("payment_gateways")
    .select("key, name, method, requires_reference, auto_confirm, is_active")
    .eq("key", input.gatewayKey)
    .maybeSingle();
  if (!gw || !gw.is_active) throw new Error("طريقة الدفع غير متاحة");
  if (gw.requires_reference && !input.reference?.trim())
    throw new Error("أدخل رقم عملية التحويل");

  const { data: created, error } = await supabaseAdmin
    .from("payment_intents")
    .insert({
      order_id: order.id,
      customer_id: input.customerId,
      gateway_key: gw.key,
      method: gw.method,
      amount: input.amount,
      reference: input.reference?.trim() || null,
      payer_name: input.payerName?.trim() || null,
      note: input.note?.trim() || null,
      status: "submitted",
      source: input.source ?? "portal",
    })
    .select("id, code")
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("activities").insert({
    entity_type: "payment_intent",
    entity_id: order.id,
    entity_code: created.code,
    action: "payment_submitted",
    description: `سجّل العميل دفعة ${input.amount} عبر ${gw.name} بانتظار المراجعة`,
  });
  await supabaseAdmin.from("notifications").insert({
    title: "دفعة جديدة بانتظار المراجعة",
    body: `${order.code} — ${input.amount} ج.م عبر ${gw.name}`,
    link: `/orders/${order.id}`,
    target_role: "sales",
  });
  return { ok: true, code: created.code };
}
