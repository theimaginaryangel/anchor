# Security

This document outlines the security model and protections implemented in Anchor.

## Authentication

Users sign in through Microsoft Entra ID (formerly Azure Active Directory). The app uses NextAuth.js v5 to handle the OAuth/OIDC flow. No passwords are stored in the app — all authentication is delegated to Microsoft.

## Authorization

Two roles, assigned in the Entra ID app registration:

| Role | Can upload | Can delete | Can query | Can view documents |
|---|---|---|---|---|
| admin | ✅ | ✅ | ✅ | ✅ |
| viewer | ❌ | ❌ | ✅ | ✅ |

Role is read from the Entra ID token and checked on every API request.

## Data Handling

- **Uploaded PDFs** are stored in a private S3 bucket. No public access.
- **Extracted text and chunks** are stored in Supabase (Postgres). Access is through the service role key, which is server-side only.
- **Embeddings** are stored alongside chunks in Postgres.
- **No document data is sent to third parties** except AWS Textract (for OCR), AWS Bedrock (for embeddings), and Google Gemini (for answer generation). These services process the data and return results — none of them store it.

## AI & Application Security Defenses

We implement a defense-in-depth strategy covering both traditional application vulnerabilities and LLM-specific threats:

### 1. File Upload Security
- **Strict Size Limits**: Max 10MB per file to prevent memory exhaustion (DoS).
- **MIME & Extension Enforcement**: Only `.pdf` extensions and `application/pdf` MIME types are allowed.
- **Magic Number Validation**: The backend inspects the binary buffer's first 5 bytes to verify the `%PDF-` signature, neutralizing disguised executables (e.g. `.exe` spoofing).

### 2. Prompt Injection Protection
- **System Prompt Hardening**: Gemini is explicitly instructed to ignore embedded commands and never execute code.
- **Input Delimiters**: User queries and document chunks are wrapped in XML tags (`<user_query>`, `<document_chunks>`) to prevent confusion between instructions and data.

### 3. API & Data Sanitization
- **Rate Limiting**: Both `/api/upload` and `/api/chat` enforce strict IP-based sliding-window rate limits (returning HTTP 429) to prevent quota exhaustion and spam.
- **Input Sanitization**: User questions are stripped of control characters and capped at 2000 characters to prevent oversized payloads.
- **Output Sanitization**: The LLM's response is sanitized to strip dangerous HTML tags (e.g., `<script>`, `<iframe>`) before rendering on the frontend, mitigating potential XSS via AI output.

### 4. Security Headers
All routes are protected by middleware injecting industry-standard security headers:
- `X-Frame-Options: DENY` (prevents clickjacking)
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `X-XSS-Protection: 1; mode=block`
- `Permissions-Policy` (disables camera, mic, geolocation)

## Secrets Management

- All secrets (API keys, client secrets, database keys) are stored in environment variables.
- `.env.local` is gitignored — secrets never go into the repo.
- `.env.example` lists every required variable without values.
- In production, secrets are set in the hosting platform's environment configuration.
