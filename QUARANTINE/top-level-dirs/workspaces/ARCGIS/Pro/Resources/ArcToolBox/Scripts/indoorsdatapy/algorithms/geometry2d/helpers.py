#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Helper functions for 2D geometry.
"""

import numpy as np

from indoorsdatapy.algorithms.geometry2d.entity2d import Entity2D


def enforce_nodes_ndarray(value):
    """
    Make sure a given object is a numpy array.

    Parameters
    ----------
    value : Entity2D, numpy array, tuple of tuples (of numbers)
                or list of lists (of numbers)
        Object to convert.

    Returns
    -------
    numpy array
        Array of numbers created from the given object.

    Raises
    ------
    TypeError
        If the type of the given object is not convertible to a numpy array.
    """
    if isinstance(value, Entity2D):
        return value.nodes
    elif isinstance(value, np.ndarray):
        return value
    elif isinstance(value, (tuple, list)):
        return np.array(value)
    else:
        raise TypeError("value must be of one of these types: Entity2D "
                        "(or subclass), numpy array, tuple or list")
