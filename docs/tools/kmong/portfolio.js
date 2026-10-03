// 크몽 포트폴리오 이미지 (식품몰과 같은 규격)
//   node docs/tools/kmong/portfolio.js [사이트] [출력 폴더]
//   00_대표이미지_1200x1200.jpg : PC 첫 화면(창 틀) + 휴대폰 첫 화면
//   01~04_PC화면.jpg            : PC 메인 전체 캡처를 1000px 폭으로 줄여 2500px 씩 4장
//   05_모바일화면.jpg            : 휴대폰 3대 (첫 화면 · 스타일 고르기 · 인기 상품)
const puppeteer = require('../designcenter/node_modules/puppeteer-core');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const SITE = process.argv[2] || 'https://wear902.cafe24.com/';
const OUT = path.resolve(process.argv[3] || path.join(__dirname, '../../../_deploy/kmong/portfolio'));
const TMP = path.join(OUT, 'tmp'); fs.mkdirSync(TMP, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ff = (...a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a]);
const MOBILE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
const CLEAN = '*,*::before,*::after{transition-duration:0s!important;animation-duration:0s!important;animation-delay:0s!important} #cz-pop,.cz-pop,.cms-bar{display:none!important}';

async function open(pg, vp) {
  await pg.setViewport(vp);
  await pg.goto(SITE, { waitUntil: 'networkidle2', timeout: 90000 });
  if (/challenge/.test(pg.url())) throw new Error('CHALLENGE');
  await sleep(3500);
  await pg.addStyleTag({ content: CLEAN });
  await pg.evaluate(() => { const v = document.querySelector('.pe-world-video'); if (v) { v.pause(); v.currentTime = 1.2; } });
}
async function loadAll(pg) {
  const H = await pg.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await pg.evaluate(y => window.scrollTo(0, y), y); await sleep(90); }
  await sleep(2000); await pg.evaluate(() => window.scrollTo(0, 0)); await sleep(800);
}
async function toSec(pg, name, off) {
  await pg.evaluate((name, off) => { const s = [...document.querySelectorAll('[data-cms]')].find(e => e.getAttribute('data-cms') === name); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - off); }, name, off);
  await sleep(1500);
}

(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', protocolTimeout: 300000 });
  const pg = await b.newPage();
  await pg.setUserAgent((await b.userAgent()).replace('HeadlessChrome', 'Chrome'));

  // PC 첫 화면 · 전체
  await open(pg, { width: 1280, height: 820 });
  await pg.screenshot({ path: path.join(TMP, 'desk.png') });
  await loadAll(pg);
  await pg.screenshot({ path: path.join(TMP, 'full.png'), fullPage: true });

  // 휴대폰 3장
  await open(pg, MOBILE);
  await pg.screenshot({ path: path.join(TMP, 'm1.png') });
  await loadAll(pg);
  await toSec(pg, '스타일 고르기', 110); await pg.screenshot({ path: path.join(TMP, 'm2.png') });
  await toSec(pg, '인기 상품 제목', 110); await pg.screenshot({ path: path.join(TMP, 'm3.png') });
  await b.close();

  // 01~04 : 1000px 폭, 2500px 씩
  for (let i = 0; i < 4; i++) ff('-i', path.join(TMP, 'full.png'), '-vf', `scale=1000:-1,crop=1000:2500:0:${i * 2500}`, '-q:v', '3', path.join(OUT, `0${i + 1}_PC화면.jpg`));

  // 00 대표 · 05 모바일 : HTML 로 틀을 그려 캡처
  const html = (body) => `<!doctype html><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}body{background:linear-gradient(180deg,#f3f3f3,#e4e4e4)}
  .win{position:absolute;background:#151515;border-radius:22px;padding:42px 14px 14px;box-shadow:0 30px 60px #0003}.win:before{content:"";position:absolute;left:18px;top:16px;width:12px;height:12px;border-radius:50%;background:#ff5f57;box-shadow:22px 0 #febc2e,44px 0 #28c840}
  .win img{display:block;width:100%}.ph{position:absolute;background:#111;border-radius:46px;padding:12px;box-shadow:0 30px 60px #0004}.ph img{display:block;width:100%;border-radius:34px}</style>${body}`;
  const f = n => 'file:///' + path.join(TMP, n).replace(/\\/g, '/');
  fs.writeFileSync(path.join(TMP, 'rep.html'), html(`<div style="position:relative;width:1200px;height:1200px"><div class="win" style="left:46px;top:130px;width:1028px"><img src="${f('desk.png')}"></div><div class="ph" style="left:838px;top:528px;width:314px"><img src="${f('m1.png')}" style="height:620px;object-fit:cover;object-position:top"></div></div>`));
  fs.writeFileSync(path.join(TMP, 'mob.html'), html(`<div style="position:relative;width:1200px;height:900px">${['m1', 'm2', 'm3'].map((n, i) => `<div class="ph" style="left:${33 + i * 385}px;top:80px;width:354px"><img src="${f(n + '.png')}" style="height:714px;object-fit:cover;object-position:top"></div>`).join('')}</div>`));
  const b2 = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  const p2 = await b2.newPage();
  for (const [h, w, hh, out] of [['rep.html', 1200, 1200, '00_대표이미지_1200x1200.jpg'], ['mob.html', 1200, 900, '05_모바일화면.jpg']]) {
    await p2.setViewport({ width: w, height: hh });
    await p2.goto(f(h), { waitUntil: 'load' }); await sleep(500);
    await p2.screenshot({ path: path.join(TMP, 'x.png') });
    ff('-i', path.join(TMP, 'x.png'), '-q:v', '3', path.join(OUT, out));
  }
  await b2.close();
  console.log('done', fs.readdirSync(OUT).filter(n => n.endsWith('.jpg')));
})();
