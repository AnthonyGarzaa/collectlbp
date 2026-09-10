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
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    currentList = [];
    currentIndex = -1;
  }

  function nextImage() { showAt(currentIndex + 1); }
  function prevImage() { showAt(currentIndex - 1); }

  document.addEventListener('click', function (e) {
    var target = e.target;
    if (target && target.tagName === 'IMG' && !target.closest('.lightbox') && !target.closest('a') && !target.closest('.vib-ticker')) {
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
  document.body.appendChild(wrap);
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
  }
  keepScoreBelowBox();
  window.addEventListener('load', keepScoreBelowBox);
  window.addEventListener('resize', keepScoreBelowBox);
  score.addEventListener('loadedmetadata', keepScoreBelowBox);
})();

// ── Vibri renders (pixel-extracted from the CHARA sheets) in the masthead
//    and dancing down the left/right background gutters, on every page. ──
(function setupVibriDecor() {
  if (!document.body) return;
  var R = 'vib/renders/';

  // Header: five poses on each side of the centred title/nav, laid out by
  // .vib-head-row (flex, evenly spread, one shared size) so they can never
  // overlap each other or the nav. [file, side('left'|'right'), rot°]
  var header = document.querySelector('.vib-header');
  if (header && !header.querySelector('.vib-head-row')) {
    var sides = { left: [], right: [] };
    [['vibri_31.png', 'left',  -6],
     ['vibri_07.png', 'left',   4],
     ['vibri_21.png', 'left',   5],
     ['vibri_23.png', 'left',  -4],
     ['vibri_06.png', 'left',  -7],
     ['vibri_25.png', 'right',  6],
     ['vibri_24.png', 'right', -4],
     ['vibri_10.png', 'right', -5],
     ['vibri_30.png', 'right',  4],
     ['vibri_20.png', 'right',  7]].forEach(function (p) { sides[p[1]].push(p); });
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
        img.style.transform = 'rotate(' + p[2] + 'deg)';
        row.appendChild(img);
      });
      header.appendChild(row);
    });
    // The rows are absolutely positioned, so give the header enough height
    // to contain them (plus the ticker at its foot) whatever size they land at.
    var ticker = header.querySelector('.vib-ticker');
    var fitHeader = function () {
      // Header tall enough for the rows above the ticker, then sit the rows
      // exactly on the ticker's top line (the "floor" of the masthead).
      var rows = header.querySelectorAll('.vib-head-row');
      var rowH = 0;
      rows.forEach(function (row) { rowH = Math.max(rowH, row.offsetHeight); });
      var tickerH = ticker ? ticker.offsetHeight : 0;
      header.style.minHeight = (rowH + 24 + tickerH) + 'px';
      var floor = ticker ? (header.clientHeight - ticker.offsetTop) : 0;
      rows.forEach(function (row) { row.style.bottom = floor + 'px'; });
      if (window.vibLayoutGutters) window.vibLayoutGutters();   // gutters start below the header
    };
    fitHeader();
    window.addEventListener('load', fitHeader);
    window.addEventListener('resize', fitHeader);
    header.querySelectorAll('.vib-head-vibri').forEach(function (img) { img.addEventListener('load', fitHeader); });
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
        imgs.forEach(function (img, i) {
          var outer = (i % 2 === 0);                    // even rows hug the screen edge
          img.style.width = w + 'px';
          img.style.height = h + 'px';
          img.style.top = (START + i * step) + 'px';
          img.style.left = ((outer !== mirror) ? 0 : span) + 'px';
        });
        // Tall enough to hold the whole zig-zag so nothing is clipped.
        g.style.height = (START + (imgs.length - 1) * step + h) + 'px';
      });
    };
    // [file] — one render per row, stepped down the column.
    makeGutter('vib-gutter-left', [
      ['vibri_13.png', 12, -11, 42],
      ['vibri_14.png', 21, 9,   58],
      ['vibri_15.png', 31, -6,  44],
      ['vibri_17.png', 40, 13,  60],
      ['vibri_12.png', 50, 8,   45],
      ['vibri_18.png', 59, -9,  41],
      ['vibri_19.png', 69, 7,   57],
      ['vibri_11.png', 78, -12, 45],
      ['vibri_22.png', 88, 10,  56],
      ['vibri_01.png', 97, -8,  50],
      ['vibri_03.png', 106, 9,  47],
      ['vibri_05.png', 115, -10, 55]
    ]);
    makeGutter('vib-gutter-right', [
      ['vibri_16.png', 12, 11,  58],
      ['vibri_08.png', 23, -9,  42],
      ['vibri_26.png', 34, 6,   59],
      ['vibri_27.png', 45, -13, 41],
      ['vibri_28.png', 56, 9,   57],
      ['vibri_29.png', 67, -7,  43],
      ['vibri_09.png', 78, 12,  58],
      ['vibri_33.png', 88, -10, 44],
      ['vibri_02.png', 97, 8,   52],
      ['vibri_04.png', 106, -9, 46],
      ['vibri_32.png', 115, 11, 57]
    ]);
    window.vibLayoutGutters = layoutGutters;
    layoutGutters();
    window.addEventListener('load', layoutGutters);
    window.addEventListener('resize', layoutGutters);
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
