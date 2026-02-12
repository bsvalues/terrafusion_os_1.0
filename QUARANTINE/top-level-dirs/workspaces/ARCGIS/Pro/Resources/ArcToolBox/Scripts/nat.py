"""Contains base classes used by all the python based tools within the Network Analyst Tools Toolbox."""

import logging
import traceback
import hashlib
import os
import functools
import time
import json

import arcpy


class Error(Exception):
    """Base class for exceptions in this module."""


class ToolExit(Error):
    """Raised when a tool needs to quit execution."""


class NotSignedInError(Error):
    """Raised when not signed in to any portal."""


class GPError(Exception):
    """Class for passing through exceptions raised in tool code.

    Used for catching a failed GP tool run within a script and failing out nicely
    without throwing a traceback. This passed through errors raised in GP tools
    in a way that ensures the hyperlinks to the message IDs will work in the UI.
    """

    def __init__(self):  # pylint:disable=super-init-not-called
        """Raise an error."""
        # Use AddReturnMessage to pass through GP errors.
        # This ensures that the hyperlinks to the message IDs will work in the UI.
        for msg in range(0, arcpy.GetMessageCount()):
            if arcpy.GetSeverity(msg) == 2:
                arcpy.AddReturnMessage(msg)


class GPMessageHandler(logging.Handler):
    """Allows GP messages to be written as part of the logging module."""

    def __init__(self):
        """Set the logger."""
        logging.Handler.__init__(self)

    def emit(self, record):
        """Log messages using GP message functions based on the log levels.

        Args:
            record - An instance of log record object passed by the logger.
        Returns:
            No return value.
        Raises:
            No execeptions.

        """
        # Select a GP message function based on the log level
        msg_function = arcpy.AddMessage
        msg_type = "INFORMATIVE"
        if record.levelno in (logging.WARN, ):
            msg_function = arcpy.AddWarning
            msg_type = "WARNING"
        elif record.levelno in (logging.CRITICAL, logging.FATAL, logging.ERROR):
            msg_function = arcpy.AddError
            msg_type = "ERROR"
        # If we get kwargs, use arcpy.AddIDMessage
        if hasattr(record, "message_ID"):
            msg_args = []
            if hasattr(record, "add_argument1"):
                msg_args.append(record.add_argument1)
            if hasattr(record, "add_argument2"):
                msg_args.append(record.add_argument2)
            arcpy.AddIDMessage(msg_type, record.message_ID, *msg_args)
        elif hasattr(record, "code"):
            server_log_levels = {
                logging.CRITICAL: arcpy.gp.ServerLogLevel.SEVERE,
                logging.FATAL: arcpy.gp.ServerLogLevel.SEVERE,
                logging.ERROR: arcpy.gp.ServerLogLevel.SEVERE,
                logging.INFO: arcpy.gp.ServerLogLevel.INFO,
                logging.WARN: arcpy.gp.ServerLogLevel.WARNING,
                logging.DEBUG: arcpy.gp.ServerLogLevel.DEBUG
            }
            method_name = record.method_name if hasattr(record, "method_name") else ""
            msg_code = record.code if hasattr(record, "code") else 0
            msg_elapsed = record.elapsed if hasattr(record, "elapsed") else -1.0
            log_msg = record.getMessage()
            if record.exc_info:
                log_msg += traceback.format_exc()
            arcpy.gp.logToServer(log_msg, server_log_levels.get(record.levelno, arcpy.gp.ServerLogLevel.DEBUG),
                                 method_name, msg_code, msg_elapsed)
            # return since we are already including any exception info and do not want to send the traceback as
            # GP messages to the client apps
            return
        else:
            # Add the message using standard GP message function
            msg_function(record.getMessage())
        # Add any exeception info
        if record.exc_info:
            msgs = traceback.format_exception(*record.exc_info)
            for msg in msgs:
                if msg:
                    msg_function(msg)


class NATool:
    """Base class for every python tool within the Network Analyst Tools toolbox."""

    # Define empty solts since the child classes define slots
    __slots__ = ()

    @staticmethod
    def get_cache_file():
        """Return the full path of the file used to cache portal specific content.

        The file is located in the session specific temp folder and its name is based on the token of the signed in
        user.
        Args:
            No arguments.
        Returns:
            The full catalog path to the cache file.
        Raises:
            NotSignedInError if not signed into any portal.

        """
        # Fail if not signed in
        token_object = arcpy.GetSigninToken()
        if not token_object:
            raise NotSignedInError
        token = token_object.get("token")
        cache_file_name = hashlib.md5(token.encode("utf-8")).hexdigest()
        return os.path.join(os.environ.get("TEMP"), cache_file_name)


class NAToolExecutor:
    """Base class for all the executors that run from the GP tool dialogs."""

    # Define instance attributes in slots primarily for faster attribute lookups
    __slots__ = ("logger", )

    def __init__(self, log_level=logging.INFO):
        """Set up names common to all the tools.

        Args:
            log_level: The log level for the tool logger. Default is to log messages at info level which suppress any
                       information used for debugging the tool.
        Returns:
            No value.
        Raises:
            No exception.

        """
        # Setup the class logger
        logger = logging.getLogger(__name__)
        logger.setLevel(log_level)
        # Add the GPMessageHandler in case the logger is not initialized with one
        if not logger.hasHandlers():
            gp_msg_handler = GPMessageHandler()
            gp_msg_handler.setLevel(log_level)
            logger.addHandler(gp_msg_handler)
        self.logger = logger


class NAToolValidator:
    """Base class for the tool validation logic used by every python tool in the Network Analyst Tools toolbox.

    The class does not provide implementation for any methods. The sub class is responsible for proving the
    implementation of methods as desrised by the validation logic specific to the tool.
    """

    def __init__(self):
        """Set arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):  # Required by GP framework. pylint: disable=invalid-name
        """Refine the properties of a tool's parameters. This method is called when the tool is opened."""

    def updateParameters(self):  # Required by GP framework. pylint: disable=invalid-name
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        """

    def updateMessages(self):  # Required by GP framework. pylint: disable=invalid-name
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        """


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
        if args:
            self = args[0]
            if hasattr(self, "logger"):
                self.logger.info(msg)
            else:
                arcpy.AddMessage(msg)
        else:
            arcpy.AddMessage(msg)
        return return_val
    return wrapper
