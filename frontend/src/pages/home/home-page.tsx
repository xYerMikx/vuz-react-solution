import { useNavigate } from "react-router-dom";

import { useAppDispatch } from "@app/hooks";
import { routes } from "@app/routes";
import { authApi, useLogoutMutation } from "@features/auth/api";
import { useSquadSync } from "@features/realtime/use-squad-sync";
import { disconnectSquadSocket } from "@features/realtime/squad-socket";
import { SquadBuilder } from "@widgets/squad-builder/squad-builder";

export function HomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [logout, logoutState] = useLogoutMutation();
  const popularity = useSquadSync();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } catch {
      // Cookies may already be cleared.
    } finally {
      disconnectSquadSocket();
      dispatch(authApi.util.resetApiState());

      void navigate(routes.login);
    }
  };

  return (
    <SquadBuilder
      loggingOut={logoutState.isLoading}
      popularity={popularity}
      onLogout={handleLogout}
    />
  );
}
