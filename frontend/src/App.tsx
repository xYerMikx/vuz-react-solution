import { Box, CssBaseline, Typography } from "@mui/material";

import logo from "./img/Mortal-Kombat-Logo.png";

export function App() {
  return (
    <>
      <CssBaseline />
      <Box component="main" sx={{ textAlign: "center", p: 4 }}>
        <img src={logo} alt="Mortal Kombat" width={160} height={90} />
        <Typography component="h1" variant="h5" sx={{ fontWeight: 700 }}>
          Squad of Champions
        </Typography>
      </Box>
    </>
  );
}
