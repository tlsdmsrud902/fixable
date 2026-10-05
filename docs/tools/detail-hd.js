// 상품 11~16 상세 이미지 고화질판 : 디자인센터 상세 원본을 2배(1844px 폭)로 찍어 「작업 진행 절차」 아래부터 섹션 경계에서 나눈다
//   node docs/tools/detail-hd.js [이름…]   → detail/hd/<이름>/01.jpg …  (PETPIA 원본은 tlsdmsrud902/pet 을 _deploy/detail-hd/pet 에 받아 둔다)
const puppeteer = require('D:/1. 클라우드 작업폴더/5. wear902/docs/tools/designcenter/node_modules/puppeteer-core');  // wear902 의 puppeteer-core 를 빌려 쓴다
const fs = require('fs'), path = require('path');
const R = 'D:/1. 클라우드 작업폴더/';
const SRC = {
  wear: R + '5. wear902/_deploy/dc/detail.html',
  eppum: R + '2.eppum/_deploy/dc/detail.html',
  baby: R + '1.baby/_deploy/dc/detail.html',
  food: R + '4. food902/_deploy/dc/detail.html',
  inter: R + '3.inter/inter902_s2_260925195134_d_skin1_E/skin1/inter-designcenter-detail.html',
  petpia: path.join(__dirname, '../../_deploy/detail-hd/pet/adia902222_s2_260925195134_d_skin1_E/skin1/petpia-designcenter-detail.html'),
};
const W = 922, MAX = 1500, DSF = 2;
const only = process.argv.slice(2);
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', userDataDir: 'D:/tmp-chrome/p', args: ['--allow-file-access-from-files', '--disk-cache-dir=D:/tmp-chrome/c'], protocolTimeout: 600000 });
  for (const [name, file] of Object.entries(SRC)) {
    if (only.length && !only.includes(name)) continue;
    const pg = await b.newPage();
    await pg.setViewport({ width: W, height: MAX, deviceScaleFactor: DSF });
    await pg.goto('file:///' + file.split('\\').join('/'), { waitUntil: 'networkidle0', timeout: 180000 });
    await pg.evaluate(() => document.fonts.ready);
    // 늦게 불러오는 사진까지 모두 받기
    await pg.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager');
      for (let y = 0; y < document.documentElement.scrollHeight; y += 1200) { scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
      await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      scrollTo(0, 0);
    });
    // 원본에 남은 작은 오류 : inter 동그라미 로고가 펫의 P, 마지막 큰 제목이 한 글자만 셋째 줄로 넘어감
    await pg.evaluate(name => {
      const bm = document.querySelector('.intro .brandmark');
      if (name === 'inter' && bm) bm.textContent = 'I';
      const h2 = document.querySelector('.closing h2');
      if (h2) {
        h2.style.wordBreak = 'keep-all';
        const line = () => parseFloat(getComputedStyle(h2).lineHeight) || parseFloat(getComputedStyle(h2).fontSize) * 1.22;
        let fs = parseFloat(getComputedStyle(h2).fontSize);
        while (h2.getBoundingClientRect().height > line() * 2.5 && fs > 24) { fs -= 1; h2.style.fontSize = fs + 'px'; }
      }
    }, name);
    await new Promise(r => setTimeout(r, 1500));
    // 「작업 진행 절차」 아래 = 잘라 낼 시작점, 그 뒤 섹션 경계 = 나눌 수 있는 자리
    const { start, cuts, H, broken } = await pg.evaluate(() => {
      const top = e => e.getBoundingClientRect().top + scrollY;
      const proc = document.querySelector('#process');
      const start = Math.round(proc.getBoundingClientRect().bottom + scrollY);
      const sheet = proc.parentElement;
      const cuts = [...sheet.children].map(top).map(Math.round).filter(y => y > start);
      const H = Math.round(sheet.getBoundingClientRect().bottom + scrollY);
      const broken = [...document.images].filter(i => !i.naturalWidth).map(i => i.src);
      return { start, cuts, H, broken };
    });
    if (broken.length) console.log(name, '깨진 사진', broken);
    // 섹션 경계를 따라 MAX 이하로 묶고, 한 섹션이 MAX 보다 길면 그 안에서 나눈다
    const marks = [start];
    const bounds = cuts.concat(H).filter((y, i, a) => a.indexOf(y) === i).sort((x, y) => x - y);
    let cur = start, last = start;
    for (const y of bounds) {
      while (y - cur > MAX) {
        cur = last > cur ? last : cur + MAX;
        marks.push(cur); last = cur;
      }
      last = y;
    }
    if (H > cur) marks.push(H);
    const dir = path.join(__dirname, '../../detail/hd', name);
    fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const sizes = [];
    for (let k = 0; k < marks.length - 1; k++) {
      const y = marks[k], h = marks[k + 1] - y;
      await pg.evaluate(y => scrollTo(0, y), y); await new Promise(r => setTimeout(r, 250));
      const out = path.join(dir, String(k + 1).padStart(2, '0') + '.jpg');
      await pg.screenshot({ path: out, type: 'jpeg', quality: 86, clip: { x: 0, y, width: W, height: h }, captureBeyondViewport: false });
      sizes.push(h + 'px/' + Math.round(fs.statSync(out).size / 1024) + 'KB');
    }
    console.log(name, 'start', start, 'end', H, '→', sizes.join(' '));
    await pg.close();
  }
  await b.close();
})();
