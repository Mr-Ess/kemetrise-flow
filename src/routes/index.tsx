import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";
import { BrandMark } from "@/components/BrandMark";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "KemetRise | نظام إدارة العملاء والمبيعات" },
      {
        name: "description",
        content:
          "الدخول إلى نظام KemetRise لإدارة العملاء وطلبات البيع والتسعير وعروض الأسعار والأوامر والتحصيل.",
      },
      { property: "og:title", content: "KemetRise | نظام إدارة العملاء والمبيعات" },
      {
        property: "og:description",
        content: "نظام تشغيل داخلي متكامل لدورة المبيعات من الطلب حتى التحصيل.",
      },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate({ to: session ? "/dashboard" : "/auth", replace: true });
  }, [session, loading, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <BrandMark size="lg" />
      <p className="text-sm text-muted-foreground">جاري تحميل النظام...</p>
    </div>
  );
}
