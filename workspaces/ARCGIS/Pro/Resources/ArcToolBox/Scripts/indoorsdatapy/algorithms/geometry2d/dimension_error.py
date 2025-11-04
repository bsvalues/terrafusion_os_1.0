#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
A primitive custom exception indicating a dimension error.
"""


class DimensionError(Exception):
    """
    A primitive custom exception indicating a dimension error.

    Parameters
    ----------
    value : string
        The error message.
    """

    def __init__(self, value):
        """Initialize the exception."""
        self.value = value

    def __str__(self):
        """The string representation of the exception (the error message)."""
        return repr(self.value)
