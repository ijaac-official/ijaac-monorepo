"use client";

import * as React from "react";
import { useSnackbar } from "notistack";
import { formatInr, type PaymentRequest, type PaymentRequestStatus } from "@ijaac/shared";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Menu from "@mui/material/Menu";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Autocomplete from "@mui/material/Autocomplete";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import FormControl from "@mui/material/FormControl";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareIcon from "@mui/icons-material/Share";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import IosShareIcon from "@mui/icons-material/IosShare";
import DownloadIcon from "@mui/icons-material/Download";
import RefreshIcon from "@mui/icons-material/Refresh";
import BlockIcon from "@mui/icons-material/Block";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

export interface SubmissionOption {
  id: string;
  title: string;
  articleNumber?: string;
  authorName?: string;
  email?: string;
  phone?: string;
}

const JOURNAL_NAME = "International Journal of Applied AI & Computing";

const STATUS_CHIP: Record<PaymentRequestStatus, { label: string; color: "default" | "success" | "warning" | "error" }> = {
  CREATED: { label: "Pending", color: "warning" },
  PAID: { label: "Paid", color: "success" },
  EXPIRED: { label: "Expired", color: "default" },
  CANCELLED: { label: "Cancelled", color: "error" },
};

const PURPOSES = ["Publication fee", "Book purchase", "Custom"] as const;
type Purpose = (typeof PURPOSES)[number];

const wrapSx = { wordBreak: "break-word", overflowWrap: "anywhere" } as const;

async function errorFrom(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => ({}));
  return typeof body?.error === "string" ? body.error : fallback;
}

/** Shown status - a pending request past its expiry is displayed as expired until refreshed. */
function displayStatus(p: PaymentRequest): PaymentRequestStatus {
  if (p.status === "CREATED" && p.expiresAt && new Date(p.expiresAt).getTime() < Date.now()) return "EXPIRED";
  return p.status;
}

function shareUrl(p: PaymentRequest): string | undefined {
  return p.shortUrl ?? p.qrImageUrl;
}

function shareText(p: PaymentRequest): string {
  const amount = formatInr(p.amountInPaise);
  const target =
    p.kind === "LINK"
      ? `Pay securely via Razorpay (UPI, cards, netbanking, wallets): ${p.shortUrl}`
      : `Scan this UPI QR with any UPI app to pay: ${p.qrImageUrl}`;
  return `IJAAC payment request\n${amount} - ${p.description}\n${target}`;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

// ---------------------------------------------------------------------------
// Shareable QR card, drawn on a canvas so it can be downloaded or shared as a PNG

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  // Break any single over-long token (e.g. a URL) by characters.
  const out: string[] = [];
  for (const l of lines) {
    if (ctx.measureText(l).width <= maxWidth) {
      out.push(l);
      continue;
    }
    let chunk = "";
    for (const ch of l) {
      if (ctx.measureText(chunk + ch).width > maxWidth) {
        out.push(chunk);
        chunk = ch;
      } else chunk += ch;
    }
    if (chunk) out.push(chunk);
  }
  if (out.length > maxLines) {
    const cut = out.slice(0, maxLines);
    cut[maxLines - 1] = `${cut[maxLines - 1].replace(/.{0,3}$/, "")}...`;
    return cut;
  }
  return out;
}

async function buildCardBlob(p: PaymentRequest): Promise<Blob> {
  const [qr, rzpLogo, logo] = await Promise.all([
    loadImage(`/api/payments/${p.id}/qr`),
    loadImage("/razorpay-logo.svg"),
    loadImage("/logo.png").catch(() => null),
  ]);

  const W = 1000;
  const H = 1400;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);

  // Header band
  ctx.fillStyle = "#7a1f2b";
  ctx.fillRect(0, 0, W, 170);
  ctx.fillStyle = "#d4a017";
  ctx.fillRect(0, 170, W, 8);
  let textX = 60;
  if (logo) {
    const lh = 96;
    const lw = (logo.width / logo.height) * lh;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(50, 37, lw + 20, lh);
    ctx.drawImage(logo, 60, 37, lw, lh);
    textX = 60 + lw + 40;
  }
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  ctx.font = "bold 56px Arial, Helvetica, sans-serif";
  ctx.fillText("IJAAC", textX, 95);
  ctx.font = "24px Arial, Helvetica, sans-serif";
  ctx.fillText(wrapLines(ctx, JOURNAL_NAME, W - textX - 40, 1)[0], textX, 135);

  // Amount + description
  ctx.textAlign = "center";
  ctx.fillStyle = "#555555";
  ctx.font = "26px Arial, Helvetica, sans-serif";
  ctx.fillText("Amount payable", W / 2, 245);
  ctx.fillStyle = "#7a1f2b";
  ctx.font = "bold 76px Arial, Helvetica, sans-serif";
  ctx.fillText(formatInr(p.amountInPaise), W / 2, 330);
  ctx.fillStyle = "#222222";
  ctx.font = "28px Arial, Helvetica, sans-serif";
  const desc = wrapLines(ctx, p.description, W - 160, 2);
  desc.forEach((l, i) => ctx.fillText(l, W / 2, 380 + i * 36));

  // QR (contain-fit inside a square box)
  const box = 640;
  const bx = (W - box) / 2;
  const by = 460;
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 2;
  ctx.strokeRect(bx - 10, by - 10, box + 20, box + 20);
  const scale = Math.min(box / qr.width, box / qr.height);
  const qw = qr.width * scale;
  const qh = qr.height * scale;
  ctx.drawImage(qr, bx + (box - qw) / 2, by + (box - qh) / 2, qw, qh);

  // Instructions
  ctx.fillStyle = "#333333";
  ctx.font = "bold 28px Arial, Helvetica, sans-serif";
  ctx.fillText(
    p.kind === "LINK" ? "Scan to pay - UPI, cards, netbanking, wallets" : "Scan with any UPI app to pay",
    W / 2,
    by + box + 60
  );
  if (p.shortUrl) {
    ctx.fillStyle = "#7a1f2b";
    ctx.font = "24px Arial, Helvetica, sans-serif";
    wrapLines(ctx, p.shortUrl, W - 160, 2).forEach((l, i) => ctx.fillText(l, W / 2, by + box + 100 + i * 30));
  }

  // Footer: Powered by Razorpay
  ctx.fillStyle = "#f4f6f8";
  ctx.fillRect(0, H - 110, W, 110);
  const rh = 40;
  const rw = (1896 / 401) * rh;
  ctx.fillStyle = "#666666";
  ctx.font = "24px Arial, Helvetica, sans-serif";
  ctx.textAlign = "left";
  const label = "Powered by";
  const lw = ctx.measureText(label).width;
  const startX = (W - (lw + 16 + rw)) / 2;
  ctx.fillText(label, startX, H - 47);
  ctx.drawImage(rzpLogo, startX + lw + 16, H - 55 - rh / 2 - 2, rw, rh);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render the QR card"))), "image/png")
  );
}

function cardFileName(p: PaymentRequest) {
  return `ijaac-payment-${(p.amountInPaise / 100).toFixed(0)}-${p.id.slice(0, 8)}.png`;
}

// ---------------------------------------------------------------------------

export default function PaymentsManager({
  initialRequests,
  submissions,
}: {
  initialRequests: PaymentRequest[];
  submissions: SubmissionOption[];
}) {
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("md"));

  const [requests, setRequests] = React.useState<PaymentRequest[]>(initialRequests);
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | PaymentRequestStatus>("ALL");
  const [search, setSearch] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);
  const [qrFor, setQrFor] = React.useState<PaymentRequest | null>(null);
  const [emailFor, setEmailFor] = React.useState<PaymentRequest | null>(null);
  const [cancelFor, setCancelFor] = React.useState<PaymentRequest | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [shareMenu, setShareMenu] = React.useState<{ anchor: HTMLElement; req: PaymentRequest } | null>(null);
  const [canNativeShare, setCanNativeShare] = React.useState(false);

  React.useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const submissionById = React.useMemo(() => new Map(submissions.map((s) => [s.id, s])), [submissions]);

  const upsert = (p: PaymentRequest) =>
    setRequests((prev) => {
      const exists = prev.some((r) => r.id === p.id);
      return exists ? prev.map((r) => (r.id === p.id ? p : r)) : [p, ...prev];
    });

  const kpis = React.useMemo(() => {
    let collected = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    for (const r of requests) {
      const s = displayStatus(r);
      if (s === "PAID") {
        collected += r.amountInPaise;
        paidCount += 1;
      } else if (s === "CREATED") {
        pendingCount += 1;
        pendingAmount += r.amountInPaise;
      }
    }
    return { collected, paidCount, pendingCount, pendingAmount };
  }, [requests]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && displayStatus(r) !== statusFilter) return false;
      if (!q) return true;
      const sub = r.submissionId ? submissionById.get(r.submissionId) : undefined;
      const hay = [
        r.description,
        r.customer.name,
        r.customer.email,
        r.customer.phone,
        r.razorpayId,
        r.shortUrl,
        formatInr(r.amountInPaise),
        String(r.amountInPaise / 100),
        sub?.title,
        sub?.articleNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [requests, statusFilter, search, submissionById]);

  // --- actions -------------------------------------------------------------

  const copyLink = async (p: PaymentRequest) => {
    const url = shareUrl(p);
    if (!url) return enqueueSnackbar("This request has no shareable link", { variant: "warning" });
    try {
      await navigator.clipboard.writeText(url);
      enqueueSnackbar(p.kind === "LINK" ? "Payment link copied" : "QR image link copied", { variant: "success" });
    } catch {
      enqueueSnackbar("Could not copy - your browser blocked clipboard access", { variant: "error" });
    }
  };

  const shareWhatsApp = (p: PaymentRequest) => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText(p))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    enqueueSnackbar("Opening WhatsApp...", { variant: "info" });
  };

  const shareNative = async (p: PaymentRequest) => {
    try {
      let files: File[] | undefined;
      try {
        const blob = await buildCardBlob(p);
        const file = new File([blob], cardFileName(p), { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) files = [file];
      } catch {
        files = undefined;
      }
      await navigator.share({
        title: "IJAAC payment request",
        text: shareText(p),
        ...(p.shortUrl && !files ? { url: p.shortUrl } : {}),
        ...(files ? { files } : {}),
      });
      enqueueSnackbar("Shared", { variant: "success" });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      enqueueSnackbar("Sharing failed - try copying the link instead", { variant: "error" });
    }
  };

  const download = async (p: PaymentRequest) => {
    setBusy(`dl:${p.id}`);
    try {
      const blob = await buildCardBlob(p);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = cardFileName(p);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      enqueueSnackbar("QR card downloaded", { variant: "success" });
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not download the QR", { variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const refresh = async (p: PaymentRequest) => {
    setBusy(`rf:${p.id}`);
    try {
      const res = await fetch(`/api/payments/${p.id}/refresh`, { method: "POST" });
      if (!res.ok) throw new Error(await errorFrom(res, "Could not refresh status"));
      const updated = (await res.json()) as PaymentRequest;
      upsert(updated);
      if (qrFor?.id === updated.id) setQrFor(updated);
      enqueueSnackbar(
        updated.status === p.status
          ? `Status unchanged: ${STATUS_CHIP[updated.status].label}`
          : `Status updated: ${STATUS_CHIP[updated.status].label}`,
        { variant: updated.status === "PAID" ? "success" : "info" }
      );
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not refresh status", { variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const confirmCancel = async () => {
    const p = cancelFor;
    if (!p) return;
    setBusy(`cx:${p.id}`);
    try {
      const res = await fetch(`/api/payments/${p.id}/cancel`, { method: "POST" });
      if (!res.ok) throw new Error(await errorFrom(res, "Could not cancel the request"));
      const updated = (await res.json()) as PaymentRequest;
      upsert(updated);
      enqueueSnackbar(
        updated.status === "CANCELLED" ? "Payment request cancelled" : `Request is ${STATUS_CHIP[updated.status].label.toLowerCase()}`,
        { variant: updated.status === "CANCELLED" ? "success" : "info" }
      );
      setCancelFor(null);
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not cancel the request", { variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const actions = (p: PaymentRequest) => {
    const s = displayStatus(p);
    const pending = s === "CREATED";
    return (
      <Stack direction="row" spacing={0.25} flexWrap="wrap" useFlexGap justifyContent={isSmall ? "flex-start" : "flex-end"}>
        <Tooltip title="View QR">
          <IconButton size="small" onClick={() => setQrFor(p)} aria-label="View QR">
            <QrCode2Icon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Copy link">
          <IconButton size="small" onClick={() => copyLink(p)} aria-label="Copy link">
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Share">
          <span>
            <IconButton
              size="small"
              disabled={!pending}
              onClick={(e) => setShareMenu({ anchor: e.currentTarget, req: p })}
              aria-label="Share"
            >
              <ShareIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Download QR card (PNG)">
          <span>
            <IconButton size="small" onClick={() => download(p)} disabled={busy === `dl:${p.id}`} aria-label="Download QR">
              {busy === `dl:${p.id}` ? <CircularProgress size={18} /> : <DownloadIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Refresh status from Razorpay">
          <span>
            <IconButton size="small" onClick={() => refresh(p)} disabled={busy === `rf:${p.id}`} aria-label="Refresh status">
              {busy === `rf:${p.id}` ? <CircularProgress size={18} /> : <RefreshIcon fontSize="small" />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Cancel request">
          <span>
            <IconButton
              size="small"
              color="error"
              disabled={p.status !== "CREATED"}
              onClick={() => setCancelFor(p)}
              aria-label="Cancel request"
            >
              <BlockIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    );
  };

  const statusChip = (p: PaymentRequest) => {
    const c = STATUS_CHIP[displayStatus(p)];
    return <Chip size="small" label={c.label} color={c.color} sx={{ maxWidth: "100%" }} />;
  };

  const kindChip = (p: PaymentRequest) => (
    <Chip
      size="small"
      variant="outlined"
      label={p.kind === "LINK" ? "Payment Link" : "UPI QR"}
      sx={{ maxWidth: "100%" }}
    />
  );

  const customerCell = (p: PaymentRequest) => {
    const c = p.customer;
    if (!c.name && !c.email && !c.phone) return <Typography variant="body2" color="text.secondary">-</Typography>;
    return (
      <Box sx={{ minWidth: 0, ...wrapSx }}>
        {c.name && <Typography variant="body2">{c.name}</Typography>}
        {(c.email || c.phone) && (
          <Typography variant="caption" color="text.secondary" component="div" sx={wrapSx}>
            {[c.email, c.phone].filter(Boolean).join(" | ")}
          </Typography>
        )}
      </Box>
    );
  };

  const descCell = (p: PaymentRequest) => {
    const sub = p.submissionId ? submissionById.get(p.submissionId) : undefined;
    return (
      <Box sx={{ minWidth: 0, ...wrapSx }}>
        <Typography variant="body2" sx={wrapSx}>
          {p.description}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary" component="div" sx={wrapSx}>
            Paper{sub.articleNumber ? ` ${sub.articleNumber}` : ""}: {sub.title}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <>
      {/* KPI strip */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
          gap: 2,
          mb: 3,
        }}
      >
        <Kpi label="Total collected" value={formatInr(kpis.collected)} accent="#7a1f2b" />
        <Kpi label="Paid requests" value={String(kpis.paidCount)} accent="#2e7d32" />
        <Kpi label="Pending requests" value={String(kpis.pendingCount)} accent="#d4a017" />
        <Kpi label="Pending amount" value={formatInr(kpis.pendingAmount)} accent="#555" />
      </Box>

      {/* Toolbar */}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }} alignItems={{ md: "center" }}>
        <TextField
          size="small"
          placeholder="Search description, customer, link..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 0 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          {(Object.keys(STATUS_CHIP) as PaymentRequestStatus[]).map((s) => (
            <MenuItem key={s} value={s}>
              {STATUS_CHIP[s].label}
            </MenuItem>
          ))}
        </TextField>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)} sx={{ flexShrink: 0 }}>
          New payment request
        </Button>
      </Stack>

      {/* List */}
      {filtered.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {requests.length === 0 ? "No payment requests yet. Create one to get a shareable link and QR." : "No requests match your filters."}
          </Typography>
        </Paper>
      ) : isSmall ? (
        <Stack spacing={1.5}>
          {filtered.map((p) => (
            <Paper key={p.id} variant="outlined" sx={{ p: 2, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6" sx={{ fontFamily: "inherit" }}>
                  {formatInr(p.amountInPaise)}
                </Typography>
                {statusChip(p)}
              </Stack>
              {descCell(p)}
              <Box sx={{ mt: 1 }}>{customerCell(p)}</Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {kindChip(p)}
                <Typography variant="caption" color="text.secondary">
                  {fmtDate(p.createdAt)}
                </Typography>
              </Stack>
              <Divider sx={{ my: 1 }} />
              {actions(p)}
            </Paper>
          ))}
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ overflowX: "auto" }}>
          <Table size="small" sx={{ minWidth: 820 }}>
            <TableHead>
              <TableRow>
                <TableCell>Amount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2" fontWeight={700}>
                      {formatInr(p.amountInPaise)}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>{kindChip(p)}</Box>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>{descCell(p)}</TableCell>
                  <TableCell sx={{ maxWidth: 220 }}>{customerCell(p)}</TableCell>
                  <TableCell>
                    {statusChip(p)}
                    {p.paidAt && (
                      <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                        {fmtDate(p.paidAt)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Typography variant="body2">{fmtDate(p.createdAt)}</Typography>
                    {p.expiresAt && (
                      <Typography variant="caption" color="text.secondary">
                        Expires {fmtDate(p.expiresAt)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ minWidth: 220 }}>
                    {actions(p)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Share menu */}
      <Menu anchorEl={shareMenu?.anchor} open={!!shareMenu} onClose={() => setShareMenu(null)}>
        <MenuItem
          onClick={() => {
            if (shareMenu) shareWhatsApp(shareMenu.req);
            setShareMenu(null);
          }}
        >
          <ListItemIcon>
            <WhatsAppIcon fontSize="small" sx={{ color: "#25D366" }} />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (shareMenu) setEmailFor(shareMenu.req);
            setShareMenu(null);
          }}
        >
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Email</ListItemText>
        </MenuItem>
        {canNativeShare && (
          <MenuItem
            onClick={() => {
              if (shareMenu) void shareNative(shareMenu.req);
              setShareMenu(null);
            }}
          >
            <ListItemIcon>
              <IosShareIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>More options...</ListItemText>
          </MenuItem>
        )}
      </Menu>

      <CreateDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        submissions={submissions}
        onCreated={(p) => {
          upsert(p);
          setCreateOpen(false);
          setQrFor(p);
        }}
      />

      <QrDialog
        req={qrFor}
        onClose={() => setQrFor(null)}
        onCopy={copyLink}
        onDownload={download}
        onWhatsApp={shareWhatsApp}
        onEmail={(p) => setEmailFor(p)}
        onNativeShare={canNativeShare ? shareNative : undefined}
        downloading={!!qrFor && busy === `dl:${qrFor.id}`}
      />

      <EmailDialog req={emailFor} onClose={() => setEmailFor(null)} />

      <Dialog open={!!cancelFor} onClose={() => setCancelFor(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Cancel payment request?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={wrapSx}>
            {cancelFor &&
              `${formatInr(cancelFor.amountInPaise)} - ${cancelFor.description}. The ${
                cancelFor.kind === "LINK" ? "link" : "QR code"
              } will stop accepting payments immediately. This cannot be undone.`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelFor(null)}>Keep</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmCancel}
            disabled={!!cancelFor && busy === `cx:${cancelFor.id}`}
          >
            {cancelFor && busy === `cx:${cancelFor.id}` ? "Cancelling..." : "Cancel request"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderLeft: `4px solid ${accent}`, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontFamily: "inherit", fontWeight: 700, ...wrapSx }}>
        {value}
      </Typography>
    </Paper>
  );
}

// ---------------------------------------------------------------------------

function RazorpayMark({ height = 18, label = "Powered by" }: { height?: number; label?: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center" justifyContent="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box component="img" src="/razorpay-logo.svg" alt="Razorpay" sx={{ height, width: "auto" }} />
    </Stack>
  );
}

const EXPIRY_OPTIONS = [
  { value: 0, label: "No expiry" },
  { value: 1, label: "1 day" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
] as const;

function CreateDialog({
  open,
  onClose,
  submissions,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  submissions: SubmissionOption[];
  onCreated: (p: PaymentRequest) => void;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [kind, setKind] = React.useState<"LINK" | "QR">("LINK");
  const [amount, setAmount] = React.useState("");
  const [purpose, setPurpose] = React.useState<Purpose>("Publication fee");
  const [description, setDescription] = React.useState("Publication fee");
  const [descTouched, setDescTouched] = React.useState(false);
  const [submission, setSubmission] = React.useState<SubmissionOption | null>(null);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [expiryDays, setExpiryDays] = React.useState<0 | 1 | 7 | 30>(7);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setKind("LINK");
    setAmount("");
    setPurpose("Publication fee");
    setDescription("Publication fee");
    setDescTouched(false);
    setSubmission(null);
    setName("");
    setEmail("");
    setPhone("");
    setExpiryDays(7);
    setError(null);
  }, [open]);

  const autoDescription = (p: Purpose, s: SubmissionOption | null) => {
    if (p === "Custom") return "";
    return s ? `${p} - ${s.title}` : p;
  };

  const choosePurpose = (p: Purpose) => {
    setPurpose(p);
    if (!descTouched || p === "Custom") {
      setDescription(autoDescription(p, submission));
      setDescTouched(p === "Custom" ? false : descTouched);
    }
  };

  const chooseSubmission = (s: SubmissionOption | null) => {
    setSubmission(s);
    if (!descTouched && purpose !== "Custom") setDescription(autoDescription(purpose, s));
    if (s) {
      if (!name && s.authorName) setName(s.authorName);
      if (!email && s.email) setEmail(s.email);
      if (!phone && s.phone) setPhone(s.phone);
    }
  };

  const amountNum = Number(amount);
  const amountValid = amount !== "" && Number.isFinite(amountNum) && amountNum >= 1;

  const submit = async () => {
    setError(null);
    if (!amountValid) return setError("Enter an amount of at least Rs 1");
    if (description.trim().length < 2) return setError("Enter a description");
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          amountInr: Math.round(amountNum * 100) / 100,
          description: description.trim(),
          customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
          submissionId: submission?.id ?? "",
          expiryDays,
        }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, "Could not create the payment request"));
      const created = (await res.json()) as PaymentRequest;
      enqueueSnackbar(
        `${kind === "LINK" ? "Payment link" : "UPI QR"} created for ${formatInr(created.amountInPaise)}`,
        { variant: "success" }
      );
      onCreated(created);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create the payment request";
      setError(msg);
      enqueueSnackbar(msg, { variant: "error", autoHideDuration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
          <span>New payment request</span>
          <Box component="img" src="/razorpay-logo.svg" alt="Razorpay" sx={{ height: 20, width: "auto" }} />
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={wrapSx}>
              {error}
            </Alert>
          )}
          <TextField
            label="Amount"
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={amount !== "" && !amountValid}
            helperText={amount !== "" && !amountValid ? "Minimum Rs 1" : "In Indian Rupees (INR)"}
            inputProps={{ min: 1, step: "0.01", inputMode: "decimal" }}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            autoFocus
          />
          <TextField select label="Purpose" value={purpose} onChange={(e) => choosePurpose(e.target.value as Purpose)}>
            {PURPOSES.map((p) => (
              <MenuItem key={p} value={p}>
                {p}
              </MenuItem>
            ))}
          </TextField>
          <Autocomplete
            options={submissions}
            value={submission}
            onChange={(_e, v) => chooseSubmission(v)}
            getOptionLabel={(o) => `${o.articleNumber ? `${o.articleNumber} - ` : ""}${o.title}`}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, o) => {
              const { key, ...rest } = props as React.HTMLAttributes<HTMLLIElement> & { key: string };
              return (
                <li key={key} {...rest}>
                  <Box sx={{ minWidth: 0, ...wrapSx }}>
                    <Typography variant="body2">{o.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[o.articleNumber, o.authorName, o.email].filter(Boolean).join(" | ")}
                    </Typography>
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField {...params} label="Link to a submission (optional)" placeholder="Search by title" />
            )}
          />
          <TextField
            label="Description"
            required
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDescTouched(true);
            }}
            multiline
            minRows={2}
            inputProps={{ maxLength: kind === "QR" ? 250 : 2048 }}
            helperText="Shown to the payer on the Razorpay page and on the QR card"
          />
          <Divider textAlign="left">
            <Typography variant="caption" color="text.secondary">
              Customer (optional)
            </Typography>
          </Divider>
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
            <TextField
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              fullWidth
            />
          </Stack>
          <TextField
            select
            label="Expiry"
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value) as 0 | 1 | 7 | 30)}
          >
            {EXPIRY_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </TextField>
          <FormControl>
            <FormLabel>Collect via</FormLabel>
            <RadioGroup value={kind} onChange={(e) => setKind(e.target.value as "LINK" | "QR")}>
              <FormControlLabel
                value="LINK"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      Payment Link
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      UPI, cards, netbanking, wallets - shared as a link and a QR of the link
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", mb: 1, "& .MuiRadio-root": { pt: 0.5 } }}
              />
              <FormControlLabel
                value="QR"
                control={<Radio />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      UPI QR code
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Single-use, fixed-amount QR for any UPI app (needs QR Codes enabled on Razorpay)
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 0.5 } }}
              />
            </RadioGroup>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        <Box sx={{ flexGrow: 1, pl: 1 }}>
          <RazorpayMark height={14} label="Secured by" />
        </Box>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} disabled={saving || !amountValid}>
          {saving ? "Creating..." : `Create${amountValid ? ` ${formatInr(Math.round(amountNum * 100))}` : ""} request`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function QrDialog({
  req,
  onClose,
  onCopy,
  onDownload,
  onWhatsApp,
  onEmail,
  onNativeShare,
  downloading,
}: {
  req: PaymentRequest | null;
  onClose: () => void;
  onCopy: (p: PaymentRequest) => void;
  onDownload: (p: PaymentRequest) => void;
  onWhatsApp: (p: PaymentRequest) => void;
  onEmail: (p: PaymentRequest) => void;
  onNativeShare?: (p: PaymentRequest) => void;
  downloading: boolean;
}) {
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => setLoaded(false), [req?.id]);
  const status = req ? displayStatus(req) : "CREATED";
  const pending = status === "CREATED";

  return (
    <Dialog open={!!req} onClose={onClose} maxWidth="xs" fullWidth scroll="body">
      {req && (
        <>
          <Box sx={{ bgcolor: "primary.main", color: "white", px: 3, py: 2, borderBottom: "4px solid #d4a017" }}>
            <Typography variant="h6" lineHeight={1.1}>
              IJAAC
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85, ...wrapSx }}>
              {JOURNAL_NAME}
            </Typography>
          </Box>
          <DialogContent sx={{ textAlign: "center", pt: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Amount payable
            </Typography>
            <Typography variant="h4" color="primary" fontWeight={700} sx={{ fontFamily: "inherit" }}>
              {formatInr(req.amountInPaise)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, mb: 2, ...wrapSx }}>
              {req.description}
            </Typography>
            {!pending && (
              <Chip
                label={STATUS_CHIP[status].label}
                color={STATUS_CHIP[status].color}
                sx={{ mb: 2, maxWidth: "100%" }}
              />
            )}
            <Box
              sx={{
                position: "relative",
                mx: "auto",
                width: "100%",
                maxWidth: 320,
                aspectRatio: req.kind === "LINK" ? "1 / 1" : undefined,
                minHeight: req.kind === "QR" && !loaded ? 320 : undefined,
                border: "1px solid",
                borderColor: "divider",
                p: 1,
                bgcolor: "white",
                opacity: pending ? 1 : 0.35,
              }}
            >
              {!loaded && (
                <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
                  <CircularProgress size={28} />
                </Box>
              )}
              <Box
                component="img"
                src={`/api/payments/${req.id}/qr`}
                alt="Payment QR code"
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}
                sx={{ display: "block", width: "100%", height: req.kind === "LINK" ? "100%" : "auto", objectFit: "contain" }}
              />
            </Box>
            <Typography variant="body2" fontWeight={600} sx={{ mt: 2 }}>
              {req.kind === "LINK" ? "Scan to pay - UPI, cards, netbanking, wallets" : "Scan with any UPI app to pay"}
            </Typography>
            {req.shortUrl && (
              <Typography
                component="a"
                href={req.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                color="primary"
                sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.5, wordBreak: "break-all", maxWidth: "100%" }}
              >
                {req.shortUrl}
                <OpenInNewIcon sx={{ fontSize: 14, flexShrink: 0 }} />
              </Typography>
            )}
            {req.expiresAt && (
              <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 1 }}>
                Valid until {fmtDate(req.expiresAt)}
              </Typography>
            )}
            <Box sx={{ mt: 2 }}>
              <RazorpayMark height={18} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ flexWrap: "wrap", gap: 1, justifyContent: "center", px: 2, pb: 2 }}>
            <Button size="small" startIcon={<ContentCopyIcon />} onClick={() => onCopy(req)}>
              Copy link
            </Button>
            <Button
              size="small"
              startIcon={downloading ? <CircularProgress size={14} /> : <DownloadIcon />}
              onClick={() => onDownload(req)}
              disabled={downloading}
            >
              Download
            </Button>
            {pending && (
              <>
                <Button size="small" startIcon={<WhatsAppIcon />} onClick={() => onWhatsApp(req)}>
                  WhatsApp
                </Button>
                <Button size="small" startIcon={<EmailIcon />} onClick={() => onEmail(req)}>
                  Email
                </Button>
                {onNativeShare && (
                  <Button size="small" startIcon={<IosShareIcon />} onClick={() => onNativeShare(req)}>
                    Share
                  </Button>
                )}
              </>
            )}
            <Button size="small" variant="contained" onClick={onClose}>
              Done
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}

function EmailDialog({ req, onClose }: { req: PaymentRequest | null; onClose: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [to, setTo] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (req) setTo(req.customer.email ?? "");
  }, [req]);

  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim());

  const send = async () => {
    if (!req || !valid) return;
    setSending(true);
    try {
      const res = await fetch(`/api/payments/${req.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim() }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, "Could not send the email"));
      enqueueSnackbar(`Payment request emailed to ${to.trim()}`, { variant: "success" });
      onClose();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not send the email", { variant: "error" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={!!req} onClose={sending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Email payment request</DialogTitle>
      <DialogContent>
        {req && (
          <DialogContentText sx={{ mb: 2, ...wrapSx }}>
            {formatInr(req.amountInPaise)} - {req.description}. The email includes the{" "}
            {req.kind === "LINK" ? "payment link and " : ""}QR code.
          </DialogContentText>
        )}
        <TextField
          label="Recipient email"
          type="email"
          fullWidth
          autoFocus
          value={to}
          onChange={(e) => setTo(e.target.value)}
          error={to !== "" && !valid}
          helperText={to !== "" && !valid ? "Enter a valid email address" : " "}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button variant="contained" startIcon={<EmailIcon />} onClick={send} disabled={!valid || sending}>
          {sending ? "Sending..." : "Send"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
