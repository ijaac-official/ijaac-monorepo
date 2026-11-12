import { randomUUID } from "node:crypto";
import type { ContactMessage } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "contact-messages";

export async function listContactMessages(): Promise<ContactMessage[]> {
  const items = await readCollection<ContactMessage>(COLLECTION);
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export type NewContactMessageInput = Omit<ContactMessage, "id" | "createdAt">;

export async function createContactMessage(
  input: NewContactMessageInput
): Promise<ContactMessage> {
  const record: ContactMessage = {
    ...input,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
  };
  await updateCollection<ContactMessage>(COLLECTION, (items) => [...items, record]);
  return record;
}
