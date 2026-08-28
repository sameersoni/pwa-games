// ═══════════════════════════════════════════════════════
//  STARFIELD
// ═══════════════════════════════════════════════════════
(function buildStars() {
  const sf = document.getElementById('starfield');
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('div');
    s.className = 'star';
    const sz = .5 + Math.random() * 2.5;
    s.style.cssText = `
      width:${sz}px; height:${sz}px;
      left:${Math.random()*100}%;
      top:${Math.random()*100}%;
      animation-duration:${2+Math.random()*5}s;
      animation-delay:${-Math.random()*5}s;
    `;
    sf.appendChild(s);
  }
})();

// ═══════════════════════════════════════════════════════
//  SHAPE DEFINITIONS
// ═══════════════════════════════════════════════════════
const SHAPE_COLORS = {
  red:    'var(--s-red)',
  blue:   'var(--s-blue)',
  yellow: 'var(--s-yellow)',
  green:  'var(--s-green)',
  purple: 'var(--s-purple)',
  orange: 'var(--s-orange)',
};

const SHAPES = ['circle','square','triangle','star','diamond','heart'];
const COLORS = ['red','blue','yellow','green','purple','orange'];

function shapeSVG(shape, color, size=36) {
  const c = SHAPE_COLORS[color] || color;
  const s = size;
  const h = s/2;
  switch(shape) {
    case 'circle':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${h}" cy="${h}" r="${h-2}" fill="${c}" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/><circle cx="${h-s*.15}" cy="${h-s*.15}" r="${s*.08}" fill="rgba(255,255,255,.4)"/></svg>`;
    case 'square':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><rect x="2" y="2" width="${s-4}" height="${s-4}" rx="4" fill="${c}" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/><rect x="5" y="5" width="${s*.2}" height="${s*.1}" rx="2" fill="rgba(255,255,255,.35)"/></svg>`;
    case 'triangle':
      const t = s-2;
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${h},2 ${s-2},${s-2} 2,${s-2}" fill="${c}" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/><polygon points="${h},6 ${h+4},14 ${h-4},14" fill="rgba(255,255,255,.3)"/></svg>`;
    case 'star':
      const pts = [];
      for(let i=0;i<10;i++){
        const angle = (i*36-90)*Math.PI/180;
        const r = i%2===0 ? h-2 : h*.45;
        pts.push(`${h+r*Math.cos(angle)},${h+r*Math.sin(angle)}`);
      }
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${pts.join(' ')}" fill="${c}" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/></svg>`;
    case 'diamond':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><polygon points="${h},2 ${s-2},${h} ${h},${s-2} 2,${h}" fill="${c}" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/><polygon points="${h},6 ${h+5},${h} ${h},${h*.5}" fill="rgba(255,255,255,.3)"/></svg>`;
    case 'heart':
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><path d="M${h} ${s-4} C${h} ${s-4} 2 ${h+2} 2 ${h*.6} C2 ${h*.2} ${h*.4} 2 ${h} ${h*.55} C${h*.6} 2 ${s-2} ${h*.2} ${s-2} ${h*.6} C${s-2} ${h+2} ${h} ${s-4} ${h} ${s-4}Z" fill="${c}" stroke="rgba(255,255,255,.3)" stroke-width="1.5"/></svg>`;
    default:
      return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${h}" cy="${h}" r="${h-2}" fill="${c}"/></svg>`;
  }
}

// ═══════════════════════════════════════════════════════
//  ALIENS & ORDER GENERATION
// ═══════════════════════════════════════════════════════
const ALIENS = [
  { emoji:'👾', name:'Zorg',  voice:'Zorg hungry! Zorg want', end:'...nom nom nom! 🌟' },
  { emoji:'🤖', name:'R4-7X', voice:'PROCESSING ORDER... require', end:'. THANK. YOU. BEEP.' },
  { emoji:'👽', name:'Klorp', voice:'Greetings earthchef! Please send me', end:'for my home planet! 🌍' },
  { emoji:'🛸', name:'Vyx',   voice:'*zap zap* Vyx requests', end:'immediately! *zap*' },
  { emoji:'🦑', name:'Squix', voice:'~bubbling~ Squix desires', end:'~blorp blorp~' },
  { emoji:'🔮', name:'Orb',   voice:'The orb foretells...', end:'...it is written. ✨' },
];

// Challenge types: 'match-shape', 'match-color', 'count-shape', 'count-color', 'pattern'
function generateOrder(level) {
  const alien = ALIENS[Math.floor(Math.random()*ALIENS.length)];
  const challengePool = level <= 1
    ? ['match-shape','match-color']
    : level <= 2
    ? ['match-shape','match-color','count-shape']
    : ['match-shape','match-color','count-shape','count-color','match-both'];

  const type = challengePool[Math.floor(Math.random()*challengePool.length)];
  const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
  const color = COLORS[Math.floor(Math.random()*COLORS.length)];
  const count = 1 + Math.floor(Math.random()*Math.min(3+level,5));

  let description, validate, potLabel, requirements;

  if (type === 'match-shape') {
    description = `<strong>${count} ${shape}${count>1?'s':''}</strong> (any color!)`;
    potLabel = `${count}× ${shape}`;
    requirements = [{ shape, count }];
    validate = (pot) => {
      const matching = pot.filter(p=>p.shape===shape).length;
      return { ok: matching >= count, need: count, have: matching,
               hint: `Need ${count} ${shape}${count>1?'s':''}, have ${matching}` };
    };
  } else if (type === 'match-color') {
    description = `<strong>${count} ${color} shape${count>1?'s':''}</strong> — any shape!`;
    potLabel = `${count}× ${color}`;
    requirements = [{ color, count }];
    validate = (pot) => {
      const matching = pot.filter(p=>p.color===color).length;
      return { ok: matching >= count, need: count, have: matching,
               hint: `Need ${count} ${color}, have ${matching}` };
    };
  } else if (type === 'match-both') {
    description = `<strong>${count} ${color} ${shape}${count>1?'s':''}</strong>`;
    potLabel = `${count}× ${color} ${shape}`;
    requirements = [{ shape, color, count }];
    validate = (pot) => {
      const matching = pot.filter(p=>p.shape===shape && p.color===color).length;
      return { ok: matching >= count, need: count, have: matching,
               hint: `Need ${count} ${color} ${shape}${count>1?'s':''}, have ${matching}` };
    };
  } else if (type === 'count-shape') {
    const count2 = 1 + Math.floor(Math.random()*3);
    const shape2 = SHAPES.filter(s=>s!==shape)[Math.floor(Math.random()*(SHAPES.length-1))];
    description = `<strong>${count} ${shape}${count>1?'s':''}</strong> AND <strong>${count2} ${shape2}${count2>1?'s':''}</strong>`;
    potLabel = `${count}×${shape} + ${count2}×${shape2}`;
    requirements = [{ shape, count }, { shape: shape2, count: count2 }];
    validate = (pot) => {
      const m1 = pot.filter(p=>p.shape===shape).length;
      const m2 = pot.filter(p=>p.shape===shape2).length;
      return { ok: m1>=count && m2>=count2, need:`${count}+${count2}`, have:`${m1}+${m2}`,
               hint: `Need ${count} ${shape}s (have ${m1}) + ${count2} ${shape2}s (have ${m2})` };
    };
  } else { // count-color
    const count2 = 1 + Math.floor(Math.random()*3);
    const color2 = COLORS.filter(c=>c!==color)[Math.floor(Math.random()*(COLORS.length-1))];
    description = `<strong>${count} ${color}</strong> AND <strong>${count2} ${color2}</strong> shapes`;
    potLabel = `${count}×${color} + ${count2}×${color2}`;
    requirements = [{ color, count }, { color: color2, count: count2 }];
    validate = (pot) => {
      const m1 = pot.filter(p=>p.color===color).length;
      const m2 = pot.filter(p=>p.color===color2).length;
      return { ok: m1>=count && m2>=count2, need:`${count}+${count2}`, have:`${m1}+${m2}`,
               hint: `Need ${count} ${color} (have ${m1}) + ${count2} ${color2} (have ${m2})` };
    };
  }

  return { alien, type, shape, color, count, description, potLabel, validate, requirements };
}

// ═══════════════════════════════════════════════════════
//  GAME STATE
// ═══════════════════════════════════════════════════════
const G = {
  score: 0,
  lives: 3,
  level: 1,
  orderNum: 0,
  totalOrders: 8,
  pot: [],       // [{shape, color}]
  order: null,
  running: false,
  best: parseInt(localStorage.getItem('sk_best')||'0'),
  mistakes: 0,
};
const PROGRESS_KEY = 'shape-kitchen-progress-v1';

function loadSavedProgress() {
  return GameStorage.read(PROGRESS_KEY, null);
}

function saveProgress() {
  GameStorage.write(PROGRESS_KEY, { level: G.level, orderNum: G.orderNum, score: G.score });
}

function clearProgress() {
  GameStorage.remove(PROGRESS_KEY);
}

// ═══════════════════════════════════════════════════════
//  AUDIO
// ═══════════════════════════════════════════════════════
let ac;
function getAC() {
  if(!ac) try{ ac = new(window.AudioContext||window.webkitAudioContext)(); } catch(e){}
  return ac;
}
function beep(freq, type, dur, vol=.2) {
  const ctx=getAC(); if(!ctx) return;
  const o=ctx.createOscillator(), g=ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.type=type; o.frequency.value=freq;
  const t=ctx.currentTime;
  g.gain.setValueAtTime(vol,t);
  g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.start(t); o.stop(t+dur);
}
function playAdd()   { beep(440,'sine',.12,.15); }
function playGood()  { [523,659,784].forEach((f,i)=>setTimeout(()=>beep(f,'sine',.18,.2),i*80)); }
function playWrong() { beep(180,'sawtooth',.25,.18); }
function playLevelUp(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,'sine',.25,.25),i*100)); }
document.addEventListener('touchstart',()=>getAC(),{once:true});
document.addEventListener('click',()=>getAC(),{once:true});

// ═══════════════════════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════════════════════
function renderOrder() {
  const o = G.order;
  document.getElementById('alien-avatar').textContent = o.alien.emoji;
  document.getElementById('order-speech').innerHTML =
    `${o.alien.voice} ${o.description} ${o.alien.end}`;
  renderPot();
  renderTray();
  updateCookBtn();
}

function renderPot() {
  const pc = document.getElementById('pot-contents');
  pc.innerHTML = '';
  G.pot.forEach(item => {
    const d = document.createElement('div');
    d.className = 'pot-item';
    d.style.cssText = 'width:22px;height:22px;';
    d.innerHTML = shapeSVG(item.shape, item.color, 22);
    pc.appendChild(d);
    // bubble
    spawnBubble();
  });
}

function spawnBubble() {
  const pot = document.querySelector('.pot-body');
  const b = document.createElement('div');
  b.className = 'bubble';
  const sz = 4+Math.random()*8;
  b.style.cssText = `width:${sz}px;height:${sz}px;left:${10+Math.random()*80}%;bottom:10%;animation-duration:${.6+Math.random()*.4}s;`;
  pot.appendChild(b);
  setTimeout(()=>b.parentNode&&b.parentNode.removeChild(b), 1000);
}

function renderTray() {
  const tray = document.getElementById('shape-tray');
  tray.innerHTML = '';
  // Generate a diverse set of tiles
  const tiles = buildTrayItems();
  tiles.forEach(item => {
    const tile = document.createElement('div');
    tile.className = 'shape-tile';
    tile.innerHTML = `
      <div class="tile-shape">${shapeSVG(item.shape, item.color, 36)}</div>
      <div class="tile-label">${item.color}<br/>${item.shape}</div>
    `;
    tile.addEventListener('click', () => addToPot(tile, item));
    tile.addEventListener('touchstart', (e)=>{ e.preventDefault(); addToPot(tile, item); }, {passive:false});
    tray.appendChild(tile);
  });
}

function buildTrayItems() {
  // Guarantee enough tiles to satisfy every requirement of the order
  const o = G.order;
  const items = [];

  o.requirements.forEach(req => {
    for(let i=0;i<req.count;i++){
      const shape = req.shape || SHAPES[Math.floor(Math.random()*SHAPES.length)];
      const color = req.color || COLORS[Math.floor(Math.random()*COLORS.length)];
      items.push({shape, color});
    }
  });

  // Fill rest with random distractors, at least up to 12 tiles
  const trayTarget = Math.max(12, items.length + 4);
  while(items.length < trayTarget) {
    const shape = SHAPES[Math.floor(Math.random()*SHAPES.length)];
    const color = COLORS[Math.floor(Math.random()*COLORS.length)];
    items.push({shape, color});
  }

  // Shuffle
  return items.sort(()=>Math.random()-.5);
}

function updateHUD() {
  document.getElementById('h-score').textContent = G.score;
  document.getElementById('h-order').textContent = G.orderNum;
  document.getElementById('h-lives').textContent = '❤️'.repeat(G.lives)+'🖤'.repeat(Math.max(0,3-G.lives));
  document.getElementById('h-level').textContent = `Level ${G.level}`;
  document.getElementById('h-best').textContent = G.best;
}

function updateCookBtn() {
  const btn = document.getElementById('cook-btn');
  const v = G.order.validate(G.pot);
  btn.disabled = G.pot.length === 0;
  btn.textContent = v.ok ? '🍳 SERVE IT!' : `🥄 ${G.pot.length} in pot`;
}

// ═══════════════════════════════════════════════════════
//  INTERACTIONS
// ═══════════════════════════════════════════════════════
function addToPot(tile, item) {
  if(!G.running || G.pot.length >= 10) return;
  G.pot.push({...item});
  playAdd();
  tile.classList.add('correct-flash');
  setTimeout(()=>tile.classList.remove('correct-flash'), 300);
  renderPot();
  updateCookBtn();
  // shake tray label hint
  const lbl = document.getElementById('tray-label');
  const v = G.order.validate(G.pot);
  lbl.textContent = v.ok ? '✅ Looks good! Hit SERVE IT!' : `⬇ ${v.hint}`;
}

function serveDish() {
  if(!G.running) return;
  const v = G.order.validate(G.pot);

  if(v.ok) {
    // Correct!
    const bonus = Math.max(0, 5 - G.mistakes) * 10;
    const base = 20 + G.level * 5;
    G.score += base + bonus;
    if(G.score > G.best){ G.best = G.score; localStorage.setItem('sk_best', G.best); }
    playGood();
    burstConfetti();
    showFeedback(true, bonus);
    G.mistakes = 0;
    setTimeout(()=>{
      hideFeedback();
      nextOrder();
    }, 1800);
  } else {
    // Wrong
    G.lives--;
    G.mistakes++;
    playWrong();
    showFeedback(false, 0, v.hint);
    const potEl = document.querySelector('.pot-body');
    potEl.style.animation = 'shakeIt .35s ease-out';
    setTimeout(()=>potEl.style.animation='', 400);
    setTimeout(hideFeedback, 1400);
    updateHUD();
    if(G.lives <= 0) { setTimeout(endGame, 1600); return; }
    // clear pot and retry same order
    setTimeout(()=>{
      G.pot = [];
      renderPot();
      updateCookBtn();
      document.getElementById('tray-label').textContent = '⬇ tap shapes to add to pot';
    }, 1500);
  }
  updateHUD();
}

const GOOD_MSGS = [
  ['🌟','Stellar!','The alien is doing a happy dance!'],
  ['🚀','Blast off!','Perfect order — launching to their ship!'],
  ['✨','Cosmic!','Your cooking is out of this world!'],
  ['🎉','Warp Speed!','The alien left a 5-star review!'],
  ['💫','Nebula Nice!','Inter-galactic chef of the year!'],
];
const BAD_MSGS = [
  ['😬','Oops!',''],
  ['🛸','Wrong order!',''],
  ['⚠️','Check the recipe!',''],
];

function showFeedback(ok, bonus, hint='') {
  const fb = document.getElementById('feedback');
  const msgs = ok ? GOOD_MSGS[Math.floor(Math.random()*GOOD_MSGS.length)] : BAD_MSGS[Math.floor(Math.random()*BAD_MSGS.length)];
  document.getElementById('feedback-emoji').textContent = msgs[0];
  document.getElementById('feedback-text').textContent = msgs[1];
  document.getElementById('feedback-sub').textContent = ok
    ? (bonus>0 ? `+${20+G.level*5} pts  🌟 +${bonus} bonus!` : `+${20+G.level*5} pts!`)
    : (hint || msgs[2]);
  fb.style.borderColor = ok ? 'var(--nebula-teal)' : 'var(--nebula-pink)';
  document.getElementById('feedback-text').style.color = ok ? 'var(--nebula-teal)' : 'var(--nebula-pink)';
  fb.classList.add('show');
}
function hideFeedback() {
  document.getElementById('feedback').classList.remove('show');
}

// ═══════════════════════════════════════════════════════
//  GAME FLOW
// ═══════════════════════════════════════════════════════
function startGame() {
  const saved = loadSavedProgress();
  const resume = saved && saved.level > 1 && confirm(`Resume Level ${saved.level}?\nChoose Cancel to start from the beginning.`);
  G.score=resume ? saved.score : 0;
  G.lives=3;
  G.level=resume ? saved.level : 1;
  G.orderNum=0;
  G.mistakes=0;
  G.pot=[];
  if(!resume) clearProgress();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('hud').style.display='flex';
  document.getElementById('game-area').style.display='flex';
  G.running = true;
  updateHUD();
  nextOrder();
}

function nextOrder() {
  G.orderNum++;
  G.pot = [];

  // Level up every 3 orders
  if(G.orderNum > 1 && (G.orderNum-1) % 3 === 0) {
    G.level = Math.min(G.level+1, 4);
    playLevelUp();
  }
  saveProgress();

  if(G.orderNum > G.totalOrders) { endGame(); return; }

  G.order = generateOrder(G.level);
  renderOrder();
  updateHUD();
  document.getElementById('tray-label').textContent = '⬇ tap shapes to add to pot';
}

function endGame() {
  G.running = false;
  document.getElementById('hud').style.display='none';
  document.getElementById('game-area').style.display='none';

  const stars = G.score >= 180 ? '⭐⭐⭐' : G.score >= 100 ? '⭐⭐' : '⭐';
  const msgs = G.score >= 180
    ? 'INTERGALACTIC CHEF OF THE YEAR! The whole galaxy is talking! 🌌'
    : G.score >= 100
    ? 'Outstanding work! The aliens are very satisfied! 🛸'
    : 'Good effort, chef! The diner will reopen soon! 🍳';

  const alien = ALIENS[Math.floor(Math.random()*ALIENS.length)];
  document.getElementById('r-alien').textContent = G.score>=150 ? '🏆' : alien.emoji;
  document.getElementById('r-score').textContent = G.score;
  document.getElementById('r-stars').textContent = stars;
  document.getElementById('r-msg').textContent = msgs;

  burstConfetti(G.score >= 100 ? 50 : 20);
  document.getElementById('result-screen').classList.remove('hidden');
}

function showStart() {
  G.running=false;
  document.getElementById('result-screen').classList.add('hidden');
  document.getElementById('hud').style.display='none';
  document.getElementById('game-area').style.display='none';
  document.getElementById('start-screen').classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════
//  CONFETTI
// ═══════════════════════════════════════════════════════
const CONF_COLS = ['#FF4DA6','#00E5CC','#FFD166','#B388FF','#FF7043','#4B9FFF','#56E0A0'];
function burstConfetti(count=30) {
  for(let i=0;i<count;i++) {
    const p=document.createElement('div');
    p.className='conf-piece';
    const angle = Math.random()*360;
    const dist = 40+Math.random()*120;
    const cx = window.innerWidth*.3+Math.random()*window.innerWidth*.4;
    const cy = window.innerHeight*.2+Math.random()*window.innerHeight*.4;
    p.style.cssText=`
      left:${cx}px; top:${cy}px;
      background:${CONF_COLS[Math.floor(Math.random()*CONF_COLS.length)]};
      width:${5+Math.random()*8}px; height:${5+Math.random()*8}px;
      animation-duration:${.7+Math.random()*.7}s;
      animation-delay:${Math.random()*.3}s;
      transform:translate(${Math.cos(angle*Math.PI/180)*dist}px,${Math.sin(angle*Math.PI/180)*dist}px);
    `;
    document.body.appendChild(p);
    setTimeout(()=>p.parentNode&&p.parentNode.removeChild(p),1400);
  }
}

document.getElementById('home-btn').addEventListener('click', () => {
  if (G.running) saveProgress();
  window.location.href = '/';
});

