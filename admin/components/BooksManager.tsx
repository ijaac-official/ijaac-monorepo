"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Book } from "@ijaac/shared";
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
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import ImageUploadField from "./ImageUploadField";

type FormState = {
  id?: string;
  title: string;
  authors: string;
  description: string;
  coverImageUrl: string;
  purchaseLink: string;
  isbn: string;
  publisher: string;
  publishedYear: string;
  category: string;
  featured: boolean;
};

const EMPTY: FormState = {
  title: "",
  authors: "",
  description: "",
  coverImageUrl: "https://placehold.co/400x600?text=Book+Cover",
  purchaseLink: "https://www.amazon.in/",
  isbn: "",
  publisher: "",
  publishedYear: "",
  category: "",
  featured: false,
};

export default function BooksManager({ initialBooks }: { initialBooks: Book[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  const openCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };

  const openEdit = (book: Book) => {
    setForm({
      id: book.id,
      title: book.title,
      authors: book.authors.join(", "),
      description: book.description,
      coverImageUrl: book.coverImageUrl,
      purchaseLink: book.purchaseLink,
      isbn: book.isbn ?? "",
      publisher: book.publisher ?? "",
      publishedYear: book.publishedYear ? String(book.publishedYear) : "",
      category: book.category ?? "",
      featured: book.featured,
    });
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      title: form.title,
      authors: form.authors.split(",").map((a) => a.trim()).filter(Boolean),
      description: form.description,
      coverImageUrl: form.coverImageUrl,
      purchaseLink: form.purchaseLink,
      isbn: form.isbn || undefined,
      publisher: form.publisher || undefined,
      publishedYear: form.publishedYear ? Number(form.publishedYear) : undefined,
      category: form.category || undefined,
      featured: form.featured,
    };
    try {
      const res = await fetch(form.id ? `/api/books/${form.id}` : "/api/books", {
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
    if (!confirm("Delete this book?")) return;
    await fetch(`/api/books/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Book
        </Button>
      </Stack>

      <Paper variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Cover</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Authors</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialBooks.map((book) => (
              <TableRow key={book.id}>
                <TableCell>
                  <Avatar variant="rounded" src={book.coverImageUrl} sx={{ width: 40, height: 56 }} />
                </TableCell>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.authors.join(", ")}</TableCell>
                <TableCell>{book.category}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => openEdit(book)} size="small">
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => remove(book.id)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {initialBooks.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            No books yet.
          </Typography>
        )}
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? "Edit Book" : "Add Book"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Authors (comma-separated)"
              value={form.authors}
              onChange={(e) => setForm({ ...form, authors: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <ImageUploadField
              label="Cover Image"
              value={form.coverImageUrl}
              onChange={(url) => setForm({ ...form, coverImageUrl: url })}
              folder="books"
              variant="rect"
            />
            <TextField
              label="Purchase Link (Amazon, etc.)"
              value={form.purchaseLink}
              onChange={(e) => setForm({ ...form, purchaseLink: e.target.value })}
              fullWidth
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Publisher"
                value={form.publisher}
                onChange={(e) => setForm({ ...form, publisher: e.target.value })}
                fullWidth
              />
              <TextField
                label="Published Year"
                value={form.publishedYear}
                onChange={(e) => setForm({ ...form, publishedYear: e.target.value })}
                fullWidth
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="ISBN"
                value={form.isbn}
                onChange={(e) => setForm({ ...form, isbn: e.target.value })}
                fullWidth
              />
              <TextField
                label="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                fullWidth
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={form.featured}
                  onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                />
              }
              label="Featured on homepage"
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
