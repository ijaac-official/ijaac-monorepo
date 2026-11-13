"use client";

import { FILTER_KEYS, type FilterValues } from "./meta";
export { FILTER_KEYS, type FilterValues };

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import type { Issue } from "@ijaac/shared";
import { issueLabel } from "./meta";

const DEBOUNCE_MS = 350;

export default function SubmissionFilters({
  initial,
  issues,
  resultCount,
  totalCount,
}: {
  initial: FilterValues;
  issues: Issue[];
  resultCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [values, setValues] = React.useState<FilterValues>(initial);
  const [pending, startTransition] = React.useTransition();

  const apply = React.useCallback(
    (next: FilterValues) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of FILTER_KEYS) {
        const v = next[key].trim();
        if (v) params.set(key, v);
        else params.delete(key);
      }
      const qs = params.toString();
      if (qs === searchParams.toString()) return;
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router, searchParams]
  );

  // Text inputs are debounced; everything else applies immediately.
  React.useEffect(() => {
    const t = setTimeout(() => apply(values), DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.q, values.author]);

  const setNow = (key: keyof FilterValues, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    apply(next);
  };

  const hasFilters = FILTER_KEYS.some((k) => values[k].trim() !== "") || !!searchParams.get("status");

  const clear = () => {
    const empty: FilterValues = { q: "", author: "", issue: "", visibility: "", paid: "", from: "", to: "" };
    setValues(empty);
    startTransition(() => router.replace(pathname, { scroll: false }));
  };

  return (
    <>
      <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
        <Grid item xs={12} md={5}>
          <TextField
            value={values.q}
            onChange={(e) => setValues({ ...values, q: e.target.value })}
            placeholder="Search title, abstract, keywords, authors, affiliation, article no."
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            value={values.author}
            onChange={(e) => setValues({ ...values, author: e.target.value })}
            label="Author name or email"
            size="small"
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            select
            label="Issue"
            size="small"
            fullWidth
            value={values.issue}
            onChange={(e) => setNow("issue", e.target.value)}
          >
            <MenuItem value="">All issues</MenuItem>
            {issues.map((i) => (
              <MenuItem key={i.id} value={i.id}>
                {issueLabel(i)}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            select
            label="Visibility"
            size="small"
            fullWidth
            value={values.visibility}
            onChange={(e) => setNow("visibility", e.target.value)}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            select
            label="Payment"
            size="small"
            fullWidth
            value={values.paid}
            onChange={(e) => setNow("paid", e.target.value)}
          >
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="waived">Waived / none</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            type="date"
            label="Submitted from"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={values.from}
            onChange={(e) => setNow("from", e.target.value)}
          />
        </Grid>
        <Grid item xs={6} sm={3} md={2}>
          <TextField
            type="date"
            label="Submitted to"
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={values.to}
            onChange={(e) => setNow("to", e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Stack direction="row" alignItems="center" justifyContent={{ xs: "space-between", md: "flex-end" }} spacing={2} sx={{ height: "100%" }}>
            <Typography variant="body2" color="text.secondary">
              {resultCount === totalCount
                ? `${resultCount} submission${resultCount === 1 ? "" : "s"}`
                : `${resultCount} of ${totalCount} submissions`}
            </Typography>
            <Button size="small" startIcon={<ClearIcon />} onClick={clear} disabled={!hasFilters}>
              Clear filters
            </Button>
          </Stack>
        </Grid>
      </Grid>
      <LinearProgress sx={{ mb: 1, visibility: pending ? "visible" : "hidden" }} />
    </>
  );
}
