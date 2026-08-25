(function(){
  "use strict";

  (function makeStars(){
    const field = document.getElementById('starfield');
    for(let i=0;i<70;i++){
      const s = document.createElement('div');
      s.className = 'star';
      const size = (Math.random()*2 + 0.6).toFixed(1);
      s.style.width = size+'px';
      s.style.height = size+'px';
      s.style.top = (Math.random()*100)+'%';
      s.style.left = (Math.random()*100)+'%';
      s.style.animationDuration = (Math.random()*3 + 1.8)+'s';
      s.style.animationDelay = (Math.random()*3)+'s';
      field.appendChild(s);
    }
  })();

  let audioCtx = null;
  let soundOn = true;
  function ensureAudio(){
    if(!audioCtx){
      try{ audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e){ return null; }
    }
    if(audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone(freq, dur, opts){
    opts = opts || {};
    if(!soundOn) return;
    const ctx = ensureAudio(); if(!ctx) return;
    const t0 = ctx.currentTime + (opts.delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if(opts.slideTo) osc.frequency.linearRampToValueAtTime(opts.slideTo, t0 + dur);
    const vol = opts.vol !== undefined ? opts.vol : 0.16;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }
  const SFX = {
    select: ()=> tone(720, 0.07, {type:'sine', vol:0.12}),
    correct: ()=>{ tone(660,0.09,{type:'triangle',vol:0.18}); tone(990,0.12,{type:'triangle',vol:0.16,delay:0.08}); },
    wrong: ()=> tone(170, 0.18, {type:'sawtooth', vol:0.15, slideTo:90}),
    hint: ()=> tone(420, 0.35, {type:'sine', vol:0.12, slideTo:920}),
    button: ()=> tone(500, 0.05, {type:'square', vol:0.08}),
    complete: ()=> [523,659,784,1047].forEach((f,i)=> tone(f,0.18,{type:'triangle',vol:0.16,delay:i*0.11}))
  };
  function unlockAudioOnce(){ ensureAudio(); document.removeEventListener('pointerdown', unlockAudioOnce); }
  document.addEventListener('pointerdown', unlockAudioOnce, {once:true});

  const btnMute = document.getElementById('btnMute');
  btnMute.addEventListener('click', ()=>{
    soundOn = !soundOn;
    btnMute.textContent = soundOn ? '🔊' : '🔇';
    if(soundOn) SFX.button();
    progress.soundOn = soundOn;
    saveProgress();
  });

  const WORDS = [
    "CAT","DOG","FOX","OWL","BEE","ANT","PIG","COW","BAT","RAT","SUN","SEA","TEA","PEN","CUP","BED","ARM","EAR","EYE","LEG","RED","TAN","JOY","RUN","GYM","FIG",
    "LION","BEAR","DEER","GOAT","HAWK","SEAL","WOLF","FROG","DUCK","SWAN","KIWI","PLUM","LIME","PEAR","BLUE","GOLD","PINK","RAIN","WIND","SNOW","MOON","MARS","STAR","WAVE","FISH","TIDE","REEF","CRAB","BOOK","DESK","LAMP","DOOR","HAND","FEAR","LOVE","CALM","LEAF","TREE","ROCK","CHIP","BYTE","GOAL","RACE","TEAM","SWIM","JAZZ","CODE","BUS","VAN","BIKE","BOAT","CAR",
    "APPLE","GRAPE","MANGO","LEMON","PEACH","MELON","GREEN","BLACK","WHITE","BROWN","CLOUD","STORM","FROST","COMET","ORBIT","SPACE","VENUS","PLUTO","OCEAN","WHALE","CORAL","ANCHOR","BREAD","PASTA","PIZZA","SALAD","HAPPY","ANGRY","PROUD","BRAVE","RIVER","STONE","ROBOT","CHESS","TABLE","CHAIR","PIANO","DRUMS","TRAIN","TRUCK","PLANE","HORSE","MOUSE","TIGER","EAGLE","SHARK","ZEBRA",
    "CHERRY","BANANA","ORANGE","PAPAYA","PURPLE","YELLOW","MAROON","BUTTER","COOKIE","NOODLE","SERVER","PIXEL","SOCCER","TENNIS","HOCKEY","GENTLE","FOREST","VALLEY","DESERT","JUNGLE","MEADOW","CANYON","PILLOW","WINDOW","CARPET","RABBIT","MONKEY","PANDA","CAMEL","OTTER","RAVEN","FALCON","LOBSTER","MIRROR","LAPTOP","THUNDER","NETWORK","ARCHERY","CURIOUS","VOLCANO","BLANKET","KITCHEN","DOLPHIN","SANDWICH",
    "APRICOT","COCONUT","AVOCADO","RAINBOW","DROUGHT","PANCAKE","KEYBOARD","INTERNET","CRICKET","BASEBALL","MARATHON","GRATEFUL","PATIENCE","MOUNTAIN","SCOOTER","BICYCLE","DOCTOR","TEACHER","FARMER","PAINTER","PLUMBER","MUSICIAN","LEOPARD","ELEPHANT","GIRAFFE","KANGAROO","CROCODILE","OMELETTE","ALGORITHM","PROCESSOR","TURQUOISE","WATERFALL","HELICOPTER",
    "PINEAPPLE","WATERMELON","POMEGRANATE","TELESCOPE","ASTRONAUT","UNIVERSE","HURRICANE","TEMPERATURE","LIGHTHOUSE","PLANKTON","SPAGHETTI","SOFTWARE","GYMNASTICS","BASKETBALL","ENGINEER","SCIENTIST","ARCHITECT","ELECTRICIAN","SHOULDER","STOMACH","CLASSROOM","NOTEBOOK","LIBRARY","ORCHESTRA","SYMPHONY","RHYTHM","MELODY","VIOLIN","TRUMPET","HIPPOPOTAMUS","GALAXY","NEBULA","COSMOS","ASTEROID","METEOR","ROCKET"
  ];
  const ALL_WORDS = Array.from(new Set(WORDS.map(w=>w.toUpperCase()))).filter(w=>/^[A-Z]{3,12}$/.test(w));

  const DIRS = { right:[0,1], left:[0,-1], down:[1,0], up:[-1,0], dr:[1,1], dl:[1,-1], ur:[-1,1], ul:[-1,-1] };
  const TIERS = [
    { name:"Launchpad", icon:"🚀", color:"#4ce3f0", from:1, to:15, size:8, count:4, minLen:3, maxLen:5, dirs:[DIRS.right, DIRS.down] },
    { name:"Low Orbit", icon:"🛰️", color:"#5cffa8", from:16, to:35, size:9, count:5, minLen:4, maxLen:6, dirs:[DIRS.right, DIRS.down, DIRS.dr] },
    { name:"Deep Space", icon:"🌌", color:"#9d7bff", from:36, to:55, size:10, count:6, minLen:5, maxLen:7, dirs:[DIRS.right, DIRS.left, DIRS.down, DIRS.up, DIRS.dr] },
    { name:"Nebula Zone", icon:"🌠", color:"#ff5fd8", from:56, to:80, size:12, count:7, minLen:6, maxLen:9, dirs:Object.values(DIRS) },
    { name:"Galactic Core", icon:"☄️", color:"#ffd23f", from:81, to:100, size:13, count:8, minLen:7, maxLen:12, dirs:Object.values(DIRS) }
  ];
  function tierForLevel(n){ return TIERS.find(t=>n>=t.from && n<=t.to); }
  function mulberry32(seed){ return function(){ seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(arr, rng){ const a = arr.slice(); for(let i=a.length-1;i>0;i--){ const j = Math.floor(rng()*(i+1)); [a[i],a[j]] = [a[j],a[i]]; } return a; }
  function pickWords(tier, rng){ const candidates = shuffle(ALL_WORDS.filter(w=>w.length>=tier.minLen && w.length<=tier.maxLen), rng); const chosen = []; for(const w of candidates){ if(chosen.length >= tier.count) break; if(chosen.some(c => c.includes(w) || w.includes(c))) continue; chosen.push(w); } return chosen; }
  function rangeFor(delta, len, size){ if(delta === 1) return [0, size-len]; if(delta === -1) return [len-1, size-1]; return [0, size-1]; }
  function buildGrid(tier, rng){
    const size = tier.size, words = pickWords(tier, rng), grid = Array.from({length:size}, ()=>Array(size).fill(null)), placed = [];
    const sorted = [...words].sort((a,b)=>b.length-a.length);
    for(const word of sorted){ let ok = false; for(let attempt=0; attempt<400 && !ok; attempt++){ const dir = tier.dirs[Math.floor(rng()*tier.dirs.length)]; const [minR,maxR] = rangeFor(dir[0], word.length, size); const [minC,maxC] = rangeFor(dir[1], word.length, size); if(minR>maxR || minC>maxC) continue; const r0 = minR + Math.floor(rng()*(maxR-minR+1)), c0 = minC + Math.floor(rng()*(maxC-minC+1)); let fits = true; const cells = []; for(let i=0;i<word.length;i++){ const rr = r0 + dir[0]*i, cc = c0 + dir[1]*i, existing = grid[rr][cc]; if(existing !== null && existing !== word[i]){ fits = false; break; } cells.push([rr,cc]); } if(fits){ cells.forEach(([rr,cc],i)=>{ grid[rr][cc] = word[i]; }); placed.push({ word, cells }); ok = true; } } }
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; for(let r=0;r<size;r++) for(let c=0;c<size;c++) if(grid[r][c] === null) grid[r][c] = letters[Math.floor(rng()*26)]; return { size, grid, placed };
  }
  function generateLevel(n){ const tier = tierForLevel(n); const seed = (n * 7919 + 104729 + Math.floor(Math.random() * 0x7fffffff)) >>> 0; return { level:n, tier, ...buildGrid(tier, mulberry32(seed)) }; }

  const STORAGE_KEY = "wordtrail-progress-v2";
  let progress = { levels:{}, soundOn:true };
  function loadProgress(){ progress = GameStorage.read(STORAGE_KEY, { levels:{}, soundOn:true }); if(progress.soundOn === undefined) progress.soundOn = true; soundOn = progress.soundOn !== false; btnMute.textContent = soundOn ? '🔊' : '🔇'; }
  function saveProgress(){ GameStorage.write(STORAGE_KEY, progress); }
  function isUnlocked(n){ return n === 1 || !!progress.levels[n-1]; }
  function totalStars(){ return Object.values(progress.levels).reduce((s,l)=>s+l.stars,0); }
  function levelsCleared(){ return Object.keys(progress.levels).length; }
  function starSVG(filled){ return `<svg viewBox="0 0 24 24" fill="${filled ? 'var(--gold)' : 'rgba(255,255,255,.15)'}"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z"/></svg>`; }

  const tiersContainer = document.getElementById('tiersContainer'), totalStarsEl = document.getElementById('totalStars'), progressFill = document.getElementById('progressFill'), progressLabel = document.getElementById('progressLabel');
  function renderMap(){
    totalStarsEl.textContent = totalStars(); const cleared = levelsCleared(); progressFill.style.width = cleared + "%"; progressLabel.textContent = `${cleared} / 100 sectors cleared`; tiersContainer.innerHTML = "";
    TIERS.forEach(tier=>{ const block = document.createElement('div'); block.className = 'tier-block'; block.innerHTML = `<div class="tier-head"><span class="dot" style="background:${tier.color}"></span><h2>${tier.icon} ${tier.name}</h2><span class="range">Lv ${tier.from}–${tier.to}</span></div><div class="level-grid" id="grid-${tier.from}"></div>`; tiersContainer.appendChild(block); const gridEl = block.querySelector('.level-grid'); for(let n=tier.from;n<=tier.to;n++){ const unlocked=isUnlocked(n), done=progress.levels[n], tile=document.createElement('div'); tile.className='lvl-tile'+(unlocked?'':' locked')+(done?' done':''); tile.style.setProperty('--tier-color',tier.color); tile.innerHTML=unlocked?`${n}${done?`<div class="stars">${[0,1,2].map(i=>starSVG(i<done.stars)).join('')}</div>`:''}`:`<span class="lock-icon">🔒</span>`; if(unlocked) tile.addEventListener('click',()=>{SFX.button();startLevel(n);}); gridEl.appendChild(tile); } });
  }

  const screenMap = document.getElementById('screen-map'), screenGame = document.getElementById('screen-game'), gridEl = document.getElementById('grid'), wordListEl = document.getElementById('wordList'), lvlTitleEl = document.getElementById('lvlTitle'), timerLabel = document.getElementById('timerLabel'), wordsRemainingEl = document.getElementById('wordsRemaining'), levelProgressFill = document.getElementById('levelProgressFill'), btnHint = document.getElementById('btnHint');
  let current=null, foundWords=new Set(), cellEls=[], startCell=null, anchorCell=null, dragOccurred=false, currentPath=[], timerInterval=null, elapsedSec=0, hintsUsed=0;
  const MAX_HINTS=3;
  function startLevel(n){ current=generateLevel(n); foundWords=new Set(); hintsUsed=0; elapsedSec=0; startCell=null; anchorCell=null; currentPath=[]; btnHint.disabled=false; btnHint.textContent=`💡 Hint (${MAX_HINTS-hintsUsed} left)`; lvlTitleEl.innerHTML=`Level ${n}<small>${current.tier.icon} ${current.tier.name.toUpperCase()}</small>`; gridEl.style.setProperty('--tier-color',current.tier.color); screenGame.style.setProperty('--tier-color',current.tier.color); renderGrid(); renderWordList(); updateRemaining(); screenMap.style.display='none'; screenGame.style.display='flex'; clearInterval(timerInterval); timerLabel.textContent="00:00"; timerInterval=setInterval(()=>{ elapsedSec++; const m=String(Math.floor(elapsedSec/60)).padStart(2,'0'), s=String(elapsedSec%60).padStart(2,'0'); timerLabel.textContent=`${m}:${s}`; },1000); }
  function cellSize(size){ return Math.floor(Math.min(window.innerWidth-64,480)/size); }
  function renderGrid(){ const {size,grid}=current, cs=cellSize(size); gridEl.style.gridTemplateColumns=`repeat(${size}, ${cs}px)`; gridEl.style.gridTemplateRows=`repeat(${size}, ${cs}px)`; gridEl.style.backgroundSize=`${cs}px ${cs}px`; gridEl.innerHTML=""; cellEls=[]; for(let r=0;r<size;r++){ const rowEls=[]; for(let c=0;c<size;c++){ const div=document.createElement('div'); div.className='cell'; div.style.width=cs+"px"; div.style.height=cs+"px"; div.style.fontSize=Math.floor(cs*.48)+"px"; div.textContent=grid[r][c]; div.dataset.r=r; div.dataset.c=c; gridEl.appendChild(div); rowEls.push(div); } cellEls.push(rowEls); } }
  function renderWordList(){ wordListEl.innerHTML=""; current.placed.forEach(p=>{ const chip=document.createElement('div'); chip.className='word-chip'+(foundWords.has(p.word)?' found':''); chip.textContent=p.word; chip.dataset.word=p.word; wordListEl.appendChild(chip); }); }
  function updateRemaining(){ const total=current.placed.length, found=foundWords.size, remaining=total-found; wordsRemainingEl.textContent=remaining===0?"All found!":`${remaining} word${remaining!==1?'s':''} left`; levelProgressFill.style.width=(total?(found/total*100):0)+"%"; }
  function cellFromPoint(x,y){ const el=document.elementFromPoint(x,y); if(!el||!el.classList.contains('cell')) return null; return {r:parseInt(el.dataset.r),c:parseInt(el.dataset.c)}; }
  function lineBetween(a,b){ const dr=b.r-a.r,dc=b.c-a.c; if(!(dr===0||dc===0||Math.abs(dr)===Math.abs(dc))) return null; const steps=Math.max(Math.abs(dr),Math.abs(dc)),sr=Math.sign(dr),sc=Math.sign(dc),path=[]; for(let i=0;i<=steps;i++) path.push([a.r+sr*i,a.c+sc*i]); return path; }
  function clearPathStyles(){ currentPath.forEach(([r,c])=>cellEls[r][c].classList.remove('selecting','anchor-pulse')); }
  function applyPathStyle(path,cls){ path.forEach(([r,c])=>cellEls[r][c].classList.add(cls)); }
  function removeAnchorStyle(cell){ cellEls[cell.r][cell.c].classList.remove('selecting','anchor-pulse'); }
  function finalizeSelection(){ const forward=currentPath.map(([r,c])=>current.grid[r][c]).join(''), backward=forward.split('').reverse().join(''), match=current.placed.find(p=>!foundWords.has(p.word)&&(p.word===forward||p.word===backward)); if(match){ clearPathStyles(); applyPathStyle(currentPath,'found'); foundWords.add(match.word); SFX.correct(); const chip=wordListEl.querySelector(`[data-word="${match.word}"]`); if(chip) chip.classList.add('found'); updateRemaining(); if(foundWords.size===current.placed.length) onLevelComplete(); } else { SFX.wrong(); applyPathStyle(currentPath,'invalid'); const pathCopy=currentPath.slice(); setTimeout(()=>pathCopy.forEach(([r,c])=>cellEls[r][c].classList.remove('invalid','selecting','anchor-pulse')),260); } currentPath=[]; }
  function onPointerDown(e){ if(e.pointerType==='mouse'&&e.button!==0)return; const cell=cellFromPoint(e.clientX,e.clientY); if(!cell)return; if(e.cancelable)e.preventDefault(); const prevAnchor=anchorCell; anchorCell=null; if(prevAnchor){ removeAnchorStyle(prevAnchor); if(!(prevAnchor.r===cell.r&&prevAnchor.c===cell.c)){ const path=lineBetween(prevAnchor,cell); if(path){ currentPath=path; applyPathStyle(path,'selecting'); finalizeSelection(); startCell=null; return; } } } startCell=cell; dragOccurred=false; currentPath=[[cell.r,cell.c]]; applyPathStyle(currentPath,'selecting'); SFX.select(); }
  function onPointerMove(e){ if(!startCell)return; const cell=cellFromPoint(e.clientX,e.clientY); if(!cell)return; if(cell.r!==startCell.r||cell.c!==startCell.c)dragOccurred=true; const path=lineBetween(startCell,cell); if(!path)return; clearPathStyles(); currentPath=path; applyPathStyle(path,'selecting'); if(e.cancelable)e.preventDefault(); }
  function onPointerUp(){ if(!startCell)return; if(dragOccurred){ finalizeSelection(); startCell=null; } else { anchorCell={r:startCell.r,c:startCell.c}; cellEls[startCell.r][startCell.c].classList.add('anchor-pulse'); startCell=null; } }
  function onPointerCancel(){ if(startCell){clearPathStyles();startCell=null;currentPath=[];} }
  gridEl.addEventListener('pointerdown',onPointerDown); window.addEventListener('pointermove',onPointerMove); window.addEventListener('pointerup',onPointerUp); window.addEventListener('pointercancel',onPointerCancel);
  btnHint.addEventListener('click',()=>{ if(hintsUsed>=MAX_HINTS)return; const unfound=current.placed.filter(p=>!foundWords.has(p.word)); if(unfound.length===0)return; SFX.hint(); const pick=unfound[Math.floor(Math.random()*unfound.length)], [r,c]=pick.cells[0], el=cellEls[r][c]; el.classList.add('found'); let blinks=0; const blink=setInterval(()=>{el.style.outline=el.style.outline?'':'3px solid var(--gold)';blinks++;if(blinks>=6){clearInterval(blink);el.style.outline='';if(!foundWords.has(pick.word))el.classList.remove('found');}},220); hintsUsed++; btnHint.textContent=`💡 Hint (${MAX_HINTS-hintsUsed} left)`; if(hintsUsed>=MAX_HINTS)btnHint.disabled=true; });
  const modalOverlay=document.getElementById('modalOverlay'), modalTime=document.getElementById('modalTime'), modalStars=document.getElementById('modalStars'), modalNext=document.getElementById('modalNext'), modalMap=document.getElementById('modalMap');
  function onLevelComplete(){ clearInterval(timerInterval); SFX.complete(); const stars=Math.max(1,3-hintsUsed), existing=progress.levels[current.level]; if(!existing||existing.stars<stars||existing.timeSec>elapsedSec){ progress.levels[current.level]={stars:existing?Math.max(existing.stars,stars):stars,timeSec:existing?Math.min(existing.timeSec,elapsedSec):elapsedSec,hints:hintsUsed}; saveProgress(); } const m=String(Math.floor(elapsedSec/60)).padStart(2,'0'), s=String(elapsedSec%60).padStart(2,'0'); modalTime.textContent=`Scan complete in ${m}:${s}${hintsUsed?` · ${hintsUsed} hint${hintsUsed>1?'s':''} used`:''}`; modalStars.innerHTML=[0,1,2].map(i=>starSVG(i<stars)).join(''); modalNext.style.display=current.level<100?'block':'none'; modalNext.textContent=current.level<100?'Next Sector →':'Galaxy Complete!'; modalOverlay.style.display='flex'; }
  modalMap.addEventListener('click',()=>{SFX.button();modalOverlay.style.display='none';screenGame.style.display='none';screenMap.style.display='block';renderMap();});
  modalNext.addEventListener('click',()=>{SFX.button();modalOverlay.style.display='none';if(current.level<100)startLevel(current.level+1);else{screenGame.style.display='none';screenMap.style.display='block';renderMap();}});
  document.getElementById('btnBack').addEventListener('click',()=>{SFX.button();clearInterval(timerInterval);screenGame.style.display='none';screenMap.style.display='block';renderMap();});
  document.getElementById('btnHome').addEventListener('click',()=>{window.location.href='/';});
  window.addEventListener('resize',()=>{if(screenGame.style.display==='flex'&&current)renderGrid();});
  loadProgress();
  renderMap();
})();
