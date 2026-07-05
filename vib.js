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

// ── Background line + walking Vibri on every page ──
(function setupBackgroundVideo() {
  if (!document.body || document.getElementById('vib-bg-video')) return;
  // Spacer that keeps the wrap's height where the background video used to
  // be, so the line and walker stay aligned. (thevib.mp4 removed.)
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
  // Walking Vibri video, sitting on the line at the left of the screen.
  var walker = document.createElement('video');
  walker.id = 'vib-bg-walker';
  walker.src = 'vib/thewalk.mp4';
  walker.autoplay = true;
  walker.loop = true;
  walker.muted = true;
  walker.defaultMuted = true;
  walker.playsInline = true;
  walker.setAttribute('muted', '');
  walker.setAttribute('playsinline', '');
  walker.setAttribute('aria-hidden', 'true');
  wrap.appendChild(walker);
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
  var pw = walker.play();
  if (pw && pw.catch) pw.catch(function () {});
  var ps = score.play();
  if (ps && ps.catch) ps.catch(function () {});
})();

// ── Vibri renders (pixel-extracted from the CHARA sheets) in the masthead
//    and dancing down the left/right background gutters, on every page. ──
(function setupVibriDecor() {
  if (!document.body) return;
  var R = 'vib/renders/';

  // Header: a horizontal row of three poses on each side, pushed inward toward
  // the centred title / nav (offsets 62/158/254 from the edge), vertically
  // centred (152px box, tops ~58-66 in the ~290px band, kept above the ticker).
  // [file, edge('left'|'right'), offset(px), top(px), rot°, size(px, optional)]
  var header = document.querySelector('.vib-header');
  if (header && !header.querySelector('.vib-head-vibri')) {
    [['vibri_11.png', 'left',  62,  78, -6, 112],
     ['vibri_08.png', 'left',  168, 41, 5],
     ['vibri_09.png', 'left',  274, 33, -7],
     ['vibri_10.png', 'right', 47,  41, 6],
     ['vibri_06.png', 'right', 168, 33, -5],
     ['vibri_07.png', 'right', 274, 41, 7]].forEach(function (p) {
      var img = document.createElement('img');
      img.src = R + p[0];
      img.alt = '';
      img.className = 'vib-head-vibri';
      img.style[p[1]] = p[2] + 'px';
      img.style.top = p[3] + 'px';
      img.style.transform = 'rotate(' + p[4] + 'deg)';
      if (p[5]) { img.style.width = p[5] + 'px'; img.style.height = p[5] + 'px'; }
      img.setAttribute('aria-hidden', 'true');
      header.appendChild(img);
    });
  }

  // Gutters: a uniform-size column of poses down each side margin, below the
  // masthead, spaced apart and extending downward. Only the filename is used
  // now; the position/size come from the fixed box + step below.
  if (!document.querySelector('.vib-gutter')) {
    // Uniform 170x210 box (see .vib-gutter img), stepped 250px apart so every
    // render is the same size, none overlap, and the column extends downward.
    var BOX_H = 210, STEP = 250, START = 24;
    var makeGutter = function (cls, list) {
      var g = document.createElement('div');
      g.className = 'vib-gutter ' + cls;
      g.setAttribute('aria-hidden', 'true');
      list.forEach(function (p, i) {
        var img = document.createElement('img');
        img.src = R + p[0];
        img.alt = '';
        img.style.top = (START + i * STEP) + 'px';
        g.appendChild(img);
      });
      // Tall enough to hold the whole column so nothing is clipped.
      g.style.height = (START + (list.length - 1) * STEP + BOX_H) + 'px';
      document.body.appendChild(g);
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
      ['vibri_21.png', 78, -12, 45],
      ['vibri_22.png', 88, 10,  56]
    ]);
    makeGutter('vib-gutter-right', [
      ['vibri_23.png', 12, 11,  58],
      ['vibri_25.png', 23, -9,  42],
      ['vibri_26.png', 34, 6,   59],
      ['vibri_27.png', 45, -13, 41],
      ['vibri_28.png', 56, 9,   57],
      ['vibri_29.png', 67, -7,  43],
      ['vibri_31.png', 78, 12,  58],
      ['vibri_33.png', 88, -10, 44]
    ]);
  }
})();
