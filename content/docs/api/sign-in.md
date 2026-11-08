---
title: Sign-in
description: Send your key in the Authorization header of every request. No cookies, no sign-in step.
section: api
order: 2
updated: 2026-11-08
---

> [!NOTE]
> **Available from the next release.** Sign-in with a key comes to app.candlestack.tech with the next release.

## The header

Every request carries the key as a bearer token.

```text title="Header"
Authorization: Bearer cs_...
```

Keep the key in an environment variable and read it from there.

```bash tab="curl"
export CANDLESTACK_API_KEY='cs_...'

curl https://app.candlestack.tech/api/v1/me \
  -H "Authorization: Bearer $CANDLESTACK_API_KEY"
```

```python tab="Python"
import os

import httpx

api = httpx.Client(
    base_url="https://app.candlestack.tech",
    headers={"Authorization": f"Bearer {os.environ['CANDLESTACK_API_KEY']}"},
    timeout=60,  # a request for a long history can take longer than the default 5 seconds
)
me = api.get("/api/v1/me").raise_for_status().json()
```

```js tab="JavaScript"
const headers = { Authorization: `Bearer ${process.env.CANDLESTACK_API_KEY}` }

const me = await fetch("https://app.candlestack.tech/api/v1/me", { headers }).then((r) => r.json())
```

`GET /api/v1/me` answers with your account, so it is a quick check that the key works.

## How it is checked

- **Every request** The key is checked each time: it must not be revoked or expired, and your account must be on the beta list.
- **No cookies** A request with a key ignores any cookie, so a key and a browser session never mix.
- **One answer for a bad key** A wrong, revoked or expired key all answer 401 [invalid-api-key](/problems/invalid-api-key/).
- **No header** A request without a key answers 401 [not-signed-in](/problems/not-signed-in/).

## The upload link

One request needs no key: sending a model file to a one-time upload link. The link itself is the sign-in, so treat it like a key until it is used. See [Upload a model](/docs/api/examples/#upload-a-model).
