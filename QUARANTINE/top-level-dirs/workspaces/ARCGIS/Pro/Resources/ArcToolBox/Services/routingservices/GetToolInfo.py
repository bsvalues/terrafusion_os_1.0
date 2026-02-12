"""Get service limits and info about network dataset."""  # File name is based on tool name. pylint:disable=invalid-name

import logging
import json

import arcpy
import nat
import nast
import gti

LOG_LEVEL = logging.INFO  # log level for the tool.


class GPToolDialog(nat.NAToolExecutor):
    """Read parameter values from the tool dialog and perform tool execution."""

    # Define empty solts since the base class has slots
    __slots__ = ()

    def __init__(self, log_level=logging.INFO):
        """Call the executor.

        Args:
            log_level: The log level for the tool logger. Default is to log messages at info level which suppress any
                       information used for debugging the tool.
        Returns:
            No value.
        Raises:
            No exception.

        """
        # Set up the class logger
        super(GPToolDialog, self).__init__(log_level)
        # Setup the logger for core execution class.
        gti.GetToolInfo.logger = self.logger
        # Perform tool execution
        self.execute()

    @nat.time_exec
    def execute(self):
        """Read parameter values and perform tool execution."""
        # Read parameter values
        param_values = {
            "toolInfoFile": arcpy.GetParameterAsText(0),
            "serviceName": arcpy.GetParameterAsText(1),
            "toolName": arcpy.GetParameterAsText(2),
            "includeNetworkSourceInfo": arcpy.GetParameter(4),
        }
        # Call core execution logic
        try:
            tool = gti.GetToolInfo(**param_values)
            tool.execute()
            arcpy.SetParameterAsText(3, tool.tool_info)
        except nat.ToolExit:
            self.logger.debug("Exception details:", exc_info=True)
            raise SystemExit(1) from None
        except Exception:  # Need to handle any exception. pylint:disable=broad-except
            self.logger.info("Exception details:", exc_info=True)
            self.logger.error("", extra={"message_ID": 30206})
            self.logger.error("", exc_info=True, extra={"code": 30206, "method_name": "GetToolInfo"})
            raise SystemExit(10) from None
        finally:
            if nast.TIMER_MSGS:
                self.logger.info(json.dumps(nast.TIMER_MSGS, indent=None))
                nast.TIMER_MSGS.clear()


if __name__ == "__main__":
    GPToolDialog(LOG_LEVEL)
