import logging
import os
import sys

import arcpy


def get_handlers():
    handlers = []

    # When executed as a GP tool from Pro, sys.executable is the path of Pro.exe
    # http://gis.stackexchange.com/a/64944
    # Only log to GP window when run from Pro and only log to console when run outside.
    log_arcpy = os.path.basename(sys.executable).lower() not in ("python.exe", "pythonw.exe")
    log_console = not log_arcpy

    if log_arcpy:
        handlers.append(ArcpyHandler())
    if log_console:
        handlers.append(ConsoleHandler())

    return handlers


def setup_logging():
    logger = logging.getLogger("dataloading")
    logger.setLevel(logging.INFO)
    for handler in get_handlers():
        logger.addHandler(handler)
    return logger


class CustomFormatter(logging.Formatter):
    """Override log messaging based on top level log level
    adapted from https://stackoverflow.com/a/16660369
    """

    FORMATS = {logging.DEBUG: "{asctime}\t{message}", logging.INFO: "{message}"}

    def format(self, record):
        # Since we are getting the logger by name, this will always be the same
        fmt = self.FORMATS.get(logging.getLogger("dataloading").level, "{asctime}\t{message}")
        self._style = logging.StrFormatStyle(fmt=fmt)
        self.datefmt = "%Y-%m-%d %H:%M:%S"
        return logging.Formatter.format(self, record)


class ArcpyHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.setFormatter(CustomFormatter())

    def emit(self, record):
        msg = self.format(record)
        if record.levelno >= logging.ERROR:
            arcpy.AddError(msg)
        elif record.levelno >= logging.WARNING:
            arcpy.AddWarning(msg)
        else:
            arcpy.AddMessage(msg)


class ConsoleHandler(logging.StreamHandler):
    def __init__(self):
        super().__init__(sys.stdout)
        self.setFormatter(CustomFormatter())


class LogFileHandler(logging.FileHandler):
    def __init__(self, log, **kwargs):
        super().__init__(filename=log, mode="a", encoding="utf8")
        formatter = logging.Formatter(**kwargs)
        self.setFormatter(formatter)
        self.setLevel(logging.DEBUG)
