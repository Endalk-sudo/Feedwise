import { S3Client } from '@aws-sdk/client-s3';

import { env } from '@/lib/env.js';

/**
 * S3-compatible object storage client (AWS S3, MinIO, R2, etc.).
 * The endpoint + path style come from env so any S3-compatible
 * provider works without code changes.
 */
export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
  },
});
