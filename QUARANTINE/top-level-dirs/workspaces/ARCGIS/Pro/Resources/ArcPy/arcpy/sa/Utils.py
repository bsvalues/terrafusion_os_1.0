# COPYRIGHT 2013-2023 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com

"""
Module containing utilities used by the other modules.
"""

from arcpy import gp, Extent

UNEVALUATED_RASTER_FUNCTION_SIGNAL = "#RASTER_FUNCTION_ARGUMENTS#"


class StateSwapper:

    SingleRasterResult = 1
    NoSingleRasterResult = 2

    def __init__(self, outputCategory=SingleRasterResult):
        self.__outputCategory = outputCategory

    def __call__(self, wrapper):
        def swapper(*args, **kwargs):
            # New data created by the wrapper is temporary and should not
            # automatically be added to the toc. Save current state so we can
            # restore it later.
            addToResultState = gp._gp.AddOutputsToMap

            if self.__outputCategory == self.SingleRasterResult:
                gp._gp.AddOutputsToMap = False

            result = None

            try:
                result = wrapper(*args, **kwargs)
            finally:
                # Reset the geoprocessor state to the original setting.
                # Whatever the result of calling the wrapper function, this
                # code will run.
                gp._gp.AddOutputsToMap = addToResultState

            return result

        return swapper


class ParameterErrors:
    """Contains a list of localized mock GP tool validation error message strings"""

    def __init__(self) -> None:
        self._messages = []

    def add_id_message(self, severity: str, message_id: int, *args) -> None:
        """Add one message based on geoprocessing message ID and optional arguments"""
        self._messages.append(self.create_id_message(severity, message_id, *args))

    def combine(self) -> str:
        """Returns one multiline string containing all of the stored messages"""
        return "\n".join(self._messages) + "\n"

    def create_id_message(self, severity: str, message_id: int, *args) -> str:
        """Creates one localized message string based on geoprocessing message ID and optional arguments"""

        # just-in-time import to avoid circular dependency
        from arcpy import GetIDMessage

        msg = GetIDMessage(message_ID=message_id)
        if len(args) > 0:
            if "%s" in msg:  # single argument string
                msg = (
                    msg % args
                )  # arguments must match the parameters of the particular message string
            elif "%1" in msg:  # multiple numbered arguments
                # escape braces
                msg = msg.replace("{", "{{")
                msg = msg.replace("}", "}}")
                # use python format syntax: # e.g. "%1" -> "{0}"
                for i in range(len(args)):
                    msg = msg.replace(f"%{i+1}", f"{{{i}}}")  # e.g. "%1" -> "{0}"
                msg = msg.format(*args)
        if severity.upper() in ["WARNING", "ERROR"]:
            msg = f"{severity.upper()} {message_id:06d}: {msg}"
        return msg


def compoundParameterToString(parameter, cls):
    """
    Convert parameter if it is a compound parameter object, otherwise do
    nothing.

    parameter -- Parameter to a function.
    cls -- Compound parameter class or base class of compound parameter class
           family.
    """
    if isinstance(parameter, cls):
        # Instance has the expected type.
        if cls == Extent:
            # trac266
            return "%g %g %g %g" % (
                parameter.XMin,
                parameter.YMin,
                parameter.XMax,
                parameter.YMax,
            )
        else:
            return str(parameter)
    else:
        return parameter


def multiValueCompoundParameterToString(parameter, cls):
    """
    Convert parameter if it is a single compound parameter object or a list of
    compund parameter objects, otherwise do nothing.

    parameter -- Parameter to a function.
    cls -- Compound parameter class or base class of compound parameter class
           family.
    """
    if not isinstance(parameter, list):
        return compoundParameterToString(parameter, cls)
    else:
        if parameter and all([isinstance(item, cls) for item in parameter]):
            return ";".join([str(item) for item in parameter])
        else:
            return parameter


def isNumerical(object):
    """
    Return whether object is an instance of one of Python's built-in numeric
    types.

    object -- Object to test.
    """
    return isinstance(object, (bool, int, float, complex))


def flattenLists(iterable):
    """
    Flatten nested list elements in the iterable passed in, non-recursively.

    Return a list.
    """
    result = []

    if isinstance(iterable, str):
        for item in iterable.split(";"):
            try:
                result.append(int(item))
                continue
            except Exception as e:
                try:
                    result.append(float(item))
                    continue
                except Exception as e:
                    result.append(item)
    else:
        for item in iterable:
            if isinstance(item, list):
                result += item
            elif isinstance(item, str):
                result += flattenLists(item)
            else:
                result.append(item)

    return result


def argumentValueEqualsString(argument, string):
    return isinstance(argument, str) and argument == string


def useDefaultArgumentValue(argument):
    return argument is None or (isinstance(argument, str) and argument in ["", "#"])
