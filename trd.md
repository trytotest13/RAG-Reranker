# TRD: Jev RAG Reranker

## Stack and why
- Node 18+ stdlib only, plain JavaScript CommonJS with JSDoc, vanilla browser
  JS. Zero install, pure scoring, one screen, same as the other four apps.

## Packages
None.

## API
| Method | Path | Body | Response |
|---|---|---|---|
| POST | /api/rerank | `{ query: string }` | `{ query, results, top, baseline, promoted, demoted }` |
| GET | /api/corpus | - | `{ corpus: Chunk[] }` (title + text, no scores) |
| GET | /api/health | - | `{ ok: true }` |

Chunk result: `{ id, title, text, score, top }`.

## Auth
None. Localhost demo.

## Environment variables
| Name | Required | Purpose |
|---|---|---|
| PORT | no | server port, default 3915 |
| EMBEDDING_ENDPOINT | no | reserved for a real retriever upstream, unused |

Placeholders only in `.env.example`.
