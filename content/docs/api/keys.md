---
title: API keys
nav: Keys
description: A key signs your scripts in as you. Give it only the scopes it needs, an expiry, and revoke it when you are done.
section: api
order: 1
updated: 2026-11-08
---

## Create a key

1. **Open Settings**

   Sign in at [app.candlestack.tech](https://app.candlestack.tech) and open Settings, API and MCP.

2. **Name it**

   Click Create key and say where it is used, like `Backtest script on my laptop`. The name helps you find the key later.

3. **Pick its scopes and expiry**

   Tick what the key may do and how long it works. See below.

4. **Copy it**

   The key starts with `cs_` and is shown only once. CandleStack keeps just a hash of it, so nobody can show it to you again. Lost it? Revoke it and create a new one.

You can have up to 10 keys that work at the same time.

## Scopes

Every key can read. Add only the other scopes a script needs.

| Scope | In the app | What the key may do |
| --- | --- | --- |
| `read` | Read | Every GET, like market data, your models, backtests and their results, and Experiments. Always on. |
| `backtests` | Run backtests | Start, cancel, rename and star backtests. |
| `models` | Manage models | Upload models, add their manifests, rename, star and delete them. |
| `publish` | Publish | Publish backtests to Experiments and take them back. |

A request the key has no scope for answers 403 [missing-scope](/problems/missing-scope/), and its `scope` field names the one it needs.

## Expiry

A key works for 30 days, 90 days, 1 year or until you revoke it. 90 days is the default. An expired key answers 401 [invalid-api-key](/problems/invalid-api-key/). Create a new one then.

Settings shows when each key expires and when it was last used.

## Revoke a key

In Settings, API and MCP, click Revoke next to the key. It stops working at once and cannot be turned back on. An expired key shows Delete instead, to take it off the list.

A key also stops working when your account leaves the beta list. Upload links it made keep working until they expire, 15 minutes at most.

## Keep it secret

A key is your account for what its scopes allow.

- **Keep it out of code** Put it in an environment variable, like `CANDLESTACK_API_KEY`, never in a file you commit.
- **Do not share it** Never paste it in an issue, a chat or a screenshot.
- **One key per place** A key for each script or machine, so you can revoke one without stopping the rest.
- **Revoke on doubt** If a key may have leaked, revoke it and create a new one.

## What a key cannot do

Managing keys, your profile and settings, deleting your account, sign-in methods and signing out work only in the app. A key gets 403 [session-required](/problems/session-required/) there.
