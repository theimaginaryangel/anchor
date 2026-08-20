# ADR 0004: Vector Storage

**Status:** Proposed  
**Date:** 2026-08-20  
**Author:** Benny Asante Duah

## Context

Embedding vectors need to be stored and searched by similarity. The storage solution needs to handle both the vectors and the structured metadata (document IDs, page numbers, etc.).

## Decision

Postgres with pgvector, hosted on Supabase. Details to be written when implemented in Phase 4.

## Alternatives Considered

_To be documented in Phase 4._

## Consequences

_To be documented in Phase 4._
