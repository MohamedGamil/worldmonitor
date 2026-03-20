import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { I18N_CONFIG } from '../config/i18n-config';

// English is always needed as fallback — bundle it eagerly.
import enTranslation from '../locales/en.json';

const SUPPORTED_LANGUAGES = I18N_CONFIG.SUPPORTED_LOCALES.map(loc => loc.code);
type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
type TranslationDictionary = Record<string, unknown>;

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);
const loadedLanguages = new Set<string>();

// Lazy-load only the locale that's actually needed — all others stay out of the bundle.
const localeModules = import.meta.glob<TranslationDictionary>(
  ['../locales/*.json', '!../locales/en.json'],
  { import: 'default' },
);

const RTL_LANGUAGES = new Set<string>(I18N_CONFIG.SUPPORTED_LOCALES.filter(loc => loc.dir === 'rtl').map(loc => loc.code));

function normalizeLanguage(lng: string): SupportedLanguage {
  const base = (lng || I18N_CONFIG.DEFAULT_LANGUAGE).split('-')[0]?.toLowerCase() || I18N_CONFIG.DEFAULT_LANGUAGE;
  if (SUPPORTED_LANGUAGE_SET.has(base)) {
    return base as SupportedLanguage;
  }
  return I18N_CONFIG.FALLBACK_LANGUAGE as SupportedLanguage;
}

function applyDocumentDirection(lang: string): void {
  const base = lang.split('-')[0] || lang;
  document.documentElement.setAttribute('lang', base === 'zh' ? 'zh-CN' : base);
  if (RTL_LANGUAGES.has(base)) {
    document.documentElement.setAttribute('dir', 'rtl');
    document.body.classList.add('dir-rtl');
  } else {
    document.documentElement.removeAttribute('dir');
    document.body.classList.remove('dir-rtl');
  }
}

async function ensureLanguageLoaded(lng: string): Promise<SupportedLanguage> {
  const normalized = normalizeLanguage(lng);
  if (loadedLanguages.has(normalized) && i18next.hasResourceBundle(normalized, 'translation')) {
    return normalized;
  }

  let translation: TranslationDictionary;
  if (normalized === 'en') {
    translation = enTranslation as TranslationDictionary;
  } else {
    const loader = localeModules[`../locales/${normalized}.json`];
    if (!loader) {
      console.warn(`No locale file for "${normalized}", falling back to English`);
      translation = enTranslation as TranslationDictionary;
    } else {
      translation = await loader();
    }
  }

  i18next.addResourceBundle(normalized, 'translation', translation, true, true);
  loadedLanguages.add(normalized);
  return normalized;
}

// Initialize i18n
export async function initI18n(): Promise<void> {
  if (i18next.isInitialized) {
    const currentLanguage = normalizeLanguage(i18next.language || I18N_CONFIG.DEFAULT_LANGUAGE);
    await ensureLanguageLoaded(currentLanguage);
    applyDocumentDirection(i18next.language || currentLanguage);
    return;
  }

  loadedLanguages.add('en');

  await i18next
    .use(LanguageDetector)
    .init({
      // Remove hardcoded lng so LanguageDetector can work
      resources: {
        en: { translation: enTranslation as TranslationDictionary },
      },
      supportedLngs: [...SUPPORTED_LANGUAGES],
      nonExplicitSupportedLngs: true,
      fallbackLng: I18N_CONFIG.DEFAULT_LANGUAGE, // default to AR if no detection matches
      debug: import.meta.env.DEV,
      interpolation: {
        escapeValue: false, // not needed for these simple strings
      },
      detection: {
        order: ['localStorage'],
        caches: ['localStorage'],
      },
    });

  const detectedLanguage = await ensureLanguageLoaded(i18next.language || I18N_CONFIG.DEFAULT_LANGUAGE);
  if (detectedLanguage !== 'en') {
    // Re-trigger translation resolution now that the detected bundle is loaded.
    await i18next.changeLanguage(detectedLanguage);
  }

  applyDocumentDirection(i18next.language || detectedLanguage);
}

// Helper to translate
export function t(key: string, options?: Record<string, unknown>): string {
  const defaultValue = String(options?.defaultValue || key);
  const translated = i18next.t(key, { ...options, defaultValue });

  if (!translated || translated === defaultValue) {
    const splitStr = key.split('.');

    return (splitStr.length > 1)
      ? String(splitStr[splitStr.length - 1] || key)
      : key;
  }

  return translated;
}

/**
 * Translate a dynamic enum-like value with graceful fallback.
 *
 * Resolution order:
 *  1. `${keyPrefix}.${value}` (exact, if prefix supplied)
 *  2. `${keyPrefix}.${normalizedKey}` (lowercased + underscored, if prefix supplied)
 *  3. `popups.values.${normalizedKey}` (general catch-all namespace)
 *  4. `fallback` (if supplied)
 *  5. Raw `value` string (unchanged)
 *
 * @example
 *   tv('special_ops', 'popups.militaryFlight.types')  // → "Special Ops"
 *   tv('carrier', 'popups.militaryVessel.types')       // → "Aircraft Carrier" / "حاملة طائرات"
 *   tv('Air Force', 'popups.values.branches')          // → localized branch name
 */
export function tv(value: string, keyPrefix?: string, fallback?: string): string {
  if (!value) return fallback ?? value;
  // Normalize: lowercase, collapse spaces/hyphens/slashes to underscores
  const key = value.toLowerCase().replace(/[\s\-/]+/g, '_');

  if (keyPrefix) {
    // Try exact value (for keys already using the right casing)
    const a = i18next.t(`${keyPrefix}.${value}`);
    if (a !== `${keyPrefix}.${value}`) return a;
    // Try normalized key
    const b = i18next.t(`${keyPrefix}.${key}`);
    if (b !== `${keyPrefix}.${key}`) return b;
  }

  // General values namespace
  const c = i18next.t(`popups.values.${key}`);
  if (c !== `popups.values.${key}`) return c;

  return fallback ?? value;
}

// Helper to change language
export async function changeLanguage(lng: string): Promise<void> {
  const normalized = await ensureLanguageLoaded(lng);
  await i18next.changeLanguage(normalized);
  applyDocumentDirection(normalized);
  window.location.reload(); // Simple reload to update all components for now
}

// Helper to get current language (normalized to short code)
export function getCurrentLanguage(): string {
  const lang = i18next.language || I18N_CONFIG.DEFAULT_LANGUAGE;
  return lang.split('-')[0]!;
}

export function isRTL(): boolean {
  return RTL_LANGUAGES.has(getCurrentLanguage());
}

export function getLocale(): string {
  const lang = getCurrentLanguage();
  const map: Record<string, string> = { en: 'en-US', el: 'el-GR', zh: 'zh-CN', pt: 'pt-BR', ja: 'ja-JP', ko: 'ko-KR', tr: 'tr-TR', th: 'th-TH', vi: 'vi-VN' };
  return map[lang] || lang;
}

export const LANGUAGES = [...I18N_CONFIG.SUPPORTED_LOCALES];

/**
 * Resolves a country code (e.g., "US", "USA") or fallback name to a localized country name.
 * Uses native Intl.DisplayNames to avoid shipping a massive territory dictionary.
 */
export function getLocalizedCountryName(codeOrName: string): string {
  if (!codeOrName) return '';
  const lang = getCurrentLanguage();

  // Clean up input
  let code = codeOrName.trim().toUpperCase();

  // Special override: always return custom Arabic names for Israel and Palestine
  if (lang === 'ar') {
    const israelIdentifiers = new Set(['IL', 'ISR', 'ISRAEL', 'ISRAELI', 'STATE OF ISRAEL']);
    if (israelIdentifiers.has(code)) return 'الارض المحتلة (اسرائيل)';

    const palestineIdentifiers = new Set(['PS', 'PSE', 'PALESTINE', 'PALESTINIAN', 'STATE OF PALESTINE', 'PALESTINIAN TERRITORIES', 'WEST BANK', 'GAZA']);
    if (palestineIdentifiers.has(code)) return 'فلسطين';
  }

  // If we receive a 3-letter code and know its 2-letter equivalent, we can convert.
  // Standard Intl.DisplayNames expects region subtags (ISO-3166-1 alpha-2).
  // E.g., USA -> US, GBR -> GB. Here is a tiny map for common ones we use:
  const alpha3To2: Record<string, string> = {
    'USA': 'US', 'GBR': 'GB', 'CHN': 'CN', 'RUS': 'RU', 'FRA': 'FR',
    'DEU': 'DE', 'JPN': 'JP', 'IND': 'IN', 'BRA': 'BR', 'CAN': 'CA',
    'IRN': 'IR', 'IRQ': 'IQ', 'ISR': 'IL', 'SYR': 'SY', 'SAU': 'SA'
  };

  if (code.length === 3 && alpha3To2[code]) {
    code = alpha3To2[code]!;
  }

  // Map common English country/entity names to ISO alpha-2 codes so that
  // Intl.DisplayNames can localize them (e.g. "United States" → "US" → "الولايات المتحدة").
  const nameToAlpha2: Record<string, string> = {
    'UNITED STATES': 'US', 'UNITED STATES OF AMERICA': 'US', 'AMERICA': 'US',
    'UNITED KINGDOM': 'GB', 'BRITAIN': 'GB', 'GREAT BRITAIN': 'GB', 'ENGLAND': 'GB',
    'RUSSIA': 'RU', 'RUSSIAN FEDERATION': 'RU',
    'CHINA': 'CN', "PEOPLE'S REPUBLIC OF CHINA": 'CN',
    'UKRAINE': 'UA', 'FRANCE': 'FR', 'GERMANY': 'DE', 'ITALY': 'IT',
    'SPAIN': 'ES', 'PORTUGAL': 'PT', 'NETHERLANDS': 'NL', 'BELGIUM': 'BE',
    'SWEDEN': 'SE', 'NORWAY': 'NO', 'DENMARK': 'DK', 'FINLAND': 'FI',
    'POLAND': 'PL', 'TURKEY': 'TR', 'GREECE': 'GR', 'SWITZERLAND': 'CH',
    'AUSTRIA': 'AT', 'CZECH REPUBLIC': 'CZ', 'CZECHIA': 'CZ', 'HUNGARY': 'HU',
    'ROMANIA': 'RO', 'BULGARIA': 'BG', 'SERBIA': 'RS', 'CROATIA': 'HR',
    'ISRAEL': 'IL', 'IRAN': 'IR', 'IRAQ': 'IQ', 'SYRIA': 'SY',
    'SAUDI ARABIA': 'SA', 'YEMEN': 'YE', 'JORDAN': 'JO', 'LEBANON': 'LB',
    'EGYPT': 'EG', 'LIBYA': 'LY', 'TUNISIA': 'TN', 'ALGERIA': 'DZ',
    'MOROCCO': 'MA', 'SUDAN': 'SD', 'SOUTH SUDAN': 'SS', 'ETHIOPIA': 'ET',
    'SOMALIA': 'SO', 'KENYA': 'KE', 'NIGERIA': 'NG', 'GHANA': 'GH',
    'SOUTH AFRICA': 'ZA', 'CONGO': 'CD', 'DEMOCRATIC REPUBLIC OF THE CONGO': 'CD',
    'MALI': 'ML', 'NIGER': 'NE', 'CHAD': 'TD', 'MOZAMBIQUE': 'MZ',
    'AFGHANISTAN': 'AF', 'PAKISTAN': 'PK', 'INDIA': 'IN', 'BANGLADESH': 'BD',
    'MYANMAR': 'MM', 'BURMA': 'MM', 'THAILAND': 'TH', 'VIETNAM': 'VN',
    'PHILIPPINES': 'PH', 'INDONESIA': 'ID', 'MALAYSIA': 'MY',
    'SOUTH KOREA': 'KR', 'NORTH KOREA': 'KP', 'JAPAN': 'JP',
    'TAIWAN': 'TW', 'HONG KONG': 'HK',
    'BRAZIL': 'BR', 'ARGENTINA': 'AR', 'COLOMBIA': 'CO', 'VENEZUELA': 'VE',
    'MEXICO': 'MX', 'CANADA': 'CA', 'CUBA': 'CU',
    'AZERBAIJAN': 'AZ', 'ARMENIA': 'AM', 'GEORGIA': 'GE',
    'KAZAKHSTAN': 'KZ', 'UZBEKISTAN': 'UZ',
    'UNITED ARAB EMIRATES': 'AE', 'UAE': 'AE',
    'QATAR': 'QA', 'KUWAIT': 'KW', 'BAHRAIN': 'BH', 'OMAN': 'OM',
    'NATO': '', // handled below — no ISO code
  };

  if (code.length > 2) {
    const mapped = nameToAlpha2[code];
    if (mapped) code = mapped;
  }

  // If it's strictly a 2-letter code, try to natively translate it
  if (code.length === 2) {
    try {
      const displayNames = new Intl.DisplayNames([lang], { type: 'region' });
      const localized = displayNames.of(code);
      if (localized) return localized;
    } catch {
      // Ignore if unsupported or invalid
    }
  }

  // If it's a known english name or unmatched code, fall back to the raw string
  return codeOrName;
}

/**
 * Geographic dictionaries keyed by language code.
 * Used by getLocalizedGeoName() to translate non-ISO geographic names
 * (water bodies, mountains, deserts, cities, etc.)
 */
import arGeoFallbacks from '@/locales/geo/ar';
const _geoDicts: Record<string, Record<string, string>> = {
  ar: arGeoFallbacks,
};

/**
 * Resolves any geographic name (country, sea, continent, city, etc.)
 * to its localized equivalent for the current language.
 *
 * Resolution order:
 * 1. Exact match in the language-specific geographic dictionary
 * 2. ISO-3166 region code via Intl.DisplayNames (delegated to getLocalizedCountryName)
 * 3. Raw input string (unchanged)
 */
export function getLocalizedGeoName(nameOrCode: string): string {
  if (!nameOrCode) return '';
  const lang = getCurrentLanguage();
  if (lang === 'en') return nameOrCode;

  // 1. Check shared geographic dictionary
  const dict = _geoDicts[lang];
  if (dict) {
    const localized = dict[nameOrCode] || dict[nameOrCode.trim()];
    if (localized) return localized;
  }

  // 2. Delegate to ISO country code resolver
  return getLocalizedCountryName(nameOrCode);
}

