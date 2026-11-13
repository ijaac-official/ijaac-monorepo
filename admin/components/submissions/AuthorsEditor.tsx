"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import type { SubmissionAuthor } from "@ijaac/shared";

export type AuthorDraft = {
  name: string;
  email: string;
  affiliation: string;
  isCorresponding: boolean;
};

export const EMPTY_AUTHOR: AuthorDraft = { name: "", email: "", affiliation: "", isCorresponding: false };

export function toAuthorDrafts(authors: SubmissionAuthor[]): AuthorDraft[] {
  return authors.map((a) => ({
    name: a.name,
    email: a.email,
    affiliation: a.affiliation ?? "",
    isCorresponding: !!a.isCorresponding,
  }));
}

export function fromAuthorDrafts(drafts: AuthorDraft[]): SubmissionAuthor[] {
  return drafts.map((a) => ({
    name: a.name.trim(),
    email: a.email.trim(),
    affiliation: a.affiliation.trim() || undefined,
    isCorresponding: a.isCorresponding || undefined,
  }));
}

export default function AuthorsEditor({
  value,
  onChange,
  onCorrespondingChange,
}: {
  value: AuthorDraft[];
  onChange: (next: AuthorDraft[]) => void;
  /** Called with the author's email when an author is marked corresponding */
  onCorrespondingChange?: (email: string) => void;
}) {
  const update = (index: number, patch: Partial<AuthorDraft>) => {
    onChange(value.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  };

  const setCorresponding = (index: number, checked: boolean) => {
    onChange(value.map((a, i) => ({ ...a, isCorresponding: i === index ? checked : checked ? false : a.isCorresponding })));
    if (checked && value[index]?.email) onCorrespondingChange?.(value[index].email.trim());
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const remove = (index: number) => onChange(value.filter((_, i) => i !== index));

  return (
    <Stack spacing={1.5}>
      {value.map((author, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="body2" fontWeight={600}>
              Author {index + 1}
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Tooltip title="Move up">
                <span>
                  <IconButton size="small" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Move down">
                <span>
                  <IconButton size="small" disabled={index === value.length - 1} onClick={() => move(index, 1)}>
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Remove author">
                <span>
                  <IconButton size="small" color="error" disabled={value.length <= 1} onClick={() => remove(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                size="small"
                fullWidth
                required
                value={author.name}
                onChange={(e) => update(index, { name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                size="small"
                fullWidth
                required
                value={author.email}
                onChange={(e) => update(index, { email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Affiliation"
                size="small"
                fullWidth
                value={author.affiliation}
                onChange={(e) => update(index, { affiliation: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={author.isCorresponding}
                    onChange={(e) => setCorresponding(index, e.target.checked)}
                  />
                }
                label="Corresponding"
              />
            </Grid>
          </Grid>
        </Paper>
      ))}
      <Button startIcon={<AddIcon />} onClick={() => onChange([...value, { ...EMPTY_AUTHOR }])} sx={{ alignSelf: "flex-start" }}>
        Add Author
      </Button>
    </Stack>
  );
}
