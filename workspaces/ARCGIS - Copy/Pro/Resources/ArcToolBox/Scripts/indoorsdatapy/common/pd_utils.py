#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Utilities to work with pandas dataframes

Attributes
----------
logger : logging
    logging
"""
import logging
from collections import defaultdict

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


def save_df(dataframe, filename, fmt=None):
    """Summary

    Parameters
    ----------
    dataframe : DataFrame
        data to save
    filename : str
        name of file to save
    fmt : str
        File format for table output csv, json or pkl

    Raises
    ------
    ValueError
        Description
    """
    outfmt = filename.split(".")[-1] if fmt is None else fmt
    outfile = filename if fmt in filename else "{}.{}".format(filename, fmt)
    logger.info("Saving {} file {}".format(outfmt, outfile))

    # Save to appropriate format
    if "csv" in outfmt:
        dataframe.to_csv(
            outfile, index=False, header=True, sep=",", encoding='utf-8')
    elif "json" in outfmt:
        dataframe.to_json(outfile)
    elif "pkl" in outfmt:
        dataframe.to_pickle(outfile)
    else:
        raise ValueError("Unkown file format {}".format(fmt))

def df_from_tuplelist(tuplelist, columns):
    """
    Create a valid dataframe, even the tuplelist is empty

    Parameters
    ----------
    tuplelist : list(tuple)
        list of datatuples adhering to columns
    columns : list(str)
        list of columns
    """
    return pd.DataFrame(tuplelist or None, columns=columns)


def df_from_dictlist(dictlist, columns):
    """
    create instance from dictlist
    (list of identical dics, keys matching interface definition)

    Parameters
    ----------
    dictlist : list(dict)
        list of dicts adhering to columns
    columns : list(str)
        list of columns
    """
    return pd.DataFrame.from_dict(dictlist)[columns]

def slice_df(df, cmin, cmax, colname):
    """
    Filter data range to rows where values of column is in [cmin,cmax]

    Parameters
    ----------
    df : DataFrame
        dataframe a to slice
    cmin : float
        min column range
    cmax : float
        max column range
    colname : str
        column name to use

    Return
    ------
    * trimmed subset of df
    """
    col = df[colname].values
    return df[(col >= cmin) & (col <= cmax)]


def trim_df(dfa, dfb, colname):
    """
    Use range of column in dataframe b to trime dataframe a

    Parameters
    ----------
    dfa : DataFrame
        dataframe a
    dfb : DataFrame
        dataframe b
    colname : str
        column to trime by

    Return
    ------
    * trimmed subset of df
    """
    acol = dfa[colname].values
    bmin, bmax = range_df(dfb, colname)
    return dfa[(acol >= bmin) & (acol <= bmax)]


def range_df(df, colname):
    """
    Get min and max of column in dataframe

    Parameters
    ----------
    df : DataFrame or list(DataFrame)
        Data frame to get range for
    colname : str
        column name to use

    Return
    ------
    min, max range of column inb dataframe
    """
    d = pd.concat(df) if isinstance(df, list) else df
    v = d[colname].values
    return np.min(v), np.max(v)


def segment_index(df, key_col):
    """
    Segment dataframe in sections of repeated keys
    and return list with segment start and end indices

    Example
    >>> dat=[1, 1, 1, 2, 2, 3, 2, 2]
    >>> cols=["x"]
    >>> df = df_from_tuplelist(dat, cols)
    >>> segment_index(df, key_col="x")
    [(1, 0, 2), (2, 3, 4), (3, 5, 5), (2, 6, 7)]

    Parameters
    ----------
    df : DataFrame
        data frame to segment
    key_col : TYPE
        name of column id df with segmentation keys

    Return
    ------
    list with key, start and end of each segment
    [(key, start, end), ...]
    """
    col = df[key_col]
    idx = df[col.diff() != 0].index
    segs = list(zip(col.values[idx[:-1]], idx[:-1], idx[1:] - 1))
    segs += (col.values[-1], idx[-1], df.index[-1]),
    return segs


def segment_column(df, val_col, isegments):
    """
    Segment dataframe in sections of
    repeated keys and make dict with segment start ends for each column value

    Example
    >>> dat=[(1, 1), (2, 1), (3, 1), (4, 2), (5, 2), (6, 3), (7, 2), (8, 2)]
    >>> cols=["x","y"]
    >>> df = df_from_tuplelist(dat, cols)
    >>> isegments = segment_index(df, "y")
    >>> segment_column(df, "x", isegments)
    {1:[(1, 3)], 2:[(4, 5), (7, 8)], 3:[(6, 6)]}

    Parameters
    ----------
    df : DataFrame
        data frame to segment
    val_col : str
        name of column in df with segment values
    isegments : list
        list with key, start and end of each segment
        as produced by segment_index [(key, start, end), ...]

    Returns
    -------
    dict with segment start ends for each column value
    colvalue
        [(start,end), ...]
    """
    val_col = df[val_col]
    csegments = defaultdict(list)
    for val, start, end in isegments:
        csegments[val].append((val_col[start], val_col[end]))
    return csegments


def segment_df(df, val_col, csegments, margin=0):
    """
    Segment dataframe by column

    >>> dat=[(1, 1), (2, 1), (3, 1), (4, 2), (5, 2), (6, 3), (7, 2), (8, 2)]
    >>> cols=["x","y"]
    >>> df = df_from_tuplelist(dat, cols)
    >>> isegments = segment_index(df, "y")
    >>> csegments = segment_column(df, "x", isegments)
    >>> dfsegments = segment_df(df, "x", csegments)
    {1:[df[0:3]], 2:[df[3:5], df[6:-1]], 3:[df[5:6]]}

    Parameters
    ----------
    df : DataFrame
        data frame to segment
    val_col : string
        name of column in df with segment values
    csegments : Segnemt list
        Description
    margin : int, optional
        extra room in val around segment to include
        default=0

    Return
    ------
    * dict by col value with list of segments from df
    """
    df_segments = defaultdict(list)
    for key, segs in csegments.items():
        for s in segs:
            df_segments[key].append(
                slice_df(df, s[0] - margin, s[1] + margin, val_col))
    return df_segments
