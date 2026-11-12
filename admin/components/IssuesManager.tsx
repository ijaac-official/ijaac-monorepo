"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Issue } from "@ijaac/shared";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import ImageUploadField from "./ImageUploadField";

type FormState = {
  id?: string;
  volume: string;
  number: string;
  year: string;
  title: string;
  description: string;
  coverImageUrl: string;
};

const EMPTY: FormState = {
  volume: "",
  number: "",
  year: String(new Date().getFullYear()),
  title: "",
  description: "",
  coverImageUrl: "",
};

export default function IssuesManager({ initialIssues }: { initialIssues: Issue[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (issue: Issue) => {
    setForm({
      id: issue.id,
      volume: issue.volume,
      number: issue.number,
      year: String(issue.year),
      title: issue.title ?? "",
      description: issue.description ?? "",
      coverImageUrl: issue.coverImageUrl ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      volume: form.volume,
      number: form.number,
      year: Number(form.year),
      title: form.title || undefined,
      description: form.description || undefined,
      coverImageUrl: form.coverImageUrl || undefined,
    };
    try {
      const res = await fetch(form.id ? `/api/issues/${form.id}` : "/api/issues", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setOpen(false);
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
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Issue
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cover</TableCell>
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
              <TableRow key={issue.id} hover>
                <TableCell>
                  <Avatar variant="rounded" src={issue.coverImageUrl} sx={{ width: 40, height: 56 }} />
                </TableCell>
                <TableCell>
                  <Link href={`/issues/${issue.id}`} style={{ color: "inherit", textDecoration: "none", fontWeight: 500 }}>
                    {issue.title ?? `Vol. ${issue.volume}, Issue ${issue.number}`}
                  </Link>
                </TableCell>
                <TableCell>{issue.volume}</TableCell>
                <TableCell>{issue.number}</TableCell>
                <TableCell>{issue.year}</TableCell>
                <TableCell>
                  {issue.isCurrent && <Chip label="Current" color="primary" size="small" />}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(issue)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
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
        <DialogTitle>{form.id ? "Edit Issue" : "Add Issue"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Volume" value={form.volume} onChange={(e) => setForm({ ...form, volume: e.target.value })} fullWidth />
              <TextField label="Issue Number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} fullWidth />
              <TextField label="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} fullWidth />
            </Stack>
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <ImageUploadField
              label="Issue Cover"
              value={form.coverImageUrl}
              onChange={(url) => setForm({ ...form, coverImageUrl: url })}
              folder="issues"
              variant="rect"
            />
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
