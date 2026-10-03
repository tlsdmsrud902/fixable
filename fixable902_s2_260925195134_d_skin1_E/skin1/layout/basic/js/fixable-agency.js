/* fixable 메인 움직임 (index.html 전용) — 외부 라이브러리 없이 동작한다.
   1) 화면에 들어오면 아래에서 올라오기  2) 쇼릴 사진이 스크롤에 맞춰 커지기  3) 소개 문장이 한 단어씩 진해지기 */
(function () {
  'use strict';
  function init() {
    var home = document.querySelector('#lw-home.fx');
    if (!home) return;
    if (window.FIXABLE_CMS && FIXABLE_CMS.applyCached) { try { FIXABLE_CMS.applyCached(); } catch (e) {} }
    var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var editing = /[?&]edit=1(&|$)/.test(location.search);

    // 1) 등장 : 제목 줄 · 카드마다 data-fx-in, 같은 줄 카드는 조금씩 늦게
    if (!still && !editing && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('fx-js');
      var groups = ['.fx-head', '.fx-about__sub', '.fx-why__list li', '.fx-work', '.fx-feat li', '.fx-mobile__head', '.fx-steps li', '.fx-plan', '.fx-faq details', '.fx-contact__row', '.fx-shop .prdList > li'];
      groups.forEach(function (sel) {
        [].forEach.call(home.querySelectorAll(sel), function (el, i) {
          el.setAttribute('data-fx-in', '');
          el.style.setProperty('--d', (i % 4) * 0.08 + 's');
        });
      });
      var io = new IntersectionObserver(function (list) {
        list.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px' });
      [].forEach.call(home.querySelectorAll('[data-fx-in]'), function (el) { io.observe(el); });
      // 상품 진열은 카페24 가 나중에 채울 수 있어 다시 한 번
      setTimeout(function () {
        [].forEach.call(home.querySelectorAll('.fx-shop .prdList > li:not([data-fx-in])'), function (el) { el.setAttribute('data-fx-in', ''); io.observe(el); });
      }, 1200);
    }

    // 3) 소개 문장을 단어로 나눈다 (편집 모드에서는 원문 그대로 둔다)
    var words = home.querySelector('[data-fx-words]');
    if (words && !editing && !still) {
      var text = words.textContent.trim();
      words.setAttribute('aria-label', text);
      words.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="w" aria-hidden="true">' + w.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '</span>'; }).join(' ');
    }
    var wordEls = words ? words.querySelectorAll('.w') : [];

    // 2) + 3) 스크롤 따라 움직이는 것들
    var reel = home.querySelector('[data-fx-reel]');
    var ticking = false;
    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      if (reel && !still) {
        var r = reel.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height * 0.5)));
        reel.style.setProperty('--reel', (0.9 + p * 0.1).toFixed(4));
        reel.style.setProperty('--reel-y', (-(p - 0.5) * 40).toFixed(1) + 'px');
      }
      if (wordEls.length) {
        var w = words.getBoundingClientRect();
        var q = Math.min(1, Math.max(0, (vh * 0.85 - w.top) / (w.height + vh * 0.35)));
        var n = Math.round(q * wordEls.length);
        for (var i = 0; i < wordEls.length; i++) wordEls[i].classList.toggle('on', i < n);
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
