import { randomUUID } from "node:crypto";
import type { PaymentRequest } from "@ijaac/shared";
import { readCollection, updateCollection } from "../json-store";

const COLLECTION = "payment-requests";

export async function listPaymentRequests(): Promise<PaymentRequest[]> {
  const items = await readCollection<PaymentRequest>(COLLECTION);
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPaymentRequest(id: string): Promise<PaymentRequest | null> {
  const items = await readCollection<PaymentRequest>(COLLECTION);
  return items.find((p) => p.id === id) ?? null;
}

export type NewPaymentRequestInput = Omit<PaymentRequest, "id" | "createdAt" | "updatedAt">;

export async function createPaymentRequest(input: NewPaymentRequestInput): Promise<PaymentRequest> {
  const now = new Date().toISOString();
  const record: PaymentRequest = { ...input, id: randomUUID(), createdAt: now, updatedAt: now };
  await updateCollection<PaymentRequest>(COLLECTION, (items) => [...items, record]);
  return record;
}

export async function updatePaymentRequest(
  id: string,
  patch: Partial<Pick<PaymentRequest, "status" | "paidAt" | "paymentIds" | "expiresAt">>
): Promise<PaymentRequest> {
  let updated: PaymentRequest | undefined;
  await updateCollection<PaymentRequest>(COLLECTION, (items) => {
    updated = undefined;
    return items.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    });
  });
  if (!updated) throw new Error(`Payment request not found: ${id}`);
  return updated;
}
