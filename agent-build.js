/* ─────────────────────────────────────────────────────────────────────────
   agent-build.js
   Makes the page look like a team of agents is assembling it as you scroll.
   Pure UI simulation: every `.fade-in` block starts as a dashed wireframe,
   then named cursors drag it into place, type its headings, paste its copy,
   and resize its media. A block tears down when it leaves the screen and is
   rebuilt the next time it comes back.

   Drop-in: add <script src="agent-build.js"></script> after the page's own
   scripts. No dependencies. Does nothing under prefers-reduced-motion.
   ───────────────────────────────────────────────────────────────────────── */
(() => {
    'use strict';

    const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const within = (sel, el) => (el.matches(sel) ? [el] : []).concat($$(sel, el));
    const allFade = $$('.fade-in');

    // The page's own scroll fade is replaced by the build animation.
    allFade.forEach(el => el.classList.add('visible'));

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // ── Config ────────────────────────────────────────────────────────────
    const AGENTS = [
        { name: 'layout-agent',  role: 'layout', color: '#ef4444' },
        { name: 'grid-agent',    role: 'layout', color: '#a78bfa' },
        { name: 'copy-agent',    role: 'type',   color: '#fb923c' },
        { name: 'content-agent', role: 'paste',  color: '#34d399' },
        { name: 'polish-agent',  role: 'polish', color: '#22d3ee' },
    ];
    const STORE_KEY = 'agentBuildOff';

    // ── Styles ────────────────────────────────────────────────────────────
    const css = `
    html.ab-on, html.ab-on body { overflow-x: clip; }

    .ab-ghost {
        color: transparent !important;
        -webkit-text-fill-color: transparent !important;
        outline: 1.5px dashed rgba(239,68,68,.26) !important;
        outline-offset: -1px;
        background: rgba(255,255,255,.012) !important;
        border-color: transparent !important;
        box-shadow: none !important;
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        border-radius: 16px;
        transition: none !important;
    }
    .ab-ghost > *, .ab-ghost::before, .ab-ghost::after { visibility: hidden !important; }

    .ab-fly {
        outline: 1.5px solid var(--ab-c);
        outline-offset: 3px;
        opacity: .95;
        will-change: translate, rotate;
    }
    .ab-drop { animation: abDrop .5s ease-out; }
    @keyframes abDrop {
        from { outline: 1.5px solid var(--ab-c); outline-offset: 3px; }
        to   { outline: 1.5px solid transparent; outline-offset: 14px; }
    }

    .ab-skel, .ab-skel * {
        color: transparent !important;
        -webkit-text-fill-color: transparent !important;
    }
    .ab-skel { background: rgba(255,255,255,.055) !important; border-color: transparent !important; border-radius: 6px; }
    .ab-flash { animation: abFlash .75s ease-out; border-radius: 6px; }
    @keyframes abFlash {
        from { background-color: color-mix(in srgb, var(--ab-c) 30%, transparent); }
        to   { background-color: transparent; }
    }

    .ab-caret {
        display: inline-block; width: 0; height: 1em; vertical-align: -0.12em;
        border-left: 2px solid var(--ab-c); margin: 0 -2px 0 1px;
        animation: abBlink .5s steps(1) infinite;
    }
    @keyframes abBlink { 50% { opacity: .2; } }

    #ab-layer {
        position: absolute; left: 0; top: 0; width: 0; height: 0;
        z-index: 45; pointer-events: none;
    }
    .ab-frame {
        position: absolute; border: 1.5px dashed var(--ab-c); border-radius: 16px;
        background: color-mix(in srgb, var(--ab-c) 5%, transparent);
    }
    .ab-box { position: absolute; border: 1.5px solid var(--ab-c); transition: opacity .2s; }
    .ab-box i {
        position: absolute; width: 7px; height: 7px; background: #fff;
        border: 1.5px solid var(--ab-c); border-radius: 1px;
    }
    .ab-box i:nth-child(1) { left: -4px;  top: -4px; }
    .ab-box i:nth-child(2) { right: -4px; top: -4px; }
    .ab-box i:nth-child(3) { left: -4px;  bottom: -4px; }
    .ab-box i:nth-child(4) { right: -4px; bottom: -4px; }
    .ab-box b {
        position: absolute; left: 50%; top: 100%; transform: translate(-50%, 6px);
        background: var(--ab-c); color: #06060b; white-space: nowrap;
        font: 600 9px/1 'JetBrains Mono', ui-monospace, monospace;
        padding: 3px 5px; border-radius: 4px;
    }

    .ab-cur {
        position: absolute; left: 0; top: 0; opacity: 0;
        transition: opacity .25s; will-change: transform;
    }
    .ab-cur.on { opacity: 1; }
    .ab-cur svg {
        display: block; width: 18px; height: 18px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,.6));
        transition: transform .1s; transform-origin: 2px 2px;
    }
    .ab-cur.click svg { transform: scale(.78); }
    .ab-cur .ab-tag {
        position: absolute; left: 13px; top: 15px; white-space: nowrap;
        background: var(--ab-c); color: #06060b;
        font: 600 10px/1 'JetBrains Mono', ui-monospace, monospace;
        padding: 3px 6px; border-radius: 2px 7px 7px 7px;
        box-shadow: 0 4px 12px rgba(0,0,0,.45);
    }
    .ab-cur .ab-key {
        position: absolute; left: 16px; top: -20px; white-space: nowrap;
        background: #0e0e16; color: #fff; border: 1px solid var(--ab-c);
        font: 600 10px/1 'JetBrains Mono', ui-monospace, monospace;
        padding: 3px 6px; border-radius: 5px;
        opacity: 0; transform: translateY(4px); transition: opacity .12s, transform .12s;
    }
    .ab-cur .ab-key.on { opacity: 1; transform: none; }
    .ab-cur .ab-ring {
        position: absolute; left: -9px; top: -9px; width: 22px; height: 22px;
        border: 1.5px solid var(--ab-c); border-radius: 50%; opacity: 0;
    }
    .ab-cur.click .ab-ring { animation: abRing .35s ease-out; }
    @keyframes abRing {
        from { opacity: .9; transform: scale(.3); }
        to   { opacity: 0;  transform: scale(1.5); }
    }

    #ab-hud {
        position: fixed; left: 76px; bottom: 26px; z-index: 60;
        display: flex; align-items: center; gap: 8px;
        padding: 6px 8px 6px 10px; border-radius: 999px;
        background: rgba(10,10,18,.82); border: 1px solid rgba(255,255,255,.08);
        -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px);
        font: 500 10px/1 'JetBrains Mono', ui-monospace, monospace; color: #9ca3af;
    }
    #ab-hud.ab-corner { left: 14px; bottom: 14px; }
    #ab-hud .ab-dots { display: flex; }
    #ab-hud .ab-dots span {
        width: 8px; height: 8px; border-radius: 50%; margin-left: -2px;
        border: 1.5px solid #0a0a12; opacity: .35; transition: opacity .2s;
    }
    #ab-hud .ab-dots span.busy { opacity: 1; }
    #ab-hud button {
        font: inherit; color: #e5e7eb; cursor: pointer;
        background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
        padding: 4px 8px; border-radius: 999px;
    }
    #ab-hud button:hover { border-color: rgba(239,68,68,.5); }
    @media (max-width: 640px) {
        .ab-cur .ab-tag { font-size: 9px; padding: 2px 5px; }
        #ab-hud { left: 72px; bottom: 28px; }
    }`;
    document.head.appendChild(Object.assign(document.createElement('style'), { textContent: css }));

    // ── Helpers ───────────────────────────────────────────────────────────
    const CANCEL = Symbol('cancel');
    const rand = (a, b) => a + Math.random() * (b - a);
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const easeOut = t => 1 - Math.pow(1 - t, 3);
    const visible = el => el.offsetParent !== null && el.offsetWidth > 0 && el.offsetHeight > 0;

    function pageRect(el) {
        const r = el.getBoundingClientRect();
        return {
            left: r.left + scrollX, top: r.top + scrollY, width: r.width, height: r.height,
            right: r.right + scrollX, bottom: r.bottom + scrollY,
        };
    }
    function tween(ms, step, ok) {
        return new Promise((res, rej) => {
            const t0 = performance.now();
            const frame = now => {
                if (!ok()) return rej(CANCEL);
                const t = Math.min(1, (now - t0) / ms);
                step(t);
                t < 1 ? requestAnimationFrame(frame) : res();
            };
            requestAnimationFrame(frame);
        });
    }
    function sleep(ms, ok) {
        return new Promise((res, rej) => setTimeout(() => (ok() ? res() : rej(CANCEL)), ms));
    }

    // ── Overlay layer, cursors, HUD ───────────────────────────────────────
    const layer = Object.assign(document.createElement('div'), { id: 'ab-layer' });
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);

    const agents = AGENTS.map(def => {
        const el = document.createElement('div');
        el.className = 'ab-cur';
        el.style.setProperty('--ab-c', def.color);
        el.innerHTML =
            `<span class="ab-ring"></span>` +
            `<svg viewBox="0 0 18 18"><path d="M2 2l5.2 13.2 2-5.4 5.4-2z" fill="${def.color}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/></svg>` +
            `<span class="ab-tag">${def.name}</span><span class="ab-key"></span>`;
        layer.appendChild(el);
        return { ...def, el, key: el.querySelector('.ab-key'), x: 0, y: 0, shown: false, idleTimer: 0, busy: false };
    });

    const hud = document.createElement('div');
    hud.id = 'ab-hud';
    hud.innerHTML =
        `<span class="ab-dots">${agents.map(a => `<span style="background:${a.color}"></span>`).join('')}</span>` +
        `<span class="ab-status"></span><button type="button"></button>`;
    document.body.appendChild(hud);
    if (!document.getElementById('back-to-top')) hud.classList.add('ab-corner');
    const hudDots = $$('.ab-dots span', hud);
    const hudStatus = hud.querySelector('.ab-status');
    const hudBtn = hud.querySelector('button');

    function renderHud() {
        const n = agents.filter(a => a.busy).length;
        agents.forEach((a, i) => hudDots[i].classList.toggle('busy', a.busy));
        hudStatus.textContent = !running ? 'agents off' : n ? `${n} agent${n > 1 ? 's' : ''} building` : 'agents idle';
        hudBtn.textContent = running ? 'skip' : 'replay';
        hudBtn.setAttribute('aria-label', running ? 'Skip the build animation' : 'Replay the build animation');
    }

    function setPos(a, x, y) {
        a.x = x; a.y = y;
        a.el.style.transform = `translate3d(${x}px,${y}px,0)`;
    }
    function wake(a, tx, ty) {
        clearTimeout(a.idleTimer);
        const offscreen = a.y < scrollY - 80 || a.y > scrollY + innerHeight + 80;
        if (!a.shown || offscreen) {
            const fromLeft = tx < innerWidth / 2;
            setPos(a, fromLeft ? -24 : innerWidth + 4, clamp(ty + rand(-120, 120), scrollY + 70, scrollY + innerHeight - 30));
        }
        a.shown = true;
        a.el.classList.add('on');
    }
    function rest(a) {
        clearTimeout(a.idleTimer);
        a.idleTimer = setTimeout(() => { a.shown = false; a.el.classList.remove('on'); }, 900);
    }
    async function moveTo(a, x, y, ok, ms) {
        wake(a, x, y);
        const x0 = a.x, y0 = a.y, dx = x - x0, dy = y - y0;
        const d = Math.hypot(dx, dy) || 1;
        const bend = rand(-1, 1) * Math.min(50, d * .18);
        const nx = -dy / d, ny = dx / d;
        await tween(ms ?? clamp(d * .5, 150, 460), t => {
            const e = ease(t), arc = Math.sin(Math.PI * e) * bend;
            setPos(a, x0 + dx * e + nx * arc, y0 + dy * e + ny * arc);
        }, ok);
    }
    function click(a) {
        a.el.classList.remove('click');
        void a.el.offsetWidth;
        a.el.classList.add('click');
        setTimeout(() => a.el.classList.remove('click'), 360);
    }
    function showKey(a, text, ms = 520) {
        a.key.textContent = text;
        a.key.classList.add('on');
        setTimeout(() => a.key.classList.remove('on'), ms);
    }

    // ── Task queues (one per role, shared by the agents with that role) ───
    const queues = {}, waiters = {};
    function push(role, task) {
        const w = (waiters[role] ||= []).shift();
        if (w) w(task); else (queues[role] ||= []).push(task);
    }
    function take(role) {
        const q = (queues[role] ||= []);
        if (q.length) return Promise.resolve(q.shift());
        return new Promise(res => (waiters[role] ||= []).push(res));
    }
    async function work(a) {
        for (;;) {
            const task = await take(a.role);
            if (!task.ok()) continue;
            a.busy = true; renderHud();
            try { await task.run(a); }
            catch (e) { if (e !== CANCEL) console.error('[agent-build]', e); }
            a.busy = false; renderHud();
            rest(a);
        }
    }

    // ── Blocks ────────────────────────────────────────────────────────────
    // Pages built around .fade-in (the main site) use those as blocks. Pages
    // without them (the case studies) get blocks picked from each section.
    function autoBlocks() {
        const flows = el => {
            const pos = getComputedStyle(el).position;
            return pos !== 'absolute' && pos !== 'fixed' && el.offsetHeight > 0 && !el.matches('script, style');
        };
        const isGrid = el => /(^|\s)grid(\s|$)/.test(el.className) && el.children.length > 1;
        const out = [];
        $$('section').forEach(sec => {
            let kids = Array.from(sec.children).filter(flows);
            while (kids.length === 1 && !isGrid(kids[0]) && kids[0].children.length > 1 &&
                   /max-w-|container|mx-auto/.test(kids[0].className)) {
                kids = Array.from(kids[0].children).filter(flows);
            }
            kids.forEach(k => {
                if (isGrid(k)) out.push(...Array.from(k.children).filter(flows));
                else out.push(k);
            });
        });
        return out;
    }
    let blockEls = allFade.filter(el => !el.parentElement.closest('.fade-in'));
    if (blockEls.length < 8) {
        const auto = autoBlocks().filter(el => !el.closest('.fade-in') && !el.querySelector('.fade-in'));
        blockEls = blockEls.concat(auto);
    }
    const blocks = blockEls.map(el => ({ el, gen: 0, state: 'built', undo: [] }));

    let running = false;

    function undoAll(b) {
        b.undo.splice(0).reverse().forEach(fn => { try { fn(); } catch (_) {} });
    }
    function ghost(b) {
        b.gen++;
        undoAll(b);
        b.el.classList.add('ab-ghost');
        b.state = 'ghost';
    }
    function settle(b) {
        b.gen++;
        undoAll(b);
        b.el.classList.remove('ab-ghost');
        b.state = 'built';
    }

    // Hide the block's insides so the agents have something to fill in.
    function prep(b) {
        const el = b.el;
        const plan = { heads: [], paras: [], sizers: [], chips: [] };

        // Headings get typed
        within('h1, h2, h3', el).filter(visible).slice(0, 2).forEach(h => {
            const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
            const nodes = [];
            for (let n; (n = walker.nextNode());) if (n.nodeValue.trim()) nodes.push(n);
            if (!nodes.length) return;
            const saved = nodes.map(n => n.nodeValue);
            h.style.minHeight = h.offsetHeight + 'px';
            h.style.minWidth = h.offsetWidth + 'px';
            nodes.forEach(n => (n.nodeValue = ''));
            plan.heads.push({ h, nodes, saved });
            b.undo.push(() => {
                nodes.forEach((n, i) => (n.nodeValue = saved[i]));
                h.style.minHeight = h.style.minWidth = '';
                $$('.ab-caret', h).forEach(c => c.remove());
            });
        });

        // Body copy gets pasted
        within('p, li, pre', el).filter(p => visible(p) && p.textContent.trim() && !p.closest('h1,h2,h3')).forEach(p => {
            p.classList.add('ab-skel');
            plan.paras.push(p);
            b.undo.push(() => p.classList.remove('ab-skel', 'ab-flash'));
        });

        // Media and buttons get resized
        const media = within('.portrait-wrap, img, video', el).filter(m =>
            visible(m) && m.offsetWidth > 60 && !(m.matches('img') && m.closest('.portrait-wrap')))[0];
        const btns = within('a, button', el).filter(x =>
            visible(x) && x.offsetWidth > 90 && x.offsetHeight > 30 && x.offsetHeight < 80 && /rounded/.test(x.className)).slice(0, 2);
        [media, ...btns].filter(Boolean).forEach(s => {
            const from = s === media ? .84 : .8;
            s.style.transition = 'none';
            s.style.scale = from;
            s.style.opacity = '.3';
            plan.sizers.push({ el: s, from });
            b.undo.push(() => { s.style.transition = s.style.scale = s.style.opacity = ''; });
        });

        // Tags and pills get stamped in
        within('span, div, a', el).filter(c =>
            visible(c) && c.matches('[class*="rounded-full"], .skill-tag, .date-pill') &&
            c.textContent.trim() && c.offsetWidth < 260 && c.offsetHeight < 44 &&
            !plan.sizers.some(s => s.el === c)).slice(0, 18).forEach(c => {
            c.style.transition = 'none';
            c.style.scale = '.4';
            c.style.opacity = '0';
            plan.chips.push(c);
            b.undo.push(() => { c.style.transition = c.style.scale = c.style.opacity = ''; });
        });

        return plan;
    }

    // layout-agent / grid-agent: drag the block into its slot
    async function drag(a, b, ok) {
        const el = b.el;
        const plan = prep(b);
        const r = pageRect(el);
        const mobile = innerWidth < 640;

        const frame = document.createElement('div');
        frame.className = 'ab-frame';
        frame.style.cssText = `--ab-c:${a.color};left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
        layer.appendChild(frame);
        b.undo.push(() => frame.remove());

        const mid = r.left + r.width / 2;
        const side = Math.abs(mid - innerWidth / 2) < 40 ? (Math.random() < .5 ? -1 : 1) : (mid < innerWidth / 2 ? -1 : 1);
        const ox = side * (mobile ? rand(24, 40) : rand(110, 200));
        const oy = rand(70, 140);
        const rot = side * rand(1.5, 3.5);
        const gx = r.left + Math.min(r.width * .3, 120);
        const gy = r.top + Math.min(22, r.height / 2);

        await moveTo(a, gx + ox, gy + oy, ok);
        click(a);
        el.style.setProperty('--ab-c', a.color);
        el.style.translate = `${ox}px ${oy}px`;
        el.style.rotate = `${rot}deg`;
        el.classList.remove('ab-ghost');
        el.classList.add('ab-fly');
        b.state = 'flying';
        b.undo.push(() => {
            el.style.translate = el.style.rotate = '';
            el.classList.remove('ab-fly', 'ab-drop');
            el.style.removeProperty('--ab-c');
        });

        await tween(clamp(Math.hypot(ox, oy) * 2.4, 320, 520), t => {
            const k = 1 - easeOut(t);
            el.style.translate = `${ox * k}px ${oy * k}px`;
            el.style.rotate = `${rot * k}deg`;
            setPos(a, gx + ox * k, gy + oy * k);
        }, ok);

        el.style.translate = el.style.rotate = '';
        el.classList.remove('ab-fly');
        el.classList.add('ab-drop');
        frame.remove();
        click(a);
        b.state = 'filling';

        // Hand the dropped block to the other agents, all at once
        const jobs = [];
        if (plan.heads.length) jobs.push(['type', ag => typeHeads(ag, plan.heads, ok)]);
        if (plan.paras.length) jobs.push(['paste', ag => pasteCopy(ag, plan.paras, ok)]);
        if (plan.sizers.length || plan.chips.length) jobs.push(['polish', ag => polish(ag, plan, ok)]);
        let left = jobs.length;
        const done = () => { if (--left <= 0 && ok()) { undoAll(b); b.state = 'built'; } };
        if (!left) done();
        jobs.forEach(([role, fn]) => push(role, {
            ok,
            run: async ag => { try { await fn(ag); } finally { done(); } },
        }));
    }

    // copy-agent: type each heading
    async function typeHeads(a, heads, ok) {
        for (const { h, nodes, saved } of heads) {
            const caret = document.createElement('span');
            caret.className = 'ab-caret';
            caret.style.setProperty('--ab-c', a.color);
            nodes[0].after(caret);
            const at = () => {
                const c = caret.getBoundingClientRect();
                return [c.left + scrollX + 3, c.top + scrollY + c.height * .65];
            };
            await moveTo(a, ...at(), ok);
            click(a);

            const total = saved.reduce((n, s) => n + s.length, 0);
            let active = 0;
            await tween(clamp(total * 26, 260, 720), t => {
                let n = Math.round(t * total);
                saved.forEach((s, i) => {
                    const take = Math.min(n, s.length);
                    nodes[i].nodeValue = s.slice(0, take);
                    n -= take;
                    if (take > 0 && i > active) { active = i; nodes[i].after(caret); }
                });
                setPos(a, ...at());
            }, ok);

            nodes.forEach((n, i) => (n.nodeValue = saved[i]));
            caret.remove();
            h.style.minHeight = h.style.minWidth = '';
            await sleep(70, ok);
        }
    }

    // content-agent: paste the body copy in a few chunks
    async function pasteCopy(a, paras, ok) {
        const visits = Math.min(3, paras.length);
        const size = Math.ceil(paras.length / visits);
        for (let v = 0; v < visits; v++) {
            const chunk = paras.slice(v * size, (v + 1) * size);
            if (!chunk.length) break;
            const r = pageRect(chunk[0]);
            await moveTo(a, r.left + Math.min(14, r.width / 2), r.top + Math.min(12, r.height / 2), ok);
            click(a);
            showKey(a, '⌘V');
            for (const p of chunk) {
                p.style.setProperty('--ab-c', a.color);
                p.classList.remove('ab-skel');
                p.classList.add('ab-flash');
                await sleep(35, ok);
            }
            await sleep(110, ok);
        }
    }

    // polish-agent: resize media and buttons, then stamp in the tags
    async function polish(a, plan, ok) {
        for (const { el, from } of plan.sizers) {
            const box = document.createElement('div');
            box.className = 'ab-box';
            box.style.setProperty('--ab-c', a.color);
            box.innerHTML = '<i></i><i></i><i></i><i></i><b></b>';
            const label = box.lastChild;
            layer.appendChild(box);
            const sync = () => {
                const r = pageRect(el);
                box.style.cssText += `;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
                label.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
                return r;
            };
            try {
                let r = sync();
                await moveTo(a, r.right, r.bottom, ok);
                click(a);
                await tween(430, t => {
                    const s = t < .65 ? from + (1.05 - from) * easeOut(t / .65) : 1.05 - .05 * ease((t - .65) / .35);
                    el.style.scale = s;
                    el.style.opacity = String(.3 + .7 * Math.min(1, t * 1.6));
                    r = sync();
                    setPos(a, r.right, r.bottom);
                }, ok);
                el.style.transition = el.style.scale = el.style.opacity = '';
            } finally {
                box.style.opacity = '0';
                setTimeout(() => box.remove(), 220);
            }
            await sleep(60, ok);
        }

        for (const c of plan.chips) {
            const r = pageRect(c);
            await moveTo(a, r.left + r.width / 2, r.top + r.height / 2, ok, 60);
            c.style.transition = 'scale .28s cubic-bezier(.3,1.7,.5,1), opacity .15s';
            c.style.scale = c.style.opacity = '';
            setTimeout(() => { if (!c.style.scale) c.style.transition = ''; }, 320);
        }
    }

    // ── Scroll watcher: build what enters, tear down what leaves ──────────
    let scheduled = false;
    function check() {
        scheduled = false;
        if (!running) return;
        const vh = innerHeight;
        const atEnd = scrollY + vh >= document.documentElement.scrollHeight - 4;
        for (const b of blocks) {
            if (b.state === 'flying') continue;
            const r = b.el.getBoundingClientRect();
            if (r.width === 0 && r.height === 0) continue;
            if (b.state === 'ghost') {
                if (r.top < vh * (atEnd ? 1 : .88) && r.bottom > vh * .04) {
                    const gen = ++b.gen;
                    const ok = () => running && b.gen === gen;
                    b.state = 'queued';
                    push('layout', { ok, run: a => drag(a, b, ok) });
                }
            } else if (r.bottom < -60 || r.top > vh + 60) {
                ghost(b);
            }
        }
    }
    function schedule() {
        if (!scheduled) { scheduled = true; requestAnimationFrame(check); }
    }

    function start() {
        running = true;
        document.documentElement.classList.add('ab-on');
        blocks.forEach(ghost);
        renderHud();
        schedule();
    }
    function stop() {
        running = false;
        document.documentElement.classList.remove('ab-on');
        Object.values(queues).forEach(q => (q.length = 0));
        blocks.forEach(settle);
        agents.forEach(a => { clearTimeout(a.idleTimer); a.shown = false; a.el.classList.remove('on'); });
        renderHud();
    }

    hudBtn.addEventListener('click', () => {
        running ? stop() : start();
        try { running ? sessionStorage.removeItem(STORE_KEY) : sessionStorage.setItem(STORE_KEY, '1'); } catch (_) {}
    });
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule);
    addEventListener('load', schedule);
    setInterval(schedule, 400);

    agents.forEach(work);

    let off = false;
    try { off = sessionStorage.getItem(STORE_KEY) === '1'; } catch (_) {}
    off ? renderHud() : start();
})();
