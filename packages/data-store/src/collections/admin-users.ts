import { randomUUID } from "node:crypto";
import type { AdminUser } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "admin-users";

export async function listAdminUsers(): Promise<AdminUser[]> {
  return readCollection<AdminUser>(COLLECTION);
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const items = await readCollection<AdminUser>(COLLECTION);
  return items.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const items = await readCollection<AdminUser>(COLLECTION);
  return items.find((u) => u.id === id) ?? null;
}

export type NewAdminUserInput = Omit<
  AdminUser,
  "id" | "createdAt" | "updatedAt" | "isActive" | "lastLoginAt" | "twoFactorEnabled"
> & { isActive?: boolean; twoFactorEnabled?: boolean };

/** `passwordHash` must already be a bcrypt hash - hash it at the call site. */
export async function createAdminUser(input: NewAdminUserInput): Promise<AdminUser> {
  const now = new Date().toISOString();
  const record: AdminUser = {
    ...input,
    isActive: input.isActive ?? true,
    twoFactorEnabled: input.twoFactorEnabled ?? false,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await updateCollection<AdminUser>(COLLECTION, (items) => [...items, record]);
  return record;
}

export async function touchLastLogin(id: string): Promise<void> {
  await updateCollection<AdminUser>(COLLECTION, (items) =>
    items.map((u) =>
      u.id === id ? { ...u, lastLoginAt: new Date().toISOString() } : u
    )
  );
}

export async function updateAdminUser(
  id: string,
  patch: Partial<Pick<AdminUser, "totpSecret" | "twoFactorEnabled" | "name" | "passwordHash" | "isActive">>
): Promise<AdminUser> {
  let updated: AdminUser | undefined;
  await updateCollection<AdminUser>(COLLECTION, (items) =>
    items.map((u) => {
      if (u.id !== id) return u;
      updated = { ...u, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    })
  );
  if (!updated) throw new Error(`Admin user not found: ${id}`);
  return updated;
}
