---
title: The MCP server
nav: Overview
description: Connect claude.ai, ChatGPT, Claude Code, Codex, Cursor, VS Code or any MCP client to CandleStack. The agent works with your models and backtests through the same checks as the app.
section: mcp
order: 0
updated: 2026-11-09
---

## What the server does

The server gives an AI client the tools of CandleStack. The agent picks a tool, CandleStack runs it as you and the agent reads the answer. Every tool does the same as an endpoint of the API, with the same checks and limits.

- **Acts as you** It sees your own models and backtests and what others published to Experiments, nothing else.
- **Says what it changes** Every tool is marked read only, changes data or destructive, so your client can ask before it changes or deletes anything.
- **Explains errors** A failed call answers with the problem and what to do about it, as the API does.

## Address

```text address title="Server address"
https://app.candlestack.tech/mcp
```

The server speaks Streamable HTTP, the remote transport of MCP. [Install](/docs/mcp/install/) has the steps for each client.

## Sign-in

A client signs in in one of two ways. Either way it acts as you, with the scopes you gave it.

- **OAuth** claude.ai, ChatGPT, Claude Code and Codex. You add the address, sign in to CandleStack with GitHub or Google and choose what the app may do, with no key to copy. Each person signs in as themselves. [Signing in with OAuth](/docs/mcp/install/#signing-in-with-oauth) shows the steps.
- **API key** Cursor, VS Code, scripts and any client without OAuth. The client sends the key as `Authorization: Bearer cs_...` with every request.

### OAuth

- **Connected apps** In the app open Settings, then API and MCP. Every app that signed in is listed with its scopes, and Disconnect ends its access at once.
- **How long** An app stays signed in while you use it. After 30 days without use it has to connect again.
- **Limits** 120 requests a minute per connected app. All your keys and apps share 300 a minute, see [Rate limits](/docs/api/rate-limits/).
- **Beta list** An app works while your account is on the beta list.

For client developers: the server follows the MCP authorization spec. It is OAuth 2.1 with the authorization code and PKCE (S256), dynamic client registration and client ID metadata documents. Access tokens last an hour, refresh tokens 30 days and work once each. A token works only at `/mcp`, not on the HTTP API. The metadata is at `https://app.candlestack.tech/.well-known/oauth-protected-resource/mcp`.

### API keys

- **Create a key** In the app open Settings, then API and MCP. A key starts with `cs_` and is shown once.
- **Limits** Up to 10 keys, each with its own scopes and an optional expiry of 1 to 365 days. 120 requests a minute per key, and 300 across all your keys and apps.
- **Beta list** A key works while your account is on the beta list.
- **Revoke** Revoke a key in Settings and it stops working at once.

## Scopes

A key or a connected app can do only what its scopes allow. Give it the fewest you need. On the consent page `read` is always on.

- `read` Every tool that only reads, such as your account, market data, models, backtests and Experiments.
- `backtests` Start, rename, star, cancel and delete backtests, and run sweeps.
- `models` Upload models, set their manifests, rename, star and delete them.
- `publish` Publish backtests to Experiments and take them back.

A tool that needs a scope the key or app lacks answers `missing-scope`. `get_me` shows the scopes of the key or app.

## Docs and prompts

The agent reads these docs through the server, so it answers from them instead of guessing. This works in clients that cannot open links, such as ChatGPT.

- `get_docs` Without a page it lists every page of these docs. With a page it answers the page as Markdown, in parts or by section when the page is long. The pages come from this website as published, so they never differ from what you read here.
- **Prompts** Plans for common tasks, which your client offers as commands. Each tells the agent which tools to call in which order and which pages to read.

<!-- mcp-prompts -->

## What stays in the web app

Some things need you, signed in to the app in your browser. No key, no connected app and so no agent can manage keys or connected apps, delete your account, change your name or sign-in methods, or sign out. The endpoints for monitoring and the app's own images have no tool either. This list comes from the server, with the reason for each endpoint.

<!-- mcp-web-only -->

## Next

- [Install](/docs/mcp/install/) claude.ai, ChatGPT, Claude Code and Codex with OAuth, Cursor and VS Code with a key
- [Tools](/docs/mcp/tools/) Every tool with its parameters and an example
- [How a backtest runs](/docs/engine/) What `start_backtest` runs and what each setting does
- [Metrics](/docs/metrics/) What the metrics `get_backtest` answers mean
