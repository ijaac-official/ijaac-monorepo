"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { BoardRole, EditorialBoardMember } from "@ijaac/shared";
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
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import EditIcon from "@mui/icons-material/Edit";
import ImageUploadField from "./ImageUploadField";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import { useSnackbar } from "notistack";

const ROLES: BoardRole[] = ["EDITOR_IN_CHIEF", "ASSOCIATE_EDITOR", "MEMBER", "ADVISORY_BOARD"];

type FormState = {
  id?: string;
  name: string;
  designation: string;
  department: string;
  affiliation: string;
  qualification: string;
  qualificationInstitution: string;
  specialization: string;
  address: string;
  country: string;
  photoUrl: string;
  bio: string;
  email: string;
  linkedinUrl: string;
  role: BoardRole;
  displayOrder: string;
  isActive: boolean;
};

const EMPTY: FormState = {
  name: "",
  designation: "",
  department: "",
  affiliation: "",
  qualification: "",
  qualificationInstitution: "",
  specialization: "",
  address: "",
  country: "",
  photoUrl: "https://placehold.co/300x300?text=Board+Member",
  bio: "",
  email: "",
  linkedinUrl: "",
  role: "MEMBER",
  displayOrder: "0",
  isActive: true,
};

export default function EditorialBoardManager({
  initialMembers,
  reviewerMemberIds = [],
}: {
  initialMembers: EditorialBoardMember[];
  /** Board member ids that already have an approved reviewer profile */
  reviewerMemberIds?: string[];
}) {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();
  const [promoting, setPromoting] = React.useState<string | null>(null);
  const reviewerSet = React.useMemo(() => new Set(reviewerMemberIds), [reviewerMemberIds]);

  const promote = async (m: EditorialBoardMember) => {
    setPromoting(m.id);
    try {
      const res = await fetch(`/api/editorial-board/${m.id}/promote`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof body?.error === "string" ? body.error : "Could not promote");
      enqueueSnackbar(
        body.created
          ? `${m.name} is now also a reviewer - add their areas of expertise on the Reviewers page`
          : `${m.name} already had a reviewer profile - it is now approved and active`,
        { variant: "success" }
      );
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Could not promote", { variant: "error" });
    } finally {
      setPromoting(null);
    }
  };
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (m: EditorialBoardMember) => {
    setForm({
      id: m.id,
      name: m.name,
      designation: m.designation ?? "",
      department: m.department ?? "",
      affiliation: m.affiliation ?? "",
      qualification: m.qualification ?? "",
      qualificationInstitution: m.qualificationInstitution ?? "",
      specialization: m.specialization ?? "",
      address: m.address ?? "",
      country: m.country ?? "",
      photoUrl: m.photoUrl,
      bio: m.bio ?? "",
      email: m.email ?? "",
      linkedinUrl: m.linkedinUrl ?? "",
      role: m.role,
      displayOrder: String(m.displayOrder),
      isActive: m.isActive,
    });
    setOpen(true);
  };

  const addressError = form.address.trim().length > 0 && form.address.trim().length < 10;

  const save = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar("Name is required", { variant: "error" });
      return;
    }
    if (form.address.trim().length < 10) {
      enqueueSnackbar("Full address is required", { variant: "error" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      designation: form.designation.trim() || undefined,
      department: form.department.trim() || undefined,
      affiliation: form.affiliation.trim() || undefined,
      qualification: form.qualification.trim() || undefined,
      qualificationInstitution: form.qualificationInstitution.trim() || undefined,
      specialization: form.specialization.trim() || undefined,
      address: form.address.trim(),
      country: form.country.trim() || undefined,
      photoUrl: form.photoUrl,
      bio: form.bio || undefined,
      email: form.email.trim() || undefined,
      linkedinUrl: form.linkedinUrl.trim() || undefined,
      role: form.role,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.isActive,
    };
    try {
      const res = await fetch(form.id ? `/api/editorial-board/${form.id}` : "/api/editorial-board", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const fieldErrors = body?.error?.fieldErrors as Record<string, string[]> | undefined;
        const first = fieldErrors && Object.entries(fieldErrors)[0];
        throw new Error(first ? `${first[0]}: ${first[1][0]}` : "Save failed");
      }
      enqueueSnackbar(form.id ? "Board member updated" : "Board member added", { variant: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      enqueueSnackbar(err instanceof Error ? err.message : "Save failed", { variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this board member?")) return;
    await fetch(`/api/editorial-board/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Board Member
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Photo</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialMembers.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Avatar src={m.photoUrl} sx={{ width: 40, height: 40 }} />
                </TableCell>
                <TableCell>
                  {m.name}
                  {reviewerSet.has(m.id) && (
                    <Chip label="Reviewer" size="small" color="success" variant="outlined" sx={{ ml: 1 }} />
                  )}
                  {!m.address && (
                    <Chip label="Address needed" size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />
                  )}
                </TableCell>
                <TableCell>{m.role.replace(/_/g, " ")}</TableCell>
                <TableCell>{m.isActive ? "Yes" : "No"}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                  {!reviewerSet.has(m.id) && (
                    <Tooltip title="Also make reviewer">
                      <span>
                        <IconButton
                          onClick={() => promote(m)}
                          size="small"
                          disabled={promoting === m.id}
                          aria-label={`Make ${m.name} a reviewer`}
                        >
                          <HowToRegIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                  <IconButton onClick={() => openEdit(m)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => remove(m.id)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {initialMembers.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No editorial board members yet.
          </Typography>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? "Edit Board Member" : "Add Board Member"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as BoardRole })}
              fullWidth
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r.replace(/_/g, " ")}
                </MenuItem>
              ))}
            </TextField>
            <Typography variant="overline" color="text.secondary" sx={{ mb: -1 }}>
              Current position
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g. Professor & Head" fullWidth />
              <TextField label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Department of Advanced Computing" fullWidth />
            </Stack>
            <TextField
              label="Affiliation (Institution, City)"
              value={form.affiliation}
              onChange={(e) => setForm({ ...form, affiliation: e.target.value })}
              placeholder="e.g. Sage University, Indore"
              helperText="Shown under the name on the card"
              fullWidth
            />
            <Typography variant="overline" color="text.secondary" sx={{ mb: -1 }}>
              Qualification
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField label="Qualification" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. Doctor of Engineering (Ph.D.)" fullWidth />
              <TextField label="Awarded by (University, Country)" value={form.qualificationInstitution} onChange={(e) => setForm({ ...form, qualificationInstitution: e.target.value })} placeholder="e.g. Lamar University, USA" fullWidth />
            </Stack>
            <TextField label="Specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} placeholder="e.g. Brain-Computer Interface" fullWidth />
            <Typography variant="overline" color="text.secondary" sx={{ mb: -1 }}>
              Contact
            </Typography>
            <TextField
              label="Address"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              error={addressError}
              helperText={addressError ? "Enter the full address" : "Full postal address with city, state and PIN code"}
              multiline
              minRows={2}
              fullWidth
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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
              folder="editorial-board"
              variant="circle"
            />
            <TextField label="Bio (shown in full on the detailed profile)" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} multiline minRows={4} fullWidth />
            <TextField label="Display Order" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} fullWidth />
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />}
              label="Active (shown on public site)"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving || !form.name.trim() || form.address.trim().length < 10}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
