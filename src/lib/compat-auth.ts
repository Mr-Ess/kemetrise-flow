import { useAuth as useAppAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

/** Compatibility shim for the ported website pages (`useAuth`, `useRole`). */
export function useAuth() {
  const { session, userId, email, fullName, roles } = useAppAuth();
  return {
    user: session ? { id: userId, email } : null,
    session,
    fullName,
    roles,
    signOut: async () => {
      await supabase.auth.signOut();
      if (typeof window !== "undefined") window.location.href = "/";
    },
  };
}

export function useRole() {
  const { roles } = useAppAuth();
  const role = roles.includes("admin")
    ? "superadmin"
    : roles.includes("management")
      ? "admin"
      : roles.length > 0
        ? "staff"
        : "user";
  return { role, roles };
}
