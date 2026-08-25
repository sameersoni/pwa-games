(function(){
  "use strict";

  /* ---------------- CONTENT: 30 TWISTERS, EASY -> HARD ---------------- */
  const TWISTERS = [
    "She sells seashells by the seashore.",
    "Toy boat. Toy boat. Toy boat.",
    "Red lorry, yellow lorry.",
    "Fuzzy Wuzzy was a bear. Fuzzy Wuzzy had no hair.",
    "Betty bought a bit of butter.",
    "Six slippery snails slid slowly seaward.",
    "A big black bug bit a big black bear.",
    "Peter Piper picked a peck of pickled peppers.",
    "Unique New York, unique New York, unique New York.",
    "How much wood would a woodchuck chuck if a woodchuck could chuck wood?",

    "I scream, you scream, we all scream for ice cream.",
    "Fred fed Ted bread, and Ted fed Fred bread.",
    "How can a clam cram in a clean cream can?",
    "A proper copper coffee pot.",
    "Which wristwatches are Swiss wristwatches?",
    "Truly rural, truly rural, truly rural.",
    "Denise sees the fleece, Denise sees the fleas.",
    "Can you can a can as a canner can can a can?",
    "The sixth sick sheikh's sixth sheep's sick.",
    "The thirty-three thieves thought that they thrilled the throne throughout Thursday.",

    "The Leith police dismisseth us.",
    "Irish wristwatch, Swiss wristwatch.",
    "Pad kid poured curd pulled cod.",
    "Six thick thistle sticks, six thick thistles stick.",
    "If two witches would watch two watches, which witch would watch which watch?",
    "Imagine an imaginary menagerie manager managing an imaginary menagerie.",
    "A skunk sat on a stump and thunk the stump stunk, but the stump thunk the skunk stunk.",
    "I saw Susie sitting in a shoeshine shop, where she shines she sits, and where she sits she shines.",
    "Brisk brave brigadiers brandished broad bright blades, blunderbusses, and bludgeons.",
    "Whether the weather be fine, or whether the weather be not, whether the weather be cold, or whether the weather be hot, we'll weather the weather whatever the weather, whether we like it or not."
  ];

  function variantText(text){
    const variants = [
      text,
      text.replace(/\./g, '!'),
      text.replace(/, /g, ' — '),
      text.replace(/\b([A-Za-z]+)\b/g, (word, index) => index % 2 ? word.toLowerCase() : word)
    ];
    return variants[Math.floor(Math.random() * variants.length)];
  }

  const TIERS = [
    { name:"Warm-Up",   color:"#ffd166", from:1,  to:10, baseSpeed:34, increment:3 },
    { name:"Rehearsal", color:"#ff6b6b", from:11, to:20, baseSpeed:66, increment:4 },
    { name:"Show Time", color:"#d7263d", from:21, to:30, baseSpeed:112, increment:6 }
  ];
  function tierForLevel(n){ return TIERS.find(t=>n>=t.from && n<=t.to); }
  function levelSpeed(n){
    const tier = tierForLevel(n);
    const idx = n - tier.from;
    return tier.baseSpeed + idx*tier.increment; // px per second
  }

  /* ---------------- STORAGE ---------------- */
  const STORAGE_KEY = "twistmaster-progress-v1";
  let progress = { levels:{} }; // levels[n] = { rating:'nailed'|'missed'|null, bestTimeSec, attempts }

  function loadProgress(){ progress = GameStorage.read(STORAGE_KEY, { levels:{} }); }
  function saveProgress(){ GameStorage.write(STORAGE_KEY, progress); }
  function isUnlocked(n){ return n === 1 || !!progress.levels[n-1]; }
  function nailedCount(){ return Object.values(progress.levels).filter(l=>l.rating==='nailed').length; }
  function attemptedCount(){ return Object.keys(progress.levels).length; }

  /* ---------------- MAP RENDERING ---------------- */
  const tiersContainer = document.getElementById('tiersContainer');
  const nailedCountEl = document.getElementById('nailedCount');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');

  function renderMap(){
    nailedCountEl.textContent = nailedCount();
    const attempted = attemptedCount();
    progressFill.style.width = (attempted/30*100) + "%";
    progressLabel.textContent = `${attempted} / 30 levels attempted`;

    tiersContainer.innerHTML = "";
    TIERS.forEach(tier=>{
      const block = document.createElement('div');
      block.className = 'tier-block';
      block.innerHTML = `<div class="tier-head">
          <span class="dot" style="background:${tier.color}"></span>
          <h2>${tier.name}</h2>
          <span class="range">Lv ${tier.from}–${tier.to}</span>
        </div>
        <div class="level-grid" id="grid-${tier.from}"></div>`;
      tiersContainer.appendChild(block);
      const gridEl = block.querySelector('.level-grid');
      for(let n=tier.from; n<=tier.to; n++){
        const unlocked = isUnlocked(n);
        const rec = progress.levels[n];
        const tile = document.createElement('div');
        tile.className = 'lvl-tile'
          + (unlocked ? '' : ' locked')
          + (rec ? ' attempted' : '')
          + (rec && rec.rating === 'nailed' ? ' nailed' : '');
        tile.innerHTML = unlocked
          ? `${n}${rec ? `<div class="badge">${rec.rating === 'nailed' ? '🎯' : rec.rating === 'missed' ? '😅' : '·'}</div>` : ''}`
          : `<span class="lock-icon">🔒</span>`;
        if(unlocked) tile.addEventListener('click', ()=> startLevel(n));
        gridEl.appendChild(tile);
      }
    });
  }

  /* ---------------- GAME STATE ---------------- */
  const screenMap = document.getElementById('screen-map');
  const screenGame = document.getElementById('screen-game');
  const viewport = document.getElementById('viewport');
  const promptText = document.getElementById('promptText');
  const lvlTitleEl = document.getElementById('lvlTitle');
  const timerLabel = document.getElementById('timerLabel');
  const readyNote = document.getElementById('readyNote');
  const btnStart = document.getElementById('btnStart');
  const resultPanel = document.getElementById('resultPanel');
  const resultTime = document.getElementById('resultTime');
  const rateNailed = document.getElementById('rateNailed');
  const rateMissed = document.getElementById('rateMissed');
  const btnRepeat = document.getElementById('btnRepeat');
  const btnNext = document.getElementById('btnNext');

  let current = null; // { level, tier, text, speed }
  let textHeight = 0, viewportHeight = 0;
  let timerRAF = null, startTime = 0, finalTime = 0;
  let chosenRating = null;

  function startLevel(n){
    const tier = tierForLevel(n);
    current = { level:n, tier, text: variantText(TWISTERS[n-1]), speed: levelSpeed(n) };
    chosenRating = null;
    lvlTitleEl.innerHTML = `Level ${n}<small>${tier.name.toUpperCase()}</small>`;
    resultPanel.classList.remove('show');
    rateNailed.classList.remove('selected','nailed');
    rateMissed.classList.remove('selected','missed');
    readyNote.style.display = 'block';
    btnStart.style.display = 'inline-block';
    btnStart.disabled = false;
    timerLabel.textContent = "0.0s";
    screenMap.style.display = 'none';
    screenGame.style.display = 'flex';
    prepareText();
  }

  function prepareText(){
    promptText.textContent = current.text;
    promptText.style.transition = 'none';
    promptText.style.transform = 'translateY(0px)';
    // measure after layout
    requestAnimationFrame(()=>{
      textHeight = promptText.offsetHeight;
      viewportHeight = viewport.clientHeight;
      promptText.style.transform = `translateY(${viewportHeight}px)`;
    });
  }

  function startTimer(){
    startTime = performance.now();
    const tick = ()=>{
      const elapsed = (performance.now() - startTime)/1000;
      timerLabel.textContent = elapsed.toFixed(1) + "s";
      timerRAF = requestAnimationFrame(tick);
    };
    timerRAF = requestAnimationFrame(tick);
  }
  function stopTimer(){
    cancelAnimationFrame(timerRAF);
    finalTime = (performance.now() - startTime)/1000;
    timerLabel.textContent = finalTime.toFixed(1) + "s";
  }

  function onScrollDone(){
    stopTimer();
    resultTime.textContent = `Finished in ${finalTime.toFixed(1)}s — how did that go?`;
    resultPanel.classList.add('show');
  }

  btnStart.addEventListener('click', ()=>{
    readyNote.style.display = 'none';
    btnStart.style.display = 'none';
    resultPanel.classList.remove('show');
    startTimer();
    requestAnimationFrame(()=>{
      const totalDistance = viewportHeight + textHeight;
      const duration = totalDistance / current.speed;
      promptText.style.transition = `transform ${duration}s linear`;
      promptText.style.transform = `translateY(-${textHeight}px)`;
    });
    promptText.addEventListener('transitionend', onScrollDone, { once:true });
  });

  rateNailed.addEventListener('click', ()=>{
    chosenRating = 'nailed';
    rateNailed.classList.add('selected','nailed');
    rateMissed.classList.remove('selected','missed');
  });
  rateMissed.addEventListener('click', ()=>{
    chosenRating = 'missed';
    rateMissed.classList.add('selected','missed');
    rateNailed.classList.remove('selected','nailed');
  });

  function saveAttempt(){
    const n = current.level;
    const existing = progress.levels[n];
    const attempts = (existing ? existing.attempts : 0) + 1;
    const bestTimeSec = existing ? Math.min(existing.bestTimeSec, finalTime) : finalTime;
    let rating = chosenRating || (existing ? existing.rating : null);
    if(chosenRating === 'nailed' || (existing && existing.rating === 'nailed')) rating = 'nailed';
    progress.levels[n] = { rating, bestTimeSec, attempts };
    saveProgress();
  }

  btnRepeat.addEventListener('click', ()=>{
    saveAttempt();
    chosenRating = null;
    rateNailed.classList.remove('selected','nailed');
    rateMissed.classList.remove('selected','missed');
    resultPanel.classList.remove('show');
    readyNote.style.display = 'block';
    btnStart.style.display = 'inline-block';
    btnStart.disabled = false;
    timerLabel.textContent = "0.0s";
    prepareText();
  });

  btnNext.addEventListener('click', ()=>{
    saveAttempt();
    if(current.level < 30){
      startLevel(current.level + 1);
    } else {
      screenGame.style.display = 'none';
      document.getElementById('modalOverlay').style.display = 'flex';
    }
  });

  document.getElementById('modalClose').addEventListener('click', ()=>{
    document.getElementById('modalOverlay').style.display = 'none';
    screenMap.style.display = 'block';
    renderMap();
  });

  document.getElementById('btnBack').addEventListener('click', ()=>{
    cancelAnimationFrame(timerRAF);
    screenGame.style.display = 'none';
    screenMap.style.display = 'block';
    renderMap();
  });

  document.getElementById('btnHome').addEventListener('click', ()=>{
    window.location.href = '/';
  });

  window.addEventListener('resize', ()=>{
    if(screenGame.style.display === 'flex' && current && btnStart.style.display !== 'none'){
      prepareText();
    }
  });

  /* ---------------- INIT ---------------- */
  (function init(){
    loadProgress();
    renderMap();
  })();

})();
