#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Interpolate (x,y,z) data to input grid
"""

from copy import deepcopy
# Python standard library imports
from enum import Enum
from math import sqrt

# Scientific python imports
import numpy as np
import pandas as pd
from scipy import interpolate
from scipy.interpolate import Rbf
from scipy.spatial import (cKDTree, distance)

INTERP = Enum("INTERP", "GAUSS RBF AVERAGE")


def interpolate_locations(locations, times, timekey="t"):
    """
    Interplate location time series to new time series

    Parameters
    ----------
    locations : DataFrame
        Time series with reference locations
    times : Series with time for each desitnation location
        Description
    timekey : str, optional
        Key with name of time column

    Returns
    -------
    DataFrame :
        Interpolated (time,x,y,floor)
    """
    # Interpolate locations to times
    return pd.DataFrame({
        timekey: times,
        "x": interpolate.interp1d(locations[timekey], locations['x'])(times),
        "y": interpolate.interp1d(locations[timekey], locations['y'])(times)})


def interpolate_location(x0, y0, t0, x1, y1, t1, t_n):
    """
    Interpolation of x,y for given time(between two points)
    :param x0:
    :param y0:
    :param t0:
    :param x1:
    :param y1:
    :param t1:
    :param t_n:
    :return:
    """
    dt = (t_n - t0) / (t1 - t0)
    nx = x0 + (dt * (x1 - x0))
    ny = y0 + (dt * (y1 - y0))

    return nx, ny


def grid_select(grid, xy, k=1, r=0):
    """
    Select points in grid closer than r

    Parameters:
    * grid - grid locations, numpy array [(x, y)]
    * xy - point locations numpy, array [(x, y)]
    * k - Number of nearest neighbors must be >= 1.
    * r - Threshold radius, do not include points further than this
      (ignored if r<=0) [default: 0]

    Returns:
    * grid points, k nearest distances, indices of selected points
    """
    if k < 1:
        raise ValueError("grid_interp: k={} is < 1".format(k))
    # Use KD tree to find closes k neighbours to every grid cell
    kdtree = cKDTree(xy)
    dxy, ixy = kdtree.query(grid, k)
    if k == 1:
        dxy = dxy.reshape((dxy.shape[0], 1))
        ixy = ixy.reshape((ixy.shape[0], 1))

    # Filter out any grid cell with no neighbours closer than r
    if r > 0:
        sel = dxy[:, 0] < r
        grid = grid[sel]
        dxy = dxy[sel]
        ixy = ixy[sel]
    return grid, dxy, ixy


def grid_interp(grid, xyz, r=0, k=1, interp=INTERP.AVERAGE, **opts):
    """
    Interpolate variable z to x,y grid
    Filters away grid points further away than r

    Parameters:
    * grid - pairs of (x, y) defining interpolation grid
    * xyz - data to interpolate - numpy array with x, y, z data
            NOTE: for GAUSS, 4 column with mu_err is expected (sigma/sqrt(n))
    * r - Threshold radius, do not include points further than this
      (not used if r<=0) [default: 0]
    * k - Number of nearest neighbors must be >= 1.
          NOTE: for GAUSS/RBF 1 is always used
    * interp - one of INTERP enum

    Returns:
    * (x,y,z,d) - grid points with interpolated value and nearest dist
    """
    # Enum interpolation setting if needed
    if not isinstance(interp, Enum):
        interp = INTERP[interp.upper()]

    # Check and fix k
    if k < 1:
        raise ValueError("grid_interp: k={} is < 1".format(k))
    if interp in (INTERP.GAUSS, INTERP.RBF):
        k = 1

    # Select grid points
    grid, dxy, ixy = grid_select(grid=grid, xy=xyz[:, 0:2], k=k, r=r)

    if len(grid) == 0:
        return np.array([[], [], [], []])

    d0 = dxy[:, 0].reshape(dxy.shape[0], 1)

    # Run interpolations
    if interp is INTERP.RBF:
        z = rbf_interp(
            grid,
            xyz,
            opts["function"],
            opts["epsilon"],
            opts["smooth"])
    elif interp == INTERP.GAUSS:
        z, c = gauss_interp(
            grid,
            xyz,
            opts["tau"],
            opts["alpha"],
            opts["error"],
            opts["offset"])
    elif interp == INTERP.AVERAGE:
        z = average_interp(xyz[:, 2], dxy, ixy)
    else:
        raise ValueError("Interpolation {} is not implemented".format(interp))

    return grid[:, 0], grid[:, 1], z, np.ndarray.flatten(d0)


def average_interp(z, dists, indices):
    """
    Interpolate average of each group of points

    Parameters:
    * z - data to interpolate - numpy array with x, y, z data
    * grid - pairs of (x, y) defining interpolation grid
    * indices list of list(int) defining related indices of dist points

    """
    result = []
    for dn, i in zip(dists, indices):
        result.append(
            np.float(np.average(z[i].astype(float), weights=1. / dn)))
    result = np.array(result)
    return result.reshape(len(result), 1)


def rbf_interp(grid, xyz, function="gaussian", epsilon=1, smooth=0):
    """
    Radial basis function interpolation
    """
    # First normalize values to range 0,1
    mmin, mmax = np.min(xyz[:, 2]), np.max(xyz[:, 2])
    z = (xyz[:, 2] - mmin) / (mmax - mmin)
    # Create interpolation
    rbf = Rbf(xyz[:, 0], xyz[:, 1], z,
              epsilon=epsilon, function=function, smooth=smooth)
    # Interpolate and de-normalize
    result = rbf(grid[:, 0], grid[:, 1]) * (mmax - mmin) + mmin
    return result.reshape(len(result), 1)


def gauss_interp(grid, xyzv, tau, alpha, error, offset):
    """
    Gaussian process interpolation

    Parameters:
    * xyzv - (x,y, z[mean], v[variance])
    * tau - smoothness parameter small=not smooth
    * alpha - square expected range of input z values
    * error - additional squared error term
              added for safety (prevent artefacts with bad input)
    * offset - unobserved value, (lower than lowest possible observation)
    """

    FACTOR = 0.01
    if xyzv.shape[1] < 4:
        xyzv = np.hstack((xyzv, FACTOR * np.ones((xyzv.shape[0], 1))))

    # internal distance matrix of input points
    xydist = distance.squareform(distance.pdist(xyzv[:, 0:2], 'sqeuclidean'))
    xy_kernel = np.exp(-xydist / tau) * alpha + \
                np.identity(xydist.shape[0]) * error + \
                np.diag(xyzv[:, 3])

    # distance matrix between grid and input points
    griddist = distance.cdist(grid, xyzv[:, 0:2], 'sqeuclidean')
    grid_kernel = np.matrix(np.exp(- griddist / tau) * alpha)

    # Solve interpolation
    A = grid_kernel * np.matrix(xy_kernel).I
    M = A * (np.matrix(xyzv[:, 2]).T - offset) + offset
    C = np.diag(alpha - A * grid_kernel.T)
    return np.ravel(M), C


def fast_gauss_interp(grid, xyzv, tau, alpha, error, offset, ixy_kernel=None):
    """
    Gaussian process interpolation

    Parameters:
    * xyzv - (x,y, z[mean], v[variance])
    * tau - smoothness parameter small=not smooth
    * alpha - square expected range of input z values
    * error - additional squared error term
              added for safety (prevent artefacts with bad input)
    * offset - unobserved value, (lower than lowest possible observation)
    """
    FACTOR = 0.01
    if xyzv.shape[1] < 4:
        xyzv = np.hstack((xyzv, FACTOR * np.ones((xyzv.shape[0], 1))))

    # internal distance matrix of input points
    if ixy_kernel is None:
        xydist = distance.squareform(
            distance.pdist(xyzv[:, 0:2], 'sqeuclidean'))
        xy_kernel = np.exp(-xydist / tau) * alpha + \
                    np.identity(xydist.shape[0]) * error + \
                    np.diag(xyzv[:, 3])
        ixy_kernel = np.matrix(xy_kernel).I

    # distance matrix between grid and input points
    griddist = distance.cdist(grid, xyzv[:, 0:2], 'sqeuclidean')
    grid_kernel = np.matrix(np.exp(- griddist / tau) * alpha)

    # Solve interpolation
    A = grid_kernel * ixy_kernel
    M = A * (np.matrix(xyzv[:, 2]).T - offset) + offset
    C = np.diag(alpha - A * grid_kernel.T)
    
    return np.ravel(M), C, ixy_kernel


def gauss_variance_expansion(loc_error, signal_variance, tau, alpha, error):
    """
    Gaussian process interpolation

    Parameters:
    * loc_error - [location error]
    * signal_variance - [signal variance]
    * tau - smoothness parameter small=not smooth
    * alpha - square expected range of input z values
    * error - additional squared error term
              added for safety (prevent artefacts with bad input)
    * offset - unobserved value, (lower than lowest possible observation)
    """

    # gk = np.exp(- loc_error**2 / tau) * alpha
    # kk = 1./ (alpha + signal_variance + error)
    # return alpha - gk*kk*gk
    return np.exp(4. * loc_error / tau) * signal_variance


def idw(xv, yv, values, grid, power=2, smoothing=0, eps=1E-9):
    def get_point_val(x, y):
        nominator = 0
        denominator = 0
        for xp, yp, val in zip(xv, yv, values):
            dist = sqrt((x - xp) * (x - xp) + (y - yp) *
                        (y - yp) + smoothing * smoothing)
            # skip close points to avoid bull eyes
            if dist < eps:
                return val
            nominator += val / pow(dist, power)
            denominator += 1 / pow(dist, power)
        # Return -9999 if the denominator is zero
        if denominator > 0:
            value = nominator / denominator
        else:
            value = -9999

        return value

    grid_out = deepcopy(grid)
    for x, y in grid:
        grid_out[x][y] = get_point_val(x, y)
    return grid_out
