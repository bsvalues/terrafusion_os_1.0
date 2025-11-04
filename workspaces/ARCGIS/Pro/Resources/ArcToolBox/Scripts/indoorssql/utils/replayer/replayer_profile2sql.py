"""
usage: replayer_profile2sql.py [-h] -u URL [--verbose] [--quiet] [--overwrite]
                               [--replay_sensors TEXT] [--replay_gps TEXT]
                               [--replay_pdr TEXT] [--replay_radio TEXT]
                               [--locator_params TEXT] [--name TEXT]
                               [--position_type TEXT]

__main__- Inserting new configuration to replayer-benchmark database

optional arguments:
  -h, --help            show this help message and exit
  -u URL, --server_url URL
                        url of server
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  --replay_sensors TEXT
  --replay_gps TEXT
  --replay_pdr TEXT
  --replay_radio TEXT
  --locator_params TEXT
  --name TEXT
  --position_type TEXT

(c) indoo.rs GmbH

"""
from logging import getLogger

from indoorsdatapy.common.cli import custom_parser, server_url
from indoorsdatapy.common.logging_setup import cli_logger
from indoorssql.core.replayer.replayer2sql import insert_configuration

logger = getLogger(__name__)


def main():
    args = [server_url]
    parser = custom_parser(
        args,
        description="{}- Inserting new configuration to replayer-"
        "benchmark database ".format(__name__))
    parser.add_argument("--replay_sensors", metavar="TEXT", type=int)
    parser.add_argument("--replay_gps", metavar="TEXT", type=int)
    parser.add_argument("--replay_pdr", metavar="TEXT", type=int)
    parser.add_argument("--replay_radio", metavar="TEXT", type=int)
    parser.add_argument("--locator_params", metavar="TEXT", type=str)
    parser.add_argument("--name", metavar="TEXT", type=str)
    parser.add_argument("--position_type", metavar="TEXT", type=int)
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    insert_configuration(
        {
            'profile': {
                "name": parsed.name,
                "replay_sensors": bool(parsed.replay_sensors),
                "replay_gps": bool(parsed.replay_gps),
                "replay_pdr": bool(parsed.replay_pdr),
                "replay_radio": bool(parsed.replay_radio),
                "locator_params": parsed.locator_params,
                "position_type": parsed.position_type,
            }
        }, parsed.server_url)


if __name__ == '__main__':
    main()
