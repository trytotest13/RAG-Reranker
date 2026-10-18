# 05: Jev RAG Reranker

Jev receives a query plus retrieved chunks and scores each chunk's relevance:
BM25-style lexical scoring with an exact-phrase bonus, normalized so the best
chunk reads 1.0. The top 5 are flagged, the naive baseline (first 5 in corpus
order, standing in for embedding order) is diffed, and promoted/demoted ids
show exactly what the reranker changed. All 24 chunk scores are visible.

## Run
```bash
node server.js
# http://localhost:3915
```

## Verify
```bash
node test.js
```

## R-35 click-through (recorded 2026-10-09)
- empty page: verdict strip reads "No query reranked yet"
- chip "How do refunds work?": refund chunks c01, c02 take top spots with
  1.000 and a high second score; invoices and payment methods demoted
- chip "Retry failed webhook deliveries": c10 webhook retries to 1.000,
  promoted from position 10 of the baseline
- chip "Rotate my API keys safely": c06 API keys first, c15 go-live checklist
  promoted
- chip of pure stopwords ("the a of is"): all scores 0.000, first five
  baseline chunks shown as top, no crash
- Rerank button during fetch: disabled, reads "Scoring..."
- server stopped + click: inline red error with server message
- show-all toggle: all 24 rows with dimmed non-top bars
- keyboard: Tab reaches input, chips, button, toggle; Enter reranks
- no console errors in any state
