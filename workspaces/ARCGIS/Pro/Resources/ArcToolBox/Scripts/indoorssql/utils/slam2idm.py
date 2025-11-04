"""
Updates an existing idm file after a slam-job.
The data from the output protobuf file gets
added to the idm file of the building.
The updated idm data is written to a new file
"""

import logging
import os
import tempfile
import warnings
from zipfile import ZipFile, ZIP_DEFLATED

from indoorsdatapy.access.factory.utils import load_pb
from indoorsdatapy.common.cli import (custom_parser, slam_radio_map,
                                      output_file, idm)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsprotocol.slams_pb2 import SlamMap
from indoorssql.core.df_sql_util import sql2df
from indoorssql.core.idm.slam_idm_update import SlamIDMGen

logger = logging.getLogger(__name__)


def extract_file_from_idm(idm_path, trg_dir, file_name='indoors.db'):
    """returns path to extracted db
    extracts db from idm file to a temporary directory
    returns path to database from idm file in temporary
    directory

    :param: idm_path: str
                    file path of idm(zip) file
    :param: trg_dir: str
                    path to directory where to write database
    :param: file_name: str, default: 'indoors.db'
    :return: db_path: str
                      absolute path to extracted database
                      in a temporary directory

    """
    with ZipFile(idm_path, 'r', compression=ZIP_DEFLATED) as zip_ref:
        zip_ref.extract(file_name, path=trg_dir)
        return os.path.abspath(os.path.join(trg_dir, file_name))


def get_idm_db(idm_path):
    """returns path to extracted db
    extracts db from idm file to a temporary directory
    returns path to database from idm file in temporary
    directory

    :param: idm_path: str
                    file path of idm(zip) file
    :return: db_path: str
                      absolute path to extracted database
                      in a temporary directory

    """
    warnings.warn(
        'This function will be removed in the future. Please use'
        '"extract_file_from_idm" in combination with tempfile.TemporaryDirectory()'
        ' and a context manager',
        category=DeprecationWarning)
    tmp_dir = tempfile.mkdtemp()
    return extract_file_from_idm(idm_path=idm_path, trg_dir=tmp_dir)


def main():
    args = [(slam_radio_map, dict(required=True)),
            (output_file,
             dict(required=True,
                  help='Output path, where updated file is written to')),
            (idm, dict(required=True, help='Idm file to be updated'))]

    parser = custom_parser(args, description=f"Idm Generator: {__doc__}")
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    slam_pb = load_pb(SlamMap, open(parsed.slam_radio_map, 'rb'))
    logger.info("Loading map %s" % parsed.slam_radio_map)
    with tempfile.TemporaryDirectory() as temp_dir:
        building_dfs = sql2df('sqlite:///' +
                              extract_file_from_idm(parsed.idm, temp_dir))
    idm_generator = SlamIDMGen(building_dfs)
    idm_generator.results(slam_pb)
    idm_generator.build(parsed.output_file, parsed.idm)


if __name__ == "__main__":
    main()
