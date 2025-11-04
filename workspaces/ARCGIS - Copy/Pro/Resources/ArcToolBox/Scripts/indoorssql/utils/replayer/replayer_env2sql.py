from logging import getLogger

from indoorsdatapy.common.cli import custom_parser, building_id, \
    recording_ids, idm_id, api_key, server_url
from indoorsdatapy.common.logging_setup import cli_logger
from indoorssql.core.replayer.replayer2sql import insert_configuration

logger = getLogger(__name__)


def main():
    args = [building_id, recording_ids, idm_id, api_key, server_url]
    parser = custom_parser(args,
                           description="{}- Inserting new environment "
                           "configuration to replayer-"
                           "benchmark database ".format(__name__))
    parser.add_argument("--metadata", metavar="TEXT", type=str)
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    insert_configuration(
        {
            'env': {
                "idm": parsed.idm_id,
                "building": parsed.building_id,
                "indoors_env": "prod",
                "recordings": map(int, parsed.recording_ids),
                "api_key": parsed.api_key,
                "meta": parsed.metadata
            }
        }, parsed.server_url)


if __name__ == '__main__':
    main()
