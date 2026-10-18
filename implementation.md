# Implementation: Jev RAG Reranker

## Phase 1: setup and tooling
- T1.1 Folder + package.json + .gitignore + .env.example.
  AC: `node server.js` starts, no install.

## Phase 2: scoring core
- T2.1 lib/score.js: 24-chunk corpus, tokenizer with stopwords, BM25-lite,
  phrase bonus, normalization, top/baseline/diff computation.
  AC: deterministic.
- T2.2 test.js: refunds query ranks refund content first, determinism,
  score range and ordering, top has 5, diff consistency, stopword-only query
  does not crash.
  AC: `node test.js` exits 0.

## Phase 3: API and UI
- T3.1 server.js: /api/rerank validation, /api/corpus, static serving with
  traversal guard, 1 MB cap.
- T3.2 UI: scored result rows, TOP badges, diff line, show-all toggle, ledger.
  AC: a refunds query visibly promotes refund chunks over the naive baseline.

## Phase 4: polish and verification
- T4.1 Contrast and keyboard pass.
- T4.2 R-35 click-through recorded in README.
