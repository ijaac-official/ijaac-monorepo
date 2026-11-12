import { randomUUID } from "node:crypto";
import type { AdminUser } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "admin-users";

export const OTP_MAX_ATTEMPTS = 5;

const sameEmail = (u: AdminUser, email: string) => u.email.toLowerCase() === email.trim().toLowerCase();

export async function listAdminUsers(): Promise<AdminUser[]> {
  return readCollection<AdminUser>(COLLECTION);
}

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const items = await readCollection<AdminUser>(COLLECTION);
  return items.find((u) => sameEmail(u, email)) ?? null;
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const items = await readCollection<AdminUser>(COLLECTION);
  return items.find((u) => u.id === id) ?? null;
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  role: AdminUser["role"];
}): Promise<AdminUser> {
  const now = new Date().toISOString();
  const record: AdminUser = {
    ...input,
    email: input.email.trim().toLowerCase(),
    isActive: true,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await updateCollection<AdminUser>(COLLECTION, (items) => [...items, record]);
  return record;
}

export type IssueOtpResult = { ok: true; user: AdminUser } | { ok: false; reason: "unknown" | "cooldown" };

/**
 * Stores a new login code hash for an active admin, unless one was sent less
 * than `cooldownMs` ago. `hashFor` turns the user id into the stored hash so
 * the raw code never reaches this layer.
 */
export async function issueLoginOtp(
  email: string,
  hashFor: (userId: string) => string,
  ttlMs: number,
  cooldownMs: number
): Promise<IssueOtpResult> {
  let result: IssueOtpResult = { ok: false, reason: "unknown" };
  await updateCollection<AdminUser>(COLLECTION, (items) => {
    // mutate may re-run on a write conflict - never carry a result over
    result = { ok: false, reason: "unknown" };
    return items.map((u) => {
      if (!sameEmail(u, email) || !u.isActive) return u;
      const now = Date.now();
      if (u.loginOtp && now - Date.parse(u.loginOtp.sentAt) < cooldownMs) {
        result = { ok: false, reason: "cooldown" };
        return u;
      }
      const updated: AdminUser = {
        ...u,
        loginOtp: {
          hash: hashFor(u.id),
          sentAt: new Date(now).toISOString(),
          expiresAt: new Date(now + ttlMs).toISOString(),
          attempts: 0,
        },
        updatedAt: new Date(now).toISOString(),
      };
      result = { ok: true, user: updated };
      return updated;
    });
  });
  return result;
}

/**
 * Checks a login code and consumes it on success. Every wrong guess counts,
 * and the code is discarded after OTP_MAX_ATTEMPTS failures or expiry, so a
 * 6-digit code can't be brute-forced.
 */
export async function consumeLoginOtp(
  email: string,
  matches: (user: AdminUser, storedHash: string) => boolean
): Promise<AdminUser | null> {
  let signedIn: AdminUser | null = null;
  await updateCollection<AdminUser>(COLLECTION, (items) => {
    signedIn = null;
    return items.map((u) => {
      if (!sameEmail(u, email) || !u.isActive || !u.loginOtp) return u;
      const now = new Date().toISOString();

      if (Date.parse(u.loginOtp.expiresAt) < Date.now()) {
        return { ...u, loginOtp: undefined, updatedAt: now };
      }
      if (matches(u, u.loginOtp.hash)) {
        const updated = { ...u, loginOtp: undefined, lastLoginAt: now, updatedAt: now };
        signedIn = updated;
        return updated;
      }
      const attempts = u.loginOtp.attempts + 1;
      return {
        ...u,
        loginOtp: attempts >= OTP_MAX_ATTEMPTS ? undefined : { ...u.loginOtp, attempts },
        updatedAt: now,
      };
    });
  });
  return signedIn;
}
