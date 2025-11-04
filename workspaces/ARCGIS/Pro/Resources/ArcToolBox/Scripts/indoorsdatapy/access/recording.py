from logging import getLogger

from indoorsdatapy.access.base import AccessBase
from indoorsdatapy.access.utilities import *
from indoorsprotocol.recordings_pb2 import Recording

logger = getLogger(__name__)


class RecordingAccess(AccessBase):
    def __init__(self, f=None, fields=None):
        super(RecordingAccess, self).__init__(Recording, f, fields, False)

    def positions_by_level(self, level=None, position_type=None):
        return positions_by_level(self['positions'], level,
                                  position_type)

    def radio(self, time='t'):
        return radio(self['radios'], time)

    def radio_with_type(self, radio_type, time='t', ):
        rd = radio(self['radios'], time)
        return rd[rd['type'] == radio_type]

    def transmitters_with_unique_ids(self):
        return transmitters_ids(transmitters(self['radio']))

    def transmitters_ids(self):
        return transmitters_ids(self['radios'])

    def transmitters(self):
        return transmitters(self['radios'])

    def transmitters_with_index(self):
        return transmitters_frame(self['radio'])

    def positions_with_type(self, kind, time='t'):
        return positions_with_type(self['positions'], kind, time)

    def get_metadata_value(self, key):
        return get_metadata(self['meta'], key)

    def map_metadata(self):
        return map_metadata(self['meta'])

    def info(self):
        """Get recording information dictionary."""
        info = {}
        info.update(dict(
            n_accelerations=len(self['accelerations'].index),
            n_contexts=len(self['contexts']),
            n_global_positions=len(self['global_positions'].index),
            n_magnetic_data=len(self['magnetics'].index),
            n_pressures=len(self['pressures'].index),
            n_gyro_data=len(self['gyros'].index),
            n_radio_data=len(self['radios'].index),
            n_rotation_data=len(self['rotations'].index),
            n_steps=len(self['steps'].index),
            n_ground_truth=len(self.positions_with_type(1).index),
            n_knn_position=len(self.positions_with_type(0).index),
            n_final_position=len(self.positions_with_type(2).index),
            duration=None,
            metadata=[{md.name: md.value} for idx, md in self['meta'].iterrows()]
        ))

        if self['end'] and self['start']:
            info["duration"] = self['end'] - self['start']

        return info


def iterate_recordings(dtos, fields=None, yield_id=False):
    for dto in dtos:
        logger.info("Loading recording %s" % dto)
        if yield_id:
            yield dto, RecordingAccess(dto, fields)
        else:
            yield RecordingAccess(dto, fields)
