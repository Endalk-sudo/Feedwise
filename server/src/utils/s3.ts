import { randomUUID } from 'node:crypto';

import { DeleteObjectCommand, PutObjectCommand, type ObjectCannedACL } from '@aws-sdk/client-s3';

import { s3 } from '@/config/s3.js';
import { env } from '@/lib/env.js';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/** Build a unique object key, e.g. `organizations/<orgId>/<uuid>.png`. */
export function buildObjectKey(folder: string, mimetype: string): string {
  const ext = MIME_EXTENSIONS[mimetype] ?? 'bin';
  return `${folder}/${randomUUID()}.${ext}`;
}

/** Public URL for an object key (CDN/custom-domain base wins when set). */
export function publicUrlForKey(key: string): string {
  const base = env.S3_PUBLIC_URL ?? `${env.S3_ENDPOINT.replace(/\/$/, '')}/${env.S3_BUCKET}`;
  return `${base.replace(/\/$/, '')}/${key}`;
}

/**
 * Extract the object key from a stored logo URL.
 * Handles `<base>/<bucket>/<key>` (default) and `<base>/<key>`
 * (CDN base that already includes the bucket) shapes.
 */
export function objectKeyFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname.replace(/^\//, '');
    if (!path) return null;
    const prefix = `${env.S3_BUCKET}/`;
    return path.startsWith(prefix) ? path.slice(prefix.length) : path;
  } catch {
    return null;
  }
}

// Upload buffer to S3-compatible storage (public-read for hot-linking)
export const uploadToS3 = async (
  buffer: Buffer,
  folder: string,
  contentType: string,
): Promise<{ url: string; key: string }> => {
  const key = buildObjectKey(folder, contentType);
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    ...(env.S3_OBJECT_ACL ? { ACL: env.S3_OBJECT_ACL as ObjectCannedACL } : {}),
  });

  await s3.send(command);
  return { url: publicUrlForKey(key), key };
};

// Delete object from S3-compatible storage (missing keys are ignored)
export const deleteFromS3 = async (key: string) => {
  try {
    return await s3.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  } catch (error) {
    throw new Error(`Failed to delete file: ${(error as Error).message}`);
  }
};
