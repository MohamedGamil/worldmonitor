# Marsd Frontend Architecture Analysis

This document provides a deep dive into the architecture of the Marsd frontend, based on code inspection and build output analysis.

## Core Principles & Design Choices
- **Vanilla TypeScript** – No heavyweight frontend framework; direct DOM manipulation and custom component patterns keep bundle size modest.
- **Vite Build Tool** – Fast development server, modern ES module handling, and built‑in code‑splitting support.
- **Proto‑First API Contracts** – Backend interactions defined via Protocol Buffers; generated TypeScript clients ensure type safety across services.
- **Browser‑First Compute** – AI pipelines run in Web Workers (NER, summarization) with ONNX Runtime; supports offline/near‑offline operation.
- **Resilience & Graceful Degradation** – Multi‑tier caching (in‑memory, Redis/Upstash, upstream), circuit breakers, stale‑on‑error fallback, adaptive refresh scheduling.
- **Local‑First Operation** – Critical AI/data processing can run in a local sidecar (Tauri) to reduce server dependency and improve privacy.

## Core Principles Flow Diagram
```
+---------------------+     +-----------------+     +---------------------+
| User Interaction    | --> | Frontend Shell  | --> | Data & AI Pipelines |
+---------------------+     +-----------------+     +----------+----------+
                                                        |          |
                                                        v          v
+---------------------+     +---------------------+     +----------------------+
| UI Layer (Panel)   |<--->| API Layer (Proto)   |<--->| Data Sources & AI/ML |
+---------------------+     +---------------------+     +----------------------+
                                                        |
                                                        v
+----------------------+     +-----------------------+
| Tauri Desktop Layer  |<->  | Local/Cloud AI Runtimes |
+----------------------+     +-----------------------+
```

## Key Modules
- **Panel System** – Base `Panel` class with debounced rendering, event delegation, and layout persistence.
- **Map Rendering** – Dual engines:
  - 3D Globe (`globe.gl` + Three.js)
  - 2D Flat Map (`deck.gl` + MapLibre GL)
  - 45+ toggleable data layers; runtime layer registry.
- **AI & ML** – Local LLM support (Ollama/LM Studio) plus cloud fallback (Groq, OpenRouter). Browser‑side Transformers.js for NER / summarisation; embeddings via ONNX Runtime.
- **Signal Aggregator** – Consolidates data from RSS, AIS, ADS‑B, Telegram OSINT, OREF alerts, etc., into a unified geospatial intelligence picture.
- **Tauri Desktop** – Native desktop wrapper with a Node.js sidecar for local API handling, OS keychain secret storage, optional cloud fallback.

## Data Flow Diagram
```
+-----------------------------+      +-----------------------------+      +-----------------------------+
| UI Components               |----->| Panel System                |----->| Map Rendering               |
| (Vanilla TS)                |      | (Debounced, State)          |      | (Globe/Deck.gl)             |
+-----------------------------+      +-----------------------------+      +----------+----------+
                                                                                        |
                                                                                        v
+-----------------------------+      +-----------------------------+      +----------+----------+
| API Layer (Proto‑First)    |<-----| Signal Aggregator           |<-----| Data Sources        |
| (Vercel Edge Functions)    |----->| (Fuses streams)             |----->| (RSS, AIS, TLG OSINT |
|                             |      |                             |      |  OREF, etc.)        |
+-----------------------------+      +-----------------------------+      +---------------------+
               |                                    |
               v                                    v
+-----------------------------+      +-----------------------------+
| Browser Workers             |      | Tauri Desktop               |
| (AI/ML, RAG, Local Models) |      | (Local API, Secrets)        |
+-----------------------------+      +-----------------------------+
```

## Deployment & Infrastructure
- **Frontend SPA** hosted on CDN (Vercel) with Edge Functions for API.
- **Railway Relay** for persistent connections to data streams (AIS, NOTAMs, etc.).
- **Tauri Desktop** for native app with offline capability.

## Data Sources & Refresh Strategy
- **RSS Feeds** – 170+ sources aggregated server‑side (`listFeedDigest` RPC) to minimise edge calls.
- **Real‑time Feeds** – AIS streaming via Railway relay, OpenSky polling, Telegram MTProto polling, OREF rocket alerts via residential proxy.
- **Caching** – In‑memory LRU, Redis/Upstash with per‑source TTLs, negative‑caching for failed upstreams.

## Architectural Caveats & Opportunities
- **Large JS chunks** – Build output warns about >1 MB chunks (e.g., `panels‑Cr4lVRHm.js`, `main‑DAynoQ5w.js`). Further manual‑chunking or dynamic imports could reduce initial load.
- **Dynamic Import Warnings** – Several modules are both statically and dynamically imported, preventing optimal code‑splitting. Refactor to true lazy‑loads where feasible.
- **Tauri Integration** – Verify sidecar secret handling and token rotation in CI.
- **Testing Coverage** – Expand unit tests for CII calculation, signal correlation, and AI fallback logic.

---

*Analysis completed.*