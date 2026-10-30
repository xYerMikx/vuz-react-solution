import { Navigate, Outlet } from "react-router-dom";

import { useGetMeQuery } from "@features/auth/api";

import type { AppRoute } from "./routes";
import { SessionLoading } from "./session-loading";

interface SessionGuardProps {
  redirectWhen: "anonymous" | "authenticated";
  to: AppRoute;
}

export function SessionGuard({ redirectWhen, to }: SessionGuardProps) {
  const me = useGetMeQuery();

  if (me.isLoading || me.isUninitialized) {
    return <SessionLoading />;
  }

  const isAuthenticated = Boolean(me.data);
  const shouldRedirect =
    (redirectWhen === "anonymous" && !isAuthenticated) ||
    (redirectWhen === "authenticated" && isAuthenticated);

  if (shouldRedirect) {
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}
