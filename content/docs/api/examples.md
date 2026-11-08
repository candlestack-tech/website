---
title: Examples
description: From an instrument search to a comparison of three backtests, in curl, Python and JavaScript.
section: api
order: 3
updated: 2026-11-08
---

## Before you start

Create a key with the scopes `read`, `backtests` and `models` in Settings, API and MCP, see [Keys](/docs/api/keys/). Then put it in the environment of your shell.

```bash title="Terminal"
export CANDLESTACK_API_KEY='cs_...'
```

The Python examples use [httpx](https://www.python-httpx.org) 0.25 or newer, the JavaScript ones run in Node.js 18 or newer as an ES module. The curl examples that read a field use [jq](https://jqlang.org). Each language starts with a client that sends the key and no cookies.

```bash tab="curl"
# Every request sends the key in the Authorization header. This one checks that it works.
curl -s https://app.candlestack.tech/api/v1/me \
  -H "Authorization: Bearer $CANDLESTACK_API_KEY" | jq -r .display_name
```

```python tab="Python"
import os
from http.cookiejar import CookieJar, DefaultCookiePolicy

import httpx

api = httpx.Client(
    base_url="https://app.candlestack.tech",
    headers={"Authorization": f"Bearer {os.environ['CANDLESTACK_API_KEY']}"},
    cookies=CookieJar(DefaultCookiePolicy(allowed_domains=[])),  # keeps no cookies
    timeout=60,
)
```

```js tab="JavaScript"
const BASE = "https://app.candlestack.tech"
const headers = { Authorization: `Bearer ${process.env.CANDLESTACK_API_KEY}` }

// Sends a request with the key, answers the JSON and throws the problem on an error
async function api(path, init = {}) {
  const response = await fetch(BASE + path, { ...init, headers: { ...headers, ...init.headers } })
  const body = await response.json()
  if (!response.ok) throw new Error(`${body.status} ${body.title}: ${body.detail}`)
  return body
}
```

## Search an instrument

An instrument ID is `<market>:<symbol>`, like `stock:AAPL` or `crypto:BTCUSDT`. Search by symbol or name, best matches first.

```bash tab="curl"
curl -s -G https://app.candlestack.tech/api/v1/data/instruments \
  -H "Authorization: Bearer $CANDLESTACK_API_KEY" \
  -d q=apple -d market=stock -d limit=5 | jq -r '.items[] | "\(.id)  \(.name)"'
```

```python tab="Python"
page = api.get(
    "/api/v1/data/instruments", params={"q": "apple", "market": "stock", "limit": 5}
).raise_for_status().json()
for item in page["items"]:
    print(item["id"], item["name"])
```

```js tab="JavaScript"
const query = new URLSearchParams({ q: "apple", market: "stock", limit: "5" })
const page = await api(`/api/v1/data/instruments?${query}`)
for (const item of page.items) console.log(item.id, item.name)
```

`total` counts every match. Page through them with `offset`, up to 100 items at a time. Leave out `market` to search crypto too.

## Upload a model

A script can send a file in one request, `POST /api/v1/models?name=lstm.keras` with the file as the body. An agent in a chat cannot pass a file, so it asks for a one-time link and you send the file from your own disk. Both need the scope `models`.

1. **Ask for a link**

   Send the file's name and size. The link takes one `.keras` or `.onnx` file of at most that size, within 15 minutes.

   ```bash tab="curl"
   curl -s -X POST https://app.candlestack.tech/api/v1/models/uploads \
     -H "Authorization: Bearer $CANDLESTACK_API_KEY" \
     -H "Content-Type: application/json" \
     -d "{\"name\": \"lstm.keras\", \"size_bytes\": $(wc -c < lstm.keras)}"
   ```

   ```python tab="Python"
   from pathlib import Path

   path = Path("lstm.keras")
   link = api.post(
       "/api/v1/models/uploads", json={"name": path.name, "size_bytes": path.stat().st_size}
   ).raise_for_status().json()
   ```

   ```js tab="JavaScript"
   import { readFile, stat } from "node:fs/promises"

   const file = "lstm.keras"
   const link = await api("/api/v1/models/uploads", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ name: file, size_bytes: (await stat(file)).size }),
   })
   ```

   The answer holds the link's `id`, its `url` and a ready `command`. The `url` is shown only here.

   ```json out
   {
     "id": "upl_7f3k2m9qx4",
     "name": "lstm.keras",
     "size_bytes": 14889779,
     "status": "waiting",
     "url": "https://app.candlestack.tech/api/v1/uploads/<token>",
     "command": "curl --fail-with-body -T lstm.keras https://app.candlestack.tech/api/v1/uploads/<token>",
     "created_at": "2026-11-08T12:00:00Z",
     "expires_at": "2026-11-08T12:15:00Z",
     "model_id": null,
     "problem": null,
     "check": null,
     "error": null
   }
   ```

2. **Send the file**

   Put the file to the `url`, without the key. The link is its own sign-in and works once. An agent shows you the `command` to run in the folder of the file.

   ```bash tab="curl"
   curl --fail-with-body -T lstm.keras https://app.candlestack.tech/api/v1/uploads/<token>
   ```

   ```python tab="Python"
   model = httpx.put(link["url"], content=path.read_bytes(), timeout=180).raise_for_status().json()
   print(model["id"], model["state"])
   ```

   ```js tab="JavaScript"
   const upload = await fetch(link.url, { method: "PUT", body: await readFile(file) })
   const model = await upload.json()
   if (!upload.ok) throw new Error(`${model.status} ${model.title}: ${model.detail}`)
   console.log(model.id, model.state)
   ```

   The file is checked as any upload and becomes your model. The answer is the model.

3. **Check how it stands**

   Whoever made the link can follow it, also when someone else sent the file.

   ```bash tab="curl"
   curl -s https://app.candlestack.tech/api/v1/models/uploads/upl_7f3k2m9qx4 \
     -H "Authorization: Bearer $CANDLESTACK_API_KEY" | jq '{status, model_id, problem, error}'
   ```

   ```python tab="Python"
   status = api.get(f"/api/v1/models/uploads/{link['id']}").raise_for_status().json()
   print(status["status"], status["model_id"] or status["error"])
   ```

   ```js tab="JavaScript"
   const status = await api(`/api/v1/models/uploads/${link.id}`)
   console.log(status.status, status.model_id ?? status.error)
   ```

   `status` is `waiting`, `checking`, `done` with the `model_id`, `failed` with the `problem` and the `error` in plain words, or `expired`. A used or expired link answers 410 [upload-link-gone](/problems/upload-link-gone/). Ask for a new one then.

A new model needs its manifest before it can run. The manifest says what the model reads and how its output becomes a signal. Add it in the app, or with `PUT /api/v1/models/{model_id}/manifest`, see [the reference](https://app.candlestack.tech/api/v1/docs).

## Start a backtest

You need a model whose `state` is `ready` or `verified` (`GET /api/v1/models` lists yours), an instrument and a period. The timeframe is the model's. Times are UTC epoch seconds, the end is not included. This one runs on the first half of 2025, long only, with a fee of 5 basis points.

```bash tab="curl"
curl -s -X POST https://app.candlestack.tech/api/v1/backtests \
  -H "Authorization: Bearer $CANDLESTACK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": {"id": "mdl_k2m9qx47f3"},
    "data": {"instrument": {"id": "stock:AAPL"}, "period": {"start": 1735689600, "end": 1751328000}},
    "decision": {"long_only": true},
    "execution": {"fee_bps": 5}
  }' | jq '.backtest | {id, status, queue_position}'
```

```python tab="Python"
setup = {
    "model": {"id": "mdl_k2m9qx47f3"},
    "data": {"instrument": {"id": "stock:AAPL"}, "period": {"start": 1735689600, "end": 1751328000}},
    "decision": {"long_only": True},
    "execution": {"fee_bps": 5},
}
backtest = api.post("/api/v1/backtests", json=setup).raise_for_status().json()["backtest"]
print(backtest["id"], backtest["status"], backtest["queue_position"])
```

```js tab="JavaScript"
const setup = {
  model: { id: "mdl_k2m9qx47f3" },
  data: { instrument: { id: "stock:AAPL" }, period: { start: 1735689600, end: 1751328000 } },
  decision: { long_only: true },
  execution: { fee_bps: 5 },
}
const { backtest } = await api("/api/v1/backtests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(setup),
})
console.log(backtest.id, backtest.status, backtest.queue_position)
```

The answer is the backtest's document, `running`, or `queued` with its place in your queue. Left out, the decision is long and short at a threshold of 0 and the execution has no fees or slippage. The document of an earlier backtest can be sent back as it is to run it again.

## Wait for it

Your backtests run one at a time, and up to 20 more wait in your queue. The oldest starts when the running one ends and one of the run slots that all accounts share is free. A backtest goes from `queued` to `running` to `finished`, or to `failed` with an `error`. Ask every few seconds until it ends.

```bash tab="curl"
id=bt_7f3k2m9qx4
while :; do
  status=$(curl -s https://app.candlestack.tech/api/v1/backtests/$id \
    -H "Authorization: Bearer $CANDLESTACK_API_KEY" | jq -r .backtest.status)
  echo "$status"
  case $status in queued|running) sleep 5 ;; *) break ;; esac
done
```

```python tab="Python"
import time

while True:
    doc = api.get(f"/api/v1/backtests/{backtest['id']}").raise_for_status().json()
    status = doc["backtest"]["status"]
    if status in ("finished", "failed"):
        break
    print(status, doc["backtest"]["queue_position"] or "")
    time.sleep(5)
```

```js tab="JavaScript"
let doc
while (true) {
  doc = await api(`/api/v1/backtests/${backtest.id}`)
  if (["finished", "failed"].includes(doc.backtest.status)) break
  console.log(doc.backtest.status, doc.backtest.queue_position ?? "")
  await new Promise((resolve) => setTimeout(resolve, 5000))
}
```

A request every 5 seconds is 12 a minute, well inside the [rate limit](/docs/api/rate-limits/). A queued backtest can be cancelled with `POST /api/v1/backtests/{backtest_id}/cancel`, a running one cannot. A 21st waiting backtest answers 409 [queue-full](/problems/queue-full/).

## Read the results

Once `finished`, the document holds `results`. They are the 12 statistics in `stats`, the equity series and the trades. Returns are fractions, so `0.084` is 8.4%. A failed backtest has no results and says why in `backtest.error`.

```bash tab="curl"
curl -s https://app.candlestack.tech/api/v1/backtests/bt_7f3k2m9qx4 \
  -H "Authorization: Bearer $CANDLESTACK_API_KEY" | jq '.results.stats'
```

```python tab="Python"
if doc["results"] is None:
    print("Failed:", doc["backtest"]["error"])
else:
    stats = doc["results"]["stats"]

    def pct(value):
        return "n/a" if value is None else f"{value:.1%}"

    print(f"Return {pct(stats['total_return'])}, buy and hold {pct(stats['buy_and_hold_return'])}")
    print(f"Sharpe {stats['sharpe']}, max drawdown {pct(stats['max_drawdown'])}, trades {stats['num_trades']}")
```

```js tab="JavaScript"
if (doc.results === null) {
  console.log("Failed:", doc.backtest.error)
} else {
  const { stats } = doc.results
  const pct = (value) => (value === null ? "n/a" : `${(value * 100).toFixed(1)}%`)
  console.log(`Return ${pct(stats.total_return)}, buy and hold ${pct(stats.buy_and_hold_return)}`)
  console.log(`Sharpe ${stats.sharpe}, max drawdown ${pct(stats.max_drawdown)}, trades ${stats.num_trades}`)
}
```

A statistic can be `null` when it has no meaning, like the win rate of a backtest without trades. A long backtest comes in a light view, with one point a day in the series and the newest 10,000 trades. `GET /api/v1/backtests/{backtest_id}/download` returns every row and trade.

## Compare three

`GET /api/v1/compare` puts up to 20 backtests side by side, as the Compare page of the app does. They can be your own or ones others published. Each statistic comes with the value of every backtest and the best and worst marked. It reads only what each backtest stored, so it is quick for many.

```bash tab="curl"
curl -s -G https://app.candlestack.tech/api/v1/compare \
  -H "Authorization: Bearer $CANDLESTACK_API_KEY" \
  -d ids=bt_7f3k2m9qx4,bt_t9n8v7d6a5,bt_q4w7e2r5t6 \
  | jq -r '.metrics[] | "\(.label): \(.values) \(.marks)"'
```

```python tab="Python"
ids = ["bt_7f3k2m9qx4", "bt_t9n8v7d6a5", "bt_q4w7e2r5t6"]
compared = api.get("/api/v1/compare", params={"ids": ",".join(ids)}).raise_for_status().json()
names = [b["name"] for b in compared["backtests"]]
for metric in compared["metrics"]:
    best = [name for name, mark in zip(names, metric["marks"]) if mark == "best"]
    print(metric["label"], metric["values"], "best:", ", ".join(best) or "none")
print("Differs in:", ", ".join(compared["differs"]))
```

```js tab="JavaScript"
const ids = ["bt_7f3k2m9qx4", "bt_t9n8v7d6a5", "bt_q4w7e2r5t6"]
const compared = await api(`/api/v1/compare?ids=${ids.join(",")}`)
const names = compared.backtests.map((b) => b.name)
for (const metric of compared.metrics) {
  const best = names.filter((_, i) => metric.marks[i] === "best")
  console.log(metric.label, metric.values, "best:", best.join(", ") || "none")
}
console.log("Differs in:", compared.differs.join(", "))
```

One statistic of the answer looks like this:

```json out
{
  "key": "total_return",
  "label": "Total return",
  "better": "higher",
  "values": [0.084, -0.031, 0.122],
  "marks": [null, "worst", "best"]
}
```

`differs` names the setup fields that are not the same in all three, like `period.start` or `decision.rule.limit`. `times` with `equity`, `drawdown` and `buy_and_hold` of each backtest draw the curves on one time axis. A backtest that has not finished is listed with its status and no values. An ID you cannot see answers 404, and its `id` field names it.
