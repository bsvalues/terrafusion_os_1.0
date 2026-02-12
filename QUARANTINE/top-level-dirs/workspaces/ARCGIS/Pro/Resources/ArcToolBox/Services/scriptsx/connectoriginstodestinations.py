"""Entry point of ConnectOriginsToDestinations tool."""
# noqa. pylint: disable=import-error
from nacore import COTDTool, COTDErrorProcessor


TASK_NAME = "ConnectOriginsToDestinations"
ERROR_CODES = [
    100069, 100072, 100087, 100095, 100096, 100098, 100137, 100138, 100139, 100145, 100218, 100223, 100258, 100263,
    100271, 100272, 100273, 100358, 100365, 100366, 100361, 100362
]


def main():
    """Entry of ConnectOriginsToDestinations tool."""
    tool = None
    try:
        tool = COTDTool(TASK_NAME, output_name_index=7, context_index=8)
        tool.run()
    except Exception as err:
        COTDErrorProcessor(TASK_NAME, ERROR_CODES, err, None, tool).process()


if __name__ == "__main__":
    main()
