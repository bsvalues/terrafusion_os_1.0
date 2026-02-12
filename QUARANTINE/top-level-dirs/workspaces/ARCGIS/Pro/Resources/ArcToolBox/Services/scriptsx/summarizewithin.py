"""Entry point of the SummarizeWithin tool (version 1)."""
# noqa. pylint: disable=import-error
from stcore import execute_sw_tool


if __name__ == "__main__":
    execute_sw_tool(version=1, output_name_idx=8, context_idx=9)
