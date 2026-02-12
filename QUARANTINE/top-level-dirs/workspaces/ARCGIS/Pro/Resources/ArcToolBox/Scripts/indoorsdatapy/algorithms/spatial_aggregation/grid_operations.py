#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
import os

if os.environ.get('DISPLAY', '') == '':
    print('no display found. Using non-interactive Agg backend')
    import matplotlib as mpl

    mpl.use('Agg')

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from indoorsdatapy.algorithms.grids import make_hex_grid
from indoorsdatapy.algorithms.hexgrid import build_hex_index, \
    build_xy_from_hex_index
from indoorsdatapy.algorithms.interpolation import grid_interp
from indoorsdatapy.algorithms.wall_point_clipper import clip_by_boundary, \
    clip_by_boundary_single_floor
from indoorsdatapy.common.utils import build_path
from indoorsdatapy.visualization.mapdrawer import get_plot_helper
from matplotlib.collections import PatchCollection
from matplotlib.patches import RegularPolygon
from multiprocessing import Process
from collections import defaultdict

logger = logging.getLogger(__name__)


class GridOperations:
    @staticmethod
    def clip_grid_by_wall(df, floor, boundary, fringe=0, attr_map=None):
        """
        Clipping points by wall
        :param df: dict(pd.DataFrame)
        :param building boundary: dict(int:pd.DataFrame)
            floor:dataframe
            with boundaries of
        :param fringe: number

        :return:
        """
        attr_map = attr_map or {'floor': 'floor', 'x': 'x', 'y': 'y'}

        df[attr_map['floor']] = int(floor)
        return clip_by_boundary(df, boundary,
                                building_boundary_fringe=fringe,
                                group_by=[attr_map['x'], attr_map['y']],
                                x=attr_map['x'], y=attr_map['y'],
                                floor=attr_map['floor'],
                                levels=[int(floor)])

    @staticmethod
    def interpolate_points(df, fields, interp_r, interp_k, grid_side,
                           mu_err=None, attr_map=None, method='AVERAGE'):
        """
        Point interpolation (default AVERAGE interpolation) can be refactored
        :param df: pd.DataFrame
            [x,y,mu_err,fields(arbitrary)]
        :param fields: list
            names of df attributes to interpolate
        :param interp_r: number
            Threshold radius, do not include points further than this
                    (not used if r<=0) [default: 0]
        :param interp_k: number
            Number of nearest neighbors must be >= 1.
          NOTE: for GAUSS/RBF 1 is always used
        :param grid_side: number
            size of hexgrid
        :param mu_err: number
            if not available mu_err in df than this param is used as the default
             value
        :return: df
        """
        am = attr_map or {'x': 'x', 'y': 'y', 'mu_err': 'mu_err'}
        lim = df[[am["x"], am["y"]]].describe().loc[["min", "max"]].values
        if mu_err:
            df['mu_err'] = mu_err

        radii = np.array((interp_r * 2))
        origin = lim[0, :] - radii
        width, height = lim[1, :] + 2 * radii - origin
        grid = make_hex_grid(
            width, height, side=grid_side, origin=origin)
        result = pd.DataFrame()

        for idx, field in enumerate(fields):
            in_data = df[[am["x"], am["y"], field, am["mu_err"]]].as_matrix()
            in_data = in_data[~pd.isnull(in_data[:, 2])]
            if in_data.size == 0:
                continue
            x, y, val, d0 = grid_interp(grid, in_data, k=interp_k,
                                        r=interp_r, interp=method)
            feed = [(xx, yy, valval) for xx, yy, valval in zip(
                x.tolist(), y.tolist(), np.ndarray.flatten(val).tolist())]
            res = pd.DataFrame(feed, columns=(am['x'], am['y'], field))
            res = res.sort_values(by=[am['x'], am['y']])
            if idx == 0:
                result = res.reset_index(drop=True)
            else:
                result[field] = res[field].reset_index(drop=True)

        return result


def percentile25(x):
    return np.percentile(x, 25)


def percentile50(x):
    return np.percentile(x, 50)


def percentile75(x):
    return np.percentile(x, 75)


def iqr(x):
    return np.percentile(x, 75) - np.percentile(x, 25)


def unique_count(x):
    return np.unique(x).size


class PointHexBinningStatisticException(Exception):
    """PointHexBinningStatistic exception"""


class PointHexBinningStatistic(object):
    def __init__(self, df, column, reducer, df_filter, hex_side):
        """
        Calculation statistics for given grouped DataFrame
        :param df: pd.DataFrame
        :param column: str
        :param reducer: function
        :param hex_side: float
        """

        if df_filter:
            df_filtered = df_filter(df)
            if len(df_filtered) > 0:
                df_group = df_filtered.groupby(by=['q', 'r'])
            else:
                raise PointHexBinningStatisticException(
                    'No data after filter applied..')
        else:
            df_group = df.groupby(by=['q', 'r'])

        try:
            df_agg = df_group[column].agg(reducer)
            df_agg = df_agg.reset_index(level=(0, 1))
        except Exception:
            import ipdb
            ipdb.set_trace()
        self.df = build_xy_from_hex_index(df_agg, hex_side)
        self.hex_side = hex_side
        self.columns = column

    def interpolation(self, interp_r, interp_k, method='AVERAGE'):
        """
        Spatial interpolation for making continues surface
        :param interp_r: number
                Threshold radius, do not include points further than this
                    (not used if r<=0) [default: 0]
        :param interp_k:  number
            Number of nearest neighbors must be >= 1.
        :param method: str
            enum
        :return:
        """
        if len(self.df.index) > 3:
            self.df = GridOperations.interpolate_points(
                self.df,
                fields=[self.columns],
                interp_r=interp_r,
                interp_k=interp_k,
                method=method,
                grid_side=self.hex_side,
                mu_err=1)

    def clipper(self, boundaries, boundary_fringe):
        """
        Clipping points by polygon
        :param boundaries: DataFrame
        :param boundary_fringe: number
        :return:
        """
        if boundaries is not None:
            self.df = clip_by_boundary_single_floor(
                self.df, boundaries, boundary_fringe)

    @staticmethod
    def hexgrid_reduce_worker(result_queue, reducer, column, df, df_filter,
                              hex_side, interpolation_setting, clipper_setting):
        """
        Processing hex binning
        :param result_queue: list or queue
        :param reducer: tuple
        :param column: str
        :param df: DataFrame
        :param hex_side: float
        :param interpolation_setting: dict
        :param clipper_setting: dict
        :return:
        """
        reducer_name, reducer_func = reducer
        if not column in df.columns.values:
            logger.warning('Column %s is not in dataframe' % column)
            return
        try:
            h = PointHexBinningStatistic(df, column,
                                         reducer_func, df_filter, hex_side)
        except PointHexBinningStatisticException as e:
            logger.info(e)
            return
        if interpolation_setting:
            h.interpolation(**interpolation_setting)
        if clipper_setting:
            h.clipper(**clipper_setting)
        if isinstance(result_queue, list):
            result_queue.append((h.df, column, reducer_name))
        else:
            result_queue.put((h.df, column, reducer_name))


class HexGridPlot(object):
    def __init__(self, df):
        """
        Plotting hex bins
        :param df:
        """
        self.df = df
        self.fig = plt.figure()

    def base_map_plot(self, floor, map_drawer_settings):
        """
        Plotting building floor map
        :param floor:int
        :param map_drawer_settings: dict
        :return:
        """
        get_plot_helper(self.fig, floor, map_drawer_settings, None)

    def hex_grid_plot(self, column, annotation_column,
                      plot_settings, hex_side, autoscale=False):
        """
        Building hexagons shapes from given dataframe.
        :param column: str
        :param annotation_column: str
        :param plot_settings: dict
        :param hex_side: number
        :param autoscale: bool
        :return:
        """
        pi6 = np.pi / 6.
        ax = self.fig.gca()
        values = self.df[column].values
        patchesx = []
        self.df.apply(lambda row: patchesx.append(RegularPolygon(
            orientation=pi6,
            xy=(row['x'], row['y']),
            numVertices=6,
            radius=hex_side)), axis=1)
        cmap = plt.get_cmap(plot_settings['color_map'])

        values = np.ma.masked_where(np.isnan(values), values)
        cmap.set_bad(color='black')
        patches_coll = PatchCollection(
            patches=patchesx,
            cmap=cmap,
            alpha=plot_settings.get('hex_alpha', 0.8),
            linewidths=plot_settings.get('hex_linewidths', 0.))
        patches_coll.set_array(values)
        patches_coll.set_clim(plot_settings['bar_limits'])
        ax.add_collection(patches_coll)
        ax.figure.colorbar(patches_coll)

        if annotation_column and annotation_column in self.df.columns.values:
            for (_, cn), reg_pol in zip(self.df.iterrows(), patchesx):
                plt.annotate(cn[annotation_column], xy=reg_pol._xy,
                             size=plot_settings.get('annotation_size', 0.3))

        ax.set_title(plot_settings['title'])
        ax.set_xlabel(plot_settings.get('xlabel', "x [m]"))
        ax.set_ylabel(plot_settings.get('ylabel', "y [m]"))
        if autoscale:
            ax.autoscale()
            ax.set_aspect('equal')

    @staticmethod
    def save_figure(output_dir, column, reducer_name, out_formats, floor,
                    dpi=300, file_prefix=''):
        """
        Helper for saving plot into kpi directory common hierarchy
        :param output_dir: str
        :param column: str
        :param reducer_name: str
        :param out_formats: list[str]
        :param floor: str
        :param dpi: int
        :param file_prefix: str
        :return:
        """
        directory = os.path.join(output_dir, "floor_%s" % str(int(floor)))
        if not os.path.exists(directory):
            os.mkdir(directory)

        for extension in out_formats:
            out_path = build_path(
                directory,
                name='%s_%s_%s' % (file_prefix, column, reducer_name),
                extension='.%s' % extension)
            logger.info('Saving figure < %s >' % out_path)
            plt.savefig(out_path, bbox_inches='tight',
                        dpi=dpi, format=extension)
        plt.clf()

    @staticmethod
    def hexgrid_plot_worker(df, column, annotation_column,
                            reducer_name, floor, map_drawer_settings,
                            plot_settings, hex_side, output_dir, out_formats,
                            dpi, file_prefix):
        """
        Processing hex binning
        :param df: DataFrame
        :param column: str
        :param annotation_column: str
        :param reducer_name: str
        :param floor: str
        :param map_drawer_settings: dict
        :param plot_settings: dict
        :param hex_side: number
        :param output_dir: str
        :param out_formats: str
        :param dpi: int
        :return:
        """
        h = HexGridPlot(df)
        h.base_map_plot(floor, map_drawer_settings)
        h.hex_grid_plot(column, annotation_column, plot_settings, hex_side)
        h.save_figure(output_dir, column, reducer_name,
                      out_formats, floor, dpi, file_prefix)


class PointHexBinningFactory(object):
    default_reducers = dict(
        count=np.size, mean=np.mean, std=np.std, min=np.min, max=np.max,
        percentile25=percentile25, median=percentile50,
        percentile75=percentile75, iqr=iqr, unique_count=unique_count
    )

    def __init__(self, df, configuration, hex_side=1, attr_map=None):
        """
        Factory for hexbin plots.
        1) aggregation of points into hex bins
        2) reducing by defined functions
        3) optional: interpolation of values, clipping by building
        4) plotting hexahons and building base map
        :param df: DataFrame
        :param configuration: dict
        :param hex_side: float
        :param attr_map: dict
            mapping columns for given dataframe to x and y
        """
        self.attr_map = attr_map or {'x': 'x', 'y': 'y'}
        self.df = df
        self.hex_side = hex_side
        self.configuration = configuration
        if not all(col in df.columns.values for col in ['q', 'r']):
            logger.info('Building hexgrid index...')
            self.df = build_hex_index(self.df, self.hex_side, self.attr_map)
        self.name_helper = {}
        self.result = []

    def calculate_statistics(self, interpolation_setting=None,
                             clipper_setting=None):
        """
        Aggregation, statistical reducing, interpolation and clipping
        :param interpolation_setting: dict
        :param clipper_setting: dict
        :return: list(tuple(DataFrame, str, str),...)
            list(tuple(df,column, reducer name),...)
        """
        result_queue = []

        for field_name, cfg in self.configuration.items():
            for reducer_name, stat_cfg in cfg.items():
                # one reduce function may have multiple different filters
                if 'plot' not in stat_cfg:
                    for name, stat_cfg_nest in stat_cfg.items():
                        self.name_helper[name] = reducer_name
                        feed = dict(
                            result_queue=result_queue,
                            column=field_name,
                            df=self.df,
                            df_filter=stat_cfg_nest.get('filter', None),
                            reducer=(name, self.default_reducers[reducer_name]),
                            hex_side=self.hex_side,
                            interpolation_setting=interpolation_setting,
                            clipper_setting=clipper_setting)
                        PointHexBinningStatistic.hexgrid_reduce_worker(**feed)
                else:
                    self.name_helper[reducer_name] = reducer_name
                    feed = dict(
                        result_queue=result_queue,
                        column=field_name,
                        df=self.df,
                        df_filter=stat_cfg.get('filter', None),
                        reducer=(reducer_name,
                                 self.default_reducers[reducer_name]),
                        hex_side=self.hex_side,
                        interpolation_setting=interpolation_setting,
                        clipper_setting=clipper_setting)
                    PointHexBinningStatistic.hexgrid_reduce_worker(**feed)

        self.result = result_queue

    def plot(self, floor, map_drawer_settings,
             out_formats, output_dir, file_prefix):
        """
        Helper for parallel plotting
        :param floor: str
        :param map_drawer_settings: dict
        :param out_formats: list[str]
        :param output_dir: str
        :return:
        """
        processes = []
        for df, column, reducer_name in self.result:
            plot_cfg = self.configuration[column][
                self.name_helper[reducer_name]]
            if 'plot' not in plot_cfg:
                plot_cfg = plot_cfg[reducer_name]
            feed = dict(df=df,
                        column=column,
                        reducer_name=reducer_name,
                        annotation_column=None,
                        floor=floor,
                        map_drawer_settings=map_drawer_settings,
                        plot_settings=plot_cfg['plot'],
                        hex_side=self.hex_side,
                        output_dir=output_dir,
                        out_formats=out_formats,
                        file_prefix=file_prefix,
                        dpi=300)

            p = Process(target=HexGridPlot.hexgrid_plot_worker,
                        kwargs=feed)
            p.start()
            processes.append(p)

        for p in processes:
            p.join()
            p.terminate()

    def save_shapefile(self):
        raise NotImplementedError('Check this function in git history ')


def spatial_binning_runner(data, reducers_configuration, interpolation_setting,
                           clipper_setting, map_drawer_settings, output_dir,
                           output_formats, boundaries, prefix, cols_map=None):
    """
    Main runner for performing spatial binning into hex cells
    :param data: iterable tuple of two elements
        (floor, pd.DataFrame)
    :param reducers_configuration: dict
    :param interpolation_setting: dict
    :param clipper_setting: dict
    :param map_drawer_settings: doct
    :param output_dir: str
    :param output_formats: list(str)
    :param boundaries: pd.DataFrane
    :param cols_map: dict
    :return:
    """

    cols_map = cols_map or {'floor': 'ref_floor', 'x': 'ref_x', 'y': 'ref_y'}

    for floor, df in data:
        if boundaries and clipper_setting:
            clipper_setting['boundaries'] = boundaries[floor]
        logger.info('Hexbin processing for floor %s - n%s started' % (
            floor, len(df)))

        phbf = PointHexBinningFactory(df, reducers_configuration, 1, cols_map)
        phbf.calculate_statistics(interpolation_setting, clipper_setting)
        phbf.plot(floor, map_drawer_settings, output_formats, output_dir,
                  prefix)


def spatial_binning_diff_runner(data_ref, data_obs,
                                reducers_configuration, interpolation_setting,
                                clipper_setting, map_drawer_settings,
                                output_dir, output_formats, boundaries, prefix,
                                cols_map=None):
    """
    Performs spatial binning of given dataframes and plot the difference of cells
    :param data_ref: dict
        (floor, DataFrame)
    :param data_obs: dict
        (floor, DataFrame)
    :param reducers_configuration: dict
    :param interpolation_setting: dict
    :param clipper_setting: dict
    :param map_drawer_settings: doct
    :param output_dir: str
    :param output_formats: list(str)
    :param boundaries: pd.DataFrane
    :param cols_map: dict
    :return:
    """
    hex_side = 1
    cols_map = cols_map or {'floor': 'ref_floor', 'x': 'ref_x', 'y': 'ref_y'}

    feed = {floor: (data_ref[floor], data_obs[floor])
            for floor in set([floor for floor, _ in data_ref.items()])}

    for floor, portion in feed.items():
        if boundaries and clipper_setting:
            clipper_setting['boundaries'] = boundaries[floor]

        logger.info('Reference hexbin processing for floor %s - n%s started' % (
            floor, len(portion[0])))
        phbf_ref = PointHexBinningFactory(
            portion[0], reducers_configuration, hex_side, cols_map)
        phbf_ref.calculate_statistics(interpolation_setting, clipper_setting)

        logger.info('Observed hexbin processing for floor %s - n%s started' % (
            floor, len(portion[1])))
        phbf_obs = PointHexBinningFactory(
            portion[1], reducers_configuration, hex_side, cols_map)
        phbf_obs.calculate_statistics(interpolation_setting, clipper_setting)

        mapping = defaultdict(dict)
        feed_diff = []
        for df, column, reducer_name in phbf_ref.result:
            df = build_hex_index(df, hex_side)
            df = df.set_index(keys=['q', 'r'])
            mapping[column][reducer_name] = df

        for df, column, reducer_name in phbf_obs.result:
            if not (column in mapping and reducer_name in mapping[column]):
                logger.warning('Skipping column < %s >, statistics < %s >' % (
                    column, reducer_name))
                continue
            df = build_hex_index(df, hex_side)
            df = df.set_index(keys=['q', 'r'])
            df_ref = mapping[column][reducer_name]
            # ensure same lenght of dataframes before comparison
            idx = df_ref.index.intersection(df.index)

            df_ref = df_ref[df_ref.index.isin(idx)]
            df = df[df.index.isin(idx)]
            df[column] = df_ref[column] - df[column]
            feed_diff.append((df, column, reducer_name))

        phbf_ref.result = feed_diff
        phbf_ref.plot(floor, map_drawer_settings,
                      output_formats, output_dir, prefix)
