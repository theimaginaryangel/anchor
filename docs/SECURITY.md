# Security

> This document will be filled in fully during Phase 7. For now, it outlines the security model.

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

## Secrets Management

- All secrets (API keys, client secrets, database keys) are stored in environment variables.
- `.env.local` is gitignored — secrets never go into the repo.
- `.env.example` lists every required variable without values.
- In production, secrets are set in the hosting platform's environment configuration.

## What Happens When a Document Is Deleted

_To be documented in Phase 2 when deletion is implemented._
