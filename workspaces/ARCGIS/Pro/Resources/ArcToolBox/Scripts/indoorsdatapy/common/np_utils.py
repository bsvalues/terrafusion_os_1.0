#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Utilities to work with pandas dataframes
"""
import numpy as np

def nest_dot(A, B):
    """
    Parameters:
    * A - np.array or np.matrix (NxM)
    * B - np.array or np.matrix (MxM)

    Note, if A, B are matricies already A*B*A.T is equivalent

    Return:
    * A*B*A^T where A,B are matricies
    """
    return np.dot(A, np.dot(B, A.T))


def diag_sq(A):
    """
    Parameters:
    * A - np.array or np.matrix (NxM)

    Return:
    * diagonal matrix with squares of A (NxM, NxM)
    """
    return np.diagflat(np.square(A))


def diag_m(A):
    """
    Parameters:
    * A - np.array or np.matrix (NxM)

    Return:
    * Diagonal matrix with diagonal from A (NxN)
    """
    return np.diagflat(np.diagonal(A))
