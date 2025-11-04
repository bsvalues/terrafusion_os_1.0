#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import zipfile
from logging import getLogger
from operator import itemgetter
from os import path
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED

from indoorsdatapy.visualization.building_tiles import BuildingTiles
from indoorssql.core.df_sql_util import dto2sql
from pandas import DataFrame

logger = getLogger(__name__)


class IDMGen(object):
    """Generate IDM file using provided service instances."""

    EXCLUDE = frozenset([
        'network', 'networklocation', 'networkmetadata', 'cluster',
        'checkpoint', 'calibration', 'device', 'fingerprint',
        'fingerprintpoint', 'fingerprintseries', 'fingerprintseriesmember',
        'fingerprintseriesmetadata', 'measurement', 'measurementsession',
        'measurementsessionmetadata', 'statistic'
    ])

    def __init__(self, dfs, exclude=None):
        """Construct IDM generator with given building service.

        Args:
            building_dfs (access.building): A building service to load data from.
        """
        self._dframes = dfs
        self._tiles = dict()
        self._update(dict((name, []) for name in (exclude or self.EXCLUDE)))

    def results(self, service):
        """Add results from slam service.

        Args:
            service (SlamService): A service with results.
        """
        raise NotImplementedError

    def overwrite_dframes(self, dfs):
        for table_name, df in dfs.items():
            self._dframes[table_name] = df

    def _update(self, entities):
        """Update associated entities.

        Args:
            entities (dict): An entities mapping with keys as table names.
        """
        for table, entities in entities.items():
            if table in self._dframes:
                self._dframes[table] = DataFrame(
                    [[mapping[c]
                      for c in self._dframes[table].columns]
                     for mapping in entities],
                    columns=self._dframes[table].columns)
            else:
                logger.warning("Table < %s > should be created"
                               " but it is not on input. Skipped.." % table)

    def tiles(self, tiles):
        """Download ZIP archives of tiles.

        Args:
            tiles (BuildingTiles): A building tiles instance.
        """
        for level in self._dframes['floor'].level.values:
            defs = tiles.get_default_tiles(level)
            for size in sorted(map(itemgetter('tileSize'), defs)):
                name = "images/{}/default-map/{}".format(level, size)
                self._tiles[name] = tiles.get_tile_pack(level, size)

    def build(self, filename, tiles_archive=None):
        """Build IDM file and save it.

        Create a ZIP archive containing SQLite database and images.

        Args:
            filename (str): A path to save a file.
        """
        with ZipFile(filename, 'w', compression=ZIP_DEFLATED) as z:
            # using a temp dir instead of NamedTemporaryFile for win
            # compatibility
            with tempfile.TemporaryDirectory() as temp_dir:
                tmp_db_file = os.path.join(temp_dir, 'indoors.db')
                dto2sql(self._dframes,
                        'sqlite:///' + os.path.abspath(tmp_db_file))
                with open(tmp_db_file, 'rb') as db_file_handle:
                    z.writestr('indoors.db', db_file_handle.read())

            if tiles_archive:
                zip_ref = zipfile.ZipFile(tiles_archive,
                                          'r',
                                          compression=ZIP_DEFLATED)
                for name in zip_ref.namelist():
                    # skip old db if present
                    if name == 'indoors.db':
                        continue
                    z.writestr(name, zip_ref.read(name))
            else:
                # make directories
                z.writestr('images/', '')
                for level in self._dframes['floor'].level.values:
                    z.writestr('images/{}/'.format(level), '')
                    z.writestr('images/{}/default-map/'.format(level), '')

                # save images
                for directory, zip_f in self._tiles.items():
                    z.writestr('{}/'.format(directory), '')
                    for name in zip_f.namelist():
                        z.writestr(path.join(directory, name), zip_f.read(name))
            logger.info('Idm file saved to: < %s >' % filename)
