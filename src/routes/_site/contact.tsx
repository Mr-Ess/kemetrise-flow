import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CheckCircle2, Mail, MapPin, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteCard, SiteHero, SiteSection } from "@/components/site/SiteChrome";
import { Button } from "@/components/ui/button";
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
import { createContactMessage, siteContentQuery } from "@/lib/site.functions";

export const Route = createFileRoute("/_site/contact")({
  head: () => ({
    meta: [
      { title: "تواصل معنا | KemetRise" },
      {
        name: "description",
        content: "راسل فريق KemetRise: استفسارات، عروض أسعار، شراكات ووكالات. نرد خلال 24 ساعة عمل.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "تواصل معنا | KemetRise" },
      { property: "og:description", content: "رسالتك تصل مباشرة إلى فريق المبيعات." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { data } = useSuspenseQuery(siteContentQuery);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
    inquiryType: "general",
  });
  const [sent, setSent] = useState(false);

  const send = useMutation({
    mutationFn: async () =>
      createContactMessage({
        data: {
          ...form,
          sourcePage: typeof window !== "undefined" ? window.location.pathname : null,
        },
      }),
    onSuccess: () => {
      setSent(true);
      toast.success("تم إرسال رسالتك");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "تعذّر الإرسال"),
  });

  return (
    <>
      <SiteHero title="تواصل معنا" subtitle="رسالتك تصل مباشرة إلى فريق المبيعات." />
      <SiteSection>
        <div className="grid gap-6 lg:grid-cols-3">
          <SiteCard className="lg:col-span-2">
            {sent ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto size-10 text-primary" />
                <h2 className="mt-3 text-lg font-bold">وصلتنا رسالتك</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  سنعود إليك خلال 24 ساعة عمل.
                </p>
              </div>
            ) : (
              <form
                className="grid gap-4 sm:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send.mutate();
                }}
              >
                <div>
                  <Label htmlFor="c-name">الاسم *</Label>
                  <Input
                    id="c-name"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="c-phone">رقم الهاتف</Label>
                  <Input
                    id="c-phone"
                    className="num"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="c-email">البريد الإلكتروني</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="c-company">الشركة</Label>
                  <Input
                    id="c-company"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                  />
                </div>
                <div>
                  <Label>نوع الاستفسار</Label>
                  <Select
                    value={form.inquiryType}
                    onValueChange={(v) => setForm({ ...form, inquiryType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">استفسار عام</SelectItem>
                      <SelectItem value="quote">طلب عرض سعر</SelectItem>
                      <SelectItem value="partnership">شراكة</SelectItem>
                      <SelectItem value="agency">وكالة</SelectItem>
                      <SelectItem value="support">دعم</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="c-subject">الموضوع</Label>
                  <Input
                    id="c-subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="c-msg">الرسالة *</Label>
                  <Textarea
                    id="c-msg"
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={send.isPending}>
                    {send.isPending ? "جارٍ الإرسال..." : "إرسال الرسالة"}
                  </Button>
                </div>
              </form>
            )}
          </SiteCard>

          <SiteCard>
            <h2 className="font-semibold">بيانات التواصل</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {data.settings?.phone ? (
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-primary" />
                  <span className="num">{data.settings.phone}</span>
                </li>
              ) : null}
              {data.settings?.email ? (
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  {data.settings.email}
                </li>
              ) : null}
              {data.settings?.address ? (
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  {data.settings.address}
                </li>
              ) : null}
            </ul>
          </SiteCard>
        </div>
      </SiteSection>
    </>
  );
}
