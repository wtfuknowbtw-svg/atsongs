/**
 * B2 credential check (local only, not a route).
 *
 * Uploads a tiny test object to the private B2 bucket (S3-compatible),
 * reads it back, then deletes it.
 *
 * Run from d:\music\server:
 *   npx tsx scripts/b2-check.ts
 *
 * Required env vars (in local gitignored server/.env — never commit):
 *   B2_KEY_ID, B2_APP_KEY, B2_ENDPOINT, B2_BUCKET
 *
 * This script never prints secret values.
 */
import 'dotenv/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Readable } from 'stream';

function parseRegionFromEndpoint(endpoint: string): string {
  const hostname = new URL(endpoint).hostname.toLowerCase();
  // Expected form: s3.<region>.backblazeb2.com  e.g. s3.us-west-004.backblazeb2.com
  const m = hostname.match(/^s3\.([^.]+)\.backblazeb2\.com$/);
  if (m) return m[1];
  throw new Error(
    `Could not parse B2 region from B2_ENDPOINT hostname "${hostname}". Expected https://s3.<region>.backblazeb2.com`
  );
}

async function streamToString(stream: unknown): Promise<string> {
  if (stream instanceof Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as never));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }
  // Web-stream / blob style bodies
  const webStream = stream as {
    transformToString?: (encoding?: string) => Promise<string>;
    getReader?: () => { read(): Promise<{ done: boolean; value?: unknown }> };
  };
  if (typeof webStream.transformToString === 'function') {
    return webStream.transformToString('utf-8');
  }
  if (typeof webStream.getReader === 'function') {
    const reader = webStream.getReader();
    const chunks: Buffer[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value as never));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }
  throw new Error('Unsupported GetObject Body stream type');
}

async function main(): Promise<void> {
  const bucket = process.env.B2_BUCKET;
  const endpoint = process.env.B2_ENDPOINT;
  const accessKeyId = process.env.B2_KEY_ID;
  const secretAccessKey = process.env.B2_APP_KEY;

  const missing = [
    ['B2_BUCKET', bucket],
    ['B2_ENDPOINT', endpoint],
    ['B2_KEY_ID', accessKeyId],
    ['B2_APP_KEY', secretAccessKey],
  ]
    .filter(([, v]) => !v)
    .map(([k]) => k);

  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  const region = parseRegionFromEndpoint(endpoint as string);
  const endpointHost = new URL(endpoint as string).hostname;

  // Never log secret values — only host/bucket/region/key metadata.
  console.log(`endpoint host: ${endpointHost}`);
  console.log(`bucket: ${bucket}`);
  console.log(`region (parsed from B2_ENDPOINT): ${region}`);

  const client = new S3Client({
    region,
    endpoint: endpoint as string,
    credentials: {
      accessKeyId: accessKeyId as string,
      secretAccessKey: secretAccessKey as string,
    },
  });

  const key = `b2-check/check-${Date.now()}.txt`;
  const body = `b2-check ${new Date().toISOString()}`;
  console.log(`key: ${key}`);

  await client.send(
    new PutObjectCommand({ Bucket: bucket as string, Key: key, Body: body, ContentType: 'text/plain' })
  );
  console.log(`PUT ok (${Buffer.byteLength(body)} bytes)`);

  const got = await client.send(new GetObjectCommand({ Bucket: bucket as string, Key: key }));
  const text = await streamToString(got.Body);
  if (text !== body) {
    throw new Error(`Read-back mismatch: expected ${body.length} chars, got ${text.length} chars`);
  }
  console.log(`GET ok (read back ${Buffer.byteLength(text)} bytes, contents match)`);

  await client.send(new DeleteObjectCommand({ Bucket: bucket as string, Key: key }));
  console.log('DELETE ok');
  console.log('B2 credential check PASSED');
}

main().catch((err) => {
  console.error(`B2 credential check FAILED: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
