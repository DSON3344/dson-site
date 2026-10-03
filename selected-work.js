/* Home page "Selected work": fills the .reels slots with the works bookmarked
   in /admin (each has a numeric `featured_rank`, max 4).

   The existing <a class="reel"> elements are updated IN PLACE rather than
   replaced, so site.js keeps working on them: the scroll reveal observers and
   the image parallax are bound to these exact elements at load time.
   If nothing is bookmarked, or the API fails, the built-in markup stays. */
(function () {
  var reels = document.querySelector('.reels');
  if (!reels || !window.fetch) return;

  var MAX = 4;
  var CATS = {
    uiux: ['UI/UX', 'UI/UX 设计'],
    video: ['Video', '视频制作'],
    photo: ['Photo editing', '照片后期'],
    manipulation: ['Image manipulation', '图像合成'],
    '3d': ['3D modeling', '3D 建模'],
    graphic: ['Graphic design', '平面设计']
  };

  // Same slug rule as DSON.js (portfolio.html?work=<slug> opens that work).
  function slug(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function fill(el, w) {
    var cat = CATS[w.category] || [w.category || '', w.category || ''];
    var title = w.title || '';
    var s = slug(title);
    el.href = s ? 'portfolio.html?work=' + s : 'portfolio.html';

    var en = el.querySelector('.reel-info h3.lang-en');
    var zh = el.querySelector('.reel-info h3.lang-zh');
    if (en) en.textContent = title;
    if (zh) zh.textContent = w.title_zh || title;

    var meta = el.querySelector('.reel-meta');
    if (meta) {
      var mEn = meta.querySelector('.lang-en');
      var mZh = meta.querySelector('.lang-zh');
      var yr = meta.querySelector('.yr');
      if (mEn) mEn.textContent = cat[0];
      if (mZh) mZh.textContent = cat[1];
      if (yr) { yr.textContent = w.year || ''; yr.style.display = w.year ? '' : 'none'; }
    }

    var frame = el.querySelector('.reel-frame');
    var img = el.querySelector('.reel-frame img');
    if (frame) frame.classList.toggle('top', w.featured_focus === 'top');
    if (img) {
      var src = w.featured_cover || w.thumbnail || '';
      if (src && img.getAttribute('src') !== src) {
        img.removeAttribute('srcset');
        img.setAttribute('src', src);
      }
      img.alt = title;
    }
  }

  fetch('/api/portfolio', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      var works = (data && Array.isArray(data.works)) ? data.works : [];
      var picks = works
        .filter(function (w) { return Number(w.featured_rank) > 0; })
        .sort(function (a, b) { return Number(a.featured_rank) - Number(b.featured_rank); })
        .slice(0, MAX);
      if (!picks.length) return; // keep the built-in picks

      var slots = Array.prototype.slice.call(reels.querySelectorAll('.reel'));
      picks.forEach(function (w, i) { if (slots[i]) fill(slots[i], w); });
      // Fewer than 4 bookmarked: drop the unused slots.
      slots.slice(picks.length).forEach(function (el) { el.parentNode.removeChild(el); });
    })
    .catch(function () { /* keep the built-in picks */ });
})();
