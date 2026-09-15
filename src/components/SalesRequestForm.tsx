import { Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPublicRequest } from "@/lib/site.functions";

export type RequestFormContext = {
  /** "public" = visitor from the website, "portal" = signed-in / linked customer */
  mode: "public" | "portal";
  customerId?: string | null;
  customer?: { full_name?: string | null; phone?: string | null; email?: string | null } | null;
  originPage?: string;
  sourceDetail?: string | null;
  presetTitle?: string;
  websiteServiceId?: string | null;
  websiteProductId?: string | null;
  websiteProjectId?: string | null;
  onDone?: () => void;
};

const TYPES = [
  { value: "service", label: "خدمة" },
  { value: "product", label: "منتج" },
  { value: "project", label: "مشروع" },
  { value: "plan", label: "باقة" },
  { value: "other", label: "أخرى" },
];

const BUDGETS = ["أقل من 10,000", "10,000 – 50,000", "50,000 – 200,000", "أكثر من 200,000", "غير محدد"];

const CONTACT_METHODS = [
  { value: "whatsapp", label: "واتساب" },
  { value: "phone", label: "مكالمة" },
  { value: "email", label: "بريد إلكتروني" },
];

function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
    const v = p.get(k);
    if (v) out[k] = v;
  }
  return out;
}

export function SalesRequestForm(ctx: RequestFormContext) {
  const [form, setForm] = useState({
    fullName: ctx.customer?.full_name ?? "",
    phone: ctx.customer?.phone ?? "",
    email: ctx.customer?.email ?? "",
    company: "",
    preferredContact: "whatsapp",
    title: ctx.presetTitle ?? "",
    requestType: ctx.websiteProductId ? "product" : ctx.websiteProjectId ? "project" : "service",
    description: "",
    quantity: "1",
    unit: "وحدة",
    budgetRange: "غير محدد",
    requiredDeliveryDate: "",
    deliveryLocation: "",
    needsInstallation: false,
    needsCustomization: false,
  });
  const [done, setDone] = useState<{ code: string } | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const submit = useMutation({
    mutationFn: async () =>
      createPublicRequest({
        data: {
          fullName: form.fullName,
          phone: form.phone,
          email: form.email || null,
          company: form.company || null,
          preferredContact: form.preferredContact,
          title: form.title,
          description: form.description || null,
          quantity: Number(form.quantity) || 1,
          unit: form.unit,
          requestType: form.requestType,
          budgetRange: form.budgetRange,
          requiredDeliveryDate: form.requiredDeliveryDate || null,
          deliveryLocation: form.deliveryLocation || null,
          needsInstallation: form.needsInstallation,
          needsCustomization: form.needsCustomization,
          source: ctx.mode === "portal" ? "portal" : "website",
          sourceDetail: ctx.sourceDetail ?? null,
          originPage: ctx.originPage ?? null,
          websiteServiceId: ctx.websiteServiceId ?? null,
          websiteProductId: ctx.websiteProductId ?? null,
          websiteProjectId: ctx.websiteProjectId ?? null,
          customerId: ctx.customerId ?? null,
          utm: readUtm(),
        },
      }),
    onSuccess: (res) => {
      setDone({ code: res.code });
      toast.success(`تم استلام طلبك برقم ${res.code}`);
      ctx.onDone?.();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر إرسال الطلب"),
  });

  if (done) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
        <CheckCircle2 className="mx-auto size-10 text-primary" />
        <h3 className="mt-3 text-lg font-bold">تم استلام طلبك بنجاح</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          رقم الطلب: <span className="num font-semibold text-foreground">{done.code}</span> — سيتواصل
          معك فريق المبيعات خلال 24 ساعة عمل.
        </p>
        {ctx.mode === "public" ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild size="sm">
              <Link to="/auth">أنشئ حسابًا لمتابعة طلبك</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/portal">بوابة العميل</Link>
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  const typeOptions = useCategoryOptions("request_type");
  const budgetOptions = useCategoryOptions("budget_range");
  const contactOptions = useCategoryOptions("contact_method");

  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
    >
      <div className="sm:col-span-2">
        <Label htmlFor="title">عنوان الطلب *</Label>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="مثال: تصميم هوية بصرية لشركة"
          required
        />
      </div>

      <div>
        <Label>نوع الطلب</Label>
        <Select value={form.requestType} onValueChange={(v) => set("requestType", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(typeOptions.length
              ? typeOptions.map((o) => ({ value: o.value, label: o.label_ar }))
              : TYPES
            ).map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>الميزانية التقريبية</Label>
        <Select value={form.budgetRange} onValueChange={(v) => set("budgetRange", v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(budgetOptions.length ? budgetOptions.map((o) => o.label_ar) : BUDGETS).map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="desc">تفاصيل المتطلبات</Label>
        <Textarea
          id="desc"
          rows={4}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="اشرح المواصفات والكميات وأي ملاحظات مهمة"
        />
      </div>

      <div>
        <Label htmlFor="qty">الكمية</Label>
        <Input
          id="qty"
          type="number"
          min={1}
          className="num"
          value={form.quantity}
          onChange={(e) => set("quantity", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="unit">الوحدة</Label>
        <Input id="unit" value={form.unit} onChange={(e) => set("unit", e.target.value)} />
      </div>

      <div>
        <Label htmlFor="date">تاريخ التسليم المطلوب</Label>
        <Input
          id="date"
          type="date"
          value={form.requiredDeliveryDate}
          onChange={(e) => set("requiredDeliveryDate", e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="loc">مكان التسليم</Label>
        <Input
          id="loc"
          value={form.deliveryLocation}
          onChange={(e) => set("deliveryLocation", e.target.value)}
          placeholder="المحافظة / العنوان"
        />
      </div>

      <div className="flex items-center gap-6 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.needsInstallation}
            onCheckedChange={(v) => set("needsInstallation", v === true)}
          />
          أحتاج تركيب
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={form.needsCustomization}
            onCheckedChange={(v) => set("needsCustomization", v === true)}
          />
          أحتاج تخصيص
        </label>
      </div>

      {ctx.mode === "public" ? (
        <>
          <div className="sm:col-span-2 border-t border-border pt-4">
            <p className="text-sm font-semibold">بيانات التواصل</p>
          </div>
          <div>
            <Label htmlFor="name">الاسم *</Label>
            <Input
              id="name"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">رقم الهاتف *</Label>
            <Input
              id="phone"
              className="num"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="company">الشركة</Label>
            <Input
              id="company"
              value={form.company}
              onChange={(e) => set("company", e.target.value)}
            />
          </div>
          <div>
            <Label>طريقة التواصل المفضلة</Label>
            <Select
              value={form.preferredContact}
              onValueChange={(v) => set("preferredContact", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(contactOptions.length
                  ? contactOptions.map((o) => ({ value: o.value, label: o.label_ar }))
                  : CONTACT_METHODS
                ).map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={submit.isPending} className="w-full sm:w-auto">
          {submit.isPending ? "جارٍ الإرسال..." : "إرسال الطلب"}
        </Button>
      </div>
    </form>
  );
}
