---
title: Docs for agents
description: Every page of these docs is also plain Markdown, so an agent can read it from a link.
section: agents
order: 1
updated: 2026-11-08
---

## One page as Markdown

Add `.md` to the address of a page, without the last slash. View as Markdown at the top of each page opens it, and Copy page copies it.

```text title="This page as Markdown"
https://candlestack.tech/docs/agents/docs-for-agents.md
```

## All pages at once

- `/llms.txt` Every page with one line about it, in the [llms.txt](https://llmstxt.org) format.
- `/llms-full.txt` Every page in one file.

Both are built with the site, so they always match the pages.

## Give the docs to an agent

Paste a link in the chat. An agent that can open links reads it itself.

```text prompt
Read https://candlestack.tech/llms-full.txt and tell me what CandleStack can do for an agent.
```

From your own code, fetch the file and put it in the context of the model.

```bash tab="curl"
curl -s https://candlestack.tech/llms-full.txt -o candlestack-docs.md
```

```python tab="Python"
import httpx

docs = httpx.get("https://candlestack.tech/llms-full.txt").raise_for_status().text
```

```js tab="JavaScript"
const docs = await fetch("https://candlestack.tech/llms-full.txt").then((r) => r.text())
```

## Without JavaScript

Every page works without JavaScript. Tools that do not run scripts get the whole text, and tabs show every language one after another.
