from logging import getLogger
from numbers import Number

import numpy as np
import pandas as pd
from indoorsdatapy.common.time_util import timed
from indoorsprotocol.buildings_pb2 import (
    Building,
    ZoneType,
    FingerprintSeries,
)
from indoorsprotocol.recordings_pb2 import Recording
from indoorssql.core.df_sql_util import sql2df
from indoorssql.model.recording import RecordingSQL
from sqlalchemy import create_engine
from sqlalchemy.sql import text

logger = getLogger(__name__)


class ExportError(Exception):

    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(self.value)


class BuildingExporter(object):

    def __init__(self, db_url, building_id):
        self._engine = create_engine(db_url, case_sensitive=False)
        self._conn = self._engine.connect()
        self._building_id = building_id
        self._building = Building()
        self._conversion = 1e-3

    def _fill_building(self, obj, data):

        obj.id = data.id
        self._internal_building_id = data.id
        obj.name = data.name

        obj.deleted = data.deleted if hasattr(data, 'deleted') else False
        if data.lonorigin:
            obj.lon_origin = data.lonorigin

        if data.latorigin:
            obj.lat_origin = data.latorigin

        if data.rotation:
            obj.rotation = data.rotation

        if data.description:
            obj.description = data.description

        # floors
        self._fill_floors(obj.floors, self.get_floors())
        floor_ids = [f.id for f in obj.floors]

        # fingerprint points
        self._fill_fingerprint_points(obj.fingerprint_points,
                                      self.get_fingerprint_points(floor_ids))

        # zones
        self._fill_zones(obj.zones, self.get_zones(floor_ids))
        zone_ids = [z.id for z in obj.zones]

        # zone points
        self._fill_zone_points(obj.zone_points, self.get_zone_points(zone_ids))

        # waypoints
        self._fill_waypoints(obj.way_points, self.get_waypoints(floor_ids))

        # waypoint links
        self._fill_waypoint_links(obj.way_point_links,
                                  self.get_waypoint_links(floor_ids))

        # building metadata
        self._fill_metadata(obj.metadata, self.get_metadata())

        # networks
        self._fill_networks(obj.networks, self.get_networks())
        network_ids = [n.id for n in obj.networks]

        # network metadata
        self._fill_network_metadata(obj.networks,
                                    self.get_network_metadata(network_ids))

        # network locations
        self._fill_network_locations(obj.network_locations,
                                     self.get_network_locations(network_ids))

        # portals
        self._fill_portal(obj.portals, self.get_portals(floor_ids))

        # portal links
        self._fill_portal_link(obj.portal_links,
                               self.get_portal_links(floor_ids))

        # fingerprints and statistics
        self._fill_fingerprints_with_statistics(
            obj.fingerprints,
            self.get_fingerprints_with_statistics(network_ids))

        # walls
        self._fill_walls(obj.walls, self.get_walls(floor_ids))
        wall_ids = [w.id for w in obj.walls]

        # edge points
        self._fill_edge_points(obj.edge_points, self.get_edge_points(wall_ids))

    def get_proto(self):
        return self._building

    def _format_ids(self, ids):
        """
        # This method is used to "safely" format a list of identifiers
        # in concatenate them to the sql statement text. Because sqlite
        # driver doesn't have parameter binding support for lists
        :param ids: list(int)
        :return:
        """
        return ",".join([str(int(x)) for x in (ids or [0])])

    def export(self):
        data = self._run_sql(
            """
            SELECT * 
            FROM building b
            WHERE b.id = :id """, {
                'id': self._building_id
            }).first()

        if data is None:
            msg = "Unable to fetch data, building_id: %s not found" \
                  % self._building_id
            logger.debug(msg)
            raise ExportError(msg)

        self._fill_building(self._building, data)

    def save(self, to):
        to.write(self._building.SerializeToString())
        logger.debug('Proto file has been exported')

    def _run_sql(self, query, params=None):
        sql = text(query)
        if params is None:
            return self._conn.execute(sql)
        return self._conn.execute(sql, params)

    def _fill_address(self, obj, data):
        if data is not None:
            obj.id = data.id
            obj.street = data.street
            obj.zip_code = data.zipcode
            obj.city = data.city

    def _fill_default_map(self, obj, data):
        obj.id = data.id
        obj.per_pixel_base = data.mmperpixelbase / 1000
        obj.max_tile_size = data.maxtilesize
        self._fill_tiles(
            obj.tiles,
            self._run_sql(
                """
            SELECT *
            FROM tiles
            WHERE map_id = :id
        """, {
                    'id': data.map_id
                }).fetchall())

    def _fill_portal(self, obj, data):
        for row in data:
            portal = obj.add()
            portal.id = row.portal_id
            if portal.entrance:
                entrance = portal.entrance
                entrance.x = row.x
                entrance.y = row.y
            if row.floor_id:
                portal.floor_id = row.floor_id
            if row.edge_id:
                portal.edge_id = row.edge_id

            portal.exit_link_ids[:] = [
                r.id for r in self.get_portal_end_connection_ids(row.portal_id)
            ]

            portal.entrance_link_ids[:] = [
                r.id
                for r in self.get_portal_entrance_connection_ids(row.portal_id)
            ]

        logger.debug("Extracted {} portal(s)".format(len(obj)))

    def get_portal_end_connection_ids(self, exit_id):
        return self._run_sql(
            """
            SELECT id
            FROM  portallink
            WHERE exit_id = :exit_id
        """, {'exit_id': exit_id})

    def get_portal_entrance_connection_ids(self, entrance_id):
        return self._run_sql(
            """
            SELECT id
            FROM  portallink
            WHERE entrance_id = :entrance_id
        """, {'entrance_id': entrance_id})

    @timed
    def get_portals(self, floor_ids):
        return self._run_sql("""
            SELECT id AS portal_id, x, y, edge_id, floor_id
            FROM  portal
            WHERE floor_id IN ({})
        """.format(self._format_ids(floor_ids)))

    @timed
    def _fill_portal_link(self, obj, data):
        for row in data:
            pl = obj.add()
            pl.id = row.id
            if row.duration:
                pl.duration = row.duration
            if row.name:
                pl.name = row.name
            if row.description:
                pl.description = row.description
            pl.level = row.level
            if row.entrance_id:
                pl.entrance_id = row.entrance_id
            if row.exit_id:
                pl.exit_id = row.exit_id

        logger.debug("Extracted %i portal link(s)" % len(obj))

    def get_portal_links(self, floor_ids):
        return self._run_sql("""
            SELECT DISTINCT pl.id AS id, pl.entrance_id AS entrance_id,
                   pl.exit_id AS exit_id, pl.duration AS duration,
                   pl.level AS level, pl.name AS name,
                   pl.description AS description
            FROM portallink pl
            INNER JOIN portal p ON p.id = pl.entrance_id OR p.id = pl.exit_id
            WHERE p.floor_id IN ({})
        """.format(self._format_ids(floor_ids)))

    def _fill_tiles(self, obj, data):
        ii = 0
        for i, row in enumerate(data):
            tilesEntry = obj.add()
            tilesEntry.key = i
            tiles = tilesEntry.value
            tiles.id = row.id
            tiles.tile_size = row.tilesize
            tiles.count_horizontal_tiles = row.counthorizontaltiles
            tiles.count_vertical_tiles = row.countverticaltiles
            tiles.sum_pix_width = row.sumpixwidth
            tiles.sum_pix_height = row.sumpixheight
            ii += 1
        logger.debug("Extracted %i tile set(s)" % ii)

    def _fill_clusters(self, obj, data):
        for row in data:
            cluster = obj.add()
            cluster.id = row.id

        logger.debug("Extracted %i cluster(s)" % len(obj))

    def get_walls(self, floor_ids):
        return self._run_sql("""
            SELECT edge.id, edge.floor_id
            FROM edge
            INNER JOIN wall ON wall.id = edge.id
            WHERE edge.floor_id IN ({})
        """.format(self._format_ids(floor_ids)))

    def _fill_walls(self, collection, data):
        for entity in data:
            edge = collection.add()
            edge.id = entity.id
            edge.floor_id = entity.floor_id

        logger.debug("Extracted {} wall(s)".format(len(collection)))

    def get_edge_points(self, edge_ids):
        return self._run_sql("""
            SELECT id, x, y, sortorder, edge_id
            FROM edgepoint
            WHERE edge_id IN ({})
        """.format(self._format_ids(edge_ids)))

    def _fill_edge_points(self, collection, data):
        for entity in data:
            point = collection.add()
            point.id = entity.id
            point.x = entity.x
            point.y = entity.y
            point.edge_id = entity.edge_id
            point.sort_order = entity.sortorder

        logger.debug("Extracted {} edge point(s)".format(len(collection)))

    def get_zones(self, floor_ids):
        return self._run_sql("""
            SELECT id, description, name, speed, floor_id, zonetype
            FROM zone
            WHERE floor_id IN ({})
        """.format(self._format_ids(floor_ids)))

    def _fill_zones(self, collection, data):
        """Add zones"""
        for entity in data:
            zone = collection.add()
            zone.id = entity.id
            zone.floor_id = entity.floor_id
            zone.type = ZoneType.Value(ZoneType.Name(entity.zonetype))
            zone.speed = entity.speed
            if entity.name:
                zone.name = entity.name
            if entity.description:
                zone.description = entity.description

        logger.debug("Extracted {} zone(s)".format(len(collection)))

    def get_zone_points(self, zone_ids):
        return self._run_sql("""
            SELECT id, zone_id, x, y, sortorder
            FROM zonepoint
            WHERE zone_id IN ({})
        """.format(self._format_ids(zone_ids)))

    def _fill_zone_points(self, collection, data):
        """Add zone points"""
        for entity in data:
            point = collection.add()
            point.id = entity.id
            point.zone_id = entity.zone_id
            point.x = entity.x
            point.y = entity.y
            point.sort_order = entity.sortorder

        logger.debug("Extracted {} zone point(s)".format(len(collection)))

    def _fill_fingerprint_series(self, obj, data):
        for row in data:
            fs = obj.add()
            fs.id = row.id
            fs.type = FingerprintSeries.FingerprintSeriesType.Value(
                FingerprintSeries.FingerprintSeriesType.Name(row.type))
            fs.label = row.label
        logger.debug("Extracted %i fingerprint serie(s)" % len(obj))

    def get_metadata(self):
        return self._run_sql(
            """
            SELECT name, value
            FROM metadata
            WHERE building_id = :id
        """, {'id': self._internal_building_id})

    def _fill_metadata(self, obj, data):
        for row in data:
            md = obj.add()
            md.name = row.name
            md.value = row.value
        # logger.debug("Extracted %i metadata item(s)" % len(data))

    def get_networks(self):
        return self._run_sql(
            """
            SELECT id, bssid, channel, name, refreshrate,
                   building_id, networktype
            FROM network
            WHERE building_id = :id
        """, {'id': self._internal_building_id})

    def get_network_metadata(self, network_ids):
        return self._run_sql("""
            SELECT id, network_id, name, value
            FROM networkmetadata
            WHERE network_id IN ({})
        """.format(self._format_ids(network_ids)))

    def _fill_networks(self, collection, data):
        """Add networks"""
        for entry in data:
            network = collection.add()
            network.id = entry.id
            network.bssid = entry.bssid
            network.channel = entry.channel
            network.name = entry.name
            network.type = entry.networktype

            if entry.refreshrate:
                network.refresh_rate = entry.refreshrate

        logger.debug("Extracted {} network(s)".format(len(collection)))

    def _fill_network_metadata(self, collection, data):
        """Add network metadata"""
        for network in collection:
            self._fill_metadata(network.metadata,
                                filter(lambda d: d.id == network.id, data))

    def get_network_locations(self, network_ids):
        return self._run_sql("""
            SELECT id, x, y, network_id, floor_id
            FROM networklocation
            WHERE network_id IN ({})
        """.format(self._format_ids(network_ids)))

    def _fill_network_locations(self, collection, data):
        """Add network locations"""
        for entry in data:
            location = collection.add()
            location.id = entry.id
            location.x = entry.x
            location.y = entry.y

            if entry.floor_id:
                location.floor_id = entry.floor_id
            if entry.network_id:
                location.network_id = entry.network_id
        logger.debug("Extracted {} network location(s)".format(len(collection)))

    @timed
    def get_fingerprints_with_statistics(self, network_ids):
        return self._run_sql("""
            SELECT fingerprint.id, network_id, point_id,
                   statistic.id AS sid, amount, mean, variance, device_id
            FROM fingerprint
            LEFT JOIN statistic ON statistic.fingerprint_id = fingerprint.id
            WHERE network_id IN ({})
        """.format(self._format_ids(network_ids)))

    @timed
    def _fill_fingerprints_with_statistics(self, collection, data):
        """Add fingerprints"""
        for entry in data:
            fingerprint = collection.add()
            fingerprint.id = entry.id

            if entry.network_id:
                fingerprint.network_id = entry.network_id

            if entry.point_id:
                fingerprint.point_id = entry.point_id

            if entry.sid:
                fingerprint.statistic.id = entry.sid
                fingerprint.statistic.amount = int(entry.amount)
                fingerprint.statistic.mean = entry.mean
                fingerprint.statistic.variance = entry.variance
                fingerprint.statistic.device_id = int(entry.device_id)
        logger.debug("Extracted {} fingerprint(s)".format(len(collection)))

    def get_fingerprint_points(self, floor_ids):
        return self._run_sql("""
            SELECT id, x, y, cluster_id, floor_id
            FROM fingerprintpoint
            WHERE floor_id IN ({})
        """.format(self._format_ids(floor_ids)))

    def _fill_fingerprint_points(self, collection, data):
        """Add fingerprint points"""
        for entry in data:
            point = collection.add()
            point.id = entry.id
            point.x = int(entry.x)
            point.y = int(entry.y)

            if entry.floor_id:
                point.floor_id = entry.floor_id

            if entry.cluster_id:
                point.cluster_id = entry.cluster_id

        logger.debug("Extracted {} fingerprint point(s)".format(
            len(collection)))

    def _fill_waypoints(self, obj, data):
        for row in data:
            waypoint = obj.add()
            waypoint.id = row.waypoint_id
            map_point = waypoint.map_point
            map_point.x = row.x
            map_point.y = row.y
            waypoint.is_predefined = row.is_predefined == 1
            waypoint.connection_ids[:] = [
                r.id for r in self.get_connection_ids(row.waypoint_id)
            ]
            waypoint.floor_id = row.floor_id

        logger.debug("Extracted %i waypoint(s)" % len(obj))

    def _fill_waypoint_links(self, obj, data):
        for row in data:
            waypoint_link = obj.add()
            waypoint_link.id = row.id
            waypoint_link.from_id = row.from_id
            waypoint_link.to_id = row.to_id
            waypoint_link.cost = row.cost

        logger.debug("Extracted %i waypoint link(s)" % len(obj))

    def get_waypoint_links(self, floor_ids):
        return self._run_sql("""
            SELECT DISTINCT wp.id AS id, wp.from_id AS from_id, wp.to_id AS to_id, 
                   wp.cost AS cost
            FROM waypointlink wp
            INNER JOIN waypoint w ON w.id = wp.from_id OR w.id = wp.to_id
            WHERE w.floor_id IN ({})
        """.format(self._format_ids(floor_ids)))

    def get_waypoints(self, floor_ids):
        return self._run_sql("""
            SELECT id AS waypoint_id, x, y, floor_id, is_predefined
            FROM  waypoint
            WHERE floor_id IN ({})
        """.format(self._format_ids(floor_ids)))

    def get_floors(self):
        return self._run_sql(
            """
            SELECT f.id, f.description, f.level, f.mmheight, f.mmleftorigin, 
                   f.mmtoporigin, f.mmwidth, f.name, m.id AS map_id, 
                   m.mmperpixelbase, m.maxtilesize
            FROM floor f, map m
            WHERE building_id = :id AND f.id = m.floor_id
        """, {'id': self._internal_building_id})

    def _fill_floors(self, collection, data):
        """Add floors"""
        for entry in data:
            floor = collection.add()
            floor.id = entry.id
            floor.name = entry.name
            floor.level = entry.level
            floor.left_origin = entry.mmleftorigin * self._conversion
            floor.top_origin = entry.mmtoporigin * self._conversion
            floor.width = entry.mmwidth * self._conversion
            floor.height = entry.mmheight * self._conversion
            self._fill_default_map(floor.default_map, entry)

            if entry.description:
                floor.description = entry.description

        logger.debug("Extracted {} floor(s)".format(len(collection)))

    def get_connection_ids(self, waypoint_id):
        return self._run_sql(
            """
            SELECT id
            FROM  waypointlink
            WHERE from_id = :from_id
            OR to_id = :to_id
        """, {
                'to_id': waypoint_id,
                'from_id': waypoint_id
            })


class RecordingExporter(object):

    def __init__(self, db_url, recording_id=None):
        self._db_url = db_url
        self._recording_id = recording_id
        self.recording_pb = None

    def _get_query(self):
        return RecordingSQL(
            self._recording_id)() if self._recording_id else None

    def validate(self):
        if not self.recording_pb.validate():
            logger.warning('Conversion of recording_id:'
                           ' %s failed, check input data' % self._recording_id)
            return False
        return True

    def export(self, recording_id=None):
        self._recording_id = recording_id or self._recording_id

        query = self._get_query()
        data_frame = sql2df(self._db_url, queries=query)
        self.recording_pb = Df2pbRecordings(data_frame)

    def save(self, to):
        to.write(self.recording_pb.export())

    def get_proto(self):
        return self.recording_pb.get_proto()


class Df2pb(object):
    """
    Base class for conversion DataFrame to protobuf
    """

    def __init__(self, collection, proto_def):
        self._data = collection
        self._proto = proto_def()

    def export(self):
        return self._proto.SerializeToString()

    def validate(self):
        """Validate associated data transfer object.

        Returns:
            bool: True if data is valid otherwise False.
        """
        return self._proto.IsInitialized()

    def _fill(self):
        raise NotImplementedError

    def get_proto(self):
        return self._proto


class Df2pbRecordings(Df2pb):
    """
    Class provide conversion between Recordings Dataframe and protobufer Recording object.
    It allows to export object to protobuf file.
    As init parameter is dictionary of Recording DataFrame,
    which can be provided by function ../sql/sql2df.py
    """

    def __init__(self, collection):
        super(Df2pbRecordings, self).__init__(collection=collection,
                                              proto_def=Recording)
        self._fill()

    def _fill(self):
        self._fill_record(self._proto, self._data)

    def _fill_record(self, obj, data):
        try:
            obj.id = data['recordings'].id[0]
        except:
            logger.debug('Conversion error: %s' % data)

        obj.building = data['recordings'].building_id[0]
        obj.created_at = data['recordings'].creation_date[0]
        obj.start = data['recordings'].start_time[0]
        obj.end = data['recordings'].end_time[0]

        self._fill_metadata(obj.meta, data['metadata'])
        self._fill_sensors(obj.accelerations,
                           data['accelerations'],
                           msg='accelerations')
        self._fill_sensors(obj.gyros, data['gyro_data'], msg='gyro_data')
        self._fill_sensors(obj.magnetics,
                           data['magnetic_data'],
                           msg='magnetic_data')
        self._fill_sensors_rotations(obj.rotations, data['rotation_data'])

        self._fill_pressure(obj.pressures, data['pressures'])

        radio_data = pd.merge(left=data['radio_data'],
                              right=data['transmitters'],
                              left_on='transmitter_id',
                              right_on='id')
        self._fill_radios(obj.radios, radio_data)
        self._fill_step(obj.steps, data['steps'])
        self._fill_contexts(obj.contexts, data['context'])
        self._fill_positions(obj.positions, data['positions'])
        self._fill_global_positions(obj.global_positions,
                                    data['global_positions'])

    def _fill_metadata(self, collection, data):
        ee = list()
        for idx in range(len(data)):
            try:
                md = collection.add()
                md.name = data.key[idx]
                md.value = data.value[idx]
            except Exception as e:
                collection.remove(md)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('metadata error: %s' % set(ee))
            logger.debug('Number of metadata error(s): {}'.format(len(ee)))
        logger.debug("Extracted {} metadata rows".format(len(data) - len(ee)))

    def _fill_sensors(self, collection, data, msg=''):
        ee = list()
        for idx in range(len(data)):
            try:
                sens = collection.add()
                sens.t = self._set_scalar(data.recording_date[idx])
                sens.x = self._set_scalar(data.x[idx])
                sens.y = self._set_scalar(data.y[idx])
                sens.z = self._set_scalar(data.z[idx])
                if 'accuracy' in data and data.accuracy[idx] != 'NaN':
                    sens.accuracy = data.accuracy[idx]
            except Exception as e:
                collection.remove(sens)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('pressure error: %s' % set(ee))
            logger.debug('Number of {} error(s): {}'.format(msg, len(ee)))

        logger.debug("Extracted {} {} rows".format(len(data) - len(ee), msg))

    def _fill_sensors_rotations(self, collection, data):
        ee = list()
        for idx in range(len(data)):
            try:
                sens = collection.add()
                sens.t = self._set_scalar(data.recording_date[idx])
                sens.x = self._set_scalar(data.yaw[idx])
                sens.y = self._set_scalar(data.pitch[idx])
                sens.z = self._set_scalar(data.roll[idx])
                if 'accuracy' in data and data.accuracy[idx] != 'NaN':
                    sens.accuracy = data.accuracy[idx]

            except Exception as e:
                collection.remove(sens)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('sensors error: %s' % set(ee))
            logger.debug('Number of pressure error(s): {}'.format(len(ee)))
        logger.debug("Extracted {} rotations rows".format(len(data) - len(ee)))

    def _fill_pressure(self, collection, data):
        ee = list()
        for idx in range(len(data)):
            try:
                prs = collection.add()
                prs.t = self._set_scalar(data.recording_date[idx])
                prs.v = self._set_scalar(data.pressure[idx])
            except Exception as e:
                collection.remove(prs)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('pressure error: %s' % set(ee))
            logger.debug('Number of pressure error(s): {}'.format(len(ee)))

        logger.debug("Extracted {} pressure rows".format(len(data) - len(ee)))

    def _fill_radios(self, collection, data):
        ee = list()
        for idx in range(len(data)):
            try:
                radio = collection.add()
                radio.type = data.type[idx]
                radio.t = self._set_scalar(data.recording_date[idx])
                radio.ssid = self._set_text(data.ssid[idx])
                radio.bssid = int(data.bssid[idx])
                radio.rssi = int(data.rssi[idx])
            except Exception as e:
                collection.remove(radio)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('radios error: %s' % set(ee))
            logger.debug('Number of radio error(s): {}'.format(len(ee)))

        logger.debug("Extracted {} radios rows".format(len(data) - len(ee)))

    def _fill_step(self, collection, data):
        ee = list()
        for idx in range(len(data)):
            try:
                step = collection.add()
                step.t = self._set_scalar(data.recording_date[idx])
                step.length = self._set_scalar(data.length[idx])
                step.var_length = self._set_scalar(data.var_length[idx])

                if 'heading' in data and data.heading[idx] != 'NaN':
                    step.heading = self._set_scalar(data.heading[idx])
                if 'var_heading' in data and data.var_heading[idx] != 'NaN':
                    step.var_heading = self._set_scalar(data.var_heading[idx])
                step.max_acc = self._set_scalar(data.max_acc[idx])

            except Exception as e:
                collection.remove(step)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('step error: %s' % set(ee))
            logger.debug('Number of step error(s): {}'.format(len(ee)))
        logger.debug("Extracted {} step rows".format(len(data) - len(ee)))

    def _fill_contexts(self, collection, data):
        ee = list()
        for idx in range(len(data)):
            try:
                cont = collection.add()
                cont.t = self._set_scalar(data.recording_date[idx])
                cont.identifier = self._set_int(data.context_id[idx])
                cont.confidence = self._set_int(data.confidence[idx])
            except Exception as e:

                collection.remove(cont)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('contexts error: %s' % set(ee))
            logger.debug('Number of context error(s): {}'.format(len(ee)))
        logger.debug("Extracted {} contexts rows".format(len(data) - len(ee)))

    def _fill_positions(self, collection, data):
        ee = list()
        for idx in range(len(data)):
            try:
                pos = collection.add()
                pos.t = self._set_scalar(data.recording_date[idx])
                pos.type = data.position_type[idx]

                if 'x' in data and data.x[idx] != 'NaN':
                    pos.x = self._set_scalar(data.x[idx])
                if 'y' in data and data.y[idx] != 'NaN':
                    pos.y = self._set_scalar(data.y[idx])
                if 'floor' in data and data.floor[idx] != 'NaN':
                    pos.floor = self._set_int(data.floor_level[idx])
                if 'accuracy' in data and data.accuracy[idx] != 'NaN':
                    pos.accuracy = self._set_scalar(data.accuracy[idx])
                if 'sx2' in data and data.sx2[idx] != 'NaN':
                    pos.sx2 = self._set_scalar(data.sx2[idx])
                if 'sy2' in data and data.sxy2[idx] != 'NaN':
                    pos.sy2 = self._set_scalar(data.sy2[idx])
                if 'sxy' in data and data.sxy[idx] != 'NaN':
                    pos.sxy = self._set_scalar(data.sxy[idx])
            except Exception as e:
                collection.remove(pos)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('positions error: %s' % set(ee))
            logger.debug('Number of position error(s): {}'.format(len(ee)))

        logger.debug("Extracted {} positions rows".format(len(data) - len(ee)))

    def _fill_global_positions(self, collection, data):
        ee = list()
        for idx in range(len(data)):
            try:
                gpos = collection.add()
                gpos.t = data.recording_date[idx]
                gpos.latitude = self._set_scalar(data.latitude[idx])
                gpos.longitude = self._set_scalar(data.longitude[idx])
                if 'accuracy' in data and data.accuracy[idx] != 'NaN':
                    gpos.accuracy = self._set_scalar(data.accuracy[idx])
                if 'altitude' in data and data.altitude[idx] != 'NaN':
                    gpos.altitude = self._set_scalar(data.altitude[idx])
                if 'altitude_accuracy' in data and \
                        data.altitude_accuracy[idx] != 'NaN':
                    gpos.altitude_accuracy = self._set_scalar(
                        data.altitude_accuracy[idx])
                if 'speed' in data and data.speed[idx] != 'NaN':
                    gpos.speed = self._set_scalar(data.speed[idx])
                if 'speed_accuracy' in data and data.speed_accuracy[
                        idx] != 'NaN':
                    gpos.speed_accuracy = self._set_scalar(
                        data.speed_accuracy[idx])
                if 'heading' in data and data.heading[idx] != 'NaN':
                    gpos.heading = self._set_scalar(data.heading[idx])
                if 'heading' in data and data.heading[idx] != 'NaN':
                    gpos.heading = self._set_scalar(data.heading[idx])
                if 'device_timestamp' in data and data.device_timestamp[
                        idx] != 'NaN':
                    gpos.heading = self._set_scalar(data.device_timestamp[idx])
            except Exception as e:
                collection.remove(gpos)
                ee.append(str(e))

        if len(ee) > 0:
            logger.debug('global_positions error(s): %s' % set(ee))
            logger.debug('Number of global_positions error(s): {}'.format(
                len(ee)))

        logger.debug(
            "Extracted {} global_positions rows".format(len(data) - len(ee)))

    @staticmethod
    def _set_text(val):
        return str(val)

    @staticmethod
    def _set_scalar(val):
        if isinstance(val, np.generic):
            return val.item()
        if isinstance(val, Number) and np.isscalar(val):
            return val
        if isinstance(val, str):
            numeric_value = float(val) if '.' in val else int(val)
            return numeric_value
        raise TypeError('Cannot convert %s to scalar' % str(val))

    @staticmethod
    def _set_int(val):
        return int(val)
