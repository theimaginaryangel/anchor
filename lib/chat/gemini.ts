/**
 * Gemini Chat Client
 *
 * Takes a user's question and the retrieved chunks, sends them to
 * Google's Gemini API, and gets back an answer that cites its sources.
 * The system prompt tells Gemini to only answer from the provided
 * chunks and to say "I don't have enough information" if the chunks
 * don't cover the question.
 *
 * Implemented in Phase 5.
 *
 * Dependencies: @google/generative-ai
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface CitedAnswer {
  answer: string;
  citations: Array<{
    chunkId: string;
    pageNumber: number;
    sectionHeading: string | null;
    relevantText: string;
  }>;
}

export async function generateAnswer(
  question: string,
  chunks: Array<{ id: string; content: string; pageNumber: number; sectionHeading: string | null }>
): Promise<CitedAnswer> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  // 1. Format the chunks into a context string
  let contextText = '';
  chunks.forEach((chunk, index) => {
    contextText += `\n\n--- Source [${index + 1}] (Page ${chunk.pageNumber}) ---\n`;
    contextText += chunk.content;
  });

  // 2. Build the system prompt
  const prompt = `You are a helpful assistant for a document Q&A application called Anchor.
I will provide you with several extracted text chunks from the user's uploaded documents.
Your task is to answer the user's question USING ONLY the provided document chunks.

If the answer cannot be found in the chunks, say exactly: "I don't have enough information in the provided documents to answer that." Do not guess or use outside knowledge.

When you use information from a chunk, you MUST cite it inline using the source number in brackets, for example: [1] or [2].

DOCUMENT CHUNKS:
${contextText}

USER QUESTION:
${question}

ANSWER:`;

  // 3. Call Gemini
  const result = await model.generateContent(prompt);
  const answerText = result.response.text();

  // 4. Map the citations back to the chunks
  const citations = chunks.map(c => ({
    chunkId: c.id,
    pageNumber: c.pageNumber,
    sectionHeading: c.sectionHeading,
    relevantText: c.content
  }));

  return {
    answer: answerText,
    citations
  };
}
