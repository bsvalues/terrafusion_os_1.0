"""
generate benchmark configuration file

"""
import json
from logging import getLogger

from indoorsdatapy.common.cli import custom_parser, settings, output_file
from indoorsdatapy.common.logging_setup import cli_logger

logger = getLogger(__name__)


def main():
    args = [settings, (output_file, {"required": False})]
    parser = custom_parser(
        args, description="{}- Description ".format(__name__))
    parser.add_argument("--input")

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    feed = {'jobs': []}
    with open(parsed.input, 'r') as f:
        for lines in f.readlines():
            js = json.loads(lines)
            feed['jobs'].append(js['jobs'])

    out = json.dumps(feed)
    out = out.replace('"', '\\"').replace(' ', '')
    print(out)
    if parsed.output_file:
        with open(parsed.output_file, 'w') as f:
            f.write(out)


if __name__ == '__main__':
    main()
