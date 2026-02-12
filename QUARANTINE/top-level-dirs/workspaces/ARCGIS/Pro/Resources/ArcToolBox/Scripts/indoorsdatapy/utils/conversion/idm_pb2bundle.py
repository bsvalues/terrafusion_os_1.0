#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Create indoo.rs bundle from idm file
usage: idm_pb2bundle.py [-h] [-I ZIP] [-B DTO] -o OUTPUT_FILE [--verbose]
                        [--quiet] [--overwrite]

__main__ - idm and building pb 2 building bundle archive

optional arguments:
  -h, --help            show this help message and exit
  -I ZIP, --idm ZIP     path of idm file
  -B DTO, --building_dto DTO
                        path of building dto
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH
"""
import os
import shutil
import tempfile
from copy import deepcopy
from logging import getLogger
from zipfile import ZipFile, ZIP_DEFLATED

from PIL import Image

from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.common.cli import (custom_parser, building_dto,
                                      idm as idmarg, output_file)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.data_model.util.idm import IDM, zipdir

logger = getLogger(__name__)


def idm2floorplans(idm, tile_description):
    """

    :param idm: IDM object

    :param tile_description: tiles_description
        tile metadata
    :return:
    """
    tile_size = 256
    tile_descriptionx = deepcopy(tile_description)
    # get rid of all non max size of tiles
    for floor, desc in tile_descriptionx.items():
        for tile in desc['tiles']:
            if tile['value']['tile_size'] != 1:
                desc['tiles'].remove(tile)

    tmpdif = tempfile.mkdtemp()
    floorplans_dir = os.path.join(tmpdif, 'floorplans')
    logger.info('Merging tiles from idm file...')
    for floor, desc in tile_descriptionx.items():
        canvas = Image.new("RGB", (
            desc['tiles'][0]['value']['sum_pix_width'],
            desc['tiles'][0]['value']['sum_pix_height']))

        for x in range(desc['tiles'][0]['value']['count_horizontal_tiles']):
            for y in range(
                    desc['tiles'][0]['value']['count_vertical_tiles']):
                logger.debug('floor:%s x: < %s > y < %s >' % (floor, x, y))
                tile = os.path.join(idm.mapdir, 'images', str(floor),
                                    'default-map', '1',
                                    "{}_{}.png".format(y, x))

                tile_tmp = Image.open(tile)
                xpix = x * tile_size
                ypix = y * tile_size
                tile_sizex = tile_tmp.size[0]
                tile_sizey = tile_tmp.size[1]
                canvas.paste(tile_tmp,
                             (xpix, ypix, xpix + tile_sizex, ypix + tile_sizey))

        if not os.path.isdir(floorplans_dir):
            os.makedirs(floorplans_dir)
        path = os.path.join(floorplans_dir, str(floor) + '.png')
        logger.info("Saving floor plan to %s" % path)
        canvas.save(path)

    return tmpdif


def serialize_bundle(building_dto, bundle_dir, out_file):
    """

    :param building_dto: str
        path to building pb
    :param bundle_dir: str
        dir with floorplans to be serialized
    :param out_file: str
        out archive
    :return:
    """
    shutil.copyfile(building_dto, os.path.join(bundle_dir, 'building.pb'))
    zipf = ZipFile(out_file, 'w', compression=ZIP_DEFLATED)
    logger.info('File saved to %s' % out_file)
    zipdir(bundle_dir, zipf)
    zipf.close()


def main():
    args = [idmarg, building_dto, output_file]

    parser = custom_parser(
        args, description="{} - idm and building pb 2"
                          " building bundle archive".format(__name__)
    )
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    idm = IDM(parsed.idm)
    access = BuildingAccess(parsed.building_dto,
                            ['lat_origin', 'lon_origin', 'rotation', 'floors'])
    tiles_meta = access.tiles_description()

    base_bundle_dir = idm2floorplans(idm, tiles_meta)
    serialize_bundle(parsed.building_dto, base_bundle_dir, parsed.output_file)


if __name__ == '__main__':
    main()
