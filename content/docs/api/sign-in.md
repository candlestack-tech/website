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
from http.cookiejar import CookieJar, DefaultCookiePolicy

import httpx

api = httpx.Client(
    base_url="https://app.candlestack.tech",
    headers={"Authorization": f"Bearer {os.environ['CANDLESTACK_API_KEY']}"},
    cookies=CookieJar(DefaultCookiePolicy(allowed_domains=[])),  # keeps no cookies, see below
    timeout=60,  # a request for a long history can take longer than the default 5 seconds
)
response = api.get("/api/v1/me")
response.raise_for_status()
me = response.json()
```

```js tab="JavaScript"
const headers = { Authorization: `Bearer ${process.env.CANDLESTACK_API_KEY}` }

const me = await fetch("https://app.candlestack.tech/api/v1/me", { headers }).then((r) => r.json())
```

`GET /api/v1/me` answers with your account, so it is a quick check that the key works.

## How it is checked

- **Every request** The key is checked each time. It must not be revoked or expired, and your account must be on the beta list.
- **No cookies** Send the key alone. A change sent with a key and a cookie answers 403 [cross-origin-request](/problems/cross-origin-request/).
- **One answer for a bad key** A wrong, revoked or expired key all answer 401 [invalid-api-key](/problems/invalid-api-key/).
- **No header** A request without a key answers 401 [not-signed-in](/problems/not-signed-in/).

## The upload link

One request needs no key, the one that sends a model file to a one-time upload link. The link itself is the sign-in, so treat it like a key until it is used. See [Upload a model](/docs/api/examples/#upload-a-model).
