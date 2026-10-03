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
      ['.fx-head', '.fx-about__sub', '.fx-why__list li:not(.fx-why__line)', '.fx-work__info', '.fx-feat2__copy', '.fx-feat li', '.fx-mobile__head', '.fx-steps li', '.fx-plan', '.fx-faq details', '.fx-hero__meta li'].forEach(function (sel) {
        Q(sel).forEach(function (el, i) { el.setAttribute('data-fx-in', ''); el.style.setProperty('--d', (i % 4) * 0.08 + 's'); });
      });
      var io = new IntersectionObserver(function (list) {
        list.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      Q('[data-fx-in]').forEach(function (el) { io.observe(el); });
    }
    var words = home.querySelector('[data-fx-words]');
    if (words && !editing && !still) {
      var text = words.textContent.trim();
      words.setAttribute('aria-label', text);
      words.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + esc(w) + '</span>'; }).join(' ');
    }
    var wordEls = words ? words.querySelectorAll('.w') : [];

    // ── 왜 fixable : 화살표 동그라미를 잇는 세로선. 화면 60% 높이를 기준으로 내린 만큼 선이 채워지고, 선이 지나간 줄은 .is-on ──
    var whyList = home.querySelector('[data-fx-why]'), whyLine = whyList && whyList.querySelector('.fx-why__line');
    var whyRows = whyList ? [].slice.call(whyList.querySelectorAll('li:not(.fx-why__line)')) : [];
    var whyNode = function (li) { var ar = li.querySelector('.fx-why__arrow'); return { x: li.offsetLeft + ar.offsetLeft + ar.offsetWidth / 2, y: li.offsetTop + ar.offsetTop + ar.offsetHeight / 2 }; };   // offset 값이라 등장 움직임(transform)과 상관없다
    var whyPos = function () {
      if (!whyLine || whyRows.length < 2) return;
      var a = whyNode(whyRows[0]), z = whyNode(whyRows[whyRows.length - 1]);
      whyLine.style.setProperty('--lx', a.x + 'px'); whyLine.style.setProperty('--ly', a.y + 'px'); whyLine.style.setProperty('--lh', (z.y - a.y) + 'px');
    };
    var whyPaint = function () {
      if (!whyLine) return;
      var mark = window.innerHeight * 0.6, top = whyList.getBoundingClientRect().top, a = whyNode(whyRows[0]).y, h = parseFloat(whyLine.style.getPropertyValue('--lh')) || 0;
      whyLine.style.setProperty('--p', h ? clamp((mark - top - a) / h, 0, 1).toFixed(4) : 0);
      whyRows.forEach(function (li) { li.classList.toggle('is-on', still || editing || top + whyNode(li).y <= mark); });
    };
    if (whyLine) { whyPos(); whyPaint(); window.addEventListener('resize', function () { whyPos(); whyPaint(); }); window.addEventListener('scroll', whyPaint, { passive: true }); window.addEventListener('load', function () { whyPos(); whyPaint(); }); }

    // ── 문의 「fixable.」 점 글자 : 글자를 보이지 않는 캔버스에 그려 픽셀을 일정 간격으로 훑어 점 자리를 만든다.
    //    화면에 처음 들어오면 어둠 속에서 점이 하나둘 떠오르듯 왼쪽부터 천천히(약 4초) 제자리를 찾고, 그 뒤로는 아주 작게 숨 쉬듯 일렁인다.
    //    마우스 근처 점은 물결처럼 천천히 밀려나며 은은하게 밝아지고, 누르면 그 자리에서 부드럽게 퍼졌다가 다시 모인다 ──
    var dotEm = home.querySelector('[data-fx-dots]');
    if (dotEm && !editing && window.HTMLCanvasElement) (function () {
      var cv = document.createElement('canvas'), g = cv.getContext('2d');
      if (!g) return;
      cv.className = 'fx-dots'; cv.setAttribute('aria-hidden', 'true');
      var P = [], W = 0, H = 0, pad = 0, dpr = 1, gap = 6, rad = 2, mx = -1e4, my = -1e4, vis = false, raf = 0, t0 = 0, settled = !!still;
      var area = dotEm.closest('section') || dotEm, LV = 10;
      var ease = function (t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 4); };
      function build() {
        var r = dotEm.getBoundingClientRect(), cs = getComputedStyle(dotEm), fs = parseFloat(cs.fontSize), text = (dotEm.textContent || '').trim();
        if (!r.width || !fs) return;
        pad = Math.round(fs * 0.35); W = Math.round(r.width) + pad * 2; H = Math.round(r.height) + pad * 2; dpr = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.style.left = -pad + 'px'; cv.style.top = -pad + 'px';
        var off = document.createElement('canvas'); off.width = W; off.height = H;
        var o = off.getContext('2d');
        o.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
        if ('letterSpacing' in o) o.letterSpacing = cs.letterSpacing;
        var m = o.measureText(text), asc = m.actualBoundingBoxAscent || fs * 0.75, desc = m.actualBoundingBoxDescent || 0;
        o.fillText(text, pad + (m.actualBoundingBoxLeft || 0), pad + (r.height - asc - desc) / 2 + asc);
        var px = o.getImageData(0, 0, W, H).data, minX = W, maxX = 0;
        gap = Math.max(4, Math.round(fs / 46)); rad = gap * 0.36;
        P = [];
        for (var y = 0; y < H; y += gap) for (var x = 0; x < W; x += gap) {
          if (px[(y * W + x) * 4 + 3] < 128) continue;
          minX = Math.min(minX, x); maxX = Math.max(maxX, x);
          var ang = Math.random() * 6.2832, dist = gap * (3 + Math.random() * 9);
          P.push({ hx: x, hy: y, sx: x + Math.cos(ang) * dist, sy: y + Math.sin(ang) * dist - gap * 4, x: x, y: y, vx: 0, vy: 0, ph: Math.random() * 6.2832, dl: Math.random() });
        }
        P.forEach(function (p) { p.dl = ((p.hx - minX) / Math.max(1, maxX - minX)) * 1.6 + p.dl * 0.9; });   // 왼쪽부터 · 조금씩 엇갈려 떠오른다 (초)
        if (!cv.parentNode) { dotEm.appendChild(cv); dotEm.classList.add('is-dots'); }
        kick(true);
      }
      function draw(now) {
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        var R = Math.max(110, gap * 24), R2 = R * R, sec = now / 1000, intro = !settled, buckets = [];
        for (var k = 0; k <= LV; k++) buckets.push([]);
        var allIn = true;
        for (var i = 0; i < P.length; i++) {
          var p = P[i], a = 1, glow = 0;
          var bx = p.hx + Math.sin(sec * 0.7 + p.ph) * gap * 0.12, by = p.hy + Math.cos(sec * 0.6 + p.ph) * gap * 0.12;   // 숨 쉬듯 아주 작게
          if (intro) {
            var t = t0 ? (now - t0) / 1000 - p.dl : -1, e = ease(t / 2.4);
            if (e < 1) allIn = false;
            p.x = p.sx + (bx - p.sx) * e; p.y = p.sy + (by - p.sy) * e; a = Math.min(1, Math.max(0, t / 1.4));
          } else if (!still) {
            var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
            if (d2 < R2) { var d = Math.sqrt(d2) || 1, f = (1 - d / R); p.vx += dx / d * f * 0.7; p.vy += dy / d * f * 0.7; glow = f; }
            p.vx = (p.vx + (bx - p.x) * 0.018) * 0.9; p.vy = (p.vy + (by - p.y) * 0.018) * 0.9;
            p.x += p.vx; p.y += p.vy;
          }
          if (a <= 0.01) continue;
          buckets[Math.round(Math.min(1, a * (0.55 + glow * 0.9)) * LV)].push(p);
        }
        if (intro && allIn && t0) settled = true;
        for (var lv = 1; lv <= LV; lv++) {
          var set = buckets[lv]; if (!set.length) continue;
          var v = lv / LV, c = Math.round(60 + v * 175);   // 어두운 회색 → 밝은 회색
          g.fillStyle = 'rgba(' + c + ',' + c + ',' + c + ',' + Math.min(1, 0.25 + v).toFixed(2) + ')'; g.beginPath();
          for (var j = 0; j < set.length; j++) { var q = set[j]; g.moveTo(q.x + rad, q.y); g.arc(q.x, q.y, rad, 0, 6.2832); }
          g.fill();
        }
      }
      function loop(now) { raf = 0; draw(now); if (vis && !still) raf = requestAnimationFrame(loop); }
      function kick(force) { if (!raf && (vis || force)) raf = requestAnimationFrame(loop); }
      if (!still) {
        area.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
        area.addEventListener('pointerleave', function () { mx = my = -1e4; });
        area.addEventListener('pointerdown', function (e) {   // 누른 자리에서 물결처럼 퍼졌다가 천천히 돌아온다
          if (!settled) return;
          var r = cv.getBoundingClientRect(), bx = e.clientX - r.left, by = e.clientY - r.top;
          P.forEach(function (p) { var dx = p.x - bx, dy = p.y - by, d = Math.sqrt(dx * dx + dy * dy) || 1, f = Math.max(0, 1 - d / (W * 0.5)) * 9; p.vx += dx / d * f; p.vy += dy / d * f; });
        });
      }
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) { if (!t0) t0 = performance.now() + 250; kick(); } }, { threshold: 0.25 }).observe(dotEm);
      } else { vis = true; t0 = performance.now(); }
      var rz = 0;
      window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(build, 200); });
      (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(build);
    })();

    // ── 숫자 띠 : 숫자 한 칸마다 0~9 기둥을 만들어 두고, 화면에 들어올 때마다 두 바퀴 굴러 목표 숫자에 멈춘다 ──
    if (!still && !editing) Q('[data-fx-odo]').forEach(function (strip) {
      [].forEach.call(strip.querySelectorAll('b'), function (b) {
        var text = b.textContent, k = 0;
        b.setAttribute('aria-label', text);
        b.innerHTML = text.split('').map(function (ch) {
          if (!/[0-9]/.test(ch)) return '<span aria-hidden="true">' + esc(ch) + '</span>';
          var col = ''; for (var r = 0; r < 30; r++) col += '<i>' + (r % 10) + '</i>';
          return '<span class="fx-odo" aria-hidden="true"><i style="--n:' + (20 + +ch) + ';--d:' + (k++ * 0.12).toFixed(2) + 's">' + col + '</i></span>';
        }).join('');
      });
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('is-roll', e.isIntersecting); }); }, { threshold: 0.4 }).observe(strip);
      } else strip.classList.add('is-roll');
    });

    // ── 기능 01~08 : 시연 화면이 보이면 처음부터 재생, 화면 밖으로 나가면 멈춤(다시 들어오면 또 재생). 누르면 다시 재생 ──
    var stages = Q('[data-fx-stage-demo]');
    if (stages.length) {
      var counters = function (box) {
        [].forEach.call(box.querySelectorAll('[data-fx-count-to]'), function (el) {
          var to = parseFloat(el.getAttribute('data-fx-count-to')), dec = +(el.getAttribute('data-fx-dec') || 0), t0 = performance.now();
          if (still) { el.textContent = to.toFixed(dec); return; }
          (function step(t) { var k = Math.min(1, (t - t0) / 1600); k = 1 - Math.pow(1 - k, 3); el.textContent = (to * k).toFixed(dec); if (k < 1) requestAnimationFrame(step); })(t0);
        });
      };
      var play = function (st) { var d = st.querySelector('.fx-demo'); if (!d) return; d.classList.remove('is-on'); void d.offsetWidth; d.classList.add('is-on'); counters(d); };
      stages.forEach(function (st) { st.addEventListener('click', function (e) { if (e.target.closest('a,button')) return; play(st); }); });
      if ('IntersectionObserver' in window && !editing) {
        var sio = new IntersectionObserver(function (es) {
          es.forEach(function (e) { var d = e.target.querySelector('.fx-demo'); if (e.isIntersecting) play(e.target); else if (d) d.classList.remove('is-on'); });
        }, { threshold: 0.45 });
        stages.forEach(function (st) { sio.observe(st); });
      } else stages.forEach(play);
      // 마감 카운트다운 : data-fx-countdown 날짜까지 실제로 흐른다. 숫자가 바뀔 때 넘김(flip) 효과
      Q('[data-fx-countdown]').forEach(function (box) {
        var end = new Date(box.getAttribute('data-fx-countdown')).getTime(), cells = box.querySelectorAll('[data-u]'), last = {};
        var tick = function () {
          var t = Math.max(0, Math.floor((end - Date.now()) / 1000));
          var v = { d: Math.floor(t / 86400), h: Math.floor(t % 86400 / 3600), m: Math.floor(t % 3600 / 60), s: t % 60 };
          [].forEach.call(cells, function (c) {
            var u = c.getAttribute('data-u'), txt = (v[u] < 10 ? '0' : '') + v[u];
            if (last[u] !== txt) { c.textContent = txt; if (last[u] != null && !still) { c.classList.remove('is-flip'); void c.offsetWidth; c.classList.add('is-flip'); } last[u] = txt; }
          });
        };
        tick(); setInterval(tick, 1000);
      });
      // 타임세일 시계 : 실제로 1초씩 줄어든다
      var clocks = Q('[data-fx-clock]').map(function (el) { var p = el.textContent.split(':').map(Number); return { el: el, s: p[0] * 3600 + p[1] * 60 + p[2] }; });
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      if (clocks.length) setInterval(function () { clocks.forEach(function (c) { c.s = c.s > 0 ? c.s - 1 : 8 * 3600; c.el.textContent = pad(Math.floor(c.s / 3600)) + ':' + pad(Math.floor(c.s % 3600 / 60)) + ':' + pad(c.s % 60); }); }, 1000);
    }

    // ── 이벤트 쇼핑 도우미 : D-day · [지금 직접 써 보기] · 대화 시연 ──
    Q('[data-fx-dday]').forEach(function (el) {
      var end = new Date(el.getAttribute('data-fx-dday')).getTime(), left = Math.ceil((end - Date.now()) / 86400000);
      if (!isFinite(left)) return;
      el.textContent = left > 0 ? 'D-' + left : left === 0 ? 'D-DAY' : '마감';
      if (left < 0) home.classList.add('fx-event-over');
    });
    Q('[data-fx-open-helper]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (window.SHOP_HELPER && SHOP_HELPER.open) SHOP_HELPER.open();
        else { var f = document.querySelector('.wh-fab'); if (f) f.click(); }
      });
    });
    var chat = home.querySelector('[data-fx-chat]');
    if (chat && document.documentElement.classList.contains('fx-js') && 'IntersectionObserver' in window) {
      var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { chat.classList.add('is-play'); cio.disconnect(); } }); }, { threshold: 0.35 });
      cio.observe(chat);
    } else if (chat) chat.classList.add('is-play');

    // ── 2) 세라핌 효과 ──────────────────────────────
    var bar = null;
    if (!still) { bar = document.getElementById('fxProgress') || document.createElement('div'); bar.id = 'fxProgress'; document.body.appendChild(bar); }
    var films = still ? [] : Q('[data-fx-film], .fx-work__media');
    var pars = still ? [] : Q('.fx-work__media').map(function (box) { return { box: box, img: box.querySelector('img') }; }).filter(function (x) { return x.img; });
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
