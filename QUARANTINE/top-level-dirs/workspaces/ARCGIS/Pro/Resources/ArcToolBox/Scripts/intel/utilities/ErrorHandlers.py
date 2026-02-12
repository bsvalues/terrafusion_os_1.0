# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
ErrorHandlers.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.9+, Python 3.7+
author: ArcGIS Solutions for Intelligence
contact: intel@esri.com
company: Esri
------------------------------------------------------------------------------
* 2021-07-08 - mfunk - original writeup
------------------------------------------------------------------------------
'''
from __future__ import annotations

import sys
import traceback
import arcpy
from intel.utilities import DEBUG
from intel.utilities import Logger
from typing import Any
import functools

def general_error_handler(func: Any) -> Any:
    '''
    Do not use this method.
    Use general_error_logger instead.
    This method does not add messaging to log file,
    only to the tool dialog window.
    '''
    @functools.wraps(func)
    def inner(*args, **kwargs) -> Any:
        try:
            #if DEBUG:
            #    arcpy.AddMessage(f"general_error_handler: inner: going into func: {func.__name__}")
            res = func(*args, **kwargs)
            #if DEBUG:
            #    arcpy.AddMessage(f"general_error_handler: inner: out of func!: {res}")
            return res
        except Exception:
            arcpy.AddError(f"general_error_handler: inner: execption in: {func.__name__}")
            # get error info
            err_msg = str(sys.exc_info()[1])
            tb = sys.exc_info()[2]
            arcpy.AddError(f"Exception: {err_msg}")
            tb_formatted = traceback.format_tb(tb)
            tb_formatted.pop(0)  # first is always decorator's Inner_Function
            for i in tb_formatted:
                arcpy.AddError(i)
            # log ArcGIS errors
            if arcpy.GetMessages(2):
                arcpy.AddError(f"arcpy Errors: {arcpy.GetMessages(2)}")
            sys.exit(-1) # need to exit the tool here.
    return inner


def general_error_logger(func: Any) -> Any:
    """general_error_logger generic error handler

    Decorated any method with @general_error_logger to add basic
    error handling and logging to intel python tools.
    """
    # Create logger and instantiate
    logger: Logger = Logger()
    logger.create_logger("general_error_logger")

    @functools.wraps(func)
    def inner(*args, **kwargs) -> Any:
        # wrap function in try/except
        try:
            # run the decorated function
            # logger.debug(f"general_error_logger: inner: going into func: {func.__name__}")
            res: Any = func(*args, **kwargs)
            # logger.debug(f"general_error_handler: inner: out of func!: {res}")
            return res
        # handle any errors found in func execution
        except Exception:
            logger.error(f"general_error_logger execption in: {func.__name__}")
            # get error info
            err_msg = str(sys.exc_info()[1])
            tb = sys.exc_info()[2]
            logger.error(f"Exception: {err_msg}")
            tb_formatted = traceback.format_tb(tb)
            tb_formatted.pop(0)  # first is always decorator's Inner_Function
            for i in tb_formatted:
                logger.error(i)
            # log ArcGIS errors
            if arcpy.GetMessages(2):
                logger.error(f"arcpy Errors: {arcpy.GetMessages(2)}")
            sys.exit(-1)  # need to exit the tool here.
    return inner

def error_handler(id_message: int | None = None, msg: str | None = None) -> Any:
    """Logger that captures errors for the movement tools.

    Args:
        func (Any): a function to be decorated

    Returns:
        Any: the results of the function
    """
    def decorator(func: Any) -> Any:
        logger: Logger = Logger()
        logger.create_logger("error logger")
        @functools.wraps(func)
        def inner(*args, **kwargs) -> Any:
            try:
                # run the decorated function
                # logger.debug(f"general_error_logger: inner: going into func: {func.__name__}")
                res: Any = func(*args, **kwargs)
                # logger.debug(f"general_error_handler: inner: out of func!: {res}")
                return res
                # handle any errors found in func execution
            
            except Exception:
                if id_message:
                    logger.error(arcpy.GetIDMessage(id_message)) 
                if msg:
                    logger.error(msg)
                
                logger.error(f"general_error_logger execption in: {func.__name__}")
                # get error info
                err_msg = str(sys.exc_info()[1])
                tb = sys.exc_info()[2]
                logger.error(err_msg)
                tb_formatted = traceback.format_tb(tb)
                tb_formatted.pop(0)  # first is always decorator's Inner_Function
                for i in tb_formatted:
                    logger.error(i)
                # log ArcGIS errors
                if arcpy.GetMessages(2):
                    logger.error(arcpy.GetMessages(2))
                sys.exit(1)  # need to exit the tool here.

        return inner
    return decorator