#!/usr/bin/env python3
"""Extract JSON inventory from agent output files (JSONL conversation transcripts)."""
import json
import re
import sys
from pathlib import Path


def find_largest_json_array(text: str) -> list | None:
    """Find the largest JSON array in a text string."""
    best = None
    # Search for ```json blocks first
    for match in re.finditer(r'```json\s*(\[[\s\S]*?\])\s*```', text):
        try:
            data = json.loads(match.group(1))
            if isinstance(data, list) and (best is None or len(data) > len(best)):
                best = data
        except json.JSONDecodeError:
            pass

    if best and len(best) > 5:
        return best

    # Fallback: find standalone arrays by bracket matching
    i = 0
    while i < len(text):
        if text[i] == '[':
            depth = 0
            start = i
            for j in range(i, len(text)):
                if text[j] == '[':
                    depth += 1
                elif text[j] == ']':
                    depth -= 1
                    if depth == 0:
                        try:
                            data = json.loads(text[start:j+1])
                            if isinstance(data, list) and (best is None or len(data) > len(best)):
                                best = data
                        except json.JSONDecodeError:
                            pass
                        break
            i = j + 1 if depth == 0 else i + 1
        else:
            i += 1

    return best


def main():
    if len(sys.argv) != 3:
        print("Usage: extract_inventory.py <agent_output_file> <output_json>")
        return 1

    output_path = Path(sys.argv[1])
    content = output_path.read_text(encoding='utf-8', errors='replace')

    # Try parsing as JSONL (conversation transcript)
    all_text = ""
    for line in content.split('\n'):
        line = line.strip()
        if not line:
            continue
        try:
            record = json.loads(line)
            # Extract text content from assistant messages
            msg = record.get("message", {})
            if msg.get("role") == "assistant":
                msg_content = msg.get("content", "")
                if isinstance(msg_content, str):
                    all_text += msg_content + "\n"
                elif isinstance(msg_content, list):
                    for block in msg_content:
                        if isinstance(block, dict) and block.get("type") == "text":
                            all_text += block.get("text", "") + "\n"
        except json.JSONDecodeError:
            all_text += line + "\n"

    if not all_text.strip():
        all_text = content

    data = find_largest_json_array(all_text)

    if data is None or len(data) == 0:
        print("Could not find JSON array in agent output")
        return 1

    Path(sys.argv[2]).write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding='utf-8'
    )
    print(f"Saved {len(data)} assets to {sys.argv[2]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
