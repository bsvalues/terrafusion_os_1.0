# Fix `: ambiguous redirect` Warning

## Problem
You see `: ambiguous redirect` printed before any `tf.sh` output.

## Root Cause
**NOT from tf.sh** - it's from your `~/.bashrc` or `~/.bash_profile`.

The sterile shell test proved it:
```bash
env -i PATH=/usr/bin:/bin HOME="$HOME" USER="$USER" /usr/bin/timeout 5 ./ops/dev/tf.sh gate 2>&1 | head -5
# ✓ NO redirect warning appeared
```

## Find the Culprit

```bash
grep -n '> ' ~/.bashrc ~/.bash_profile ~/.profile 2>/dev/null | grep -v '#'
```

Look for unquoted redirects like:
- `: > $VAR` where `$VAR` is empty
- `echo > $FILE` where `$FILE` has spaces
- `something > ${path}` where path is unset

## Common Patterns

**Wrong:**
```bash
LOG_FILE="$HOME/my file.log"  # space in name
: > $LOG_FILE  # AMBIGUOUS REDIRECT
```

**Right:**
```bash
LOG_FILE="$HOME/my_file.log"
: > "${LOG_FILE}"  # Quoted, safe
```

## Quick Fix
Once you find the line, either:
1. Quote the variable: `: > "${VAR}"`
2. Guard it: `[[ -n "${VAR:-}" ]] && : > "${VAR}"`
3. Remove the redirect if unused

## Verify
```bash
bash -l -c "echo test" 2>&1 | grep ambiguous
# Should output nothing
```
