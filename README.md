# Anchor

A multi-cloud Document Q&A application built for enterprise-grade text extraction and semantic search.

Anchor allows authenticated users to upload scanned PDFs, automatically extracts the text using AWS Textract, generates vector embeddings via Google Gemini, and provides an interactive chat interface to query the documents with exact source citations.

## Features

- **Enterprise OCR:** Uses AWS Textract to accurately parse text from complex, multi-page scanned PDFs.
- **Semantic Search:** Text is chunked and embedded into a `pgvector` database using Gemini's 768-dimension embedding models.
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

## License

MIT
