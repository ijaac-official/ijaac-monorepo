"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DescriptionIcon from "@mui/icons-material/Description";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PeopleIcon from "@mui/icons-material/People";
import Groups2Icon from "@mui/icons-material/Groups2";
import CollectionsBookmarkIcon from "@mui/icons-material/CollectionsBookmark";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import LogoutIcon from "@mui/icons-material/Logout";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import HowToRegIcon from "@mui/icons-material/HowToReg";

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { label: "Submissions", href: "/submissions", icon: <DescriptionIcon /> },
  { label: "Add Paper", href: "/submissions/new", icon: <NoteAddIcon /> },
  { label: "Issues", href: "/issues", icon: <CollectionsBookmarkIcon /> },
  { label: "Books", href: "/books", icon: <MenuBookIcon /> },
  { label: "Reviewers", href: "/reviewers", icon: <PeopleIcon /> },
  { label: "Reviewer Applications", href: "/reviewers/applications", icon: <HowToRegIcon /> },
  { label: "Editorial Board", href: "/editorial-board", icon: <Groups2Icon /> },
  { label: "Certificates", href: "/certificates", icon: <WorkspacePremiumIcon /> },
  { label: "Promotions", href: "/promotions", icon: <LocalOfferIcon /> },
  { label: "Payments", href: "/payments", icon: <QrCode2Icon /> },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  return (
    <Box sx={{ display: "flex", width: "100%" }}>
      <AppBar
        position="fixed"
        sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, ml: `${DRAWER_WIDTH}px`, bgcolor: "background.paper", color: "text.primary" }}
        elevation={0}
      >
        <Toolbar sx={{ justifyContent: "flex-end" }}>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 14 }}>
              {session?.user?.name?.[0] ?? "A"}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>{session?.user?.email}</MenuItem>
            <MenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: "border-box", bgcolor: "primary.main", color: "white" },
        }}
      >
        <Toolbar sx={{ gap: 1.5 }}>
          <Box
            component={Link}
            href="/"
            sx={{ display: "inline-flex", bgcolor: "white", px: 1, py: 0.5, lineHeight: 0 }}
            aria-label="IJAAC Admin home"
          >
            <Image src="/logo.png" alt="IJAAC" width={60} height={40} style={{ height: 36, width: "auto" }} priority />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.1}>
              IJAAC
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }}>
              Admin Console
            </Typography>
          </Box>
        </Toolbar>
        <List>
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <ListItemButton
                key={item.href}
                component={Link}
                href={item.href}
                selected={active}
                sx={{
                  color: "white",
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  transition: "background-color 0.15s ease, padding-left 0.15s ease",
                  "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.14)" },
                  "&.Mui-selected:hover": { bgcolor: "rgba(255,255,255,0.18)" },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)", pl: 2.5 },
                }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, bgcolor: "background.default", minHeight: "100vh", overflowX: "clip" }}>
        <Toolbar />
        <Box sx={{ p: 3, maxWidth: "100%" }}>{children}</Box>
      </Box>
    </Box>
  );
}
