# Anchor

A document Q&A tool that answers questions about uploaded PDFs and shows you exactly where the answer came from.

Upload a PDF (scanned or digital), ask a question, and get an answer with clickable citations that point to the source page and paragraph. Built to demonstrate five things in one working system:

- **OCR** — AWS Textract extracts text from scanned documents
- **Document intelligence** — text is split into chunks that follow the document's own structure (headings and paragraphs, not arbitrary character counts)
- **Embeddings** — chunks are turned into vectors using AWS Bedrock Titan Embeddings
- **RAG** — questions are answered by retrieving the most relevant chunks and generating a cited response with Google Gemini
- **Enterprise auth** — Microsoft Entra ID controls who can upload, delete, and query documents

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend + API | Next.js 14, TypeScript, Tailwind CSS |
| OCR | AWS Textract |
| Embeddings | AWS Bedrock (Titan Embeddings G1) |
| Chat / Generation | Google Gemini API |
| Vector database | Postgres + pgvector (Supabase) |
| File storage | AWS S3 |
| Auth | Microsoft Entra ID via NextAuth.js v5 |

## Quick Start

```bash
# Clone and install
git clone https://github.com/theimaginaryangel/anchor.git
cd anchor
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in your keys — see .env.example for what each variable does

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Documentation

Detailed docs live in the [`docs/`](./docs/) folder:

- [Architecture](./docs/ARCHITECTURE.md) — how the whole system fits together
- [Security](./docs/SECURITY.md) — auth, roles, data handling
- [ADRs](./docs/adr/) — why each technology was chosen
- [API Spec](./docs/openapi.yaml) — endpoint definitions

## Project Status

This project is being built in phases. See the [architecture doc](./docs/ARCHITECTURE.md) for the full plan.

| Phase | Status |
|---|---|
| 0 — Scaffold and docs | ✅ Done |
| 1 — Auth (Entra ID) | 🔲 Next |
| 2 — Document ingestion (OCR) | 🔲 Planned |
| 3 — Chunking | 🔲 Planned |
| 4 — Embeddings and search | 🔲 Planned |
| 5 — RAG and citations | 🔲 Planned |
| 6 — Sample data and deploy | 🔲 Planned |
| 7 — Documentation pass | 🔲 Planned |

## Author

Benny Asante Duah — [bennyduah.com](https://bennyduah.com) · [GitHub](https://github.com/theimaginaryangel)
