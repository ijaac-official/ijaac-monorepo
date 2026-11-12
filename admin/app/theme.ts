"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#7a1f2b", dark: "#551319", light: "#9c3347", contrastText: "#fff" },
    secondary: { main: "#d4a017", contrastText: "#fff" },
    background: { default: "#f4f6f8", paper: "#ffffff" },
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 0 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          paddingLeft: 18,
          paddingRight: 18,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 6px 14px rgba(122,31,43,0.22)",
          },
        },
        contained: {
          boxShadow: "0 2px 6px rgba(122,31,43,0.18)",
        },
        outlined: {
          borderWidth: 1.5,
          "&:hover": { borderWidth: 1.5 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "transform 0.15s ease, background-color 0.15s ease",
          "&:hover": { transform: "scale(1.08)" },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", borderRadius: 0 },
        outlined: { borderColor: "rgba(122,31,43,0.14)" },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 0 },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { transition: "background-color 0.15s ease" },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: "rgba(122,31,43,0.05)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 0 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          transition: "color 0.15s ease",
          "&:hover": { color: "#7a1f2b" },
        },
      },
    },
  },
});

export default theme;
