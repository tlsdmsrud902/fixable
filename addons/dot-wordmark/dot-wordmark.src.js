/* 점 워드마크 — 메인 맨 아래 큰 브랜드 글자(.cz-brand 의 워드마크 이미지)를 작은 점으로 다시 그린다 (fixable 문의 「fixable.」 점 글자와 같은 움직임)
   · 화면에 들어오면 흩어진 점이 왼쪽부터 천천히 모여 글자가 되고, 그 뒤로는 아주 작게 숨 쉬듯 일렁인다
   · 마우스 근처 점은 물결처럼 밀려나며 진해지고, 누르면 그 자리에서 퍼졌다가 다시 모인다
   · 이미지 픽셀은 다른 주소(ecimg.cafe24img.com)라 읽을 수 없어서, 워드마크마다 글자 모양을 미리 점 지도(MASKS)로 담아 둔다
     → 워드마크 이미지 파일 이름이 MASKS 에 없으면(사진을 바꾸면) 아무것도 하지 않고 원래 이미지가 그대로 보인다
   · 넣는 법 : layout.html 의 </body> 앞에  <script src="(이 파일 주소)" defer></script>  한 줄. 빼려면 그 줄을 지운다
   · 관리자 편집 모드(?edit=1)와 「동작 줄이기」 설정에서는 이미지를 그대로 둔다 */
(function () {
  'use strict';
  var MASKS = __MASKS__;
  if (!window.HTMLCanvasElement || /[?&]edit=1\b/.test(location.search)) return;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still) return;

  function bits(m) { var s = atob(m.m), out = new Uint8Array(m.w * m.h); for (var i = 0; i < out.length; i++) out[i] = (s.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1; return out; }
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

  function init() {
    var img = document.querySelector('.cz-brand__stage img, .cz-brand img');
    if (!img) return;
    var key = Object.keys(MASKS).filter(function (k) { return (img.currentSrc || img.src || '').indexOf(k) >= 0; })[0];
    if (!key) return;
    var M = MASKS[key], grid = bits(M), base = rgb(M.c);
    // 밝은 바탕 : 마우스 근처는 같은 색을 더 진하게
    var deep = base.map(function (v) { return Math.round(v * 0.55); });
    var host = img.parentNode;
    var cv = document.createElement('canvas'), g = cv.getContext('2d');
    if (!g) return;
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;pointer-events:none;z-index:1';
    var P = [], W = 0, H = 0, pad = 0, dpr = 1, gap = 6, rad = 2, mx = -1e4, my = -1e4, vis = false, raf = 0, t0 = 0, settled = false, LV = 6;
    var area = img.closest('section') || host;
    var ease = function (t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 4); };

    function build() {
      var r = img.getBoundingClientRect(), hr = host.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pad = Math.round(r.height * 0.12);
      W = Math.round(r.width) + pad * 2; H = Math.round(r.height) + pad * 2; dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
      cv.style.left = (r.left - hr.left - host.clientLeft - pad) + 'px'; cv.style.top = (r.top - hr.top - host.clientTop - pad) + 'px';
      gap = Math.max(4, Math.round(r.width / 165)); rad = gap * 0.36;
      var minX = W, maxX = 0; P = [];
      for (var y = 0; y < r.height; y += gap) for (var x = 0; x < r.width; x += gap) {
        var gx = Math.min(M.w - 1, Math.floor(x / r.width * M.w)), gy = Math.min(M.h - 1, Math.floor(y / r.height * M.h));
        if (!grid[gy * M.w + gx]) continue;
        var px = x + pad, py = y + pad;
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        var ang = Math.random() * 6.2832, dist = gap * (3 + Math.random() * 9);
        P.push({ hx: px, hy: py, sx: px + Math.cos(ang) * dist, sy: py + Math.sin(ang) * dist - gap * 4, x: px, y: py, vx: 0, vy: 0, ph: Math.random() * 6.2832, dl: Math.random() });
      }
      P.forEach(function (p) { p.dl = ((p.hx - minX) / Math.max(1, maxX - minX)) * 1.6 + p.dl * 0.9; });   // 왼쪽부터 · 조금씩 엇갈려
      if (!cv.parentNode) {
        if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
        host.appendChild(cv); img.style.visibility = 'hidden';
      }
      kick(true);
    }
    function draw(now) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      var R = Math.max(110, gap * 24), R2 = R * R, sec = now / 1000, intro = !settled, allIn = true, buckets = [];
      for (var k = 0; k < (LV + 1) * (LV + 1); k++) buckets.push([]);
      for (var i = 0; i < P.length; i++) {
        var p = P[i], a = 1, glow = 0;
        var bx = p.hx + Math.sin(sec * 0.7 + p.ph) * gap * 0.12, by = p.hy + Math.cos(sec * 0.6 + p.ph) * gap * 0.12;   // 숨 쉬듯 아주 작게
        if (intro) {
          var t = t0 ? (now - t0) / 1000 - p.dl : -1, e = ease(t / 2.4);
          if (e < 1) allIn = false;
          p.x = p.sx + (bx - p.sx) * e; p.y = p.sy + (by - p.sy) * e; a = Math.min(1, Math.max(0, t / 1.4));
        } else {
          var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
          if (d2 < R2) { var d = Math.sqrt(d2) || 1, f = (1 - d / R); p.vx += dx / d * f * 0.7; p.vy += dy / d * f * 0.7; glow = f; }
          p.vx = (p.vx + (bx - p.x) * 0.018) * 0.9; p.vy = (p.vy + (by - p.y) * 0.018) * 0.9;
          p.x += p.vx; p.y += p.vy;
        }
        if (a <= 0.01) continue;
        buckets[Math.round(a * LV) * (LV + 1) + Math.round(Math.min(1, glow * 1.3) * LV)].push(p);
      }
      if (intro && allIn && t0) settled = true;
      for (var b = 0; b < buckets.length; b++) {
        var set = buckets[b]; if (!set.length) continue;
        var al = Math.floor(b / (LV + 1)) / LV, gl = (b % (LV + 1)) / LV;
        var c = [0, 1, 2].map(function (j) { return Math.round(base[j] + (deep[j] - base[j]) * gl); });
        g.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + al.toFixed(2) + ')'; g.beginPath();
        for (var j = 0; j < set.length; j++) { var q = set[j]; g.moveTo(q.x + rad, q.y); g.arc(q.x, q.y, rad, 0, 6.2832); }
        g.fill();
      }
    }
    function loop(now) { raf = 0; draw(now); if (vis) raf = requestAnimationFrame(loop); }
    function kick(force) { if (!raf && (vis || force)) raf = requestAnimationFrame(loop); }
    area.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
    area.addEventListener('pointerleave', function () { mx = my = -1e4; });
    area.addEventListener('pointerdown', function (e) {   // 누른 자리에서 물결처럼 퍼졌다가 천천히 돌아온다
      if (!settled) return;
      var r = cv.getBoundingClientRect(), bx = e.clientX - r.left, by = e.clientY - r.top;
      P.forEach(function (p) { var dx = p.x - bx, dy = p.y - by, d = Math.sqrt(dx * dx + dy * dy) || 1, f = Math.max(0, 1 - d / (W * 0.5)) * 9; p.vx += dx / d * f; p.vy += dy / d * f; });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { vis = es[0].isIntersecting; if (vis) { if (!t0) t0 = performance.now() + 250; kick(); } }, { threshold: 0.25 }).observe(host);
    } else { vis = true; t0 = performance.now(); }
    var rz = 0;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(build, 200); });
    if (img.complete && img.naturalWidth) build(); else img.addEventListener('load', build);
    if (img.loading === 'lazy') img.loading = 'eager';   // 크기를 알아야 점을 놓을 수 있다
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
