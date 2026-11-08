---
title: CandleStack API
nav: Overview
description: Search market data, upload models, run backtests and compare them from your own code, with JSON over HTTPS and an API key.
section: api
order: 0
updated: 2026-11-08
---

> [!NOTE]
> **Available from the next release.** API keys, the upload link, the backtest queue and the compare endpoint come to app.candlestack.tech with the next release. Until then the examples on these pages do not work there, and the app is the way to run backtests.

## What the API covers

Almost everything you do in the app. A key works for your account on the beta list and sees what you see. That is your own models and backtests, and what others published to Experiments.

- **Market data** Search US stocks and crypto, read an instrument and its candles from 1m to 1d.
- **Models** Upload Keras and ONNX files, read and set their manifests, rename, star and delete them.
- **Backtests** Start them, wait in the queue, read the metrics and trades, rename, star and cancel them.
- **Compare** Put up to 20 backtests side by side, with the best and worst value of each metric marked.
- **Experiments** Read what others published, publish your own or take it back.

Your keys, your profile and settings, deleting your account, sign-in methods and signing out stay in the app. No key can do them.

## Base URL

Every endpoint is under one address. Send JSON, get JSON back.

```text title="Base URL"
https://app.candlestack.tech/api/v1
```

Candle times and backtest periods are UTC epoch seconds. Timestamps like `created_at` are ISO 8601 dates in UTC. Returns and drawdowns in backtest results are fractions, so `0.05` is 5%.

## The reference

Every endpoint with every field, the scope it needs and the errors it can answer is in the reference. It is built from the API itself, so it always matches.

```text title="API reference"
https://app.candlestack.tech/api/v1/docs
```

## Start here

1. **Create a key**

   In the app, open Settings, API and MCP and create a key with the scopes you need. See [Keys](/docs/api/keys/).

2. **Send it with every request**

   Put the key in the `Authorization` header. See [Sign-in](/docs/api/sign-in/).

3. **Run the examples**

   Search an instrument, upload a model, run a backtest and compare it, in curl, Python or JavaScript. See [Examples](/docs/api/examples/).

## Next

- [Keys](/docs/api/keys/) Create a key, pick its scopes and keep it secret
- [Examples](/docs/api/examples/) From an instrument search to a comparison of three backtests
- [Errors](/docs/api/errors/) What each error means and what to do
- [Rate limits](/docs/api/rate-limits/) How many requests a key can send
- [Data terms](/docs/api/data-terms/) What you may do with the market data
