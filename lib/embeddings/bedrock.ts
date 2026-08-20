/**
 * Bedrock Titan Embeddings Client
 *
 * Sends text chunks to AWS Bedrock's Titan Embeddings G1 model
 * and gets back 1,536-dimension vectors. These vectors are what
 * make similarity search possible — similar text produces similar
 * vectors.
 *
 * Model: amazon.titan-embed-text-v1
 * Vector dimensions: 1,536
 *
 * Implemented in Phase 4.
 *
 * Dependencies: @aws-sdk/client-bedrock-runtime
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function embedText(text: string): Promise<number[]> {
  const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.titan-embed-text-v1';
  
  const payload = {
    inputText: text,
  };

  const command = new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  const response = await bedrockClient.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  return responseBody.embedding;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  // Titan doesn't natively support batch embedding in a single API call for the v1 model in the same way OpenAI does,
  // so we process them sequentially or in parallel batches to avoid rate limits.
  const embeddings: number[][] = [];
  for (const text of texts) {
    const embedding = await embedText(text);
    embeddings.push(embedding);
  }
  return embeddings;
}
