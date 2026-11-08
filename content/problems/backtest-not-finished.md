---
title: Backtest not finished
status: 409
summary: The backtest has not finished, so it has no results to download or publish.
when:
  - A backtest is downloaded while it waits in the queue or runs.
  - A failed backtest is downloaded. It has no results.
  - A backtest that has not finished is published. Only a finished backtest can be published.
todo:
  - Wait until it has finished, then download or publish it. On the MCP server wait_for_backtest waits for it.
  - A failed backtest never gets results. Fix what its error says and start a new one.
---
