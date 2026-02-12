"""
usage: replayer_banchmark2sql.py [-h] -u URL -o OUTPUT_FILE [--verbose]
                                 [--quiet] [--overwrite] [-O FILE] [-L TEXT]
                                 [-P ID] [-E ID] [-M TEXT]

__main__- Inserting new benchmark result to replayer-benchmark database

optional arguments:
  -h, --help            show this help message and exit
  -u URL, --server_url URL
                        url of server
  -o OUTPUT_FILE, --output_file OUTPUT_FILE
                        Output file destination
  --verbose             increase output verbosity
  --quiet               decrease output verbosity
  --overwrite           force overwrite output if exists
  -O FILE, --kpi FILE
  -L TEXT, --locator_hash TEXT
  -P ID, --profile_id ID
  -E ID, --environment_id ID
  -M TEXT, --metadata TEXT

(c) indoo.rs GmbH

"""
import json
from collections import defaultdict
from logging import getLogger

from indoorsdatapy.access.kpi import Kpi
from indoorsdatapy.access.factory.utils import load_pb
from indoorsdatapy.common.cli import custom_parser, server_url, output_file
from indoorsdatapy.common.logging_setup import cli_logger
from indoorssql.core.replayer.replayer2sql import insert_benchmark

logger = getLogger(__name__)


def parse_kpi(kpi_path, columns=None, stats=None, stats_mapping=None):
    columns = columns or ['d_ref', 't_res', 'd_floor']
    stats = stats or ['mean', 'q50', 'std']
    stats_mapping = stats_mapping or dict(mean='mean', q50='median', std='std')
    kpi = defaultdict(dict)
    pb = load_pb(Kpi, open(kpi_path, 'rb'))
    for col in columns:
        for stat in stats:
            kpi[col][stats_mapping[stat]] = getattr(
                getattr(pb.building_statistics, col), stat)
    return kpi


def main():
    args = [server_url, output_file]
    parser = custom_parser(
        args,
        description="{}- Inserting new benchmark result to replayer-"
        "benchmark database ".format(__name__))

    parser.add_argument("-O", "--kpi", metavar="FILE", type=str)
    parser.add_argument("-L", "--locator_hash", metavar="TEXT", type=str)
    parser.add_argument("-P", "--profile_id", metavar="ID", type=int)
    parser.add_argument("-E", "--environment_id", metavar="ID", type=int)
    parser.add_argument("-M", "--metadata", metavar="TEXT", type=str)

    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)
    data = dict(locator_hash=parsed.locator_hash,
                profile_id=parsed.profile_id,
                environment_id=parsed.environment_id,
                meta=parsed.metadata,
                kpi=parse_kpi(parsed.kpi))

    new_id = insert_benchmark(data, parsed.server_url)

    with open(parsed.output_file, 'w') as f:
        json.dump(new_id, f)
        logger.info('Id %s written to file %s' % (new_id, parsed.output_file))


if __name__ == '__main__':
    main()
