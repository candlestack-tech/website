---
title: Idempotency key in use
status: 409
summary: The first request with this idempotency key is still being answered.
when:
  - A start of a backtest or a sweep is sent again with the same Idempotency-Key header, or the same idempotency_key on the MCP server, while the first request with it is still running and has stored nothing yet. A client that timed out and tried again at once gets this.
todo:
  - Wait retry_after_s seconds, then send the same request with the same key again. It answers what the first request answered.
fields:
  - name: retry_after_s
    description: Seconds to wait before you send the request again.
  - name: Retry-After
    description: Header with the same seconds.
---
