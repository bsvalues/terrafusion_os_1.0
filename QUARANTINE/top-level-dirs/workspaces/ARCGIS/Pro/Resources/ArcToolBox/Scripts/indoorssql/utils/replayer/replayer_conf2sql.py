"""
usage: replayer_env2sql.py [-h] [-b ID] [-r IDS [IDS ...]] [-o ID]
                           [-k API_KEY] -u URL [--verbose] [--quiet]
                           [--overwrite] [--metadata TEXT]

__main__- Inserting new environment configuration to replayer-benchmark
database

optional arguments:
  -h, --help            show this help message and exit
  -b ID, --building_id ID
                        building id to use
  -r IDS [IDS ...], --recording_ids IDS [IDS ...]
                        recording id(s) to use
  -o ID, --idm_id ID    idm id
  -k API_KEY, --api_key API_KEY
                        api key of application
  -u URL, --server_url URL
                        url of server
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  --metadata TEXT

(c) indoo.rs GmbH

"""
import json
from logging import getLogger

from indoorsdatapy.common.cli import custom_parser, server_url
from indoorsdatapy.common.logging_setup import cli_logger
from indoorssql.core.replayer.replayer2sql import insert_configuration

logger = getLogger(__name__)


def main():
    args = [server_url]
    parser = custom_parser(
        args,
        description="{}- Inserting new replayerprofile and env "
        "configuration to replayerbenchmark "
        "database using json files as input".format(__name__))
    parser.add_argument("-e", "--env_file", metavar="INPUT_FILE", type=str)
    parser.add_argument("-c", "--cfg_file", metavar="INPUT_FILE", type=str)

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    data = {}
    if parsed.env_file:
        with open(parsed.env_file) as env:
            logger.info('Reading env file: %s' % parsed.env_file)
            data['env'] = json.load(env)

    if parsed.cfg_file:
        with open(parsed.cfg_file) as cfg:
            logger.info('Reading profile configuration file: %s' %
                        parsed.cfg_file)
            data['profile'] = json.load(cfg)

    insert_configuration(data, parsed.server_url)


if __name__ == '__main__':
    main()
