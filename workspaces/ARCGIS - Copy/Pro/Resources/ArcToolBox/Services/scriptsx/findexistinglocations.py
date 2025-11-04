"""Execute the tool of findexistinglocations (version 1)."""
from loccore import execute_tool


TASK_NAME = "FindExistingLocations"


if __name__ == "__main__":
    execute_tool(TASK_NAME, outputname_index=2, context_index=3, version=1)
