"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Issue } from "@ijaac/shared";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";

type FormState = {
  volume: string;
  number: string;
  year: string;
  title: string;
};

const EMPTY: FormState = { volume: "", number: "", year: String(new Date().getFullYear()), title: "" };

export default function IssuesManager({ initialIssues }: { initialIssues: Issue[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volume: form.volume,
          number: form.number,
          year: Number(form.year),
          title: form.title || undefined,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setOpen(false);
      setForm(EMPTY);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const setCurrent = async (id: string) => {
    await fetch(`/api/issues/${id}/set-current`, { method: "POST" });
    router.refresh();
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Issue
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Volume</TableCell>
              <TableCell>Issue No.</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>{issue.title ?? "-"}</TableCell>
                <TableCell>{issue.volume}</TableCell>
                <TableCell>{issue.number}</TableCell>
                <TableCell>{issue.year}</TableCell>
                <TableCell>
                  {issue.isCurrent && <Chip label="Current" color="primary" size="small" />}
                </TableCell>
                <TableCell align="right">
                  {!issue.isCurrent && (
                    <Button size="small" onClick={() => setCurrent(issue.id)}>
                      Set as Current
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {initialIssues.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No issues yet.
          </Typography>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Issue</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Volume" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} fullWidth />
              <TextField label="Issue Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} fullWidth />
              <TextField label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} fullWidth />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
