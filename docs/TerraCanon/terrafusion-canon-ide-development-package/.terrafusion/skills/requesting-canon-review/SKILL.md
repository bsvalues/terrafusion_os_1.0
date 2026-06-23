# requesting-canon-review

## Purpose

Review diff against architecture, not just syntax.

## Review checklist

- Does the diff violate shell contract?
- Does it cross write-lanes?
- Does it edit protected paths?
- Does it introduce hardcoded ports?
- Does it require manual review?
- Are required gates present?
