"""Entry point of ChooseBestFacilities tool."""
# noqa. pylint: disable=import-error
from nacore import CBFTool, CBFErrorProcessor


TASK_NAME = "ChooseBestFacilities"
ERROR_CODES = [100151, 100152, 100154, 100155, 100156, 100157, 100158]

def main():
    """Entry of ChooseBestFacilities tool."""
    tool = None
    try:
        tool = CBFTool(TASK_NAME, output_name_index=19, context_index=20)
        tool.run()
    except Exception as err:
        CBFErrorProcessor(TASK_NAME, ERROR_CODES, err, None, tool).process()


if __name__ == "__main__":
    main()
