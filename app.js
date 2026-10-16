const $ = id => document.getElementById(id);
const HIGH_SCORE_KEY = 'reelFacesHighScore';
const FIXED_IMAGE_PATH = './assets/catch.png';

const state = {
  playerName: 'Guest',
  roundLength: 60,
  timeLeft: 60,
  totalWeight: 0,
  bestCatch: 0,
  catchCount: 0,
  catchLog: [],
  highScore: Number(localStorage.getItem(HIGH_SCORE_KEY) || 0),
  fishImage: FIXED_IMAGE_PATH,
  running: false,
  paused: false,
  timer: null,
  spawnTimer: null,
  deferredPrompt: null,
};

const screens = {
  setup: $('setupScreen'),
  game: $('gameScreen'),
  results: $('resultsScreen')
};

function showScreen(name) {
  Object.values(screens).forEach(el => el.classList.add('hidden'));
  screens[name].classList.remove('hidden');
}

function formatWeight(value) {
  return `${Number(value).toFixed(2)} lbs`;
}

function updateHud() {
  $('hudPlayer').textContent = state.playerName;
  $('hudTime').textContent = `${state.timeLeft}s`;
  $('hudWeight').textContent = formatWeight(state.totalWeight);
  $('hudBest').textContent = formatWeight(state.bestCatch);
  $('hudCount').textContent = String(state.catchCount);
  $('hudHigh').textContent = formatWeight(state.highScore);
}

function renderPreview() {
  $('photoPreview').src = state.fishImage;
}

function resetRound() {
  clearInterval(state.timer);
  clearTimeout(state.spawnTimer);
  state.timeLeft = state.roundLength;
  state.totalWeight = 0;
  state.bestCatch = 0;
  state.catchCount = 0;
  state.catchLog = [];
  state.running = false;
  state.paused = false;
  $('gameArea').innerHTML = '';
  updateHud();
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function spawnFish() {
  if (!state.running || state.paused) return;

  const area = $('gameArea');
  const template = $('fishTemplate');
  const fish = template.content.firstElementChild.cloneNode(true);
  const face = fish.querySelector('.fish-character');
  const badge = fish.querySelector('.fish-weight-badge');

  const fromRight = Math.random() > 0.5;
  const y = randomBetween(12, Math.max(24, area.clientHeight - 170));
  const weight = Number(randomBetween(1.2, 18.8).toFixed(2));
  const speedFactor = Math.max(1.6, 5.2 - weight / 5);
  const duration = randomBetween(speedFactor, speedFactor + 2.4);

  if (fromRight) {
    fish.classList.add('from-right');
    fish.style.left = `${area.clientWidth + 20}px`;
    fish.style.setProperty('--travel', `-${area.clientWidth + 220}px`);
  } else {
    fish.style.left = `-160px`;
    fish.style.setProperty('--travel', `${area.clientWidth + 220}px`);
  }

  fish.style.top = `${y}px`;
  fish.style.animationDuration = `${duration}s`;
  face.src = state.fishImage;
  badge.textContent = `${weight} lbs`;
  fish.dataset.weight = String(weight);

  fish.addEventListener('click', () => catchFish(fish));
  fish.addEventListener('animationend', () => fish.remove());

  area.appendChild(fish);

  const delay = randomBetween(350, 1100);
  state.spawnTimer = setTimeout(spawnFish, delay);
}

function createEffect(x, y, text) {
  const area = $('gameArea');
  const splash = document.createElement('div');
  splash.className = 'splash';
  splash.style.left = `${x - 10}px`;
  splash.style.top = `${y - 10}px`;

  const float = document.createElement('div');
  float.className = 'catch-float';
  float.style.left = `${x - 20}px`;
  float.style.top = `${y - 10}px`;
  float.textContent = text;

  area.append(splash, float);
  splash.addEventListener('animationend', () => splash.remove());
  float.addEventListener('animationend', () => float.remove());
}

function catchFish(fish) {
  if (!state.running || state.paused || fish.classList.contains('caught')) return;

  fish.classList.add('caught');
  const weight = Number(fish.dataset.weight || 0);
  state.totalWeight = Number((state.totalWeight + weight).toFixed(2));
  state.bestCatch = Math.max(state.bestCatch, weight);
  state.catchCount += 1;
  state.catchLog.unshift({ weight, timeLeft: state.timeLeft, player: state.playerName });

  const rect = fish.getBoundingClientRect();
  const areaRect = $('gameArea').getBoundingClientRect();
  createEffect(rect.left - areaRect.left + rect.width / 2, rect.top - areaRect.top + rect.height / 2, `+${weight.toFixed(2)} lbs`);

  updateHud();
  setTimeout(() => fish.remove(), 430);
}

function tick() {
  if (!state.running || state.paused) return;
  state.timeLeft -= 1;
  updateHud();
  if (state.timeLeft <= 0) endGame();
}

function renderCatchLog() {
  const log = $('catchLog');
  if (!state.catchLog.length) {
    log.innerHTML = '<div class="catch-item"><div><strong>No fish caught this round</strong><small>Try again and chase a bigger haul.</small></div></div>';
    return;
  }
  log.innerHTML = state.catchLog.map((entry, index) => `
      <div class="catch-item">
        <div>
          <strong>Catch #${state.catchLog.length - index}</strong>
          <small>Caught with ${entry.timeLeft}s left</small>
        </div>
        <strong>${formatWeight(entry.weight)}</strong>
      </div>`).join('');
}

function finishResults(isRecord) {
  $('finalWeight').textContent = formatWeight(state.totalWeight);
  $('finalBest').textContent = formatWeight(state.bestCatch);
  $('finalCount').textContent = String(state.catchCount);
  $('finalHigh').textContent = formatWeight(state.highScore);
  $('newRecordBanner').classList.toggle('hidden', !isRecord);
  renderCatchLog();
  showScreen('results');
}

function endGame() {
  if (!state.running && !state.paused) return;
  state.running = false;
  state.paused = false;
  clearInterval(state.timer);
  clearTimeout(state.spawnTimer);
  document.querySelectorAll('.fish').forEach(el => el.remove());

  let isRecord = false;
  if (state.totalWeight > state.highScore) {
    state.highScore = Number(state.totalWeight.toFixed(2));
    localStorage.setItem(HIGH_SCORE_KEY, String(state.highScore));
    isRecord = true;
  }

  updateHud();
  finishResults(isRecord);
}

function startGame() {
  state.playerName = $('playerName').value.trim() || 'Guest';
  state.roundLength = Number($('roundLength').value || 60);
  resetRound();
  state.running = true;
  $('pauseBtn').textContent = 'Pause';
  updateHud();
  showScreen('game');
  spawnFish();
  state.timer = setInterval(tick, 1000);
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  $('pauseBtn').textContent = state.paused ? 'Resume' : 'Pause';
  if (!state.paused) {
    document.querySelectorAll('.fish').forEach(f => f.style.animationPlayState = 'running');
    spawnFish();
  } else {
    clearTimeout(state.spawnTimer);
    document.querySelectorAll('.fish').forEach(f => f.style.animationPlayState = 'paused');
  }
}

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    state.deferredPrompt = event;
    $('installBtn').classList.remove('hidden');
  });

  $('installBtn').addEventListener('click', async () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    $('installBtn').classList.add('hidden');
  });
}

function bindEvents() {
  $('startGameBtn').addEventListener('click', startGame);
  $('pauseBtn').addEventListener('click', togglePause);
  $('endGameBtn').addEventListener('click', endGame);
  $('playAgainBtn').addEventListener('click', startGame);
  $('backToStartBtn').addEventListener('click', () => showScreen('setup'));

  window.addEventListener('resize', () => {
    if (!state.running) return;
    document.querySelectorAll('.fish').forEach(f => f.remove());
  });
}

function init() {
  renderPreview();
  updateHud();
  bindEvents();
  setupInstallPrompt();
  showScreen('setup');
}

init();
