/**
 * Automated WCAG 2.1 Contrast Checker for DrawToStory Design Tokens
 * Fails build (exit code 1) if regular text < 4.5:1 or large/bold text < 3.0:1
 */

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1, hex2) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = getLuminance(r1, g1, b1);
  const l2 = getLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Token pairs to verify
const pairs = [
  { name: 'Normal Text (bg -> ink)', bg: '#FFF9F0', fg: '#2E2540', min: 4.5, isLarge: false },
  { name: 'Soft Text (bg -> ink-soft)', bg: '#FFF9F0', fg: '#5E5370', min: 4.5, isLarge: false },
  { name: 'Caption Bold ≥14px (bg -> ink-faint)', bg: '#FFF9F0', fg: '#8A7F99', min: 3.0, isLarge: true },
  
  { name: 'Normal Text (surface -> ink)', bg: '#FFFFFF', fg: '#2E2540', min: 4.5, isLarge: false },
  { name: 'Soft Text (surface -> ink-soft)', bg: '#FFFFFF', fg: '#5E5370', min: 4.5, isLarge: false },
  { name: 'Caption Bold ≥14px (surface -> ink-faint)', bg: '#FFFFFF', fg: '#8A7F99', min: 3.0, isLarge: true },

  { name: 'Normal Text (surface-2 -> ink)', bg: '#FFF3E6', fg: '#2E2540', min: 4.5, isLarge: false },
  { name: 'Soft Text (surface-2 -> ink-soft)', bg: '#FFF3E6', fg: '#5E5370', min: 4.5, isLarge: false },

  { name: 'Primary Button (brand-600 -> white)', bg: '#D13A5E', fg: '#FFFFFF', min: 4.5, isLarge: false },
  { name: 'Primary Hover (brand-700 -> white)', bg: '#B92F51', fg: '#FFFFFF', min: 4.5, isLarge: false },

  { name: 'Status Success (bg -> text)', bg: '#DDF6E9', fg: '#166E48', min: 4.5, isLarge: false },
  { name: 'Status Warning (bg -> text)', bg: '#FFF1B8', fg: '#8A5A00', min: 4.5, isLarge: false },
  { name: 'Status Danger (bg -> text)', bg: '#FFE3EA', fg: '#B42343', min: 4.5, isLarge: false },
  { name: 'Status Info (bg -> text)', bg: '#CDE7FF', fg: '#1F5FA8', min: 4.5, isLarge: false },

  { name: 'Pastel Mint (bg -> ink)', bg: '#C9F0DD', fg: '#2E2540', min: 4.5, isLarge: false },
  { name: 'Pastel Sky (bg -> ink)', bg: '#CDE7FF', fg: '#2E2540', min: 4.5, isLarge: false },
  { name: 'Pastel Lavender (bg -> ink)', bg: '#E3D9FF', fg: '#2E2540', min: 4.5, isLarge: false },
  { name: 'Pastel Butter (bg -> ink)', bg: '#FFF1B8', fg: '#2E2540', min: 4.5, isLarge: false },
  { name: 'Pastel Peach (bg -> ink)', bg: '#FFD6BA', fg: '#2E2540', min: 4.5, isLarge: false },
];

console.log('=== WCAG 2.1 CONTRAST VERIFICATION ===');
let failed = false;

for (const pair of pairs) {
  const ratio = getContrastRatio(pair.bg, pair.fg);
  const passed = ratio >= pair.min;
  const ratioStr = ratio.toFixed(2) + ':1';
  const minStr = pair.min.toFixed(1) + ':1';

  if (passed) {
    console.log(`✓ PASS: ${pair.name.padEnd(46)} ${ratioStr.padStart(8)} (Min: ${minStr})`);
  } else {
    console.error(`✗ FAIL: ${pair.name.padEnd(46)} ${ratioStr.padStart(8)} (Min: ${minStr})`);
    failed = true;
  }
}

if (failed) {
  console.error('\nContrast check failed! One or more color token pairs do not meet WCAG contrast requirements.');
  process.exit(1);
} else {
  console.log('\nAll 19 color token pairs passed WCAG 2.1 AA requirements successfully.');
}
