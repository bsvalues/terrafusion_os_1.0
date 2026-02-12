"""Entry point of the CreateThresholdAreas tool."""
# noqa. pylint: disable=import-error
from bacore import CTATool
from common import PAErrorProcessor, LogUtils

TASK_NAME = "CreateThresholdAreas"
ERROR_CODES = []

LOGGER = LogUtils.setup_logger(__name__)

def main():
    """Entry of the CreateThresholdAreas tool."""
    try:
        cta_tool = CTATool(TASK_NAME, output_name_index=14, context_index=15)
        cta_tool.run()
    except Exception as err:  # noqa. pylint: disable=broad-except
        # Show error messages associate with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()


if __name__ == "__main__":
    main()
