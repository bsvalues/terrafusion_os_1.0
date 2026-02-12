from logging import getLogger

from indoorsdatapy.access.base import AccessBase
from indoorsdatapy.access.utilities import (positions_by_level, positions_with_type,
                                            get_metadata)
from indoorsprotocol.replays_pb2 import Replay

logger = getLogger(__name__)


class ReplayAccess(AccessBase):
    def __init__(self, f=None, fields=None):
        super(ReplayAccess, self).__init__(Replay, f, fields, False)

    def positions_by_level(self, level=None, position_type=None):
        return positions_by_level(self['positions'], level, position_type)

    def positions_with_type(self, kind, time='t'):
        return positions_with_type(self['positions'], kind, time)

    def get_metadata_value(self, key):
        return get_metadata(self['meta'], key)
