/* Lightbox sin dependencias – Jiménez & Asociados */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.gal a'));
  if (!links.length) return;
  var css = '.lbx{position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center;opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;touch-action:pan-y}' +
    '.lbx.open{opacity:1;visibility:visible}' +
    '.lbx img{max-width:94vw;max-height:86vh;width:auto;height:auto;object-fit:contain;border-radius:8px;opacity:0;transition:opacity .25s;user-select:none;-webkit-user-drag:none}' +
    '.lbx img.on{opacity:1}' +
    '.lbx button{position:absolute;background:rgba(255,255,255,.12);color:#fff;border:0;border-radius:999px;width:52px;height:52px;font-size:28px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
    '.lbx button:hover,.lbx button:focus-visible{background:rgba(255,255,255,.28);outline:2px solid #fff}' +
    '.lbx .x{top:14px;right:14px}.lbx .pv{left:12px;top:50%;transform:translateY(-50%)}.lbx .nx{right:12px;top:50%;transform:translateY(-50%)}' +
    '.lbx .ct{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:#fff;font:600 14px system-ui,sans-serif;background:rgba(0,0,0,.5);padding:6px 12px;border-radius:999px}' +
    '.lbx .cap{position:absolute;top:22px;left:20px;right:80px;color:#ddd;font:14px system-ui,sans-serif}' +
    'body.lbx-lock{overflow:hidden}.hero img{cursor:zoom-in}.gal img{cursor:zoom-in}' +
    '@media(max-width:600px){.lbx .pv,.lbx .nx{width:42px;height:42px;font-size:22px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var box = document.createElement('div');
  box.className = 'lbx'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Galería de fotos'); box.setAttribute('aria-hidden', 'true');
  box.innerHTML = '<p class="cap" id="lbx-cap"></p><img alt=""><button type="button" class="pv" aria-label="Foto anterior">&#8249;</button>' +
    '<button type="button" class="nx" aria-label="Foto siguiente">&#8250;</button><button type="button" class="x" aria-label="Cerrar galería">&times;</button>' +
    '<div class="ct" aria-live="polite"></div>';
  document.body.appendChild(box);
  var img = box.querySelector('img'), ct = box.querySelector('.ct'), cap = box.querySelector('.cap');
  var bPrev = box.querySelector('.pv'), bNext = box.querySelector('.nx'), bX = box.querySelector('.x');
  var buttons = [bPrev, bNext, bX];
  var i = 0, opened = false, lastFocus = null, cache = {};

  function src(k) { return links[k].getAttribute('href'); }
  function alt(k) { var t = links[k].querySelector('img'); return t ? t.alt : ''; }
  function preload(k) { k = (k + links.length) % links.length; if (!cache[k]) { cache[k] = new Image(); cache[k].src = src(k); } }
  function show(k) {
    i = (k + links.length) % links.length;
    img.classList.remove('on');
    var s = src(i), a = alt(i);
    var done = function () { img.src = s; img.alt = a; if (img.complete) img.classList.add('on'); else img.onload = function () { img.classList.add('on'); }; };
    setTimeout(done, opened ? 120 : 0);
    ct.textContent = (i + 1) + ' / ' + links.length; cap.textContent = a;
    preload(i + 1); preload(i - 1);
  }
  function open(k) {
    lastFocus = document.activeElement; opened = false; show(k); opened = true;
    box.classList.add('open'); box.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lbx-lock'); setTimeout(function () { bX.focus(); }, 30);
  }
  function close() {
    box.classList.remove('open'); box.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lbx-lock'); opened = false;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  links.forEach(function (a, k) { a.addEventListener('click', function (e) { e.preventDefault(); open(k); }); });
  var hero = document.querySelector('.hero img');
  if (hero) {
    hero.setAttribute('tabindex', '0'); hero.setAttribute('role', 'button'); hero.setAttribute('aria-label', 'Abrir galería de fotos');
    var hs = hero.getAttribute('src'), hk = Math.max(0, links.findIndex(function (a) { return a.getAttribute('href') === hs; }));
    hero.addEventListener('click', function () { open(hk); });
    hero.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(hk); } });
  }
  bPrev.addEventListener('click', function (e) { e.stopPropagation(); show(i - 1); });
  bNext.addEventListener('click', function (e) { e.stopPropagation(); show(i + 1); });
  bX.addEventListener('click', function (e) { e.stopPropagation(); close(); });
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (!opened) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(i + 1); }
    else if (e.key === 'Tab') {
      var f = buttons.indexOf(document.activeElement), n = e.shiftKey ? f - 1 : f + 1;
      e.preventDefault(); buttons[(n + buttons.length) % buttons.length].focus();
    }
  });
  var x0 = null, y0 = 0;
  box.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; } }, { passive: true });
  box.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) show(dx < 0 ? i + 1 : i - 1);
  }, { passive: true });
})();
