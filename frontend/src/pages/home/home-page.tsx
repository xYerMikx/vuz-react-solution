import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "@app/hooks";
import { routes } from "@app/routes";
import { authApi, useLogoutMutation } from "@features/auth/api";
import { SquadBuilder } from "@widgets/squad-builder/squad-builder";

export function HomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [logout, logoutState] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Cookies may already be cleared.
    } finally {
      dispatch(authApi.util.resetApiState());

      void navigate(routes.login);
    }
  };

  return (
    <SquadBuilder loggingOut={logoutState.isLoading} onLogout={handleLogout} />
  );
}
