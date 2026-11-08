---
title: CandleStack for agents
nav: Overview
description: Almost everything you do in the app, an agent can do for you. Connect Claude, ChatGPT, Codex or Cursor through MCP, or call the API from your own code.
section: agents
order: 0
updated: 2026-11-08
---

## What an agent can do

An agent works with the same things you do in the app. It sees your own models and backtests and what others published to Experiments, nothing else. Agents work for accounts on the beta list.

- **Find data** Search US stocks and crypto and read candles in any timeframe from 1m to 1d.
- **Check models** Read the manifest of a model and test a new one before you save it.
- **Upload models** Get a one-time link and send a Keras or ONNX file from your own disk.
- **Run backtests** Start backtests, wait for them and read the metrics and trades.
- **Compare** Put 2 to 20 backtests side by side, with the best and worst value of each metric marked.
- **Sweep** Run one setup over a grid of models, instruments, periods and decision rules.
- **Publish** Share a good backtest in Experiments, or take it back.
- **Clean up** Delete backtests you no longer need, up to 100 at once or a whole sweep.

## MCP or the API

<!-- cards -->

### For chats and coding agents

**MCP server** *Live*

Add one address to your AI client. The agent picks the tools, runs them and explains what it found.

`Claude Code` `claude.ai` `ChatGPT` `Codex` `Cursor` `VS Code`

- claude.ai, ChatGPT, Claude Code and Codex sign in with your account
- Cursor and VS Code sign in with a key
- Asks before it deletes or publishes

[Install the server](/docs/mcp/install/)

### For scripts and your own code

**REST API** *Live*

Send JSON over HTTPS with a key in the header. Good for notebooks, scheduled jobs and pipelines.

`curl` `Python` `JavaScript`

- The same actions as the MCP tools
- Keys with scopes and an expiry
- A reference of every endpoint

[Open the API reference](https://app.candlestack.tech/api/v1/docs)

<!-- /cards -->

Not sure? Start with MCP. You can script the same steps later.

## First backtest from a chat in 2 minutes

1. **Create a key**

   In the settings of the app, create a key with the `read` and `backtests` scopes. On claude.ai, ChatGPT, Claude Code and Codex you can sign in with your account instead.

2. **Add the server**

   Add the address of the CandleStack server to your AI client, as [Install](/docs/mcp/install/) shows for each client.

3. **Ask**

   ```text prompt
   Run my newest model on AAPL for the first half of 2025 with my usual settings. Then tell me how it did against buy and hold.
   ```

   The agent finds your model, checks the setup, starts the backtest, waits for it and answers with the metrics and a link to the backtest in the app.

## What stays in the web app

Deleting your account, your sign-in methods and signing out stay in the app. No key and no agent can do them.

## Next

- [Docs for agents](/docs/agents/docs-for-agents/) Read these docs as Markdown, one page or all at once
- [The MCP server](/docs/mcp/) The address, sign-in, scopes and what stays in the app
- [Install](/docs/mcp/install/) Connect claude.ai, ChatGPT, Claude Code, Codex, Cursor or VS Code
- [Tools](/docs/mcp/tools/) Every tool with its parameters and an example
- [The API](/docs/api/) Keys, sign-in and examples for your own code
- [Manifest](/docs/manifest/) The manifest.json a model needs: every field and block
- [Backtest JSON](/docs/backtest-json/) Every field and metric of a backtest's result document
- [Problem types](/problems/) Every error of the API and what to do about it
- [Use cases](/docs/use-cases/) Real sessions of an agent with CandleStack, step by step
