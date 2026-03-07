/**
 * SVG icon helpers for map markers, panels, and popups.
 *
 * All functions return inline SVG strings sized to `size` (default 12).
 * Colors are passed explicitly so icons adapt to their context.
 *
 * Usage:
 *   el.innerHTML = svgIcon('fire', '#ff6600', 12);
 *   el.innerHTML = svgIcon('plane', color, 14, `transform="rotate(${heading})"`);
 */

export type IconName =
  | 'plane' | 'ship' | 'vessel' | 'anchor' | 'satellite-dish'
  | 'lightning' | 'shield' | 'warning' | 'fire' | 'volcano' | 'storm'
  | 'flood' | 'drought' | 'earthquake' | 'landslide' | 'snow' | 'fog'
  | 'thermometer' | 'ice' | 'water-color'
  | 'protest' | 'megaphone' | 'fist'
  | 'people' | 'conflict' | 'sword' | 'crosshair'
  | 'network' | 'laptop' | 'server' | 'cable' | 'plug'
  | 'economy' | 'bank' | 'exchange' | 'coin' | 'chart' | 'building'
  | 'rocket' | 'microscope' | 'target' | 'palette' | 'lightbulb'
  | 'cloud-aws' | 'cloud-gcp' | 'cloud-azure' | 'cloud-cf'
  | 'port' | 'oil' | 'factory' | 'package' | 'ferry'
  | 'alert' | 'nuclear' | 'radiation'
  | 'news' | 'globe' | 'unicorn' | 'diamond' | 'repair-ship'
  | 'stop' | 'flag' | 'satellite2' | 'hotspot' | 'compass';

/**
 * Returns an inline SVG string for the given icon name.
 * @param name    Icon identifier
 * @param color   Fill/stroke colour (hex or CSS value)
 * @param size    Width & height in px (default 12)
 * @param extra   Extra attributes injected on the <svg> element
 */
export function svgIcon(name: IconName, color: string, size = 12, extra = ''): string {
  const s = size;
  const h = s / 2;
  const c = color;
  // Common glow filter id — unique enough for inline use
  const shadow = `filter:drop-shadow(0 0 3px ${c}88)`;

  switch (name) {
    // ── Aviation ──────────────────────────────────────────────────────────
    case 'plane':
      // Fighter jet silhouette (from fighter-jet-svgrepo-com.svg)
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 -64 640 640" style="${shadow}" ${extra}>
        <path fill="${c}" d="M544 224l-128-16-48-16h-24L227.158 44h39.509C278.333 44 288 41.375 288 38s-9.667-6-21.333-6H152v12h16v164h-48l-66.667-80H18.667L8 138.667V208h8v16h48v2.666l-64 8v42.667l64 8V288H16v16H8v69.333L18.667 384h34.667L120 304h48v164h-16v12h114.667c11.667 0 21.333-2.625 21.333-6s-9.667-6-21.333-6h-39.509L344 320h24l48-16 128-16c96-21.333 96-26.583 96-32 0-5.417 0-10.667-96-32z"/>
      </svg>`;

    case 'ferry':
    case 'ship':
      // Adapted from warship-icon.svg — naval warship silhouette
      return `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" width="${s}" height="${s}" viewBox="0 0 512 183.27" style="${shadow}" ${extra}>
        <path fill="${c}" d="M3.94 99.58c61.77 6.59 104.79 11.27 161.95 14.65l14.89-69.53c5.51 0 11.1-.04 16.75-.09V0h18.21v44.38l12.62-.19V18.71h18.21v25.25c20.32-.2 40.52-.16 59.57.76 11.93.99 22.31 4.87 30.64 12.57 8.15 7.54 14.07 18.59 17.21 33.98l.11.55.02.59.61 29.19c22.02.51 29.63.95 52.62 1.34l100.71 1.74c2.04.03 4.75 1.99 3.71 3.71l-31.01 51.17c-1.03 1.7-1.71 3.71-3.71 3.71H50.06c-2.32 0-44.96-71.58-49.83-79.97-.81-1.39.57-4.05 3.71-3.72zm106.35-43.25h-10.21L98.7 44.24c-.13-1.05-.89-1.92-1.93-1.92h-24.7c-1.04 0-1.8.87-1.92 1.92l-1.39 12.09h-9.23c-1.46 0-2.3 1.28-2.69 2.68l-.86 3.11-44.72-7.37-1.53 7.66L52.7 74.03l-6.66 24.35c26.95 2.57 53.25 4.78 79.21 6.7l-12.28-46.07c-.37-1.42-1.25-2.68-2.68-2.68zm293.72 27.61h10.2l1.39-12.09c.12-1.05.87-1.92 1.92-1.92h24.7c1.06 0 1.81.87 1.93 1.92l1.39 12.09h9.23c1.48 0 2.3 1.28 2.68 2.68l.86 3.11 37.65-5.46 1.53 7.66-35.9 9.71 4.62 16.85-58.86-1.01-14.18-.25 8.15-30.61c.38-1.42 1.21-2.68 2.69-2.68zM278.44 67.81h54.22c4.87 7.34 8.34 14.84 9.38 22.53h-63.6V67.81zm-36.92-.01h23.33v23.08h-23.33V67.8z"/>
      </svg>`;

    case 'vessel':
      // Navy vessel marker — warship silhouette (from warship-icon.svg)
      return `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="geometricPrecision" text-rendering="geometricPrecision" image-rendering="optimizeQuality" fill-rule="evenodd" clip-rule="evenodd" width="${s}" height="${s}" viewBox="0 0 512 183.27" style="${shadow}" ${extra}>
        <path fill="${c}" d="M3.94 99.58c61.77 6.59 104.79 11.27 161.95 14.65l14.89-69.53c5.51 0 11.1-.04 16.75-.09V0h18.21v44.38l12.62-.19V18.71h18.21v25.25c20.32-.2 40.52-.16 59.57.76 11.93.99 22.31 4.87 30.64 12.57 8.15 7.54 14.07 18.59 17.21 33.98l.11.55.02.59.61 29.19c22.02.51 29.63.95 52.62 1.34l100.71 1.74c2.04.03 4.75 1.99 3.71 3.71l-31.01 51.17c-1.03 1.7-1.71 3.71-3.71 3.71H50.06c-2.32 0-44.96-71.58-49.83-79.97-.81-1.39.57-4.05 3.71-3.72zm106.35-43.25h-10.21L98.7 44.24c-.13-1.05-.89-1.92-1.93-1.92h-24.7c-1.04 0-1.8.87-1.92 1.92l-1.39 12.09h-9.23c-1.46 0-2.3 1.28-2.69 2.68l-.86 3.11-44.72-7.37-1.53 7.66L52.7 74.03l-6.66 24.35c26.95 2.57 53.25 4.78 79.21 6.7l-12.28-46.07c-.37-1.42-1.25-2.68-2.68-2.68zm293.72 27.61h10.2l1.39-12.09c.12-1.05.87-1.92 1.92-1.92h24.7c1.06 0 1.81.87 1.93 1.92l1.39 12.09h9.23c1.48 0 2.3 1.28 2.68 2.68l.86 3.11 37.65-5.46 1.53 7.66-35.9 9.71 4.62 16.85-58.86-1.01-14.18-.25 8.15-30.61c.38-1.42 1.21-2.68 2.69-2.68zM278.44 67.81h54.22c4.87 7.34 8.34 14.84 9.38 22.53h-63.6V67.81zm-36.92-.01h23.33v23.08h-23.33V67.8z"/>
      </svg>`;

    case 'anchor':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <circle fill="none" stroke="${c}" stroke-width="1.5" cx="8" cy="4" r="2"/>
        <line stroke="${c}" stroke-width="1.5" x1="8" y1="6" x2="8" y2="14"/>
        <path fill="none" stroke="${c}" stroke-width="1.5" d="M3 14 Q8 17 13 14"/>
        <line stroke="${c}" stroke-width="1.5" x1="3" y1="9" x2="13" y2="9"/>
      </svg>`;

    // ── Signals / Tech ────────────────────────────────────────────────────
    case 'satellite-dish':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="none" stroke="${c}" stroke-width="1.5" d="M2 12 Q5 2 14 4"/>
        <path fill="none" stroke="${c}" stroke-width="1.5" d="M4 14 Q6 8 12 6"/>
        <circle fill="${c}" cx="10" cy="6" r="2"/>
        <line stroke="${c}" stroke-width="1.5" x1="10" y1="8" x2="8" y2="14"/>
      </svg>`;

    case 'lightning':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M9 1 L4 9 L8 9 L7 15 L12 7 L8 7 Z"/>
      </svg>`;

    case 'shield':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" fill-opacity="0.85" d="M8 1 L14 4 L14 9 Q14 14 8 15 Q2 14 2 9 L2 4 Z"/>
        <path fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1" d="M8 3.5 L12.5 5.5 L12.5 9 Q12.5 13 8 14 Q3.5 13 3.5 9 L3.5 5.5 Z"/>
      </svg>`;

    case 'warning':
    case 'alert':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M8 1 L15 14 L1 14 Z"/>
        <rect fill="#000" fill-opacity="0.5" x="7.25" y="6" width="1.5" height="4.5" rx="0.5"/>
        <circle fill="#000" fill-opacity="0.5" cx="8" cy="12" r="0.9"/>
      </svg>`;

    // ── Natural disasters ─────────────────────────────────────────────────
    case 'fire':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M8 1 C8 1 11 5 11 8 C11 10 10 11 10 11 C10 11 12 9 11 6 C11 6 14 9 12 13 C11 15 9 16 8 16 C6 16 3 14.5 3 11 C3 8 5 6 5 6 C5 8 6 9 7 9 C7 7 6 4 8 1 Z"/>
      </svg>`;

    case 'volcano':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M1 15 L5 7 L7 9 L8 7 L9 9 L11 7 L15 15 Z"/>
        <path fill="${c}" fill-opacity="0.7" d="M6 5 Q8 1 10 5 L9.5 6 L8 3.5 L6.5 6 Z"/>
      </svg>`;

    case 'storm':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="none" stroke="${c}" stroke-width="1.5" d="M8 2 C10 2 12 4 12 6 C12 6 14 6 14 8 C14 10 12 10 12 10 L4 10 C4 10 2 10 2 8 C2 6 4 6 4 6 C4 4 6 2 8 2Z"/>
        <path fill="${c}" d="M9 10 L7 14 L9 14 L7 18"/>
      </svg>`;

    case 'flood':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M1 10 Q4 7 8 10 Q12 13 15 10 L15 15 Q12 18 8 15 Q4 12 1 15 Z"/>
        <path fill="${c}" fill-opacity="0.5" d="M1 7 Q4 4 8 7 Q12 10 15 7 L15 11 Q12 14 8 11 Q4 8 1 11 Z"/>
      </svg>`;

    case 'drought':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <circle fill="${c}" cx="8" cy="7" r="4"/>
        <line stroke="${c}" stroke-width="1.5" x1="8" y1="1" x2="8" y2="3"/>
        <line stroke="${c}" stroke-width="1.5" x1="8" y1="11" x2="8" y2="13"/>
        <line stroke="${c}" stroke-width="1.5" x1="2" y1="7" x2="4" y2="7"/>
        <line stroke="${c}" stroke-width="1.5" x1="12" y1="7" x2="14" y2="7"/>
        <line stroke="${c}" stroke-width="1.5" x1="3.5" y1="3.5" x2="5" y2="5"/>
        <line stroke="${c}" stroke-width="1.5" x1="11" y1="9" x2="12.5" y2="10.5"/>
        <line stroke="${c}" stroke-width="1.5" x1="11" y1="5" x2="12.5" y2="3.5"/>
        <line stroke="${c}" stroke-width="1.5" x1="3.5" y1="10.5" x2="5" y2="9"/>
      </svg>`;

    case 'earthquake':
      // Seismic waveform
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <polyline fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
          points="1,8 4,8 5,4 6,12 7,2 8,14 9,5 10,11 11,8 15,8"/>
      </svg>`;

    case 'landslide':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M1 14 L6 4 L10 10 L13 7 L15 14 Z"/>
        <circle fill="${c}" fill-opacity="0.6" cx="5" cy="11" r="2"/>
        <circle fill="${c}" fill-opacity="0.5" cx="9" cy="13" r="1.5"/>
      </svg>`;

    case 'snow':
      // Snowflake
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <line stroke="${c}" stroke-width="1.5" x1="8" y1="2" x2="8" y2="14"/>
        <line stroke="${c}" stroke-width="1.5" x1="2" y1="8" x2="14" y2="8"/>
        <line stroke="${c}" stroke-width="1.5" x1="3.5" y1="3.5" x2="12.5" y2="12.5"/>
        <line stroke="${c}" stroke-width="1.5" x1="12.5" y1="3.5" x2="3.5" y2="12.5"/>
        <circle fill="${c}" cx="8" cy="8" r="1.5"/>
      </svg>`;

    case 'fog':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <line stroke="${c}" stroke-width="1.5" stroke-linecap="round" x1="2" y1="5" x2="14" y2="5"/>
        <line stroke="${c}" stroke-width="1.5" stroke-linecap="round" x1="2" y1="8" x2="14" y2="8"/>
        <line stroke="${c}" stroke-width="1.5" stroke-linecap="round" x1="4" y1="11" x2="12" y2="11"/>
        <line stroke="${c}" stroke-width="1.5" stroke-linecap="round" x1="5" y1="14" x2="11" y2="14"/>
      </svg>`;

    case 'thermometer':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="none" stroke="${c}" stroke-width="1.2" x="6.5" y="1.5" width="3" height="9" rx="1.5"/>
        <rect fill="${c}" x="7.2" y="5" width="1.6" height="5.5" rx="0.5"/>
        <circle fill="${c}" cx="8" cy="13" r="2.5"/>
      </svg>`;

    case 'ice':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M8 1 L10 4 L14 3 L13 7 L16 9 L13 11 L14 15 L10 14 L8 17 L6 14 L2 15 L3 11 L0 9 L3 7 L2 3 L6 4 Z"/>
        <circle fill="rgba(255,255,255,0.3)" cx="8" cy="9" r="3"/>
      </svg>`;

    case 'water-color':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <ellipse fill="${c}" cx="8" cy="10" rx="5" ry="4"/>
        <path fill="${c}" d="M8 2 Q10 6 13 7 Q10 10 8 10 Q6 10 3 7 Q6 6 8 2Z"/>
      </svg>`;

    // ── Social/Conflict ───────────────────────────────────────────────────
    case 'protest':
    case 'megaphone':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M2 6 L2 10 L5 10 L10 13 L10 3 L5 6 Z"/>
        <line stroke="${c}" stroke-width="1.5" x1="5" y1="10" x2="5" y2="15"/>
        <path fill="none" stroke="${c}" stroke-width="1.3" d="M12 5 Q14 7 14 8 Q14 9 12 11"/>
      </svg>`;

    case 'fist':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="${c}" x="3" y="6" width="10" height="7" rx="2"/>
        <rect fill="${c}" x="5" y="3" width="2.5" height="4" rx="1"/>
        <rect fill="${c}" x="8" y="2" width="2.5" height="5" rx="1"/>
        <rect fill="${c}" x="10.5" y="4" width="2.5" height="4" rx="1"/>
        <rect fill="${c}" x="3" y="7" width="2" height="4" rx="1"/>
      </svg>`;

    case 'people':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <circle fill="${c}" cx="5" cy="4" r="2"/>
        <path fill="${c}" d="M2 14 L2 10 Q2 8 5 8 Q8 8 8 10 L8 14Z"/>
        <circle fill="${c}" fill-opacity="0.7" cx="11" cy="5" r="2"/>
        <path fill="${c}" fill-opacity="0.7" d="M8 14 L8 11 Q8 9 11 9 Q14 9 14 11 L14 14Z"/>
      </svg>`;

    case 'conflict':
    case 'sword':
      // Crossed swords
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <line stroke="${c}" stroke-width="1.8" stroke-linecap="round" x1="2" y1="2" x2="14" y2="14"/>
        <line stroke="${c}" stroke-width="1.8" stroke-linecap="round" x1="14" y1="2" x2="2" y2="14"/>
        <line stroke="${c}" stroke-width="2.5" stroke-linecap="round" x1="2" y1="5" x2="5" y2="2"/>
        <line stroke="${c}" stroke-width="2.5" stroke-linecap="round" x1="11" y1="14" x2="14" y2="11"/>
      </svg>`;

    case 'crosshair':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <circle fill="none" stroke="${c}" stroke-width="1.5" cx="8" cy="8" r="5"/>
        <line stroke="${c}" stroke-width="1.5" x1="8" y1="1" x2="8" y2="5"/>
        <line stroke="${c}" stroke-width="1.5" x1="8" y1="11" x2="8" y2="15"/>
        <line stroke="${c}" stroke-width="1.5" x1="1" y1="8" x2="5" y2="8"/>
        <line stroke="${c}" stroke-width="1.5" x1="11" y1="8" x2="15" y2="8"/>
      </svg>`;

    // ── Economy / Finance ─────────────────────────────────────────────────
    case 'economy':
    case 'coin':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <circle fill="none" stroke="${c}" stroke-width="1.5" cx="8" cy="8" r="6"/>
        <text fill="${c}" font-size="8" font-weight="bold" font-family="monospace" text-anchor="middle" x="8" y="11.5">$</text>
      </svg>`;

    case 'bank':
    case 'building':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="${c}" x="1" y="13" width="14" height="2"/>
        <rect fill="${c}" x="3" y="6" width="2" height="7"/>
        <rect fill="${c}" x="7" y="6" width="2" height="7"/>
        <rect fill="${c}" x="11" y="6" width="2" height="7"/>
        <path fill="${c}" d="M1 6 L8 1 L15 6Z"/>
      </svg>`;

    case 'exchange':
    case 'chart':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <polyline fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"
          points="1,13 4,9 7,11 10,5 13,7 15,3"/>
        <line stroke="${c}" stroke-width="1" stroke-opacity="0.4" x1="1" y1="15" x2="15" y2="15"/>
      </svg>`;

    // ── Tech ──────────────────────────────────────────────────────────────
    case 'network':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <circle fill="${c}" cx="8" cy="3" r="2"/>
        <circle fill="${c}" cx="3" cy="13" r="2"/>
        <circle fill="${c}" cx="13" cy="13" r="2"/>
        <line stroke="${c}" stroke-width="1.2" x1="8" y1="5" x2="4" y2="11"/>
        <line stroke="${c}" stroke-width="1.2" x1="8" y1="5" x2="12" y2="11"/>
        <line stroke="${c}" stroke-width="1.2" x1="5" y1="13" x2="11" y2="13"/>
      </svg>`;

    case 'laptop':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="none" stroke="${c}" stroke-width="1.3" x="3" y="3" width="10" height="7" rx="1"/>
        <rect fill="${c}" fill-opacity="0.3" x="4" y="4" width="8" height="5"/>
        <path fill="${c}" d="M1 11 L15 11 L14 13 L2 13Z"/>
      </svg>`;

    case 'server':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="none" stroke="${c}" stroke-width="1.3" x="2" y="2" width="12" height="4" rx="1"/>
        <rect fill="none" stroke="${c}" stroke-width="1.3" x="2" y="7" width="12" height="4" rx="1"/>
        <circle fill="${c}" cx="12" cy="4" r="0.8"/>
        <circle fill="${c}" cx="12" cy="9" r="0.8"/>
        <rect fill="${c}" x="3.5" y="3" width="6" height="2" rx="0.5"/>
        <rect fill="${c}" x="3.5" y="8" width="6" height="2" rx="0.5"/>
      </svg>`;

    case 'cable':
    case 'plug':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <line stroke="${c}" stroke-width="2" stroke-linecap="round" x1="1" y1="15" x2="6" y2="10"/>
        <rect fill="${c}" x="6" y="8" width="4" height="5" rx="1"/>
        <line stroke="${c}" stroke-width="1.5" x1="8" y1="4" x2="8" y2="8"/>
        <line stroke="${c}" stroke-width="1.5" x1="6" y1="2" x2="6" y2="5"/>
        <line stroke="${c}" stroke-width="1.5" x1="10" y1="2" x2="10" y2="5"/>
      </svg>`;

    // ── Space / Science ───────────────────────────────────────────────────
    case 'rocket':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M8 1 Q12 3 12 9 L10 11 L6 11 L4 9 Q4 3 8 1Z"/>
        <path fill="${c}" fill-opacity="0.6" d="M4 9 L2 13 L6 11Z"/>
        <path fill="${c}" fill-opacity="0.6" d="M12 9 L14 13 L10 11Z"/>
        <path fill="${c}" fill-opacity="0.8" d="M6 11 L8 16 L10 11Z"/>
      </svg>`;

    case 'microscope':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="${c}" x="7" y="2" width="2.5" height="7" rx="1" transform="rotate(-20 8 5)"/>
        <circle fill="none" stroke="${c}" stroke-width="1.3" cx="9" cy="3" r="1.5"/>
        <rect fill="${c}" x="5" y="8" width="6" height="2" rx="1"/>
        <rect fill="${c}" x="6" y="10" width="4" height="3"/>
        <line stroke="${c}" stroke-width="1.5" x1="2" y1="14" x2="14" y2="14"/>
      </svg>`;

    case 'target':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <circle fill="none" stroke="${c}" stroke-width="1.3" cx="8" cy="8" r="6"/>
        <circle fill="none" stroke="${c}" stroke-width="1.3" cx="8" cy="8" r="3.5"/>
        <circle fill="${c}" cx="8" cy="8" r="1.5"/>
      </svg>`;

    case 'palette':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M8 1 C4 1 1 4 1 8 C1 12 4 15 8 15 C9 15 9 14 9 13.5 C9 13 8.5 12.5 9 12 C9.5 11.5 10 12 10 12 L12 12 C14 12 15 11 15 9 C15 5 11.5 1 8 1Z"/>
        <circle fill="rgba(255,255,255,0.5)" cx="5" cy="6" r="1.2"/>
        <circle fill="rgba(255,255,255,0.5)" cx="8" cy="4" r="1.2"/>
        <circle fill="rgba(255,255,255,0.5)" cx="11" cy="6" r="1.2"/>
        <circle fill="rgba(255,255,255,0.5)" cx="5" cy="9" r="1.2"/>
      </svg>`;

    // ── Cloud providers (small colored squares with letter) ───────────────
    case 'cloud-aws':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" ${extra}>
        <rect fill="#FF9900" x="1" y="1" width="14" height="14" rx="2"/>
        <text fill="#fff" font-size="7" font-weight="bold" font-family="sans-serif" text-anchor="middle" x="8" y="11">AWS</text>
      </svg>`;

    case 'cloud-gcp':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" ${extra}>
        <rect fill="#4285F4" x="1" y="1" width="14" height="14" rx="2"/>
        <text fill="#fff" font-size="7" font-weight="bold" font-family="sans-serif" text-anchor="middle" x="8" y="11">GCP</text>
      </svg>`;

    case 'cloud-azure':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" ${extra}>
        <rect fill="#0078D4" x="1" y="1" width="14" height="14" rx="2"/>
        <text fill="#fff" font-size="8" font-weight="bold" font-family="sans-serif" text-anchor="middle" x="8" y="11">Az</text>
      </svg>`;

    case 'cloud-cf':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" ${extra}>
        <rect fill="#F48120" x="1" y="1" width="14" height="14" rx="2"/>
        <text fill="#fff" font-size="7" font-weight="bold" font-family="sans-serif" text-anchor="middle" x="8" y="11">CF</text>
      </svg>`;

    // ── Ports / Industry ──────────────────────────────────────────────────
    case 'port':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="${c}" x="7" y="1" width="2" height="9"/>
        <path fill="${c}" fill-opacity="0.8" d="M3 7 L8 10 L13 7"/>
        <path fill="${c}" d="M1 12 Q4 10 8 12 Q12 14 15 12 L15 15 Q12 17 8 15 Q4 13 1 15Z"/>
      </svg>`;

    case 'oil':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M5 4 L11 4 L12 6 L12 13 Q12 15 8 15 Q4 15 4 13 L4 6 Z"/>
        <rect fill="${c}" x="7" y="1" width="2" height="3.5"/>
        <path fill="${c}" fill-opacity="0.4" d="M5 8 Q8 7 11 8 Q11 11 8 11 Q5 11 5 8Z"/>
      </svg>`;

    case 'factory':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="${c}" x="1" y="8" width="14" height="7"/>
        <path fill="${c}" d="M1 12 L5 8 L5 12Z"/>
        <path fill="${c}" d="M5 12 L9 8 L9 12Z"/>
        <path fill="${c}" d="M9 12 L13 8 L13 12Z"/>
        <rect fill="${c}" x="3" y="3" width="3" height="5"/>
        <rect fill="${c}" x="7" y="1" width="2" height="7"/>
        <rect fill="${c}" x="11" y="3" width="2" height="5"/>
      </svg>`;

    case 'package':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" fill-opacity="0.9" d="M8 1 L15 5 L15 11 L8 15 L1 11 L1 5 Z"/>
        <path fill="${c}" fill-opacity="0.6" d="M1 5 L8 9 L15 5"/>
        <line stroke="${c}" stroke-opacity="0.6" stroke-width="1" x1="8" y1="9" x2="8" y2="15"/>
        <line stroke="${c}" stroke-opacity="0.5" stroke-width="1" x1="8" y1="1" x2="5" y2="3"/>
        <line stroke="${c}" stroke-opacity="0.5" stroke-width="1" x1="8" y1="1" x2="11" y2="3"/>
      </svg>`;

    // ── Nuclear / Radiation ────────────────────────────────────────────────
    case 'nuclear':
    case 'radiation':
      // Adapted from radiation-alt (1).svg (viewBox 0 0 24 24) — ringed radiation symbol with three sector arms
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" style="${shadow}" ${extra}>
        <path fill="${c}" d="m12,0C5.383,0,0,5.383,0,12s5.383,12,12,12,12-5.383,12-12S18.617,0,12,0Zm0,21c-4.963,0-9-4.037-9-9S7.037,3,12,3s9,4.037,9,9-4.037,9-9,9Zm-1.5-9c0-.828.672-1.5,1.5-1.5s1.5.672,1.5,1.5-.672,1.5-1.5,1.5-1.5-.672-1.5-1.5Zm8.5,0h-3.5c0-1.221-.628-2.294-1.576-2.92l1.926-2.927c.773.508,1.459,1.177,2,2,.781,1.188,1.151,2.525,1.15,3.848Zm-10.5,0h-3.5c-.001-1.323.368-2.66,1.15-3.848.541-.822,1.227-1.491,2-2l1.926,2.927c-.948.626-1.576,1.699-1.576,2.92Zm5.338,2.969l1.841,2.973c-1.07.665-2.326,1.06-3.678,1.06s-2.608-.395-3.678-1.06l1.84-2.973c.535.332,1.162.531,1.838.531s1.303-.199,1.838-.531Z"/>
      </svg>`;

    // ── Information ────────────────────────────────────────────────────────
    case 'news':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="none" stroke="${c}" stroke-width="1.3" x="2" y="2" width="12" height="12" rx="1"/>
        <line stroke="${c}" stroke-width="1.2" x1="4" y1="5.5" x2="12" y2="5.5"/>
        <line stroke="${c}" stroke-width="1.2" x1="4" y1="8" x2="12" y2="8"/>
        <line stroke="${c}" stroke-width="1.2" x1="4" y1="10.5" x2="9" y2="10.5"/>
      </svg>`;

    case 'globe':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <circle fill="none" stroke="${c}" stroke-width="1.3" cx="8" cy="8" r="6"/>
        <ellipse fill="none" stroke="${c}" stroke-width="1.1" cx="8" cy="8" rx="3" ry="6"/>
        <line stroke="${c}" stroke-width="1.1" x1="2" y1="8" x2="14" y2="8"/>
        <line stroke="${c}" stroke-width="1" x1="3" y1="5" x2="13" y2="5"/>
        <line stroke="${c}" stroke-width="1" x1="3" y1="11" x2="13" y2="11"/>
      </svg>`;

    // ── Misc ───────────────────────────────────────────────────────────────
    case 'unicorn':
      // Simplified: diamond shape with horn tip
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M8 1 L10 5 L15 8 L10 11 L8 15 L6 11 L1 8 L6 5 Z"/>
        <line stroke="rgba(255,255,255,0.6)" stroke-width="1" x1="8" y1="1" x2="8" y2="15"/>
        <line stroke="rgba(255,255,255,0.6)" stroke-width="1" x1="1" y1="8" x2="15" y2="8"/>
      </svg>`;

    case 'diamond':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M8 1 L15 7 L8 15 L1 7 Z"/>
        <path fill="rgba(255,255,255,0.25)" d="M8 1 L15 7 L8 8Z"/>
      </svg>`;

    case 'repair-ship':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M2 10 Q8 13 14 10 L13 12 Q8 15 3 12 Z"/>
        <rect fill="${c}" x="4" y="6" width="8" height="4" rx="1"/>
        <rect fill="${c}" x="6" y="3" width="4" height="3" rx="1"/>
        <line stroke="rgba(255,255,255,0.7)" stroke-width="1.2" x1="8" y1="4" x2="11" y2="7"/>
        <line stroke="rgba(255,255,255,0.7)" stroke-width="1.2" x1="9" y1="4" x2="9" y2="7"/>
      </svg>`;

    case 'lightbulb':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M8 1 C5 1 3 3.5 3 6 C3 8 4.5 9.5 5 10.5 L5 12 L11 12 L11 10.5 C11.5 9.5 13 8 13 6 C13 3.5 11 1 8 1Z"/>
        <rect fill="${c}" fill-opacity="0.7" x="5.5" y="12.5" width="5" height="1" rx="0.5"/>
        <rect fill="${c}" fill-opacity="0.5" x="6" y="14" width="4" height="1" rx="0.5"/>
      </svg>`;

    case 'stop':
      // Octagon stop sign
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M5 1 L11 1 L15 5 L15 11 L11 15 L5 15 L1 11 L1 5 Z"/>
        <rect fill="rgba(0,0,0,0.5)" x="5" y="7" width="6" height="2" rx="0.5"/>
      </svg>`;

    case 'flag':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <line stroke="${c}" stroke-width="1.5" x1="3" y1="1" x2="3" y2="15"/>
        <path fill="${c}" d="M3 1 L13 4 L3 7 Z"/>
      </svg>`;

    case 'satellite2':
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <rect fill="${c}" x="6" y="6" width="4" height="4" rx="1" transform="rotate(45 8 8)"/>
        <rect fill="${c}" fill-opacity="0.7" x="3" y="7.5" width="4" height="1" rx="0.5"/>
        <rect fill="${c}" fill-opacity="0.7" x="9" y="7.5" width="4" height="1" rx="0.5"/>
        <rect fill="${c}" fill-opacity="0.7" x="7.5" y="3" width="1" height="4" rx="0.5"/>
        <rect fill="${c}" fill-opacity="0.7" x="7.5" y="9" width="1" height="4" rx="0.5"/>
      </svg>`;

    case 'compass':
      // Adapted from cardinal-compass.svg (viewBox 0 0 24 24) — 4-pointed cardinal star with corner ticks
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" style="${shadow}" ${extra}>
        <path fill="${c}" d="M12,24l-3-9L0,12l9-3L12,0l3,9,9,3-9,3-3,9ZM7.425,7.425l.473-1.385-3.898-2.039,2.039,3.898,1.385-.473Zm9.15,0l1.385,.473,2.039-3.897-3.898,2.039,.473,1.385ZM7.424,16.575l-1.385-.473-2.039,3.898,3.897-2.039-.473-1.385Zm9.151,0l-.473,1.385,3.898,2.039-2.039-3.898-1.385,.473Z"/>
      </svg>`;

    case 'hotspot':
      // Location-pin with shadow base (adapted from land-layer-location.svg, scaled to 16×16)
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" style="${shadow}" ${extra}>
        <path fill="${c}" d="M11.3 1.37C10.42.49 9.26 0 8 0S5.58.49 4.7 1.37C2.88 3.19 2.88 6.17 5.21 8.48L6.87 10.1c.45.44 1.04.66 1.63.66s1.18-.22 1.63-.66l1.67-1.63C12.82 6.82 13.33 5.6 13.33 4.33s-.49-2.42-2.03-2.96zM8 6.63A2 2 0 0 1 6 4.63a2 2 0 0 1 4 0 2 2 0 0 1-2 2z"/>
        <path fill="${c}" fill-opacity="0.55" d="M16 11.18c0 .24-.12.45-.32.58l-6.57 3.94c-.34.2-.72.3-1.1.3s-.77-.1-1.1-.3L.32 11.75A.67.67 0 0 1 0 11.18c0-.23.13-.45.33-.57l3.24-1.9c.06.07.13.15.2.22l1.66 1.63c.69.67 1.6 1.04 2.56 1.04s1.88-.37 2.57-1.04l1.68-1.64c.06-.06.13-.13.19-.2l3.23 1.89c.2.12.33.34.33.57z"/>
      </svg>`;

    default:
      // Fallback: filled circle
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 16 16" ${extra}>
        <circle fill="${c}" cx="${h}" cy="${h}" r="${h - 1}"/>
      </svg>`;
  }
}

/**
 * Convenience: wrap svgIcon in a `<div style="...">` matching the old emoji container pattern.
 * fontSize / containerSize are in px.
 */
export function svgMarker(
  name: IconName,
  color: string,
  size = 12,
  extra = '',
): string {
  return svgIcon(name, color, size, extra);
}
