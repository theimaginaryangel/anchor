# Anchor

A multi-cloud Document Q&A application built for enterprise-grade text extraction and semantic search.

Anchor allows authenticated users to upload scanned PDFs, automatically extracts the text using AWS Textract, generates vector embeddings via Google Gemini, and provides an interactive chat interface to query the documents with exact source citations.

## Features

- **Enterprise OCR:** Uses AWS Textract to accurately parse text from complex, multi-page scanned PDFs.
- **Semantic Search:** Text is chunked and embedded into a `pgvector` database using Gemini's 768-dimension embedding models.
- **Agentic Query Routing:** The RAG pipeline employs a smart router that evaluates user intent before database retrieval, capable of answering meta-queries directly, asking for clarification, or refining search terms.
- **Retrieval-Augmented Generation (RAG):** User queries run a cosine-similarity search against the database. The top results are fed to Gemini 3.5 Flash to generate accurate, cited answers.
- **Secure Access:** Protected by Microsoft Entra ID (NextAuth v5), restricting upload and query access based on organizational roles.
- **Infrastructure as Code:** Fully managed by Terraform and deployed automatically via GitHub Actions CI/CD.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes, Node.js
- **Database:** Supabase (PostgreSQL + pgvector)
- **AI / ML:** AWS Textract (OCR), Google Gemini 3.5 (LLM + Embeddings)
- **Storage:** AWS S3
- **Auth:** NextAuth.js v5 (Microsoft Entra ID)
- **Infrastructure:** Terraform, GitHub Actions

## Challenges & Engineering Decisions

Building a robust multi-cloud architecture required solving several deep technical constraints:

1. **Circumventing Vector Dimensionality Limits in PostgreSQL**
   * **Challenge:** Google Gemini's embedding models default to generating 3072-dimension vectors. However, Supabase's `pgvector` extension utilizing `ivfflat` indexing strictly crashes when attempting to index anything exceeding 2000 dimensions (`ERROR: 54000`).
   * **Solution:** Rather than using a less capable model, I engineered the embedding pipeline to interface directly with the Gemini API to mathematically compress the vector output dimensionality to exactly 768 before database insertion, maintaining high semantic accuracy while strictly adhering to indexing constraints.

2. **Mitigating Cloud Provider Throttling**
   * **Challenge:** The initial design utilized AWS Bedrock (Titan Embeddings) for vectorization. However, strict AWS account quotas caused severe `ThrottlingException` errors when processing large documents with hundreds of text chunks.
   * **Solution:** I decoupled the AI inference pipeline, executing a rapid pivot to a multi-cloud architecture. AWS was retained for its industry-leading OCR (Textract), while the heavy LLM embedding workloads were offloaded to Google Cloud (Gemini), successfully bypassing quota limitations and increasing throughput.

3. **Handling Asynchronous Enterprise OCR**
   * **Challenge:** AWS Textract processing for large, multi-page PDFs can take several minutes, which would cause standard serverless Next.js API routes to time out and crash.
   * **Solution:** I implemented an asynchronous polling and state-management system. Documents are immediately written to the database with a `processing` status. A separate background pipeline handles the Textract polling, chunking, and embedding, providing a seamless, non-blocking user experience on the frontend dashboard.

4. **Eliminating Inefficient Database Queries via Agentic Routing**
   * **Challenge:** The initial RAG pipeline was a static "retrieve-then-generate" loop. If a user asked a conversational query (e.g., "Hello") or an ambiguous query (e.g., "What's the deadline?"), the system would blindly execute expensive vector embeddings and database searches, yielding poor results and wasting resources.
   * **Solution:** I inserted an "agentic routing" layer before retrieval. A fast LLM call analyzes the user's intent and outputs a structured decision: answer directly, ask for clarification, or generate a refined search query. If a search yields insufficient information, the router loops back for a second refined attempt (capped at two iterations to prevent infinite loops), drastically improving response accuracy and system efficiency.

5. **Handling Free-Tier API Rate Limits in Production**
   * **Challenge:** The Agentic Router's multi-step LLM pipeline fired multiple requests per user query. In production, this rapidly hit Google Gemini's free-tier rate limit (15 RPM), causing the API to throw `429 Too Many Requests` errors, which initially resulted in silent `500 Internal Server Errors` on the frontend.
   * **Solution:** I implemented robust error interception within the Next.js API route to catch `GoogleGenerativeAI` specific errors, extract the rate limit message, and gracefully propagate the exact issue back to the client UI. Furthermore, to protect the API quota from malicious spam or runaway scripts, I built a custom in-memory sliding-window IP rate limiter. It correctly parses proxy headers (`x-forwarded-for`) and instantly rejects abusive traffic with an HTTP 429 status before it ever reaches the Gemini API, ensuring the strict free-tier quota is preserved for legitimate users.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for detailed system diagrams and data flow.

## Local Development

### Prerequisites
- Node.js 20+
- Terraform
- AWS Account (S3, Textract)
- Google AI Studio API Key
- Supabase Project (pgvector enabled)
- Microsoft Azure Portal (Entra ID App Registration)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/theimaginaryangel/anchor.git
   cd anchor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file using the provided `.env.example` template and fill in your keys.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.
