---
title: Too many requests
status: 429
summary: This client sent more requests in one minute than a limit allows, from one address, with one API key or connected app, or for one account.
when:
  - More candle and instrument detail requests (/candles and /instruments/<id> together) within one minute from the same address than the limit, 60 by default. detail says the limit. An IPv6 client counts as its whole /64 network.
  - More than 120 requests within one minute with the same API key, or from the same app connected with OAuth. A heavy request counts as 5. That is a backtest's result document, a download, a comparison, or a start of a backtest or a sweep.
  - More than 300 requests within one minute for one account, across all its API keys and connected apps. Heavy requests count as 5 here too.
  - More than 1,200 requests within one minute that only connect to the MCP server or list what it offers (initialize, tools/list, ping) with the same key or app. They have this limit of their own and leave the 120 and the 300 alone.
  - More than 20 sign-in requests within one minute from the same address, when an app sends you to connect to CandleStack. Signing in with GitHub or Google counts toward them.
  - More than 10 registrations of MCP clients within one minute from the same address.
todo:
  - Wait the number of seconds in retry_after_s or the Retry-After header, then send the request again.
  - On the MCP server a tool call over the limit answers this problem as the tool's error. The agent reads retry_after_s, waits and calls again.
  - Spread requests out, and ask for larger periods per request instead of many small ones. More keys do not help, as all keys and apps of an account share its 300.
fields:
  - name: limit
    description: Requests allowed per minute by the limit that was hit. Not sent for the sign-in limit.
  - name: retry_after_s
    description: Seconds until requests are accepted again. Not sent for the sign-in and registration limits.
  - name: Retry-After
    description: Header with the seconds until the next minute starts and requests are accepted again.
---
