---
title: Tools
description: Every tool of the MCP server with its parameters and an example call, generated from the server itself.
section: mcp
order: 2
updated: 2026-11-08
---

> [!NOTE]
> **Available from the next release.** The server and all its tools are live on stage.candlestack.tech and come to app.candlestack.tech with the next release.

Each tool does the same as an endpoint of the API, with the same checks. Your client reads the same descriptions and schemas from the server when it connects.

A failed call is a tool error. Its text is the problem as JSON, with a `type` that names the error and a `detail` that says what to do, as in [Problem types](/problems/).

<!-- mcp-tools -->
