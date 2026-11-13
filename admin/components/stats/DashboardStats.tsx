"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatInr, type SubmissionStatus } from "@ijaac/shared";
import { useSnackbar } from "notistack";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RemoveIcon from "@mui/icons-material/Remove";
import { addDays, istDate, type StatsBucket, type StatsKpis, type StatsResponse } from "./types";

// Validated categorical palette (lightness band, chroma, CVD + normal-vision separation, 3:1 contrast).
const SERIES = {
  submitted: { label: "Submitted", color: "#2b72c4" },
  published: { label: "Published", color: "#b8860b" },
  approved: { label: "Approved", color: "#1e9468" },
  rejected: { label: "Rejected", color: "#9c3347" },
} as const;
type SeriesKey = keyof typeof SERIES;

const STATUS_META: Record<SubmissionStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "#9aa0a6" },
  UNDER_REVIEW: { label: "Under Review", color: "#2b72c4" },
  APPROVED: { label: "Approved", color: "#1e9468" },
  PUBLISHED: { label: "Published", color: "#b8860b" },
  REJECTED: { label: "Rejected", color: "#9c3347" },
};

const REVENUE_COLOR = "#7a1f2b";
const GRID = "#e7e3df";
const AXIS = "#6b6b6b";

type Preset = "7d" | "28d" | "90d" | "custom" | "all";
const PRESET_DAYS: Record<"7d" | "28d" | "90d", number> = { "7d": 7, "28d": 28, "90d": 90 };

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatBucket(key: string, bucket: StatsBucket): string {
  const [y, m, d] = key.split("-").map(Number);
  return bucket === "day" ? `${d} ${MONTHS_SHORT[m - 1]}` : `${MONTHS_SHORT[m - 1]} ${y}`;
}

function formatRangeDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

function compactInr(paise: number): string {
  const r = paise / 100;
  if (r >= 1e7) return `₹${(r / 1e7).toFixed(1).replace(/\.0$/, "")}Cr`;
  if (r >= 1e5) return `₹${(r / 1e5).toFixed(1).replace(/\.0$/, "")}L`;
  if (r >= 1e3) return `₹${(r / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  return `₹${Math.round(r)}`;
}

type Tile = {
  key: keyof StatsKpis;
  label: string;
  format?: (n: number) => string;
  /** Which direction counts as good; "neutral" shows the change without judgement. */
  good: "up" | "down" | "neutral";
  accent: string;
};

const TILES: Tile[] = [
  { key: "published", label: "Published Papers", good: "up", accent: "#b8860b" },
  { key: "revenuePaise", label: "Revenue", format: formatInr, good: "up", accent: "#7a1f2b" },
  { key: "approved", label: "Approved", good: "up", accent: "#1e9468" },
  { key: "rejected", label: "Rejected", good: "neutral", accent: "#9c3347" },
  { key: "submissions", label: "Total Submissions", good: "up", accent: "#2b72c4" },
  { key: "pendingOrReview", label: "Pending / Under Review", good: "neutral", accent: "#9aa0a6" },
  { key: "couponsUsed", label: "Coupons Used", good: "neutral", accent: "#d4a017" },
];

function Delta({ current, previous, good }: { current: number; previous: number; good: Tile["good"] }) {
  const diff = current - previous;
  const pct = previous === 0 ? (current === 0 ? 0 : null) : (diff / previous) * 100;
  const Icon = diff > 0 ? ArrowUpwardIcon : diff < 0 ? ArrowDownwardIcon : RemoveIcon;
  const tone =
    diff === 0 || good === "neutral"
      ? "text.secondary"
      : (diff > 0) === (good === "up")
        ? "success.main"
        : "error.main";
  const text = diff === 0 ? "No change" : pct === null ? "New" : `${Math.abs(pct).toFixed(pct !== null && Math.abs(pct) < 10 ? 1 : 0)}%`;
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: tone, mt: 0.5 }}>
      <Icon sx={{ fontSize: 14 }} aria-hidden />
      <Typography variant="caption" fontWeight={600} sx={{ color: tone }}>
        {text}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        vs previous
      </Typography>
    </Stack>
  );
}

function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

const tooltipStyle = {
  contentStyle: { borderRadius: 0, border: "1px solid #ddd", fontSize: 13 },
  labelStyle: { fontWeight: 600, color: "#222" },
  itemStyle: { color: "#333" },
};

export default function DashboardStats({ initial, initialPreset = "28d" }: { initial: StatsResponse; initialPreset?: Preset }) {
  const { enqueueSnackbar } = useSnackbar();
  const [data, setData] = React.useState<StatsResponse>(initial);
  const [preset, setPreset] = React.useState<Preset>(initialPreset);
  const [loading, setLoading] = React.useState(false);
  const [view, setView] = React.useState<"chart" | "table">("chart");
  const [monthly, setMonthly] = React.useState(initial.range.bucket === "month");
  const [customFrom, setCustomFrom] = React.useState(initial.range.from);
  const [customTo, setCustomTo] = React.useState(initial.range.to);
  const abortRef = React.useRef<AbortController | null>(null);

  const load = React.useCallback(
    async (params: { from?: string; to?: string; bucket?: StatsBucket }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const qs = new URLSearchParams();
        if (params.from) qs.set("from", params.from);
        if (params.to) qs.set("to", params.to);
        if (params.bucket) qs.set("bucket", params.bucket);
        const res = await fetch(`/api/stats?${qs.toString()}`, { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error("Could not load stats");
        const body = (await res.json()) as StatsResponse;
        setData(body);
        setMonthly(body.range.bucket === "month");
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        enqueueSnackbar(err instanceof Error ? err.message : "Could not load stats", { variant: "error" });
      } finally {
        if (abortRef.current === controller) setLoading(false);
      }
    },
    [enqueueSnackbar]
  );

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const presetRange = (p: Preset): { from?: string; to?: string } => {
    const today = istDate(Date.now());
    if (p === "all") return {};
    if (p === "custom") return { from: customFrom, to: customTo };
    return { from: addDays(today, -(PRESET_DAYS[p] - 1)), to: today };
  };

  const choosePreset = (p: Preset | null) => {
    if (!p) return;
    setPreset(p);
    if (p === "custom") {
      // Seed the custom inputs from the current range; wait for "Apply".
      setCustomFrom(data.range.from);
      setCustomTo(data.range.to);
      return;
    }
    void load(presetRange(p));
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) {
      enqueueSnackbar("Pick both dates", { variant: "warning" });
      return;
    }
    if (customFrom > customTo) {
      enqueueSnackbar("Start date must be on or before end date", { variant: "warning" });
      return;
    }
    void load({ from: customFrom, to: customTo });
  };

  const toggleMonthly = (next: boolean) => {
    setMonthly(next);
    const base = data.range.allTime ? {} : { from: data.range.from, to: data.range.to };
    void load({ ...base, bucket: next ? "month" : "day" });
  };

  const { range, kpis, previous, series, statusBreakdown } = data;
  const bucket = range.bucket;
  const chartData = series.map((p) => ({ ...p, label: formatBucket(p.key, bucket), revenue: p.revenuePaise }));
  const statusData = statusBreakdown.filter((s) => s.count > 0).map((s) => ({ ...s, ...STATUS_META[s.status] }));
  const statusTotal = statusData.reduce((a, s) => a + s.count, 0);
  const rangeLabel = range.allTime
    ? `All time (since ${formatRangeDate(range.from)})`
    : `${formatRangeDate(range.from)} - ${formatRangeDate(range.to)}`;
  const canDaily = !range.allTime && range.days <= 731;
  const tickInterval = chartData.length > 16 ? Math.ceil(chartData.length / 12) - 1 : 0;

  return (
    <Box sx={{ position: "relative", mb: 4 }}>
      {/* Filters: one row above the charts */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} flexWrap="wrap" useFlexGap>
          <ToggleButtonGroup size="small" exclusive value={preset} onChange={(_e, v) => choosePreset(v)} aria-label="Date range">
            <ToggleButton value="7d">7 days</ToggleButton>
            <ToggleButton value="28d">28 days</ToggleButton>
            <ToggleButton value="90d">90 days</ToggleButton>
            <ToggleButton value="custom">Custom</ToggleButton>
            <ToggleButton value="all">All time</ToggleButton>
          </ToggleButtonGroup>
          {preset === "custom" && (
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                type="date"
                label="From"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: customTo || undefined }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: customFrom || undefined }}
              />
              <Button variant="contained" size="small" onClick={applyCustom} disabled={loading}>
                Apply
              </Button>
            </Stack>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {rangeLabel}
        </Typography>
      </Stack>

      <Box sx={{ height: 4, mb: 1 }}>{loading && <LinearProgress aria-label="Loading stats" />}</Box>

      {/* KPI tiles */}
      <Grid container spacing={2} sx={{ mb: 3, opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
        {TILES.map((tile) => {
          const value = kpis[tile.key];
          return (
            <Grid item xs={12} sm={6} md={4} lg={12 / 7} key={tile.key}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  height: "100%",
                  borderTop: `3px solid ${tile.accent}`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 2 },
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {tile.label}
                </Typography>
                <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
                  {tile.format ? tile.format(value) : value.toLocaleString("en-IN")}
                </Typography>
                {previous && <Delta current={value} previous={previous[tile.key]} good={tile.good} />}
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Grid container spacing={2} sx={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.2s" }}>
        <Grid item xs={12} lg={8}>
          <ChartCard
            title={monthly ? "Monthly activity" : "Daily activity"}
            subtitle="Submitted, published, approved and rejected papers"
            action={
              <Stack direction="row" spacing={1}>
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={monthly ? "month" : "day"}
                  onChange={(_e, v) => v && toggleMonthly(v === "month")}
                  aria-label="Bucket"
                >
                  <ToggleButton value="day" disabled={!canDaily}>
                    Daily
                  </ToggleButton>
                  <ToggleButton value="month">Monthly</ToggleButton>
                </ToggleButtonGroup>
                <ToggleButtonGroup size="small" exclusive value={view} onChange={(_e, v) => v && setView(v)} aria-label="View">
                  <ToggleButton value="chart">Chart</ToggleButton>
                  <ToggleButton value="table">Table</ToggleButton>
                </ToggleButtonGroup>
              </Stack>
            }
          >
            {view === "chart" ? (
              <Box sx={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                    <CartesianGrid stroke={GRID} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={tickInterval} minTickGap={8} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: AXIS }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip {...tooltipStyle} cursor={{ stroke: "#bbb", strokeDasharray: "3 3" }} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 8 }} iconType="plainline" />
                    {(Object.keys(SERIES) as SeriesKey[]).map((key) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={SERIES[key].label}
                        stroke={SERIES[key].color}
                        strokeWidth={2}
                        dot={chartData.length <= 31 ? { r: 3, strokeWidth: 0, fill: SERIES[key].color } : false}
                        activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: 300 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>{monthly ? "Month" : "Day"}</TableCell>
                      {(Object.keys(SERIES) as SeriesKey[]).map((k) => (
                        <TableCell key={k} align="right">
                          {SERIES[k].label}
                        </TableCell>
                      ))}
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...chartData].reverse().map((row) => (
                      <TableRow key={row.key} hover>
                        <TableCell>{row.label}</TableCell>
                        {(Object.keys(SERIES) as SeriesKey[]).map((k) => (
                          <TableCell key={k} align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                            {row[k]}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                          {formatInr(row.revenuePaise)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </ChartCard>
        </Grid>

        <Grid item xs={12} lg={4}>
          <ChartCard title="Status breakdown" subtitle="Current status of papers submitted in this range">
            {statusTotal === 0 ? (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: "center" }}>
                No submissions in this range.
              </Typography>
            ) : (
              <>
                <Box sx={{ width: "100%", height: 200, position: "relative" }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={statusData}
                        dataKey="count"
                        nameKey="label"
                        innerRadius="62%"
                        outerRadius="90%"
                        paddingAngle={statusData.length > 1 ? 2 : 0}
                        stroke="#fff"
                        strokeWidth={2}
                        isAnimationActive={false}
                      >
                        {statusData.map((s) => (
                          <Cell key={s.status} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} (${Math.round((v / statusTotal) * 100)}%)`, "Papers"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pointerEvents: "none",
                    }}
                  >
                    <Typography variant="h5" fontWeight={700}>
                      {statusTotal}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      papers
                    </Typography>
                  </Box>
                </Box>
                <Stack spacing={0.75} sx={{ mt: 2 }}>
                  {statusData.map((s) => (
                    <Stack key={s.status} direction="row" alignItems="center" spacing={1}>
                      <Box sx={{ width: 10, height: 10, bgcolor: s.color, flexShrink: 0 }} />
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {s.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {s.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ width: 36, textAlign: "right" }}>
                        {Math.round((s.count / statusTotal) * 100)}%
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </>
            )}
          </ChartCard>
        </Grid>

        <Grid item xs={12}>
          <ChartCard title="Revenue" subtitle={`Submission fees received (by payment date), total ${formatInr(kpis.revenuePaise)}`}>
            <Box sx={{ width: "100%", height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="20%">
                  <CartesianGrid stroke={GRID} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: AXIS }} tickLine={false} axisLine={{ stroke: GRID }} interval={tickInterval} minTickGap={8} />
                  <YAxis tickFormatter={compactInr} tick={{ fontSize: 12, fill: AXIS }} tickLine={false} axisLine={false} width={56} />
                  <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(122,31,43,0.06)" }} formatter={(v: number) => [formatInr(v), "Revenue"]} />
                  <Bar dataKey="revenue" name="Revenue" fill={REVENUE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
}
