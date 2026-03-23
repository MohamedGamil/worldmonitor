# Marsd Frontend Caveats & Improvement Opportunities

## Build Output Warnings
- **Large JS chunks** – `panels‑Cr4lVRHm.js`, `main‑DAynoQ5w.js`, `maplibre‑D1dvXyCx.js`, `deck‑stack‑CoAxR1Ym.js`. Manual chunking added, but further splitting could improve load.
- **Dynamic import warnings** – Modules both statically and dynamically imported, preventing optimal code‑splitting. Refactor to true lazy‑loads.

## Architectural Observations
- **Vanilla TS complexity** – Direct DOM manipulation scales well now but may become hard to maintain; consider lightweight component abstraction.
- **Tauri secret flow** – Verify OS‑keychain handling and token rotation in CI.
- **Data source reliability** – Multiple real‑time feeds rely on Railway relay; monitor latency and fallback.
- **Testing gaps** – Core analysis algorithms (CII, signal correlation, AI fallback) lack dedicated unit tests.

## Recommendations
1. **Further code‑splitting** – Add more manualChunks for heavy libs (`globe.gl`, `deck.gl`, `transformers`).
2. **Lazy‑load optional modules** – Refactor flagged modules to load only when needed.
3. **Add unit tests** – Cover CII scoring, hotspot escalation, AI prompt generation.
4. **Improve docs onboarding** – Create CONTRIBUTING section for map layer additions and AI pipeline extensions.
5. **Automated health checks** – CI job validating Railway relay endpoints and API key expiry.

---

*Analysis complete.*
