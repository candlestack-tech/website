---
title: Confirmation mismatch
status: 409
summary: A delete tool of the MCP server got a name or a count to confirm that does not match, so nothing was deleted.
when:
  - delete_model got a confirm_name that is not the model's name exactly, extension included.
  - delete_backtests got a confirm_count that is not how many backtests match. Some may be deleted already, or the sweep has more backtests than confirmed.
todo:
  - Nothing was deleted. Check with the user what you are about to delete.
  - For delete_model, give the name exactly as list_models shows it.
  - For delete_backtests, confirm the real count once the user agrees to it. count in the answer gives it, and get_sweep gives the count of a sweep.
fields:
  - name: count
    description: Only for delete_backtests. How many backtests match.
---
