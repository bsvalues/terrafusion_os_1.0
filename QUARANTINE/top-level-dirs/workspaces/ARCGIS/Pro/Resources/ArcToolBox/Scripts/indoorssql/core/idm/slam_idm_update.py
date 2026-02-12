# !/usr/bin/env python
# -*- coding: utf-8 -*-
"""
usage: idm_gen [-h] -k API_KEY -o OUTPUT [-a API_URL] slam_dto

Create IDM file from slam data transfer object.

positional arguments:
  slam_dto              slam data transfer object

optional arguments:
  -h, --help            show this help message and exit
  -k API_KEY, --api_key API_KEY
                        api key for accessing building data
  -o OUTPUT, --output OUTPUT
                        IDM output file
  -a API_URL, --api_url API_URL
"""
# logging

import os
from collections import defaultdict
from logging import getLogger

import pandas as pd
from indoorsdatapy.common.const.network_type import IBEACON, WLAN
from indoorssql.core.idm.idm_update_core import IDMGen

logger = getLogger(__name__)


class SlamIDMGen(IDMGen):
    """Generate IDM file using provided service instances."""

    def __init__(self, slam_dfs):
        """Construct IDM generator with given building service.

        Args:
            building_dfs (access.building): A building service to load data from.
        """
        super(SlamIDMGen, self).__init__(slam_dfs)

    def results(self, service):
        """Add results from slam service.

        Args:
            service (SlamService): A service with results.
        """

        entities = defaultdict(list)

        entities['device'].append(dict(id=1, name="SLAM DEVICE"))
        # force remove proximity_map=true (see desktop app
        # measurement toolkit- expert mode)
        md = self._dframes['metadata']['name']
        self._dframes['metadata'] = self._dframes['metadata'][
            md != 'proximity_map']
        metadata_id_max = self._dframes['metadata']['id'].max()
        pd_jobid = pd.DataFrame([
            dict(id=metadata_id_max + 1,
                 building_id=self._dframes['building'].at[0, 'id'],
                 name='slam_jobid',
                 value=str(os.environ.get("JOBID", -1)))
        ])
        self._dframes['metadata'] = pd.concat(
            [self._dframes['metadata'], pd_jobid],
            ignore_index=True,
            sort=False)

        for tid, transmitter in enumerate(service.transmitters, 1):
            if transmitter.type == WLAN:
                bssid = transmitter.bssid
            else:
                bssid = len(entities['network']) + 1

            entities['network'].append(
                dict(
                    id=tid,
                    building_id=self._dframes['building'].at[0, 'id'],
                    bssid=bssid,
                    channel=0,
                    name=transmitter.ssid,
                    networktype=transmitter.type,
                    refreshrate=None,
                ))

            if transmitter.type == IBEACON:
                uuid, major, minor = transmitter.ssid.split(".")
                entities['networkmetadata'].append(
                    dict(id=len(entities['networkmetadata']),
                         network_id=tid,
                         name="ibeacon_uuid",
                         value=uuid))
                entities['networkmetadata'].append(
                    dict(id=len(entities['networkmetadata']),
                         network_id=tid,
                         name="ibeacon_major",
                         value=major))
                entities['networkmetadata'].append(
                    dict(id=len(entities['networkmetadata']),
                         network_id=tid,
                         name="ibeacon_minor",
                         value=minor))

            if transmitter.type == WLAN:
                entities['networkmetadata'].append(
                    dict(id=len(entities['networkmetadata']),
                         network_id=tid,
                         name="wlan_ssid",
                         value=transmitter.ssid))

        floor_mapping = \
            dict([(v.level, v.id)
                  for i, v in
                  self._dframes['floor'][['id', 'level']].iterrows()])

        for lid, location in enumerate(service.locations, 1):
            entities['fingerprintpoint'].append(
                dict(
                    id=lid,
                    cluster_id=None,
                    floor_id=floor_mapping[location.position.floor],
                    x=int(location.position.x * 1e3),
                    y=int(location.position.y * 1e3),
                ))

            for estimate in location.estimates:
                eid = len(entities['fingerprint']) + 1
                entities['fingerprint'].append(
                    dict(
                        id=eid,
                        point_id=lid,
                        network_id=estimate.transmitter + 1,
                    ))
                entities['statistic'].append(
                    dict(
                        id=eid,
                        fingerprint_id=eid,
                        amount=estimate.weight,
                        mean=estimate.mean,
                        variance=estimate.var,
                        device_id=entities['device'][0].get('id'),
                    ))

        self._update(entities)
