# Architecture: Jev RAG Reranker

## Directory tree
```
05-rag-reranker/
  server.js        static + POST /api/rerank + GET /api/corpus
  lib/score.js     corpus data, tokenizer, BM25-lite scoring (no I/O)
  test.js          assertions over lib/score.js
  index.html       query input, scored results, diff panel, ledger
  styles.css       shared tokens, pale violet accent (DESIGN.md at repo root)
  app.js           fetch, render scores, promoted/demoted, ledger
```

## Data flow
```
query input
  -> POST /api/rerank {query}
  -> lib/score.js: tokenize (stopwords out) -> BM25-lite per chunk
     -> exact-phrase bonus -> normalize by max -> sort desc
  -> top 5 flagged; baseline = first 5 in corpus order; diff computed
  -> JSON {results, top, baseline, promoted, demoted}
  -> app.js: score bars with TOP badge, diff line, ledger
```

## Components
- Input panel: query input, preset chips, rerank button, show-all toggle.
- Decision panel: scored result list (focal), promoted/demoted line, ledger.
- Corpus section: full chunk list so reviewers see what stands in for retrieval.

## Rendering strategy
Static files, client-side fetch rendering, stateless server.

## Third-party services
None. EMBEDDING_ENDPOINT is a documented extension point for a real retriever.
