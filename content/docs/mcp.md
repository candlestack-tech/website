---
title: The MCP server
nav: Overview
description: Connect Claude Code, claude.ai, Cursor, VS Code or any MCP client to CandleStack. The agent works with your models and backtests through the same checks as the app.
section: mcp
order: 0
updated: 2026-11-08
---

> [!NOTE]
> **Available from the next release.** The MCP server and API keys are live on stage.candlestack.tech and come to app.candlestack.tech with the next release. Until then, run your backtests in the app.

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

Today a client signs in with an API key that it sends in a header. Claude Code, claude.ai, Cursor and VS Code can do that.

- **Create a key** In the app open Settings, then API and MCP. A key starts with `cs_` and is shown once.
- **Send it** Your client sends it as `Authorization: Bearer cs_...` with every request.
- **Limits** Up to 10 keys, each with its own scopes and an optional expiry of 1 to 365 days. 120 requests a minute per key.
- **Beta list** A key works while your account is on the beta list.
- **Revoke** Revoke a key in Settings and it stops working at once.

OAuth sign-in is coming with [candlestack#408](https://github.com/candlestack-tech/candlestack/issues/408). Then you sign in with GitHub or Google and pick what the agent may do, with no key to copy. ChatGPT waits for it, because it cannot send a key. On claude.ai it lets each member of a team sign in as themselves instead of sharing one key.

## Scopes

A key can do only what its scopes allow. Give it the fewest you need.

- `read` Every tool that only reads, such as your account, market data, models, backtests and Experiments.
- `backtests` Start, rename, star and cancel backtests.
- `models` Upload models, set their manifests, rename, star and delete them.
- `publish` Publish backtests to Experiments and take them back.

A tool that needs a scope the key lacks answers `missing-scope`. `get_me` shows the scopes of the key.

## What stays in the web app

Some things need you, signed in to the app in your browser. No key and so no agent can manage keys, delete your account, change your name or sign-in methods, or sign out. The endpoints for monitoring and the app's own images have no tool either. This list comes from the server, with the reason for each endpoint.

<!-- mcp-web-only -->

## Next

- [Install](/docs/mcp/install/) Claude Code, claude.ai, Cursor and VS Code, and ChatGPT with OAuth
- [Tools](/docs/mcp/tools/) Every tool with its parameters and an example
