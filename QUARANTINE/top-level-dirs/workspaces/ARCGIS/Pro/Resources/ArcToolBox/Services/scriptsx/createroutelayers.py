"""Entry point of CreateRouteLayers tool."""
# noqa. pylint: disable=import-error
from nacore import CRLTool
from common import RefundErrorProcessor


TASK_NAME = "CreateRouteLayers"
ERROR_CODES = [100069, 100072, 100087, 100137, 100075, 100076, 100145, 100153, 100212, 100213, 100214, 100224, 100225,
               100226, 100219, 100246, 100247, 100258, 100264, 100265, 100266, 100267]


def main():
    """Entry of CreateRouteLayers tool."""
    tool = None
    try:
        tool = CRLTool(TASK_NAME, output_name_index=2, context_index=3)
        tool.run()
    except Exception as err:
        RefundErrorProcessor(TASK_NAME, ERROR_CODES, err, tool = tool).process()


if __name__ == "__main__":
    main()
