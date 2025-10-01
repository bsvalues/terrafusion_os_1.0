import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import tfctl


def test_tail_file_lines_chunk_boundaries(tmp_path: Path):
    # Create a file where lines are variable and ensure chunk boundary falls inside a line
    # Use a small chunk_size when calling the helper indirectly by writing a file large enough
    lines = [f"line-{i}" for i in range(300)]
    data = "\n".join(lines) + "\n"
    f = tmp_path / "big.log"
    f.write_text(data)

    # call the internal function directly with small chunk to simulate boundary splits
    res = tfctl._tail_file_lines(f, 25, chunk_size=64)
    assert res == lines[-25:]

    # also check with a chunk size that exactly matches last line boundary
    res2 = tfctl._tail_file_lines(f, 10, chunk_size=512)
    assert res2 == lines[-10:]
