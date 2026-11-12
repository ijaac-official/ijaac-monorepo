import { DEFAULT_PLATFORM_SETTINGS, type PlatformSettings } from "@ijaac/shared";
import { readSingleton, updateSingleton } from "../json-store";

const DOC = "settings";

export async function getSettings(): Promise<PlatformSettings> {
  return readSingleton<PlatformSettings>(DOC, DEFAULT_PLATFORM_SETTINGS);
}

export async function updateSettings(patch: Partial<PlatformSettings>): Promise<PlatformSettings> {
  return updateSingleton<PlatformSettings>(DOC, DEFAULT_PLATFORM_SETTINGS, (current) => ({
    ...current,
    ...patch,
  }));
}
