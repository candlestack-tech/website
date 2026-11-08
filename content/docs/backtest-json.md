---
title: The backtest result JSON
nav: Backtest JSON
description: What each field of a backtest's result document means, in which unit, and how every metric is computed.
section: formats
order: 1
updated: 2026-11-09
---

## What the result document is

A backtest as one JSON document. The app shows it, the API returns it and Download JSON saves it, all in one shape. Only the two long tables differ.

| Use | Route | Series | Trades |
| --- | --- | --- | --- |
| the page, the API | `GET /api/v1/backtests/{id}`, any status (`results` is `null` until it finishes) | light | light |
| the download | `GET /api/v1/backtests/{id}/download`, an attachment. `409 backtest-not-finished` before it finishes | every row | every trade |

The light view keeps the page fast:

- **Series** of more than 10,000 rows become one point per UTC day: the day's last `close`, `position`, `equity` and benchmark equity, and its lowest `drawdown`, at the `ts` of the day's last candle. These are the days Sharpe and Sortino are computed from, so the chart and the metrics agree, and the lowest point is `max_drawdown`. `prediction` and `signal` are left out, and `series.resolution` is `day` instead of `candle`.
- **Trades** above 10,000 keep the newest 10,000. `count` is how many are in the document, `total` how many the run had, and `complete` is `false`.

A 10-year run of 30-minute stock candles is about 4 MB as a download (1.4 MB compressed), a 10-year crypto run about 21 MB (7.6 MB compressed). The light view stays under 2 MB.

### Built on request

The engine is deterministic: the same candles, predictions and settings give the same bytes. So a backtest stores its setup, the model's predictions, the 12 metrics, the curves of the light series and a fingerprint of its candles. The series, the trades and the document itself are built again when they are asked for, well under a second.

A data source can re-adjust old prices, after a split or a dividend. Then the candles' fingerprint differs, the document says so (`data.changed` is `true`) and is built from the candles as they are now, so its `results.stats` can differ from the stored ones.

## Conventions

- **Tables are columns** `{"ts": [...], "equity": [...]}`. Index `i` of every array is one row. The column names are the engine's.
- **Market time** Every `ts`, `*_ts`, `start` and `end` is integer UTC epoch seconds of a candle's open. Ranges are `[start, end)`.
- **Wall-clock time** `created_at`, `finished_at` and the other `*_at` fields are ISO 8601 UTC.
- **Fractions** Returns, fees, drawdown and exposure are fractions: `0.05` is 5%. `equity` is a multiple of the starting capital, 1.0 at the start. Prices are in `data.instrument.currency`.
- **Drawdown is negative** `max_drawdown` of `-0.06` is 6% below the peak, as the app shows it.
- **Yearly ratios** Sharpe and Sortino are yearly with `metrics.periods_per_year`: 252 for stocks, 365 for crypto, which trades every day.
- **No rounding** Numbers are not rounded. A value that is not finite is `null`, never NaN, so the document is always valid JSON.
- **No private data** The only person the document names is its author, by public user ID and display name. It holds no email and no key.

## Example

The engine's worked example as a document: five 30-minute AAPL candles from 2024-06-03 13:30 UTC (09:30 in New York), filled at the next open, with a 5% stop and 10 bps fees. The model goes long on the second candle. The order fills at the next open, 102, and the stop at 96.9 closes the trade on the fourth candle. The `//` comments are notes here, not part of the format.

```jsonc title="Result document"
{
  "version": 1,
  "backtest": {
    "id": "bt_7f3k2m9qx4",
    "name": "Silent Orion", "generated_name": "Silent Orion",     // the user's own name, else the generated one
    "number": 12,
    "author": {"id": "usr_7f3k2m9qx4", "name": "Sample User", "mine": true},   // never the email
    "public": false, "published_at": null,                        // published in Experiments, and when
    "status": "finished",                                         // queued, running, finished or failed
    "queue_position": null,                                       // 1 starts next, while it is queued
    "sweep_id": null,                                             // the sweep that started it, if one did
    "created_at": "2026-10-25T14:02:11Z", "started_at": "2026-10-25T14:02:11Z",
    "finished_at": "2026-10-25T14:04:53Z",
    "duration_s": 162.0, "error": null,                           // seconds from started_at
    "steps": [                                                    // in their order, while it runs and after
      {"id": "candles", "state": "done", "started_at": "2026-10-25T14:02:11Z", "duration_s": 157.0,
       "loaded": 2, "total": 2, "cached": 0, "loaded_until": "2024-06-03", "candles": 29,
       "from_cache": false, "waiting_until": null, "load_s": null, "input_s": null, "predict_s": null},
      {"id": "queue", "state": "done", "started_at": "2026-10-25T14:04:48Z", "duration_s": 1.0,
       "loaded": null, "total": null, "cached": null, "loaded_until": null, "candles": null,
       "from_cache": null, "waiting_until": null, "load_s": null, "input_s": null, "predict_s": null},
      {"id": "model", "state": "done", "started_at": "2026-10-25T14:04:49Z", "duration_s": 3.0,
       "loaded": null, "total": null, "cached": null, "loaded_until": null, "candles": null,
       "from_cache": null, "waiting_until": null, "load_s": 1.2, "input_s": 0.1, "predict_s": 0.5},
      {"id": "trades", "state": "done", "started_at": "2026-10-25T14:04:52Z", "duration_s": 1.0,
       "loaded": null, "total": null, "cached": null, "loaded_until": null, "candles": null,
       "from_cache": null, "waiting_until": null, "load_s": null, "input_s": null, "predict_s": null}
    ]
  },
  "software": {
    "engine_version": "0.4.0", "app_version": "2026.10.24-3f2a1c9",
    "runner": {"format": "keras", "keras": "3.15.1", "backend": "jax 0.7.2"}
  },
  "model": {
    "id": "mdl_k2m9qx47f3", "name": "raw-candles.keras", "framework": "keras",
    "sha256": "9b1e04c7…", "size_bytes": 48213,
    "manifest": {"version": 1, "input": {"…": "…"}, "signature": {"…": "…"}}   // as stored with the run
  },
  "data": {
    "instrument": {"id": "stock:AAPL", "market": "stock", "symbol": "AAPL", "name": "Apple Inc.",
                   "exchange": "NASDAQ", "source": "alpaca", "feed": "sip", "currency": "USD"},
    "timeframe": "30m", "timeframe_seconds": 1800, "session": "regular",
    "period": {"start": 1717372800, "end": 1717459200},
    "loaded": {"start": 1717081200, "end": 1717430400, "count": 29, "fingerprint": "sha256:3b1f…", "gaps_total": 0},
    "changed": false,
    "warm_up": {"candles": 24, "kind": "exact", "dropped": 24},
    "rows": {"first_ts": 1717421400, "last_ts": 1717428600, "count": 5},
    "predictions": {"count": 5, "sha256": "e1aa90d2…"},
    "align": {"predictions_without_candle": 0, "candles_without_prediction": 0}
  },
  "decision": {"calibrate": null, "ema": null, "rule": {"name": "threshold", "limit": 0.05},
               "long_only": false, "confirm": null, "min_hold": null},
  "execution": {"fill": "next_open", "stop_loss": 0.05, "drawdown_stop": null,
                "position_size": 1.0, "fee_bps": 10.0, "slippage_bps": 0.0},
  "benchmarks": [{"id": "bh", "kind": "buy_and_hold", "instrument": "stock:AAPL"}],
  "metrics": {"periods_per_year": 252, "risk_free_rate": 0.0},
  "results": {                                                    // null unless finished
    "stats": {"total_return": -0.05195, "max_drawdown": -0.060224, "sharpe": null, "sortino": null,
              "num_trades": 1, "win_rate": 0.0, "avg_trade_return": -0.05195,
              "best_trade_return": -0.05195, "worst_trade_return": -0.05195,
              "exposure": 0.2, "fees_paid": 0.00195, "buy_and_hold_return": -0.02},
    "benchmarks": {"bh": {"total_return": -0.02}},
    "series": {
      "resolution": "candle", "count": 5,
      "columns": {
        "ts":         [1717421400, 1717423200, 1717425000, 1717426800, 1717428600],
        "close":      [100.0, 101.0, 103.0, 97.0, 98.0],
        "prediction": [0.01, 0.3, 0.2, 0.1, 0.4],
        "signal":     [0.0, 1.0, 1.0, 1.0, 1.0],
        "position":   [0.0, 0.0, 1.0, 0.0, 0.0],
        "equity":     [1.0, 1.0, 1.008804, 0.94805, 0.94805],
        "drawdown":   [0.0, 0.0, 0.0, -0.060224, -0.060224]
      },
      "benchmarks": {"bh": [1.0, 1.01, 1.03, 0.97, 0.98]}
    },
    "trades": {
      "count": 1, "total": 1, "complete": true,
      "columns": {
        "signal_ts": [1717423200], "open_ts": [1717425000], "close_ts": [1717426800],
        "side": [1], "open_price": [102.0], "close_price": [96.9], "stop_price": [96.9],
        "exit_reason": ["stop"], "return": [-0.05195], "fees": [0.00195],
        "slippage_cost": [0.0], "candles_held": [1]
      }
    }
  }
}
```

## Fields

The groups follow the steps of the app's backtest builder. `model`, `data`, `decision`, `execution` and `benchmarks` together are what a new run needs, so to run a backtest again, send them back: `POST /api/v1/backtests` takes them and ignores the groups' other fields.

Until a backtest finished, its document has the setup only. `results` is `null`, and so are `software.runner`, `data.loaded`, `data.changed`, `data.rows`, `data.predictions`, `data.align` and `data.warm_up.dropped`.

### Backtest

| Field | Meaning |
| --- | --- |
| `id` | The backtest's ID. |
| `name` | What the user calls it: their own name after a Rename, else the generated one. |
| `generated_name` | The name it got when it was created. |
| `number` | The user's own number, shown as #N. |
| `author.id` | Public ID of the author's account. |
| `author.name` | The account's display name, never its email. |
| `author.mine` | `true` when it is the signed-in user's own backtest. Another account's backtest is shown only while it is published, read only. |
| `public` | Published in Experiments. |
| `published_at` | When it was published. `null` while it is not. |
| `status` | `queued` (it waits its turn, see `queue_position`), `running`, `finished` (it has results) or `failed` (it has an error, also when it was cancelled before it ran). |
| `queue_position` | Where a queued backtest is in its author's queue: 1 starts next. A user's backtests run one at a time, and all accounts share a few run slots, so the one at 1 may still wait for a free slot. `null` for any other status. |
| `sweep_id` | The sweep it was started in. `null` for a backtest started alone, and for another user's. |
| `created_at` | When it was started, queued or not. |
| `started_at` | When it began to run. `null` while it is queued, and for one cancelled before it ran. |
| `finished_at` | When it finished or failed. |
| `duration_s` | Seconds it ran, from `started_at`, the wait in the queue left out. |
| `error` | What went wrong and what to do, for a failed one. |
| `steps` | The steps of the run in their order, while it runs and after, see below. Empty for a backtest that failed before steps were recorded. |

Each step:

| Field | Meaning |
| --- | --- |
| `id` | `candles` loads the candles with the warm-up, `queue` hands the job to the worker until a worker takes it, `model` is the worker's job (it loads the model, builds its input and predicts), `trades` runs the engine and the statistics and stores the result. |
| `state` | `pending` until it begins, `running`, `done` or `failed`. A step after a failed one stays `pending`, and the failed one's error is `backtest.error`. |
| `started_at` | When it began. `null` while pending or when unknown. |
| `duration_s` | Seconds it took, once done or failed. `null` while it runs, or when it is not known. |
| `loaded`, `total` | `candles` only: the chunks loaded so far and the chunks of the load (closed months or years, then days, as the source splits the period). |
| `cached` | `candles` only: of the chunks loaded, those that came from the cache. |
| `loaded_until` | `candles` only: the last day of the candles loaded so far (UTC). |
| `candles` | `candles` only, once done: the candles loaded. |
| `from_cache` | `candles` only, once done: every chunk came from the cache. |
| `waiting_until` | `candles` only: while the load waits for the market data source's request limit, when it goes on. |
| `load_s`, `input_s`, `predict_s` | `model` only, once done: seconds to load the model, to build its input and to predict. |

The fields after `duration_s` belong to one step each and are `null` for the others.

### Software

| Field | Meaning |
| --- | --- |
| `engine_version` | The backtest engine's version, now `0.4.0`. As the results are built on request, it is the version of the build. A new engine version does not change the format's `version`. |
| `app_version` | The app's version. |
| `runner` | What ran the model: its `format`, the `keras` version and the `backend` with its release. `null` until the worker answered. |

### Model

The model at run time.

| Field | Meaning |
| --- | --- |
| `id` | The model's ID. `null` once the model is deleted, and for another account's published backtest. |
| `name` | The file name when it ran. |
| `framework` | The model's framework, such as `keras`. |
| `sha256` | SHA-256 of the model file, hex. |
| `size_bytes` | The file's size in bytes. |
| `manifest` | The [manifest](/docs/manifest/) it ran with, as stored with the run. |

### Data

| Field | Meaning |
| --- | --- |
| `instrument` | The instrument: `id`, `market`, `symbol`, `name`, `exchange`, `source`, `feed` and `currency`, what the prices are in. |
| `timeframe`, `timeframe_seconds` | The candles' timeframe, and its length in seconds. |
| `session` | `regular` or `24/7`, from the model's manifest. |
| `period` | The user's dates: `start`, the first second of the test, and `end`, excluded. |
| `loaded` | The candles asked for, warm-up included: `start`, `end`, `count`, `fingerprint` and `gaps_total`. What the run stored. |
| `changed` | `true` when the candles' fingerprint differs from the run's: the source changed them since. |
| `warm_up.candles` | Candles the model needs before the period, loaded with it. Where an `estimate` fell short, the run loaded more, from `loaded.start`. |
| `warm_up.kind` | `exact` or `estimate`, see [the manifest's blocks](/docs/manifest/#blocks). |
| `warm_up.dropped` | The candles the model's input dropped at the start. |
| `rows` | What the engine ran on: `first_ts`, `last_ts` and `count`, from the build. |
| `predictions` | The stored predictions: their `count` and the `sha256` of their file, hex. |
| `align` | What did not match one to one, from the build: `predictions_without_candle`, and `candles_without_prediction` (gaps inside the rows). |

### Decision

How the predictions become a signal of -1 (short), 0 (flat) or +1 (long). Each step in the order applied, `null` when off.

| Field | Meaning |
| --- | --- |
| `calibrate` | `{"name": "zscore", "window": ...}`: each prediction in standard deviations from the mean of the `window` predictions ending at it. Or `{"name": "rank", "window": ...}`: where it ranks among them, from -1 to 1. |
| `ema` | `{"span": ...}`: the exponential moving average of the predictions, with `alpha = 2 / (span + 1)`. |
| `rule` | One rule that makes the signal, see below. |
| `long_only` | `true` for flat instead of short. |
| `confirm` | `{"candles": ...}`: a value counts only once it held this many candles in a row. |
| `min_hold` | `{"candles": ...}`: each new position is kept for at least this many candles. |

The rules:

- `threshold` `{"name": "threshold", "limit": ...}`: long at a prediction of `limit` or more, short at `-limit` or less, else flat.
- `hysteresis` `{"name": "hysteresis", "enter": ..., "exit": ...}`: a position opens at `enter` and closes below `exit`, which is at most `enter`.
- `kmeans` `{"name": "kmeans", "k": ..., "window": ..., "refit_every": ...}`: the `window` earlier predictions in `k` groups (2 to 5), long in the highest group, short in the lowest. `window` is at least `2 * k`, and a fit is used for `refit_every` rows.

A new run takes a calibration window of at most 1,000, and a k-means window of at most 5,000 with `refit_every` at least `window / 20`.

### Execution

How the engine fills orders and what they cost. A basis point (bps) is 0.01%: 10 bps is a factor of 0.001.

| Field | Meaning |
| --- | --- |
| `fill` | `next_open` (the default): a decision fills at the open of the next candle, what a live run can do. `signal_close`: at the close of the candle that made it, which is optimistic. |
| `stop_loss` | The loss that closes a position, as a fraction of its entry price, above 0 and below 1: `0.05` is 5%. `null` for no stop. |
| `drawdown_stop` | The fall of the equity from its highest level so far that halts the run, as a fraction of that level, above 0 and below 1. `null` for none. |
| `position_size` | The share of the capital a position takes when it opens, kept until it exits, above 0 and at most 1. Default `1.0`. |
| `fee_bps` | The fee of each leg, in basis points of its notional. |
| `slippage_bps` | How far each fill lands from its price, against the trade, in basis points. |

### Benchmarks

What the run is compared with, at most one.

| Field | Meaning |
| --- | --- |
| `id` | The benchmark's ID, usually `bh` for buy and hold of the backtest's own instrument. The app sends `spy`, `qqq` or `dia` for a fund. |
| `kind` | `buy_and_hold`. Later more. |
| `instrument` | The instrument held: the backtest's own, or for a stock backtest `stock:SPY`, `stock:QQQ` or `stock:DIA`. |

### Metric settings

The `metrics` group holds the arguments the statistics were computed with.

| Field | Meaning |
| --- | --- |
| `periods_per_year` | Scales Sharpe and Sortino to a year: 252 for stocks, 365 for crypto. |
| `risk_free_rate` | The risk-free rate, 0. |

### Results

`null` unless the backtest finished.

| Field | Meaning |
| --- | --- |
| `stats` | The 12 [metrics](#metrics), in their order. |
| `benchmarks` | Each benchmark's `total_return`, by its ID. For buy and hold of the backtest's instrument it is `stats.buy_and_hold_return`. For a fund it is the last value of its equity less 1, `null` when the fund has no price by the last row. |
| `series` | One row per candle, or per day in the light view, see below. |
| `trades` | One row per closed trade, see below. |

The series: `resolution` (`candle` or `day`), `count`, the `columns` and `benchmarks`, each benchmark's equity on the same rows by its ID.

| Column | Meaning |
| --- | --- |
| `ts` | The candle's open, UTC epoch seconds. |
| `close` | The candle's close. |
| `prediction` | The model's prediction. Left out of a series of days. |
| `signal` | The signal the engine traded on: -1, 0 or +1. Left out of a series of days. |
| `position` | The side held after the candle's fills: -1, 0 or +1. The last row is always flat. |
| `equity` | The capital after the candle's fills, an open position marked at the candle's close. The run starts with 1.0. |
| `drawdown` | `equity / peak - 1`, where the peak is the highest equity so far, the starting 1.0 included. 0 at a new high, -0.2 at 20% below the peak. |

A benchmark of the backtest's own instrument has each row's close over the first row's close as its equity. A fund's equity is its last close at or before each row's `ts` over its first such close, and 1.0 before the fund's first price.

The trades: `count`, `total`, `complete` and the `columns`, one value per trade in time order.

| Column | Meaning |
| --- | --- |
| `signal_ts` | `ts` of the candle whose signal change made the decision. |
| `open_ts` | `ts` of the candle the entry filled on. |
| `close_ts` | `ts` of the candle the exit filled on. |
| `side` | +1 long, -1 short. |
| `open_price` | The entry fill price, slippage included. |
| `close_price` | The exit fill price, slippage included. |
| `stop_price` | The stop level, before the exit's slippage. `null` without a stop. |
| `exit_reason` | Why it closed, see below. |
| `return` | Capital after the trade over capital before it, minus 1, costs included. Below -1 only when the trade lost more than the capital, which then becomes 0. |
| `fees` | The fees of both legs, as a fraction of the capital before the trade. |
| `slippage_cost` | What slippage cost the trade, as a fraction of the capital before it: the return at the prices before slippage, with the same fees, minus `return`. `fees + slippage_cost` is the full cost. |
| `candles_held` | The rows from the entry candle to the exit candle: 0 for a trade opened and closed on one candle. |

| `exit_reason` | When | Exit price before slippage |
| --- | --- | --- |
| `signal` | The signal changed to flat or to the other side. | The fill price of the decision (the close, or the next open). |
| `stop` | The low (long) or high (short) reached the stop level. | The stop level. |
| `gap` | The candle opened at or beyond the stop level. | The candle's open. |
| `end` | The position was still open after the last row. | The last close. |
| `ruin` | The position was worth 0 or less at a candle's close. | That close. |
| `drawdown` | The equity at a candle's close was `drawdown_stop` or more below its peak. | That close. |

## Metrics

`results.stats` has these 12 names, always in this order. Returns are fractions. [Metrics](/docs/metrics/) explains how to read each, and [How a backtest runs](/docs/engine/) the rules behind the trades and the equity.

Sharpe and Sortino use daily returns `r`. The day of a row is the UTC date of its `ts`, `E[d]` is the equity of the last row of day `d`, and `r[d] = E[d] / E[d-1] - 1`, the first day's from the starting capital 1.0. Days without rows are skipped, and the risk-free rate is 0. For US stocks the UTC date is the New York date of the session, because a regular session lies within one UTC day.

| Name | Formula | `null` when |
| --- | --- | --- |
| `total_return` | `equity[last] - 1` | the series has no rows |
| `max_drawdown` | `min(drawdown)`: 0 when the equity never falls below a peak, else negative | the series has no rows |
| `sharpe` | `mean(r) / std(r) * sqrt(periods_per_year)`, `std` with ddof 1 | fewer than 2 days, or `std(r)` is 0 |
| `sortino` | `mean(r) / sqrt(mean(min(r, 0) ** 2)) * sqrt(periods_per_year)`: the downside deviation over all days | fewer than 2 days, or no losing day |
| `num_trades` | the rows of the trades, the `end` trade included (a whole number) | never |
| `win_rate` | `count(return > 0) / num_trades`. A return of exactly 0 is no win. | no trades |
| `avg_trade_return` | `mean(return)` | no trades |
| `best_trade_return` | `max(return)` | no trades |
| `worst_trade_return` | `min(return)` | no trades |
| `exposure` | `count(position != 0) / rows of the series`: the share of candles that close with a position | the series has no rows |
| `fees_paid` | `sum(fees)`, 0 without trades | never |
| `buy_and_hold_return` | `close[last] / close[first] - 1` over the candles of the series | no candle has a `ts` of the series |

- Once the equity has reached 0, a day that starts from 0 has no return, so there are no daily returns at all and Sharpe and Sortino are `null`.
- A value that would come out infinite or NaN is `null` too.
- `fees_paid` adds fractions of different capitals, each trade's capital before it. So it is close to, but not exactly, the share of the starting capital paid in fees.
- The last row is always flat, so `exposure` never counts it.
- `buy_and_hold_return` is buy and hold of the backtest's own instrument, whatever the benchmark.

In the example:

| Name | Value | Why |
| --- | --- | --- |
| `total_return` | -0.05195 | `0.94805 - 1` |
| `max_drawdown` | -0.060224 | the peak 1.008804, then 0.94805: `0.94805 / 1.008804 - 1` |
| `sharpe`, `sortino` | `null` | one day only |
| `num_trades` | 1 | the `stop` trade |
| `win_rate` | 0.0 | its return is below 0 |
| `exposure` | 0.2 | 1 of 5 rows closes long |
| `fees_paid` | 0.00195 | the trade's `fees` |
| `buy_and_hold_return` | -0.02 | `98 / 100 - 1` |

## The version

`version` is the format's version, now 1.

- **A version only grows.** A new field, a new column or a new value in an open list keeps the version. The open lists are `exit_reason`, `benchmarks[].kind`, the `decision` steps and `series.resolution`.
- **Readers ignore fields they do not know** and accept new values in those lists.
- **A breaking change is version 2.** Removing or renaming a field, or changing its type, unit or meaning, makes version 2.
- **The engine's version is data.** A new `software.engine_version` does not change `version`.

Not in version 1: benchmarks other than buy and hold, returns per month, the candles' OHLC (the fingerprint and `loaded` fetch them again), per-trade excursions, rolling statistics and partial results of a failed run.

## Next

- [How a backtest runs](/docs/engine/) The engine's rules, candle by candle, and every setting
- [Metrics](/docs/metrics/) How each metric is computed and how to read it
- [Manifest](/docs/manifest/) The manifest a model runs with, copied into `model.manifest`
- [Errors](/docs/api/errors/) Every error of the API and what to do
- [Tools](/docs/mcp/tools/) The MCP tools that run backtests and read their results
