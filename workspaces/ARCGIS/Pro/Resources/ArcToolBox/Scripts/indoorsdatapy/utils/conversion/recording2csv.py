import os
from logging import getLogger

from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import (custom_parser, output_dir, settings,
                                      recording_ids)
from indoorsdatapy.common.logging_setup import cli_logger

logger = getLogger(__name__)


def main():
    args = [output_dir, recording_ids,
            settings]
    parser = custom_parser(
        args, description="{}- Description ".format(__name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    for rec in parsed.recordings:
        access = RecordingAccess(rec)
        for attr, df in access.items():
            rec_dir = os.path.join(parsed.output_dir, df['id'])
            if not os.path.exists(rec_dir):
                os.makedirs(rec_dir)
            out = os.path.join(rec_dir, "%s.csv" % attr)
            df.to_csv(out)
            logger.info('saving csv %s' % out)


if __name__ == '__main__':
    main()
