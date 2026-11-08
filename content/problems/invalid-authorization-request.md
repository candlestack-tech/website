---
title: Invalid authorization request
status: 400
summary: An app sent you to connect to CandleStack with a request the server cannot accept. You stay on CandleStack and nothing goes back to the app.
when:
  - The request names no app, or an app that is not registered with CandleStack.
  - The return address is missing or is not one the app registered.
  - The app's client ID metadata document cannot be fetched or used.
  - The request is not valid, such as no S256 code_challenge, a response_type other than code, or a resource other than the MCP server.
todo:
  - Go back to the app and connect again.
  - If it keeps failing, the app's sign-in is set up wrong. Tell its maker what detail says.
fields:
  - name: error
    description: The OAuth error code, such as invalid_request or invalid_target.
---
