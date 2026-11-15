"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#7a1f2b",
      light: "#9c3347",
      dark: "#551319",
      contrastText: "#ffffff",
    },
    secondary: {
      main: "#d4a017",
      light: "#e0b94a",
      dark: "#a97d0f",
      contrastText: "#1a1205",
    },
    background: {
      default: "#f7f5f2",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: ["var(--font-body)", "Inter", "Roboto", "Helvetica", "Arial", "sans-serif"].join(","),
    // Body text uses the typeface's designed letter spacing (MUI adds a small default tracking).
    body1: { letterSpacing: "normal", lineHeight: 1.65 },
    body2: { letterSpacing: "normal", lineHeight: 1.6 },
    h1: { fontWeight: 700, fontFamily: "var(--font-heading)" },
    h2: { fontWeight: 700, fontFamily: "var(--font-heading)" },
    h3: { fontWeight: 700, fontFamily: "var(--font-heading)" },
    h4: { fontWeight: 600, fontFamily: "var(--font-heading)" },
    h5: { fontWeight: 600, fontFamily: "var(--font-heading)" },
    h6: { fontWeight: 600, fontFamily: "var(--font-heading)" },
    overline: { fontFamily: "var(--font-heading)", fontWeight: 700 },
    button: { fontWeight: 600, textTransform: "none", fontFamily: "var(--font-heading)" },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Guard against accidental horizontal scroll. `clip` never creates a
        // scroll container, so the sticky navbar keeps working. The `hidden`
        // fallback goes on <html> only: there it propagates to the viewport,
        // whereas `hidden` on <body> would make body a scroller and break sticky.
        html: {
          overflowX: "hidden",
          maxWidth: "100%",
          "@supports (overflow: clip)": { overflowX: "clip" },
        },
        body: {
          maxWidth: "100%",
          "@supports (overflow: clip)": { overflowX: "clip" },
        },
        // Plain text links inside content. Wrapped in :where() so the rule has
        // zero specificity: any component that styles its own links (footer,
        // nav, cards, buttons) keeps its look; bare <a> tags get this one.
        ":where(a:not(.MuiButtonBase-root))": {
          transition: "color 0.15s ease, text-decoration-color 0.15s ease",
          textUnderlineOffset: "0.18em",
        },
        ":where(a:not(.MuiButtonBase-root):not(.MuiPaper-root):hover)": {
          color: "#551319",
          textDecoration: "underline",
        },
        ":where(a:focus-visible)": {
          outline: "2px solid #d4a017",
          outlineOffset: 2,
        },
      },
    },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: {
        root: ({ ownerState }) => ({
          transition: "color 0.15s ease, text-decoration-color 0.15s ease",
          textUnderlineOffset: "0.18em",
          "&:focus-visible": { outline: "2px solid #d4a017", outlineOffset: 2 },
          // Only primary-coloured links shift to the darker crimson; links given
          // another colour (e.g. gold "Verify credential") keep it and just underline.
          ...((ownerState.color === undefined || ownerState.color === "primary") && {
            "&:hover": { color: "#551319" },
          }),
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          paddingLeft: 20,
          paddingRight: 20,
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          // Only lift on devices with real hover (mouse) - on touch, this
          // selector never matches, so there's no "stuck hover" state after
          // a tap, and no mismatched shadow color under non-primary buttons.
          "@media (hover: hover)": {
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none", borderRadius: 0 },
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
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 0 },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 0 },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
      },
    },
  },
});

export default theme;
