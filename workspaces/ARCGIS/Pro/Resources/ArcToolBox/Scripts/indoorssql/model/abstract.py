#!/usr/bin/env python
# -*- coding: utf-8 -*-
import sys
from abc import ABCMeta, abstractmethod
from datetime import datetime
from datetime import timedelta

from sqlalchemy import (
    Integer,
    TypeDecorator,
)


class ModelSQL(object, metaclass=ABCMeta):

    def __init__(self, identifier):
        self._id = identifier

    @property
    def identifier(self):
        return self._id

    @abstractmethod
    def __call__(self):
        """Generate dictionary of SQL queries."""
        pass


class SQLiteDateTimeType(TypeDecorator):
    impl = Integer
    epoch = datetime(1970, 1, 1, 0, 0, 0)

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, datetime):
            return (value - self.epoch).total_seconds() * 1000
        else:
            return (value / 1000 - self.epoch).total_seconds() * 1000

    def process_result_value(self, value, dialect):
        return self.epoch + timedelta(seconds=value / 1000)
