---
title: Not enough candles before the period
status: 422
summary: The period starts too early for the candles the model needs before it.
when:
  - A backtest or a sweep is started or checked with a period whose start leaves fewer candles before it than the model needs. detail says how many it needs.
todo:
  - Set start to earliest_start or later. detail gives it as a date too.
  - Without earliest_start the first candle is not known. Move start later and try again.
fields:
  - name: instrument
    description: The instrument of the backtest.
  - name: timeframe
    description: The timeframe the model reads.
  - name: candles
    description: How many candles the model needs before the start of the period.
  - name: earliest_start
    description: The first start, in epoch seconds, with enough candles before it. null when the first candle is not known.
  - name: setup
    description: Only for a sweep. The place of the setup in the sweep, from 1.
---
