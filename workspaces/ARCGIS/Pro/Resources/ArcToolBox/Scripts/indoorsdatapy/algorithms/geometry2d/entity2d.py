#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Base class for 2D entities (including points)."""

import numpy as np


class Entity2D(object):
    """
    Base class for 2D entities (including points).

    Mainly a container for a numpy array containing 2D locations.

    Parameters
    ----------
    nodes : numpy array
        Array containing 2D locations. Can be 1D if it contains only one
        location.
    epsilon : float, optional
        Effective zero value for floats. Numbers smaller than this value are
        considered zero.

    Raises
    ------
    TypeError
        If the given nodes are not a numpy array.
    """

    def __init__(self, nodes, epsilon=1e-9):
        if isinstance(nodes, np.ndarray):
            self._nodes = nodes
        else:
            raise TypeError("nodes must be numpy array")
        self._epsilon = epsilon

    @property
    def nodes(self):
        """Get locations."""
        return self._nodes

    @property
    def epsilon(self):
        """Get effective zero."""
        return self._epsilon

    def has_node(self, node):
        return np.any(np.all(np.atleast_2d(self._nodes) == node, axis=1))

    def __str__(self):
        """Get string representation."""
        result = type(self).__name__
        result += "("
        result += ", ".join(["({}, {})".format(n[0], n[1])
                             for n in np.atleast_2d(self._nodes)])
        result += ")"
        return result

    __repr__ = __str__

    def __eq__(self, other):
        """
        Check for coordinate and type equality.

        Parameters
        ----------
        other : object
            Object to check if equal to self.

        Returns
        -------
        boolean
            True if equal, False otherwise.
        """
        if type(other) is type(self):
            return np.array_equal(self._nodes, other.nodes)
        return False
