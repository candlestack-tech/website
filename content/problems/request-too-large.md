---
title: Request too large
status: 413
summary: The body of a request to the MCP server is larger than 2 MB, the most the server reads.
when:
  - A request to the MCP server at /mcp has a body over 2 MB, by its Content-Length header or by the bytes that arrive. It still counts against your rate limit.
todo:
  - Send less in one call. The largest argument a tool takes is a manifest of up to 1 MB.
  - Send a model file to the one-time link of create_model_upload, never inside a tool call.
---
