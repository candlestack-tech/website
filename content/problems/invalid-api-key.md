---
title: Invalid API key
status: 401
summary: The API key of the request does not sign in. It is unknown, revoked or expired, or its account is no longer on the beta list.
when:
  - The Authorization header carries a key that is mistyped or cut short.
  - The key was revoked in Settings, or its expiry has passed.
  - The account of the key was taken off the beta list.
todo:
  - Check that the whole key is in the header, as Authorization Bearer and the key.
  - Create a new key in Settings, API and MCP, and replace the old one where it is used.
fields:
  - name: WWW-Authenticate
    description: Header that says the bearer token is invalid.
---
