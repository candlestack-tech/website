---
title: The model manifest
nav: Manifest
description: The manifest.json you upload with a model says which candles it takes, which columns in which order and how many rows make one sample.
section: formats
order: 0
updated: 2026-11-09
---

## What a manifest is

A model file says only the shape of its input, such as `[25, 23]`, never what is in it. It does not say which indicators, with which parameters, scaled how or in which column order. Feed a model the wrong columns in the right shape and it answers anyway, with numbers that look real.

The manifest closes that gap. It is a small JSON file stored with each model, and CandleStack builds the model's input from candles by it. A model uploaded without one is kept but cannot run until its manifest is added. Each backtest keeps a copy of the manifest it ran with, so a later change to the manifest never rewrites what an old backtest means.

## How you add it

The model and its manifest are two files, `model.keras` (or `model.onnx`) and `manifest.json`. In the app you can drop both at once.

1. **Upload the model**

   The model file is checked and kept first. The app shows what it takes and gives, such as "input [25, 23] · output [1]".

2. **Add the manifest**

   Upload `manifest.json`, pick a template ("BLESK NO-VOL 25 x 23", "Raw candles 25 x 5") or build it in a form from the [blocks](#blocks). Its [checks](#checks) run at once, and the manifest is kept only when every check passed. The model is then `ready`.

3. **Wait for the trial run**

   Once the manifest is kept, a trial run builds the input and runs the model. With an [example](#the-example-field) in the manifest, the model is `verified` when it gives the expected output.

From the API it is two requests, `POST /api/v1/models` for the file and `PUT /api/v1/models/{model_id}/manifest` for the manifest. A manifest added again replaces the one the model had, and the model is `ready` until a trial run verifies it again.

## A full example

The "Raw candles 25 x 5" template. Every candle is a row, the columns are the raw prices, nothing is scaled, and one sample is the last 25 candles.

```json title="manifest.json"
{
  "version": 1,
  "input": {
    "timeframe": "30m",
    "session": "regular",
    "representation": {"id": "candles@1"},
    "features": [
      {"name": "open", "id": "open@1", "norm": {"id": "none@1"}},
      {"name": "high", "id": "high@1", "norm": {"id": "none@1"}},
      {"name": "low", "id": "low@1", "norm": {"id": "none@1"}},
      {"name": "close", "id": "close@1", "norm": {"id": "none@1"}},
      {"name": "volume", "id": "volume@1", "norm": {"id": "none@1"}}
    ],
    "window": {"length": 25}
  },
  "signature": {
    "input": {"shape": [25, 5], "dtype": "float32"},
    "output": {"shape": [1], "dtype": "float32", "meaning": "score"}
  },
  "about": {"note": "Test model for the pipeline"}
}
```

The model takes `[25, 5]`: 25 rows (the window) of 5 columns (the features). It gives `[1]`, one score per sample.

## How the input is built

The manifest describes four steps. Each step is a block from the [catalog](#blocks), named with its version, plus the block's parameters.

- **Representation** Which rows the model sees. Every candle a row, or rows of Renko bricks or of a Kagi line.
- **Features** The columns of each row, in their exact order. Each is computed on the candles and taken at the row's candle, or read from the rows.
- **Normalization** How each column is scaled, or not at all.
- **Window** How many rows make one sample. The result is a `float32` array of samples by rows by features.

A block's name carries its version, as `rsi@1`. One indicator name gives different numbers in different libraries, so a manifest names the exact implementation, never just "RSI". A block never changes what it computes: a block that gives other numbers is a new version (`rsi@2`), so an old manifest keeps meaning what it meant.

## Fields

Every field of version 1. A field that is not listed here is refused, not ignored, and a value of the wrong type is refused too: `"25"` is not a number.

| Field | Required | Meaning and allowed values |
| --- | --- | --- |
| `version` | yes | `1`, the only version so far. A manifest of another version is refused. |
| `input.timeframe` | yes | The candles the model expects: `1m`, `5m`, `15m`, `30m`, `1h`, `4h` or `1d`. |
| `input.session` | yes | `regular` (US trading hours) or `24/7` (around the clock, as crypto trades). |
| `input.representation` | yes | Which rows the model sees: `{"id": ..., "params": {...}}` with a [representation block](#representation). |
| `input.features` | yes | The columns in their exact order, 1 to 256 of them. |
| `input.features[].name` | yes | The column's name, 1 to 64 characters, unique in the manifest. Not `ts` (the time of each row) nor `row_id` (the id of each row still forming). |
| `input.features[].id` | yes | A [feature block](#features), such as `rsi@1`. |
| `input.features[].params` | no | The block's parameters, at most 32. A parameter left out takes its default. |
| `input.features[].norm` | no | How the column is scaled: `{"id": ..., "params": {...}}` with a [normalization block](#normalization). `none@1` when left out. |
| `input.window.length` | yes | How many rows make one sample, 1 to 1000. |
| `input.window.last` | no | The rule for the last row of a sample: `closed` (the default) or `current`, see [The window rule](#the-window-rule). |
| `signature.input.shape` | yes | The shape of one sample without the batch axis. It must be `[window.length, number of features]` and equal the model file's input. |
| `signature.input.dtype` | yes | `float32`, the only type. |
| `signature.output.shape` | yes | `[1]`, one score per sample. It must equal the model file's output. |
| `signature.output.dtype` | yes | `float32`, the only type. |
| `signature.output.meaning` | yes | `score`: the sign is the direction, the size is compared with the threshold. |
| `example` | no | Samples of the model's input with the output it must give for each, see [below](#the-example-field). |
| `about` | no | Free text for people, as string values: trained on which instruments, which period, notes. |

A block's `id` is lowercase words joined by dashes, then `@` and a version from 1, at most 64 characters (`renko-triples@2`). A shape has 1 to 8 axes, each a whole number of 1 or more.

> [!NOTE]
> **An old manifest?** Manifests written before the plain version number have `"schema": "candlestack.manifest/1"`. Replace that line with `"version": 1`.

### The example field

`example` is a batch of the model's own input, already preprocessed, with what the model gives for it. `input` is `[samples][rows][features]` and `output` is `[samples][1]`, finite numbers, at least one sample.

The shape of `input` must be the number of samples followed by `signature.input`, and the shape of `output` the same number followed by `signature.output`. For a model whose `signature.input` is `[2, 3]`, one sample:

```json title="example"
"example": {"input": [[[1, 2, 3], [4, 5, 6]]], "output": [[0.12]]}
```

The trial run checks the model's output for it within 1e-4. That is the only check that catches columns in the wrong order, which the shape cannot. The whole manifest can be at most 1 MB, so keep the example small ([manifest-too-large](/problems/manifest-too-large/)).

### The window rule

`input.window.last` says what the last row of a sample is.

- `closed` The default. A sample is the `length` rows up to each row, each finished at its own candle. For `candles@1`.
- `current` A sample is the `length - 1` most recent finished rows before each row, and then that row, which may still be forming. For rows that span several candles: `renko-triples@1`, `renko-triples@2` and `kagi@1`.

A manifest with the other rule for its representation is refused.

## Blocks

The blocks the app knows today, from the catalog. The app builds its manifest form from the same list, and it is public:

```bash title="Terminal"
curl https://app.candlestack.tech/api/v1/preprocessing/catalog
```

Each block comes with its `id`, `step`, `description`, a `group` for features, its `warm_up` and its `params` with type, range and default. The MCP tool `preprocessing_catalog` gives the same.

The warm-up is how many earlier candles a block needs before its first complete value. A backtest loads them before its period: the longest warm-up of the representation and of a feature with its normalization, plus the window's `length - 1` rows. With `candles@1` the number is exact. With rows that span several candles it is an estimate, and the run loads further back where it falls short.

Every whole-number parameter below is 2 to 1000, except where it says otherwise. Every multiple (`dev`, `bollinger_dev`, `keltner_multiplier`, `atr_multiple`, `amount`) is above 0 and at most 10.

### Representation

| Block | Rows | Warm-up |
| --- | --- | --- |
| `candles@1` | Every candle a row. | `0` |
| `renko-triples@1` | Rows of three Renko bricks on the close, each brick `atr_multiple` ATRs (`atr@1`) high at the candle that starts it. One row per candle from the third brick on. | `15 * atr_window - 1 + ceil(2 * (1 + 2 * atr_multiple))` |
| `renko-triples@2` | The same rows, with each brick `atr_multiple` TA-Lib ATRs (`atr@2`) high and the first brick on the candle `first_brick`. | `max(first_brick, atr_window) + ceil(2 * (1 + 2 * atr_multiple))` |
| `kagi@1` | A Kagi line on the close that reverses after `amount` ATRs or percent. One row per candle, the current segment. | `15 * atr_window - 1 + ceil(4 + 4 * amount + 5 * amount ** 2)` with `atr`, `ceil(4 + 8 * amount + 20 * amount ** 2)` with `percent` |

The parameters of `renko-triples@1` and `renko-triples@2`:

| Parameter | Default | Meaning |
| --- | --- | --- |
| `atr_multiple` | `0.6` | The height of a brick in ATRs. |
| `atr_window` | `14` | Candles in the ATR. |
| `atr_at` | `brick_start` | The candle whose ATR sizes a brick: the one that starts it. The only option. |
| `first_brick` | `49` | `@2` only. The candle of the first brick, counted from 0, never before the ATR's first value (the candle `atr_window`). 0 to 1000. |

The parameters of `kagi@1`:

| Parameter | Default | Meaning |
| --- | --- | --- |
| `reversal` | `atr` | How the reversal amount is measured: `atr`, in ATRs of the candle that starts a segment, or `percent`, in percent of the segment's extreme. |
| `amount` | `1` | The reversal amount, in ATRs or in percent. |
| `atr_window` | `14` | Candles in the ATR, for `atr` only. |

### Features

The features in the groups the app shows them in. The blocks of a table without a Parameters column take none.

#### Candle

| Block | Value | Warm-up |
| --- | --- | --- |
| `open@1`, `high@1`, `low@1`, `close@1`, `volume@1` | The open, high, low, close or volume of the candle. | `0` |
| `rel-open@1`, `rel-high@1`, `rel-low@1` | The open, high or low of the candle over its close, minus 1. | `0` |
| `rel-close@1` | The close over the previous candle's close, minus 1. | `1` |
| `session-last-candle@1` | 1 on the last candle of its trading session, early closes included, else 0. Stock candles only, so it needs `"session": "regular"`. | `0` |

#### Bands

| Block | Value | Parameters (defaults) | Warm-up |
| --- | --- | --- | --- |
| `bollinger-high@1`, `bollinger-low@1` | The mean close plus or minus `dev` standard deviations. | `window` 20, `dev` 2 | `window - 1` |
| `keltner-high@1`, `keltner-low@1` | The original Keltner channel: the mean of `(4 high - 2 low + close) / 3`, or of `(4 low - 2 high + close) / 3`. | `window` 20 | `window - 1` |
| `squeeze@1` | 1 when the Bollinger bands lie inside a Keltner channel of mean true ranges, else 0. | `bollinger_window` 20, `bollinger_dev` 2, `keltner_window` 20, `keltner_atr_window` 20, `keltner_multiplier` 1.5 | `max(bollinger_window - 1, keltner_window - 1, keltner_atr_window)` |
| `atr@1` | Average true range with Wilder's smoothing. | `window` 14 | `15 * window - 1` |
| `atr@2` | Average true range with Wilder's smoothing, started as TA-Lib starts it. | `window` 14 | `window` |

#### Momentum

| Block | Value | Parameters (defaults) | Warm-up |
| --- | --- | --- | --- |
| `rsi@1` | Relative strength index with Wilder's smoothing. | `window` 20 | `14 * window` |
| `rsi@2` | Relative strength index with Wilder's smoothing, started as TA-Lib starts it. | `window` 20 | `window` |
| `roc@1` | Rate of change: the close against the close `window` candles before, in percent. | `window` 20 | `window` |
| `tsi@1` | True strength index: the close's change smoothed by two EMAs, of `slow` and then of `fast` candles, in percent. | `slow` 25, `fast` 13 | `7 * (slow + fast)` |
| `tsi@2` | True strength index with two TA-Lib EMAs, in percent. | `slow` 25, `fast` 13 | `slow + fast - 1` |

#### Trend

| Block | Value | Parameters (defaults) | Warm-up |
| --- | --- | --- | --- |
| `adx@1` | Average directional index, how strong the trend is, with Wilder's smoothing. | `window` 14 | `20 * window` |
| `adx@2` | Average directional index as TA-Lib computes it. | `window` 14 | `2 * window - 1` |
| `aroon-up@1`, `aroon-down@1` | Aroon on the close: 100 when the highest (or lowest) close of the window is the last. | `window` 25 | `window - 1` |
| `aroon@1` | Aroon up minus Aroon down. | `window` 25 | `window - 1` |
| `sma@1` | Simple moving average of the close. | `window` 20 | `window - 1` |
| `ema@1` | Exponential moving average of the close. | `window` 20 | `7 * window` |
| `ema@2` | Exponential moving average of the close, started as TA-Lib starts it. | `window` 20 | `window - 1` |
| `macd-diff@1` | MACD histogram: the fast EMA minus the slow EMA of the close, minus its signal EMA. | `fast` 12, `slow` 26, `signal` 9 | `7 * (max(fast, slow) + signal)` |
| `macd-diff@2` | MACD histogram as TA-Lib computes it. | `fast` 12, `slow` 26, `signal` 9 | `max(fast, slow) + signal - 2` |

The `@1` and `@2` versions differ in how a recursive indicator (an EMA, Wilder's smoothing) starts. `@1` starts from the first candle and waits until the first candles weigh less than 1e-6 in a value. `@2` starts as TA-Lib does and waits only for TA-Lib's first value. After the `@1` warm-up the two agree within 1e-6.

#### Brick

| Block | Value | Warm-up |
| --- | --- | --- |
| `renko-direction@1` | The direction of a Renko triple: half the middle brick's direction plus a quarter of the current one's (-0.75, -0.25, 0.25 or 0.75). Needs `renko-triples@1` or `renko-triples@2`. | `0` |

#### Line

| Block | Value | Warm-up |
| --- | --- | --- |
| `kagi-direction@1` | The direction of the Kagi line's current segment: 1 up, -1 down. | `0` |
| `kagi-length@1` | How far the current segment has gone: its extreme over its start, minus 1. Negative going down. | `0` |
| `kagi-yang@1` | 1 where the Kagi line is thick (yang), 0 where it is thin (yin). | `0` |

The three need `kagi@1`. A feature of the candles, like an indicator, takes its value at the row's candle with any representation.

### Normalization

| Block | Value |
| --- | --- |
| `none@1` | No normalization: the values as they are. The default. |
| `blesk-norm@1` | As the BLESK models were trained: a rule per feature, row by row, from the close of the row's candle. |

`blesk-norm@1` has no parameters and no warm-up. Its rules:

| Rule | Features | Value |
| --- | --- | --- |
| a price level, in percent from the close | `bollinger-high@1`, `bollinger-low@1`, `keltner-high@1`, `keltner-low@1`, `sma@1`, `ema@1`, `ema@2` | `(x / close - 1) x 100` |
| an oscillator, centered | `rsi@1`, `rsi@2`, `aroon-up@1`, `aroon-down@1` | `x - 50` |
| an oscillator, centered | `adx@1`, `adx@2` | `x - 25` |
| a range, in percent of the close | `atr@1`, `atr@2` | `x / close x 100` |
| as it is | `squeeze@1`, `roc@1`, `tsi@1`, `tsi@2`, `aroon@1`, `macd-diff@1`, `macd-diff@2`, `renko-direction@1`, `session-last-candle@1`, `rel-open@1` to `rel-close@1` | `x` |

A feature whose block has no rule, such as `open@1` to `volume@1` or the Kagi features, cannot take `blesk-norm@1`. The manifest then fails the `catalog` check.

### Window

| Block | Parameters | Warm-up |
| --- | --- | --- |
| `window@1` | `length` (required, 1 to 1000) and `last` (`closed` or `current`, default `closed`) | `length - 1` |

The manifest's `input.window` holds the parameters of `window@1`, the only window for now.

## Checks

Checks 1 to 3 read the files only and run on upload. Checks 4 and 5 run the model.

1. **The model file**

   A real model of allowed layers with trained weights. Exactly one input and one output. The input is `[batch, rows, features]` with a fixed number of rows and of features, `float32`. The output is `[batch, 1]`, one score per sample.

2. **The manifest**

   Valid against the [fields](#fields) above, every block in the catalog and in its own step, each parameter of the right type and in its range, the feature names unique, and the signature and example of the right shapes.

3. **The model with the manifest**

   `signature.input` equal to the model's input without the batch axis, and `signature.output` equal to its output.

4. **A trial run**

   On built-in candles, the manifest builds the input and the model answers with finite numbers of the right shape.

5. **The example**

   With an `example`, the model's output for it is within 1e-4 of the expected one. The model is then `verified`.

### What each check means

A manifest that fails is not kept, and the model stays as it was. Each problem names the check that found it.

| Check | What is wrong | For example |
| --- | --- | --- |
| `schema` | The form: not valid JSON, a missing field, an unknown field, a value of the wrong type or out of its range, or another `version`. | "input.window.length is missing." |
| `catalog` | A block the catalog does not have, a block in the wrong step, `session-last-candle@1` without the `regular` session, `blesk-norm@1` on a feature it has no rule for, a feature of the rows of another representation, or a window rule that does not fit the representation. | "The catalog has no block obv@1 yet, so it cannot run." |
| `params` | A parameter of a block that it does not have, of the wrong type or out of its range. | "input.features[1].params.window is not a parameter of high@1." |
| `names` | Two features with the same name, or a feature named `ts` or `row_id`. | "The feature name ts is taken by the time of each row. Rename the feature." |
| `signature` | `signature.input` is not `[window.length, number of features]`, or `signature.output` is not `[1]`. | "signature.input is [25, 5], but a window of 24 rows of 5 features gives [24, 5]." |
| `example` | The shapes of the example do not match the signature. | "example.input has the shape [1, 24, 5], but 1 sample of signature.input make [1, 25, 5]." |
| `model` | The signature does not match the model file, or the file does not say its shape. | "The manifest gives [25, 5], the model takes [25, 23]." |

The API answers a failed manifest with `422` and the problem [manifest-check-failed](/problems/manifest-check-failed/). `problems` lists what is wrong, at most 10, `more_problems` counts the rest and `unknown_blocks` names the blocks the catalog does not have. For the example above with `"length": 24`:

```json out
{
  "type": "https://candlestack.tech/problems/manifest-check-failed",
  "title": "Manifest check failed",
  "status": 422,
  "detail": "signature.input is [25, 5], but a window of 24 rows of 5 features gives [24, 5].",
  "problems": [
    {
      "check": "signature",
      "field": "signature.input.shape",
      "detail": "signature.input is [25, 5], but a window of 24 rows of 5 features gives [24, 5].",
      "allowed": [[24, 5]]
    }
  ],
  "more_problems": 0,
  "unknown_blocks": []
}
```

- `check` The check that found it, one of the table above.
- `field` The field of the manifest it is about, as a path such as `input.features[2].id`. `null` when it is about the whole document.
- `detail` What is wrong, in one sentence, sometimes with a second that says what to do.
- `allowed` The values that fit in `field` when the check knows them: the blocks of the step, the fields or parameters of the object, the options of a choice, the shape to give. Empty when nothing fits, `null` when the check does not say.

A trial run that fails leaves the model `ready`, with its error.

## Next

- [How a backtest runs](/docs/engine/) What happens to the model's scores, candle by candle
- [Backtest JSON](/docs/backtest-json/) What a backtest's result document holds
- [Errors](/docs/api/errors/) Every error of the API and what to do
- [Tools](/docs/mcp/tools/) The MCP tools that read, check and set a manifest
