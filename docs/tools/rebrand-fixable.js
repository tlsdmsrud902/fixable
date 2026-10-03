// wear902(여성 의류) → fixable(쇼핑몰 웹사이트 판매) 일괄 치환. 저장소 루트에서 node docs/tools/rebrand-fixable.js (이미 실행함)
const fs = require('fs');
const { execSync } = require('child_process');
const SKIP = /(^docs\/.*\.md$|swiper-bundle\.min\.js)/;
const files = execSync('git -c core.quotepath=off ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
  .filter(f => /\.(html|css|js|json|txt|xml|svg|py)$/i.test(f) && !SKIP.test(f) && fs.existsSync(f));
const KEYS = { outer: 'fashion', tops: 'family', dress: 'living' };   // 분류 키 : 24 · 25 · 26
const rules = [
  [/wear902_s2_260925195134_d_skin1_E/g, 'fixable902_s2_260925195134_d_skin1_E'],
  [/tlsdmsrud902\/wear(?![a-z0-9])/g, 'tlsdmsrud902/fixable'],
  [/wear902\.cafe24\.com/g, 'fixable902.cafe24.com'],
  [/"mall_id":"wear902"/g, '"mall_id":"fixable902"'],
  [/PG_NUMBER\/wear902/g, 'PG_NUMBER/fixable902'], [/help@wear902/g, 'help@fixable902'], [/upload\/wear902/g, 'upload/fixable902'],
  [/'wear902'(?=[,;)\]])/g, "'fixable902'"],
  [/SkinImg\/wear\//g, 'SkinImg/fixable/'],
  [/WEAR902_/g, 'FIXABLE_'], [/WEAR902/g, 'FIXABLE'], [/Wear902/g, 'Fixable'], [/WEAR 902/g, 'FIXABLE'],
  [/wear902/g, 'fixable'],
  [/wearedit/g, 'fixableedit'], [/WEAR EDIT/g, 'FIXABLE EDIT'],
  [/(?<![A-Za-z])wear(?![a-z])/g, 'fixable'], [/(?<![A-Za-z])Wear(?![a-z])/g, 'Fixable'], [/(?<![A-Za-z])WEAR(?![A-Za-z])/g, 'FIXABLE'],
  [/data-collection=(outer|tops|dress)\b/g, (m, k) => 'data-collection=' + KEYS[k]],
  [/(['"])(outer|tops|dress)\1(?=\s*[,:\]])/g, (m, q, k) => q + KEYS[k] + q],
  [/#(outer|tops|dress)\b/g, (m, k) => '#' + KEYS[k]],
  [/id="(outer|tops|dress)"/g, (m, k) => 'id="' + KEYS[k] + '"']
];
let changed = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let out = src;
  for (const [re, to] of rules) out = out.replace(re, to);
  if (out !== src) { fs.writeFileSync(f, out); changed++; }
}
console.log(changed, 'files changed');
