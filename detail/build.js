// 상품 상세(상품 11~16) 내용 만들기 : node detail/build.js <영상 커밋> <이미지 커밋>
// 맨 위 소개 영상 → 원래 디자인센터 상세에서 「작업 진행 절차 안내」 아래부터
const fs = require('fs'), path = require('path');
const [VSHA, ISHA] = process.argv.slice(2);
const R = 'D:/1. 클라우드 작업폴더';
const CDN = 'https://cdn.jsdelivr.net/gh/tlsdmsrud902/fixable@';
const video =
  '<div style="max-width:922px;margin:0 auto;background:#000000;">\n' +
  '<video src="' + CDN + VSHA + '/video/detail-a-16x9.mp4" poster="' + CDN + VSHA + '/video/detail-a-16x9.jpg" controls autoplay muted loop playsinline preload="metadata" style="display:block;width:100%;max-width:922px;height:auto;margin:0 auto;border:0;"></video>\n' +
  '</div>\n';
const IMG = [  // 상품번호, 원본, 자르는 장, 잘라 낸 이미지, 라이브 데모
  [11, '5. wear902/designcenter/wear902', 24, 'wear-24-cut.jpg', 'https://wear902.cafe24.com/'],
  [12, '2.eppum/designcenter/eppum', 25, 'eppum-25-cut.jpg', 'https://eppum902.cafe24.com/'],
  [13, '1.baby/designcenter/baby', 24, 'baby-24-cut.jpg', 'https://babyyang902.cafe24.com/'],
  [14, '4. food902/designcenter/food902', 25, 'food-25-cut.jpg', 'https://food902.cafe24.com/']
];
for (const [no, dir, cut, img, demo] of IMG) {
  const src = fs.readFileSync(path.join(R, dir, 'product-content.html'), 'utf8').replace(/\r\n/g, '\n');
  const tags = src.match(/<img [^>]*>/g);
  const at = tags.findIndex(t => new RegExp('detail-' + String(cut).padStart(2, '0') + '\.jpg').test(t));
  if (at < 0) throw new Error('no cut ' + no);
  const first = tags[at].replace(/src="[^"]*"/, 'src="' + CDN + ISHA + '/detail/' + img + '"').replace('작업 진행 절차 안내 · ', '');
  const button = (src.match(/<p style="margin:0;padding:22px 0;[\s\S]*?<\/p>/) || [''])[0].replace(/href="[^"]*"/, 'href="' + demo + '"').replace('샘플 사이트 둘러보기', '라이브 데모 둘러보기');
  const out = video + '<div style="max-width:922px;margin:0 auto;">\n' + [first].concat(tags.slice(at + 1)).join('\n') + '\n' + button + '\n</div>\n';
  fs.writeFileSync(path.join(__dirname, 'p' + no + '.html'), out);
  console.log('p' + no, tags.length - at, 'images', out.length);
}
const HTML = [[15, process.argv[4]], [16, process.argv[5]]];   // INTER · PETPIA : HTML 상세에서 「한눈에 보는 핵심 기능」 부터
for (const [no, file] of HTML) {
  if (!file) continue;
  const src = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const open = src.match(/<div style="width:100%;max-width:900px;[^"]*">/)[0];
  const at = src.indexOf('  <div style="padding:26px 16px;background-color:#f3f6fc;text-align:center;">');
  if (at < 0 || src.indexOf('한눈에 보는 핵심 기능', at) - at > 400) throw new Error('no cut ' + no);
  const out = video + open + '\n' + src.slice(at);
  fs.writeFileSync(path.join(__dirname, 'p' + no + '.html'), out);
  console.log('p' + no, out.length);
}
