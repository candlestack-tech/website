---
title: CandleStack for agents
nav: Overview
description: Almost everything you do in the app, an agent will be able to do for you. Connect Claude, ChatGPT or Cursor through MCP, or call the API from your own code.
section: agents
order: 0
updated: 2026-11-08
---

> [!NOTE]
> **Coming soon.** The MCP server and API keys are being built and are not live yet. This page says what they will do and what works today.

## What an agent can do

Once the server is live, an agent works with the same things you do in the app. It sees your own models and backtests and what others published to Experiments, nothing else. Agents work for accounts on the beta list.

- **Find data** Search US stocks and crypto and read candles in any timeframe from 1m to 1d.
- **Check models** Read the manifest of a model and test a new one before you save it.
- **Upload models** Get a one-time link and send a Keras or ONNX file from your own disk.
- **Run backtests** Start backtests, wait for them and read the metrics and trades.
- **Compare** Put 2 to 20 backtests side by side, with the best and worst value of each metric marked.
- **Sweep** Run one setup over a grid of representations, timeframes and periods.
- **Publish** Share a good backtest in Experiments, or take it back.

## MCP or the API

<!-- cards -->

### For chats and coding agents

**MCP server** *Coming soon*

Add one address to your AI client. The agent picks the tools, runs them and explains what it found.

`Claude Code` `claude.ai` `ChatGPT` `Cursor` `VS Code`

- Claude Code, claude.ai, Cursor and VS Code will sign in with a key
- ChatGPT will sign in with your account
- Asks before it deletes or publishes

[Install the server](/docs/mcp/install/)

### For scripts and your own code

**REST API** *Keys coming soon*

Send JSON over HTTPS with a key in the header. Good for notebooks, scheduled jobs and pipelines.

`curl` `Python` `JavaScript`

- The same actions as the MCP tools
- Keys with scopes and an expiry
- The reference of every endpoint is live today

[Open the API reference](https://app.candlestack.tech/api/v1/docs)

<!-- /cards -->

Not sure? Start with MCP once it is live. You can script the same steps later.

## First backtest from a chat in 2 minutes

> [!NOTE]
> **Coming soon.** These steps work once the MCP server and API keys are live. Until then, run your backtests in the app.

1. **Create a key**

   In the settings of the app, create a key with the `read` and `backtests` scopes. On ChatGPT you will sign in with your account instead.

2. **Add the server**

   Add the address of the CandleStack server to your AI client, as [Install](/docs/mcp/install/) shows for each client.

3. **Ask**

   ```text prompt
   Run my newest model on AAPL for the first half of 2025 with my usual settings. Then tell me how it did against buy and hold.
   ```

   The agent finds your model, checks the setup, starts the backtest, waits for it and answers with the metrics and a link to the backtest in the app.

## What works today

- **Web app** Build, run and compare backtests in [the app](https://app.candlestack.tech) with an account on the beta list.
- **API reference** Every endpoint with its fields in [the reference](https://app.candlestack.tech/api/v1/docs). Until keys arrive, a script signs in with the session cookie of your browser, as [the API guide](https://github.com/candlestack-tech/candlestack/blob/v0.10.0/docs/api-guide.md) shows.
- **These docs** Every page as Markdown and all of them in one file, see [Docs for agents](/docs/agents/docs-for-agents/).

## What stays in the web app

Deleting your account, your sign-in methods and signing out stay in the app. No key and no agent can do them.

## Next

- [Docs for agents](/docs/agents/docs-for-agents/) Read these docs as Markdown, one page or all at once
- [The MCP server](/docs/mcp/) The address, sign-in, scopes and what stays in the app
- [Install](/docs/mcp/install/) Connect Claude Code, Cursor or VS Code
- [Tools](/docs/mcp/tools/) Every tool with its parameters and an example
- [Problem types](/problems/) Every error of the API and what to do about it

The API guide and the use cases come with the server.
