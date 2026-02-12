import re

import pandas as pd

uuid4hex = re.compile(
    '^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$', re.I)
OPERATORS = ('!=', '==')
FILTERS = ('type', 'ssid', 'minor', 'major', 'uuid', 'bssid')


def transmitter_filter(rules_frame, radio_frame):
    """

    Parameters
    ----------
    rules_frame:
        cols:   operator filter param
        rows:   =! type 0
                == type 5
                == ssid ciscodisco
                == minor 391
                =! major 33-96
                == uuid A1826DA6-4FA2-4E98-8024-BC5B71E0893E
                rules frame supports multiple selection(in, not in)
                e.g.
                == ssid ciscodisco,ciscp,indoors,

                where list is represented as parameters separated by comma
                 (white spacesare not supported)

    radio_frame:
        pandas frame represented by type and ssid
        where:
            ssid: free string (can be beacon uuid)
            type:  integer according to 
            definition of radio type(see pb definition)

    Returns
    -------
    filtered radio_frame
    """
    # print rules_frame
    get_minor = lambda x: int(x.split('.')[2])
    get_major = lambda x: int(x.split('.')[1])

    def get_uuid(x):
        x = str(x).split('.')
        if len(x) == 3:
            return x[0]
        else:
            return 0

    for idx, row in rules_frame.iterrows():
        operator_bool = False if '!' in row['operator'] else True
        fnc = get_uuid
        if row['filter'] in ('minor', 'major'):
            subject = row['param'].split('-')
            fnc = get_major if row['filter'] == 'major' else get_minor
            if len(subject) == 2:
                radio_frame = eval(
                    "radio_frame[(radio_frame['ssid'].apply(fnc) %s int(subject[0])) %s "
                    "(radio_frame['ssid'].apply(fnc) %s int(subject[1]))]" % (
                        '>' if row['operator'] == '==' else '<',
                        '&' if row['operator'] == '==' else '|',
                        '<' if row['operator'] == '==' else '>'))
            else:
                param = map(lambda x: int(x), row['param'].split(','))
                radio_frame = \
                    radio_frame[radio_frame['ssid'].apply(
                        fnc).isin(param) == operator_bool]
            continue

        if row['filter'] in ('uuid'):
            param = map(lambda x: "%s" % x, row['param'].split(','))
            radio_frame = radio_frame[radio_frame['ssid'].apply(
                get_uuid).isin(param) == operator_bool]
        elif row['filter'] in ('ssid'):
            param = map(lambda x: x, row['param'].split(','))
            radio_frame = radio_frame[radio_frame[row['filter']].isin(param) == operator_bool]
        elif row['filter'] in ('type', 'ssid'):
            param = map(lambda x: int(x), row['param'].split(','))
            radio_frame = radio_frame[radio_frame[row['filter']].isin(
                param) == operator_bool]

    return radio_frame


def parse_rule_file(rules_file):
    """

    Parameters
    ----------
    rules_file: open txt file
        e.g.
        # list filter param
            =! type 0
            == type 5
            == ssid ciscodisco
            == minor 391
            =! major 33-96
            == uuid A1826DA6-4FA2-4E98-8024-BC5B71E0893E

    Returns
    -------
    pandas frame in analogy to input file
    """
    parser_info = []
    rows = []

    for line_counter, line in enumerate(rules_file.readlines(), 1):
        if not line.strip().startswith("#"):
            row = line.split()
            if row[0] not in OPERATORS:
                parser_info.append(
                    'Invalid operator: line %s, %s' % (line_counter, row[0]))
            if row[1] not in FILTERS:
                parser_info.append(
                    'Invalid type: line %s, %s' % (line_counter, row[1]))
            if len(row) != 3:
                parser_info.append(
                    'Invalid number of columns: line %s' % line_counter)
            rows.append(
                {'operator': row[0], 'filter': row[1], 'param': row[2]})

    if parser_info:
        raise ValueError('Parsing file error: %s' % parser_info)

    return pd.DataFrame(rows)[['operator', 'filter', 'param']]
