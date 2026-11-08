---
title: Model needs a manifest
status: 409
summary: The model has no manifest yet, so CandleStack cannot build its input.
when:
  - A backtest or a sweep is started or checked with a model that has no manifest.
todo:
  - Add a manifest on the Models page, or with set_manifest on the MCP server, then start the backtest again.
fields:
  - name: setup
    description: Only for a sweep. The place of the setup in the sweep, from 1.
---
