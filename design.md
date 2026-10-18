# Design: Jev RAG Reranker

Inherits [../DESIGN.md](../DESIGN.md): dark instrument panel, two-panel layout,
ENERGY 1 / RHYTHM 2 / MOTION 1.

## Tokens for this app
| Token | Value | Use |
|---|---|---|
| accent | #C4B5FD pale violet | score bars, TOP badge, focus outline |
| demoted | muted | baseline chunks that fell out of the top 5 |

## Component styles
- Result row: rank number (mono), title, score bar, mono score value. Top-5
  rows carry a mono "TOP" tag and full-accent bars; the rest keep dimmer bars
  (same hue, lower opacity) so rank reads at a glance.
- Diff line under the results: promoted ids in ink, demoted ids in muted.
- Verdict strip shows the query and how many chunks were scored.
- Ledger rows: query excerpt, top chunk title, its score.

## Reasons
- Pale violet is the least semantic accent in the portfolio: a score scale
  makes no state claim, so it gets a neutral-cool hue.
- Dimming non-top bars instead of hiding them keeps the ranking auditable
  while making the top 5 the obvious focal group.
