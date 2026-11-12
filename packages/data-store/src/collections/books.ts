import { randomUUID } from "node:crypto";
import type { Book } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "books";

export async function listBooks(): Promise<Book[]> {
  const items = await readCollection<Book>(COLLECTION);
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getBook(id: string): Promise<Book | null> {
  const items = await readCollection<Book>(COLLECTION);
  return items.find((b) => b.id === id) ?? null;
}

export type NewBookInput = Omit<Book, "id" | "createdAt" | "updatedAt" | "featured"> & {
  featured?: boolean;
};

export async function createBook(input: NewBookInput): Promise<Book> {
  const now = new Date().toISOString();
  const record: Book = { ...input, featured: input.featured ?? false, id: randomUUID(), createdAt: now, updatedAt: now };
  await updateCollection<Book>(COLLECTION, (items) => [...items, record]);
  return record;
}

export async function updateBook(id: string, patch: Partial<NewBookInput>): Promise<Book> {
  let updated: Book | undefined;
  await updateCollection<Book>(COLLECTION, (items) =>
    items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    })
  );
  if (!updated) throw new Error(`Book not found: ${id}`);
  return updated;
}

export async function deleteBook(id: string): Promise<void> {
  await updateCollection<Book>(COLLECTION, (items) => items.filter((b) => b.id !== id));
}
