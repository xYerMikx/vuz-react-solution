import { Navigate, Route, Routes } from "react-router-dom";

import { HomePage } from "@pages/home/home-page";
import { LoginPage } from "@pages/login/login-page";
import { RegisterPage } from "@pages/register/register-page";

import { routes } from "./routes";
import { SessionGuard } from "./session-guard";

export function AppRouter() {
  return (
    <Routes>
      <Route
        element={<SessionGuard redirectWhen="authenticated" to={routes.home} />}
      >
        <Route path={routes.login} element={<LoginPage />} />
        <Route path={routes.register} element={<RegisterPage />} />
      </Route>
      <Route
        element={<SessionGuard redirectWhen="anonymous" to={routes.login} />}
      >
        <Route path={routes.home} element={<HomePage />} />
      </Route>
      <Route path="*" element={<Navigate to={routes.home} replace />} />
    </Routes>
  );
}
