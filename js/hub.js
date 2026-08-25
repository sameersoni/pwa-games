// ── Star field
    const starsEl = document.getElementById('stars');
    for (let i = 0; i < 80; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      const size = Math.random() * 2.5 + 0.5;
      const lo = (Math.random() * 0.2 + 0.05).toFixed(2);
      const hi = (Math.random() * 0.5 + 0.3).toFixed(2);
      const d  = (Math.random() * 3 + 2).toFixed(1) + 's';
      s.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random()*100}%;
        top:${Math.random()*100}%;
        --lo:${lo}; --hi:${hi}; --d:${d};
        animation-delay:${(Math.random()*4).toFixed(1)}s;
      `;
      starsEl.appendChild(s);
    }

    // ── Balloon decorations inside the balloon card
    const balloonEmoji = ['🎈','🎈','🎈','🟣','🟡','🔵'];
    const balloonsEl = document.getElementById('balloons');
    balloonEmoji.forEach((e, i) => {
      const b = document.createElement('div');
      b.className = 'balloon';
      b.textContent = e;
      const tx = ((Math.random() - 0.5) * 12).toFixed(0) + 'px';
      const ty = ((Math.random() - 0.5) * 12).toFixed(0) + 'px';
      const d  = (Math.random() * 2 + 2).toFixed(1) + 's';
      b.style.cssText = `
        left:${10 + i * 15}%;
        top:${10 + Math.random() * 40}%;
        --tx:${tx}; --ty:${ty}; --d:${d};
        animation-delay:${(Math.random() * 1.5).toFixed(1)}s;
        opacity: 0.7;
      `;
      balloonsEl.appendChild(b);
    });

    // ── Space decorations inside the kitchen card
    const spaceEmoji = ['⭐','✨','🌟','💫','⭐','✨'];
    const spaceDecoEl = document.getElementById('spaceDeco');
    spaceEmoji.forEach((e, i) => {
      const s = document.createElement('div');
      s.className = 'space-star';
      s.textContent = e;
      const d = (Math.random() * 6 + 6).toFixed(1) + 's';
      s.style.cssText = `
        left:${5 + i * 16}%;
        top:${10 + Math.random() * 45}%;
        --d:${d};
        animation-delay:${(Math.random() * 3).toFixed(1)}s;
        opacity: 0.4;
      `;
      spaceDecoEl.appendChild(s);
    });

    // ── Tactile feedback on iOS
    document.querySelectorAll('.game-card').forEach(card => {
      card.addEventListener('touchstart', () => {}, { passive: true });
    });

