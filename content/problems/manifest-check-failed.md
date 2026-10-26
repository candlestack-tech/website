---
title: Manifest check failed
status: 422
summary: The manifest did not pass its checks, so it was not kept and the model stays as it was.
when:
  - schema - the manifest does not have the right form, for example a missing field, a value of the wrong type or a list longer than allowed.
  - catalog - a block, or its version, does not exist, or it is used in the wrong step. unknown_blocks names the blocks that do not exist.
  - params - a parameter of a block has the wrong type or is out of its range.
  - names - two features have the same name, or a feature is named ts or row_id.
  - signature - signature.input is not [window length, number of features], or signature.output is not [1].
  - example - the shapes of the example do not match the signature.
  - model - the signature does not match the input or the output of the uploaded model file.
todo:
  - Read problems, which says in one sentence each what is wrong, and fix those parts of the manifest.
  - Take block names, versions and parameter ranges from the catalog at GET /api/v1/preprocessing/catalog.
  - Send the whole manifest again; it is checked from the start.
fields:
  - name: problems
    description: What is wrong, at most 10 items, each with check (one of the values above) and detail (one sentence).
  - name: more_problems
    description: How many more problems there are beyond the ones listed.
  - name: unknown_blocks
    description: Blocks the manifest names that the catalog does not have.
---
