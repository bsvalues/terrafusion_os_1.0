"""Entry point of the AggregatePoints analysis tool (version2)."""
# noqa. pylint: disable=import-error
from stcore import execute_ap_tool


if __name__ == "__main__":
    execute_ap_tool(version=2, output_name_idx=10, context_idx=11)
