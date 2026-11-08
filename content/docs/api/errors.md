---
title: Errors
description: Every error is a short JSON document that names the problem and says what to change.
section: api
order: 4
updated: 2026-11-08
---

> [!NOTE]
> **Available from the next release.** API keys, upload links, the backtest queue and the problems that come with them arrive on app.candlestack.tech with the next release.

## The shape of an error

An error answers with a status of 400 or more and an `application/problem+json` body ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)).

```json out
{
  "type": "https://candlestack.tech/problems/missing-scope",
  "title": "Missing scope",
  "status": 403,
  "detail": "This API key does not have the scope backtests, which this request needs. Create a key with it in Settings, API and MCP.",
  "scope": "backtests"
}
```

- `type` A link to the page of the problem. Its last part, the slug, is what your code should check.
- `title` The problem in a few words. Check the slug, not the title.
- `status` The HTTP status.
- `detail` What went wrong this time and what to do, in plain words.

Some problems add fields, like `scope` above or `errors` of a 422 [validation](/problems/validation/). Every response carries an `X-Request-ID` header. Send it along when you report an error.

## Sign-in and keys

| Status | Problem | What to do |
| --- | --- | --- |
| 401 | [not-signed-in](/problems/not-signed-in/) | No key came with the request. Send the `Authorization` header. |
| 401 | [invalid-api-key](/problems/invalid-api-key/) | The key is wrong, revoked or expired, or your account left the beta list. Create a new key. |
| 403 | [missing-scope](/problems/missing-scope/) | The key lacks the scope that `scope` names. Create a key with it. |
| 403 | [session-required](/problems/session-required/) | Keys cannot do this. Do it in the app. |
| 403 | [cross-origin-request](/problems/cross-origin-request/) | A change came with a key and a cookie. Send the key alone. |
| 409 | [too-many-api-keys](/problems/too-many-api-keys/) | You have 10 working keys. Revoke one in Settings before you create another. |
| 429 | [rate-limited](/problems/rate-limited/) | Too many requests. Wait the seconds in `Retry-After`, see [Rate limits](/docs/api/rate-limits/). |

## Upload links

| Status | Problem | What to do |
| --- | --- | --- |
| 404 | [upload-link-not-found](/problems/upload-link-not-found/) | No link has this token. Copy the whole link or ask for a new one. |
| 410 | [upload-link-gone](/problems/upload-link-gone/) | The link was used or expired, `reason` says which. Ask for a new one. |
| 413 | [larger-than-link](/problems/larger-than-link/) | The file is larger than the link's `size_bytes`. Ask for a new link with the file's size. |
| 400 | [upload-interrupted](/problems/upload-interrupted/) | The upload stopped midway and used the link. Ask for a new one and send the file again. |
| 408 | [upload-timeout](/problems/upload-timeout/) | The file did not arrive within 2 minutes. Ask for a new link and send it again. |
| 409 | [upload-in-progress](/problems/upload-in-progress/) | Another upload of yours is running. Wait for it, the link stays unused. |

The file of a link is checked as any upload, so it can also answer [model-too-large](/problems/model-too-large/), [storage-full](/problems/storage-full/), [too-many-models](/problems/too-many-models/) or [model-check-failed](/problems/model-check-failed/).

## Backtests

| Status | Problem | What to do |
| --- | --- | --- |
| 404 | [instrument-not-found](/problems/instrument-not-found/) | Check the ID with the instrument search. |
| 409 | `model-needs-setup` | The model has no manifest yet. Add it first. |
| 409 | [queue-full](/problems/queue-full/) | 20 of your backtests wait already. Wait until one has started, or cancel one. |
| 409 | [backtest-not-queued](/problems/backtest-not-queued/) | Only a queued backtest can be cancelled. |
| 422 | [period-out-of-range](/problems/period-out-of-range/) | The period is outside the data. Pick one inside it. |
| 422 | [too-many-candles](/problems/too-many-candles/) | The period has too many candles for the model's timeframe. Pick a shorter one. |
| 503 | [source-unavailable](/problems/source-unavailable/) | A data source cannot be reached. Wait `Retry-After` seconds when it is there. |

## All problem types

[Problem types](/problems/) lists every problem of the API with when it happens and what to do. [The reference](https://app.candlestack.tech/api/v1/docs) names the problems each endpoint can answer.
