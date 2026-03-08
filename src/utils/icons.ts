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
  | 'port' | 'oil' | 'factory' | 'package' | 'ferry' | 'carrier'
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
      // Adapted from warship-simple.svg — naval warship silhouette
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 2095 2095" style="${shadow}" ${extra}>
        <path fill="${c}" fill-rule="nonzero" d="M 2078.29 1175.37 C 2078.29 1187.92 2018.45 1351.02 2005.91 1370.32 C 1993.36 1389.62 1966.14 1389.62 1966.14 1389.62 L 147 1389.62 C 122.873 1271.88 16.713 1151.25 16.713 1150.28 C 16.713 1149.32 441.352 1151.25 436.526 1150.28 L 436.526 1113.61 L 275.453 1078.87 L 285.104 1046.05 L 442.413 1063.42 C 452.064 1046.05 474.261 1044.12 481.886 1044.12 C 489.606 1044.12 561.988 1044.12 561.988 1044.12 C 589.059 1044.12 593.884 1047.02 593.884 1083.69 C 593.884 1120.36 593.884 1152.21 593.884 1152.21 L 657.676 1152.21 L 657.676 1015.17 L 694.157 1015.17 L 694.157 929.278 L 645.034 929.278 L 645.034 892.605 L 664.335 892.605 L 624.767 811.538 L 639.243 803.817 L 675.916 880.059 L 675.916 705.378 L 693.288 705.378 L 693.288 881.989 L 737.586 881.989 L 737.586 863.653 C 737.586 848.211 750.228 835.665 765.67 835.665 L 771.364 835.665 C 786.902 835.665 799.448 848.211 799.448 863.653 L 799.448 881.989 L 826.567 881.989 C 843.745 881.989 848.571 884.884 848.571 913.837 L 848.571 1029.65 C 848.571 1047.02 856.291 1069.21 870.768 1044.12 C 885.244 1020 932.726 928.313 947.203 901.291 C 961.679 874.268 966.504 871.373 983.683 871.373 C 1001.06 871.373 1033.1 871.373 1064.95 871.373 C 1096.79 871.373 1094.67 895.5 1089.07 910.942 C 1084.25 925.418 1033.1 1094.31 1033.1 1094.31 L 1116.1 1094.31 L 1116.1 1017.1 C 1116.1 978.498 1146.98 947.615 1185.58 947.615 L 1262.79 947.615 C 1301.39 947.615 1332.28 978.498 1332.28 1017.1 L 1332.28 1094.31 C 1332.28 1094.31 1452.91 1092.38 1481.86 1094.31 C 1498.08 1095.27 1505.99 1100.1 1505.99 1122.29 C 1505.99 1144.49 1505.99 1167.65 1505.99 1167.65 L 1552.32 1167.65 L 1552.32 1101.06 C 1552.32 1082.72 1566.79 1068.25 1584.94 1068.25 L 1663.3 1068.25 C 1681.44 1068.25 1695.92 1082.72 1695.92 1101.06 L 1695.92 1113.61 L 1800.34 1076.93 L 1812.89 1111.68 L 1697.08 1156.07 L 1697.08 1175.37 L 1704.8 1175.37 L 2078.29 1175.37 Z"/>
      </svg>`;

    case 'carrier':
      // Aircraft carrier silhouette (from aricraft-carrier.svg)
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 2095 2095" style="${shadow}" ${extra}>
        <path fill="${c}" fill-rule="nonzero" d="M 2079.04 1099.31 L 2079.04 1227.43 L 1977.3 1334.82 L 99.806 1334.82 C 73.429 1188.81 15.964 1099.31 15.964 1099.31 L 821.41 1099.31 L 821.41 958.006 C 805.395 958.006 792.207 944.817 792.207 928.803 C 792.207 912.788 805.395 899.599 821.41 899.599 L 826.12 899.599 C 826.12 899.599 826.12 760.177 826.12 760.177 L 844.019 760.177 L 844.019 899.599 L 892.063 899.599 L 892.063 870.396 L 892.063 851.555 C 892.063 835.541 905.252 822.352 921.266 822.352 L 997.572 822.352 C 1013.59 822.352 1026.78 835.541 1026.78 851.555 L 1026.78 870.396 L 1026.78 899.599 L 1107.79 899.599 C 1123.81 899.599 1136.99 912.788 1136.99 928.803 C 1136.99 944.817 1123.81 958.006 1107.79 958.006 L 1107.79 999.456 L 1276.42 999.456 C 1299.97 996.63 1307.5 1009.82 1307.5 1033.37 L 1307.5 1098.37 L 2079.04 1098.37 L 2079.04 1099.31 Z M 1600.48 1068.22 C 1628.74 1072.93 1660.77 1071.99 1685.26 1071.99 C 1740.84 1071.99 1831.28 1071.99 1831.28 1071.99 C 1840.7 1070.11 1874.61 1059.75 1874.61 1059.75 L 1877.44 1039.02 L 1869.9 1039.02 L 1890.63 999.456 L 1868.02 999.456 L 1830.34 1039.02 C 1830.34 1039.02 1700.34 1039.02 1676.78 1034.31 C 1652.29 1029.6 1644.76 1027.72 1636.28 1027.72 C 1627.8 1027.72 1617.43 1031.48 1613.67 1033.37 C 1595.77 1039.96 1587.29 1039.96 1580.7 1042.79 C 1554.32 1055.98 1572.22 1063.52 1600.48 1068.22 Z M 360.751 1068.22 C 389.013 1072.93 421.042 1071.99 445.535 1071.99 C 501.116 1071.99 591.552 1071.99 591.552 1071.99 C 600.972 1070.11 634.886 1059.75 634.886 1059.75 L 637.712 1039.02 L 630.175 1039.02 L 650.9 999.456 L 628.291 999.456 L 590.61 1039.02 C 590.61 1039.02 460.608 1039.02 437.057 1034.31 C 412.564 1029.6 405.027 1027.72 396.549 1027.72 C 388.071 1027.72 377.708 1031.48 373.94 1033.37 C 356.041 1039.96 347.563 1039.96 340.969 1042.79 C 314.591 1055.98 332.49 1063.52 360.751 1068.22 Z"/>
      </svg>`;

    case 'vessel':
      // Navy vessel marker — warship silhouette (from warship-simple.svg)
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 2095 2095" style="${shadow}" ${extra}>
        <path fill="${c}" fill-rule="nonzero" d="M 2078.29 1175.37 C 2078.29 1187.92 2018.45 1351.02 2005.91 1370.32 C 1993.36 1389.62 1966.14 1389.62 1966.14 1389.62 L 147 1389.62 C 122.873 1271.88 16.713 1151.25 16.713 1150.28 C 16.713 1149.32 441.352 1151.25 436.526 1150.28 L 436.526 1113.61 L 275.453 1078.87 L 285.104 1046.05 L 442.413 1063.42 C 452.064 1046.05 474.261 1044.12 481.886 1044.12 C 489.606 1044.12 561.988 1044.12 561.988 1044.12 C 589.059 1044.12 593.884 1047.02 593.884 1083.69 C 593.884 1120.36 593.884 1152.21 593.884 1152.21 L 657.676 1152.21 L 657.676 1015.17 L 694.157 1015.17 L 694.157 929.278 L 645.034 929.278 L 645.034 892.605 L 664.335 892.605 L 624.767 811.538 L 639.243 803.817 L 675.916 880.059 L 675.916 705.378 L 693.288 705.378 L 693.288 881.989 L 737.586 881.989 L 737.586 863.653 C 737.586 848.211 750.228 835.665 765.67 835.665 L 771.364 835.665 C 786.902 835.665 799.448 848.211 799.448 863.653 L 799.448 881.989 L 826.567 881.989 C 843.745 881.989 848.571 884.884 848.571 913.837 L 848.571 1029.65 C 848.571 1047.02 856.291 1069.21 870.768 1044.12 C 885.244 1020 932.726 928.313 947.203 901.291 C 961.679 874.268 966.504 871.373 983.683 871.373 C 1001.06 871.373 1033.1 871.373 1064.95 871.373 C 1096.79 871.373 1094.67 895.5 1089.07 910.942 C 1084.25 925.418 1033.1 1094.31 1033.1 1094.31 L 1116.1 1094.31 L 1116.1 1017.1 C 1116.1 978.498 1146.98 947.615 1185.58 947.615 L 1262.79 947.615 C 1301.39 947.615 1332.28 978.498 1332.28 1017.1 L 1332.28 1094.31 C 1332.28 1094.31 1452.91 1092.38 1481.86 1094.31 C 1498.08 1095.27 1505.99 1100.1 1505.99 1122.29 C 1505.99 1144.49 1505.99 1167.65 1505.99 1167.65 L 1552.32 1167.65 L 1552.32 1101.06 C 1552.32 1082.72 1566.79 1068.25 1584.94 1068.25 L 1663.3 1068.25 C 1681.44 1068.25 1695.92 1082.72 1695.92 1101.06 L 1695.92 1113.61 L 1800.34 1076.93 L 1812.89 1111.68 L 1697.08 1156.07 L 1697.08 1175.37 L 1704.8 1175.37 L 2078.29 1175.37 Z"/>
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
