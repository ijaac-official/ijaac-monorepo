import type { SiteStats } from "@ijaac/shared";
import { readSingleton, updateSingleton } from "../json-store";

const NAME = "site-stats";
const EMPTY: SiteStats = { visits: 0, updatedAt: new Date(0).toISOString() };

export async function getSiteStats(): Promise<SiteStats> {
  return readSingleton<SiteStats>(NAME, EMPTY);
}

/** +1 visit. Callers should only count one per browser session (cookie-gated). */
export async function incrementVisits(): Promise<SiteStats> {
  let next: SiteStats = EMPTY;
  await updateSingleton<SiteStats>(NAME, EMPTY, (current) => {
    next = { visits: (current?.visits ?? 0) + 1, updatedAt: new Date().toISOString() };
    return next;
  });
  return next;
}
