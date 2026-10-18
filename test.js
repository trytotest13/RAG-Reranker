'use strict';

const assert = require('node:assert');
const { rerank, CORPUS } = require('./lib/score.js');

// 1. A refunds query puts refund content at the top, not billing prose.
const refunds = rerank('How do refunds work?');
assert.strictEqual(refunds.results[0].id, 'c01', 'refund overview first');
assert.ok(
  refunds.top.includes('c20') || refunds.top.includes('c15'),
  'other chunks mentioning refunds get promoted into the top 5'
);
assert.ok(refunds.promoted.length > 0, 'reranker promoted something over the naive baseline');
assert.ok(refunds.demoted.length > 0, 'reranker demoted something out of the baseline');
assert.ok(!refunds.top.includes('c04') && !refunds.top.includes('c05'), 'payment/dispute prose fell out of the top 5');

// 2. Determinism.
assert.deepStrictEqual(rerank('How do refunds work?'), refunds, 'same query, same ranking');

// 3. Scores stay in 0..1, sorted descending, best chunk is 1.0.
for (const r of refunds.results) {
  assert.ok(r.score >= 0 && r.score <= 1, 'score range');
}
for (let i = 1; i < refunds.results.length; i += 1) {
  assert.ok(refunds.results[i - 1].score >= refunds.results[i].score, 'sorted descending');
}
assert.strictEqual(refunds.results[0].score, 1, 'best chunk normalized to 1.0');

// 4. Exactly five top chunks, diff consistent with top and baseline.
assert.strictEqual(refunds.top.length, 5);
assert.strictEqual(refunds.baseline.length, 5);
for (const id of refunds.promoted) {
  assert.ok(refunds.top.includes(id), 'promoted ids are in top');
  assert.ok(!refunds.baseline.includes(id), 'promoted ids were not in baseline');
}
for (const id of refunds.demoted) {
  assert.ok(refunds.baseline.includes(id), 'demoted ids were in baseline');
  assert.ok(!refunds.top.includes(id), 'demoted ids left the top');
}

// 5. A stopword-only query scores everything zero without crashing.
const empty = rerank('the a of is');
assert.ok(empty.results.every((r) => r.score === 0), 'no signal, all zeros');
assert.strictEqual(empty.top.length, 5, 'still returns a top 5');

// 6. Corpus integrity: 24 stable ids.
assert.strictEqual(CORPUS.length, 24);
assert.strictEqual(new Set(CORPUS.map((c) => c.id)).size, 24, 'ids unique');

console.log('05-rag-reranker: 6 test groups passed');
