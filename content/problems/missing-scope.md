---
title: Missing scope
status: 403
summary: The API key works, but it does not have the scope this request needs.
when:
  - A key with only read starts a backtest, uploads a model or publishes a backtest.
  - Any change the key has no scope for, like renaming a model without models.
todo:
  - Create a key with the scope the scope field names, in Settings, API and MCP.
  - Give each key only the scopes its script needs.
fields:
  - name: scope
    description: The scope the request needs, read, backtests, models or publish.
---
