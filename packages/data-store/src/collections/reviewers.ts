import { randomUUID } from "node:crypto";
import type { Reviewer } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "reviewers";

export async function listReviewers(options?: { activeOnly?: boolean }): Promise<Reviewer[]> {
  const items = await readCollection<Reviewer>(COLLECTION);
  const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
  return options?.activeOnly ? sorted.filter((r) => r.isActive) : sorted;
}

export async function getReviewer(id: string): Promise<Reviewer | null> {
  const items = await readCollection<Reviewer>(COLLECTION);
  return items.find((r) => r.id === id) ?? null;
}

export type NewReviewerInput = Omit<
  Reviewer,
  "id" | "createdAt" | "updatedAt" | "isActive" | "displayOrder" | "areasOfInterest"
> & {
  isActive?: boolean;
  displayOrder?: number;
  areasOfInterest?: string[];
};

export async function createReviewer(input: NewReviewerInput): Promise<Reviewer> {
  const now = new Date().toISOString();
  const record: Reviewer = {
    ...input,
    areasOfInterest: input.areasOfInterest ?? [],
    isActive: input.isActive ?? true,
    displayOrder: input.displayOrder ?? 0,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await updateCollection<Reviewer>(COLLECTION, (items) => [...items, record]);
  return record;
}

export async function updateReviewer(
  id: string,
  patch: Partial<NewReviewerInput>
): Promise<Reviewer> {
  let updated: Reviewer | undefined;
  await updateCollection<Reviewer>(COLLECTION, (items) =>
    items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    })
  );
  if (!updated) throw new Error(`Reviewer not found: ${id}`);
  return updated;
}

export async function deleteReviewer(id: string): Promise<void> {
  await updateCollection<Reviewer>(COLLECTION, (items) => items.filter((r) => r.id !== id));
}
