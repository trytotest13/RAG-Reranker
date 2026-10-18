# PRD: Jev RAG Reranker

## Problem
Vector retrieval returns chunks in embedding order, which is often wrong: the
naive top-5 mixes billing prose into a refunds question. A cheap reranker that
scores every retrieved chunk against the query fixes the ordering before the
context reaches the model, without another model call.

## Target users
RAG pipeline builders and reviewers evaluating the rerank-before-generate
pattern.

## Functional requirements
- FR-1: Score a fixed 24-chunk corpus against a query with BM25-style lexical
  relevance plus an exact-phrase bonus; scores normalized to 0..1.
- FR-2: Return the top 5 chunks plus the naive baseline (first 5 in corpus
  order, standing in for embedding order) and the promoted/demoted diff.
- FR-3: Show every chunk's score so the ordering is auditable.
- FR-4: Offline, deterministic, zero keys, zero dependencies.

## Non-functional requirements
- NFR-1: In-process scoring under 50 ms per query.
- NFR-2: Corpus and stopword list are data, editable without touching logic.
- NFR-3: Same query always produces the same ranking.

## Out of scope
Embeddings, vector stores, real document ingestion, chunking pipelines,
generating answers. The reranker is the product; the corpus stands in for
retrieval results.
