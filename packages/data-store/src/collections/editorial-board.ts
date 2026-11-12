import { randomUUID } from "node:crypto";
import type { EditorialBoardMember } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "editorial-board";

export async function listEditorialBoard(options?: {
  activeOnly?: boolean;
}): Promise<EditorialBoardMember[]> {
  const items = await readCollection<EditorialBoardMember>(COLLECTION);
  const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
  return options?.activeOnly ? sorted.filter((m) => m.isActive) : sorted;
}

export async function getEditorialBoardMember(
  id: string
): Promise<EditorialBoardMember | null> {
  const items = await readCollection<EditorialBoardMember>(COLLECTION);
  return items.find((m) => m.id === id) ?? null;
}

export type NewEditorialBoardMemberInput = Omit<
  EditorialBoardMember,
  "id" | "createdAt" | "updatedAt" | "isActive" | "displayOrder"
> & {
  isActive?: boolean;
  displayOrder?: number;
};

export async function createEditorialBoardMember(
  input: NewEditorialBoardMemberInput
): Promise<EditorialBoardMember> {
  const now = new Date().toISOString();
  const record: EditorialBoardMember = {
    ...input,
    isActive: input.isActive ?? true,
    displayOrder: input.displayOrder ?? 0,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await updateCollection<EditorialBoardMember>(COLLECTION, (items) => [...items, record]);
  return record;
}

export async function updateEditorialBoardMember(
  id: string,
  patch: Partial<NewEditorialBoardMemberInput>
): Promise<EditorialBoardMember> {
  let updated: EditorialBoardMember | undefined;
  await updateCollection<EditorialBoardMember>(COLLECTION, (items) =>
    items.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    })
  );
  if (!updated) throw new Error(`Editorial board member not found: ${id}`);
  return updated;
}

export async function deleteEditorialBoardMember(id: string): Promise<void> {
  await updateCollection<EditorialBoardMember>(COLLECTION, (items) =>
    items.filter((m) => m.id !== id)
  );
}
