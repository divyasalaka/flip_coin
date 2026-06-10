let totalFlips = 0;
let headsCount = 0;
let tailsCount = 0;
let history = [];
let isFlipping = false;

function flipCoin() {
  if (isFlipping) return;
  isFlipping = true;

  const btn = document.getElementById('flip-btn');
  const coin = document.getElementById('coin');
  const resultLabel = document.getElementById('result-label');

  btn.disabled = true;
  resultLabel.textContent = '';
  resultLabel.className = 'result-label';

  const isHeads = Math.random() < 0.5;

  // Set CSS variable so the coin lands on the correct face
  // Heads = even multiples of 360 (face forward), Tails = odd (face backward)
  const baseSpins = 3 * 360; // always spin at least 3 full rotations
  const finalRotation = isHeads ? baseSpins : baseSpins + 180;
  coin.style.setProperty('--final-rotation', `${finalRotation}deg`);

  coin.classList.remove('flipping');
  // Force reflow so the animation re-triggers
  void coin.offsetWidth;
  coin.classList.add('flipping');

  setTimeout(() => {
    const result = isHeads ? 'heads' : 'tails';

    totalFlips++;
    if (isHeads) headsCount++;
    else tailsCount++;

    history.unshift(result);
    if (history.length > 5) history.pop();

    updateStats();
    updateHistory();

    resultLabel.textContent = isHeads ? 'Heads!' : 'Tails!';
    resultLabel.className = `result-label ${result}`;

    coin.classList.remove('flipping');
    // Keep coin showing the correct face after animation
    coin.style.transform = `rotateX(${finalRotation}deg)`;

    isFlipping = false;
    btn.disabled = false;
  }, 850);
}

function updateStats() {
  document.getElementById('total-flips').textContent = totalFlips;
  document.getElementById('heads-count').textContent = headsCount;
  document.getElementById('tails-count').textContent = tailsCount;

  const ratioEl = document.getElementById('ratio');
  if (totalFlips === 0) {
    ratioEl.textContent = '—';
  } else if (tailsCount === 0) {
    ratioEl.textContent = `${headsCount}:0`;
  } else if (headsCount === 0) {
    ratioEl.textContent = `0:${tailsCount}`;
  } else {
    const gcd = getGCD(headsCount, tailsCount);
    ratioEl.textContent = `${headsCount / gcd}:${tailsCount / gcd}`;
  }
}

function updateHistory() {
  const historyEl = document.getElementById('history');
  if (history.length === 0) {
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

// Initialize history display
updateHistory();
