// b1.html 을 프레임마다 그려 mp4 로 굽는다. out/mix.m4a(음성 + 음악)가 있으면 같이 넣는다.
//   node video/ad-b1/render.js               → out/b1.mp4   (가로 1920×1080)
//   node video/ad-b1/render.js v             → out/b1_v.mp4 (세로 1080×1920)
//   node video/ad-b1/render.js v --stills 1.5,9.9   → out/still_v_1.5.png … (확인용 정지 화면)
//   … 뒤에 b 를 붙이면 B 버전(앞부분 다른 훅) : render.js b → out/b1B.mp4 · render.js v b → out/b1B_v.mp4
// 순서 : node video/ad-b1/timeline.mjs --mix → node video/ad-b1/render.js → … render.js v
// 필요 : playwright(chromium), ffmpeg
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const VERT = args.includes('v');
const HB = args.includes('b');
const stillsArg = args.indexOf('--stills');
const stills = stillsArg >= 0 ? args[stillsArg + 1].split(',').map(Number) : null;
const FPS = 60;
const [W, H] = VERT ? [1080, 1920] : [1920, 1080];
const outDir = path.join(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('page error:', e.message));
  await page.goto('file://' + path.join(__dirname, 'b1.html') + '?' + (VERT ? 'o=v&' : '') + (HB ? 'h=b' : ''));
  await page.evaluate(() => window.ready);
  const dur = await page.evaluate(() => window.DUR);

  if (stills) {
    for (const t of stills) {
      await page.evaluate(t => window.render(t), t);
      await page.screenshot({ path: path.join(outDir, `still_${HB ? 'B' : ''}${VERT ? 'v' : 'h'}_${t}.png`) });
    }
    await browser.close();
    return;
  }

  const out = path.join(outDir, `b1${HB ? 'B' : ''}${VERT ? '_v' : ''}.mp4`);
  const mix = path.join(outDir, `mix${HB ? '_B' : ''}.m4a`);
  const audio = fs.existsSync(mix) ? ['-i', mix] : [];
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', ...audio,
    '-map', '0:v', ...(audio.length ? ['-map', '1:a', '-c:a', 'copy'] : []),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'slow', '-crf', '18', '-movflags', '+faststart', '-r', String(FPS), '-t', String(dur), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const total = Math.round(dur * FPS);
  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    await page.evaluate(t => window.render(t), i / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`${VERT ? 'v' : 'h'} ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
  console.log('done', out);
})();
