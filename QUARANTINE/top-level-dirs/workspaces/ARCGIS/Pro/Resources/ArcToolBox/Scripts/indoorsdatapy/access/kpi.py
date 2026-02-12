from logging import getLogger

import numpy as np
from indoorsdatapy.access.base import AccessBase
from indoorsdatapy.access.utilities import (residual_per_floor_recording,
                                            residuals, residuals_per_floor, get_metadata,
                                            residual_per_recording)
from indoorsprotocol.kpis_pb2 import Kpi

logger = getLogger(__name__)


class KpiAccess(AccessBase):
    def __init__(self, f, fields=None):
        super(KpiAccess, self).__init__(Kpi, f, fields, True)

    def get_metadata_value(self, key):
        return get_metadata(self['meta'], key)

    def residuals(self):
        return residuals(self['residuals.residual'],
                         self['residuals.recording'])

    def residual_per_floor_recording(self):
        return residual_per_floor_recording(
            self['residuals.residual'], self['residuals.recording'])

    def residual_per_recording(self):
        return residual_per_recording(
            self['residuals.residual'], self['residuals.recording'])

    def residuals_per_floor(self):
        return residuals_per_floor(
            self['residuals.residual'])

    @staticmethod
    def serialize_kpi(building,
                      recordings,
                      recordings_residuals,
                      floor_statistics,
                      recording_statistics,
                      building_statistics,
                      ref_positions,
                      obs_positions,
                      metadata=None):
        pb = Kpi()
        pb.building = building
        pb.recordings.extend(map(int, recordings))
        pb.ref_positions = ref_positions
        pb.obs_positions = obs_positions

        optional_attrs = {
            'obs_sdk_accuracy': float, 'obs_sdk_accuracy_res': float,
            'obs_sdk_accuracy_hit': int, 'vel_res': float,
            'angle_res': float, 'one_mark': float, 'offset_ref_res': float,
            'offset_obs_res': float, 'mean_x': float,
            'mean_y': float, 'd_floor_abs': int, 'position_switch': int,
            'orientation_res': float
        }
        warnings = []
        for recording_id, res in recordings_residuals.items():
            floor_res = pb.residuals.add()
            floor_res.recording = int(recording_id)
            for i, row in res.iterrows():
                res = floor_res.residual.add()
                res.obs_x = row['obs_x']
                res.obs_y = row['obs_y']
                res.ref_x = row['ref_x']
                res.ref_y = row['ref_y']
                res.cpoa_x = row['cpoa_x']
                res.cpoa_y = row['cpoa_y']
                res.obs_floor = int(row['obs_floor'])
                res.ref_floor = int(row['ref_floor'])

                res.d_ref = row['d_ref']
                res.d_floor = row['d_floor']
                res.t = row['t']
                res.t_res = row['t_res']
                res.d_cpoa = row['d_cpoa']

                # add all optional attributes
                for attr, fnc in optional_attrs.items():
                    if attr in row:
                        val = getattr(row, attr)
                        if not np.isnan(val):
                            setattr(res, attr, fnc(val))
                    else:
                        if attr not in warnings:
                            warnings.append(attr)
                            logger.warning("KPI: Optional attribute < %s > "
                                           "is not in in dataframe" % attr)

        # adding statistics per floor_id
        for floor, res in floor_statistics.items():
            floor_stat = pb.floor_statistics.add()
            floor_stat.floor = int(floor)
            for res_attr, records in res.items():
                stats = floor_stat.statistics
                for stat_attr, value in records.items():
                    setattr(getattr(stats, res_attr), stat_attr, value)

        # adding statistics per recording_id
        for recording_id, res in recording_statistics.items():
            rec_stat = pb.recording_statistics.add()
            rec_stat.recording = int(recording_id)
            for res_attr, records in res.items():
                stats = rec_stat.statistics
                for stat_attr, value in records.items():
                    setattr(getattr(stats, res_attr), stat_attr, value)

        # adding statistics for building
        b_stat = pb.building_statistics
        for res_attr, records in building_statistics.items():
            for stat_attr, value in records.items():
                setattr(getattr(b_stat, res_attr), stat_attr, value)

        if metadata:
            for name, value in metadata.items():
                meta = pb.meta.add()
                meta.name, meta.value = str(name), str(value)

        return pb
