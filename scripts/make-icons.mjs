// Renders the app icon, adaptive icon layers, splash mark, notification icon and favicon from the
// "254" wordmark (Urbanist Black, as in the designs). Usage: node scripts/make-icons.mjs
import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';

const FONT = 'node_modules/@expo-google-fonts/urbanist/900Black/Urbanist_900Black.ttf';
const BROWN = '#4F3422';
const CREAM = '#F7F4F2';

/** Wordmark centered in a square canvas. `scale` = text size relative to canvas. */
function svg(size, { bg, fg, scale }) {
  const fs = Math.round(size * scale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ''}
    <text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Urbanist" font-weight="900"
      font-size="${fs}" letter-spacing="${-0.04 * fs}" fill="${fg}">254</text>
  </svg>`;
}

function render(file, size, opts) {
  const png = new Resvg(svg(size, opts), { font: { fontFiles: [FONT], loadSystemFonts: false, defaultFontFamily: 'Urbanist' } }).render().asPng();
  writeFileSync(file, png);
  console.log('wrote', file);
}

render('assets/icon.png', 1024, { bg: BROWN, fg: CREAM, scale: 0.42 });
// adaptive icon: foreground must sit inside the 66% safe zone
render('assets/android-icon-foreground.png', 1024, { fg: CREAM, scale: 0.3 });
render('assets/android-icon-background.png', 1024, { bg: BROWN, fg: BROWN, scale: 0 });
render('assets/android-icon-monochrome.png', 1024, { fg: '#FFFFFF', scale: 0.3 });
render('assets/splash-icon.png', 1024, { fg: CREAM, scale: 0.5 });
render('assets/notification-icon.png', 96, { fg: '#FFFFFF', scale: 0.48 });
render('assets/favicon.png', 48, { bg: BROWN, fg: CREAM, scale: 0.46 });
