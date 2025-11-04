#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""

(c) indoo.rs GmbH


example of input rule file

#list filter param
                != type 0
                == type 5
                == ssid ciscodisco
                == minor 391
                != major 33-96
                == uuid A1826DA6-4FA2-4E98-8024-BC5B71E0893E
                rules frame supports multiple selection(in, not in)
                e.g.
                == ssid ciscodisco,ciscp,indoors,
example of input settings
json
{
    [{operator:!=,filter=ssid,param=11212}
    ...
    ...
    ]
}
example of running module
python radio_filter.py -i  test -R /home/matej/.indoors_cache/prod/recordings/10248.pb -o out.pb

"""

import json
import os
from logging import getLogger

import pandas as pd
from indoorsdatapy.access.factory.pb2df import pb2dfs
from indoorsdatapy.access.factory.utils import save, load_pb
from indoorsdatapy.access.manipulation.update import update_pb
from indoorsdatapy.common.cli import (input_file, recording_dto, custom_parser, building_dto,
                                      output_prefix, output_file, settings)
from indoorsdatapy.common.logging_setup import cli_logger
from indoorsdatapy.tools.transmitter_filter_core import parse_rule_file, transmitter_filter
from indoorsprotocol.buildings_pb2 import Building
from indoorsprotocol.recordings_pb2 import Recording

logger = getLogger(__name__)


def main():
    args = [(recording_dto, {'required': False}),
            (building_dto, {'required': False}),
            (output_prefix, {'required': False}),
            (output_file, {'required': False}),
            (settings, {'required': False, 'help': "[{operator:!=,type=ssid,param='11212'}]"}),
            (input_file, {'required': False, 'help': 'Rule file'}),
            ]

    parser = custom_parser(args,
                           description="{} - Custom query of radio filter ".format(__name__))
    parsed = parser.parse_args()
    cli_logger(parsed.verbose, parsed.quiet)

    if parsed.input_file:
        with open(parsed.input_file, 'r') as rule_file:
            rule_frame = parse_rule_file(rule_file)
    else:
        rule_frame = pd.DataFrame.from_records(json.loads(parsed.settings))

        if set(rule_frame.columns.values.tolist()) != {'param', 'operator', 'filter'}:
            raise AttributeError('Input rule json is not vaild.')

    logger.info("\nParsed rules:\n%s" % rule_frame.to_csv(sep=' ', index=False))

    if parsed.recording_dto:
        dto = parsed.recording_dto
        pb_object = Recording
        field = 'radios'

    if parsed.building_dto:
        dto = parsed.building_dto
        pb_object = Building
        field = 'networks'

    logger.info('Processing %s' % dto)

    if parsed.output_file:
        out_file = parsed.output_file
    else:
        out_file = os.path.join(
            parsed.output_dir,
            parsed.output_prefix + os.path.basename(
                dto) if parsed.output_prefix else os.path.basename(dto))

    with open(dto, 'rb') as pb:
        logger.info('Opening %s'%dto)
        protoobject = load_pb(pb_object, pb)
        access = pb2dfs(protoobject, [field])

    if parsed.building_dto:
        access['networks'] = access['networks'].rename(columns=dict(name='ssid'))

    if not os.path.exists(out_file) or parsed.overwrite:
        with open(out_file, 'wb') as out:
            logger.info('Saving result to %s' % out_file)
            if parsed.building_dto:
                result = transmitter_filter(rule_frame, access[field]).rename(
                    columns=dict(ssid='name'))
            else:
                result = transmitter_filter(rule_frame, access[field])
            logger.info('Filtered  %s of %s' % (len(access[field].index)-len(result.index),len(access[field].index)))
            save(update_pb({field: result}, protoobject), out)

    else:
        logger.warning(
            'File %s already exists. Use flag --overwrite to force it' % out_file)


if __name__ == '__main__':
    main()
