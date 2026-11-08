---
title: Scope not requested
status: 422
summary: The consent grants a scope the app did not ask for, so it cannot be granted.
when:
  - The decision on the consent page names a scope that is not among the scopes the app asked for.
todo:
  - Allow only scopes the app asked for. Read is always granted.
  - If the app needs another scope, it has to ask for it when it connects. Tell its maker.
fields:
  - name: scope
    description: The scope that was not asked for, backtests, models or publish.
---
