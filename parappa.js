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
  'merch-rodneyfun-stationary', 'merch-rodneyfun-promotional',
  'merch-ptr-plush', 'merch-ptr-figures', 'merch-ptr-shirts', 'merch-ptr-misc',
  'merch-ujl-plush', 'merch-ujl-figures', 'merch-ujl-keychains', 'merch-ujl-shirts',
  'merch-ujl-milkcantour', 'merch-ujl-fernandes', 'merch-ujl-stationery', 'merch-ujl-misc',
  'merch-ptr2', 'merch-anime', 'merch-mcdonalds', 'merch-dunkin', 'merch-lipton', 'merch-catalogs',
  'gal-magazines', 'gal-stratguides', 'gal-shelves', 'gal-earlydesigns',
  'gal-officialart-ptr', 'gal-officialart-ujl', 'gal-events2',
  'ev-tgs1996', 'ev-psexpo96', 'ev-bellfare', 'ev-tgs1999', 'ev-roxy1999',
  'ev-amshow1999', 'ev-fukuoka2001', 'ev-rodneyparco',
  'sp-presskits', 'sp-promos', 'sp-prototypes', 'sp-websites', 'sp-crashad',
  'sp-physical', 'sp-mascots',
  'lammynow', 'ujlnow-cabinet', 'ujlnow-prize', 'ujlnow-discovery',
  'milkcan', 'videos', 'collections', 'goods', 'kit'
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
      return a;
    }

    var pager = document.createElement('nav');
    pager.className = 'page-pager';
    pager.setAttribute('aria-label', 'Page navigation');
    if (i > 0) pager.appendChild(button(list[i - 1], 'prev'));
    if (i < list.length - 1) pager.appendChild(button(list[i + 1], 'next'));
    page.appendChild(pager);

    // Same buttons at the top, just under the page title.
    var topPager = pager.cloneNode(true);
    topPager.classList.add('page-pager-top');
    var title = page.querySelector(':scope > .section-title');
    page.insertBefore(topPager, title ? title.nextSibling : page.firstChild);
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
    logo.innerHTML = '<span class="en"><span class="lammy-title-now"><span class="nav-umjammer">Um Jammer</span> <span class="nav-lammy">LAMMY</span></span></span><span class="ja"><img class="lammy-logo-jp" src="LammyStuff/Renders/logoujl.png" alt="ウンジャマ・ラミー"></span>';
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
    var section = img.closest('.ujl-gallery') || page || document.body;
    var nodes = section.querySelectorAll('img');
    var list = [];
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.closest('.lightbox')) continue;
      if (n.closest('.yt-facade')) continue;
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

  document.addEventListener('click', function(e) {
    var target = e.target;
    if (target && target.tagName === 'IMG' && !target.closest('.lightbox') && !target.closest('.yt-facade') && !target.closest('a')) {
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
  document.addEventListener('keydown', function (e) {
    if (openViewer && e.key === 'Escape') closeDoc(openViewer);
  });
})();

(function () {
  function activateFacade(facade) {
    var videoId = facade.getAttribute('data-video-id');
    if (!videoId) return;
    var start = facade.getAttribute('data-start');
    var title = facade.getAttribute('data-title') || 'YouTube video';
    var origin = (window.location.protocol === 'http:' || window.location.protocol === 'https:') ? window.location.origin : '';
    var src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?autoplay=1&rel=0&enablejsapi=1' + (origin ? '&origin=' + encodeURIComponent(origin) : '') + (start ? '&start=' + encodeURIComponent(start) : '');
    var iframe = document.createElement('iframe');
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
// Swap the main squiggle's left/right vertical waves at runtime so their
// fill is transparent pink from the top down through the nav bar, then
// white below — matching whatever pink (header / nav) or white (page
// content) sits next to them at every y-position.
(function () {
  var root = document.documentElement;
  var wrap = document.querySelector('.site-wrap');
  var nav = document.querySelector('.nav-bar');
  if (!wrap || !nav) return;

  var leftWave = 'M 20 0 C 20 12.5 2 12.5 2 25 C 2 37.5 20 37.5 20 50 C 20 62.5 2 62.5 2 75 C 2 87.5 20 87.5 20 100 C 20 112.5 2 112.5 2 125 C 2 137.5 20 137.5 20 150 C 20 162.5 2 162.5 2 175 C 2 187.5 20 187.5 20 200';
  var rightWave = 'M 20 0 C 20 12.5 38 12.5 38 25 C 38 37.5 20 37.5 20 50 C 20 62.5 38 62.5 38 75 C 38 87.5 20 87.5 20 100 C 20 112.5 38 112.5 38 125 C 38 137.5 20 137.5 20 150 C 20 162.5 38 162.5 38 175 C 38 187.5 20 187.5 20 200';

  function waveUrl(side, navBottomFrac) {
    var wave = side === 'left' ? leftWave : rightWave;
    var close = side === 'left' ? ' L 40 200 L 40 0 Z' : ' L 0 200 L 0 0 Z';
    var stroke = side === 'left' ? '#5B3256' : 'transparent';
    var svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 200' preserveAspectRatio='none'>" +
        "<defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>" +
          "<stop offset='0' stop-color='#ff14c8' stop-opacity='0.7'/>" +
          "<stop offset='" + navBottomFrac + "' stop-color='#ff14c8' stop-opacity='0.7'/>" +
          "<stop offset='" + navBottomFrac + "' stop-color='#fff'/>" +
          "<stop offset='1' stop-color='#fff'/>" +
        "</linearGradient></defs>" +
        "<path d='" + wave + close + "' fill='url(#g)'/>" +
        "<path d='" + wave + "' stroke='" + stroke + "' stroke-width='8' stroke-linecap='round' fill='none'/>" +
      "</svg>";
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  function update() {
    if (document.body.classList.contains('theme-lammy')) {
      root.style.removeProperty('--left-vertical-wave');
      root.style.removeProperty('--right-vertical-wave');
      return;
    }
    var wrapRect = wrap.getBoundingClientRect();
    var navRect = nav.getBoundingClientRect();
    var H = wrapRect.height;
    if (H <= 0) return;
    var navBottom = navRect.bottom - wrapRect.top;
    var frac = Math.max(0, Math.min(1, navBottom / H)).toFixed(5);
    root.style.setProperty('--left-vertical-wave', waveUrl('left', frac));
    root.style.setProperty('--right-vertical-wave', waveUrl('right', frac));
  }
  update();
  window.addEventListener('resize', update);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(update).observe(wrap);
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
