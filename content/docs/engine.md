---
title: How a backtest runs
nav: Backtest engine
description: The exact rules of a backtest, candle by candle. What the model sees, when a signal trades, at which price, what each setting does and what is not modelled.
section: concepts
order: 0
updated: 2026-11-09
---

## In short

A backtest answers one question: had you traded on the model's predictions, what would have happened? It runs five steps.

1. **Candles**

   The candles of the instrument for the period, plus the earlier candles the model needs to build its first input (the warm-up).

2. **Predictions**

   The model gets one sample per candle, built from that candle and earlier ones only, and gives one score for it.

3. **Signal**

   The decision steps turn the scores into a signal per candle: +1 long, 0 flat or -1 short.

4. **Trades**

   The engine goes through the candles once, from the first to the last, and trades when the signal changes.

5. **Metrics**

   The trades and the equity curve give the 12 [metrics](/docs/metrics/).

The steps are deterministic. The same candles, predictions and settings always give the same trades and the same numbers, to the last bit.

## One candle, step by step

Take candle `t`. Its `ts` is its open time, and it ends one timeframe later (for stocks, at the latest at the session close).

| When | What happens |
| --- | --- |
| Candle `t` closes | The candle is final. The model's sample for `t` is built from candle `t` and earlier candles. |
| Right after | The model's score for `t` goes through the decision steps and gives the signal of `t`. |
| | Only a change is a decision: when the signal of `t` differs from the signal of `t - 1`, the position moves to the new signal. Otherwise nothing happens. |
| With `fill: next_open` (the default) | The decision fills at the open of the next candle that exists. |
| With `fill: signal_close` | The decision fills at the close of `t`, the same close the model just saw. This is optimistic: a live run cannot trade at a price it needs to make the decision. |

For example, with 30-minute AAPL candles: the candle of 10:00 New York closes at 10:30. Its score and signal are known then. With `next_open` a change fills at the open of the 10:30 candle. If the 10:00 candle were the last of the session, it would fill at the next session's first open.

### The order within one candle

On every candle the engine does these steps, always in this order.

1. **Fill the order** With `next_open`, the decision of the candle before fills at this candle's open.
2. **Check the stop** If a position is open and has a [stop loss](#stop-loss), its level is checked against this candle.
3. **Act on the signal** If the signal changed, the decision is made. With `signal_close` it fills at this candle's close. With `next_open` it becomes the order for the next candle.
4. **Mark the equity** An open position is valued at this candle's close. A position worth 0 or less is closed there ([ruin](#ruin)).
5. **Check the drawdown stop** With a [drawdown stop](#drawdown-stop), the equity is compared with its highest level so far.

So the stop comes before the signal of the same candle. If a candle hits the stop and also changes the signal, the stop closes the position first, and the change then acts on a flat position: a change to the other side opens that side.

### The rules that follow

- **The first candle opens nothing.** It only sets the starting signal. A model that is long from the first candle and never changes never trades.
- **No buy back after a stop.** After a stop, only the next change of the signal opens a position again. A signal that stays at +1 after its long was stopped out does not buy again.
- **A flip is two trades.** From +1 to -1 or back, the position is closed and the new one opened at the same price. Each leg pays its fee and slippage, and each shows as its own trade.
- **The last candle opens nothing.** A change on the last candle opens no position. With `signal_close` it can still close one (reason `signal`). With `next_open` its order is never filled. An order from the candle before the last still fills at the last open.
- **The end of the period closes everything.** A position still open after the last candle is closed at the last close, with its fee and slippage, reason `end`. It counts as a trade in every metric.

## Positions

- **One position at a time** Long (+1), short (-1) or flat (0). There is no pyramiding and no partial exit.
- **Shorts** Allowed unless `decision.long_only` is `true`, which turns every -1 into 0. A short has no borrow fee, no locate and no margin call. Only [ruin](#ruin) limits it.
- **Size** A position takes `execution.position_size` of the capital when it opens, `1.0` by default, and keeps that share until it exits. The rest stays as cash that earns nothing. There is no leverage: the share is at most 1.
- **Compounding** The capital starts at 1.0. After each trade it is multiplied by `1 + return`, so the next position's size follows the capital.
- **Equity** A candle's equity is the capital after all of the candle's fills, with an open position marked at the candle's close. The entry fee is already in it, the exit's fee and slippage are not yet.

The mark of an open position, with `f` the position size, `fee` the fee as a fraction, `side` +1 or -1 and `entry` the entry price with slippage:

```text
equity = capital * (1 + f * side * (close / entry - 1) - f * fee)
```

## What the model can and cannot see

A backtest looks ahead when a decision or a fill uses a price that was not known yet. Here is what prevents it, and what does not.

- **The model sees closed candles up to `t`.** Each sample is built from candles up to and including candle `t`, and its score goes to candle `t`. Every block of the [manifest](/docs/manifest/) uses only candles up to the one it computes: no centered windows, no statistics over the whole series. Normalization uses numbers from the manifest, never from the backtest's own data.
- **The decision steps use the past only.** Calibration and EMA use the scores up to `t`. Confirmation and minimum hold use the signal up to `t`. K-means fits on scores before the row it is used on, never on the row itself.
- **The fill comes after the decision.** With `next_open` an order decided on candle `t` fills at the open of the next candle, before that candle's high, low and close are looked at.
- **The engine reads one candle at a time.** On a candle it reads only that candle's prices and signal, and what it carries from earlier candles: the capital, the position, its entry price and stop level, the peak of the equity and an order.

What CandleStack cannot check:

- **How the model was trained.** A model trained on the same period it is tested on has seen the answers. The engine cannot tell. Test on a period after the training data.
- **`signal_close`** fills at the close the model just saw. Use `next_open` for results a live run could reach.
- **Adjusted stock prices.** Stock prices are adjusted for splits and dividends over the whole history. A past candle you see today was adjusted with corporate actions that happened after it.

## The data

- **Stocks** US stocks and ETFs from Alpaca's consolidated feed (SIP), regular session only: 09:30 to 16:00 New York, 13:00 on early-close days, no session on holidays. Pre-market and after-hours trades are not in the candles. Bins start at the session open, and the last one can be shorter than the timeframe.
- **Crypto** Binance spot pairs, 24 hours a day, every day. Bins are aligned to UTC.
- **Nights, weekends and holidays** A stock position stays open over them. With `next_open`, a decision on the last candle of a session fills at the next session's first open. A price gap overnight can jump past a stop: then the position exits at the open (reason `gap`).
- **Daily stock candles** A `1d` stock candle is the day as the exchanges report it: its open and close are the official opening and closing auction prices.
- **Missing candles** A candle the source did not deliver is never filled in or interpolated. It is not a row: the engine goes from the candle before to the candle after, and an order waits for the next candle that exists. The model's input does not fill it either.
- **A candle without its own prediction** repeats the previous prediction, so no new decision follows. `data.align.candles_without_prediction` in the [result](/docs/backtest-json/#data) counts them.
- **Splits and dividends** Stock prices are adjusted backwards for splits and dividends, so a dividend shows as a smaller drop in the price, not as a cash payment. When the source adjusts old prices again, the candles' fingerprint changes and the result says so (`data.changed`).
- **The period** `[start, end)` in UTC epoch seconds. The engine runs on the candles of the period from the first that has a prediction to the last. Only closed candles exist, so a period that ends now stops at the last closed candle. Stock data is 15 minutes behind. A period plus its warm-up can have at most 50,000 candles ([too-many-candles](/problems/too-many-candles/)).
- **Instrument and model** A model of `regular` session candles runs on stocks, a model of `24/7` candles on crypto ([instrument-not-for-model](/problems/instrument-not-for-model/)). The timeframe is always the model's.

### Not modelled

- Volume and liquidity: every order fills in full at its price, whatever its size. Volume is ignored.
- Market impact, partial fills, latency and order types other than these two fills.
- Borrow fees and short availability, financing, margin and leverage.
- Interest on cash, dividends as cash and taxes.
- Trading halts beyond the candles they leave out.
- The path inside a candle: the engine knows only its open, high, low and close.
- Take profit, trailing stops and limit orders. The only exits are the signal, the stop loss, the drawdown stop, ruin and the end of the period.
- More than one instrument or more than one position in one run.

## Decision steps

The steps turn the model's scores into the signal, in this order. The rule always runs, `long_only` is `true` or `false`, and the other steps are off (`null`) unless you set them.

1. **Calibrate** (`decision.calibrate`) Rescale each score from its recent past.
2. **Smooth** (`decision.ema`) An exponential moving average of the scores.
3. **Rule** (`decision.rule`) One rule makes the signal: `threshold`, `hysteresis` or `kmeans`.
4. **Long only** (`decision.long_only`) -1 becomes 0.
5. **Confirm** (`decision.confirm`) A new value counts only once it held for some candles.
6. **Minimum hold** (`decision.min_hold`) A new position is kept for some candles.

| Step | Parameter | Range | Default |
| --- | --- | --- | --- |
| `calibrate` | `name` | `zscore` or `rank` | off |
| | `window` | whole number, 2 to 1,000 | |
| `ema` | `span` | whole number, 1 or more | off |
| `rule` `threshold` | `limit` | 0 or more | the rule, with `limit` 0 |
| `rule` `hysteresis` | `enter` | 0 or more | |
| | `exit` | 0 or more, at most `enter` | |
| `rule` `kmeans` | `k` | whole number, 2 to 5 | |
| | `window` | whole number, `2 * k` to 5,000 | |
| | `refit_every` | whole number, at least 1 and at least `window / 20` | |
| `long_only` | | `true` or `false` | `false` |
| `confirm` | `candles` | whole number, 1 or more | off |
| `min_hold` | `candles` | whole number, 1 or more | off |

These are the defaults of the API when a field is left out. The app and `get_backtest_defaults` start from your own defaults instead, see [Defaults](#defaults).

The steps run on the candles of the period only. So their own warm-up falls inside the period: the first `window - 1` candles of a calibration and the first `window` candles of k-means give 0 (flat), and an EMA starts at the period's first score.

### Calibrate

Models score on different scales: one stays within ±0.4, another reaches ±5. Calibration expresses each score relative to the `window` scores that end at it (the score itself included), so one limit fits every model.

- `zscore` The score in standard deviations from the mean of its window: `(p - mean) / std`, with the sample standard deviation (ddof 1). A window without spread gives 0.
- `rank` Where the score ranks in its window, from -1 (the smallest) to +1 (the largest). With `below` the other scores of the window that are smaller and `equal` those equal to it, `r = (below + equal / 2) / (window - 1)` and the output is `2 * r - 1`. 0 means as many below as above.

With a window of 3:

| Score | -0.25 | 0.25 | 0.0 | 0.5 | 0.5 |
| --- | --- | --- | --- | --- | --- |
| `zscore` | 0.0 | 0.0 | 0.0 | 1.0 | 0.577 |
| `rank` | 0.0 | 0.0 | 0.0 | 1.0 | 0.5 |
| `threshold` at 1.0 of either | 0 | 0 | 0 | +1 | 0 |

### Smooth

`ema` with `alpha = 2 / (span + 1)`. The first value is the first score, then `e[t] = alpha * p[t] + (1 - alpha) * e[t-1]`. A span of 1 changes nothing.

### Threshold

The default rule. For each score `p`:

- +1 when `p > 0` and `p >= limit`
- -1 when `p < 0` and `p <= -limit`
- 0 otherwise

A score of exactly 0 is flat, even with `limit` 0. With `limit` 0.05:

| Score | 0.01 | 0.3 | -0.02 | -0.08 | 0.05 | 0.0 |
| --- | --- | --- | --- | --- | --- | --- |
| `threshold` | 0 | +1 | 0 | -1 | +1 | 0 |
| then `long_only` | 0 | +1 | 0 | 0 | +1 | 0 |

### Hysteresis

Two limits, so a score between them keeps the position it is in. It starts flat.

- **Flat** goes long when `p > 0` and `p >= enter`, short when `p < 0` and `p <= -enter`.
- **Long** stays long while `p > 0` and `p >= exit`. Otherwise it goes short when `p < 0` and `p <= -enter`, else flat.
- **Short** mirrors long.

With `exit` equal to `enter` it is `threshold`. With `enter` 0.1 and `exit` 0.05:

| Score | 0.0 | 0.12 | 0.07 | 0.03 | -0.04 | -0.11 | -0.06 | 0.02 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `hysteresis` | 0 | +1 | +1 | 0 | 0 | -1 | -1 | 0 |
| `threshold` at 0.1 | 0 | +1 | 0 | 0 | 0 | -1 | 0 | 0 |

### K-means

No limit: the scores are sorted into `k` groups by value, long in the highest group, short in the lowest, flat in between. With `k` 2 there is no flat group.

- The groups are a one-dimensional k-means on the `window` scores before a refit row. Refits happen at rows `window`, `window + refit_every`, and so on, counted from the period's first candle. Each row uses the latest fit, made on scores before it.
- The fit is deterministic: the centers start at the quantiles `(i + 0.5) / k` of the window's values, then move to the means of their groups until the groups stop changing, at most 100 rounds. A score goes to the nearest center, a tie to the lower one.
- The first `window` rows have no fit and give 0. A window whose scores are all equal gives 0 while its fit is used.

With `k` 3, `window` 6 and `refit_every` 100, the first six scores form groups around 1, 5 and 9:

| Score | 1 | 5 | 9 | 9 | 1 | 5 | 0.5 | 4.0 | 9.5 | 3.0 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `kmeans` | 0 | 0 | 0 | 0 | 0 | 0 | -1 | 0 | +1 | -1 |

3.0 is exactly between the centers 1 and 5, and a tie goes to the lower group.

### Confirm

A new value of the signal counts only once it held for `candles` candles in a row. Until then the last counted value stays. The first candle counts at once. With `ema` span 3, `threshold` 0.05, `long_only` and `confirm` 2, the long opens one candle late and closes one candle late:

| Score | 0.0 | 0.2 | 0.2 | -0.2 | -0.2 | -0.2 |
| --- | --- | --- | --- | --- | --- | --- |
| `ema` | 0.0 | 0.1 | 0.15 | -0.025 | -0.1125 | -0.15625 |
| `threshold` | 0 | +1 | +1 | 0 | -1 | -1 |
| `long_only` | 0 | +1 | +1 | 0 | 0 | 0 |
| `confirm` | 0 | 0 | +1 | +1 | 0 | 0 |

### Minimum hold

When the signal changes to +1 or -1 on candle `r` (an entry or a flip), it stays there through candle `r + candles - 1`, whatever comes in. Then it follows its input again. Going flat starts no hold, and neither does the first candle. With `candles` 3:

| Input | 0 | +1 | 0 | -1 | -1 | +1 |
| --- | --- | --- | --- | --- | --- | --- |
| `min_hold` | 0 | +1 | +1 | +1 | -1 | -1 |

The engine does not know about the hold: a stop loss still closes a held position. The run then stays flat at least until the hold ends, and opens again only on the next change.

## Execution settings

| Setting | Meaning | Range | Default |
| --- | --- | --- | --- |
| `fill` | When a decision fills: `next_open` at the next candle's open, `signal_close` at the close of the candle that made it. | `next_open`, `signal_close` | `next_open` |
| `stop_loss` | The loss that closes a position, as a fraction of its entry price: `0.05` is 5%. | above 0, below 1, or `null` | `null`, no stop |
| `drawdown_stop` | The fall of the equity from its highest level so far that halts the run, as a fraction of that level. | above 0, below 1, or `null` | `null` |
| `position_size` | The share of the capital a position takes when it opens. | above 0, at most 1 | `1.0` |
| `fee_bps` | The fee of each leg, in basis points of its value. | 0 or more | `0` |
| `slippage_bps` | How far each fill lands from its price, against the trade, in basis points. | 0 or more | `0` |

A basis point (bps) is 0.01%: 10 bps is a factor of 0.001.

### Stop loss

- **The level** comes from the entry price with slippage: `entry * (1 - side * stop_loss)`. Below the entry for a long, above it for a short.
- **A gap** On a candle the position already held at its open: if the open is at or beyond the level, the position exits at that open, reason `gap`. That price is worse than the level.
- **A touch** Otherwise, if the candle's low (long) or high (short) reaches the level, the position exits at the level, reason `stop`. Touching counts.
- **The entry candle** A `next_open` position opened at this candle's open can only exit by a touch on it, as its open is the entry. A `signal_close` position is first checked on the next candle.
- **Inside a candle** The engine does not know whether the low or the high came first. It assumes the stop was hit whenever the low or high reached it.

There is no take profit and no trailing stop.

### Drawdown stop

A limit on the whole run, off by default.

- The peak is the highest equity recorded so far, the starting 1.0 included. Equity is recorded at the closes, so the highs and lows inside a candle do not count, and a position can lose more than `drawdown_stop` within a candle.
- When a candle's equity, after its fills, its mark and the ruin check, is at or below `peak * (1 - drawdown_stop)`, the run halts. A position still open closes at that close with its exit costs, reason `drawdown`.
- After the halt nothing opens again, an order already decided included. Every later candle is flat and its equity stays the capital.
- With `signal_close`, a position does not open at a close where the capital is already at or below the level after a stop or the closing leg of a flip.

### Ruin

The capital cannot go below 0. When the equity of an open position, marked at a candle's close, is 0 or less, the position closes at that close, reason `ruin`. When a trade's return is -1 or less, for example a gap far through the stop, nothing is left either. Either way the capital becomes 0, nothing opens again and every later equity is 0. Without a stop, a short of the whole capital is ruined once its price about doubles; at a size `f`, once it reaches about `1 + 1 / f` times its entry.

### Fees and slippage

With `fee = fee_bps / 10000`, `s = slippage_bps / 10000`, `f = position_size` and `side` +1 (long) or -1 (short):

| What | Formula |
| --- | --- |
| Entry price | `entry = price * (1 + side * s)`, where `price` is the open (`next_open`) or the close (`signal_close`) |
| Exit price | `exit = price * (1 - side * s)`, where `price` is the decision's fill price, the stop level, the gap's open or the close, by exit reason |
| Stop level | `entry * (1 - side * stop_loss)`, from the entry with slippage |
| Growth | `g = exit / entry` |
| Trade return | `return = f * (side * (g - 1) - fee * (1 + g))` |
| Trade fees | `fees = f * fee * (1 + g)` |
| Slippage cost | `slippage_cost = f * side * (price_exit / price_entry - g)`, with the prices before slippage |
| Capital after | `capital * (1 + return)` |

- **The fee** is a commission on each leg: `fee` of the position's value at entry, and `fee` of its value at exit. It never changes a price.
- **Slippage** is a worse price, nothing else. It shows in the prices, the return and `slippage_cost`, never in `fees`.
- `fees + slippage_cost` is the whole cost of a trade: the return without costs, `f * side * (price_exit / price_entry - 1)`, minus the return.
- All three are fractions of the capital before the trade.

## Defaults

A field you leave out of `POST /api/v1/backtests` or `start_backtest` takes the API's default. The app's builder starts from your backtest defaults, which you set in Settings and an agent reads with `get_backtest_defaults`.

| Setting | API default | App default, until you change it |
| --- | --- | --- |
| Rule | `threshold`, `limit` 0 | `threshold`, `limit` 0.05 (0 to 0.5 in steps of 0.01) |
| Direction | long and short (`long_only` `false`) | long only (`long_only` `true`) |
| Calibrate, EMA, confirm, minimum hold | off | off |
| Fill | `next_open` | `next_open` |
| Stop loss | none | 7% (`0.07`), a whole percent from 1 to 20 |
| Drawdown stop | none | none |
| Position size | `1.0` | `1.0` |
| Fee | 0 | 0.1% per leg (`fee_bps` 10), 0% to 5% |
| Slippage | 0 | 0.02% (`slippage_bps` 2), 0% to 5% |
| Benchmark | none | buy and hold of the backtest's instrument |
| Period | required | 2021-01-04 to 2024-12-31 |

`get_backtest_defaults` answers them in the API's units too, so an agent can pass them through for every setting the user does not name.

## Worked example

Five 30-minute AAPL candles from 2024-06-03 13:30 UTC (09:30 in New York), a 5% stop loss and a 10 bps fee, no slippage. The decision steps gave this signal: long from the second candle on.

| Row | `ts` | open | high | low | close | signal |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 1717421400 | 100 | 101 | 99 | 100 | 0 |
| 1 | 1717423200 | 100 | 102 | 99.5 | 101 | +1 |
| 2 | 1717425000 | 102 | 104 | 101 | 103 | +1 |
| 3 | 1717426800 | 99 | 99.5 | 96 | 97 | +1 |
| 4 | 1717428600 | 97 | 98 | 96.5 | 98 | +1 |

With `fill: next_open`:

| Row | What happens | `position` | `equity` |
| --- | --- | --- | --- |
| 0 | The first candle sets the starting signal, 0. | 0 | 1 |
| 1 | The signal changes from 0 to +1: an order for the next open. | 0 | 1 |
| 2 | The order fills at the open: long at 102. Stop level `102 * 0.95 = 96.9`. On its entry candle only a touch counts, and the low, 101, is above it. | 1 | `1 + (103 / 102 - 1) - 0.001 = 1.008804` |
| 3 | The open, 99, is above the level, so no gap. The low, 96, reaches it: out at 96.9 (`stop`). | 0 | `1 + return = 0.94805` |
| 4 | The signal is still +1, which is no change: no new long. | 0 | 0.94805 |

The trade's return is `96.9 / 102 - 1 - 0.001 * (1 + 96.9 / 102) = -0.05 - 0.00195 = -0.05195`, and its `fees` are 0.00195. The [result document](/docs/backtest-json/#example) shows this run, and [Metrics](/docs/metrics/#worked-example) its metrics.

With `fill: signal_close` the same signal fills at the close of row 1, 101. The stop level is `101 * 0.95 = 95.95`. The low of row 3, 96, stays above it, so the long is still open after the last candle and closes at the last close, 98 (`end`). Its return is `98 / 101 - 1 - 0.001 * (1 + 98 / 101) = -0.031673`, and the equity is 1, 0.999, 1.018802, 0.959396, 0.968327.

With `next_open` and 10 bps of slippage as well:

- Entry: `102 * 1.001 = 102.102`.
- Stop level: `102.102 * 0.95 = 96.9969`, from the slipped entry.
- The low of row 3 reaches it: exit at `96.9969 * 0.999 = 96.8999031`.
- Return: `96.8999031 / 102.102 - 1 - 0.001 * (1 + 0.94905) = -0.05289905`.
- `fees`: 0.00194905, a little less than without slippage, because the exit leg is worth less.
- `slippage_cost`: `96.9969 / 102 - 96.8999031 / 102.102 = 0.0019`.
- Equity: 1, 1, 1.007795, 0.947101, 0.947101.

## Next

- [Metrics](/docs/metrics/) How each of the 12 metrics is computed and how to read it
- [Sweeps and comparing](/docs/sweeps/) Run a grid of backtests and rank them
- [Backtest JSON](/docs/backtest-json/) Every field of the result document
- [Manifest](/docs/manifest/) How a model's input is built from the candles
