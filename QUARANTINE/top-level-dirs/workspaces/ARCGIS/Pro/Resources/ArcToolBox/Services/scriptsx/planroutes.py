"""Entry point of PlanRoutes tool."""
# noqa. pylint: disable=import-error
from nacore import PRErrorProcessor, PRTool


TASK_NAME = "PlanRoutes"
ERROR_CODES = [100064, 100065, 100066, 100067, 100068, 100069, 100070, 100071, 100072, 100073, 100074, 100075, 100076,
               100087, 100274, 100275, 100095, 100096, 100097, 100098, 100113, 100114, 100115, 100116, 100145, 100147,
               100217, 100223, 100252, 100258, 100276, 100277, 100292, 100293]


def main():
    """Entry of PlanRoutes tool."""
    tool = None
    try:
        tool = PRTool(TASK_NAME, output_name_index=12, context_index=13)
        tool.run()
    except Exception as err:
        PRErrorProcessor(TASK_NAME, ERROR_CODES, err, None, tool).process()


if __name__ == "__main__":
    main()
