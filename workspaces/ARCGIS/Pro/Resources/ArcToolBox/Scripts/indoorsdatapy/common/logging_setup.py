#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Python logging setup

Provides various logging configurations.

"""
import logging
from logging.config import dictConfig
from os import environ


def dict_config(settings):
    """Make a configuration for loggers.

    :param settings: dictionary provides parameters for configuration
    :return: dictionary with logging configuration
    """
    options = {
        'debug': False,
        'format': "[%(asctime)s] {%(module)s:%(lineno)d} %(levelname)s:  %(message)s",
    }
    options.update(settings)
    level = 'DEBUG' if options['debug'] else 'INFO'

    if 'level' in options:
        level = options['level']

    # log level is overwritten by local env var
    if 'LOG_LEVEL' in environ:
        level = environ['LOG_LEVEL']

    return {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'simple': {
                'datefmt': '%Y-%m-%d %H:%M:%S %Z',
                'format': options['format']
            }
        },
        'root': {
            'handlers': ['console'],
            'propagate': 1,
            'level': 'DEBUG'  # lowest level overridden by handlers
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'simple',
                'level': level
            },
        }
    }


def get_loglevel(verbose, quiet):
    return logging.DEBUG if verbose else logging.WARNING if quiet else logging.INFO


def cli_logger(verbose, quiet):
    """
    For cli modules should be used this fnc for init logger.
    >>> from indoorsdatapy.common.logging_setup import cli_logger
    >>> import logging
    >>> logger = logging.getLogger(__name__)
    >>> cli_logger(verbose,quiet)

    Parameters
    ----------
    verbose: true = DEBUG MODE
    quiet true = WARNING MODE
    Returns
    -------
    setup logger
    """

    logging.config.dictConfig(dict_config(
        {'level': 'DEBUG' if verbose else 'WARNING' if quiet else 'INFO'}))
