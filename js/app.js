/* ============================================================
   Finio – app.js
   CS50 Final Project – Personal Finance Tracker
   ============================================================ */

// ── Categories ─────────────
const EXPENSE_CATS = [
  'Food & Dining', 'Housing', 'Transportation', 'Utilities',
  'Healthcare', 'Entertainment', 'Shopping', 'Education',
  'Travel', 'Subscriptions', 'Personal Care', 'Other'
];
const INCOME_CATS = [
  'Salary', 'Business', 'Investments',
  'Gift', 'Refund', 'Other Income'
];
const CAT_ICONS = {
  'Food & Dining':'🍔','Housing':'🏠','Transportation':'🚗',
  'Utilities':'💡','Healthcare':'🏥','Entertainment':'🎬',
  'Shopping':'🛍️','Education':'📚','Travel':'✈️',
  'Subscriptions':'📱','Personal Care':'💄','Other':'📌',
  'Salary':'💼','Freelance':'💻','Business':'🏢',
  'Investments':'📈','Gift':'🎁','Refund':'↩️','Other Income':'💰'
};
const CHART_COLORS = [
  '#6366f1','#22c55e','#f59e0b','#f43f5e','#3b82f6',
  '#8b5cf6','#10b981','#ef4444','#06b6d4','#84cc16','#ec4899','#14b8a6'
];

// ── State ─────────────────────
let transactions = [];
let budgets      = {};
let currentType  = 'income';
let barChart, donutChart, lineChart;

// ── Init ────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  setDateDefaults();
  populateCategories();
  renderAll();
  document.getElementById('dashDate').textContent =
    new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
});

function loadData() {
  try {
    transactions = JSON.parse(localStorage.getItem('finio_transactions') || '[]');
    budgets      = JSON.parse(localStorage.getItem('finio_budgets')      || '{}');
  } catch(e) { transactions = []; budgets = {}; }
}

function saveData() {
  localStorage.setItem('finio_transactions', JSON.stringify(transactions));
  localStorage.setItem('finio_budgets',      JSON.stringify(budgets));
}

function todayStr(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function setDateDefaults() {
  const today = todayStr();
  document.getElementById('txDate').value = today;
  const ym = today.slice(0, 7);
  document.getElementById('filterMonth').value = ym;
}

// ── Page navigation ───────────
function showPage(page, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  btn.classList.add('active');
  renderAll();
}

// ── Transaction type toggle ────────────
function setType(type) {
  currentType = type;
  document.getElementById('typeIncome').classList.toggle('active', type === 'income');
  document.getElementById('typeExpense').classList.toggle('active', type === 'expense');
  document.getElementById('typeIncome').classList.toggle('income-type', type === 'income');
  document.getElementById('typeExpense').classList.toggle('expense-type', type === 'expense');
  populateCategories();
}

function populateCategories() {
  const cats = currentType === 'income' ? INCOME_CATS : EXPENSE_CATS;
  const sel  = document.getElementById('txCategory');
  sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  // budget modal
  const bsel = document.getElementById('budgetCategory');
  bsel.innerHTML = EXPENSE_CATS.map(c => `<option value="${c}">${c}</option>`).join('');
  // filter
  const fsel = document.getElementById('filterCategory');
  const all  = [...INCOME_CATS, ...EXPENSE_CATS];
  fsel.innerHTML = `<option value="all">All Categories</option>` +
    all.map(c => `<option value="${c}">${c}</option>`).join('');
}

// ── Add transaction ──────────
function addTransaction() {
  const desc   = document.getElementById('txDesc').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date   = document.getElementById('txDate').value;
  const cat    = document.getElementById('txCategory').value;
  const note   = document.getElementById('txNote').value.trim();

  if (!desc)         return alert('Please enter a description.');
  if (!amount || amount <= 0) return alert('Please enter a valid amount.');
  if (!date)         return alert('Please select a date.');

  const tx = {
    id: Date.now().toString(),
    type: currentType,
    desc, amount, date, category: cat, note
  };
  transactions.unshift(tx);
  saveData();
  closeModal('add-modal');
  clearForm();
  renderAll();
}

function clearForm() {
  document.getElementById('txDesc').value   = '';
  document.getElementById('txAmount').value = '';
  document.getElementById('txNote').value   = '';
  setDateDefaults();
}

// ── Delete transaction ─────────────────────────
function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderAll();
}

// ── Budget ──────────────────────
function saveBudget() {
  const cat    = document.getElementById('budgetCategory').value;
  const amount = parseFloat(document.getElementById('budgetAmount').value);
  if (!amount || amount <= 0) return alert('Please enter a valid amount.');
  budgets[cat] = amount;
  saveData();
  closeModal('budget-modal');
  document.getElementById('budgetAmount').value = '';
  renderBudget();
}

function deleteBudget(cat) {
  delete budgets[cat];
  saveData();
  renderBudget();
}

// ── Totals ───────────────
function getTotals(txList) {
  return txList.reduce((acc, t) => {
    if (t.type === 'income')  acc.income  += t.amount;
    else                      acc.expense += t.amount;
    return acc;
  }, { income: 0, expense: 0 });
}

function getThisMonth() {
  const ym = todayStr().slice(0, 7);
  return transactions.filter(t => t.date.startsWith(ym));
}

// ── Render all ─────────────────────────────────
function renderAll() {
  renderSummary();
  renderRecentTransactions();
  renderTransactions();
  renderBudget();
  renderCharts();
  renderReports();
}

// ── Dashboard summary ─────────────────
function renderSummary() {
  const all  = getTotals(transactions);
  const net  = all.income - all.expense;
  const rate = all.income > 0 ? ((net / all.income) * 100).toFixed(1) : 0;
  const incCount = transactions.filter(t => t.type === 'income').length;
  const expCount = transactions.filter(t => t.type === 'expense').length;

  document.getElementById('totalIncome').textContent   = fmt(all.income);
  document.getElementById('totalExpenses').textContent = fmt(all.expense);
  document.getElementById('netBalance').textContent    = fmt(net);
  document.getElementById('savingsRate').textContent   = rate + '%';
  document.getElementById('incomeCount').textContent   = `${incCount} transaction${incCount !== 1 ? 's' : ''}`;
  document.getElementById('expenseCount').textContent  = `${expCount} transaction${expCount !== 1 ? 's' : ''}`;

  const balEl = document.getElementById('netBalance');
  balEl.style.color = net >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('balanceStatus').textContent =
    net >= 0 ? '▲ Positive balance' : '▼ Spending exceeds income';
}

// ── Recent transactions ───────────────────
function renderRecentTransactions() {
  const recent = transactions.slice(0, 8);
  const el     = document.getElementById('recentList');
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state" style="padding:2rem">
      <div class="empty-icon">↕</div><p>No transactions yet.</p></div>`;
    return;
  }
  el.innerHTML = recent.map(txHTML).join('');
}

// ── All transactions (with filters) ───────────
function renderTransactions() {
  const type  = document.getElementById('filterType').value;
  const cat   = document.getElementById('filterCategory').value;
  const month = document.getElementById('filterMonth').value;

  let list = [...transactions];
  if (type  !== 'all') list = list.filter(t => t.type === type);
  if (cat   !== 'all') list = list.filter(t => t.category === cat);
  if (month)           list = list.filter(t => t.date.startsWith(month));

  const el    = document.getElementById('transactionList');
  const empty = document.getElementById('transEmpty');

  if (!list.length) {
    el.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  el.innerHTML = list.map(txHTML).join('');
}

function txHTML(t) {
  const icon = CAT_ICONS[t.category] || '💳';
  const sign = t.type === 'income' ? '+' : '-';
  return `
    <div class="tx-item">
      <div class="tx-icon ${t.type}">${icon}</div>
      <div class="tx-info">
        <div class="tx-desc">${escHTML(t.desc)}</div>
        <div class="tx-meta">
          ${formatDate(t.date)} &nbsp;·&nbsp;
          <span class="cat-badge">${t.category}</span>
          ${t.note ? ` &nbsp;·&nbsp; ${escHTML(t.note)}` : ''}
        </div>
      </div>
      <div class="tx-amount ${t.type}">${sign}${fmt(t.amount)}</div>
      <button class="tx-delete" onclick="deleteTransaction('${t.id}')" title="Delete">✕</button>
    </div>`;
}

function resetFilters() {
  document.getElementById('filterType').value     = 'all';
  document.getElementById('filterCategory').value = 'all';
  document.getElementById('filterMonth').value    = todayStr().slice(0, 7);
  renderTransactions();
}

// ── Budget ──────────────────
function renderBudget() {
  const el    = document.getElementById('budgetList');
  const empty = document.getElementById('budgetEmpty');
  const keys  = Object.keys(budgets);

  if (!keys.length) { el.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  const thisMonth = getThisMonth();
  el.innerHTML = keys.map(cat => {
    const limit   = budgets[cat];
    const spent   = thisMonth.filter(t => t.type === 'expense' && t.category === cat)
                             .reduce((s, t) => s + t.amount, 0);
    const pct     = Math.min((spent / limit) * 100, 100);
    const over    = spent > limit;
    const color   = over ? 'var(--red)' : pct > 75 ? 'var(--gold)' : 'var(--green)';
    const remaining = limit - spent;
    return `
      <div class="budget-item">
        <div class="budget-item-hdr">
          <div class="budget-cat">${CAT_ICONS[cat] || '📌'} ${cat}</div>
          <div style="display:flex;align-items:center;gap:.75rem">
            <div class="budget-amounts">${fmt(spent)} / ${fmt(limit)}</div>
            <button class="budget-delete" onclick="deleteBudget('${cat}')">✕</button>
          </div>
        </div>
        <div class="budget-bar-bg">
          <div class="budget-bar-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="budget-status" style="color:${color}">
          ${over ? `▲ Over budget by ${fmt(Math.abs(remaining))}` : `${fmt(remaining)} remaining`}
        </div>
      </div>`;
  }).join('');
}

// ── Charts ───────────────────────────────
function renderCharts() {
  renderBarChart();
  renderDonutChart();
}

function getLast6Months() {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    months.push(todayStr(d).slice(0, 7));
  }
  return months;
}

function renderBarChart() {
  const months = getLast6Months();
  const labels = months.map(m => {
    const [y, mo] = m.split('-');
    return new Date(y, mo - 1).toLocaleString('default', { month: 'short' });
  });
  const incomeData  = months.map(m => transactions.filter(t => t.type === 'income'  && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
  const expenseData = months.map(m => transactions.filter(t => t.type === 'expense' && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));

  const ctx = document.getElementById('barChart').getContext('2d');
  if (barChart) barChart.destroy();
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Income',   data: incomeData,  backgroundColor: 'rgba(34,197,94,0.7)',  borderRadius: 4 },
        { label: 'Expenses', data: expenseData, backgroundColor: 'rgba(244,63,94,0.7)',  borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { labels: { color: '#9ca3af', font: { family: 'Epilogue', size: 11 } } } },
      scales: {
        x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#6b7280', callback: v => '$'+v }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

function renderDonutChart() {
  const expenses = transactions.filter(t => t.type === 'expense');
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const sorted = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0, 6);

  const ctx = document.getElementById('donutChart').getContext('2d');
  if (donutChart) donutChart.destroy();

  if (!sorted.length) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    document.getElementById('donutLegend').innerHTML =
      '<p style="color:var(--muted);font-size:.8rem;text-align:center">No expense data yet</p>';
    return;
  }

  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: sorted.map(([k]) => k),
      datasets: [{ data: sorted.map(([,v]) => v), backgroundColor: CHART_COLORS, borderWidth: 0, hoverOffset: 6 }]
    },
    options: {
      responsive: true, maintainAspectRatio: true, cutout: '70%',
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: ctx => ` ${ctx.label}: ${fmt(ctx.raw)}` }
      }}
    }
  });

  document.getElementById('donutLegend').innerHTML = sorted.map(([cat, amt], i) =>
    `<div class="legend-item">
       <div class="legend-dot" style="background:${CHART_COLORS[i]}"></div>
       <span style="flex:1">${cat}</span>
       <span style="font-family:var(--font-mono);font-size:.75rem;color:var(--muted2)">${fmt(amt)}</span>
     </div>`
  ).join('');
}

// ── Reports ─────────────
function renderReports() {
  renderLineChart();
  renderTopCategories();
  renderMonthlySummary();
}

function renderLineChart() {
  const months = getLast6Months();
  const labels = months.map(m => {
    const [y, mo] = m.split('-');
    return new Date(y, mo-1).toLocaleString('default', { month: 'short', year: '2-digit' });
  });
  const data = months.map(m => transactions.filter(t => t.type==='expense' && t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));

  const ctx = document.getElementById('lineChart').getContext('2d');
  if (lineChart) lineChart.destroy();
  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Expenses', data,
        borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4, fill: true, pointBackgroundColor: '#6366f1', pointRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#6b7280', callback: v => '$'+v }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    }
  });
}

function renderTopCategories() {
  const el = document.getElementById('topCategories');
  const expenses = transactions.filter(t => t.type === 'expense');
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const sorted = Object.entries(catTotals).sort((a,b) => b[1]-a[1]).slice(0, 6);
  const max = sorted[0]?.[1] || 1;

  if (!sorted.length) { el.innerHTML = '<p style="color:var(--muted);font-size:.85rem">No data yet</p>'; return; }

  el.innerHTML = sorted.map(([cat, amt], i) => `
    <div class="top-cat-item">
      <span>${CAT_ICONS[cat] || '📌'}</span>
      <span class="top-cat-name">${cat}</span>
      <div class="top-cat-bar-bg">
        <div class="top-cat-bar" style="width:${(amt/max*100).toFixed(1)}%;background:${CHART_COLORS[i]}"></div>
      </div>
      <span class="top-cat-amt">${fmt(amt)}</span>
    </div>`).join('');
}

function renderMonthlySummary() {
  const el = document.getElementById('monthlySummary');
  const months = getLast6Months().reverse();
  if (!transactions.length) { el.innerHTML = '<p style="color:var(--muted);font-size:.85rem">No data yet</p>'; return; }

  el.innerHTML = months.map(m => {
    const label = new Date(m + '-01').toLocaleString('default', { month: 'long', year: 'numeric' });
    const txs   = transactions.filter(t => t.date.startsWith(m));
    if (!txs.length) return '';
    const { income, expense } = getTotals(txs);
    const net = income - expense;
    return `<div class="month-row">
      <span class="month-name">${label}</span>
      <span class="month-net" style="color:${net>=0?'var(--green)':'var(--red)'}">${net>=0?'+':''}${fmt(net)}</span>
    </div>`;
  }).filter(Boolean).join('') || '<p style="color:var(--muted);font-size:.85rem">No data yet</p>';
}

// ── Modals ───────────────────────────
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.add('hidden');
  }
});

// ── Clear all data ─────────────────────────────
function confirmClear() { openModal('confirm-modal'); }
function clearAllData() {
  transactions = []; budgets = {};
  saveData();
  closeModal('confirm-modal');
  renderAll();
}

// ── Helpers ───────────────────────────
function fmt(n) {
  return '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function escHTML(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
