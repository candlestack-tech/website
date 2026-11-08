---
title: Queue full
status: 409
summary: You have 20 backtests waiting already, the most your queue holds.
when:
  - A backtest is started or checked while 20 of yours wait already. Your backtests run one at a time, on a few run slots that all accounts share, so they can wait even while none of yours runs.
  - A sweep is started or checked that has more backtests than your queue has room for.
todo:
  - Wait retry_after_s seconds, about when one of your waiting backtests has started, then start this one again.
  - Or cancel a waiting backtest you no longer need.
  - For a sweep, wait until room is as large as count, cancel some, or vary fewer values.
fields:
  - name: limit
    description: The most backtests that can wait in your queue.
  - name: retry_after_s
    description: Seconds until a waiting backtest of yours has likely started, from how long your last runs took.
  - name: Retry-After
    description: Header with the same seconds.
  - name: count
    description: Only for a sweep. How many backtests the sweep has.
  - name: room
    description: Only for a sweep. How many places in your queue are free.
---
