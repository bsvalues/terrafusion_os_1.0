#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Make patches to plot grids from algorithms.grids
"""
import collections

import numpy as np
from matplotlib.patches import RegularPolygon


def make_patches(order, side, coordinates, color=None, alpha=None, **kwargs):
    """
    Creates list of square patches from input coordinates

    Parameters
    ----------
    order : int
        4 for square grid, 6 for hex grid
    side : float
        cell side length
    coordinates : np.array
        output form algorithms.grids
        cols in reach row: [0,1] xy center
    color : None, optional
        single color, or color for each cell
    alpha : None, optional
        single alpha, or alpha for each cell
    **kwargs : TYPE
        options forwarded to RegularPolygon

    Returns
    -------
    list
        patches for ax.add_collection

    Raises
    ------
    ValueError
        If order is not 4 or 6
    """
    if order == 4:
        num_verticies = 4
        radius = side * 1.0 / np.sqrt(2.)
        orientation = np.pi / 4.
    elif order == 6:
        num_verticies = 6
        radius = side * 1.0
        orientation = np.pi / 2.
    else:
        raise ValueError(
            "ERROR: make_patches: takes 4 or 6 sides, not {}".format(order))

    def descalarize(inp, n):
        """
        If input exist and is scalare, make it list with duplicates of length n

        Parameters
        ----------
        inp : iterable or scalar
            Description
        n : list
            input if iterable else  [input]*n
        """
        if inp is not None and not isinstance(inp, collections.Iterable):
            return [inp] * n
        return inp

    color = descalarize(color, len(coordinates))
    alpha = descalarize(alpha, len(coordinates))
    patch_list = []
    for i, sq in enumerate(coordinates):
        patch_list.append(
            RegularPolygon(
                xy=(sq[0], sq[1]),
                numVertices=num_verticies,
                radius=radius,
                orientation=orientation,
                facecolor=color[i] if color is not None else None,
                alpha=alpha[i] if alpha is not None else 1,
                **kwargs))
    return patch_list
