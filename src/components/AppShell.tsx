import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Building2,
  Calculator,
  ClipboardList,
  FileText,
  Gauge,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Package,
  PieChart,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Users,
  Workflow,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";

type NavItem = { to: string; label: string; icon: typeof Users; roles?: AppRole[] };
type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "عام",
    items: [{ to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard }],
  },
  {
    title: "المبيعات",
    items: [
      { to: "/pipeline", label: "خط سير المبيعات", icon: Workflow },
      { to: "/requests", label: "طلبات البيع", icon: ClipboardList },
      { to: "/quotations", label: "عروض الأسعار", icon: FileText },
      { to: "/tasks", label: "المتابعات", icon: ListChecks },
    ],
  },
  {
    title: "العمليات",
    items: [
      { to: "/customers", label: "العملاء", icon: Users },
      {
        to: "/costing",
        label: "التسعير",
        icon: Calculator,
        roles: ["admin", "management", "costing"],
      },
      {
        to: "/approvals",
        label: "الاعتمادات",
        icon: ShieldCheck,
        roles: ["admin", "management"],
      },
      { to: "/orders", label: "الأوامر", icon: ShoppingCart },
      { to: "/payments", label: "المدفوعات", icon: Receipt },
      { to: "/documents", label: "المستندات", icon: FileText },
      { to: "/catalog", label: "المنتجات والخدمات", icon: Package },
    ],
  },
  {
    title: "التحليلات",
    items: [
      { to: "/reports", label: "التقارير", icon: PieChart },
      {
        to: "/control-tower",
        label: "برج التحكم الإداري",
        icon: Gauge,
        roles: ["admin", "management"],
      },
    ],
  },
  {
    title: "النظام",
    items: [{ to: "/settings", label: "الإعدادات", icon: Settings, roles: ["admin", "management"] }],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { roles } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="space-y-5 px-3 pb-6">
      {NAV.map((group) => {
        const items = group.items.filter(
          (item) => !item.roles || item.roles.some((r) => roles.includes(r)),
        );
        if (items.length === 0) return null;
        return (
          <div key={group.title}>
            <p className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-muted-foreground">
              {group.title}
            </p>
            <ul className="space-y-1">
              {items.map((item) => {
                const active = pathname === item.to || pathname.startsWith(item.to + "/");
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to as "/dashboard"}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-semibold text-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { fullName, roles, email } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [term, setTerm] = useState("");

  const { data: unread = 0 } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);
      return count ?? 0;
    },
    refetchInterval: 60000,
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    navigate({ to: "/search", search: { q: term.trim() } });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 right-0 hidden w-64 flex-col border-l border-sidebar-border bg-sidebar lg:flex">
        <div className="px-5 py-5">
          <Link to="/dashboard">
            <BrandMark />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-2">
            <p className="truncate text-sm font-medium">{fullName || email}</p>
            <p className="truncate text-xs text-muted-foreground">
              {roles.map((r) => ROLE_LABELS[r]).join("، ") || "بدون صلاحية"}
            </p>
          </div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="size-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <div className="lg:mr-64">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/85 px-3 py-3 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="القائمة">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 overflow-y-auto bg-sidebar p-0">
              <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
              <div className="px-5 py-5">
                <BrandMark />
              </div>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
              <div className="border-t border-sidebar-border p-3">
                <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
                  <LogOut className="size-4" />
                  تسجيل الخروج
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <form onSubmit={submitSearch} className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="بحث: اسم عميل، هاتف، REQ / QUO / ORD / PAY"
              className="pr-9"
            />
          </form>

          <Button asChild variant="ghost" size="icon" className="relative" aria-label="الإشعارات">
            <Link to="/notifications">
              <Bell className="size-5" />
              {unread > 0 ? (
                <span className="absolute top-1 left-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon" className="lg:hidden" aria-label="العملاء">
            <Link to="/customers">
              <Building2 className="size-5" />
            </Link>
          </Button>
        </header>

        <main className="px-3 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
