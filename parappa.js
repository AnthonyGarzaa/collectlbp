/* PaRappa Corner — shared behaviour for every page of the PaRappa section
   (language toggle, Lammy mode, nav, lightbox, document viewer, video
   facades, search, corner buttons). Loaded at the end of each page. */

// ──────────────────────────────────────────────────────────────────────────
var isJP = false;

function toggleLang() {
  isJP = !isJP;
  var track = document.getElementById('langTrack');
  if (isJP) {
    track.classList.add('jp');
    document.body.classList.add('lang-jp');
  } else {
    track.classList.remove('jp');
    document.body.classList.remove('lang-jp');
  }
  // Remembered so the choice carries over to every other page of the site.
  try { localStorage.setItem('parappaLangJP', isJP ? '1' : '0'); } catch (e) {}
}

function setLang(lang) {
  var wantJP = (lang === 'jp' || lang === 'JP');
  if (wantJP !== isJP) toggleLang();
}

// Restore the language chosen on a previous page (the small inline script at
// the top of <body> has already put the lang-jp class on so nothing flashes).
(function restoreLang() {
  try {
    if (localStorage.getItem('parappaLangJP') === '1' && !isJP) toggleLang();
  } catch (e) {}
})();

// ── Pages ──
// Every section of the site is its own HTML file, named after its page id
// (aboutgame.html, merch-ptr-plush.html, ...); the welcome page is index.html.
var PARAPPA_PAGE_IDS = [
  'welcome', 'search', 'donate', 'contact', 'credits',
  'aboutgame', 'aboutanime', 'aboutrodney', 'aboutmatsuura', 'aboutvoiceactors',
  'chars', 'chars-ujl', 'chars-ptr2',
  'merch-rodneyfun-comics', 'merch-rodneyfun-toys', 'merch-rodneyfun-shirts',
  'merch-rodneyfun-stationary', 'merch-rodneyfun-promotional', 'merch-rodneyfun-misc',
  'merch-ptr-plush', 'merch-ptr-figures', 'merch-ptr-keychains', 'merch-ptr-shirts', 'merch-ptr-carddass', 'merch-ptr-misc', 'merch-ptr-pjberri',
  'merch-ujl-plush', 'merch-ujl-figures', 'merch-ujl-keychains', 'merch-ujl-shirts',
  'merch-ujl-milkcantour', 'merch-ujl-fernandes', 'merch-ujl-stationery', 'merch-ujl-misc',
  'merch-ptr2', 'merch-mcdonalds', 'merch-dunkin', 'merch-lipton', 'merch-catalogs',
  'gal-magazines', 'gal-stratguides', 'gal-shelves', 'gal-earlydesigns',
  'gal-officialart-ptr', 'gal-officialart-ujl', 'gal-events2',
  'ev-tgs1996', 'ev-psexpo96', 'ev-bellfare', 'ev-tgs1999', 'ev-roxy1999',
  'ev-amshow1999', 'ev-seasidefuji2001', 'ev-fukuoka2001', 'ev-rodneyparco', 'ev-hohoho2000',
  'sp-presskits', 'sp-promos', 'sp-posters', 'sp-prototypes', 'sp-websites', 'sp-crashad',
  'sp-physical', 'sp-mascots',
  'lammynow', 'ujlnow-cabinet', 'ujlnow-prize', 'ujlnow-discovery',
  'milkcan', 'videos', 'collections', 'caferodney', 'goods', 'kit'
];

function pageUrl(id) {
  return id === 'welcome' ? 'index.html' : id + '.html';
}

// Shows a page: if it is in this document it is switched to in place,
// otherwise the browser goes to that page's own file.
function showPage(id, btn) {
  var target = document.getElementById('page-' + id);
  if (!target) {
    window.location.href = pageUrl(id);
    return;
  }
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  target.classList.add('active');
  if (btn) {
    document.querySelectorAll('.nav-item > button').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  }
}

// The "Random Page!" button on the welcome page. Picks from the content pages:
// not the HOME menu pages, and not goods / kit / merch-ptr2, which nothing on
// the site links to any more.
var PARAPPA_RANDOM_EXCLUDED = ['welcome', 'search', 'donate', 'contact', 'credits', 'goods', 'kit', 'merch-ptr2'];

function goToRandomPage() {
  var pool = PARAPPA_PAGE_IDS.filter(function(id) { return PARAPPA_RANDOM_EXCLUDED.indexOf(id) === -1; });
  window.location.href = pageUrl(pool[Math.floor(Math.random() * pool.length)]);
}

// Old deep links pointed at the home page with a hash (index.html#merch-ptr-plush).
// Send those on to the page's own file.
(function redirectOldHashLinks() {
  try {
    var hashId = (window.location.hash || '').replace(/^#/, '');
    if (!hashId || document.getElementById('page-' + hashId)) return;
    if (PARAPPA_PAGE_IDS.indexOf(hashId) !== -1) window.location.replace(pageUrl(hashId));
  } catch (e) {}
})();

// Light up the top-level nav button whose menu holds the current page (the
// welcome page shows none, as before).
(function markActiveNav() {
  try {
    var page = document.querySelector('.page.active');
    if (!page) return;
    var id = page.id.replace(/^page-/, '');
    if (id === 'welcome') return;
    var trigger = document.querySelector('.nav-bar a[href="' + pageUrl(id) + '"], .nav-bar button[onclick*="showPage(\'' + id + '\'"]');
    var navItem = trigger && trigger.closest('.nav-item');
    var topBtn = navItem && navItem.querySelector(':scope > button');
    if (topBtn) {
      document.querySelectorAll('.nav-item > button').forEach(function(b) { b.classList.remove('active'); });
      topBtn.classList.add('active');
    }
  } catch (e) {}
})();

// Previous / Next buttons at the bottom of each page, stepping through the
// pages of the nav menu the current page sits in (in menu order, running on
// through its submenus). The event reports have no menu of their own, so they
// follow the order of the list on the Events page.
var PARAPPA_EVENT_PAGES = [
  { id: 'gal-events2',    en: 'Events',                          ja: 'イベント' },
  { id: 'ev-tgs1996',     en: 'Tokyo Game Show 1996',            ja: '東京ゲームショウ1996' },
  { id: 'ev-psexpo96',    en: "PlayStation Expo '96",            ja: "プレイステーション・エキスポ'96" },
  { id: 'ev-bellfare',    en: 'Roppongi Bellfare Exhibition',    ja: '六本木ベルファーレ エキシビジョン' },
  { id: 'ev-roxy1999',    en: 'Live At The Roxy',                ja: 'ライブ・アット・ザ・ロキシー' },
  { id: 'ev-amshow1999',  en: 'JAMMA AM Show 1999',              ja: 'JAMMA AMショー1999' },
  { id: 'ev-tgs1999',     en: 'Tokyo Game Show 1999',            ja: '東京ゲームショウ1999' },
  { id: 'ev-rodneyparco', en: 'Rodney Character Club PARCO 2000', ja: 'ロドニー・キャラクター・クラブ PARCO 2000' },
  { id: 'ev-hohoho2000', en: "Rodney's HoHoHo! at Tokyo Dome City", ja: "東京ドームシティ★クリスマス Rodney's HoHoHo!" },
  { id: 'ev-seasidefuji2001', en: 'PaRappa Seaside GO! in Fuji TV', ja: 'パラッパラッパー・シーサイドGO！ in フジテレビ' },
  { id: 'ev-fukuoka2001', en: 'PaRappa the Rapper in Fukuoka',   ja: 'パラッパラッパー in FUKUOKA' }
];

(function addPagePager() {
  try {
    var page = document.querySelector('.page.active');
    if (!page) return;
    var id = page.id.replace(/^page-/, '');

    function textOf(el, cls) {
      var span = el && el.querySelector(':scope > .' + cls);
      return span ? span.textContent.trim() : '';
    }

    // The ordered list of { href, en, ja } this page steps through.
    var list = [];
    var link = document.querySelector('.nav-bar .dropdown a[href="' + pageUrl(id) + '"]');
    if (link) {
      link.closest('.nav-item > .dropdown').querySelectorAll('a[href]').forEach(function(a) {
        var en = textOf(a, 'en'), ja = textOf(a, 'ja');
        // Name submenu pages after their submenu too ("RodneyFun — Toys"), as
        // several submenus share page names like "Shirts".
        var sub = a.closest('.submenu');
        var label = sub && sub.querySelector(':scope > .submenu-label');
        if (label) {
          en = textOf(label, 'en') + ' — ' + en;
          ja = textOf(label, 'ja') + ' — ' + ja;
        }
        list.push({ href: a.getAttribute('href'), en: en, ja: ja });
      });
    } else {
      PARAPPA_EVENT_PAGES.forEach(function(p) {
        list.push({ href: pageUrl(p.id), en: p.en, ja: p.ja });
      });
    }

    var i = -1;
    list.forEach(function(p, n) { if (p.href === pageUrl(id)) i = n; });
    if (i === -1 || list.length < 2) return;

    function button(p, dir) {
      var a = document.createElement('a');
      a.className = 'pager-btn pager-' + dir;
      a.href = p.href;
      var isPrev = dir === 'prev';
      var dirEn = isPrev ? '← Previous' : 'Next →';
      var dirJa = isPrev ? '← 前へ' : '次へ →';
      a.innerHTML =
        '<span class="pager-dir"><span class="en"></span><span class="ja"></span></span>' +
        '<span class="pager-name"><span class="en"></span><span class="ja"></span></span>';
      var spans = a.querySelectorAll('.en, .ja');
      spans[0].textContent = dirEn;
      spans[1].textContent = dirJa;
      spans[2].textContent = p.en;
      spans[3].textContent = p.ja;
      // the artwork already says "Pre" / "Next", so the button keeps only the page name
      a.removeChild(a.querySelector('.pager-dir'));
      // Sunny pointing back ("Pre") on the Previous button's left end, PaRappa
      // running off with a "Next" arrow on the Next button's right end
      var mascot = document.createElement('img');
      mascot.className = 'pager-mascot';
      mascot.src = isPrev ? 'Parappa%20Site/Welcome/snext%20-%20Copy.png' : 'Parappa%20Site/Welcome/pnext%20-%20Copy.png';
      mascot.alt = '';
      mascot.setAttribute('aria-hidden', 'true');
      a.appendChild(mascot);
      // Lammy mode swaps Sunny and PaRappa for just their arrows (each cut
      // from the same canvas, so it sits in the same spot)
      var arrow = document.createElement('img');
      arrow.className = 'pager-mascot pager-arrow';
      arrow.src = isPrev ? 'LammyStuff/bluearrow.png' : 'LammyStuff/redarrow.png';
      arrow.alt = '';
      arrow.setAttribute('aria-hidden', 'true');
      a.appendChild(arrow);
      // ...with Kat standing beside the Previous arrow and Lamster beside the
      // Next one
      var buddy = document.createElement('img');
      buddy.className = isPrev ? 'pager-kat' : 'pager-lamster';
      buddy.src = isPrev ? 'LammyStuff/kat.png' : 'LammyStuff/lamster.png';
      buddy.alt = '';
      buddy.setAttribute('aria-hidden', 'true');
      a.appendChild(buddy);
      var label = document.createElement('span');
      label.className = 'pager-mascot-label';
      label.textContent = isPrev ? 'Previous' : 'Next';
      label.setAttribute('aria-hidden', 'true');
      a.appendChild(label);
      return a;
    }

    var pager = document.createElement('nav');
    pager.className = 'page-pager';
    pager.setAttribute('aria-label', 'Page navigation');
    if (i > 0) pager.appendChild(button(list[i - 1], 'prev'));
    if (i < list.length - 1) pager.appendChild(button(list[i + 1], 'next'));
    page.appendChild(pager);
  } catch (e) {}
})();

var isLammy = false;
// PaRappa-mode title markup (an SVG, see the header) captured from the page so it can be restored after Lammy mode.
var parappaLogo = document.getElementById('siteLogo').innerHTML;
// This page's own <title>, so Lammy mode can swap the site name in it and back.
var parappaTitle = document.title;

function applyTheme(lammy) {
  isLammy = lammy;
  var btn = document.getElementById('themeBtn');
  var logo = document.getElementById('siteLogo');
  var subtitle = document.getElementById('siteSubtitle');
  var favicon = document.getElementById('favicon');
  var faviconShortcut = document.getElementById('favicon-shortcut');
  var iconHref = isLammy ? 'lamster.png' : 'par.png';
  if (favicon) favicon.href = iconHref;
  if (faviconShortcut) faviconShortcut.href = iconHref;
  if (isLammy) {
    document.body.classList.add('theme-lammy');
    if (window.fitTextSvgs) window.fitTextSvgs();
    btn.innerHTML = '<span class="theme-btn-label">PARAPPA MODE</span>';
    // translate="no" + notranslate: Google Translate and similar tools leave the title as-is.
    logo.innerHTML = '<span class="en notranslate" translate="no"><span class="lammy-title-now"><span class="nav-umjammer">Um Jammer</span> <span class="nav-lammy">LAMMY</span></span></span><span class="ja"><img class="lammy-logo-jp" src="LammyStuff/Renders/logoujl.png" alt="ウンジャマ・ラミー"></span>';
    document.title = parappaTitle.indexOf('PaRappa Corner \u2014') === 0
      ? 'Um Jammer Lammy \u2014 PaRappa Corner'
      : parappaTitle.replace('PaRappa Corner', 'Um Jammer Lammy');
  } else {
    document.body.classList.remove('theme-lammy');
    btn.innerHTML = '<span class="theme-btn-label">LAMMY MODE</span>';
    logo.innerHTML = parappaLogo;
    if (window.fitTextSvgs) window.fitTextSvgs();
    document.title = parappaTitle;
  }
}

function toggleTheme() {
  applyTheme(!isLammy);
  try { localStorage.setItem('parappaLammyMode', isLammy ? '1' : '0'); } catch (e) {}
}

// Restore the theme on load so refresh doesn't revert Lammy mode back to PaRappa mode.
(function restoreTheme() {
  try {
    if (localStorage.getItem('parappaLammyMode') === '1') {
      applyTheme(true);
    }
  } catch (e) {}
})();

// ── Lightbox: click any image to view it full size, navigate within section ──
(function setupLightbox() {
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var closeBtn = document.getElementById('lightboxClose');
  var prevBtn = document.getElementById('lightboxPrev');
  var nextBtn = document.getElementById('lightboxNext');
  if (!lightbox || !lightboxImg || !closeBtn) return;

  var currentList = [];
  var currentIndex = -1;

  var navDisabledPages = {
    'page-welcome': 1, 'page-search': 1, 'page-donate': 1, 'page-contact': 1, 'page-credits': 1,
    'page-aboutgame': 1, 'page-aboutrodney': 1,
    'page-aboutmatsuura': 1, 'page-aboutvoiceactors': 1,
    'page-chars': 1, 'page-chars-ujl': 1, 'page-chars-ptr2': 1,
    'page-milkcan': 1, 'page-videos': 1, 'page-sp-websites': 1
  };

  function collectSectionImages(img) {
    var page = img.closest('.page');
    if (page && navDisabledPages[page.id]) return [img];
    var section = img.closest('.doc-viewer') || img.closest('.ujl-gallery') || page || document.body;
    var nodes = section.querySelectorAll('img');
    var list = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.closest('.lightbox')) continue;
      if (n.closest('.yt-facade')) continue;
      if (n.closest('.page-banner')) continue;
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
    lightboxImg.src = img.getAttribute('data-full') || img.currentSrc || img.src;
    unzoom();
    lightboxImg.alt = img.alt || '';
    // Small originals can ask to open enlarged: data-lightbox-scale="2" shows
    // the image at twice its own pixel size (still capped to the viewport).
    var scale = parseFloat(img.getAttribute('data-lightbox-scale'));
    if (scale > 0 && img.naturalWidth) {
      lightboxImg.style.setProperty('--lb-width', Math.round(img.naturalWidth * scale) + 'px');
      lightboxImg.classList.add('lb-scaled');
    } else {
      lightboxImg.classList.remove('lb-scaled');
      lightboxImg.style.removeProperty('--lb-width');
    }
    var multi = currentList.length > 1;
    if (prevBtn) prevBtn.style.display = multi ? '' : 'none';
    if (nextBtn) nextBtn.style.display = multi ? '' : 'none';
  }

  function openLightbox(img) {
    currentList = collectSectionImages(img);
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


  // ── Click-to-zoom: each click on the full-size image steps through three
  //    zoom levels (2x, 3x, 4x the fitted size) around the clicked spot; drag
  //    or scroll to pan; a fourth click, changing image, or closing zooms back
  //    out. ──
  var ZOOM_LEVELS = [2, 3, 4];
  var zoomLevel = 0, baseWidth = 0;
  var zoomed = false, dragging = false, dragMoved = false, dragX = 0, dragY = 0, dragSL = 0, dragST = 0;
  function unzoom() {
    zoomed = false;
    zoomLevel = 0;
    lightbox.classList.remove('zoomed');
    lightbox.classList.remove('zoom-max');
    lightbox.classList.remove('dragging');
    lightboxImg.style.width = '';
    lightbox.scrollTop = 0;
    lightbox.scrollLeft = 0;
  }
  function zoomAt(clientX, clientY) {
    var r = lightboxImg.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var fx = (clientX - r.left) / r.width, fy = (clientY - r.top) / r.height;
    if (!zoomed) baseWidth = r.width;
    zoomLevel++;
    var target = Math.round(baseWidth * ZOOM_LEVELS[zoomLevel - 1]);
    zoomed = true;
    lightbox.classList.add('zoomed');
    lightbox.classList.toggle('zoom-max', zoomLevel === ZOOM_LEVELS.length);
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
    if (zoomLevel >= ZOOM_LEVELS.length) unzoom(); else zoomAt(e.clientX, e.clientY);
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

  document.addEventListener('click', function(e) {
    var target = e.target;
    if (target && target.tagName === 'IMG' && !target.closest('.lightbox') && !target.closest('.yt-facade') && !target.closest('.page-banner') && !target.closest('a')) {
      e.preventDefault();
      openLightbox(target);
    }
  });

  closeBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeLightbox();
  });

  if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); prevImage(); });
  if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); nextImage(); });

  lightbox.addEventListener('click', function(e) {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', function(e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') nextImage();
    else if (e.key === 'ArrowLeft') prevImage();
  });
})();

// ── Document viewer: the black page button beside a scan opens its transcription as a paper document ──
(function setupDocViewer() {
  var openViewer = null;
  function closeDoc(v) {
    v.classList.remove('open');
    v.setAttribute('aria-hidden', 'true');
    if (openViewer === v) openViewer = null;
  }
  document.querySelectorAll('.doc-btn[data-doc]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var v = document.getElementById(btn.getAttribute('data-doc'));
      if (!v) return;
      v.classList.add('open');
      v.setAttribute('aria-hidden', 'false');
      openViewer = v;
      var c = v.querySelector('.doc-close');
      if (c) c.focus();
    });
  });
  document.querySelectorAll('.doc-viewer').forEach(function (v) {
    var c = v.querySelector('.doc-close');
    if (c) c.addEventListener('click', function (e) { e.stopPropagation(); closeDoc(v); });
    v.addEventListener('click', function (e) { if (e.target === v) closeDoc(v); });
  });
  // Capture phase, so a page zoomed into the lightbox from a viewer closes first and the viewer stays open
  document.addEventListener('keydown', function (e) {
    if (openViewer && e.key === 'Escape' && !document.querySelector('.lightbox.open')) closeDoc(openViewer);
  }, true);
})();

(function () {
  function activateFacade(facade) {
    var videoId = facade.getAttribute('data-video-id');
    if (!videoId) return;
    var startAt = parseInt(facade.getAttribute('data-start'), 10) || 0;
    var title = facade.getAttribute('data-title') || 'YouTube video';
    var origin = (window.location.protocol === 'http:' || window.location.protocol === 'https:') ? window.location.origin : '';
    var src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?autoplay=1&rel=0&enablejsapi=1' + (origin ? '&origin=' + encodeURIComponent(origin) : '') + '&start=' + startAt;
    var iframe = document.createElement('iframe');
    // Always start at the beginning (or at data-start): YouTube otherwise
    // resumes a signed-in viewer where they last stopped watching. The URL
    // carries an explicit start, and once the player has loaded it is also
    // told to seek there in case the resume point won over start=0.
    iframe.addEventListener('load', function () {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [startAt, true] }), 'https://www.youtube.com');
      } catch (err) {}
    });
    iframe.setAttribute('width', '800');
    iframe.setAttribute('height', '450');
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
    if (facade) {
      e.preventDefault();
      activateFacade(facade);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var active = document.activeElement;
    if (active && active.classList && active.classList.contains('yt-facade')) {
      e.preventDefault();
      activateFacade(active);
    }
  });
})();

(function () {
  var form = document.getElementById('searchForm');
  var input = document.getElementById('searchInput');
  var results = document.getElementById('searchResults');
  if (!form || !input || !results) return;

  // Every section is its own HTML page, so the other pages' text isn't in this
  // document. parappa-search-index.js (built by scripts/build_search_index.py,
  // loaded only by search.html) carries each page's title and visible text in
  // both languages, plus the page / unique image / unique video counts. The
  // Vib-Ribbon section and the HOME menu pages are not counted.
  var index = window.PARAPPA_SEARCH_INDEX || { pages: [], totalPages: 0, imageCount: 0, videoCount: 0 };

  (function () {
    function formatNum(n) {
      return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    function setCount(ids, n) {
      ids.forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.textContent = formatNum(n);
      });
    }
    setCount(['searchCountNum', 'searchCountNumJa'], index.totalPages);
    setCount(['searchImgNum', 'searchImgNumJa'], index.imageCount);
    setCount(['searchVidNum', 'searchVidNumJa'], index.videoCount);
  })();

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getVisibleText(page) {
    var isJp = document.body.classList.contains('lang-jp');
    return (isJp ? page.textJa : page.textEn) || '';
  }

  function extractSnippets(text, queryLower, maxCount) {
    var snippets = [];
    var textLower = text.toLowerCase();
    var from = 0;
    var contextLen = 55;
    while (snippets.length < maxCount) {
      var idx = textLower.indexOf(queryLower, from);
      if (idx === -1) break;
      var start = Math.max(0, idx - contextLen);
      var end = Math.min(text.length, idx + queryLower.length + contextLen);
      var snippet = text.substring(start, end).trim();
      if (start > 0) snippet = '…' + snippet;
      if (end < text.length) snippet = snippet + '…';
      snippets.push(snippet);
      from = idx + queryLower.length + contextLen;
    }
    return snippets;
  }

  function highlightSnippet(snippet, query) {
    var escaped = escapeHtml(snippet);
    var pattern = new RegExp('(' + escapeRegex(escapeHtml(query)) + ')', 'gi');
    return escaped.replace(pattern, '<mark>$1</mark>');
  }

  function performSearch() {
    var query = input.value.trim();
    var queryLower = query.toLowerCase();
    results.innerHTML = '';
    if (!query) return;

    var matches = [];
    index.pages.forEach(function (page) {
      if (page.id === 'search') return;

      var visibleText = getVisibleText(page);
      if (visibleText.toLowerCase().indexOf(queryLower) === -1) return;

      matches.push({
        id: page.id,
        en: page.en,
        ja: page.ja || page.en,
        snippets: extractSnippets(visibleText, queryLower, 2)
      });
    });

    if (matches.length === 0) {
      results.innerHTML = '<div class="search-no-results"><span class="en">No results found.</span><span class="ja">該当する結果がありません。</span></div>';
      return;
    }

    var html = '<div class="search-results-count"><span class="en">' + matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' found</span><span class="ja">' + matches.length + ' 件の結果</span></div><ul class="search-results-list">';
    matches.forEach(function (m) {
      html += '<li><a href="' + escapeHtml(pageUrl(m.id)) + '" class="search-result" data-page-id="' + escapeHtml(m.id) + '">';
      html += '<span class="search-result-title"><span class="en">' + escapeHtml(m.en) + '</span><span class="ja">' + escapeHtml(m.ja) + '</span></span>';
      if (m.snippets.length) {
        html += '<span class="search-result-snippets">';
        m.snippets.forEach(function (snip) {
          html += '<span class="search-snippet">' + highlightSnippet(snip, query) + '</span>';
        });
        html += '</span>';
      }
      html += '</a></li>';
    });
    html += '</ul>';
    results.innerHTML = html;

    // Results are plain links to each page's own file.
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); performSearch(); });
  input.addEventListener('input', performSearch);
})();

(function () {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('.region-btn[data-region]');
    if (!btn) return;
    var container = btn.closest('.ujl-cabinet-img');
    if (!container) return;
    var img = container.querySelector('.region-img');
    if (!img) return;
    var region = btn.getAttribute('data-region');
    var src = img.getAttribute('data-' + region);
    if (src) {
      img.src = src;
    } else {
      img.src = img.getAttribute('data-default') || img.src;
    }
    container.querySelectorAll('.region-btn').forEach(function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
})();

// ── Video reset on page switch: any video the user was watching is fully reset when leaving the page ──
(function setupVideoReset() {
  // Track facade -> snapshot of original facade markup, so we can swap an active YouTube iframe back to its facade.
  var iframeToFacade = new WeakMap();

  function watchFacadeReplacement(facade) {
    var parent = facade.parentNode;
    if (!parent) return;
    var snapshot = facade.cloneNode(true);
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType === 1 && node.tagName === 'IFRAME') {
            iframeToFacade.set(node, snapshot);
            observer.disconnect();
            return;
          }
        }
      }
    });
    observer.observe(parent, { childList: true });
  }

  // Capture phase so we register before the existing handler replaces the facade.
  document.addEventListener('click', function (e) {
    var facade = e.target.closest && e.target.closest('.yt-facade');
    if (facade) watchFacadeReplacement(facade);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var active = document.activeElement;
    if (active && active.classList && active.classList.contains('yt-facade')) {
      watchFacadeReplacement(active);
    }
  }, true);

  function resetAll() {
    document.querySelectorAll('video').forEach(function (v) {
      try { v.pause(); } catch (e) {}
      try { v.currentTime = 0; } catch (e) {}
      try { v.load(); } catch (e) {}
    });
    document.querySelectorAll('iframe[src*="youtube.com/embed"]').forEach(function (ifr) {
      var facade = iframeToFacade.get(ifr);
      if (facade && ifr.parentNode) {
        ifr.parentNode.replaceChild(facade, ifr);
      } else if (ifr.parentNode) {
        try { ifr.src = 'about:blank'; } catch (e) {}
      }
    });
  }

  if (typeof window.showPage === 'function') {
    var originalShowPage = window.showPage;
    window.showPage = function () {
      resetAll();
      return originalShowPage.apply(this, arguments);
    };
  }
})();
// ──────────────────────────────────────────────────────────────────────────
// Draw the PaRappa-mode squiggle frame as ONE shape instead of a patchwork of
// tiles. The frame used to be ten separate translucent-pink pieces (corner
// joints, wave runs, header and nav backgrounds); wherever two of them met on a
// fractional pixel (html is zoomed to 0.8, so that's almost everywhere) the
// shared pixel was only partly covered by each and the background pattern
// showed through as a thin light seam. Now:
//   ::before — a single closed path (frame outline + everything inside it),
//              pink down to the nav's bottom edge then white, behind content;
//   ::after  — a single continuous stroke for the visible purple border.
// The header and nav go transparent so the pink comes only from that one
// fill. The tiled CSS backgrounds remain as the no-JS fallback.
(function () {
  var wrap = document.querySelector('.site-wrap');
  var nav = document.querySelector('.nav-bar');
  if (!wrap || !nav) return;

  function r(n) { return Math.round(n * 100) / 100; }

  // Target length of one half-period (base line to peak and back is two of
  // these), in CSS px. Each run gets as many curls as fit at this spacing, so
  // long pages get more curls instead of the same few stretched out.
  var HALF_WAVE = 82;

  // Cubic segments for one wave run along `axis` ('x' or 'y'), starting at
  // `start` on the base line and travelling `len` (may be negative), swinging
  // between `base` and `peak` on the other axis. The half-period count is kept
  // even so every run ends back on the base line where the corner joints meet,
  // and rounded down so curls are never closer together than HALF_WAVE (on the
  // short top/bottom runs, rounding to nearest could leave them unchanged).
  function wave(axis, start, len, base, peak) {
    var d = '';
    var n = Math.max(2, 2 * Math.floor(Math.abs(len) / (2 * HALF_WAVE)));
    var step = len / n;
    for (var i = 0; i < n; i++) {
      var pos = start + step * i;
      var from = i % 2 === 0 ? base : peak;
      var to = i % 2 === 0 ? peak : base;
      var mid = pos + step / 2;
      var end = pos + step;
      d += axis === 'x'
        ? ' C ' + r(mid) + ' ' + r(from) + ' ' + r(mid) + ' ' + r(to) + ' ' + r(end) + ' ' + r(to)
        : ' C ' + r(from) + ' ' + r(mid) + ' ' + r(to) + ' ' + r(mid) + ' ' + r(to) + ' ' + r(end);
    }
    return d;
  }

  function svgUrl(W, H, body) {
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='" + r(W + 80) + "' height='" + r(H + 80) +
      "' viewBox='0 0 " + r(W + 80) + ' ' + r(H + 80) + "' preserveAspectRatio='none'>" + body + '</svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  function update() {
    if (document.body.classList.contains('theme-lammy')) return;
    // Used size in the wrap's own CSS px (unaffected by the html zoom), so the
    // 40px frame margins in the SVG line up with the pseudo-elements' -40px.
    var cs = getComputedStyle(wrap);
    var W = parseFloat(cs.width);
    var H = parseFloat(cs.height);
    if (!(W > 0 && H > 0)) return;
    var wrapRect = wrap.getBoundingClientRect();
    var navRect = nav.getBoundingClientRect();
    var navY = 40 + (navRect.bottom - wrapRect.top) / wrapRect.height * H;

    var R = W + 40;  // x of the right run's inner edge
    var B = H + 40;  // y of the bottom run's inner edge

    // Pieces of the outline, clockwise from the top-left corner joint.
    var tlJoint = 'M 20 40 L 20 30 L 16 16 L 30 20 L 40 20';
    var top = wave('x', 40, W, 20, 2);
    var trJoint = ' L ' + r(R + 10) + ' 20 L ' + r(R + 24) + ' 16 L ' + r(R + 20) + ' 30 L ' + r(R + 20) + ' 40';
    var right = wave('y', 40, H, R + 20, R + 38);
    var brJoint = ' L ' + r(R + 20) + ' ' + r(B + 10) + ' L ' + r(R + 24) + ' ' + r(B + 24) +
                  ' L ' + r(R + 10) + ' ' + r(B + 20) + ' L ' + r(R) + ' ' + r(B + 20);
    var bottom = wave('x', R, -W, B + 20, B + 38);
    var blJoint = ' L 30 ' + r(B + 20) + ' L 16 ' + r(B + 24) + ' L 20 ' + r(B + 10) + ' L 20 ' + r(B);
    var left = wave('y', B, -H, 20, 2);

    // Gradient stops down the frame: pink to the nav's bottom, then white —
    // except where a page marks a full-width band with data-frame-band="TOP
    // BOTTOM" (e.g. the Lipton header). There the frame margin repeats that
    // band's vertical gradient over its padding box, then its bottom border
    // colour over the border, so the band runs out to the wavy edge seamlessly.
    var total = H + 80;
    var stops = [[0, '#ff14c8', 0.7], [navY, '#ff14c8', 0.7], [navY, '#fff', 1]];
    var bands = document.querySelectorAll('[data-frame-band]');
    for (var b = 0; b < bands.length; b++) {
      var el = bands[b];
      if (!el.offsetParent) continue;  // hidden page
      // "TOP BOTTOM", or a CSS-style stop list "COLOR PCT%, COLOR PCT%, ..."
      // (stops without a percentage are spread evenly).
      var spec = el.getAttribute('data-frame-band').trim();
      var parts = spec.indexOf(',') >= 0 ? spec.split(/\s*,\s*/) : spec.split(/\s+/);
      var br = el.getBoundingClientRect();
      var ecs = getComputedStyle(el);
      var bw = parseFloat(ecs.borderBottomWidth) || 0;
      var y1 = 40 + (br.top - wrapRect.top) / wrapRect.height * H;
      var y2 = 40 + (br.bottom - wrapRect.top) / wrapRect.height * H;
      stops.push([y1, '#fff', 1]);
      for (var p = 0; p < parts.length; p++) {
        var m = parts[p].split(/\s+/);
        var pct = m[1] ? parseFloat(m[1]) / 100 : (parts.length > 1 ? p / (parts.length - 1) : 0);
        stops.push([y1 + (y2 - bw - y1) * pct, m[0], 1]);
      }
      if (bw > 0) stops.push([y2 - bw, ecs.borderBottomColor, 1], [y2, ecs.borderBottomColor, 1]);
      stops.push([y2, '#fff', 1]);
    }
    stops.push([total, '#fff', 1]);
    var stopTags = '';
    for (var s = 0; s < stops.length; s++) {
      stopTags += "<stop offset='" + Math.min(1, Math.max(0, stops[s][0] / total)).toFixed(6) +
        "' stop-color='" + stops[s][1] + "'" + (stops[s][2] < 1 ? " stop-opacity='" + stops[s][2] + "'" : '') + '/>';
    }

    var fill =
      "<defs><linearGradient id='g' gradientUnits='userSpaceOnUse' x1='0' y1='0' x2='0' y2='" + r(total) + "'>" +
        stopTags +
      '</linearGradient></defs>' +
      "<path fill='url(#g)' d='" + tlJoint + top + trJoint + right + brJoint + bottom + blJoint + left + " Z'/>";

    // Visible border: from the bottom-left joint's pointed tip, up the left
    // side, across the top, and out to the top-right joint's pointed tip. Both
    // ends stop 1px short of their tips so the bottom and right sides stay
    // clear. Butt caps match the old tiles, which clipped their round caps
    // flat at the tile edge.
    var trim = 1 / Math.sqrt(212);  // 1px along the joints' (14, 4) tip segments
    var stroke =
      "<path fill='none' stroke='#6B3B66' stroke-width='8' stroke-linejoin='miter' stroke-miterlimit='20' stroke-linecap='butt' d='" +
      'M ' + r(16 + 4 * trim) + ' ' + r(B + 24 - 14 * trim) + ' L 20 ' + r(B + 10) + ' L 20 ' + r(B) +
      left + ' L 20 30 L 16 16 L 30 20 L 40 20' + top +
      ' L ' + r(R + 10) + ' 20 L ' + r(R + 24 - 14 * trim) + ' ' + r(16 + 4 * trim) + "'/>";

    wrap.style.setProperty('--frame-fill', svgUrl(W, H, fill));
    wrap.style.setProperty('--frame-stroke', svgUrl(W, H, stroke));
    wrap.classList.add('frame-svg');
  }
  update();
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(nav);
  }
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(update).observe(document.body,
      { attributes: true, attributeFilter: ['class'] });
  }
})();
// ──────────────────────────────────────────────────────────────────────────
(function () {
  var link = document.querySelector('.vibri-link');
  if (!link) return;

  var SPINDLE = 'M 0,-46 L 1.2,0 L 0,46 L -1.2,0 Z';
  var STARS = [
    '<svg viewBox="-50 -50 100 100"><g fill="#7FBFFF">'
      + '<path d="' + SPINDLE + '"/>'
      + '<path d="' + SPINDLE + '" transform="rotate(60)"/>'
      + '<path d="' + SPINDLE + '" transform="rotate(120)"/>'
      + '</g></svg>',
    '<svg viewBox="-50 -50 100 100"><g fill="#FF9999">'
      + '<path d="' + SPINDLE + '"/>'
      + '<path d="' + SPINDLE + '" transform="rotate(45)"/>'
      + '<path d="' + SPINDLE + '" transform="rotate(90)"/>'
      + '<path d="' + SPINDLE + '" transform="rotate(135)"/>'
      + '</g></svg>',
    '<svg viewBox="-50 -50 100 100"><g fill="#ffffff">'
      + '<path d="M 0,-48 L 1.5,0 L 0,48 L -1.5,0 Z"/>'
      + '<path d="' + SPINDLE + '" transform="rotate(60)"/>'
      + '<path d="' + SPINDLE + '" transform="rotate(120)"/>'
      + '</g></svg>'
  ];

  function spawnBursts() {
    var count = 3 + Math.floor(Math.random() * 2);
    // Vibri sits at bottom-right of the viewport; confine bursts to the
    // upper-left quadrant (angle ∈ [π, 3π/2]) so they never overflow the screen.
    var quadrantStart = Math.PI;
    var quadrantSpan = Math.PI / 2;
    var jitter = quadrantSpan / count * 0.4;
    for (var i = 0; i < count; i++) {
      var star = document.createElement('div');
      star.className = 'vibri-starburst';
      star.innerHTML = STARS[Math.floor(Math.random() * STARS.length)];
      var size = 16 + Math.random() * 14;
      var angle = quadrantStart + quadrantSpan * (i + 0.5) / count + (Math.random() * 2 - 1) * jitter;
      var radius = 55 + Math.random() * 20;
      var x = 50 + radius * Math.cos(angle);
      var y = 50 + radius * Math.sin(angle);
      star.style.width = size + 'px';
      star.style.height = size + 'px';
      star.style.left = x + '%';
      star.style.top = y + '%';
      star.style.animationDelay = (Math.random() * 0.25) + 's';
      link.appendChild(star);
      star.addEventListener('animationend', function () { this.remove(); });
    }
  }

  link.addEventListener('mouseenter', spawnBursts);
})();
// ──────────────────────────────────────────────────────────────────────────
(function () {
  var root = document.documentElement;
  // devicePixelRatio at 100% browser zoom is our 1.0 reference: every later
  // zoom change moves it proportionally. The reference is remembered in
  // localStorage so a refresh while zoomed keeps the same zoom percentage
  // instead of treating the zoomed-in ratio as the new baseline. The very
  // first visit establishes the reference from whatever zoom the page loads at.
  var STORAGE_KEY = 'parappaZoomBaseDpr';
  var baseDpr = window.devicePixelRatio || 1;
  try {
    var savedBase = parseFloat(localStorage.getItem(STORAGE_KEY));
    if (isFinite(savedBase) && savedBase > 0) {
      baseDpr = savedBase;
    } else {
      localStorage.setItem(STORAGE_KEY, String(baseDpr));
    }
  } catch (e) {}
  var vv = window.visualViewport || null;

  function update() {
    var pinch = vv ? (vv.scale || 1) : 1;
    var zoom = ((window.devicePixelRatio || 1) / baseDpr) * pinch;
    if (!isFinite(zoom) || zoom <= 0) zoom = 1;

    var dx = 0, dxRight = 0, dy = 0;
    if (vv) {
      // Bottom-left / bottom-right of the visible viewport, expressed in
      // layout-viewport CSS pixels.
      dx = vv.offsetLeft;
      dxRight = vv.offsetLeft + vv.width - window.innerWidth;
      dy = vv.offsetTop + vv.height - window.innerHeight;
    }

    root.style.setProperty('--zoom-fix', (1 / zoom).toFixed(5));
    root.style.setProperty('--zoom-dx', dx.toFixed(2) + 'px');
    root.style.setProperty('--zoom-dx-right', dxRight.toFixed(2) + 'px');
    root.style.setProperty('--zoom-dy', dy.toFixed(2) + 'px');
  }

  update();
  window.addEventListener('resize', update);
  window.addEventListener('orientationchange', update);
  if (vv) {
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
  }
})();
// ──────────────────────────────────────────────────────────────────────────
// Size each SVG text label (site title, corner button) to its real text width
// once the web font is in. Exposed so the theme switch can re-run it after it
// re-inserts the title markup.
window.fitTextSvgs = function () {
  document.querySelectorAll('svg.fit-text').forEach(function (svg) {
    var txt = svg.querySelector('text');
    if (!txt) return;
    try { svg.setAttribute('width', Math.ceil(txt.getBBox().width)); } catch (e) {}
    // Corner button: fit the Lammy-mode oval to the "Corner" word. Runs in
    // both modes (the oval is display:none outside Lammy mode) and again on
    // theme toggle, since the word gap is wider in Lammy mode.
    var pill = svg.querySelector('.corner-pill');
    var word = svg.querySelector('.corner-label-front .corner-word-corner');
    if (!pill || !word) return;
    try {
      var b = word.getBBox();
      var cx = b.x + b.width / 2, rx = b.width / 2 + 8;
      pill.setAttribute('cx', cx.toFixed(2));
      pill.setAttribute('cy', (b.y + b.height * 0.46).toFixed(2));
      pill.setAttribute('rx', rx.toFixed(2));
      pill.setAttribute('ry', '12');
      // In Lammy mode the oval overhangs the text; widen the SVG so the
      // button's right padding sits after the oval, not after the text.
      if (document.body.classList.contains('theme-lammy')) {
        svg.setAttribute('width', Math.max(+svg.getAttribute('width'), Math.ceil(cx + rx + 1)));
      }
    } catch (e) {}
  });
};
if (document.fonts) document.fonts.ready.then(window.fitTextSvgs);
// ──────────────────────────────────────────────────────────────────────────
/* Back-to-top button: visible past 50% of the page's scrollable distance. */
(function () {
  var btn = document.getElementById('backToTop');
  if (!btn) return;

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
// ──────────────────────────────────────────────────────────────────────────
// Lammy mode: a strip of MilkCan foil wrapper (LammyStuff/wrappers-tile.png)
// running along the underside of the chocolate-bar site box, forming the
// very bottom of the page. Added here so every page gets it; CSS only shows
// it in Lammy mode.
(function () {
  var wrap = document.querySelector('.site-wrap');
  if (!wrap) return;
  var foil = document.createElement('div');
  foil.className = 'lammy-foil';
  foil.setAttribute('aria-hidden', 'true');
  wrap.appendChild(foil);
})();

// MilkCan page: SHOUT! board capture buttons. Each button shows only the
// messages from its Wayback capture; the page starts on the earliest one.
// Without this script every capture stays visible.
(function shoutCaptureButtons() {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.shout-tabs .shout-tab'));
  if (!tabs.length) return;
  function select(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      t.classList.toggle('active', on);
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var j = -1;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') j = 0;
      else if (e.key === 'End') j = tabs.length - 1;
      if (j < 0) return;
      e.preventDefault();
      select(tabs[j], true);
    });
  });
  select(tabs[0]);
})();
