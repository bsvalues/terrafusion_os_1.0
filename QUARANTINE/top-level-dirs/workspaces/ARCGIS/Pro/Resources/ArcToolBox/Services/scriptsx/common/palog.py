"""Module with log related functionalities."""
# pylint: disable=logging-fstring-interpolation
import os
import sys
import logging
import traceback
import functools
import time
import json
from typing import Optional, Union, Tuple, Dict, List
import re
from loggerutils import IDMessageHandler

import arcpy
import hostedgp as agolgp


LOG_LEVEL = logging.DEBUG

LOGGER = logging.getLogger(f"PA.{__name__}")
LOGGER.setLevel(LOG_LEVEL)

__all__ = ["LogUtils", "LogExecutionTime", "PAErrorProcessor", "GPMessageHandler",
           "DTGPMessageHandler", "PAError", "ToolExit", "ToolCancellation"]


class PAError(Exception):
    """Base exception class of the whole project."""
    pass


class ToolExit(PAError):
    """Exception raised when a tool needs to quit execution."""
    pass


class ToolCancellation(PAError):
    """Exception raised when a tool is cancelled."""
    pass


class GPMessageHandler(logging.Handler):
    """Allows GP messages to be written as part of the logging module."""

    def __init__(self):
        """Set the logger."""
        logging.Handler.__init__(self)
        self.__errors = {}

    def get_msg_config(self, record: logging.LogRecord):
        """Get the message function and type.

        Args:
            record - An instance of log record object passed by the logger.
        Returns:
            A tuple of (msg_function, msg_type)
        Raises:
            No execeptions.

        """
        # Select a GP message function based on the log level
        msg_function = arcpy.AddMessage
        msg_type = "INFORMATIVE"
        if record.levelno in (logging.WARN, logging.WARNING):
            msg_function = arcpy.AddWarning
            msg_type = "WARNING"
        elif record.levelno in (logging.CRITICAL, logging.FATAL, logging.ERROR):
            msg_function = arcpy.AddError
            msg_type = "ERROR"

        return (msg_function, msg_type)

    @property
    def errors(self) -> Dict:
        """To load errors from the resource file.

        Args:
            No arguments.
        Returns:
            No returns.
        Raises:
            No execeptions.

        """
        if not self.__errors:
            resource_folder = os.path.join(os.path.dirname(__file__), 'resources')
            error_codes_file = os.path.join(resource_folder, 'error_codes.json')
            with open(error_codes_file, encoding="utf-8") as json_data:
                self.__errors = json.load(json_data)

        return self.__errors

    def get_msg(self, message_id: Union[int, str], message: Optional[str],
                *args, **kwargs) -> str:
        """Get the error message based on the message_ID.

        Args:
            message_id: ID of the message (currently supports error message starts with either AO or GPEXT).
            *args: based on the order of the arguments.
            **kwargs: a dictionary keyed by the name of placeholder and valued by the message.
        Returns:
            A string message.
        Raises:
            A regular exception is raised if no such message based on the message_id.

        """
        if isinstance(message_id, int):
            message_id = 'AO_{}'.format(message_id)
        else:
            message_id = 'GPEXT_{}'.format(message_id)

        # If user has specified the message, then no need to look up from the errors.json
        if message:
            for tmp_key in ["messageCode", "message"]:
                if tmp_key in kwargs:
                    kwargs.pop(tmp_key)

            if kwargs:
                return json.dumps({"messageCode": message_id, "message": message})
            else:
                return json.dumps({"messageCode": message_id, "message": message, "params": kwargs})

        try:
            msg = self.errors[message_id]
            parameter_names = re.findall('{(.+?)}', msg)
            if args:
                if len(args) != len(parameter_names):
                    raise Exception(f"Can not match {args} to the number of parameters in the message.")
                parameters = dict(zip(parameter_names, args))
            else:
                parameters = kwargs

            # Format the error message
            msg_params = {}
            for param_name in parameter_names:
                msg = msg.replace(f'{{{param_name}}}', str(parameters[param_name]))
                msg_params[param_name] = parameters[param_name]

            if msg_params:
                return json.dumps({"messageCode": message_id, "message": msg, "params": msg_params})
            else:
                return json.dumps({"messageCode": message_id, "message": msg})
        except KeyError:
            raise KeyError('Unable to find message_ID of {}.'.format(message_id))

    def emit(self, record):
        """Log messages using GP message functions based on the log levels.

        Args:
            record - An instance of log record object passed by the logger.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        msg_function, msg_type = self.get_msg_config(record)
        # If we get kwargs, use arcpy.AddIDMessage
        if hasattr(record, "message_ID"):
            msg_args = []
            kwargs = {}
            if hasattr(record, "add_argument1"):
                msg_args.append(record.add_argument1)  # type: ignore
            if hasattr(record, "add_argument2"):
                msg_args.append(record.add_argument2)  # type: ignore
            # Can not use add_argument1 together with other attributes.
            if not msg_args:
                kwargs = vars(record)
            message = record.message_text if hasattr(record, "message_text") else None  # type: ignore
            # No need to look for message for self.__errors if user has specified the message already.
            try:
                tmp_msg = self.get_msg(record.message_ID, message, *msg_args, **kwargs)  # type: ignore
                msg_function(tmp_msg)
            except KeyError as err:
                if msg_type == "ERROR":
                    raise err
                else:
                    msg_function(f"Unable to find {record.message_ID}.")  # type: ignore
        else:
            # Add the message using standard GP message function
            msg_function(record.getMessage())


class DTGPMessageHandler(GPMessageHandler):
    """Message handler of desktop GP analysis tool."""

    def _get_match_arg(self, msg_id: Union[str, int], index: int, **kwargs) -> Optional[str]:
        """Get the positional argument value if it is passed in as keywoard arguments.

        Args:
            msg_id (Union[str, int]): id of the message.
            index (int): index of the positional argument to pull.

        Returns:
            Optional[str]: if content of the argument if the positional argument can
            be found by the msg_id, return None otherwise.
        """
        ao_msg_id = f"AO_{msg_id}"
        msg_template = self.errors.get(ao_msg_id)
        if msg_template:
            parameter_names = re.findall('{(.+?)}', msg_template)
            if len(parameter_names) > index:
                return kwargs.get(parameter_names[index])
        return None

    def emit(self, record: logging.LogRecord):
        """Emit out the message."""
        msg_function, msg_type = self.get_msg_config(record)
        if hasattr(record, "message_ID"):
            msg_id = record.message_ID  # type: ignore
            if hasattr(record, "add_argument1"):
                argument1 = record.add_argument1  # type: ignore
            else:
                argument1 = self._get_match_arg(msg_id, 0, **vars(record))

            if hasattr(record, "add_argument2"):
                argument2 = record.add_argument2  # type: ignore
            else:
                argument2 = self._get_match_arg(msg_id, 1, **vars(record))

            arcpy.AddIDMessage(msg_type, msg_id, argument1, argument2)
        else:
            msg_function(record.getMessage())


class LogUtils:
    """Log related utility functions."""

    @staticmethod
    def setup_logger(logger_name, log_level=LOG_LEVEL) -> logging.Logger:
        """Set the logger by adding approriate handlers.

        Args:
            logger_name: string represents the name of the logger.
            log_level: level of logging. If not specified, using the project log setup.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        logger = logging.getLogger(f"PA.{logger_name}")
        logger.setLevel(log_level)
        # logger.disable_existing_loggers = False
        # Add the GPMessageHandler in case the logger is not initialized with one
        gp_msg_handler = GPMessageHandler()
        gp_msg_handler.setLevel(log_level)
        if not logger.hasHandlers():
            logger.addHandler(gp_msg_handler)

        if not LOGGER.hasHandlers():
            LOGGER.addHandler(gp_msg_handler)
        return logger

    @staticmethod
    def time_exec(func):
        """Measure time in seconds to execute a function.

        This function is meant to be used as a decorator on class methods.

        """
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            """Wrap the function to be run."""
            start_time = time.time()
            return_val = func(*args, **kwargs)
            end_time = time.time()
            msg = {
                func.__qualname__: round(end_time - start_time, 3)
            }
            # msg_str = "Time to execute {}: {:.2f} seconds".format(func.__name__, end_time - start_time)
            msg = json.dumps(msg, indent=None)
            LOGGER.info(msg)
            return return_val
        return wrapper

    @staticmethod
    def log_usage(task_name: str, num_objects: int, cost: float, values: list):
        """Log the usage metering. Replacement of the previous LogUsageMetering function.

        Args:
            task_name: a string with the current name of task.
            num_objects: an integer with the total # of objects for calculation.
            cost: total cost (just to print out).
            values: a list of values involved in the calculation.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        value_msg = task_name + json.dumps(values)
        LOGGER.debug('NumObjects: {} Cost: {}'.format(num_objects, cost))  # No-qa. pylint: disable=W1202

        arcpy.gp._arc_object.LogUsageMetering(7777, value_msg, num_objects, 0.0)  # Method exists. pylint: disable=W0212

    @staticmethod
    def check_arcpyerror_bycode(error: arcpy.ExecuteError, error_code: Union[int, str]) -> bool:
        """Check if a certain error_code exists in the arcpy.ExecuteError object.

        Args:
            error (arcpy.ExecuteError): an arcpy.ExecuteError object.
            error_code (Union[int, str]): an error_code to check against.

        Returns:
            bool: True if the error_code exists and False otherwise.
        """
        if not isinstance(error, arcpy.ExecuteError):
            return False

        if error.args:
            exception_args = error.args[0]
            if isinstance(exception_args, str):
                if isinstance(error_code, int):
                    error_code = str(error_code)
                return error_code in exception_args
            elif isinstance(exception_args, list):
                return error_code in exception_args

        return False

    @staticmethod
    def reconfig_ss_logger():
        """Replace the SScripting logger's handler from IDMessageHandler with GPMessageHandler."""
        loggers = [logging.getLogger(name) for name in logging.root.manager.loggerDict]
        for logger in loggers:
            if logger.name.startswith("SSscripting."):
                for i in range(len(logger.handlers)):
                    if isinstance(logger.handlers[i], IDMessageHandler):
                        logger.handlers[i] = GPMessageHandler()
    
    @staticmethod
    def get_gp_msgs(msg_codes: List[int], msg_level: Optional[str] = None) -> List:
        """Get a list of GP messages based on the message codes."""
        if msg_level and msg_level.lower() not in ["warnings", "errors"]:
            raise ToolExit
        msgs = arcpy.gp.GetAllMessages()
        target_msgs = []
        if msgs:
            for msg in msgs:
                if msg_level is None and msg[1] in msg_codes:
                    target_msgs.append(msg)
                elif msg_level.lower() == "warnings" and msg[0] == 50 and msg[1] in msg_codes:
                    target_msgs.append(msg)
                elif msg_level.lower() == "errors" and msg[0] == 100 and msg[1] in msg_codes:
                    target_msgs.append(msg)
        return target_msgs


class LogExecutionTime:
    """Context manager to log the time elapsed to execute a code block."""

    def __init__(
        self,
        code_block_name: str,
        post_exe_handlers: Optional[List] = None,
    ):
        """Set up the property of code_block_name.

        Args:
            code_block_name: a string represents the name of the code block to execute.
            post_exe_handlers: handlers to execute if cancellation/failure happened
            during code block executing.

        """
        self.start_time = time.time()
        self.name = code_block_name
        self.post_exe_handlers = []
        self.auto_canc_state = arcpy.env.autoCancelling
        if post_exe_handlers:
            for pfunc in post_exe_handlers:
                if callable(pfunc):
                    self.post_exe_handlers.append(pfunc)

    def __enter__(self):
        """Enter the code block."""
        self.start_time = time.time()
        if self.post_exe_handlers:
            arcpy.env.autoCancelling = False

    def __exit__(self, exception_type, exception_value, traceback):
        """Exit the code block."""
        elp_time = time.time() - self.start_time
        if arcpy.env.isCancelled:
            try:
                LOGGER.debug("{0} cancelled in {1:.3f} seconds".format(self.name, elp_time))
                raise ToolCancellation
            except ToolCancellation as err:
                raise err
            finally:
                for pfunc in self.post_exe_handlers:
                    pfunc()
                arcpy.env.autoCancelling = self.auto_canc_state
        elif exception_value is None:
            LOGGER.debug("{0} completed in {1:.3f} seconds.".format(self.name, elp_time))
            arcpy.env.autoCancelling = self.auto_canc_state
        else:
            LOGGER.debug("{0} failed in {1:.3f} seconds.".format(self.name, elp_time))
            arcpy.env.autoCancelling = self.auto_canc_state
            for pfunc in self.post_exe_handlers:
                pfunc()


class PAErrorProcessor:
    """Provide functionalities to process the execution errors."""

    TASK_ERROR_CODES = {"AggregatePoints": 100001,
                        "FindHotSpots": 100007,
                        "CreateBuffers": 100012,
                        "OverlayLayers": 100013,
                        "SummarizeWithin": 100014,
                        "EnrichLayer": 100020,
                        "SummarizeNearby": 100025,
                        "ExtractData": 100026,
                        "DissolveBoundaries": 100027,
                        "CreateDriveTimeAreas": 100028,
                        "MergeLayers": 100029,
                        "FindNearest": 100030,
                        "FindExistingLocations": 100061,
                        "FindSimilarLocations": 100077,
                        "DeriveNewLocations": 100079,
                        "PlanRoutes": 100063,
                        "ConnectOriginsToDestinations": 100080,
                        "FieldCalculator": 100081,
                        "InterpolatePoints": 100104,
                        "CalculateDensity": 100105,
                        "CreateViewshed": 100121,
                        "TraceDownstream": 100122,
                        "CreateWatersheds": 100123,
                        "ChooseBestFacilities": 100150,
                        "CreateRouteLayers": 100211,
                        "JoinFeatures": 100215,
                        "FindOutliers": 100216,
                        "BatchGeocode": 100161,
                        "AnalyzeGeocodeInput": 100162,
                        "FindCentroids": 100254,
                        "FindPointClusters": 100260,
                        "SummarizeCenterAndDispersion": 100261,
                        "GenerateTessellations": 100268,
                        "CreateThresholdAreas": 100304,
                        "CalculateCompositeIndex": 100358}

    GENERIC_ERROR_CODES = [100112, 100118]

    def __init__(self, task_name: str, error_codes: list, error: Exception,
                 special_error_handlers: Optional[Dict] = None,
                 log_tool_failure: bool = True):
        """Initialize the attributes of the object. Append generic error codes to the error_codes property.

        Args:
            task_name: a string represents the name of current task.
            error_codes: a list of error codes associated with the task.
            error: an instance of Exception.
            special_error_handlers: a dict keyed by the ID of the error and valued by the handler (function) to
            process the error.
            log_tool_failure: True to log the error of tool failure and false otherwise.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.task_name = task_name
        self.error_codes = error_codes
        self.error = error
        self.special_error_handlers = special_error_handlers
        self.log_tool_failure = log_tool_failure

        # Drop the errorCodes from general processing that are using the special_error_handlers
        if self.special_error_handlers is not None:
            self.error_codes = [ecode for ecode in self.error_codes if ecode not in self.special_error_handlers]
        else:
            self.special_error_handlers = {}

        for code in self.GENERIC_ERROR_CODES:
            if code not in self.error_codes:
                self.error_codes.append(code)

    def process_exception_error(self):
        """Catch and print non-arcpy.ExecuteError (i.e., agolgp.GPCloudExec)."""
        if not isinstance(self.error, arcpy.ExecuteError):
            LOGGER.debug('Process non-arcpy.ExecuteError.')
            # agolgp.GPCloudExec is going to be deprecated so probably drop it?
            if isinstance(self.error, agolgp.GPCloudExec):
                errmsg = str(self.error)
                if errmsg:
                    LOGGER.error(str(self.error))
            else:
                LOGGER.debug(type(self.error))
                if hasattr(self.error, "message"):
                    LOGGER.debug(self.error.message)  # type: ignore

    def get_gp_errors_warnings(self) -> Tuple[list, list]:
        """Get all the associated errors and warnings from gp log.

        Args:
            No args.
        Returns:
            A two item tuple in the order of: 1) geoprocessing associated errors, and 2) geoprocessing associated
            warnings.
        Raises:
            No exceptions.

        """
        errors = []
        warnings = []
        try:
            msgs = arcpy.gp.GetAllMessages()  # type: ignore
            for msg in msgs:
                if self.special_error_handlers and msg[1] in self.special_error_handlers:
                    # Call the handler to process the message.
                    self.special_error_handlers[msg[1]](msg)

                if msg[1] in self.error_codes and msg[0] == 50:
                    warnings.append(msg)
                elif msg[1] in self.error_codes and msg[0] == 100:
                    errors.append(msg)
                elif msg[1] == -2147467259 and msg[0] == 100:
                    errors.append(msg)
        except (RuntimeError, arcpy.ExecuteError, IndexError):
            pass

        return (errors, warnings)

    def process_gp_error(self):
        """Process the gp related error messages. This function is specificly implemented for each Processor and
        will be called implictly in process.
        """
        # Process the GP related errors.
        (errors, warnings) = self.get_gp_errors_warnings()

        # Log the errors and warnings
        for error in errors:
            error_code = error[1]
            try:
                LOGGER.error(json.loads(error[2]))
            except:  # noqa. pylint: disable=bare-except
                try:
                    # error_code equals -2147467259 usually indicates error from lower stack without a proper error
                    if error_code == -2147467259:
                        try:
                            ecode = int(error[2].split(": ", 1)[0].split(" ", 1)[-1].strip('0'))
                            LOGGER.debug(f"{ecode=}")
                            LOGGER.error(ecode, extra={"message_ID": ecode})
                        except (ValueError, IndexError):
                            pass
                    else:
                        LOGGER.error(error_code, extra={"message_ID": error_code})
                # KeyError means the error code has not been registered in error_codes.json
                except KeyError:
                    LOGGER.debug(f"Please register error_code: {error_code}.")
                    error_msg = error[2].split(': ', 1)[-1]
                    LOGGER.error(error_code, extra={"message_ID": error_code, "message_text": error_msg})

        for warning in warnings:
            warning_code = warning[1]
            try:
                # item 2 has a formatted message already.
                json.loads(warning[2])
                LOGGER.warning(warning[2])
            except:  # noqa. pylint: disable=bare-except
                # Not in the regular format?
                warning_msg = warning[2].split(': ', 1)[-1]
                LOGGER.warning(warning_code, extra={"message_ID": warning_code, "message_text": warning_msg})

    def process(self):
        """Log the error messages associated with the task.

        Args:
            No arguments.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.process_gp_error()
        # Process non-gp exceptions
        self.process_exception_error()

        # Add any exeception info
        # If no exception is being handled anywhere on the stack, (None, None, None) is returned.
        LOGGER.info("exception details", exc_info=True)
        if sys.exc_info() != (None, None, None):
            msgs = traceback.format_exception(*sys.exc_info())  # type: ignore
            for msg in msgs:
                if msg:
                    LOGGER.debug(msg)

        # report task failed
        if self.log_tool_failure:
            if self.task_name in self.TASK_ERROR_CODES:
                # instead of using the message from the error_codes.json use the hardwired message since the message
                # in error_codes.json has extra space of task_name which will fail the harness tests.
                LOGGER.error(self.TASK_ERROR_CODES[self.task_name],
                             extra={"message_ID": self.TASK_ERROR_CODES[self.task_name],
                                    "message_text": f"{self.task_name} failed."})
            else:
                LOGGER.error(f"{self.task_name} failed.")
                LOGGER.warning("Note to developer: Add task to TASK_ERROR_CODE dictionary.")
