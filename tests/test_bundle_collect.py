import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import tfctl


def test_bundle_collect_truncates_and_includes(tmp_path: Path):
    a = tmp_path / "a.log"
    b = tmp_path / "b.log"
    a.write_text("\n".join([f"line-{i}" for i in range(100)]))
    b.write_text("\n".join([f"B-{i}" for i in range(50)]))

    data = tfctl._bundle_collect(max_lines=10, since=None, includes=[str(a), str(b)])
    inc = data["logs"]["included"]
    assert "a.log" in inc and "b.log" in inc
    assert inc["a.log"].splitlines() == [f"line-{i}" for i in range(90,100)]
    assert inc["b.log"].splitlines() == [f"B-{i}" for i in range(40,50)]
