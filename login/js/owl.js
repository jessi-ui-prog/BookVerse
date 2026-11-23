/* Owl Login by @codinvisual · t.me/CodinVisual · free for your own site, don't resell this file */
// Motor del búho: resortes, dibujo en canvas, parpadeo y seguimiento de mirada
const room = document.querySelector('.owl-login');
const canvas = room.querySelector('.owl');
const ctx = canvas.getContext('2d');
const form = room.querySelector('.owl-form');
const mail = document.getElementById('ol-mail');
const pass = document.getElementById('ol-pass');
const show = room.querySelector('.show');
const btn = room.querySelector('.go');
const note = room.querySelector('.note');
const still = matchMedia('(prefers-reduced-motion: reduce)');
const measure = document.createElement('canvas').getContext('2d');

// the owl sits in a bigger canvas so the wings can spread and it can jump
const CW = 44, CH = 38, OX = 7, OY = 4;
const SHOULDER = { x: 6.8, y: 15.5 }, GRIP = { x: 5, y: 0.5 };
const EYES = [{ x: 9.6, y: 10.6 }, { x: 20.4, y: 10.6 }];
const img = ctx.createImageData(CW, CH);
// Variante clara: lechuza blanca y dorada, sin perder el movimiento original.
const BARN_INK = {1:[142,103,45],2:[205,165,94],3:[235,211,164],4:[250,241,218],5:[255,252,244]};
const BARN_IRIS=[212,157,48], BARN_IRIS_LOW=[160,108,30];
const BARN_OWL = OWL.map((row,y) => {
  // Frente en forma de corazón: la frente dorada se afina en el centro.
  if (y >= 6 && y <= 15) {
    return row.split('').map((v,x)=> ((x>=7 && x<=13)||(x>=17 && x<=23)) && v!=='1' && v!=='.' ? '5' : v).join('');
  }
  return row;
});
const barnTheme=()=>document.documentElement.getAttribute('data-theme')==='light';
const feather=(k)=>barnTheme()?BARN_INK[k]:INK[k];

// every moving part is a spring: x is where it is, to is where it wants to be
const part = (x, k = STIFF, d = DAMP) => ({ x, v: 0, to: x, k, d });
const owl = {
  left: part(0), right: part(0),
  lookX: part(0, 0.3, 0.6), lookY: part(0.6, 0.3, 0.6),
  hop: part(0, 0.16, 0.7), shake: part(0, 0.35, 0.8),
  frown: 0, happy: false,
};
const springs = [owl.left, owl.right, owl.lookX, owl.lookY, owl.hop, owl.shake];

function spring(s) {
  if (still.matches) { s.x = s.to; s.v = 0; return; }
  s.v += (s.to - s.x) * s.k;
  s.v *= s.d;
  s.x += s.v;
}

function wings(left, right) {
  owl.left.to = left;
  owl.right.to = right;
}

function lookAt(x, y) {
  const r = canvas.getBoundingClientRect();
  const ex = r.left + r.width / 2, ey = r.top + r.height * 0.4;
  owl.lookX.to = Math.max(-1, Math.min(1, (x - ex) / 150));
  owl.lookY.to = Math.max(-1, Math.min(1, (y - ey) / 150));
}

// measure the typed text in the field's own font to find where the caret is
function lookAtCaret() {
  const r = mail.getBoundingClientRect(), st = getComputedStyle(mail);
  measure.font = `${st.fontWeight} ${st.fontSize} ${st.fontFamily}`;
  const w = measure.measureText(mail.value).width - mail.scrollLeft;
  lookAt(Math.min(r.right - 14, r.left + parseFloat(st.paddingLeft) + w), r.top + r.height / 2);
}

function dot(x, y, c) {
  x = Math.floor(x) + OX;
  y = Math.floor(y) + OY;
  if (x < 0 || y < 0 || x >= CW || y >= CH) return;
  const i = (y * CW + x) * 4;
  img.data.set(c, i);
  img.data[i + 3] = 255;
}

let blink = 0, blinkAt = -1000, nextBlink = 1800;

function eye(e, up, turn) {
  const cx = e.x + turn, cy = e.y + up;
  const px = Math.floor(cx - 1 + owl.lookX.x * 1.5), py = Math.floor(cy - 1 + owl.lookY.x * 1.5);
  const lid = cy - 3.3 + Math.max(owl.frown, blink) * 6.6;
  for (let y = Math.floor(cy) - 4; y <= Math.floor(cy) + 4; y++) {
    for (let x = Math.floor(cx) - 4; x <= Math.floor(cx) + 4; x++) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > 3.3) continue;
      let c = y + 0.5 < cy + 1.6 ? (barnTheme()?BARN_IRIS:IRIS) : (barnTheme()?BARN_IRIS_LOW:IRIS_LOW);
      if (x >= px && x < px + 2 && y >= py && y < py + 2) c = x === px && y === py ? GLINT : PUPIL;
      if (y + 0.5 < lid) c = feather(3);
      else if (y + 0.5 < lid + 1 && lid > cy - 3.2) c = feather(1);
      if (owl.happy) c = feather(5);
      dot(x, y, c);
    }
  }
  // a happy owl squints into two little arches
  if (owl.happy) [1, 0, -1, -1, 0, 1].forEach((dy, i) => dot(Math.floor(cx - 2.6) + i, Math.floor(cy) + dy, feather(1)));
}

// the wing is turned around its shoulder pixel by pixel, the old game way, so its edges stay jagged
function wing(deg, side, up) {
  const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const sx = side > 0 ? SHOULDER.x : 30 - SHOULDER.x;
  for (let y = -OY; y < CH - OY; y++) {
    for (let x = -OX; x < CW - OX; x++) {
      const dx = (x + 0.5 - sx) * side, dy = y + 0.5 - SHOULDER.y - up;
      const u = Math.floor(dx * c + dy * s + GRIP.x);
      const v = Math.floor(-dx * s + dy * c + GRIP.y);
      const k = WING[v]?.[u];
      if (k && k !== '.') dot(x, y, feather(k));
    }
  }
}

function draw() {
  img.data.fill(0);
  const up = -Math.round(owl.hop.x), turn = Math.round(owl.shake.x);
  (barnTheme()?BARN_OWL:OWL).forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== '.') dot(x + (y < 15 ? turn : 0), y + up, feather(row[x]));
  });
  EYES.forEach(e => eye(e, up, turn));
  wing(owl.left.x, 1, up);
  wing(owl.right.x, -1, up);
  ctx.putImageData(img, 0, 0);
}

let last, acc = 0;
function tick(now) {
  if (last === undefined) last = now;
  acc += Math.min(100, now - last);
  last = now;
  for (; acc >= 1000 / 60; acc -= 1000 / 60) springs.forEach(spring);
  if (now > nextBlink) {
    blinkAt = now;
    nextBlink = now + 2400 + Math.random() * 3600;
  }
  const b = (now - blinkAt) / 80;
  blink = b < 1 ? b : b < 2 ? 2 - b : 0;
  draw();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
