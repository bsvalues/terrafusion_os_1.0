"""Execute the tool of ExtractData."""
# noqa. pylint: disable=import-error
from edcore import EDTool
from common import PAErrorProcessor


TASK_NAME = "ExtractData"
ERROR_CODES = [1115, 100024, 100049, 100050, 100051, 100052, 100136, 100140,
               100141, 100206]


def main():
    """Entry point for ExtractData tool."""
    try:
        ed_tool = EDTool(TASK_NAME, output_name_index=4, context_index=5)
        ed_tool.run()
    except Exception as err:
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()


if __name__ == "__main__":
    main()
