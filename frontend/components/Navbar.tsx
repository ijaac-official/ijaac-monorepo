"use client";

import * as React from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

type NavLink = { label: string; href: string };
type NavEntry = NavLink | { label: string; children: NavLink[] };

const NAV_ENTRIES: NavEntry[] = [
  { label: "Home", href: "/" },
  {
    label: "About",
    children: [
      { label: "About the Journal", href: "/about" },
      { label: "Editorial Board", href: "/editorial-board" },
      { label: "Reviewers", href: "/reviewers" },
      { label: "Author Guidelines", href: "/author-guidelines" },
    ],
  },
  {
    label: "Publications",
    children: [
      { label: "Current Issue", href: "/current-issue" },
      { label: "All Publications", href: "/publications" },
      { label: "Archives", href: "/archives" },
      { label: "Books", href: "/books" },
    ],
  },
  { label: "Contact", href: "/contact" },
];

function NavDropdown({ label, children }: { label: string; children: NavLink[] }) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  return (
    <>
      <Button
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        endIcon={<KeyboardArrowDownIcon fontSize="small" />}
      >
        {label}
      </Button>
      <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
        {children.map((link) => (
          <MenuItem key={link.href} component={Link} href={link.href} onClick={() => setAnchorEl(null)}>
            {link.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default function Navbar() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("lg"));
  const [open, setOpen] = React.useState(false);

  return (
    <AppBar position="sticky" color="default" sx={{ bgcolor: "background.paper" }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2 }}>
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{
              flexGrow: 1,
              color: "primary.main",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            IJAAC Journal
          </Typography>

          {!isSmall && (
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {NAV_ENTRIES.map((entry) =>
                "children" in entry ? (
                  <NavDropdown key={entry.label} label={entry.label} children={entry.children} />
                ) : (
                  <Button key={entry.href} component={Link} href={entry.href} color="inherit">
                    {entry.label}
                  </Button>
                )
              )}
            </Box>
          )}

          {!isSmall && (
            <Button
              component={Link}
              href="/submit-paper"
              variant="contained"
              color="secondary"
              sx={{ ml: 1 }}
            >
              Submit Paper
            </Button>
          )}

          {isSmall && (
            <IconButton onClick={() => setOpen(true)} edge="end" aria-label="menu">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 280 }} role="presentation" onClick={() => setOpen(false)}>
          <List>
            {NAV_ENTRIES.map((entry) =>
              "children" in entry ? (
                <React.Fragment key={entry.label}>
                  <ListSubheader>{entry.label}</ListSubheader>
                  {entry.children.map((link) => (
                    <ListItemButton key={link.href} component={Link} href={link.href} sx={{ pl: 4 }}>
                      <ListItemText primary={link.label} />
                    </ListItemButton>
                  ))}
                </React.Fragment>
              ) : (
                <ListItemButton key={entry.href} component={Link} href={entry.href}>
                  <ListItemText primary={entry.label} />
                </ListItemButton>
              )
            )}
            <ListItemButton component={Link} href="/submit-paper" sx={{ color: "secondary.main" }}>
              <ListItemText primary="Submit Paper" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
