from pyspark import SparkContext
from pyspark.sql.column import Column, _to_java_column, _to_seq
from pyspark.sql import functions as F

def _st_functions():
    sc = SparkContext._active_spark_context
    return sc._jvm.com.esri.arcgis.gae.desktop.sql.functions


def _auto_func(name, *params):
    set_params = [p for p in params if p is not None]
    cols = [_param_helper(p) for p in set_params]
    # cols = map(_param_helper, params)
    fn = getattr(_st_functions(), name)
    return Column(fn(*cols))


# will attempt to turn everything but string into a literal value
# as strings are expected to be column names
# will pass bool as boolean
def _param_helper(value):
    if isinstance(value, bool):
        return value

    if not isinstance(value, (Column, str)):
        value = F.lit(value)

    return _to_java_column(value)


def _auto_func_for_cols_only(name, *params):
    set_params = [p for p in params if p is not None]
    cols = [_java_column_only(p) for p in set_params]
    fn = getattr(_st_functions(), name)
    return Column(fn(*cols))


def _java_column_only(value):
    if not isinstance(value, Column):
        return value
    else:
        return _to_java_column(value)


def lit(geometry):
    import json
    sc = SparkContext._active_spark_context
    java_geometry = sc._jvm.com.esri.arcgis.st.geometry.Geometry.fromJson(json.dumps(geometry.json()))
    return Column(_st_functions().lit(java_geometry, getattr(sc._jvm.scala, "Option").empty()))


def cast(geometry_col, geometry_type):
    """
    Cast geometries from one type to another. This is mostly useful when going from a specific
    type (i.e. point, linestring, ...) to the generic type (i.e. geometry) and back. The result
    will be null when the geometry cannot be cast to the specified type.

    .. Note::
        `geometry_type` can be: "point", "multipoint", "linestring", "polygon", "geometry" or "unknown".

    :param geometry_col: Geometry
    :type geometry_col: pyspark.sql.Column
    :param geometry_type: Geometry type value to cast the input geometry to.
    :type geometry_type: str
    :return: A geometry column representing the cast geometry type or null if it cannot be cast.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("cast", geometry_col, F.lit(geometry_type))


# geometry constructors
# pointM is not supported
def point(x_col, y_col, z_col=None, m_col=None):
    """
    Returns a point geometry.

    :param x_col: X value for the point. Column with numeric values (x coordinates) or a numeric value.
    :type x_col: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float
    :param y_col: Y value for the point. Column with numeric values (y coordinates) or a numeric value.
    :type y_col:  pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float
    :param z_col: Z value for the point. Column with numeric values or a numeric value, defaults to None.
    :type z_col:  pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float, optional
    :param m_col: M value for the point. Column with numeric values or a numeric value, defaults to None.
    :type m_col:  pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float, optional
    :return: Point geometry type column representing the point values.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("point", x_col, y_col, z_col, m_col)


def multipoint(points):
    """
    Returns a Multipoint geometry from an array of Points.

    :param points: Array of point geometries.
    :type points: pyspark.sql.Column
    :return: Multipoint geometry type column representing the array of points.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().multipoint(_to_java_column(points)))


def linestring(points):
    """
    Returns a Linestring geometry with a single path from an array of Points.

    :param points: Array of point geometries.
    :type points: pyspark.sql.Column
    :return: Linestring geometry type column representing the array of points.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().linestring(_to_java_column(points)))


def polygon(points):
    """
    Returns a Polygon value with a single exterior ring from an array of Points.

    :param points: Array of point geometries.
    :type points: pyspark.sql.Column
    :return: Polygon geometry type column representing the array of points.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().polygon(_to_java_column(points)))


def multilinestring(*arrayOfPoints):
    """
    Returns a Linestring value with one or more paths from an array of Points arrays.

    :param arrayOfPoints: An array of point geometry arrays.
    :type arrayOfPoints: pyspark.sql.Column
    :return: Linestring geometry type column representing the array of points.
    :rtype: pyspark.sql.Column
    """
    sc = SparkContext._active_spark_context
    return Column(_st_functions().multilinestring(_to_seq(sc, arrayOfPoints, _to_java_column)))


def multipolygon(*arrayOfPoints):
    """
    Returns a Polygon with one or more exterior rings from an array of Points arrays.

    :param arrayOfPoints: An array of point geometry arrays.
    :type arrayOfPoints: pyspark.sql.Column
    :return: Polygon geometry type column representing the array of points.
    :rtype: pyspark.sql.Column
    """
    sc = SparkContext._active_spark_context
    return Column(_st_functions().multipolygon(_to_seq(sc, arrayOfPoints, _to_java_column)))


# import from text/WKT
def point_from_text(wkt_col, srid=None):
    """
    Returns a point geometry value from the Well-Known Text (WKT) representation.

    :param wkt_col: StringType column with the Well-Known Text (WKT) representation.
    :type wkt_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned point geometry, defaults to None.
    :type srid: int
    :return: Point geometry type column from the Well-Known Text (WKT) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("pointFromText", wkt_col, srid)


def mpoint_from_text(wkt_col, srid=None):
    """
    Returns a multipoint geometry value from the Well-Known Text (WKT) representation.

    :param wkt_col: StringType column with the Well-Known Text (WKT) representation.
    :type wkt_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned multipoint geometry, defaults to None.
    :type srid: int
    :return: MultiPoint geometry type column from the Well-Known Text (WKT) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("mpointFromText", wkt_col, srid)


def line_from_text(wkt_col, srid=None):
    """
    Returns a linestring geometry value from the Well-Known Text (WKT) representation.

    :param wkt_col: StringType column with the Well-Known Text (WKT) representation.
    :type wkt_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned linestring geometry, defaults to None.
    :type srid: int
    :return: Linestring geometry type column from the Well-Known Text (WKT) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("lineFromText", wkt_col, srid)


def poly_from_text(wkt_col, srid=None):
    """
    Returns a polygon geometry value from the Well-Known Text (WKT) representation.

    :param wkt_col: StringType column with the Well-Known Text (WKT) representation.
    :type wkt_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned polygon geometry, defaults to None.
    :type srid: int
    :return: Polygon geometry type column from the Well-Known Text (WKT) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("polyFromText", wkt_col, srid)


def geom_from_text(wkt_col, srid=None):
    """
    Returns the generic geometry value from the Well-Known Text (WKT) representation.

    :param wkt_col: StringType column with the Well-Known Text (WKT) representation.
    :type wkt_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned generic geometry, defaults to None.
    :type srid: int
    :return: Generic geometry type column from the Well-Known Text (WKT) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("geomFromText", wkt_col, srid)


# import from binary/WKB
def point_from_binary(wkb_col, srid=None):
    """
    Returns a point geometry value from the Well-Known Binary (WKB) representation.

    :param wkb_col: BinaryType column with the Well-Known Binary (WKB) representation.
    :type wkb_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned point geometry, defaults to None.
    :type srid: int
    :return: Point geometry type column from the Well-Known Binary (WKB) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("pointFromBinary", wkb_col, srid)


def mpoint_from_binary(wkb_col, srid=None):
    """
    Returns a multipoint geometry value from the Well-Known Binary (WKB) representation.

    :param wkb_col: BinaryType column with the Well-Known Binary (WKB) representation.
    :type wkb_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned multipoint geometry, defaults to None.
    :type srid: int
    :return: Multipoint geometry type column from the Well-Known Binary (WKB) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("mpointFromBinary", wkb_col, srid)


def line_from_binary(wkb_col, srid=None):
    """
    Returns a linestring geometry value from the Well-Known Binary (WKB) representation.

    :param wkb_col: BinaryType column with the Well-Known Binary (WKB) representation.
    :type wkb_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned linestring geometry, defaults to None.
    :type srid: int
    :return: Linestring geometry type column from the Well-Known Binary (WKB) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("lineFromBinary", wkb_col, srid)


def poly_from_binary(wkb_col, srid=None):
    """
    Returns a polygon geometry value from the Well-Known Binary (WKB) representation.

    :param wkb_col: BinaryType column with the Well-Known Binary (WKB) representation.
    :type wkb_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned polygon geometry, defaults to None.
    :type srid: int
    :return: Polygon geometry type column from the Well-Known Binary (WKB) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("polyFromBinary", wkb_col, srid)


def geom_from_binary(wkb_col, srid=None):
    """
    Returns the generic geometry value from the Well-Known Binary (WKB) representation.

    :param wkb_col: BinaryType column with the Well-Known Binary (WKB) representation.
    :type wkb_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned generic geometry, defaults to None.
    :type srid: int
    :return: Generic geometry type column from the Well-Known Binary (WKB) representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("geomFromBinary", wkb_col, srid)


# import from json/Esri Json
def point_from_esri_json(json_col, srid=None):
    """
    Returns a point geometry value from the Esri JSON representation.

    .. Note::
        The spatial reference from the Esri JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Esri JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned point geometry, defaults to None.
    :type srid: int
    :return: Point geometry type column from the Esri JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("pointFromEsriJson", json_col, srid)


def mpoint_from_esri_json(json_col, srid=None):
    """
    Returns a multipoint geometry value from the Esri JSON representation.

    .. Note::
        The spatial reference from the Esri JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Esri JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned multipoint geometry, defaults to None.
    :type srid: int
    :return: Multipoint geometry type column from the Esri JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("mpointFromEsriJson", json_col, srid)


def line_from_esri_json(json_col, srid=None):
    """
    Returns a linestring geometry value from the Esri JSON representation.

    .. Note::
        The spatial reference from the Esri JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Esri JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned linestring geometry, defaults to None.
    :type srid: int
    :return: Linestring geometry type column from the Esri JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("lineFromEsriJson", json_col, srid)


def poly_from_esri_json(json_col, srid=None):
    """
    Returns a polygon geometry value from the Esri JSON representation.

    .. Note::
        The spatial reference from the Esri JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Esri JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned polygon geometry, defaults to None.
    :type srid: int
    :return: Polygon geometry type column from the Esri JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("polyFromEsriJson", json_col, srid)


def geom_from_esri_json(json_col, srid=None):
    """
    Returns the generic geometry value from the Esri JSON representation.

    .. Note::
        The spatial reference from the Esri JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Esri JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned generic geometry, defaults to None.
    :type srid: int
    :return: Generic geometry type column from the Esri JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("geomFromEsriJson", json_col, srid)


# import from Geo Json
def point_from_geo_json(json_col, srid=None):
    """
    Returns a point geometry value from the Geo JSON representation.

    .. Note::
        The spatial reference from the Geo JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Geo JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned point geometry, defaults to None.
    :type srid: int
    :return: Point geometry type column from the Geo JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("pointFromGeoJson", json_col, srid)


def mpoint_from_geo_json(json_col, srid=None):
    """
    Returns a multipoint geometry value from the Geo JSON representation.

    .. Note::
        The spatial reference from the Geo JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Geo JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned multipoint geometry, defaults to None.
    :type srid: int
    :return: Multipoint geometry type column from the Geo JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("mpointFromGeoJson", json_col, srid)


def line_from_geo_json(json_col, srid=None):
    """
    Returns a linestring geometry value from the Geo JSON representation.

    .. Note::
        The spatial reference from the Geo JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Geo JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned linestring geometry, defaults to None.
    :type srid: int
    :return: Linestring geometry type column from the Geo JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("lineFromGeoJson", json_col, srid)


def poly_from_geo_json(json_col, srid=None):
    """
    Returns a polygon geometry value from the Geo JSON representation.

    .. Note::
        The spatial reference from the Geo JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Geo JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned polygon geometry, defaults to None.
    :type srid: int
    :return: Polygon geometry type column from the Geo JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("polyFromGeoJson", json_col, srid)


def geom_from_geo_json(json_col, srid=None):
    """
    Returns the generic geometry value from the Geo JSON representation.

    .. Note::
        The spatial reference from the Geo JSON isn't set on the returned geometry.  To set the spatial reference
        use the `srid` parameter.

    :param json_col: StringType column with the Geo JSON representation.
    :type json_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned generic geometry, defaults to None.
    :type srid: int
    :return: Generic geometry type column from the Geo JSON representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("geomFromGeoJson", json_col, srid)


# import from Esri Shape
def point_from_shape(shp_col, srid=None):
    """
    Returns a point geometry value from the shapefile representation.

    :param shp_col: BinaryType column with the shapefile representation.
    :type shp_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned point geometry, defaults to None.
    :type srid: int
    :return: Point geometry type column from the shapefile representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("pointFromShape", shp_col, srid)


def mpoint_from_shape(shp_col, srid=None):
    """
    Returns a multipoint geometry value from the shapefile representation.

    :param shp_col: BinaryType column with the shapefile representation.
    :type shp_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned multipoint geometry, defaults to None.
    :type srid: int
    :return: Multipoint geometry type column from the shapefile representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("mpointFromShape", shp_col, srid)


def line_from_shape(shp_col, srid=None):
    """
    Returns a linestring geometry value from the shapefile representation.

    :param shp_col: BinaryType column with the shapefile representation.
    :type shp_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned linestring geometry, defaults to None.
    :type srid: int
    :return: Linestring geometry type column from the shapefile representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("lineFromShape", shp_col, srid)


def poly_from_shape(shp_col, srid=None):
    """
    Returns a polygon geometry value from the shapefile representation.

    :param shp_col: BinaryType column with the shapefile representation.
    :type shp_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned polygon geometry, defaults to None.
    :type srid: int
    :return: Polygon geometry type column from the shapefile representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("polyFromShape", shp_col, srid)


def geom_from_shape(shp_col, srid=None):
    """
    Returns the generic geometry value from the shapefile representation.

    :param shp_col: BinaryType column with the shapefile representation.
    :type shp_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) set on the returned generic geometry, defaults to None.
    :type srid: int
    :return: Generic geometry type column from the shapefile representation.
    :rtype: pyspark.sql.Column
    """
    return _auto_func_for_cols_only("geomFromShape", shp_col, srid)


# export functions
def as_text(geom_col):
    """
    Returns the Well-Known Text (WKT) representation of the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: StringType column with the Well-Known Text (WKT) representation of the geometry.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().asText(_to_java_column(geom_col)))


def as_binary(geom_col):
    """
    Returns the Well-Known Binary (WKB) representation of the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: BinaryType column with the Well-Known Binary (WKB) representation of the geometry.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().asBinary(_to_java_column(geom_col)))


def as_shape(geom_col):
    """
    Returns the shapefile representation of the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: BinaryType column with the shapefile representation of the geometry.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().asShape(_to_java_column(geom_col)))


def as_geo_json(geom_col):
    """
    Returns the GeoJSON representation of the geometry.

    .. Note::
        Geometries containing an M value without a Z value will be returned as `null`.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: StringType column with the GeoJSON representation of the geometry.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().asGeoJson(_to_java_column(geom_col)))


def as_esri_json(geom_col):
    """
    Returns the Esri JSON representation of the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: StringType column with the Esri JSON representation of the geometry.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().asEsriJson(_to_java_column(geom_col)))


# spatial reference and projection
def srid(geom_col, srid=None):
    """
    Gets or sets the spatial reference Well-Known ID (SRID) for the geometry.

    .. Note::
        Specifying `srid` sets the spatial reference, otherwise the function gets the spatial reference.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) to set on the geometry, defaults to None.
    :type srid: int, optional
    :return: * **Getter**: IntegerType column representing the spatial reference Well-Known ID (SRID) for the geometry.
             * **Setter**: Geometry type column representing the geometry with the updated spatial reference.
    :rtype: pyspark.sql.Column
    """
    # set srid
    if srid is not None:
        return Column(_st_functions().srid(_to_java_column(geom_col), int(srid)))
    # get srid
    else:
        return Column(_st_functions().srid(_to_java_column(geom_col)))


def transform(geom_col, srid):
    """
    Returns the geometry projected into the given spatial reference.

    .. Note::
        A spatial reference must already be set on the input geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param srid: The spatial reference Well-Known ID (SRID) that the geometry will be projected into.
    :type srid: int
    :return: Geometry type column with the projected geometry.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().transform(_to_java_column(geom_col), int(srid)))


# point accessors
def x(point_col, new_val_col=None):
    """
    Gets or sets the x value for the given Point.

    .. Note::
        Specifying `new_val_col` sets the x value, otherwise the function gets the x value.

    :param point_col: Point Geometry
    :type point_col: pyspark.sql.Column
    :param new_val_col: X value to set. Column with numeric values or a numeric value, defaults to None.
    :type new_val_col: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float, optional
    :return: * **Getter**: DoubleType column representing the x value.
             * **Setter**: Point geometry type column representing the updated x value.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("x", point_col, new_val_col)


def y(point_col, new_val_col=None):
    """
    Gets or sets the y value for the given Point.

    .. Note::
        Specifying `new_val_col` sets the y value, otherwise the function gets the y value.

    :param point_col: Point Geometry
    :type point_col: pyspark.sql.Column
    :param new_val_col: Y value to set. Column with numeric values or a numeric value, defaults to None.
    :type new_val_col: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float, optional
    :return: * **Getter**: DoubleType column representing the y value.
             * **Setter**: Point geometry type column representing the updated y value.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("y", point_col, new_val_col)


def z(point_col, new_val_col=None):
    """
    Gets or sets the z value for the given Point.

    .. Note::
        Specifying `new_val_col` sets the z value, otherwise the function gets the z value.

    :param point_col: Point Geometry
    :type point_col: pyspark.sql.Column
    :param new_val_col: Z value to set. Column with numeric values or a numeric value, defaults to None.
    :type new_val_col: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float, optional
    :return: * **Getter**: DoubleType column representing the z value.
             * **Setter**: Point geometry type column representing the updated z value.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("z", point_col, new_val_col)


def m(point_col, new_val_col=None):
    """
    Gets or sets the m value for the given Point.

    .. Note::
        Specifying `new_val_col` sets the m value, otherwise the function gets the m value.

    :param point_col: Point Geometry
    :type point_col: pyspark.sql.Column
    :param new_val_col: M value to set. Column with numeric values or a numeric value, defaults to None.
    :type new_val_col: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float, optional
    :return: * **Getter**: DoubleType column representing the m value.
             * **Setter**: Point geometry type column representing the updated m value.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("m", point_col, new_val_col)


# geometry accessors
def max_x(geom_col):
    """
    Returns the maximum x value for the envelope of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the maximum x value for the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().maxX(_to_java_column(geom_col)))


def max_y(geom_col):
    """
    Returns the maximum y value for the envelope of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the maximum y value for the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().maxY(_to_java_column(geom_col)))


def max_z(geom_col):
    """
    Returns the maximum z value for the envelope of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the maximum z value for the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().maxZ(_to_java_column(geom_col)))


def max_m(geom_col):
    """
    Returns the maximum m value for the envelope of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the maximum m value for the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().maxM(_to_java_column(geom_col)))


def min_x(geom_col):
    """
    Returns the minimum x value for the envelope of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the minimum x value for the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().minX(_to_java_column(geom_col)))


def min_y(geom_col):
    """
    Returns the minimum y value for the envelope of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the minimum y value for the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().minY(_to_java_column(geom_col)))


def min_z(geom_col):
    """
    Returns the minimum z value for the envelope of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the minimum z value for the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().minZ(_to_java_column(geom_col)))


def min_m(geom_col):
    """
    Returns the minimum m value for the envelope of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the minimum m value for the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().minM(_to_java_column(geom_col)))


def dimension(geom_col):
    """
    Returns the dimensionality of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: IntegerType column representing the dimensionality.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().dimension(_to_java_column(geom_col)))


def geometry_type(geom_col):
    """
    Returns the Geometry type as text.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: StringType column representing the geometry type.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().geometryType(_to_java_column(geom_col)))


def area(geom_col):
    """
    Calculates the area for the Geometry passed in.

    .. Note::
        Geometries other than Polygon will return 0 for the area.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the area.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().area(_to_java_column(geom_col)))


def geodesic_area(geom_col):
    """
    Calculates the geodesic area for the Geometry passed in.

    .. Note::
        Requires a spatial reference to be set for the geometry.

    .. Note::
        Geometries other than Polygon will return 0 for the geodesic area.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the geodesic area.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().geodesicArea(_to_java_column(geom_col)))


def envelope(geom_col):
    """
    Constructs the envelope of the geometry that is the smallest rectangle that encompasses the geometry and returns it
    as a polygon.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Polygon geometry type column representing the envelope.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().envelope(_to_java_column(geom_col)))


def boundary(geom_col):
    """
    Calculates the boundary of the given geometry.

    .. Note::
        Input polygon and linestring geometry will return a boundary, point geometry will return null.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Generic geometry type column representing the boundary.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().boundary(_to_java_column(geom_col)))


def centroid(geom_col):
    """
    Returns the centroid of a Geometry as a Point, not necessarily on the surface of the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Point geometry type column representing the centroid.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().centroid(_to_java_column(geom_col)))


def point_on_surface(geom_col):
    """
    Returns a point guaranteed to lie on the surface of the input geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Point geometry type column representing a point that lies on the surface.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().pointOnSurface(_to_java_column(geom_col)))


def coord_dim(geom_col):
    """
    Returns the dimensionality of the constituent points of the Geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: IntegerType column representing the dimensionality.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().coordDim(_to_java_column(geom_col)))


def is_measured(geom_col):
    """
    Returns true if the given geometry has M values.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: BooleanType column. True if the geometry has M values, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().isMeasured(_to_java_column(geom_col)))


def is_3d(geom_col):
    """
    Returns true if given Geometry is three-dimensional (contains a Z value).

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: BooleanType column. True if the geometry is three-dimensional, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().is3D(_to_java_column(geom_col)))


def is_closed(linestring_col):
    """
    Returns true if a given Linestring's start and end points are coincident.

    :param linestring_col: Linestring Geometry
    :type linestring_col: pyspark.sql.Column
    :return: BooleanType column. True if the Linestring is closed, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().isClosed(_to_java_column(linestring_col)))


def is_empty(geom_col):
    """
    Returns true if a given geometry is empty.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: BooleanType column. True if the geometry is empty, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().isEmpty(_to_java_column(geom_col)))


def is_simple(geom_col):
    """
    Returns true if the given geometry has no self-intersection or self-tangency.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: BooleanType column. True if the geometry has self-intersection or self-tangency, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().isSimple(_to_java_column(geom_col)))


def is_ring(geom_col):
    """
    Returns true if a linestring is both closed and simple.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: BooleanType column. True if the linestring is both closed and simple, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().isRing(_to_java_column(geom_col)))


def num_geometries(geom_col):
    """
    Returns the number of geometries in a multipart geometry or 1 for single geometries.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: IntegerType column representing the number of geometries.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().numGeometries(_to_java_column(geom_col)))


def num_points(geom_col):
    """
    Returns the number of points in a given geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: IntegerType column representing the number of points.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().numPoints(_to_java_column(geom_col)))


def geometry_n(geom_col, n):
    """
    Returns the nth geometry from a multipart geometry.

    .. Note::
        n = 0, returns the first geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param n: The index of the geometry to return. Column with integer values or an integer value.
    :type n: pyspark.sql.Column: (IntegerType) or int
    :return: Generic geometry type column representing the nth geometry.
    :rtype: pyspark.sql.Column
    """
    if isinstance(n, int):
        assert n >= 0, "n must be greater than or equal to 0"
    return _auto_func("geometryN", geom_col, n)


def point_n(geom_col, n):
    """
    Returns the nth point/vertex in a linestring, polygon or a multipoint

    .. Note::
        n = 0, returns the first point.

    .. Note::
        Only works for single path multipaths and multipoints. Returns null for multilinestring or multipolygon.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param n: The index of the point to return. Column with integer values or an integer value.
    :type n: pyspark.sql.Column: (IntegerType) or int
    :return: Point geometry type column representing the nth point.
    :rtype: pyspark.sql.Column
    """
    if isinstance(n, int):
        assert n >= 0, "n must be greater than or equal to 0"
    return _auto_func("pointN", geom_col, n)


def start_point(linestring_col):
    """
    Returns the starting point for the given linestring.

    :param linestring_col: Linestring Geometry
    :type linestring_col: pyspark.sql.Column
    :return: Point geometry type column representing the starting point.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().startPoint(_to_java_column(linestring_col)))


def end_point(linestring_col):
    """
    Returns the end point for the given linestring.

    :param linestring_col: Linestring Geometry
    :type linestring_col: pyspark.sql.Column
    :return: Point geometry type column representing the end point.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().endPoint(_to_java_column(linestring_col)))


def num_interior_rings(polygon_col):
    """
    Returns the number of interior rings in a given polygon.

    :param polygon_col: Polygon Geometry
    :type polygon_col: pyspark.sql.Column
    :return: IntegerType column representing the number of interior rings.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().numInteriorRings(_to_java_column(polygon_col)))


def exterior_ring(polygon_col):
    """
    Returns the exterior ring as a Linestring for a given polygon.

    :param polygon_col: Polygon Geometry
    :type polygon_col: pyspark.sql.Column
    :return: Linestring geometry type column representing the exterior ring.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().exteriorRing(_to_java_column(polygon_col)))


def interior_ring_n(polygon_col, n):
    """
    Returns the nth interior ring of a single exterior ring polygon as a closed linestring.

    .. Note::
        n = 0, returns the first interior ring.

    :param polygon_col: Polygon Geometry
    :type polygon_col: pyspark.sql.Column
    :param n: The index of the interior ring to return. Column with integer values or an integer value.
    :type n: pyspark.sql.Column: (IntegerType) or int
    :return: Linestring geometry representing the nth interior ring.
    :rtype: pyspark.sql.Column
    """
    if isinstance(n, int):
        assert n >= 0, "n must be greater than or equal to 0"
    return _auto_func("interiorRingN", polygon_col, n)


# relationships
def contains(geom_left, geom_right):
    """
    Tests if `geom_left` contains `geom_right`.

    .. Note::
        Returns true if and only if no points of `geom_right` lie in the exterior of `geom_left`,
        and at least one point of the interior of `geom_right` lies in the interior of `geom_left`, otherwise false.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: BooleanType column. True if geom_left contains geom_right, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().contains(_to_java_column(geom_left), _to_java_column(geom_right)))


def crosses(geom_left, geom_right):
    """
    Tests if `geom_left` crosses `geom_right`.

    .. Note::
        Returns true if the intersection set is interior to both source geometries and the dimensions of the
        intersection result in a geometry whose dimension is one less than the maximum dimension of the two
        source geometries, otherwise false.

    .. Note::
        This function only returns true for the following combinations of geometries: MultiPoint/Polygon,
        MultiPoint/LineString, LineString/LineString, and LineString/Polygon comparisons.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: BooleanType column. True if geom_left crosses geom_right, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().crosses(_to_java_column(geom_left), _to_java_column(geom_right)))


def equals(geom_left, geom_right):
    """
    Tests if `geom_left` and `geom_right` are spatially equal.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: BooleanType column. True if geom_left and geom_right are spatially equal, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().equals(_to_java_column(geom_left), _to_java_column(geom_right)))


def intersects(geom_left, geom_right):
    """
    Tests if `geom_left` and `geom_right` spatially intersect in 2D (have at least one point in common).

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: BooleanType column. True if geom_left and geom_right spatially intersect in 2D, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().intersects(_to_java_column(geom_left), _to_java_column(geom_right)))


def overlaps(geom_left, geom_right):
    """
    Tests if `geom_left` and `geom_right` spatially overlap.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: BooleanType column. True if geom_left and geom_right spatially overlap, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().overlaps(_to_java_column(geom_left), _to_java_column(geom_right)))


def touches(geom_left, geom_right):
    """
    Test if `geom_left` and `geom_right` spatially touch on their boundaries.

    .. Note::
        Returns true if `geom_left` and `geom_right` have at least one point in common, but their interiors do not
        intersect.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: BooleanType column. True if geom_left and geom_right spatially touch on their borders, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().touches(_to_java_column(geom_left), _to_java_column(geom_right)))


def within(contained, container):
    """
    Tests if contained is within container.

    :param contained: Geometry
    :type contained: pyspark.sql.Column
    :param container: Geometry
    :type container: pyspark.sql.Column
    :return: BooleanType column. True if contained is within container, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().within(_to_java_column(contained), _to_java_column(container)))


def dwithin(geom_left, geom_right, dist, geodesic=False):
    """
    Tests if the `geom_left` and `geom_right` are spatially within a given distance.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :param dist: Distance value to use. Column with numeric values or a numeric value.
    :type dist: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float
    :param geodesic: Geodesic distance will be used between geometries instead of planar distance, defaults to False.
    :type geodesic: bool, optional
    :return: BooleanType column. True if geom_left and geom_right are spatially within a given distance, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("dwithin", geom_left, geom_right, dist, geodesic)


def relate(geom_left, geom_right, relation):
    """
    Compares the spatial relationship of `geom_left` and `geom_right` using the Dimensionally Extended 9-Intersection
    Model (DE-9IM_) matrix value.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :param relation: String with the DE-9IM_ matrix value that will be used to compare the spatial relationship.
    :type relation: pyspark.sql.Column: StringType or str
    :return: BooleanType column. True if the spatial relationship of geom_left and geom_right match the DE-9IM_ matrix value, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().relate(_to_java_column(geom_left), _to_java_column(geom_right), relation))


def disjoint(geom_left, geom_right):
    """
    Tests whether `geom_left` and `geom_right` are disjoint.

    .. Note::
        True if `geom_left` and `geom_right` do not intersect, false otherwise.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: BooleanType column. True if geom_left and geom_right are disjoint, false otherwise.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().disjoint(_to_java_column(geom_left), _to_java_column(geom_right)))


# set theoretic functions
def intersection(geom_left, geom_right, intersect_type=None):
    """
    Returns the intersection geometry of two input geometries. The intersect type specifies the geometry type of the
    output. Valid intersect types are "point", "multipoint", "linestring" and "polygon". The default intersect type will
    produce an output geometry with the same type as the input geometry with the lower dimension.

    .. Note::
        "point" and "multipoint" intersect types both produce a multipoint geometry.

    .. Note::
        If two geometries intersect at exactly one point, the output will still be a multipoint.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :param intersect_type: Sets the output geometry type, defaults to None.
    :type intersect_type: str, optional
    :return: Geometry
    :rtype: pyspark.sql.Column
    """
    if intersect_type:
        assert isinstance(intersect_type, str), "intersect_type must be a string."
    return _auto_func_for_cols_only("intersection", geom_left, geom_right, str(intersect_type))


def difference(geom_left, geom_right):
    """
    Returns a geometry representing the part of `geom_left` that does not intersect `geom_right`.

    .. Note::
        If `geom_left` is completely contained in `geom_right`, then null geometry is returned.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: Geometry type column representing the part of geom_left that does not intersect geom_right.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().difference(_to_java_column(geom_left), _to_java_column(geom_right)))


def union(*geom_cols):
    """
    Returns the spatial union/merge of the geometries.

    .. Note::
        \*geom_cols = geom_col_one, geom_col_two, ...

    :param geom_cols: Multiple columns columns containing geometry.
    :type geom_cols: pyspark.sql.Column
    :return: Geometry type column representing the spatial union (merge) of the geometries.
    :rtype: pyspark.sql.Column
    """
    sc = SparkContext._active_spark_context
    return Column(_st_functions().union(_to_seq(sc, geom_cols, _to_java_column)))


def split(geom_col, linestring_col):
    """
    Split a geometry with a linestring and return an array of geometries.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param linestring_col: Linestring Geometry
    :type linestring_col: pyspark.sql.Column
    :return: Geometry type column representing an array of geometries resulting from the split.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().split(_to_java_column(geom_col), _to_java_column(linestring_col)))


def sym_difference(geom_left, geom_right):
    """
    Returns a geometry representing the portions of `geom_left` and `geom_right` that do not intersect.

    :param geom_left: Geometry
    :type geom_left: pyspark.sql.Column
    :param geom_right: Geometry
    :type geom_right: pyspark.sql.Column
    :return: Geometry type column representing the portions of geom_left and geom_right that do not intersect.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().symDifference(_to_java_column(geom_left), _to_java_column(geom_right)))


def buffer(geom_col, dist):
    """
    Returns a geometry object that represents a buffer polygon relative to the given geometry at the specified distance
    around the given geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param dist: Distance used to create the buffer. Column numeric values or a numeric value.
    :type dist: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float
    :return: Polygon geometry type column representing the buffer around the input geometry.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("buffer", geom_col, dist)


def geodesic_buffer(geom_col, dist):
    """
    Returns a geometry object that represents a geodesic buffer polygon relative to the given geometry at the specified
    distance around the given geometry.
    
    .. Note::
        Requires a spatial reference to be set for the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param dist: Distance used to create the buffer. Column numeric values or a numeric value.
    :type dist: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float
    :return: Polygon geometry type column representing the geodesic buffer around the input geometry.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("geodesicBuffer", geom_col, dist)


def convex_hull(geom_col):
    """
    Calculates the convex hull of the given geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Generic geometry type column representing the convex hull of the given geometry.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().convexHull(_to_java_column(geom_col)))


# measurement functions
def distance(geom1_col, geom2_col):
    """
    Returns the planar distance between geometry1 and geometry2.

    :param geom1_col: Geometry
    :type geom1_col: pyspark.sql.Column
    :param geom2_col: Geometry
    :type geom2_col: pyspark.sql.Column
    :return: DoubleType column representing the planar distance.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().distance(_to_java_column(geom1_col), _to_java_column(geom2_col)))


def geodesic_distance(geom1_col, geom2_col):
    """
    Returns the geodesic distance between geometry1 and geometry2.

    .. Note::
        Requires a spatial reference to be set for either geometry.

    :param geom1_col: Geometry
    :type geom1_col: pyspark.sql.Column
    :param geom2_col: Geometry
    :type geom2_col: pyspark.sql.Column
    :return: DoubleType column representing the geodesic distance.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().geodesicDistance(_to_java_column(geom1_col), _to_java_column(geom2_col)))


def length(geom_col):
    """
    Returns the planar length of a given linestring.

    .. Note::
        For polygon input, this function will return the sum of the perimeter of all rings.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the planar length.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().length(_to_java_column(geom_col)))


def geodesic_length(geom_col):
    """
    Returns the geodesic length of the geometry.

    .. Note::
        Requires a spatial reference to be set for the geometry.

    .. Note::
        For polygon input, this function will return the sum of the perimeter of all rings.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: DoubleType column representing the geodesic length.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().geodesicLength(_to_java_column(geom_col)))


def azimuth(geom1_col, geom2_col):
    """
    Returns the azimuth in degrees of the segment defined by the centroid of the geometries.  It is the heading from
    geometry1 to geometry2. This angle is referenced from north and is positive clockwise.
    
    .. Note::
        Requires a spatial reference to be set for either geometry.

    :param geom1_col: Geometry
    :type geom1_col: pyspark.sql.Column
    :param geom2_col: Geometry
    :type geom2_col: pyspark.sql.Column
    :return: DoubleType column representing the normalized azimuth in degrees.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().azimuth(_to_java_column(geom1_col), _to_java_column(geom2_col)))


# aggregate geometry functions
def aggr_union(geom_col):
    """
    Returns the union of all of the geometries in the given column.

    .. Note::
        Requires all geometries to have the same type.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Geometry type column representing the union of all of the geometries.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().aggrUnion(_to_java_column(geom_col)))


def aggr_intersection(geom_col):
    """
    Calculates the intersection of all of the geometries in the given column.

    .. Note::
        When there are coincident points, the z-value from the first input geometry is used.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Geometry type column representing the intersection of all of the geometries.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().aggrIntersection(_to_java_column(geom_col)))


def aggr_convex_hull(geom_col):
    """
    Calculates the convex hull of all of the geometries in the given column.

    .. Note::
        When there are coincident points, the z-value from the first input geometry is used.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Geometry type column representing the convex hull of all of the geometries.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().aggrConvexHull(_to_java_column(geom_col)))


def aggr_stdev_ellipse(geom_col, num_stdev=1.0, weight_col=None,  min_features=2):
    """
    Returns the weighted aggregate Standard Deviational Ellipse of the geometries.

    .. Note::
        Default weight is 1 unless specified.

    .. Note::
        The `num_stdev` parameter determines the number of standard deviations of the input geometries that the
        returned ellipse will cover.

    .. Note::
        The `min_features` parameter can be set to a higher value to eliminate noise.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param num_stdev: The size of returned ellipse in standard deviations, defaults to 1.
    :type num_stdev: double, optional
    :param weight_col: A numeric column used to weight locations according to their relative importance, defaults to None.
    :type weight_col: pyspark.sql.Column: (LongType/DoubleType/StringType), optional
    :param min_features: The number of geometries that must be considered for a standard deviation to be calculated, defaults to 2.
    :type min_features: int, optional
    :return: Polygon geometry type column representing the weighted aggregate Standard Deviational Ellipse.
    :rtype: pyspark.sql.Column
    """
    if isinstance(num_stdev, (float, int)):
        assert num_stdev > 0, "num_stdev must be greater than zero."
    assert min_features > 0, "min_features must be an integer greater than zero."

    if not weight_col:
        weight_col = F.lit(1.0)

    return _auto_func_for_cols_only("aggrStdevEllipse", geom_col, float(num_stdev), weight_col, int(min_features))


def aggr_mean_center(geom_col, weight_col=None):
    """
    Returns the weighted aggregate centroid (mean center).

    .. Note::
        Default weight is 1 unless specified.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param weight_col: A numeric column used to weight locations according to their relative importance, defaults to None.
    :type weight_col: pyspark.sql.Column: (LongType/DoubleType/StringType), optional
    :return: Point geometry type column representing the weight aggregate centroid.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("aggrMeanCenter", geom_col, weight_col)


# binning functions
def square_bin(geom_col, bin_size):
    """
    Returns a key for the square bin that contains the centroid of the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param bin_size: Numeric value representing the size of the side of the square bin.
    :type bin_size: int/float
    :return: Spatial bin type column representing a single bin key for each geometry.
    :rtype: pyspark.sql.Column
    """
    assert isinstance(bin_size, (float, int)), "bin_size must be numerical"
    assert bin_size > 0, "bin_size must be greater than 0."
    return _auto_func("squareBin", geom_col, bin_size)


def square_bins(geom_col, bin_size, padding=0.0):
    """
    Returns an array of keys for all square bins that intersect the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param bin_size: Numerical value representing the size of the side of the square bin.
    :type bin_size: int/float
    :param padding: Numerical buffer value applied to the geometry before finding the intersecting bins, defaults to 0.0.
    :type padding: int/float/str, optional
    :return: Spatial bin type column representing an array of bin keys.
    :rtype: pyspark.sql.Column
    """
    assert isinstance(bin_size, (float, int)), "bin_size must be numerical"
    assert bin_size > 0, "bin_size must be greater than 0."
    assert padding >= 0, "padding must be greater than or equal to zero"
    return _auto_func("squareBins", geom_col, bin_size, float(padding))


def bin_geometry(bin_col):
    """
    Returns a polygon for the bin associated with the given key.

    :param bin_col: Spatial Bin type column with the key for the bin.
    :type bin_col: pyspark.sql.Column
    :return: Polygon geometry type column representing the polygon for the bin associated with the given key.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("binGeometry", bin_col)


def bin_center(bin_col):
    """
    Returns the center point for the bin associated with the given key.

    :param bin_col: Spatial Bin type column with the key for the bin.
    :type bin_col: pyspark.sql.Column
    :return: Point geometry type column representing the center point for the bin associated with the given key.
    :rtype: pyspark.sql.Column
    """
    return _auto_func("binCenter", bin_col)


def hex_bin(geom_col, bin_size):
    """
    Returns a key for the hexagonal bin that contains the centroid of the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param bin_size: Numerical value representing the height of the hexagonal bin.
    :type bin_size: int/float
    :return: Spatial bin type column representing a single bin key for each geometry.
    :rtype: pyspark.sql.Column
    """
    assert isinstance(bin_size, (float, int)), "bin_size must be numerical"
    assert bin_size > 0, "bin_size must be greater than 0."
    return _auto_func("hexBin", geom_col, bin_size)


def hex_bins(geom_col, bin_size, padding=0.0):
    """
    Returns an array of keys for all hexagonal bins that intersect the geometry.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param bin_size: Numerical value representing the height of the hexagonal bin.
    :type bin_size: int/float
    :param padding: Numerical buffer value applied to the geometry before finding the intersecting bins, defaults to 0.0.
    :type padding: int/float/str, optional
    :return: Spatial bin type column representing an array of bin keys.
    :rtype: pyspark.sql.Column
    """
    assert isinstance(bin_size, (float, int)), "bin_size must be numerical"
    assert bin_size > 0, "bin_size must be greater than 0."
    assert padding >= 0, "padding must be greater than or equal to 0"
    return _auto_func("hexBins", geom_col, bin_size, float(padding))


def segments(linestring_col, num_points=2, step_size=1):
    """
    Extract segments from linestrings based on existing vertices.

    :param linestring_col: Linestring Geometry
    :type linestring_col: pyspark.sql.Column
    :param num_points: Numeric column or value representing the number of points in each segment, defaults to 2.
    :type num_points: pyspark.sql.Column: (LongType/StringType) or int, optional
    :param step_size: Numeric column or value representing the number of points between the start of each new segment, defaults to 1.
    :type step_size: pyspark.sql.Column: (LongType/StringType) or int, optional
    :return: A column with an array of linestrings representing the segments.
    :rtype: pyspark.sql.Column
    """
    if isinstance(num_points, int):
        assert num_points > 0, "num_points must be greater than 0."
    if isinstance(step_size, int):
        assert step_size > 0, "step_size must be greater than 0."
    return _auto_func("segments", linestring_col, num_points, step_size)


def segmentize(linestring_col, max_segment_length):
    """
    Create segments from line with each segment being no longer than `max_segment_length`.

    :param linestring_col: Linestring geometry
    :type linestring_col: pyspark.sql.Column
    :param max_segment_length: maximum length for any segment created
    :type max_segment_length: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float
    :return: A column with an array of linestrings representing the segments.
    :rtype: pyspark.sql.Column
    """
    if isinstance(max_segment_length, int):
        assert max_segment_length > 0, "max_segment_length must be greater than 0."
    return _auto_func("segmentize", linestring_col, max_segment_length)


def simplify(geom_col):
    """
    Simplifies the geometry according to the OGC specification for the Simple Feature Access v. 1.2.1 (06-103r4).

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: Geometry type column representing the simplified geometry.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().simplify(_to_java_column(geom_col)))


def geometries(geom_col):
    """
    Returns an array of single part geometries from a multigeometry. Multipoints return an array of points,
    multilinestrings returns an array of single-path linestrings and multipolygons return an array of
    singular-exterior-ring polygons.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :return: A column with an array of single part geometries.
    :rtype: pyspark.sql.Column
    """
    return Column(_st_functions().geometries(_to_java_column(geom_col)))


def points(geom_col):
    """
    Returns an array of points found in the geometry.

    :param geom_col:
    :type geom_col: pyspark.sql.Column
    :return: A column with an array of point geometries
    """
    return Column(_st_functions().points(_to_java_column(geom_col)))


def generalize(geom_col, tolerance):
    """
    Generalizes a multipath geometry using the Douglas-Peucker_ algorithm with a specified maximum offset `tolerance`.
    The remaining vertices will be a subset of the original input vertices.

    :param geom_col: Geometry
    :type geom_col: pyspark.sql.Column
    :param tolerance: Numeric column or value representing that limits the distance the output geometry can differ from the input geometry.
    :type tolerance: pyspark.sql.Column: (LongType/DoubleType/StringType) or int/float
    :return: A geometry column with the generalized geometries.
    :rtype: pyspark.sql.Column
    """
    if isinstance(tolerance, (float, int)):
        assert tolerance >= 0, "tolerance must be greater than or equal 0."
    return _auto_func("generalize", geom_col, tolerance)
