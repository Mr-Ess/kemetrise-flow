import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PublicRequestInput = {
  fullName: string;
  email?: string | null;
  phone: string;
  whatsapp?: string | null;
  company?: string | null;
  preferredContact?: string | null;
  title: string;
  description?: string | null;
  quantity?: number | null;
  unit?: string | null;
  requestType?: string | null;
  budgetRange?: string | null;
  requiredDeliveryDate?: string | null;
  deliveryLocation?: string | null;
  needsInstallation?: boolean;
  needsCustomization?: boolean;
  source?: string | null;
  sourceDetail?: string | null;
  originPage?: string | null;
  originEntityType?: string | null;
  originEntityId?: string | null;
  websiteServiceId?: string | null;
  websiteProductId?: string | null;
  websiteProjectId?: string | null;
  agentId?: string | null;
  utm?: Record<string, string>;
  customerId?: string | null;
};

export type ContactInput = {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  subject?: string | null;
  message: string;
  inquiryType?: string | null;
  sourcePage?: string | null;
  utm?: Record<string, string>;
};

function clean(v: string | null | undefined, max = 500) {
  const s = (v ?? "").toString().trim();
  return s ? s.slice(0, max) : null;
}

/** Loads all published website content in one round trip. */
export async function loadSiteContent() {
  const pub = (t: string, order = "sort_order") =>
    supabaseAdmin.from(t as "website_services").select("*").eq("is_published", true).order(order);

  const [
    settings,
    hero,
    stats,
    features,
    how,
    services,
    products,
    projects,
    portfolio,
    partners,
    agents,
    team,
    news,
    testimonials,
    faqs,
    plans,
    about,
  ] = await Promise.all([
    supabaseAdmin.from("website_settings").select("*").limit(1).maybeSingle(),
    supabaseAdmin.from("website_hero").select("*").eq("is_active", true).limit(1).maybeSingle(),
    pub("website_stats"),
    pub("website_features"),
    pub("website_how_it_works"),
    pub("website_services"),
    pub("website_products"),
    pub("website_projects"),
    pub("website_portfolio"),
    pub("website_partners"),
    pub("website_agents"),
    pub("website_leadership_team"),
    supabaseAdmin
      .from("website_news")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false }),
    pub("website_testimonials"),
    pub("website_faqs"),
    pub("website_plans"),
    pub("website_about"),
  ]);

  return {
    settings: settings.data ?? null,
    hero: hero.data ?? null,
    stats: stats.data ?? [],
    features: features.data ?? [],
    how: how.data ?? [],
    services: services.data ?? [],
    products: products.data ?? [],
    projects: projects.data ?? [],
    portfolio: portfolio.data ?? [],
    partners: partners.data ?? [],
    agents: agents.data ?? [],
    team: team.data ?? [],
    news: news.data ?? [],
    testimonials: testimonials.data ?? [],
    faqs: faqs.data ?? [],
    plans: plans.data ?? [],
    about: about.data ?? [],
  };
}

export async function loadNewsArticle(slug: string) {
  const { data } = await supabaseAdmin
    .from("website_news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!data) return null;
  await supabaseAdmin
    .from("website_news")
    .update({ views: (data.views ?? 0) + 1 })
    .eq("id", data.id);
  return data;
}

/** Finds an existing customer by phone/email, otherwise creates a prospect. */
async function upsertProspect(input: PublicRequestInput) {
  const phone = clean(input.phone, 40)!;
  const email = clean(input.email, 200);

  let found = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();

  if (!found.data && email) {
    found = await supabaseAdmin
      .from("customers")
      .select("id")
      .ilike("email", email)
      .limit(1)
      .maybeSingle();
  }
  if (found.data) return found.data.id;

  const { data, error } = await supabaseAdmin
    .from("customers")
    .insert({
      full_name: clean(input.fullName, 160) ?? "عميل جديد",
      company_name: clean(input.company, 160),
      phone,
      whatsapp: clean(input.whatsapp, 40),
      email,
      source: "website",
      status: "prospect",
      lifecycle_stage: "prospect",
      source_detail: clean(input.sourceDetail, 160),
      preferred_contact: clean(input.preferredContact, 40),
      utm: input.utm ?? {},
      agent_id: input.agentId ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function submitPublicRequest(input: PublicRequestInput) {
  if (!clean(input.fullName) || !clean(input.phone) || !clean(input.title))
    throw new Error("من فضلك أكمل الاسم ورقم الهاتف وعنوان الطلب");

  const customerId = input.customerId ?? (await upsertProspect(input));

  const { data, error } = await supabaseAdmin
    .from("sales_requests")
    .insert({
      customer_id: customerId,
      title: clean(input.title, 200)!,
      description: clean(input.description, 4000),
      quantity: input.quantity && input.quantity > 0 ? input.quantity : 1,
      unit: clean(input.unit, 40) ?? "وحدة",
      status: "submitted",
      submitted_at: new Date().toISOString(),
      request_type: clean(input.requestType, 40) ?? "service",
      source: clean(input.source, 40) ?? "website",
      source_detail: clean(input.sourceDetail, 160),
      origin_page: clean(input.originPage, 200),
      origin_entity_type: clean(input.originEntityType, 40),
      origin_entity_id: input.originEntityId ?? null,
      website_service_id: input.websiteServiceId ?? null,
      website_product_id: input.websiteProductId ?? null,
      website_project_id: input.websiteProjectId ?? null,
      agent_id: input.agentId ?? null,
      utm: input.utm ?? {},
      budget_range: clean(input.budgetRange, 80),
      required_delivery_date: input.requiredDeliveryDate || null,
      delivery_location: clean(input.deliveryLocation, 200),
      needs_installation: !!input.needsInstallation,
      needs_customization: !!input.needsCustomization,
    })
    .select("id, code")
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("activities").insert({
    entity_type: "sales_request",
    entity_id: data.id,
    entity_code: data.code,
    action: "created",
    description: `طلب جديد من ${input.source ?? "website"}`,
  });

  await supabaseAdmin.from("notifications").insert([
    {
      target_role: "sales",
      title: "طلب بيع جديد",
      body: `${data.code} — ${input.title}`,
      link: `/requests/${data.id}`,
    },
    {
      target_role: "costing",
      title: "طلب بانتظار التسعير",
      body: `${data.code} — ${input.title}`,
      link: `/requests/${data.id}`,
    },
  ]);

  return { id: data.id, code: data.code, customerId };
}

export async function submitContact(input: ContactInput) {
  if (!clean(input.fullName) || !clean(input.message))
    throw new Error("من فضلك أدخل الاسم والرسالة");
  const { data, error } = await supabaseAdmin
    .from("website_contact_submissions")
    .insert({
      full_name: clean(input.fullName, 160)!,
      email: clean(input.email, 200),
      phone: clean(input.phone, 40),
      company: clean(input.company, 160),
      subject: clean(input.subject, 200),
      message: clean(input.message, 4000)!,
      inquiry_type: clean(input.inquiryType, 40) ?? "general",
      source_page: clean(input.sourcePage, 200),
      utm: input.utm ?? {},
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("notifications").insert({
    target_role: "sales",
    title: "رسالة جديدة من الموقع",
    body: `${input.fullName} — ${input.subject ?? "بدون موضوع"}`,
    link: `/website/messages`,
  });
  return { id: data.id };
}

/** Converts a contact message into a prospect + sales request. */
export async function convertContact(id: string, userId: string) {
  const { data: msg, error } = await supabaseAdmin
    .from("website_contact_submissions")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !msg) throw new Error("الرسالة غير موجودة");
  if (msg.request_id) return { requestId: msg.request_id, customerId: msg.customer_id };

  const res = await submitPublicRequest({
    fullName: msg.full_name,
    email: msg.email,
    phone: msg.phone ?? "غير محدد",
    company: msg.company,
    title: msg.subject || `استفسار من ${msg.full_name}`,
    description: msg.message,
    source: "website",
    sourceDetail: "contact_form",
    originPage: msg.source_page,
    requestType: "other",
    utm: (msg.utm as Record<string, string>) ?? {},
    customerId: msg.customer_id,
  });

  await supabaseAdmin
    .from("website_contact_submissions")
    .update({
      status: "converted",
      customer_id: res.customerId,
      request_id: res.id,
      assigned_to: msg.assigned_to ?? userId,
    })
    .eq("id", id);

  return { requestId: res.id, customerId: res.customerId };
}
