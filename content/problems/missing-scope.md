---
title: Missing scope
status: 403
summary: The API key or connected app works, but it does not have the scope this request needs.
when:
  - A key with only read starts a backtest, uploads a model or publishes a backtest.
  - Any change the key has no scope for, like renaming a model without models.
  - An app connected with OAuth calls a tool whose scope was unticked on the consent page.
todo:
  - Create a key with the scope the scope field names, in Settings, API and MCP.
  - For a connected app, disconnect it in Settings, API and MCP, connect it again from the app and tick that scope before you choose Allow.
  - Give each key and app only the scopes it needs.
fields:
  - name: scope
    description: The scope the request needs, read, backtests, models or publish.
---
