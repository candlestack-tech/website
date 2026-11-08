---
title: Idempotency key reused
status: 422
summary: This idempotency key came with another request in the last 24 hours.
when:
  - POST /api/v1/backtests or POST /api/v1/sweeps is sent with an Idempotency-Key header that came with another body in the last 24 hours.
  - The MCP tool start_backtest or run_sweep gets an idempotency_key it got before with other arguments.
todo:
  - Use a new key, such as a new UUID, for a new request.
  - Send the same key only to send the same request again, after a timeout for example. Then you get the answer of the first one.
---
