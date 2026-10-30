import { useNavigate } from "react-router-dom";

import { routes } from "@app/routes";
import { CredentialsForm } from "@features/auth/credentials-form";
import { useLoginMutation } from "@features/auth/api";
import type { Credentials } from "@features/auth/model";

export function LoginPage() {
  const navigate = useNavigate();
  const [login, loginState] = useLoginMutation();

  const handleSubmit = async (credentials: Credentials) => {
    await login(credentials).unwrap();

    void navigate(routes.home);
  };

  return (
    <CredentialsForm
      title="Log in"
      submitLabel="Log in"
      loading={loginState.isLoading}
      passwordAutoComplete="current-password"
      alternateHref={routes.register}
      alternateLabel="Create an account"
      onSubmit={handleSubmit}
    />
  );
}
