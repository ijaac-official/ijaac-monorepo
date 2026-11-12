"use client";

import * as React from "react";
import Link from "next/link";
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
import SecurityIcon from "@mui/icons-material/Security";
import LogoutIcon from "@mui/icons-material/Logout";

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: <DashboardIcon /> },
  { label: "Submissions", href: "/submissions", icon: <DescriptionIcon /> },
  { label: "Books", href: "/books", icon: <MenuBookIcon /> },
  { label: "Reviewers", href: "/reviewers", icon: <PeopleIcon /> },
  { label: "Editorial Board", href: "/editorial-board", icon: <Groups2Icon /> },
  { label: "Issues", href: "/issues", icon: <CollectionsBookmarkIcon /> },
  { label: "Security", href: "/security", icon: <SecurityIcon /> },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  return (
    <Box sx={{ display: "flex" }}>
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
        <Toolbar>
          <Typography variant="h6" fontWeight={700}>
            IJAAC Admin
          </Typography>
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

      <Box component="main" sx={{ flexGrow: 1, bgcolor: "background.default", minHeight: "100vh" }}>
        <Toolbar />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
