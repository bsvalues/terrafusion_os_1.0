"""
usage: sql2replayer_conf.py [-h] -u URL [--verbose] [--quiet] [--overwrite]
                            [-e OUTPUT_FILE] [-c OUTPUT_FILE] [--env_id ID]
                            [--cfg_id ID]

__main__- Query configuration of replayer frombenchmark database

optional arguments:
  -h, --help            show this help message and exit
  -u URL, --server_url URL
                        url of server
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  -e OUTPUT_FILE, --env_file OUTPUT_FILE
  -c OUTPUT_FILE, --cfg_file OUTPUT_FILE
  --env_id ID
  --cfg_id ID

(c) indoo.rs GmbH

"""
import json
import sys
from logging import getLogger

from indoorsdatapy.common.cli import custom_parser, server_url
from indoorsdatapy.common.logging_setup import cli_logger
from indoorssql.core.replayer.sql2replayer import \
    get_environment, get_replayer_conf, SqlException

logger = getLogger(__name__)


def main():
    args = [server_url]
    parser = custom_parser(
        args,
        description="{}- Query configuration of replayer from"
        "benchmark database ".format(__name__))
    parser.add_argument("-e", "--env_file", metavar="OUTPUT_FILE", type=str)
    parser.add_argument("-c", "--cfg_file", metavar="OUTPUT_FILE", type=str)
    parser.add_argument("--env_id", metavar="ID", type=str)
    parser.add_argument("--cfg_id", metavar="ID", type=str)

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)
    try:
        if parsed.env_file and parsed.env_id:
            with open(parsed.env_file, 'w') as env:
                logger.info('Writing env file: %s' % parsed.env_file)
                json.dump(get_environment(parsed.env_id, parsed.server_url),
                          env)

        if parsed.cfg_file and parsed.cfg_id:
            with open(parsed.cfg_file, 'w') as cfg:
                logger.info('Writing cfg file: %s' % parsed.cfg_file)
                json.dump(get_replayer_conf(parsed.cfg_id, parsed.server_url),
                          cfg)
    except SqlException as e:
        logger.error('Sql error: %s' % e)
        sys.exit(1)


if __name__ == '__main__':
    main()
