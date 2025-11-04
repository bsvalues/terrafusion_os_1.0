#!/usr/bin/env python
# -*- coding: utf-8 -*-

import logging
import os
from hashlib import md5
from json import loads
from os import path
from zipfile import ZipFile

import requests
from PIL import Image
from io import StringIO, BytesIO 
from indoorsdatapy.common.time_util import TimeContext
from indoorsdatapy.data_model.util.idm import unzip_temporary
from pandas import DataFrame
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

logger = logging.getLogger(__name__)


def fetch(url, retries=3, backoff_factor=0.3,
          status_forcelist=(502, 503, 504), headers=None):
    """
    Fetch content at URL with proper retrial and error checking
    :param url: 
    :param retries: 
    :param backoff_factor: 
    :param status_forcelist: 
    :param headers: 
    :return: 
    """
    logger.debug("fetch: Fetching {}".format(url))
    headers = headers or dict()
    with requests.Session() as s:
        retries = Retry(
            total=retries,
            backoff_factor=backoff_factor,
            status_forcelist=status_forcelist)

        adapter = HTTPAdapter(max_retries=retries)
        s.mount('http://', adapter)
        s.mount('https://', adapter)

        with TimeContext("Fetch: Download"):
            try:
                r = s.get(url, headers=headers)
                r.raise_for_status()
            except requests.exceptions.RequestException as e:
                logger.error("fetch: Failed fetching - {}".format(e))
                raise e
            return r.content


class BuildingTiles(object):
    API_HEADER = "x-indoors-api-key"

    RESOURCES = dict(
        tiles="{}/buildings/{}/floors/{}/default-map/tiles",
        map="{}/buildings/{}/floors/{}/default-map",
        bitmaps="{}/buildings/{}/floors/{}/default-map/{}/bitmaps/{}_{}",
        pack="{}/buildings/{}/floors/{}/default-map/{}/bitmaps",
    )

    def __init__(self, building_id, building_key, directory="/tmp/tiles",
                 endpoint=None):
        """Construct building tiles instance for given building.

        :param building_id: unique identifier of the building
        :param building_key: api key for accessing building data from API
        :param directory: path to directory where to store cache
        """
        self._id = building_id
        self._key = building_key
        self._directory = directory
        self._attemps = 8
        self._endpoint = endpoint if \
            endpoint else "https://api.indoo.rs/indoors/rest"

    def get_tile_image(self, level, size, x, y):
        """Get tile instance from API.

        Download image from API and saves into cache.

        :param level: integer indicating floor level
        :param size: string containing size of image
        :param x: horizontal position of the tile
        :param y: vertical position of the tile
        :return: Image instance containing single tile
        """
        logging.debug(
            "Getting tile size: {}, x,y=({},{}) for floor level {}".format(
                size, x, y, level))
        url = self._format_url('bitmaps', self._id, level, size, y, x)
        cache_hash = md5(url.encode('utf-8')).hexdigest()
        cache_path = path.join(self._directory, cache_hash)
        if not path.isdir(self._directory):
            os.makedirs(self._directory)

        if not path.exists(cache_path):
            with open(cache_path, 'wb') as fd:
                logger.debug("Fetching tile image {}".format(url))
                data = fetch(
                    url,
                    retries=self._attemps,
                    headers={self.API_HEADER: self._key})
                if data is None:
                    raise AttributeError('Request of get_tile_image failed')
                fd.write(data)

        with open(cache_path, 'rb') as fd:
            logger.debug("Loading cached tile image {}".format(cache_path))
            return Image.open(BytesIO(fd.read()))

    def get_tile_pack(self, level, size):
        """Save tile image from API given path.

        Download image from API and save it as file.

        :param level: integer indicating floor level
        :param size: string containing size of image
        """
        url = self._format_url('pack', self._id, level, size)
        data = fetch(
            url,
            retries=self._attemps,
            headers={self.API_HEADER: self._key})
        return ZipFile(StringIO(data))

    def get_default_map(self, level):
        """Get default map for given level from API.

        :param level: integer indicating floor level
        :return: dictionary describing default map
        """
        url = self._format_url('map', self._id, level)
        data = fetch(
            url,
            retries=self._attemps,
            headers={self.API_HEADER: self._key})
        return loads(data)

    def get_default_tiles(self, level):
        """Get default tiles for given level from API.

        :param level: integer indicating floor level
        :return: list of dictionaries describing tiles
        """
        url = self._format_url("tiles", self._id, level)
        data = fetch(
            url,
            retries=self._attemps,
            headers={self.API_HEADER: self._key})

        return loads(data)

    def get_definitions(self, level):
        """Get tile definitions from API.

        :param level: integer indicating floor level
        :return: pandas.DataFrame instance containing tile definitions
        """
        default_map = self.get_default_map(level)
        default_tiles = self.get_default_tiles(level)

        return DataFrame.from_dict((
            dict(
                floor_level=level,
                count_horizontal_tiles=tiles["countHorizontalTiles"],
                count_vertical_tiles=tiles["countVerticalTiles"],
                sum_pix_width=tiles["sumPixWidth"],
                sum_pix_height=tiles["sumPixHeight"],
                mm_per_pixel_base=default_map["mmPerPixelBase"],
                tile_size=tiles["tileSize"],
            )
            for tiles in default_tiles
        )).sort_values('tile_size')

    def _format_url(self, resource, *args):
        """Format URL for given resource."""
        return self.RESOURCES[resource].format(self._endpoint, *args)


class BuildingTilesBundle(object):
    def __init__(self, tile_bundle, building_access):
        """
        
        :param tile_bundle: str
            path to zip file where tiles are stored(like idm)
        :param building_access: dict
            building access dict
        """
        self._tile_bundle = os.path.join(
            unzip_temporary(tile_bundle), 'images')

        if 'tile_description' in building_access:
            self._tile = building_access['tile_description']
        else:
            self._tile = building_access.tiles_description()

    def get_definitions(self, level):
        return DataFrame.from_dict((
            dict(
                floor_level=level,
                count_horizontal_tiles=tiles['value'][
                    "count_horizontal_tiles"],
                count_vertical_tiles=tiles['value']["count_vertical_tiles"],
                sum_pix_width=tiles['value']["sum_pix_width"],
                sum_pix_height=tiles['value']["sum_pix_height"],
                mm_per_pixel_base=desc["per_pixel_base"] * 1000,
                tile_size=tiles['value']["tile_size"],
            )
            for floor, desc in self._tile.items()
            if int(floor) == int(level)
            for tiles in desc['tiles']
        )).sort_values('tile_size')

    def get_default_map(self, level):
        return dict(mmPerPixelBase=self._tile[level]['per_pixel_base'],
                    maxTileSize=self._tile[level]['max_tile_size'])

    def get_tile_image(self, level, size, x, y):
        logging.debug(
            "Getting tile size: {}, x,y=({},{}) for floor level {}".format(
                size, x, y, level))
        tile_path = self._get_tile_path(level, size, y, x)
        with open(tile_path, 'rb') as fd:
            logger.debug("Loading cached tile image {}".format(tile_path))
            return Image.open(StringIO(fd.read()))

    def _get_tile_path(self, level, size, x, y):
        return os.path.join(
            self._tile_bundle, str(level), 'default-map', str(size),
            '{}_{}.png'.format(x, y))

    def get_default_tiles(self, level):
        raise NotImplementedError

    def get_tile_pack(self, level, size):
        raise NotImplementedError
