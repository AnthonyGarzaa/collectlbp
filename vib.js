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
    if (target && target.tagName === 'IMG' && !target.closest('.lightbox') && !target.closest('a')) {
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
