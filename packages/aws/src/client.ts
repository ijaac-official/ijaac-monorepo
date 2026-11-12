import { S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (client) return client;

  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION is not set");
  }

  client = new S3Client({
    region,
    // Falls back to the default AWS credential provider chain (env vars,
    // shared config, instance/role credentials) when these are unset.
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
    // Only set for local development against an S3-compatible mock
    // (e.g. s3rver) - leave AWS_S3_ENDPOINT unset to use real AWS S3.
    endpoint: process.env.AWS_S3_ENDPOINT || undefined,
    forcePathStyle: process.env.AWS_S3_ENDPOINT ? true : undefined,
  });

  return client;
}

export function getBucketName(): string {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("AWS_S3_BUCKET is not set");
  }
  return bucket;
}

// ---------------------------------------------------------------------------
// Key prefixes. Keep all of these under one bucket, split by access level:
//  - data/**                 private JSON "database" (see @ijaac/data-store)
//  - submissions/**          private manuscript + published-paper files
//  - public/**               public-read assets (book covers, people photos)
//
// Bucket policy needed (replace BUCKET_NAME):
// {
//   "Version": "2012-10-17",
//   "Statement": [{
//     "Sid": "PublicReadForPublicPrefix",
//     "Effect": "Allow",
//     "Principal": "*",
//     "Action": "s3:GetObject",
//     "Resource": "arn:aws:s3:::BUCKET_NAME/public/*"
//   }]
// }
// Also disable "Block all public access" -> "Block public access to
// buckets and objects granted through new public bucket or access point
// policies" (keep ACL-based blocking on; this uses a bucket policy, not ACLs).
// ---------------------------------------------------------------------------
export const S3_PREFIXES = {
  data: "data/",
  manuscripts: "submissions/manuscripts/",
  published: "submissions/published/",
  publicAssets: "public/",
  /** Public copies of published papers, for Google Scholar / public indexing */
  publicPapers: "public/papers/",
} as const;
