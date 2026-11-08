---
title: Install the MCP server
nav: Install
description: Connect CandleStack to your AI client. It takes about a minute.
section: mcp
order: 1
updated: 2026-11-08
---

> [!NOTE]
> **Available from the next release.** These steps work once the server is on app.candlestack.tech with the next release.

```text address title="Server address"
https://app.candlestack.tech/mcp
```

Streamable HTTP. Claude Code, Cursor and VS Code sign in with an API key. claude.ai and ChatGPT will sign in with your account.

## Pick your client

<!-- tabs -->

### Claude Code

1. **Create a key**

   In the app open Settings, then API and MCP, and create a key with the `read` scope. Add `backtests` if the agent should start backtests. The key is shown once. Keep it in your shell, not in a file you commit.

   ```bash title="Terminal"
   export CANDLESTACK_KEY="cs_your_key"
   ```

2. **Add the server**

   ```bash title="Terminal"
   claude mcp add --transport http candlestack https://app.candlestack.tech/mcp \
     --header "Authorization: Bearer $CANDLESTACK_KEY"
   ```

   Add `--scope user` to use it in every project, not only this one.

3. **Check it**

   Run `/mcp` in Claude Code. CandleStack shows as connected, with its tools.

### Cursor

1. **Create a key**

   In the app open Settings, then API and MCP, and create a key with the `read` scope. Add `backtests` if the agent should start backtests. Keep it in your shell.

   ```bash title="Terminal"
   export CANDLESTACK_KEY="cs_your_key"
   ```

2. **Add the server**

   Put this in `~/.cursor/mcp.json` for every project, or in `.cursor/mcp.json` for one.

   ```json title="~/.cursor/mcp.json"
   {
     "mcpServers": {
       "candlestack": {
         "url": "https://app.candlestack.tech/mcp",
         "headers": {
           "Authorization": "Bearer ${env:CANDLESTACK_KEY}"
         }
       }
     }
   }
   ```

   Cursor reads `${env:CANDLESTACK_KEY}` from the environment it started in. Start it from a terminal where the key is set, with `cursor .`.

3. **Check it**

   Open Cursor Settings and find CandleStack among the MCP servers. A green dot means it is connected, and its tools are listed.

### VS Code

1. **Create a key**

   In the app open Settings, then API and MCP, and create a key with the `read` scope. Add `backtests` if the agent should start backtests.

2. **Add the server**

   Put this in `.vscode/mcp.json` in your project. For every workspace, run MCP: Open User Configuration from the Command Palette and add it there.

   ```json title=".vscode/mcp.json"
   {
     "inputs": [
       {
         "type": "promptString",
         "id": "candlestack-key",
         "description": "CandleStack API key",
         "password": true
       }
     ],
     "servers": {
       "candlestack": {
         "type": "http",
         "url": "https://app.candlestack.tech/mcp",
         "headers": {
           "Authorization": "Bearer ${input:candlestack-key}"
         }
       }
     }
   }
   ```

3. **Start it**

   Choose Start above `candlestack` in the file and paste your key when asked. VS Code keeps it in its secret storage.

4. **Check it**

   Open Chat in Agent mode and choose the tools button. CandleStack is listed with its tools.

### claude.ai *Soon*

claude.ai adds remote servers as custom connectors, which sign in through OAuth and cannot send an API key. CandleStack gets OAuth sign-in after the server is on app.candlestack.tech. Then you add it in Settings under Connectors, sign in with GitHub or Google and pick what Claude may do.

Until then, connect Claude Code.

### ChatGPT *Soon*

ChatGPT adds remote servers as connectors in developer mode, which sign in through OAuth and cannot send an API key. CandleStack gets OAuth sign-in after the server is on app.candlestack.tech. Then you create the connector with the server address, sign in with GitHub or Google and pick what ChatGPT may do.

Until then, connect Claude Code, Cursor or VS Code.

<!-- /tabs -->

## Check that it works

Ask this in a new chat.

```text prompt
Which CandleStack account are you connected to, and what may your key do?
```

The agent calls `get_me` and answers with your name and the scopes of your key.

## If it does not connect

- `not-signed-in` The request has no key. Check the header in your client's config.
- `invalid-api-key` The key is wrong, expired or revoked, or your account is not on the beta list. Create a new key in Settings.
- `missing-scope` A tool needs a scope the key lacks. Create a key that has it.
- `rate-limited` More than 120 requests a minute with one key. Wait for the seconds in `Retry-After`.
- **Nothing changes** Restart the client after you edit its config file.
