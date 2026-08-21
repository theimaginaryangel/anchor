import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });

export async function embedText(text: string): Promise<number[]> {
  const result = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
    outputDimensionality: 768
  });
  return result.embedding.values;
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  // Gemini allows processing batches easily, but to keep it safe from 
  // rate limits on massive documents, we process them in sequence.
  for (const text of texts) {
    const embedding = await embedText(text);
    embeddings.push(embedding);
  }
  
  return embeddings;
}
