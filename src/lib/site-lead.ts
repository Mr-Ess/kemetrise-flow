/**
 * Single funnel for every website CTA/form: everything lands in Client Desk
 * as a prospect + sales request (or a contact message for the contact page).
 */
import { createPublicRequest, createContactMessage } from "@/lib/site.functions";

export type LeadKind = "service" | "product" | "project" | "partner" | "agent" | "demo" | "other";

function utm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = p.get(k);
    if (v) out[k] = v;
  }
  return out;
}

function page() {
  return typeof window === "undefined" ? null : window.location.pathname;
}

export async function submitLead(input: {
  kind: LeadKind;
  refName?: string | null;
  refId?: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  details?: string[];
}) {
  const description = [input.message, ...(input.details ?? [])].filter(Boolean).join("\n") || null;
  const entityType =
    input.kind === "service" || input.kind === "product" || input.kind === "project"
      ? input.kind
      : null;

  return createPublicRequest({
    data: {
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone || "غير محدد",
      company: input.company ?? null,
      title: input.refName || defaultTitle(input.kind),
      description,
      requestType: input.kind === "demo" ? "other" : input.kind,
      source: "website",
      sourceDetail: `${input.kind}_form`,
      originPage: page(),
      originEntityType: entityType,
      originEntityId: entityType ? (input.refId ?? null) : null,
      websiteServiceId: input.kind === "service" ? (input.refId ?? null) : null,
      websiteProductId: input.kind === "product" ? (input.refId ?? null) : null,
      websiteProjectId: input.kind === "project" ? (input.refId ?? null) : null,
      utm: utm(),
    },
  });
}

export async function submitContact(input: {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  subject?: string | null;
  message: string;
}) {
  return createContactMessage({
    data: {
      fullName: input.fullName,
      email: input.email ?? null,
      phone: input.phone ?? null,
      subject: input.subject ?? null,
      message: input.message,
      inquiryType: "general",
      sourcePage: page(),
      utm: utm(),
    },
  });
}

function defaultTitle(kind: LeadKind) {
  switch (kind) {
    case "service":
      return "طلب خدمة من الموقع";
    case "product":
      return "طلب منتج من الموقع";
    case "project":
      return "طلب تنفيذ مشروع";
    case "partner":
      return "طلب انضمام كشريك";
    case "agent":
      return "طلب انضمام كوكيل";
    case "demo":
      return "طلب عرض تجريبي";
    default:
      return "طلب من الموقع";
  }
}
