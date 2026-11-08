---
title: Too many API keys
status: 409
summary: You have 10 API keys that work, the most you can have.
when:
  - A new key is created while 10 keys are neither revoked nor expired.
todo:
  - Revoke a key you no longer use in Settings, API and MCP, then create the new one.
fields:
  - name: limit
    description: The most keys that can work at the same time.
---
