from math import log10

import pandas as pd
from indoorssql.core.idm.building_pb2idm import SqlIdmCreator
from indoorssql.model.idm import *


class RayTracerIdmCreator(SqlIdmCreator):

    def __init__(self, db_path, building_pb, result, input_file,
                 transmitters_file):
        super(RayTracerIdmCreator, self).__init__(db_path, building_pb)
        self._input = input_file
        self._result = result
        self._transmitters = transmitters_file

    def add_fingerprint_points(self):
        METER = 1000.
        df = pd.DataFrame.from_csv(self._input, index_col=None)
        networkloc = 0
        for _, row in df.iterrows():
            if int(row.typedev) == 0:
                self.session.add(
                    FingerprintPoint(id=row.i,
                                     floor_id=self.pb.floors[0].id,
                                     x=row.x * METER,
                                     y=row.y * METER))
            if int(row.typedev) == 1:
                self.session.add(
                    NetworkLocation(id=networkloc,
                                    network_id=row.i,
                                    floor_id=self.pb.floors[0].id,
                                    x=row.x * METER,
                                    y=row.y * METER))
                networkloc += 1

    def add_fingerprints(self):
        df = pd.DataFrame.from_csv(self._result, index_col=None)
        for idx, row in df.iterrows():
            fg_id = int(row.i)
            transmitter_id = int(row.j)
            self.session.add(
                Fingerprint(id=idx, point_id=fg_id, network_id=transmitter_id))
            if row.RSSI != 0:
                self._add_statisticX(idx, idx, 10 * log10(row.RSSI))

    def add_networks(self):
        df = pd.DataFrame.from_csv(self._transmitters, index_col=None)
        network_metadata_counter = 0

        for idx, row in df.iterrows():
            self.session.add(
                Network(
                    id=idx,
                    building_id=self.pb.id,
                    channel=0,
                    bssid=idx,
                    name='{}.{}.{}'.format(row.uuid, row.major, row.minor),
                    networktype=5,
                    refreshrate=None,
                ))
            self.session.add(
                NetworkMetadata(id=network_metadata_counter,
                                network_id=row.i,
                                name="ibeacon_uuid",
                                value=row.uuid))
            network_metadata_counter += 1
            self.session.add(
                NetworkMetadata(id=network_metadata_counter,
                                network_id=row.i,
                                name="ibeacon_major",
                                value=row.major))
            network_metadata_counter += 1
            self.session.add(
                NetworkMetadata(id=network_metadata_counter,
                                network_id=row.i,
                                name="ibeacon_minor",
                                value=row.minor))
            network_metadata_counter += 1

    def _add_statisticX(self, fg_id, fingerprint_id, rssi_mean):
        """

        :param fg_id:
        :param fingerprint_id:
        :param rssi_mean:
        :return:
        """
        self.session.add(
            Statistic(
                id=fg_id,
                device_id=0,
                fingerprint_id=fingerprint_id,
                amount=1,
                mean=rssi_mean,
                variance=0,
            ))

        self._add_device(0)
