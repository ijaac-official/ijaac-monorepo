import {
  getObjectText,
  PreconditionFailedError,
  putObjectText,
  S3_PREFIXES,
} from "@ijaac/aws";

function collectionKey(name: string): string {
  return `${S3_PREFIXES.data}${name}.json`;
}

interface RawCollection<T> {
  items: T[];
  etag?: string;
}

async function readRaw<T>(name: string): Promise<RawCollection<T>> {
  const res = await getObjectText(collectionKey(name));
  if (!res) return { items: [] };
  const items = res.body.trim() ? (JSON.parse(res.body) as T[]) : [];
  return { items, etag: res.etag };
}

/** Reads a whole collection (JSON array). Returns [] if it does not exist yet. */
export async function readCollection<T>(name: string): Promise<T[]> {
  const { items } = await readRaw<T>(name);
  return items;
}

const MAX_RETRIES = 5;

/**
 * Safe read-modify-write for a collection, guarded by S3's conditional-write
 * (ETag) support so two concurrent admin actions can't silently clobber one
 * another. On a conflict it re-reads the latest version, re-runs `mutate`,
 * and retries (up to MAX_RETRIES times) - so `mutate` must be a pure
 * function of the current items, safe to re-run.
 */
export async function updateCollection<T>(
  name: string,
  mutate: (items: T[]) => T[] | Promise<T[]>
): Promise<T[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { items, etag } = await readRaw<T>(name);
    const nextItems = await mutate(items);
    try {
      await putObjectText(collectionKey(name), JSON.stringify(nextItems, null, 2), {
        ifMatchEtag: etag,
        ifNoneExists: !etag,
      });
      return nextItems;
    } catch (err) {
      if (err instanceof PreconditionFailedError) {
        lastError = err;
        continue; // someone else wrote in between - retry with fresh data
      }
      throw err;
    }
  }
  throw lastError ?? new Error(`Failed to update collection "${name}" after retries`);
}
