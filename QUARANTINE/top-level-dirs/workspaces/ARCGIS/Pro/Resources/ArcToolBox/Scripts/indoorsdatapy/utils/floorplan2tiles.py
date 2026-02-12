"""
Converts image to tiles in format of indoo.rs IDM tiles
usage: floorplan2tiles.py [-h] [-B DTO] [--input_dir INPUT_DIR]
                          [-i INPUT_FILE] [-d OUTPUT_DIR] [-o OUTPUT_FILE]
                          [-s SETTINGS_JSON] [--verbose] [--quiet]
                          [--overwrite]

__main__ - Description

optional arguments:
  -h, --help            show this help message and exit
  -B DTO, --building_dto DTO
                        path of building dto
  --input_dir INPUT_DIR
                        Input dir destination
  -i INPUT_FILE, --input_file INPUT_FILE
                        zip file of floor plan bundle
  -d OUTPUT_DIR, --output_dir OUTPUT_DIR
                        Output dir destination
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  -s SETTINGS_JSON, --settings SETTINGS_JSON
                        Settings (json string)
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH

"""
import argparse
import os
import shutil
import tempfile
from functools import partial
from logging import getLogger
from zipfile import ZipFile, ZIP_DEFLATED

from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.common.cli import (custom_parser, building_dto, input_dir,
                                      output_dir, settings, input_file, output_file)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.tools.tiles.slicer import (slice_img_core,
                                              scale_tile, save_tiles)

logger = getLogger(__name__)


def generate_tiles(floor_plan, count_horizontal_tiles,
                   count_vertical_tiles, sum_pix_width, sum_pix_height):
    fnc = partial(scale_tile, width=sum_pix_width, height=sum_pix_height)
    return slice_img_core(floor_plan,
                          tile_w=256,
                          tile_h=256,
                          number_cols=count_vertical_tiles,
                          number_rows=count_horizontal_tiles,
                          preprocessing_img=fnc,
                          )


def process_floorplans(input_directory, output_directory, tiles_descriptor):
    for _dir in os.listdir(input_directory):
        floor = int(_dir.split('.')[0])
        basic = tiles_descriptor[floor]
        dir_zoom = 1
        for tile_set in basic['tiles']:
            tl_info = tile_set['value']
            save_tiles(
                tiles=generate_tiles(
                    floor_plan=os.path.join(input_directory, _dir),
                    count_horizontal_tiles=tl_info['count_horizontal_tiles'],
                    count_vertical_tiles=tl_info['count_vertical_tiles'],
                    sum_pix_width=tl_info['sum_pix_width'],
                    sum_pix_height=tl_info['sum_pix_height']),
                directory=os.path.join(
                    output_directory,
                    str(floor),
                    'default-map',
                    str(dir_zoom))
            )
            dir_zoom += dir_zoom


def unzip_bundle(zip_boundle, destinantion):
    logger.info('Unzipping floorplans %s' % destinantion)
    zip_ref = ZipFile(zip_boundle, 'r')
    zip_ref.extractall(destinantion)
    zip_ref.close()
    return destinantion


def zip_bundle(path, destination, filters=None):
    filters = filters or []
    zipf = ZipFile(destination, 'w', compression=ZIP_DEFLATED)
    for root, dirs, files in os.walk(path):

        if root.split('/')[-1] in filters:
            logger.info('Skipping %s' % root)
            continue

        if root.replace(path, '') == '':
            prefix = ''
        else:
            prefix = root.replace(path, '') + '/'
            if prefix[0] == '/':
                prefix = prefix[1:]

        for filename in files:
            if filename in filters:
                logger.info('Skipping %s' % filename)
                continue
            actual_file_path = os.path.join(root, filename)
            zipped_file_path = prefix + filename
            zipf.write(actual_file_path, zipped_file_path)
    logger.info('Saving zip file %s' % destination)


def main():
    args = [
        building_dto,
        input_dir,
        (input_file,
         {'required': False, 'help': 'zip file of floor plan bundle'}),
        (output_dir, {'required': False, }),
        (output_file, {'required': False, }),
        settings]

    parser = custom_parser(
        args, description="{} - Description ".format(__name__))

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    if not parsed.input_dir and not parsed.input_file:
        raise argparse.ArgumentError(
            None, 'Input of floor plans is not specified')

    if not parsed.output_dir and not parsed.output_file:
        raise argparse.ArgumentError(
            None, 'Output for tiled floor plans is not specified')

    building_access = BuildingAccess(parsed.building_dto, ['floors'])
    tiles_descriptor = building_access.tiles_description()

    if parsed.output_dir and os.path.isdir(parsed.output_dir):
        shutil.rmtree(parsed.output_dir)

    input_folder = parsed.input_dir or unzip_bundle(
        parsed.input_file, tempfile.mkdtemp())

    output_folder = parsed.output_dir or tempfile.mkdtemp()
    process_floorplans(os.path.join(input_folder, 'plans'),
                       os.path.join(output_folder, 'images'),
                       tiles_descriptor)

    if parsed.output_file:
        logger.info('Saving zip file %s' % parsed.output_file)
        zip_bundle(output_folder, parsed.output_file)


if __name__ == '__main__':
    main()
