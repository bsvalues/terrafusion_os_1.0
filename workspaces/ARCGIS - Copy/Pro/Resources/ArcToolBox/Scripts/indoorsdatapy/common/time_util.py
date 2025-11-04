#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Timing related utilities
"""

import datetime
import logging
from functools import wraps
from timeit import default_timer

logger = logging.getLogger(__name__)


def timed(method):
    """
    Decorator for timing function calls

    >>> @timed
    >>> def do_stuff():
    >>>    print("Something")

    Will print "name done in NNs"

    """
    
    @wraps(method)
    def wrapper(*args, **kw):
        start = default_timer()
        result = method(*args, **kw)
        end = default_timer()
        delta = end - start
        logger.debug('Timer: {} done in {:.2f}s'
                     .format(method.__name__, delta))
        return result
    
    return wrapper


class TimeContext(object):
    """
    Time with context

    >>> with TimeContext("Stuff") as t:
    >>>    print("Something")
    
    Will print "name done in NNs"
    t.delta will have the number of seconds
    t.start will have time at start
    t.end will have the time at end

    """
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        self.start = default_timer()
        return self

    def __exit__(self, *args):
        self.end = default_timer()
        self.delta = self.end - self.start
        logger.debug(self)

    def __str__(self):
        return 'Timer: {} done in {:.2f}s'.format(self.name, self.delta)

def get_datetype_format(time_string, format="%Y-%m-%dT%H:%M:%S.%fZ"):
    return datetime.datetime.strptime(time_string, format)

def convert_date(date_time):
    return (date_time - datetime.datetime(1970, 1, 1)).total_seconds()