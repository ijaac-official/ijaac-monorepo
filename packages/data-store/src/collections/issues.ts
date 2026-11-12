import { randomUUID } from "node:crypto";
import type { Issue } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "issues";

export async function listIssues(): Promise<Issue[]> {
  const items = await readCollection<Issue>(COLLECTION);
  return [...items].sort((a, b) => b.year - a.year || b.number.localeCompare(a.number));
}

export async function getCurrentIssue(): Promise<Issue | null> {
  const items = await readCollection<Issue>(COLLECTION);
  return items.find((i) => i.isCurrent) ?? null;
}

export async function getIssue(id: string): Promise<Issue | null> {
  const items = await readCollection<Issue>(COLLECTION);
  return items.find((i) => i.id === id) ?? null;
}

export type NewIssueInput = Omit<Issue, "id" | "createdAt" | "isCurrent"> & {
  isCurrent?: boolean;
};

export async function createIssue(input: NewIssueInput): Promise<Issue> {
  const now = new Date().toISOString();
  const record: Issue = {
    ...input,
    isCurrent: input.isCurrent ?? false,
    id: randomUUID(),
    createdAt: now,
  };
  await updateCollection<Issue>(COLLECTION, (items) => {
    const next = record.isCurrent ? items.map((i) => ({ ...i, isCurrent: false })) : items;
    return [...next, record];
  });
  return record;
}

export async function setCurrentIssue(id: string): Promise<void> {
  await updateCollection<Issue>(COLLECTION, (items) =>
    items.map((i) => ({ ...i, isCurrent: i.id === id }))
  );
}

export async function updateIssue(
  id: string,
  patch: Partial<Omit<Issue, "id" | "createdAt" | "isCurrent">>
): Promise<Issue> {
  let updated: Issue | undefined;
  await updateCollection<Issue>(COLLECTION, (items) =>
    items.map((i) => {
      if (i.id !== id) return i;
      updated = { ...i, ...patch };
      return updated;
    })
  );
  if (!updated) throw new Error(`Issue not found: ${id}`);
  return updated;
}
