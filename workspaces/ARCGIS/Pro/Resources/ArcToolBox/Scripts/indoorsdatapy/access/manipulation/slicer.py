#!/usr/bin/env python
# -*- coding: utf-8 -*-
import logging
import sys
from collections.abc import Callable
import pandas as pd

logger = logging.getLogger(__name__)


class SliceAccess(dict):
    """Slice service."""

    def __init__(self, access, start, end, column='t', conditions=None):
        """Construct service instance with associated service.

        Parameters
        ----------
        service : Service
            A service instance to slice.
        start : float
            A minimal value of the column to slice.
        end : float
            A maximal value of the column to slice.
        column : Optional[str]
            A name of column to use for slicing.
        """
        self._access = access
        self._start = start
        self._end = end
        self._column = column
        self._conditions = conditions or [lambda name, df: True]
        self._curr_name = ''

    def _slice_df(self, df):
        """
        Slice from start to end inclusive

        Parameters
        ----------
        df : DataFrame
            DataFrame to slice

        Returns
        -------
        DataFrame
            Sliced DataFrame
        """
        if isinstance(df, pd.DataFrame):
            if self._column in df.columns:
                for condition in self._conditions:
                    if not condition(self._curr_name, df):
                        logging.debug(
                            'Table < %s > is not sliced in purpose' % self._curr_name)
                        return df
                column = getattr(df, self._column)
                df = df[(column >= self._start) & (column <= self._end)]

        return df

    def sliced(self, f):
        """Wrap a function and slice returned data frame.

        Parameters
        ----------
        f : Callable or DataFrame
            A callable instance returning DataFrame or DataFrame

        Returns
        -------
        Callable
            A wrapped callable instance.
        """

        if isinstance(f, pd.DataFrame):
            return self._slice_df(f)

        if isinstance(f, Callable):
            def wrapper(*args, **kwargs):
                return self._slice_df(f(*args, **kwargs))

            return wrapper

        raise NotImplementedError("Unable to slice a {}".format(type(f)))

    def _slice_extra(self, name):
        """Extra which cannot be sliced by pandas """

        if name == 'start':
            return self._start

        if name in ['end', 'created_at']:
            if self._end > self._access['radios'][self._column].max():
                return self._access['radios'][self._column].max()
            else:
                return self._end

        if name in ['id', 'building', 'parent', 'device', 'user_name']:
            return self._access[name]

        logging.warning('Slicing of < %s > not supported' % name)

        return self._access[name]

    def keys(self):
        return self._access.keys()

    def items(self):
        for name in self._access.keys():
            yield name, self.__getitem__(name)

    def __getattr__(self, item):
        return self.sliced(getattr(self._access, item))

    def __getitem__(self, name):
        """Get attribute from service and slice the result.

        Parameters
        ----------
        name : str
            A name of key to slice.

        Returns
        -------
        Callable
            A sliced callable attribute.
        """
        if not isinstance(self._access[name], pd.DataFrame):
            return self._slice_extra(name)
        self._curr_name = name
        return self.sliced(self._access[name])
