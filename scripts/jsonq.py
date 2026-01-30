#!/usr/bin/env python3
"""
jsonq.py - Portable JSON Query Tool (jq replacement)
=====================================================
Constitutional requirement: TSS verification cannot skip due to missing tools.
This script provides jq-equivalent functionality using only Python stdlib.

Usage:
  python3 jsonq.py <file> <path> [--raw|-r]
  python3 jsonq.py <file> <path> --equals <value>
  python3 jsonq.py <file> <path> --equals-bool <true|false>
  python3 jsonq.py <file> <path> --matches <regex>
  python3 jsonq.py <file> <path> --len-ge <n>
  python3 jsonq.py <file> <path> --len-eq <n>
  python3 jsonq.py <file> <path> --exists
  python3 jsonq.py <file> <path> --type

Path syntax:
  .key              - access object key
  .key.subkey       - nested access
  .[0]              - array index
  .key[0].subkey    - combined

Exit codes:
  0 - Success / assertion passed
  1 - Assertion failed / value not found
  2 - File not found / parse error
  3 - Invalid arguments

Examples:
  jsonq.py config.json '.mode' -r
  jsonq.py auth.json '.tss.signature_path' -r
  jsonq.py proof.json '.speclock_ok' --equals-bool true
  jsonq.py manifest.json '.signers' --len-ge 2
  jsonq.py receipt.json '.sha256' --matches '^[a-f0-9]{64}$'
"""
import argparse
import json
import re
import sys
from typing import Any


def parse_path(path: str) -> list:
    """Parse JSON path like '.key.subkey[0].value' into tokens."""
    if not path or path == '.':
        return []

    tokens = []
    current = ''
    i = 0
    path = path.lstrip('.')

    while i < len(path):
        c = path[i]
        if c == '.':
            if current:
                tokens.append(current)
                current = ''
        elif c == '[':
            if current:
                tokens.append(current)
                current = ''
            # Find closing bracket
            j = i + 1
            while j < len(path) and path[j] != ']':
                j += 1
            idx_str = path[i+1:j]
            try:
                tokens.append(int(idx_str))
            except ValueError:
                # Quoted key like ['key']
                tokens.append(idx_str.strip("'\""))
            i = j
        else:
            current += c
        i += 1

    if current:
        tokens.append(current)

    return tokens


def get_value(data: Any, path: str) -> Any:
    """Extract value at path from data."""
    tokens = parse_path(path)
    current = data

    for token in tokens:
        if isinstance(token, int):
            if not isinstance(current, list) or token >= len(current):
                raise KeyError(f"Index {token} out of range")
            current = current[token]
        elif isinstance(current, dict):
            if token not in current:
                raise KeyError(f"Key '{token}' not found")
            current = current[token]
        else:
            raise KeyError(f"Cannot access '{token}' on {type(current).__name__}")

    return current


def format_output(value: Any, raw: bool = False) -> str:
    """Format value for output."""
    if raw and isinstance(value, str):
        return value
    return json.dumps(value)


def main():
    parser = argparse.ArgumentParser(
        description="Portable JSON query tool (jq replacement)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument("file", help="JSON file to query")
    parser.add_argument("path", help="JSON path (e.g., .key.subkey)")
    parser.add_argument("-r", "--raw", action="store_true",
                        help="Output raw string (no quotes)")

    # Assertion modes
    parser.add_argument("--equals", metavar="VALUE",
                        help="Assert value equals (string comparison)")
    parser.add_argument("--equals-bool", metavar="BOOL", choices=["true", "false"],
                        help="Assert boolean value")
    parser.add_argument("--matches", metavar="REGEX",
                        help="Assert string matches regex")
    parser.add_argument("--len-ge", metavar="N", type=int,
                        help="Assert array/string length >= N")
    parser.add_argument("--len-eq", metavar="N", type=int,
                        help="Assert array/string length == N")
    parser.add_argument("--exists", action="store_true",
                        help="Assert path exists (exit 0 if exists)")
    parser.add_argument("--type", action="store_true",
                        help="Output type name instead of value")

    args = parser.parse_args()

    # Load JSON file
    try:
        with open(args.file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"ERROR: File not found: {args.file}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as e:
        print(f"ERROR: Invalid JSON: {e}", file=sys.stderr)
        return 2

    # Get value at path
    try:
        value = get_value(data, args.path)
    except KeyError as e:
        if args.exists:
            return 1  # Does not exist
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    # Handle --exists
    if args.exists:
        return 0  # Exists

    # Handle --type
    if args.type:
        type_map = {
            dict: "object",
            list: "array",
            str: "string",
            int: "number",
            float: "number",
            bool: "boolean",
            type(None): "null"
        }
        print(type_map.get(type(value), "unknown"))
        return 0

    # Handle assertions
    if args.equals is not None:
        actual = str(value) if not isinstance(value, str) else value
        if actual == args.equals:
            return 0
        print(f"FAIL: '{actual}' != '{args.equals}'", file=sys.stderr)
        return 1

    if args.equals_bool is not None:
        expected = args.equals_bool == "true"
        if value is expected:
            return 0
        print(f"FAIL: {value} != {expected}", file=sys.stderr)
        return 1

    if args.matches is not None:
        if not isinstance(value, str):
            print(f"FAIL: Cannot match regex on {type(value).__name__}", file=sys.stderr)
            return 1
        if re.match(args.matches, value):
            return 0
        print(f"FAIL: '{value}' does not match '{args.matches}'", file=sys.stderr)
        return 1

    if args.len_ge is not None:
        if not hasattr(value, '__len__'):
            print(f"FAIL: {type(value).__name__} has no length", file=sys.stderr)
            return 1
        if len(value) >= args.len_ge:
            return 0
        print(f"FAIL: length {len(value)} < {args.len_ge}", file=sys.stderr)
        return 1

    if args.len_eq is not None:
        if not hasattr(value, '__len__'):
            print(f"FAIL: {type(value).__name__} has no length", file=sys.stderr)
            return 1
        if len(value) == args.len_eq:
            return 0
        print(f"FAIL: length {len(value)} != {args.len_eq}", file=sys.stderr)
        return 1

    # Default: output value
    print(format_output(value, args.raw))
    return 0


if __name__ == "__main__":
    sys.exit(main())
