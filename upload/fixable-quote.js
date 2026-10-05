/* ==========================================================================
   1:1 견적문의 (fixable-quote.js)
   --------------------------------------------------------------------------
   가격은 보여 주지 않고, 상품마다 [1:1 견적문의하기] 로 상담을 받는다.

   1) 상품 목록 카드 (메인 · 분류 · 검색 등 카페24 상품 목록 전부)
      - 소비자가 · 할인율 · 숫자 판매가 줄을 숨긴다 (가격 대체 문구 「1:1 문의 주세요」 는 남긴다)
      - 상품요약정보는 한 줄로 (넘치면 … ), 아래 문의 문구와 위아래 간격을 둔다
      → 카페24 관리자 「상품정보 표시설정」 순서대로 그려지는 줄이라 템플릿에서 한 줄만
        주석 처리할 수 없다. 줄 제목(소비자가 · 판매가 …)을 읽어 표시를 붙이고 CSS 로 숨긴다.
        가격을 다시 보이려면 layout.html 에서 이 스크립트 줄을 지우고,
        fixable-cozy-global.css 의 「가격 숨김」 블록을 지운다.
   2) 상품 상세 : 소비자가 · TOTAL 줄을 숨기고, WISH LIST 옆에 [1:1 견적문의하기] 버튼
   3) 버튼을 누르면 문의 창(이름 · 핸드폰 · 상담 내용) → 카페24 「1:1 맞춤상담」 게시판(9번)에 글로 저장
      - 1:1 맞춤상담은 회원 전용 : 손님은 자기 글만, 관리자는 관리자 › 게시판에서 전부 본다
      - 로그인 전이면 로그인 · 회원가입 안내 → 로그인하고 돌아오면 창이 다시 열리고 적던 내용이 그대로 있다
      - 저장은 화면 뒤(보이지 않는 창)에서 카페24 글쓰기 화면을 열어 채우고 [등록] 을 누르는 방식
      - 카페24 보안 확인이 뜨면, 글쓰기 화면으로 옮겨 내용을 채워 둔다 (손님이 확인 후 [등록])
      - 새 글 알림 메일 : 카페24 관리자 › 고객 › 자동메일 「새 게시글 작성시 안내 → 운영자」
   ========================================================================== */
(function () {
  'use strict';
  if (window.FIXABLE_QUOTE) return;
  var doc = document, html = doc.documentElement;
  var BOARD = 9;
  var WRITE = '/board/consult/write.html?board_no=' + BOARD;
  var LIST = '/board/consult/list.html?board_no=' + BOARD;
  var DRAFT = 'fx-quote-draft';
  var HASH = '#fx-quote';

  function txt(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function ssGet() { try { return JSON.parse(sessionStorage.getItem(DRAFT) || 'null'); } catch (e) { return null; } }
  function ssSet(v) { try { if (v) sessionStorage.setItem(DRAFT, JSON.stringify(v)); else sessionStorage.removeItem(DRAFT); } catch (e) {} }
  function logged() { return !!doc.querySelector('.xans-layout-statelogon'); }
  var PRICE = /\d[\d,]*\s*원/;

  /* ---------- 1. 상품 목록 카드 ---------- */
  function tagCards(root) {
    [].forEach.call((root || doc).querySelectorAll('ul.prdList .description .spec > li:not([data-fxq])'), function (li) {
      li.setAttribute('data-fxq', '');
      var title = txt(li.querySelector('.title')), t = title.replace(/\s*:\s*$/, ''), body = txt(li).replace(title, '').trim();
      if (/요약|간략/.test(t)) li.classList.add('fxq-sum');
      else if (/소비자가|할인|적립/.test(t) || li.querySelector('.st-rate') || PRICE.test(body)) li.classList.add('fxq-hide');
      else if (/판매가/.test(t)) li.classList.add('fxq-ask');     // 가격 대체 문구 (1:1 문의 주세요)
    });
  }

  /* ---------- 2. 상품 상세 ---------- */
  var product = null;
  function detail() {
    var info = doc.querySelector('.xans-product-detail .infoArea, .infoArea');
    if (!info || !/\/product\/detail\.html|\/product\/[^/]+\/\d+/.test(location.pathname)) return;
    var name = txt(info.querySelector('.headingArea h1, h1, h2'));
    product = { name: name, url: location.href.split('#')[0] };
    [].forEach.call(info.querySelectorAll('tr'), function (tr) {
      var t = txt(tr.querySelector('th')), v = txt(tr.querySelector('td'));
      if (/소비자가|할인|적립/.test(t) || (/판매가/.test(t) && PRICE.test(v))) tr.classList.add('fxq-hide');
    });
    var total = info.querySelector('.totalPrice'); if (total) total.classList.add('fxq-hide');
    var wish = doc.getElementById('actionWish');
    var spot = wish ? wish.parentNode : info.querySelector('.productAction');
    if (spot && !spot.querySelector('.fxq-open')) {
      var b = button('btnSubmit sizeL');
      if (wish) wish.parentNode.insertBefore(b, wish.nextSibling); else spot.insertBefore(b, spot.firstChild);
    }
    var fix = doc.getElementById('orderFixArea');
    if (fix && !fix.querySelector('.fxq-open')) fix.appendChild(button('btnSubmit sizeM fxq-open--bar'));
    // 대표 이미지 고화질 : 카페24 확대 이미지는 500px 로 줄여 저장돼 720×900 칸에서 흐려진다 → 4:5 · 1440×1800 판으로 바꾼다
    var no = (location.search.match(/[?&]product_no=(\d+)/) || location.pathname.match(/\/product\/[^/]+\/(\d+)(\/|$)/) || [])[1];
    if (HD[no]) [].forEach.call(doc.querySelectorAll('img.BigImage'), function (img) {
      img.removeAttribute('srcset'); img.src = HD_BASE + HD[no] + '.jpg';
    });
  }
  var HD_BASE = 'https://cdn.jsdelivr.net/gh/tlsdmsrud902/fixable@5880c7a1d2c5144525c2bf4733ef5f607a8b6bee/cafe24-assets/products/hd/';
  var HD = { 11: 'p01', 12: 'p02', 13: 'p03', 14: 'p04', 15: 'p05', 16: 'p06' };
  function button(cls) {
    var b = doc.createElement('button');
    b.type = 'button'; b.className = cls + ' fxq-open';
    b.textContent = '1:1 견적문의하기';
    b.addEventListener('click', function () { open(); });
    return b;
  }

  /* ---------- 3. 문의 창 ---------- */
  var box, form, panel, sending = false;
  function build() {
    if (box) return;
    box = doc.createElement('div');
    box.className = 'fxq';
    box.hidden = true;
    box.innerHTML =
      '<div class="fxq__dim" data-fxq-close></div>' +
      '<div class="fxq__card" role="dialog" aria-modal="true" aria-labelledby="fxq-title">' +
        '<button type="button" class="fxq__x" data-fxq-close aria-label="닫기"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
        '<p class="fxq__eyebrow">1:1 견적문의</p>' +
        '<h2 class="fxq__title" id="fxq-title"></h2>' +
        '<div class="fxq__body"></div>' +
      '</div>';
    doc.body.appendChild(box);
    panel = box.querySelector('.fxq__body');
    box.addEventListener('click', function (e) { if (e.target.closest('[data-fxq-close]')) close(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') {
        var f = [].filter.call(box.querySelectorAll('a[href],button,input,textarea'), function (x) { return !x.disabled && x.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && doc.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && doc.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
  }
  var lastFocus = null;
  function open() {
    build();
    lastFocus = doc.activeElement;
    box.querySelector('.fxq__title').textContent = product && product.name ? product.name : '견적 · 상담 문의';
    if (logged()) showForm(); else showLogin();
    box.hidden = false;
    html.classList.add('fxq-lock');
    if (window.stLenis && window.stLenis.stop) window.stLenis.stop();
    requestAnimationFrame(function () { box.classList.add('is-on'); });
    setTimeout(function () { var f = box.querySelector('input:not([type=checkbox]), .fxq__btn'); if (f) f.focus({ preventScroll: true }); }, 60);
  }
  function close() {
    if (!box || box.hidden) return;
    if (form) saveDraft();
    box.classList.remove('is-on');
    html.classList.remove('fxq-lock');
    if (window.stLenis && window.stLenis.start) window.stLenis.start();
    setTimeout(function () { box.hidden = true; }, 220);
    if (location.hash === HASH) try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function showLogin() {
    form = null;
    var back = location.pathname + location.search + HASH;
    panel.innerHTML =
      '<p class="fxq__lead">1:1 견적문의는 <b>회원만</b> 남길 수 있어요. 로그인하면 남긴 문의와 답변을 「문의 › 1:1 상담하기」에서 언제든 다시 볼 수 있어요.</p>' +
      '<div class="fxq__row2">' +
        '<a class="fxq__btn" href="/member/login.html?returnUrl=' + encodeURIComponent(back) + '">로그인</a>' +
        '<a class="fxq__btn is-line" href="/member/agreement.html?returnUrl=' + encodeURIComponent(back) + '">회원가입</a>' +
      '</div>';
  }

  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var REPLY = { phone: '핸드폰으로 답변받기', mail: '메일로 답변받기' };
  function showForm() {
    var d = ssGet() || {};
    panel.innerHTML =
      '<p class="fxq__lead">남겨 주시면 확인 후 연락드려요. 답변은 「문의 › 1:1 상담하기」에서도 볼 수 있어요.</p>' +
      '<form class="fxq__form" novalidate>' +
        '<label class="fxq__field"><span>이름</span><input name="name" autocomplete="name" maxlength="30" required></label>' +
        '<label class="fxq__field"><span>핸드폰</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="010-0000-0000"></label>' +
        '<label class="fxq__field"><span>이메일</span><input name="email" type="email" inputmode="email" autocomplete="email" maxlength="80" placeholder="name@example.com"></label>' +
        '<div class="fxq__reply" role="radiogroup" aria-label="답변 받는 방법"><span class="fxq__reply-t">답변 받는 방법</span>' +
          '<label><input type="radio" name="reply" value="phone"><span>' + REPLY.phone + '</span></label>' +
          '<label><input type="radio" name="reply" value="mail"><span>' + REPLY.mail + '</span></label>' +
        '</div>' +
        '<label class="fxq__field"><span>상담 내용</span><textarea name="msg" rows="5" maxlength="3000" placeholder="운영 중인 쇼핑몰 주소, 바꾸고 싶은 부분, 원하는 일정 등을 적어 주세요" required></textarea></label>' +
        '<label class="fxq__agree"><input type="checkbox" name="agree" required><span>상담 답변을 위해 이름 · 핸드폰 번호 · 이메일을 수집 · 이용하는 데 동의합니다.</span></label>' +
        '<p class="fxq__err" role="alert" aria-live="assertive"></p>' +
        '<button type="submit" class="fxq__btn fxq__send">문의 남기기</button>' +
      '</form>';
    form = panel.querySelector('form');
    form.name.value = d.name || '';
    form.phone.value = d.phone || '';
    form.email.value = d.email || '';
    form.msg.value = d.msg || '';
    (form.querySelector('input[name="reply"][value="' + (d.reply === 'mail' ? 'mail' : 'phone') + '"]')).checked = true;
    form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
  }
  function reply() { var r = form.querySelector('input[name="reply"]:checked'); return r ? r.value : 'phone'; }
  function saveDraft() {
    if (!form) return;
    var d = { name: form.name.value, phone: form.phone.value, email: form.email.value, reply: reply(), msg: form.msg.value, product: product };
    ssSet(d.name || d.phone || d.email || d.msg ? d : null);
  }
  function err(m) { var p = panel.querySelector('.fxq__err'); if (p) p.textContent = m || ''; }

  // 연락처 줄 (핸드폰 · 이메일 · 답변 받는 방법) : 문의 창 · 게시판 글쓰기 화면이 같이 쓴다
  function contact(d) {
    return '<p><b>핸드폰</b> : ' + esc(d.phone || '-') + '</p>' +
      '<p><b>이메일</b> : ' + esc(d.email || '-') + '</p>' +
      '<p><b>답변 받는 방법</b> : ' + (REPLY[d.reply] || REPLY.phone) + '</p>';
  }
  function post(d) {
    var lines = [
      '<p><b>상품</b> : ' + esc(d.product && d.product.name || '-') + (d.product && d.product.url ? ' (<a href="' + esc(d.product.url) + '">' + esc(d.product.url) + '</a>)' : '') + '</p>',
      '<p><b>이름</b> : ' + esc(d.name) + '</p>',
      contact(d),
      '<p><b>상담 내용</b></p>',
      '<p>' + esc(d.msg).replace(/\n/g, '<br>') + '</p>'
    ];
    return { subject: '[견적문의] ' + (d.product && d.product.name ? d.product.name : '1:1 상담'), html: lines.join(''), email: d.email || '', reply: d.reply };
  }

  function send() {
    if (sending) return;
    var name = form.name.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim(), how = reply(), msg = form.msg.value.trim();
    var phoneOk = phone.replace(/\D/g, '').length >= 9, emailOk = EMAIL.test(email);
    if (!name) { err('이름을 적어 주세요.'); form.name.focus(); return; }
    if (how === 'phone' && !phoneOk) { err('핸드폰으로 답변받으려면 핸드폰 번호를 적어 주세요.'); form.phone.focus(); return; }
    if (how === 'mail' && !emailOk) { err('메일로 답변받으려면 이메일 주소를 적어 주세요.'); form.email.focus(); return; }
    if (phone && !phoneOk) { err('핸드폰 번호를 다시 확인해 주세요.'); form.phone.focus(); return; }
    if (email && !emailOk) { err('이메일 주소를 다시 확인해 주세요.'); form.email.focus(); return; }
    if (!msg) { err('상담 내용을 적어 주세요.'); form.msg.focus(); return; }
    if (!form.agree.checked) { err('개인정보 수집 · 이용에 동의해 주세요.'); form.agree.focus(); return; }
    err('');
    var d = { name: name, phone: phone, email: email, reply: how, msg: msg, product: product };
    ssSet(d);
    sending = true;
    var btn = form.querySelector('.fxq__send');
    btn.disabled = true; btn.textContent = '보내는 중…';
    write(post(d), function (ok, why, msg2) {
      sending = false;
      btn.disabled = false; btn.textContent = '문의 남기기';
      if (ok) { ssSet(null); done(how); return; }
      if (why === 'login') { showLogin(); return; }
      if (why === 'blocked') { blocked(); return; }
      err(msg2 || '문의를 보내지 못했어요. 잠시 뒤 다시 눌러 주세요.');
    });
  }
  function done(how) {
    form = null;
    panel.innerHTML =
      '<p class="fxq__lead"><b>문의가 접수되었어요.</b> 확인 후 ' + (how === 'mail' ? '남겨 주신 메일로 답변드릴게요.' : '남겨 주신 번호로 연락드릴게요.') + ' 답변은 「문의 › 1:1 상담하기」에서도 볼 수 있어요.</p>' +
      '<div class="fxq__row2"><a class="fxq__btn" href="' + LIST + '">내 문의 보기</a><button type="button" class="fxq__btn is-line" data-fxq-close>닫기</button></div>';
    var b = panel.querySelector('.fxq__btn'); if (b) b.focus();
  }
  // 카페24 보안 확인 : 글쓰기 화면으로 옮겨 내용을 채워 둔다
  function blocked() {
    form = null;
    panel.innerHTML =
      '<p class="fxq__lead">카페24 보안 확인이 필요해 바로 보내지 못했어요. 아래 버튼을 누르면 확인 뒤 <b>적은 내용이 채워진 글쓰기 화면</b>이 열려요. [등록] 만 눌러 주세요.</p>' +
      '<div class="fxq__row2"><a class="fxq__btn" href="' + WRITE + '&fxq=draft">이어서 보내기</a></div>';
  }

  /* ---------- 4. 게시판에 글 쓰기 (보이지 않는 창) ---------- */
  function editor(w) {
    try {
      var F = w.FroalaEditor;
      if (F && F.INSTANCES && F.INSTANCES.length) {
        var ed = F.INSTANCES[0];
        if (!ed.el || !ed.html || ed.el.getAttribute('contenteditable') !== 'true') return null;
        return function (h) { ed.html.set(h); try { ed.events.trigger('contentChanged'); } catch (e) {} var a = w.document.querySelector('textarea[name="content"]'); if (a) a.value = h; };
      }
      var jq = w.jQuery, box2 = jq && jq('[name="content"]').filter(function () { return jq(this).data('froala.editor'); });
      if (box2 && box2.length) return function (h) { box2.froalaEditor('html.set', h); };
      var area = w.document.querySelector('textarea[name="content"]');
      // 편집기가 켜지기 전의 원래 칸 : 편집기가 붙을 시간을 조금 준 뒤에만 쓴다
      if (area && area.offsetParent !== null && area.__fxqSeen && Date.now() - area.__fxqSeen > 2500) return function (h) { area.value = h; };
      if (area && !area.__fxqSeen) area.__fxqSeen = Date.now();
    } catch (e) {}
    return null;
  }
  // 카페24 글쓰기 화면은 편집기가 켜진 직후 폼을 한 번 초기화해 제목을 비운다
  // → 자리 잡을 시간을 준 뒤 채우고, 초기화돼도 남도록 기본값(defaultValue)까지 넣는다. cb(성공, 다시 채우기)
  function fill(w, p, cb) {
    var t0 = Date.now();
    (function wait() {
      var set = editor(w), subj = w.document.querySelector('input[name="subject"]');
      if (set && subj) {
        var put = function () {
          subj.value = subj.defaultValue = p.subject;
          set(p.html);
          var a = w.document.querySelector('textarea[name="content"]'); if (a) a.defaultValue = a.value = p.html;
          boardContact(w.document, p);
        };
        setTimeout(function () { put(); cb(true, put, subj); }, 1200);
        return;
      }
      if (Date.now() - t0 > 10000) { cb(false); return; }
      setTimeout(wait, 250);
    }());
  }
  function submitBtn(w) {
    return [].filter.call(w.document.querySelectorAll('a, button, input[type=button], input[type=submit]'), function (x) { return /^\s*(등록|확인|글쓰기 완료)\s*$/.test(x.textContent || x.value || '') && x.offsetParent !== null; }).pop();
  }
  function write(p, cb) {
    var f = doc.createElement('iframe'), loads = 0, over = false, alertMsg = '';
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1; f.title = '문의 저장';
    f.style.cssText = 'position:fixed;left:-10000px;top:0;width:1100px;height:900px;border:0;opacity:0;pointer-events:none';
    function hush(w) {   // 보이지 않는 창의 알림 · 확인 창을 손님 화면에 띄우지 않는다 (알림 문구는 받아 둔다)
      try {
        if (!w || w.__fxq) return;
        w.__fxq = 1;
        w.alert = function (m) { alertMsg = String(m || ''); };
        w.confirm = function (m) { return !/작성\s*중|임시\s*저장|불러오/.test(String(m)); };
      } catch (e) {}
    }
    // 글쓰기 화면이 불러오는 도중에 띄우는 확인 창까지 막도록, 문서가 바뀔 때마다 바로 덮어쓴다
    var early = setInterval(function () { try { hush(f.contentWindow); } catch (e) {} }, 15);
    function finish(ok, why, m) { if (over) return; over = true; clearInterval(early); setTimeout(function () { f.remove(); }, 0); cb(ok, why, m); }
    f.addEventListener('load', function () {
      loads++;
      var w = f.contentWindow, path = '';
      try { path = w.location.pathname; } catch (e) {}
      if (!path) { finish(false, 'blocked'); return; }                     // 다른 주소(카페24 보안 확인)로 넘어감
      if (/\/member\/login\.html/.test(path)) { finish(false, 'login'); return; }
      hush(w);
      if (/\/board\/consult\/write\.html$/.test(path)) {
        if (loads > 1) { finish(false, 'error', alertMsg ? '보내지 못했어요 : ' + alertMsg : ''); return; }
        fill(w, p, function (ok, put, subj) {
          if (!ok) { finish(false, 'error'); return; }
          var b = submitBtn(w);
          if (!b) { finish(false, 'error'); return; }
          setTimeout(function () {
            if (subj.value !== p.subject) put();   // 그새 비워졌으면 다시 채운다
            b.click();
            // 등록을 눌렀는데 그대로면 (빈 칸 · 확인 문자 등) 알림 문구를 보여 준다
            setTimeout(function () { if (!over && alertMsg) finish(false, 'error', '보내지 못했어요 : ' + alertMsg); }, 4000);
          }, 80);
        });
        return;
      }
      if (loads > 1) finish(true);   // 글쓰기 화면을 벗어남(목록 · 글 보기) = 저장됨
    });
    f.src = WRITE + '&fxq=1';
    doc.body.appendChild(f);
    setTimeout(function () { finish(false, 'error'); }, 30000);
  }

  // 게시판의 이메일 칸 · 「답변여부를 메일로 받으시겠습니까?」 를 답변 받는 방법에 맞춘다 (메일 → 예, 핸드폰 → 아니오)
  function boardContact(d, p) {
    var m = String(p.email || '').split('@'), e1 = d.querySelector('input[name="email1"]'), e2 = d.querySelector('input[name="email2"]');
    if (e1 && e2 && m.length === 2) { e1.value = e1.defaultValue = m[0]; e2.value = e2.defaultValue = m[1]; }
    consRe(d, p.reply === 'mail');
  }
  function consRe(d, mail) {
    [].forEach.call(d.querySelectorAll('input[name="cons_re"]'), function (r) {
      var lab = d.querySelector('label[for="' + r.id + '"]'), t = (lab && lab.textContent || r.nextSibling && r.nextSibling.textContent || '').trim();
      var yes = r.value === 'T' || /^예/.test(t);
      r.checked = r.defaultChecked = mail ? yes : !yes;
    });
  }

  /* ---------- 5. 1:1 맞춤상담 글쓰기 화면 : 핸드폰 칸 · 답변 받는 방법 ---------- */
  // 카페24 1:1 맞춤상담 게시판에는 핸드폰 칸이 없어서, 제목 아래에 칸을 더하고 [등록] 할 때 본문 맨 위에 적어 넣는다.
  // 원래의 「답변여부를 메일로 받으시겠습니까? 예 / 아니오」 는 「핸드폰으로 답변받기 / 메일로 답변받기」 로 바꿔 보여 준다.
  // (문의 창이 화면 뒤에서 여는 글쓰기 창(fxq=1)에서는 문의 창이 이미 본문에 적으므로 건너뛴다)
  function boardForm() {
    if (!/\/board\/consult\/write\.html$/.test(location.pathname) || /[?&]fxq=1\b/.test(location.search)) return;
    var f = doc.getElementById('boardWriteForm') || doc, subj = f.querySelector('input[name="subject"]');
    if (!subj || f.querySelector('.fxq-brow')) return;
    var row = doc.createElement('tr');
    row.className = 'fxq-brow';
    row.innerHTML = '<th scope="row">핸드폰</th><td><input type="tel" class="inputTypeText fxq-bphone" inputmode="tel" autocomplete="tel" maxlength="20" placeholder="010-0000-0000" aria-label="핸드폰"></td>';
    var tr = subj.closest('tr'); tr.parentNode.insertBefore(row, tr.nextSibling);
    var cons = f.querySelector('input[name="cons_re"]'), host = cons && cons.closest('span');
    var pick = doc.createElement('span');
    pick.className = 'fxq-bpick';
    pick.innerHTML = '<b>답변 받는 방법</b>' +
      '<label><input type="radio" name="fxq_reply" value="phone" checked> ' + REPLY.phone + '</label>' +
      '<label><input type="radio" name="fxq_reply" value="mail"> ' + REPLY.mail + '</label>';
    if (host) { host.style.display = 'none'; host.parentNode.insertBefore(pick, host.nextSibling); }
    else row.querySelector('td').appendChild(pick);
    function how() { var r = pick.querySelector('input:checked'); return r ? r.value : 'phone'; }
    pick.addEventListener('change', function () { consRe(doc, how() === 'mail'); });
    consRe(doc, false);
    // 보안 확인 뒤 이어서 보내기 : 문의 창에 적었던 값
    var dr = /[?&]fxq=draft\b/.test(location.search) && ssGet();
    if (dr) {
      row.querySelector('input').value = dr.phone || '';
      if (dr.reply === 'mail') { pick.querySelector('input[value="mail"]').checked = true; consRe(doc, true); }
    }
    // [등록] : 답변 받는 방법에 맞는 연락처가 있는지 보고, 본문 맨 위에 연락처 줄을 넣는다 (카페24 [등록] 보다 먼저 돈다)
    doc.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('a, button');
      if (!b || !/^\s*등록\s*$/.test(b.textContent || '') || !f.contains(b) && !b.closest('.ec-base-button')) return;
      var phone = row.querySelector('input').value.trim(), e1 = f.querySelector('input[name="email1"]'), e2 = f.querySelector('input[name="email2"]');
      var email = e1 && e2 && e1.value.trim() && e2.value.trim() ? e1.value.trim() + '@' + e2.value.trim() : '';
      var bad = how() === 'phone' && phone.replace(/\D/g, '').length < 9 ? '핸드폰으로 답변받으려면 핸드폰 번호를 적어 주세요.' :
        how() === 'mail' && !EMAIL.test(email) ? '메일로 답변받으려면 이메일 주소를 적어 주세요.' : '';
      if (bad) { e.preventDefault(); e.stopImmediatePropagation(); alert(bad); (how() === 'phone' ? row.querySelector('input') : e1 || row.querySelector('input')).focus(); return; }
      var set = editor(window);
      var now = (window.FroalaEditor && FroalaEditor.INSTANCES && FroalaEditor.INSTANCES[0] && FroalaEditor.INSTANCES[0].html) ? FroalaEditor.INSTANCES[0].html.get() : ((f.querySelector('textarea[name="content"]') || {}).value || '');
      if (set && !/<b>핸드폰<\/b>/.test(now)) set(contact({ phone: phone, email: email, reply: how() }) + now);
    }, true);
  }

  /* ---------- 6. 글쓰기 화면에 적던 내용 채우기 (보안 확인 뒤 이어서 보내기) ---------- */
  function draftPage() {
    if (!/\/board\/consult\/write\.html$/.test(location.pathname) || !/[?&]fxq=draft\b/.test(location.search)) return;
    var d = ssGet(); if (!d) return;
    fill(window, post(d), function (ok) {
      if (!ok) return;
      var n = doc.createElement('p');
      n.className = 'fxq-note';
      n.textContent = '1:1 견적문의 창에 적은 내용을 채워 두었어요. 확인한 뒤 아래 [등록] 을 눌러 주세요.';
      var t = doc.querySelector('.typeWrite'); if (t) t.parentNode.insertBefore(n, t);
    });
  }

  /* ---------- 7. 디자인 ---------- */
  function css() {
    if (doc.getElementById('fxq-css')) return;
    var s = doc.createElement('style'); s.id = 'fxq-css';
    var F = '"Pretendard Variable",Pretendard,system-ui,-apple-system,sans-serif';
    s.textContent = [
      /* 가격 숨김 · 목록 카드 : 요약 한 줄 + 문의 문구와 간격 */
      '.fxq-hide,ul.prdList .description .spec .st-rate{display:none!important}',
      'ul.prdList .description .spec > li.fxq-sum > span{display:block!important;flex:0 0 100%!important;order:2!important;min-width:0!important;max-width:100%!important;overflow:hidden!important;white-space:nowrap!important;text-overflow:ellipsis!important}',
      'ul.prdList .description .spec > li.fxq-ask > span{display:block!important;flex:0 0 100%!important;order:3!important;margin-top:10px!important}',
      /* 상세 버튼 */
      '.fxq-open{font-family:' + F + '!important;font-size:14px!important;font-weight:700!important;letter-spacing:-.01em!important;text-transform:none!important;cursor:pointer}',
      '.action_button .fxq-open{display:block;flex:1 1 0;width:100%;height:54px;margin:0;padding:0 16px;border:1px solid #111!important;border-radius:999px!important;background:#111!important;color:#fff!important;transition:background .2s,transform .2s}',
      '.action_button .fxq-open:hover,.action_button .fxq-open:focus-visible{background:#000!important;transform:translateY(-1px);outline:0;box-shadow:0 0 0 3px rgba(17,17,17,.18)}',
      '#orderFixArea .fxq-open--bar{display:block;width:100%;height:50px;border:0;border-radius:0;background:#111;color:#fff}',
      /* 창 */
      'html.fxq-lock,html.fxq-lock body{overflow:hidden!important}',
      '.fxq{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;font-family:' + F + ';-webkit-font-smoothing:antialiased}',
      '.fxq[hidden]{display:none}',
      '.fxq *,.fxq *::before,.fxq *::after{box-sizing:border-box}',
      '.fxq__dim{position:absolute;inset:0;background:rgba(10,10,10,.6);opacity:0;transition:opacity .22s;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px)}',
      '.fxq__card{position:relative;width:min(460px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:30px 28px 26px;border-radius:20px;background:#fff;color:#111;box-shadow:0 40px 80px -30px rgba(0,0,0,.55);opacity:0;transform:translateY(14px) scale(.98);transition:opacity .22s,transform .22s cubic-bezier(.2,.75,.2,1)}',
      '.fxq.is-on .fxq__dim{opacity:1}.fxq.is-on .fxq__card{opacity:1;transform:none}',
      '.fxq__x{position:absolute;top:14px;right:14px;display:grid;place-items:center;width:38px;height:38px;padding:0;border:0;border-radius:50%;background:#f3f3f3;color:#111;cursor:pointer}',
      '.fxq__x:hover,.fxq__x:focus-visible{background:#e6e6e6;outline:0}',
      '.fxq__eyebrow{margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.02em;color:#8a8a8a}',
      '.fxq__title{margin:0 44px 10px 0;font-size:20px;font-weight:700;line-height:1.35;letter-spacing:-.02em;word-break:keep-all}',
      '.fxq__lead{margin:0 0 18px;font-size:14px;line-height:1.6;color:#555;word-break:keep-all}',
      '.fxq__lead b{color:#111}',
      '.fxq__form{display:grid;gap:12px}',
      '.fxq__field{display:grid;gap:6px;margin:0}',
      '.fxq__field span{font-size:13px;font-weight:600;color:#333}',
      '.fxq:not(#fxq-x) .fxq__field input,.fxq:not(#fxq-x) .fxq__field textarea{width:100%;max-width:none;margin:0;padding:12px 14px;border:1px solid #d9d9d9!important;border-radius:12px!important;background:#fff;color:#111;font:400 16px/1.5 ' + F + ';-webkit-appearance:none;appearance:none}',
      '.fxq:not(#fxq-x) .fxq__field input{height:48px}',
      '.fxq__field textarea{min-height:120px;resize:vertical}',
      '.fxq:not(#fxq-x) .fxq__field input:focus,.fxq:not(#fxq-x) .fxq__field textarea:focus{border-color:#111!important;outline:0;box-shadow:0 0 0 3px rgba(17,17,17,.1)}',
      '.fxq__reply{display:flex;flex-wrap:wrap;gap:8px 18px;margin:2px 0 0;padding:0;border:0;min-width:0}',
      '.fxq__reply-t{flex:0 0 100%;margin:0 0 2px;font-size:13px;font-weight:600;color:#333}',
      '.fxq__reply label{display:inline-flex;align-items:center;gap:7px;font-size:14px;color:#222;cursor:pointer}',
      '.fxq__reply input{width:18px;height:18px;margin:0;accent-color:#111}',
      /* 1:1 맞춤상담 글쓰기 : 핸드폰 칸 · 답변 받는 방법 */
      '.fxq-brow .fxq-bphone{width:100%;max-width:360px}',
      '.fxq-bpick{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px 16px;margin-left:12px}',
      '.fxq-bpick b{font-weight:600}',
      '.fxq-bpick label{display:inline-flex;align-items:center;gap:5px;cursor:pointer}',
      '@media (max-width:640px){.fxq-bpick{display:flex;margin:10px 0 0}}',
      '.fxq__agree{display:flex;align-items:flex-start;gap:8px;margin:2px 0 0;font-size:12.5px;line-height:1.5;color:#666;cursor:pointer}',
      '.fxq__agree input{flex:none;width:18px;height:18px;margin:1px 0 0;accent-color:#111}',
      '.fxq__err{min-height:0;margin:0;font-size:13px;color:#d0342c}.fxq__err:empty{display:none}',
      '.fxq__btn{display:flex;align-items:center;justify-content:center;width:100%;height:52px;margin:0;padding:0 18px;border:1px solid #111;border-radius:999px;background:#111;color:#fff!important;font:700 15px/1 ' + F + ';letter-spacing:-.01em;text-decoration:none!important;cursor:pointer;transition:background .2s}',
      '.fxq__btn:hover,.fxq__btn:focus-visible{background:#000;outline:0;box-shadow:0 0 0 3px rgba(17,17,17,.18)}',
      '.fxq__btn.is-line{background:#fff;color:#111!important}.fxq__btn.is-line:hover,.fxq__btn.is-line:focus-visible{background:#f3f3f3}',
      '.fxq__btn:disabled{opacity:.6;cursor:default}',
      '.fxq__send{margin-top:4px}',
      '.fxq__row2{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '.fxq-note{margin:0 0 14px;padding:12px 14px;border-radius:10px;background:#f4f4f4;font-size:14px;color:#111}',
      '@media (max-width:640px){.fxq{place-items:end center;padding:0}.fxq__card{width:100%;max-height:92vh;padding:26px 18px calc(18px + env(safe-area-inset-bottom));border-radius:20px 20px 0 0}.fxq__title{font-size:18px}}',
      '@media (prefers-reduced-motion:reduce){.fxq__dim,.fxq__card{transition:none}}'
    ].join('');
    doc.head.appendChild(s);
  }

  /* ---------- 8. 시작 ---------- */
  function init() {
    css();
    tagCards(doc);
    detail();
    boardForm();
    draftPage();
    if ('MutationObserver' in window) {
      var q = 0;
      new MutationObserver(function () { if (!q) q = setTimeout(function () { q = 0; tagCards(doc); }, 120); }).observe(doc.body, { childList: true, subtree: true });
    }
    // 로그인하고 돌아왔을 때 (…#fx-quote) 창을 다시 연다
    if (location.hash === HASH && product) setTimeout(open, 300);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();

  window.FIXABLE_QUOTE = { open: open, close: close, board: BOARD };
}());
