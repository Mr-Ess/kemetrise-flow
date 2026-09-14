import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  portalAcceptMine,
  portalChangeMine,
  portalClaimAccount,
  portalLoadMine,
  portalPayMine,
} from "@/lib/portal.functions";
import { CustomerPortalView } from "@/components/CustomerPortalView";
import { BrandMark } from "@/components/BrandMark";
import { EmptyState, LoadingState } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/portal/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "بوابة العملاء | KemetRise" },
      {
        name: "description",
        content: "دخول العملاء لمتابعة عروض الأسعار وتنفيذ الأوامر والدفع الإلكتروني.",
      },
      { property: "og:title", content: "بوابة العملاء | KemetRise" },
      {
        property: "og:description",
        content: "تابع طلبك من العرض حتى التسليم وادفع إلكترونيًا.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PortalAccount,
});

function PortalAccount() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <LoadingState rows={4} />
      </div>
    );
  }
  if (!session) return <PortalAuth />;
  return <PortalDashboard />;
}

function PortalAuth() {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error("تعذّر تسجيل الدخول", { description: error.message });
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/portal`,
        data: { full_name: fullName, account_type: "customer" },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("تعذّر إنشاء الحساب", { description: error.message });
      return;
    }
    if (!data.session)
      toast.success("تم إنشاء الحساب", {
        description: "راجع بريدك لتأكيد الحساب ثم سجّل الدخول.",
      });
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <BrandMark size="lg" />
        </div>
        <div className="panel p-6">
          <h1 className="mb-1 text-lg font-bold">بوابة العملاء</h1>
          <p className="mb-4 text-xs text-muted-foreground">
            استخدم نفس البريد الإلكتروني المسجّل لدينا ليتم ربط حسابك بطلباتك تلقائيًا.
          </p>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">دخول</TabsTrigger>
              <TabsTrigger value="signup">حساب جديد</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pemail">البريد الإلكتروني</Label>
                  <Input
                    id="pemail"
                    type="email"
                    dir="ltr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ppass">كلمة المرور</Label>
                  <Input
                    id="ppass"
                    type="password"
                    dir="ltr"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  دخول
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pname">الاسم بالكامل</Label>
                  <Input
                    id="pname"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pemail2">البريد الإلكتروني</Label>
                  <Input
                    id="pemail2"
                    type="email"
                    dir="ltr"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ppass2">كلمة المرور</Label>
                  <Input
                    id="ppass2"
                    type="password"
                    dir="ltr"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                  إنشاء حساب
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </main>
  );
}

function PortalDashboard() {
  const queryClient = useQueryClient();
  const claim = useServerFn(portalClaimAccount);
  const load = useServerFn(portalLoadMine);
  const change = useServerFn(portalChangeMine);
  const accept = useServerFn(portalAcceptMine);
  const payFn = useServerFn(portalPayMine);

  const { data, isLoading, error } = useQuery({
    queryKey: ["portal-me"],
    queryFn: async () => {
      await claim({});
      return load({});
    },
    retry: false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["portal-me"] });

  const changeM = useMutation({
    mutationFn: (input: Parameters<typeof change>[0]["data"]) => change({ data: input }),
    onSuccess: () => {
      toast.success("تم إرسال طلب التعديل");
      refresh();
    },
    onError: (e: Error) => toast.error("تعذّر الإرسال", { description: e.message }),
  });
  const acceptM = useMutation({
    mutationFn: (quotationId: string) => accept({ data: { quotationId } }),
    onSuccess: () => {
      toast.success("تم تسجيل موافقتك");
      refresh();
    },
    onError: (e: Error) => toast.error("تعذّر التنفيذ", { description: e.message }),
  });
  const payM = useMutation({
    mutationFn: (input: Parameters<typeof payFn>[0]["data"]) => payFn({ data: input }),
    onSuccess: () => {
      toast.success("تم استلام بيانات الدفع", { description: "سيتم اعتمادها بعد المراجعة." });
      refresh();
    },
    onError: (e: Error) => toast.error("تعذّر تسجيل الدفع", { description: e.message }),
  });

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
  };

  const logoutBtn = (
    <Button size="sm" variant="outline" onClick={signOut}>
      <LogOut className="size-4" />
      خروج
    </Button>
  );

  const customer = (data as { customer?: { id: string; full_name?: string | null; phone?: string | null; email?: string | null } } | undefined)?.customer;

  const headerActions = (
    <div className="flex items-center gap-2">
      {customer ? (
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4" />
              طلب جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>طلب جديد</DialogTitle>
            </DialogHeader>
            <SalesRequestForm
              mode="portal"
              customerId={customer.id}
              customer={customer}
              originPage="/portal"
              sourceDetail="customer_portal"
              onDone={refresh}
            />
          </DialogContent>
        </Dialog>
      ) : null}
      {logoutBtn}
    </div>
  );

  if (isLoading)
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <LoadingState rows={6} />
      </div>
    );

  if (error || !data)
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <EmptyState
          title="هذا الحساب غير مرتبط بملف عميل"
          description="تواصل مع فريق المبيعات لربط بريدك الإلكتروني بملفك، أو استخدم رابط المتابعة المرسل لك."
          action={logoutBtn}
        />
      </main>
    );

  return (
    <CustomerPortalView
      data={data}
      busy={changeM.isPending || acceptM.isPending || payM.isPending}
      headerExtra={logoutBtn}
      onChangeRequest={(input) => changeM.mutateAsync(input)}
      onAccept={(quotationId) => acceptM.mutateAsync(quotationId)}
      onPay={(input) => payM.mutateAsync(input)}
    />
  );
}
