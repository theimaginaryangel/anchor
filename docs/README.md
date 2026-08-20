# Anchor — Documentation

This folder contains the project's technical documentation.

## Contents

- [**ARCHITECTURE.md**](./ARCHITECTURE.md) — System overview, data flow from upload to cited answer, and how each component connects.
- [**SECURITY.md**](./SECURITY.md) — Authentication, authorization, data handling, and secrets management.
- [**ADRs**](./adr/) — Architecture Decision Records. Each one explains a technology choice: what was picked, what else was considered, and why.
- [**openapi.yaml**](./openapi.yaml) — API endpoint definitions for upload, documents, and chat.

## ADR Index

| # | Decision | Status |
|---|---|---|
| [0001](./adr/0001-frontend-and-api-framework.md) | Frontend and API framework | Accepted |
| [0002](./adr/0002-ocr-provider.md) | OCR provider | Proposed |
| [0003](./adr/0003-embeddings-provider.md) | Embeddings provider | Proposed |
| [0004](./adr/0004-vector-storage.md) | Vector storage | Proposed |
| [0005](./adr/0005-auth-provider.md) | Auth provider | Proposed |
| [0006](./adr/0006-llm-provider.md) | LLM provider | Proposed |
