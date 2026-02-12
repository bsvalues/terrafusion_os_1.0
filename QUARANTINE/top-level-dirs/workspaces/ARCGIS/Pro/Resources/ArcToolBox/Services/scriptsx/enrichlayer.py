"""Entry of EnrichLayer tool."""
# noqa. pylint: disable=import-error

from elcore import ELTool
from common import RefundErrorProcessor


TASK_NAME = "EnrichLayer"
ERROR_CODES = [100020, 100022, 100023, 100024, 100041, 100044, 100045,
               100046, 100047, 100110, 100111, 100124, 100120, 100126,
               100143, 100148, 100159, 100160, 100231, 100242, 100048,
               100207, 100283, 100287, 100288]


def main():
    try:
        el_tool = ELTool(TASK_NAME, output_name_index=8, context_index=9)
        el_tool.run()
    except Exception as err:
        RefundErrorProcessor(TASK_NAME, ERROR_CODES, err).process()


if __name__ == "__main__":
    main()
