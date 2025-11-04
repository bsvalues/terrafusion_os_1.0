# -*- coding: utf-8 -*-

import re
from collections.abc import Iterable
from logging import getLogger

# TODO fix encoding problem with \xfc
from google.protobuf.descriptor import FieldDescriptor
from pandas import DataFrame

logger = getLogger(__name__)

TYPES = dict(
    TYPE_DOUBLE=1,
    TYPE_FLOAT=2,
    TYPE_INT64=3,
    TYPE_UINT64=4,
    TYPE_INT32=5,
    TYPE_FIXED64=6,
    TYPE_FIXED32=7,
    TYPE_BOOL=8,
    TYPE_STRING=9,
    TYPE_GROUP=10,
    TYPE_MESSAGE=11,
    TYPE_BYTES=12,
    TYPE_UINT32=13,
    TYPE_ENUM=14,
    TYPE_SFIXED32=15,
    TYPE_SFIXED64=16,
    TYPE_SINT32=17,
    TYPE_SINT64=18,
    MAX_TYPE=18)

CAST = {
    TYPES["TYPE_DOUBLE"]: float,
    TYPES["TYPE_FLOAT"]: float,
    TYPES["TYPE_INT64"]: int,
    TYPES["TYPE_UINT64"]: int,
    TYPES["TYPE_INT32"]: int,
    TYPES["TYPE_FIXED64"]: int,
    TYPES["TYPE_ENUM"]: int,
    TYPES["TYPE_STRING"]: lambda x: filter_ascii(x)
    #
}


def filter_ascii(val):
    try:
        return str(re.sub(r'[^\x00-\x7F]+', '?', val))
    except TypeError or UnicodeEncodeError:
        return str(val)


def dfs2pb(dfs, pb_instance):
    """
    Convert dict of panda dataframes into protocol buffer object
    Parameters
    ----------
    dfs -  dict of frames where key is related to the protocol buffer attribute
    pb_instance  - open pb object

    Returns
    -------
    protocol buffer object filled by data from frames
    """
    for _property, df in dfs.items():

        # DataFrame
        if hasattr(pb_instance, _property):
            if isinstance(getattr(pb_instance, _property), str):
                continue
            if isinstance(getattr(pb_instance, _property), Iterable):
                del getattr(pb_instance, _property)[:]
        if isinstance(df, DataFrame):
            _df2pb(df, _property, pb_instance)
        else:
            # single value, e.g. number
            _add_row(pb_instance, _property, df, None)

    return pb_instance


def _df2pb(df, _property, pb_object):
    """
    Add data from DataFrame to protobuffer object
    Parameters
    ----------
    df - pandas data frame
    _property -  string related to the protocol buffer attribute which should be filled
    pb_object - initialized protocol buffer object which should be filled

    Returns
    -------
    None (pb_object is filled by data)
    """
    headers = list(df.columns.values)
    for row in df.iterrows():
        _add_row(pb_object, _property, row, headers)


def _add_row(pb_object, field, row, columns):
    """
    Convert row from pd.DataFrame to pb collection
    Parameters
    ----------
    pb_object - protocol buffer object
    field
    row
    columns

    Returns
    -------

    """

    def cast(descriptor, value):
        if value == "nan":
            return {
                # steps
                "length": 0,
                "length_error": -1
                # ...
            }.get(descriptor.name, CAST[descriptor.type](0))
        return CAST[descriptor.type](value)

    # multiple columns
    if columns:
        entity = getattr(pb_object, field).add()
        for header in columns:
            descriptor = entity.DESCRIPTOR.fields_by_name[header]
            # cannot be an empty array
            value = row[1][header] if row[1][header] else 'nan'

            if isinstance(value, str):
                v = str(value).lower()
                if v == 'nan':
                    value = v

            if value != 'nan' or descriptor.label == FieldDescriptor.LABEL_REQUIRED:
                vl = cast(descriptor, value)
                setattr(entity, header, vl)

    else:
        # single value
        descriptor = pb_object.DESCRIPTOR.fields_by_name[field]
        setattr(pb_object, field, cast(descriptor, row))
