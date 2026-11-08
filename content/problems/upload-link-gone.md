---
title: Upload link gone
status: 410
summary: The upload link took its file already or expired. A link takes one file within 15 minutes.
when:
  - A file is sent to a link that was used before, whatever came of that upload.
  - A file is sent more than 15 minutes after the link was made.
  - The account of the link was deleted while the file was uploading.
todo:
  - Ask for a new link with POST /api/v1/models/uploads and send the file to it.
fields:
  - name: reason
    description: Why the link takes no file, used or expired.
---
