"""Entry point of the AggregatePoints analysis tool (version1)."""
# noqa. pylint: disable=import-error
from stcore import execute_ap_tool


if __name__ == "__main__":
    execute_ap_tool(version=1, output_name_idx=7, context_idx=8)
