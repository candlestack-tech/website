---
title: Install the MCP server
nav: Install
description: Connect CandleStack to your AI client. It takes about a minute.
section: mcp
order: 1
updated: 2026-11-08
---

```text address title="Server address"
https://app.candlestack.tech/mcp
```

Streamable HTTP. claude.ai, ChatGPT, Claude Code and Codex sign in with OAuth. You add the address, sign in to CandleStack and choose what the app may do, with no key to copy. Cursor, VS Code, scripts and other clients send an API key in a header. Claude Code and Codex can use a key too.

## Pick your client

<!-- tabs -->

### Claude Code

1. **Add the server**

   ```bash title="Terminal"
   claude mcp add --transport http candlestack https://app.candlestack.tech/mcp
   ```

   Add `--scope user` to use the server in every project, not only this one.

2. **Sign in**

   Run `claude mcp login candlestack`, or `/mcp` in a session, and follow the steps in your browser. A CandleStack page opens. Sign in, check that it returns to localhost, your own computer, pick what Claude Code may do and choose Allow.

3. **Check it**

   Run `claude mcp list`. The line for `candlestack` ends with ✔ Connected. Before you sign in it shows ! Needs authentication, and ✘ Failed to connect when the server cannot be reached or refuses the sign-in. In a session, `/mcp` lists it with its tools.

To sign in with an API key instead, for scripts or a machine with no browser:

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

1. **Add the connector**

   1. In claude.ai open Customize, then Connectors.
   2. Choose + Add, then Add custom connector.
   3. Name it `CandleStack`, paste the server address and choose Continue.
   4. Check the authentication settings claude.ai found and choose Continue.
   5. Under Authentication choose Sign in now. Under OAuth client keep Use Claude's published identity. Leave Request headers empty and choose Add.

   On Team and Enterprise plans an owner adds it in Organization settings, then Connectors, then Add, Custom and Web, with the same steps. Members then choose Connect next to it under Customize, then Connectors. Each member signs in as themselves.

2. **Sign in and allow**

   A CandleStack page opens. Sign in with GitHub or Google, check the app it names and that it returns to claude.ai, pick what Claude may do and choose Allow. [Signing in with OAuth](#signing-in-with-oauth) says what the page shows.

3. **Turn it on in a chat**

   Choose + at the lower left of the chat, then Connectors, and switch CandleStack on.

### ChatGPT

1. **Add the server**

   1. In ChatGPT on the web open Plugins, choose +, then Add custom MCP server.
   2. Name it `CandleStack`. Under Connection paste the server address as the Server URL.
   3. Set the authentication to OAuth.
   4. Read the risk warning. Tick I understand and want to continue, then choose Create as a plugin.

   Then install the plugin from your plugins, or from the workspace you created it in. In a workspace, its permissions decide who may add a server.

2. **Sign in and allow**

   When ChatGPT connects, a CandleStack page opens. Sign in with GitHub or Google, check the app it names and that it returns to chatgpt.com, pick what it may do and choose Allow. [Signing in with OAuth](#signing-in-with-oauth) says what the page shows.

3. **Use it in a chat**

   Type `@` in a new chat and pick CandleStack. ChatGPT usually asks you to confirm a tool that changes data before it runs.

### Codex

The Codex CLI and the Codex IDE extension share their settings in `~/.codex/config.toml`.

1. **Add the server**

   ```bash title="Terminal"
   codex mcp add candlestack --url https://app.candlestack.tech/mcp
   ```

   This adds the server to `~/.codex/config.toml`. You can also write the entry yourself.

   ```toml title="~/.codex/config.toml"
   [mcp_servers.candlestack]
   url = "https://app.candlestack.tech/mcp"
   ```

2. **Sign in**

   Run `codex mcp login candlestack`. A CandleStack page opens in your browser. Sign in, check that it returns to 127.0.0.1, your own computer, pick what Codex may do and choose Allow. In the IDE extension choose Authenticate when it asks.

   With no browser on the machine, run `codex mcp login candlestack --no-browser`. Open the address it prints in a browser, then paste the address you land on back into the terminal.

3. **Check it**

   Run `codex mcp list` to see `candlestack`. In a Codex session, `/mcp` shows the servers in use.

To sign in with an API key instead, create a key in Settings, then API and MCP, and keep it in `CANDLESTACK_KEY` as for [Cursor](#cursor). Then name the variable in the entry. Codex sends the key with every request.

```toml title="~/.codex/config.toml"
[mcp_servers.candlestack]
url = "https://app.candlestack.tech/mcp"
bearer_token_env_var = "CANDLESTACK_KEY"
```

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

## Signing in with OAuth

claude.ai, ChatGPT, Claude Code and Codex send you to a CandleStack page to connect. Sign in there with GitHub or Google if you are not signed in yet. Your account must be on the beta list.

- **Who asks** The page names the app and the address it sends you back to, such as claude.ai or chatgpt.com, or your own computer (localhost or 127.0.0.1) for Claude Code and Codex. Anyone can call an app Claude, so check the address.
- **Which account** It shows the account you are signed in as. Not you? signs you out, so you can sign in with another.
- **What it may do** You tick the scopes the app asked for. Read is always on.
- **Allow or Cancel** Allow sends you back to the app, signed in. Cancel sends you back with no access.
- **Never** No app can delete your account, change how you sign in or download your model files.

The scopes, in the words of the page:

- **Read** See your backtests, models and market data. Always on.
- **Run backtests** Start, rename and star backtests. Ticked at the start.
- **Manage models** Upload, rename and delete your models. Ticked at the start.
- **Publish** Publish and unpublish backtests in Experiments. Unticked at the start.

The page works once, for 10 minutes. If it says the request has expired, go back to the app and connect again. The app stays signed in while you use it. After 30 days without use it has to connect again.

### Disconnect an app

In the app open Settings, then API and MCP. Connected apps lists every app that signed in with your account, with its scopes, when it was connected and when it was last used. Choose Disconnect next to an app and confirm. It loses access at once. You can connect it again from the app any time.

## Check that it works

Ask this in a new chat.

```text prompt
Which CandleStack account are you connected to, and what are you allowed to do?
```

The agent calls `get_me` and answers with your name and the scopes of your key or of the app.

## If it does not connect

Clients show their own message, such as Failed to connect or Needs authentication. The server's answer, with what to do, is in the client's log.

- **Claude Code** `claude mcp list` prints it after Failed to connect. `claude --debug` logs every request.
- **Codex** `codex mcp list` and `/mcp` in a session.
- **Cursor** The Output panel, then MCP Logs.
- **VS Code** MCP: List Servers, then `candlestack`, then Show Output.

What the server answers:

- **Not signed in** The request had no key and no sign-in. Check the header in your client's config, and on Cursor that `CANDLESTACK_KEY` is set. With OAuth, connect again.
- **Invalid API key** The key is wrong, expired or revoked, or your account is not on the beta list. Create a new key in Settings.
- **Invalid access token** The app's sign-in ended or the app was disconnected, or your account is not on the beta list. Connect again from the app.
- **Missing scope** A tool needs a scope the key or app lacks, and the agent tells you which. Create a key that has it, or disconnect the app and connect it again with that scope ticked.
- **Too many requests** One key or connected app can make 120 requests a minute, and all of yours together 300. The answer says how many seconds to wait in `retry_after_s`. See [Rate limits](/docs/api/rate-limits/).
- **Nothing changes** Restart the client after you edit its config file.
