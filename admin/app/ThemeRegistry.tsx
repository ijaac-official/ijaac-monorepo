"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SessionProvider } from "next-auth/react";
import { SnackbarProvider } from "notistack";
import theme from "./theme";

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui-admin" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={4} autoHideDuration={3500} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <SessionProvider>{children}</SessionProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
