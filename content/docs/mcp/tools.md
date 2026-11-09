---
title: Tools
description: Every tool of the MCP server with its parameters and an example call, generated from the server itself.
section: mcp
order: 2
updated: 2026-11-09
---

Each tool does the same as an endpoint of the API, with the same checks. Your client reads the same descriptions and schemas from the server when it connects; to keep them short, the server leaves out the details that follow each description here, and an agent reads them with the `get_docs` tool.

A failed call is a tool error. Its text is the problem as JSON, with a `type` that names the error and a `detail` that says what to do, as in [Problem types](/problems/). A call over the [rate limit](/docs/api/rate-limits/) answers [rate-limited](/problems/rate-limited/) with `retry_after_s`, the seconds to wait.

<!-- mcp-tools -->
