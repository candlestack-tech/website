---
# Project status. Change the date whenever you update this file.
updated: 2026-11-02

# Phases of the project, in order. state: done, active or planned.
phases:
  - name: Setup
    description: Team, roles, tools, workflow
    state: done
  - name: Design
    description: Architecture, layer interfaces, model manifest format
    state: done
  - name: Market data
    description: Crypto and US stock candles through our API
    state: done
  - name: Pipeline
    description: Preprocessing, models, post-processing and backtests in the web app
    state: active
  - name: Architecture comparison
    description: Time-series architectures trained and compared on the same backtests
    state: active
  - name: Stability
    description: Which combination stays stable across market conditions
    state: planned
  - name: Sharing
    description: Public experiments, API keys and an MCP server
    state: planned

done:
  - GitHub organization, website and the domain candlestack.tech
  - Staging and production with automatic deploys
  - Market data API for crypto (Binance) and US stocks (Alpaca)
  - Backtest engine, checked against the reference results of the BLESK models
  - Sign-in with GitHub and Google, account settings
  - Model upload (Keras and ONNX) with checks of the input and output shapes
  - 'Preprocessing: Renko, indicators, normalization and input windows'
  - 'Post-processing: calibration, thresholds, smoothing, k-means, minimum holding, position size, stop loss'
  - Backtest builder and result page with metrics and charts
  - Compare backtests side by side

inProgress:
  - Comparison of time-series architectures (layer 2)
  - Tests of the web app pages

planned:
  - Stability of each combination across market conditions
  - Kagi representation and segmentation
  - Public catalog of published experiments
  - API keys and an MCP server
  - More benchmarks (SPY, QQQ, DIA)
---
