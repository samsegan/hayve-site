/* hayve, the dark version: the solid mark behind the page, the hub screens, the record strip and the player. */
import { createMark, POSES } from './mark3d.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const html = document.documentElement;
const DATA = window.HAYVE || { records: [], mark: null };
const wide = matchMedia('(min-width: 821px)');
const calm = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rec = (id) => DATA.records.find((r) => r.id === id);
const clock = (ms) => { const s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const ask = new URLSearchParams(location.search);

// ---------- the mark ----------
const gl = DATA.mark ? createMark($('#gl'), DATA.mark, { phone: !wide.matches }) : null;
if (!gl) html.classList.add('no-gl');
const stopEls = $$('[data-pose]');
if (gl) {
  gl.setStops(stopEls.map((el) => POSES[el.dataset.pose] || POSES.gate));
  if (calm.matches || ask.has('t')) gl.freeze(+ask.get('t') || 3);
  window.__mark = gl;
}

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

// ---------- hub titles: the letters stand up one after another ----------
$$('.hub-t').forEach((h) => {
  const text = h.textContent;
  h.setAttribute('aria-label', text);
  h.innerHTML = [...text].map((c, i) => (c === ' ' ? ' ' : `<span class="ch" aria-hidden="true" style="--i:${i}">${c}</span>`)).join('');
});
const seen = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('in', e.isIntersecting)), { rootMargin: '-8% 0px -12% 0px', threshold: 0.2 });
$$('.hub-t').forEach((h) => seen.observe(h));

// ---------- scroll: where the visitor is decides where the camera stands ----------
const open = $('#open'), crateIn = $('#crate-in'), pager = $('#pager');
const sections = $$('main [data-s]');
let ticking = false, armed = true;
function place() {
  ticking = false;
  const vh = innerHeight, y = scrollY;
  if (gl) {
    let f = 0;
    if (ask.has('f')) f = +ask.get('f');
    else {
      const tops = stopEls.map((el) => el.getBoundingClientRect().top + y);
      const r = y + vh * 0.12;
      for (let i = 0; i < tops.length; i++) {
        if (i === tops.length - 1 || r < tops[i + 1]) {
          // hold this place, then move to the next one over the last stretch before it
          const next = tops[i + 1] == null ? Infinity : tops[i + 1];
          const span = Math.min(next - tops[i], vh * 0.95);
          f = i + (next === Infinity ? 0 : clamp((r - (next - span)) / span));
          break;
        }
      }
    }
    gl.setProgress(f);
  }
  // the dot for the section on screen
  let cur = 'gate';
  for (const s of sections) { if (s.getBoundingClientRect().top <= vh * 0.5) cur = s.dataset.s; }
  $$('a', pager).forEach((a) => a.classList.toggle('on', a.dataset.s === cur));
  // one stroke of lightning as the line arrives
  if (open) {
    const top = open.getBoundingClientRect().top;
    if (armed && top < vh * 0.3 && top > -vh * 0.6) {
      armed = false;
      if (!calm.matches) { open.classList.add('zap'); if (gl) gl.flash(); setTimeout(() => open.classList.remove('zap'), 1000); }
    }
    if (top > vh * 0.9) armed = true;
  }
  if (crateIn) {
    const r = crateIn.getBoundingClientRect();
    if (r.bottom > -200 && r.top < vh + 200) crateIn.style.setProperty('--v', clamp((vh - r.top) / (vh + r.height)).toFixed(3));
  }
}
const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(place); } };
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', onScroll);
place();
if (gl && fine.matches) addEventListener('pointermove', (e) => gl.setPointer(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5), { passive: true });

// ---------- every record: the sideways strip ----------
const strip = $('#strip');
const KIND = { remix: 'remix', edit: 'edit', free: 'free download' };
const docks = (r) => !!(r && r.soundcloud && r.embed !== false && wide.matches);
if (strip) {
  let year = 0, out = '';
  DATA.records.forEach((r) => {
    if (r.year !== year) { year = r.year; out += `<p class="yr" aria-hidden="true">${year}</p>`; }
    const others = (r.with || []).join(', ');
    const feat = r.feat ? ` feat. ${r.feat}` : '';
    const by = r.kind === 'single' ? (others ? `with ${others}${feat}` : (feat ? feat.trim() : 'hayve')) : `${others}${feat} · ${KIND[r.kind]}`;
    const links = [['soundcloud', 'SoundCloud'], ['spotify', 'Spotify'], ['apple', 'Apple']].filter(([k]) => r[k]).map(([k, n]) => `<a href="${r[k]}" target="_blank" rel="noopener">${n}</a>`).join('');
    out += `<article class="rec" data-id="${r.id}">
      <button class="rec-art" type="button" data-play="${r.id}" aria-label="Play ${r.title}"><img src="../${r.art}" alt="" width="480" height="480" loading="lazy" draggable="false"></button>
      <h3>${r.title}</h3><p class="w">${by}${r.note ? `<br>${r.note}` : ''}</p>
      <p class="meta"><span>${r.label || ''}</span><span>${r.day}</span></p>
      <p class="go-to">${links}</p></article>`;
  });
  strip.innerHTML = out;
  $('#crate-count').textContent = DATA.records.length;
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
  strip.dataset.cursor = 'Drag';
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
  $('#dock-art').src = '../' + r.art;
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
