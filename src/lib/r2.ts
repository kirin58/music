import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function required(name: string, v?: string): string {
  if (!v) throw new Error(`Missing env ${name} (ดู .env.example)`);
  return v;
}

export function r2Client(): S3Client {
  const accountId = required("R2_ACCOUNT_ID", process.env.R2_ACCOUNT_ID);
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: required("R2_ACCESS_KEY_ID", process.env.R2_ACCESS_KEY_ID),
      secretAccessKey: required(
        "R2_SECRET_ACCESS_KEY",
        process.env.R2_SECRET_ACCESS_KEY
      )
    },
    forcePathStyle: true
  });
}

export function publicFileUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/${key}` : `/${key}`;
}

/** ออก presigned PUT URL ให้ client ยิงไฟล์ตรงไป R2 (รองรับไฟล์ใหญ่, ไม่ผ่าน Vercel limit) */
export async function createPresignedUpload(opts: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<string> {
  const bucket = required("R2_BUCKET_NAME", process.env.R2_BUCKET_NAME);
  const client = r2Client();
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: opts.key,
    ContentType: opts.contentType
  });
  return getSignedUrl(client, cmd, { expiresIn: opts.expiresIn ?? 3600 });
}
