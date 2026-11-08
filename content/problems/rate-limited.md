---
title: Too many requests
status: 429
summary: This client sent more requests in one minute than the limit allows, from one address or with one API key.
when:
  - More candle and instrument detail requests (/candles and /instruments/<id> together) within one minute from the same address than the limit, 60 by default; detail says the limit. An IPv6 client counts as its whole /64 network.
  - More than 120 requests of any kind within one minute with the same API key. API keys come with the next release.
todo:
  - Wait the number of seconds in the Retry-After header, then send the request again.
  - Spread requests out, and ask for larger periods per request instead of many small ones.
fields:
  - name: limit
    description: Requests allowed per minute, per address or per API key.
  - name: Retry-After
    description: Header with the seconds until the next minute starts and requests are accepted again.
---
