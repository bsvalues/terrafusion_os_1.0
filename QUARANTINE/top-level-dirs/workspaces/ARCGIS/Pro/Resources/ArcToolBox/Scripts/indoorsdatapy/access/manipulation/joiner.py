#!/usr/bin/env python
# -*- coding: utf-8 -*-
from logging import getLogger

import pandas as pd

logger = getLogger(__name__)


class JoinAccess(dict):
    """
    This services can join the list of services
    """

    def __init__(self, access, column='t'):
        """

        Parameters
        ----------
        services: list of services
        column: sort option
        """
        self._access = access
        self._column = column
        self._cache = {}

    def _join_dfs(self, dfs):
        """
        Join of given list of pandas dataframe

        Parameters
        ----------
        dfs : DataFrames to join

        Returns
        -------
        DataFrame
            Joined DataFrame
        """
        if self._column in dfs[0].columns:
            return pd.concat(dfs).drop_duplicates(). \
                sort_values(by=self._column). \
                reset_index(drop=True)
        else:
            return pd.concat(dfs).drop_duplicates(). \
                reset_index(drop=True)

    def _get_start(self):
        _min = float("inf")
        for service in self._access:
            if service['start'] < _min:
                _min = service['start']

        return _min

    def _get_end(self):
        _max = -1
        for service in self._access:
            if service['end'] > _max:
                _max = service['end']
        return _max

    def _check_special(self, name):

        if name == 'start':
            return self._get_start()

        if name == 'end':
            return self._get_end()

        if name == 'created_at':
            return self._get_start()

        if not isinstance(self._access[0][name], pd.DataFrame):
            logger.warning(
                "Joining of < %s > is not supported. Used first value: %s" % (
                name, self._access[0][name]))
            return self._access[0][name]

        return None

    def _has_item(self, name):
        counter = 0
        all = 0
        for service in self._access:
            all += 1
            if name not in service:
                counter += 1

        if counter > 0:
            raise NotImplementedError(
                "Not all(counter %s/%s ) services has key: %s" % (
                counter, all, name))

    def keys(self):
        keys = list()
        for serivice in self._access:
            keys += serivice.keys()
        for key in set(keys):
            yield key

    def items(self):
        for key in self.keys():
            yield key, self[key]

    def __setitem__(self, key, val):
        self._cache[key] = val

    def __getitem__(self, name):
        """Get attribute from service and join the result.

        Parameters
        ----------
        name : str
            A name of attribute(pd frame) to join.

        Returns
        -------
        Callable
            A join callable attribute.
        """
        if name in self._cache:
            return self._cache[name]

        self._has_item(name)
        s = self._check_special(name)
        if s is not None:
            self._cache[name] = s
            return s

        self._cache[name] = self._join_dfs(
            [service[name] for service in self._access])
        return self._cache[name]
