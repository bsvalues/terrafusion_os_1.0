"""
Validate recording suitability for SLAM
usage: slam_recording_checker.py [-h] -R DTOs [-o OUTPUT_FILE] [--type {initial,update}] [-b]

Recording validator

optional arguments:
-R DTOs, --recording_dto DTOs
        Path of recordings dto(s)
-o OUTPUT_FILE, --output_file OUTPUT_FILE
        Output file destination
--type {initial,update}
        Type of checker
-b, --bail
        Stop checker if some check failed
(c) indoo.rs GmbH
"""
import json
from sys import stdout, exit

from indoorsdatapy.access.recording import RecordingAccess
from indoorsdatapy.common.cli import recording_dto, custom_parser, output_file
from indoorsdatapy.tools.validation.validators_interface import (
    SLAMInitialRecordingChecker, SLAMUpdateRecordingChecker)


def main():
    args = [(recording_dto, {'required': True}),
            (output_file, {'required': False})]
    parser = custom_parser(args, description="Recording validator")
    parser.add_argument(
        '--type', default='initial', help="Type of checker",
        choices=('initial', 'update', 'simple_update'))
    parser.add_argument(
        "-b", "--bail", help="Stop checker if some check failed",
        action='store_true')

    parsed = parser.parse_args()

    recording = RecordingAccess(parsed.recording_dto)

    if parsed.type in ['initial', 'simple_update']:
        slam_validator = SLAMInitialRecordingChecker(recording, parsed.bail)
    if parsed.type == 'update':
        slam_validator = SLAMUpdateRecordingChecker(recording, parsed.bail)
    valid = slam_validator()

    result = {'check.%s.valid' % parsed.type: valid}
    for key, val in slam_validator.result.items():
        result['check.%s.%s' % (parsed.type, key)] = val

    if parsed.output_file:
        with open(parsed.output_file, 'w') as f:
            json.dump(result, f)
    else:
        stdout.write(json.dumps(result))
        stdout.flush()

    exit(0 if valid else -1)


if __name__ == '__main__':
    main()
