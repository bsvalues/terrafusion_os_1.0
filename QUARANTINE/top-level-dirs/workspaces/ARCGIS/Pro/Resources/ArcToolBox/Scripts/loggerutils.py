# coding: utf-8
"""
Source Name:   ErrorUtils.py
Version:       ArcGIS 11.0
Author:        Environmental Systems Research Institute Inc.
Description:   Utility module to handle logs.
"""
import logging
from typing import Tuple

import arcpy


def init_ss_logger(name: str, level) -> logging.Logger:
    logger = logging.getLogger(f"SSscripting.{name}")
    logger.propagate = False
    while logger.hasHandlers():
        logger.removeHandler(logger.handlers[0])
    handler = IDMessageHandler()
    handler.setLevel(level)
    logger.addHandler(handler)
    logger.setLevel(level)
    return logger


class IDMessageHandler(logging.Handler):
    """Handle arcpy ID message."""

    def __init__(self):
        super(IDMessageHandler, self).__init__()

    def get_msg_config(self, record: logging.LogRecord) -> Tuple:
        msg_function = arcpy.AddMessage
        msg_type = "INFORMATIVE"
        if record.levelno in (logging.WARN, logging.WARNING):
            msg_function = arcpy.AddWarning
            msg_type = "WARNING"
        elif record.levelno in (logging.CRITICAL, logging.FATAL, logging.ERROR):
            msg_function = arcpy.AddError
            msg_type = "ERROR"
        return (msg_function, msg_type)

    def emit(self, record: logging.LogRecord):
        msg_function, msg_type = self.get_msg_config(record)
        if hasattr(record, "message_ID"):
            msg_id = record.message_ID  # type: ignore
            arguments = []
            if hasattr(record, "add_argument1"):
                argument1 = record.add_argument1  # type: ignore
                arguments.append(argument1)
            if hasattr(record, "add_argument2"):
                argument2 = record.add_argument2  # type: ignore
                arguments.append(argument2)
            if arguments:
                arcpy.AddIDMessage(msg_type, msg_id, *arguments)
            else:
                arcpy.AddIDMessage(msg_type, msg_id)
        else:
            msg_function(record.getMessage())
