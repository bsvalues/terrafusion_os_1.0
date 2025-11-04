"""
Extract metadata from recording protocol buffer and return in json
usage: metadata_creator.py [-h] [-e {dev,test,prod}] --entity
                           {buildings,recordings,slams}
                           [--settings SETTINGS_JSON] [-n]
                           [-o OUTPUT_FILE_PREFIX] (-i id | -d DTO)

CMD utility allows to extract metadata from Slam, Building and Recording
Service. Returns ------- # for building # python metadata_creator.py -e prod
--id 8924 --entity building # for recording # python metadata_creator.py -e
test -dto path/to/dto.pb --entity recording

optional arguments:
  -h, --help            show this help message and exit
  -e {dev,test,prod}, --environment {dev,test,prod}
                        Cloud envtironment
  --entity {buildings,recordings,slams}
                        Type of entity
  --settings SETTINGS_JSON
                        Settings (json string)
  -n, --no_cache        Force download - no use cache
  -o OUTPUT_FILE_PREFIX, --output OUTPUT_FILE_PREFIX
                        Prefix of output images
  -i id, --id id        id of entity
  -d DTO, --dto DTO     path to dto

(c) indoo.rs GmbH

examples:
    -------
    # for building
    # python metadata_creator.py -e prod --id 8924 --entity building

    # for recording
    # python metadata_creator.py -e test -dto path/to/dto.pb --entity recording

"""
import logging
from argparse import ArgumentParser
from json import loads, dumps
from sys import stdout

from indoorsdatapy.access.provider.load_access import access_loader
from indoorsdatapy.access.recording import positions_with_type
from indoorsdatapy.server_utils.cloud_entity import BUILDINGS, RECORDINGS, SLAMS
from indoorsdatapy.server_utils.cloud_env import DEV, PROD, TEST
from indoorsdatapy.server_utils.metadata import MetadataFactory

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

def main():
    """
    CMD utility allows to extract metadata from Slam, Building and Recording Service.

    Returns
    -------
    :type str into stdout or specifed text file
    :json file which consists of extracted metadata
    """

    parser = ArgumentParser(
        description=main.__doc__,
        epilog="(c) indoo.rs GmbH")

    parser.add_argument(
        '-e', "--environment",
        action='store',
        default=TEST,
        choices=[DEV, TEST, PROD],
        help='Cloud envtironment')

    parser.add_argument(
        "--entity",
        required=True,
        action='store',
        choices=[BUILDINGS, RECORDINGS, SLAMS],
        help='Type of entity')

    parser.add_argument(
        "--settings", metavar="SETTINGS_JSON", type=str, default=None,
        help="Settings (json string)")
    parser.add_argument(
        "-n", '--no_cache', action='store_true',
        help="Force download - no use cache")
    parser.add_argument(
        "-o", "--output", metavar="OUTPUT_FILE_PREFIX", type=str,
        help="Prefix of output images", default=None)

    obj = parser.add_mutually_exclusive_group(required=True)
    obj.add_argument(
        "-i", "--id", metavar="id", type=int, default=None,
        help="id of entity")
    obj.add_argument(
        "-d", "--dto", metavar="DTO", type=str, default=None,
        help="path to dto")

    parsed = parser.parse_args()
    settings = None

    if parsed.settings:
        settings = loads(str(parsed.settings))

    access = access_loader(
        entity=parsed.entity,
        env=parsed.environment,
        idents=parsed.id,
        force=parsed.no_cache,
        local_paths=parsed.dto)

    access = access.values()[0]
    if access:
        md = MetadataFactory(access,parsed.entity, settings or None)
        md.create_metadata()
        metadata_dict = md.get_metadata()

        if parsed.entity == RECORDINGS:
            metadata_dict['floor_levels'] = list(
                positions_with_type(access, 1)['floor'].unique())

        if not parsed.output:
            stdout.write(dumps(metadata_dict))
            stdout.flush()
        else:
            with open(parsed.output, 'w') as fl:
                fl.write(dumps(metadata_dict))
                fl.flush()


if __name__ == "__main__":
    main()
