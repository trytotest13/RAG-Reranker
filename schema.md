# Schema: Jev RAG Reranker

No database. The corpus is code-defined data; state is browser session memory.

## Corpus chunk (lib/score.js, fixed set of 24)
| Field | Type | Notes |
|---|---|---|
| id | string | c01..c24, stable across runs |
| title | string | short human label |
| text | string | one to two sentences, the scored content |

## Rerank response
| Field | Type | Notes |
|---|---|---|
| results | Chunk[] | all 24, sorted by score desc, each with score 0..1 and top flag |
| top | string[] | ids of the 5 highest scoring chunks |
| baseline | string[] | ids of the first 5 chunks in corpus order (stands in for embedding order) |
| promoted | string[] | in top but not baseline |
| demoted | string[] | in baseline but not top |

Scoring: BM25-lite over stopword-filtered tokens (k1 1.4, b 0.72), plus a
fixed bonus when the full query appears contiguously in the chunk text;
normalized so the best chunk scores 1.0. Stopwords are data in lib/score.js.

## Ledger (browser only)
`{ excerpt, topTitle, topScore, at }`, cap 8, lost on reload.
