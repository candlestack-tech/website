---
title: Upload link of another account
status: 403
summary: The upload page was opened while signed in with another account than the one that asked for the link.
when:
  - An upload link (/upload/<token>) is opened in a browser signed in with another account than the one that asked for it. The page shows nothing of the link.
todo:
  - Sign in with the account that asked for the link, then open the link again.
  - Or ask for a new link with the account you are signed in with.
---
