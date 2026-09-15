import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin"
  | "management"
  | "sales"
  | "costing"
  | "staff"
  | "partner"
  | "agent"
  | "vendor"
  | "provider"
  | "marketing";

type AuthValue = {
  session: Session | null;
  userId: string | null;
  email: string | null;
  fullName: string;
  roles: AppRole[];
  loading: boolean;
  hasRole: (...roles: AppRole[]) => boolean;
  canSeeCosts: boolean;
  isManager: boolean;
};

const AuthContext = createContext<AuthValue>({
  session: null,
  userId: null,
  email: null,
  fullName: "",
  roles: [],
  loading: true,
  hasRole: () => false,
  canSeeCosts: false,
  isManager: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user.id ?? null;

  const { data: profileData } = useQuery({
    queryKey: ["me", userId],
    enabled: !!userId,
    queryFn: async () => {
      const [{ data: profile }, { data: roleRows }] = await Promise.all([
        supabase.from("profiles").select("full_name, email").eq("id", userId!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId!),
      ]);
      return {
        fullName: profile?.full_name || profile?.email || "",
        roles: (roleRows ?? []).map((r) => r.role as AppRole),
      };
    },
  });

  const roles = profileData?.roles ?? [];
  const value: AuthValue = {
    session,
    userId,
    email: session?.user.email ?? null,
    fullName: profileData?.fullName || session?.user.email || "",
    roles,
    loading,
    hasRole: (...wanted: AppRole[]) => wanted.some((r) => roles.includes(r)),
    canSeeCosts: roles.some((r) => r === "admin" || r === "management" || r === "costing"),
    isManager: roles.some((r) => r === "admin" || r === "management"),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
