---
title: Install the MCP server
nav: Install
description: Connect CandleStack to your AI client. It takes about a minute.
section: mcp
order: 1
updated: 2026-11-08
---

> [!NOTE]
> **Available from the next release.** The server and API keys are live on stage.candlestack.tech. These steps work on app.candlestack.tech once the next release brings them there.

```text address title="Server address"
https://app.candlestack.tech/mcp
```

Streamable HTTP. Claude Code, claude.ai, Cursor and VS Code sign in with an API key in a header. OAuth sign-in, with no key, is coming with [candlestack#408](https://github.com/candlestack-tech/candlestack/issues/408). ChatGPT needs it.

## Pick your client

<!-- tabs -->

### Claude Code

1. **Create a key**

   In the app open Settings, then API and MCP, and create a key with the `read` scope. Add `backtests` if the agent should start backtests. The key is shown once. Put it in a variable of your terminal.

   ```bash tab="macOS and Linux"
   export CANDLESTACK_KEY="cs_your_key"
   ```

   ```powershell tab="Windows"
   $env:CANDLESTACK_KEY = "cs_your_key"
   ```

2. **Add the server**

   ```bash tab="macOS and Linux"
   claude mcp add --transport http candlestack https://app.candlestack.tech/mcp \
     --header "Authorization: Bearer $CANDLESTACK_KEY"
   ```

   ```powershell tab="Windows"
   claude mcp add --transport http candlestack https://app.candlestack.tech/mcp --header "Authorization: Bearer $env:CANDLESTACK_KEY"
   ```

   Claude Code keeps the key in `~/.claude.json`, outside your project. Add `--scope user` to use the server in every project, not only this one.

3. **Check it**

   Run `claude mcp list`. The line for `candlestack` ends with ✔ Connected. In a session, `/mcp` lists it with its tools.

### claude.ai

1. **Create a key**

   In the app open Settings, then API and MCP, and create a key with the `read` scope. Add `backtests` if Claude should start backtests. The key is shown once.

2. **Add the connector**

   1. In claude.ai open Customize, then Connectors.
   2. Choose + Add, then Add custom connector.
   3. Name it `CandleStack`, paste the server address and choose Continue.
   4. Under Authentication choose No sign in.
   5. Under Request headers add `Authorization` with the value `Bearer cs_your_key`, then choose Add.

   On Team and Enterprise plans an owner adds it in Organization settings, then Connectors, then Add, Custom and Web, with the same steps. Members then choose Connect next to it under Customize, then Connectors.

3. **Turn it on in a chat**

   Choose + at the lower left of the chat, then Connectors, and switch CandleStack on.

OAuth sign-in is coming with [candlestack#408](https://github.com/candlestack-tech/candlestack/issues/408). Then you add the connector with only its address and sign in with GitHub or Google, with no key to paste.

> [!WARNING]
> **One key for everyone.** On Team and Enterprise plans everyone who uses the connector shares the key it was added with. Give that key the fewest scopes your team needs. With OAuth sign-in ([candlestack#408](https://github.com/candlestack-tech/candlestack/issues/408)) each member will sign in as themselves instead.

### ChatGPT *Soon*

ChatGPT adds remote servers as connectors in developer mode. They sign in through OAuth and have no field for an API key header. OAuth sign-in for CandleStack is coming with [candlestack#408](https://github.com/candlestack-tech/candlestack/issues/408). Then you create the connector with the server address, sign in with GitHub or Google and pick what ChatGPT may do.

Until then, connect Claude Code, claude.ai, Cursor or VS Code.

### Cursor

1. **Create a key**

   In the app open Settings, then API and MCP, and create a key with the `read` scope. Add `backtests` if the agent should start backtests. Keep it in an environment variable that Cursor sees after every restart.

   ```bash tab="macOS and Linux"
   # Add this line to ~/.zshrc or ~/.bashrc
   export CANDLESTACK_KEY="cs_your_key"
   ```

   ```powershell tab="Windows"
   # Sets it for your user, for apps started after this
   setx CANDLESTACK_KEY "cs_your_key"
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

   Then quit Cursor and open it again, so it reads the key.

3. **Check it**

   Open Customize in the sidebar. `candlestack` is listed among the MCP servers and switched on. If it shows an error, open the Output panel and pick MCP Logs.

### VS Code

1. **Create a key**

   In the app open Settings, then API and MCP, and create a key with the `read` scope. Add `backtests` if the agent should start backtests.

2. **Add the server**

   Put this in `.vscode/mcp.json` in your project. For every workspace, put it in the `mcp.json` of your user profile.

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

   VS Code asks for the key the first time the server starts and keeps it for later. Its Add Server flow marks these two files as kept for compatibility. They still work in local chat sessions, but VS Code does not pass a server that asks for a key to Copilot sessions.

3. **Start it**

   Run MCP: List Servers from the Command Palette, pick `candlestack`, choose Start Server and paste your key.

4. **Check it**

   In Chat choose Configure Tools in the chat input. `candlestack` is listed with its tools.

<!-- /tabs -->

## Check that it works

Ask this in a new chat.

```text prompt
Which CandleStack account are you connected to, and what may your key do?
```

The agent calls `get_me` and answers with your name and the scopes of your key.

## If it does not connect

Clients show their own message, such as Failed to connect or Needs authentication. The server's answer, with what to do, is in the client's log.

- **Claude Code** `claude mcp list` prints it after Failed to connect. `claude --debug` logs every request.
- **Cursor** The Output panel, then MCP Logs.
- **VS Code** MCP: List Servers, then `candlestack`, then Show Output.

What the server answers:

- **Not signed in** The request had no key, so the client tried OAuth sign-in, which the server does not offer yet. Check the header in your client's config, and on Cursor that `CANDLESTACK_KEY` is set.
- **Invalid API key** The key is wrong, expired or revoked, or your account is not on the beta list. Create a new key in Settings.
- **Missing scope** A tool needs a scope the key lacks, and the agent tells you which. Create a key that has it.
- **Too many requests** One key can make 120 requests a minute. Wait a minute and try again.
- **Nothing changes** Restart the client after you edit its config file.
