# Marsd Frontend Architecture Analysis

This document provides a deep dive into the architecture of the Marsd frontend, based on code inspection and build output analysis.

## Core Principles & Design Choices
- **Vanilla TypeScript** – No heavy framework, direct DOM manipulation and custom component patterns keep the bundle size minimal.
- **Vite Build Tool** – Fast dev server, modern ES module handling, and built‑in code‑splitting support.
- **Proto‑First API Contracts** – All backend interactions are defined via Protocol Buffers, generated TypeScript clients guarantee type safety across the 22 service domains.
- **Browser‑First Compute** – AI pipelines (keyword classification, headline‑memory RAG, NER) run in Web Workers with ONNX Runtime, allowing offline operation.
- **Resilience** – Three‑tier caching (in‑memory → Upstash Redis → upstream), circuit breakers, stale‑on‑error fallback, and adaptive refresh scheduling keep the UI functional under network issues.

## Key Modules
- **Panel System** – Base `Panel` class handles debounced rendering, event delegation, and persistent layout state.
- **Map Rendering** – Dual engine: 3D globe (`globe.gl` + Three.js) and 2D flat map (`deck.gl` + MapLibre). Layers are defined centrally in `src/config/map-layer-definitions.ts` and can be toggled at runtime.
- **AI & ML** – Local LLM support via Ollama/LM Studio, cloud fallback (Groq, OpenRouter), and browser‑side Transformers.js for NER / summarisation.
- **Signal Aggregator** – Consolidates data from RSS, AIS, ADS‑B, Telegram OSINT, OREF alerts, etc., into a unified geospatial intelligence picture.
- **Tauri Desktop** – Native desktop wrapper with a Node.js sidecar for local API handling, OS keychain secret storage, and optional cloud fallback.

## Data Sources & Refresh Strategy
- **RSS Feeds** – 170+ sources aggregated server‑side (`listFeedDigest` RPC) to minimise edge calls.
- **Real‑time Feeds** – AIS streaming via Railway relay, OpenSky polling, Telegram MTProto polling, OREF rocket alerts via residential proxy.
- **Caching** – In‑memory LRU, Redis with per‑source TTLs, negative‑caching for failed upstreams.

## Architectural Caveats & Opportunities
- **Large Chunks** – Build output warns about >1 MB chunks (e.g., `panels‑Cr4lVRHm.js`, `main‑DAynoQ5w.js`). Further manual‑chunking or dynamic imports could reduce initial load.
- **Dynamic Import Warnings** – Several modules are both statically and dynamically imported, preventing optimal code‑splitting. Refactor to true lazy‑loads where feasible.
- **Tauri Sync** – Ensure sidecar secret handling and token rotation are exercised in CI.
- **Testing Coverage** – Expand unit tests for CII calculation, signal correlation, and AI fallback logic.

---

*Analysis completed.*
