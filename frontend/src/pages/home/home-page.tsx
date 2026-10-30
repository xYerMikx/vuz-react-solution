import { useNavigate } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";

import { useAppDispatch } from "@app/hooks";
import { routes } from "@app/routes";
import { authApi, useGetMeQuery, useLogoutMutation } from "@features/auth/api";
import logo from "@shared/assets/mortal-kombat-logo.webp";

export function HomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const me = useGetMeQuery();
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
    <Box component="main" sx={{ textAlign: "center", p: 4 }}>
      <img src={logo} alt="Mortal Kombat" width={160} height={90} />
      <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
        Squad of Champions
      </Typography>
      <Typography sx={{ mt: 2 }}>{me.data?.email}</Typography>
      <Button
        sx={{ mt: 2 }}
        variant="outlined"
        loading={logoutState.isLoading}
        onClick={handleLogout}
      >
        Log out
      </Button>
    </Box>
  );
}
