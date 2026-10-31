import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: { main: "#217aff" },
    error: { main: "#fc2c3c" },
    background: { default: "#f5fdff" },
    text: { primary: "#111111" },
  },
  typography: {
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    button: { textTransform: "none" },
  },
});
