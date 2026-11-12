"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Reviewer } from "@ijaac/shared";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import Paper from "@mui/material/Paper";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import ImageUploadField from "./ImageUploadField";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";

type FormState = {
  id?: string;
  name: string;
  designation: string;
  affiliation: string;
  country: string;
  photoUrl: string;
  bio: string;
  email: string;
  linkedinUrl: string;
  areasOfInterest: string;
  displayOrder: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  name: "",
  designation: "",
  affiliation: "",
  country: "",
  photoUrl: "https://placehold.co/300x300?text=Reviewer",
  bio: "",
  email: "",
  linkedinUrl: "",
  areasOfInterest: "",
  displayOrder: "0",
  isActive: true,
};

export default function ReviewersManager({ initialReviewers }: { initialReviewers: Reviewer[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (r: Reviewer) => {
    setForm({
      id: r.id,
      name: r.name,
      designation: r.designation ?? "",
      affiliation: r.affiliation ?? "",
      country: r.country ?? "",
      photoUrl: r.photoUrl,
      bio: r.bio ?? "",
      email: r.email ?? "",
      linkedinUrl: r.linkedinUrl ?? "",
      areasOfInterest: r.areasOfInterest.join(", "),
      displayOrder: String(r.displayOrder),
      isActive: r.isActive,
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      name: form.name,
      designation: form.designation || undefined,
      affiliation: form.affiliation || undefined,
      country: form.country || undefined,
      photoUrl: form.photoUrl,
      bio: form.bio || undefined,
      email: form.email || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
      areasOfInterest: form.areasOfInterest.split(",").map((a) => a.trim()).filter(Boolean),
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
    };
    try {
      const res = await fetch(form.id ? `/api/reviewers/${form.id}` : "/api/reviewers", {
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

  const remove = async (id: string) => {
    if (!confirm("Delete this reviewer?")) return;
    await fetch(`/api/reviewers/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Reviewer
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Affiliation</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialReviewers.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Avatar src={r.photoUrl} sx={{ width: 40, height: 40 }} />
                </TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.affiliation}</TableCell>
                <TableCell>{r.isActive ? "Yes" : "No"}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(r)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => remove(r.id)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {initialReviewers.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No reviewers yet.
          </Typography>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? "Edit Reviewer" : "Add Reviewer"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <Stack direction="row" spacing={2}>
              <TextField label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} fullWidth />
              <TextField label="Affiliation" value={form.affiliation} onChange={(e) => setForm({ ...form, affiliation: e.target.value })} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} fullWidth />
              <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
            </Stack>
            <TextField
              label="LinkedIn URL"
              value={form.linkedinUrl}
              onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })}
              placeholder="https://www.linkedin.com/in/..."
              fullWidth
            />
            <ImageUploadField
              label="Photo"
              value={form.photoUrl}
              onChange={(url) => setForm({ ...form, photoUrl: url })}
              folder="reviewers"
              variant="circle"
            />
            <TextField label="Bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} multiline rows={3} fullWidth />
            <TextField
              label="Areas of Interest (comma-separated)"
              value={form.areasOfInterest}
              onChange={(e) => setForm({ ...form, areasOfInterest: e.target.value })}
              fullWidth
            />
            <TextField label="Display Order" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} fullWidth />
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label="Active (shown on public site)"
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
