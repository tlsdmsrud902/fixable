// 나레이션 길이에 맞춰 장면 시간표를 만들고(timeline.js), 음성 + 음악을 섞는다(out/mix.m4a).
//   node video/ad-b1/timeline.mjs          → timeline.js (b1.html 이 읽음)
//   node video/ad-b1/timeline.mjs --mix    → out/mix.m4a (음성 + 음악, 음성 나올 때 음악을 낮춤)
// 음성 파일 : audio/*.mp3 (ElevenLabs), 음악 : audio/music.mp3
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.dirname(new URL(import.meta.url).pathname);
const TEMPO = 1.10;                                   // 광고 속도로 아주 살짝 빠르게
// 원본 mp3 → 앞 무음만 바짝 자르고, 끝은 말끝 여운(0.25초)을 남긴 채 부드럽게 줄인 wav (audio/trim/*.wav)
//  ※ 끝을 -42dB 로 바짝 자르면 마지막 음절 꼬리가 잘려 「뚝」 끊겨 들린다 → 끝은 -60dB · 0.25초 남김 + 페이드
fs.mkdirSync(path.join(DIR, 'audio', 'trim'), { recursive: true });
const A = n => path.join(DIR, 'audio', 'trim', n + '.wav');
const head = 'silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.05';
const tail = 'silenceremove=start_periods=1:start_threshold=-60dB:start_silence=0.25';
const prep = n => {
  if (!fs.existsSync(A(n))) {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(DIR, 'audio', n + '.mp3'),
      '-af', `${head},areverse,${tail},afade=t=in:d=0.12,areverse,atempo=${TEMPO},aresample=48000`, A(n)]);
  }
  return A(n);
};
const dur = n => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', prep(n)]).toString();

const cues = [];                                      // [초, 파일]
const SC = {};
const FIX_T = {};
let t = 0;
const say = (n, at) => { cues.push([+at.toFixed(3), n]); return at + dur(n); };

SC.hook = t; t = Math.max(3.4, say('n_hook', t + .35) + .5);
SC.why = t; t = Math.max(t + 4.6, say('n_why', t + .3) + .6);
for (const i of [1, 2, 3, 4, 5]) {
  const id = 'f' + i, tp = t;
  SC[id] = tp;
  let e = say('c' + i, tp + .35);
  e = say(`n${i}p`, e + .25);
  const ta = e + .35;
  FIX_T[id] = [+tp.toFixed(3), +ta.toFixed(3)];
  t = ta + Math.max(3.5, say(`n${i}a`, ta + .45) - ta + .55);
}
SC.recap = t; t = Math.max(t + 3.4, say('n_recap', t + .4) + .7);
SC.cta = t; t = Math.max(t + 3.0, say('n_cta', t + .3) + .6);
SC.end = t; t = say('n_end', t + .6) + 1.4;
const DUR = +t.toFixed(2);

for (const k in SC) SC[k] = +SC[k].toFixed(3);
fs.writeFileSync(path.join(DIR, 'timeline.js'),
  `// timeline.mjs 가 나레이션 길이로 만든 장면 시간표 — 손으로 고치지 말 것\nwindow.TL = ${JSON.stringify({ DUR, SC, FIX_T, cues }, null, 1)};\n`);
console.log('DUR', DUR, SC);

if (process.argv.includes('--mix')) {
  const out = path.join(DIR, 'out', 'mix.m4a');
  const inputs = [], parts = [];
  cues.forEach(([at, n], i) => {
    inputs.push('-i', A(n));
    parts.push(`[${i}:a]volume=1.15,adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}[v${i}]`);
  });
  const m = cues.length;
  const MUS = path.join(DIR, 'audio', 'music.mp3');
  // 음악이 영상보다 짧을 때만 한 번 더 이어 붙인다 (3초 겹쳐 자연스럽게)
  const md = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', MUS]).toString();
  // 조금(10% 이내) 짧으면 귀에 안 들릴 만큼 늘리고, 많이 짧으면 이어 붙인다
  const stretch = md < DUR && md / DUR > 0.9 ? `atempo=${(md / DUR).toFixed(4)},` : '';
  const loop = md < DUR && !stretch;
  inputs.push('-i', MUS, ...(loop ? ['-i', MUS] : []));
  const g = [
    ...parts,
    `${cues.map((_, i) => `[v${i}]`).join('')}amix=inputs=${m}:normalize=0,apad[vo]`,
    `[vo]asplit=2[vo1][vo2]`,
    loop ? `[${m}:a][${m + 1}:a]acrossfade=d=3[mm]` : `[${m}:a]anull[mm]`,
    `[mm]${stretch}aresample=48000,volume=0.5,atrim=0:${DUR},afade=t=in:d=0.4,afade=t=out:st=${DUR - 1.5}:d=1.5[mu]`,
    `[mu][vo1]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350[duck]`,
    `[duck][vo2]amix=inputs=2:normalize=0,atrim=0:${DUR},loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]`,
  ].join(';');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', g, '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', out], { stdio: 'inherit' });
  console.log('mix', out);
}
