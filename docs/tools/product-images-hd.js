// 상품 상세 대표 이미지(고화질) 만들기 : node docs/tools/product-images-hd.js
// 카페24 확대 이미지는 500×500 으로 줄여 저장되는데 상세 화면은 720×900(4:5)으로 키워 보여 줘서 흐려진다.
// → 같은 목업을 4:5 비율 2배(1440×1800)로 그려 cafe24-assets/products/hd/p01~p06.jpg 로 낸다. (상세에서 fixable-quote.js 가 바꿔 끼운다)
// 재료 : skin1/SkinImg/fixable/work-<키>.webp (PC 1440×900) · mobile-<키>.webp (휴대폰 600 폭)
// 그리기 : 이 PC 의 크롬 + puppeteer-core (marketing/sns/reels 의 node_modules)
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const puppeteer = require(require.resolve('puppeteer-core', { paths: ['D:/1. 클라우드 작업폴더/marketing/sns/reels'] }));
const REPO = path.resolve(__dirname, '..', '..');
const SKIN = path.join(REPO, fs.readdirSync(REPO).find(d => /_s2_260925195134_d_skin1_E$/.test(d)), 'skin1');
const IMG = path.join(SKIN, 'SkinImg/fixable');
const OUT = path.join(REPO, 'cafe24-assets/products/hd');
fs.mkdirSync(OUT, { recursive: true });
const SITES = [['wear', 'p01'], ['eppum', 'p02'], ['baby', 'p03'], ['food', 'p04'], ['inter', 'p05'], ['pet', 'p06']];
const url = f => 'file:///' + path.join(IMG, f).replace(/\\/g, '/');
const W = 720, H = 900;
const page = key => `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}body{width:${W}px;height:${H}px;background:#efefef;position:relative;overflow:hidden}
.win{position:absolute;left:${W * .06}px;top:${H * .17}px;width:${W * .84}px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 26px 70px rgba(0,0,0,.18),0 2px 6px rgba(0,0,0,.08)}
.win i{display:flex;gap:6px;padding:10px 12px;background:#f4f4f4;border-bottom:1px solid #e6e6e6}.win i b{width:9px;height:9px;border-radius:50%;background:#d6d6d6}
.win img{display:block;width:100%}
.phone{position:absolute;right:${W * .06}px;bottom:${H * .09}px;width:${W * .27}px;background:#111;border-radius:30px;padding:7px;box-shadow:0 26px 60px rgba(0,0,0,.25)}
.phone img{display:block;width:100%;border-radius:24px}
</style><div class="win"><i><b></b><b></b><b></b></i><img src="${url('work-' + key + '.webp')}"></div><div class="phone"><img src="${url('mobile-' + key + '.webp')}"></div>`;
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--allow-file-access-from-files'] });
  for (const [key, code] of SITES) {
    const p = await b.newPage();
    await p.setViewport({ width: W, height: H, deviceScaleFactor: 2 });
    const tmp = path.join(OUT, code + '.html');
    fs.writeFileSync(tmp, page(key));
    await p.goto('file:///' + tmp.replace(/\\/g, '/'), { waitUntil: 'load' });
    await p.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; }))));
    const png = path.join(OUT, code + '.png');
    await p.screenshot({ path: png });
    await p.close();
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-q:v', '2', path.join(OUT, code + '.jpg')]);
    fs.unlinkSync(png); fs.unlinkSync(tmp);
    console.log(code, key);
  }
  await b.close();
})();
