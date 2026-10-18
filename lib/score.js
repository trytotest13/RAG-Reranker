'use strict';

// Jev RAG reranker. Pure functions, no I/O, deterministic.

/** Stand-in corpus for retrieved chunks. Corpus order doubles as the naive
 *  baseline order, the way an embedding retriever would hand chunks over. */
const CORPUS = [
  { id: 'c01', title: 'Refunds overview', text: 'Refunds return the charge amount to the original payment method. Most refunds settle within 5 to 7 business days.' },
  { id: 'c02', title: 'Refund policy for subscriptions', text: 'Cancelled subscriptions are eligible for a prorated refund if requested within 14 days of the charge.' },
  { id: 'c03', title: 'Invoices', text: 'Invoices are generated monthly and list every charge, credit, and tax line for the billing period.' },
  { id: 'c04', title: 'Payment methods', text: 'Cards, ACH, and SEPA are supported. The default payment method is charged on the invoice due date.' },
  { id: 'c05', title: 'Disputes and chargebacks', text: 'A chargeback starts with the card issuer. Respond to dispute evidence requests within 7 days.' },
  { id: 'c06', title: 'API keys', text: 'API keys authenticate server requests. Keep secret keys server side and rotate them every 90 days.' },
  { id: 'c07', title: 'OAuth tokens', text: 'OAuth access tokens expire after one hour. Use the refresh token to obtain a new access token.' },
  { id: 'c08', title: 'Rate limits', text: 'The API allows 100 requests per minute per key. Exceeding the limit returns HTTP 429 with a retry header.' },
  { id: 'c09', title: 'Webhooks', text: 'Webhooks deliver charge, refund, and dispute events to your endpoint. Verify the signature header on every delivery.' },
  { id: 'c10', title: 'Webhook retries', text: 'Failed webhook deliveries retry with exponential backoff for 24 hours before the event is marked failed.' },
  { id: 'c11', title: 'Deploying the integration', text: 'Deploy the integration behind a feature flag, then flip traffic gradually while watching error rates.' },
  { id: 'c12', title: 'Rollback procedure', text: 'Roll back a bad release by redeploying the previous image. Database migrations must be reversible first.' },
  { id: 'c13', title: 'Staging environment', text: 'Staging mirrors production data shapes with fake records. Run the test suite there before every deploy.' },
  { id: 'c14', title: 'Test mode', text: 'Test mode uses fake card numbers and never moves real money. Test charges appear in the dashboard separately.' },
  { id: 'c15', title: 'Go live checklist', text: 'Before going live: rotate test keys out, enable webhooks, verify refunds flow, and turn on two-factor auth.' },
  { id: 'c16', title: 'Two-factor authentication', text: 'Two-factor authentication requires a code from your authenticator app at every login on new devices.' },
  { id: 'c17', title: 'Password reset', text: 'Password reset links expire after 30 minutes and can be used once. Request a new link if it timed out.' },
  { id: 'c18', title: 'Account lockouts', text: 'Five failed login attempts lock the account for 15 minutes. Locked accounts unlock automatically.' },
  { id: 'c19', title: 'Data retention', text: 'Charge records are kept for 7 years for tax compliance. Deleted customers are anonymized after 90 days.' },
  { id: 'c20', title: 'Exporting data', text: 'Export invoices, charges, and refunds as CSV from the dashboard or with the reporting API endpoint.' },
  { id: 'c21', title: 'Reporting API', text: 'The reporting API returns aggregated charge volume per day. Queries over 90 days must use monthly buckets.' },
  { id: 'c22', title: 'SDK quickstart', text: 'The Node SDK wraps the REST API. Initialize the client with your secret key and start charging in minutes.' },
  { id: 'c23', title: 'Error handling guide', text: 'Treat HTTP 429 with backoff, HTTP 5xx with retries, and validation errors as bugs in your request.' },
  { id: 'c24', title: 'Idempotency keys', text: 'Send an idempotency key header to retry a charge safely. Replays return the original response, not a double charge.' },
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'in',
  'on', 'for', 'with', 'at', 'by', 'it', 'this', 'that', 'my', 'your', 'do',
  'does', 'did', 'how', 'what', 'when', 'why', 'can', 'i', 'we', 'you', 'be',
  'as', 'if', 'from', 'about', 'into', 'up', 'out',
]);

const K1 = 1.4;
const B = 0.72;
const PHRASE_BONUS = 3;

function tokenize(text) {
  const out = [];
  for (const w of String(text).toLowerCase().match(/[a-z0-9]+/g) || []) {
    if (w.length >= 2 && !STOPWORDS.has(w)) out.push(w);
  }
  return out;
}

const R3 = (n) => Math.round(n * 1000) / 1000;

/**
 * Score every chunk against the query, best chunk normalized to 1.0.
 * @param {string} query
 */
function rerank(query) {
  const q = String(query).trim();
  if (!q) throw new Error('query is required');
  const qLower = q.toLowerCase();
  const qTokens = tokenize(q);

  const docTokens = CORPUS.map((c) => tokenize(`${c.title} ${c.title} ${c.text}`));
  const avgdl = docTokens.reduce((a, t) => a + t.length, 0) / docTokens.length;

  const df = {};
  for (const term of new Set(qTokens)) {
    df[term] = docTokens.filter((tokens) => tokens.includes(term)).length;
  }
  const idf = (term) =>
    Math.log((CORPUS.length - df[term] + 0.5) / (df[term] + 0.5) + 1);

  const raw = CORPUS.map((chunk, i) => {
    let score = 0;
    for (const term of qTokens) {
      const tf = docTokens[i].filter((t) => t === term).length;
      if (tf === 0) continue;
      score += idf(term) * ((tf * (K1 + 1)) / (tf + K1 * (1 - B + B * (docTokens[i].length / avgdl))));
    }
    // Title hits weigh more than body hits: a second pass on title tokens.
    const titleTokens = tokenize(chunk.title);
    for (const term of qTokens) {
      if (titleTokens.includes(term)) score += idf(term) * 0.5;
    }
    if (qTokens.length >= 2 && chunk.text.toLowerCase().includes(qLower)) {
      score += PHRASE_BONUS;
    }
    return { chunk, score };
  });

  const max = Math.max(...raw.map((r) => r.score), 0);
  const results = raw
    .map(({ chunk, score }) => ({
      id: chunk.id,
      title: chunk.title,
      text: chunk.text,
      score: max > 0 ? R3(score / max) : 0,
      top: false,
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  results.slice(0, 5).forEach((r) => { r.top = true; });
  const top = results.slice(0, 5).map((r) => r.id);
  const baseline = CORPUS.slice(0, 5).map((c) => c.id);
  const promoted = top.filter((id) => !baseline.includes(id));
  const demoted = baseline.filter((id) => !top.includes(id));

  return { query: q, results, top, baseline, promoted, demoted };
}

module.exports = { CORPUS, STOPWORDS, tokenize, rerank };
