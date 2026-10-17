// Generates assets/sounds/chime.wav — a soft, singing-bowl-like bell (sine partials with slow decay).
// Usage: node scripts/make-chime.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const rate = 22050;
const seconds = 4;
const n = rate * seconds;
const partials = [
  [432, 1.0, 1.1],
  [864, 0.35, 1.8],
  [1296, 0.18, 2.6],
  [1181, 0.12, 2.2],
];
const samples = new Int16Array(n);
for (let i = 0; i < n; i++) {
  const t = i / rate;
  const attack = Math.min(1, t / 0.015);
  let v = 0;
  for (const [f, a, decay] of partials) v += a * Math.exp(-t * decay) * Math.sin(2 * Math.PI * f * t);
  samples[i] = Math.round(Math.max(-1, Math.min(1, (v * attack) / 1.7)) * 0.6 * 32767);
}
const data = Buffer.from(samples.buffer);
const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVE', 8);
header.write('fmt ', 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);
mkdirSync(new URL('../assets/sounds/', import.meta.url), { recursive: true });
writeFileSync(new URL('../assets/sounds/chime.wav', import.meta.url), Buffer.concat([header, data]));
console.log('wrote assets/sounds/chime.wav', (44 + data.length) / 1024 | 0, 'KB');
