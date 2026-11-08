---
title: Instrument does not fit the model
status: 422
summary: The model reads candles of other trading hours than the instrument has.
when:
  - A model that reads candles of US trading hours is run on a crypto pair.
  - A model that reads candles around the clock is run on a stock.
todo:
  - Choose an instrument of the model's market. A model of US trading hours runs on stocks, a model of candles around the clock on crypto pairs.
  - Or choose a model whose manifest reads the hours of the instrument.
fields:
  - name: session
    description: The session the model's manifest reads, regular (US trading hours) or 24/7.
  - name: market
    description: The market of the instrument, stock or crypto.
  - name: setup
    description: Only for a sweep. The place of the setup in the sweep, from 1.
---
