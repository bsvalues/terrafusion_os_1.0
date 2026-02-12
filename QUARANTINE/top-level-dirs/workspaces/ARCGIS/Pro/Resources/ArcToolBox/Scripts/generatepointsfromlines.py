# coding: utf-8
"""
Source Name:   generatepointsfromlines.py
Author:        Environmental Systems Research Institute Inc.
Description:   Source for Generate Points Along Lines geoprocessing tool.
"""

import arcpy
import os
import types
from collections import namedtuple


def get_OID_name(in_data):
    """Get the OIDFieldName of the data source

    :param in_data: Input data source
    :return: The OID field name of the data source
    """

    d = arcpy.Describe(in_data)
    oid = getattr(d, 'OIDFieldName') \
          if hasattr(d, 'OIDFieldName') \
          else getattr(arcpy.Describe(d.catalogPath), 'OIDFieldName')
    return oid


def convert_units(param_units, spatial_info, geodesic=False):
    """Base unit conversion

    :param param_units: The units as supplied from tool parameter
    :param spatial_info: arcpy.SpatialReference object
    :return: Conversion factor
    """

    param_units = param_units.upper()

    if param_units in ['', None, 'UNKNOWN']:
        if not geodesic:
            return 1.0
        else:
            if spatial_info.spatialReference.linearUnitName:
                return 1.0
            else:
                try:
                    input_extent = spatial_info.extent

                    centroid = input_extent.polygon.centroid
                    point1 = centroid.Y, centroid.X - 0.5
                    point2 = centroid.Y, centroid.X + 0.5

                    return haversine(point1, point2) * 1000
                except Exception as err:
                    # Fallback
                    return 111319.8

    else:
        if param_units != 'DECIMALDEGREES':
            p_conversion = arcpy.LinearUnitConversionFactor(param_units,
                                                            'METERS')
        else:
            p_conversion = 111319.8

        if not geodesic:
            try:
                sr_conversion = spatial_info.spatialReference.metersPerUnit
            except AttributeError:
                try:
                    input_extent = spatial_info.extent

                    centroid = input_extent.polygon.centroid
                    point1 = centroid.Y, centroid.X - 0.5
                    point2 = centroid.Y, centroid.X + 0.5
                    sr_conversion = haversine(point1, point2) * 1000
                except Exception as err:
                    # Fallback
                    sr_conversion = 111319.8
        else:
            try:
                _ = spatial_info.spatialReference.metersPerUnit
                sr_conversion = 1.0
            except AttributeError:
                sr_conversion = 111319.8

    return (p_conversion / sr_conversion)


def get_distance_and_units(dist):
    """ Pull distance and units from a linear unit. If units are not
    specified, return UNKNOWN.

    :param dist: Linear units
    :return: Tuple of distance (float) and units (string)
    """
    try:
        dist, units = dist.split(' ', 1)
    except ValueError:
        # ValueError occurs if units are not specified, use 'UNKNOWN'
        units = 'UNKNOWN'

    dist = dist.replace(',', '.')

    return float(dist), units


def haversine(point1, point2):
    """ Calculate the distance between two points on the Earth surface around
    its curvature. Does not account for changes in elevation (datum)

    :param point1 Tuple - Tuple of (Lat, Long) for the first point
    :param point2 Tuple - Tuple of (Lat, Long) for the second point
    :return Float - The distance between the two points about the surface of
                    the globe in kilometers.
    """
    from math import radians, sin, cos, asin, sqrt
    radius_of_earth_km = 6371
    lat1, lng1, lat2, lng2 = list(map(radians, list(point1 + point2)))
    d = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lng2 - lng1) / 2) ** 2
    return 2 * radius_of_earth_km * asin(sqrt(d))


class PointsToLine(object):
    """ Worker class to create the output """
    def __init__(self, in_features, out_fc, point_placement, distance,
                 percentage, end_points, chainage, distance_field, distance_method
                 ):

        self.in_features = in_features
        self.out_fc = out_fc
        self.point_placement = point_placement  # Only used for validation
        self.distance = distance
        self.percentage = percentage
        self.end_points = end_points
        self.chainage = chainage
        self.distance_field = distance_field
        if distance_method == 'GEODESIC':
            self.geodesic = True
        else:
            self.geodesic = False

        self.describe = arcpy.Describe(self.in_features)

        # Define output field names
        self.fid_name = 'ORIG_FID'
        self.len_name = 'ORIG_LEN'
        self.seq_name = 'ORIG_SEQ'

        # Convert distance to numeric in expected units
        if self.distance:
            self.distance = self.convert_distance()

        # Set up output
        self.create_empty_output()
        self.add_fields()

        self.in_tokens = ['SHAPE@', 'OID@']
        if self.distance_field:
            self.in_tokens.append(self.distance_field)

        self.out_tokens = ['SHAPE@', self.fid_name]
        if self.chainage:
            self.out_tokens += [self.len_name, self.seq_name]

        if not self.geodesic:
            self.create_points()
        else:
            self.create_points_geodesic()

        # Final
        self.join_attributes()
        self.add_spatial_index()

    def create_empty_output(self):
        """ Create the initial feature class """

        # Take flag environment over Describe property unless set to default
        support_m = arcpy.env.outputMFlag.upper() if arcpy.env.outputMFlag in ['Enabled', 'Disabled'] \
            else "ENABLED" if self.describe.hasM else "DISABLED"
        support_z = arcpy.env.outputZFlag.upper() if arcpy.env.outputZFlag in ['Enabled', 'Disabled'] \
            else "ENABLED" if self.describe.hasZ else "DISABLED"

        # Create output feature class
        arcpy.management.CreateFeatureclass(
            os.path.dirname(self.out_fc),
            os.path.basename(self.out_fc),
            geometry_type="POINT",
            has_m=support_m,
            has_z=support_z,
            spatial_reference=self.describe.spatialReference)

        return

    def add_fields(self):
        """ Add fields """

        # Add necessary fields
        if self.chainage:
            arcpy.management.AddFields(
                self.out_fc,
                [[self.fid_name, 'LONG'],
                 [self.len_name, 'DOUBLE'],
                 [self.seq_name, 'LONG']])
        else:
            arcpy.management.AddField(self.out_fc, self.fid_name, 'LONG')

        return

    def convert_distance(self):
        """ Convert distance with linear units to expected numeric """

        spatial_info = namedtuple('spatial_info', 'spatialReference extent')
        sp_info = spatial_info(
            spatialReference=self.describe.spatialReference,
            extent=self.describe.extent
        )

        distance, param_linear_units = get_distance_and_units(self.distance)
        new_distance = distance * convert_units(param_linear_units, sp_info, self.geodesic)

        return new_distance

    def create_points(self):
        """ Main worker method """

        is_line_type = True if self.describe.shapetype == 'Polyline' else False

        # Set default as True
        numeric_distance = True

        if self.distance:
            increment = self.distance
        elif self.percentage:
            increment = self.percentage
        else:  # self.distance_field
            increment = float('inf')  # placeholder

        out_fc_is_empty = True
        with arcpy.da.SearchCursor(self.in_features, self.in_tokens) as search_cursor:
            with arcpy.da.InsertCursor(self.out_fc, self.out_tokens) as insert_cursor:
                for row in search_cursor:
                    line = row[0]

                    if line:  # if null geometry--skip

                        i = 1
                        if not is_line_type:
                            line = line.boundary()

                        # Add starting point
                        if self.end_points:
                            out_fc_is_empty = False
                            insert_values = [line.firstPoint, row[1]]
                            if self.chainage:
                                insert_values += [0, i]
                            insert_cursor.insertRow(insert_values)
                            i += 1

                        if self.percentage:
                            max_position = 1
                        else:
                            max_position = line.length

                        if self.distance_field:
                            dist_value = row[-1]

                            # Value is semi-colon delimited string
                            if isinstance(dist_value, str):
                                numeric_distance = False
                                dist_generator = self.get_distances_from_str(
                                    dist_value, max_position)

                                try:
                                    cur_length = next(dist_generator)
                                except ValueError:
                                    # Field value can't be parsed.
                                    arcpy.AddIDMessage('WARNING', 3969, str(dist_value))
                                    continue

                            # Value is None
                            elif isinstance(dist_value, types.NoneType):
                                continue

                            # Value is numeric
                            else:
                                if dist_value <= 0:
                                    continue

                                cur_length = increment = dist_value
                        else:
                            cur_length = increment

                        while cur_length < max_position:
                            out_fc_is_empty = False
                            new_point = line.positionAlongLine(cur_length,
                                                               self.percentage)
                            insert_values = [new_point, row[1]]
                            if self.chainage:
                                if self.percentage:
                                    insert_values += [line.queryPointAndDistance(new_point)[1], i]
                                else:
                                    insert_values += [cur_length, i]
                            insert_cursor.insertRow(insert_values)
                            i += 1

                            if numeric_distance:
                                cur_length += increment
                            else:
                                try:
                                    cur_length = next(dist_generator)
                                except StopIteration:
                                    break

                        # Add end point
                        if self.end_points:
                            end_point = line.positionAlongLine(1, True)
                            insert_values = [end_point, row[1]]
                            if self.chainage:
                                insert_values += [line.length, i]
                            insert_cursor.insertRow(insert_values)

        if out_fc_is_empty:
            arcpy.AddIDMessage('WARNING', 117)

        return

    def create_points_geodesic(self):
        """ Main worker method """

        is_line_type = True if self.describe.shapetype == 'Polyline' else False

        # Set default as True
        numeric_distance = True

        if self.distance:
            increment = self.distance
        elif self.percentage:
            increment = self.percentage
        else:  # self.distance_field
            increment = float('inf')  # placeholder

        out_fc_is_empty = True
        with arcpy.da.SearchCursor(self.in_features, self.in_tokens) as search_cursor:
            with arcpy.da.InsertCursor(self.out_fc, self.out_tokens) as insert_cursor:
                for row in search_cursor:
                    line = row[0]

                    if line:  # if null geometry--skip

                        i = 1
                        if not is_line_type:
                            line = line.boundary()

                        # Add starting point
                        if self.end_points:
                            out_fc_is_empty = False
                            insert_values = [line.firstPoint, row[1]]
                            if self.chainage:
                                insert_values += [0, i]
                            insert_cursor.insertRow(insert_values)
                            i += 1

                        if self.percentage:
                            max_position = 1
                        else:
                            max_position = line.length

                        if self.distance_field:
                            dist_value = row[-1]

                            # Value is semi-colon delimited string
                            if isinstance(dist_value, str):
                                numeric_distance = False
                                dist_generator = self.get_distances_from_str(
                                    dist_value, max_position)

                                try:
                                    cur_length = next(dist_generator)
                                except ValueError:
                                    # Field value can't be parsed.
                                    arcpy.AddIDMessage('WARNING', 3969, str(dist_value))
                                    continue

                            # Value is None
                            elif isinstance(dist_value, types.NoneType):
                                continue

                            # Value is numeric
                            else:
                                if dist_value <= 0:
                                    continue

                                cur_length = increment = dist_value
                        else:
                            cur_length = increment

                        while True:
                            out_fc_is_empty = False
                            try:
                                new_point = line.positionAlongLine(cur_length,
                                                                   self.percentage,
                                                                   geodesic=True)
                            # A ValueError is raised when the distance is too large
                            except ValueError as Exception:
                                break

                            insert_values = [new_point, row[1]]
                            if self.chainage:
                                if self.percentage:
                                    insert_values += [line.queryPointAndDistance(new_point)[1], i]
                                else:
                                    insert_values += [cur_length, i]
                            insert_cursor.insertRow(insert_values)
                            i += 1

                            if numeric_distance:
                                cur_length += increment
                            else:
                                try:
                                    cur_length = next(dist_generator)
                                except StopIteration:
                                    break

                        # Add end point
                        if self.end_points:
                            end_point = line.positionAlongLine(1, True)
                            insert_values = [end_point, row[1]]
                            if self.chainage:
                                insert_values += [line.length, i]
                            insert_cursor.insertRow(insert_values)

        if out_fc_is_empty:
            arcpy.AddIDMessage('WARNING', 117)

        return

    def get_distances_from_str(self, distance_string, max_position):
        """ Yield distance values """

        distances = [float(i.strip().replace(',', '.'))
                     for i
                     in distance_string.strip(';').split(';')]

        distances.sort()

        # Only distances within the length, and that are positive
        distances = [j for j in distances if j < max_position and j >= 0]

        for distance in distances:
            yield distance

    def join_attributes(self):
        """ Join attributes from input """

        try:
            oid_name = get_OID_name(self.in_features)
            arcpy.management.JoinField(
                self.out_fc, self.fid_name, self.in_features, oid_name)
        except arcpy.ExecuteError:
            # In unlikely event that JoinField fails, proceed regardless
            pass

        return

    def add_spatial_index(self):
        """ Add spatial index """

        try:
            arcpy.management.AddSpatialIndex(self.out_fc)
        except arcpy.ExecuteError:
            pass

        return


if __name__ == '__main__':

    in_features = arcpy.GetParameterAsText(0)  # String
    out_fc = arcpy.GetParameterAsText(1)  # String

    # PERCENTAGE | DISTANCE | DISTANCE_FIELD
    point_placement = arcpy.GetParameterAsText(2)  # String
    distance = arcpy.GetParameterAsText(3)  # String
    percentage = arcpy.GetParameter(4) / 100  # Float
    end_points = arcpy.GetParameter(5)  # Boolean
    chainage = arcpy.GetParameter(6)  # Boolean
    distance_field = arcpy.GetParameterAsText(7)  # Boolean
    # PLANAR | GEODESIC
    distance_method = arcpy.GetParameterAsText(8)  # String

    PointsToLine(in_features, out_fc, point_placement, distance, percentage,
                 end_points, chainage, distance_field, distance_method)
