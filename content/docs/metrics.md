---
title: Metrics
description: The exact formula of each of the 12 metrics of a backtest, its unit, when it is null and how to read it, with a worked example.
section: concepts
order: 1
updated: 2026-11-09
---

## Where the metrics come from

Every backtest has 12 metrics, in `results.stats` of its [result document](/docs/backtest-json/). They are computed from two things the [engine](/docs/engine/) gives, always over every candle and every trade of the run, whatever view of the document you read:

- **The equity curve** One row per candle: the capital after the candle's fills, an open position marked at the candle's close. It starts at 1.0.
- **The trades** One row per closed trade, the trade still open at the end included (reason `end`). A trade's `return` is the capital after it over the capital before it, minus 1, with fees, slippage and the position size in it.

## Conventions

- **Fractions** Returns, drawdown, win rate, exposure and fees are fractions: `0.05` is 5%.
- **Drawdown is negative** `max_drawdown` of `-0.06` is a fall of 6% below the peak.
- **Risk-free rate** 0. Returns are not reduced by any rate.
- **Per year** Sharpe and Sortino are yearly, scaled by `metrics.periods_per_year`: 252 for stocks, 365 for crypto. This depends on the market only, never on the timeframe.
- **null** A value that is not defined, or that would be infinite or NaN, is `null`, never NaN.
- **No rounding** Values are not rounded. The app rounds them only to show them.

## Daily returns

Sharpe and Sortino use one return per day, not per candle.

- The day of a row is the UTC date of its `ts`. A US stock session lies within one UTC day, so for stocks this is the New York trading day.
- `E[d]` is the equity of the last row of day `d`.
- `r[d] = E[d] / E[d-1] - 1`. The first day's return is from the starting capital, 1.0.
- Days without rows are skipped: weekends and holidays have no return for stocks. Crypto has a row every day.
- A day with rows but no position has a return of 0, and it counts.
- Once the equity has reached 0, there are no daily returns at all.

## The 12 metrics

In this order in `results.stats`:

| Name | Formula | Unit | `null` when |
| --- | --- | --- | --- |
| `total_return` | `equity[last] - 1` | fraction | the run has no rows |
| `max_drawdown` | `min(equity[t] / peak[t] - 1)`, with `peak[t] = max(1.0, equity[0], ..., equity[t])` | fraction, 0 or below | the run has no rows |
| `sharpe` | `mean(r) / std(r) * sqrt(periods_per_year)`, `std` the sample standard deviation (ddof 1) | per year | fewer than 2 days, `std(r)` is 0, or the equity reached 0 |
| `sortino` | `mean(r) / sqrt(mean(min(r, 0) ** 2)) * sqrt(periods_per_year)` | per year | fewer than 2 days, no day with `r < 0`, or the equity reached 0 |
| `num_trades` | the trades, the `end` trade included | count | never |
| `win_rate` | `count(return > 0) / num_trades` | fraction | no trades |
| `avg_trade_return` | `mean(return)` | fraction | no trades |
| `best_trade_return` | `max(return)` | fraction | no trades |
| `worst_trade_return` | `min(return)` | fraction | no trades |
| `exposure` | `count(position != 0) / rows` | fraction | the run has no rows |
| `fees_paid` | `sum(fees)` | fraction | never, 0 without trades |
| `buy_and_hold_return` | `close[last] / close[first] - 1` over the run's candles | fraction | the run has no candles |

`r` are the daily returns above. `mean` is the plain average over all days. The Sortino denominator is the downside deviation with a target of 0: the square root of the average of `min(r, 0) ** 2` over all days, the days without a loss counted as 0, divided by the number of days (not by days minus 1).

## How to read them

- **`total_return`** What 1.0 of capital became, less 1, after every cost. It is not per year: compare it only between runs of the same length.
- **`max_drawdown`** The worst fall from a peak, on the equity at each candle's close. The starting 1.0 is the first peak, so a run that loses from its first candle is in drawdown from there. Falls inside a candle, between its open and close, do not count.
- **`sharpe`** The average daily return over its spread, scaled to a year. It rewards steady gains and is hurt by swings up as well as down. With few days it is noisy: a value from a few weeks says little.
- **`sortino`** Like Sharpe, but only losing days count as risk. It is higher than Sharpe when the swings are mostly up. It is `null` for a run without a losing day.
- **`num_trades`** Each closed position is one trade. A flip from long to short is two: the long that closes and, later, the short.
- **`win_rate`** The share of trades with a return above 0 after costs. A trade of exactly 0 is no win. A high win rate says nothing about the size of the wins and losses.
- **`avg_trade_return`, `best_trade_return`, `worst_trade_return`** Returns on the whole capital, not on the price: with `position_size` 0.5, a trade on a 10% move returns about 5%.
- **`exposure`** The share of candles that close with a position, long or short. It counts candles, not time: a shorter last candle of a session counts as one. A trade opened and closed on the same candle does not count, and the last candle is always flat.
- **`fees_paid`** The sum of each trade's fees. Each is a fraction of the capital before that trade, so the sum is close to, but not exactly, the share of the starting capital paid in fees. Slippage is not in it.
- **`buy_and_hold_return`** Buying at the close of the run's first candle and selling at the close of its last, without costs. It is always the backtest's own instrument, whatever the benchmark. The strategy can trade from the second candle at the earliest.

## Benchmarks

A backtest compares with at most one benchmark, buy and hold:

- **Its own instrument** The equity is each candle's close over the first candle's close. `results.benchmarks.<id>.total_return` equals `buy_and_hold_return`.
- **An index fund**, SPY, QQQ or DIA, for a stock backtest. On each row the equity is the fund's last close at or before the row's `ts`, over the first such close, and 1.0 before the fund's first price. Its `total_return` is the last value less 1, `null` when the fund has no price by the last row.

The benchmark's equity is in `results.series.benchmarks`, on the same rows as the strategy. No metric relative to the benchmark is computed: no alpha, beta, correlation or information ratio.

## Worked example

The engine's [worked example](/docs/engine/#worked-example) with `next_open`, a 5% stop and a 10 bps fee. Equity 1, 1, 1.008804, 0.94805, 0.94805, one trade with a return of -0.05195.

| Name | Value | Why |
| --- | --- | --- |
| `total_return` | -0.05195 | `0.94805 - 1` |
| `max_drawdown` | -0.060224 | the peak 1.008804 on row 2, then 0.94805: `0.94805 / 1.008804 - 1` |
| `sharpe`, `sortino` | `null` | one day only |
| `num_trades` | 1 | the `stop` trade |
| `win_rate` | 0.0 | its return is below 0 |
| `avg_trade_return`, `best_trade_return`, `worst_trade_return` | -0.05195 | one trade |
| `exposure` | 0.2 | 1 of 5 rows closes long (row 2) |
| `fees_paid` | 0.00195 | the trade's `fees` |
| `buy_and_hold_return` | -0.02 | `98 / 100 - 1` |

With 10 bps of slippage as well, `total_return` is -0.05289905, `max_drawdown` -0.060225 and `fees_paid` 0.00194905. With `signal_close` instead, `total_return` is -0.031673, `max_drawdown` -0.058310 and `exposure` 0.6: rows 1, 2 and 3 close long.

### Sharpe and Sortino over four days

A stock run with two rows a day. Only each day's last row counts for the daily returns, but every row counts for the drawdown.

| Day | Equity of its rows | `E[d]` | `r[d]` |
| --- | --- | --- | --- |
| 1 | 1.0, 1.02 | 1.02 | `1.02 / 1.0 - 1 = 0.02` |
| 2 | 1.03, 1.0098 | 1.0098 | -0.01 |
| 3 | 1.01, 1.029996 | 1.029996 | 0.02 |
| 4 | 1.025, 1.01969604 | 1.01969604 | -0.01 |

- `mean(r)` = 0.005.
- `std(r)` with ddof 1 = `sqrt((4 * 0.015 ** 2) / 3)` = 0.0173205.
- `sharpe` = `0.005 / 0.0173205 * sqrt(252)` = 4.5826.
- Downside deviation = `sqrt((0 + 0.0001 + 0 + 0.0001) / 4)` = 0.0070711.
- `sortino` = `0.005 / 0.0070711 * sqrt(252)` = 11.2250.
- `max_drawdown` = `1.0098 / 1.03 - 1` = -0.019612: the peak is the first row of day 2, which the daily returns never see.
- `total_return` = 0.019696.

The same equity on crypto, with 365, gives a Sharpe of 5.5151 and a Sortino of 13.5093.

## What is not computed

CandleStack computes the 12 metrics above and nothing else. There is no annualized return (CAGR), volatility, Calmar ratio, profit factor, expectancy, holding time, return per month, alpha, beta or information ratio in the result.

> [!NOTE]
> **Advice, not a CandleStack metric.** You can compute others from the result document yourself. Download it for every row and every trade, as the light view thins long runs. Say which formula you used, as these are not CandleStack's numbers. For example: profit factor `sum(return > 0) / -sum(return < 0)` over `results.trades.columns.return`, and annualized return `(1 + total_return) ** (365.25 * 86400 / (last ts - first ts)) - 1` over `results.series.columns.ts`.

## Next

- [How a backtest runs](/docs/engine/) The rules behind the equity curve and the trades
- [Sweeps and comparing](/docs/sweeps/) Rank backtests by one of these metrics
- [Backtest JSON](/docs/backtest-json/) Where each value sits in the result document
