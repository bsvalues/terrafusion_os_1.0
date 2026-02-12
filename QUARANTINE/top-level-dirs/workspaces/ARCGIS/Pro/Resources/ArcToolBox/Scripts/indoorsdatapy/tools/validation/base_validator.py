#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Validator
"""
from collections import defaultdict
from functools import reduce

class SelectorException(ValueError):
    """Selector: parameter <accesses> must be initialized at least with list of two Accesses;"""


class Validator(object):
    """Base class for access file validators.
     Each check in list of checks must be function returning true or false

    Parameters
    ----------
    access (Access):
        Access dict (may be recordings)
    checks (dict):
        Dict with key and bool function to apply to _input
    access_other (Access):
        Access dict (may be building)
    bail (bool, optional, default=False):
        if true bail after first failed check

    Attributes
    ----------
    checks (dict):
        see Parameter checks
    bail (bool):
        see Parameter bail
    result (dict):
        Dict with key for each check, and bool value for result of check
    """

    def __init__(self, access, checks, access_other=None, bail=False):
        self._access = access
        self.checks = checks
        self._access_other = access_other
        self.result = {}
        self.bail = bail

    def __call__(self):
        """Execute validator

        sets Attribute result

        Returns:
        bool
            True if checks passed
        """
        self.result = {}
        ret = True
        for check_name, check in self.checks.items():
            check_result = check(self._access, self._access_other) if self._access_other else check(self._access)
            self.result[check_name] = check_result
            if self.bail and not check_result:
                return False
            ret = ret and check_result
        return ret


class Selector(object):
    def __init__(self, accesses, checks):
        """
        Selector allows to check set of accesses. Particular check is defined as function  where
        on input is list of accesses. Check must return set of accesses which should be filtered out (invalid accesses)
        Parameters
        ----------
        accesses (dict):
           where key is id and val is access dict
        checks (list):
            each check must return list. Check can return empty list
            or list of ids accordingly to accesses dict

        Attributes
        ----------
        result (dict):
            key is name of check; value is list of IVALID access


        """

        self._accesses = accesses
        self.checks = checks
        self.result = defaultdict(list)

    def __call__(self):
        """
        Returns (set)
        -------
        set of VALID recordings
        """
        # TODO how to warn user if we use stdout for result
        if len(self._accesses.keys()) == 1:
            return self._accesses.keys()

        for check_name, check in self.checks.items():
            black_list = check(self._accesses)
            self.result[check_name] += black_list if isinstance(black_list,list) else list(black_list)

        return set(self._accesses.keys()) - set(reduce(lambda c, x: c + x, self.result.values(), []))
