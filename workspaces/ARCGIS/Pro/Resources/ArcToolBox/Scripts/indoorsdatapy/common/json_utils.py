#!/usr/bin/env python
# # -*- coding: utf-8 -*-
import gzip
import json
import logging

import pandas as pd

logger = logging.getLogger(__name__)


def pandify(json_dict, tsort=True):
    """Convert plain to dataframes

    :rtype: dict
    :param json_dict: (dict) tables as plain data
    :param tsort: (bool) If true sort result by t column
    :return: dict with tables as DataFrame
    """
    pd_dict = {}
    for k, v in json_dict.items():
        try:
            df = pd.DataFrame(v)
            if tsort and "t" in json_dict[k]:
                df.sort_values(by="t", inplace=True)
            pd_dict[k] = df
        except ValueError:
            pd_dict[k] = v
    return pd_dict


def ditctify(pd_dict):
    """Make dataframes to plain

    :param pd_dict: (dict) dict with tables as DataFrames
    :return (dict): dict with tables as plain data
    """
    json_dict = {}
    for k, v in pd_dict.items():
        if isinstance(v, pd.DataFrame):
            json_dict[k] = v.to_dict()
        else:
            json_dict[k] = v
    return json_dict


def load_json(json_file):
    """Load recording json file

    Handles files with extension can be .json or .json.gz (compressed with gzip)

    :param json_file: (str) filename to read from
    :return (dict): pandified dict from json_file
    """
    logger.debug("Loading json file {}".format(json_file))

    def process(fh):
        return pandify(json.loads(fh.read()))

    try:
        with gzip.open(json_file, 'rb') as f:
            return process(f)
    except OSError:
        with open(json_file, 'r') as f:
            return process(f)


def save_json(pd_dict, json_file, gz):
    """Save recording json file

    :param pd_dict: (dict) dict with tables as DataFrames
    :param json_file: (str) filename to write to
    :param gz: (bool) if true produce .gz output
    """
    json_data = json.dumps(ditctify(pd_dict))
    endgz = json_file.endswith(".json.gz")
    if gz and not endgz:
        json_file += ".gz"
    elif not gz and endgz:
        json_file = json_file[:-3]

    logger.debug("Saving json file {}".format(json_file))

    if gz:
        with gzip.open(json_file, 'wb') as f:
            f.write(json_data.encode('utf-8'))
    else:
        with open(json_file, 'w') as f:
            f.write(json_data)
