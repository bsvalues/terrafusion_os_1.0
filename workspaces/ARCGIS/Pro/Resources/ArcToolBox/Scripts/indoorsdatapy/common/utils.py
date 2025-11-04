# -*- coding: utf-8 -*-

import json
from copy import deepcopy
from logging import getLogger

# Scientific python
import pandas as pd
from indoorsdatapy.common.configurable import dict_update

# Setup the logger
logger = getLogger(__name__)
import subprocess
import os
import signal


def full_traceback(func):
    """
    Decorator - wrapper for printing traceback when using multiprocessing lib
    :param func:
    :return:
    """
    import traceback, functools
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            msg = "{}\n\nOriginal {}".format(e, traceback.format_exc())
            raise type(e)(msg)

    return wrapper


class GracefulKiller:
    kill_now = False

    def __init__(self):
        signal.signal(signal.SIGINT, self.exit_gracefully)
        signal.signal(signal.SIGTERM, self.exit_gracefully)

    def exit_gracefully(self, signum, frame):
        self.kill_now = True


def floats_areclose(a, b, rel_tol=1e-09, abs_tol=0.0):
    """
    Propper way of float comparison in python 2.7
    in 3.5 https://docs.python.org/3/whatsnew/3.5.html#pep-485-a-
            function-for-testing-approximate-equality
    :param a: float
    :param b: float
    :param rel_tol: float 
    :param abs_tol: float
    :return: bool
     if floats are close return True
    """
    return abs(a - b) <= max(rel_tol * max(abs(a), abs(b)), abs_tol)


def get_filename(path):
    base = os.path.basename(path)
    return os.path.splitext(base)[0]


def pandas_dataframe(data_list, columns):
    """
    returns a valid dataframe, even the data_list is empty
    """
    if data_list is None or len(data_list) == 0:
        logger.debug("Empty data frame with columns {}".format(columns))
        return pd.DataFrame(columns=columns)
    return pd.DataFrame(data_list, columns=columns)


def exec_cmd(cmd):
    """
    Helper for executing unix commands
    Parameters
    ----------
    cmd list which containing command in array e.g. ["git","status"]

    Returns stdout
    -------

    """
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    return p.communicate()[0]


def build_path(dir=None, name=None, prefix=None, file_path=None, extension=''):
    def replace_extension(path):
        split_ext = os.path.splitext(path)

        return split_ext[0] + extension

    if file_path and prefix and not dir:
        head, tail = os.path.split(file_path)
        path = os.path.join(head, str(prefix) + tail)
        return replace_extension(os.path.splitext(path))

    if file_path and dir:
        head, tail = os.path.split(file_path)
        return os.path.join(dir, str(prefix) + tail if prefix else tail)

    if dir:
        path = os.path.join(dir, str(prefix) + name if prefix else name)
        return replace_extension(path)

    return file_path


def get_settings(parsed, default):
    setting = deepcopy(default)
    if parsed:
        setting = dict_update(setting, json.loads(str(parsed)))

    logger.info("Settings %s" % setting)
    return setting


def memory_usage(m=None):
    import psutil

    p = psutil.Process(os.getpid())
    vals = p.memory_info()
    mp = p.memory_percent()
    return "%s cur_mem-> %.2f (MB), per_mem-> %.2f" % (m, vals.rss / 1000000.0, mp)
