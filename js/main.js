// Todo el código va dentro de una función para no mezclarse con otras cosas de la página.
(() => {
// 'use strict' hace que JavaScript avise de errores comunes.
'use strict';
/* =====================================================================
   ⚙️  CONFIGURACIÓN — LO ÚNICO QUE NECESITAS EDITAR
   ===================================================================== */

// 🎵 MÚSICA DE FONDO
// 1) Copia tu canción dentro de la carpeta:  assets/audio/
// 2) Renómbrala  musica.mp3  (o escribe aquí su nombre exacto).
//    Ejemplo:  const MUSIC_SRC = 'assets/audio/mi-cancion.mp3';
// Se reproduce en bucle y empieza cuando ella pulsa "ABRIR MI SORPRESA"
// (los celulares bloquean el audio automático, por eso empieza con el botón).
// Si el archivo NO existe, suena automáticamente una melodía romántica
// generada por el navegador, así nunca queda en silencio.
const MUSIC_SRC = 'assets/audio/musica.mp3';

// 💬 WHATSAPP (botón final "Avisarle por WhatsApp")
// Tu número con código de país y SIN "+" ni espacios. Bolivia = 591.
// Tu número ya está puesto: 59173062506 (591 Bolivia + 73062506).
// Al pulsar el botón, a Aracely se le abre un chat de WhatsApp contigo
// con el mensaje de WA_TEXT ya escrito; solo debe tocar "Enviar".
const WA_PHONE = '59173062506';   // 591 = Bolivia + tu número 73062506

// Mensaje que se enviará por WhatsApp cuando ella acepte
const WA_TEXT = '¡Sí acepto! ❤️ Sí quiero tener una cita contigo 🥰';

// 🔊 Volumen inicial de la música (0 = silencio, 1 = máximo).
// También cambia el valor value="0.5" del control en index.html.
// (el fundido de entrada dura 2.5 s: búscalo en Audio_.start)

/* ---------- ATAJOS ÚTILES ----------
   $('x')   -> busca el elemento HTML con id="x"
   sleep(ms)-> espera esa cantidad de milisegundos (se usa con await)
   rnd(a,b) -> número al azar entre a y b
   mobile   -> true si la pantalla es de celular (se usan menos efectos para ir fluido) */
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = innerWidth < 700;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------- ESCENAS ---------- */
// Muestra una escena (pantalla) y oculta las demás. Los ids están en index.html: s-env, s-meet, s-msg, s-ask, s-yes
function go(id) {
  document.querySelectorAll('.scene').forEach(s => s.classList.toggle('active', s.id === id));
}

/* ---------- AUDIO ----------
   Música (archivo o melodía generada), efectos de sonido y fundidos.
   Los efectos (click, abrir, celebrar) se generan solos: no necesitan archivos. */
const Audio_ = (() => {
  let ctx, master, music, synthTimer, usingSynth = false, vol = 0.5, muted = false, fadeT;
  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  };
  const target = () => (muted ? 0 : vol);
  function fadeTo(v, ms = 1500) {
    clearInterval(fadeT);
    const from = music ? music.volume : (master ? master.gain.value : 0);
    const t0 = performance.now();
    fadeT = setInterval(() => {
      const k = Math.min(1, (performance.now() - t0) / ms), val = from + (v - from) * k;
      if (music && !usingSynth) music.volume = Math.max(0, Math.min(1, val));
      if (master) master.gain.value = val * 0.6;
      if (k >= 1) clearInterval(fadeT);
    }, 30);
  }
  function startSynth() {
    if (usingSynth || !ensure()) return;
    usingSynth = true;
    const chords = [[220, 261.6, 329.6], [174.6, 220, 261.6], [261.6, 329.6, 392], [196, 246.9, 293.7]];
    let i = 0, step = 0;
    const note = (f, t, d, g) => {
      const o = ctx.createOscillator(), e = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + 0.04); e.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(e); e.connect(master); o.start(t); o.stop(t + d + 0.05);
    };
    const tick = () => {
      const c = chords[i % 4], t = ctx.currentTime + 0.05;
      note(c[step % 3] * 2, t, 1.6, 0.22);
      if (step % 6 === 0) note(c[0] / 2, t, 3, 0.3);
      step++; if (step % 6 === 0) i++;
    };
    synthTimer = setInterval(tick, 480); tick();
  }
  let started = false;   // evita crear una segunda música al pulsar "Ver de nuevo"
  function start() {
    if (!ensure()) return;
    if (started) {                                   // ya existe: NO crear otra, la REINICIAMOS desde el principio
      if (music) { music.currentTime = 0; music.volume = 0; music.play().catch(() => {}); }   // vuelve al segundo 0 de musica.mp3
      fadeTo(target(), 2500); return;               // y sube el volumen suavemente
    }
    started = true;
    music = new Audio(MUSIC_SRC); music.loop = true; music.volume = 0; music.preload = 'auto';
    music.addEventListener('error', () => { music = null; startSynth(); fadeTo(target()); }, { once: true });
    music.play().then(() => fadeTo(target(), 2500)).catch(() => { music = null; startSynth(); fadeTo(target(), 2500); });
  }
  function tone(freqs, dur = .5, type = 'sine', g = .25, gap = .09) {
    if (!ensure()) return;
    const out = ctx.createGain(); out.gain.value = muted ? 0 : Math.max(.15, vol); out.connect(ctx.destination);
    freqs.forEach((f, k) => {
      const t = ctx.currentTime + k * gap, o = ctx.createOscillator(), e = ctx.createGain();
      o.type = type; o.frequency.value = f;
      e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(g, t + .02); e.gain.exponentialRampToValueAtTime(.001, t + dur);
      o.connect(e); e.connect(out); o.start(t); o.stop(t + dur + .05);
    });
  }
  return {
    start,
    click: () => tone([660, 880], .18, 'triangle', .2, .06),
    open: () => tone([523, 659, 784, 1047, 1319], .9, 'sine', .22, .12),
    win: () => tone([523, 659, 784, 1047, 784, 1047, 1319, 1568], .7, 'triangle', .25, .1),
    toggle() { muted = !muted; fadeTo(target(), 800); return muted; },
    setVol(v) { vol = v; if (!muted) fadeTo(vol, 200); }
  };
})();

/* ---------- FONDO 3D (Three.js) ---------- */
/* ---------- FONDO 3D (Three.js) ----------
   Dibuja detrás de todo: estrellas, corazones 3D que suben y pétalos que caen.
   Se mueve un poco al mover el mouse o inclinar el celular.
   Si quieres menos o más corazones, cambia los números en 'for (let i = 0; i < ...'. */
let petalsOn = true;
function initThree() {
  if (typeof THREE === 'undefined') return;
  const canvas = $('bg');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(60, 1, 0.1, 100); cam.position.z = 9;
  const resize = () => { renderer.setSize(innerWidth, innerHeight); cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix(); };
  resize(); addEventListener('resize', resize);

  scene.add(new THREE.AmbientLight(0xffc9dc, 0.7));
  const l1 = new THREE.PointLight(0xff4d8d, 40, 40); l1.position.set(5, 4, 6); scene.add(l1);
  const l2 = new THREE.PointLight(0xb57bff, 35, 40); l2.position.set(-6, -3, 5); scene.add(l2);

  // estrellas
  const N = mobile ? 350 : 800, pos = new Float32Array(N * 3);
  for (let i = 0; i < N * 3; i += 3) { pos[i] = rnd(-30, 30); pos[i + 1] = rnd(-20, 20); pos[i + 2] = rnd(-30, 0); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffe6c8, size: 0.09, transparent: true, opacity: 0.9 }));
  scene.add(stars);

  // corazones 3D
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0, .6, -.9, .9, -.9, .2); s.bezierCurveTo(-.9, -.4, -.2, -.7, 0, -1.1);
  s.bezierCurveTo(.2, -.7, .9, -.4, .9, .2); s.bezierCurveTo(.9, .9, 0, .6, 0, 0);
  const hg = new THREE.ExtrudeGeometry(s, { depth: .35, bevelEnabled: true, bevelThickness: .15, bevelSize: .12, bevelSegments: 4 });
  hg.center();
  const colors = [0xd6246e, 0xff7aa8, 0xffc9dc, 0xb57bff, 0xffd89a];
  const hearts = [];
  for (let i = 0; i < (mobile ? 12 : 22); i++) {
    const m = new THREE.Mesh(hg, new THREE.MeshStandardMaterial({ color: colors[i % 5], roughness: .25, metalness: .3, emissive: colors[i % 5], emissiveIntensity: .25 }));
    const sc = rnd(.25, .7); m.scale.setScalar(sc);
    m.position.set(rnd(-9, 9), rnd(-7, 7), rnd(-8, 2));
    m.userData = { v: rnd(.004, .012), r: rnd(.004, .015), ph: rnd(0, 6.28) };
    scene.add(m); hearts.push(m);
  }
  // pétalos
  const pg = new THREE.CircleGeometry(.14, 8); pg.scale(1, 1.6, 1);
  const petals = [];
  for (let i = 0; i < (mobile ? 30 : 60); i++) {
    const m = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: i % 3 ? 0xff7aa8 : 0xd6246e, side: THREE.DoubleSide, transparent: true, opacity: .85 }));
    m.position.set(rnd(-9, 9), rnd(-8, 9), rnd(-5, 4));
    m.userData = { v: rnd(.012, .03), sw: rnd(.005, .02), ph: rnd(0, 6.28) };
    scene.add(m); petals.push(m);
  }
  let mx = 0, my = 0;
  addEventListener('pointermove', e => { mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5); });
  addEventListener('deviceorientation', e => { if (e.gamma != null) { mx = e.gamma / 90; my = (e.beta - 45) / 90; } });
  let burst = 0; window.__burst3d = () => { burst = 1; };
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const t = clock.getElapsedTime();
    hearts.forEach(h => {
      h.rotation.y += h.userData.r * 2; h.rotation.z = Math.sin(t + h.userData.ph) * .3;
      h.position.y += Math.sin(t * .8 + h.userData.ph) * .004 + h.userData.v * (1 + burst * 6);
      if (h.position.y > 8) h.position.y = -8;
    });
    petals.forEach(p => {
      p.position.y -= p.userData.v; p.position.x += Math.sin(t + p.userData.ph) * p.userData.sw;
      p.rotation.x += .03; p.rotation.y += .02;
      p.visible = petalsOn; if (p.position.y < -9) p.position.y = 9;
    });
    stars.rotation.y = t * .01;
    l1.position.x = 5 * Math.cos(t * .5); l2.position.y = -3 * Math.sin(t * .4);
    cam.position.x += (mx * 1.5 - cam.position.x) * .04; cam.position.y += (-my * 1.2 - cam.position.y) * .04;
    cam.lookAt(0, 0, 0); burst *= .96;
    renderer.render(scene, cam);
  })();
}

/* ---------- CORAZONES DOM ---------- */
/* ---------- CORAZONES Y EMOJIS FLOTANTES ----------
   floatEmoji: un emoji que sube y se desvanece.
   heartsAround: corazones alrededor de un elemento (los personajes).
   heartRain: lluvia de corazones que cae por toda la pantalla. */
const fx = $('fx');
function floatEmoji(x, y, em, size = 24, rise = 140) {
  if (reduce) return;
  const e = document.createElement('span'); e.className = 'fx-item'; e.textContent = em;
  e.style.cssText = `left:${x}px;top:${y}px;font-size:${size}px`;
  fx.appendChild(e);
  const a = e.animate([
    { transform: 'translate(-50%,0) scale(.3)', opacity: 0 },
    { transform: `translate(calc(-50% + ${rnd(-30, 30)}px),-${rise * .4}px) scale(1)`, opacity: 1, offset: .25 },
    { transform: `translate(calc(-50% + ${rnd(-60, 60)}px),-${rise}px) scale(.8)`, opacity: 0 }
  ], { duration: rnd(1800, 3200), easing: 'ease-out' });
  a.onfinish = () => e.remove();
}
const HE = ['❤️', '💖', '💕', '💗', '✨', '🌸'];
function heartsAround(el, n = 1) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < n; i++) floatEmoji(r.left + rnd(0, r.width), r.top + rnd(0, r.height * .6), HE[(Math.random() * 6) | 0], rnd(16, 30));
}
function heartRain(n = 70) {
  for (let i = 0; i < n; i++) setTimeout(() => {
    const e = document.createElement('span'); e.className = 'fx-item'; e.textContent = HE[(Math.random() * 6) | 0];
    e.style.cssText = `left:${rnd(0, 100)}vw;top:-40px;font-size:${rnd(18, 40)}px`; fx.appendChild(e);
    const a = e.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(${innerHeight + 80}px) rotate(${rnd(-360, 360)}deg)` }], { duration: rnd(2500, 5000), easing: 'linear' });
    a.onfinish = () => e.remove();
  }, i * 60);
}

/* ---------- PARTÍCULAS 2D: confeti y fuegos artificiales ---------- */
/* ---------- CONFETI Y FUEGOS ARTIFICIALES ----------
   Se dibujan en un <canvas> encima de todo.
   burstAt(x,y,n,tipo): explosión de n partículas ('spark' chispas, 'heart' corazones, 'conf' confeti).
   fireworks(): varias explosiones seguidas.  confetti(): lluvia de confeti. */
const fw = $('fw'), fc = fw.getContext('2d'); let parts = [], fwRun = false;
const fit = () => { fw.width = innerWidth * Math.min(devicePixelRatio, 2); fw.height = innerHeight * Math.min(devicePixelRatio, 2); fc.setTransform(fw.width / innerWidth, 0, 0, fw.height / innerHeight, 0, 0); };
fit(); addEventListener('resize', fit);
function burstAt(x, y, n = 60, kind = 'spark') {
  const pal = ['#ff4d8d', '#ffd89a', '#fff', '#b57bff', '#ff9ec0', '#d6246e'];
  for (let i = 0; i < n; i++) {
    const a = rnd(0, 6.283), sp = rnd(1.5, kind === 'heart' ? 7 : 6);
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'conf' ? 4 : 0), life: 1, d: rnd(.008, .018), c: pal[(Math.random() * 6) | 0], kind, s: rnd(2, kind === 'conf' ? 7 : 4), rot: rnd(0, 6) });
  }
  if (!fwRun) { fwRun = true; requestAnimationFrame(drawParts); }
}
function drawParts() {
  fc.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) {
    p.x += p.vx; p.y += p.vy; p.vy += p.kind === 'conf' ? .1 : .05; p.vx *= .985; p.life -= p.d; p.rot += .15;
    fc.globalAlpha = Math.max(0, p.life); fc.fillStyle = p.c;
    if (p.kind === 'conf') { fc.save(); fc.translate(p.x, p.y); fc.rotate(p.rot); fc.fillRect(-p.s, -p.s / 2, p.s * 2, p.s); fc.restore(); }
    else if (p.kind === 'heart') { fc.font = p.s * 4 + 'px serif'; fc.fillText('❤', p.x, p.y); }
    else { fc.shadowBlur = 8; fc.shadowColor = p.c; fc.beginPath(); fc.arc(p.x, p.y, p.s / 2, 0, 6.283); fc.fill(); fc.shadowBlur = 0; }
  }
  fc.globalAlpha = 1;
  if (parts.length) requestAnimationFrame(drawParts); else { fwRun = false; fc.clearRect(0, 0, innerWidth, innerHeight); }
}
function fireworks(times = 14) {
  for (let i = 0; i < times; i++) setTimeout(() => {
    burstAt(rnd(innerWidth * .15, innerWidth * .85), rnd(innerHeight * .12, innerHeight * .5), mobile ? 45 : 80, i % 3 === 0 ? 'heart' : 'spark');
    Audio_.click();
  }, i * 380);
}
function confetti() { for (let i = 0; i < 6; i++) setTimeout(() => { burstAt(rnd(0, innerWidth), -10, 40, 'conf'); burstAt(rnd(0, innerWidth), innerHeight * .3, 25, 'conf'); }, i * 250); }

/* =====================================================================
   🎮 PERSONAJES ANIMADOS (sprites)
   Cada acción es una lista de imágenes que se cambian rápido (como un juego).
   Las imágenes están en assets/sprites/  ->  <personaje>_<frame>.png
   Para cambiar velocidad de una acción, modifica su "fps" (cuadros por segundo).
   Para usar otros dibujos, reemplaza los PNG manteniendo el mismo nombre.
   ===================================================================== */
const SPR = 'assets/sprites/';
const ANIMS = {
  bear: {                                              // 🧸 osito
    idle:   { f: ['front'], fps: 1 },
    walk:   { f: ['walk1', 'walk2', 'walk3', 'walk4'], fps: 7 },
    run:    { f: ['run1', 'run2', 'run3', 'run4'], fps: 11 },
    jump:   { f: ['jump1', 'jump2', 'jump3', 'jump4'], fps: 7 },
    hug:    { f: ['hug'], fps: 1 },
    crouch: { f: ['crouch'], fps: 1 },
    win:    { f: ['win1', 'win2'], fps: 3 },
    hold:   { f: ['win1'], fps: 1 },                  // 🕺 brazos arriba (baile)
    lift:   { f: ['win1'], fps: 1 },                  // 🕺 la levanta
    twirl:  { f: ['hug'], fps: 1 }
  },
  panda: {                                             // 🐼 panda Copi
    idle:   { f: ['front'], fps: 1 },
    walk:   { f: ['front', 'walk'], fps: 5 },
    run:    { f: ['walk', 'run'], fps: 9 },
    jump:   { f: ['jump'], fps: 1 },
    hug:    { f: ['hug'], fps: 1 },
    crouch: { f: ['crouch'], fps: 1 },
    win:    { f: ['hug', 'front'], fps: 3 },
    hold:   { f: ['hug'], fps: 1 },                   // 💃 brazos abiertos (baile)
    lift:   { f: ['hug'], fps: 1 },                   // 💃 en el aire
    twirl:  { f: ['hug'], fps: 1 }                    // 💃 gira sobre sí misma
  }
};
// Precarga de todos los frames (evita parpadeos al animar)
Object.entries(ANIMS).forEach(([who, anims]) => Object.values(anims).forEach(a => a.f.forEach(f => { new Image().src = SPR + who + '_' + f + '.png'; })));

class Actor {
  constructor(el) { this.el = el; this.who = el.dataset.who; this.img = el.querySelector('img'); this.body = el.querySelector('.body'); this.name = 'idle'; this.set('idle'); }
  // Cambia la acción: 'idle' | 'walk' | 'run' | 'jump' | 'hug' | 'crouch' | 'win'
  set(name) {
    clearInterval(this.t); this.name = name;
    const a = ANIMS[this.who][name]; let i = 0;
    const show = () => { this.img.src = SPR + this.who + '_' + a.f[i++ % a.f.length] + '.png'; };
    show(); if (a.f.length > 1) this.t = setInterval(show, 1000 / a.fps);
    this.body.className = 'body a-' + name;   // animación de movimiento (CSS)
  }
  // Salto corto y vuelve a lo que hacía
  hop(ms = 900) { const prev = this.name; this.set('jump'); setTimeout(() => this.set(prev), ms); }
}
const A = {};  // A.bear1 y A.panda1 = los personajes que caminan y se abrazan al inicio
document.querySelectorAll('.actor').forEach(el => {
  A[el.id] = new Actor(el);
  if (el.id.startsWith('panda')) el.classList.add('face-left');          // el panda mira hacia el osito
  // Juego: al tocar un personaje salta y suelta corazones
  el.addEventListener('click', () => { if (el.closest('.scene.active')) { A[el.id].hop(); heartsAround(el, 6); Audio_.click(); } });
});

/* =====================================================================
   💃🕺 BAILE ROMÁNTICO (pantalla "¿ME CONCEDES UNA CITA?")
   Usa la hoja de poses de la pareja: assets/sprites/pareja_<pose>.png
   Cada pose dura los milisegundos indicados y se repite en bucle.
   Para cambiar el orden o el tiempo de cada pose, edita la lista DANCE.
   (el segundo valor es la duración en milisegundos; 1000 = 1 segundo)
   ===================================================================== */
const DANCE = [
  ['inicio', 1400],   // comienzo suave
  ['giro-izq', 1000], // giro lento guiado a la izquierda
  ['balanceo', 1100], // dulce balanceo
  ['mano-izq', 1100], // toman la mano izquierda
  ['giro-der', 1000], // giro lento guiado a la derecha
  ['dip', 1500],      // dip tierno
  ['mano-der', 1100], // toman la mano derecha
  ['abrazo', 1800],   // abrazo tierno
  ['baile', 1300],    // nuestro baile
  ['fin', 1300],      // fin del baile
  ['amor', 1800],     // amor eterno
  ['descanso', 2400]  // dulce descanso juntos
];
const HEART_POSES = ['abrazo', 'amor', 'descanso', 'fin'];   // en estas poses salen corazones
DANCE.forEach(([n]) => { new Image().src = `assets/sprites/pareja_${n}.png`; });   // precarga
let danceTok = 0;                                   // cambia para cancelar el baile anterior
function startDance() {
  const tok = ++danceTok, couple = $('couple'), imgs = couple.querySelectorAll('img');
  let front = 0, i = 0;
  (async () => {
    while (tok === danceTok) {
      const [name, ms] = DANCE[i++ % DANCE.length];
      const nxt = imgs[1 - front];
      nxt.src = `assets/sprites/pareja_${name}.png`;
      try { await nxt.decode(); } catch (e) { /* si falla, igual se muestra */ }
      if (tok !== danceTok) return;
      nxt.classList.add('on'); imgs[front].classList.remove('on'); front = 1 - front;   // cambio suave de pose
      couple.dataset.pose = name;                    // activa el movimiento extra del CSS
      if (HEART_POSES.includes(name)) heartsAround($('dance'), 4);
      await sleep(ms);
    }
  })();
}
function stopDance() { danceTok++; }
$('couple').addEventListener('click', () => { heartsAround($('dance'), 6); Audio_.click(); });

/* =====================================================================
   🍒 OSITO EN EL PLATO (última escena): cada ~2 s guiña un ojo
   cambiando de assets/images/plato-1.jpg a plato-2.jpg
   ===================================================================== */
let winkT;
function startWink() {
  clearInterval(winkT); const p = $('plate'); p.classList.remove('wink');
  winkT = setInterval(() => { p.classList.add('wink'); heartsAround(p, 2); setTimeout(() => p.classList.remove('wink'), 800); }, 2200);
}
function stopWink() { clearInterval(winkT); $('plate').classList.remove('wink'); }

/* =====================================================================
   🎬 FLUJO DE LA EXPERIENCIA (los tiempos están en milisegundos)
   ===================================================================== */
let around;
async function typeText(el, text, speed = 38) {   // speed: ms por letra (más alto = más lento)
  el.textContent = '';
  for (const ch of text) {
    el.textContent += ch;
    if (ch === '❤' || ch === '.') { const r = el.getBoundingClientRect(); floatEmoji(r.left + rnd(20, r.width - 20), r.top + rnd(0, r.height), '💗', 18, 90); }
    await sleep(/[.?…]/.test(ch) ? speed * 8 : ch === '\n' ? speed * 4 : speed);
  }
}

// ✏️ MENSAJE ROMÁNTICO (puedes editar el texto libremente)
const MSG = `Aracely...Mi Pandita ❤️

Hoy quiero proponerte algo diferente.

Quiero compartir contigo un momento bonito, crear nuevos recuerdos, reírnos, conversar y disfrutar de una salida especial.

Por eso preparé esta pequeña sorpresa para hacerte una pregunta...`;

async function openSurprise() {
  $('openBtn').disabled = true;
  Audio_.start();                      // 🎵 aquí empieza la música
  Audio_.open(); $('audioUi').hidden = false;
  $('envelope').classList.add('open'); $('openBtn').style.opacity = 0;
  burstAt(innerWidth / 2, innerHeight / 2, 50, 'heart');
  await sleep(2800);

  // --- Escena: se encuentran ---
  go('s-meet'); await sleep(700);
  const stage = $('stage'), b = A.bear1, p = A.panda1;
  around = setInterval(() => { heartsAround(b.el); heartsAround(p.el); }, 700);
  b.set('walk'); p.set('walk');
  stage.classList.add('meet');         // caminan hacia el centro (3 s, ver CSS)
  await sleep(3200);
  b.set('jump'); p.set('jump');        // saltan de emoción al verse
  await sleep(1100);
  b.set('hug'); p.set('hug'); stage.classList.add('hug');   // abren los brazos y se juntan
  await sleep(1000);
  $('midHeart').classList.add('show'); Audio_.win();        // aparece el corazón
  await sleep(1800);
  const r = $('midHeart').getBoundingClientRect();
  burstAt(r.left + r.width / 2, r.top + r.height / 2, 120, 'heart'); burstAt(r.left + r.width / 2, r.top + r.height / 2, 90, 'spark');
  window.__burst3d && window.__burst3d();
  b.set('win'); p.set('win');
  await sleep(2800);
  clearInterval(around);

  // --- Escena: mensaje con efecto máquina de escribir ---
  go('s-msg'); await sleep(1000);
  await typeText($('typed'), MSG);
  $('msgNext').hidden = false;
}

// 🙈 Respuestas tiernas de "Déjame pensarlo" (puedes añadir o cambiar frases)
const SOFT = [
  'Tómate tu tiempo, no hay ninguna prisa 🙈',
  'Prometo que será una cita muy bonita... y con helado si quieres 🍦',
  'El osito te esperará con paciencia 🧸',
  'Piénsalo con calma. Aquí seguiré, sonriendo 😊',
  'Si dices que sí, el panda y el osito harán una danza de felicidad 🐼🧸',
  'Cuando estés lista, el botón rosado te espera ❤️'
];
let softI = 0, yesScale = 1;
function think() {
  Audio_.click();
  $('softMsg').textContent = SOFT[softI++ % SOFT.length];
  yesScale = Math.min(1.25, yesScale + .04); $('yesBtn').style.transform = `scale(${yesScale})`;
  const r = $('noBtn').getBoundingClientRect(); floatEmoji(r.left + r.width / 2, r.top, '🙈', 26, 100);
}

async function accept() {
  Audio_.win(); go('s-yes');
  stopDance(); startWink();                                  // termina el baile y el osito guiña
  heartRain(80); confetti(); fireworks(); window.__burst3d && window.__burst3d();
  const iv = setInterval(() => heartRain(10), 2500); setTimeout(() => clearInterval(iv), 12000);
}

function reset() {
  clearInterval(around); stopDance(); stopWink();
  $('stage').className = 'stage';
  Object.values(A).forEach(a => a.set('idle'));
  $('midHeart').classList.remove('show');
  $('softMsg').textContent = ''; $('yesBtn').style.transform = ''; softI = 0; yesScale = 1;
  $('envelope').classList.remove('open'); $('openBtn').style.opacity = 1; $('openBtn').disabled = false;
  $('typed').textContent = ''; $('msgNext').hidden = true;
  go('s-env');
}

/* ---------- BOTONES (conexión con el HTML) ---------- */
$('openBtn').addEventListener('click', openSurprise);
$('msgNext').addEventListener('click', () => { Audio_.click(); go('s-ask'); heartRain(25); startDance(); });   // empieza el baile
$('yesBtn').addEventListener('click', accept);
$('noBtn').addEventListener('click', think);
// 💬 Botón de WhatsApp: abre https://wa.me/59173062506?text=... (tu chat) con el mensaje ya escrito.
$('waBtn').addEventListener('click', () => { Audio_.click(); window.open(`https://wa.me/${WA_PHONE}?text=${encodeURIComponent(WA_TEXT)}`, '_blank', 'noopener'); });
$('replayBtn').addEventListener('click', () => { Audio_.click(); reset(); });
$('musicBtn').addEventListener('click', e => { e.currentTarget.textContent = Audio_.toggle() ? '🔇' : '🔊'; });
$('vol').addEventListener('input', e => Audio_.setVol(parseFloat(e.target.value)));
document.addEventListener('visibilitychange', () => { petalsOn = !document.hidden; });

initThree();
// corazones suaves en la portada
setInterval(() => { if ($('s-env').classList.contains('active')) floatEmoji(rnd(20, innerWidth - 20), innerHeight * .9, '💗', rnd(14, 26), 220); }, 900);
})();
