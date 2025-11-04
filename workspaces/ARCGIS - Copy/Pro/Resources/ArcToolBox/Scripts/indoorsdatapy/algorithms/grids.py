#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Create regular square or hexagonal grids

Grids always cover entire target widht x height area.
Grids are axis aligned, with optional offset from origin.
"""

import numpy as np


def make_square_grid(width, height, side, origin=(0, 0)):
    """Make square grid

    Make axes aligned grid of squares with given sideside covering area
    width x height offset with smallest coordinate at origin

    Note this may overcover area, but never undercover it.

    Parameters
    ----------
    width : float
        width of rectangular area
    height : float
        height of rectangular area
    side : float
        cell side length
    origin : tuple, optional
        Global offset

    Returns
    ------
    numpy.array
        coordinates of generated cells
    """
    X, Y = np.meshgrid(
        np.arange(0, width + side, side),
        np.arange(0, height + side, side))
    return np.dstack((
        origin[0] + X.ravel(),
        origin[1] + Y.ravel()))[0]


def make_hex_grid(width, height, side, origin=(0, 0)):
    """Make hex grid

    Make axes aligned grid of squares with given sideside covering area
    width x height offset with smallest coordinate at origin

    Note this may overcover area, but never undercover it.

    Parameters
    ----------
    width : float
        width of rectangular area
    height : float
        height of rectangular area
    side : float
        cell side length
    origin : tuple, optional
        Global offset

    Returns
    ------
    numpy.array
        coordinates of generated cells
    """
    nq = int((width + 2) / (1.5 * side) + 0.5)
    nr = int((height + 2) / side * 2. / 3 + 0.5)
    X, Y = np.indices((nq, nr))
    ii = np.dstack((Y.ravel(), X.ravel()))[0]
    ii[:, 0] -= np.array(range(ii.shape[0]), dtype='int64') // nr // 2 + 1
    return side * np.dstack((
        origin[0] + (3. / 2.) * ii[:, 1],
        origin[1] + (3 ** 0.5) * (ii[:, 0] + 0.5 * ii[:, 1])))[0]
