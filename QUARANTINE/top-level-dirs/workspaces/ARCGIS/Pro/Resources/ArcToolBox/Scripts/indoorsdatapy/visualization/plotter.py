#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
General Plotter
"""
import copy
import colorsys
import numpy as np
import os
if os.environ.get('DISPLAY','') == '':
    print('no display found. Using non-interactive Agg backend')
    import matplotlib as mpl
    mpl.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle
from logging import getLogger
from ..common.configurable import Configurable
from indoorsdatapy.common.const import zone_type
from .mapdrawer import MapDrawer


logger = getLogger(__name__)


class AbstractSettings(Configurable):

    """
    For easy overriding default settings by constructor arguments
    """
    __default_settings__ = {}

    def __init__(self, **kwargs):
        settings = self.__default_settings__.copy()
        for k, v in kwargs.items():
            if k in settings:
                settings[k] = v
            else:
                raise ValueError("Setting '{}' does not exist!".format(k))

        super(AbstractSettings, self).__init__(settings)

    def get(self):
        return self.settings


class DrawingStyle():

    """
    Defines a drawing
    """

    def __init__(self, kind, data, style, label=None, extras=None):
        self._components = []
        self.add(kind, data, style, label, extras)

    def add(self, kind, data, style, label=None, extras=None):
        self._components.append(
            dict(kind=kind, data=data, style=style, label=label, extras=extras))

    def get_components(self):
        return self._components


class StyleAttributeDataCol():

    """
    For defining data for a style attribute. 
    """

    def __init__(self, data_col):
        self._data_col = data_col

    def get(self):
        return self._data_col


class DrawingStyleGenerator():

    """
    Generates DrawingStyles for most common kinds of drawings. 
    Reduces code for defining specific standard drawings.
    Shortcut for composited drawings.
    """
    __default_settings__ = {
        "scatter": {"marker": "*", "color": "b", "s": 20},
        "plot": {"marker": ".", "color": "b", "alpha": 0.9, "linestyle": "-"},
        "quiver": {"color": "b", "alpha": 0.3, "scale": 1, "scale_units": 'xy',
                   "angles": 'xy', "width": 0.001, "linestyle": "-"},
        "_Circle": {"color": "b", "alpha": 0.04},
        "__": {},
        "*ColorScatter": {"c": None, "s": 20},
        "*ErrorScatter": {"color": "b"}
    }

    def __init__(self, kind, data, style_settings, label=None):
        self._kind = kind
        self._data = data
        self._label = label
        self._style = self._merge_style(kind, style_settings)

    def _merge_style(self, kind, style_settings):
        try:
            style = self.__default_settings__[kind].copy()
            for k, v in style_settings.items():
                if k in style_settings:
                    style[k] = v
            return style
        except KeyError:
            raise Exception("unknown kind {}".format(self._kind))

    def get(self):
        if self._kind[0] == "*":
            ds = None
            if self._kind[1:] == "ErrorScatter":
                subkinds = ["scatter", "_Circle"]
                ds = DrawingStyle(subkinds[0], self._data[0:2],
                                  self._merge_style(subkinds[0], self._style),
                                  self._label)
                ds.add(subkinds[1], self._data,
                       self._merge_style(subkinds[1], self._style))

            elif self._kind[1:] == "ColorScatter":
                if len(self._data) >= 3:
                    self._style["c"] = StyleAttributeDataCol(self._data[2])
                elif len(self._data) >= 4:
                    self._style["s"] = StyleAttributeDataCol(self._data[3])
                ds = DrawingStyle("scatter", self._data[0:2], self._style,
                                  self._label, "colorbar")

            return ds
        else:
            return DrawingStyle(self._kind, self._data, self._style,
                                self._label)


class DummyDrawingStyle():
    def get(self):
        return DrawingStyleGenerator("__", [], dict()).get()


class PlotSettings(AbstractSettings):

    """
    Settings related to the outer layout of a plot
    """
    __default_settings__ = {
        "title": "",
        "x_label": "x [m]",
        "y_label": "y [m]",
        "grid": True,
        "aspect": "equal",
        "limits": None
    }

    def axes_limiter(self, data_x, data_y, margin, flip_x=False, flip_y=False):
        min_x = np.min(data_x.min().values) - margin
        max_x = np.max(data_x.max().values) + margin
        min_y = np.min(data_y.min().values) - margin
        max_y = np.max(data_y.max().values) + margin

        x_limits = (min_x, max_x)
        y_limits = (min_y, max_y)

        if flip_x:
            x_limits = (max_x, min_x)

        if flip_y:
            y_limits = (max_y, min_y)

        self.settings["limits"] = (x_limits[0], x_limits[1], y_limits[0],
                                   y_limits[1])


class SavePlotSettings(AbstractSettings):

    """
    Settings related for saving a plot
    """

    __default_settings__ = {
        "img_path": "figs",
        "plot_dpi": 200
    }


class BasePlotter(Configurable):

    """
    Generalized Plotter to speed up nice plot creation
    """
    __default_settings__ = {
    }

    def __init__(self, settings=None):
        super(BasePlotter, self).__init__(settings)
        self._data_list = []
        self._group_data_list = {}
        self.axes = {}

    def add_drawing(self, pd_data, drawing_style):
        self._data_list.append((pd_data, drawing_style))

    def add_drawing_series(self, pd_data, drawing_style, group):
        pd_data_groups = pd_data.groupby([group])
        n_groups = len(pd_data_groups)
        i = -1
        for k, group_data in pd_data.groupby([group]):
            i += 1
            group_drawing_style = copy.deepcopy(drawing_style)
            for c in group_drawing_style.get_components():
                if c["label"] is not None:
                    c["label"] = "{}: {}".format(c["label"], k)
                else:
                    c["label"] = "_nolegend_"
                if c["style"].get("color", None) is not None:
                    c["style"]["color"] = BasePlotter.color_by_index(
                        i, n_groups)
            self.add_drawing(group_data, group_drawing_style)

    def plot(self, plot_tag, plot_settings, save_plot_settings=None, group=None,
             group_axes=None):
        logger.debug("Start plotting...")
        if group is not None:
            (g_name, g_col) = group
        else:
            (g_name, g_col) = (None, None)

        saved_plots_path = []
        self._data_grouper(g_col)
        for group_key, group_drawings in self._group_data_list.items():
            print("Group key: {}".format(group_key))
            logger.debug("Plotting group {}".format(group_key))
            ax = self._start_plotting(group_axes, group_key)
            self._before_drawings(ax, group_key)
            self._plot_drawings(ax, group_drawings)
            title = self._get_title(plot_settings, plot_tag, g_name, group_key)
            plot_filename = BasePlotter._file_title(title)
            self._finish_plotting(ax, title, plot_settings)
            self.axes[group_key] = (ax, plot_filename, group_drawings)
            saved_plots_path.append(
                self.save_plot(ax, plot_filename, save_plot_settings))

        logger.debug("Plots done.")
        return self.axes, saved_plots_path

    @staticmethod
    def save_plot(ax, filename, save_plot_settings=None):
        if save_plot_settings is None:
            return

        logger.debug("Saving plot...")
        if not os.path.exists(save_plot_settings['img_path']):
            os.makedirs(save_plot_settings['img_path'])

        full_image_path = "{}/{}.png".format(
            save_plot_settings['img_path'], filename)

        ax.figure.savefig(full_image_path, bbox_inches='tight',
                          dpi=save_plot_settings['plot_dpi'])
        logger.debug("Plot saved to {}".format(full_image_path))

        return full_image_path

    @staticmethod
    def close_figure():
        plt.close()

    @staticmethod
    def create_axes():
        fig = plt.figure()
        ax = fig.add_subplot(111)
        return ax

    @staticmethod
    def _start_plotting(group_axes, group_key):
        if group_axes is not None and group_key in group_axes:
            ax = group_axes[group_key]
        else:
            ax = BasePlotter.create_axes()

        return ax

    def _before_drawings(self, ax, group_key):
        pass

    def _plot_drawings(self, ax, group_drawings):
        for pd_data, drawing_style in group_drawings:
            for dc in drawing_style.get_components():
                self._plot_drawing(ax, pd_data, dc)

    @staticmethod
    def _plot_drawing(ax, pd_data, dcomp):
        logger.debug("Drawing {}...".format(dcomp["kind"]))

        drawing = None
        plt_param = dcomp["style"]
        for sak, sav in plt_param.items():
            if isinstance(sav, StyleAttributeDataCol):
                plt_param[sak] = pd_data[sav.get()].values

        if dcomp["label"] is not None:
            plt_param["label"] = dcomp["label"]

        cols = dcomp["data"]
        data = np.transpose(pd_data[cols].values)

        if dcomp["kind"][0] == "_":
            kind = dcomp["kind"][1:]
            if kind == "Circle":
                for x0, y0, r0 in zip(*data):
                    ax.add_artist(Circle((x0, y0), radius=r0, **plt_param))
            elif kind == "_":  # Dummy drawing
                pass

        elif dcomp["kind"] == "boxplot":
            data = pd_data[cols].values
            drawing = ax.boxplot(data, **plt_param)
        else:
            plot_method = getattr(ax, dcomp["kind"])
            drawing = plot_method(*data, **plt_param)

        # process extras
        if dcomp["extras"] == "colorbar":
            ax.figure.colorbar(drawing)

    @staticmethod
    def _get_title(plot_settings, plot_tag, group_name, group_key):
        if group_key is None:
            title = "{}: {}".format(plot_tag, plot_settings["title"])
        else:
            title = "{}: {}, {}: {}".format(plot_tag, plot_settings["title"],
                                            group_name, group_key)

        return title

    @staticmethod
    def _finish_plotting(ax, title, plot_settings):
        logger.debug("Finishing plot...")

        ax.set_xlabel(plot_settings["x_label"])
        ax.set_ylabel(plot_settings["y_label"])
        ax.legend(framealpha=0.7, fancybox=True, scatterpoints=1,
                  prop={'size': 8}, bbox_to_anchor=(1.02, 1, 0.2, 0))
        ax.grid(plot_settings["grid"])
        ax.set_aspect(plot_settings["aspect"])
        limits = plot_settings["limits"]
        if limits is not None:
            ax.set_xlim([limits[0], limits[1]])
            ax.set_ylim([limits[2], limits[3]])
        ax.set_title(title)

        logger.debug("Plot finished.")

    def _data_grouper(self, group_column=None):
        if group_column is None:
            self._group_data_list[None] = self._data_list
        else:
            for pd_data, drawing_style in self._data_list:
                for k, group_data in pd_data.groupby([group_column]):
                    if k not in self._group_data_list:
                        self._group_data_list[k] = []
                    self._group_data_list[k].append(
                        (group_data, drawing_style))

    @staticmethod
    def _file_title(title):
        replace_list = [',', ' ', ':', '/', '|', '\n']
        for r in replace_list:
            title = title.replace(r, '_')
        return title

    @staticmethod
    def color_by_index(index, num, val=1.):
        return colorsys.hsv_to_rgb(index * 1. / num, 1.0, val)


class MapPlotter(BasePlotter):

    """
    BasePlotter with the capability of drawing a background map
    """
    __default_settings__ = {
        "max_image_size": (2000, 1500),
        'walls': {'plot': False},
        'zones': {
            zone_type.ZONE: {'plot': False},
            zone_type.DEAD_ZONE: {'plot': False},
            zone_type.BOUNDING_BOX: {'plot': False}},
        'fingerprintpoints': {'plot': False}
    }

    def __init__(self, building_access, settings=None):
        super(MapPlotter, self).__init__(settings)
        self._mapdrawer = MapDrawer(building_access, settings=self.settings)

    def _before_drawings(self, ax, floor):
        logger.debug("Drawing map...")
        self._mapdrawer.plot(floor, ax)
