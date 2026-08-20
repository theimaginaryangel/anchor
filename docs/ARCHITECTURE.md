# Architecture

> This document will be filled in fully during Phase 7. For now, it outlines the system's structure and data flow.

## System Overview

Anchor is a single Next.js application that handles both the UI and the API. There's no separate backend server. The AI and storage pieces run on AWS (Textract, Bedrock, S3), the database is Postgres with pgvector on Supabase, and authentication goes through Microsoft Entra ID.

## Data Flow

Here's what happens from upload to cited answer:

1. **Upload** — User uploads a PDF. The file goes to S3.
2. **OCR** — The app starts an AWS Textract job on the S3 file. Textract extracts text from every page, including scanned/image pages.
3. **Chunking** — The raw Textract output is parsed into chunks that respect the document's structure. A chunk is typically a heading plus its paragraphs. Each chunk records its page number and position.
4. **Embedding** — Each chunk is sent to AWS Bedrock (Titan Embeddings G1), which returns a 1,536-dimension vector. The vector is stored in Postgres alongside the chunk.
5. **Question** — User asks a question. The question is embedded using the same model.
6. **Retrieval** — pgvector finds the chunks whose vectors are closest to the question vector.
7. **Generation** — The top chunks and the question are sent to Google Gemini. The prompt tells Gemini to answer only from the provided chunks and to cite which chunk each part of the answer came from.
8. **Citation** — The answer is displayed with clickable references that link back to the source page and section.

## Component Map

```
app/                    → Next.js pages and API routes
lib/ocr/                → AWS Textract client
lib/chunking/           → Document structure parser
lib/embeddings/         → AWS Bedrock Titan client
lib/retrieval/          → pgvector similarity search
lib/chat/               → Google Gemini client
lib/auth/               → NextAuth.js + Entra ID config
db/                     → Postgres schema and migrations
```

## Infrastructure

| Service | What it does | Why this one |
|---|---|---|
| Next.js 14 | UI + API | Same stack as the rest of the portfolio |
| AWS Textract | OCR | Reads directly from S3, same AWS account |
| AWS Bedrock | Embeddings | Keeps AI services inside AWS |
| Google Gemini | Answer generation | Available via existing API key |
| Supabase | Postgres + pgvector | Free tier, already in use |
| AWS S3 | PDF storage | Standard, Textract reads from it directly |
| Entra ID | Authentication | Required by the target role |

## Diagrams

_To be added in Phase 7._
