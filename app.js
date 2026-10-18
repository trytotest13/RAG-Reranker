'use strict';

const $ = (id) => document.getElementById(id);
const queryEl = $('query');
const rerankBtn = $('rerankBtn');
const errorEl = $('error');
const verdictEl = $('verdict');
const outEl = $('out');
const diffEl = $('diff');
const showAllEl = $('showAll');
const resultsEl = $('results');
const ledgerEl = $('ledger');
const corpusBody = $('corpusBody');
const chipsEl = $('chips');

const EXAMPLES = [
  ['How do refunds work?', 'How do refunds work?'],
  ['Retry failed webhook deliveries', 'Retry failed webhook deliveries'],
  ['Rotate my API keys safely', 'Rotate my API keys safely'],
  ['Why did my login lock out?', 'Why did my login lock out?'],
];

const ledger = [];
let lastResults = null;

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.hidden = true;
}

function setEmpty() {
  verdictEl.className = 'verdict empty';
  verdictEl.innerHTML = '<span class="word">No query reranked yet.</span>';
  outEl.hidden = true;
}

function rowHtml(r, i) {
  const dim = r.top ? '' : ' dim';
  const tag = r.top ? '<span class="tag">TOP</span>' : '';
  return (
    `<li class="res-row${dim}">` +
    `<span class="rank">${i + 1}</span>` +
    `<span class="body"><span class="title">${r.title} ${tag}</span>` +
    `<span class="track"><span class="fill" style="width:${Math.round(r.score * 100)}%"></span></span></span>` +
    `<span class="score">${r.score.toFixed(3)}</span></li>`
  );
}

function render(data) {
  verdictEl.className = 'verdict';
  verdictEl.innerHTML =
    `<span class="q">${data.query}</span>` +
    `<span class="meta">${data.results.length} chunks scored, baseline was corpus order c01-c05</span>`;

  const promoted = data.promoted.length
    ? `promoted into top 5: <strong>${data.promoted.join(', ')}</strong>`
    : 'no promotion against the naive baseline';
  const demoted = data.demoted.length
    ? ` demoted out: <span class="out">${data.demoted.join(', ')}</span>`
    : '';
  diffEl.innerHTML = promoted + demoted;

  renderResults();
  outEl.hidden = false;
}

function renderResults() {
  if (!lastResults) return;
  const visible = showAllEl.checked
    ? lastResults.results
    : lastResults.results.filter((r) => r.top);
  resultsEl.innerHTML = visible.map(rowHtml).join('');
}

function renderLedger() {
  if (ledger.length === 0) {
    ledgerEl.innerHTML = '<li class="muted">No queries reranked yet this session.</li>';
    return;
  }
  ledgerEl.innerHTML = ledger
    .map((e) =>
      `<li><span class="ex">${e.excerpt}</span>` +
      `<span class="sc">top: ${e.topTitle} ${e.topScore.toFixed(3)}</span></li>`)
    .join('');
}

async function run() {
  clearError();
  const query = queryEl.value;
  if (!query.trim()) {
    showError('Type a query first.');
    return;
  }
  rerankBtn.disabled = true;
  rerankBtn.textContent = 'Scoring...';
  try {
    const res = await fetch('/api/rerank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `server returned ${res.status}`);
    lastResults = data;
    render(data);
    const top = data.results[0];
    ledger.unshift({ excerpt: query.trim().slice(0, 44), topTitle: top.title, topScore: top.score });
    if (ledger.length > 8) ledger.pop();
    renderLedger();
  } catch (err) {
    setEmpty();
    showError(`Rerank failed: ${err.message}. Is server.js still running?`);
  } finally {
    rerankBtn.disabled = false;
    rerankBtn.textContent = 'Rerank chunks';
  }
}

async function loadCorpus() {
  try {
    const res = await fetch('/api/corpus');
    const data = await res.json();
    corpusBody.innerHTML = data.corpus
      .map((c) =>
        `<tr><td class="mono">${c.id}</td>` +
        `<td><strong>${c.title}</strong> <span class="tx">${c.text}</span></td></tr>`)
      .join('');
  } catch (err) {
    corpusBody.innerHTML = `<tr><td colspan="2" class="tx">Corpus unavailable: ${err.message}</td></tr>`;
  }
}

chipsEl.innerHTML = '';
for (const [label, q] of EXAMPLES) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = label;
  b.addEventListener('click', () => {
    queryEl.value = q;
    queryEl.focus();
  });
  chipsEl.appendChild(b);
}

rerankBtn.addEventListener('click', run);
queryEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') run();
});
showAllEl.addEventListener('change', renderResults);
setEmpty();
loadCorpus();
