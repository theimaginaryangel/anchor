-- Anchor Database Schema
--
-- This runs on Postgres (Supabase) with the pgvector extension.
-- It stores uploaded documents, their extracted text chunks,
-- and the embedding vectors used for similarity search.
--
-- To set this up in Supabase:
--   1. Go to the SQL Editor in your Supabase dashboard
--   2. Paste this entire file and run it
--
-- Tables:
--   documents  — one row per uploaded PDF
--   chunks     — text chunks extracted from each document
--   embeddings — vector embeddings for each chunk (1,536 dims)

-- Enable the pgvector extension for vector similarity search.
create extension if not exists vector;

-- Each uploaded PDF gets a row here.
-- Status tracks the OCR pipeline: processing → ready or failed.
create table documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  s3_key text not null,
  uploaded_by text not null,
  status text not null default 'processing'
    check (status in ('processing', 'ready', 'failed')),
  page_count int,
  textract_job_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Text chunks extracted from documents.
-- Each chunk tracks where it came from: page number, section heading,
-- and character offsets in the full extracted text.
create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  page_number int,
  section_heading text,
  position_start int,
  position_end int,
  created_at timestamptz not null default now()
);

-- Embedding vectors for similarity search.
-- Each embedding corresponds to one chunk.
-- Titan Embeddings G1 produces 1,536-dimension vectors.
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null references chunks(id) on delete cascade,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

-- Index for fast vector similarity search.
-- ivfflat is good enough for the data volumes in this project.
-- For larger datasets, consider switching to hnsw.
create index idx_embeddings_vector
  on embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index to quickly find all chunks belonging to a document.
create index idx_chunks_document_id
  on chunks (document_id);

-- Postgres function for similarity search.
-- Called from the app via supabase.rpc('match_chunks', ...).
--
-- Parameters:
--   query_embedding  — the vector to search for (from the user's question)
--   match_threshold  — minimum similarity score (0 to 1)
--   match_count      — max number of results
--   filter_document  — optional document ID to search within
create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_document uuid default null
)
returns table (
  chunk_id uuid,
  document_id uuid,
  content text,
  page_number int,
  section_heading text,
  similarity float
)
language sql stable
as $$
  select
    c.id as chunk_id,
    c.document_id,
    c.content,
    c.page_number,
    c.section_heading,
    1 - (e.embedding <=> query_embedding) as similarity
  from embeddings e
  join chunks c on c.id = e.chunk_id
  where
    1 - (e.embedding <=> query_embedding) > match_threshold
    and (filter_document is null or c.document_id = filter_document)
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
