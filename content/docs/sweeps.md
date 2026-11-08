---
title: Sweeps and comparing
nav: Sweeps
description: What a sweep varies, how its backtests are ranked, how the comparison marks the best and worst, and how to read a grid without fooling yourself.
section: concepts
order: 2
updated: 2026-11-09
---

## What a sweep is

A sweep runs one setup over a grid of values: one backtest for every combination. You send a base setup, the body of one backtest, and the lists of values to vary. Start it with `run_sweep` on the MCP server or `POST /api/v1/sweeps`, and check it first with `validate_sweep` or `validate_only`, which starts nothing.

| List | Replaces | Note |
| --- | --- | --- |
| `models` | `model.id` | A model's manifest fixes its input and its timeframe, so list models to vary those. |
| `instruments` | `data.instrument.id` | A buy and hold benchmark of the base's instrument follows each instrument. A fund (SPY, QQQ, DIA) stays. |
| `periods` | `data.period` | Each a `[start, end)` in UTC epoch seconds. |
| `rules` | `decision.rule` | Other limits of one rule, or other rules: `threshold`, `hysteresis`, `kmeans`. |

- **Everything else is the base's.** Calibration, EMA, `long_only`, confirmation, minimum hold, every [execution setting](/docs/engine/#execution-settings) and the benchmark are the same in every backtest. To vary a fee or a stop loss, run separate backtests.
- **The grid** is every combination, in the order models, then instruments, then periods, then rules. A list left out or empty keeps the base's value, and a list may not hold a value twice.
- **Size** 2 to 20 backtests. A grid of more is refused ([validation](/problems/validation/)).
- **All or nothing** Every setup passes the checks of a new backtest before any starts. Then all go to the end of your queue together, or none does: the queue holds up to 20 waiting backtests ([queue-full](/problems/queue-full/)), and an account keeps a limited number of backtests ([backtest-limit](/problems/backtest-limit/)).
- **Ordinary backtests** Each one is a normal backtest with the sweep's `sweep_id`: listed, comparable and publishable like any other.

Your backtests run one at a time, so a sweep of 20 takes about 20 times one backtest.

## The ranking

Once every backtest of the sweep has ended, `get_sweep` or `GET /api/v1/sweeps/{id}` ranks them by one metric: the sweep's `metric`, `sharpe` unless you chose another, or the `metric` you ask for.

| Metric | Better |
| --- | --- |
| `total_return`, `sharpe`, `sortino`, `win_rate`, `avg_trade_return`, `best_trade_return`, `worst_trade_return` | higher |
| `max_drawdown` | the smaller fall: -0.05 beats -0.20 |
| `fees_paid` | lower |

- **Ties** Values that read the same in the app share a rank, and the next rank skips past them: 1, 1, 3. The app shows returns, the drawdown, the win rate and the fees in percent to 0.1, Sharpe and Sortino to 0.01, and the average trade in percent to 0.01.
- **No value** A failed backtest, or one whose metric is `null` (a Sharpe of fewer than 2 days, for example), has no rank and comes last.
- **While it runs** the ranking is `null`. The list of sweeps shows the best finished backtest so far.

`num_trades`, `exposure` and `buy_and_hold_return` cannot rank: more trades, more time in the market and the market's own move are not better in themselves.

## Comparing backtests

`compare_backtests` or `GET /api/v1/compare` puts 1 to 20 backtests side by side, a sweep's or any others you can see.

- **The 12 metrics** of each, with the best and the worst marked by the same directions as the ranking. `num_trades`, `exposure` and `buy_and_hold_return` are never marked. Values that read the same count as equal, so two figures that look alike are never marked apart.
- **The setups** whole, or what all share once and what differs for each.
- **The curves** on request: the equity, the drawdown and buy and hold of each, on one time axis of up to 200 points.

A comparison reads what each backtest stored when it ran. It loads no candles and runs nothing again.

## Reading a sweep

> [!NOTE]
> **Advice, not a feature of CandleStack.** These are general cautions for any grid of backtests.

- **The best of many is too good.** Out of 20 setups, the top one is partly luck. Its metrics overstate what the same setup will do on new data.
- **Hold out a period.** Choose the setup on one period, then run it once on a later period you did not look at, as a separate backtest.
- **Prefer a plateau to a peak.** A threshold that works at 0.10 but fails at 0.09 and 0.11 is fragile. A setup whose neighbours do almost as well is more likely to hold.
- **Check several instruments.** A rule that works on one stock only may have fit that stock's history.
- **Look at the trade count.** A Sharpe or win rate from a handful of trades says little. Check `num_trades` before you trust a ratio.
- **Keep the costs on.** Use realistic fees and slippage and `fill: next_open`. A rule that trades often can turn from a gain to a loss on costs alone.
- **Compare with buy and hold.** A strategy that is long most of the time in a rising market looks good on total return. Check `exposure`, `buy_and_hold_return` and the drawdown too.
- **Train and test apart.** A model trained on the test period has seen the answers, and no sweep can detect that.

## Next

- [How a backtest runs](/docs/engine/) The rules every backtest of a sweep follows
- [Metrics](/docs/metrics/) What each ranked metric means
- [Tools](/docs/mcp/tools/) `run_sweep`, `get_sweep`, `wait_for_sweep` and `compare_backtests`
