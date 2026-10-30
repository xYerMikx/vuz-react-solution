import { useNavigate } from "react-router-dom";

import { routes } from "@app/routes";
import { CredentialsForm } from "@features/auth/credentials-form";
import { useRegisterMutation } from "@features/auth/api";
import type { Credentials } from "@features/auth/model";

export function RegisterPage() {
  const navigate = useNavigate();
  const [register, registerState] = useRegisterMutation();

  const handleSubmit = async (credentials: Credentials) => {
    await register(credentials).unwrap();

    void navigate(routes.home);
  };

  return (
    <CredentialsForm
      title="Create an account"
      submitLabel="Register"
      loading={registerState.isLoading}
      passwordAutoComplete="new-password"
      alternateHref={routes.login}
      alternateLabel="Already registered"
      onSubmit={handleSubmit}
    />
  );
}
