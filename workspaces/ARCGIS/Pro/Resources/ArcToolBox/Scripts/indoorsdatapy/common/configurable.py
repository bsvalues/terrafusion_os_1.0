#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Base class for settings enabled classes
"""

import collections
from copy import deepcopy
from logging import getLogger

# Setup the logger
logger = getLogger(__name__)


def dict_update(source, update):
    """
    Parameters
    ----------
    source : dict
        Description
    update : dict
        Description

    Return
    ------
    dict
        Updated dictionary

    Example
    -------
    >>> X={"A":False, "B":{"a":1, "b":2}}
    >>> Y={"B":{"a":3, "c":"banana"}}
    >>> Z=dict_update(X, Y)
    {'A': False, 'B': {'a': 3, 'b': 2, 'c': 'banana'}}
    """

    result = deepcopy(source)
    for key, val in update.items():
        if isinstance(val, collections.Mapping):
            tmp = dict_update(result.get(key, {}), val)
            result[key] = tmp
        elif isinstance(val, list):
            #result[key] = (result[key] + val)
            result[key] = val
        else:
            result[key] = update[key]
    return result


class Configurable(object):
    """
    A Configurable class has a settings dictonary.

    To use this construct your classes as follows

    class MyConfigurable(Configurable):
        __default_settings__ = {
            'setting_name': value
        }
        def __init__(self,  settings=None):
            super(MyConfigurable, self).__init__(settings=settings)

    Now dictionaries can be supplied overriding default settings if set.
    """

    __default_settings__ = {}

    @classmethod
    def merge_settings(cls, default_settings, settings):

        if isinstance(settings, dict):
            if default_settings is None:
                return settings

            merged_settings = {}
            for key, value in default_settings.items():

                if key not in settings:
                    logger.info(
                        "Using default setting {} for {}".format(value, key))

                    merged_settings[key] = value
                else:
                    if isinstance(value, dict):
                        logger.debug("Merging sub-dict {}".format(key))
                        merged_settings[key] = cls.merge_settings(
                            value, settings[key])
                    else:
                        logger.debug(
                            "Using setting {} for {}".format(
                                settings[key], key))
                        merged_settings[key] = settings[key]

            for key in settings:
                if key not in merged_settings:
                    logger.info(
                        "Adding non-default setting {}={}".format(
                            key, settings[key]))
                    merged_settings[key] = settings[key]
        else:
            logger.info("No settings provided, using default settings")
            logger.info("Settings %s" % str(settings))
            merged_settings = dict(default_settings)

        return merged_settings

    def __init__(self, settings=None):
        self.settings = self.merge_settings(
            self.__default_settings__, settings)
