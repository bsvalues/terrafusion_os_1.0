import json
from collections import defaultdict

import pandas as pd
from google.protobuf.json_format import MessageToJson


def json2dfs(pb, fields):
    js = json.loads(MessageToJson(pb, preserving_proto_field_name=True))

    # create columns
    if not fields:
        fields = js.keys()
    access = defaultdict(list)

    # convert json to dfs
    for table in fields:
        val = js[table]
        if not isinstance(val, dict) and not isinstance(val, list):
            access[table] = val
            continue
        if isinstance(val, list):
            _record2df(val, table, access)

    # concat results
    for prop_name, vals in access.items():
        if isinstance(vals, list):
            if len(vals) > 0:
                if isinstance(vals[0], pd.DataFrame):
                    access[prop_name] = pd.concat(vals, ignore_index=True)
                    continue
                else:
                    access[prop_name] = \
                        pd.DataFrame(vals, columns=[prop_name.split('.')[-1]])
    return access


def _record2df(records, table, res):
    for idx, record in enumerate(records):
        if not isinstance(record, dict) and not isinstance(record, list):
            res[table].append(record)
            continue
        else:
            for key, val in record.items():
                if isinstance(val, list):
                    df = pd.io.json.json_normalize(record, key)
                    df['key'] = idx
                    res['%s.%s' % (table, key)].append(df)
                    continue
                elif not isinstance(val, dict):
                    res['%s.%s' % (table, key)].append(val)

    return res
