/* hayve's mark as a solid object: cut thick, black on its faces, steel on its sides, lit by one moving light.
   The page tells it where the visitor is (a number that runs along the sections); it moves the camera there. */
import * as THREE from './vendor/three.module.min.js';

const WIDTH = 8;        // the mark is 8 units wide; everything else is measured against that
const DEPTH = 0.95;

// Camera places, one per stop on the page: where the camera stands, what it looks at, how the mark is turned,
// and how strong the lights are. `full` = the whole mark must stay in view on a narrow screen.
export const POSES = {
  gate:      { cam: [0, -0.5, 15.5], look: [0, 0.75, 0], rot: [0.10, -0.42], key: 1.0, rim: 0.7, full: true },
  open:      { cam: [-3.8, -2.0, 9.4], look: [1.3, 0.5, 0], rot: [-0.04, 0.3], key: 1.15, rim: 0.7 },
  hubLeft:   { cam: [-2.6, -2.2, 8.8], look: [-0.3, 0.9, 0], rot: [-0.04, 0.34], key: 1.2, rim: 0.7 },
  hubRight:  { cam: [2.4, -1.9, 8.8], look: [0.5, 1.0, 0], rot: [0.02, -0.66], key: 1.2, rim: 0.6 },
  hubUnder:  { cam: [0.6, -4.2, 8.0], look: [0.2, 0.8, 0], rot: [-0.14, -0.2], key: 0.7, rim: 0.9, env: 0.45 },
  hubOver:   { cam: [1.4, 3.6, 10.4], look: [0.2, -1.1, 0], rot: [0.3, -0.5], key: 1.2, rim: 0.6 },
  sideRight: { cam: [-3.0, 0.1, 11.6], look: [-4.3, 0.1, 0], rot: [0.04, -0.86], key: 0.75, rim: 1.2 },
  sideLeft:  { cam: [3.0, 0.1, 11.6], look: [4.3, 0.1, 0], rot: [0.04, 0.86], key: 0.75, rim: 1.2 },
  far:       { cam: [0, 0.6, 21], look: [0, -2.9, 0], rot: [0.16, 0.0], key: 0.9, rim: 0.8, full: true },
};

function shapesFrom(mark) {
  const [x0, y0, w, h] = mark.box;
  const s = WIDTH / w, cx = x0 + w / 2, cy = y0 + h / 2;
  const X = (v) => (v - cx) * s, Y = (v) => -(v - cy) * s;
  const shapes = [];
  let shape = null;
  for (const m of mark.d.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const n = (m[2].match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    if (m[1] === 'M') { shape = new THREE.Shape(); shape.moveTo(X(n[0]), Y(n[1])); shapes.push(shape); }
    else if (m[1] === 'L') for (let i = 0; i + 1 < n.length; i += 2) shape.lineTo(X(n[i]), Y(n[i + 1]));
    else if (m[1] === 'C') for (let i = 0; i + 5 < n.length; i += 6) shape.bezierCurveTo(X(n[i]), Y(n[i + 1]), X(n[i + 2]), Y(n[i + 3]), X(n[i + 4]), Y(n[i + 5]));
    else if (m[1] === 'Z' && shape) shape.closePath();
  }
  return shapes;
}

function stripes() {
  const c = document.createElement('canvas');
  c.width = 4; c.height = 64;
  const g = c.getContext('2d');
  for (let y = 0; y < 64; y++) { const v = y % 8 < 4 ? 255 : 150 + (y % 16 < 8 ? 0 : 30); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(0, y, 4, 1); }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, 6);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// What the polished faces mirror: a dark room with two soft lamps and a little of their indigo behind.
function room(renderer) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#020203'; g.fillRect(0, 0, 512, 256);
  const lamp = (x, y, rx, ry, col) => {
    g.save(); g.translate(x, y); g.scale(rx, ry);
    const r = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    r.addColorStop(0, col); r.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = r; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore();
  };
  // behind the camera (the faces mirror this half): two wide soft lamps and a hot strip
  lamp(430, 132, 120, 54, 'rgba(255,255,255,.95)');
  lamp(318, 104, 86, 40, 'rgba(235,238,255,.8)');
  lamp(380, 60, 130, 8, 'rgba(255,255,255,.8)');
  // to the sides and behind the mark (the cut sides mirror these)
  lamp(150, 78, 110, 40, 'rgba(255,255,255,.9)');
  lamp(60, 150, 80, 60, 'rgba(90,69,238,.9)');
  lamp(236, 190, 70, 46, 'rgba(90,69,238,.6)');
  lamp(256, 128, 256, 7, 'rgba(150,154,170,.45)');
  const t = new THREE.CanvasTexture(c);
  t.mapping = THREE.EquirectangularReflectionMapping;
  t.colorSpace = THREE.SRGBColorSpace;
  const pm = new THREE.PMREMGenerator(renderer);
  const out = pm.fromEquirectangular(t).texture;
  t.dispose(); pm.dispose();
  return out;
}

export function createMark(canvas, mark, { phone = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

  const geo = new THREE.ExtrudeGeometry(shapesFrom(mark), { depth: DEPTH, steps: 1, curveSegments: 14, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 2 });
  geo.translate(0, 0, -DEPTH / 2);
  scene.environment = room(renderer);
  // dark mirrors: bright metal in a dark room, so the faces stay black until a lamp crosses them
  const faceMat = new THREE.MeshStandardMaterial({ color: 0x6c6e79, metalness: 1, roughness: 0.3, envMapIntensity: 1.2 });
  const sideMat = new THREE.MeshStandardMaterial({ color: 0xc6c8d4, metalness: 1, roughness: 0.5, envMapIntensity: 1.25, map: stripes() });
  const mesh = new THREE.Mesh(geo, [faceMat, sideMat]);
  const group = new THREE.Group();
  group.add(mesh);
  scene.add(group);

  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  const rim = new THREE.DirectionalLight(0x5a45ee, 2.4);     // their indigo, from behind
  const fill = new THREE.DirectionalLight(0xc8d4ff, 0.3);
  rim.position.set(-5, 2.5, -7);
  fill.position.set(0.5, -5, 4);
  scene.add(key, rim, fill, new THREE.AmbientLight(0xffffff, 0.035));

  const cur = { cam: new THREE.Vector3(), look: new THREE.Vector3(), rx: 0, ry: 0, key: 1, rim: 1, env: 1 };
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  let stops = [POSES.gate], f = 0, px = 0, py = 0, flash = 0, aspect = 1, fixedT = null;

  function resize() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
  }
  const ease = (t) => t * t * (3 - 2 * t);
  function place(t) {
    const i = Math.min(stops.length - 1, Math.max(0, Math.floor(f)));
    const j = Math.min(stops.length - 1, i + 1);
    const k = ease(Math.min(1, Math.max(0, f - i)));
    const p = stops[i], q = stops[j];
    // a narrow screen sees less to the sides: step back where the whole mark has to fit, and look more at its middle
    const back = (s) => (aspect >= 1.3 ? 1 : s.full ? Math.pow(1.3 / aspect, 0.92) : Math.pow(1.3 / aspect, 0.35));
    const side = aspect >= 1.3 ? 1 : 0.35;
    a.set(p.look[0] * (p.full ? 1 : side), p.look[1], p.look[2]); b.set(q.look[0] * (q.full ? 1 : side), q.look[1], q.look[2]);
    cur.look.copy(a).lerp(b, k);
    const pa = new THREE.Vector3(...p.cam).sub(new THREE.Vector3(...p.look)).multiplyScalar(back(p)).add(a);
    const pb = new THREE.Vector3(...q.cam).sub(new THREE.Vector3(...q.look)).multiplyScalar(back(q)).add(b);
    cur.cam.copy(pa).lerp(pb, k);
    cur.rx = p.rot[0] + (q.rot[0] - p.rot[0]) * k;
    cur.ry = p.rot[1] + (q.rot[1] - p.rot[1]) * k;
    cur.key = p.key + (q.key - p.key) * k;
    cur.rim = p.rim + (q.rim - p.rim) * k;
    cur.env = (p.env || 1) + ((q.env || 1) - (p.env || 1)) * k;
    faceMat.envMapIntensity = 1.2 * cur.env;
    camera.position.copy(cur.cam);
    camera.lookAt(cur.look);
    group.rotation.set(cur.rx + Math.sin(t * 0.31) * 0.03 - py * 0.1, cur.ry + Math.sin(t * 0.42) * 0.16 + px * 0.22, Math.sin(t * 0.23) * 0.012);
    // the key light walks around the front of the mark, so the faces catch it and lose it again
    const o = t * 0.5;
    key.position.set(Math.cos(o) * 7, 3.2 + Math.sin(o * 0.7) * 2.6, 5.5 + Math.sin(o) * 3.5);
    key.intensity = 3.2 * cur.key * (1 + flash * 5);
    rim.intensity = 2.4 * cur.rim;
    fill.intensity = 0.3 + flash * 2;
    flash *= 0.9;
  }
  let raf = 0;
  function frame(now) {
    place(fixedT == null ? now / 1000 : fixedT);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  resize();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => { cancelAnimationFrame(raf); if (!document.hidden) raf = requestAnimationFrame(frame); });
  raf = requestAnimationFrame(frame);

  return {
    setStops(list) { stops = list; },
    setProgress(v) { f = v; },
    setPointer(x, y) { px = x; py = y; },
    flash() { flash = 1; },
    freeze(t) { fixedT = t; },
    still() { place(fixedT == null ? performance.now() / 1000 : fixedT); renderer.render(scene, camera); return canvas.toDataURL('image/png'); },
    resize,
  };
}
