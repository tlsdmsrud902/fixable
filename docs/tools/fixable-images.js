// fixable 스킨 이미지 만들기 : node docs/tools/fixable-images.js
// 재료 : _deploy/shots/<사이트>-d.png (PC 1440×900) · -m.png (휴대폰 390×844 @2x) — docs/tools/sites-shots.js 로 찍는다
// 결과 : 스킨 이미지 → skin1/SkinImg/fixable/*.webp , 상품 이미지 → cafe24-assets/products/p01~p06.jpg (800×800)
// playwright 로 HTML 을 그려 PNG 로 찍고 ffmpeg 로 webp/jpg 변환한다.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..', '..');
const SKIN = path.join(REPO, fs.readdirSync(REPO).find(d => /_s2_260925195134_d_skin1_E$/.test(d)), 'skin1');
const OUT = path.join(SKIN, 'SkinImg/fixable');
const PRD = path.join(REPO, 'cafe24-assets/products');
const SHOTS = path.join(REPO, '_deploy/shots');
const TMP = path.join(REPO, '_deploy/img-tmp');
[OUT, PRD, TMP].forEach(d => fs.mkdirSync(d, { recursive: true }));

// 판매 상품 6종 : 키(이미지 이름) · 캡처 이름 · 상품 코드
const SITES = [
  { key: 'wear', shot: 'wear', code: 'p01', name: 'WEAR902' },
  { key: 'eppum', shot: 'k_eppum', code: 'p02', name: 'EPPUM902' },
  { key: 'baby', shot: 'baby', code: 'p03', name: 'BABYANG' },
  { key: 'food', shot: 'food902', code: 'p04', name: 'FOOD902' },
  { key: 'inter', shot: 'inter', code: 'p05', name: 'INTER902' },
  { key: 'pet', shot: 'pet', code: 'p06', name: 'PETPIA' },
  // 판매 상품이 아닌 작업물(샘플 사이트) : 상품 이미지는 만들지 않는다
  { key: 'trendin', shot: 'trendin', name: 'TRENDIN' }      // myjiwon.com (tlsdmsrud902/viral-finder, next dev 로 띄워 찍음)
];
// 세라핌(adia90222.cafe24.com) : 캡처가 없어 글자형 대표 이미지로 둔다. _deploy/shots/seraphin-d.png · -m.png 가 생기면 SITES 에 옮긴다
const src = (s, t) => 'file://' + path.join(SHOTS, s.shot + '-' + t + '.png');
// 글꼴 : Jost (가변 굵기). 웹 글꼴은 캡처 시점에 늦게 붙어서, 내려받은 파일을 직접 쓴다
const JOST = path.join(REPO, '_deploy/fonts/jost.woff2');
if (!fs.existsSync(JOST)) { fs.mkdirSync(path.dirname(JOST), { recursive: true }); execFileSync('curl', ['-s', '-o', JOST, 'https://fonts.gstatic.com/s/jost/v20/92zPtBhPNqw79Ij1E865zBUv7myRJTVBNIg.woff2']); }
const FONT = `<style>@font-face{font-family:Jost;src:url(file://${JOST}) format('woff2');font-weight:100 900}</style>`;
const BASE = `*{box-sizing:border-box;margin:0}body{font-family:Jost,sans-serif;overflow:hidden}
.win{background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.18),0 2px 6px rgba(0,0,0,.08)}
.win i{display:flex;gap:7px;padding:12px 14px;background:#f4f4f4;border-bottom:1px solid #e6e6e6}.win i b{width:11px;height:11px;border-radius:50%;background:#d6d6d6}
.win img{display:block;width:100%}
.phone{background:#111;border-radius:38px;padding:9px;box-shadow:0 30px 70px rgba(0,0,0,.25)}.phone img{display:block;width:100%;border-radius:30px}`;

// 브라우저 창 + 휴대폰 목업
const mock = (s, W, H, bg) => `${FONT}<style>${BASE}body{width:${W}px;height:${H}px;background:${bg};position:relative}
.win{position:absolute;left:${W * .07}px;top:${H * .12}px;width:${W * .74}px}
.phone{position:absolute;right:${W * .06}px;bottom:${H * .07}px;width:${W * .2}px}</style>
<div class="win"><i><b></b><b></b><b></b></i><img src="${src(s, 'd')}"></div><div class="phone"><img src="${src(s, 'm')}"></div>`;

// 히어로 : 6개 화면이 기울어진 격자로 흐르는 쇼릴
const typeTile = (W, H, word, sub) => `${FONT}<style>body{margin:0;width:${W}px;height:${H}px;background:#ededed;display:flex;align-items:center;justify-content:center;font-family:Jost}
.c{width:${W * .74}px;aspect-ratio:16/10;background:#121212;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.2);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:22px;color:#fff}
b{font-weight:500;font-size:${W * .085}px;letter-spacing:.18em;margin-right:-.18em}i{font-style:normal;font-size:${W * .014}px;letter-spacing:.3em;opacity:.6}</style><div class="c"><b>${word}</b><i>${sub}</i></div>`;
const hero = (W, H) => `${FONT}<style>${BASE}body{width:${W}px;height:${H}px;background:#0f0f10}
.g{position:absolute;left:-14%;top:-30%;width:128%;display:grid;grid-template-columns:repeat(3,1fr);gap:34px;transform:rotate(-8deg) skewX(4deg)}
.g .win{box-shadow:0 40px 80px rgba(0,0,0,.5)}.g .win:nth-child(3n+2){transform:translateY(-120px)}
.v{position:absolute;inset:0;background:linear-gradient(90deg,rgba(15,15,16,.86) 0%,rgba(15,15,16,.35) 55%,rgba(15,15,16,.1) 100%)}</style>
<div class="g">${[...SITES, ...SITES, ...SITES].slice(0, 18).map(s => `<div class="win"><i><b></b><b></b><b></b></i><img src="${src(s, 'd')}"></div>`).join('')}</div><div class="v"></div>`;

// 휴대폰 3대 나란히 (세로 카드)
const phones = (list, W, H, bg) => `${FONT}<style>${BASE}body{width:${W}px;height:${H}px;background:${bg};display:flex;align-items:center;justify-content:center;gap:${W * .04}px}
.phone{width:${W * .27}px}.phone:nth-child(2){transform:translateY(-${H * .06}px)}</style>${list.map(s => `<div class="phone"><img src="${src(s, 'm')}"></div>`).join('')}`;

const logo = (W, H, size, color, text) => `${FONT}<style>body{margin:0;width:${W}px;height:${H}px;display:flex;align-items:center;justify-content:center;background:transparent;font-family:Jost;font-weight:500;font-size:${size}px;letter-spacing:-.04em;color:${color}}</style><div>${text}</div>`;

(async () => {
  const b = await chromium.launch();
  async function render(html, W, H, file, opt = {}) {
    const p = await b.newPage({ viewport: { width: W, height: H } });
    const page = path.join(TMP, path.basename(file) + '.html');   // file:// 사진을 읽으려면 파일로 열어야 한다
    fs.writeFileSync(page, '<!doctype html><meta charset="utf-8">' + html);
    await p.goto('file://' + page, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.load('500 100px Jost')).catch(() => {});
    await p.evaluate(() => document.fonts.ready);
    const png = path.join(TMP, path.basename(file).replace(/\.\w+$/, '.png'));
    await p.screenshot({ path: png, omitBackground: !!opt.alpha });
    await p.close();
    const args = ['-v', 'error', '-y', '-i', png];
    if (file.endsWith('.webp')) args.push('-c:v', 'libwebp', ...(opt.alpha ? ['-lossless', '1'] : ['-quality', '82']));
    else args.push('-q:v', '3');
    execFileSync('ffmpeg', [...args, file]);
    console.log(path.relative(REPO, file));
  }
  const only = process.argv[2];
  if (!only || only === 'skin') {
    await render(hero(1920, 1080), 1920, 1080, path.join(OUT, 'hero-fixable.webp'));
    for (const s of SITES) {
      await render(mock(s, 1672, 1100, '#ededed'), 1672, 1100, path.join(OUT, 'mock-' + s.key + '.webp'));
      // PC 첫 화면 원본(작업물 카드 · 휴대폰 화면)
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(SHOTS, s.shot + '-d.png'), '-vf', 'scale=1440:-2', '-c:v', 'libwebp', '-quality', '80', path.join(OUT, 'work-' + s.key + '.webp')]);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(SHOTS, s.shot + '-m.png'), '-vf', 'scale=600:-2', '-c:v', 'libwebp', '-quality', '80', path.join(OUT, 'mobile-' + s.key + '.webp')]);
      console.log('work-' + s.key + '.webp · mobile-' + s.key + '.webp');
    }
    await render(typeTile(1672, 1100, 'SERAPHIN', 'SCROLL INTERACTIVE STORE'), 1672, 1100, path.join(OUT, 'mock-seraphin.webp'));
    await render(phones([SITES[0], SITES[1], SITES[4]], 1086, 1448, '#e9e9e9'), 1086, 1448, path.join(OUT, 'card-style.webp'));
    await render(phones([SITES[2], SITES[3], SITES[5]], 1086, 1448, '#1a1a1a'), 1086, 1448, path.join(OUT, 'card-life.webp'));
  }
  if (!only || only === 'logo') {
    await render(logo(560, 200, 120, '#111', 'fixable<span style="color:#9a9a9a">.</span>'), 560, 200, path.join(OUT, 'logo-fixable.webp'), { alpha: true });
    await render(logo(560, 200, 120, '#fff', 'fixable<span style="color:#777">.</span>'), 560, 200, path.join(OUT, 'logo-fixable-white.webp'), { alpha: true });
    await render(logo(2146, 724, 560, '#d4d4d4', 'fixable.'), 2146, 724, path.join(OUT, 'wordmark-fixable.webp'), { alpha: true });
  }
  if (!only || only === 'products') {
    for (const s of SITES.filter(x => x.code)) await render(mock(s, 800, 800, '#efefef').replace('top:96px', 'top:150px'), 800, 800, path.join(PRD, s.code + '.jpg'));
  }
  await b.close();
})();
