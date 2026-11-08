---
title: Upload interrupted
status: 400
summary: The upload through a link stopped before the whole file came, and the link is used.
when:
  - The connection broke or the client stopped while the file was uploading.
  - The server stopped during the upload. A link still checking after 5 minutes counts as interrupted.
todo:
  - Ask for a new link and send the file again.
  - The status of the link says upload-interrupted in its problem field.
---
