import { randomUUID } from "node:crypto";
import { isApprovedReviewer } from "@ijaac/shared";
import type { EditorialBoardMember, Reviewer, ReviewerApplicationInput, ReviewerStatus } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "reviewers";

/**
 * activeOnly = what the public site shows: approved AND active.
 * status filters by registration state (legacy records count as APPROVED).
 */
export async function listReviewers(options?: {
  activeOnly?: boolean;
  status?: ReviewerStatus;
}): Promise<Reviewer[]> {
  const items = await readCollection<Reviewer>(COLLECTION);
  let sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
  if (options?.activeOnly) sorted = sorted.filter((r) => r.isActive && isApprovedReviewer(r));
  if (options?.status) sorted = sorted.filter((r) => (r.status ?? "APPROVED") === options.status);
  return sorted;
}

const DEFAULT_PHOTO = "https://placehold.co/400x400/7a1f2b/ffffff?text=Reviewer";

/** Public "Become a Reviewer" application - stored as PENDING + inactive until an admin approves. */
export async function createReviewerApplication(
  input: ReviewerApplicationInput
): Promise<{ ok: true; reviewer: Reviewer } | { ok: false; reason: string }> {
  const email = input.email.trim().toLowerCase();
  const now = new Date().toISOString();
  let result: { ok: true; reviewer: Reviewer } | { ok: false; reason: string } = {
    ok: false,
    reason: "Could not save application",
  };
  await updateCollection<Reviewer>(COLLECTION, (items) => {
    const dup = items.find((r) => r.email?.toLowerCase() === email && r.status !== "REJECTED");
    if (dup) {
      result = { ok: false, reason: "An application or reviewer profile with this email already exists" };
      return items;
    }
    const record: Reviewer = {
      id: randomUUID(),
      name: input.name,
      email,
      phone: input.phone,
      designation: input.designation,
      affiliation: input.affiliation,
      country: input.country,
      qualification: input.qualification,
      experienceYears: input.experienceYears,
      areasOfInterest: input.areasOfInterest,
      bio: input.bio,
      linkedinUrl: input.linkedinUrl || undefined,
      orcid: input.orcid || undefined,
      motivation: input.motivation,
      photoUrl: input.photoUrl || DEFAULT_PHOTO,
      status: "PENDING",
      isActive: false,
      displayOrder: 999,
      appliedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    result = { ok: true, reviewer: record };
    return [...items, record];
  });
  return result;
}

export async function setReviewerStatus(id: string, status: ReviewerStatus): Promise<Reviewer> {
  return updateReviewer(id, {
    status,
    isActive: status === "APPROVED",
    ...(status === "APPROVED" ? { approvedAt: new Date().toISOString() } : {}),
  });
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

/**
 * Creates an approved, active reviewer profile from an editorial board member.
 * Idempotent: if a reviewer already exists for this member (same source id or
 * same email) it is approved/activated and returned instead of duplicated.
 */
export async function promoteBoardMemberToReviewer(
  member: EditorialBoardMember
): Promise<{ reviewer: Reviewer; created: boolean }> {
  const email = member.email?.trim().toLowerCase();
  const now = new Date().toISOString();
  let result: { reviewer: Reviewer; created: boolean } | undefined;
  await updateCollection<Reviewer>(COLLECTION, (items) => {
    result = undefined;
    const existing = items.find(
      (r) => r.sourceBoardMemberId === member.id || (!!email && r.email?.toLowerCase() === email)
    );
    if (existing) {
      const updated: Reviewer = {
        ...existing,
        status: "APPROVED",
        isActive: true,
        approvedAt: existing.approvedAt ?? now,
        sourceBoardMemberId: existing.sourceBoardMemberId ?? member.id,
        updatedAt: now,
      };
      result = { reviewer: updated, created: false };
      return items.map((r) => (r.id === existing.id ? updated : r));
    }
    const record: Reviewer = {
      id: randomUUID(),
      name: member.name,
      designation: member.designation,
      affiliation: member.affiliation,
      country: member.country,
      photoUrl: member.photoUrl,
      bio: member.bio,
      email: email || undefined,
      linkedinUrl: member.linkedinUrl,
      areasOfInterest: [],
      displayOrder: member.displayOrder ?? 0,
      isActive: true,
      status: "APPROVED",
      approvedAt: now,
      sourceBoardMemberId: member.id,
      createdAt: now,
      updatedAt: now,
    };
    result = { reviewer: record, created: true };
    return [...items, record];
  });
  return result!;
}
