// ─── Game State ───────────────────────────────────────────────────────────────
const COLORS = [
  { body: '#FF6B9D', knot: '#E0457A', shadow: '#C73568' },
  { body: '#FF8C42', knot: '#E06820', shadow: '#C0501A' },
  { body: '#FFD700', knot: '#DAA520', shadow: '#B8880F' },
  { body: '#56C596', knot: '#2E9E72', shadow: '#1A7D56' },
  { body: '#4ECDC4', knot: '#28A89E', shadow: '#1A8A84' },
  { body: '#C77DFF', knot: '#9B40E0', shadow: '#7B28C0' },
  { body: '#FF5757', knot: '#D92020', shadow: '#B51010' },
  { body: '#4B9FFF', knot: '#1E6FDD', shadow: '#0F50B8' },
];

const MODES = {
  letters: () => Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ'),
  numbers: () => Array.from({length:20},(_,i)=>String(i+1)),
  vowels:  () => Array.from('AEIOU'),
  mixed:   () => [...Array.from('ABCDEFGHIJ'), ...Array.from({length:10},(_,i)=>String(i+1))],
};

let state = {
  mode: 'letters',
  score: 0,
  lives: 3,
  level: 1,
  target: '',
  balloons: [],
  spawnTimer: null,
  levelTimer: null,
  balloonId: 0,
  levelScore: 0,
  levelTarget: 10,
  running: false,
  highScore: parseInt(localStorage.getItem('bp_hi') || '0'),
  targetGen: 0,
};
const PROGRESS_KEY = 'balloon-pop-progress-v1';

function loadSavedProgress() {
  return GameStorage.read(PROGRESS_KEY, null);
}

function saveProgress() {
  GameStorage.write(PROGRESS_KEY, { level: state.level, score: state.score });
}

function clearProgress() {
  GameStorage.remove(PROGRESS_KEY);
}

function selectMode(el, mode) {
  document.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.mode = mode;
}

// ─── Spawn & Logic ────────────────────────────────────────────────────────────
function pickTarget() {
  const pool = MODES[state.mode]();
  return pool[Math.floor(Math.random() * pool.length)];
}

function spawnBalloon() {
  if (!state.running) return;
  const pool = MODES[state.mode]();
  const canvas = document.getElementById('game-canvas');
  const W = canvas.offsetWidth, H = canvas.offsetHeight;

  // Decide label: ~40% chance it's the target
  const isTarget = Math.random() < 0.4;
  const label = isTarget ? state.target : pool[Math.floor(Math.random() * pool.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  const size = 64 + Math.random() * 30;
  const x = 20 + Math.random() * (W - size - 40);
  const speed = Math.max(6, 14 - state.level * 1.2); // seconds to float up

  const id = ++state.balloonId;
  const spawnGen = state.targetGen;
  const el = document.createElement('div');
  el.className = 'balloon';
  el.id = 'b' + id;
  el.style.cssText = `left:${x}px; bottom:-160px; width:${size}px;`;
  el.style.animationDuration = speed + 's';

  el.innerHTML = `
    <div class="balloon-body" style="width:${size}px;height:${size*1.15}px;background:${color.body};">
      ${label}
    </div>
    <div class="balloon-knot" style="background:${color.knot};"></div>
    <div class="balloon-string"></div>
  `;

  el.addEventListener('click', () => popBalloon(el, id, label));
  el.addEventListener('touchstart', (e) => { e.preventDefault(); popBalloon(el, id, label); }, {passive:false});
  canvas.appendChild(el);
  state.balloons.push({ id, label, el });

  // Remove when floated off
  const dur = speed * 1000;
  setTimeout(() => {
    if (!document.getElementById('b' + id)) return;
    if (el.parentNode) el.parentNode.removeChild(el);
    state.balloons = state.balloons.filter(b => b.id !== id);
    // If it was the still-active target balloon that escaped
    // (targetGen guards against a later round coincidentally reusing the same label)
    if (label === state.target && spawnGen === state.targetGen) {
      loseLife();
    }
  }, dur);
}

function popBalloon(el, id, label) {
  if (!state.running || el.classList.contains('popping')) return;
  el.classList.add('popping');

  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
    state.balloons = state.balloons.filter(b => b.id !== id);
  }, 300);

  if (label === state.target) {
    // Correct!
    state.score += 10 + state.level * 2;
    state.levelScore++;
    burstConfetti(cx, cy, 18);
    playSound('pop');
    updateHUD();
    newTarget();
    // Level up?
    if (state.levelScore >= state.levelTarget) {
      triggerLevelUp();
    }
  } else {
    // Wrong
    playSound('wrong');
    el.style.animation = 'wrongShake 0.4s ease-out';
    loseLife();
  }
}

function loseLife() {
  if (!state.running) return;
  state.lives--;
  updateHUD();
  playSound('oops');
  if (state.lives <= 0) endGame();
}

function newTarget() {
  state.target = pickTarget();
  state.targetGen++;
  const pt = document.getElementById('prompt-text');
  if (pt) {
    pt.style.transform = 'scale(1.3)';
    pt.textContent = state.target;
    setTimeout(() => pt.style.transform = 'scale(1)', 200);
  }
}

function updateHUD() {
  document.getElementById('score-val').textContent = state.score;
  const hearts = '❤️'.repeat(Math.max(0, state.lives)) + '🖤'.repeat(Math.max(0, 3 - state.lives));
  document.getElementById('lives-val').textContent = hearts;
  document.getElementById('level-val').textContent = state.level;
}

function triggerLevelUp() {
  state.running = false;
  clearInterval(state.spawnTimer);
  // Clear balloons
  document.querySelectorAll('.balloon').forEach(b => b.parentNode && b.parentNode.removeChild(b));
  state.balloons = [];

  const stars = state.levelScore >= state.levelTarget * 1.5 ? '⭐⭐⭐' : state.levelScore >= state.levelTarget ? '⭐⭐' : '⭐';
  document.getElementById('levelup-stars').textContent = stars;
  burstConfetti(window.innerWidth/2, window.innerHeight/2, 40);
  document.getElementById('level-up-screen').classList.remove('hidden');
}

function nextLevel() {
  state.level++;
  state.levelScore = 0;
  state.levelTarget = 10 + state.level * 3;
  saveProgress();
  document.getElementById('level-up-screen').classList.add('hidden');
  state.running = true;
  newTarget();
  const interval = Math.max(800, 2000 - state.level * 150);
  state.spawnTimer = setInterval(spawnBalloon, interval);
  spawnBalloon();
}

// ─── Game Lifecycle ───────────────────────────────────────────────────────────
function startGame() {
  const saved = loadSavedProgress();
  const resume = saved && saved.level > 1 && confirm(`Resume Level ${saved.level}?\nChoose Cancel to start from the beginning.`);
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('level-up-screen').classList.add('hidden');
  document.getElementById('hud').classList.remove('hidden');
  document.getElementById('level-badge').classList.remove('hidden');
  document.getElementById('prompt-banner').classList.remove('hidden');

  // Reset
  state.score = resume ? saved.score : 0;
  state.lives = 3;
  state.level = resume ? saved.level : 1;
  state.levelScore = 0;
  state.levelTarget = 12;
  if (!resume) clearProgress();
  state.balloonId = 0;
  state.balloons = [];
  state.running = true;
  document.querySelectorAll('.balloon').forEach(b => b.parentNode && b.parentNode.removeChild(b));

  updateHUD();
  newTarget();

  clearInterval(state.spawnTimer);
  const interval = Math.max(800, 2000 - state.level * 150);
  state.spawnTimer = setInterval(spawnBalloon, interval);
  spawnBalloon();
}

function endGame() {
  state.running = false;
  clearInterval(state.spawnTimer);
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('level-badge').classList.add('hidden');
  document.getElementById('prompt-banner').classList.add('hidden');
  document.querySelectorAll('.balloon').forEach(b => b.parentNode && b.parentNode.removeChild(b));

  const newHigh = state.score > state.highScore;
  if (newHigh) { state.highScore = state.score; localStorage.setItem('bp_hi', state.score); }

  document.getElementById('final-score').textContent = state.score;
  document.getElementById('go-emoji').textContent = state.score >= 60 ? '🎉' : state.score >= 30 ? '😊' : '😢';
  const stars = state.score >= 100 ? '⭐⭐⭐' : state.score >= 50 ? '⭐⭐' : '⭐';
  document.getElementById('final-stars').textContent = stars;
  document.getElementById('go-msg').textContent = newHigh
    ? `🏆 New High Score: ${state.highScore}! Amazing!`
    : `Best: ${state.highScore} pts — Keep practising!`;

  burstConfetti(window.innerWidth/2, window.innerHeight/3, 20);
  document.getElementById('game-over-screen').classList.remove('hidden');
}

function showStart() {
  state.running = false;
  clearInterval(state.spawnTimer);
  document.querySelectorAll('.balloon').forEach(b => b.parentNode && b.parentNode.removeChild(b));
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('level-badge').classList.add('hidden');
  document.getElementById('prompt-banner').classList.add('hidden');
  document.getElementById('game-over-screen').classList.add('hidden');
  document.getElementById('level-up-screen').classList.add('hidden');
  document.getElementById('start-screen').classList.remove('hidden');
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONF_COLORS = ['#FF6B9D','#FF8C42','#FFD700','#56C596','#4ECDC4','#C77DFF','#FF5757','#4B9FFF'];
function burstConfetti(x, y, count) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    const angle = (Math.random() * 360);
    const dist = 30 + Math.random() * 80;
    const dx = Math.cos(angle * Math.PI / 180) * dist;
    const dy = -Math.abs(Math.sin(angle * Math.PI / 180) * dist) - 20;
    p.style.cssText = `
      left:${x}px; top:${y}px;
      background:${CONF_COLORS[Math.floor(Math.random()*CONF_COLORS.length)]};
      width:${6+Math.random()*8}px; height:${6+Math.random()*8}px;
      animation-duration:${0.6+Math.random()*0.6}s;
      transform:translate(${dx}px, ${dy}px);
    `;
    document.body.appendChild(p);
    setTimeout(() => p.parentNode && p.parentNode.removeChild(p), 1200);
  }
}

// ─── Sound (Web Audio) ────────────────────────────────────────────────────────
let audioCtx;
function getAudio() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  return audioCtx;
}
function playSound(type) {
  const ctx = getAudio();
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  const t = ctx.currentTime;
  if (type === 'pop') {
    o.type = 'sine';
    o.frequency.setValueAtTime(523, t);
    o.frequency.exponentialRampToValueAtTime(1046, t + 0.1);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.start(t); o.stop(t + 0.25);
  } else if (type === 'wrong') {
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.2);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.start(t); o.stop(t + 0.2);
  } else if (type === 'oops') {
    o.type = 'triangle';
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(100, t + 0.3);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.start(t); o.stop(t + 0.3);
  }
}

// Unlock audio on first touch
document.addEventListener('touchstart', () => getAudio(), { once: true });
document.addEventListener('click', () => getAudio(), { once: true });

function goHome() {
  if (state.running) saveProgress();
  window.location.href = '/';
}

