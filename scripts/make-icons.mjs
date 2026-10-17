// Renders the app icons from the "Mood Ring · Warm Cream" design (Claude Design: 254/254 App Icon.html, option 3c)
// plus the splash mark, notification icon and favicon. Usage: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const FONT = 'node_modules/@expo-google-fonts/urbanist/900Black/Urbanist_900Black.ttf';
const CREAM_200 = '#F1EDEA'; // icon background (3c)
const BROWN_800 = '#4F3422'; // wordmark ink (3c)
const CREAM_100 = '#F7F4F2';
const MOODS = ['#9BB167', '#FFCE5C', '#C0A794', '#FE814B', '#A694F5']; // green, yellow, taupe, orange, purple

/**
 * The 512×512 design: five rounded arcs on r=196 (stroke 30, 200-unit dashes every 246) rotated -81°,
 * and "254" in Urbanist Black 168px with -0.05em tracking, nudged 3px left (design: padding-right 6px).
 */
function design({ ring = MOODS, ink = BROWN_800 } = {}) {
  const arcs = ring
    .map((c, i) => `<circle cx="256" cy="256" r="196" stroke="${c}" stroke-dasharray="200 1032" stroke-dashoffset="${-246 * i}"/>`)
    .join('');
  return `<g fill="none" stroke-width="30" stroke-linecap="round" transform="rotate(-81 256 256)">${arcs}</g>
    <text x="253" y="256" text-anchor="middle" dominant-baseline="central" font-family="Urbanist" font-weight="900"
      font-size="168" letter-spacing="${-0.05 * 168}" fill="${ink}">254</text>`;
}

/** Place the 512 design into a `size` canvas, scaled to `scale` of the canvas width, centered. */
function canvas(size, { bg, scale = 1, ...opts }) {
  const s = (size * scale) / 512;
  const off = (size - 512 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    <g transform="translate(${off} ${off}) scale(${s})">${design(opts)}</g>
  </svg>`;
}

function wordmarkOnly(size, { fg, scale }) {
  const fs = Math.round(size * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Urbanist" font-weight="900"
      font-size="${fs}" letter-spacing="${-0.04 * fs}" fill="${fg}">254</text></svg>`;
}

function render(file, svg) {
  const png = new Resvg(svg, { font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Urbanist' } }).render().asPng();
  writeFileSync(file, png);
  console.log('wrote', file);
}

// Full icon (legacy launchers, Play Store listing, iOS): the design edge to edge.
render('assets/icon.png', canvas(1024, { bg: CREAM_200 }));
// Android adaptive icon: solid background layer + foreground scaled into the 66% safe zone (the OS masks the rest).
render('assets/android-icon-background.png', `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${CREAM_200}"/></svg>`);
render('assets/android-icon-foreground.png', canvas(1024, { scale: 0.64 }));
// Android 13+ themed icon: single colour, the system tints it.
render('assets/android-icon-monochrome.png', canvas(1024, { scale: 0.64, ring: MOODS.map(() => '#FFFFFF'), ink: '#FFFFFF' }));
// Splash (on the brown splash background) and notification icon keep the plain wordmark.
render('assets/splash-icon.png', wordmarkOnly(1024, { fg: CREAM_100, scale: 0.5 }));
render('assets/notification-icon.png', wordmarkOnly(96, { fg: '#FFFFFF', scale: 0.48 }));
render('assets/favicon.png', canvas(48, { bg: CREAM_200 }));
