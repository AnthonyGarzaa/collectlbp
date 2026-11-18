/* ── Layout pass ──────────────────────────────────────────────────────────
   Everything positioned from measured layout (header render rows, poses
   perched on the nav plates, the gutter columns, the score clip) registers
   here. One pass reruns them all, in order, whenever something that can move
   them changes: the Vibri font arriving (the nav plates change width), an
   image or video getting its size, or the viewport resizing. A
   ResizeObserver delivers before the next paint, so the poses are moved in
   the same frame as the change instead of being painted in an old spot and
   then jumping into place. */
window.vibLayout = (function () {
  var fns = [], running = false;
  function run() {
    if (running) return;            // our own writes resize observed boxes; don't re-enter
    running = true;
    try { fns.forEach(function (f) { f(); }); } finally { running = false; }
  }
  function add(fn) { fns.push(fn); fn(); }
  document.addEventListener('DOMContentLoaded', function () {
    if (window.ResizeObserver) {
      var ro = new ResizeObserver(run);
      ['body', '.vib-header', '.vib-nav', 'main'].forEach(function (sel) {
        var el = document.querySelector(sel);
        if (el) ro.observe(el);
      });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  });
  window.addEventListener('load', run);
  window.addEventListener('resize', run);
  return { add: add, run: run };
})();

(function () {
  var dogLink = document.querySelector('.dog-link');
  if (!dogLink) return;

  var CURSORS = ['ParappaHat-cursor.png', 'guitar-cursor.png'];

  function spawnBursts() {
    var count = 3 + Math.floor(Math.random() * 2);
    var baseAngle = Math.random() * Math.PI * 2;
    var jitter = Math.PI / count * 0.4;
    for (var i = 0; i < count; i++) {
      var burst = document.createElement('div');
      burst.className = 'dog-cursor-burst';
      var src = CURSORS[Math.floor(Math.random() * CURSORS.length)];
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      burst.appendChild(img);
      var size = 28 + Math.random() * 20;
      if (src.indexOf('ParappaHat') !== -1) size *= 0.65;
      else if (src.indexOf('guitar') !== -1) size *= 1.25;
      var angle = baseAngle + (i * Math.PI * 2 / count) + (Math.random() * 2 - 1) * jitter;
      var radius = 70 + Math.random() * 20;
      var x = 50 + radius * Math.cos(angle);
      var y = 50 + radius * Math.sin(angle);
      burst.style.width = size + 'px';
      burst.style.height = size + 'px';
      burst.style.left = x + '%';
      burst.style.top = y + '%';
      burst.style.animationDelay = (Math.random() * 0.25) + 's';
      dogLink.appendChild(burst);
      burst.addEventListener('animationend', function () { this.remove(); });
    }
  }

  dogLink.addEventListener('mouseenter', spawnBursts);
})();

// ── Lightbox: click any image to view it full size, navigate within the page ──
(function setupLightbox() {
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var closeBtn = document.getElementById('lightboxClose');
  var prevBtn = document.getElementById('lightboxPrev');
  var nextBtn = document.getElementById('lightboxNext');
  if (!lightbox || !lightboxImg || !closeBtn) return;

  var currentList = [];
  var currentIndex = -1;

  function collectImages(img) {
    var section = img.closest('main') || document.body;
    var nodes = section.querySelectorAll('img');
    var list = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.closest('.lightbox')) continue;
      if (n.closest('a')) continue;
      if (n.closest('.yt-facade')) continue;
      list.push(n);
    }
    return list;
  }

  function showAt(index) {
    if (!currentList.length) return;
    var n = currentList.length;
    currentIndex = ((index % n) + n) % n;
    var img = currentList[currentIndex];
    lightboxImg.src = img.currentSrc || img.src;
    unzoom();
    lightboxImg.alt = img.alt || '';
    var multi = currentList.length > 1;
    if (prevBtn) prevBtn.style.display = multi ? '' : 'none';
    if (nextBtn) nextBtn.style.display = multi ? '' : 'none';
  }

  function openLightbox(img) {
    currentList = collectImages(img);
    var idx = currentList.indexOf(img);
    currentIndex = idx >= 0 ? idx : 0;
    if (!currentList.length) currentList = [img];
    showAt(currentIndex);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    unzoom();
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    currentList = [];
    currentIndex = -1;
  }


  // ── Click-to-zoom: clicking the full-size image zooms it to native size
  //    (at least 2x) around the clicked spot; drag or scroll to pan; click
  //    again, change image, or close to zoom back out. ──
  var zoomed = false, dragging = false, dragMoved = false, dragX = 0, dragY = 0, dragSL = 0, dragST = 0;
  function unzoom() {
    zoomed = false;
    lightbox.classList.remove('zoomed');
    lightbox.classList.remove('dragging');
    lightboxImg.style.width = '';
    lightbox.scrollTop = 0;
    lightbox.scrollLeft = 0;
  }
  function zoomAt(clientX, clientY) {
    var r = lightboxImg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var fx = (clientX - r.left) / r.width, fy = (clientY - r.top) / r.height;
    var target = Math.max(lightboxImg.naturalWidth || 0, Math.round(r.width * 2));
    zoomed = true;
    lightbox.classList.add('zoomed');
    lightboxImg.style.width = target + 'px';
    lightbox.scrollTop = 0;
    lightbox.scrollLeft = 0;
    var box = lightboxImg.getBoundingClientRect(), cont = lightbox.getBoundingClientRect();
    lightbox.scrollLeft = Math.max(0, (box.left - cont.left) + fx * box.width - cont.width / 2);
    lightbox.scrollTop = Math.max(0, (box.top - cont.top) + fy * box.height - cont.height / 2);
  }
  lightboxImg.addEventListener('click', function (e) {
    e.stopPropagation();
    if (dragMoved) { dragMoved = false; return; }
    if (zoomed) unzoom(); else zoomAt(e.clientX, e.clientY);
  });
  lightboxImg.addEventListener('dragstart', function (e) { e.preventDefault(); });
  lightboxImg.addEventListener('mousedown', function (e) {
    if (!zoomed || e.button !== 0) return;
    e.preventDefault();
    dragging = true; dragMoved = false;
    dragX = e.clientX; dragY = e.clientY; dragSL = lightbox.scrollLeft; dragST = lightbox.scrollTop;
    lightbox.classList.add('dragging');
  });
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    var dx = e.clientX - dragX, dy = e.clientY - dragY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
    lightbox.scrollLeft = dragSL - dx;
    lightbox.scrollTop = dragST - dy;
  });
  document.addEventListener('mouseup', function () {
    if (!dragging) return;
    dragging = false;
    lightbox.classList.remove('dragging');
  });

  function nextImage() { showAt(currentIndex + 1); }
  function prevImage() { showAt(currentIndex - 1); }

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (target && target.tagName === 'IMG' && !target.closest('.lightbox') && !target.closest('a') && !target.closest('.vib-ticker') && !target.closest('.yt-facade')) {
      e.preventDefault();
      openLightbox(target);
    }
  });

  closeBtn.addEventListener('click', function (e) { e.stopPropagation(); closeLightbox(); });
  if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prevImage(); });
  if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); nextImage(); });

  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') nextImage();
    else if (e.key === 'ArrowLeft') prevImage();
  });
})();

// ── YouTube facades: the thumbnail + play button (.yt-facade) is swapped for
//    the real player only when clicked, so pages don't load YouTube up front. ──
(function setupYouTubeFacades() {
  function activate(facade) {
    var videoId = facade.getAttribute('data-video-id');
    if (!videoId) return;
    var title = facade.getAttribute('data-title') || 'YouTube video';
    var origin = (window.location.protocol === 'http:' || window.location.protocol === 'https:') ? window.location.origin : '';
    var src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?autoplay=1&rel=0&enablejsapi=1' + (origin ? '&origin=' + encodeURIComponent(origin) : '');
    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', src);
    iframe.setAttribute('title', title);
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('allowfullscreen', '');
    facade.parentNode.replaceChild(iframe, facade);
  }

  document.addEventListener('click', function (e) {
    var facade = e.target.closest && e.target.closest('.yt-facade');
    if (!facade) return;
    e.preventDefault();
    activate(facade);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var active = document.activeElement;
    if (active && active.classList && active.classList.contains('yt-facade')) {
      e.preventDefault();
      activate(active);
    }
  });
})();

// ── Background line, running Vibri and score clip on every page ──
(function setupBackgroundVideo() {
  if (!document.body || document.getElementById('vib-bg-video')) return;
  // Spacer that keeps the wrap's height where the background video used to
  // be, so the line and score clip stay aligned. (thevib.mp4 removed.)
  var v = document.createElement('div');
  v.id = 'vib-bg-video';
  v.setAttribute('aria-hidden', 'true');
  // Wrap so the full-width white line overlays it at the same vertical
  // position. Both render below all the page content.
  var wrap = document.createElement('div');
  wrap.id = 'vib-bg-wrap';
  wrap.appendChild(v);
  var line = document.createElement('div');
  line.id = 'vib-bg-line';
  line.setAttribute('aria-hidden', 'true');
  wrap.appendChild(line);
  // Running Vibri (7-frame sprite from vib/Run, see #vib-bg-runner in vib.css),
  // standing on the line at the left of the screen where the walking clip was.
  var runner = document.createElement('div');
  runner.id = 'vib-bg-runner';
  runner.setAttribute('aria-hidden', 'true');
  wrap.appendChild(runner);
  // Score video, centered, sitting 35px above the line.
  var score = document.createElement('video');
  score.id = 'vib-bg-score';
  score.src = 'vib/score.mp4';
  score.autoplay = true;
  score.loop = true;
  score.muted = true;
  score.defaultMuted = true;
  score.playsInline = true;
  score.setAttribute('muted', '');
  score.setAttribute('playsinline', '');
  score.setAttribute('aria-hidden', 'true');
  wrap.appendChild(score);
  // Clipping box around the whole background block. The score clip's frame
  // is mostly black and used to run on far below the line, so the page kept
  // scrolling into empty black; this box cuts that run-out to half (see
  // keepScoreBelowBox) without moving the line, runner or score.
  var clip = document.createElement('div');
  clip.id = 'vib-bg-clip';
  clip.appendChild(wrap);
  document.body.appendChild(clip);
  var ps = score.play();
  if (ps && ps.catch) ps.catch(function () {});

  // Place the score clip's drawing directly below the last content box on
  // every page, and keep the line (with the runner) well below the drawing.
  // The clip is mostly black (blended away); its drawing occupies the band
  // from 9.3% to 27.4% of the frame height, so only that band matters.
  var DRAW_TOP = 0.0926, DRAW_BOTTOM = 0.2741, BOX_GAP = 24, LINE_GAP = 104;
  function keepScoreBelowBox() {
    var box = document.querySelector('main');
    if (!box) return;
    // Rects are measured in viewport pixels, but the page is zoomed to 80% on
    // desktop (see html { zoom } in vib.css), so a CSS length moves things
    // only zoom-times as far. Scale every adjustment up to compensate.
    var zoom = parseFloat(window.getComputedStyle(document.documentElement).zoom) || 1;
    wrap.style.marginTop = '0px';
    score.style.top = '';
    var boxBottom = box.getBoundingClientRect().bottom;
    var r = score.getBoundingClientRect();
    // Height may still be 0 before metadata loads; the clip is 16:9.
    var h = r.height || (r.width * 9 / 16);
    var drawH = h * (DRAW_BOTTOM - DRAW_TOP);
    // 1. If the line would sit closer than LINE_GAP below the drawing, push
    //    the whole background block (line, runner, clip) down first.
    var lineTop = line.getBoundingClientRect().top;
    var need = (boxBottom + BOX_GAP + drawH + LINE_GAP) - lineTop;
    if (need > 0) {
      wrap.style.marginTop = Math.ceil(need / zoom) + 'px';
      r = score.getBoundingClientRect();
    }
    // 2. Sit the drawing's top edge BOX_GAP below the box border.
    var drawTop = r.bottom - h * (1 - DRAW_TOP);
    var shift = (boxBottom + BOX_GAP) - drawTop;
    score.style.top = 'calc(50% + ' + (490 + shift / zoom).toFixed(1) + 'px)';
    // 3. End the page half as far below the line as the score frame reaches.
    clip.style.height = '';
    var lineBottom = line.getBoundingClientRect().bottom;
    var scoreBottom = score.getBoundingClientRect().bottom;
    var clipTop = clip.getBoundingClientRect().top;
    var below = Math.max(0, scoreBottom - lineBottom);
    clip.style.height = Math.round((lineBottom + below / 2 - clipTop) / zoom) + 'px';
  }
  window.vibLayout.add(keepScoreBelowBox);
  score.addEventListener('loadedmetadata', window.vibLayout.run);
})();

// ── Ticker: repeat the ribbon set until each half of the track is at least
//    as wide as the bar, so the loop never shows an empty stretch on wide
//    screens. The track is always two identical halves (the keyframes slide
//    by 50%), and the duration scales with the width so the speed is constant. ──
(function fillTicker() {
  var ticker = document.querySelector('.vib-ticker');
  var track = ticker && ticker.querySelector('.vib-ticker-track');
  if (!track) return;
  var imgs = Array.prototype.slice.call(track.querySelectorAll('img'));
  if (!imgs.length) return;
  // The base set is the first half of the markup (it ships as set + copy).
  var set = imgs.slice(0, Math.max(1, Math.floor(imgs.length / 2))).map(function (img) { return img.cloneNode(true); });
  var PX_PER_SEC = 33;     // the original 38s over one ~1264px ribbon pair
  var reps = 0;
  var fit = function () {
    // Measure one set from the live track (the first `set.length` images).
    var live = track.querySelectorAll('img');
    var setW = 0;
    for (var i = 0; i < set.length && i < live.length; i++) setW += live[i].offsetWidth || 0;
    if (!setW) return;               // images not measurable yet; the load handlers re-run us
    var need = Math.max(1, Math.ceil(ticker.clientWidth / setW));
    if (need !== reps) {
      reps = need;
      track.innerHTML = '';
      for (var r = 0; r < reps * 2; r++) set.forEach(function (img) { track.appendChild(img.cloneNode(true)); });
      track.querySelectorAll('img').forEach(function (img) { img.addEventListener('load', window.vibLayout.run); });
    }
    track.style.animationDuration = Math.round(track.scrollWidth / 2 / PX_PER_SEC) + 's';
  };
  window.vibLayout.add(fit);
  imgs.forEach(function (img) { img.addEventListener('load', window.vibLayout.run); });
})();

// ── Language switch (EN / JP decagons, top-left). Shares the PaRappa
//    section's localStorage key so one choice covers the whole site. ──
(function setupLang() {
  var KEY = 'parappaLangJP';
  var buttons = document.querySelectorAll('.vib-lang button[data-lang]');
  function apply(jp) {
    document.body.classList.toggle('lang-jp', jp);
    document.documentElement.lang = jp ? 'ja' : 'en';
    buttons.forEach(function (b) { b.classList.toggle('active', (b.getAttribute('data-lang') === 'jp') === jp); });
  }
  var jp = false;
  try { jp = localStorage.getItem(KEY) === '1'; } catch (e) {}
  apply(jp);
  // The diagonal ribbon: from the centre of the lowest plate on the left
  // (container middle + 60px) to the centre of the raised plate on the right.
  var group = document.querySelector('.vib-lang');
  var line = group && group.querySelector('.vib-lang-line line');
  if (line) {
    var fitLine = function () {
      var mid = group.offsetHeight / 2;
      line.setAttribute('y1', mid + 60);
      line.setAttribute('y2', mid);
    };
    if (window.vibLayout) window.vibLayout.add(fitLine); else fitLine();
  }
  buttons.forEach(function (b) {
    b.addEventListener('click', function () {
      var want = b.getAttribute('data-lang') === 'jp';
      try { localStorage.setItem(KEY, want ? '1' : '0'); } catch (e) {}
      apply(want);
    });
  });
})();

// ── Vibri renders (pixel-extracted from the CHARA sheets) in the masthead
//    and dancing down the left/right background gutters, on every page. ──
(function setupVibriDecor() {
  if (!document.body) return;
  var R = 'vib/renders/';

  // Header: five poses on each side of the centred title/nav, laid out by
  // .vib-head-row (flex, evenly spread, one shared size) so they can never
  // overlap each other or the nav. [file, side('left'|'right'), rot°,
  // optional dx px, dy px nudge, optional extra scale factor, optional
  // `beside` file: the render is taken out of the row's flow and pinned just
  // outward of that render, so adding it moves nothing else]
  var header = document.querySelector('.vib-header');
  if (header && !header.querySelector('.vib-head-row')) {
    var sides = { left: [], right: [] };
    [['vibri_31.png', 'left',  -6, 70, 100, 1.12],
     ['vibri_07.png', 'left',   4, 40, 100],
     ['vibri_11.png', 'left',  -5, 74, 100, 0.8, 'vibri_31.png'],   // pinned outward of 31
     ['vibri_04.png', 'left',   6, 90, 100, 0.95, 'vibri_11.png'],   // pinned outward of 11 (nudge tuned by eye)
     ['vibri_10.png', 'right',  4, 50, 100],
     ['vibri_20.png', 'right',  7, 20, 100],
     ['vibri_22.png', 'right', -5, -15, 100, 1.12],
     ['vibri_12.png', 'right',  6, -50, 100, 1, 'vibri_22.png']].forEach(function (p) { sides[p[1]].push(p); });
    ['left', 'right'].forEach(function (side) {
      var row = document.createElement('div');
      row.className = 'vib-head-row vib-head-row-' + side;
      row.setAttribute('aria-hidden', 'true');
      // The left row is laid out right-to-left (row-reverse) so overflow runs
      // off the screen edge; feed it in reverse so the visual order is kept.
      var list = side === 'left' ? sides[side].slice().reverse() : sides[side];
      list.forEach(function (p) {
        var img = document.createElement('img');
        img.src = R + p[0];
        img.alt = '';
        img.className = 'vib-head-vibri';
        img.style.transform = 'translate(' + (p[3] || 0) + 'px, ' + (p[4] || 0) + 'px) rotate(' + p[2] + 'deg) scale(' + (p[5] || 1) + ')';
        if (p[6]) img.dataset.beside = p[6];
        row.appendChild(img);
      });
      header.appendChild(row);
    });
    // The rows are absolutely positioned, so give the header enough height
    // to contain them (plus the ticker at its foot) whatever size they land at.
    var ticker = header.querySelector('.vib-ticker');
    var fitHeader = function () {
      // The rows hang from the top of the masthead (TOP px down, level with
      // the title band) rather than standing on the ticker, so they never
      // force the header taller than its title + nav + ticker need. The
      // min-height only kicks in if that content is shorter than the rows.
      var rows = header.querySelectorAll('.vib-head-row');
      var rowH = 0;
      rows.forEach(function (row) { rowH = Math.max(rowH, row.offsetHeight); });
      var tickerH = ticker ? ticker.offsetHeight : 0;
      var TOP = 36;
      header.style.minHeight = (TOP + rowH + tickerH) + 'px';
      rows.forEach(function (row) { row.style.top = TOP + 'px'; row.style.bottom = 'auto'; });
      // Companions: pinned one gap outward of their anchor, same size and baseline.
      // Repeated so a companion whose anchor is itself a companion settles in
      // the same pass, whatever the DOM order.
      for (var pass = 0; pass < 3; pass++) rows.forEach(function (row) {
        var outward = row.classList.contains('vib-head-row-left') ? -1 : 1;
        row.querySelectorAll('.vib-head-vibri[data-beside]').forEach(function (img) {
          var anchor = row.querySelector('img[src$="' + img.dataset.beside + '"]');
          if (!anchor) return;
          img.style.width = anchor.offsetWidth + 'px';
          img.style.top = anchor.offsetTop + 'px';
          img.style.left = (anchor.offsetLeft + outward * (anchor.offsetWidth + 4)) + 'px';
        });
      });
    };
    window.vibLayout.add(fitHeader);   // the gutters (registered later) start below the header
    header.querySelectorAll('.vib-head-vibri').forEach(function (img) { img.addEventListener('load', window.vibLayout.run); });
  }

  // Perched renders: a few poses stand on top of the nav plates, feet on the
  // plate's outline. [file, plate index, fraction across the plate, rot°,
  // optional box px override (0 = the shared --head-render box), optional dx px nudge,
  // optional dy px nudge (positive = down)]
  var nav = document.querySelector('.vib-nav');
  if (nav && !nav.querySelector('.vib-nav-perch')) {
    var perches = [['vibri_21.png', 0, 0.5,   5, 128, -80, 30],
                   ['vibri_23.png', 1, 0.18, -4, 0, -80],
                   ['vibri_06.png', 1, 0.74, -7, 0, -80],
                   ['vibri_25.png', 4, 0.02, -3, 146, 52, -5],
                   ['vibri_30.png', 4, 0.47, -4, 112, 79],
                   ['vibri_08.png', 4, 0.86, -5, 128, 70, 60]];
    var perchImgs = perches.map(function (p) {
      var img = document.createElement('img');
      img.src = R + p[0];
      img.alt = '';
      img.className = 'vib-nav-perch';
      img.setAttribute('aria-hidden', 'true');
      if (p[4]) { img.style.width = p[4] + 'px'; img.style.height = p[4] + 'px'; }   // bigger/smaller box than the shared one
      nav.appendChild(img);
      return img;
    });
    var placePerches = function () {
      var plates = nav.querySelectorAll('a');
      perches.forEach(function (p, i) {
        var plate = plates[p[1]];
        if (!plate) return;
        perchImgs[i].style.left = (plate.offsetLeft + plate.offsetWidth * p[2] + (p[5] || 0)) + 'px';
        perchImgs[i].style.transform = 'translateX(-50%) rotate(' + p[3] + 'deg)';
        perchImgs[i].style.bottom = 'calc(100% - 2px - ' + (p[6] || 0) + 'px)';
      });
    };
    window.vibLayout.add(placePerches);
  }

  // Gutters: the remaining poses zig-zag down each side margin below the
  // masthead, alternating between the outer and inner edge of the gutter.
  // Only the filename is used; position/size come from the box + layout below.
  if (!document.querySelector('.vib-gutter')) {
    // Uniform 170x210 box (see .vib-gutter img). Where the gutter is wide
    // enough for the two zig-zag columns to clear each other sideways, rows
    // are packed at half a box height (every other render shares a column,
    // so same-column neighbours are still a full box apart); otherwise rows
    // fall back to a full box height. Either way nothing overlaps.
    var BOX_W = 170, BOX_H = 210, GAP = 10, START = 24;
    var gutters = [];
    var makeGutter = function (cls, list) {
      var g = document.createElement('div');
      g.className = 'vib-gutter ' + cls;
      g.setAttribute('aria-hidden', 'true');
      list.forEach(function (p) {
        var img = document.createElement('img');
        img.src = R + p[0];
        img.alt = '';
        img.dataset.dx = p[4] || 0;    // optional per-pose nudge, px
        img.dataset.dy = p[5] || 0;
        if (p[6]) img.dataset.beside = p[6];   // optional: sit on this render's row, to its inner side
        g.appendChild(img);
      });
      document.body.appendChild(g);
      gutters.push(g);
    };
    var layoutGutters = function () {
      // Exact free width beside main, in layout px (unaffected by the page
      // zoom), so the strips never sit behind the box whatever the zoom.
      // body.clientWidth and main.offsetWidth are both in the zoomed layout
      // space (documentElement.clientWidth is not), so this stays exact.
      var main = document.querySelector('main');
      var pageW = document.body.clientWidth || document.documentElement.clientWidth;
      var free = main ? Math.max(0, (pageW - main.offsetWidth) / 2) : 0;
      var head = document.querySelector('.vib-header');
      var top = head ? head.offsetTop + head.offsetHeight + 24 : 290;
      gutters.forEach(function (g) {
        g.style.top = top + 'px';
        g.style.width = Math.floor(free) + 'px';
        var imgs = g.querySelectorAll('img');
        var G = g.clientWidth;
        // Fixed-size renders: they never scale with viewport width or zoom.
        // (main reserves at least a 178px gutter so the 170px box always fits.)
        var w = BOX_W, h = BOX_H, gap = GAP;
        var span = Math.max(0, G - w);                  // sideways travel between the two columns
        var interleave = span >= w + 4;                 // neighbours clear each other sideways
        var step = interleave ? Math.ceil((h + gap) / 2) : h + gap;
        var mirror = g.classList.contains('vib-gutter-right');
        var column = [], beside = [];
        imgs.forEach(function (img) { (img.dataset.beside ? beside : column).push(img); });
        column.forEach(function (img, i) {
          var outer = (i % 2 === 0);                    // even rows hug the screen edge
          img.style.width = w + 'px';
          img.style.height = h + 'px';
          img.style.top = (START + i * step + (+img.dataset.dy || 0)) + 'px';
          img.style.left = (((outer !== mirror) ? 0 : span) + (+img.dataset.dx || 0)) + 'px';
        });
        // Companions share their anchor's row, one box further in from the
        // screen edge (dx/dy nudge from there).
        beside.forEach(function (img) {
          var anchor = g.querySelector('img[src$="' + img.dataset.beside + '"]');
          if (!anchor) return;
          img.style.width = w + 'px';
          img.style.height = h + 'px';
          img.style.top = (parseFloat(anchor.style.top) + (+img.dataset.dy || 0)) + 'px';
          var inward = mirror ? -(w + gap) : (w + gap);
          img.style.left = (parseFloat(anchor.style.left) + inward + (+img.dataset.dx || 0)) + 'px';
        });
        // Tall enough to hold the whole zig-zag so nothing is clipped.
        g.style.height = (START + (column.length - 1) * step + h) + 'px';
      });
    };
    // [file, (unused), (unused), (unused), dx, dy, beside] — one render per row,
    // stepped down the column; dx/dy are an optional pixel nudge from that slot.
    // With `beside` (another file in the same list) the render leaves the column
    // and sits on that render's row, just inward of it.
    makeGutter('vib-gutter-left', [
      ['vibri_13.png', 12, -11, 42],
      ['vibri_14.png', 21, 9,   58],
      ['vibri_15.png', 31, -6,  44],
      ['vibri_17.png', 40, 13,  60],
      ['vibri_18.png', 59, -9,  41],
      ['vibri_19.png', 69, 7,   57],
      ['vibri_01.png', 97, -8,  50],
      ['vibri_03.png', 106, 9,  47],
      ['vibri_05.png', 115, -10, 55]
    ]);
    makeGutter('vib-gutter-right', [
      ['vibri_16.png', 12, 11,  58],
      ['vibri_24.png', 23, -9,  42],
      ['vibri_26.png', 34, 6,   59],
      ['vibri_27.png', 45, -13, 41],
      ['vibri_28.png', 56, 9,   57],
      ['vibri_29.png', 67, -7,  43],
      ['vibri_09.png', 78, 12,  58],
      ['vibri_33.png', 88, -10, 44],
      ['vibri_02.png', 97, 8,   52],
      ['vibri_32.png', 115, 11, 57]
    ]);
    window.vibLayout.add(layoutGutters);
  }
})();

/* ── Back to top ──────────────────────────────────────────────────────────
   Right-edge button, shared by every page that loads vib.js. Appears once
   the visitor is 50% of the way through the page's scrollable distance. */
(function () {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'vib-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.title = 'Back to top';
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 20V5M5 12l7-7 7 7" fill="none" stroke="currentColor" stroke-width="3" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(btn);

  var ticking = false;

  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? window.pageYOffset / max : 0;
    btn.classList.toggle('is-visible', progress >= 0.5);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  btn.addEventListener('click', function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });

  update();
})();

/* ── Region buttons on "The Game" page (same behaviour as the PaRappa
   "The Games" page): swap the cover art for the picked region. ── */
(function setupRegionButtons() {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.vib-region-btn[data-region]');
    if (!btn) return;
    var container = btn.closest('.vib-game-cover');
    if (!container) return;
    var img = container.querySelector('.region-img');
    if (!img) return;
    var region = btn.getAttribute('data-region');
    var src = img.getAttribute('data-' + region);
    img.src = src || img.getAttribute('data-default') || img.src;
    container.querySelectorAll('.vib-region-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
})();
