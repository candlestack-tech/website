---
title: Invalid access token
status: 401
summary: The OAuth access token an app sent to the MCP server does not sign in. It is unknown, expired or revoked, it is for another server, or its account is no longer on the beta list.
when:
  - The app was disconnected in Settings, API and MCP, which ends its tokens at once.
  - The token expired after its hour and the app could not get a new one, for example after 30 days without use.
  - The token was issued for another resource than this MCP server.
  - The account of the app was taken off the beta list.
todo:
  - Connect the app again from the app itself, sign in and choose Allow.
  - Check that your account is still on the beta list.
  - Tokens work only at /mcp. For the HTTP API, use an API key.
fields:
  - name: WWW-Authenticate
    description: Header with Bearer error="invalid_token" and resource_metadata, the address of the server's OAuth metadata, so the app can sign in again.
---
