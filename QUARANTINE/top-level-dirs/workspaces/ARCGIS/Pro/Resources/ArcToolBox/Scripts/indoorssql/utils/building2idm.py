"""
Update IDM file by Building protocol buffer
usage: building2idm.py [-h] -S DTO -o OUTPUT_FILE [-i INPUT_FILE] [-a URL]
                       [-k API_KEY] [--verbose] [--quiet] [--overwrite]

building2idm

optional arguments:
  -h, --help            show this help message and exit
  -S DTO, --slam_radio_map DTO
                        Path of slam_radio_map
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Idm Generator: None
  -i INPUT_FILE, --input_file INPUT_FILE
                        tile bundle zip
  -a URL, --building_api_url URL
                        output dir destination
  -k API_KEY, --api_key API_KEY
                        api key of application
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists

(c) indoo.rs GmbH
"""
from indoorsdatapy.access.building import Building
from indoorsdatapy.access.factory.utils import load_pb
from indoorsdatapy.common.cli import (custom_parser, building_dto, api_key,
                                      output_file, building_api_url, idm)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.common.time_util import TimeContext
from indoorsdatapy.visualization.building_tiles import BuildingTiles

from indoorssql.core.df_sql_util import sql2df
from indoorssql.core.idm.building_idm_update import BuildingIDMGen
from indoorssql.model.building import BuildingDB


def main():
    args = [(building_dto, dict(required=True)),
            (output_file,
             dict(required=True, help="Idm Generator: {}".format(__doc__))),
            (idm, dict(help='tile bundle zip', required=False)),
            building_api_url, api_key]

    parser = custom_parser(args, description="building2idm")

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    building = load_pb(Building, parsed.building_dto)

    with TimeContext("Downloading building {}".format(building.id)):
        db = BuildingDB(building.id, parsed.api_key, endpoint=parsed.api_url)
        building_dfs = sql2df(db.db_url)

    idm_generator = BuildingIDMGen(building_dfs)

    if not parsed.input_file:
        tiles = BuildingTiles(building.id,
                              parsed.api_key,
                              endpoint=parsed.api_url)
        idm_generator.tiles(tiles)

    idm_generator.results(building)
    idm_generator.build(parsed.output_file, parsed.input_file or None)


if __name__ == "__main__":
    main()
