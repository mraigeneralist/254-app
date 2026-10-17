// Generates the meditation end-bell sounds in assets/sounds/ (≈10 s each, loop-friendly):
//   bell_bowl.wav    — singing bowl, three warm strikes (default)
//   bell_gong.wav    — temple gong, deep inharmonic strikes with long decay
//   bell_chimes.wav  — wind chimes, light high notes at gentle random intervals
//   bell_marimba.wav — soft marimba, a calm pentatonic phrase
// Used in-app (preview) and by the native alarm (copied to res/raw by the expo-notifications plugin).
// Usage: node scripts/make-chime.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050;
const SECONDS = 10;
const N = RATE * SECONDS;

/** Adds a struck tone (sum of decaying sine partials) starting at `start` seconds. */
function strike(buf, start, partials, { gain = 1, attack = 0.01 } = {}) {
  const s0 = Math.floor(start * RATE);
  for (let i = s0; i < N; i++) {
    const t = (i - s0) / RATE;
    const env = Math.min(1, t / attack);
    let v = 0;
    for (const [f, a, decay] of partials) v += a * Math.exp(-t * decay) * Math.sin(2 * Math.PI * f * t);
    if (Math.abs(v) < 1e-6 && t > 2) break;
    buf[i] += gain * env * v;
  }
}

function writeWav(name, buf) {
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const samples = new Int16Array(N);
  for (let i = 0; i < N; i++) {
    const fade = Math.min(1, (N - i) / (RATE * 0.4)); // soft tail so the loop point is silent
    samples[i] = Math.round((buf[i] / peak) * 0.85 * fade * 32767);
  }
  const data = Buffer.from(samples.buffer);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(new URL(`../assets/sounds/${name}.wav`, import.meta.url), Buffer.concat([h, data]));
  console.log(`wrote assets/sounds/${name}.wav`, ((44 + data.length) / 1024) | 0, 'KB');
}

// deterministic random for the chimes
let seed = 254;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

mkdirSync(new URL('../assets/sounds/', import.meta.url), { recursive: true });

// Singing bowl — 432 Hz bowl with bright overtones, three strikes 3 s apart
{
  const b = new Float64Array(N);
  const bowl = [[432, 1.0, 0.9], [864, 0.35, 1.6], [1296, 0.18, 2.4], [1181, 0.12, 2.0]];
  for (const t of [0, 3, 6]) strike(b, t, bowl);
  writeWav('bell_bowl', b);
}

// Temple gong — low inharmonic partials with slow decay and a soft attack, two strikes
{
  const b = new Float64Array(N);
  const gong = [[98, 1.0, 0.45], [151, 0.7, 0.55], [227, 0.5, 0.7], [312, 0.35, 0.9], [419, 0.25, 1.2], [553, 0.15, 1.6], [101, 0.4, 0.5]];
  for (const t of [0, 5]) strike(b, t, gong, { attack: 0.04 });
  writeWav('bell_gong', b);
}

// Wind chimes — pentatonic high notes, short shimmering decays, gentle random spacing
{
  const b = new Float64Array(N);
  const notes = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093, 2349.3];
  let t = 0.05;
  while (t < SECONDS - 1.6) {
    const f = notes[Math.floor(rnd() * notes.length)];
    strike(b, t, [[f, 1, 1.4], [f * 2.76, 0.25, 3.5], [f * 5.4, 0.08, 6]], { gain: 0.55 + rnd() * 0.45, attack: 0.003 });
    t += 0.35 + rnd() * 0.9;
  }
  writeWav('bell_chimes', b);
}

// Soft marimba — wooden mallet tone (fundamental + 4th/10th partials), calm descending phrase, twice
{
  const b = new Float64Array(N);
  const phrase = [784, 659.3, 587.3, 523.3, 587.3, 392]; // G5 E5 D5 C5 D5 G4
  const tone = (f) => [[f, 1, 3.2], [f * 4, 0.18, 9], [f * 9.9, 0.05, 16]];
  for (const start of [0, 5]) phrase.forEach((f, k) => strike(b, start + k * 0.55, tone(f), { attack: 0.004, gain: k === phrase.length - 1 ? 1.1 : 0.9 }));
  writeWav('bell_marimba', b);
}
