import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  type PutObjectCommandInput,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getBucketName, getS3Client } from "./client";

export class ObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`S3 object not found: ${key}`);
    this.name = "ObjectNotFoundError";
  }
}

export class PreconditionFailedError extends Error {
  constructor(key: string) {
    super(`S3 conditional write failed (stale ETag): ${key}`);
    this.name = "PreconditionFailedError";
  }
}

export interface GetObjectResult {
  body: string;
  etag: string;
}

/** Reads a text object from S3. Returns null if it does not exist. */
export async function getObjectText(key: string): Promise<GetObjectResult | null> {
  const client = getS3Client();
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: getBucketName(), Key: key })
    );
    const body = await res.Body?.transformToString("utf-8");
    return { body: body ?? "", etag: (res.ETag ?? "").replace(/"/g, "") };
  } catch (err: unknown) {
    if (isNoSuchKey(err)) return null;
    throw err;
  }
}

export interface PutTextOptions {
  contentType?: string;
  /** Pass the ETag you last read to require no concurrent change (update). */
  ifMatchEtag?: string;
  /** Pass true to require the object does NOT already exist (create). */
  ifNoneExists?: boolean;
  isPublic?: boolean;
}

/** Writes a text object to S3, optionally with optimistic-locking conditions. */
export async function putObjectText(
  key: string,
  body: string,
  options: PutTextOptions = {}
): Promise<{ etag: string }> {
  const client = getS3Client();
  const input: PutObjectCommandInput = {
    Bucket: getBucketName(),
    Key: key,
    Body: body,
    ContentType: options.contentType ?? "application/json; charset=utf-8",
  };
  if (options.ifMatchEtag) input.IfMatch = `"${options.ifMatchEtag}"`;
  if (options.ifNoneExists) input.IfNoneMatch = "*";

  try {
    const res = await client.send(new PutObjectCommand(input));
    return { etag: (res.ETag ?? "").replace(/"/g, "") };
  } catch (err: unknown) {
    if (isPreconditionFailed(err)) throw new PreconditionFailedError(key);
    throw err;
  }
}

export async function putObjectBuffer(
  key: string,
  body: Buffer,
  contentType: string
): Promise<{ etag: string }> {
  const client = getS3Client();
  const res = await client.send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return { etag: (res.ETag ?? "").replace(/"/g, "") };
}

/** Reads a binary object from S3 (manuscripts for email attachments, etc). Null if missing. */
export async function getObjectBuffer(key: string): Promise<Buffer | null> {
  const client = getS3Client();
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: getBucketName(), Key: key })
    );
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch (err: unknown) {
    if (isNoSuchKey(err)) return null;
    throw err;
  }
}

/** Copies an object within the bucket - used to publish a private file to the public/ prefix. */
export async function copyObject(sourceKey: string, destinationKey: string): Promise<void> {
  const client = getS3Client();
  const bucket = getBucketName();
  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      Key: destinationKey,
      // Encode each path segment but keep "/" separators literal, or the
      // key gets mangled into "%2F" and CopyObject fails with NoSuchKey.
      CopySource: `${bucket}/${sourceKey.split("/").map(encodeURIComponent).join("/")}`,
    })
  );
}

export async function deleteObject(key: string): Promise<void> {
  const client = getS3Client();
  await client.send(new DeleteObjectCommand({ Bucket: getBucketName(), Key: key }));
}

/** Short-lived signed URL for a private object (e.g. manuscript review in admin). */
export async function presignGetUrl(key: string, expiresInSeconds = 900): Promise<string> {
  const client = getS3Client();
  const command = new GetObjectCommand({ Bucket: getBucketName(), Key: key });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Short-lived signed URL the browser can PUT a file to directly (bypasses the
 * ~4.5 MB serverless request-body limit). The browser must send exactly
 * `contentType` as its Content-Type header, since it is part of the signature.
 * Requires bucket CORS to allow PUT from the site origins.
 */
export async function presignPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600
): Promise<string> {
  const client = getS3Client();
  const command = new PutObjectCommand({ Bucket: getBucketName(), Key: key, ContentType: contentType });
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export interface ObjectHead {
  size: number;
  contentType?: string;
}

/** HeadObject - size and type of an object, or null if it does not exist. */
export async function headObject(key: string): Promise<ObjectHead | null> {
  const client = getS3Client();
  try {
    const res = await client.send(new HeadObjectCommand({ Bucket: getBucketName(), Key: key }));
    return { size: Number(res.ContentLength ?? 0), contentType: res.ContentType };
  } catch (err: unknown) {
    if (isNoSuchKey(err) || (err as { name?: string } | undefined)?.name === "NotFound") return null;
    throw err;
  }
}

/** Ranged GET of the first `length` bytes (magic-byte checks). Null if the object is missing. */
export async function getObjectHead(key: string, length = 1024): Promise<Uint8Array | null> {
  const client = getS3Client();
  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: getBucketName(), Key: key, Range: `bytes=0-${Math.max(0, length - 1)}` })
    );
    const bytes = await res.Body?.transformToByteArray();
    return bytes ?? new Uint8Array();
  } catch (err: unknown) {
    if (isNoSuchKey(err)) return null;
    throw err;
  }
}

/** Streams an object (large-file download proxies). Null if the object is missing. */
export async function getObjectStream(
  key: string
): Promise<{ stream: ReadableStream; contentLength?: number; contentType?: string } | null> {
  const client = getS3Client();
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: getBucketName(), Key: key }));
    if (!res.Body) return null;
    return {
      stream: res.Body.transformToWebStream() as ReadableStream,
      contentLength: res.ContentLength != null ? Number(res.ContentLength) : undefined,
      contentType: res.ContentType,
    };
  } catch (err: unknown) {
    if (isNoSuchKey(err)) return null;
    throw err;
  }
}

/** Direct URL for objects under the public/ prefix (served via bucket policy or CDN). */
export function publicUrl(key: string): string {
  const base = process.env.AWS_S3_PUBLIC_BASE_URL;
  if (base) return `${base.replace(/\/$/, "")}/${key}`;
  return `https://${getBucketName()}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

function isNoSuchKey(err: unknown): boolean {
  return (
    !!err &&
    typeof err === "object" &&
    ("name" in err ? (err as { name?: string }).name === "NoSuchKey" : false) ||
    (err as { Code?: string } | undefined)?.Code === "NoSuchKey" ||
    (err as { $metadata?: { httpStatusCode?: number } } | undefined)?.$metadata
      ?.httpStatusCode === 404
  );
}

function isPreconditionFailed(err: unknown): boolean {
  const status = (err as { $metadata?: { httpStatusCode?: number } } | undefined)?.$metadata
    ?.httpStatusCode;
  return status === 412;
}
