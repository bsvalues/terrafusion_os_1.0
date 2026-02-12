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
                                                 tiles_description,
                                                 process_floorplans, zip_bundle)
from indoorssql.core.ray.raytracer_core import RayTracerIdmCreator

logger = getLogger(__name__)


def main():
    args = [(output_file, {
        'required': True
    }), (input_file, {
        'required': True,
        'help': 'tile bundle'
    })]

    parser = custom_parser(
        args,
        description="{}- Create idm file "
        "from protocolbuffer and raytracer ".format(__name__))

    parser.add_argument("--result_ray", metavar="CSV_FILE")
    parser.add_argument("--input_ray", metavar="CSV_FILE")
    parser.add_argument("--tx_map_ray", metavar="CSV_FILE")
    parser.add_argument("--lat", type=float, metavar="NUMBER")
    parser.add_argument("--lon", type=float, metavar="NUMBER")
    parser.add_argument("--rotation", type=float, metavar="NUMBER")

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
    access.pb.lat_origin = int(parsed.lat * 1e6)
    access.pb.lon_origin = int(parsed.lon * 1e6)
    access.pb.rotation = parsed.rotation
    idm = RayTracerIdmCreator(sqlite, access.pb, parsed.result_ray,
                              parsed.input_ray, parsed.tx_map_ray)
    idm.run()
    process_floorplans(floorplans, tiles, tiles_description(access))

    zip_bundle(dest, parsed.output_file, ['building.pb', 'floorplans'])


if __name__ == '__main__':
    main()
