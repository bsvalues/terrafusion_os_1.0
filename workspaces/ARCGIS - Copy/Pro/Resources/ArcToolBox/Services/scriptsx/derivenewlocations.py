"""Execute the tool of DeriveNewLocations."""
from loccore import execute_tool


TASK_NAME = "DeriveNewLocations"


if __name__ == "__main__":
    execute_tool(TASK_NAME, outputname_index=2, context_index=3,
                 version=1.0)
