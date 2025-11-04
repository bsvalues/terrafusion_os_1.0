from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    Table,
    Boolean,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

from indoorssql.model.abstract import SQLiteDateTimeType

IdmBase = declarative_base()


class Building(IdmBase):
    __tablename__ = 'building'
    id = Column(Integer, primary_key=True)
    description = Column(String)
    latorigin = Column(Integer)
    lonorigin = Column(Integer)
    name = Column(String, nullable=False)
    rotation = Column(Float)
    networks = relationship('Network',
                            backref='building',
                            cascade='all',
                            lazy='subquery')
    floors = relationship('Floor',
                          backref='building',
                          cascade='all',
                          order_by="Floor.level",
                          lazy='joined')
    meta_data = relationship('BuildingMetadata',
                             backref='building',
                             cascade='all')
    notes = relationship('Note', backref='building', cascade='all')
    fingerprint_series = relationship('FingerprintSeries',
                                      backref='building',
                                      cascade='all')


class Network(IdmBase):
    __tablename__ = 'network'
    id = Column(Integer, primary_key=True)
    building_id = Column(ForeignKey('building.id'))
    bssid = Column(Integer, nullable=False)
    channel = Column(Integer, nullable=False)
    name = Column(String)
    networktype = Column(Integer, nullable=False)
    refreshrate = Column(Integer)
    meta_data = relationship('NetworkMetadata',
                             backref='network',
                             cascade='all')
    network_location = relationship('NetworkLocation',
                                    backref='network',
                                    cascade='all')
    fingerprints = relationship("Fingerprint",
                                backref="network",
                                cascade="all",
                                lazy="subquery")


class Floor(IdmBase):
    __tablename__ = 'floor'
    id = Column(Integer, primary_key=True)
    building_id = Column(ForeignKey('building.id'), nullable=False)
    description = Column(String)
    level = Column(Integer)
    mmheight = Column(Integer)
    mmleftorigin = Column(Integer, nullable=False)
    mmtoporigin = Column(Integer, nullable=False)
    mmwidth = Column(Integer)
    name = Column(String)
    clusters = relationship('Cluster', backref='floor', cascade='all')
    fingerprint_points = relationship('FingerprintPoint',
                                      backref='floor',
                                      cascade='all',
                                      lazy="joined")
    walls = relationship('Wall',
                         backref='floor',
                         cascade='all',
                         lazy="subquery")
    zones = relationship('Zone',
                         backref='floor',
                         cascade='all',
                         lazy="subquery")
    portals = relationship('Portal', backref='floor', cascade='all')
    boundaries = relationship('Boundary', backref='floor', cascade='all')
    way_points = relationship('WayPoint', backref='floor', cascade='all')
    measurement_sessions = relationship('MeasurementSession',
                                        backref='floor',
                                        cascade='all')
    network_locations = relationship('NetworkLocation',
                                     backref='floor',
                                     lazy="subquery")
    map = relationship('Map', backref='floor', uselist=False)


# not used
class Boundary(IdmBase):
    __tablename__ = 'boundary'
    id = Column(ForeignKey('edge.id'), primary_key=True)
    duration = Column(Float, nullable=False)
    floor_id = Column(ForeignKey('floor.id'))


class Wall(IdmBase):
    __tablename__ = 'wall'
    id = Column(ForeignKey('edge.id'), primary_key=True)
    floor_id = Column(ForeignKey('floor.id'))
    edge = relationship('Edge', backref='wall', cascade='all', lazy='subquery')


class Edge(IdmBase):
    __tablename__ = 'edge'
    id = Column(Integer, primary_key=True)
    floor_id = Column(ForeignKey('floor.id'))
    points = relationship('EdgePoint',
                          backref='edge',
                          cascade='all',
                          lazy='subquery',
                          order_by="EdgePoint.sort_order")
    boundary = relationship('Boundary',
                            uselist=False,
                            backref='edge',
                            cascade='all')


class EdgePoint(IdmBase):
    __tablename__ = 'edgepoint'
    id = Column(Integer, primary_key=True)
    edge_id = Column(ForeignKey('edge.id'))
    sort_order = Column('sortorder', Integer)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)


cluster_neighbors_join_table = Table(
    'cluster_neighbors', IdmBase.metadata,
    Column('cluster_id', Integer, ForeignKey('cluster.id')),
    Column('neighbor_id', Integer, ForeignKey('cluster.id')))


# not use
class Cluster(IdmBase):
    __tablename__ = 'cluster'
    id = Column(Integer, primary_key=True)
    floor_id = Column(ForeignKey('floor.id'))
    reference_id = Column(Integer)
    neighbors = relationship(
        'Cluster',
        secondary=cluster_neighbors_join_table,
        cascade='all',
        primaryjoin=(id == cluster_neighbors_join_table.c.cluster_id),
        secondaryjoin=(id == cluster_neighbors_join_table.c.cluster_id))
    fingerprint_points = relationship('FingerprintPoint',
                                      backref='cluster',
                                      cascade='all')


# noy used
class Checkpoint(IdmBase):
    __tablename__ = 'checkpoint'
    id = Column(Integer, primary_key=True)
    floor_id = Column(ForeignKey('floor.id'))
    recording_id = Column(Integer)
    time = Column(SQLiteDateTimeType)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)


# not used
class Calibration(IdmBase):
    __tablename__ = 'calibration'
    id = Column(Integer, primary_key=True)
    device_id = Column(ForeignKey('device.id'))
    expected_error = Column(Float)
    from_device_id = Column(ForeignKey('device.id'))
    cal_lambda = Column('lambda', Float)
    x0 = Column(Float, nullable=False)
    x1 = Column(Float, nullable=False)
    x2 = Column(Float, nullable=False)
    x3 = Column(Float, nullable=False)
    x4 = Column(Float, nullable=False)
    x5 = Column(Float, nullable=False)
    x6 = Column(Float, nullable=False)
    x7 = Column(Float, nullable=False)
    x8 = Column(Float, nullable=False)
    from_device = relationship('Device', foreign_keys=from_device_id)


class Device(IdmBase):
    __tablename__ = 'device'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    calibrations = relationship('Calibration',
                                backref='device',
                                cascade='all',
                                foreign_keys=Calibration.device_id)


class Fingerprint(IdmBase):
    __tablename__ = 'fingerprint'
    id = Column(Integer, primary_key=True)
    network_id = Column(ForeignKey("network.id"))
    point_id = Column(ForeignKey("fingerprintpoint.id"))
    statistics = relationship('Statistic',
                              backref='fingerprint',
                              cascade='all',
                              lazy="joined")


class FingerprintPoint(IdmBase):
    __tablename__ = 'fingerprintpoint'
    id = Column(Integer, primary_key=True)
    cluster_id = Column(ForeignKey('cluster.id'))
    floor_id = Column(ForeignKey('floor.id'))
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    fingerprints = relationship('Fingerprint',
                                backref='point',
                                cascade='all',
                                lazy="joined")
    measurement_sessions = relationship('MeasurementSession',
                                        backref='fingerprint',
                                        cascade='all')


# not used
class FingerprintSeries(IdmBase):
    __tablename__ = 'fingerprintseries'
    id = Column(Integer, primary_key=True)
    building_id = Column(ForeignKey('building.id'))
    label = Column(String)
    type = Column(Integer, nullable=False)
    members = relationship('FingerprintSeriesMember',
                           backref='fingerprint_series',
                           cascade='all')


# not used
class FingerprintSeriesMember(IdmBase):
    __tablename__ = 'fingerprintseriesmember'
    fingerprint_id = Column(ForeignKey('fingerprint.id'), primary_key=True)
    series_id = Column(ForeignKey('fingerprintseries.id'), primary_key=True)
    sortorder = Column(Integer, nullable=False, primary_key=True)


# not used
class FingerprintSeriesMetadata(IdmBase):
    __tablename__ = 'fingerprintseriesmetadata'
    id = Column(Integer, primary_key=True)
    recording_id = Column(Integer)
    name = Column(String)
    value = Column(String)


class Map(IdmBase):
    __tablename__ = 'map'
    id = Column(Integer, primary_key=True)
    floor_id = Column(ForeignKey('floor.id'))
    max_tile_size = Column('maxTileSize', Integer)
    mm_per_pixel_base = Column('mmPerPixelBase', Float)
    tiles = relationship('Tiles', backref='map', cascade='all', lazy='dynamic')


# not used
class Measurement(IdmBase):
    __tablename__ = 'measurement'
    id = Column(Integer, primary_key=True)
    statistic_id = Column(ForeignKey('statistic.id'))
    strength = Column(Integer)
    timestamp = Column(SQLiteDateTimeType, nullable=False)


# not used
class MeasurementSession(IdmBase):
    __tablename__ = 'measurementsession'
    id = Column(Integer, primary_key=True)
    device_id = Column(ForeignKey('device.id'))
    floor_id = Column(ForeignKey('floor.id'))
    point_id = Column(ForeignKey('fingerprintpoint.id'))
    starttime = Column(SQLiteDateTimeType)
    endtime = Column(SQLiteDateTimeType)
    meta_data = relationship('MeasurementSessionMetadata',
                             backref='measurement_session',
                             cascade='all')
    device = relationship('Device')


# not used
class MeasurementSessionMetadata(IdmBase):
    __tablename__ = 'measurementsessionmetadata'
    id = Column(Integer, primary_key=True)
    session_id = Column(ForeignKey('measurementsession.id'))
    name = Column(String)
    value = Column(String)


class BuildingMetadata(IdmBase):
    __tablename__ = 'metadata'
    id = Column(Integer, primary_key=True)
    building_id = Column(ForeignKey('building.id'))
    name = Column(String)
    value = Column(String)


class NetworkLocation(IdmBase):
    __tablename__ = 'networklocation'
    id = Column(Integer, primary_key=True)
    floor_id = Column(ForeignKey('floor.id'))
    network_id = Column(ForeignKey('network.id'))
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)


class NetworkMetadata(IdmBase):
    __tablename__ = 'networkmetadata'
    id = Column(Integer, primary_key=True)
    network_id = Column(ForeignKey('network.id'))
    name = Column(String)
    value = Column(String)


class Note(IdmBase):
    __tablename__ = 'note'
    id = Column(Integer, primary_key=True)
    building_id = Column(ForeignKey('building.id'))
    content = Column(String)
    date = Column(SQLiteDateTimeType)


class PortalLink(IdmBase):
    __tablename__ = 'portallink'
    id = Column(Integer, primary_key=True)
    entrance_id = Column(ForeignKey('portal.id'))
    exit_id = Column(ForeignKey('portal.id'))
    duration = Column(SQLiteDateTimeType)
    level = Column(Integer, nullable=False)
    name = Column(String)
    description = Column(String)


class Portal(IdmBase):
    __tablename__ = 'portal'
    id = Column(Integer, primary_key=True)
    edge_id = Column(ForeignKey('edge.id'))
    floor_id = Column(ForeignKey('floor.id'))
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    exit_links = relationship('PortalLink',
                              backref='exit',
                              cascade='all',
                              foreign_keys=PortalLink.exit_id)
    entrance_links = relationship('PortalLink',
                                  backref='entrance',
                                  cascade='all',
                                  foreign_keys=PortalLink.entrance_id)


class Statistic(IdmBase):
    __tablename__ = 'statistic'
    id = Column(Integer, primary_key=True)
    device_id = Column(ForeignKey('device.id'))
    fingerprint_id = Column(ForeignKey('fingerprint.id'))
    amount = Column(Integer)
    mean = Column(Float)
    variance = Column(Float)
    measurements = relationship('Measurement',
                                backref='statistic',
                                cascade='all')
    device = relationship('Device')


class Tiles(IdmBase):
    __tablename__ = 'tiles'
    id = Column(Integer, primary_key=True)
    map_id = Column(ForeignKey('map.id'))
    count_horizontal_tiles = Column('countHorizontalTiles',
                                    Integer,
                                    nullable=False)
    count_vertical_tiles = Column('countVerticalTiles', Integer, nullable=False)
    sum_pix_height = Column('sumPixHeight', Integer, nullable=False)
    sum_pix_width = Column('sumPixWidth', Integer, nullable=False)
    tile_size = Column('tileSize', Integer, nullable=False)


class WayPointLink(IdmBase):
    __tablename__ = 'waypointlink'
    id = Column(Integer, primary_key=True)
    from_id = Column(ForeignKey('waypoint.id'))
    to_id = Column(ForeignKey('waypoint.id'))
    cost = Column(Float, nullable=False)
    is_predefined = Column(Boolean)


class WayPoint(IdmBase):
    __tablename__ = 'waypoint'
    id = Column(Integer, primary_key=True)
    floor_id = Column(ForeignKey('floor.id'))
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
    connections = relationship('WayPointLink',
                               backref='from',
                               cascade='all',
                               foreign_keys=WayPointLink.from_id)
    inbound_connections = relationship('WayPointLink',
                                       backref='to',
                                       cascade='all',
                                       foreign_keys=WayPointLink.to_id)
    is_predefined = Column(Boolean)


class Zone(IdmBase):
    __tablename__ = 'zone'
    id = Column(Integer, primary_key=True)
    floor_id = Column(ForeignKey('floor.id'))
    name = Column(String)
    description = Column(String)
    speed = Column(Float)
    zonetype = Column(Integer, nullable=False)
    zone_points = relationship('ZonePoint',
                               backref='zone',
                               cascade='all',
                               order_by="ZonePoint.sort_order",
                               lazy="subquery")


class ZonePoint(IdmBase):
    __tablename__ = 'zonepoint'
    id = Column(Integer, primary_key=True)
    zone_id = Column(ForeignKey('zone.id'))
    sort_order = Column('sortorder', Integer)
    x = Column(Integer, nullable=False)
    y = Column(Integer, nullable=False)
