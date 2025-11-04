"""Entry point of the SummarizeWithin tool (version 2)."""
# noqa. pylint: disable=import-error
from stcore import execute_sw_tool


if __name__ == "__main__":
    execute_sw_tool(version=2, output_name_idx=12, context_idx=13)
