"""Entry point of FindNearest tool."""
# noqa. pylint: disable=import-error
from nacore import FNTool, FNErrorProcessor


TASK_NAME = "FindNearest"
ERROR_CODES = [
    100031, 100032, 100033, 100036, 100037, 100038, 100040, 100145, 100217, 100218, 100223, 100258, 100259, 100263
]


def main():
    """Entry of FindNearest tool."""
    tool = None
    try:
        tool = FNTool(TASK_NAME, output_name_index=8, context_index=9)
        tool.run()
    except Exception as err:
        FNErrorProcessor(TASK_NAME, ERROR_CODES, err, None, tool).process()


if __name__ == "__main__":
    main()
