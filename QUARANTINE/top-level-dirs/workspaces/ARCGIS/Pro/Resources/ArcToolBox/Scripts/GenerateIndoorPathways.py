"""
COPYRIGHT 2020 ESRI

TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
Unpublished material - all rights reserved under the
Copyright Laws of the United States.

For additional information, contact:
Environmental Systems Research Institute, Inc.
Attn: Contracts Dept
380 New York Street
Redlands, California, USA 92373

email: contracts@esri.com

---------------------------------------------------------------------------
Source Name:   GenerateIndoorsPathways.py
Version:       ArcGIS Pro 2.6
Author:        Environmental Systems Research Institute Inc.
Description:   This script generates preliminary indoors pathways based on
               the navigation restrictions imposed by the input barrier
               detail lines and restricts generation of pathways to only
               authorized areas of travel.
---------------------------------------------------------------------------
"""

import arcpy
import datetime
import locale
import math
import numpy as np
import os
import uuid
import IndoorsUtilsModule


class LicenseError(Exception):
    pass


class GenerateIndoorsPathways(object):
    def __init__(self):
        # Define input layer constants
        self.FACILITY_ID_FIELD = "facility_id"
        self.FACILITY_ID_FIELD_TYPE = "String"
        self.FACILITY_NAME_FIELD = "facility_name"
        self.FACILITY_NAME_FIELD_TYPE = "String"
        self.LEVEL_ID_FIELD = "level_id"
        self.LEVEL_ID_FIELD_TYPE = "String"
        self.LEVEL_NAME_FIELD = "level_name"
        self.LEVEL_NAME_FIELD_TYPE = "String"
        self.LEVEL_NUMBER_FIELD = "level_number"
        self.LEVEL_NUMBER_FIELD_TYPE = "Long"
        self.ELEVATION_RELATIVE_FIELD = "elevation_relative"
        self.ELEVATION_RELATIVE_FIELD_TYPE = "Double"
        self.VERTICAL_ORDER_FIELD = "vertical_order"
        self.VERTICAL_ORDER_FIELD_TYPE = "Long"

        # Define constants unique to the levels layer
        self.LEVELS_LAYER_NAME_FIELD = "name"
        self.LEVELS_LAYER_NAME_FIELD_TYPE = "String"
        self.LEVELS_LAYER_SHORT_NAME_FIELD = "name_short"
        self.LEVELS_LAYER_SHORT_NAME_FIELD_TYPE = "String"

        self.FROM_FLOOR_FIELD = "level_name_from"
        self.FROM_FLOOR_FIELD_TYPE = "String"
        self.LENGTH_3D_FIELD = "length_3d"
        self.LENGTH_3D_FIELD_TYPE = "Double"
        self.WALL_DISTANCE_FIELD = "path_edge_distance"
        self.WALL_DISTANCE_FIELD_TYPE = "Double"

        isLegacyDataset = None
        indoorsDatasetName = None
        sdeQualifier = None

        self.execute()

    def findFields(self, fc, fn_list):
        try:
            field_names = [field.name.lower() for field in arcpy.ListFields(fc)]
            missing_fields = []
            for fn in fn_list:
                if fn not in field_names:
                    missing_fields.append(fn)

            return missing_fields
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180051)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180051)
            arcpy.AddError("{0}".format(e))
            return None

    def checkFieldTypeMatch(self, fc, field_list):
        try:
            problem_fields = []
            for field_info in field_list:
                field = field_info[0]
                f_type = field_info[1]
                for f in arcpy.ListFields(fc):
                    if f.baseName.lower() == field.lower():
                        if (f_type in ("Integer", "Long") and f.type not in ("Integer", "Long")) or \
                                (f_type in ("Float", "Double") and f.type not in ("Float", "Double")) or \
                                f_type == "String" and f.type != "String" or \
                                f_type not in ("Integer", "Long", "Float", "Double", "String"):
                            problem_fields.append([field, f_type])
            return problem_fields
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180052)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180052)
            arcpy.AddError("{0}".format(e))
            return None

    def verifyScratchWorkspace(self, scratch_gdb):
        verified = True
        try:
            test_table = arcpy.management.CreateTable(scratch_gdb, 'TEST_{}'.format(str(uuid.uuid4()).replace('-','_'))).getOutput(0)
            arcpy.management.Delete(test_table)
        except:
            verified = False
        finally:
            return verified

    def createScratchWorkspace(self):
        scratch_gdb = None
        try:
            temp_workspace = arcpy.env.scratchGDB
            path, file_name = os.path.split(temp_workspace)
            gdb_name = file_name.split('.')[0] + '{:%Y_%m_%d_%H%M%S}'.format(datetime.datetime.now())
            scratch_gdb = arcpy.management.CreateFileGDB(path, gdb_name).getOutput(0)
            if not self.verifyScratchWorkspace(scratch_gdb):
                arcpy.AddIDMessage("ERROR", 180053)
                return None

            return scratch_gdb
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180054)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180054)
            arcpy.AddError("{0}".format(e))
            return None

    def generateBuildingFootprint(self, scratch_gdb, floors, input_floors):
        building_footprint = None
        try:
            where_clause = "FACILITY_ID = '{}' AND LEVEL_ID IN (".format(floors[0][0])
            for floor in floors:
                where_clause = "{0}'{1}',".format(where_clause, floor[1])
            where_clause = where_clause.rstrip(',')
            where_clause = where_clause + ')'
            desc = arcpy.Describe(input_floors)
            temp_layer = arcpy.management.MakeFeatureLayer(input_floors, str(uuid.uuid4()), where_clause)
            building_footprint = arcpy.management.Dissolve(temp_layer, os.path.join(scratch_gdb,
                                                                                    'FOOTPRINT_{}'.format(str(uuid.uuid4()).replace('-', '_'))),
                                                                                    "FACILITY_ID", None, "MULTI_PART", "DISSOLVE_LINES").getOutput(0)
            arcpy.management.RecalculateFeatureClassExtent(building_footprint)
            arcpy.management.Delete(temp_layer)

            return building_footprint
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180055)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180055)
            arcpy.AddError("{0}".format(e))
            return None

    def generateMinimumBoundingGeometry(self, scratch_gdb, footprint):
        mbg = None
        rotation = None
        try:
            mbg = arcpy.management.MinimumBoundingGeometry(footprint, os.path.join(scratch_gdb,
                                                                                   'MBG_{}'.format(str(uuid.uuid4()).replace('-', '_'))),
                                                                                   "RECTANGLE_BY_AREA", "NONE", None, "MBG_FIELDS").getOutput(0)
            with arcpy.da.SearchCursor(mbg, ["SHAPE@", "MBG_Orientation"]) as cursor:
                for row in cursor:
                    rotation = round(row[1],2)

            return mbg, rotation
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180056)
            arcpy.AddError(arcpy.GetMessages(2))
            return None, None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180056)
            arcpy.AddError("{0}".format(e))
            return None, None

    def RotateXY(self, x, y, xc=0, yc=0, angle=0, units="DEGREES"):
        """Rotate an xy cooordinate about a specified origin

        x,y      xy coordinates
        xc,yc   center of rotation
        angle   angle
        units    "DEGREES" (default) or "RADIANS"
        """
        try:
            x = x - xc
            y = y - yc
            # make angle clockwise (like Rotate_management)
            angle = angle * -1
            if units == "DEGREES":
                angle = math.radians(angle)
            xr = (x * math.cos(angle)) - (y * math.sin(angle)) + xc
            yr = (x * math.sin(angle)) + (y * math.cos(angle)) + yc
            return xr, yr
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180057)
            arcpy.AddError("{0}".format(e))
            return None, None

    def rotatePolygon(self, geom, centroid, angle):
        """
        Creates a rotated polygon for the original polygon
        Performs a standard geometric transformation for rotation:

        Rotate Equation Used:
           Xn = cos(a)X ? sin(a)Y
           Yn = sin(a)X + cos(a)Y
        This is performed on all points that makeup the polygon geometry. The
        angle is a known value in degrees, and X and Y are the original
        coordinates.
        Inputs:
           geom - geometry object
           angle - angle in degrees
        output:
           arcpy.Polygon object
        """
        poly = None
        try:
            sr = geom.spatialReference
            parts = arcpy.Array()
            rings = arcpy.Array()
            ring = arcpy.Array()
            for i, part in enumerate(geom):
                for pnt in part:
                    if pnt:
                        x, y = self.RotateXY(pnt.X, pnt.Y, centroid.X, centroid.Y, angle)
                        if x is None or y is None:
                            return None
                        ring.add(arcpy.Point(x, y, pnt.ID))
                    else:
                        # if we have a ring, save it
                        if len(ring) > 0:
                            rings.add(ring)
                            ring.removeAll()
                # we have our last ring, add it
                rings.add(ring)
                ring.removeAll()
                # if only one, remove nesting
                if len(rings) == 1: rings = rings.getObject(0)
                parts.add(rings)
                rings.removeAll()
            poly = arcpy.Polygon(parts, sr)

            return poly
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180058)
            arcpy.AddError("{0}".format(e))
            return None

    def validateRotatedMinimumBoundingGeometry(self, scratch_gdb, rotated_boundary, bounding_geometry, buffered_boundary, buffered_bounding_geometry):
        # check to see if rotated shape contains the original bounding geometry
        try:
            with arcpy.da.SearchCursor(rotated_boundary, ["SHAPE@"]) as cur:
                    for row in cur:
                        rotated_shape = row[0]

            with arcpy.da.SearchCursor(bounding_geometry, ["SHAPE@"]) as cur:
                    for row in cur:
                        base_shape = row[0]

            if buffered_boundary is None:
                buffered_boundary = os.path.join(scratch_gdb, 'BUFFER_{}'.format(str(uuid.uuid4()).replace('-', '_')))
            if buffered_bounding_geometry is None:
                buffered_bounding_geometry = os.path.join(scratch_gdb, 'BUFFERED_BG_{}'.format(str(uuid.uuid4()).replace('-', '_')))

            # if it does, get its orientation
            if rotated_shape.contains(base_shape):
                orientation = -1
                if arcpy.Exists(buffered_bounding_geometry):
                    with arcpy.da.SearchCursor(buffered_bounding_geometry, ["SHAPE@", "MBG_Orientation"]) as b_cursor:
                        for row in b_cursor:
                            orientation = round(row[1], 2)
            # if not, buffer the bounding geoemtry by 20 meters and replace the rotated bounding geometry and retest
            else:
                if arcpy.Exists(buffered_boundary):
                    arcpy.management.TruncateTable(buffered_boundary)
                if arcpy.Exists(buffered_bounding_geometry):
                    arcpy.management.Delete(buffered_bounding_geometry)

                buffered_boundary = arcpy.analysis.Buffer(rotated_boundary, buffered_boundary,
                                                                       "20 Meters", "FULL", "FLAT", "ALL",
                                                                       None, "GEODESIC").getOutput(0)

                arcpy.management.MinimumBoundingGeometry(buffered_boundary, buffered_bounding_geometry, "RECTANGLE_BY_AREA", "NONE", None, "MBG_FIELDS")

                with arcpy.da.SearchCursor(buffered_bounding_geometry, ["SHAPE@"]) as cur:
                    for row in cur:
                        buffer_shape = row[0]

                with arcpy.da.UpdateCursor(rotated_boundary, ["SHAPE@"]) as cur:
                    for row in cur:
                        row[0] = buffer_shape
                        cur.updateRow(row)

                orientation = self.validateRotatedMinimumBoundingGeometry(scratch_gdb, rotated_boundary, bounding_geometry, buffered_boundary, buffered_bounding_geometry)[2]
                if orientation is None:
                    return None, None, None
            return buffered_boundary, buffered_bounding_geometry, orientation
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180059)
            arcpy.AddError(arcpy.GetMessages(2))
            return None, None, None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180059)
            arcpy.AddError("{0}".format(e))
            return None, None, None

    def generateRotatedMinimumBoundingGeometry(self, scratch_gdb, building_footprint, mbg, rotation, sr):
        shifted_boundary = None
        buffered_boundary = None
        buffered_bounding_geometry = None
        try:
            shape = None
            with arcpy.da.SearchCursor(mbg, ["SHAPE@"]) as cursor:
                for row in cursor:
                    shape = row[0]

            x_min = shape.extent.XMin
            x_max = shape.extent.XMax
            y_min = shape.extent.YMin
            y_max = shape.extent.YMax
            centroid = shape.centroid
            origin_point = arcpy.Point(x_min, y_min)
            # move polygon to point of origin first
            shift_x = centroid.X - origin_point.X
            shift_y = centroid.Y - origin_point.Y

            x_min_shift = x_min - shift_x
            x_max_shift = x_max - shift_x
            y_min_shift = y_min - shift_y
            y_max_shift = y_max - shift_y

            array = arcpy.Array([arcpy.Point(x_min_shift, y_min_shift),
                                 arcpy.Point(x_max_shift, y_min_shift),
                                 arcpy.Point(x_max_shift, y_max_shift),
                                 arcpy.Point(x_min_shift, y_max_shift)
                                 ])
            polygon = arcpy.Polygon(array)

            # Open an InsertCursor and insert the new geometry
            shifted_boundary = arcpy.management.CreateFeatureclass(scratch_gdb, 'SHIFTED_{}'.format(str(uuid.uuid4()).replace('-', '_')),
                                                                   "POLYGON", None, "DISABLED", "DISABLED", sr).getOutput(0)
            with arcpy.da.InsertCursor(shifted_boundary, ['SHAPE@']) as cur:
                cur.insertRow([polygon])
            with arcpy.da.SearchCursor(shifted_boundary, ["SHAPE@", '*', 'OID@']) as cur:
                for row in cur:
                    shp_shifted = row[0]
                    shp_centroid = row[0].centroid

            pivot_point = arcpy.Point(shp_shifted.extent.XMin, shp_shifted.extent.YMin)
            rotated_polygon = self.rotatePolygon(shp_shifted, pivot_point, locale.atof(rotation))
            if rotated_polygon is None:
                return None, None

            rotated_boundary = arcpy.management.CreateFeatureclass(scratch_gdb, 'ROTATED_{}'.format(str(uuid.uuid4()).replace('-', '_')),
                                                                   "POLYGON", None, "DISABLED", "DISABLED", sr).getOutput(0)

            with arcpy.da.InsertCursor(rotated_boundary, ['SHAPE@']) as cur:
                cur.insertRow([rotated_polygon])
            with arcpy.da.SearchCursor(rotated_boundary, ["SHAPE@", '*', 'OID@']) as cur:
                for row in cur:
                    rotated_centroid = row[0].centroid

            # calculate shift
            rshift_x = rotated_centroid.X - centroid.X
            rshift_y = rotated_centroid.Y - centroid.Y

            with arcpy.da.UpdateCursor(rotated_boundary, ['SHAPE@XY']) as cur:
                for row in cur:
                    cur.updateRow([[row[0][0] - rshift_x, row[0][1] - rshift_y]])

            # validate rotated bounding geometry fully contains the minimum bounding geometry
            buffered_boundary, buffered_bounding_geometry, orientation = self.validateRotatedMinimumBoundingGeometry(scratch_gdb, rotated_boundary, building_footprint, buffered_boundary, buffered_bounding_geometry)
            if buffered_boundary is None or buffered_bounding_geometry is None or orientation is None:
                return None, None

            if orientation == -1:
                boundary_buffer = arcpy.management.MinimumBoundingGeometry(rotated_boundary, buffered_bounding_geometry, "RECTANGLE_BY_AREA", "NONE", None,
                                                                           "MBG_FIELDS").getOutput(0)
                with arcpy.da.SearchCursor(boundary_buffer, ["SHAPE@", "MBG_Orientation"]) as cur:
                    for row in cur:
                        orientation = round(row[1], 2)

            return rotated_boundary, orientation
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180060)
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180060)
            arcpy.AddError("{0}".format(e))
        finally:
            try:
                if arcpy.Exists(mbg):
                    arcpy.Delete_management(mbg)
                if arcpy.Exists(shifted_boundary):
                    arcpy.Delete_management(shifted_boundary)
                if buffered_boundary is not None and arcpy.Exists(buffered_boundary):
                    arcpy.Delete_management(buffered_boundary)
                if buffered_bounding_geometry is not None and arcpy.Exists(buffered_bounding_geometry):
                    arcpy.Delete_management(buffered_bounding_geometry)
            except:
                pass

    def getOriginPoint(self, bounding_geometry):
        origin_point = None
        x_coordinate_array = None
        y_coordinate_array = None
        points_array = None
        try:
            points_array = []
            x_coordinate_array = []
            y_coordinate_array = []
            with arcpy.da.SearchCursor(bounding_geometry, ["OID@", "SHAPE@"]) as cur:
                for row in cur:
                    partnum = 0
                    for part in row[1]:
                        for pnt in part:
                            if pnt:
                                x_coordinate_array.append(pnt.X)
                                y_coordinate_array.append(pnt.Y)
                                points_array.append(pnt)
                        partnum += 1

            origin_point = points_array[0]
            opposite_corner = points_array[1]

            return origin_point, opposite_corner
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180061)
            arcpy.AddError(arcpy.GetMessages(2))
            return None, None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180061)
            arcpy.AddError("{0}".format(e))
            return None, None

    def calculateDistance(self, x1, y1, x2, y2):
        try:
            dist = math.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            return dist
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180062)
            arcpy.AddError("{0}".format(e))
            return None

    def getRowsAndCols(self, distance_array, lattice_density):
        try:
            rows = distance_array[0] / locale.atof(lattice_density)
            cols = distance_array[1] / locale.atof(lattice_density)
            return rows, cols
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180063)
            arcpy.AddError("{0}".format(e))
            return None, None

    def getYAxisPoint(self, bounding_geometry, lattice_density):
        float_value = None
        rows = None
        cols = None
        try:
            points_array = []

            with arcpy.da.SearchCursor(bounding_geometry, ["OID@", "SHAPE@"]) as cur:
                for row in cur:
                    # Print the current multipoint's ID
                    #
                    partnum = 0
                    for part in row[1]:
                        for idx, pnt in enumerate(part):
                            if idx <= 2:
                                points_array.append(pnt)
                        partnum += 1

            dis = {}
            distance_array = []
            for i, pnt in enumerate(points_array):
                if i < len(points_array) - 1:
                    pnt2 = points_array[i + 1]
                    dist = self.calculateDistance(pnt.X, pnt.Y, pnt2.X, pnt2.Y)
                    if dist is None:
                        return None, None
                    distance_array.append(dist)
                    dis["{0} {1} {2} {3}".format(pnt.X, pnt.Y, pnt2.X, pnt2.Y)] = dist

            val = next(iter(dis))
            float_value = val.split(' ')
            rows, cols = self.getRowsAndCols(distance_array, lattice_density)
            if rows is None or cols is None:
                return None, None

            return rows, cols
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180064)
            arcpy.AddError(arcpy.GetMessages(2))
            return None, None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180064)
            arcpy.AddError("{0}".format(e))
            return None, None

    def createInternalLines(self, scratch_gdb, clipped_lattice, sr):
        """
        Creates the X shaped lines inside the polygons
        Inputs:
           geom - arcpy.Polygon
        Ouput:
           list of insert data
        """
        internal_lines = None
        try:
            line_coords_array = []

            with arcpy.da.SearchCursor(clipped_lattice, ['SHAPE@']) as rows:
                for i, row in enumerate(rows):
                    geom = row[0]
                    center = geom.centroid
                    for part in geom:
                        for pnt in part:
                            if pnt:
                                line_coords_array.append([center.X, center.Y, pnt.X, pnt.Y])
                        del part
                    del geom
                    del center

            np_array = np.array(line_coords_array)
            struct_array = np.core.records.fromarrays(np_array.transpose(), np.dtype([('StartX', 'f8'), ('StartY', 'f8'),
                                                                                     ('EndX', 'f8'), ('EndY', 'f8')]))

            xy_table = os.path.join(scratch_gdb, 'XYTABLE_{}'.format(str(uuid.uuid4()).replace('-', '_')))
            arcpy.da.NumPyArrayToTable(struct_array, xy_table)

            if arcpy.Exists(xy_table):
                internal_lines = arcpy.management.XYToLine(xy_table, os.path.join(scratch_gdb, 'INTERNAL_{}'.format(str(uuid.uuid4()).replace('-', '_'))),
                                                           "StartX", "StartY", "EndX", "EndY", "GEODESIC", None, sr).getOutput(0)

            del line_coords_array
            del np_array
            del struct_array

            return internal_lines
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180065)
            arcpy.AddError(arcpy.GetMessages(2))
            return None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180065)
            arcpy.AddError("{0}".format(e))
            return None
        finally:
            try:
                if arcpy.Exists(xy_table):
                    arcpy.management.Delete(xy_table)
            except:
                pass

    def createTemplateLattice(self, scratch_gdb, input_floors, building_floors, lattice_rotation, lattice_density):
        building_footprint = None
        bounding_geometry = None
        template_lattice = None
        clipped_lattice = None
        lattice_lines = None
        internal_lines = None
        lattice = None
        try:
            # Merge floors to generate building footprint
            building_footprint = self.generateBuildingFootprint(scratch_gdb, building_floors, input_floors)
            if building_footprint is None:
                return None

            # Create minimum bounding geometry for merged levels to be used to calculate lattice rotation and initial
            # lattice generation
            bounding_geometry, rotation = self.generateMinimumBoundingGeometry(scratch_gdb, building_footprint)
            if bounding_geometry is None or rotation is None:
                return None

            # Calculate lattice rotation if not supplied by user
            desc = arcpy.Describe(input_floors)
            if lattice_rotation is None or lattice_rotation in ('', ' ', '#'):
                arcpy.AddIDMessage("INFORMATIVE", 180079, locale.str(rotation))
            else:
                arcpy.AddIDMessage("INFORMATIVE", 180080, str(lattice_rotation))
                bounding_geometry, rotation = self.generateRotatedMinimumBoundingGeometry(scratch_gdb, building_footprint, bounding_geometry, lattice_rotation, desc.spatialReference)
                if bounding_geometry is None or rotation is None:
                    return None

            # Calculate origin point of bounding geometry based on orientation
            origin_point, opposite_corner = self.getOriginPoint(bounding_geometry)
            if origin_point is None or opposite_corner is None:
                return None
            origin_point_coordinate = "%f %f" % (origin_point.X, origin_point.Y)
            y_axis_coordinate = "%f %f" % (opposite_corner.X, opposite_corner.Y)
            rows, cols = self.getYAxisPoint(bounding_geometry, lattice_density)
            if rows is None or cols is None:
                return None

            # Create the template lattice
            template_lattice = arcpy.management.CreateFishnet(os.path.join(scratch_gdb, 'FISHNET_{}'.format(str(uuid.uuid4()).replace('-', '_'))),
                                                              origin_point_coordinate, y_axis_coordinate, lattice_density,
                                                              lattice_density, rows, cols, "", "NO_LABELS", "", "POLYGON").getOutput(0)
            # Clip the template lattice by the bounding geometry
            clipped_lattice = arcpy.analysis.Clip(template_lattice, building_footprint,
                                                  os.path.join(scratch_gdb, 'CLIPPED_{}'.format(str(uuid.uuid4()).replace('-', '_')))).getOutput(0)
            lattice_lines = arcpy.management.FeatureToLine(clipped_lattice, os.path.join(scratch_gdb, 'FISHNETLINES_{}'.format(str(uuid.uuid4()).replace('-', '_'))),
                                                           "", "NO_ATTRIBUTES").getOutput(0)
            # Create lines to fill diagonal pathways within the lattice grid
            internal_lines = self.createInternalLines(scratch_gdb, clipped_lattice, desc.spatialReference)
            if internal_lines is None:
                return None
            # Megre lattice and internal lines
            lattice = arcpy.management.Merge([lattice_lines, internal_lines], os.path.join(scratch_gdb, 'TEMPLATTICE_{}'.format(str(uuid.uuid4()).replace('-', '_')))).getOutput(0)
            fields_to_add = []
            for f in arcpy.ListFields(input_floors):
                type = None
                if f.type not in ['Geometry', 'OID', 'Raster', 'Blob', 'GlobalID'] and \
                        (hasattr(desc, "areaFieldName") and f.name != desc.areaFieldName) and \
                        (hasattr(desc, 'lengthFieldName') and f.name != desc.lengthFieldName):
                    if f.type == 'String':
                        type = 'Text'
                    elif f.type == 'Integer':
                        type = 'Long'
                    elif f.type == 'SmallInteger':
                        type = 'Short'
                    else:
                        type = f.type
                    fields_to_add.append([f.name, type, f.aliasName, f.length, f.defaultValue, f.domain])
            arcpy.management.AddFields(lattice, fields_to_add)

            return lattice
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180066)
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180066)
            arcpy.AddError("{0}".format(e))
        finally:
            try:
                if arcpy.Exists(building_footprint):
                    arcpy.Delete_management(building_footprint)
                if arcpy.Exists(bounding_geometry):
                    arcpy.Delete_management(bounding_geometry)
                if arcpy.Exists(template_lattice):
                    arcpy.Delete_management(template_lattice)
                if arcpy.Exists(clipped_lattice):
                    arcpy.Delete_management(clipped_lattice)
                if arcpy.Exists(lattice_lines):
                    arcpy.Delete_management(lattice_lines)
                if arcpy.Exists(internal_lines):
                    arcpy.Delete_management(internal_lines)
            except:
                pass

    def getFloorAttributes(self, input_floors, building_id, floor_id):
        """
        Creates a dictionary of field values for each record in the input FC.  Excludes
        any system-generated fields. Also creates a list of ID values for this FC.
        """
        field_list = None
        floor_attributes = None
        level_name_short = None
        try:
            field_list = []
            # Create the field list, omitting certain field types/system-generated fields
            desc = arcpy.Describe(input_floors)
            for f in arcpy.ListFields(input_floors):
                if f.type not in ['Geometry', 'OID', 'Raster', 'Blob', 'GlobalID'] and \
                        (hasattr(desc, "areaFieldName") and f.name != desc.areaFieldName) and \
                        (hasattr(desc, 'lengthFieldName') and f.name != desc.lengthFieldName):
                    field_list.append(f.name.lower())

            # Retrieve index of the NAME_SHORT field.
            name_short_index = field_list.index('name_short')

            # Collect the floor's attributes
            where_clause = "{0} = '{1}' AND {2} = '{3}'".format(self.FACILITY_ID_FIELD, building_id, self.LEVEL_ID_FIELD, floor_id)
            with arcpy.da.SearchCursor(input_floors, field_list, where_clause) as cur:
                for row in cur:
                    floor_attributes = list(row)
                    level_name_short = row[name_short_index]

            return field_list, floor_attributes, level_name_short
        except arcpy.ExecuteError:
            arcpy.AddIDMessage("ERROR", 180067)
            arcpy.AddError(arcpy.GetMessages(2))
            return None, None, None
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180067)
            arcpy.AddError("{0}".format(e))
            return None, None, None

    def createFloorLattice(self, scratch_gdb, lattice, input_floors, building_id, floor_id, input_barriers, barrier_exp, restricted_spaces, restricted_spaces_exp, lattice_density, target_pathways):
        floor_lattice_clip = None
        lattice_full_3d = None
        try:
            # Create a copy of the template lattice for the floor
            # Clip the floor's lattice by the floor footprint
            temp_floor = arcpy.management.MakeFeatureLayer(input_floors, str(uuid.uuid4()), "{0} = '{1}' AND {2} = '{3}'".format(self.FACILITY_ID_FIELD, building_id, self.LEVEL_ID_FIELD, floor_id))
            floor_lattice_clip = arcpy.analysis.Clip(lattice, temp_floor, os.path.join(scratch_gdb, 'CLIP_{}'.format(str(uuid.uuid4()).replace('-', '_')))).getOutput(0)
            arcpy.management.Delete(temp_floor)

            # Calculate distance between pathway features and floorlines/interior spaces.
            # This distance field is referenced when configuring network dataset restrictions used
            # by the lattice thinning tool.
            floor_lattice_clip_lyr = arcpy.management.MakeFeatureLayer(floor_lattice_clip, str(uuid.uuid4()))

            if restricted_spaces is not None and restricted_spaces not in ('', ' ', '#'):
                desc = arcpy.Describe(restricted_spaces)
                #if self.isLegacyDataset:
                where_clause = desc.whereClause
                if where_clause != '':
                    where_clause = '({})'.format(where_clause)
                if restricted_spaces_exp is not None and restricted_spaces_exp not in ('', ' ', '#'):
                    where_clause = "{0} AND ({1})".format(where_clause, restricted_spaces_exp)
                if self.isLegacyDataset:
                    where_clause = "{0} AND ({1} = '{2}' AND {3} = '{4}')".format(where_clause, self.FACILITY_ID_FIELD, building_id, self.LEVEL_ID_FIELD, floor_id)
                    where_clause = where_clause.lstrip(' AND ')
                else:
                    where_clause = "{0} AND ({1} = '{2}')".format(where_clause, self.LEVEL_ID_FIELD, floor_id)
                    where_clause = where_clause.lstrip(' AND ')

                restricted_space_polys = arcpy.management.MakeFeatureLayer(restricted_spaces, str(uuid.uuid4()),
                                                                           where_clause)

                space_wc = "NEAR_DIST = 0"  # TO DO: add floor to query

                distance = 0.15
                unit_of_measure = desc.spatialReference.linearUnitName
                if unit_of_measure == "Foot":
                    distance = 0.5
                arcpy.analysis.Near(floor_lattice_clip, restricted_space_polys, str(distance))
                arcpy.management.SelectLayerByAttribute(floor_lattice_clip_lyr, "NEW_SELECTION", space_wc)
                arcpy.management.DeleteFeatures(floor_lattice_clip_lyr)
                arcpy.management.Delete(restricted_space_polys)

            desc = arcpy.Describe(input_barriers)
            where_clause = desc.whereClause
            if where_clause != '':
                where_clause = '({})'.format(where_clause)

            if barrier_exp is not None and barrier_exp not in ('', ' ', '#'):
                if where_clause:
                    where_clause = "({0}) AND ({1})".format(where_clause, barrier_exp)
                else:
                    where_clause = barrier_exp

            if self.isLegacyDataset:
                if where_clause:
                    where_clause = "({0}) AND ({1} = '{2}' AND {3} = '{4}')".format(where_clause, self.FACILITY_ID_FIELD, building_id, self.LEVEL_ID_FIELD, floor_id)
                else:
                    where_clause = "({0} = '{1}' AND {2} = '{3}')".format(self.FACILITY_ID_FIELD, building_id, self.LEVEL_ID_FIELD, floor_id)
                where_clause = where_clause.lstrip(' AND ')
            else:
                if where_clause:
                    where_clause = "({0}) AND ({1} = '{2}')".format(where_clause, self.LEVEL_ID_FIELD, floor_id)
                else:
                    where_clause = "({0} = '{1}')".format(self.LEVEL_ID_FIELD, floor_id)

            barrier_lines = arcpy.management.MakeFeatureLayer(input_barriers, str(uuid.uuid4()), where_clause)

            distance = 0.25
            unit_of_measure = desc.spatialReference.linearUnitName
            if unit_of_measure == "Foot":
                distance = 0.75
            wall_line_wc = "NEAR_DIST >= 0 AND NEAR_DIST <= " + str(distance)

            distance = 10
            if unit_of_measure == "Foot":
                distance = 30
            arcpy.analysis.Near(floor_lattice_clip, barrier_lines, str(distance))
            arcpy.management.SelectLayerByAttribute(floor_lattice_clip_lyr, "NEW_SELECTION", wall_line_wc)
            arcpy.management.DeleteFeatures(floor_lattice_clip_lyr)
            arcpy.management.Delete(barrier_lines)

            recalculate_lyr = arcpy.management.MakeFeatureLayer(floor_lattice_clip_lyr, str(uuid.uuid4()), "NEAR_DIST = -1")
            if int(arcpy.management.GetCount(recalculate_lyr).getOutput(0)) > 0:
                arcpy.management.Delete(recalculate_lyr)

            arcpy.management.Delete(floor_lattice_clip_lyr)

            # Delete short features (less than 95% of half the length of a lattice square's diagonal)
            length_field_name = arcpy.Describe(floor_lattice_clip).lengthFieldName
            short_segment_length = 0.95 * 0.5 * math.sqrt(2) * locale.atof(lattice_density)  # i.e., the length of a little less than half a diagonal
            short_features = arcpy.management.MakeFeatureLayer(floor_lattice_clip, str(uuid.uuid4()), length_field_name + " < " + str(short_segment_length))
            if int(arcpy.management.GetCount(short_features).getOutput(0)) > 0:
                arcpy.management.DeleteFeatures(short_features)
            arcpy.management.Delete(short_features)

            # Collect the floor attributes to populate into the lattice feature fields
            field_list, floor_attributes, level_name_short = self.getFloorAttributes(input_floors, building_id, floor_id)
            if field_list is None or floor_attributes is None or level_name_short is None:
                return False
            # Add floor features' attributes to the lattice attribute table
            with arcpy.da.UpdateCursor(floor_lattice_clip, field_list) as cur:
                for row in cur:
                    row = floor_attributes
                    cur.updateRow(row)

            # Apply z-values to final
            #Write a function to get a dictionary {levelid:elevation} using the level feature class.Add a field and populate it.
            levelidElevation = IndoorsUtilsModule.getRelativeElevationFromLevels(input_floors)
            facilityIDToNameDict = self.facilityIDToNameDict(input_floors)

            if not self.isLegacyDataset:
                arcpy.management.AddField(floor_lattice_clip, self.ELEVATION_RELATIVE_FIELD, "DOUBLE")
                arcpy.management.AddField(floor_lattice_clip, self.FACILITY_NAME_FIELD, "TEXT")

            with arcpy.da.UpdateCursor(floor_lattice_clip, ["LEVEL_ID", self.ELEVATION_RELATIVE_FIELD, self.FACILITY_ID_FIELD, self.FACILITY_NAME_FIELD]) as cur:
                for row in cur:
                    levelid = row[0]
                    if levelid and levelid in levelidElevation:
                        relativeElevation = levelidElevation[levelid]
                        row[1] = relativeElevation
                    facilityid = row[2]
                    if facilityid and facilityid in facilityIDToNameDict:
                        facility_name = facilityIDToNameDict[facilityid]
                        row[3] = facility_name
                    cur.updateRow(row)

            #Get elevation from level features at this levelID, and apply that to all features in floor_lattice_clip
            elevationField = self.ELEVATION_RELATIVE_FIELD
            lattice_full_3d = arcpy.FeatureTo3DByAttribute_3d(floor_lattice_clip,
                                                              os.path.join(scratch_gdb, 'LATTICEFULL_{}'.format(str(uuid.uuid4()).replace('-', '_'))),
                                                              elevationField)

            # Load features into PrelimPathways
            arcpy.AddIDMessage("INFORMATIVE", 180078, target_pathways)

            field_mappings = arcpy.FieldMappings()
            field_mappings.addTable(target_pathways)
            fm_height = arcpy.FieldMap()
            fm_level_short_name = arcpy.FieldMap()
            fm_vertical_order = arcpy.FieldMap()
            fm_building_id = arcpy.FieldMap()
            fm_facility_name = arcpy.FieldMap()
            fm_wall_distance = arcpy.FieldMap()
            fm_level_id = arcpy.FieldMap()

            fm_height.addInputField(lattice_full_3d, self.ELEVATION_RELATIVE_FIELD)
            fm_level_short_name.addInputField(lattice_full_3d, self.LEVELS_LAYER_SHORT_NAME_FIELD)
            fm_building_id.addInputField(lattice_full_3d, self.FACILITY_ID_FIELD)
            fm_facility_name.addInputField(lattice_full_3d, self.FACILITY_NAME_FIELD)
            fm_vertical_order.addInputField(lattice_full_3d, self.VERTICAL_ORDER_FIELD)
            fm_wall_distance.addInputField(lattice_full_3d, "NEAR_DIST")
            fm_level_id.addInputField(lattice_full_3d, self.LEVEL_ID_FIELD)

            #field_name = fm_height.outputField
            #field_name.name = self.FROM_HEIGHT_FIELD
            #fm_height.outputField = field_name

            field_name = fm_level_short_name.outputField
            field_name.name = self.FROM_FLOOR_FIELD
            fm_level_short_name.outputField = field_name

            field_name = fm_building_id.outputField
            field_name.name = self.FACILITY_ID_FIELD
            fm_building_id.outputField = field_name

            field_name = fm_facility_name.outputField
            field_name.name = self.FACILITY_NAME_FIELD
            fm_facility_name.outputField = field_name

            field_name = fm_vertical_order.outputField
            field_name.name = self.VERTICAL_ORDER_FIELD
            fm_vertical_order.outputField = field_name

            field_name = fm_wall_distance.outputField
            field_name.name = self.WALL_DISTANCE_FIELD
            fm_wall_distance.outputField = field_name

            field_name = fm_level_id.outputField
            field_name.name = self.LEVEL_ID_FIELD
            fm_level_id.outputField = field_name

            #field_mappings.addFieldMap(fm_height)
            field_mappings.addFieldMap(fm_level_short_name)
            field_mappings.addFieldMap(fm_building_id)
            field_mappings.addFieldMap(fm_facility_name)
            field_mappings.addFieldMap(fm_vertical_order)
            field_mappings.addFieldMap(fm_wall_distance)
            field_mappings.addFieldMap(fm_level_id)

            #delete features from existing prelim pathways first and snap to floor transitions
            #snapToFloorTransitions = False
            where_clause = "{0} = '{1}' AND {2} = '{3}'".format(self.FACILITY_ID_FIELD, building_id, self.FROM_FLOOR_FIELD, level_name_short)
            select_lyr = arcpy.management.MakeFeatureLayer(target_pathways, str(uuid.uuid4()))
            arcpy.management.SelectLayerByAttribute(select_lyr, 'NEW_SELECTION', where_clause)
            if (int(arcpy.management.GetCount(select_lyr).getOutput(0)) > 0):
                #    snapToFloorTransitions = True
                arcpy.management.DeleteFeatures(select_lyr)

            arcpy.management.Append(lattice_full_3d, target_pathways, "NO_TEST", field_mappings)

            # Calculate Length_3D
            arcpy.management.SelectLayerByAttribute(select_lyr, 'NEW_SELECTION', where_clause)
            arcpy.CalculateField_management(select_lyr, self.LENGTH_3D_FIELD, "!SHAPE!.length3D", "PYTHON3")
            arcpy.management.Delete(select_lyr)
            return True
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 180068)
            arcpy.AddError("{0}".format(e))
            return False
        finally:
            try:
                if arcpy.Exists(floor_lattice_clip):
                   arcpy.Delete_management(floor_lattice_clip)
                if arcpy.Exists(lattice_full_3d):
                    arcpy.Delete_management(lattice_full_3d)
            except:
                pass

    def validateSpatialReference(self, input_floors, input_barriers, target_pathways, restricted_spaces):
        #find if spatial ref validation failed and return that value
        validation_failed = False
        fc_paths = []
        if input_floors.strip():
            input_floors_path = arcpy.Describe(input_floors).catalogPath
            fc_paths.append(input_floors_path)
        if input_barriers.strip():
            input_barriers_path = arcpy.Describe(input_barriers).catalogPath
            fc_paths.append(input_barriers_path)
        if target_pathways.strip():
            target_pathways_path = arcpy.Describe(target_pathways).catalogPath
            fc_paths.append(target_pathways_path)
        if restricted_spaces.strip():
            restricted_spaces_path = arcpy.Describe(restricted_spaces).catalogPath
            fc_paths.append(restricted_spaces_path)

        sr = None
        sr_type = None

        for i, fc in enumerate(fc_paths):
            if fc is not None and fc not in ('', ' ', '#'):
                sr_compare = arcpy.Describe(fc).spatialReference
                if sr_compare.type == "Geographic":
                    sr_type = "Geographic"
                if sr is None:
                    sr = sr_compare
                elif sr.name != sr_compare.name:
                    arcpy.AddIDMessage("ERROR", 546)
                    validation_failed = True
                    break

        if sr_type is not None and sr_type == "Geographic":
            arcpy.AddIDMessage("ERROR", 45063)
            validation_failed = True
        return validation_failed

    def execute(self):
        target_pathways = None
        lattice = None
        validation_failed = False

        try:
            # Extension license check
            if arcpy.CheckExtension("3D") == "Available":
                arcpy.CheckOutExtension("3D")
            else:
                raise LicenseError

            # You must have an Advanced License to run this tool.
            minimum_advanced_license = ["ArcInfo", "ArcServer"]
            if arcpy.ProductInfo() not in minimum_advanced_license:
                raise LicenseError

            # Get and validate input parameters
            input_floors = arcpy.GetParameterAsText(0)
            input_barriers = arcpy.GetParameterAsText(1)
            target_pathways = arcpy.GetParameterAsText(2)
            restricted_spaces = arcpy.GetParameterAsText(5)

            validation_failed = self.validateSpatialReference(input_floors, input_barriers, target_pathways, restricted_spaces)
            if validation_failed:
                return

            databaseProps = IndoorsUtilsModule.getDatabasePropertiesUsingLevelsFeatureClass(input_floors)
            self.isLegacyDataset = databaseProps["isLegacyDataset"]
            self.indoorsDatasetName = databaseProps["indoorsDatasetName"]
            self.sdeQualifier = databaseProps["sdeQualifier"]

            if input_floors is not None and input_floors not in ('', ' ', '#'):
                input_floors = arcpy.management.MakeFeatureLayer(input_floors, str(uuid.uuid4()))
                if not arcpy.Exists(input_floors):
                    arcpy.AddIDMessage("ERROR", 110, input_floors)
                    validation_failed = True
                elif self.isLegacyDataset:
                    missing_fields = self.findFields(input_floors, [self.FACILITY_ID_FIELD,
                                                                    self.FACILITY_NAME_FIELD,
                                                                    self.LEVEL_ID_FIELD,
                                                                    self.LEVELS_LAYER_NAME_FIELD,
                                                                    self.LEVELS_LAYER_SHORT_NAME_FIELD,
                                                                    self.LEVEL_NUMBER_FIELD,
                                                                    self.ELEVATION_RELATIVE_FIELD,
                                                                    self.VERTICAL_ORDER_FIELD])
                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(input_floors).name, missing_field)
                            validation_failed = True
                    field_type_errors = self.checkFieldTypeMatch(input_floors, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                [self.LEVEL_ID_FIELD, self.LEVEL_ID_FIELD_TYPE],
                                                                                [self.LEVELS_LAYER_NAME_FIELD, self.LEVELS_LAYER_NAME_FIELD_TYPE],
                                                                                [self.LEVELS_LAYER_SHORT_NAME_FIELD, self.LEVELS_LAYER_SHORT_NAME_FIELD_TYPE],
                                                                                [self.LEVEL_NUMBER_FIELD, self.LEVEL_NUMBER_FIELD_TYPE],
                                                                                [self.ELEVATION_RELATIVE_FIELD, self.ELEVATION_RELATIVE_FIELD_TYPE],
                                                                                [self.VERTICAL_ORDER_FIELD, self.VERTICAL_ORDER_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(input_floors).name)
                            validation_failed = True
            #input_barriers = arcpy.GetParameterAsText(1)
            if input_barriers is not None and input_barriers not in ('', ' ', '#'):
                input_barriers = arcpy.management.MakeFeatureLayer(input_barriers, str(uuid.uuid4()))
                if not arcpy.Exists(input_barriers):
                    arcpy.AddIDMessage("ERROR", 110, input_barriers)
                    validation_failed = True
                elif self.isLegacyDataset:
                    missing_fields = self.findFields(input_barriers, [self.FACILITY_ID_FIELD,
                                                                      self.FACILITY_NAME_FIELD,
                                                                      self.LEVEL_ID_FIELD,
                                                                      self.LEVEL_NAME_FIELD,
                                                                      self.LEVEL_NUMBER_FIELD,
                                                                      self.ELEVATION_RELATIVE_FIELD,
                                                                      self.VERTICAL_ORDER_FIELD])
                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(input_barriers).name, missing_field)
                            validation_failed = True
                    field_type_errors = self.checkFieldTypeMatch(input_barriers, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                  [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                  [self.LEVEL_ID_FIELD, self.LEVEL_ID_FIELD_TYPE],
                                                                                  [self.LEVEL_NAME_FIELD, self.LEVEL_NAME_FIELD_TYPE],
                                                                                  [self.LEVEL_NUMBER_FIELD, self.LEVEL_NUMBER_FIELD_TYPE],
                                                                                  [self.ELEVATION_RELATIVE_FIELD, self.ELEVATION_RELATIVE_FIELD_TYPE],
                                                                                  [self.VERTICAL_ORDER_FIELD, self.VERTICAL_ORDER_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(input_barriers).name, field_error[1])
                            validation_failed = True
            #target_pathways = arcpy.GetParameterAsText(2)
            if target_pathways is not None and target_pathways not in ('', ' ', '#'):
                desc = arcpy.Describe(target_pathways)
                #target_pathways = desc.catalogPath
                if not arcpy.Exists(target_pathways):
                    arcpy.AddIDMessage("ERROR", 110, target_pathways)
                    validation_failed = True
                elif self.isLegacyDataset:
                    missing_fields = self.findFields(target_pathways, [self.FACILITY_ID_FIELD,
                                                                       self.FACILITY_NAME_FIELD,
                                                                       self.VERTICAL_ORDER_FIELD,
                                                                       self.FROM_FLOOR_FIELD,
                                                                       self.LENGTH_3D_FIELD,
                                                                       self.WALL_DISTANCE_FIELD])
                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(target_pathways).name, missing_field)
                            validation_failed = True
                    field_type_errors = self.checkFieldTypeMatch(target_pathways, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                   [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                   [self.VERTICAL_ORDER_FIELD, self.VERTICAL_ORDER_FIELD_TYPE],
                                                                                   [self.FROM_FLOOR_FIELD, self.FROM_FLOOR_FIELD_TYPE],
                                                                                   [self.LENGTH_3D_FIELD, self.LENGTH_3D_FIELD_TYPE],
                                                                                   [self.WALL_DISTANCE_FIELD, self.WALL_DISTANCE_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(target_pathways).name, field_error[1])
                            validation_failed = True

                # determine if target pathways has LEVEL_ID field or not
                transfer_level_ids = False
                if validation_failed == False:
                    missing_level_id_field = IndoorsUtilsModule.findFields(target_pathways, [self.LEVEL_ID_FIELD])
                    if len(missing_level_id_field) == 0:

                        # not missing, so check the data type
                        # only care if it's valid - in which case we'll transfer level id values to pathways.
                        # if it's not the valid data type, the tool won't care (i.e., don't fail), just don't try to transfer values
                        level_id_field_type_errors = IndoorsUtilsModule.checkFieldTypeMatch(target_pathways, [[self.LEVEL_ID_FIELD, self.LEVEL_ID_FIELD_TYPE]])
                        if len(level_id_field_type_errors) == 0:
                            # have valid LEVEL_ID field - okay to transfer values
                            transfer_level_ids = True

            lattice_rotation = arcpy.GetParameterAsText(3)
            if lattice_rotation is not None and lattice_rotation not in ('', ' ', '#'):
                if locale.atof(lattice_rotation) < 0 or locale.atof(lattice_rotation) > 180:
                    arcpy.AddIDMessage("ERROR", 854, 0, 180)
                    validation_failed = True
            lattice_density = arcpy.GetParameterAsText(4)
            if lattice_density is not None and lattice_density not in ('', ' ', '#'):
                if locale.atof(lattice_density) < 0.25 or locale.atof(lattice_density) > 2.9:
                    arcpy.AddIDMessage("ERROR", 854, locale.atof("0.25"), locale.atof("2.9"))
                    validation_failed = True
            else:
                lattice_density = locale.str(0.6)
            #restricted_spaces = arcpy.GetParameterAsText(5)
            if restricted_spaces is not None and restricted_spaces not in ('', ' ', '#'):
                restricted_spaces = arcpy.management.MakeFeatureLayer(restricted_spaces, str(uuid.uuid4()))
                if not arcpy.Exists(input_barriers):
                    arcpy.AddIDMessage("ERROR", 110, input_barriers)
                    validation_failed = True
                elif self.isLegacyDataset:
                    missing_fields = self.findFields(restricted_spaces, [self.FACILITY_ID_FIELD,
                                                                         self.FACILITY_NAME_FIELD,
                                                                         self.LEVEL_ID_FIELD,
                                                                         self.LEVEL_NAME_FIELD,
                                                                         self.LEVEL_NUMBER_FIELD,
                                                                         self.ELEVATION_RELATIVE_FIELD,
                                                                         self.VERTICAL_ORDER_FIELD])
                    if len(missing_fields) > 0:
                        for missing_field in missing_fields:
                            arcpy.AddIDMessage("ERROR", 1000, arcpy.Describe(restricted_spaces).name, missing_field)
                            validation_failed = True
                    field_type_errors = self.checkFieldTypeMatch(restricted_spaces, [[self.FACILITY_ID_FIELD, self.FACILITY_ID_FIELD_TYPE],
                                                                                     [self.FACILITY_NAME_FIELD, self.FACILITY_NAME_FIELD_TYPE],
                                                                                     [self.LEVEL_ID_FIELD, self.LEVEL_ID_FIELD_TYPE],
                                                                                     [self.LEVEL_NAME_FIELD, self.LEVEL_NAME_FIELD_TYPE],
                                                                                     [self.LEVEL_NUMBER_FIELD, self.LEVEL_NUMBER_FIELD_TYPE],
                                                                                     [self.ELEVATION_RELATIVE_FIELD, self.ELEVATION_RELATIVE_FIELD_TYPE],
                                                                                     [self.VERTICAL_ORDER_FIELD, self.VERTICAL_ORDER_FIELD_TYPE]])
                    if len(field_type_errors) > 0:
                        for field_error in field_type_errors:
                            arcpy.AddIDMessage("ERROR", 180075, field_error[0], arcpy.Describe(restricted_spaces).name, field_error[1])
                            validation_failed = True
            restricted_spaces_exp = arcpy.GetParameterAsText(6)
            if restricted_spaces_exp is not None and restricted_spaces_exp not in ('', ' ', '#'):
                try:
                    arcpy.management.MakeFeatureLayer(restricted_spaces, str(uuid.uuid4()), restricted_spaces_exp)
                except:
                    arcpy.AddIDMessage("ERROR", 358)
                    validation_failed = True
            barrier_exp = arcpy.GetParameterAsText(7)
            if barrier_exp is not None and barrier_exp not in ('', ' ', '#'):
                try:
                    arcpy.management.MakeFeatureLayer(input_barriers, str(uuid.uuid4()), barrier_exp)
                except:
                    arcpy.AddIDMessage("ERROR", 358)
                    validation_failed = True

            if validation_failed:
                return

            # Set scratch workspace
            arcpy.env.overwriteOutput = True
            scratch_gdb = arcpy.env.scratchGDB
            if scratch_gdb is not None and scratch_gdb != '' and scratch_gdb != ' ' and scratch_gdb != '#':
                if not self.verifyScratchWorkspace(scratch_gdb):
                    scratch_gdb = self.createScratchWorkspace()
            else:
                scratch_gdb = self.createScratchWorkspace()

            # Identify levels and buildings to process
            buildings_to_process = []
            floors_to_process = []
            with arcpy.da.SearchCursor(input_floors, ['FACILITY_ID', 'LEVEL_ID', 'LEVEL_NUMBER'],
                                       sql_clause=(None, 'ORDER BY FACILITY_ID, LEVEL_NUMBER')) as cur:
                for row in cur:
                    if row[0] not in buildings_to_process:
                        buildings_to_process.append(row[0])
                    floors_to_process.append([row[0], row[1]])
            if len(buildings_to_process) > 0:
                if len(buildings_to_process) == 1:
                    arcpy.AddIDMessage("INFORMATIVE", 180074, len(floors_to_process))
                else:
                    arcpy.AddIDMessage("INFORMATIVE", 180073, len(buildings_to_process), len(floors_to_process))
            else:
                arcpy.AddIDMessage("ERROR", 180069, arcpy.GetParameterAsText(0))

            # Begin pathway generation by building
            for building in buildings_to_process:
                arcpy.AddIDMessage("INFORMATIVE", 180076, building)

                # Build list of floors to process for target building
                building_floors = []
                for floor in floors_to_process:
                    if floor[0] == building:
                        building_floors.append(floor)

                # Verify that each floor has barrier lines, skip floor if no barrier lines exist
                desc = arcpy.Describe(input_barriers)
                i = 0
                while i < len(building_floors):
                    floor = building_floors[i]

                    # Construct barrier where clause for floor
                    where_clause = desc.whereClause
                    if where_clause != '':
                        where_clause = '({})'.format(where_clause)
                    if barrier_exp is not None and barrier_exp not in ('', ' ', '#'):
                        where_clause = "{0} AND ({1})".format(where_clause, barrier_exp)
                    if self.isLegacyDataset:
                        where_clause = "{0} AND (FACILITY_ID = '{1}' AND LEVEL_ID = '{2}')".format(where_clause, building, floor[1])
                        where_clause = where_clause.lstrip(' AND ')
                    else:
                        where_clause = "{0} AND (LEVEL_ID = '{1}')".format(where_clause, floor[1])
                        where_clause = where_clause.lstrip(' AND ')

                    # Verify barrier line feature count and remove floor from processing list if necessary
                    validate_barrier_count = arcpy.management.MakeFeatureLayer(input_barriers, str(uuid.uuid4()), where_clause)
                    if int(arcpy.management.GetCount(validate_barrier_count).getOutput(0)) < 1:
                        arcpy.AddIDMessage("WARNING", 180072, floor[1])
                        building_floors.pop(i)
                    else:
                        i += 1
                    arcpy.management.Delete(validate_barrier_count)

                # Continue lattice generation for one building at a time
                if len(building_floors) > 0:
                    # Create template lattice for building
                    lattice = self.createTemplateLattice(scratch_gdb, input_floors, building_floors,
                                                         lattice_rotation, lattice_density)
                    if lattice is None:
                        arcpy.AddIDMessage("ERROR", 180070)
                        return
                    for floor in building_floors:
                        arcpy.AddIDMessage("INFORMATIVE", 180077, floor[1])
                        if not self.createFloorLattice(scratch_gdb, lattice, input_floors, building, floor[1], input_barriers,
                                                barrier_exp, restricted_spaces, restricted_spaces_exp,
                                                lattice_density, target_pathways):
                            return
                else:
                    arcpy.AddIDMessage("WARNING", 180071, building)
        except LicenseError as e:
            # You must have an Advanced license and a 3D Analyst license to run this tool.
            arcpy.AddIDMessage("ERROR", 180003)
        except arcpy.ExecuteError:
            arcpy.AddError(arcpy.GetMessages(2))
        except Exception as e:
            arcpy.AddIDMessage("ERROR", 999998)
            arcpy.AddError("{0}".format(e))
        finally:
            try:
                if target_pathways is not None:
                    arcpy.SetParameter(8, target_pathways)
                if arcpy.Exists(lattice):
                    arcpy.Delete_management(lattice)
            except:
                pass
            try:
                arcpy.CheckInExtension("Indoors")
                arcpy.CheckInExtension('3D')
            except:
                pass
            return

    def facilityIDToNameDict(self, levels_fc):
        if not levels_fc:
            return {}
        # Get workspace
        indoors_gdb = IndoorsUtilsModule.getWorkspacePath(levels_fc)
        ds = self.indoorsDatasetName
        sdeQualifier = self.sdeQualifier
        facilities_fc = os.path.join(indoors_gdb, sdeQualifier + ds, sdeQualifier + "facilities")
        if not arcpy.Exists(facilities_fc):
            return {}
        facilityidNameDict = self.createDictionary(facilities_fc, "FACILITY_ID", "NAME")
        return facilityidNameDict

    def createDictionary(self, fc, keyField, valueField):
        if not fc:
            return {}
        fields = arcpy.ListFields(fc)
        fieldNames = [field.name for field in fields]
        if keyField.upper() not in fieldNames or valueField.upper() not in fieldNames:
            return {}
        dict = {}
        with arcpy.da.SearchCursor(fc, [keyField, valueField]) as cursor:
            for row in cursor:
                if row[0]:
                    dict[row[0]] = row[1]
        return dict

if __name__ == '__main__':
    GenerateIndoorsPathways()
