---
title: Larger than the link
status: 413
summary: The file is larger than the size its upload link was made for.
when:
  - The Content-Length of the upload is over the size_bytes of the link. The link stays unused then.
  - The file turns out larger while it uploads. The link is used then.
todo:
  - Ask for a new link with the size of the file in bytes, then send the file to it.
fields:
  - name: size_bytes
    description: The largest file the link takes, in bytes.
---
