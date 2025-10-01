import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import tfctl  # noqa


def test_tail_handles_multibyte_utf8_boundary(tmp_path: Path):
    # 'é' is 2 bytes in UTF-8; build a file whose chunk split falls mid-character
    # create ~9KB of ASCII, then append lines with multibyte chars
    big = "A" * 9000 + "\n"
    tail_lines = [f"línea-{i} café" for i in range(1, 21)]
    content = big + ("\n".join(tail_lines)) + "\n"
    f = tmp_path / "utf8.log"
    # Write as UTF-8
    f.write_text(content, encoding="utf-8")
    # Ask for last 10 lines; ensure we didn't corrupt characters
    out = tfctl._tail_file_lines(f, max_lines=10, chunk_size=8192)
    assert out == tail_lines[-10:]
    # Ensure no replacement character appeared
    assert not any("\ufffd" in line for line in out)
