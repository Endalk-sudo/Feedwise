import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

// Real command classes (pure data holders, no network); only the
// network-sending client is stubbed.
vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>();
  return {
    ...actual,
    S3Client: vi.fn(function (this: unknown) {
      return { send: mockSend };
    }),
  };
});

import {
  buildObjectKey,
  publicUrlForKey,
  objectKeyFromUrl,
  uploadToS3,
  deleteFromS3,
} from './s3.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('buildObjectKey', () => {
  it('nests a uuid filename with the right extension under the folder', () => {
    const key = buildObjectKey('organizations/org1', 'image/png');

    expect(key).toMatch(/^organizations\/org1\/[0-9a-f-]{36}\.png$/);
  });

  it('falls back to .bin for unknown mimetypes', () => {
    expect(buildObjectKey('logos', 'application/octet-stream')).toMatch(/\.bin$/);
  });
});

describe('publicUrlForKey', () => {
  it('builds endpoint/bucket/key URLs from env', () => {
    // test setup stubs: endpoint http://localhost:9000, bucket test-bucket
    expect(publicUrlForKey('organizations/org1/logo.png')).toBe(
      'http://localhost:9000/test-bucket/organizations/org1/logo.png',
    );
  });
});

describe('objectKeyFromUrl', () => {
  it('strips the bucket prefix from default URLs', () => {
    expect(objectKeyFromUrl('http://localhost:9000/test-bucket/organizations/org1/a.png')).toBe(
      'organizations/org1/a.png',
    );
  });

  it('keeps CDN-base paths that already exclude the bucket', () => {
    expect(objectKeyFromUrl('https://cdn.example.com/organizations/org1/a.png')).toBe(
      'organizations/org1/a.png',
    );
  });

  it('returns null for invalid URLs', () => {
    expect(objectKeyFromUrl('not-a-url')).toBeNull();
  });
});

describe('uploadToS3 / deleteFromS3', () => {
  it('puts the object with content type + ACL and returns the public URL', async () => {
    const buffer = Buffer.from('fake-image');

    const result = await uploadToS3(buffer, 'organizations/org1', 'image/jpeg');

    expect(result.url).toMatch(
      /^http:\/\/localhost:9000\/test-bucket\/organizations\/org1\/.+\.jpg$/,
    );
    expect(mockSend).toHaveBeenCalledTimes(1);
    const sent = mockSend.mock.calls[0]?.[0] as { input: Record<string, unknown> };
    expect(sent.input).toMatchObject({
      Bucket: 'test-bucket',
      Key: result.key,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    });
  });

  it('deletes by key and wraps failures', async () => {
    await deleteFromS3('organizations/org1/old.png');

    const sent = mockSend.mock.calls[0]?.[0] as { input: Record<string, unknown> };
    expect(sent.input).toMatchObject({
      Bucket: 'test-bucket',
      Key: 'organizations/org1/old.png',
    });

    mockSend.mockRejectedValueOnce(new Error('nope'));
    await expect(deleteFromS3('x')).rejects.toThrow('Failed to delete file: nope');
  });
});
