from indoorsdatapy.common.const.network_type import *
from indoorssql.core.sql_base import SqlBase
from indoorssql.model.idm import *


def optional(value):
    return value or None


class SqlIdmCreator(SqlBase):

    def __init__(self, db_path, building_pb):
        """
        Class for creating idm file from protocol buffer
        :param db_path: string
            sql lite database destination
        :param building_pb: pb.Building
            open loaded protocol buffer object of Building property
        """
        super(SqlIdmCreator, self).__init__('sqlite:///%s' % db_path, IdmBase)

        self.pb = building_pb

        self.map_id = 0
        self.tile_id = 0
        self.device_id = False

    def _add_device(self, device_id):
        if not self.device_id:
            self.session.add(Device(id=device_id, name='SLAM DEVICE'))
            self.device_id = True

    def add_building(self):
        self.session.add(
            Building(id=self.pb.id,
                     description=optional(self.pb.description),
                     latorigin=optional(self.pb.lat_origin),
                     lonorigin=optional(self.pb.lon_origin),
                     name=optional(self.pb.name),
                     rotation=optional(self.pb.rotation)))
        self.commit()

    def add_building_metadata(self):
        for idx, meta in enumerate(self.pb.metadata, 1):
            self.session.add(
                BuildingMetadata(id=idx,
                                 building_id=self.pb.id,
                                 name=meta.name,
                                 value=meta.value))
        self.commit()

    def add_networks(self):
        network_metadata_counter = 0
        for transmitter in self.pb.networks:
            self.session.add(
                Network(
                    id=transmitter.id,
                    building_id=self.pb.id,
                    bssid=optional(transmitter.bssid),
                    channel=0,
                    name=transmitter.name,
                    networktype=transmitter.type,
                    refreshrate=None,
                ))

            if transmitter.type == IBEACON:
                uuid, major, minor = transmitter.name.split(".")
                self.session.add(
                    NetworkMetadata(id=network_metadata_counter,
                                    network_id=transmitter.id,
                                    name="ibeacon_uuid",
                                    value=uuid))
                network_metadata_counter += 1
                self.session.add(
                    NetworkMetadata(id=network_metadata_counter,
                                    network_id=transmitter.id,
                                    name="ibeacon_major",
                                    value=major))
                network_metadata_counter += 1
                self.session.add(
                    NetworkMetadata(id=network_metadata_counter,
                                    network_id=transmitter.id,
                                    name="ibeacon_minor",
                                    value=minor))
                network_metadata_counter += 1

            if transmitter.type == WLAN:
                self.session.add(
                    NetworkMetadata(id=network_metadata_counter,
                                    network_id=transmitter.id,
                                    name="wlan_ssid",
                                    value=getattr(transmitter, 'ssid', '')))

                network_metadata_counter += 1

        self.commit()

    def add_network_locations(self):
        for wp in self.pb.network_locations:
            self.session.add(
                NetworkLocation(id=wp.id,
                                x=wp.x,
                                y=wp.y,
                                network_id=wp.network_id,
                                floor_id=wp.floor_id))

        self.commit()

    def add_floors(self):

        for floor in self.pb.floors:
            self.session.add(
                Floor(id=floor.id,
                      building_id=self.pb.id,
                      description=floor.description,
                      level=floor.level,
                      mmheight=int(floor.height * 1000),
                      mmleftorigin=int(floor.left_origin * 1000),
                      mmtoporigin=int(floor.top_origin * 1000),
                      mmwidth=int(floor.width * 1000),
                      name=floor.name))

            self._add_default_map(floor.default_map, floor.id)

        self.commit()

    def _add_default_map(self, default_map, floor_id):
        if default_map:
            self.map_id += 1
            self.session.add(
                Map(id=self.map_id,
                    floor_id=floor_id,
                    max_tile_size=default_map.max_tile_size,
                    mm_per_pixel_base=(default_map.per_pixel_base) * 1000))

            self._add_tile(default_map.tiles)

    def _add_tile(self, tiles_obj):
        for tile in tiles_obj:
            self.tile_id += 1
            tl = tile.value
            self.session.add(
                Tiles(id=self.tile_id,
                      map_id=self.map_id,
                      count_horizontal_tiles=tl.count_horizontal_tiles,
                      count_vertical_tiles=tl.count_vertical_tiles,
                      sum_pix_height=tl.sum_pix_height,
                      sum_pix_width=tl.sum_pix_width,
                      tile_size=tl.tile_size))

    def add_edge(self):
        for wall in self.pb.walls:
            self.session.add(Edge(id=wall.id, floor_id=wall.floor_id))
        self.commit()

    def add_edge_point(self):
        for edge in self.pb.edge_points:
            self.session.add(
                EdgePoint(id=edge.id,
                          x=edge.x,
                          y=edge.y,
                          sort_order=edge.sort_order,
                          edge_id=edge.edge_id))

        self.commit()

    def add_fingerprint_points(self):
        for fpoint in self.pb.fingerprint_points:
            self.session.add(
                FingerprintPoint(
                    id=fpoint.id,
                    cluster_id=optional(fpoint.cluster_id),
                    floor_id=fpoint.floor_id,
                    x=fpoint.x,
                    y=fpoint.y,
                ))
        self.commit()

    def add_fingerprints(self):
        for f in self.pb.fingerprints:
            self.session.add(
                Fingerprint(id=f.id,
                            network_id=f.network_id,
                            point_id=f.point_id))
            if f.statistic:
                self._add_statistic(f.statistic, f.id)
        self.commit()

    def _add_statistic(self, statistics_obj, fingerprint_id):
        self.session.add(
            Statistic(
                id=statistics_obj.id,
                device_id=statistics_obj.device_id,
                fingerprint_id=fingerprint_id,
                amount=statistics_obj.amount,
                mean=statistics_obj.mean,
                variance=statistics_obj.variance,
            ))
        self._add_device(statistics_obj.device_id)

    def add_zones(self):
        for zone in self.pb.zones:
            self.session.add(
                Zone(id=zone.id,
                     floor_id=zone.floor_id,
                     name=zone.name,
                     description=zone.description,
                     speed=zone.speed,
                     zonetype=zone.type))
        self.commit()

    def add_zone_point(self):
        for zp in self.pb.zone_points:
            self.session.add(
                ZonePoint(id=zp.id,
                          zone_id=zp.zone_id,
                          x=zp.x,
                          y=zp.y,
                          sort_order=zp.sort_order))
        self.commit()

    def add_portals(self):
        for p in self.pb.portals:
            self.session.add(
                Portal(
                    id=p.id,
                    edge_id=optional(p.edge_id),
                    floor_id=p.floor_id,
                    x=p.entrance.x,
                    y=p.entrance.y,
                ))
        self.commit()

    def add_portal_link(self):
        for p in self.pb.portal_links:
            self.session.add(
                PortalLink(id=p.id,
                           entrance_id=p.entrance_id,
                           exit_id=optional(p.exit_id),
                           duration=optional(p.duration),
                           level=p.level,
                           name=optional(p.name),
                           description=optional(p.description)))
        self.commit()

    def add_waypoints(self):
        for wp in self.pb.way_points:
            self.session.add(
                WayPoint(id=wp.id,
                         floor_id=optional(wp.floor_id),
                         x=optional(wp.map_point.x),
                         y=optional(wp.map_point.y),
                         is_predefined=optional(wp.is_predefined)))
        self.commit()

    def add_waypoint_links(self):
        for wp in self.pb.way_point_links:
            self.session.add(
                WayPointLink(
                    id=wp.id,
                    from_id=wp.from_id,
                    to_id=wp.to_id,
                    cost=wp.cost,
                    is_predefined=False if int(wp.cost) == 1000000 else True))
        self.commit()

    def add_notes(self):
        for note in self.pb.notes:
            self.session.add(
                Note(id=note.id,
                     building_id=self.pb.building_id,
                     content=note.content,
                     date=note.date))

        self.commit()
