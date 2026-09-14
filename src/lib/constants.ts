export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

export const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام",
  management: "الإدارة",
  sales: "المبيعات",
  costing: "التسعير",
  staff: "موظف",
};

export const CUSTOMER_STATUS: Record<string, { label: string; tone: Tone }> = {
  prospect: { label: "عميل محتمل", tone: "info" },
  active: { label: "نشط", tone: "success" },
  inactive: { label: "غير نشط", tone: "neutral" },
  returning: { label: "عميل متكرر", tone: "primary" },
  vip: { label: "VIP", tone: "warning" },
  lost: { label: "مفقود", tone: "danger" },
};

export const LEAD_SOURCES: Record<string, string> = {
  facebook: "فيسبوك",
  instagram: "إنستجرام",
  tiktok: "تيك توك",
  whatsapp: "واتساب",
  website: "الموقع الإلكتروني",
  google: "جوجل",
  referral: "ترشيح",
  existing_customer: "عميل حالي",
  walk_in: "زيارة مباشرة",
  other: "أخرى",
};

export const REQUEST_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "مسودة", tone: "neutral" },
  submitted: { label: "تم الإرسال", tone: "info" },
  under_review: { label: "قيد المراجعة", tone: "info" },
  waiting_information: { label: "بانتظار معلومات", tone: "warning" },
  costing_in_progress: { label: "جاري التسعير", tone: "warning" },
  costing_completed: { label: "اكتمل التسعير", tone: "info" },
  pending_approval: { label: "بانتظار الاعتماد", tone: "warning" },
  quotation_ready: { label: "عرض السعر جاهز", tone: "primary" },
  quotation_sent: { label: "تم إرسال العرض", tone: "primary" },
  negotiation: { label: "تفاوض", tone: "warning" },
  customer_approved: { label: "موافقة العميل", tone: "success" },
  customer_rejected: { label: "رفض العميل", tone: "danger" },
  expired: { label: "منتهي", tone: "neutral" },
  converted_to_order: { label: "تحوّل إلى أمر", tone: "success" },
  cancelled: { label: "ملغي", tone: "neutral" },
};

export const PIPELINE_STAGES: { key: string; label: string; statuses: string[] }[] = [
  { key: "new", label: "طلب جديد", statuses: ["draft", "submitted"] },
  { key: "review", label: "قيد المراجعة", statuses: ["under_review", "waiting_information"] },
  { key: "costing", label: "التسعير", statuses: ["costing_in_progress", "costing_completed"] },
  { key: "approval", label: "بانتظار الاعتماد", statuses: ["pending_approval"] },
  { key: "quotation", label: "عرض السعر", statuses: ["quotation_ready", "quotation_sent"] },
  { key: "negotiation", label: "تفاوض", statuses: ["negotiation"] },
  { key: "won", label: "مكسوب", statuses: ["customer_approved", "converted_to_order"] },
  { key: "lost", label: "مفقود", statuses: ["customer_rejected", "expired", "cancelled"] },
];

export const PRIORITY: Record<string, { label: string; tone: Tone }> = {
  low: { label: "منخفضة", tone: "neutral" },
  normal: { label: "عادية", tone: "info" },
  high: { label: "مرتفعة", tone: "warning" },
  urgent: { label: "عاجلة", tone: "danger" },
};

export const QUOTATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "مسودة", tone: "neutral" },
  pending_approval: { label: "بانتظار الاعتماد", tone: "warning" },
  approved: { label: "معتمد", tone: "success" },
  sent: { label: "مُرسل", tone: "primary" },
  viewed: { label: "تمت المشاهدة", tone: "info" },
  negotiation: { label: "تفاوض", tone: "warning" },
  accepted: { label: "مقبول", tone: "success" },
  rejected: { label: "مرفوض", tone: "danger" },
  expired: { label: "منتهي", tone: "neutral" },
  superseded: { label: "مستبدل", tone: "neutral" },
};

export const ORDER_STATUS: Record<string, { label: string; tone: Tone }> = {
  new: { label: "جديد", tone: "info" },
  confirmed: { label: "مؤكد", tone: "info" },
  in_progress: { label: "قيد التنفيذ", tone: "warning" },
  waiting_customer: { label: "بانتظار العميل", tone: "warning" },
  waiting_documents: { label: "بانتظار مستندات", tone: "warning" },
  ready: { label: "جاهز", tone: "primary" },
  delivered: { label: "تم التسليم", tone: "success" },
  completed: { label: "مكتمل", tone: "success" },
  on_hold: { label: "معلّق", tone: "neutral" },
  cancelled: { label: "ملغي", tone: "danger" },
};

export const PAYMENT_METHODS: Record<string, string> = {
  cash: "نقدي",
  bank_transfer: "تحويل بنكي",
  instapay: "إنستاباي",
  vodafone_cash: "فودافون كاش",
  card: "بطاقة",
  other: "أخرى",
};

export const PAYMENT_INTENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "بانتظار الدفع", tone: "neutral" },
  submitted: { label: "بانتظار المراجعة", tone: "warning" },
  under_review: { label: "قيد المراجعة", tone: "info" },
  confirmed: { label: "مؤكدة", tone: "success" },
  rejected: { label: "مرفوضة", tone: "danger" },
  cancelled: { label: "ملغاة", tone: "neutral" },
};

export const EXEC_STEP_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "لم تبدأ", tone: "neutral" },
  in_progress: { label: "جارية", tone: "info" },
  blocked: { label: "متوقفة", tone: "danger" },
  done: { label: "منتهية", tone: "success" },
  skipped: { label: "متخطاة", tone: "neutral" },
};

export const CHANGE_REQUEST_STATUS: Record<string, { label: string; tone: Tone }> = {
  open: { label: "جديد", tone: "warning" },
  in_review: { label: "قيد الدراسة", tone: "info" },
  accepted: { label: "تم القبول", tone: "success" },
  rejected: { label: "مرفوض", tone: "danger" },
};

export const DOCUMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  required: { label: "مطلوب", tone: "warning" },
  requested: { label: "تم الطلب", tone: "info" },
  received: { label: "تم الاستلام", tone: "primary" },
  verified: { label: "تم التحقق", tone: "success" },
  rejected: { label: "مرفوض", tone: "danger" },
  missing: { label: "ناقص", tone: "danger" },
};

export const TASK_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: "معلّقة", tone: "warning" },
  in_progress: { label: "جارية", tone: "info" },
  completed: { label: "مكتملة", tone: "success" },
  cancelled: { label: "ملغاة", tone: "neutral" },
};

export const TASK_TYPES: Record<string, string> = {
  call: "اتصال بالعميل",
  whatsapp: "واتساب للعميل",
  send_quotation: "إرسال عرض سعر",
  follow_up: "متابعة",
  request_information: "طلب معلومات",
  request_document: "طلب مستند",
  internal_review: "مراجعة داخلية",
  other: "أخرى",
};

export const COST_CATEGORIES: Record<string, string> = {
  raw_materials: "خامات",
  labor: "عمالة",
  production: "إنتاج",
  transportation: "نقل",
  external_services: "خدمات خارجية",
  packaging: "تغليف",
  other: "أخرى",
};

export const LOST_REASONS: Record<string, string> = {
  price: "السعر",
  competitor: "منافس",
  delivery_time: "مدة التسليم",
  specification: "المواصفات",
  customer_budget: "ميزانية العميل",
  changed_mind: "العميل غيّر رأيه",
  no_response: "لا يوجد رد",
  other: "أخرى",
};

export const GOVERNORATES = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "القليوبية",
  "الشرقية",
  "الدقهلية",
  "الغربية",
  "المنوفية",
  "البحيرة",
  "كفر الشيخ",
  "دمياط",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "مطروح",
  "شمال سيناء",
  "جنوب سيناء",
  "الوادي الجديد",
];
