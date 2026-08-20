/**
 * Textract OCR Client
 *
 * Sends PDFs stored in S3 to AWS Textract for text extraction.
 * Handles async job polling — Textract processes multi-page scanned
 * documents in the background, so this module starts the job and
 * polls until it finishes (or fails).
 *
 * Implemented in Phase 2.
 *
 * Dependencies: @aws-sdk/client-textract
 */

import { TextractClient, StartDocumentTextDetectionCommand, GetDocumentTextDetectionCommand } from '@aws-sdk/client-textract';

const textractClient = new TextractClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function startTextractJob(s3Key: string): Promise<string> {
  const bucketName = process.env.S3_BUCKET_NAME;
  if (!bucketName) {
    throw new Error('S3_BUCKET_NAME is not configured.');
  }

  const command = new StartDocumentTextDetectionCommand({
    DocumentLocation: {
      S3Object: {
        Bucket: bucketName,
        Name: s3Key,
      }
    }
  });

  const response = await textractClient.send(command);
  
  if (!response.JobId) {
    throw new Error('Failed to retrieve JobId from Textract.');
  }
  
  return response.JobId;
}

export async function getTextractResult(jobId: string): Promise<unknown> {
  const command = new GetDocumentTextDetectionCommand({ JobId: jobId });
  return await textractClient.send(command);
}
