"""
Runs cpp Replayer
usage: replayer_runner.py [-h] -o OUTPUT_FILE [--verbose] [--quiet]
                          [--overwrite] [-e INPUT_FILE] [-c INPUT_FILE]

__main__ - Running replayer bash script from python

optional arguments:
  -h, --help            show this help message and exit
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  -e INPUT_FILE, --env_file INPUT_FILE
  -c INPUT_FILE, --cfg_file INPUT_FILE

(c) indoo.rs GmbH

"""
import json
import sys
from logging import getLogger

from indoorsdatapy.common.cli import custom_parser, output_file, output_dir
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.tools.replayer_benchmark.replayer import Replayer

logger = getLogger(__name__)


def main():
    args = [output_file, output_dir]
    parser = custom_parser(
        args,
        description="{} - Running replayer bash script from python".format(
            __name__))
    parser.add_argument(
        "-e", "--env_file", metavar="INPUT_FILE", type=str)

    parser.add_argument(
        "-c", "--cfg_file", metavar="INPUT_FILE", type=str)
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    data = {}
    if parsed.env_file:
        with open(parsed.env_file) as env:
            logger.info('Reading env file: %s' % parsed.env_file)
            data['env'] = json.load(env)

    if parsed.cfg_file:
        with open(parsed.cfg_file) as cfg:
            logger.info('Reading cfg file: %s' % parsed.cfg_file)
            data['profile'] = json.load(cfg)

    rep = Replayer(data, parsed.output_file, parsed.output_dir)
    sys.exit(rep.run())


if __name__ == '__main__':
    main()
