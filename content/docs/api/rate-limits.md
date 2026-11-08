---
title: Rate limits
description: A key can send 120 requests a minute, and an account 300. Past that, wait the seconds the API tells you.
section: api
order: 5
updated: 2026-11-08
---

## The limits

- **120 a minute per key** Any request with one key counts, whatever it asks for. Each app connected to the MCP server has its own 120 too.
- **300 a minute per account** All your keys and connected apps together. More keys do not mean more requests.
- **Heavy requests count as 5** A backtest's result document (1 with `?view=summary`), its download, a comparison, and starting a backtest or a sweep. On the MCP server these are `get_backtest` when it asks for trades or equity points, `compare_backtests`, `start_backtest` and `run_sweep`.
- **Connecting and listing on the MCP server** Connecting, listing the tools and `ping` count against a limit of their own, ten times looser, which the 300 of the account leaves out.
- **60 a minute per address** Candle and instrument detail requests from one IP address, with a key or without. The instrument search does not count.

## When you hit one

The API answers 429 [rate-limited](/problems/rate-limited/) with a `Retry-After` header, the seconds until you can send again, and `limit` and `retry_after_s` in the body. Wait that long and send the same request again. On the MCP server a tool call over the limit answers the same problem as the tool's error, so the agent reads `retry_after_s` and waits.

A cold request for a long stock history can also answer 503 [source-unavailable](/problems/source-unavailable/) with `Retry-After` while the source's budget is spent. What was fetched so far stays cached, so the same request goes on from there. Wait and send it again too.

```bash tab="curl"
# curl waits Retry-After on a 429 or 503 and tries again, up to 5 times
curl -s --retry 5 https://app.candlestack.tech/api/v1/backtests \
  -H "Authorization: Bearer $CANDLESTACK_API_KEY"
```

```python tab="Python"
import time


def get(path, params=None, tries=5):
    for _ in range(tries):
        response = api.get(path, params=params)
        wait = response.headers.get("Retry-After")
        if response.status_code in (429, 503) and wait is not None:
            time.sleep(int(wait))
            continue
        response.raise_for_status()
        return response.json()
    raise RuntimeError(f"Still limited after {tries} tries")
```

```js tab="JavaScript"
async function get(path, tries = 5) {
  for (let i = 0; i < tries; i++) {
    const response = await fetch(BASE + path, { headers })
    const wait = response.headers.get("Retry-After")
    if ([429, 503].includes(response.status) && wait !== null) {
      await new Promise((resolve) => setTimeout(resolve, Number(wait) * 1000))
      continue
    }
    if (!response.ok) throw new Error(`${response.status} ${(await response.json()).detail}`)
    return response.json()
  }
  throw new Error(`Still limited after ${tries} tries`)
}
```

`api`, `BASE` and `headers` are the clients of [Examples](/docs/api/examples/#before-you-start).

## Stay inside

- **Poll slowly** Ask for a running backtest every 5 seconds or more, 12 requests a minute.
- **Ask for more at once** Load a long period in one candle request instead of many short ones.
- **Compare on the server** One `GET /api/v1/compare` reads up to 20 backtests in one request.
- **One key per job** Each key has its own 120, so one script does not use up the limit of another. All of them still share the 300 of the account.

## Other limits

| What | Limit |
| --- | --- |
| Keys that work at the same time | 10 per account |
| Backtests | 1 running and up to 20 waiting per account |
| Backtests kept | 2,000 per account, failed and cancelled ones too |
| Sweep | 2 to 20 backtests |
| Delete at once | up to 100 backtests, or a whole sweep |
| Models | 100 per account, 100 MB in all, 50 MB per file |
| Uploads | one at a time per account |
| Upload link | one file within 15 minutes |
| Compare | 1 to 20 backtests |
| Candles | up to 5000 per page, up to 50,000 for a period |
| Instrument search | up to 100 items per page |
| MCP request | a body of up to 2 MB |
