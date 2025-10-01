import sys, subprocess
from pathlib import Path
import types

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import tfctl  # noqa


def test_bundle_collect_handles_missing_journalctl(monkeypatch, tmp_path: Path):
    # Simulate missing journalctl by raising FileNotFoundError
    def fake_run(*a, **k):
        raise FileNotFoundError
    monkeypatch.setattr(subprocess, "run", fake_run)

    # Include two files to ensure includes still work
    a = tmp_path / "a.log"; a.write_text("\n".join([f"a-{i}" for i in range(50)]))
    b = tmp_path / "b.log"; b.write_text("\n".join([f"b-{i}" for i in range(20)]))

    data = tfctl._bundle_collect(max_lines=5, since=None, includes=[str(a), str(b)])
    # journalctl may be absent -> key might be missing; includes must be present
    inc = data["logs"]["included"]
    assert "a.log" in inc and "b.log" in inc
    assert inc["a.log"].splitlines() == [f"a-{i}" for i in range(45,50)]
    assert inc["b.log"].splitlines() == [f"b-{i}" for i in range(15,20)]


def test_bundle_collect_uses_journal_output(monkeypatch):
    # Simulate journalctl output and ensure truncation happens
    class R:  # simple CompletedProcess-like
        def __init__(self, out): self.stdout = out
    lines = "\n".join([f"J-{i}" for i in range(100)])
    monkeypatch.setattr(subprocess, "run", lambda *a, **k: R(lines))
    data = tfctl._bundle_collect(max_lines=7, since="1 hour ago", includes=[])
    assert "journalctl" in data["logs"]
    assert data["logs"]["journalctl"].splitlines() == [f"J-{i}" for i in range(93,100)]
