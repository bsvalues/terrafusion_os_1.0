#!/usr/bin/env python
# -*- coding: utf-8 -*-
from collections.abc import Iterable
from logging import getLogger

import pandas as pd

logger = getLogger(__name__)


def _get_fields(pb, field):
    """
    Get columns of message by field name
    :param pb: 
    :param field: 
    :return: 
    """
    for f in pb.DESCRIPTOR.fields:
        name = getattr(f, 'name')
        if name == field:
            return [col.name for col in getattr(
                getattr(f, 'message_type'), 'fields')]


def pb2dfs(pb_instance, fields=None):
    """
    For pb object construct and return dict of DataFrames
    Parameters
    ----------
    pb_instance: protocol buffer instance with data
    fields: list of fields representing properties of the entity, e.g. radios
    NOTE: protobug cannot distinguish if a numeric field was not set and
    it will just return the default 0, or if it was set to 0 explicitly
    Returns
    -------
    {'name': pd.DataFrame, ...}
    """
    service = {}
    if not fields:
        fields = [getattr(des, 'name') for des in pb_instance.DESCRIPTOR.fields]

    for field in fields:
        collection = getattr(pb_instance, field)
        if isinstance(collection, str):
            service[field] = collection
        elif isinstance(collection, Iterable):
            service[field] = _pb2df(
                collection, _get_fields(pb_instance, field))
        else:
            service[field] = collection

    return service


def _pb2df(collection, cols=None):
    """Construct DataFrame from protobuf collection.

    Parameters
    ----------
    collection : RepeatedCompositeContainer
        A collection of protobuf messages.
    fields : list(str), optional
        A list of fields to include in DataFrame.
    NOTE: protobug cannot distinguish if a numeric field was not set and
    it will just return the default 0, or if it was set to 0 explicitly

    Returns
    -------
    DataFrame
        A data frame containing a row per each protobuf message.
    """

    if not cols:
        if len(collection) == 0:
            raise ValueError('Collection is empty')
        elif not hasattr(collection[0], 'DESCRIPTOR'):
            raise ValueError('Collection is empty')

        cols = [des for des in collection[0].DESCRIPTOR.fields_by_name.keys()]
    return pd.DataFrame.from_records(
        [[getattr(x, f) for f in cols] for x in collection], columns=cols)
