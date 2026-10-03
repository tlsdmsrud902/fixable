/* fixable 메인 움직임 (index.html 전용) — 외부 라이브러리 없이 동작한다.
   1) 스크롤 히어로 (myjiwon.com 방식) : 무대가 화면에 붙어 있는 동안 스크롤 진행률이 배경 영상의 재생 위치가 되고
      (내리면 얼굴이 돈다), 앞 카드는 스킨 01 ~ 06 으로 바뀐다. 마우스 시차 --mx · --my
   2) 세라핌 효과 : 맨 위 진행 막대 · 필름 리빌(가장자리부터 펼쳐짐) · 사진 패럴랙스 · 스크롤에 밀리는 글자 띠 · 커서 라벨
   3) 등장 : 화면에 들어오면 아래에서 올라오기, 소개 문장은 한 단어씩 진해지기
   모션을 줄이는 설정(prefers-reduced-motion)이면 연속 움직임은 끄고, 히어로 챕터 전환만 스크롤로 넘긴다. */
(function () {
  'use strict';
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var esc = function (t) { return t.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };

  function init() {
    var home = document.querySelector('#lw-home.fx');
    if (!home) return;
    if (window.FIXABLE_CMS && FIXABLE_CMS.applyCached) { try { FIXABLE_CMS.applyCached(); } catch (e) {} }
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var editing = /[?&]edit=1(&|$)/.test(location.search);
    var finePointer = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
    var Q = function (s) { return Array.prototype.slice.call(home.querySelectorAll(s)); };

    // 헤더(띠배너 + 메뉴) 높이 → 히어로 글자가 헤더 밑에서 시작하게
    function headerH() {
      var h = document.getElementById('header'), b = h ? h.getBoundingClientRect().bottom : 98;
      home.style.setProperty('--fx-hh', Math.max(56, Math.round(b)) + 'px');
    }
    headerH();

    // 제목 글자를 한 글자씩 (편집 모드에서는 원문 그대로)
    if (!editing && !still) {
      var delay = 120;
      Q('[data-fx-chars]').forEach(function (el) {
        var text = el.textContent;
        el.setAttribute('aria-label', text);
        el.innerHTML = [].map.call(text, function (ch, i) {
          return ch === ' ' ? ' ' : '<span class="fx-ch" aria-hidden="true" style="animation-delay:' + (delay + i * 28) + 'ms">' + esc(ch) + '</span>';
        }).join('');
        delay += text.length * 28 + 120;
      });
    }

    // ── 1) 스크롤 히어로 ─────────────────────────────
    // 배경 영상 : 스크롤 진행률 = 재생 위치(스크럽, PC · 휴대폰 모두). 데이터 절약 모드 · 2G 는 포스터만
    // 앞 카드 : 진행률을 상품 수(6)로 나눠 01 → 06
    var pin = home.querySelector('[data-fx-hero]');
    var stage = pin && pin.querySelector('[data-fx-stage]');
    var video = pin && pin.querySelector('[data-fx-video]');
    var tabs = pin ? Q('[data-fx-tab]') : [];
    var chaps = pin ? Q('[data-fx-chap]') : [];
    var count = pin && pin.querySelector('[data-fx-count]');
    var chapter = -1;
    function setChapter(i) {
      if (i === chapter) return;
      chapter = i;
      tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.classList.toggle('is-past', k < i); });
      chaps.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
      if (count) count.textContent = (i < 9 ? '0' : '') + (i + 1);
    }
    setChapter(0);
    function heroProgress() {
      var r = pin.getBoundingClientRect(), dist = pin.offsetHeight - stage.offsetHeight;
      return dist > 0 ? clamp(-r.top / dist, 0, 1) : 0;
    }
    var scrub = null, videoReady = false, visualTime = 0, lastT = 0, chase = 0;
    if (video && !editing) {
      var conn = navigator.connection || {}, thrifty = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
      var reveal = function () { videoReady = true; video.setAttribute('data-ready', 'true'); kick(); };
      // 아이폰 · 맥 사파리는 한 번도 재생되지 않은 영상의 seek 화면을 그리지 않는다 → 숨긴 채 재생했다 바로 멈춰 깨운다
      var ua = navigator.userAgent, needsWake = /iP(hone|ad|od)/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Edg|Android/.test(ua));
      if (!still && !thrifty) {
        // 파일을 한 번에 받아(blob) 물린다 — seek 마다 네트워크 요청이 생기지 않아 빠르게 굴려도 멈추지 않는다
        scrub = video; video.loop = false; video.preload = 'auto';
        var src = video.getAttribute('data-fx-scrub'), started = false;
        var load = function () {
          if (started) return; started = true;
          fetch(src).then(function (r) { return r.ok ? r.blob() : Promise.reject(r.status); })
            .then(function (b) { video.src = URL.createObjectURL(b); video.load(); })
            .catch(function () { video.src = src; video.load(); });
        };
        var settle = function () { if (video.currentTime < 0.02) reveal(); else { video.addEventListener('seeked', reveal, { once: true }); video.currentTime = 0; } };
        video.addEventListener('loadeddata', function () {
          if (!needsWake) return settle();
          var pr = video.play(); if (pr && pr.then) pr.then(function () { video.pause(); settle(); }, settle); else settle();
        }, { once: true });
        if ('requestIdleCallback' in window) requestIdleCallback(load, { timeout: 800 });
        setTimeout(load, 900);
      } else if (still && !thrifty) {
        // 모션 줄이기 설정 : 스크롤과 묶지 않고 가벼운 루프 영상을 조용히 재생
        video.loop = true; video.preload = 'metadata'; video.src = video.getAttribute('data-fx-loop');
        video.addEventListener('playing', reveal, { once: true });
        var tryPlay = function () { var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); };
        tryPlay(); window.addEventListener('touchstart', tryPlay, { passive: true, once: true });
      }
    }
    // 영상 위치는 목표를 부드럽게 따라간다(75ms 반응). 디코더가 직전 seek 을 푸는 중이면 새 seek 을 얹지 않는다
    function chaseVideo(ts) {
      chase = 0;
      if (!scrub || !videoReady || !isFinite(scrub.duration)) return;
      var dt = lastT ? Math.min(64, ts - lastT) : 16.7; lastT = ts;
      var want = Math.min(scrub.duration - 0.05, heroProgress() * scrub.duration);
      visualTime += (want - visualTime) * (1 - Math.exp(-dt / 75));
      if (Math.abs(want - visualTime) < 0.008) visualTime = want;
      if (Math.abs(visualTime - scrub.currentTime) > 1 / 60 && !scrub.seeking) scrub.currentTime = visualTime;
      if (Math.abs(want - visualTime) > 0.008 || Math.abs(visualTime - scrub.currentTime) > 1 / 60) chase = requestAnimationFrame(chaseVideo);
      else lastT = 0;
    }
    function kick() { if (!chase) chase = requestAnimationFrame(chaseVideo); }
    function paintHero(p) {
      stage.style.setProperty('--p', p.toFixed(4));
      setChapter(Math.min(tabs.length - 1, Math.floor(p * tabs.length * 0.9999)));
      kick();
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () {
        var dist = pin.offsetHeight - stage.offsetHeight, top = pin.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({ top: top + dist * ((k + 0.5) / tabs.length), behavior: still ? 'auto' : 'smooth' });
      });
    });
    if (pin && finePointer && !still) {
      var mx = 0, my = 0, praf = 0;
      window.addEventListener('pointermove', function (e) {
        mx = e.clientX / window.innerWidth * 2 - 1; my = e.clientY / window.innerHeight * 2 - 1;
        if (!praf) praf = requestAnimationFrame(function () { praf = 0; stage.style.setProperty('--mx', mx.toFixed(3)); stage.style.setProperty('--my', my.toFixed(3)); });
      }, { passive: true });
    }

    // ── 3) 등장 ─────────────────────────────────────
    if (!still && !editing && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('fx-js');
      ['.fx-head', '.fx-about__sub', '.fx-why__list li', '.fx-work__info', '.fx-feat li', '.fx-mobile__head', '.fx-steps li', '.fx-plan', '.fx-faq details', '.fx-contact__row', '.fx-shop .prdList > li', '.fx-hero__meta li'].forEach(function (sel) {
        Q(sel).forEach(function (el, i) { el.setAttribute('data-fx-in', ''); el.style.setProperty('--d', (i % 4) * 0.08 + 's'); });
      });
      var io = new IntersectionObserver(function (list) {
        list.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      Q('[data-fx-in]').forEach(function (el) { io.observe(el); });
      setTimeout(function () { Q('.fx-shop .prdList > li:not([data-fx-in])').forEach(function (el) { el.setAttribute('data-fx-in', ''); io.observe(el); }); }, 1200);
    }
    var words = home.querySelector('[data-fx-words]');
    if (words && !editing && !still) {
      var text = words.textContent.trim();
      words.setAttribute('aria-label', text);
      words.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
    }
    var wordEls = words ? words.querySelectorAll('.w') : [];

    // ── 2) 세라핌 효과 ──────────────────────────────
    var bar = null;
    if (!still) { bar = document.getElementById('fxProgress') || document.createElement('div'); bar.id = 'fxProgress'; document.body.appendChild(bar); }
    var films = still ? [] : Q('[data-fx-film], .fx-work__media');
    var pars = still ? [] : Q('.fx-reel, .fx-work__media').map(function (box) { return { box: box, img: box.querySelector('img') }; }).filter(function (x) { return x.img; });
    var marq = still ? [] : Q('[data-fx-marq]');

    if (finePointer && !still) {
      var zones = Q('[data-fx-cursor]');
      if (zones.length) {
        var cur = document.createElement('div'); cur.className = 'fx-cursor'; cur.setAttribute('aria-hidden', 'true'); document.body.appendChild(cur);
        var cx = 0, cy = 0, tx = 0, ty = 0, on = false, craf = 0;
        var loop = function () { craf = 0; tx += (cx - tx) * 0.2; ty += (cy - ty) * 0.2; cur.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)'; if (on && Math.abs(cx - tx) + Math.abs(cy - ty) > 0.3) craf = requestAnimationFrame(loop); };
        document.addEventListener('mousemove', function (e) { cx = e.clientX; cy = e.clientY; if (on && !craf) craf = requestAnimationFrame(loop); }, { passive: true });
        zones.forEach(function (z) {
          z.addEventListener('mouseenter', function () { cur.textContent = z.getAttribute('data-fx-cursor') || 'VIEW'; tx = cx; ty = cy; on = true; cur.classList.add('is-on'); if (!craf) craf = requestAnimationFrame(loop); });
          z.addEventListener('mouseleave', function () { on = false; cur.classList.remove('is-on'); });
        });
      }
    }

    var ticking = false, vh = window.innerHeight;
    function frame() {
      ticking = false;
      var sy = window.pageYOffset, docH = document.documentElement.scrollHeight - vh;
      if (pin && stage) paintHero(heroProgress());
      if (bar) bar.style.transform = 'scaleX(' + (docH > 0 ? clamp(sy / docH, 0, 1) : 0).toFixed(4) + ')';
      films.forEach(function (f) {    // 화면 아래에서 올라올수록 가장자리 여백(--fi)이 0 으로
        var r = f.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return;
        var t = clamp((vh - r.top) / (vh * 0.85), 0, 1); t = t * t * (3 - 2 * t);
        f.style.setProperty('--fi', ((1 - t) * 7).toFixed(2) + '%');
        f.style.setProperty('--fr', ((1 - t) * 28).toFixed(1) + 'px');
      });
      pars.forEach(function (p) {     // 화면 가운데에서 벗어난 만큼 사진을 천천히 밀기
        var r = p.box.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return;
        var c = clamp((r.top + r.height / 2 - vh / 2) / vh, -1, 1);
        p.img.style.setProperty('--py', (-c * r.height * 0.06).toFixed(1) + 'px');
      });
      marq.forEach(function (m) {     // 줄마다 반대 방향으로
        var r = m.getBoundingClientRect(); if (r.bottom < -50 || r.top > vh + 50) return;
        m.style.setProperty('--sx', ((r.top - vh) * 0.35 * (parseFloat(m.getAttribute('data-fx-marq')) || 1)).toFixed(1) + 'px');
      });
      if (wordEls.length) {
        var w = words.getBoundingClientRect();
        var q = clamp((vh * 0.85 - w.top) / (w.height + vh * 0.35), 0, 1), n = Math.round(q * wordEls.length);
        for (var i = 0; i < wordEls.length; i++) wordEls[i].classList.toggle('on', i < n);
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { vh = window.innerHeight; headerH(); onScroll(); });
    frame();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
