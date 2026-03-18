# Changelog

All notable changes to Marsd are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [0.1.4] - 2026-03-18

### Added

- **Globe DEV quality overlay** — development builds now show a live GlobeMap debug HUD with current texture, altitude bucket, effective pixel ratio, anisotropy, render size, and paused state to make globe rendering tuning observable during zoom and resize testing

### Fixed

- **Globe starfield visibility** — background stars are now significantly more visible, distributed on a much larger shell behind the planet, and configured so the Earth sphere always remains visually in the foreground
- **Globe background depth** — starfield rendering order and depth behavior were adjusted to keep the space backdrop behind the globe at all times, improving the depth effect without competing with Earth surface rendering

### Performance

- **Adaptive globe texture quality** — GlobeMap now adjusts effective render pixel ratio and texture anisotropy by zoom altitude, keeping Earth textures sharper when zoomed in while reducing unnecessary GPU cost when zoomed out
- **Recursive timer scheduling in GlobeMap** — repeating GlobeMap loops for adaptive quality checks, aircraft polling, and the DEV debug overlay now use recursive `setTimeout` scheduling instead of `setInterval`, avoiding overlapping work and improving lifecycle control during pause/resume and teardown

---

## [0.1.3] - 2026-03-18

### Fixed

- **Map render pause parity across modes** — hidden-tab render pausing now applies to both DeckGL and Globe modes via `MapContainer.setRenderPaused()`, reducing unnecessary background rendering when the document is not visible
- **Map teardown duplication** — `MapContainer.destroy()` no longer performs overlapping/double destroy calls; map instances are destroyed once and references are nulled to prevent stale lifecycle state
- **Virtual list observer leak** — `VirtualList` now stores its `ResizeObserver` as an instance field and disconnects it during `destroy()`, preventing observer retention after panel teardown
- **Map pin listener ownership** — map pin toggle now uses a retained bound handler and is explicitly removed in `EventHandlerManager.destroy()`, preventing orphaned click listeners across re-initializations

### Performance

- **Lazy military flight history cleanup timer** — flight-history cleanup interval is no longer started at module import; it now initializes on-demand during `fetchMilitaryFlights()` usage
- **Lazy military vessel cleanup timer with teardown stop** — vessel-history cleanup interval now starts only when military vessel streaming initializes and is stopped when the stream disconnects, reducing idle CPU wakeups

---

## [0.1.2] - 2026-03-17

### Added

- **Backend TypeScript service** — all server-side API logic migrated from legacy `code/api` into a new isolated `backend/` service
- **Full API separation** — ownership matrix produced for every `frontend/api` route (`backend-owned`, `desktop-local-only`, `frontend-render-only`); all product `/api/*` routes now owned exclusively by `backend`; desktop sidecar refactored to local control-plane utilities only; web dev and production routing behavior preserved unchanged
- **Globe loading overlay** — animated spinner with localized text hides the blank globe until earth textures complete loading; fades out once the 3D mesh first renders; overlay text uses `t('components.globe.loadingGlobe')` with RTL support
- **Aircraft & vessel photos in map popups** — military flight popups fetch tail-specific photos from Planespotters.net (priority 1), with Wikipedia REST API fallback for aircraft type and named naval vessels; photos render at a user-friendly aspect ratio alongside popup metadata; lookup results cached in memory for the page lifetime
- **Material Design v3** — M3 visual system implemented in pure CSS and vanilla TypeScript with no external libraries: OKLCH tonal palette, tonal surface elevation overlays, M3 typography scale, corner-radius shape tokens, state layer feedback (hover/pressed/focused/dragged), and motion easing/duration tokens; split across 8 CSS modules (`md3-palette.css`, `md3-roles.css`, `md3-typography.css`, `md3-shape.css`, `md3-elevation.css`, `md3-state.css`, `md3-motion.css`, `md3-components.css`) loaded via `base-layer.css`
- **Virtual scrolling for News panel** — `VirtualList` (DOM-recycling fixed-height) and `WindowedList<T>` (generic windowed generic list) classes; `WindowedList` activates in `NewsPanel` above a configurable item threshold, eliminating layout thrashing on large feeds
- **Lato as default sans-serif font-family** — set as first entry in `--font-sans` stack for all non-Arabic UI text; Arabic retains its own stack
- **Sentry error tracking** — `@sentry/browser` initialized early in the bundle with noise filters for map renderer frames, stale DOM reference errors, and anonymous-only stack traces; disabled on localhost and in Tauri desktop builds

### Fixed

- **Map fullscreen mode — popups and country brief panel hidden** — map popups and the country brief panel are now correctly rendered and positioned when the map enters fullscreen mode
- **Maps resize bug** — map container correctly handles resize events; no layout artifacts or blank areas after panel resizing
- **UCDP conflict events not appearing** — upstream data-fetching issue resolved; UCDP events now render on the conflict map layer
- **Iran attacks map layer returning no data** — data flow through endpoint and cache fixed; Iran event markers now appear correctly
- **GlobeMap intermittent white sphere** — texture loading race condition resolved; globe no longer renders as a blank white sphere after initial load
- **Frontend errors and warnings** — most frontend runtime errors and warnings identified and resolved

### Changed

- **Frontend converted to pure client bundle** — `frontend/api` and `frontend/server` legacy server-side directories removed after parity verification; Tauri sidecar refactored to expose only local-machine utilities; no API contract or call-site changes required in frontend components
- **Self-hosted Redis Support** — Redis client with graceful fallback; cached endpoint behavior is unchanged
- **Discord and Desktop download popups removed** — transient onboarding modals removed from UI
- **Mobile app menu revised** — navigation structure and layout updated for better usability on small screens

### Internationalization

- **Map localizations updated** — continent, country, and region names fully localized across all 21 locales
- **Arabic revisions** — all missing localizable text covered: labels, button states, popup fields, fallback strings
- **Globe loading text localized** — `components.globe.loadingGlobe` key added to all 21 locale files with RTL-aware styling
- **Live News Channel display names localized** in Arabic
- **Panel titles with country names localized** across all 21 locales
- **Country brief component labels and computed values localized** — hardcoded English strings replaced with `t()` calls throughout country brief panels
- **Map tooltip and popup dynamic data localized** — military aircraft types, naval vessel types, and fallback labels (e.g., "Unknown") now use `t()` with `getLocalizedGeoName()` fallback instead of hardcoded strings
- **Conflict zone names localized** in map popups and tooltips
- **AI insights localized** — strategic posture, deduction, and country brief AI outputs now respond in the currently selected UI language
- **News localization fixed** — localized news feed digest was not being applied; now correctly reflects the active locale
- **RTL fix** — special letter-spacing styles removed in RTL mode; Arabic text is now readable without excessive character spacing

### Performance

- **Widget re-render memoization** — panel state updates no longer trigger full DOM rebuilds; only changed data causes targeted re-renders
- **Viewport-based lazy loading** — `IntersectionObserver` defers widget initialization until they scroll into view; panels off-screen consume no resources
- **Expensive UI operations cached** — computationally intensive calculations (map projections, icon generation, score aggregations) are now memoized for the lifecycle of each component
- **Timer API hygiene** — `setInterval` and `setTimeout` usage replaced with more reliable browser scheduler APIs throughout the frontend

### UI / Branding

- **App branding** — logo, name, and visual identity applied consistently across all pages and the desktop app
- **Map layer toggle icons** — custom SVG icons replace emoji throughout the layer list; consistent sizing and styling
- **Map marker icons** — SVG icons replace emoji across all map layers for visual consistency and crisp rendering at all DPR levels
- **Material Design v3 form elements** — inputs and selects styled to M3 specs with small rounded corners; consistent across all panels and settings pages
- **Map UI components styled to M3** — tooltips, popups, and control overlays follow M3 elevation and shape conventions
- **Logo and map container styling** updated to match the new design system

---

## [0.1.1] - 2026-03-09

### Added

- **Military bases map layer** — 1,058 global installations seeded from curated geopolitical bases (226 entries) and MIRTA US installations dataset (832 entries); GEO + META hash architecture with versioned atomic-swap keys
- **Military bases popup i18n** — type badge and stat row now use `t('popups.base.types.*')` with `getLocalizedGeoName()` as a runtime fallback for unknown types; covers all 16 type values (`us-nato`, `china`, `russia`, `uk`, `france`, `india`, `italy`, `uae`, `turkey`, `japan`, `us`, `naval`, `air`, `marine`, `space`, `other`)
- **FlightAware tracking link** — military flight popups now include a localized "Track on FlightAware ↗" link (`https://www.flightaware.com/live/flight/{callsign}`) when a callsign is present, all 21 locales translated
- **Arabic translations** — filled 19 missing `ar` keys: `panels.airlineIntel`, `panels.worldClock`, `common.all`, full `components.securityAdvisories` block (loading, critical, health, sources, refresh, infoTooltip, levels, time), `panels.satelliteFires.noData` (via correct key path)
- **English panel keys** — added `panels.airlineIntel` and `panels.worldClock` to `en.json` (missing from all locales)
- **Base type locale coverage** — added 12 new `popups.base.types.*` keys across all 21 locale files (`france`, `india`, `italy`, `japan`, `uae`, `uk`, `us`, `naval`, `air`, `marine`, `space`, `other`)

### Fixed

- **Military bases endpoint returning empty data** — tier filter defaulted missing `tier` fields to `2`, causing the `zoom < 5 && tier > 1` guard to drop all 1,058 unseeded entries; changed default to `1` (always shown) and relaxed thresholds to `> 2` / `> 3` to let clustering handle density
- **Military bases seeder blocking on cleanup** — replaced 5-minute `sleep()` + `DEL` with `EXPIRE` pipeline call so the seeder exits immediately and Redis TTL-expires old version keys autonomously
- **Iran events map returning no markers** — `getCachedJson(REDIS_KEY)` in both backend and frontend `list-iran-events.ts` was missing `raw=true`, causing the `NODE_ENV=development` key prefix (`development:dev:*`) to produce a cache miss against the raw seeded key
- **RSS proxy blocked feeds** — added 14 missing domains to all 6 allowlist files (`backend/api/_rss-allowed-domains.js`, both `shared/rss-allowed-domains.json` copies, both `.cjs` wrappers, `frontend` equivalents); domain count 278 → 292
- **Wrong i18n key for satellite fires no-data** — `data-loader.ts` referenced `panels.satelliteFires.noData` (a plain string node) instead of the correct `components.satelliteFires.noData`

---

## [0.1.0] - 2026-03-04

> **Foundation release.** Squashes all prior development history. Captures the full feature set of the Marsd geopolitical intelligence platform at the time of version reset.

### Core Platform

- Real-time geopolitical intelligence dashboard with multi-variant support (World, Tech, Finance)
- Tauri desktop app for macOS (ARM/Intel), Windows, and Linux (AppImage) with bundled Node.js sidecar
- Vercel edge + Railway relay hybrid deployment; runtime variant detection consolidating 4 deployments into 1
- Progressive Web App with Workbox service worker, offline support, and edge CDN caching

### Map Layers

- **Conflict** — Iran attack events, UCDP armed conflict data, conflict zones, hotspots
- **Military** — military bases (server-side with rate limiting), military flight tracker, military vessel tracker, GPS/GNSS jamming detection
- **Maritime** — AIS vessel positions, strategic waterways, chokepoint disruption alerts, undersea cables, pipelines, ports, repair ships
- **Aviation** — AviationStack airport delays (global), NOTAM closure detection, airport delay alerts
- **Geopolitical** — nuclear facilities, cyber threat intelligence (Feodo Tracker, URLhaus, C2IntelFeeds, OTX, AbuseIPDB), APT groups, economic centers, critical mineral projects
- **Natural** — satellite fire detections (NASA FIRMS VIIRS), natural events (NASA EONET), climate anomalies, population exposure
- **Infrastructure** — internet outages, AI data centers, spaceports, cloud regions, tech HQs
- **Day/night** — solar terminator overlay

### Intelligence Panels

- Live news with AI summarization (4-tier chain: Ollama → Groq → OpenRouter → Transformers.js T5)
- Breaking news alert banner with audio for critical/high severity items
- Telegram Intel with 27 curated OSINT channels via MTProto relay
- OREF Israel Sirens with Hebrew → English translation and 24h history bootstrap
- GDELT live intelligence feed
- Country brief with maximize mode, shareable URLs, and signal integration
- AI Strategic Posture and Deduction panels
- Country Instability Index (CII) with multi-signal scoring (conflict, sirens, jamming, advisories)

### Markets & Economics

- Markets panel (Finnhub + Yahoo Finance fallback), sector heatmap, ETF/BTC tracker, stablecoins
- FRED macro signals, supply chain chokepoints, commodity hubs, trade policy
- Gulf economies: indices, currencies, oil; Gulf investments tracker
- Polymarket prediction markets with OOM-safe circuit breaker

### Other Panels

- Security advisories (US State Dept, AU DFAT, UK FCDO, NZ MFAT, CDC, WHO)
- Live webcams (2×2 grid, region filters, idle detection)
- World clock with market-open indicators across 20 financial centers
- Airline intelligence (ops, flights, airlines, tracking, news, prices tabs)
- UNHCR displacement, climate anomalies, population exposure, global giving
- Startups & VC, unicorn tracker, accelerators, product hunt, GitHub trending
- Tech readiness index, GCC investments, geopolitical hubs

### Infrastructure & Security

- Redis-backed caching with versioned atomic-swap seeder pattern and `raw` flag for unprefixed keys
- CSP with script hashes replacing `unsafe-inline`; `crypto.randomUUID()` for ID generation
- CORS allowlist across all API endpoints; Railway relay with origin restriction
- Rate limiting: 300 req/min sliding window
- XSS-safe i18n: `escapeHtml()` wrapping on all `t()` output in templates
- Consolidated desktop keychain vault (single OS keychain entry, one authorization prompt)
- Cross-window secret sync via localStorage broadcast

### Internationalization

- 21 locales: Arabic (RTL), Bulgarian, Czech, German, Greek, English, Spanish, French, Italian, Japanese, Korean, Dutch, Polish, Portuguese, Romanian, Russian, Swedish, Thai, Turkish, Vietnamese, Chinese Simplified
- i18next with browser language detection, English fallback, and `getLocalizedGeoName()` for geographic name resolution
- Full RTL CSS overrides for Arabic; in-app language switcher with flags

### Performance

- POST → GET RPC conversion for CDN caching (~46% egress reduction)
- Tiered bootstrap (fast/slow data split), per-domain edge functions
- AIS relay: backpressure queue, spatial indexing, pre-serialized gzip snapshot cache
- Stale-while-revalidate circuit breaker with deduplication across all data fetchers
- FRED batch API (up to 15 series, deduplication), parallel UCDP page fetching


### Highlights

- **UCDP conflict data** — integrated Uppsala Conflict Data Program for historical & ongoing armed conflict tracking (#760)
- **Country brief sharing** — maximize mode, shareable URLs, native browser share button, expanded sections (#743, #854)
- **Unified Vercel deployment** — consolidated 4 separate deployments into 1 via runtime variant detection (#756)
- **CDN performance overhaul** — POST→GET conversion, per-domain edge functions, tiered bootstrap for ~46% egress reduction (#753, #795, #838)
- **Security hardening** — CSP script hashes replace unsafe-inline, crypto.randomUUID() for IDs, XSS-safe i18n, Finnhub token header (#781, #844, #861, #744)
- **i18n expansion** — French support with Live TV channels, hardcoded English strings replaced with translation keys (#794, #851, #839)

### Added

- UCDP (Uppsala Conflict Data Program) integration for armed conflict tracking (#760)
- Iran & Strait of Hormuz conflict zones, upgraded Ukraine polygon (#731)
- 100 Iran war events seeded with expanded geocoder (#792)
- Country brief maximize mode, shareable URLs, expanded sections & i18n (#743)
- Native browser share button for country briefs (#854)
- French i18n support with French Live TV channels (#851)
- Geo-restricted live channel support, restored WELT (#765)
- Manage Channels UX — toggle from grid + show all channels (#745)
- Command palette: disambiguate Map vs Panel commands, split country into map/brief (#736)
- Command palette: rotating contextual tips replace static empty state (#737)
- Download App button for web users with dropdown (#734, #735)
- Reset layout button to restore default panel sizes and order (#801)
- System status moved into settings (#735)
- Vercel cron to pre-warm AviationStack cache (#776)
- Runtime variant detection — consolidate 4 Vercel deployments into 1 (#756)
- CJS syntax check in pre-push hook (#769)

### Fixed

- **Security**: XSS — wrap `t()` calls in `escapeHtml()` (#861), use `crypto.randomUUID()` instead of `Math.random()` for ID generation (#844), move Finnhub API key from query string to `X-Finnhub-Token` header (#744)
- **i18n**: replace hardcoded English strings with translation keys (#839), i18n improvements (#794)
- **Market**: parse comma-separated query params and align Railway cache keys (#856), Railway market data cron + complete missing tech feed categories (#850), Yahoo relay fallback + RSS digest relay for blocked feeds (#835), tech UNAVAILABLE feeds + Yahoo batch early-exit + sector heatmap gate (#810)
- **Aviation**: move AviationStack fetching to Railway relay, reduce to 40 airports (#858)
- **UI**: cancel pending debounced calls on component destroy (#848), guard async operations against stale DOM references (#843)
- **Sentry**: guard stale DOM refs, audio.play() compat, add 16 noise filters (#855)
- **Relay**: exponential backoff for failing RSS feeds (#853), deduplicate UCDP constants crashing Railway container (#766)
- **API**: remove `[domain]` catch-all that intercepted all RPC routes (#753 regression) (#785), pageSize bounds validation on research handlers (#819), return 405 for wrong HTTP method (#757), pagination cursor for cyber threats (#754)
- **Conflict**: bump Iran events cache-bust to v7 (#724)
- **OREF**: prevent LLM translation cache from poisoning Hebrew→English pipeline (#733), strip translation labels from World Brief input (#768)
- **Military**: harden USNI fleet report ship name regex (#805)
- **Sidecar**: add required params to ACLED API key validation probe (#804)
- **Macro**: replace hardcoded BTC mining thresholds with Mayer Multiple (#750)
- **Cyber**: reduce GeoIP per-IP timeout from 3s to 1.5s (#748)
- **CSP**: restore unsafe-inline for Vercel bot-challenge pages (#788), add missing script hash and finance variant (#798)
- **Runtime**: route all /api/* calls through CDN edge instead of direct Vercel (#780)
- **Desktop**: detect Linux node target from host arch (#742), harden Windows installer update path + map resize (#739), close update toast after clicking download (#738), only open valid http(s) links externally (#723)
- **Webcams**: replace dead Tel Aviv live stream (#732), replace stale Jerusalem feed (#849)
- Story header uses full domain marsd.app (#799)
- Open variant nav links in same window instead of new tab (#721)
- Suppress map renders during resize drag (#728)
- Append deduction panel to DOM after async import resolves (#764)
- Deduplicate stale-while-revalidate background fetches in CircuitBreaker (#793)
- CORS fallback, rate-limit bump, RSS proxy allowlist (#814)
- Unavailable stream error messages updated (#759)

### Performance

- Tier slow/fast bootstrap data for ~46% CDN egress reduction (#838)
- Convert POST RPCs to GET for CDN caching (#795)
- Split monolithic edge function into per-domain functions (#753)
- Increase CDN cache TTLs + add stale-if-error across edge functions (#777)
- Bump CDN cache TTLs for oref-alerts and youtube/live (#791)
- Skip wasted direct fetch for Vercel-blocked domains in RSS proxy (#815)

### Security

- Replace CSP unsafe-inline with script hashes and add trust signals (#781)
- Expand Permissions-Policy and tighten CSP connect-src (#779)

### Changed

- Extend support for larger screens (#740)
- Green download button + retire sliding popup (#747)
- Extract shared relay helper into `_relay.js` (#782)
- Consolidate `SummarizeArticleResponse` status fields (#813)
- Consolidate `declare const process` into shared `env.d.ts` (#752)
- Deduplicate `clampInt` into `server/_shared/constants`
- Add error logging for network errors in error mapper (#746)
- Redis error logging + reduced timeouts for edge functions (#749)

---

