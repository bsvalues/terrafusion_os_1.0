#!/usr/bin/env python
# -*- coding: utf-8 -*-
from indoorssql.model.abstract import ModelSQL


class RecordingSQL(ModelSQL):

    def __call__(self):
        by_recording = 'SELECT * FROM {0} WHERE recording_id = {1}'
        by_identifier = 'SELECT * FROM {0} WHERE id = {1}'
        by_transmitters = """
            SELECT * FROM {0} WHERE id IN (
                SELECT transmitter_id FROM radio_data WHERE recording_id = {1}
            )
        """
        queries = dict(
            recordings=by_identifier,
            accelerations=by_recording,
            context=by_recording,
            global_positions=by_recording,
            gyro_data=by_recording,
            magnetic_data=by_recording,
            metadata=by_recording,
            positions=by_recording,
            pressures=by_recording,
            radio_data=by_recording,
            rotation_data=by_recording,
            steps=by_recording,
            transmitters=by_transmitters,
        )
        return {k: v.format(k, self._id) for k, v in queries.items()}
