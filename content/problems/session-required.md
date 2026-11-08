---
title: Session required
status: 403
summary: API keys cannot do this. It needs the signed-in browser.
when:
  - A request with a key creates, lists or revokes keys.
  - A request with a key changes the profile or settings, deletes the account, removes a sign-in method or signs out.
todo:
  - Do it in the CandleStack app, signed in with GitHub or Google.
---
