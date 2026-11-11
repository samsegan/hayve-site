/* hayve: the turning mark, the paper-cut owls, scroll motion, the record strip and the player. */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const html = document.documentElement;
  const DATA = window.HAYVE || { records: [], mark: null };
  const wide = matchMedia('(min-width: 821px)');
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const rec = (id) => DATA.records.find((r) => r.id === id);
  const clock = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  if (!calm.matches) html.classList.add('go');

  // ---------- menu ----------
  const menu = $('#menu'), menuBtn = $('#menu-btn');
  function setMenu(on) {
    if (on) menu.hidden = false;
    requestAnimationFrame(() => html.classList.toggle('menu-open', on));
    menuBtn.setAttribute('aria-expanded', on);
    if (!on) setTimeout(() => { if (!html.classList.contains('menu-open')) menu.hidden = true; }, 520);
  }
  menuBtn.addEventListener('click', () => setMenu(!html.classList.contains('menu-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // ---------- the clock on the edge: the time where hayve works ----------
  const clockEl = $('#clock');
  if (clockEl) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Helsinki', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const tick = () => { clockEl.textContent = 'FIN - ' + fmt.format(new Date()); };
    tick(); setInterval(tick, 1000);
  }

  // ---------- star dust ----------
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  $$('.dust').forEach((box) => {
    const n = Math.round((+box.dataset.dust || 40) * (wide.matches ? 1 : 0.5));
    let out = '';
    for (let i = 0; i < n; i++) {
      const s = rnd() < 0.85 ? 1 + rnd() * 1.6 : 2.6 + rnd() * 2;
      out += `<i style="--x:${(rnd() * 100).toFixed(1)}%;--y:${(rnd() * 100).toFixed(1)}%;--s:${s.toFixed(1)}px;--o:${(0.25 + rnd() * 0.65).toFixed(2)};--t:${(7 + rnd() * 12).toFixed(1)}s;--d:${(-rnd() * 19).toFixed(1)}s;--dx:${Math.round(rnd() * 80 - 40)}px"></i>`;
    }
    box.innerHTML = out;
  });

  // ---------- the mark, cut thick: slices of the same shape stacked in depth ----------
  function hex(a, b, t) {
    const pa = a.match(/\w\w/g).map((x) => parseInt(x, 16)), pb = b.match(/\w\w/g).map((x) => parseInt(x, 16));
    return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  // The slices are small drawings of the mark; the front face is a masked box, so it can carry the moving sheen.
  const MK = DATA.mark;
  if (MK) {
    const vb = `${MK.box[0] - 2} ${MK.box[1] - 2} ${MK.box[2] + 4} ${MK.box[3] + 4}`;
    document.body.insertAdjacentHTML('beforeend', `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><symbol id="mk" viewBox="${vb}"><path d="${MK.d}"/></symbol></svg>`);
  }
  $$('.m3d').forEach((el) => {
    const n = Math.round((+el.dataset.slices || 20) * (wide.matches ? 1 : 0.7));
    const dark = el.classList.contains('dark');
    const step = dark ? 5 : 2.3;
    const [back, front] = dark ? ['#040409', '#2c2a78'] : ['#0b0a22', '#5546e0'];
    let out = '';
    for (let i = 0; i < n; i++) out += `<svg style="--k:${((i - n / 2) * step).toFixed(1)};fill:${hex(back, front, Math.pow(i / (n - 1), 1.6))}"><use href="#mk"/></svg>`;
    out += `<i class="face" style="--k:${((n / 2) * step).toFixed(1)}"></i>`;
    el.innerHTML = out;
  });

  // ---------- paper-cut owls ----------
  const M = DATA.mark;
  const blade = (len, w, tip = 0.74) => { const h = w / 2; return `M0,${(-h * 0.5).toFixed(1)} L${(len * tip).toFixed(1)},${-h} Q${len},${-h} ${len},0 Q${len},${h} ${(len * tip).toFixed(1)},${h} L0,${(h * 0.5).toFixed(1)} Z`; };
  function face(cx, top, width) {
    if (!M) return '';
    const k = width / M.box[2];
    return `<g transform="translate(${(cx - width / 2).toFixed(1)},${top}) scale(${k.toFixed(4)}) translate(${-M.box[0]},${-M.box[1]})"><path class="face" d="${M.d}"/></g>`;
  }
  // each feather lies on a darker copy of itself, set a little lower: cut paper, no outlines
  const feather = (cls, len, w, ang) => `<path class="s" d="${blade(len, w)}" transform="rotate(${ang}) translate(-4,13)"/><path class="${cls}" d="${blade(len, w)}" transform="rotate(${ang})"/>`;
  function wing(side) {
    let prim = '', cov = '';
    for (let i = 0; i < 9; i++) { const t = i / 8; prim += feather(`f f${i % 3}`, 560 - 200 * t - (i === 0 ? 46 : 0), 84, (-30 + t * 100).toFixed(1)); }
    for (let i = 0; i < 7; i++) { const t = i / 6; cov += feather(`c c${i % 2}`, 322 - 100 * t, 72, (-22 + t * 92).toFixed(1)); }
    return `<g transform="translate(${side * 62},-40) scale(${side},1)"><g class="flap"><g class="prim">${prim}</g><g class="cov">${cov}</g><ellipse class="sh" cx="64" cy="20" rx="128" ry="64" transform="rotate(26)"/></g></g>`;
  }
  function flyingOwl() {
    let tail = '', chest = '';
    for (let i = 0; i < 5; i++) tail += `<path class="s" d="${blade(210, 66)}" transform="translate(0,150) rotate(${62 + i * 14}) translate(-4,10)"/><path class="t t${i % 2}" d="${blade(210, 66)}" transform="translate(0,150) rotate(${62 + i * 14})"/>`;
    for (let row = 0; row < 4; row++) for (let c = -1 - (row % 2 ? 0 : 0.5); c <= 1 + (row % 2 ? 0 : 0.5); c++) {
      const x = c * 44, y = 22 + row * 40;
      if (Math.abs(x) < 86 - row * 9) chest += `<path class="chest" d="M${x - 15},${y} Q${x},${y + 20} ${x + 15},${y}"/>`;
    }
    return `<svg class="owl" viewBox="0 0 1400 800" aria-hidden="true"><g transform="translate(700,400)">${wing(-1)}${wing(1)}${tail}
      <path class="body" d="M-100,-70 C-128,60 -76,196 0,224 C76,196 128,60 100,-70 Z"/>${chest}
      <ellipse class="neck" cx="0" cy="-128" rx="124" ry="104"/>
      <ellipse class="head" cx="0" cy="-150" rx="126" ry="108"/>${face(0, -236, 372)}</g></svg>`;
  }
  function perchedOwl(i) {
    let chest = '';
    for (let row = 0; row < 4; row++) for (let c = -1.5 + (row % 2) * 0.5; c <= 1.5; c++) {
      const x = 120 + c * 34, y = 196 + row * 26;
      if (Math.abs(x - 120) < 62 - row * 5) chest += `<path class="pc" d="M${x - 11},${y} Q${x},${y + 14} ${x + 11},${y}"/>`;
    }
    const eyes = M ? M.eyes.map((e) => { const k = 300 / M.box[2]; const x = -30 + (e[0] - M.box[0]) * k, y = 78 + (e[1] - M.box[1]) * k, w = (e[2] - e[0]) * k, h = (e[3] - e[1]) * k; return `<rect class="lid" x="${(x - 3).toFixed(1)}" y="${(y - 3).toFixed(1)}" width="${(w + 6).toFixed(1)}" height="${(h + 6).toFixed(1)}" style="--bd:${(i * 1.3 + 0.4).toFixed(1)}s"/>`; }).join('') : '';
    return `<div class="bird"><svg viewBox="-40 40 320 300"><path class="pb" d="M120,64 C196,64 220,136 216,214 C213,282 172,322 120,322 C68,322 27,282 24,214 C20,136 44,64 120,64Z"/>
      <path class="pw" d="M30,170 C22,236 48,292 92,312 C60,270 44,220 46,160Z"/><path class="pw" d="M210,170 C218,236 192,292 148,312 C180,270 196,220 194,160Z"/>${chest}
      <g class="hd">${face(120, 78, 300)}${eyes}</g><path class="pt" d="M96,322 v12 M108,322 v12 M132,322 v12 M144,322 v12"/></svg></div>`;
  }
  const owlBox = $('#owl');
  if (owlBox) owlBox.innerHTML = flyingOwl();
  const perch = $('#perch');
  if (perch) perch.innerHTML = [0, 1, 2, 3, 4].map(perchedOwl).join('');
  const birds = $$('.bird', perch || document);

  // falling feathers before the contact screen
  const feathers = $('#feathers');
  if (feathers) {
    let out = '';
    const n = wide.matches ? 13 : 8;
    for (let i = 0; i < n; i++) {
      const w = 90 + rnd() * 170, len = 300, wd = 62;
      out += `<svg viewBox="-10 -40 330 80" style="--x:${(4 + (i / n) * 88 + rnd() * 6).toFixed(1)}%;--y:${(rnd() * 70).toFixed(1)}%;--w:${w.toFixed(0)}px;--r:${Math.round(40 + rnd() * 100)}deg;--tw:${Math.round(rnd() * 90 - 45)}deg;--sp:${Math.round(-80 - rnd() * 260)}px"><path class="q${i % 4}" d="${blade(len, wd, 0.6)}"/><path class="quill" d="M-8,0 H${len * 0.82}"/></svg>`;
    }
    feathers.innerHTML = out;
  }

  // ---------- headings: letters rise one after another on a slightly uneven line ----------
  $$('.tilt-h').forEach((h) => {
    const text = h.textContent;
    h.setAttribute('aria-label', text);
    h.innerHTML = [...text].map((c, i) => (c === ' ' ? ' ' : `<span class="ch" aria-hidden="true" style="--i:${i};--w:${(Math.sin(i * 1.7) * 2.4).toFixed(1)}">${c}</span>`)).join('');
  });
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  $$('.tilt-h').forEach((h) => seen.observe(h));

  // ---------- scroll: every moving part takes its place from where the page is ----------
  const gate = $('#gate'), open = $('#open'), records = $('#records'), crate = $('#crate');
  const enterEls = $$('[data-v]');
  const flaps = $$('.flap', owlBox || document);
  let vh = innerHeight, ticking = false;
  function place() {
    ticking = false;
    vh = innerHeight;
    const y = scrollY;
    html.classList.toggle('past-gate', y > gate.offsetHeight * 0.55);
    if (open && html.classList.contains('go')) {
      const r = open.getBoundingClientRect();
      const p = clamp(-r.top / Math.max(1, r.height - vh));
      const z = (p - 0.70) / 0.09;
      const bolt = z < 0 || z > 1 ? 0 : z < 0.12 ? 1 : z < 0.24 ? 0.15 : z < 0.42 ? 0.95 : 1 - (z - 0.42) / 0.58;
      open.style.setProperty('--a', easeIO(clamp((p - 0.08) / 0.16)).toFixed(3));
      open.style.setProperty('--o', easeOut(clamp((p - 0.14) / 0.5)).toFixed(3));
      open.style.setProperty('--mn', easeOut(clamp((p - 0.06) / 0.62)).toFixed(3));
      open.style.setProperty('--z', bolt.toFixed(2));
    }
    enterEls.forEach((el) => {
      const top = el.parentElement.getBoundingClientRect().top + el.offsetTop;
      el.style.setProperty('--v', easeOut(clamp((vh - top) / (vh * 0.85))).toFixed(3));
    });
    [records, crate].forEach((el) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.setProperty('--v', clamp((vh - r.top) / (vh + r.height)).toFixed(3));
    });
    if (feathers) {
      const r = feathers.getBoundingClientRect();
      if (r.bottom > -300 && r.top < vh + 300) feathers.style.setProperty('--fv', clamp((vh - r.top) / (vh + r.height)).toFixed(3));
    }
    if (perch) {
      const r = perch.getBoundingClientRect();
      if (r.bottom > 0 && r.top < vh) birds.forEach((b, i) => b.style.setProperty('--lean', (Math.sin(y / 130 + i * 1.9) * 5).toFixed(1) + 'deg'));
    }
  }
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(place); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  place();

  // ---------- what moves by itself: the turning mark and the wings ----------
  const live = new Set();
  const io = new IntersectionObserver((es) => es.forEach((e) => { e.isIntersecting ? live.add(e.target) : live.delete(e.target); }), { threshold: 0 });
  [gate, open, $('#out')].forEach((el) => el && io.observe(el));
  const m1 = $('#m3d'), m2 = $('#m3d-2');
  let px = 0, py = 0;
  addEventListener('pointermove', (e) => { px = e.clientX / innerWidth - 0.5; py = e.clientY / innerHeight - 0.5; }, { passive: true });
  function frame(now) {
    const t = now / 1000;
    if (live.has(gate) && m1) {
      m1.style.setProperty('--ry', (-6 + Math.sin(t * 0.5) * 30 + px * 16).toFixed(2) + 'deg');
      m1.style.setProperty('--rx', (12 + Math.sin(t * 0.33) * 5 - py * 10).toFixed(2) + 'deg');
    }
    if (m2 && live.has(m2.closest('section'))) {
      m2.style.setProperty('--ry', (-54 + Math.sin(t * 0.3) * 7 + px * 8).toFixed(2) + 'deg');
    }
    if (live.has(open) && flaps.length) {
      const s = Math.sin(t * 2.6), s2 = Math.sin(t * 2.6 - 0.5);
      flaps.forEach((f) => {
        f.setAttribute('transform', `rotate(${(2 + s * 11).toFixed(2)}) scale(1,${(0.94 - s * 0.08).toFixed(3)})`);
        f.children[1].setAttribute('transform', `rotate(${(s2 * 4).toFixed(2)})`);
      });
    }
    requestAnimationFrame(frame);
  }
  if (!calm.matches) requestAnimationFrame(frame);

  // ---------- every record: the sideways strip ----------
  const strip = $('#strip');
  const KIND = { remix: 'remix', edit: 'edit', free: 'free download' };
  const inDock = () => wide.matches;
  const docks = (r) => !!(r && r.soundcloud && r.embed !== false && inDock());
  if (strip) {
    let year = 0, out = '';
    DATA.records.forEach((r) => {
      if (r.year !== year) { year = r.year; out += `<p class="yr" aria-hidden="true">${year}</p>`; }
      const others = (r.with || []).join(', ');
      const feat = r.feat ? ` feat. ${r.feat}` : '';
      const by = r.kind === 'single' ? (others ? `with ${others}${feat}` : (feat ? feat.trim() : 'hayve')) : `${others}${feat} · ${KIND[r.kind]}`;
      const links = [['soundcloud', 'SoundCloud'], ['spotify', 'Spotify'], ['apple', 'Apple']].filter(([k]) => r[k]).map(([k, n]) => `<a href="${r[k]}" target="_blank" rel="noopener">${n}</a>`).join('');
      out += `<article class="rec foil" data-id="${r.id}">
        <button class="rec-art" type="button" data-play="${r.id}" aria-label="Play ${r.title}"><img src="${r.art}" alt="" width="480" height="480" loading="lazy" draggable="false"></button>
        <h3>${r.title}</h3><p class="w">${by}${r.note ? `<br>${r.note}` : ''}</p>
        <p class="meta"><span>${r.label || ''}</span><span>${r.day}</span></p>
        <p class="go-to">${links}</p></article>`;
    });
    strip.innerHTML = out;
    $('#crate-count').textContent = DATA.records.length;
    // drag with the mouse; touch screens scroll it natively
    let down = null, moved = false;
    strip.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = { x: e.clientX, left: strip.scrollLeft }; moved = false; });
    addEventListener('pointermove', (e) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (!moved && Math.abs(dx) > 6) { moved = true; strip.classList.add('drag'); }
      if (moved) strip.scrollLeft = down.left - dx;
    });
    addEventListener('pointerup', () => { if (down && moved) setTimeout(() => strip.classList.remove('drag'), 0); down = null; });
    strip.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    const page = (dir) => strip.scrollBy({ left: dir * strip.clientWidth * 0.8, behavior: calm.matches ? 'auto' : 'smooth' });
    $('#strip-prev').addEventListener('click', () => page(-1));
    $('#strip-next').addEventListener('click', () => page(1));
  }
  // label the pointer honestly: "Play" only where the player will take it
  $$('[data-play]').forEach((b) => {
    const here = docks(rec(b.dataset.play));
    b.dataset.cursor = here ? 'Play' : 'Open';
    if (!here && b.dataset.openLabel) b.textContent = b.dataset.openLabel;
  });

  // ---------- a small tag that follows the pointer ----------
  const tag = $('#cursor');
  if (tag && fine.matches) {
    addEventListener('pointermove', (e) => {
      const hit = e.target.closest && e.target.closest('[data-cursor]');
      tag.classList.toggle('on', !!hit);
      if (hit) { tag.textContent = hit.dataset.cursor; tag.style.transform = `translate(${e.clientX + 18}px, ${e.clientY + 22}px)`; }
    }, { passive: true });
    document.addEventListener('pointerleave', () => tag.classList.remove('on'));
  }

  // ---------- player: SoundCloud's own widget behind our controls (wide screens) ----------
  const dock = { el: $('#dock'), widget: null, frame: null, dur: 0, rel: null, started: false, on: false };
  const openOut = (url) => { const w = window.open(url, '_blank'); if (w) w.opener = null; else location.href = url; };
  function play(id) {
    const r = rec(id);
    if (!r) return;
    if (!docks(r)) { openOut(r.soundcloud || r.spotify || r.apple); return; }
    if (dock.rel && dock.rel.id === r.id && dock.widget && !dock.el.hidden) { dock.widget.toggle(); return; }
    loadSC().then(() => start(r)).catch(() => openOut(r.soundcloud));
  }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-play]'); if (b) play(b.dataset.play); });
  function loadSC() {
    if (window.SC && window.SC.Widget) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://w.soundcloud.com/player/api.js';
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  function state() {
    $$('[data-play]').forEach((p) => p.classList.toggle('playing', !!(dock.on && dock.rel && dock.rel.id === p.dataset.play)));
    $$('.rec').forEach((c) => c.classList.toggle('playing', !!(dock.on && dock.rel && dock.rel.id === c.dataset.id)));
  }
  const paused = (p) => { dock.on = !p; $('#dock-play').classList.toggle('paused', p); state(); };
  function start(r) {
    const url = r.soundcloud;
    $('#dock-title').textContent = r.title;
    $('#dock-art').src = r.art;
    $('#dock-out').href = url;
    $('#dock-time').textContent = 'Loading';
    $('#dock-fill').style.width = '0';
    dock.el.hidden = false;
    html.style.setProperty('--dock', dock.el.offsetHeight + 'px');
    dock.rel = r; dock.started = false; dock.dur = r.seconds * 1000;   // the length SoundCloud lists; its widget reports the last track's for a moment
    paused(true);
    const opts = { auto_play: true, show_artwork: false, show_comments: false, visual: false };
    if (!dock.frame) {
      const src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&auto_play=true&show_artwork=false&show_comments=false&visual=false';
      dock.frame = Object.assign(document.createElement('iframe'), { className: 'sc-frame', allow: 'autoplay; encrypted-media', title: 'SoundCloud player', src });
      dock.tap.appendChild(dock.frame);
      dock.widget = window.SC.Widget(dock.frame);
      const E = window.SC.Widget.Events;
      dock.widget.bind(E.READY, expectSound);
      dock.widget.bind(E.PLAY_PROGRESS, (e) => {
        if (!dock.started && e.currentPosition > 0) { dock.started = true; needTap(false); }
        $('#dock-fill').style.width = (e.relativePosition * 100).toFixed(2) + '%';
        $('#dock-bar').setAttribute('aria-valuenow', Math.round(e.relativePosition * 100));
        $('#dock-time').textContent = `${clock(e.currentPosition)} / ${clock(dock.dur)}`;
      });
      dock.widget.bind(E.PLAY, () => paused(false));
      dock.widget.bind(E.PAUSE, () => paused(true));
      dock.widget.bind(E.FINISH, () => paused(true));
    } else {
      dock.widget.load(url, Object.assign({ callback: expectSound }, opts));
    }
  }
  // If the browser will not start sound by itself, SoundCloud's own play button slides up for one click.
  dock.tap = Object.assign(document.createElement('div'), { className: 'sc-tap', innerHTML: '<p>Press play once to start the sound</p>' });
  document.body.appendChild(dock.tap);
  function needTap(on) {
    clearTimeout(dock.wait);
    if (on) $('#dock-time').textContent = 'Press play';
    dock.tap.classList.toggle('on', on);
  }
  function expectSound() {
    clearTimeout(dock.wait);
    dock.wait = setTimeout(() => { if (!dock.started && !dock.el.hidden) needTap(true); }, 2500);
  }
  $('#dock-play').addEventListener('click', () => { if (dock.widget) { dock.widget.toggle(); if (!dock.started) expectSound(); } });
  $('#dock-close').addEventListener('click', () => {
    if (dock.widget) dock.widget.pause();
    needTap(false); dock.el.hidden = true; html.style.setProperty('--dock', '0px'); paused(true);
  });
  const seek = (frac) => { if (dock.widget && dock.dur) dock.widget.seekTo(dock.dur * clamp(frac)); };
  $('#dock-bar').addEventListener('click', (e) => { const b = e.currentTarget.getBoundingClientRect(); seek((e.clientX - b.left) / b.width); });
  $('#dock-bar').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    if (!dock.widget || !dock.dur) return;
    dock.widget.getPosition((ms) => dock.widget.seekTo(clamp(ms + (e.key === 'ArrowRight' ? 5000 : -5000), 0, dock.dur)));
  });
})();
