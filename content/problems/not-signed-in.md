---
title: Not signed in
status: 401
summary: The request needs a signed-in user, and it has no session or the session ended.
when:
  - A signed-in route, like GET /api/v1/me, is called without the session cookie.
  - The session cookie is there, but its session has expired or was ended by signing out.
  - A script calls a signed-in route with neither a session cookie nor an API key.
todo:
  - Sign in again in the app, then send the request again.
  - Send requests from the browser that signed in, so the session cookie comes with them.
  - From a script, send an API key in the Authorization header.
---
