import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function uploadDocumentToS3(file: Buffer, fileName: string, userId: string): Promise<string> {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not configured.');
  }

  // Create a unique key for the file in S3
  // Format: documents/{userId}/{uuid}-{originalFileName}
  const uniqueId = uuidv4();
  // Sanitize file name to avoid spaces and special characters
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const s3Key = `documents/${userId}/${uniqueId}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
    Body: file,
    ContentType: 'application/pdf',
  });

  await s3Client.send(command);

  return s3Key;
}
