"""
generate benchmark configuration file
python ids2benchmark_cfg.py --env_id  29 30 31 32 33 34 35 36 37 38 39 40 41 42 21 22 22 21 43 --profile_id 43 43 43 43 43 43 43 43 43 43 43 43 43 43 43 43 43 43 43

"""
import json
from logging import getLogger

from indoorsdatapy.common.cli import custom_parser, settings
from indoorsdatapy.common.logging_setup import cli_logger

logger = getLogger(__name__)


def main():
    args = [settings]
    parser = custom_parser(
        args, description="{}- Description ".format(__name__))
    parser.add_argument("--env_id", metavar="ID", type=int, nargs="+")
    parser.add_argument("--profile_id", metavar="ID", type=int, nargs="+")
    parser.add_argument("--benchmark_id", metavar="ID", type=int, nargs="+")

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    feed = {'jobs': []}
    if parsed.benchmark_id:
        for env, prof, bench in zip(parsed.env_id, parsed.profile_id,
                                    parsed.benchmark_id):
            feed['jobs'].append(dict(profile_id=prof,
                                     env_id=env,
                                     benchmark_id=bench))
    else:
        for env, prof in zip(parsed.env_id, parsed.profile_id):
            feed['jobs'].append(dict(profile_id=prof, env_id=env))

    out = json.dumps(feed)
    print(out.replace('"', '\\"').replace(' ', ''))


if __name__ == '__main__':
    main()
