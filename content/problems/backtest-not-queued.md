---
title: Backtest not queued
status: 409
summary: Only a backtest that waits in the queue can be cancelled, and this one does not wait anymore.
when:
  - A backtest is cancelled after it started running.
  - A backtest is cancelled after it finished or failed.
todo:
  - Let a running backtest finish. Rename it or delete it once it has ended, if you do not need it.
---
