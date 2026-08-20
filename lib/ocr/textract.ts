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

export async function startTextractJob(s3Key: string): Promise<string> {
  // Returns a Textract job ID. Implemented in Phase 2.
  throw new Error('Not implemented — Phase 2');
}

export async function getTextractResult(jobId: string): Promise<unknown> {
  // Polls Textract until the job finishes, then returns the raw result.
  // Implemented in Phase 2.
  throw new Error('Not implemented — Phase 2');
}
