import { useRouter, useRouterState } from "@tanstack/react-router";
import { useCallback } from "react";

/**
 * Small compatibility layer so the ported KemetRise website pages can keep
 * using `navigate("/path")` / `useLocation()` on top of TanStack Router.
 */
export function useNavigate() {
  const router = useRouter();
  return useCallback(
    (to: string | number, opts?: { replace?: boolean }) => {
      if (typeof to === "number") {
        router.history.go(to);
        return;
      }
      const [path, hash] = to.split("#");
      void router.navigate({
        to: (path || "/") as never,
        hash: hash || undefined,
        replace: opts?.replace,
      });
    },
    [router],
  );
}

export function useLocation() {
  return useRouterState({ select: (s) => s.location });
}
