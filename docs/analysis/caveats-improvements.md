# Marsd Frontend Caveats & Improvement Opportunities

- Large JS chunks: panels-*, main-*. Consider deeper code-splitting and additional manualChunks for heavy libraries.
- Dynamic imports: Some modules are statically and dynamically imported; refactor to reliable lazy-loading.
- Tauri integration: Verify secret management, cross-platform behavior, and CI coverage.
- Data flow complexity: With 60+ edge functions and many data sources, ensure robust error handling and caching strategies.
- Testing coverage: Expand unit tests for CII, signal correlation, AI fallback logic.
- Docs onboarding: Improve README for new contributors; outline proto-first workflows.
