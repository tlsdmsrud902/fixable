// 상품 상세(상품 11~16) 내용 고화질판 : node detail/build-hd.js <이미지 커밋>
// 맨 위 소개 영상 → detail/hd/<이름>/NN.jpg (2배로 찍은 디자인센터 상세, 「작업 진행 절차」 아래부터). 맨 아래 사이트 둘러보기 버튼은 넣지 않는다
const fs = require('fs'), path = require('path');
const ISHA = process.argv[2];
if (!ISHA) throw new Error('이미지 커밋을 넣어 주세요');
const CDN = 'https://cdn.jsdelivr.net/gh/tlsdmsrud902/fixable@';
const VSHA = '7ab58114a05e3d78a28db8191cd1ff6f33351b55';
const video =
  '<div style="max-width:922px;margin:0 auto;background:#000000;">\n' +
  '<video src="' + CDN + VSHA + '/video/detail-a-16x9.mp4" poster="' + CDN + VSHA + '/video/detail-a-16x9.jpg" controls autoplay muted loop playsinline preload="metadata" style="display:block;width:100%;max-width:922px;height:auto;margin:0 auto;border:0;"></video>\n' +
  '</div>\n';
const LIST = [  // 상품번호, 폴더, 이름, 라이브 데모(버튼은 빼서 지금은 쓰지 않음)
  [11, 'wear', 'WEAR902', 'https://wear902.cafe24.com/'],
  [12, 'eppum', 'EPPUM', 'https://eppum902.cafe24.com/'],
  [13, 'baby', 'BABYANG', 'https://babyyang902.cafe24.com/'],
  [14, 'food', 'FOOD902', 'https://food902.cafe24.com/'],
  [15, 'inter', 'INTER', 'https://inter902.cafe24.com/'],
  [16, 'petpia', 'PETPIA', 'https://petpia902.cafe24.com/'],
];
// JPEG 크기 읽기 (SOF 표식) — 자리를 미리 잡아 두어 내려가며 불러올 때 화면이 덜컹이지 않게
function size(file) {
  const b = fs.readFileSync(file);
  for (let i = 2; i < b.length;) {
    const m = b[i + 1], len = b.readUInt16BE(i + 2);
    if (m >= 0xc0 && m <= 0xc3) return [b.readUInt16BE(i + 7), b.readUInt16BE(i + 5)];
    i += 2 + len;
  }
  throw new Error('no size ' + file);
}
for (const [no, dir, name] of LIST) {
  const files = fs.readdirSync(path.join(__dirname, 'hd', dir)).filter(f => /\.jpg$/.test(f)).sort();
  const imgs = files.map((f, i) => {
    const [w, h] = size(path.join(__dirname, 'hd', dir, f));
    return '<img src="' + CDN + ISHA + '/detail/hd/' + dir + '/' + f + '" alt="' + name + ' 쇼핑몰 스킨 상세 ' + (i + 1) + '" width="922" height="' + Math.round(h * 922 / w) + '" style="display:block;width:100%;max-width:922px;height:auto;margin:0;border:0;">';
  });
  const out = video + '<div style="max-width:922px;margin:0 auto;">\n' + imgs.join('\n') + '\n</div>\n';
  fs.writeFileSync(path.join(__dirname, 'p' + no + '.html'), out);
  console.log('p' + no, files.length, 'images', out.length);
}
