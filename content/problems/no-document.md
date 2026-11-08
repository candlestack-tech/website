---
title: No result document
status: 409
summary: The backtest is test data from before backtests ran in the app, so it has no result document.
when:
  - The result document of such a test backtest is asked for.
  - Such a test backtest is compared with others.
  - Such a test backtest is published.
todo:
  - Run a new backtest with the same setup to get results you can read, compare and publish.
  - In a comparison, leave out the backtest that id names.
fields:
  - name: id
    description: Only for a comparison. The ID of the test backtest.
---
