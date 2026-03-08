# Marsd

**Marsd** is an AI-powered advanced situational awareness dashboard for real-time global intelligence, news aggregation, geopolitical monitoring, and infrastructure tracking in a unified situational awareness interface, based on the Marsd core.

[![GitHub stars](https://img.shields.io/github/stars/MohamedGamil/marsd?style=social)](https://github.com/MohamedGamil/marsd/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/MohamedGamil/marsd?style=social)](https://github.com/MohamedGamil/marsd/network/members)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Last commit](https://img.shields.io/github/last-commit/MohamedGamil/marsd)](https://github.com/MohamedGamil/marsd/commits/main)
[![Latest release](https://img.shields.io/github/v/release/MohamedGamil/marsd?style=flat)](https://github.com/MohamedGamil/marsd/releases/latest)

<!-- <p align="center">
  <a href="https://worldmonitor.app"><img src="https://img.shields.io/badge/Web_App-worldmonitor.app-blue?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Web App"></a>&nbsp;
  <a href="https://tech.worldmonitor.app"><img src="https://img.shields.io/badge/Tech_Variant-tech.worldmonitor.app-0891b2?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Tech Variant"></a>&nbsp;
  <a href="https://finance.worldmonitor.app"><img src="https://img.shields.io/badge/Finance_Variant-finance.worldmonitor.app-059669?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Finance Variant"></a>
</p> -->

<!-- <p align="center">
  <a href="https://worldmonitor.app/api/download?platform=windows-exe"><img src="https://img.shields.io/badge/Download-Windows_(.exe)-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Download Windows"></a>&nbsp;
  <a href="https://worldmonitor.app/api/download?platform=macos-arm64"><img src="https://img.shields.io/badge/Download-macOS_Apple_Silicon-000000?style=for-the-badge&logo=apple&logoColor=white" alt="Download macOS ARM"></a>&nbsp;
  <a href="https://worldmonitor.app/api/download?platform=macos-x64"><img src="https://img.shields.io/badge/Download-macOS_Intel-555555?style=for-the-badge&logo=apple&logoColor=white" alt="Download macOS Intel"></a>&nbsp;
  <a href="https://worldmonitor.app/api/download?platform=linux-appimage"><img src="https://img.shields.io/badge/Download-Linux_(.AppImage)-FCC624?style=for-the-badge&logo=linux&logoColor=black" alt="Download Linux"></a>
</p> -->

<p align="center">
  <a href="./docs/DOCUMENTATION.md"><strong>Full Documentation</strong></a> &nbsp;·&nbsp;
  <a href="https://github.com/MohamedGamil/worldmonitor/releases/latest"><strong>All Releases</strong></a>
</p>

![Marsd Dashboard](new-world-monitor.png)

---

## Why Marsd?

| Problem                            | Solution                                                                                                   |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| News scattered across 100+ sources | **Single unified dashboard** with 435+ curated feeds across 15 categories                                  |
| No geospatial context for events   | **Interactive map** with 45 toggleable data layers and CII country risk heatmap                             |
| Information overload               | **AI-synthesized briefs** with focal point detection and local LLM support                                 |
| Crypto/macro signal noise          | **7-signal market radar** with composite BUY/CASH verdict                                                  |
| Expensive OSINT tools ($$$)        | **100% free & open source**                                                                                |
| Static news feeds                  | **Real-time updates** with live video streams and AI-powered deductions                                    |
| Cloud-dependent AI tools           | **Run AI locally** with Ollama/LM Studio — no API keys, no data leaves your machine. Opt-in **Headline Memory** builds a local semantic index of every headline for RAG-powered queries |
| Web-only dashboards                | **Native desktop app** (Tauri) for macOS, Windows, and Linux + installable PWA with offline map support    |
| Flat 2D maps                       | **Dual map engine** — photorealistic 3D globe (globe.gl + Three.js) and WebGL flat map (deck.gl) with 45 toggleable data layers, runtime-switchable |
| English-only OSINT tools           | **21 languages** with native-language RSS feeds, AI-translated summaries, and RTL support for Arabic       |
| Siloed financial data              | **Finance variant** with 92 stock exchanges, 19 financial centers, 13 central banks, BIS data, WTO trade policy, and Gulf FDI tracking |
| Undocumented, fragile APIs         | **Proto-first API contracts** — 22 typed services with auto-generated clients, servers, and OpenAPI docs   |

---

## Live Demos

| Variant             | URL                                                          | Focus                                            |
| ------------------- | ------------------------------------------------------------ | ------------------------------------------------ |
| **Marsd**   | [marsd.app](https://marsd.app)                 | Geopolitics, military, conflicts, infrastructure |
| **Tech Monitor**    | [tech.marsd.app](https://tech.marsd.app)       | Startups, AI/ML, cloud, cybersecurity            |
| **Finance Monitor** | [finance.marsd.app](https://finance.marsd.app) | Global markets, trading, central banks, Gulf FDI |
| **Happy Monitor**   | [happy.marsd.app](https://happy.marsd.app)     | Good news, positive trends, uplifting stories    |

All five variants run from a single codebase — switch between them with one click via the header bar.

---

## Key Features

### Maps & Visualization

- **Dual Map Engine** — 3D globe (globe.gl + Three.js) and WebGL flat map (deck.gl), runtime-switchable with 45 shared data layers. [Details →](./docs/MAP_ENGINE.md)
- **45 toggleable data layers** — conflicts, bases, cables, pipelines, flights, vessels, protests, fires, earthquakes, datacenters, and more across all variants
- **8 regional presets** — Global, Americas, Europe, MENA, Asia, Africa, Oceania, Latin America with time filtering (1h–7d)
- **CII choropleth heatmap** — five-stop color gradient paints every country by instability score on both map engines
- **URL state sharing** — map center, zoom, active layers, and time range encoded in shareable URLs

### AI & Intelligence

- **World Brief** — LLM-synthesized summary with 4-tier fallback: Ollama (local) → Groq → OpenRouter → browser T5. [Details →](./docs/AI_INTELLIGENCE.md)
- **AI Deduction & Forecasting** — free-text geopolitical analysis grounded in live headlines. [Details →](./docs/AI_INTELLIGENCE.md#ai-deduction--forecasting)
- **Headline Memory (RAG)** — opt-in browser-local semantic index using ONNX embeddings in IndexedDB. [Details →](./docs/AI_INTELLIGENCE.md#client-side-headline-memory-rag)
- **Threat Classification** — instant keyword classifier with async ML and LLM override. [Details →](./docs/AI_INTELLIGENCE.md#threat-classification-pipeline)
- **Country Brief Pages** — full-page intelligence dossiers with CII scores, AI analysis, timelines, and prediction markets. [Details →](./docs/AI_INTELLIGENCE.md#country-brief-pages)

### Data Layers

<details>
<summary><strong>Geopolitical</strong> — conflicts, hotspots, protests, disasters, sanctions, cyber IOCs, GPS jamming, Iran events</summary>

[Full details →](./docs/DATA_SOURCES.md#data-layers)
</details>

<details>
<summary><strong>Military & Strategic</strong> — 210+ bases, live flights (ADS-B), naval vessels (AIS), nuclear facilities, spaceports</summary>

[Full details →](./docs/DATA_SOURCES.md#data-layers)
</details>

<details>
<summary><strong>Infrastructure</strong> — undersea cables, pipelines, 111 AI datacenters, 83 strategic ports, 107 airports, trade routes</summary>

[Full details →](./docs/DATA_SOURCES.md#data-layers)
</details>

<details>
<summary><strong>Market & Crypto</strong> — 7-signal macro radar, market watchlist, Gulf economies, crypto, prediction markets, stablecoins, ETF flows</summary>

[Full details →](./docs/DATA_SOURCES.md#data-layers)
</details>

<details>
<summary><strong>Tech Ecosystem</strong> — company HQs, startup hubs, cloud regions, accelerators, conferences</summary>

[Full details →](./docs/DATA_SOURCES.md#data-layers)
</details>

<details>
<summary><strong>Finance & Markets</strong> — 92 stock exchanges, 19 financial centers, 13 central banks, BIS data, WTO trade policy, Gulf FDI</summary>

[Full details →](./docs/FINANCE_DATA.md)
</details>

### Live News & Video

- **435+ RSS feeds** across geopolitics, defense, energy, tech, and finance with server-side aggregation (95% fewer edge invocations). [Details →](./docs/DATA_SOURCES.md#server-side-aggregation)
- **30+ live video streams** — Bloomberg, Sky News, Al Jazeera, and more with HLS native streaming, idle-aware playback, and fullscreen mode
- **22 live webcams** — geopolitical hotspot streams across 5 regions with Iran/Attacks dedicated tab
- **Custom keyword monitors** — user-defined alerts with word-boundary matching and auto-coloring

### Scoring & Detection

- **Country Instability Index (CII)** — real-time stability scores using weighted multi-signal blend across 23 tier-1 nations + universal scoring for all countries. [Details →](./docs/ALGORITHMS.md#country-instability-index-cii)
- **Hotspot Escalation** — dynamic scoring blending news activity, CII, geo-convergence, and military signals. [Details →](./docs/ALGORITHMS.md#hotspot-escalation-scoring)
- **Strategic Risk Score** — composite geopolitical risk from convergence, CII, infrastructure, theater, and breaking news. [Details →](./docs/ALGORITHMS.md#strategic-risk-score-algorithm)
- **Signal Aggregation** — multi-source fusion with temporal baseline anomaly detection (Welford's algorithm). [Details →](./docs/ALGORITHMS.md#signal-aggregation)
- **Cross-Stream Correlation** — 14 signal types detecting patterns across news, markets, military, and predictions. [Details →](./docs/ALGORITHMS.md#cross-stream-correlation-engine)

### Finance & Markets

- **Macro Signal Analysis** — 7-signal market radar with composite BUY/CASH verdict. [Details →](./docs/FINANCE_DATA.md#macro-signal-analysis-market-radar)
- **Gulf FDI** — 64 Saudi/UAE investments plotted globally. [Details →](./docs/FINANCE_DATA.md#gulf-fdi-investment-database)
- **Stablecoin & BTC ETF** — peg health monitoring and spot ETF flow tracking. [Details →](./docs/FINANCE_DATA.md)
- **Oil & Energy** — WTI/Brent prices, production, inventory via EIA. [Details →](./docs/FINANCE_DATA.md#oil--energy-analytics)
- **BIS & WTO** — central bank rates, trade policy intelligence. [Details →](./docs/FINANCE_DATA.md)

### Desktop & Mobile

- **Native desktop app** (Tauri) — macOS, Windows, Linux with OS keychain, local sidecar, and cloud fallback. [Details →](./docs/DESKTOP_APP.md)
- **Progressive Web App** — installable with offline map support (CacheFirst tiles, 500-tile cap)
- **Mobile-optimized map** — touch pan with inertia, pinch-to-zoom, bottom-sheet popups, GPS centering
- **Responsive layout** — ultra-wide L-shaped layout on 2000px+, collapsible panels, mobile search sheet

### Platform Features

- **21 languages** — lazy-loaded bundles with native-language RSS feeds, AI translation, and RTL support
- **Cmd+K command palette** — fuzzy search across 24 result types, layer presets, ~250 country commands
- **Proto-first API contracts** — 92 proto files, 22 services, auto-generated TypeScript + OpenAPI docs
- **Dark/light theme** — persistent toggle with 20+ semantic color variables
- **Story sharing** — intelligence briefs exportable to Twitter/X, LinkedIn, WhatsApp, Telegram, Reddit with OG images

---

## How It Works

### AI & Analysis Pipeline

**AI Summarization** — 4-tier provider chain (Ollama → Groq → OpenRouter → browser T5) with headline deduplication, variant-aware prompting, and Redis caching (24h TTL). [Details →](./docs/AI_INTELLIGENCE.md#ai-summarization-chain)

**AI Deduction** — interactive geopolitical forecasting grounded in 15 most recent headlines, cached 1 hour by query hash. [Details →](./docs/AI_INTELLIGENCE.md#ai-deduction--forecasting)

**Headline Memory** — opt-in ONNX-powered RAG system storing 5,000 headline vectors in IndexedDB for semantic search. [Details →](./docs/AI_INTELLIGENCE.md#client-side-headline-memory-rag)

**Threat Classification** — three-stage pipeline: instant keyword → browser ML → batched LLM, each improving confidence. [Details →](./docs/AI_INTELLIGENCE.md#threat-classification-pipeline)

**Browser-Side ML** — Transformers.js runs NER, sentiment, and embeddings entirely in the browser via Web Workers. [Details →](./docs/AI_INTELLIGENCE.md#browser-side-ml-pipeline)

### Scoring Algorithms

**Country Instability Index** — 0–100 score from baseline risk (40%), unrest (20%), security (20%), and information velocity (20%), with conflict-zone floors and travel advisory boosts. [Details →](./docs/ALGORITHMS.md#country-instability-index-cii)

**Hotspot Escalation** — blends news (35%), CII (25%), geo-convergence (25%), and military (15%) with 48-hour trend regression. [Details →](./docs/ALGORITHMS.md#hotspot-escalation-scoring)

**Strategic Theater Posture** — 9 operational theaters assessed for NORMAL → ELEVATED → CRITICAL based on aircraft, strike capability, naval presence, and regional CII. [Details →](./docs/ALGORITHMS.md#strategic-theater-posture-assessment)

**Geographic Convergence** — 1°×1° spatial binning detects 3+ event types co-occurring within 24 hours. [Details →](./docs/ALGORITHMS.md#geographic-convergence-detection)

**Trending Keywords** — 2-hour rolling window vs 7-day baseline flags surging terms with CVE/APT extraction. [Details →](./docs/ALGORITHMS.md#trending-keyword-spike-detection)

### Data Collection

**435+ RSS feeds** with 4-tier source credibility, server-side aggregation, and per-feed circuit breakers. [Details →](./docs/DATA_SOURCES.md)

**Military tracking** — ADS-B flights, AIS vessels, USNI fleet reports, Wingbits aircraft enrichment. [Details →](./docs/DATA_SOURCES.md#intelligence-feeds)

**Telegram OSINT** — 26 channels via MTProto with dedup and topic classification. [Details →](./docs/DATA_SOURCES.md#telegram-osint-intelligence-feed)

**OREF rocket alerts** — Israel Home Front Command sirens via residential proxy. [Details →](./docs/DATA_SOURCES.md#oref-rocket-alert-integration)

**Prediction markets** — Polymarket contracts with 4-tier fetch and country matching. [Details →](./docs/DATA_SOURCES.md#prediction-markets)

### Architecture Overview

**Vanilla TypeScript** — no framework, direct DOM manipulation, custom Panel/VirtualList classes. The entire app shell weighs less than React's runtime. [Details →](./docs/ARCHITECTURE.md)

**Proto-first APIs** — 22 typed service domains with auto-generated clients, servers, and OpenAPI docs. [Details →](./docs/ARCHITECTURE.md#proto-first-api-contracts)

**Edge functions** — 60+ Vercel Edge Functions split into per-domain thin entry points (~85% cold-start reduction). [Details →](./docs/ARCHITECTURE.md#edge-functions--deployment)

**3-tier caching** — in-memory → Redis → upstream with cache stampede prevention and stale-on-error fallback. [Details →](./docs/ARCHITECTURE.md#bandwidth--caching)

**Bootstrap hydration** — 15 Redis keys pre-fetched in a single pipeline call for sub-second first render. [Details →](./docs/ARCHITECTURE.md#bootstrap-hydration)

### Client-Side Headline Memory (RAG)

The Headline Memory system provides browser-local Retrieval-Augmented Generation — a persistent semantic index of news headlines that runs entirely on the user's device.

**Ingestion pipeline**:

```
RSS Feed Parse → isHeadlineMemoryEnabled()? → ML Worker (Web Worker)
                                                    │
                                          ┌─────────┴──────────┐
                                          │  ONNX Embeddings   │
                                          │  all-MiniLM-L6-v2  │
                                          │  384-dim float32   │
                                          └─────────┬──────────┘
                                                    │
                                          ┌─────────┴──────────┐
                                          │  IndexedDB Store   │
                                          │  5,000 vector cap  │
                                          │  LRU by ingestAt   │
                                          └────────────────────┘
```

1. After each RSS feed fetch and parse, if Headline Memory is enabled and the embeddings model is loaded, each headline's title, publication date, source, URL, and location tags are sent to the ML Worker
2. The worker sanitizes text (strips control chars, truncates to 200 chars), embeds via the ONNX pipeline (`pooling: 'mean', normalize: true`), and deduplicates by content hash
3. Vectors are written to IndexedDB via a serialized promise queue (preventing concurrent transaction conflicts). When the 5,000-vector cap is exceeded, the oldest entries by `ingestedAt` are evicted

**Search**: Queries are embedded using the same model, then a full cursor scan computes cosine similarity against all stored vectors. Results are ranked by score, capped at `topK` (1–20), and filtered by `minScore` (0–1). Multiple query strings can be searched simultaneously (up to 5), with the max score per record across all queries used for ranking.

**Opt-in mechanism**: The setting defaults to `false` (stored as `wm-headline-memory` in localStorage). Enabling it triggers `mlWorker.init()` → `loadModel('embeddings')`. Disabling it unloads the model and optionally terminates the entire worker if no other ML features are active. The `ai-flow-changed` CustomEvent propagates toggle changes to all interested components.

### Threat Classification Pipeline

Every news item passes through a three-stage classification pipeline:

1. **Keyword classifier** (instant, `source: 'keyword'`) — pattern-matches against ~120 threat keywords organized by severity tier (critical → high → medium → low → info) and 14 event categories (conflict, protest, disaster, diplomatic, economic, terrorism, cyber, health, environmental, military, crime, infrastructure, tech, general). Keywords use word-boundary regex matching to prevent false positives (e.g., "war" won't match "award"). Each match returns a severity level, category, and confidence score. Variant-specific keyword sets ensure the tech variant doesn't flag "sanctions" in non-geopolitical contexts.

2. **Browser-side ML** (async, `source: 'ml'`) — Transformers.js runs NER, sentiment analysis, and topic classification directly in the browser with no server dependency. Provides a second classification opinion without any API call.

3. **LLM classifier** (batched async, `source: 'llm'`) — headlines are collected into a batch queue and fired as parallel `classifyEvent` RPCs via the sebuf proto client. Each RPC calls the configured LLM provider (Groq Llama 3.1 8B at temperature 0, or Ollama for local inference). Results are cached in Redis (24h TTL) keyed by headline hash. When 500-series errors occur, the LLM classifier automatically pauses its queue to avoid wasting API quota, resuming after an exponential backoff delay. When the LLM result arrives, it overrides the keyword result only if its confidence is higher.

This hybrid approach means the UI is never blocked waiting for AI — users see keyword results instantly, with ML and LLM refinements arriving within seconds and persisting for all subsequent visitors. Each classification carries its `source` tag (`keyword`, `ml`, or `llm`) so downstream consumers can weight confidence accordingly.

### Country Instability Index (CII)

Every country with incoming event data receives a live instability score (0–100). 23 curated tier-1 nations (US, Russia, China, Ukraine, Iran, Israel, Taiwan, North Korea, Saudi Arabia, Turkey, Poland, Germany, France, UK, India, Pakistan, Syria, Yemen, Myanmar, Venezuela, Brazil, UAE, and Japan) have individually tuned baseline risk profiles and keyword lists. All other countries that generate any signal (protests, conflicts, outages, displacement flows, climate anomalies) are scored automatically using a universal default baseline (`DEFAULT_BASELINE_RISK = 15`, `DEFAULT_EVENT_MULTIPLIER = 1.0`). The score is computed from:

| Component                | Weight | Details                                                                                                                                                                                         |
| ------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Baseline risk**        | 40%    | Pre-configured per country reflecting structural fragility                                                                                                                                      |
| **Unrest events**        | 20%    | Protests scored logarithmically for democracies (routine protests don't trigger), linearly for authoritarian states (every protest is significant). Boosted for fatalities and internet outages |
| **Security activity**    | 20%    | Military flights (3pts) + vessels (5pts) from own forces + foreign military presence (doubled weight)                                                                                           |
| **Information velocity** | 20%    | News mention frequency weighted by event severity multiplier, log-scaled for high-volume countries                                                                                              |

Additional boosts apply for hotspot proximity, focal point urgency, conflict-zone floors (e.g., Ukraine is pinned at ≥55, Syria at ≥50), GPS/GNSS jamming (up to +35 in Security component), OREF rocket alerts (up to +50 in Conflict component for Israel), and government travel advisories (Do-Not-Travel forces CII ≥ 60 with multi-source consensus bonuses).

### Hotspot Escalation Scoring

Intelligence hotspots receive dynamic escalation scores blending four normalized signals (0–100):

- **News activity** (35%) — article count and severity in the hotspot's area
- **Country instability** (25%) — CII score of the host country
- **Geo-convergence alerts** (25%) — spatial binning detects 3+ event types (protests + military + earthquakes) co-occurring within 1° lat/lon cells
- **Military activity** (15%) — vessel clusters and flight density near the hotspot

The system blends static baseline risk (40%) with detected events (60%) and tracks trends via linear regression on 48-hour history. Signal emissions cool down for 2 hours to prevent alert fatigue.

### Geographic Convergence Detection

Events (protests, military flights, vessels, earthquakes) are binned into 1°×1° geographic cells within a 24-hour window. When 3+ distinct event types converge in one cell, a convergence alert fires. Scoring is based on type diversity (×25pts per unique type) plus event count bonuses (×2pts). Alerts are reverse-geocoded to human-readable names using conflict zones, waterways, and hotspot databases.

### Strategic Theater Posture Assessment

Nine operational theaters are continuously assessed for military posture escalation:

| Theater               | Key Trigger                                 |
| --------------------- | ------------------------------------------- |
| Iran / Persian Gulf   | Carrier groups, tanker activity, AWACS      |
| Taiwan Strait         | PLAAF sorties, USN carrier presence         |
| Baltic / Kaliningrad  | Russian Western Military District flights   |
| Korean Peninsula      | B-52/B-1 deployments, DPRK missile activity |
| Eastern Mediterranean | Multi-national naval exercises              |
| Horn of Africa        | Anti-piracy patrols, drone activity         |
| South China Sea       | Freedom of navigation operations            |
| Arctic                | Long-range aviation patrols                 |
| Black Sea             | ISR flights, naval movements                |

Posture levels escalate from NORMAL → ELEVATED → CRITICAL based on a composite of:

- **Aircraft count** in theater (both resident and transient)
- **Strike capability** — the presence of tankers + AWACS + fighters together indicates strike packaging, not routine training
- **Naval presence** — carrier groups and combatant formations
- **Country instability** — high CII scores for theater-adjacent countries amplify posture

Each theater is linked to 38+ military bases, enabling automatic correlation between observed flights and known operating locations.

### Military Surge & Foreign Presence Detection

The system monitors five operational theaters (Middle East, Eastern Europe, Western Europe, Western Pacific, Horn of Africa) with 38+ associated military bases. It classifies vessel clusters near hotspots by activity type:

- **Deployment** — carrier present with 5+ vessels
- **Exercise** — combatants present in formation
- **Transit** — vessels passing through

Foreign military presence is dual-credited: the operator's country is flagged for force projection, and the host location's country is flagged for foreign military threat. AIS gaps (dark ships) are flagged as potential signal discipline indicators.

### USNI Fleet Intelligence

The dashboard ingests weekly U.S. Naval Institute (USNI) fleet deployment reports and merges them with live AIS vessel tracking data. Each report is parsed for carrier strike groups, amphibious ready groups, and individual combatant deployments — extracting hull numbers, vessel names, operational regions, and mission notes.

The merge algorithm matches USNI entries against live AIS-tracked vessels by hull number and normalized name. Matched vessels receive enrichment: strike group assignment, deployment status (deployed / returning / in-port), and operational theater. Unmatched USNI entries (submarines, vessels running dark) generate synthetic positions based on the last known operational region, with coordinate scattering to prevent marker overlap.

This dual-source approach provides a more complete operational picture than either AIS or USNI alone — AIS reveals real-time positions but misses submarines and vessels with transponders off, while USNI captures the complete order of battle but with weekly lag.

### Aircraft Enrichment

Military flights detected via ADS-B transponder data are enriched through the Wingbits aviation intelligence API, which provides aircraft registration, manufacturer, model, owner, and operator details. Each flight receives a military confidence classification:

| Confidence    | Criteria                                                         |
| ------------- | ---------------------------------------------------------------- |
| **Confirmed** | Operator matches a known military branch or defense contractor  |
| **Likely**    | Aircraft type is exclusively military (tanker, AWACS, fighter)  |
| **Possible**  | Government-registered aircraft in a military operating area      |
| **Civilian**  | No military indicators detected                                 |

Enrichment queries are batched (up to 50 aircraft per request) and cached with a circuit breaker pattern to avoid hammering the upstream API during high-traffic periods. The enriched metadata feeds into the Theater Posture Assessment — a KC-135 tanker paired with F-15s and an E-3 AWACS indicates strike packaging, not routine training.

### Undersea Cable Health Monitoring

Beyond displaying static cable routes on the map, the system actively monitors cable health by cross-referencing two live data sources:

1. **NGA Navigational Warnings** — the U.S. National Geospatial-Intelligence Agency publishes maritime safety broadcasts that frequently mention cable repair operations. The system filters these warnings for cable-related keywords (`CABLE`, `CABLESHIP`, `SUBMARINE CABLE`, `FIBER OPTIC`, etc.) and extracts structured data: vessel names, DMS/decimal coordinates, advisory severity, and repair ETAs. Each warning is matched to the nearest cataloged undersea cable within a 5° geographic radius.

2. **AIS Cable Ship Tracking** — dedicated cable repair vessels (CS Reliance, Île de Bréhat, Cable Innovator, etc.) are identified by name pattern matching against AIS transponder data. Ship status is classified as `enroute` (transiting to repair site) or `on-station` (actively working) based on keyword analysis of the warning text.

Advisories are classified by severity: `fault` (cable break, cut, or damage — potential traffic rerouting) or `degraded` (repair work in progress with partial capacity). Impact descriptions are generated dynamically, linking the advisory to the specific cable and the countries it serves — enabling questions like "which cables serving South Asia are currently under repair?"

**Health scoring algorithm** — Each cable receives a composite health score (0–100) computed from weighted signals with exponential time decay:

```
signal_weight = severity × (e^(-λ × age_hours))     where λ = ln(2) / 168 (7-day half-life)
health_score  = max(0, 100 − Σ(signal_weights) × 100)
```

Signals are classified into two kinds: `operator_fault` (confirmed cable damage — severity 1.0) and `cable_advisory` (repair operations, navigational warnings — severity 0.6). Geographic matching uses cosine-latitude-corrected equirectangular approximation to find the nearest cataloged cable within 50km of each NGA warning's coordinates. Results are cached in Redis (6-hour TTL for complete results, 10 minutes for partial) with an in-memory fallback that serves stale data when Redis is unavailable — ensuring the cable health layer never shows blank data even during cache failures.

### Infrastructure Cascade Modeling

Beyond proximity correlation, the system models how disruptions propagate through interconnected infrastructure. A dependency graph connects undersea cables, pipelines, ports, chokepoints, and countries with weighted edges representing capacity dependencies:

```
Disruption Event → Affected Node → Cascade Propagation (BFS, depth ≤ 3)
                                          │
                    ┌─────────────────────┤
                    ▼                     ▼
            Direct Impact         Indirect Impact
         (e.g., cable cut)    (countries served by cable)
```

**Impact calculation**: `strength = edge_weight × disruption_level × (1 − redundancy)`

Strategic chokepoint modeling captures real-world dependencies:

- **Strait of Hormuz** — 80% of Japan's oil, 70% of South Korea's, 60% of India's, 40% of China's
- **Suez Canal** — EU-Asia trade routes (Germany, Italy, UK, China)
- **Malacca Strait** — 80% of China's oil transit

Ports are weighted by type: oil/LNG terminals (0.9 — critical), container ports (0.7), naval bases (0.4 — geopolitical but less economic). This enables questions like "if the Strait of Hormuz closes, which countries face energy shortages within 30 days?"

### Related Assets & Proximity Correlation

When a news event is geo-located, the system automatically identifies critical infrastructure within a 600km radius — pipelines, undersea cables, data centers, military bases, and nuclear facilities — ranked by distance. This enables instant geopolitical context: a cable cut near a strategic chokepoint, a protest near a nuclear facility, or troop movements near a data center cluster.

### News Geo-Location

A 217-hub strategic location database infers geography from headlines via keyword matching. Hubs span capitals, conflict zones, strategic chokepoints (Strait of Hormuz, Suez Canal, Malacca Strait), and international organizations. Confidence scoring is boosted for critical-tier hubs and active conflict zones, enabling map-driven news placement without requiring explicit location metadata from RSS feeds.

### Entity Index & Cross-Referencing

A structured entity registry catalogs countries, organizations, world leaders, and military entities with multiple lookup indices:

| Index Type        | Purpose               | Example                                         |
| ----------------- | --------------------- | ----------------------------------------------- |
| **ID index**      | Direct entity lookup  | `entity:us` → United States profile             |
| **Alias index**   | Name variant matching | "America", "USA", "United States" → same entity |
| **Keyword index** | Contextual detection  | "Pentagon", "White House" → United States       |
| **Sector index**  | Domain grouping       | "military", "energy", "tech"                    |
| **Type index**    | Category filtering    | "country", "organization", "leader"             |

Entity matching uses word-boundary regex to prevent false positives (e.g., "Iran" matching "Ukraine"). Confidence scores are tiered by match quality: exact name matches score 1.0, aliases 0.85–0.95, and keyword matches 0.7. When the same entity surfaces across multiple independent data sources (news, military tracking, protest feeds, market signals), the system identifies it as a focal point and escalates its prominence in the intelligence picture.

### Temporal Baseline Anomaly Detection

Rather than relying on static thresholds, the system learns what "normal" looks like and flags deviations. Each event type (military flights, naval vessels, protests, news velocity, AIS gaps, satellite fires) is tracked per region with separate baselines for each weekday and month — because military activity patterns differ on Tuesdays vs. weekends, and January vs. July.

The algorithm uses **Welford's online method** for numerically stable streaming computation of mean and variance, stored in Redis with a 90-day rolling window. When a new observation arrives, its z-score is computed against the learned baseline. Thresholds:

| Z-Score | Severity      | Example                            |
| ------- | ------------- | ---------------------------------- |
| ≥ 1.5   | Low           | Slightly elevated protest activity |
| ≥ 2.0   | Medium        | Unusual naval presence             |
| ≥ 3.0   | High/Critical | Military flights 3x above baseline |

A minimum of 10 historical samples is required before anomalies are reported, preventing false positives during the learning phase. Anomalies are ingested back into the signal aggregator, where they compound with other signals for convergence detection.

### Trending Keyword Spike Detection

Every RSS headline is tokenized into individual terms and tracked in per-term frequency maps. A 2-hour rolling window captures current activity while a 7-day baseline (refreshed hourly) establishes what "normal" looks like for each term. A spike fires when all conditions are met:

| Condition            | Threshold                                     |
| -------------------- | --------------------------------------------- |
| **Absolute count**   | > `minSpikeCount` (5 mentions)                |
| **Relative surge**   | > baseline × `spikeMultiplier` (3×)           |
| **Source diversity** | ≥ 2 unique RSS feed sources                   |
| **Cooldown**         | 30 minutes since last spike for the same term |

The tokenizer extracts CVE identifiers (`CVE-2024-xxxxx`), APT/FIN threat actor designators, and 12 compound terms for world leaders (e.g., "Xi Jinping", "Kim Jong Un") that would be lost by naive whitespace splitting. A configurable blocklist suppresses common noise terms.

Detected spikes are auto-summarized via Groq (rate-limited to 5 summaries/hour) and emitted as `keyword_spike` signals into the correlation engine, where they compound with other signal types for convergence detection. The term registry is capped at 10,000 entries with LRU eviction to bound memory usage. All thresholds (spike multiplier, min count, cooldown, blocked terms) are configurable via the Settings panel.

### Breaking News Alert Pipeline

The dashboard monitors five independent alert origins and fuses them into a unified breaking news stream with layered deduplication, cooldowns, and source quality gating:

| Origin               | Trigger                                                        | Example                                      |
| -------------------- | -------------------------------------------------------------- | -------------------------------------------- |
| **RSS alert**        | News item with `isAlert: true` and threat level critical/high  | Reuters flash: missile strike confirmed       |
| **Keyword spike**    | Trending keyword exceeds spike threshold                       | "nuclear" surges across 8+ feeds in 2 hours  |
| **Hotspot escalation** | Hotspot escalation score exceeds critical threshold          | Taiwan Strait tension crosses 80/100         |
| **Military surge**   | Theater posture assessment detects strike packaging            | Tanker + AWACS + fighters co-present in MENA |
| **OREF siren**       | Israel Home Front Command issues incoming rocket/missile alert | Rocket barrage detected in northern Israel   |

**Anti-noise safeguards**:

- **Per-event dedup** — each alert is keyed by a content hash; repeated alerts for the same event are suppressed for 30 minutes
- **Global cooldown** — after any alert fires, a 60-second global cooldown prevents rapid-fire notification bursts
- **Recency gate** — items older than 15 minutes at processing time are silently dropped, preventing stale events from generating alerts after a reconnection
- **Source tier gating** — Tier 3+ sources (niche outlets, aggregators) must have LLM-confirmed classification (`threat.source !== 'keyword'`) to fire an alert; Tier 1–2 sources bypass this gate
- **User sensitivity control** — configurable between `critical-only` (only critical severity fires) and `critical-and-high` (both critical and high severities)

When an alert passes all gates, the system dispatches a `wm:breaking-news` CustomEvent on `document`, which the Breaking News Banner consumes to display a persistent top-of-screen notification. Optional browser Notification API popups and an audio chime are available as user settings. Clicking the banner scrolls to the RSS panel that sourced the alert and applies a 1.5-second flash highlight animation.

### Telegram OSINT Intelligence Feed

26 curated Telegram channels provide a raw, low-latency intelligence feed covering conflict zones, OSINT analysis, and breaking news — sources that are often minutes ahead of traditional wire services during fast-moving events.

| Tier       | Channels                                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------------------------- |
| **Tier 1** | VahidOnline (Iran politics)                                                                                           |
| **Tier 2** | Abu Ali Express, Aurora Intel, BNO News, Clash Report, DeepState, Defender Dome, Iran International, LiveUAMap, OSINTdefender, OSINT Updates, Ukraine Air Force (kpszsu), Povitryani Tryvoha |
| **Tier 3** | Bellingcat, CyberDetective, GeopoliticalCenter, Middle East Spectator, Middle East Now Breaking, NEXTA, OSINT Industries, OsintOps News, OSINT Live, OsintTV, The Spectator Index, War Monitor, WFWitness |

**Architecture**: A GramJS MTProto client running on the Railway relay polls all channels sequentially on a 60-second cycle. Each channel has a 15-second timeout (GramJS `getEntity`/`getMessages` can hang indefinitely on FLOOD_WAIT or MTProto stalls), and the entire cycle has a 3-minute hard timeout. A stuck-poll guard force-clears the mutex after 3.5 minutes, and FLOOD_WAIT errors from Telegram's API stop the cycle early rather than propagating to every remaining channel.

Messages are deduplicated by ID, filtered to exclude media-only posts (images without text), truncated to 800 characters, and stored in a rolling 200-item buffer. The relay connects with a 60-second startup delay to prevent `AUTH_KEY_DUPLICATED` errors during Railway container restarts (the old container must fully disconnect before the new one authenticates). Topic classification (breaking, conflict, alerts, osint, politics, middleeast) and channel-based filtering happen at query time via the `/telegram/feed` relay endpoint.

### OREF Rocket Alert Integration

The dashboard monitors Israel's Home Front Command (Pikud HaOref) alert system for incoming rocket, missile, and drone sirens — a real-time signal that is difficult to obtain programmatically due to Akamai WAF protection.

**Data flow**: The Railway relay polls `oref.org.il` using `curl` (not Node.js fetch, which is JA3-blocked) through a residential proxy with an Israeli exit IP. On startup, the relay bootstraps history via a two-phase strategy: Phase 1 loads from Redis (filtering entries older than 7 days); if Redis is empty, Phase 2 fetches from the upstream OREF API with exponential backoff retry (up to 3 attempts, delays of 3s/6s/12s + jitter). Alert history is persisted to Redis with dirty-flag deduplication to prevent redundant writes. Live alerts are polled every 5 minutes. Wave detection groups individual siren records by timestamp to identify distinct attack waves. Israel-local timestamps are converted to UTC with DST-aware offset calculation. **1,480 Hebrew→English location translations** — an auto-generated dictionary (from the pikud-haoref-api `cities.json` source) enables automatic translation of Hebrew city names in alert data. Unicode bidirectional control characters are stripped via `sanitizeHebrew()` before translation lookups to prevent mismatches.

**CII integration**: Active OREF alerts boost Israel's CII conflict component by up to 50 points (`25 + min(25, alertCount × 5)`). Rolling 24-hour history adds a secondary boost: 3–9 alerts in the window contribute +5, 10+ contribute +10 to the blended score. This means a sustained multi-wave rocket barrage drives Israel's CII significantly higher than a single isolated alert.

### GPS/GNSS Interference Detection

GPS jamming and spoofing — increasingly used as electronic warfare in conflict zones — is detected by analyzing ADS-B transponder data from aircraft that report GPS anomalies. Data is sourced from [gpsjam.org](https://gpsjam.org), which aggregates ADS-B Exchange data into H3 resolution-4 hexagonal grid cells.

**Classification**: Each H3 cell reports the ratio of aircraft with GPS anomalies vs. total aircraft. Cells with fewer than 3 aircraft are excluded as statistically noisy. The remaining cells are classified:

| Interference Level | Bad Aircraft % | Map Color |
| ------------------ | -------------- | --------- |
| **Low**            | 0–2%           | Hidden    |
| **Medium**         | 2–10%          | Amber     |
| **High**           | > 10%          | Red       |

**Region tagging**: Each hex cell is tagged to one of 12 named conflict regions via bounding-box classification (Iran-Iraq, Levant, Ukraine-Russia, Baltic, Mediterranean, Black Sea, Arctic, Caucasus, Central Asia, Horn of Africa, Korean Peninsula, South China Sea) for filtered region views.

**CII integration**: `ingestGpsJammingForCII` maps each H3 hex centroid to a country via the local geometry service, then accumulates per-country interference counts. In the CII security component, GPS jamming contributes up to 35 points: `min(35, highCount × 5 + mediumCount × 2)`.

### Security Advisory Aggregation

Government travel advisories serve as expert risk assessments from national intelligence agencies — when the US State Department issues a "Do Not Travel" advisory, it reflects classified threat intelligence that no open-source algorithm can replicate.

**Sources**: 4 government advisory feeds (US State Dept, Australia DFAT Smartraveller, UK FCDO, New Zealand MFAT), 13 US Embassy country-specific alert feeds (Thailand, UAE, Germany, Ukraine, Mexico, India, Pakistan, Colombia, Poland, Bangladesh, Italy, Dominican Republic, Myanmar), and health agency feeds (CDC Travel Notices, ECDC epidemiological updates, WHO News, WHO Africa Emergencies).

**Advisory levels** (ranked): Do-Not-Travel (4) → Reconsider Travel (3) → Exercise Caution (2) → Normal (1) → Info (0). Both RSS (`<item>`) and Atom (`<entry>`) formats are parsed. Country extraction uses regex parsing of advisory titles with `nameToCountryCode()` lookup.

**CII integration** — advisories feed into instability scores through two mechanisms:

- **Score boost**: Do-Not-Travel → +15 points, Reconsider → +10, Caution → +5. Multi-source agreement adds a consensus bonus: ≥3 governments concur → +5, ≥2 → +3
- **Score floor**: Do-Not-Travel from any government forces a minimum CII score of 60; Reconsider forces minimum 50. This prevents a country with low event data but active DNT warnings from showing an artificially calm score

The Security Advisories panel displays advisories with colored level badges and source country flags, filterable by severity (Critical, All) and issuing government (US, AU, UK, NZ, Health).

### Airport Delay & NOTAM Monitoring

107 airports across 5 regions (Americas, Europe, Asia-Pacific, MENA, Africa) are continuously monitored for delays, ground stops, and closures through three independent data sources:

| Source             | Coverage                  | Method                                                                                                  |
| ------------------ | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| **FAA ASWS**       | 14 US hub airports        | Real-time XML feed from `nasstatus.faa.gov` — ground delays, ground stops, arrival/departure delays, closures |
| **AviationStack**  | 40 international airports  | Last 100 flights per airport — cancellation rate and average delay duration computed from flight records  |
| **ICAO NOTAM API** | 46 MENA airports           | Real-time NOTAM (Notice to Air Missions) query for active airport/airspace closures                      |

**NOTAM closure detection** targets MENA airports where airspace closures due to military activity or security events carry strategic significance. Detection uses two methods: ICAO Q-code matching (aerodrome/airspace closure codes `FA`, `AH`, `AL`, `AW`, `AC`, `AM` combined with closure qualifiers `LC`, `AS`, `AU`, `XX`, `AW`) and free-text regex scanning for closure keywords (`AD CLSD`, `AIRPORT CLOSED`, `AIRSPACE CLOSED`). When a NOTAM closure is detected, it overrides any existing delay alert for that airport with a `severe/closure` classification.

**Severity thresholds**: Average delay ≥15min or ≥15% delayed flights = minor; ≥30min/30% = moderate; ≥45min/45% = major; ≥60min/60% = severe. Cancellation rate ≥80% with ≥10 flights = closure. All results are cached for 30 minutes in Redis. When no AviationStack API key is configured, the system generates probabilistic simulated delays for demonstration — rush-hour windows and high-traffic airports receive higher delay probability.

### Strategic Risk Score Algorithm

The Strategic Risk panel computes a 0–100 composite geopolitical risk score that synthesizes data from all intelligence modules into a single, continuously updated metric.

**Composite formula**:

```
compositeScore =
    convergenceScore × 0.30     // multi-type events co-located in same H3 cell
  + ciiRiskScore     × 0.50     // CII top-5 country weighted blend
  + infraScore       × 0.20     // infrastructure cascade incidents
  + theaterBoost     (0–25)     // military asset density + strike packaging
  + breakingBoost    (0–15)     // breaking news severity injection
```

**Sub-scores**:

- `convergenceScore` — `min(100, convergenceAlertCount × 25)`. Each geographic cell with 3+ distinct event types contributing 25 points
- `ciiRiskScore` — Top 5 countries by CII score, weighted `[0.40, 0.25, 0.20, 0.10, 0.05]`, with a bonus of `min(20, elevatedCount × 5)` for each country above CII 50
- `infraScore` — `min(100, cascadeAlertCount × 25)`. Each infrastructure cascade incident contributing 25 points
- `theaterBoost` — For each theater posture summary: `min(10, floor((aircraft + vessels) / 5))` + 5 if strike-capable (tanker + AWACS + fighters co-present). Summed across theaters, capped at 25. Halved when posture data is stale
- `breakingBoost` — Critical breaking news alerts add 15 points, high adds 8, capped at 15. Breaking alerts expire after 30 minutes

**Alert fusion**: Alerts from convergence detection, CII spikes (≥10-point change), and infrastructure cascades are merged when they occur within a 2-hour window and are within 200km or in the same country. Merged alerts carry the highest priority and combine summaries. The alert queue caps at 50 entries with 24-hour pruning.

**Trend detection**: Delta ≥3 from previous composite = "escalating", ≤−3 = "de-escalating", otherwise "stable". A 15-minute learning period after panel initialization suppresses CII spike alerts to prevent false positives from initial data loading.

### Proto-First API Contracts

The entire API surface is defined in Protocol Buffer (`.proto`) files using [sebuf](https://github.com/SebastienMelki/sebuf) HTTP annotations. Code generation produces TypeScript clients, server handler stubs, and OpenAPI 3.1.0 documentation from a single source of truth — eliminating request/response schema drift between frontend and backend.

**22 service domains** cover every data vertical:

| Domain           | RPCs                                             |
| ---------------- | ------------------------------------------------ |
| `aviation`       | Airport delays (FAA, AviationStack, ICAO NOTAM)  |
| `climate`        | Climate anomalies                                |
| `conflict`       | ACLED events, UCDP events, humanitarian summaries|
| `cyber`          | Cyber threat IOCs                                |
| `displacement`   | Population displacement, exposure data           |
| `economic`       | Energy prices, FRED series, macro signals, World Bank, BIS policy rates, exchange rates, credit-to-GDP |
| `infrastructure` | Internet outages, service statuses, temporal baselines |
| `intelligence`   | Event classification, country briefs, risk scores|
| `maritime`       | Vessel snapshots, navigational warnings          |
| `market`         | Stock indices, crypto/commodity quotes, ETF flows|
| `military`       | Aircraft details, theater posture, USNI fleet    |
| `news`           | News items, article summarization                |
| `prediction`     | Prediction markets                               |
| `research`       | arXiv papers, HackerNews, tech events            |
| `seismology`     | Earthquakes                                      |
| `supply-chain`   | Chokepoint disruption scores, shipping rates, critical mineral concentration |
| `trade`          | WTO trade restrictions, tariff trends, trade flows, trade barriers |
| `unrest`         | Protest/unrest events                            |
| `wildfire`       | Fire detections                                  |
| `giving`         | Donation platform volumes, crypto giving, ODA    |
| `positive-events`| Positive news classification, conservation data  |

**Code generation pipeline** — a `Makefile` drives `buf generate` with three custom sebuf protoc plugins:

1. `protoc-gen-ts-client` → typed fetch-based client classes (`src/generated/client/`)
2. `protoc-gen-ts-server` → handler interfaces and route descriptors (`src/generated/server/`)
3. `protoc-gen-openapiv3` → OpenAPI 3.1.0 specs in YAML and JSON (`docs/api/`)

Proto definitions include `buf.validate` field constraints (e.g., latitude ∈ [−90, 90]), so request validation is generated automatically — handlers receive pre-validated data. Breaking changes are caught at CI time via `buf breaking` against the main branch.

**Edge gateway** — a single Vercel Edge Function (`api/[domain]/v1/[rpc].ts`) imports all 22 `createServiceRoutes()` functions into a flat `Map<string, handler>` router. Every RPC is a POST endpoint at a static path (e.g., `POST /api/aviation/v1/list-airport-delays`), with CORS enforcement, a top-level error boundary that hides internal details on 5xx responses, and rate-limit support (`retryAfter` on 429). The same router runs locally via a Vite dev-server plugin (`sebufApiPlugin` in `vite.config.ts`) with HMR invalidation on handler changes.

### Cyber Threat Intelligence Layer

Six threat intelligence feeds provide indicators of compromise (IOCs) for active command-and-control servers, malware distribution hosts, phishing campaigns, malicious URLs, and ransomware operations:

| Feed                         | IOC Type      | Coverage                        |
| ---------------------------- | ------------- | ------------------------------- |
| **Feodo Tracker** (abuse.ch) | C2 servers    | Botnet C&C infrastructure       |
| **URLhaus** (abuse.ch)       | Malware hosts | Malware distribution URLs       |
| **C2IntelFeeds**             | C2 servers    | Community-sourced C2 indicators |
| **AlienVault OTX**           | Mixed         | Open threat exchange pulse IOCs |
| **AbuseIPDB**                | Malicious IPs | Crowd-sourced abuse reports     |
| **Ransomware.live**          | Ransomware    | Active ransomware group feeds   |

Each IP-based IOC is geo-enriched using ipinfo.io with freeipapi.com as fallback. Geolocation results are Redis-cached for 24 hours. Enrichment runs concurrently — 16 parallel lookups with a 12-second timeout, processing up to 250 IPs per collection run.

IOCs are classified into four types (`c2_server`, `malware_host`, `phishing`, `malicious_url`) with four severity levels, rendered as color-coded scatter dots on the globe. The layer uses a 10-minute cache, a 14-day rolling window, and caps display at 500 IOCs to maintain rendering performance.

### Natural Disaster Monitoring

Three independent sources are merged into a unified disaster picture, then deduplicated on a 0.1° geographic grid:

| Source         | Coverage                       | Types                                                         | Update Frequency |
| -------------- | ------------------------------ | ------------------------------------------------------------- | ---------------- |
| **USGS**       | Global earthquakes M4.5+       | Earthquakes                                                   | 5 minutes        |
| **GDACS**      | UN-coordinated disaster alerts | Earthquakes, floods, cyclones, volcanoes, wildfires, droughts | Real-time        |
| **NASA EONET** | Earth observation events       | 13 natural event categories (30-day open events)              | Real-time        |

GDACS events carry color-coded alert levels (Red = critical, Orange = high) and are filtered to exclude low-severity Green alerts. EONET wildfires are filtered to events within 48 hours to prevent stale data. Earthquakes from EONET are excluded since USGS provides higher-quality seismological data.

The merged output feeds into the signal aggregator for geographic convergence detection — e.g., an earthquake near a pipeline triggers an infrastructure cascade alert.

### Dual-Source Protest Tracking

Protest data is sourced from two independent providers to reduce single-source bias:

1. **ACLED** (Armed Conflict Location & Event Data) — 30-day window, tokenized API with Redis caching (10-minute TTL). Covers protests, riots, strikes, and demonstrations with actor attribution and fatality counts.
2. **GDELT** (Global Database of Events, Language, and Tone) — 7-day geospatial event feed filtered to protest keywords. Events with mention count ≥5 are included; those above 30 are marked as `validated`.

Events from both sources are **Haversine-deduplicated** on a 0.1° grid (~10km) with same-day matching. ACLED events take priority due to higher editorial confidence. Severity is classified as:

- **High** — fatalities present or riot/clash keywords
- **Medium** — standard protest/demonstration
- **Low** — default

Protest scoring is regime-aware: democratic countries use logarithmic scaling (routine protests don't trigger instability), while authoritarian states use linear scoring (every protest is significant). Fatalities and concurrent internet outages apply severity boosts.

### Climate Anomaly Detection

15 conflict-prone and disaster-prone zones are continuously monitored for temperature and precipitation anomalies using Open-Meteo ERA5 reanalysis data. A 30-day baseline is computed, and current conditions are compared against it to determine severity:

| Severity     | Temperature Deviation | Precipitation Deviation   |
| ------------ | --------------------- | ------------------------- |
| **Extreme**  | > 5°C above baseline  | > 80mm/day above baseline |
| **Moderate** | > 3°C above baseline  | > 40mm/day above baseline |
| **Normal**   | Within expected range | Within expected range     |

Anomalies feed into the signal aggregator, where they amplify CII scores for affected countries (climate stress is a recognized conflict accelerant). The Climate Anomaly panel surfaces these deviations in a severity-sorted list.

### Displacement Tracking

Refugee and displacement data is sourced from the UN OCHA Humanitarian API (HAPI), providing population-level counts for refugees, asylum seekers, and internally displaced persons (IDPs). The Displacement panel offers two perspectives:

- **Origins** — countries people are fleeing from, ranked by outflow volume
- **Hosts** — countries absorbing displaced populations, ranked by intake

Crisis badges flag countries with extreme displacement: > 1 million displaced (red), > 500,000 (orange). Displacement outflow feeds into the CII as a component signal — high displacement is a lagging indicator of instability that persists even when headlines move on.

### Population Exposure Estimation

Active events (conflicts, earthquakes, floods, wildfires) are cross-referenced against WorldPop population density data to estimate the number of civilians within the impact zone. Event-specific radii reflect typical impact footprints:

| Event Type      | Radius | Rationale                                |
| --------------- | ------ | ---------------------------------------- |
| **Conflicts**   | 50 km  | Direct combat zone + displacement buffer |
| **Earthquakes** | 100 km | Shaking intensity propagation            |
| **Floods**      | 100 km | Watershed and drainage basin extent      |
| **Wildfires**   | 30 km  | Smoke and evacuation perimeter           |

API calls to WorldPop are batched concurrently (max 10 parallel requests) to handle multiple simultaneous events without sequential bottlenecks. The Population Exposure panel displays a summary header with total affected population and a per-event breakdown table.

### Strategic Port Infrastructure

83 strategic ports are cataloged across six types, reflecting their role in global trade and military posture:

| Type           | Count | Examples                                             |
| -------------- | ----- | ---------------------------------------------------- |
| **Container**  | 21    | Shanghai (#1, 47M+ TEU), Singapore, Ningbo, Shenzhen |
| **Oil/LNG**    | 8     | Ras Tanura (Saudi), Sabine Pass (US), Fujairah (UAE) |
| **Chokepoint** | 8     | Suez Canal, Panama Canal, Strait of Malacca          |
| **Naval**      | 6     | Zhanjiang, Yulin (China), Vladivostok (Russia)       |
| **Mixed**      | 15+   | Ports serving multiple roles (trade + military)      |
| **Bulk**       | 20+   | Regional commodity ports                             |

Ports are ranked by throughput and weighted by strategic importance in the infrastructure cascade model: oil/LNG terminals carry 0.9 criticality, container ports 0.7, and naval bases 0.4. Port proximity appears in the Country Brief infrastructure exposure section.

### Browser-Side ML Pipeline

The dashboard runs a full ML pipeline in the browser via Transformers.js, with no server dependency for core intelligence. This is automatically disabled on mobile devices to conserve memory.

| Capability                   | Model               | Use                                               |
| ---------------------------- | ------------------- | ------------------------------------------------- |
| **Text embeddings**          | sentence-similarity | Semantic clustering of news headlines             |
| **Sequence classification**  | threat-classifier   | Threat severity and category detection            |
| **Summarization**            | T5-small            | Last-resort fallback when Ollama, Groq, and OpenRouter are all unavailable |
| **Named Entity Recognition** | NER pipeline        | Country, organization, and leader extraction      |

**Hybrid clustering** combines fast Jaccard similarity (n-gram overlap, threshold 0.4) with ML-refined semantic similarity (cosine similarity, threshold 0.78). Jaccard runs instantly on every refresh; semantic refinement runs when the ML worker is loaded and merges clusters that are textually different but semantically identical (e.g., "NATO expands missile shield" and "Alliance deploys new air defense systems").

News velocity is tracked per cluster — when multiple Tier 1–2 sources converge on the same story within a short window, the cluster is flagged as a breaking alert with `sourcesPerHour` as the velocity metric.

### Live Webcam Surveillance Grid

22 YouTube live streams from geopolitical hotspots across 5 regions provide continuous visual situational awareness:

| Region             | Cities                                                           |
| ------------------ | ---------------------------------------------------------------- |
| **Iran / Attacks** | Tehran, Tel Aviv, Jerusalem (Western Wall)                       |
| **Middle East**    | Jerusalem (Western Wall), Tehran, Tel Aviv, Mecca (Grand Mosque) |
| **Europe**         | Kyiv, Odessa, Paris, St. Petersburg, London                      |
| **Americas**       | Washington DC, New York, Los Angeles, Miami                      |
| **Asia-Pacific**   | Taipei, Shanghai, Tokyo, Seoul, Sydney                           |

The webcam panel supports two viewing modes: a 4-feed grid (default strategic selection: Jerusalem, Tehran, Kyiv, Washington DC) and a single-feed expanded view. Region tabs (ALL/IRAN/MIDEAST/EUROPE/AMERICAS/ASIA) filter the available feeds. The Iran/Attacks tab provides a dedicated 2×2 grid for real-time visual monitoring during escalation events between Iran and Israel.

Resource management is aggressive — iframes are lazy-loaded via Intersection Observer (only rendered when the panel scrolls into view), paused after 5 minutes of user inactivity, and destroyed from the DOM entirely when the browser tab is hidden. On Tauri desktop, YouTube embeds route through a cloud proxy to bypass WKWebView autoplay restrictions. Each feed carries a fallback video ID in case the primary stream goes offline.

### Server-Side Feed Aggregation

Rather than each client browser independently fetching dozens of RSS feeds through individual edge function invocations, the `listFeedDigest` RPC endpoint aggregates all feeds server-side into a single categorized response.

**Architecture**:

```
Client (1 RPC call) → listFeedDigest → Redis check (digest:v1:{variant}:{lang})
                                              │
                                    ┌─────────┴─── HIT → return cached digest
                                    │
                                    ▼ MISS
                           ┌─────────────────────────┐
                           │  buildDigest()           │
                           │  20 concurrent fetches   │
                           │  8s per-feed timeout     │
                           │  25s overall deadline    │
                           └────────┬────────────────┘
                                    │
                              ┌─────┴─────┐
                              │ Per-feed   │ ← cached 600s per URL
                              │ Redis      │
                              └─────┬─────┘
                                    │
                                    ▼
                           ┌─────────────────────────┐
                           │  Categorized digest      │
                           │  Cached 900s (15 min)    │
                           │  Per-item keyword class.  │
                           └─────────────────────────┘
```

The digest cache key is `news:digest:v1:{variant}:{lang}` with a 900-second TTL. Individual feed results are separately cached per URL for 600 seconds. Items per feed are capped at 5, categories at 20 items each. XML parsing is edge-runtime-compatible (regex-based, no DOM parser), handling both RSS `<item>` and Atom `<entry>` formats. Each item is keyword-classified at aggregation time. An in-memory fallback cache (capped at 50 entries) provides last-known-good data if Redis fails.

This eliminates per-client feed fan-out — 1,000 concurrent users each polling 25 feed categories would have generated 25,000 edge invocations per poll cycle. With server-side aggregation, they generate exactly 1 (or 0 if the digest is cached).

### Bootstrap Hydration

The dashboard eliminates cold-start latency by pre-fetching 15 commonly needed datasets in a single Redis pipeline call before any panel renders. On page load, the client fires two parallel requests — a **fast tier** and a **slow tier** — to the `/api/bootstrap` edge function, both with an 800ms abort timeout to avoid blocking first paint.

```
Page Load → parallel fetch ─┬─ /api/bootstrap?tier=fast  (s-maxage=600)
                             │    earthquakes, outages, serviceStatuses,
                             │    macroSignals, chokepoints
                             │
                             └─ /api/bootstrap?tier=slow  (s-maxage=3600)
                                  bisPolicy, bisExchange, bisCredit,
                                  minerals, giving, sectors, etfFlows,
                                  shippingRates, wildfires, climateAnomalies
```

The edge function reads all keys in a single Upstash Redis pipeline — one HTTP round-trip for 15 keys. Results are stored in an in-memory `hydrationCache` Map. When panels initialize, they call `getHydratedData(key)` which returns the pre-fetched data and evicts it from the cache (one-time read) to free memory. Panels that find hydrated data skip their initial API call entirely, rendering instantly with pre-loaded content. Panels that mount after the hydration data has been consumed fall back to their normal fetch cycle.

This converts 15 independent API calls (each with its own DNS lookup, TLS handshake, and Redis round-trip) into exactly 2, cutting first-meaningful-paint time by 2–4 seconds on typical connections.

### Desktop Auto-Update

The desktop app checks for new versions by polling `worldmonitor.app/api/version` — once at startup (after a 5-second delay) and then every 6 hours. When a newer version is detected (semver comparison), a non-intrusive update badge appears with a direct link to the GitHub Release page.

Update prompts are dismissable per-version — dismissing v2.5.0 won't suppress v2.6.0 notifications. The updater is variant-aware: a Tech Monitor desktop build links to the Tech Monitor release asset, not the full variant.

The `/api/version` endpoint reads the latest GitHub Release tag and caches the result for 1 hour, so version checks don't hit the GitHub API on every request.

### Theme System

The dashboard supports dark and light themes with a toggle in the header bar. Dark is the default, matching the OSINT/command-center aesthetic.

Theme state is stored in localStorage and applied via a `[data-theme="light"]` attribute on the root element. Critically, the theme is applied before any components mount — an inline script in `index.html` reads the preference and sets the attribute synchronously, preventing a flash of the wrong theme on load.

20+ CSS custom properties are overridden in light mode to maintain contrast ratios: severity colors shift (e.g., `--semantic-high` changes from `#ff8800` to `#ea580c`), backgrounds lighten, and text inverts. Language-specific font stacks switch in `:lang()` selectors — Arabic uses Geeza Pro, Chinese uses PingFang SC.

**Typography** — the dashboard uses a consolidated `--font-mono` CSS custom property that cascades through the entire UI: SF Mono → Monaco → Cascadia Code → Fira Code → DejaVu Sans Mono → Liberation Mono → system monospace. This single variable ensures typographic consistency across macOS (SF Mono/Monaco), Windows (Cascadia Code), and Linux (DejaVu Sans Mono/Liberation Mono). The settings window inherits the same variable, preventing font divergence between the main dashboard and configuration UI.

A `theme-changed` CustomEvent is dispatched on toggle, allowing panels with custom rendering (charts, maps, gauges) to re-render with the new palette.

### Localization Architecture

The dashboard supports 21 languages with a locale system designed to minimize bundle size while maximizing coverage:

**Language bundles** are stored as JSON files (`src/locales/{code}.json`) and lazy-loaded on demand — only the active language is fetched at runtime, keeping the initial JavaScript bundle free of translation strings. The English locale serves as the fallback: if a key is missing from a non-English locale, the English value is displayed automatically. Language detection follows the cascade: `localStorage` preference → `navigator.language` → English.

**Native-language RSS feeds** — 21 locales have dedicated feed sets that match the user's language. When a non-English user loads the dashboard for the first time, a one-time **locale boost** runs: it examines the browser's language, finds feeds tagged with a matching `lang` field, and enables them alongside the default English sources. The boost is non-destructive — it never overwrites manual feed preferences, and it runs exactly once per locale (tracked via `localStorage`). Examples: Korean users get Yonhap and Chosun Ilbo; Greek users get Kathimerini, Naftemporiki, and Proto Thema; Czech users get iDNES and Novinky.

**RTL support** — Arabic and Hebrew locales trigger automatic right-to-left layout via CSS `direction: rtl` on the root element. All panel layouts, text alignment, and scrollbar positions adapt without per-component overrides.

**AI output language** — when the UI language is non-English, the summarization prompt instructs the LLM to generate its output in the user's language. This applies to World Briefs, AI Deductions, and country intelligence briefs.

**Font stacks** — language-specific font families are applied via `:lang()` CSS selectors: Arabic uses Geeza Pro, Chinese uses PingFang SC / Microsoft YaHei, Japanese uses Hiragino Sans, Korean uses Apple SD Gothic Neo / Malgun Gothic. The base monospace font stack (`--font-mono`) provides 6 platform-specific fallbacks for consistent rendering across macOS, Windows, and Linux.

### Privacy & Offline Architecture

Marsd is designed so that sensitive intelligence work can run entirely on local hardware with no data leaving the user's machine. The privacy architecture operates at three levels:

**Level 1 — Full Cloud (Web App)**
All processing happens server-side on Vercel Edge Functions. API keys are stored in Vercel environment variables. News feeds are proxied through domain-allowlisted endpoints. AI summaries use Groq or OpenRouter. This is the default for `worldmonitor.app` — convenient but cloud-dependent.

**Level 2 — Desktop with Cloud APIs (Tauri + Sidecar)**
The desktop app runs a local Node.js sidecar that mirrors all 60+ cloud API handlers. API keys are stored in the OS keychain (macOS Keychain / Windows Credential Manager), never in plaintext files. Requests are processed locally first; cloud is a transparent fallback for missing handlers. Credential management happens through a native settings window with per-key validation.

**Level 3 — Air-Gapped Local (Ollama + Desktop)**
With Ollama or LM Studio configured, AI summarization runs entirely on local hardware. Combined with the desktop sidecar, the core intelligence pipeline (news aggregation, threat classification, instability scoring, AI briefings) operates with zero cloud dependency. The browser-side ML pipeline (Transformers.js) provides NER, sentiment analysis, and fallback summarization without even a local server.

| Capability | Web | Desktop + Cloud Keys | Desktop + Ollama |
|---|:---:|:---:|:---:|
| News aggregation | Cloud proxy | Local sidecar | Local sidecar |
| AI summarization | Groq/OpenRouter | Groq/OpenRouter | Local LLM |
| Threat classification | Cloud LLM + browser ML | Cloud LLM + browser ML | Browser ML only |
| Credential storage | Server env vars | OS keychain | OS keychain |
| Map & static layers | Browser | Browser | Browser |
| Data leaves machine | Yes | Partially | No |

The desktop readiness framework (`desktop-readiness.ts`) catalogs each feature's locality class — `fully-local` (no API required), `api-key` (degrades gracefully without keys), or `cloud-fallback` (proxy available) — enabling clear communication about what works offline.

### Responsive Layout System

The dashboard adapts to four screen categories without JavaScript layout computation — all breakpoints are CSS-only:

| Screen Width     | Layout             | Details                                                                                                                                                                                 |
| ---------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **< 768px**      | Mobile warning     | Modal recommends desktop; limited panel display with touch-optimized map popups                                                                                                         |
| **768px–2000px** | Standard grid      | Vertical stack: map on top, panels in `auto-fill` grid (`minmax(280px, 1fr)`). Panels tile in rows that adapt to available width                                                        |
| **2000px+**      | Ultra-wide L-shape | Map floats left at 60% width, 65vh height. Panels wrap to the right of the map and below it using CSS `display: contents` on the grid container with `float: left` on individual panels |

The ultra-wide layout is notable for its technique: `display: contents` dissolves the `.panels-grid` container so that individual panel elements become direct flow children of `.main-content`. Combined with `float: left` on the map, this creates natural L-shaped content wrapping — panels fill the space to the right of the map, and when they overflow past the map's height, they spread to full width. No JavaScript layout engine is involved.

Panel heights are user-adjustable via drag handles (span-1 through span-4 grid rows), with layout state persisted to localStorage. Double-clicking a drag handle resets the panel to its default height.

### Signal Aggregation

All real-time data sources feed into a central signal aggregator that builds a unified geospatial intelligence picture. Signals are clustered by country and region, with each signal carrying a severity (low/medium/high), geographic coordinates, and metadata. The aggregator:

1. **Clusters by country** — groups signals from diverse sources (flights, vessels, protests, fires, outages, `keyword_spike`) into per-country profiles
2. **Detects regional convergence** — identifies when multiple signal types spike in the same geographic corridor (e.g., military flights + protests + satellite fires in Eastern Mediterranean)
3. **Feeds downstream analysis** — the CII, hotspot escalation, focal point detection, and AI insights modules all consume the aggregated signal picture rather than raw data

### Cross-Stream Correlation Engine

Beyond aggregating signals by geography, the system detects meaningful correlations *across* data streams — identifying patterns that no single source would reveal. 14 signal types are continuously evaluated:

| Signal Type               | Detection Logic                                                                 | Why It Matters                                           |
| ------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `prediction_leads_news`   | Polymarket probability shifts >5% before matching news headlines appear        | Prediction markets as early-warning indicators           |
| `news_leads_markets`      | News velocity spike precedes equity/crypto price move by 15–60 min             | Informational advantage detection                        |
| `silent_divergence`       | Significant market movement with no corresponding news volume                   | Potential insider activity or unreported events           |
| `velocity_spike`          | News cluster sources-per-hour exceeds 6+ from Tier 1–2 outlets                | Breaking story detection                                 |
| `keyword_spike`           | Trending term exceeds 3× its 7-day baseline                                   | Emerging narrative detection                             |
| `convergence`             | 3+ signal types co-locate in same 1°×1° geographic cell                        | Multi-domain crisis indicator                            |
| `triangulation`           | Same entity appears across news + military tracking + market signals           | High-confidence focal point identification               |
| `flow_drop`               | ETF flow estimates reverse direction while price continues                     | Smart money divergence                                   |
| `flow_price_divergence`   | Commodity prices move opposite to shipping flow indicators                     | Supply chain disruption signal                           |
| `geo_convergence`         | Geographic convergence alert from the spatial binning system                   | Regional crisis acceleration                             |
| `explained_market_move`   | Market price change has a matching news cluster with causal keywords           | Attributable market reaction                             |
| `hotspot_escalation`      | Hotspot escalation score exceeds threshold                                     | Conflict zone intensification                            |
| `sector_cascade`          | Multiple companies in same sector move in same direction simultaneously        | Sector-wide event detection                              |
| `military_surge`          | Theater posture assessment detects unusual force concentration                 | Military escalation warning                              |

Each signal carries a severity (low/medium/high), geographic coordinates, a human-readable summary, and the raw data that triggered it. Signals are deduplicated per-type with configurable cooldown windows (30 minutes to 6 hours) to prevent alert fatigue. The correlation output feeds into the AI Insights panel, where the narrative synthesis engine weaves detected correlations into a structured intelligence brief.

### PizzINT Activity Monitor & GDELT Tension Index

The dashboard integrates two complementary geopolitical pulse indicators:

**PizzINT DEFCON scoring** — monitors foot traffic patterns at key military, intelligence, and government locations worldwide via the PizzINT API. Aggregate activity levels across monitored sites are converted into a 5-level DEFCON-style readout:

| Adjusted Activity | DEFCON Level | Label             |
| ----------------- | ------------ | ----------------- |
| ≥ 85%             | 1            | Maximum Activity  |
| 70% – 84%         | 2            | High Activity     |
| 50% – 69%         | 3            | Elevated Activity |
| 25% – 49%         | 4            | Above Normal      |
| < 25%             | 5            | Normal Activity   |

Activity spikes at individual locations boost the aggregate score (+10 per spike, capped at 100). Data freshness is tracked per-location — the system distinguishes between stale readings (location sensor lag) and genuine low activity. Per-location detail includes current popularity percentage, spike magnitude, and open/closed status.

**GDELT bilateral tension pairs** — six strategic country pairs (USA↔Russia, Russia↔Ukraine, USA↔China, China↔Taiwan, USA↔Iran, USA↔Venezuela) are tracked via GDELT's GPR (Goldstein Political Relations) batch API. Each pair shows a current tension score, a percentage change from the previous data point, and a trend direction (rising/stable/falling, with ±5% thresholds). Rising bilateral tension scores that coincide with military signal spikes in the same region feed into the focal point detection algorithm.

### Data Freshness & Intelligence Gaps

A singleton tracker monitors 28+ data sources (GDELT, RSS, AIS, military flights, earthquakes, weather, outages, ACLED, Polymarket, economic indicators, NASA FIRMS, cyber threat feeds, trending keywords, oil/energy, population exposure, BIS central bank data, WTO trade policy, Telegram OSINT, OREF rocket alerts, GPS/GNSS jamming, government travel advisories, airport delays/NOTAMs, and more) with status categorization: fresh (<15 min), stale (1h), very_stale (6h), no_data, error, disabled. It explicitly reports **intelligence gaps** — what analysts can't see — preventing false confidence when critical data sources are down or degraded.

### Prediction Markets as Leading Indicators

Polymarket geopolitical markets are queried using tag-based filters (Ukraine, Iran, China, Taiwan, etc.) with 5-minute caching. Market probability shifts are correlated with news volume: if a prediction market moves significantly before matching news arrives, this is flagged as a potential early-warning signal.

**Cloudflare JA3 bypass** — Polymarket's API is protected by Cloudflare TLS fingerprinting (JA3) that blocks all server-side requests. The system uses a 3-tier fallback:

| Tier  | Method                     | When It Works                                           |
| ----- | -------------------------- | ------------------------------------------------------- |
| **1** | Browser-direct fetch       | Always (browser TLS passes Cloudflare)                  |
| **2** | Tauri native TLS (reqwest) | Desktop app (Rust TLS fingerprint differs from Node.js) |
| **3** | Vercel edge proxy          | Rarely (edge runtime sometimes passes)                  |

Once browser-direct succeeds, the system caches this state and skips fallback tiers on subsequent requests. Country-specific markets are fetched by mapping countries to Polymarket tags with name-variant matching (e.g., "Russia" matches titles containing "Russian", "Moscow", "Kremlin", "Putin").

Markets are filtered to exclude sports and entertainment (100+ exclusion keywords), require meaningful price divergence from 50% or volume above $50K, and are ranked by trading volume. Each variant gets different tag sets — geopolitical focus queries politics/world/ukraine/middle-east tags, while tech focus queries ai/crypto/business tags.

### Macro Signal Analysis (Market Radar)

The Market Radar panel computes a composite BUY/CASH verdict from 7 independent signals sourced entirely from free APIs (Yahoo Finance, mempool.space, alternative.me):

| Signal              | Computation                           | Bullish When                |
| ------------------- | ------------------------------------- | --------------------------- |
| **Liquidity**       | JPY/USD 30-day rate of change         | ROC > -2% (no yen squeeze)  |
| **Flow Structure**  | BTC 5-day return vs QQQ 5-day return  | Gap < 5% (aligned)          |
| **Macro Regime**    | QQQ 20-day ROC vs XLP 20-day ROC      | QQQ outperforming (risk-on) |
| **Technical Trend** | BTC vs SMA50 + 30-day VWAP            | Above both (bullish)        |
| **Hash Rate**       | Bitcoin mining hashrate 30-day change | Growing > 3%                |
| **Mining Cost**     | BTC price vs hashrate-implied cost    | Price > $60K (profitable)   |
| **Fear & Greed**    | alternative.me sentiment index        | Value > 50                  |

The overall verdict requires ≥57% of known signals to be bullish (BUY), otherwise CASH. Signals with unknown data are excluded from the denominator.

**VWAP Calculation** — Volume-Weighted Average Price is computed from aligned price/volume pairs over a 30-day window. Pairs where either price or volume is null are excluded together to prevent index misalignment:

```
VWAP = Σ(price × volume) / Σ(volume)    for last 30 trading days
```

The **Mayer Multiple** (BTC price / SMA200) provides a long-term valuation context — historically, values above 2.4 indicate overheating, while values below 0.8 suggest deep undervaluation.

### Gulf FDI Investment Database

The Finance variant includes a curated database of 64 major foreign direct investments by Saudi Arabia and the UAE in global critical infrastructure. Investments are tracked across 12 sectors:

| Sector            | Examples                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------- |
| **Ports**         | DP World's 11 global container terminals, AD Ports (Khalifa, Al-Sokhna, Karachi), Saudi Mawani ports |
| **Energy**        | ADNOC Ruwais LNG (9.6 mtpa), Aramco's Motiva Port Arthur refinery (630K bpd), ACWA Power renewables  |
| **Manufacturing** | Mubadala's GlobalFoundries (82% stake, 3rd-largest chip foundry), Borealis (75%), SABIC (70%)        |
| **Renewables**    | Masdar wind/solar (UK Hornsea, Zarafshan 500MW, Gulf of Suez), NEOM Green Hydrogen (world's largest) |
| **Megaprojects**  | NEOM THE LINE ($500B), Saudi National Cloud ($6B hyperscale datacenters)                             |
| **Telecoms**      | STC's 9.9% stake in Telefónica, PIF's 20% of Telecom Italia NetCo                                    |

Each investment records the investing entity (DP World, Mubadala, PIF, ADNOC, Masdar, Saudi Aramco, ACWA Power, etc.), target country, geographic coordinates, investment amount (USD), ownership stake, operational status, and year. The Investments Panel provides filterable views by country (SA/UAE), sector, entity, and status — clicking any row navigates the map to the investment location.

On the globe, investments appear as scaled bubbles: ≥$50B projects (NEOM) render at maximum size, while sub-$1B investments use smaller markers. Color encodes status: green for operational, amber for under-construction, blue for announced.

### Stablecoin Peg Monitoring

Five major stablecoins (USDT, USDC, DAI, FDUSD, USDe) are monitored via the CoinGecko API with 2-minute caching. Each coin's deviation from the $1.00 peg determines its health status:

| Deviation   | Status       | Indicator |
| ----------- | ------------ | --------- |
| ≤ 0.5%      | ON PEG       | Green     |
| 0.5% – 1.0% | SLIGHT DEPEG | Yellow    |
| > 1.0%      | DEPEGGED     | Red       |

The panel aggregates total stablecoin market cap, 24h volume, and an overall health status (HEALTHY / CAUTION / WARNING). The `coins` query parameter accepts a comma-separated list of CoinGecko IDs, validated against a `[a-z0-9-]+` regex to prevent injection.

### Oil & Energy Analytics

The Oil & Energy panel tracks four key indicators from the U.S. Energy Information Administration (EIA) API:

| Indicator         | Series                    | Update Cadence |
| ----------------- | ------------------------- | -------------- |
| **WTI Crude**     | Spot price ($/bbl)        | Weekly         |
| **Brent Crude**   | Spot price ($/bbl)        | Weekly         |
| **US Production** | Crude oil output (Mbbl/d) | Weekly         |
| **US Inventory**  | Commercial crude stocks   | Weekly         |

Trend detection flags week-over-week changes exceeding ±0.5% as rising or falling, with flat readings within the threshold shown as stable. Results are cached client-side for 30 minutes. The panel provides energy market context for geopolitical analysis — price spikes often correlate with supply disruptions in monitored conflict zones and chokepoint closures.

### BIS Central Bank Data

The Economic panel integrates data from the Bank for International Settlements (BIS), the central bank of central banks, providing three complementary datasets:

| Dataset | Description | Use Case |
| --- | --- | --- |
| **Policy Rates** | Current central bank policy rates across major economies | Monetary policy stance comparison — tight vs. accommodative |
| **Real Effective Exchange Rates** | Trade-weighted currency indices adjusted for inflation (REER) | Currency competitiveness — rising REER = strengthening, falling = weakening |
| **Credit-to-GDP** | Total credit to the non-financial sector as percentage of GDP | Credit bubble detection — high ratios signal overleveraged economies |

Data is fetched through three dedicated BIS RPCs (`GetBisPolicyRates`, `GetBisExchangeRates`, `GetBisCredit`) in the `economic/v1` proto service. Each dataset uses independent circuit breakers with 30-minute cache TTLs. The panel renders policy rates as a sorted table with spark bars, exchange rates with directional trend indicators, and credit-to-GDP as a ranked list. BIS data freshness is tracked in the intelligence gap system — staleness or failures surface as explicit warnings rather than silent gaps.

### WTO Trade Policy Intelligence

The Trade Policy panel provides real-time visibility into global trade restrictions, tariffs, and barriers — critical for tracking economic warfare, sanctions impact, and supply chain disruption risk. Four data views are available:

| Tab | Data Source | Content |
| --- | --- | --- |
| **Restrictions** | WTO trade monitoring | Active trade restrictions with imposing/affected countries, product categories, and enforcement dates |
| **Tariffs** | WTO tariff database | Tariff rate trends between country pairs (e.g., US↔China) with historical datapoints |
| **Flows** | WTO trade statistics | Bilateral trade flow volumes with year-over-year change indicators |
| **Barriers** | WTO SPS/TBT notifications | Sanitary, phytosanitary, and technical barriers to trade with status tracking |

The `trade/v1` proto service defines four RPCs, each with its own circuit breaker (30-minute cache TTL) and `upstreamUnavailable` signaling for graceful degradation when WTO endpoints are temporarily unreachable. The panel is available on FULL and FINANCE variants. Trade policy data feeds into the data freshness tracker as `wto_trade`, with intelligence gap warnings when the WTO feed goes stale.

### Supply Chain Disruption Intelligence

The Supply Chain panel provides real-time visibility into global logistics risk across three complementary dimensions — strategic chokepoint health, shipping cost trends, and critical mineral concentration — enabling early detection of disruptions that cascade into economic and geopolitical consequences.

**Chokepoints tab** — monitors 6 strategic maritime bottlenecks (Suez Canal, Strait of Malacca, Strait of Hormuz, Bab el-Mandeb, Panama Canal, Taiwan Strait) by cross-referencing live navigational warnings with AIS vessel disruption data. Each chokepoint receives a disruption score (0–100) computed from a three-component formula: baseline threat level (war zone / critical / high / elevated / normal), active warning count (capped contribution), and AIS congestion severity — mapped to color-coded status indicators (green/yellow/red). Chokepoint identification uses text-evidence matching (keyword scoring with primary and area terms) before falling back to geographic proximity, preventing misclassification of events that mention one chokepoint but are geographically closer to another. Data is cached with a 5-minute TTL for near-real-time awareness.

**Shipping Rates tab** — tracks two Federal Reserve Economic Data (FRED) series: the Deep Sea Freight Producer Price Index (`PCU483111483111`) and the Freight Transportation Services Index (`TSIFRGHT`). Statistical spike detection flags abnormal price movements against recent history. Inline SVG sparklines render 24 months of rate history at a glance. Cached for 1 hour to reflect the weekly release cadence of underlying data.

**Critical Minerals tab** — applies the **Herfindahl-Hirschman Index (HHI)** to 2024 global production data for minerals critical to technology and defense manufacturing — lithium, cobalt, rare earths, gallium, germanium, and others. The HHI quantifies supply concentration risk: a market dominated by a single producer scores near 10,000, while a perfectly distributed market scores near 0. Each mineral displays the top 3 producing countries with market share percentages, flagging single-country dependencies that represent strategic vulnerability (e.g., China's dominance in rare earth processing). This tab uses static production data, cached for 24 hours with no external API dependency.

The panel is available on the FULL (Marsd) variant and integrates with the infrastructure cascade model — when a chokepoint disruption coincides with high mineral concentration risk for affected trade routes, the combined signal feeds into convergence detection.

### BTC ETF Flow Estimation

Ten spot Bitcoin ETFs are tracked via Yahoo Finance's 5-day chart API (IBIT, FBTC, ARKB, BITB, GBTC, HODL, BRRR, EZBC, BTCO, BTCW). Since ETF flow data requires expensive terminal subscriptions, the system estimates flow direction from publicly available signals:

- **Price change** — daily close vs. previous close determines direction
- **Volume ratio** — current volume / trailing average volume measures conviction
- **Flow magnitude** — `volume × price × direction × 0.1` provides a rough dollar estimate

This is an approximation, not a substitute for official flow data, but it captures the direction and relative magnitude correctly. Results are cached for 15 minutes.

---

## Multi-Variant Architecture

A single codebase produces five specialized dashboards, each with distinct feeds, panels, map layers, and branding:

| Aspect                | Marsd                                        | Tech Monitor                                    | Finance Monitor                                  | Happy Monitor                                         |
| --------------------- | ---------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------- |
| **Domain**            | worldmonitor.app                                     | tech.worldmonitor.app                           | finance.worldmonitor.app                         | happy.worldmonitor.app                                |
| **Focus**             | Geopolitics, military, conflicts                     | AI/ML, startups, cybersecurity                  | Markets, trading, central banks                  | Good news, conservation, human progress               |
| **RSS Feeds**         | 15 categories, 200+ feeds (politics, MENA, Africa, think tanks) | 21 categories, 152 feeds (AI, VC blogs, startups, GitHub) | 14 categories, 55 feeds (forex, bonds, commodities, IPOs) | 5 categories, 21 positive-news sources (GNN, Positive.News, Upworthy) |
| **Panels**            | 45 (strategic posture, CII, cascade, trade policy, airline intel, predictions) | 28 (AI labs, unicorns, accelerators, tech readiness) | 27 (forex, bonds, derivatives, trade policy, gulf economies) | 10 (good news, breakthroughs, conservation, renewables, giving) |
| **Unique Map Layers** | Military bases, nuclear facilities, hotspots         | Tech HQs, cloud regions, startup hubs           | Stock exchanges, central banks, Gulf investments | Positive events, kindness, species recovery, renewables |
| **Desktop App**       | Marsd.app / .exe / .AppImage                 | Tech Monitor.app / .exe / .AppImage             | Finance Monitor.app / .exe / .AppImage           | (web-only)                                            |

Single-deployment consolidation — all five variants serve from one Vercel deployment, determined by hostname. Build-time `VITE_VARIANT` tree-shakes unused data. Runtime variant selector in the header bar.

---

## Programmatic API Access

Every data endpoint is accessible programmatically via `api.worldmonitor.app`. The API uses the same edge functions that power the dashboard, with the same caching and rate limiting:

```bash
# Fetch market quotes
curl -s 'https://api.worldmonitor.app/api/market/v1/list-market-quotes?symbols=AAPL,MSFT,GOOGL'

# Get airport delays
curl -s 'https://api.worldmonitor.app/api/aviation/v1/list-airport-delays'

# Fetch climate anomalies
curl -s 'https://api.worldmonitor.app/api/climate/v1/list-climate-anomalies'

# Get earthquake data
curl -s 'https://api.worldmonitor.app/api/seismology/v1/list-earthquakes'

# Company enrichment (GitHub, SEC filings, HN mentions)
curl -s 'https://api.worldmonitor.app/api/enrichment/company?domain=stripe.com'

# Company signal discovery (funding, hiring, exec changes)
curl -s 'https://api.worldmonitor.app/api/enrichment/signals?company=Stripe&domain=stripe.com'
```

All 22 service domains are available as REST endpoints following the pattern `POST /api/{domain}/v1/{rpc-name}`. GET requests with query parameters are supported for read-only RPCs. Responses include `X-Cache` headers (`HIT`, `REDIS-HIT`, `MISS`) for cache debugging and `Cache-Control` headers for CDN integration.

> **Note**: Use `api.worldmonitor.app`, not `worldmonitor.app` — the main domain requires browser origin headers and returns 403 for programmatic access.

---

## Edge Function Architecture

Marsd uses 60+ Vercel Edge Functions as a lightweight API layer, split into two generations. Legacy endpoints in `api/*.js` each handle a single data source concern — proxying, caching, or transforming external APIs. The newer proto-first endpoints route through a single edge gateway (`api/[domain]/v1/[rpc].ts`) that dispatches to typed handler implementations generated from Protocol Buffer definitions (see [Proto-First API Contracts](#proto-first-api-contracts)). Both generations coexist, with new features built proto-first. This architecture avoids a monolithic backend while keeping API keys server-side:

- **RSS Proxy** — domain-allowlisted proxy for 170+ feeds, preventing CORS issues and hiding origin servers. Feeds from domains that block Vercel IPs are automatically routed through the Railway relay.
- **AI Pipeline** — Groq and OpenRouter edge functions with Redis deduplication, so identical headlines across concurrent users only trigger one LLM call. The classify-event endpoint pauses its queue on 500 errors to avoid wasting API quota.
- **Data Adapters** — GDELT, ACLED, OpenSky, USGS, NASA FIRMS, FRED, Yahoo Finance, CoinGecko, mempool.space, BIS, WTO, and others each have dedicated edge functions that normalize responses into consistent schemas
- **Market Intelligence** — macro signals, ETF flows, and stablecoin monitors compute derived analytics server-side (VWAP, SMA, peg deviation, flow estimates) and cache results in Redis
- **Temporal Baseline** — Welford's algorithm state is persisted in Redis across requests, building statistical baselines without a traditional database
- **Custom Scrapers** — sources without RSS feeds (FwdStart, GitHub Trending, tech events) are scraped and transformed into RSS-compatible formats
- **Finance Geo Data** — stock exchanges (92), financial centers (19), central banks (13), and commodity hubs (10) are served as static typed datasets with market caps, GFCI rankings, trading hours, and commodity specializations
- **BIS Integration** — policy rates, real effective exchange rates, and credit-to-GDP ratios from the Bank for International Settlements, cached with 30-minute TTL
- **WTO Trade Policy** — trade restrictions, tariff trends, bilateral trade flows, and SPS/TBT barriers from the World Trade Organization
- **Supply Chain Intelligence** — maritime chokepoint disruption scores (cross-referencing NGA warnings + AIS data), FRED shipping freight indices with spike detection, and critical mineral supply concentration via Herfindahl-Hirschman Index analysis
- **Company Enrichment** — `/api/enrichment/company` aggregates GitHub organization data, inferred tech stack (derived from repository language distributions weighted by star count), SEC EDGAR public filings (10-K, 10-Q, 8-K), and Hacker News mentions into a single response. `/api/enrichment/signals` surfaces real-time company activity signals — funding events, hiring surges, executive changes, and expansion announcements — sourced from Hacker News and GitHub, each classified by signal type and scored for strength based on engagement, comment volume, and recency

All edge functions include circuit breaker logic and return cached stale data when upstream APIs are unavailable, ensuring the dashboard never shows blank panels.

---

## Multi-Platform Architecture

All four variants run on three platforms that work together:

```
┌─────────────────────────────────────┐
│          Vercel (Edge)              │
│  60+ edge functions · static SPA    │
│  Proto gateway (22 typed services)  │
│  CORS allowlist · Redis cache       │
│  AI pipeline · market analytics     │
│  CDN caching (s-maxage) · PWA host  │
└──────────┬─────────────┬────────────┘
           │             │ fallback
           │             ▼
           │  ┌───────────────────────────────────┐
           │  │     Tauri Desktop (Rust + Node)   │
           │  │  OS keychain · Token-auth sidecar │
           │  │  60+ local API handlers · br/gzip    │
           │  │  Cloud fallback · Traffic logging │
           │  └───────────────────────────────────┘
           │
           │ https:// (server-side)
           │ wss://   (client-side)
           ▼
┌──────────────────────────────────────────┐
│        Railway (Relay Server)            │
│  AIS WebSocket · OpenSky OAuth2          │
│  Telegram MTProto (26 OSINT channels)    │
│  OREF rocket alerts (residential proxy)  │
│  Polymarket proxy (queue backpressure)   │
│  ICAO NOTAM · RSS proxy · gzip all resp │
└──────────────────────────────────────────┘
```

**Why two platforms?** Several upstream APIs (OpenSky Network, CNN RSS, UN News, CISA, IAEA) actively block requests from Vercel's IP ranges, and some require persistent connections or protocols that edge functions cannot support. The Railway relay server acts as an alternate origin, handling:

- **AIS vessel tracking** — maintains a persistent WebSocket connection to AISStream.io and multiplexes it to all connected browser clients, avoiding per-user connection limits
- **OpenSky aircraft data** — authenticates via OAuth2 client credentials flow (Vercel IPs get 403'd by OpenSky without auth tokens)
- **Telegram intelligence** — a GramJS MTProto client polls 26 OSINT channels on a 60-second cycle with per-channel timeouts and FLOOD_WAIT handling
- **OREF rocket alerts** — polls Israel's Home Front Command alert system via `curl` through a residential proxy (Akamai WAF blocks datacenter TLS fingerprints)
- **Polymarket proxy** — fetches from Gamma API with concurrent upstream limiting (max 3 simultaneous, queue backpressure at 20), in-flight deduplication, and 10-minute caching to prevent stampedes from 11 parallel tag queries
- **ICAO NOTAM proxy** — routes NOTAM closure queries through the relay for MENA airports, bypassing Vercel IP restrictions on ICAO's API
- **GDELT positive events** — a 15-minute cron fetches three thematic GDELT GEO API queries (breakthroughs/renewables, conservation/humanitarian, volunteer/charity), deduplicates by event name, validates coordinates, classifies by category, and writes to Redis with a 45-minute TTL. This replaced direct Vercel Edge Function calls that failed on 99.9% of invocations due to GDELT's ~31-second sequential response time exceeding the 25-second edge timeout. Bootstrap hydration is registered so the Happy variant has data on first render
- **RSS feeds** — proxies feeds from domains that block Vercel IPs, with a separate domain allowlist for security. Supports conditional GET (ETag/If-Modified-Since) to reduce bandwidth for unchanged feeds

The Vercel edge functions connect to Railway via `WS_RELAY_URL` (server-side, HTTPS) while browser clients connect via `VITE_WS_RELAY_URL` (client-side, WSS). This separation keeps the relay URL configurable per deployment without leaking server-side configuration to the browser.

All Railway relay responses are gzip-compressed (zlib `gzipSync`) when the client accepts it and the payload exceeds 1KB, reducing egress by ~80% for JSON and XML responses. The desktop local sidecar now prefers Brotli (`br`) and falls back to gzip for payloads larger than 1KB, setting `Content-Encoding` and `Vary: Accept-Encoding` automatically.

---

## Desktop Application Architecture

The Tauri desktop app wraps the dashboard in a native window (macOS, Windows, Linux) with a local Node.js sidecar that runs all API handlers without cloud dependency:

```
┌─────────────────────────────────────────────────┐
│              Tauri (Rust)                       │
│  Window management · Consolidated keychain vault│
│  Token generation · Log management · Menu bar   │
│  Polymarket native TLS bridge                   │
└─────────────────────┬───────────────────────────┘
                      │ spawn + env vars
                      ▼
┌─────────────────────────────────────────────────┐
│      Node.js Sidecar (dynamic port)             │
│  60+ API handlers · Local RSS proxy             │
│  Brotli/Gzip compression · Cloud fallback       │
│  Traffic logging · Verbose debug mode           │
└─────────────────────┬───────────────────────────┘
                      │ fetch (on local failure)
                      ▼
┌─────────────────────────────────────────────────┐
│         Cloud (worldmonitor.app)                │
│  Transparent fallback when local handlers fail  │
└─────────────────────────────────────────────────┘
```

### Secret Management

API keys are stored in the operating system's credential manager (macOS Keychain, Windows Credential Manager) — never in plaintext config files. All secrets are consolidated into a single JSON vault entry in the keychain, so app startup requires exactly one OS authorization prompt regardless of how many keys are configured.

At sidecar launch, the vault is read, parsed, and injected as environment variables. Empty or whitespace-only values are skipped. Secrets can also be updated at runtime without restarting the sidecar: saving a key in the Settings window triggers a `POST /api/local-env-update` call that hot-patches `process.env` so handlers pick up the new value immediately.

**Verification pipeline** — when you enter a credential in Settings, the app validates it against the actual provider API (Groq → `/openai/v1/models`, Ollama → `/api/tags`, FRED → GDP test query, NASA FIRMS → fire data fetch, etc.). Network errors (timeouts, DNS failures, unreachable hosts) are treated as soft passes — the key is saved with a "could not verify" notice rather than blocking. Only explicit 401/403 responses from the provider mark a key as invalid. This prevents transient network issues from locking users out of their own credentials.

**Smart re-verification** — when saving settings, the verification pipeline skips keys that haven't been modified since their last successful verification. This prevents unnecessary round-trips to provider APIs when a user changes one key but has 15 others already configured and validated. Only newly entered or modified keys trigger verification requests.

**Desktop-specific requirements** — some features require fewer credentials on desktop than on the web. For example, AIS vessel tracking on the web requires both a relay URL and an API key, but the desktop sidecar handles relay connections internally, so only the API key is needed. The settings panel adapts its required-fields display based on the detected platform.

### Sidecar Authentication

A unique 32-character hex token is generated per app launch using randomized hash state (`RandomState` from Rust's standard library). The token is:

1. Injected into the sidecar as `LOCAL_API_TOKEN`
2. Retrieved by the frontend via the `get_local_api_token` Tauri command (lazy-loaded on first API request)
3. Attached as `Authorization: Bearer <token>` to every local request

The `/api/service-status` health check endpoint is exempt from token validation to support monitoring tools.

### Dynamic Port Allocation

The sidecar defaults to port 46123 but handles `EADDRINUSE` gracefully — if the port is occupied (another Marsd instance, or any other process), the sidecar binds to port 0 and lets the OS assign an available ephemeral port. The actual bound port is written to a port file (`sidecar.port` in the logs directory) that the Rust host polls on startup (100ms intervals, 5-second timeout). The frontend discovers the port at runtime via the `get_local_api_port` IPC command, and `getApiBaseUrl()` in `runtime.ts` is the canonical accessor — hardcoding port 46123 in frontend code is prohibited. The CSP `connect-src` directive uses `http://127.0.0.1:*` to accommodate any port.

### Local RSS Proxy

The sidecar includes a built-in RSS proxy handler that fetches news feeds directly from source domains, bypassing the cloud RSS proxy entirely. This means the desktop app can load all 170+ RSS feeds without any cloud dependency — the same domain allowlist used by the Vercel edge proxy is enforced locally. Combined with the local API handlers, this enables the desktop app to operate as a fully self-contained intelligence aggregation platform.

### Sidecar Resilience

The sidecar employs multiple resilience patterns to maintain data availability when upstream APIs degrade:

- **Stale-on-error** — when an upstream API returns a 5xx error or times out, the sidecar serves the last successful response from its in-memory cache rather than propagating the failure. Panels display stale data with a visual "retrying" indicator rather than going blank
- **Negative caching** — after an upstream failure, the sidecar records a 5-minute negative cache entry to prevent immediately re-hitting the same broken endpoint. Subsequent requests during the cooldown receive the stale response instantly
- **Staggered requests** — APIs with strict rate limits (Yahoo Finance) use sequential request batching with 150ms inter-request delays instead of `Promise.all`. This transforms 10 concurrent requests that would trigger HTTP 429 into a staggered sequence that stays under rate limits
- **In-flight deduplication** — concurrent requests for the same resource (e.g., multiple panels polling the same endpoint) are collapsed into a single upstream fetch. The first request creates a Promise stored in an in-flight map; all concurrent requests await that single Promise
- **Panel retry indicator** — when a panel's data fetch fails and retries, the Panel base class displays a non-intrusive "Retrying..." indicator so users understand the dashboard is self-healing rather than broken

### Cloud Fallback

When a local API handler is missing, throws an error, or returns a 5xx status, the sidecar transparently proxies the request to the cloud deployment. Endpoints that fail are marked as `cloudPreferred` — subsequent requests skip the local handler and go directly to the cloud until the sidecar is restarted. Origin and Referer headers are stripped before proxying to maintain server-to-server parity.

### Observability

- **Traffic log** — a ring buffer of the last 200 requests with method, path, status, and duration (ms), accessible via `GET /api/local-traffic-log`
- **Verbose mode** — togglable via `POST /api/local-debug-toggle`, persists across sidecar restarts in `verbose-mode.json`
- **Dual log files** — `desktop.log` captures Rust-side events (startup, secret injection counts, menu actions), while `local-api.log` captures Node.js stdout/stderr
- **IPv4-forced fetch** — the sidecar patches `globalThis.fetch` to force IPv4 for all outbound requests. Government APIs (NASA FIRMS, EIA, FRED) publish AAAA DNS records but their IPv6 endpoints frequently timeout. The patch uses `node:https` with `family: 4` to bypass Happy Eyeballs and avoid cascading ETIMEDOUT failures
- **DevTools** — `Cmd+Alt+I` toggles the embedded web inspector

---

## Bandwidth Optimization

The system minimizes egress costs through layered caching and compression across all three deployment targets:

### Vercel CDN Headers

Every API edge function includes `Cache-Control` headers that enable Vercel's CDN to serve cached responses without hitting the origin:

| Data Type              | `s-maxage`   | `stale-while-revalidate` | Rationale                        |
| ---------------------- | ------------ | ------------------------ | -------------------------------- |
| Classification results | 3600s (1h)   | 600s (10min)             | Headlines don't reclassify often |
| Country intelligence   | 3600s (1h)   | 600s (10min)             | Briefs change slowly             |
| Risk scores            | 300s (5min)  | 60s (1min)               | Near real-time, low latency      |
| Market data            | 3600s (1h)   | 600s (10min)             | Intraday granularity sufficient  |
| Fire detection         | 600s (10min) | 120s (2min)              | VIIRS updates every ~12 hours    |
| Economic indicators    | 3600s (1h)   | 600s (10min)             | Monthly/quarterly releases       |

Static assets use content-hash filenames with 1-year immutable cache headers. The service worker file (`sw.js`) is never cached (`max-age=0, must-revalidate`) to ensure update detection.

### Client-Side Circuit Breakers

Every data-fetching panel uses a circuit breaker that prevents cascading failures from bringing down the entire dashboard. The pattern works at two levels:

**Per-feed circuit breakers** (RSS) — each RSS feed URL has an independent failure counter. After 2 consecutive failures, the feed enters a 5-minute cooldown during which no fetch attempts are made. The feed automatically re-enters the pool after the cooldown expires. This prevents a single misconfigured or downed feed from consuming fetch budget and slowing the entire news refresh cycle.

**Per-panel circuit breakers** (data panels) — panels that fetch from API endpoints use IndexedDB-backed persistent caches (`worldmonitor_persistent_cache` store) with TTL envelopes. When a fetch succeeds, the result is stored with an expiration timestamp. On subsequent loads, the circuit breaker serves the cached result immediately and attempts a background refresh. If the background refresh fails, the stale cached data continues to display — panels never go blank due to transient API failures. Cache entries survive page reloads and browser restarts.

The circuit breaker degrades gracefully across storage tiers: IndexedDB (primary, up to device quota) → localStorage fallback (5MB limit) → in-memory Map (session-only). When device storage quota is exhausted (common on mobile Safari), a global `_storageQuotaExceeded` flag disables all further writes while reads continue normally.

### Brotli Pre-Compression (Build-Time)

`vite build` now emits pre-compressed Brotli artifacts (`*.br`) for static assets larger than 1KB (JS, CSS, HTML, SVG, JSON, XML, TXT, WASM). This reduces transfer size by roughly 20–30% vs gzip-only delivery when the edge can serve Brotli directly.

For the Hetzner Nginx origin, enable static compressed file serving so `dist/*.br` files are returned without runtime recompression:

```nginx
gzip on;
gzip_static on;

brotli on;
brotli_static on;
```

Cloudflare will negotiate Brotli automatically for compatible clients when the origin/edge has Brotli assets available.

### Railway Relay Compression

All relay server responses pass through `gzipSync` when the client accepts gzip and the payload exceeds 1KB. Sidecar API responses prefer Brotli and use gzip fallback with proper `Content-Encoding`/`Vary` headers for the same threshold. This applies to OpenSky aircraft JSON, RSS XML feeds, UCDP event data, AIS snapshots, and health checks — reducing wire size by approximately 50–80%.

### In-Flight Request Deduplication

When multiple connected clients poll simultaneously (common with the relay's multi-tenant WebSocket architecture), identical upstream requests are deduplicated at the relay level. The first request for a given resource key (e.g., an RSS feed URL or OpenSky bounding box) creates a Promise stored in an in-flight Map. All concurrent requests for the same key await that single Promise rather than stampeding the upstream API. Subsequent requests are served from cache with an `X-Cache: DEDUP` header. This prevents scenarios like 53 concurrent RSS cache misses or 5 simultaneous OpenSky requests for the same geographic region — all resolved by a single upstream fetch.

### Adaptive Refresh Scheduling

Rather than polling at fixed intervals, the dashboard uses an adaptive refresh scheduler that responds to network conditions, tab visibility, and data freshness:

- **Exponential backoff on failure** — when a refresh fails or returns no new data, the next poll interval doubles, up to a maximum of 4× the base interval. A successful fetch with new data resets the multiplier to 1×
- **Hidden-tab throttle** — when `document.visibilityState` is `hidden`, all poll intervals are multiplied by 10×. A tab polling every 60 seconds in the foreground slows to every 10 minutes in the background, dramatically reducing wasted requests from inactive tabs
- **Jitter** — each computed interval is randomized by ±10% to prevent synchronized API storms when multiple tabs or users share the same server. Without jitter, two tabs opened at the same time would poll in lockstep indefinitely
- **Stale flush on visibility restore** — when a hidden tab becomes visible, the scheduler identifies all refresh tasks whose data is older than their base interval and re-runs them immediately, staggered 150ms apart to avoid a request burst. This ensures users returning to a background tab see fresh data within seconds
- **In-flight deduplication** — concurrent calls to the same named refresh are collapsed; only one is allowed in-flight at a time
- **Conditional registration** — refresh tasks can include a `condition` function that is evaluated before each poll; tasks whose conditions are no longer met (e.g., a panel that has been collapsed) skip their fetch cycle entirely

### Frontend Polling Intervals

Panels refresh at staggered intervals to avoid synchronized API storms:

| Panel                              | Interval    | Rationale                      |
| ---------------------------------- | ----------- | ------------------------------ |
| AIS maritime snapshot              | 10s         | Real-time vessel positions     |
| Service status                     | 60s         | Health check cadence           |
| Market signals / ETF / Stablecoins | 180s (3min) | Market hours granularity       |
| Risk scores / Theater posture      | 300s (5min) | Composite scores change slowly |

All animations and polling pause when the tab is hidden or after 2 minutes of inactivity, preventing wasted requests from background tabs.

---

## Caching Architecture

Every external API call passes through a three-tier cache with stale-on-error fallback:

```
Request → [1] In-Memory Cache → [2] Redis (Upstash) → [3] Upstream API
                                                             │
            ◄──── stale data served on error ────────────────┘
```

| Tier                | Scope                      | TTL                | Purpose                                       |
| ------------------- | -------------------------- | ------------------ | --------------------------------------------- |
| **In-memory**       | Per edge function instance | Varies (60s–900s)  | Eliminates Redis round-trips for hot paths    |
| **Redis (Upstash)** | Cross-user, cross-instance | Varies (120s–900s) | Deduplicates API calls across all visitors    |
| **Upstream**        | Source of truth            | N/A                | External API (Yahoo Finance, CoinGecko, etc.) |

Cache keys are versioned (`opensky:v2:lamin=...`, `macro-signals:v2:default`) so schema changes don't serve stale formats. Every response includes an `X-Cache` header (`HIT`, `REDIS-HIT`, `MISS`, `REDIS-STALE`, `REDIS-ERROR-FALLBACK`) for debugging.

**Shared caching layer** — all sebuf handler implementations share a unified Upstash Redis caching module (`_upstash-cache.js`) with a consistent API: `getCachedOrFetch(cacheKey, ttlSeconds, fetchFn)`. This eliminates per-handler caching boilerplate and ensures every RPC endpoint benefits from the three-tier strategy. Cache keys include request-varying parameters (e.g., requested symbols, country codes, bounding boxes) to prevent cache contamination across callers with different inputs. On desktop, the same module runs in the sidecar with an in-memory + persistent file backend when Redis is unavailable.

**In-flight promise deduplication** — the `cachedFetchJson` function in `server/_shared/redis.ts` maintains an in-memory `Map<string, Promise>` of active upstream requests. When a cache miss occurs, the first caller's fetch creates and registers a Promise in the map. All concurrent callers for the same cache key await that single Promise rather than independently hitting the upstream API. This eliminates the "thundering herd" problem where multiple edge function instances simultaneously race to refill an expired cache entry — a scenario that previously caused 50+ concurrent upstream requests during the ~15-second refill window for popular endpoints.

**Negative caching** — when an upstream API returns an error, the system caches a sentinel value (`__WM_NEG__`) for 120 seconds rather than leaving the cache empty. This prevents a failure cascade where hundreds of concurrent requests all independently discover the cache is empty and simultaneously hammer the downed API. The negative sentinel is transparent to consumers — `cachedFetchJson` returns `null` for negative-cached keys, and panels fall back to stale data or show an appropriate empty state. Longer negative TTLs are used for specific APIs: UCDP uses 5-minute backoff, Polymarket queue rejections use 30-second backoff.

The AI summarization pipeline adds content-based deduplication: headlines are hashed and checked against Redis before calling Groq, so the same breaking news viewed by 1,000 concurrent users triggers exactly one LLM call.

---

## Security Model

| Layer                          | Mechanism                                                                                                                                                                                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CORS origin allowlist**      | Only `worldmonitor.app`, `tech.worldmonitor.app`, `finance.worldmonitor.app`, and `localhost:*` can call API endpoints. All others receive 403. Implemented in `api/_cors.js`.                                                                     |
| **RSS domain allowlist**       | The RSS proxy only fetches from explicitly listed domains (~90+). Requests for unlisted domains are rejected with 403.                                                                                                                             |
| **Railway domain allowlist**   | The Railway relay has a separate, smaller domain allowlist for feeds that need the alternate origin.                                                                                                                                               |
| **API key isolation**          | All API keys live server-side in Vercel environment variables. The browser never sees Groq, OpenRouter, ACLED, Finnhub, or other credentials.                                                                                                      |
| **Input sanitization**         | User-facing content passes through `escapeHtml()` (prevents XSS) and `sanitizeUrl()` (blocks `javascript:` and `data:` URIs). URLs use `escapeAttr()` for attribute context encoding.                                                              |
| **Query parameter validation** | API endpoints validate input formats (e.g., stablecoin coin IDs must match `[a-z0-9-]+`, bounding box params are numeric).                                                                                                                         |
| **IP rate limiting**           | AI endpoints use Upstash Redis-backed rate limiting to prevent abuse of Groq/OpenRouter quotas.                                                                                                                                                    |
| **Desktop sidecar auth**       | The local API sidecar requires a per-session `Bearer` token generated at launch. The token is stored in Rust state and injected into the sidecar environment — only the Tauri frontend can retrieve it via IPC. Health check endpoints are exempt. |
| **OS keychain storage**        | Desktop API keys are stored in the operating system's credential manager (macOS Keychain, Windows Credential Manager), never in plaintext files or environment variables on disk.                                                                  |
| **SSRF protection**            | Two-phase URL validation: protocol allowlist, private IP rejection, DNS rebinding detection, and TOCTOU-safe address pinning.                                                                                                                     |
| **IPC window hardening**       | All sensitive Tauri IPC commands gate on `require_trusted_window()` with a `TRUSTED_WINDOWS` allowlist.                                                                                                                                            |
| **Bot protection middleware**  | Edge Middleware blocks crawlers from `/api/*` routes. Social preview bots are selectively allowed on `/api/story` and `/api/og-story`.                                                                                                             |

---

## Regression Testing

The test suite includes **30 test files** with **554 individual test cases** across **147 describe blocks**, covering server handlers, caching behavior, data integrity, and map overlays.

**Unit & integration tests** (`npm test`) validate:

| Area | Test Files | Coverage |
| --- | --- | --- |
| **Server handlers** | `server-handlers`, `supply-chain-handlers`, `supply-chain-v2` | All 22 proto service handler imports, route registration, response schemas |
| **Caching** | `redis-caching`, `route-cache-tier`, `flush-stale-refreshes` | Cache key construction, TTL tiers, stale refresh coalescing, stampede prevention |
| **Data integrity** | `bootstrap`, `deploy-config`, `edge-functions` | Bootstrap key sync between `cache-keys.ts` and `bootstrap.js`, all 57 edge function self-containment (no `../server/` imports), version sync across package.json/tauri.conf.json/Cargo.toml |
| **Intelligence** | `military-classification`, `clustering`, `insights-loader`, `summarize-reasoning` | Military confidence scoring, news clustering algorithms, AI brief generation, LLM reasoning chain parsing |
| **Map & geo** | `countries-geojson`, `globe-2d-3d-parity`, `map-locale`, `geo-keyword-matching` | GeoJSON polygon validity, flat/globe layer parity, locale-aware map labels, 217-hub keyword matching |
| **Protocols** | `oref-proxy`, `oref-locations`, `oref-breaking`, `live-news-hls` | OREF alert parsing, 1480 Hebrew→English location translations, HLS stream detection |
| **Circuit breakers** | `hapi-gdelt-circuit-breakers`, `tech-readiness-circuit-breakers`, `smart-poll-loop` | Per-source failure isolation, adaptive backoff, hidden-tab throttling |
| **Data sources** | `gulf-fdi-data`, `ttl-acled-ais-guards`, `urlState` | Gulf FDI coordinate validation, ACLED/AIS TTL guards, URL state encoding/decoding |

**E2E map tests** use Playwright with the map harness (`/tests/map-harness.html`) for overlay behavior validation.

---

## Quick Start

```bash
# Clone and run
git clone https://github.com/MohamedGamil/worldmonitor.git
cd worldmonitor
npm install
vercel dev       # Runs frontend + all 60+ API edge functions
```

Open [http://localhost:3000](http://localhost:3000)

> **Note**: `vercel dev` requires the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`). If you use `npm run dev` instead, only the frontend starts — news feeds and API-dependent panels won't load. See [Self-Hosting](#self-hosting) for details.

### Environment Variables (Optional)

The dashboard works without any API keys — panels for unconfigured services simply won't appear. For full functionality, copy the example file and fill in the keys you need:

```bash
cp .env.example .env.local
```

The `.env.example` file documents every variable with descriptions and registration links, organized by deployment target (Vercel vs Railway). Key groups:

| Group             | Variables                                                                  | Free Tier                                  |
| ----------------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| **AI (Local)**    | `OLLAMA_API_URL`, `OLLAMA_MODEL`                                           | Free (runs on your hardware)               |
| **AI (Cloud)**    | `GROQ_API_KEY`, `OPENROUTER_API_KEY`                                       | 14,400 req/day (Groq), 50/day (OpenRouter) |
| **Cache**         | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                       | 10K commands/day                           |
| **Markets**       | `FINNHUB_API_KEY`, `FRED_API_KEY`, `EIA_API_KEY`                           | All free tier                              |
| **Tracking**      | `WINGBITS_API_KEY`, `AISSTREAM_API_KEY`                                    | Free                                       |
| **Geopolitical**  | `ACLED_ACCESS_TOKEN`, `CLOUDFLARE_API_TOKEN`, `NASA_FIRMS_API_KEY`         | Free for researchers                       |
| **Relay**         | `WS_RELAY_URL`, `VITE_WS_RELAY_URL`, `OPENSKY_CLIENT_ID/SECRET`            | Self-hosted                                |
| **UI**            | `VITE_VARIANT`, `VITE_MAP_INTERACTION_MODE` (`flat` or `3d`, default `3d`) | N/A                                        |
| **Observability** | `VITE_SENTRY_DSN` (optional, empty disables reporting)                     | N/A                                        |

See [`.env.example`](./.env.example) for the complete list with registration links.

---

## Self-Hosting

Marsd relies on **60+ Vercel Edge Functions** in the `api/` directory for RSS proxying, data caching, and API key isolation. Running `npm run dev` alone starts only the Vite frontend — the edge functions won't execute, and most panels (news feeds, markets, AI summaries) will be empty.

### Option 1: Deploy to Vercel (Recommended)

The simplest path — Vercel runs the edge functions natively on their free tier:

```bash
npm install -g vercel
vercel          # Follow prompts to link/create project
```

Add your API keys in the Vercel dashboard under **Settings → Environment Variables**, then visit your deployment URL. The free Hobby plan supports all 60+ edge functions.

### Option 2: Local Development with Vercel CLI

To run everything locally (frontend + edge functions):

```bash
npm install -g vercel
cp .env.example .env.local   # Add your API keys
vercel dev                   # Starts on http://localhost:3000
```

> **Important**: Use `vercel dev` instead of `npm run dev`. The Vercel CLI emulates the edge runtime locally so all `api/` endpoints work. Plain `npm run dev` only starts Vite and the API layer won't be available.

### Option 3: Static Frontend Only

If you only want the map and client-side features (no news feeds, no AI, no market data):

```bash
npm run dev    # Vite dev server on http://localhost:5173
```

This runs the frontend without the API layer. Panels that require server-side proxying will show "No data available". The interactive map, static data layers (bases, cables, pipelines), and browser-side ML models still work.

### Platform Notes

| Platform               | Status                  | Notes                                                                                                                          |
| ---------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Vercel**             | Full support            | Recommended deployment target                                                                                                  |
| **Linux x86_64**       | Full support            | Works with `vercel dev` for local development. Desktop .AppImage available for x86_64. WebKitGTK rendering uses DMA-BUF with fallback to SHM for GPU compatibility. Font stack includes DejaVu Sans Mono and Liberation Mono for consistent rendering across distros |
| **macOS**              | Works with `vercel dev` | Full local development                                                                                                         |
| **Raspberry Pi / ARM** | Partial                 | `vercel dev` edge runtime emulation may not work on ARM. Use Option 1 (deploy to Vercel) or Option 3 (static frontend) instead |
| **Docker**             | Planned                 | See [Roadmap](#roadmap)                                                                                                        |

### Railway Relay (Optional)

The Railway relay is a multi-protocol gateway that handles data sources requiring persistent connections, residential proxying, or upstream APIs that block Vercel's edge runtime:

```bash
# On Railway, deploy with:
node scripts/ais-relay.cjs
```

| Service                 | Protocol        | Purpose                                                              |
| ----------------------- | --------------- | -------------------------------------------------------------------- |
| **AIS Vessel Tracking** | WebSocket       | Live AIS maritime data with chokepoint detection and density grids   |
| **OpenSky Aircraft**    | REST (polling)  | Military flight tracking across merged query regions                 |
| **Telegram OSINT**      | MTProto (GramJS)| 26 OSINT channels polled on 60s cycle with FLOOD_WAIT handling       |
| **OREF Rocket Alerts**  | curl + proxy    | Israel Home Front Command sirens via residential proxy (Akamai WAF)  |
| **Polymarket Proxy**    | HTTPS           | JA3 fingerprint bypass with request queuing and cache deduplication   |
| **ICAO NOTAM**          | REST            | Airport/airspace closure detection for 46 MENA airports              |

Set `WS_RELAY_URL` (server-side, HTTPS) and `VITE_WS_RELAY_URL` (client-side, WSS) in your environment. Without the relay, AIS, OpenSky, Telegram, and OREF layers won't show live data, but all other features work normally.

---

## Tech Stack

| Category              | Technologies                                                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend**          | Vanilla TypeScript (no framework), Vite, globe.gl + Three.js (3D globe), deck.gl + MapLibre GL (flat map), vite-plugin-pwa (service worker + manifest) |
| **Desktop**           | Tauri 2 (Rust) with Node.js sidecar, OS keychain integration (keyring crate), native TLS (reqwest)                                             |
| **AI/ML**             | Ollama / LM Studio (local, OpenAI-compatible), Groq (Llama 3.1 8B), OpenRouter (fallback), Transformers.js (browser-side T5, NER, embeddings), IndexedDB vector store (5K headline RAG) |
| **Caching**           | Redis (Upstash) — 3-tier cache with in-memory + Redis + upstream, cross-user AI deduplication. Vercel CDN (s-maxage). Service worker (Workbox) |
| **Geopolitical APIs** | OpenSky, GDELT, ACLED, UCDP, HAPI, USGS, GDACS, NASA EONET, NASA FIRMS, Polymarket, Cloudflare Radar, WorldPop, OREF (Israel sirens), gpsjam.org (GPS interference), Telegram MTProto (26 OSINT channels) |
| **Market APIs**       | Yahoo Finance (equities, forex, crypto), CoinGecko (stablecoins), mempool.space (BTC hashrate), alternative.me (Fear & Greed)                  |
| **Threat Intel APIs** | abuse.ch (Feodo Tracker, URLhaus), AlienVault OTX, AbuseIPDB, C2IntelFeeds                                                                     |
| **Economic APIs**     | FRED (Federal Reserve), EIA (Energy), Finnhub (stock quotes)                                                                                   |
| **Localization**      | i18next (21 languages: en, bg, ro, fr, de, es, it, pl, pt, nl, sv, ru, ar, zh, ja, tr, th, vi, cs, el, ko), RTL support, lazy-loaded bundles, native-language feeds for 21 locales with one-time locale boost |
| **API Contracts**     | Protocol Buffers (92 proto files, 22 services), sebuf HTTP annotations, buf CLI (lint + breaking checks), auto-generated TypeScript clients/servers + OpenAPI 3.1.0 docs |
| **Analytics**         | Vercel Analytics (privacy-first, lightweight web vitals and page view tracking)                                                                 |
| **Deployment**        | Vercel Edge Functions (60+ endpoints) + Railway (WebSocket relay + Telegram + OREF + Polymarket proxy + NOTAM) + Tauri (macOS/Windows/Linux) + PWA (installable) |
| **Finance Data**      | 92 stock exchanges, 19 financial centers, 13 central banks, 10 commodity hubs, 64 Gulf FDI investments                                         |
| **Data**              | 435+ RSS feeds across all 4 variants, ADS-B transponders, AIS maritime data, VIIRS satellite imagery, 30+ live video channels (8+ default YouTube + 18+ HLS native), 26 Telegram OSINT channels |

---

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines, including the Sebuf RPC framework workflow, how to add data sources and RSS feeds, and our AI-assisted development policy. The project also maintains a [Code of Conduct](./CODE_OF_CONDUCT.md) and [Security Policy](./SECURITY.md) for responsible vulnerability disclosure.

```bash
# Development
npm run dev          # Full variant (worldmonitor.app)
npm run dev:tech     # Tech variant (tech.worldmonitor.app)
npm run dev:finance    # Finance variant (finance.worldmonitor.app)
npm run dev:commodity  # Commodity variant (commodity.worldmonitor.app)
npm run dev:happy      # Happy variant (happy.worldmonitor.app)

# Production builds
npm run build:full       # Build full variant
npm run build:tech       # Build tech variant
npm run build:finance    # Build finance variant
npm run build:commodity  # Build commodity variant
npm run build:happy      # Build happy variant

# Quality (also runs automatically on PRs via GitHub Actions)
npm run typecheck    # TypeScript type checking (tsc --noEmit)

# Desktop packaging
npm run desktop:package:macos:full      # .app + .dmg (Marsd)
npm run desktop:package:macos:tech      # .app + .dmg (Tech Monitor)
npm run desktop:package:macos:finance   # .app + .dmg (Finance Monitor)
npm run desktop:package:windows:full    # .exe + .msi (Marsd)
npm run desktop:package:windows:tech    # .exe + .msi (Tech Monitor)
npm run desktop:package:windows:finance # .exe + .msi (Finance Monitor)

# Generic packaging runner
npm run desktop:package -- --os macos --variant full

# Signed packaging (same targets, requires signing env vars)
npm run desktop:package:macos:full:sign
npm run desktop:package:windows:full:sign
```

Desktop release details, signing hooks, variant outputs, and clean-machine validation checklist:

- [docs/RELEASE_PACKAGING.md](./docs/RELEASE_PACKAGING.md)

---

## Roadmap

**Completed highlights** — 4 variant dashboards, 60+ edge functions, dual map engine, native desktop app (Tauri), 21 languages, proto-first API contracts, AI summarization + deduction + RAG, 30+ live video streams, Telegram OSINT, OREF rocket alerts, CII scoring, cross-stream correlation, and much more.

**Upcoming:**

- [ ] Mobile-optimized views
- [ ] Push notifications for critical alerts
- [ ] Self-hosted Docker image

See [full roadmap](./docs/DOCUMENTATION.md#roadmap).

---

## Support the Project

If you find Marsd useful:

- **Star this repo** to help others discover it
- **Share** with colleagues interested in OSINT
- **Contribute** code, data sources, or documentation
- **Report issues** to help improve the platform

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)** — see [LICENSE](LICENSE) for the full text.

### What This Means

**You are free to:**

- **Use** — run World Monitor for any purpose, including commercial use
- **Study** — read, audit, and learn from the source code
- **Modify** — adapt, extend, and build upon the code
- **Distribute** — share copies with anyone

**Under these conditions:**

- **Source code disclosure** — if you distribute or modify this software, you **must** make the complete source code available under the same AGPL-3.0 license
- **Network use is distribution** — if you run a modified version as a network service (SaaS, web app, API), you **must** provide the source code to all users who interact with it over the network. This is the key difference from GPL-3.0 — you cannot run a modified version behind a server without sharing the source
- **Same license (copyleft)** — any derivative work must be released under AGPL-3.0. You cannot re-license under a proprietary or more permissive license
- **Attribution** — you must retain all copyright notices, give appropriate credit to the original author, and clearly indicate any changes you made
- **State changes** — modified files must carry prominent notices stating that you changed them, with the date of the change
- **No additional restrictions** — you may not impose any further restrictions on the rights granted by this license (e.g., no DRM, no additional terms)

**In plain terms:**

| Use Case | Allowed? | Condition |
|----------|----------|-----------|
| Personal / internal use | Yes | No conditions |
| Self-hosted deployment | Yes | No conditions if unmodified |
| Forking & modifying | Yes | Must share source under AGPL-3.0 |
| Commercial use | Yes | Must share source under AGPL-3.0 |
| Running as a SaaS/web service | Yes | Must share source under AGPL-3.0 |
| Bundling into a proprietary product | No | AGPL-3.0 copyleft prevents this |

**No warranty** — the software is provided "as is" without warranty of any kind.

Copyright (C) 2024-2026 Elie Habib. All rights reserved under AGPL-3.0.

---

## Author

**Elie Habib** — [GitHub](https://github.com/koala73)

---

## Contributors

Thanks to everyone who has contributed to Marsd:

[@SebastienMelki](https://github.com/SebastienMelki),
[@Lib-LOCALE](https://github.com/Lib-LOCALE),
[@lawyered0](https://github.com/lawyered0),
[@elzalem](https://github.com/elzalem),
[@Rau1CS](https://github.com/Rau1CS),
[@Sethispr](https://github.com/Sethispr),
[@InlitX](https://github.com/InlitX),
[@Ahmadhamdan47](https://github.com/Ahmadhamdan47),
[@K35P](https://github.com/K35P),
[@Niboshi-Wasabi](https://github.com/Niboshi-Wasabi),
[@pedroddomingues](https://github.com/pedroddomingues),
[@haosenwang1018](https://github.com/haosenwang1018),
[@aa5064](https://github.com/aa5064),
[@cwnicoletti](https://github.com/cwnicoletti),
[@facusturla](https://github.com/facusturla),
[@toasterbook88](https://github.com/toasterbook88)
[@FayezBast](https://github.com/FayezBast)

---

## Security Acknowledgments

We thank the following researchers for responsibly disclosing security issues:

- **Cody Richard** — Disclosed three security findings covering IPC command exposure via DevTools in production builds, renderer-to-sidecar trust boundary analysis, and the global fetch patch credential injection architecture (2026)

If you discover a vulnerability, please see our [Security Policy](./SECURITY.md) for responsible disclosure guidelines.

---

<p align="center">
  <a href="https://worldmonitor.app">worldmonitor.app</a> &nbsp;·&nbsp;
  <a href="https://tech.worldmonitor.app">tech.worldmonitor.app</a> &nbsp;·&nbsp;
  <a href="https://finance.worldmonitor.app">finance.worldmonitor.app</a> &nbsp;·&nbsp;
  <a href="https://commodity.worldmonitor.app">commodity.worldmonitor.app</a>
</p>

## Star History

<a href="https://api.star-history.com/svg?repos=MohamedGamil/worldmonitor&type=Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=MohamedGamil/worldmonitor&type=Date&type=Date&theme=dark" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=MohamedGamil/worldmonitor&type=Date&type=Date" />
 </picture>
</a>
