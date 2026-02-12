"""usage: bundle2idm.py [-h] -o OUTPUT_FILE -i INPUT_FILE [--verbose] [--quiet]
                 [--overwrite]

__main__- Create idm file from protocolbuffer

optional arguments:
  -h, --help            show this help message and exit
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  -i INPUT_FILE, --input_file INPUT_FILE
                        tile bundle
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH
"""
import os
import tempfile
from logging import getLogger

from indoorsdatapy.access.building import BuildingAccess
from indoorsdatapy.common.cli import custom_parser, output_file, input_file
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.utils.floorplan2tiles import (unzip_bundle,
                                                 process_floorplans, zip_bundle)
from indoorssql.core.idm.building_pb2idm import SqlIdmCreator

logger = getLogger(__name__)


def main():
    args = [(output_file, {
        'required': True
    }), (input_file, {
        'required': True,
        'help': 'tile bundle'
    })]

    parser = custom_parser(args,
                           description="{}- Create idm file "
                           "from protocolbuffer ".format(__name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    tdir = tempfile.mkdtemp()
    dest = unzip_bundle(parsed.input_file, tdir)
    pb_b = os.path.join(dest, 'building.pb')
    sqlite = os.path.join(dest, 'indoors.db')
    floorplans = os.path.join(dest, 'floorplans')
    tiles = os.path.join(dest, 'images')

    if not os.path.isdir(tiles):
        os.mkdir(tiles)
    access = BuildingAccess(pb_b, ['floors'])
    idm = SqlIdmCreator(sqlite, access.pb)
    idm.run()
    process_floorplans(floorplans, tiles, access.tiles_description())

    zip_bundle(dest, parsed.output_file, ['building.pb', 'floorplans'])


if __name__ == '__main__':
    main()
