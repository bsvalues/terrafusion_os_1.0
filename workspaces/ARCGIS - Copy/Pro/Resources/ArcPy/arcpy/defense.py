# COPYRIGHT 2013-2024 ESRI
#
# TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
# Unpublished material - all rights reserved under the
# Copyright Laws of the United States.
#
# For additional information, contact:
# Environmental Systems Research Institute, Inc.
# Attn: Contracts Dept
# 380 New York Street
# Redlands, California, USA 92373
#
# email: contracts@esri.com
r"""The Defense toolbox provides a collection of geoprocessing tools that
enable the automation of analytical processes and workflows for
determining location, distance, range, and visibility."""
from __future__ import annotations

__all__ = [
    "CoordinateTableTo2PointLine",
    "CoordinateTableToEllipse",
    "CoordinateTableToLineOfBearing",
    "CoordinateTableToPoint",
    "CoordinateTableToPolygon",
    "CoordinateTableToPolyline",
    "FindHighestLowestPoint",
    "FindLocalPeaksValleys",
    "GenerateCoordinateNotations",
    "GenerateGRGFromArea",
    "GenerateGRGFromPoint",
    "GenerateRangeFans",
    "GenerateRangeFansFromFeatures",
    "GenerateRangeRings",
    "GenerateRangeRingsFromFeatures",
    "GenerateRangeRingsFromTable",
    "GenerateReferenceSystemGRGFromArea",
    "LetterFeatures",
    "LetterIntersections",
    "LinearLineOfSight",
    "NumberFeatures",
    "NumberFeaturesBySector",
    "RadialLineOfSight",
    "RadialLineOfSightAndRange",
]
__alias__ = "defense"
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from typing import Literal
    from arcpy import RecordSet, FeatureSet
    from arcpy._mp import Layer, Table
    from arcpy.typing.gp import Result, Result1, Result2, Result3


# Conversion toolset
@gptooldoc("CoordinateTableTo2PointLine_defense", None)
def CoordinateTableTo2PointLine(
    in_table=None,
    out_feature_class=None,
    start_x_or_lon_field=None,
    end_x_or_lon_field=None,
    in_coordinate_format: Literal[
        "DD_1", "DD_2", "DDM_1", "DDM_2", "DMS_1", "DMS_2", "GARS", "GEOREF", "UTM_BANDS", "UTM_ZONES", "USNG", "MGRS"
    ]
    | None = None,
    start_y_or_lat_field=None,
    end_y_or_lat_field=None,
    line_type: Literal["GEODESIC", "GREAT_CIRCLE", "RHUMB_LINE", "NORMAL_SECTION"] | None = None,
    coordinate_system=None,
) -> Result1[str]:
    """CoordinateTableTo2PointLine_defense(in_table, out_feature_class, start_x_or_lon_field, end_x_or_lon_field, in_coordinate_format, {start_y_or_lat_field}, {end_y_or_lat_field}, {line_type}, {coordinate_system})

       Creates 2-point line features from coordinates stored in a table.

    INPUTS:
     in_table (Table View):
         The table containing the source coordinates.
     start_x_or_lon_field (Field):
         The field in the input table containing the starting x or longitude
         coordinates.
     end_x_or_lon_field (Field):
         The field in the input table containing the ending x or longitude
         coordinates.
     in_coordinate_format (String):
         Specifies the format of the point coordinates.DD_1-Coordinates will be
         formatted in a decimal degrees coordinate
         pair stored in a single field with coordinates separated by a space,
         comma, or slash.DD_2-Coordinates will be formatted in a decimal
         degrees coordinate
         pair stored in two table fields. This is the default.DDM_1-Coordinates
         will be formatted in a degrees and decimal minutes
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DDM_2-Coordinates will be
         formatted in a degrees and decimal minutes
         coordinate pair stored in two table fields.DMS_1-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DMS_2-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in two table fields.GARS-Coordinates will be
         formatted in Global Area Reference System.GEOREF-Coordinates will be
         formatted in World Geographic Reference
         System.UTM_BANDS-Coordinates will be formatted in Universal Transverse
         Mercator coordinate bands.UTM_ZONES-Coordinates will be formatted in
         Universal Transverse
         Mercator coordinate zones.USNG-Coordinates will be formatted in United
         States National Grid.MGRS-Coordinates will be formatted in Military
         Grid Reference System.
     start_y_or_lat_field {Field}:
         The field in the input table containing the starting y or latitude
         coordinates.The start_y_or_lat_field parameter is used when the
         in_coordinate_format parameter is set to DD_2, DDM_2, or DMS_2.
     end_y_or_lat_field {Field}:
         The field in the input table containing the ending y or latitude
         coordinates.The end_y_or_lat_field parameter is used when the
         in_coordinate_format
         parameter is set to DD_2, DDM_2, or DMS_2.
     line_type {String}:
         Specifies the output line type.GEODESIC-The shortest distance between
         any two points on the earth's
         spheroidal surface (ellipsoid) will be used. This is the
         default.GREAT_CIRCLE-The line on a spheroid (ellipsoid) defined by the
         intersection of a plane passing through the center of the spheroid
         will be used.RHUMB_LINE-A line of constant bearing or azimuth will be
         used.NORMAL_SECTION-A normal plane to the earth's ellipsoidal surface
         containing the start and end points will be used.
     coordinate_system {Spatial Reference}:
         The spatial reference of the output feature class. The default is
         GCS_WGS_1984.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the output line features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CoordinateTableTo2PointLine_defense(
                *gp_fixargs(
                    (
                        in_table,
                        out_feature_class,
                        start_x_or_lon_field,
                        end_x_or_lon_field,
                        in_coordinate_format,
                        start_y_or_lat_field,
                        end_y_or_lat_field,
                        line_type,
                        coordinate_system,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CoordinateTableToEllipse_defense", None)
def CoordinateTableToEllipse(
    in_table=None,
    out_feature_class=None,
    x_or_lon_field=None,
    major_field=None,
    minor_field=None,
    in_coordinate_format: Literal[
        "DD_1", "DD_2", "DDM_1", "DDM_2", "DMS_1", "DMS_2", "GARS", "GEOREF", "UTM_BANDS", "UTM_ZONES", "USNG", "MGRS"
    ]
    | None = None,
    distance_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
    y_or_lat_field=None,
    azimuth_field=None,
    azimuth_units: Literal["DEGREES", "MILS", "RADS", "GRADS"] | None = None,
    coordinate_system=None,
) -> Result1[str]:
    """CoordinateTableToEllipse_defense(in_table, out_feature_class, x_or_lon_field, major_field, minor_field, in_coordinate_format, {distance_units}, {y_or_lat_field}, {azimuth_field}, {azimuth_units}, {coordinate_system})

       Creates ellipse features from coordinates stored in a table and input
       data values.

    INPUTS:
     in_table (Table View):
         The table containing the source coordinates.
     x_or_lon_field (Field):
         The field in the input table containing the x or longitude
         coordinates.
     major_field (Field):
         The field in the input table containing the major axis values.
     minor_field (Field):
         The field in the input table containing the minor axis values.
     in_coordinate_format (String):
         Specifies the format of the input table coordinates.DD_1-Coordinates
         will be formatted in a decimal degrees coordinate
         pair stored in a single field with coordinates separated by a space,
         comma, or slash.DD_2-Coordinates will be formatted in a decimal
         degrees coordinate
         pair stored in two table fields. This is the default.DDM_1-Coordinates
         will be formatted in a degrees and decimal minutes
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DDM_2-Coordinates will be
         formatted in a degrees and decimal minutes
         coordinate pair stored in two table fields.DMS_1-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DMS_2-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in two table fields.GARS-Coordinates will be
         formatted in Global Area Reference System.GEOREF-Coordinates will be
         formatted in World Geographic Reference
         System.UTM_BANDS-Coordinates will be formatted in Universal Transverse
         Mercator coordinate bands.UTM_ZONES-Coordinates will be formatted in
         Universal Transverse
         Mercator coordinate zones.USNG-Coordinates will be formatted in United
         States National Grid.MGRS-Coordinates will be formatted in Military
         Grid Reference System.
     distance_units {String}:
         Specifies the unit of measurement for the major and minor
         axes.METERS-The unit will be meters. This is the
         default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.
     y_or_lat_field {Field}:
         The field in the input table containing the latitude coordinates.The
         y_or_lat_field parameter is used when the in_coordinate_format
         parameter is set to DD_2, DDM_2, or DMS_2.
     azimuth_field {Field}:
         The field in the input table containing the ellipse azimuth values.
     azimuth_units {String}:
         Specifies the unit of measurement for the azimuth field.DEGREES-The
         angle will be degrees. This is the default.MILS-The angle
         will be mils.RADS-The angle will be radians.GRADS-The angle will be
         gradians.
     coordinate_system {Spatial Reference}:
         The spatial reference of the output feature class. The default is
         GCS_WGS_1984.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the output ellipse polygon features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CoordinateTableToEllipse_defense(
                *gp_fixargs(
                    (
                        in_table,
                        out_feature_class,
                        x_or_lon_field,
                        major_field,
                        minor_field,
                        in_coordinate_format,
                        distance_units,
                        y_or_lat_field,
                        azimuth_field,
                        azimuth_units,
                        coordinate_system,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CoordinateTableToLineOfBearing_defense", None)
def CoordinateTableToLineOfBearing(
    in_table=None,
    out_feature_class=None,
    x_or_lon_field=None,
    bearing_field=None,
    distance_field=None,
    in_coordinate_format: Literal[
        "DD_1", "DD_2", "DDM_1", "DDM_2", "DMS_1", "DMS_2", "GARS", "GEOREF", "UTM_BANDS", "UTM_ZONES", "USNG", "MGRS"
    ]
    | None = None,
    bearing_units: Literal["DEGREES", "MILS", "RADS", "GRADS"] | None = None,
    distance_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
    y_or_lat_field=None,
    line_type: Literal["GEODESIC", "GREAT_CIRCLE", "RHUMB_LINE", "NORMAL_SECTION"] | None = None,
    coordinate_system=None,
) -> Result1[str]:
    """CoordinateTableToLineOfBearing_defense(in_table, out_feature_class, x_or_lon_field, bearing_field, distance_field, in_coordinate_format, {bearing_units}, {distance_units}, {y_or_lat_field}, {line_type}, {coordinate_system})

       Creates lines of bearing from coordinates stored in a table.

    INPUTS:
     in_table (Table View):
         The table containing the source coordinates.
     x_or_lon_field (Field):
         The field in the input table containing the x or longitude
         coordinates.
     bearing_field (Field):
         The field in the input table containing the bearing values.
     distance_field (Field):
         The field in the input table containing the distance values.
     in_coordinate_format (String):
         Specifies the format of the input table coordinates.DD_1-Coordinates
         will be formatted in a decimal degrees coordinate
         pair stored in a single field with coordinates separated by a space,
         comma, or slash.DD_2-Coordinates will be formatted in a decimal
         degrees coordinate
         pair stored in two table fields. This is the default.DDM_1-Coordinates
         will be formatted in a degrees and decimal minutes
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DDM_2-Coordinates will be
         formatted in a degrees and decimal minutes
         coordinate pair stored in two table fields.DMS_1-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DMS_2-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in two table fields.GARS-Coordinates will be
         formatted in Global Area Reference System.GEOREF-Coordinates will be
         formatted in World Geographic Reference
         System.UTM_BANDS-Coordinates will be formatted in Universal Transverse
         Mercator coordinate bands.UTM_ZONES-Coordinates will be formatted in
         Universal Transverse
         Mercator coordinate zones.USNG-Coordinates will be formatted in United
         States National Grid.MGRS-Coordinates will be formatted in Military
         Grid Reference System.
     bearing_units {String}:
         Specifies the unit of measurement for the bearing angles.DEGREES-The
         angle will be degrees. This is the default.MILS-The angle
         will be mils.RADS-The angle will be radians.GRADS-The angle will be
         gradians.
     distance_units {String}:
         Specifies the units of measurement for the distance.METERS-The unit
         will be meters. This is the default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.
     y_or_lat_field {Field}:
         The field in the input table containing the y or latitude
         coordinates.The y_or_lat_field parameter is used when the
         in_coordinate_format
         parameter is set to DD_2, DDM_2, or DMS_2.
     line_type {String}:
         Specifies the output line type.GEODESIC-The shortest distance between
         any two points on the earth's
         spheroidal surface (ellipsoid) will be used. This is the
         default.GREAT_CIRCLE-The line on a spheroid (ellipsoid) defined by the
         intersection of a plane passing through the center of the spheroid
         will be used.RHUMB_LINE-A line of constant bearing or azimuth will be
         used.NORMAL_SECTION-A normal plane to the earth's ellipsoidal surface
         containing the start and end points will be used.
     coordinate_system {Spatial Reference}:
         The spatial reference of the output feature class. The default is
         GCS_WGS_1984.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the output lines of bearing."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CoordinateTableToLineOfBearing_defense(
                *gp_fixargs(
                    (
                        in_table,
                        out_feature_class,
                        x_or_lon_field,
                        bearing_field,
                        distance_field,
                        in_coordinate_format,
                        bearing_units,
                        distance_units,
                        y_or_lat_field,
                        line_type,
                        coordinate_system,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CoordinateTableToPoint_defense", None)
def CoordinateTableToPoint(
    in_table=None,
    out_feature_class=None,
    x_or_lon_field=None,
    in_coordinate_format: Literal[
        "DD_1", "DD_2", "DDM_1", "DDM_2", "DMS_1", "DMS_2", "GARS", "GEOREF", "UTM_BANDS", "UTM_ZONES", "USNG", "MGRS"
    ]
    | None = None,
    y_or_lat_field=None,
    coordinate_system=None,
) -> Result1[str]:
    """CoordinateTableToPoint_defense(in_table, out_feature_class, x_or_lon_field, in_coordinate_format, {y_or_lat_field}, {coordinate_system})

       Creates a point feature class from coordinates stored in a table.

    INPUTS:
     in_table (Table View):
         The table containing the source coordinates.
     x_or_lon_field (Field):
         The field in the input table containing the x or longitude
         coordinates.
     in_coordinate_format (String):
         Specifies the format of the input table coordinates.DD_1-Coordinates
         will be formatted in a decimal degrees coordinate
         pair stored in a single field with coordinates separated by a space,
         comma, or slash.DD_2-Coordinates will be formatted in a decimal
         degrees coordinate
         pair stored in two table fields. This is the default.DDM_1-Coordinates
         will be formatted in a degrees and decimal minutes
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DDM_2-Coordinates will be
         formatted in a degrees and decimal minutes
         coordinate pair stored in two table fields.DMS_1-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DMS_2-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in two table fields.GARS-Coordinates will be
         formatted in Global Area Reference System.GEOREF-Coordinates will be
         formatted in World Geographic Reference
         System.UTM_BANDS-Coordinates will be formatted in Universal Transverse
         Mercator coordinate bands.UTM_ZONES-Coordinates will be formatted in
         Universal Transverse
         Mercator coordinate zones.USNG-Coordinates will be formatted in United
         States National Grid.MGRS-Coordinates will be formatted in Military
         Grid Reference System.
     y_or_lat_field {Field}:
         The field in the input table containing the y or latitude
         coordinates.The y_or_lat_field parameter is used when the
         in_coordinate_format
         parameter is set to DD_2, DDM_2, or DMS_2.
     coordinate_system {Spatial Reference}:
         The spatial reference of the output feature class. The default is
         GCS_WGS_1984.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the output point features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CoordinateTableToPoint_defense(
                *gp_fixargs(
                    (
                        in_table,
                        out_feature_class,
                        x_or_lon_field,
                        in_coordinate_format,
                        y_or_lat_field,
                        coordinate_system,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CoordinateTableToPolygon_defense", None)
def CoordinateTableToPolygon(
    in_table=None,
    out_feature_class=None,
    x_or_lon_field=None,
    in_coordinate_format: Literal[
        "DD_1", "DD_2", "DDM_1", "DDM_2", "DMS_1", "DMS_2", "GARS", "GEOREF", "UTM_BANDS", "UTM_ZONES", "USNG", "MGRS"
    ]
    | None = None,
    y_or_lat_field=None,
    line_group_field=None,
    sort_field=None,
    coordinate_system=None,
) -> Result1[str]:
    """CoordinateTableToPolygon_defense(in_table, out_feature_class, x_or_lon_field, in_coordinate_format, {y_or_lat_field}, {line_group_field}, {sort_field}, {coordinate_system})

       Creates polygon features from coordinates stored in a table.

    INPUTS:
     in_table (Table View):
         The table containing the source coordinates.
     x_or_lon_field (Field):
         The field in the input table containing the x or longitude
         coordinates.
     in_coordinate_format (String):
         Specifies the format of the input table coordinates.DD_1-Coordinates
         will be formatted in a decimal degrees coordinate
         pair stored in a single field with coordinates separated by a space,
         comma, or slash.DD_2-Coordinates will be formatted in a decimal
         degrees coordinate
         pair stored in two table fields. This is the default.DDM_1-Coordinates
         will be formatted in a degrees and decimal minutes
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DDM_2-Coordinates will be
         formatted in a degrees and decimal minutes
         coordinate pair stored in two table fields.DMS_1-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DMS_2-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in two table fields.GARS-Coordinates will be
         formatted in Global Area Reference System.GEOREF-Coordinates will be
         formatted in World Geographic Reference
         System.UTM_BANDS-Coordinates will be formatted in Universal Transverse
         Mercator coordinate bands.UTM_ZONES-Coordinates will be formatted in
         Universal Transverse
         Mercator coordinate zones.USNG-Coordinates will be formatted in United
         States National Grid.MGRS-Coordinates will be formatted in Military
         Grid Reference System.
     y_or_lat_field {Field}:
         The field in the input table containing the y or latitude
         coordinates.The y_or_lat_field parameter is used when the
         in_coordinate_format
         parameter is set to DD_2, DDM_2, or DMS_2.
     line_group_field {Field}:
         The field in the input table used to create unique polygons. A polygon
         will be created for each unique value.
     sort_field {Field}:
         The field in the input table used to order the polygon vertices. The
         field must be a numerical field.
     coordinate_system {Spatial Reference}:
         The spatial reference of the output feature class. The default is
         GCS_WGS_1984.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the output polygon features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CoordinateTableToPolygon_defense(
                *gp_fixargs(
                    (
                        in_table,
                        out_feature_class,
                        x_or_lon_field,
                        in_coordinate_format,
                        y_or_lat_field,
                        line_group_field,
                        sort_field,
                        coordinate_system,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("CoordinateTableToPolyline_defense", None)
def CoordinateTableToPolyline(
    in_table=None,
    out_feature_class=None,
    x_or_lon_field=None,
    in_coordinate_format: Literal[
        "DD_1", "DD_2", "DDM_1", "DDM_2", "DMS_1", "DMS_2", "GARS", "GEOREF", "UTM_BANDS", "UTM_ZONES", "USNG", "MGRS"
    ]
    | None = None,
    y_or_lat_field=None,
    line_group_field=None,
    sort_field=None,
    coordinate_system=None,
) -> Result1[str]:
    """CoordinateTableToPolyline_defense(in_table, out_feature_class, x_or_lon_field, in_coordinate_format, {y_or_lat_field}, {line_group_field}, {sort_field}, {coordinate_system})

       Creates a polyline feature class from coordinates stored in a table.

    INPUTS:
     in_table (Table View):
         The table containing the source coordinates.
     x_or_lon_field (Field):
         The field in the input table containing the x or longitude
         coordinates.
     in_coordinate_format (String):
         Specifies the format of the input table coordinates.DD_1-Coordinates
         will be formatted in a decimal degrees coordinate
         pair stored in a single field with coordinates separated by a space,
         comma, or slash.DD_2-Coordinates will be formatted in a decimal
         degrees coordinate
         pair stored in two table fields. This is the default.DDM_1-Coordinates
         will be formatted in a degrees and decimal minutes
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DDM_2-Coordinates will be
         formatted in a degrees and decimal minutes
         coordinate pair stored in two table fields.DMS_1-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DMS_2-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in two table fields.GARS-Coordinates will be
         formatted in Global Area Reference System.GEOREF-Coordinates will be
         formatted in World Geographic Reference
         System.UTM_BANDS-Coordinates will be formatted in Universal Transverse
         Mercator coordinate bands.UTM_ZONES-Coordinates will be formatted in
         Universal Transverse
         Mercator coordinate zones.USNG-Coordinates will be formatted in United
         States National Grid.MGRS-Coordinates will be formatted in Military
         Grid Reference System.
     y_or_lat_field {Field}:
         The field in the input table containing the y or latitude
         coordinates.The y_or_lat_field parameter is used when the
         in_coordinate_format
         parameter is set to DD_2, DDM_2, or DMS_2.
     line_group_field {Field}:
         The field in the input table field used to create unique polylines. A
         polyline will be created for each unique value.
     sort_field {Field}:
         The field in the input table used to order the polyline vertices. The
         field must be numeric.
     coordinate_system {Spatial Reference}:
         The spatial reference of the output feature class. The default is
         GCS_WGS_1984.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the output polyline features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.CoordinateTableToPolyline_defense(
                *gp_fixargs(
                    (
                        in_table,
                        out_feature_class,
                        x_or_lon_field,
                        in_coordinate_format,
                        y_or_lat_field,
                        line_group_field,
                        sort_field,
                        coordinate_system,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateCoordinateNotations_defense", None)
def GenerateCoordinateNotations(
    in_table=None,
    out_table=None,
    x_or_lon_field=None,
    in_coordinate_format: Literal[
        "DD_1", "DD_2", "DDM_1", "DDM_2", "DMS_1", "DMS_2", "GARS", "GEOREF", "UTM_BANDS", "UTM_ZONES", "USNG", "MGRS"
    ]
    | None = None,
    y_or_lat_field=None,
    coordinate_system=None,
) -> Result1[str]:
    """GenerateCoordinateNotations_defense(in_table, out_table, x_or_lon_field, in_coordinate_format, {y_or_lat_field}, {coordinate_system})

       Converts source coordinates in a table to multiple coordinate formats.

    INPUTS:
     in_table (Table View):
         The table containing the source coordinates.
     x_or_lon_field (Field):
         The field in the input table containing the x or longitude
         coordinates.
     in_coordinate_format (String):
         Specifies the format of the input table coordinates.DD_1-Coordinates
         will be formatted in a decimal degrees coordinate
         pair stored in a single field with coordinates separated by a space,
         comma, or slash.DD_2-Coordinates will be formatted in a decimal
         degrees coordinate
         pair stored in two table fields. This is the default.DDM_1-Coordinates
         will be formatted in a degrees and decimal minutes
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DDM_2-Coordinates will be
         formatted in a degrees and decimal minutes
         coordinate pair stored in two table fields.DMS_1-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in a single table field with coordinates
         separated by a space, comma, or slash.DMS_2-Coordinates will be
         formatted in a degrees, minutes, and seconds
         coordinate pair stored in two table fields.GARS-Coordinates will be
         formatted in Global Area Reference System.GEOREF-Coordinates will be
         formatted in World Geographic Reference
         System.UTM_BANDS-Coordinates will be formatted in Universal Transverse
         Mercator coordinate bands.UTM_ZONES-Coordinates will be formatted in
         Universal Transverse
         Mercator coordinate zones.USNG-Coordinates will be formatted in United
         States National Grid.MGRS-Coordinates will be formatted in Military
         Grid Reference System.
     y_or_lat_field {Field}:
         The field in the input table containing the y or latitude
         coordinates.The y_or_lat_field parameter is used when the
         in_coordinate_format
         parameter is set to DD_2, DDM_2, or DMS_2.
     coordinate_system {Spatial Reference}:
         The spatial reference of the coordinates in the output table. The
         default is GCS_WGS_1984.

    OUTPUTS:
     out_table (Table):
         The output table containing the converted coordinates."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateCoordinateNotations_defense(
                *gp_fixargs(
                    (in_table, out_table, x_or_lon_field, in_coordinate_format, y_or_lat_field, coordinate_system), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Distance and Direction toolset
@gptooldoc("GenerateRangeFans_defense", None)
def GenerateRangeFans(
    in_features=None,
    out_range_fan_feature_class=None,
    inner_radius=None,
    outer_radius=None,
    horizontal_start_angle=None,
    horizontal_end_angle=None,
    distance_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
    angle_units: Literal["DEGREES", "MILS", "RADS", "GRADS"] | None = None,
) -> Result1[str]:
    """GenerateRangeFans_defense(in_features, out_range_fan_feature_class, inner_radius, outer_radius, horizontal_start_angle, horizontal_end_angle, {distance_units}, {angle_units})

       Creates range fans originating from a starting point given a
       horizontal start angle, horizontal end angle, minimum distance, and
       maximum distance.

    INPUTS:
     in_features (Feature Set):
         The input point feature set that identifies the origin points of the
         range fans. The input must have at least one point.
     inner_radius (Double):
         The distance from the origin point to the start of the range fan.
     outer_radius (Double):
         The distance from the origin point to the end of the range fan.
     horizontal_start_angle (Double):
         The angle from the origin point to the start of the range fan.
     horizontal_end_angle (Double):
         The angle from the origin point to the end of the range fan.
     distance_units {String}:
         Specifies the linear unit of measurement for minimum and maximum
         distance.METERS-The unit will be meters. This is the
         default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.
     angle_units {String}:
         Specifies the angular unit of measurement for start and end
         angles.DEGREES-The angle will be degrees. This is the default.MILS-The
         angle
         will be mils.RADS-The angle will be radians.GRADS-The angle will be
         gradians.

    OUTPUTS:
     out_range_fan_feature_class (Feature Class):
         The feature class that will contain the output range fan features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateRangeFans_defense(
                *gp_fixargs(
                    (
                        in_features,
                        out_range_fan_feature_class,
                        inner_radius,
                        outer_radius,
                        horizontal_start_angle,
                        horizontal_end_angle,
                        distance_units,
                        angle_units,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateRangeFansFromFeatures_defense", None)
def GenerateRangeFansFromFeatures(
    in_features=None,
    output_feature_class=None,
    inner_radius_field=None,
    outer_radius_field=None,
    start_angle_field=None,
    end_angle_field=None,
    distance_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
    angle_units: Literal["DEGREES", "MILS", "RADS", "GRADS"] | None = None,
) -> Result1[str]:
    """GenerateRangeFansFromFeatures_defense(in_features, output_feature_class, inner_radius_field, outer_radius_field, start_angle_field, end_angle_field, {distance_units}, {angle_units})

       Creates range fans with attributes derived from fields in a point
       feature class or shapefile.

    INPUTS:
     in_features (Feature Layer):
         The point feature set that identifies the origin points of the range
         fans. The input must have at least one point.
     inner_radius_field (Field):
         The field that contains the values for the distance from the origin
         point to the start of the range fan.
     outer_radius_field (Field):
         The field that contains the values for the distance from the origin
         point to the end of the range fan.
     start_angle_field (Field):
         The field that contains the values for the angle from the origin point
         to the start of the range fan.
     end_angle_field (Field):
         The field that contains the values for the angle from the origin point
         to the end of the range fan.
     distance_units {String}:
         Specifies the linear unit of measure for minimum and maximum
         distance.METERS-The unit will be meters. This is the
         default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.
     angle_units {String}:
         Specifies the angular unit of measure for start and end
         angles.DEGREES-The angle will be degrees. This is the default.MILS-The
         angle
         will be mils.RADS-The angle will be radians.GRADS-The angle will be
         gradians.

    OUTPUTS:
     output_feature_class (Feature Class):
         The feature class that will contain the output range fan features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateRangeFansFromFeatures_defense(
                *gp_fixargs(
                    (
                        in_features,
                        output_feature_class,
                        inner_radius_field,
                        outer_radius_field,
                        start_angle_field,
                        end_angle_field,
                        distance_units,
                        angle_units,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateRangeRings_defense", None)
def GenerateRangeRings(
    in_features=None,
    out_feature_class_rings=None,
    range_rings_type: Literal["INTERVAL", "MIN_MAX"] | None = None,
    out_feature_class_radials=None,
    number_of_radials=None,
    distance_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
    number_of_rings=None,
    interval_between_rings=None,
    minimum_range=None,
    maximum_range=None,
) -> Result2[str, str]:
    """GenerateRangeRings_defense(in_features, out_feature_class_rings, range_rings_type, {out_feature_class_radials}, {number_of_radials}, {distance_units}, {number_of_rings}, {interval_between_rings}, {minimum_range}, {maximum_range})

       Creates a set of concentric circles from a point, given a number of
       rings and distance between rings or a minimum and maximum distance
       from center.

    INPUTS:
     in_features (Feature Set):
         The point feature set that identifies the center of the range ring.
         The input must have at least one point.
     range_rings_type (String):
         Specifies the method to create the range rings.INTERVAL-Range rings
         will be generated based on the number of rings
         and distance between rings. This the default.MIN_MAX-Range rings will
         be generated based on a minimum and maximum
         distance.
     number_of_radials {Long}:
         The number of radials to generate.
     distance_units {String}:
         Specifies the linear unit of measurement for the
         interval_between_rings parameter or the minimum_range and
         maximum_range parameters.METERS-The unit will be meters. This is the
         default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.
     number_of_rings {Long}:
         The number of rings to generate.
     interval_between_rings {Double}:
         The distance between each ring.
     minimum_range {Double}:
         The distance from the center to the nearest ring.
     maximum_range {Double}:
         The distance from the center to the farthest ring.

    OUTPUTS:
     out_feature_class_rings (Feature Class):
         The feature class containing the output ring features.
     out_feature_class_radials {Feature Class}:
         The feature class containing the output radial features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateRangeRings_defense(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class_rings,
                        range_rings_type,
                        out_feature_class_radials,
                        number_of_radials,
                        distance_units,
                        number_of_rings,
                        interval_between_rings,
                        minimum_range,
                        maximum_range,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateRangeRingsFromFeatures_defense", None)
def GenerateRangeRingsFromFeatures(
    in_features=None,
    output_feature_class=None,
    range_rings_type: Literal["INTERVAL", "MIN_MAX"] | None = None,
    out_feature_class_radials=None,
    radial_count_field=None,
    min_range_field=None,
    max_range_field=None,
    ring_count_field=None,
    ring_interval_field=None,
    distance_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
) -> Result2[str, str]:
    """GenerateRangeRingsFromFeatures_defense(in_features, output_feature_class, range_rings_type, {out_feature_class_radials}, {radial_count_field}, {min_range_field}, {max_range_field}, {ring_count_field}, {ring_interval_field}, {distance_units})

       Creates range rings with attributes derived from fields in a point
       feature class.

    INPUTS:
     in_features (Feature Layer):
         The point feature set that identifies the center of the range ring.
         The input must have at least one point.
     range_rings_type (String):
         Specifies how range rings will be generated.INTERVAL-Range rings will
         be generated based on the number of rings
         and distance between rings. This the default.MIN_MAX-Range rings will
         be generated based on a minimum and maximum
         distance.
     radial_count_field {Field}:
         The field that contains the number of radials to be created.
     min_range_field {Field}:
         The field that contains the values for the distance from the origin
         point to the inner ring.
     max_range_field {Field}:
         The field that contains the values for the distance from the origin
         point to the outer ring.
     ring_count_field {Field}:
         The field that contains the values for the number of rings to
         generate.
     ring_interval_field {Field}:
         The field that contains the values for the interval between rings.
     distance_units {String}:
         Specifies the linear unit of measure for the value of the
         ring_interval_field parameter or the values of the min_range_field and
         max_range_field parameters.METERS-The unit will be meters. This is the
         default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.

    OUTPUTS:
     output_feature_class (Feature Class):
         The feature class that will contain the output ring features.
     out_feature_class_radials {Feature Class}:
         The feature class that will contain the output radial features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateRangeRingsFromFeatures_defense(
                *gp_fixargs(
                    (
                        in_features,
                        output_feature_class,
                        range_rings_type,
                        out_feature_class_radials,
                        radial_count_field,
                        min_range_field,
                        max_range_field,
                        ring_count_field,
                        ring_interval_field,
                        distance_units,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateRangeRingsFromTable_defense", None)
def GenerateRangeRingsFromTable(
    in_features=None,
    in_table=None,
    out_feature_class_rings=None,
    lookup_name=None,
    range_rings_type: Literal["INTERVAL", "MIN_MAX"] | None = None,
    out_feature_class_radials=None,
    number_of_radials=None,
    distance_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
    lookup_name_field=None,
    min_range_field=None,
    max_range_field=None,
    number_of_rings_field=None,
    ring_interval_field=None,
) -> Result2[str, str]:
    """GenerateRangeRingsFromTable_defense(in_features, in_table, out_feature_class_rings, lookup_name, range_rings_type, {out_feature_class_radials}, {number_of_radials}, {distance_units}, {lookup_name_field}, {min_range_field}, {max_range_field}, {number_of_rings_field}, {ring_interval_field})

       Creates a set of concentric circles from a center based on values
       stored in a lookup table.

    INPUTS:
     in_features (Feature Set):
         The point feature set that identifies the center of the range ring.
         The input must have at least one point.
     in_table (Table):
         The input table that contains values for creating rings.
     lookup_name (String):
         The row from the in_table that contains the input values for minimum
         and maximum values or number of rings and interval.
     range_rings_type (String):
         Specifies the method used to create the range rings.INTERVAL-Range
         rings will be generated based on the number of rings
         and distance between rings. This the default.MIN_MAX-Range rings will
         be generated based on a minimum and maximum
         distance.
     number_of_radials {Long}:
         The number of radials to create.
     distance_units {String}:
         Specifies the linear unit of measurement for the ring_interval_field
         parameter or the min_range_field and max_range_field
         parameters.METERS-The unit will be meters. This is the
         default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.
     lookup_name_field {Field}:
         The field from the input table that contains the lookup_name
         value. The default field name is. Name
     min_range_field {Field}:
         The field from the input table that contains the minimum range
         value. The default field name is. Min
     max_range_field {Field}:
         The field from the input table that contains the maximum range
         value. The default field name is. Max
     number_of_rings_field {Field}:
         The field from the input table that contains the number of
         rings value. The default field name is. Rings
     ring_interval_field {Field}:
         The field from the input table that contains the ring interval
         value. The default field name is. Interval

    OUTPUTS:
     out_feature_class_rings (Feature Class):
         The output feature class containing the ring features.
     out_feature_class_radials {Feature Class}:
         The feature class containing the output radial features."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateRangeRingsFromTable_defense(
                *gp_fixargs(
                    (
                        in_features,
                        in_table,
                        out_feature_class_rings,
                        lookup_name,
                        range_rings_type,
                        out_feature_class_radials,
                        number_of_radials,
                        distance_units,
                        lookup_name_field,
                        min_range_field,
                        max_range_field,
                        number_of_rings_field,
                        ring_interval_field,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Gridded Reference Graphic toolset
@gptooldoc("GenerateGRGFromArea_defense", None)
def GenerateGRGFromArea(
    in_feature=None,
    out_feature_class=None,
    cell_width=None,
    cell_height=None,
    cell_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
    label_start_position: Literal["UPPER_LEFT", "LOWER_LEFT", "UPPER_RIGHT", "LOWER_RIGHT"] | None = None,
    label_format: Literal["ALPHA_NUMERIC", "ALPHA_ALPHA", "NUMERIC"] | None = None,
    label_separator: Literal["-", ",", ".", "/"] | None = None,
) -> Result1[str]:
    """GenerateGRGFromArea_defense(in_feature, out_feature_class, {cell_width}, {cell_height}, {cell_units}, {label_start_position}, {label_format}, {label_separator})

       Generates a Gridded Reference Graphic (GRG) over a specified area with
       a custom size based on a bounding polygon.

    INPUTS:
     in_feature (Feature Set):
         The input polygon feature on which the GRG will be based.
     cell_width {Double}:
         The width of the cells. Measurement units are specified by
         theparameter. Cell Units
     cell_height {Double}:
         The height of the cells. Measurement units are specified by
         theparameter. Cell Units
     cell_units {String}:
         Specifies the measurement units for cell width and height.METERS-The
         unit will be meters. This is the default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.
     label_start_position {String}:
         Specifies the grid cell where labelling will start.UPPER_LEFT-The
         label position will be the upper left. This is the
         default.LOWER_LEFT-The label position will be the lower
         left.UPPER_RIGHT-The label position will be the upper
         right.LOWER_RIGHT-The label position will be the lower right.
     label_format {String}:
         Specifies the labeling type for each grid cell.ALPHA_NUMERIC-The label
         will use an alpha character, a separator, and
         a number. This is the default.ALPHA_ALPHA-The label will use an alpha
         character, a separator, and an
         additional alpha character.NUMERIC-The label will be numeric.
     label_separator {String}:
         Specifies the separator to be used between x- and y-values when the
         label_format parameter is set to ALPHA_ALPHA, for example, A-A, A-AA,
         AA-A.--The label separator will be a hyphen. This is the default.,-The
         label separator will be a comma..-The label separator will be a
         period./-The label separator will be a forward slash.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polygon feature class containing the GRG."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateGRGFromArea_defense(
                *gp_fixargs(
                    (
                        in_feature,
                        out_feature_class,
                        cell_width,
                        cell_height,
                        cell_units,
                        label_start_position,
                        label_format,
                        label_separator,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateGRGFromPoint_defense", None)
def GenerateGRGFromPoint(
    in_feature=None,
    out_feature_class=None,
    horizontal_cells=None,
    vertical_cells=None,
    cell_width=None,
    cell_height=None,
    cell_units: Literal["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"] | None = None,
    label_start_position: Literal["UPPER_LEFT", "LOWER_LEFT", "UPPER_RIGHT", "LOWER_RIGHT"] | None = None,
    label_format: Literal["ALPHA_NUMERIC", "ALPHA_ALPHA", "NUMERIC"] | None = None,
    label_separator: Literal["-", ",", ".", "/"] | None = None,
    grid_angle=None,
    grid_angle_units: Literal["DEGREES", "MILS", "RADS", "GRADS"] | None = None,
) -> Result1[str]:
    """GenerateGRGFromPoint_defense(in_feature, out_feature_class, {horizontal_cells}, {vertical_cells}, {cell_width}, {cell_height}, {cell_units}, {label_start_position}, {label_format}, {label_separator}, {grid_angle}, {grid_angle_units})

       Generates a Gridded Reference Graphic (GRG) as a polygon feature class
       over a specified area with a custom size.

    INPUTS:
     in_feature (Feature Set):
         The center point for the GRG starting point.
     horizontal_cells {Long}:
         The number of horizontal grid cells.
     vertical_cells {Long}:
         The number of vertical grid cells.
     cell_width {Double}:
         The width of the cells. Measurement units are specified by
         theparameter. Cell Units
     cell_height {Double}:
         The height of the cells. Measurement units are specified by
         theparameter. Cell Units
     cell_units {String}:
         Specifies the measurement units for cell width and height.METERS-The
         unit will be meters. This is the default.KILOMETERS-The
         unit will be kilometers.MILES-The unit will be
         miles.NAUTICAL_MILES-The unit will be nautical miles.FEET-The unit
         will be feet.US_SURVEY_FEET-The unit will be U.S. survey feet.
     label_start_position {String}:
         Specifies the grid cell where labelling will start.UPPER_LEFT-The
         label position will be the upper left. This is the
         default.LOWER_LEFT-The label position will be the lower
         left.UPPER_RIGHT-The label position will be the upper
         right.LOWER_RIGHT-The label position will be the lower right.
     label_format {String}:
         Specifies the labeling type for each grid cell.ALPHA_NUMERIC-The label
         will use an alpha character, a separator, and
         a number. This is the default.ALPHA_ALPHA-The label will use an alpha
         character, a separator, and an
         additional alpha character.NUMERIC-The label will be numeric.
     label_separator {String}:
         Specifies the separator to be used between x- and y-values when the
         label_format parameter is set to ALPHA_ALPHA, for example, A-A, A-AA,
         AA-A.--The label separator will be a hyphen. This is the default.,-The
         label separator will be a comma..-The label separator will be a
         period./-The label separator will be a forward slash.
     grid_angle {Double}:
         The angle used to rotate the grid.
     grid_angle_units {String}:
         The angular units for grid rotation.DEGREES-The angle will be degrees.
         This is the default.MILS-The angle
         will be mils.RADS-The angle will be radians.GRADS-The angle will be
         gradians.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polygon feature class containing the GRG to be created."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateGRGFromPoint_defense(
                *gp_fixargs(
                    (
                        in_feature,
                        out_feature_class,
                        horizontal_cells,
                        vertical_cells,
                        cell_width,
                        cell_height,
                        cell_units,
                        label_start_position,
                        label_format,
                        label_separator,
                        grid_angle,
                        grid_angle_units,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("GenerateReferenceSystemGRGFromArea_defense", None)
def GenerateReferenceSystemGRGFromArea(
    in_features=None,
    output_feature_class=None,
    grid_reference_system: Literal["MGRS", "USNG"] | None = None,
    grid_square_size: Literal[
        "GRID_ZONE_DESIGNATOR",
        "100000M_GRID",
        "10000M_GRID",
        "1000M_GRID",
        "100M_GRID",
        "50M_GRID",
        "25M_GRID",
        "10M_GRID",
    ]
    | None = None,
    large_grid_handling: Literal["NO_LARGE_GRIDS", "ALLOW_LARGE_GRIDS"] | None = None,
) -> Result1[str]:
    """GenerateReferenceSystemGRGFromArea_defense(in_features, output_feature_class, grid_reference_system, grid_square_size, {large_grid_handling})

       Creates Gridded Reference Graphics (GRG) based on Military Grid
       Reference System (MGRS) or United States National Grid (USNG)
       reference grids.

    INPUTS:
     in_features (Feature Set):
         The input polygon feature on which the GRG will be based.
     grid_reference_system (String):
         Specifies the reference system the GRG will use.MGRS-Military Grid
         Reference System will be used. This is the
         default.USNG-United States National Grid will be used.
     grid_square_size (String):
         Specifies the grid square size that will be used for the cells in the
         GRG.GRID_ZONE_DESIGNATOR-The size of the grid cells will be a Grid
         Zone.
         This is the default.100000M_GRID-The size of the grid cells will be
         100,000-meter grid
         squares.10000M_GRID-The size of the grid cells will be 10,000-meter
         grid
         squares.1000M_GRID-The size of the grid cells will be 1,000-meter grid
         squares.100M_GRID-The size of the grid cells will be 100-meter grid
         squares.50M_GRID-The size of the grid cells will be 50-meter grid
         squares.25M_GRID-The size of the grid cells will be 25-meter grid
         squares.10M_GRID-The size of the grid cells will be 10-meter grid
         squares.
     large_grid_handling {String}:
         Specifies how large input areas that may contain many features will be
         handled.NO_LARGE_GRIDS-Processing will stop when 2000 features are
         created.
         This is the default.ALLOW_LARGE_GRIDS-Large grids are supported.

    OUTPUTS:
     output_feature_class (Feature Class):
         The output polygon feature class containing the GRG."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.GenerateReferenceSystemGRGFromArea_defense(
                *gp_fixargs(
                    (in_features, output_feature_class, grid_reference_system, grid_square_size, large_grid_handling),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Gridded Reference Graphic\Number and Letter toolset
@gptooldoc("LetterFeatures_defense", None)
def LetterFeatures(
    in_features=None,
    field_to_letter=None,
    in_area=None,
    spatial_sort_method: Literal["UR", "UL", "LR", "LL", "PEANO", "CENTER", "COUNTERCLOCKWISE", "CLOCKWISE", "NONE"]
    | None = None,
    lettering_format: Literal["A_B_C", "AA_AB_AC", "AA_BB_CC"] | None = None,
    starting_letter=None,
    omit_letters=None,
    center_point=None,
    add_distance_and_bearing: Literal["ADD_DISTANCE", "DONT_ADD_DISTANCE"] | None = None,
) -> Result1[str]:
    """LetterFeatures_defense(in_features, field_to_letter, {in_area}, {spatial_sort_method}, {lettering_format}, {starting_letter}, {omit_letters;omit_letters...}, {center_point}, {add_distance_and_bearing})

       Adds a sequential letter to a new or existing field of a set of
       features.

    INPUTS:
     in_features (Feature Set):
         The input features that will be lettered.
     field_to_letter (Field):
         The input field that will be lettered. The field must be a new or
         existing text field.
     in_area {Feature Set}:
         The area that will limit the features to letter; only features within
         this area will be lettered.
     spatial_sort_method {String}:
         Specifies how features will be spatially sorted for the purpose of
         lettering. Features are not reordered in the table.UR-Features will be
         sorted starting at the upper right corner. This is
         the default.UL-Features will be sorted starting at the upper left
         corner.LR-Features will be sorted starting at the lower right
         corner.LL-Features will be sorted starting at the lower left
         corner.PEANO-Features will be sorted using a space-filling curve
         algorithm,
         also known as a Peano curve.CENTER-Features will be sorted starting
         from a center point (the mean
         center will be used if no center is provided).CLOCKWISE-Features will
         be sorted starting from a center point and
         moving clockwise.COUNTERCLOCKWISE-Features will be sorted starting
         from a center point
         and moving counterclockwise.NONE-No spatial sort will be used. The
         same order as the feature class
         will be used.
     lettering_format {String}:
         Specifies the labeling format that will be used for each
         feature.A_B_C-An alpha character (for example, A, B, C) will be used.
         This is
         the default.AA_AB_AC-A constant alpha character with an incrementing
         second alpha
         character grid (for example, AA, AB, AC) will be used.AA_BB_CC-A
         double alpha character that is incremented for each feature
         (for example, AA, BB, CC) will be used.
     starting_letter {String}:
         The value that will be used to begin lettering.
     omit_letters {String}:
         The values that will be omitted from the lettering sequence.
     center_point {Feature Set}:
         The center point that will be used to sort and letter features.
     add_distance_and_bearing {Boolean}:
         Specifies whether fields will be added to the output for distance and
         bearing to a center point.DONT_ADD_DISTANCE-No distance or bearing
         fields will be added to the
         output. This is the default. ADD_DISTANCE-andfields will be
         added to the output.
         DIST_TO_CENTERANGLE_TO_CENTER"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LetterFeatures_defense(
                *gp_fixargs(
                    (
                        in_features,
                        field_to_letter,
                        in_area,
                        spatial_sort_method,
                        lettering_format,
                        starting_letter,
                        omit_letters,
                        center_point,
                        add_distance_and_bearing,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LetterIntersections_defense", None)
def LetterIntersections(
    in_features=None,
    out_feature_class=None,
    field_to_letter=None,
    in_area=None,
    spatial_sort_method: Literal["UR", "UL", "LR", "LL", "PEANO", "CENTER", "COUNTERCLOCKWISE", "CLOCKWISE", "NONE"]
    | None = None,
    lettering_format: Literal["A_B_C", "AA_AB_AC", "AA_BB_CC"] | None = None,
    starting_letter=None,
    omit_letters=None,
    min_out_point_distance=None,
    center_point=None,
    add_distance_and_bearing: Literal["ADD_DISTANCE", "DONT_ADD_DISTANCE"] | None = None,
) -> Result1[str]:
    """LetterIntersections_defense(in_features, out_feature_class, field_to_letter, {in_area}, {spatial_sort_method}, {lettering_format}, {starting_letter}, {omit_letters;omit_letters...}, {min_out_point_distance}, {center_point}, {add_distance_and_bearing})

       Identifies intersections in a line feature class and adds sequential
       letters to output point features.

    INPUTS:
     in_features (Feature Set):
         The input line features with intersections that will be lettered.
     field_to_letter (Field):
         The name of the field that will contain the letter designator for each
         intersection.
     in_area {Feature Set}:
         The area that will limit the intersections identified; only
         intersections within this area will be identified and lettered.
     spatial_sort_method {String}:
         Specifies how features will be spatially sorted for the purpose of
         lettering. Features are not reordered in the table.UR-Features will be
         sorted starting at the upper right corner. This is
         the default.UL-Features will be sorted starting at the upper left
         corner.LR-Features will be sorted starting at the lower right
         corner.LL-Features will be sorted starting at the lower left
         corner.PEANO-Features will be sorted using a space-filling curve
         algorithm,
         also known as a Peano curve.CENTER-Features will be sorted starting
         from a center point (the mean
         center will be used if no center is provided).CLOCKWISE-Features will
         be sorted starting from a center point and
         moving clockwise.COUNTERCLOCKWISE-Features will be sorted starting
         from a center point
         and moving counterclockwise.NONE-No spatial sort will be used. The
         same order as the feature class
         will be used.
     lettering_format {String}:
         Specifies the labeling format that will be used for each
         feature.A_B_C-An alpha character (for example, A, B, C) will be used.
         This is
         the default.AA_AB_AC-A constant alpha character with an incrementing
         second alpha
         character grid (for example, AA, AB, AC) will be used.AA_BB_CC-A
         double alpha character that is incremented for each feature
         (for example, AA, BB, CC) will be used.
     starting_letter {String}:
         The value that will be used to begin lettering.
     omit_letters {String}:
         The values that will be omitted from the lettering sequence.
     min_out_point_distance {Linear Unit}:
         The minimum distance between intersections that are identified for
         lettering.
     center_point {Feature Set}:
         The center point that will be used to sort and letter features.
     add_distance_and_bearing {Boolean}:
         Specifies whether fields will be added to the output for distance and
         bearing to a center point.DONT_ADD_DISTANCE-No distance or bearing
         fields will be added to the
         output. This is the default. ADD_DISTANCE-andfields will be
         added to the output.
         DIST_TO_CENTERANGLE_TO_CENTER

    OUTPUTS:
     out_feature_class (Feature Class):
         The output point feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LetterIntersections_defense(
                *gp_fixargs(
                    (
                        in_features,
                        out_feature_class,
                        field_to_letter,
                        in_area,
                        spatial_sort_method,
                        lettering_format,
                        starting_letter,
                        omit_letters,
                        min_out_point_distance,
                        center_point,
                        add_distance_and_bearing,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("NumberFeatures_defense", None)
def NumberFeatures(
    in_features=None,
    field_to_number=None,
    in_area=None,
    spatial_sort_method: Literal["UR", "UL", "LR", "LL", "PEANO", "CENTER", "COUNTERCLOCKWISE", "CLOCKWISE", "NONE"]
    | None = None,
    new_field_type: Literal["SHORT", "LONG", "TEXT"] | None = None,
    starting_number=None,
    increment_by=None,
    center_point=None,
    add_distance_and_bearing: Literal["ADD_DISTANCE", "DONT_ADD_DISTANCE"] | None = None,
) -> Result1[str]:
    """NumberFeatures_defense(in_features, field_to_number, {in_area}, {spatial_sort_method}, {new_field_type}, {starting_number}, {increment_by}, {center_point}, {add_distance_and_bearing})

       Adds a sequential number to a new or existing field of a set of input
       features.

    INPUTS:
     in_features (Feature Set):
         The input features that will be numbered.
     field_to_number (Field):
         The input field that will be numbered. The field can be an existing
         short, long, or text field, or a new field.
     in_area {Feature Set}:
         The area that will limit the features to number; only features within
         this area will be numbered.
     spatial_sort_method {String}:
         Specifies how features will be spatially sorted for the purpose of
         numbering. Features are not reordered in the table.UR-Features will be
         sorted starting at the upper right corner. This is
         the default.UL-Features will be sorted starting at the upper left
         corner.LR-Features will be sorted starting at the lower right
         corner.LL-Features will be sorted starting at the lower left
         corner.PEANO-Features will be sorted using a space-filling curve
         algorithm,
         also known as a Peano curve.CENTER-Features will be sorted starting
         from a center point (the mean
         center will be used if no center is provided).CLOCKWISE-Features will
         be sorted starting from a center point and
         moving clockwise.COUNTERCLOCKWISE-Features will be sorted starting
         from a center point
         and moving counterclockwise.NONE-No spatial sort will be used. The
         same order as the feature class
         will be used.
     new_field_type {String}:
         Specifies the field type that will be used for the new field. This
         parameter is only used when the field name does not exist in the input
         table.SHORT-The field type will be short. This is the default.LONG-The
         field
         type will be long.TEXT-The field type will be text.
     starting_number {Long}:
         The value that will be used to begin numbering.
     increment_by {Long}:
         The value that will be used to increment by from the previous value.
     center_point {Feature Set}:
         The center point that will be used to sort and number features.
     add_distance_and_bearing {Boolean}:
         Specifies whether fields will be added to the output for distance and
         bearing to a center point.DONT_ADD_DISTANCE-No distance or bearing
         fields will be added to the
         output. This is the default. ADD_DISTANCE-andfields will be
         added to the output.
         DIST_TO_CENTERANGLE_TO_CENTER"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.NumberFeatures_defense(
                *gp_fixargs(
                    (
                        in_features,
                        field_to_number,
                        in_area,
                        spatial_sort_method,
                        new_field_type,
                        starting_number,
                        increment_by,
                        center_point,
                        add_distance_and_bearing,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("NumberFeaturesBySector_defense", None)
def NumberFeaturesBySector(
    in_features=None,
    sector_polygons=None,
    field_to_number=None,
    new_field_type: Literal["SHORT", "LONG", "TEXT"] | None = None,
    spatial_sort_method: Literal["UR", "UL", "LR", "LL", "PEANO", "CENTER", "COUNTERCLOCKWISE", "CLOCKWISE", "NONE"]
    | None = None,
    increment_by=None,
    center_point=None,
    add_distance_and_bearing: Literal["ADD_DISTANCE", "DONT_ADD_DISTANCE"] | None = None,
) -> Result1[str]:
    """NumberFeaturesBySector_defense(in_features, sector_polygons, field_to_number, {new_field_type}, {spatial_sort_method}, {increment_by}, {center_point}, {add_distance_and_bearing})

       Adds a sequential number to a new or existing field of a set of input
       features based on a geographic grouping to which the features belong.

    INPUTS:
     in_features (Feature Set):
         The input features that will be numbered.
     sector_polygons (Feature Set):
         The input polygons representing sectors that will be used for
         numbering.
     field_to_number (Field):
         The input field that will be numbered. The field can be an existing
         short, long, or text field, or a new field.
     new_field_type {String}:
         Specifies the field type that will be used for the new field. This
         parameter is only used when the field name does not exist in the input
         table.SHORT-The field type will be short. This is the default.LONG-The
         field
         type will be long.TEXT-The field type will be text.
     spatial_sort_method {String}:
         Specifies how features will be spatially sorted for the
         purpose of numbering. Features are not reordered in the table. If
         afield exists in the sector_polygons input, that value will be used
         instead. SortMethodUR-Features will be sorted starting at the
         upper right corner. This is
         the default.UL-Features will be sorted starting at the upper left
         corner.LR-Features will be sorted starting at the lower right
         corner.LL-Features will be sorted starting at the lower left
         corner.PEANO-Features will be sorted using a space-filling curve
         algorithm,
         also known as a Peano curve.CENTER-Features will be sorted starting
         from a center point (the mean
         center will be used if no center is provided).CLOCKWISE-Features will
         be sorted starting from a center point and
         moving clockwise.COUNTERCLOCKWISE-Features will be sorted starting
         from a center point
         and moving counterclockwise.NONE-No spatial sort will be used. The
         same order as the feature class
         will be used.
     increment_by {Long}:
         The value that will be used to increment by from the previous
         sector. If afield exists in the sector_polygons input, that value will
         be used instead. StartNumber
     center_point {Feature Set}:
         The center point that will be used to sort and number features.
     add_distance_and_bearing {Boolean}:
         Specifies whether fields will be added to the output for distance and
         bearing to a center point.DONT_ADD_DISTANCE-No distance or bearing
         fields will be added to the
         output. This is the default. ADD_DISTANCE-andfields will be
         added to the output.
         DIST_TO_CENTERANGLE_TO_CENTER"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.NumberFeaturesBySector_defense(
                *gp_fixargs(
                    (
                        in_features,
                        sector_polygons,
                        field_to_number,
                        new_field_type,
                        spatial_sort_method,
                        increment_by,
                        center_point,
                        add_distance_and_bearing,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# Visibility toolset
@gptooldoc("FindHighestLowestPoint_defense", None)
def FindHighestLowestPoint(
    in_surface=None,
    out_feature_class=None,
    high_low_operation_type: Literal["HIGHEST", "LOWEST"] | None = None,
    in_feature=None,
) -> Result1[str]:
    """FindHighestLowestPoint_defense(in_surface, out_feature_class, high_low_operation_type, {in_feature})

       Finds the highest or lowest point of the input surface within a
       defined area.

    INPUTS:
     in_surface (Raster Layer / Mosaic Dataset / Mosaic Layer):
         The input elevation raster surface.
     high_low_operation_type (String):
         Specifies the type of operation the tool will perform.HIGHEST-The
         highest points will be found. This is the
         default.LOWEST-The lowest points will be found.
     in_feature {Feature Set}:
         The input polygon feature class within which the highest or lowest
         point will be found.

    OUTPUTS:
     out_feature_class (Feature Class):
         The feature class containing the output highest or lowest point."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FindHighestLowestPoint_defense(
                *gp_fixargs((in_surface, out_feature_class, high_low_operation_type, in_feature), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("FindLocalPeaksValleys_defense", None)
def FindLocalPeaksValleys(
    in_surface=None,
    out_feature_class=None,
    peak_valley_op_type: Literal["PEAKS", "VALLEYS"] | None = None,
    num_peaks_valleys=None,
    in_feature=None,
) -> Result1[str]:
    """FindLocalPeaksValleys_defense(in_surface, out_feature_class, peak_valley_op_type, num_peaks_valleys, {in_feature})

       Finds local peaks or valleys within a defined area.

    INPUTS:
     in_surface (Raster Layer / Mosaic Dataset / Mosaic Layer):
         The input elevation raster surface.
     peak_valley_op_type (String):
         Specifies the type of operation the tool will perform.PEAKS-Local
         peaks will be found. This is the default.VALLEYS-Local
         valleys will be found.
     num_peaks_valleys (Long):
         The number of peaks or valleys to find.
     in_feature {Feature Set}:
         The input polygon feature class in which the local peaks or valleys
         will be found.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output point feature class containing the local peaks or valleys."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.FindLocalPeaksValleys_defense(
                *gp_fixargs((in_surface, out_feature_class, peak_valley_op_type, num_peaks_valleys, in_feature), True)
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("LinearLineOfSight_defense", None)
def LinearLineOfSight(
    in_observer_features=None,
    in_target_features=None,
    in_surface=None,
    out_los_feature_class=None,
    out_sight_line_feature_class=None,
    out_observer_feature_class=None,
    out_target_feature_class=None,
    in_obstruction_features=None,
    observer_height_above_surface=None,
    target_height_above_surface=None,
    add_profile_attachment: Literal["ADD_PROFILE_GRAPH", "NO_PROFILE_GRAPH"] | None = None,
) -> Result:
    """LinearLineOfSight_defense(in_observer_features, in_target_features, in_surface, out_los_feature_class, out_sight_line_feature_class, out_observer_feature_class, out_target_feature_class, {in_obstruction_features}, {observer_height_above_surface}, {target_height_above_surface}, {add_profile_attachment})

       Creates lines of sight between observers and targets.

    INPUTS:
     in_observer_features (Feature Set):
         The input observer points.
     in_target_features (Feature Set):
         The input target points.
     in_surface (Raster Layer / Mosaic Dataset / Mosaic Layer):
         The input elevation raster surface.
     in_obstruction_features {Feature Layer}:
         The input multipatch feature that may obstruct the lines of sight.
     observer_height_above_surface {Double}:
         The height that will be added to the surface elevation of the
         observer. The default is 2.
     target_height_above_surface {Double}:
         The height that will be added to the surface elevation of the target.
         The default is 0.
     add_profile_attachment {Boolean}:
         Specifies whether the tool will add an attachment to the feature with
         the profile (cross section terrain graph) between observer and
         target.NO_PROFILE_GRAPH-No profile graph will be added. This is the
         default.ADD_PROFILE_GRAPH-A profile graph will be added.

    OUTPUTS:
     out_los_feature_class (Feature Class):
         The output feature class showing lines of visible and nonvisible
         surface areas.
     out_sight_line_feature_class (Feature Class):
         The output line feature class showing the direct line of sight between
         observer and target.
     out_observer_feature_class (Feature Class):
         The output observer point feature class.
     out_target_feature_class (Feature Class):
         The output target point feature class."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.LinearLineOfSight_defense(
                *gp_fixargs(
                    (
                        in_observer_features,
                        in_target_features,
                        in_surface,
                        out_los_feature_class,
                        out_sight_line_feature_class,
                        out_observer_feature_class,
                        out_target_feature_class,
                        in_obstruction_features,
                        observer_height_above_surface,
                        target_height_above_surface,
                        add_profile_attachment,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RadialLineOfSight_defense", None)
def RadialLineOfSight(
    in_observer_features=None,
    in_surface=None,
    out_feature_class=None,
    radius=None,
    observer_height_above_surface=None,
) -> Result1[str]:
    """RadialLineOfSight_defense(in_observer_features, in_surface, out_feature_class, {radius}, {observer_height_above_surface})

       Shows areas visible to one or more observer locations.

    INPUTS:
     in_observer_features (Feature Set):
         The input observer points.
     in_surface (Raster Layer / Mosaic Dataset / Mosaic Layer):
         The input elevation raster surface.
     radius {Double}:
         The radius of the analysis area from the observer.
     observer_height_above_surface {Double}:
         The height added to the surface elevation of the observer. The default
         is 2.

    OUTPUTS:
     out_feature_class (Feature Class):
         The output polygon feature class showing visible and nonvisible
         surface areas."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RadialLineOfSight_defense(
                *gp_fixargs(
                    (in_observer_features, in_surface, out_feature_class, radius, observer_height_above_surface), True
                )
            )
        )
        return retval
    except Exception as e:
        raise e


@gptooldoc("RadialLineOfSightAndRange_defense", None)
def RadialLineOfSightAndRange(
    in_observer_features=None,
    in_surface=None,
    out_viewshed_feature_class=None,
    out_fov_feature_class=None,
    out_range_radius_feature_class=None,
    observer_height_offset=None,
    inner_radius=None,
    outer_radius=None,
    horizontal_start_angle=None,
    horizontal_end_angle=None,
) -> Result3[str, str, str]:
    """RadialLineOfSightAndRange_defense(in_observer_features, in_surface, out_viewshed_feature_class, out_fov_feature_class, out_range_radius_feature_class, {observer_height_offset}, {inner_radius}, {outer_radius}, {horizontal_start_angle}, {horizontal_end_angle})

       Shows areas visible to one or more observer locations given a
       specified distance and viewing angle.

    INPUTS:
     in_observer_features (Feature Set):
         The input observer points.
     in_surface (Raster Layer / Mosaic Dataset / Mosaic Layer):
         The input elevation raster surface. The elevation surface must be
         projected.
     observer_height_offset {Double}:
         The height added to the surface elevation of the observer. The default
         is 2.
     inner_radius {Double}:
         The minimum (nearest) distance from observers to consider for analysis
         in meters. The default is 1000.
     outer_radius {Double}:
         The maximum (farthest) distance from observers to consider for
         analysis in meters. The default is 3000.
     horizontal_start_angle {Double}:
         The left bearing limit in degrees. The default is 0.
     horizontal_end_angle {Double}:
         The right bearing limit in degrees. The default is 360.

    OUTPUTS:
     out_viewshed_feature_class (Feature Class):
         The output polygon feature class showing visible and nonvisible areas.
     out_fov_feature_class (Feature Class):
         The output polygon feature class containing the field of view range
         fan.
     out_range_radius_feature_class (Feature Class):
         The output polygon feature class containing the viewing sector created
         by the range radius, start angle, and end angle."""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

    try:
        retval = convertArcObjectToPythonObject(
            gp.RadialLineOfSightAndRange_defense(
                *gp_fixargs(
                    (
                        in_observer_features,
                        in_surface,
                        out_viewshed_feature_class,
                        out_fov_feature_class,
                        out_range_radius_feature_class,
                        observer_height_offset,
                        inner_radius,
                        outer_radius,
                        horizontal_start_angle,
                        horizontal_end_angle,
                    ),
                    True,
                )
            )
        )
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject, annotations, TYPE_CHECKING
