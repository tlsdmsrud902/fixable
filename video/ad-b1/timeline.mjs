// 나레이션 길이에 맞춰 장면 시간표를 만들고(timeline.js), 음성 + 음악을 섞는다(out/mix.m4a).
//   node video/ad-b1/timeline.mjs          → timeline.js (b1.html 이 읽음)
//   node video/ad-b1/timeline.mjs --mix    → out/mix.m4a (음성 + 음악, 음성 나올 때 음악을 낮춤)
// 음성 파일 : audio/*.mp3 (ElevenLabs), 음악 : audio/music.mp3
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.dirname(new URL(import.meta.url).pathname);
const TEMPO = 1.12;                                   // 광고 속도로 살짝 빠르게
// 원본 mp3 → 앞뒤 무음을 자르고 속도를 올린 wav (audio/trim/*.wav)
fs.mkdirSync(path.join(DIR, 'audio', 'trim'), { recursive: true });
const A = n => path.join(DIR, 'audio', 'trim', n + '.wav');
const trim = 'silenceremove=start_periods=1:start_threshold=-42dB:start_silence=0.03';
const prep = n => { if (!fs.existsSync(A(n))) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(DIR, 'audio', n + '.mp3'),
  '-af', `${trim},areverse,${trim},areverse,atempo=${TEMPO},aresample=48000`, A(n)]); return A(n); };
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
  inputs.push('-i', MUS);
  // 음악이 영상보다 짧으면 살짝 느리게 늘려 끝(마무리 음)을 영상 끝에 맞춘다
  const md = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', MUS]).toString();
  const stretch = md < DUR ? `atempo=${(md / DUR).toFixed(4)},` : '';
  const g = [
    ...parts,
    `${cues.map((_, i) => `[v${i}]`).join('')}amix=inputs=${m}:normalize=0,apad[vo]`,
    `[vo]asplit=2[vo1][vo2]`,
    `[${m}:a]${stretch}aresample=48000,volume=0.5,atrim=0:${DUR},afade=t=in:d=0.4,afade=t=out:st=${DUR - 1.5}:d=1.5[mu]`,
    `[mu][vo1]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350[duck]`,
    `[duck][vo2]amix=inputs=2:normalize=0,atrim=0:${DUR},loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[out]`,
  ].join(';');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', g, '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', out], { stdio: 'inherit' });
  console.log('mix', out);
}
