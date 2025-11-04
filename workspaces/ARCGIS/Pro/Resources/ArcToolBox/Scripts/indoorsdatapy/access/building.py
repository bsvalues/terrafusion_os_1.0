from indoorsdatapy.access.base import AccessBase
from indoorsdatapy.access.utilities import *
from indoorsdatapy.common.const.zone_type import BOUNDING_BOX
from indoorsprotocol.buildings_pb2 import Building


class BuildingAccess(AccessBase):
    def __init__(self, f=None, fields=None):
        super(BuildingAccess, self).__init__(Building, f, fields, False)

    def fingerprint_points_statistics(self):
        stats = statistics(
            self['fingerprints'], self['networks'])
        fp = fingerprint_points(
            self['fingerprint_points'], self['floors'])
        return fingerprint_points_statistics(fp, stats)

    def floors(self):
        return floors(self['floors'], self['id'])

    def statistics(self):
        return statistics(self['fingerprints'], self['networks'])

    def fingerprint_points(self):
        return fingerprint_points(self['fingerprint_points'], self['floors'])

    def floor_level_by_id(self):
        return floor_level_by_id(self['floors'])

    def floor_id_by_level(self):
        return floor_id_by_level(self['floors'])

    def walls_by_floors(self):
        return walls_by_floors(self['walls'], self['edge_points'],
                               self['floors'])

    def transmitter_locations(self):
        return transmitter_locations(self['networks'],
                                     self['network_locations'],
                                     self['floors'])

    def zones_with_points(self, floor_id=None, zone_type=None):
        return zones_with_points(self['zones'],
                                 self['zone_points'], floor_id,
                                 zone_type)

    def zones_points_by_level(self, zone_type=None):
        return zones_points_by_level(self['zones'], self['zone_points'],
                                     self['floors'], zone_type)

    def boundaries(self):
        return self.zones_points_by_level(BOUNDING_BOX)

    def tiles_description(self):
        return tiles_description(self['floors'])
