"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

type NavLink = { label: string; href: string };
type NavEntry = (NavLink | { label: string; children: NavLink[] }) & {
  icon?: React.ReactNode;
};

const NAV_ENTRIES: NavEntry[] = [
  { label: "Home", href: "/", icon: <HomeOutlinedIcon fontSize="small" /> },
  {
    label: "About",
    icon: <InfoOutlinedIcon fontSize="small" />,
    children: [
      { label: "About the Journal", href: "/about" },
      { label: "Editorial Board", href: "/editorial-board" },
      { label: "Reviewers", href: "/reviewers" },
      { label: "Author Guidelines", href: "/author-guidelines" },
    ],
  },
  {
    label: "Publications",
    icon: <ArticleOutlinedIcon fontSize="small" />,
    children: [
      { label: "Current Issue", href: "/current-issue" },
      { label: "All Publications", href: "/publications" },
      { label: "Archives", href: "/archives" },
      { label: "Books", href: "/books" },
    ],
  },
  {
    label: "Policies",
    icon: <GavelOutlinedIcon fontSize="small" />,
    children: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms-and-conditions" },
      { label: "Refund & Cancellation", href: "/refund-policy" },
      { label: "Publication Ethics & Copyright", href: "/publication-ethics" },
    ],
  },
  { label: "Contact", href: "/contact", icon: <MailOutlineIcon fontSize="small" /> },
];

function HoverDropdown({ label, children }: { label: string; children: NavLink[] }) {
  return (
    <Box sx={{ position: "relative", "&:hover .nav-dropdown-panel": { display: "block" } }}>
      <Button color="inherit" endIcon={<KeyboardArrowDownIcon fontSize="small" />}>
        {label}
      </Button>
      <Paper
        className="nav-dropdown-panel"
        elevation={3}
        sx={{
          display: "none",
          position: "absolute",
          top: "100%",
          left: 0,
          minWidth: 230,
          zIndex: 20,
          py: 1,
        }}
      >
        {children.map((link) => (
          <Box
            key={link.href}
            component={Link}
            href={link.href}
            sx={{
              display: "block",
              px: 2,
              py: 1,
              color: "text.primary",
              textDecoration: "none",
              fontSize: 14,
              "&:hover": { bgcolor: "action.hover" },
            }}
          >
            {link.label}
          </Box>
        ))}
      </Paper>
    </Box>
  );
}

function SearchBox({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(fullWidth);
  const [value, setValue] = React.useState("");

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) router.push(`/publications?q=${encodeURIComponent(value.trim())}`);
  };

  if (!open) {
    return (
      <IconButton aria-label="Search" onClick={() => setOpen(true)} color="inherit">
        <SearchIcon />
      </IconButton>
    );
  }

  return (
    <Box component="form" onSubmit={runSearch} sx={{ display: "flex", alignItems: "center", width: fullWidth ? "100%" : "auto" }}>
      <TextField
        autoFocus={!fullWidth}
        size="small"
        placeholder="Search publications..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        fullWidth={fullWidth}
        sx={{ width: fullWidth ? "100%" : 220 }}
        InputProps={{
          startAdornment: fullWidth ? (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="disabled" />
            </InputAdornment>
          ) : undefined,
          endAdornment: !fullWidth ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setOpen(false)} aria-label="Close search">
                <CloseIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        }}
      />
    </Box>
  );
}

export default function Navbar() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("lg"));
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const [mobileExpanded, setMobileExpanded] = React.useState<string | null>(null);

  const isChildActive = (children: NavLink[]) => children.some((c) => c.href === pathname);

  return (
    <AppBar position="sticky" color="default" sx={{ bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 1.5 }}>
          <Box
            component={Link}
            href="/"
            sx={{ display: "flex", alignItems: "center", flexGrow: 1, textDecoration: "none" }}
          >
            <Image src="/logo.png" alt="IJAAC Journal" width={140} height={95} style={{ height: 52, width: "auto" }} priority />
          </Box>

          {!isSmall && (
            <>
              <Box sx={{ display: "flex", gap: 0.5 }}>
                {NAV_ENTRIES.map((entry) =>
                  "children" in entry ? (
                    <HoverDropdown key={entry.label} label={entry.label} children={entry.children} />
                  ) : (
                    <Button key={entry.href} component={Link} href={entry.href} color="inherit">
                      {entry.label}
                    </Button>
                  )
                )}
              </Box>
              <SearchBox />
              <Button component={Link} href="/submit-paper" variant="contained" color="secondary" sx={{ ml: 1 }}>
                Submit Paper
              </Button>
            </>
          )}

          {isSmall && (
            <IconButton onClick={() => setOpen(true)} edge="end" aria-label="menu">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 300, height: "100%", display: "flex", flexDirection: "column" }} role="presentation">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 1.5,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Image src="/logo.png" alt="IJAAC Journal" width={110} height={74} style={{ height: 40, width: "auto" }} />
            <IconButton onClick={() => setOpen(false)} aria-label="Close menu">
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ p: 2 }}>
            <Button
              component={Link}
              href="/submit-paper"
              variant="contained"
              color="secondary"
              fullWidth
              size="large"
              onClick={() => setOpen(false)}
            >
              Submit Paper
            </Button>
          </Box>

          <Box sx={{ px: 2, pb: 1.5 }}>
            <SearchBox fullWidth />
          </Box>

          <Divider />

          <List sx={{ flexGrow: 1, overflowY: "auto", py: 0 }}>
            {NAV_ENTRIES.map((entry) =>
              "children" in entry ? (
                <React.Fragment key={entry.label}>
                  <ListItemButton
                    onClick={() => setMobileExpanded(mobileExpanded === entry.label ? null : entry.label)}
                    selected={isChildActive(entry.children)}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>{entry.icon}</ListItemIcon>
                    <ListItemText primary={entry.label} />
                    <KeyboardArrowDownIcon
                      fontSize="small"
                      sx={{
                        transform: mobileExpanded === entry.label ? "rotate(180deg)" : "none",
                        transition: "transform 0.2s",
                      }}
                    />
                  </ListItemButton>
                  <Collapse in={mobileExpanded === entry.label}>
                    {entry.children.map((link) => (
                      <ListItemButton
                        key={link.href}
                        component={Link}
                        href={link.href}
                        selected={pathname === link.href}
                        sx={{ pl: 7, py: 0.75 }}
                        onClick={() => setOpen(false)}
                      >
                        <ListItemText
                          primary={link.label}
                          primaryTypographyProps={{ fontSize: 14 }}
                        />
                      </ListItemButton>
                    ))}
                  </Collapse>
                  <Divider sx={{ my: 0.5 }} />
                </React.Fragment>
              ) : (
                <ListItemButton
                  key={entry.href}
                  component={Link}
                  href={entry.href}
                  selected={pathname === entry.href}
                  onClick={() => setOpen(false)}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: "primary.main" }}>{entry.icon}</ListItemIcon>
                  <ListItemText primary={entry.label} />
                </ListItemButton>
              )
            )}
          </List>

          <Box sx={{ px: 2, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography variant="caption" color="text.secondary">
              ijaac.official@gmail.com
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
}
