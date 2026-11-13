import type { JournalSettings } from "@ijaac/shared";
import { readSingleton, updateSingleton } from "../json-store";

const NAME = "settings";

/** Default book publication fee when neither settings.json nor BOOK_FEE_INR is set: Rs 4,999. */
export const DEFAULT_BOOK_FEE_PAISE = 499900;
/** Default paper submission fee when neither settings.json nor SUBMISSION_FEE_INR is set: Rs 1,200. */
export const DEFAULT_PAPER_FEE_PAISE = 120000;

function envPaise(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Math.round(Number(raw) * 100);
  return Number.isFinite(n) && n >= 100 ? n : fallback;
}

const validFee = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 100;

/** Env-based fallbacks, used until an admin saves the Fees & Charges page. */
export function defaultSettings(): JournalSettings {
  return {
    paperFeeInPaise: envPaise("SUBMISSION_FEE_INR", DEFAULT_PAPER_FEE_PAISE),
    bookFeeInPaise: envPaise("BOOK_FEE_INR", DEFAULT_BOOK_FEE_PAISE),
    currency: "INR",
    updatedAt: new Date(0).toISOString(),
  };
}

/** Live fees. Any missing/invalid stored value falls back to the env default for that fee. */
export async function getSettings(): Promise<JournalSettings> {
  const defaults = defaultSettings();
  const stored = await readSingleton<Partial<JournalSettings> | null>(NAME, null);
  if (!stored) return defaults;
  return {
    paperFeeInPaise: validFee(stored.paperFeeInPaise) ? stored.paperFeeInPaise : defaults.paperFeeInPaise,
    bookFeeInPaise: validFee(stored.bookFeeInPaise) ? stored.bookFeeInPaise : defaults.bookFeeInPaise,
    currency: "INR",
    updatedAt: stored.updatedAt ?? defaults.updatedAt,
    updatedById: stored.updatedById,
  };
}

/** Same as getSettings, but never throws (public pages) - falls back to env defaults on S3 errors. */
export async function getSettingsSafe(): Promise<JournalSettings> {
  try {
    return await getSettings();
  } catch (err) {
    console.error("Could not read settings, using defaults", err);
    return defaultSettings();
  }
}

export async function updateSettings(
  patch: Partial<Pick<JournalSettings, "paperFeeInPaise" | "bookFeeInPaise">> & { updatedById?: string }
): Promise<JournalSettings> {
  for (const v of [patch.paperFeeInPaise, patch.bookFeeInPaise]) {
    if (v !== undefined && !validFee(v)) throw new Error("Fees must be whole paise amounts of at least Rs 1");
  }
  const defaults = defaultSettings();
  let next: JournalSettings = defaults;
  await updateSingleton<Partial<JournalSettings> | null>(NAME, null, (current) => {
    const base = current ?? {};
    next = {
      paperFeeInPaise:
        patch.paperFeeInPaise ?? (validFee(base.paperFeeInPaise) ? base.paperFeeInPaise : defaults.paperFeeInPaise),
      bookFeeInPaise:
        patch.bookFeeInPaise ?? (validFee(base.bookFeeInPaise) ? base.bookFeeInPaise : defaults.bookFeeInPaise),
      currency: "INR",
      updatedAt: new Date().toISOString(),
      updatedById: patch.updatedById ?? base.updatedById,
    };
    return next;
  });
  return next;
}
