// b1.html 을 프레임마다 그려 mp4 로 굽는다.
//   node video/ad-b1/render.js            → out/b1_A.mp4 (A 훅)
//   node video/ad-b1/render.js B          → out/b1_B.mp4 (B 훅)
//   node video/ad-b1/render.js A --stills 1.5,4.8,13.9   → out/still_A_1.5.png … (확인용 정지 화면)
// 필요 : playwright(chromium), ffmpeg
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const V = args[0] === 'B' ? 'B' : 'A';
const stillsArg = args.indexOf('--stills');
const stills = stillsArg >= 0 ? args[stillsArg + 1].split(',').map(Number) : null;
const FPS = 60;
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--font-render-hinting=none'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.join(__dirname, 'b1.html') + '?v=' + V);
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => window.DUR);

  if (stills) {
    for (const t of stills) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(outDir, `still_${V}_${t}.png`) });
    }
    await browser.close();
    return;
  }

  const out = path.join(outDir, V === 'A' ? 'b1.mp4' : `b1_${V}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '17', '-movflags', '+faststart', '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(dur * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 120 === 0) console.log(`${V} ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();
