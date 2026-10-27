---
title: Manifest too large
status: 413
summary: The manifest is larger than 1 MB, the largest one CandleStack keeps.
when:
  - The manifest sent to PUT /api/v1/models/<id>/manifest, or the size the client announced for it, is larger than 1 MB. This is almost always a large example.
todo:
  - Give the manifest a smaller example, with fewer samples, then send it again.
---
