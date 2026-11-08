---
title: Backtest limit reached
status: 409
summary: Your account keeps 2,000 backtests at most, and this start would pass that.
when:
  - A backtest is started or checked while your account has 2,000 backtests. Failed and cancelled ones count too.
  - A sweep is started or checked that would take your account past 2,000 backtests.
todo:
  - Delete old backtests you no longer need, in the app or with the MCP tool delete_backtests, then start this one again.
  - For a sweep, delete at least as many as detail says, or vary fewer values.
fields:
  - name: limit
    description: The most backtests an account keeps.
  - name: count
    description: The backtests your account has now.
  - name: adding
    description: Only for a sweep. How many backtests the sweep has.
---
