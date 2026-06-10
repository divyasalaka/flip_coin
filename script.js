// ── Auth ──────────────────────────────────────────────

let currentUser = null;
let isFlipping = false;
let prediction = null;
let betAmount = 10;

function getUsers() {
  return JSON.parse(localStorage.getItem('cf_users') || '{}');
}

function saveUsers(users) {
  localStorage.setItem('cf_users', JSON.stringify(users));
}

function showTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('auth-submit-btn').textContent = tab === 'login' ? 'Sign In' : 'Sign Up';
  document.getElementById('auth-error').textContent = '';
  document.getElementById('auth-form').dataset.mode = tab;
}

function handleAuth(e) {
  e.preventDefault();
  const mode = document.getElementById('auth-form').dataset.mode || 'login';
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  const users = getUsers();

  if (mode === 'signup') {
    if (users[username]) {
      errorEl.textContent = 'Username already taken.';
      return;
    }
    users[username] = {
      password,
      stats: { total: 0, heads: 0, tails: 0, history: [], balance: 100 }
    };
    saveUsers(users);
    loadUser(username);
  } else {
    if (!users[username] || users[username].password !== password) {
      errorEl.textContent = 'Incorrect username or password.';
      return;
    }
    loadUser(username);
  }
}

function loadUser(username) {
  currentUser = username;
  localStorage.setItem('cf_current_user', username);

  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('welcome-msg').textContent = `Hi, ${username}`;

  const stats = getUsers()[username].stats;
  if (stats.balance === undefined) stats.balance = 100;

  prediction = null;
  betAmount = 10;
  resetPredictionUI();
  syncStatsToDOM(stats);
  updateHistory(stats.history);
}

function signOut() {
  currentUser = null;
  prediction = null;
  localStorage.removeItem('cf_current_user');
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-error').textContent = '';
}

(function init() {
  const saved = localStorage.getItem('cf_current_user');
  if (saved && getUsers()[saved]) {
    loadUser(saved);
  }
  document.getElementById('auth-form').dataset.mode = 'login';
})();

// ── Prediction & Bet ──────────────────────────────────

function setPrediction(side) {
  prediction = side;
  document.getElementById('predict-heads').className =
    'predict-btn' + (side === 'heads' ? ' selected-heads' : '');
  document.getElementById('predict-tails').className =
    'predict-btn' + (side === 'tails' ? ' selected-tails' : '');

  const btn = document.getElementById('flip-btn');
  btn.disabled = false;
  btn.textContent = 'Flip Coin';
}

function changeBet(delta) {
  const users = getUsers();
  const balance = users[currentUser]?.stats?.balance ?? 100;
  betAmount = Math.min(Math.max(betAmount + delta, 5), Math.min(balance, 500));
  document.getElementById('bet-amount').textContent = `$${betAmount}`;
}

function resetPredictionUI() {
  prediction = null;
  document.getElementById('predict-heads').className = 'predict-btn';
  document.getElementById('predict-tails').className = 'predict-btn';
  document.getElementById('result-label').textContent = '';
  document.getElementById('result-label').className = 'result-label';
  document.getElementById('payout-label').textContent = '';
  document.getElementById('payout-label').className = 'payout-label';
  document.getElementById('flip-btn').disabled = true;
  document.getElementById('flip-btn').textContent = 'Pick a side first';
  document.getElementById('bet-amount').textContent = `$${betAmount}`;
}

// ── Coin Flip ─────────────────────────────────────────

function flipCoin() {
  if (isFlipping || !prediction) return;
  isFlipping = true;

  const btn = document.getElementById('flip-btn');
  const coin = document.getElementById('coin');
  const resultLabel = document.getElementById('result-label');
  const payoutLabel = document.getElementById('payout-label');

  btn.disabled = true;
  resultLabel.textContent = '';
  resultLabel.className = 'result-label';
  payoutLabel.textContent = '';
  payoutLabel.className = 'payout-label';

  document.getElementById('predict-heads').disabled = true;
  document.getElementById('predict-tails').disabled = true;

  const isHeads = Math.random() < 0.5;
  const baseSpins = 3 * 360;
  const finalRotation = isHeads ? baseSpins : baseSpins + 180;
  coin.style.setProperty('--final-rotation', `${finalRotation}deg`);

  coin.classList.remove('flipping');
  void coin.offsetWidth;
  coin.classList.add('flipping');

  setTimeout(() => {
    const result = isHeads ? 'heads' : 'tails';
    const won = result === prediction;

    const users = getUsers();
    const stats = users[currentUser].stats;
    if (stats.balance === undefined) stats.balance = 100;

    stats.total++;
    if (isHeads) stats.heads++; else stats.tails++;
    stats.history.unshift(result);
    if (stats.history.length > 5) stats.history.pop();

    const payout = won ? betAmount : -betAmount;
    stats.balance = Math.max(0, stats.balance + payout);

    saveUsers(users);
    syncStatsToDOM(stats);
    updateHistory(stats.history);

    resultLabel.textContent = isHeads ? 'Heads!' : 'Tails!';
    resultLabel.className = `result-label ${result}`;

    if (won) {
      payoutLabel.textContent = `+$${betAmount} — Correct!`;
      payoutLabel.className = 'payout-label win';
      flashBalance('win-flash');
    } else {
      payoutLabel.textContent = `-$${betAmount} — Wrong!`;
      payoutLabel.className = 'payout-label lose';
      flashBalance('lose-flash');
    }

    coin.classList.remove('flipping');
    coin.style.transform = `rotateX(${finalRotation}deg)`;

    isFlipping = false;

    document.getElementById('predict-heads').disabled = false;
    document.getElementById('predict-tails').disabled = false;

    if (stats.balance === 0) {
      setTimeout(() => {
        alert("You're out of money! Starting balance reset to $100.");
        const u = getUsers();
        u[currentUser].stats.balance = 100;
        saveUsers(u);
        syncStatsToDOM(u[currentUser].stats);
      }, 600);
    }

    resetPredictionUI();
    syncStatsToDOM(getUsers()[currentUser].stats);
  }, 850);
}

function flashBalance(cls) {
  const el = document.getElementById('balance');
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 800);
}

function syncStatsToDOM(stats) {
  document.getElementById('total-flips').textContent = stats.total;
  document.getElementById('heads-count').textContent = stats.heads;
  document.getElementById('tails-count').textContent = stats.tails;
  document.getElementById('balance').textContent = `$${stats.balance ?? 100}`;

  const balance = stats.balance ?? 100;
  betAmount = Math.min(betAmount, Math.max(balance, 5));
  document.getElementById('bet-amount').textContent = `$${betAmount}`;

  const ratioEl = document.getElementById('ratio');
  if (stats.total === 0) {
    ratioEl.textContent = '—';
  } else if (stats.tails === 0) {
    ratioEl.textContent = `${stats.heads}:0`;
  } else if (stats.heads === 0) {
    ratioEl.textContent = `0:${stats.tails}`;
  } else {
    const gcd = getGCD(stats.heads, stats.tails);
    ratioEl.textContent = `${stats.heads / gcd}:${stats.tails / gcd}`;
  }
}

function updateHistory(history) {
  const historyEl = document.getElementById('history');
  if (!history.length) {
    historyEl.innerHTML = '<span class="history-placeholder">No flips yet</span>';
    return;
  }
  historyEl.innerHTML = history
    .map(r => `<div class="history-item ${r}">${r === 'heads' ? 'H' : 'T'}</div>`)
    .join('');
}

function getGCD(a, b) {
  return b === 0 ? a : getGCD(b, a % b);
}
