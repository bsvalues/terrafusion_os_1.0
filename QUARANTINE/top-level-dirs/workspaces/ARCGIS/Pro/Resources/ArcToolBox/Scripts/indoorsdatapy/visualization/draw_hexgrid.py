#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Make patches to plot grids from algorithms.grids
"""
import os
import matplotlib as mplt
if os.environ.get('DISPLAY','') == '':
    print('no display found. Using non-interactive Agg backend')
    mplt.use('Agg')

from matplotlib import pyplot as plt
from matplotlib.collections import PatchCollection
from matplotlib.colors import LinearSegmentedColormap
from mpl_toolkits.axes_grid1 import make_axes_locatable
from indoorsdatapy.visualization.grid_patches import make_patches


def draw_hexgrid(
        xy,
        values,
        hex_side=1,
        ax=None,
        resize=True,
        cmap="viridis",
        text_color="white",
        do_text=True,
        do_colorbar=True,
        text_format="{:.3f}"):
    """Draw hexes with centers in xy in colors based on value at each hex

    Parameters
    ----------
    xy : np.array
        centers of hexes to draw (x, y)
    colors : np.array
        colors of hexes to draw (one float value per xy)
    hex_side : float
        Side of cell in hex grid
    ax : None, optional plt.axis
        axis to draw to
    resize : bool, optional
        If true resize ax to fit grid
    cmap : str, optional
        color map name
    text_color : str, optional
        color name to draw text with
    do_text : bool, optional
        if true do text [default: True]
    do_colorbar : bool, optional
        if true do colorbar [default: True]
    text_format : str, optional
        text format to use
    """
    if ax is None:
        _, ax = plt.subplots()
    if resize:
        ax.set_xlim((min(xy[:, 0]) - 2 * hex_side,
                     max(xy[:, 0]) + 2 * hex_side))
        ax.set_ylim((min(xy[:, 1]) - 2 * hex_side,
                     max(xy[:, 1]) + 2 * hex_side))
    color = None
    if do_colorbar:
        if not isinstance(cmap, LinearSegmentedColormap):
            cmap = plt.get_cmap(cmap)
        norm = mplt.colors.Normalize(vmin=min(values), vmax=max(values))
        m = mplt.cm.ScalarMappable(norm=norm, cmap=plt.get_cmap(cmap))
        m.set_array(values)
        color = cmap(norm(values))
        plt.colorbar(m, ax=ax,
                     cax=make_axes_locatable(ax).append_axes(
                         "right", size="5%", pad=0.05))
    if do_text:
        for x, y, c in zip(xy[:, 0], xy[:, 1], values):
            ax.text(x, y, text_format.format(c), va="center",
                    ha="center", color=text_color)
    ax.add_collection(PatchCollection(
        make_patches(
            6, hex_side, xy,
            color=color,
            alpha=1.0,
            linewidth=0),
        match_original=True))
    return ax