---
title: No manifest
status: 404
summary: The model has no manifest yet, so there is nothing to show.
when:
  - GET /api/v1/models/<id>/manifest is called for a model that was uploaded but has no manifest yet.
todo:
  - Add a manifest with PUT /api/v1/models/<id>/manifest. It tells CandleStack how to build the model's input from candles.
---
