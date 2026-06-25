# Branch Protection TODO (owner-only manual steps)

Configure on `TerraFusionOS` after creation (Settings → Branches → Add rule for `main`):

- main protected
- pull request required before merging
- force pushes disabled
- branch deletion disabled
- admin bypass disabled (if available)
- required checks: none until validation tooling exists, or minimal receiving-vessel validation only

If configured via gh:
  gh api -X PUT repos/bsvalues/TerraFusionOS/branches/main/protection \
    -f required_pull_request_reviews.required_approving_review_count=1 \
    -F enforce_admins=true -F allow_force_pushes=false -F allow_deletions=false \
    -F required_status_checks=null -F restrictions=null

Mark this TODO done once protection is in place.
