#!/usr/bin/env python
# -*- coding: utf-8 -*-

from collections import defaultdict

from indoorsdatapy.common.const.network_type import *

from indoorssql.core.idm.idm_update_core import IDMGen

logger = getLogger(__name__)


class BuildingIDMGen(IDMGen):
    """Generate IDM file using provided service instances."""

    def __init__(self, building_dfs):
        """Construct IDM generator with given building service.

        Args:
            building_dfs (access.building): A building service to load data from.
        """
        super(BuildingIDMGen, self).__init__(building_dfs)

    def results(self, service):
        """Add results from slam service.

        Args:
            service (SlamService): A service with results.
        """
        entities = defaultdict(list)

        entities['device'].append(dict(id=1, name="SLAM DEVICE"))

        # force remove proximity_map=true
        # (see desktop app measurement toolkit- expert mode)
        md = self._dframes['metadata']['name']
        self._dframes['metadata'] = self._dframes['metadata'][
            md != 'proximity_map']

        for tid, transmitter in enumerate(service.networks, 1):
            entities['network'].append(
                dict(
                    id=transmitter.id,
                    building_id=self._dframes['building'].get_value(0, 'id'),
                    bssid=transmitter.bssid,
                    channel=0,
                    name=transmitter.name,
                    networktype=transmitter.type,
                    refreshrate=None,
                ))

            if transmitter.type == IBEACON:
                uuid, major, minor = transmitter.name.split(".")
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

        for lid, fg in enumerate(service.fingerprint_points, 1):
            entities['fingerprintpoint'].append(
                dict(
                    id=fg.id,
                    cluster_id=fg.cluster_id,
                    floor_id=fg.floor_id,
                    x=int(fg.x),
                    y=int(fg.y),
                ))

        for fgp in service.fingerprints:
            entities['fingerprint'].append(
                dict(id=fgp.id,
                     point_id=fgp.point_id,
                     network_id=fgp.network_id))

            stats = fgp.statistic
            entities['statistic'].append(
                dict(
                    id=stats.id,
                    fingerprint_id=fgp.id,
                    amount=stats.amount,
                    mean=stats.mean,
                    variance=stats.variance,
                    device_id=entities['device'][0].get('id'),
                ))

        self._update(entities)
