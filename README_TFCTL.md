# tfctl (TerraFusion Control Tool) — Operator cheatsheet

This file documents the recommended operator-facing commands for `tfctl.py` in the repo root.

Quick commands

- Launch stack (foreground, open UI):

```bash
python3 tfctl.py launch --open --fg
```

- Show resolved env (.env overlays and shell):

```bash
python3 tfctl.py env
```

- Health snapshot:

```bash
python3 tfctl.py diag --pretty
```

- Try non-destructive repairs:

```bash
python3 tfctl.py fix
```

- Create a diagnostic bundle (zip) and optionally upload to S3:

```bash
export TF_BUNDLE_S3_BUCKET=my-bucket
python3 tfctl.py bundle --max-lines 1000 --since "1 hour ago" --include ./tfctl_launch.log --upload-s3
```

CI and testing

- Run tests locally (use the pinned dev requirements):

```bash
python -m pip install -r requirements-dev.txt
pytest -q
```

Notes
- Keep secrets and credentials out of repo — use environment variables or a secret manager.
- For production, prefer systemd socket activation or the provided `tfctl.socket` + `tfctl@.service` templates.
- If the S3 upload is used, set `TF_BUNDLE_S3_BUCKET` and optionally `TF_BUNDLE_S3_PREFIX` and `AWS_REGION`.
# tfctl (TerraFusion Control Tool)

Quick ops cheatsheet

## Daily ops

- Start (foreground logs): `python3 tfctl.py launch --open --fg`
- Start (background, open UI): `python3 tfctl.py launch --open`
- Health: `python3 tfctl.py status` → prints JSON + one-line summary
- Auto-repair: `python3 tfctl.py fix` → calls shims (swarm/sync/security/flow/workflow/analytics)
- Session logs (best effort): `python3 tfctl.py logs`
- Stop spawned procs from this session: `python3 tfctl.py kill`

## systemd

Create a unit file `/etc/systemd/system/tfctl.service` and point `WorkingDirectory` to your repo root.
Use `ExecStart=/usr/bin/python3 tfctl.py launch --open` for unattended runs (omit `--fg`).

Then:

```
sudo systemctl daemon-reload
sudo systemctl enable tfctl.service
sudo systemctl start tfctl.service
journalctl -u tfctl.service -f
```
