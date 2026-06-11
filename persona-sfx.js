/* ═══════════════════════════════════════════════════════════════
   PERSONA MODE — SOUND + GAME-FEEL ENGINE
   Synthesized P5-style UI audio via WebAudio. No audio files.
   Shared across all persona-*.html pages.

   API:  personaSFX.play('move' | 'confirm' | 'cancel' | 'whoosh' | 'boot')
         personaSFX.muted (bool, persisted in localStorage)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const LS_KEY = 'persona_sfx_muted';
  let ctx = null;
  let master = null;
  let muted = localStorage.getItem(LS_KEY) === '1';
  let lastMove = 0;
  let noiseBuf = null;

  // ── Lazy AudioContext (browsers require a user gesture) ──────
  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
      // Pre-render 1s of white noise for whooshes
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // ── Synth helpers ─────────────────────────────────────────────
  function tone({ type = 'square', freq = 700, to = null, dur = 0.07, vol = 0.12, when = 0, curve = 'exponential' }) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) {
      if (curve === 'exponential') osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
      else osc.frequency.linearRampToValueAtTime(to, t0 + dur);
    }
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise({ dur = 0.4, vol = 0.18, from = 300, peak = 2800, end = 250, q = 1.2, when = 0 }) {
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + when;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = q;
    bp.frequency.setValueAtTime(from, t0);
    bp.frequency.exponentialRampToValueAtTime(peak, t0 + dur * 0.35);
    bp.frequency.exponentialRampToValueAtTime(end, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + dur * 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp).connect(g).connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // ── The sound set ─────────────────────────────────────────────
  const SOUNDS = {
    // Cursor move / hover — short high blip
    move() {
      const now = performance.now();
      if (now - lastMove < 45) return; // throttle rapid hovers
      lastMove = now;
      tone({ type: 'square', freq: 740, to: 990, dur: 0.045, vol: 0.07 });
    },
    // Confirm — two-note rising sting + click of noise
    confirm() {
      tone({ type: 'square',   freq: 540, to: 560, dur: 0.05,  vol: 0.10 });
      tone({ type: 'sawtooth', freq: 820, to: 1240, dur: 0.11, vol: 0.09, when: 0.045 });
      noise({ dur: 0.09, vol: 0.06, from: 1800, peak: 4200, end: 1200, q: 0.8 });
    },
    // Cancel / back — descending blip
    cancel() {
      tone({ type: 'square', freq: 520, to: 240, dur: 0.12, vol: 0.09 });
    },
    // Screen wipe — filtered noise sweep
    whoosh() {
      noise({ dur: 0.55, vol: 0.16, from: 220, peak: 3200, end: 180, q: 1.1 });
      tone({ type: 'sawtooth', freq: 90, to: 38, dur: 0.5, vol: 0.05 });
    },
    // Page boot — soft rising sweep, used on load after first gesture
    boot() {
      tone({ type: 'triangle', freq: 320, to: 660, dur: 0.18, vol: 0.06 });
      tone({ type: 'triangle', freq: 660, to: 880, dur: 0.16, vol: 0.05, when: 0.14 });
    },
  };

  function play(name) {
    if (muted) return;
    try {
      if (!ensureCtx()) return;
      (SOUNDS[name] || SOUNDS.move)();
    } catch (e) { /* audio is best-effort, never break the page */ }
  }

  // ── Mute toggle UI (parallelogram chip, bottom-left) ──────────
  const css = document.createElement('style');
  css.textContent = `
    #sfx-toggle{
      position:fixed;left:18px;bottom:60px;z-index:9000;
      display:inline-flex;align-items:center;gap:7px;
      font-family:'JetBrains Mono',monospace;font-size:8px;
      letter-spacing:.22em;text-transform:uppercase;
      color:rgba(245,240,232,0.55);
      background:rgba(8,8,8,0.72);
      border:1px solid rgba(230,0,18,0.35);
      padding:7px 14px 7px 10px;cursor:pointer;
      clip-path:polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%);
      transform:skewX(-8deg);
      transition:color .2s,border-color .2s,box-shadow .2s;
      user-select:none;backdrop-filter:blur(6px);
    }
    #sfx-toggle:hover{
      color:#F5F0E8;border-color:rgba(230,0,18,0.8);
      box-shadow:0 0 12px rgba(230,0,18,0.3);
    }
    #sfx-toggle .sfx-inner{transform:skewX(8deg);display:inline-flex;align-items:center;gap:7px;}
    #sfx-toggle .sfx-dot{
      width:6px;height:6px;border-radius:50%;
      background:#FFD23F;box-shadow:0 0 7px rgba(255,210,63,0.8);
      transition:background .2s,box-shadow .2s;
    }
    #sfx-toggle.sfx-muted .sfx-dot{background:#555;box-shadow:none;}
    #sfx-toggle.sfx-muted{color:rgba(245,240,232,0.3);border-color:rgba(245,240,232,0.15);}
    @media(max-width:700px){#sfx-toggle{bottom:14px;left:12px;}}
  `;
  document.head.appendChild(css);

  function buildToggle() {
    const btn = document.createElement('button');
    btn.id = 'sfx-toggle';
    btn.setAttribute('aria-label', 'Toggle sound effects');
    btn.innerHTML = '<span class="sfx-inner"><span class="sfx-dot"></span><span class="sfx-label">SE ON</span></span>';
    if (muted) {
      btn.classList.add('sfx-muted');
      btn.querySelector('.sfx-label').textContent = 'SE OFF';
    }
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      muted = !muted;
      localStorage.setItem(LS_KEY, muted ? '1' : '0');
      btn.classList.toggle('sfx-muted', muted);
      btn.querySelector('.sfx-label').textContent = muted ? 'SE OFF' : 'SE ON';
      if (!muted) play('confirm');
    });
    document.body.appendChild(btn);
  }

  // ── Auto-bind UI sounds via delegation ────────────────────────
  // Hover blips + click confirms on anything interactive.
  const INTERACTIVE = '.menu-item, a, button, [role="button"], [tabindex]';
  let lastHoverEl = null;

  function autobind() {
    document.addEventListener('mouseover', (e) => {
      const el = e.target.closest(INTERACTIVE);
      if (!el || el === lastHoverEl || el.id === 'sfx-toggle') return;
      lastHoverEl = el;
      play('move');
    });
    document.addEventListener('mouseout', (e) => {
      const el = e.target.closest(INTERACTIVE);
      if (el === lastHoverEl) lastHoverEl = null;
    });
    document.addEventListener('click', (e) => {
      const el = e.target.closest(INTERACTIVE);
      if (!el || el.id === 'sfx-toggle') return;
      // Menu items / wipes fire their own richer 'confirm' explicitly —
      // skip if the page marked it.
      if (el.dataset.sfx === 'off') return;
      play(el.dataset.sfx || 'confirm');
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') play('cancel');
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') play('move');
      else if (e.key === 'Enter') {
        const el = document.activeElement;
        if (el && el.closest && el.closest(INTERACTIVE)) play('confirm');
      }
    });
  }

  // ── Star-burst particle effect (P5 confirm flourish) ─────────
  // personaSFX.burst(x, y) — spawns ★ particles at viewport coords.
  const burstCss = document.createElement('style');
  burstCss.textContent = `
    .sfx-star{
      position:fixed;z-index:9500;pointer-events:none;
      font-family:'Anton',sans-serif;font-style:italic;
      color:#FFD23F;text-shadow:1px 1px 0 #E60012;
      will-change:transform,opacity;
    }
    @media(prefers-reduced-motion:reduce){.sfx-star{display:none;}}
  `;
  document.head.appendChild(burstCss);

  function burst(x, y, count = 7) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'sfx-star';
      s.textContent = '★';
      const size = 10 + Math.random() * 14;
      s.style.fontSize = size + 'px';
      s.style.left = x + 'px';
      s.style.top = y + 'px';
      document.body.appendChild(s);
      const ang = Math.random() * Math.PI * 2;
      const dist = 40 + Math.random() * 70;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist;
      const rot = (Math.random() - 0.5) * 240;
      const dur = 380 + Math.random() * 220;
      s.animate(
        [
          { transform: 'translate(-50%,-50%) scale(0.4) rotate(0deg)', opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.1) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: dur, easing: 'cubic-bezier(0.16,1,0.3,1)', fill: 'forwards' }
      );
      setTimeout(() => s.remove(), dur + 60);
    }
  }

  // Burst on confirm-clicks of menu items automatically (persona pages)
  document.addEventListener('click', (e) => {
    if (!/persona/i.test(location.pathname) && !document.body.hasAttribute('data-persona-page')) return;
    const el = e.target.closest('.menu-item, [data-sfx-burst]');
    if (el) burst(e.clientX || (window.innerWidth / 2), e.clientY || (window.innerHeight / 2));
  });

  // ── Init ──────────────────────────────────────────────────────
  // Full game-feel (toggle UI + delegated sounds) only on persona
  // pages; other pages get the personaSFX API for explicit calls.
  const IS_PERSONA_PAGE = /persona/i.test(location.pathname) || document.body.hasAttribute('data-persona-page');

  function init() {
    if (!IS_PERSONA_PAGE) return;
    buildToggle();
    autobind();
    // Warm the AudioContext on the first gesture so the first real
    // sound isn't swallowed.
    const warm = () => { ensureCtx(); document.removeEventListener('pointerdown', warm); document.removeEventListener('keydown', warm); };
    document.addEventListener('pointerdown', warm);
    document.addEventListener('keydown', warm);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.personaSFX = { play, burst, get muted() { return muted; } };
})();
