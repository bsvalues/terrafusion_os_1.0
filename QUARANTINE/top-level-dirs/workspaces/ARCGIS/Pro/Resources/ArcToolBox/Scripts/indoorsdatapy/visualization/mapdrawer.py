#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Indoors map related drawing.
"""
import os
from collections.abc import Iterable
from hashlib import md5
from logging import getLogger
from math import ceil, log
from os import path, makedirs

import matplotlib as mpl

if os.environ.get('DISPLAY', '') == '':
    print('no display found. Using non-interactive Agg backend')
    mpl.use('Agg')
import matplotlib
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from PIL import ImageFile
from enum import Enum
from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.common.configurable import dict_update
from indoorsdatapy.common.const import zone_type
from indoorsdatapy.visualization.building_tiles import (BuildingTiles,
                                                        BuildingTilesBundle)
from matplotlib.collections import LineCollection, PolyCollection
from mpl_toolkits import axes_grid1

ImageFile.LOAD_TRUNCATED_IMAGES = True

logger = getLogger(__name__)

MAP_DRAWER_SETTINGS = {
    'crop': True,
    'extent': None,
    'title': 1,
    'tile_lvl': False,
    'xlabel': 'x (meters)',
    'ylabel': 'y (meters)',
    'max_image_size': (2000, 2000),
    'dpi': 400,
    'margin_percentage': 0.1,
    'plot_map': True,
    'walls': {
        'plot': True,
        'style': {
            "colors": "blue", "linewidths": 0.3, "linestyles": "solid",
            "zorder": 4, "alpha": 0.8},
    },
    'plot_zones': True,
    'zones': {
        zone_type.ZONE: {
            'plot': True,
            'label': False,
            'label-size': "xx-small",
            'style': {
                "facecolor": "green", "alpha": 0.5, "edgecolor": None,
                "zorder": 3}
        },
        zone_type.DEAD_ZONE: {
            'plot': True,
            'style': {
                "facecolor": "blue", "alpha": 0.5, "edgecolor": None,
                "zorder": 3}
        },
        zone_type.BOUNDING_BOX: {
            'plot': True,
            'style': {
                "facecolor": "red", "alpha": 0.2, "edgecolor": None,
                "zorder": 2}
        }
    },
    'fingerprintpoints': {
        'plot': False,
        'style': {"marker": "o", "zorder": 5, "cmap": "Spectral_r"},
        'color': "N_NETWORKS",
        'size': "RSSI_MEAN",
        'scale_max': 100,
        'scale_min': 10
    },
    'network_locations': {
        'plot': False,
        'label': False,
        'label-size': "xx-small",
        'style': {
            "marker": "*", "c": "yellow", "s": 80, "zorder": 11,
            "edgecolor": 'black', "linewidth": 1}
    }
}


class MapDrawer(object):
    """
    Visualization class for IDM related data.

    Use plot() to plot the map

    Init:
    * building_access - BuildingAccess instance (Required)

    Settings:
    * title - figure title
    * xlabel - figure x-axis label
    * ylabel - figure y-axis label
    * max_image_size - ensure map zoom fits in this xy-tuple (2000, 1500),
    * dpi - output resolution
    * margin_pecentage - extra x.y padding
    * plot_map - if enabled plot graphic map
    * walls
        - plot: if true plot walls
        - style: arguments for matplotlib LineCollection
    * plot_zone: if true plot zones
    * zones - arguments for zones
        - zone_type.ZONE
            + plot: if true plot zones
            + style: arguments for matplotlib PolyCollection
        - zone_type.DEAD_ZONE
            + plot: if true plot dead zones
            + style: arguments for matplotlib PolyCollection
        - zone_type.BOUNDING_BOX
            + plot: if true plot bounding box
            + style: arguments for matplotlib PathPatch
    * fingerprintpoints
        - plot: if True plot fingerprintpoints
        - style: arguments for matplotlib scatter
                 Note: should NOT contain s or c!
        - color: Coloring method One of FINGERPRINTPOINT_SCALE
        - size: SizeMethod One of FINGERPRINTPOINT_SCALE
        - FINGERPRINTPOINT_SCALE:
            + N_NETWORKS - scale by number of networks seen in the point
            + RSSI_AMOUNT - scale by sum of RSSI_AMOUNT over all statistics
            + RSSI_MEAN - scale by average of RSSI_MEAN over all statistics
            + RSSI_RANGE - scale by abs(MAX-MIN) RSSI taken over all statistics
    * network_locations
        - plot: if true plot bounding box
        - style: arguments for matplotlib PathPatch
        - label [false] if true plot text labels with transmitter id
        - lable-size [xx-small]
    """
    IMAGE_PATH = "images"
    TILE_DIRECTORY = "default-map"

    TILE_WIDTH = 256
    TILE_HEIGHT = 256

    FINGERPRINTPOINT_SCALE = Enum(
        "FINGERPRINTPOINT_SCALE",
        "DEFAULT N_NETWORKS RSSI_AMOUNT RSSI_MEAN RSSI_RANGE")

    def __init__(self, building_dto=None, building_key=None, settings=None,
                 endpoint=None, building_id=None, tile_bundle=None):
        """
        
        :param building_dto:  BuildingService or Access
        :param building_key: str
            api key
        :param settings: dict
            MapDrawer settings
        :param endpoint: str
            
        :param building_id: 
        """

        if building_dto is None and not building_id:
            raise AttributeError('building_dto or building_id must be present')

        if tile_bundle and building_dto is None:
            raise AttributeError(
                'If tile_bundle is provided than building_dto must be as well')

        self.settings = dict_update(MAP_DRAWER_SETTINGS, settings)
        mpl.rcParams['figure.dpi'] = self.settings['dpi']

        # logger.info('Settings of MapDrawer %s' % str(self.settings))
        if building_dto is not None:
            self.__back_compatibility(building_dto)
        else:
            self._building_dto = None
            self._building_id = building_id

        if building_key:
            self._building_tiles = BuildingTiles(
                self._building_id,
                building_key,
                endpoint=endpoint)

        if tile_bundle and building_dto is not None:
            self._building_tiles = BuildingTilesBundle(
                tile_bundle, self._building_dto
            )

        self._image_cache = {}

        # Fetch the cmap
        if not isinstance(
                self.settings["fingerprintpoints"]["style"]["cmap"],
                matplotlib.colors.LinearSegmentedColormap):
            self.settings["fingerprintpoints"]["style"]["cmap"] = \
                plt.get_cmap(
                    self.settings["fingerprintpoints"]["style"]["cmap"])

        # Enum setting if needed
        if not isinstance(self.settings["fingerprintpoints"]["color"], Enum):
            self.settings["fingerprintpoints"]["color"] = \
                MapDrawer.FINGERPRINTPOINT_SCALE[
                    self.settings["fingerprintpoints"]["color"]]
        if not isinstance(self.settings["fingerprintpoints"]["size"], Enum):
            self.settings["fingerprintpoints"]["size"] = \
                MapDrawer.FINGERPRINTPOINT_SCALE[
                    self.settings["fingerprintpoints"]["size"]]

        # Create dict of zones to plo
        if self.settings["plot_zones"]:
            self.__zones_to_plot = {
                k: v for k, v in self.settings["zones"].items() if v["plot"]}

    def __back_compatibility(self, building_dto):
        """
        Conversion between service and access. 
        :param building_dto: dict or BuidingService
        :return: 
        """
        if isinstance(building_dto, BuildingAccess):
            self._walls_by_floor = building_dto.walls_by_floors()
            self._zones_by_level = building_dto.zones_points_by_level()
            self._fingerprint_points = lambda floor: building_dto.fingerprint_points()
            self._fingerprint_points_statistics = \
                lambda: building_dto.fingerprint_points_statistics()
            self._transmitter_locations = lambda: building_dto.transmitter_locations()
            self._building_id = building_dto['id']
            self._building_dto = building_dto
        else:
            raise NotImplementedError('Be careful')

    def plot(self, floor_level, axes=None, do_init=True):
        """
        Plot given floor level

        Parameters:
        * floor - level of floor to plot (required)
        * axes - existing matplotlib axes to draw to
        * do_init - if enabled run init_plot
        * transmitter_ids - list of transmitter ids, if specified
          fingerprint points/network plot only uses given transmitters

        Returns:
        * axes drawn to
        """
        if self._building_dto:
            levels = self._building_dto['floors']['level'].tolist()
            if floor_level not in levels:
                logger.error(
                    "No such floor {} available, try one of {}".format(
                        floor_level, levels))
                return

        self.__axes = plt.gcf().add_subplot(1, 1, 1) if axes is None else axes

        if do_init:
            self.__init_plot(floor_level)
        if self.settings["plot_map"]:
            self.__plot_map(floor_level)
        if self.settings["walls"]["plot"]:
            self.__plot_walls(floor_level)

        self.__axes.invert_yaxis()

        # if self.settings["plot_zones"] and len(self.__zones_to_plot) > 0:
        #    self.__plot_zones(floor_level)
        # if self.settings["fingerprintpoints"]["plot"]:
        #    self.__plot_fingerprintpoints(floor_level, transmitter_ids)
        # if self.settings["network_locations"]["plot"]:
        #    self.__plot_network_locations(floor_level, transmitter_ids)

        return self.__axes

    def save(self, img_path):
        """
        Save current plot

        Parameters:
        img_path: full path and filename to save to
        """
        logger.debug("Saving plot to {}".format(img_path))
        path_name = path.dirname(img_path)
        if len(path_name) > 0:
            if not path.exists(path_name):
                logger.debug(
                    "MapDrawer: Creating output directory {}".format(
                        path_name))
                makedirs(path_name)
        plt.savefig(img_path, bbox_inches='tight', dpi=self.settings["dpi"])
        logger.info("Saved image {}".format(img_path))

    def __init_plot(self, floor_level):
        """
        Initialize plot
        
        """
        if self.settings["xlabel"] is not None:
            self.__axes.set_xlabel(self.settings["xlabel"])
        if self.settings["ylabel"] is not None:
            self.__axes.set_ylabel(self.settings["ylabel"])
        if self.settings["title"] is not None:
            title = self.settings["title"]
        elif self._building_dto:
            title = self._building_dto["name"]
            title += " floor {}".format(floor_level)
        else:
            title = ''
        self.__axes.set_title(title)

    def get_image(self, floor_level):
        """
        For given level return glued tiles of the zoom level 1
        :param floor_level: int
            building level
        :return: PIL.Image
            floor plan
        """
        if floor_level in self._image_cache:
            return self._image_cache[floor_level]

        td = self.__get_tile_def(floor_level)
        kv = td.iloc[0].to_dict()
        nx, ny = kv["count_horizontal_tiles"], kv["count_vertical_tiles"]
        px, py = kv["sum_pix_width"], kv["sum_pix_height"]
        tile_size, scale = kv["tile_size"], kv["mm_per_pixel_base"]
        nx, ny, px, py, tile_size = map(int, (nx, ny, px, py, tile_size))
        logger.debug(
            "Stitching image with tile_size {},"
            " {}x{} tiles, and {}x{} pixels".format(tile_size, nx, ny, px,
                                                    py)
        )
        # Scale in meters
        scale *= tile_size * 1E-3

        # Create image from tiles
        unique = "{}{}{}.png".format(self._building_id, floor_level,
                                     tile_size)
        cache_hash = md5(unique.encode('utf-8')).hexdigest()
        cache_path = path.join('/tmp', cache_hash)

        if path.exists(cache_path):
            logger.debug("Loading cached floor image {}".format(cache_path))
            self._image_cache[floor_level] = (Image.open(cache_path), scale)
            return self._image_cache[floor_level]

        image = Image.new("RGBA", (px, py))
        for tx in range(nx):
            for ty in range(ny):
                tile_image = self._building_tiles.get_tile_image(
                    floor_level, tile_size, tx, ty)
                logger.debug("Pasting tile ({},{})".format(tx, ty))
                image.paste(tile_image, (tx * MapDrawer.TILE_WIDTH,
                                         ty * MapDrawer.TILE_HEIGHT))

        self._image_cache[floor_level] = (image, scale)
        image.save(cache_path, "PNG")
        return self._image_cache[floor_level]

    def __get_bbox(self, floor_level):

        zones = self._zones_by_level[floor_level]

        zones = zones[zones['type'] == zone_type.BOUNDING_BOX]
        if not zones.empty:
            logger.debug('Using bbox based on building BOUNDING_BOX')
            return (zones["x"].min(), zones["y"].min(),
                    zones["x"].max(), zones["y"].max())

        edges = self._walls_by_floor[floor_level]
        if not edges.empty:
            logger.debug('Using bbox based on building walls')

            return (min(edges["x0"].min(), edges["x1"].min()),
                    min(edges["y0"].min(), edges["y1"].min()),
                    max(edges["x0"].max(), edges["x1"].max()),
                    max(edges["y0"].max(), edges["y0"].max())
                    )
        return None

    def get_image_crop(self, floor, pos, size):
        """
        For given building level, x,y and size of picture return cropped floor
        plan.
        :param floor: int
            level of building
        :param pos: tuple(float)
            (x,y) coords in building coords
        :param size: number
            bbox size in meters
        
        :return: PIL.Image
            cropped image
        """

        tile, scale = self.get_image(floor)

        # scale of size of bbox
        sz = (size / scale) / 2.
        # scale of pos into pixels
        pos = (pos[0] / scale, pos[1] / scale)
        fringe = 10

        # left upper and right lower coords
        left_up = (pos[0] - sz, pos[1] - sz)
        right_down = (pos[0] + sz, pos[1] + sz)
        bbox = (left_up[0] - fringe, left_up[1] - fringe,
                right_down[0] + fringe, right_down[1] + fringe
                )

        logger.info('Cropping floor plan by bbox: %s' % str(bbox))
        return tile.crop(bbox)

    def __get_tile_def(self, floor_level):
        """Get tile definition that fits in max_image_size setting"""
        td = self._building_tiles.get_definitions(floor_level)
        tile_size = self.settings.get('tile_lvl', False)
        if not tile_size:
            td_1 = td[td.tile_size == 1]
            kv = td_1.iloc[0].to_dict()
            px, py = kv['sum_pix_width'], kv['sum_pix_height']
            maxx, maxy = self.settings["max_image_size"]

            ratio = max(px / maxx, py / maxy)
            tile_size = 2 ** int(ceil(log(ratio, 2)))

        if tile_size not in td.tile_size.values:
            tile_idx = (np.abs(td.tile_size.values - tile_size)).argmin()
            tile_size1 = tile_size
            tile_size = td.tile_size.values[tile_idx]
            logger.warning(
                "Ideal size {} not available, using {} instead".format(
                    tile_size1, tile_size))

        logger.debug('Selected tile zoom level: %s' % tile_size)

        return td[td.tile_size == tile_size]

    def __plot_map(self, floor_level):
        # Get tile definition for optimal tile size
        image, scale = self.get_image(floor_level)
        sx, sy = scale * image.size[0], scale * image.size[1]

        # Plot image
        self.__axes.imshow(image, extent=[0, sx, sy, 0])

        extent = self.settings['extent'] or self.__get_bbox(floor_level)
        logger.debug("Extend image size: %s" % str(extent))

        logger.debug("Scaled image size: sx: %s, sy: %s" % (sx, sy))
        margin = self.settings["margin_percentage"]

        if bool(self.settings['crop']) and extent:
            logger.debug('Cropping by bbox extent: %s' % str(extent))
            self.__axes.set_xlim(extent[0], extent[2])
            self.__axes.set_ylim(extent[1], extent[3])

        else:
            self.__axes.set_xlim(-sx * margin, sx * (1 + margin))
            self.__axes.set_ylim(-sy * margin, sy * (1 + margin))

    def __plot_walls(self, floor_level):
        logger.debug("Plotting walls for floor: %s" % floor_level)
        edges = self._walls_by_floor[floor_level]
        values = zip(edges[["x0", "y0"]].values, edges[["x1", "y1"]].values)
        walls = LineCollection(values, **self.settings["walls"]["style"])
        self.__axes.add_collection(walls)

    def __plot_zones(self, floor_level):
        for zt, style in self.__zones_to_plot.items():
            zones = self._zones_by_level[floor_level]
            zones = zones[zones.zonetype == zt]

            zpoints = [
                self._building_dto['zone_points'][z.id][["x", "y"]].values
                for i, z in zones.iterrows()
            ]

            if len(zpoints) == 0:
                continue
            if zt is zone_type.BOUNDING_BOX:
                # Use patch to draw bounding box
                bbox = [(x, y) for x, y in zpoints[0]]
                xl, yl = self.__axes.get_xlim(), self.__axes.get_ylim()
                bound = [(xl[0], yl[0]), (xl[0], yl[1]),
                         (xl[1], yl[1]), (xl[1], yl[0]), (xl[0], yl[0])]
                M, L = [matplotlib.path.Path.MOVETO], [
                    matplotlib.path.Path.LINETO]
                self.__axes.add_patch(
                    matplotlib.patches.PathPatch(
                        matplotlib.path.Path(
                            bound + bbox,
                            M + (len(bound) - 1) * L +
                            M + (len(bbox) - 1) * L),
                        **self.settings["zones"][zt]["style"]))
                continue
            # Use collection to draw all zones at once
            self.__axes.add_collection(PolyCollection(
                zpoints, **self.settings["zones"][zt]["style"]))

    def __plot_fingerprintpoints(self, floor_level, transmitter_ids):
        # Get xyf data
        xyfpoints = self._fingerprint_points(floor_level)
        xyfpoints = xyfpoints[xyfpoints.floor_level == floor_level]
        xyfstats = self._fingerprint_points_statistics()
        xyfstats = xyfstats[xyfstats.floor_level == floor_level]

        if len(xyfpoints.index) == 0 or len(xyfstats.index) == 0:
            logger.warning(
                "Trying to plot 0 fingerprintpoints, not gonna do it")
            return

        if transmitter_ids is not None:
            xyfstats = xyfstats[
                xyfstats["transmitter_id"].isin(transmitter_ids)]
            xyfpoints = xyfpoints[
                xyfpoints["point_id"].isin(xyfstats["point_id"])]

        # Greate scaler for color and size assignment
        grp = xyfstats[
            ["point_id", "mean_rssi", "transmitter_occ"]].groupby("point_id")
        scaler = {
            MapDrawer.FINGERPRINTPOINT_SCALE.N_NETWORKS: lambda: (
                "N Networks",
                grp.size().values),
            MapDrawer.FINGERPRINTPOINT_SCALE.RSSI_AMOUNT: lambda: (
                "sum(occ)",
                grp.sum()["transmitter_occ"].values),
            MapDrawer.FINGERPRINTPOINT_SCALE.RSSI_MEAN: lambda: (
                "mean(rssi)",
                grp.mean()["mean_rssi"].values),
            MapDrawer.FINGERPRINTPOINT_SCALE.RSSI_RANGE: lambda: (
                "$|\mathrm{RSSI}_\mathrm{max}-\mathrm{RSSI}_\mathrm{min}|$",
                np.abs(grp.max()["mean_rssi"].values - grp.min()[
                    "mean_rssi"].values))
        }

        # Get color scale
        clabel, c = scaler.get(
            self.settings["fingerprintpoints"]["color"],
            lambda: (None, "w"))()
        # Get size scale, apply normalization
        slabel, s = scaler.get(
            self.settings["fingerprintpoints"]["size"],
            lambda: (None, 40))()
        if isinstance(s, Iterable):
            s = (self.settings["fingerprintpoints"]["scale_max"] -
                 self.settings["fingerprintpoints"]["scale_min"]) * \
                (s - s.min()) / (s.max() - s.min()) + \
                self.settings["fingerprintpoints"]["scale_min"]

        # Do plot
        scatter = self.__axes.scatter(
            xyfpoints["x"].values,
            xyfpoints["y"].values,
            c=c, s=s,
            **self.settings["fingerprintpoints"]["style"])
        # Create color bar if needed. Set label to color label
        if clabel is not None:
            cax = axes_grid1.make_axes_locatable(self.__axes).append_axes(
                'right', size='5%', pad=0.05)
            plt.gcf().colorbar(scatter, label=clabel, cax=cax)
        # If needed append size label to xlabel
        if slabel is not None:
            self.__axes.set_xlabel(
                "{}\n point size: {}".format(self.__axes.get_xlabel(), slabel))

    def __plot_network_locations(self, floor_level, transmitter_ids):
        """Plot network locations"""
        building_locations = self._transmitter_locations()
        locations = building_locations[
            building_locations["floor_level"] == floor_level]

        if transmitter_ids is not None:
            locations = locations[
                locations["transmitter_id"].isin(transmitter_ids)]
        if len(locations.index) == 0:
            return

        self.__axes.scatter(
            locations["x"].values,
            locations["y"].values,
            **self.settings["network_locations"]["style"])
        if not self.settings["network_locations"]["label"]:
            return

        for i, loc in locations.iterrows():
            self.__axes.text(
                loc["x"], loc["y"], loc["transmitter_id"],
                size=self.settings["network_locations"]["label-size"],
                zorder=20)


def draw_walls_access(fig, access, floor, ax=None, settings=None):
    """
    Configuration of MapDrawer for plotting walls
     from protocolbuffer of building
    :param fig: figure
    :param access: access.building
    :param floor: int
        floor
    :return: 
        fig
    """
    default = {
        'plot_map': False,
        'walls': {
            'plot': True
        }
    }
    if settings:
        default = dict_update(settings, default)
    drawer = MapDrawer(
        building_dto=access,
        settings=default)

    drawer.plot(floor_level=int(floor),
                axes=ax or fig.add_subplot(1, 1, 1))
    return fig


def draw_tile_bundle_access(fig, access, tile_bundle, floor, draw_tiles=True,
                            draw_walls=False, ax=None, settings=None):
    """
    Configuration of MapDrawer for plotting tiles using zip file

    :param fig: plt.fig
    :param access: access.building
    :param tile_bundle: path
    :param floor: int
    :param draw_tiles: bool 
    :param draw_walls: bool
    :param ax: plt.ax
    :param settings: dict
    :return: 
    """
    default = {
        'plot_map': draw_tiles,
        'walls': {
            'plot': draw_walls
        }
    }

    if settings:
        default = dict_update(settings, default)

    drawer = MapDrawer(
        building_dto=access,
        tile_bundle=tile_bundle,
        settings=default
    )

    drawer.plot(floor_level=int(floor),
                axes=ax or fig.add_subplot(1, 1, 1))
    return fig


def draw_tiles_access(fig, access, api_key, building_api_url, floor,
                      draw_tiles=True, draw_walls=False,
                      building_id=None, ax=None, settings=None):
    """
    Configuration of MapDrawer for plotting tiles using API endpoint
    :param fig: plt.fig
    :param access: access.building
    :param api_key: str
    :param building_api_url: str 
    :param floor: int
    :param draw_tiles: bool 
    :param draw_walls: bool
    :return: plt.fig 
    with desired walls, tiles or both
    """
    default = {
        'plot_map': draw_tiles,
        'walls': {
            'plot': draw_walls
        }
    }
    if settings:
        default = dict_update(settings, default)

    drawer = MapDrawer(
        building_dto=access or None,
        building_key=api_key,
        endpoint=building_api_url,
        building_id=building_id,
        settings=default)

    drawer.plot(floor_level=int(floor), axes=ax)
    return fig


def get_tiles_bundle_access(access, tile_bundle, settings=None):
    """
    
    :param access: access.building
    :param tile_bundle: str
        path to zip file
    :param settings: dict
    :return: MapDrawer object
    """
    default = {
        'plot_map': True,
        'walls': {
            'plot': False
        }
    }
    if settings:
        default = dict_update(settings, default)

    return MapDrawer(
        building_dto=access,
        tile_bundle=tile_bundle,
        settings=default
    )


def get_plot_helper(fig, floor, setting, ax):
    """
    Initialize Map drawer for given setting
    :param fig: plt.fig
        canvas to plot for, optionally None
    :param floor: int
        floor to be plotted
    :param setting: dict
        Required: access: building access
        Optional:
                api_key and building_api_url
            or
                idm
            or 
                None
        :param ax: plt.axis
            optional
    :return: 
    """
    if 'access' not in setting:
        raise AttributeError('Not building access in settings dict')

    access = setting['access']
    del setting['access']

    if setting['api_key'] and setting['building_api_url']:
        logger.debug("plotting tiles from api")

        fg = draw_tiles_access(
            fig, access,
            setting['api_key'],
            setting['building_api_url'],
            floor,
            settings=setting,
            ax=ax)
    elif setting['idm']:
        logger.debug("plotting tiles from idm")
        fg = draw_tile_bundle_access(
            fig,
            access,
            setting['idm'],
            floor=floor,
            settings=setting,
            ax=ax)
    else:
        logger.info("plotting walls")
        fg = draw_walls_access(
            fig, access,
            floor=floor, settings=setting,
            ax=ax)

    setting['access'] = access
    return fg


def configure(parsed, setting, building_tables=None):
    """
    Configuration of map drawer. This is helper!
    :param parsed: agr parser
    :param setting: dict
    :return: 
    """
    building_tables = building_tables or []
    setting['output_dir'] = parsed.output_dir
    setting['map_drawer'] = {'crop': setting['crop'],
                             'extent': setting.get('extent', None)}
    setting['map_drawer']['access'] = None

    if parsed.building_dto:
        setting['map_drawer']['access'] = BuildingAccess(
            parsed.building_dto,
            ['id', 'name', 'walls', 'edge_points',
             'floors', 'zones', 'zone_points'] + building_tables)
        setting['map_drawer']['access'].cln_pb()
        if parsed.building_id:
            setting['map_drawer']['access']['id'] = parsed.building_id

        setting['map_drawer']['access']['tile_description'] = \
            setting['map_drawer']['access'].tiles_description()

        del setting['map_drawer']['access']['floors']['default_map']

    setting['map_drawer']['api_key'] = getattr(parsed, 'api_key', None)
    setting['map_drawer']['building_api_url'] = getattr(
        parsed, 'building_api_url', None)
    setting['map_drawer']['idm'] = getattr(parsed, 'idm', None)

    if parsed.idm is None:
        setting['map_drawer']['crop'] = False

    return setting
