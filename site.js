/* Mobile menu toggle for the public pages (presentation only). */
(function () {
  var nav = document.getElementById('main-nav');
  var btn = document.getElementById('menu-toggle');
  if (!nav || !btn) return;
  function set(open) {
    nav.classList.toggle('nav-active', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  btn.addEventListener('click', function () { set(!nav.classList.contains('nav-active')); });
  nav.querySelectorAll('.nav-links a').forEach(function (a) {
    a.addEventListener('click', function () { set(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 899) set(false); });
})();

/* Social page, phones: position readout under the swipeable card row */
(function () {
  var grid = document.getElementById('card-grid');
  if (!grid) return;
  var box = document.createElement('div');
  box.className = 'card-count'; box.setAttribute('aria-hidden', 'true');
  grid.parentNode.insertBefore(box, grid.nextSibling);
  var pips, num, cards = [], cur = -1;
  function build() {
    cards = [].slice.call(grid.querySelectorAll('.card-persp'));
    if (!cards.length) return false;
    box.innerHTML = '<span class="pips">' + cards.map(function () { return '<i></i>'; }).join('') + '</span><span class="num"></span>';
    pips = box.querySelectorAll('.pips i'); num = box.querySelector('.num');
    return true;
  }
  function update() {
    if (!cards.length) return;
    var mid = grid.scrollLeft + grid.clientWidth / 2, best = 0, bd = 1e9;
    cards.forEach(function (c, i) { var d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
    if (best === cur) return; cur = best;
    for (var i = 0; i < pips.length; i++) pips[i].classList.toggle('on', i === best);
    num.textContent = ('0' + (best + 1)).slice(-2) + ' / ' + ('0' + cards.length).slice(-2);
  }
  function init() { if (build()) { update(); grid.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true }); } }
  if (grid.querySelector('.card-persp')) init(); else new MutationObserver(function (m, o) { if (grid.querySelector('.card-persp')) { o.disconnect(); init(); } }).observe(grid, { childList: true });
})();

/* ==========================================================================
   Motion layer (presentation only). Everything here is optional: with JS off,
   or with "reduce motion" on, the pages render complete and still.
   ========================================================================== */
(function () {
  window.__siteReady = true;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  /* ---- Scroll reveals -------------------------------------------------- */
  function tag(sel, mode, step) {
    document.querySelectorAll(sel).forEach(function (el, i) {
      if (el.hasAttribute('data-reveal')) return;
      el.setAttribute('data-reveal', mode || '');
      el.style.setProperty('--d', i * (step || 0) + 'ms');
    });
  }
  tag('.section-head', '', 0);
  tag('.reel-frame', 'mask', 0);
  tag('.reel-info', '', 120);
  tag('.statement > .label', '', 0);
  tag('.statement-text', '', 100);
  tag('.toolbar > div', '', 110);
  tag('.cta-band .label', '', 0);
  tag('.cta-link', '', 140);
  tag('footer', '', 0);

  var targets = document.querySelectorAll('[data-reveal]');
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target._mask) en.target._mask.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) {
      // A clipped-away element has no visible area, so watch its parent instead.
      if (el.getAttribute('data-reveal') === 'mask' && el.parentNode) { el.parentNode._mask = el; io.observe(el.parentNode); }
      else io.observe(el);
    });
  }

  if (reduce) return;

  /* ---- Live local time in the hero ------------------------------------- */
  var loc = document.querySelector('.hero-meta > .label:first-child');
  if (loc) {
    var clock = document.createElement('span');
    clock.className = 'clock';
    clock.setAttribute('aria-hidden', 'true');
    loc.appendChild(clock);
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch (e) { fmt = null; }
    var tick = function () { if (fmt) clock.textContent = fmt.format(new Date()) + ' MYT'; };
    tick();
    if (fmt) setInterval(tick, 1000);
  }

  /* ---- Statement: split into words that light up with scroll ------------ */
  var stmt = document.querySelector('.statement-text');
  if (stmt) {
    var walker = document.createTreeWalker(stmt, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (t) {
      var txt = t.nodeValue;
      if (!txt.trim()) return;
      var zh = !!(t.parentNode.closest && t.parentNode.closest('.lang-zh'));
      var parts = zh ? Array.from(txt) : txt.split(/(\s+)/);
      var frag = document.createDocumentFragment();
      parts.forEach(function (p) {
        if (!p) return;
        if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
        var sp = document.createElement('span');
        sp.className = 'w';
        sp.textContent = p;
        frag.appendChild(sp);
      });
      t.parentNode.replaceChild(frag, t);
    });
    stmt.classList.add('is-split');
  }

  /* ---- Scroll + pointer driven depth ----------------------------------- */
  var hero = document.querySelector('.hero');
  var heroWord = document.querySelector('.hero-word');
  var heroFig = document.querySelector('.hero-figure');
  var frame = document.querySelector('.hero-figure .frame');
  var reelImgs = Array.prototype.slice.call(document.querySelectorAll('.reel-frame img'));
  var cta = document.querySelector('.cta-band');
  var mx = 0, my = 0, ticking = false;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function update() {
    ticking = false;
    var vh = window.innerHeight;
    var sy = window.pageYOffset;

    if (heroWord) heroWord.style.translate = (mx * 26 - sy * 0.12).toFixed(1) + 'px ' + (my * 10).toFixed(1) + 'px';
    if (frame) frame.style.translate = (mx * 12).toFixed(1) + 'px ' + (my * 8).toFixed(1) + 'px';
    if (heroFig) heroFig.style.translate = (-mx * 14).toFixed(1) + 'px ' + (-my * 10 + sy * 0.04).toFixed(1) + 'px';

    reelImgs.forEach(function (img) {
      var r = img.parentNode.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      img.style.translate = '0 ' + (p * -5).toFixed(2) + '%';
    });

    if (cta) {
      var cr = cta.getBoundingClientRect();
      cta.style.setProperty('--cta-p', clamp((vh - cr.top) / (vh + cr.height), 0, 1).toFixed(3));
    }

    if (stmt && stmt.classList.contains('is-split')) {
      var sr = stmt.getBoundingClientRect();
      var p2 = clamp((vh * 0.88 - sr.top) / (vh * 0.5), 0, 1);
      stmt.querySelectorAll('.lang-en, .lang-zh').forEach(function (lang) {
        if (!lang.offsetParent) return;
        var ws = lang.querySelectorAll('.w');
        var lit = Math.round(p2 * ws.length * 1.08);
        for (var i = 0; i < ws.length; i++) {
          var on = i < lit;
          if (on !== ws[i].classList.contains('on')) ws[i].classList.toggle('on', on);
        }
      });
    }
  }
  function schedule() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lang-switcher')) setTimeout(schedule, 60);
  });
  if (hero && fine) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      schedule();
    });
    hero.addEventListener('pointerleave', function () { mx = 0; my = 0; schedule(); });
  }
  schedule();
  window.addEventListener('load', schedule);

  if (!fine) return;

  /* ---- Reticle cursor ------------------------------------------------------
     Idle: four corner brackets trailing a dot (it never moves to or resizes for a target).
     Hover on something clickable: the whole square frame turns 45° into a diamond and a small hint appears.
     Click: recoil + a shooter-style hit marker (four diagonal ticks); a click on empty space is a "miss". */
  var HINTS = {
    go:     ['GO', '前往'],
    view:   ['VIEW', '查看'],
    open:   ['OPEN', '打开'],
    ext:    ['OPEN ↗', '打开 ↗'],
    flip:   ['FLIP', '翻面'],
    back:   ['BACK', '返回'],
    filter: ['FILTER', '筛选'],
    lang:   ['LANGUAGE', '语言'],
    send:   ['SEND', '发送'],
    mail:   ['EMAIL', '写邮件'],
    close:  ['CLOSE', '关闭'],
    more:   ['MORE', '更多'],
    menu:   ['MENU', '菜单']
  };
  function lang() { try { return localStorage.getItem('selectedLang') === 'zh' ? 1 : 0; } catch (e) { return 0; } }
  function hintFor(t) {
    if (!t) return null;
    var el;
    if ((el = t.closest('.card-tilt'))) return HINTS[el.classList.contains('flipped') ? 'back' : 'flip'];
    if ((el = t.closest('.reel, .work-row'))) return HINTS.view;
    if (t.closest('.filter-btn')) return HINTS.filter;
    if (t.closest('.lang-switcher a')) return HINTS.lang;
    if (t.closest('.submit-btn')) return HINTS.send;
    if ((el = t.closest('a[href^="mailto:"]'))) return HINTS.mail;
    if (t.closest('#menu-toggle')) return HINTS.menu;
    if (t.closest('[onclick*="loadMore"]')) return HINTS.more;
    if (t.closest('[onclick*="close"], .modal-close, #modal-close')) return HINTS.close;
    if ((el = t.closest('a[target="_blank"]'))) return HINTS.ext;
    if (t.closest('#main-nav a, .cta-link, .btn-primary, .btn-outline, .text-link')) return HINTS.go;
    if (t.closest('a, button, [role="button"], label')) return HINTS.open;
    return null;
  }


  /* Contrast tone: the reticle is bright cyan on dark ground and turns near-black over light ground.
     We look at what is really painted under the pointer: an <img> pixel, a background colour or a gradient. */
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(r, g, b) { return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); }
  var imgCache = typeof WeakMap === 'function' ? new WeakMap() : null;
  function imgData(img) {
    if (!imgCache || !img.complete || !img.naturalWidth) return null;
    var c = imgCache.get(img);
    if (c && c.src === img.currentSrc) return c.d;
    var d = null;
    try {
      var k = Math.min(1, 96 / Math.max(img.naturalWidth, img.naturalHeight));
      var w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
      var cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      var cx2 = cv.getContext('2d', { willReadFrequently: true });
      cx2.drawImage(img, 0, 0, w, h);
      d = { w: w, h: h, px: cx2.getImageData(0, 0, w, h).data };   // throws on cross-origin images -> null
    } catch (e) { d = null; }
    imgCache.set(img, { src: img.currentSrc, d: d });
    return d;
  }
  function imgLum(img, x, y) {
    var d = imgData(img); if (!d) return null;
    var r = img.getBoundingClientRect(), cs = getComputedStyle(img);
    var nw = img.naturalWidth, nh = img.naturalHeight, fit = cs.objectFit;
    var u = (x - r.left), v = (y - r.top), sc, dw, dh, ox, oy;
    if (fit === 'cover' || fit === 'contain') {
      sc = fit === 'cover' ? Math.max(r.width / nw, r.height / nh) : Math.min(r.width / nw, r.height / nh);
      dw = nw * sc; dh = nh * sc;
      var pp = (cs.objectPosition || '50% 50%').split(' ');
      var px = parseFloat(pp[0]), py = parseFloat(pp[1]);
      ox = (r.width - dw) * (isNaN(px) ? 0.5 : px / 100); oy = (r.height - dh) * (isNaN(py) ? 0.5 : py / 100);
    } else { dw = r.width; dh = r.height; ox = 0; oy = 0; }
    var ix = Math.floor((u - ox) / dw * d.w), iy = Math.floor((v - oy) / dh * d.h);
    if (ix < 0 || iy < 0 || ix >= d.w || iy >= d.h) return null;
    var i = (iy * d.w + ix) * 4;
    if (d.px[i + 3] < 128) return null;                           // transparent pixel: look further down
    return lum(d.px[i], d.px[i + 1], d.px[i + 2]);
  }
  function parseRGB(str) {
    var out = [], re = /rgba?\(([^)]+)\)/g, m;
    while ((m = re.exec(str))) {
      var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
      out.push([p[0], p[1], p[2], p.length > 3 ? p[3] : 1]);
    }
    return out;
  }
  function lumAt(x, y) {
    var stack = document.elementsFromPoint(x, y);
    for (var i = 0; i < stack.length; i++) {
      var el = stack[i], cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.1) continue;
      if (el.tagName === 'IMG') {
        var l = imgLum(el, x, y); if (l !== null) return l; continue;
      }
      var bi = cs.backgroundImage;
      if (bi && bi !== 'none' && bi.indexOf('gradient') > -1 && parseFloat(cs.backgroundSize) !== 0) {
        var cols = parseRGB(bi).filter(function (c) { return c[3] > 0.5; });
        if (cols.length) {
          var sr = 0, sg = 0, sb = 0; cols.forEach(function (c) { sr += c[0]; sg += c[1]; sb += c[2]; });
          return lum(sr / cols.length, sg / cols.length, sb / cols.length);
        }
      }
      var bg = parseRGB(cs.backgroundColor)[0];
      if (bg && bg[3] >= 0.5) return lum(bg[0], bg[1], bg[2]);
    }
    return 0;
  }
  var toneDark = false, toneTimer = 0, toneTimer2 = 0, toneAt = 0;
  function applyTone() {
    toneAt = Date.now();
    var d = 11, pts = [[tx, ty], [tx - d, ty - d], [tx + d, ty - d], [tx - d, ty + d], [tx + d, ty + d]], sum = 0, n = 0;
    for (var i = 0; i < pts.length; i++) {
      var px = pts[i][0], py = pts[i][1];
      if (px < 0 || py < 0 || px >= window.innerWidth || py >= window.innerHeight) continue;
      sum += lumAt(px, py) * (i ? 1 : 2); n += i ? 1 : 2;
    }
    var L = n ? sum / n : 0;
    var next = toneDark ? L > 0.16 : L > 0.24;                      // hysteresis so it never flickers on an edge
    if (next === toneDark) return;
    toneDark = next;
    ret.classList.toggle('is-dark', toneDark); dot.classList.toggle('is-dark', toneDark);
  }
  function scheduleTone() {
    if (Date.now() - toneAt > 120) applyTone();
    clearTimeout(toneTimer); toneTimer = setTimeout(applyTone, 60);
    clearTimeout(toneTimer2); toneTimer2 = setTimeout(applyTone, 420);   // after hover colour transitions settle
  }

  var ret = document.createElement('div');
  ret.className = 'cursor';
  ret.setAttribute('aria-hidden', 'true');
  ret.innerHTML = '<span class="frame-k"><i class="k tl"></i><i class="k tr"></i><i class="k bl"></i><i class="k br"></i></span><span class="cursor-hint"></span>';
  var dot = document.createElement('div');
  dot.className = 'cursor-dot';
  dot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ret);
  document.body.appendChild(dot);
  var hintEl = ret.querySelector('.cursor-hint');
  var tx = 0, ty = 0, seen = false;
  var hovering = false, hoverTimer = 0, scrollUntil = 0;

  // the frame is locked to the pointer (no easing) so the centre dot can never drift out of it
  function place() {
    // `translate` (not `transform`): the CSS scale/rotate used for hover + recoil then act around the
    // element's own centre instead of multiplying the pointer offset
    var p = tx + 'px ' + ty + 'px';
    ret.style.translate = p; dot.style.translate = p;
  }
  function setHover(on, hint) {
    hovering = on;
    ret.classList.toggle('is-hover', on);
    dot.classList.toggle('is-hover', on);
    if (on && hint) hintEl.textContent = hint[lang()];
    // keep the hint on screen near the edges
    ret.classList.toggle('hint-left', tx > window.innerWidth - 150);
    ret.classList.toggle('hint-up', ty > window.innerHeight - 56);
  }
  window.addEventListener('scroll', function () {
    scrollUntil = Date.now() + 200;
    if (seen) scheduleTone();
    clearTimeout(hoverTimer);
    if (hovering) setHover(false);
  }, { passive: true });

  document.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    tx = e.clientX; ty = e.clientY;
    if (!seen) { seen = true; root.classList.add('cursor-on'); }
    place();
    var t = e.target && e.target.closest ? e.target : null;
    var text = !!(t && t.closest('input, textarea, select'));   // native caret in fields
    ret.classList.toggle('on', !text); dot.classList.toggle('on', !text);
    if (!text) scheduleTone();

    var hint = text ? null : hintFor(t);
    if (!hint) { clearTimeout(hoverTimer); if (hovering) setHover(false); return; }
    if (hovering) { if (hintEl.textContent !== hint[lang()]) hintEl.textContent = hint[lang()]; return; }
    if (Date.now() < scrollUntil) return;
    // a very short settle so flicking across a page doesn't flash the hover state
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () { setHover(true, hint); }, 70);
  }, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () {
    clearTimeout(hoverTimer); ret.classList.remove('on'); dot.classList.remove('on'); if (hovering) setHover(false);
  });

  /* click: recoil the reticle and drop a hit marker */
  function retrigger(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
  document.addEventListener('pointerdown', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    if (e.button !== 0) return;
    var t = e.target && e.target.closest ? e.target : null;
    if (t && t.closest('input, textarea, select')) return;
    var isHit = !!hintFor(t);
    retrigger(ret, 'fire'); retrigger(dot, 'fire');
    var m = document.createElement('div');
    m.className = 'hit ' + (isHit ? 'is-hit' : 'is-miss');
    if (toneDark) m.classList.add('is-dark');
    m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px';
    m.setAttribute('aria-hidden', 'true');
    m.innerHTML = '<i></i><i></i><i></i><i></i>';
    document.body.appendChild(m);
    setTimeout(function () { if (m.parentNode) m.parentNode.removeChild(m); }, 520);
  });
})();