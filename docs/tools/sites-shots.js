// 판매 상품(쇼핑몰 6종) 화면 캡처 : 저장소 6개를 ../tlsdmsrud902/<이름> 에 받아 두고 sites-serve.js 를 8801~8806 포트로 띄운 뒤 node docs/tools/sites-shots.js
// 결과는 _deploy/shots/<이름>-d|m|full|list|mlist.png (git 제외). 이어서 node docs/tools/fixable-images.js
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ALL = ['wear', 'k_eppum', 'baby', 'food902', 'inter', 'pet']; const ONLY = (process.env.ONLY||'').split(',').filter(Boolean); const sites = ALL;
(async () => {
  const b = await chromium.launch();
  for (let i = 0; i < sites.length; i++) { if (ONLY.length && !ONLY.includes(sites[i])) continue;
    const base = 'http://localhost:' + (8801 + i);
    for (const [tag, w, h, path, full] of [['d', 1440, 900, '/', false], ['m', 390, 844, '/', false], ['full', 1440, 900, '/', true], ['list', 1440, 900, '/product/list.html?cate_no=28', false], ['mlist', 390, 844, '/product/list.html?cate_no=24', false]]) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: tag[0] === 'm' ? 2 : 1, isMobile: tag[0] === 'm', hasTouch: tag[0] === 'm' });
      const p = await ctx.newPage();
      await p.goto(base + path, { waitUntil: 'networkidle', timeout: 45000 }).catch(e => console.log(sites[i], tag, e.message.slice(0, 80)));
      await p.addStyleTag({ content: '.cz-pop,#cz-pop,[class*="popup"],.pe-hero-scroll{display:none!important} *{scroll-behavior:auto!important}' });
      await p.evaluate(() => document.querySelectorAll('video.pe-world-video').forEach(v => { const s = v.getAttribute('poster') || v.dataset.cmsPoster; if (s) { const i = document.createElement('img'); i.src = s; i.onerror = () => { i.src = document.querySelector('[data-world-image="1"]').src; }; i.className = v.className; i.setAttribute('data-world-image', v.dataset.worldImage); v.replaceWith(i); } })); await p.waitForTimeout(2500);
      if (full) {
        const H = await p.evaluate(() => document.body.scrollHeight);
        for (let y = 0; y < H; y += 500) { await p.evaluate(y => scrollTo(0, y), y); await p.waitForTimeout(150); }
        await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(800);
      }
      await p.screenshot({ path: require('path').resolve(__dirname, '../../_deploy/shots', sites[i] + '-' + tag + '.png'), fullPage: full });
      await ctx.close();
    }
    console.log('done', sites[i]);
  }
  await b.close();
})();
