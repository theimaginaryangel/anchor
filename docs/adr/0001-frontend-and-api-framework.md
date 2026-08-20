# ADR 0001: Frontend and API Framework

**Status:** Accepted  
**Date:** 2026-08-20  
**Author:** Benny Asante Duah

## Context

Anchor needs a web frontend for the upload and chat UI, plus API endpoints for file upload, document listing, and the RAG query. The question is whether to use a full-stack framework (where the frontend and API live in the same project) or to split them into separate services.

## Decision

Use **Next.js 14 with the App Router and TypeScript**.

The API routes in Next.js handle all the backend logic — upload processing, document CRUD, and the RAG query endpoint. There's no separate Express or Fastify server.

## Alternatives Considered

**Next.js + separate Express API:**  
Would give more control over the backend (middleware, WebSockets, etc.), but doubles the number of things to deploy and keep running. For this project, API routes cover everything needed.

**React (Vite) + Express:**  
Clean separation, but means two repos or a monorepo, two deploy targets, CORS configuration, and no built-in SSR. Doesn't add anything that matters for this project.

**SvelteKit or Remix:**  
Both are solid full-stack frameworks, but the rest of the portfolio (Kaluna, etc.) is built with Next.js. Using the same framework means the code patterns are consistent and recognizable to anyone reviewing the portfolio as a whole.

## Consequences

- All code lives in one repo and deploys as one unit.
- API routes run as serverless functions (or Node.js, depending on the host). Long-running jobs (like waiting for Textract) need to be handled with polling, not WebSockets, since serverless functions have timeouts.
- TypeScript is used everywhere — no context-switching between languages.
- Tailwind CSS handles styling, keeping the UI code compact.
