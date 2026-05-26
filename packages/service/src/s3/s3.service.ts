import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@flowform/env";

const s3Client = new S3Client({
  region: env.s3.region,
  endpoint: env.s3.endpoint,
  credentials: {
    accessKeyId: env.s3.accessKeyId,
    secretAccessKey: env.s3.secretAccessKey,
  },
});

const BUCKET = env.s3.bucketName;

export type UploadType = "avatar" | "brand" | "logo";

export interface UploadUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

export const generateUploadUrl = async (
  id: string,
  type: UploadType = "avatar",
): Promise<UploadUrlResult> => {
  const key = `${type}/${id}.webp`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: "image/webp",
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `https://${BUCKET}.t3.tigrisfiles.io/${key}?v=${Date.now()}`;

  return { uploadUrl, publicUrl, key };
};

export const deleteImageFromS3 = async (key: string): Promise<void> => {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: key }),
  );
};
