#COPYRIGHT 2018 ESRI
#
#TRADE SECRETS: ESRI PROPRIETARY AND CONFIDENTIAL
#Unpublished material - all rights reserved under the
#Copyright Laws of the United States.
#
#For additional information, contact:
#Environmental Systems Research Institute, Inc.
#Attn: Contracts Dept
#380 New York Street
#Redlands, California, USA 92373
#
#email: contracts@esri.com

from arcpy import gp
from arcpy.arcobjects.arcobjects import Geometry
import arcpy
import json


__all__ = ['Dimension', 'Multipatch', 'Multipoint',
           'PointGeometry', 'Polygon', 'Polyline', 'AsShape',
           'FromCoordString', 'GenerateOptimalCoordinateSystem']

class Dimension(Geometry):
    __type_string__ = "dimension"

class Multipatch(Geometry):
    __type_string__ = "multipatch"

class Multipoint(Geometry):
    """Multipoint objects are ordered collection of points."""
    __type_string__ = "multipoint"

    def __init__(self, inputs, spatial_reference=None, has_z=None, has_m=None,
                 has_id=None):
        super().__init__(inputs, spatial_reference, has_z, has_m, has_id)

    def __iter__(self):
        for x in range(self.partCount):
            yield self.getPart(x)

    @property
    def __geo_interface__(self):
        return {'type': 'Multipoint', 'coordinates': [(pt.X, pt.Y) for pt in self]}

    @classmethod
    def _fromGeoJson(cls, data):
        from arcpy.arcobjects.arcobjects import Point, Array
        coordkey = ([d for d in data if d.lower() == 'coordinates']
                     or ['coordinates']).pop()
        coordinates = data[coordkey]
        return cls(Array([Point(*p) for p in coordinates]), arcpy.SpatialReference(4326))

class PointGeometry(Geometry):
    """A PointGeometry is a shape that has neither length nor area at a given
       scale."""
    __type_string__ = "point"

    def __init__(self, inputs, spatial_reference=None, has_z=None, has_m=None,
                 has_id=None):
        super().__init__(inputs, spatial_reference, has_z, has_m, has_id)

    @property
    def __geo_interface__(self):
        return {'type': 'Point', 'coordinates': (self.getPart(0).X,
                                                 self.getPart(0).Y)}
    @classmethod
    def _fromGeoJson(cls, data):
        from arcpy.arcobjects.arcobjects import Point
        coordkey = ([d for d in data if d.lower() == 'coordinates']
                     or ['coordinates']).pop()
        coordinates = data[coordkey]
        return cls(Point(*coordinates), arcpy.SpatialReference(4326))

    def toCoordString(self, notation):
        """PointGeometry.toCoordString({notation})"""
        from arcpy.geoprocessing._base import gp_fixargs
        from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
        return convertArcObjectToPythonObject(self._arc_object.toCoordString(*gp_fixargs((notation,))))

class Polygon(Geometry):
    """A Polygon object is a closed shape defined by a connected sequence of x,y
       coordinate pairs."""
    __type_string__ = "polygon"

    def __init__(self, inputs, spatial_reference=None, has_z=None, has_m=None,
                 has_id=None):
        super().__init__(inputs, spatial_reference, has_z, has_m, has_id)

    def __iter__(self):
        for x in range(self.partCount):
            yield self.getPart(x)

    @property
    def __geo_interface__(self):
        def split_part(a_part):
            part_list = []
            for item in a_part:
                if item is None:
                    if part_list:
                        yield part_list
                    part_list = []
                else:
                    part_list.append((item.X, item.Y))
            if part_list:
                yield part_list
        part_json = [list(split_part(part))
                     for part in self]
        return {'type': 'MultiPolygon', 'coordinates': part_json}

    @classmethod
    def _fromGeoJson(cls, data):
        from arcpy.arcobjects.arcobjects import Point, Array
        coordkey = ([d for d in data if d.lower() == 'coordinates']
                     or ['coordinates']).pop()
        coordinates = data[coordkey]
        typekey = ([d for d in data if d.lower() == 'type']
                     or ['type']).pop()
        if data[typekey].lower() == "polygon":
            coordinates = [coordinates]
        part_list = []
        for part in coordinates:
            part_item = []
            for idx, ring in enumerate(part):
                if idx:
                    part_item.append(None)
                for coord in ring:
                    part_item.append(Point(*coord))
            if part_item:
                part_list.append(Array(part_item))
        return cls(Array(part_list), arcpy.SpatialReference(4326))

class Polyline(Geometry):
    """A Polyline object is a shape defined by one or more paths, in which a
       path is a series of connected segments."""
    __type_string__ = "polyline"

    def __init__(self, inputs, spatial_reference=None, has_z=None, has_m=None,
                 has_id=None):
        super().__init__(inputs, spatial_reference, has_z, has_m, has_id)

    def __iter__(self):
        for x in range(self.partCount):
            yield self.getPart(x)

    @property
    def __geo_interface__(self):
        return {'type': 'MultiLineString', 'coordinates': [[((pt.X, pt.Y) if pt else None)
                                                                for pt in part]
                                                                    for part in self]}
    @classmethod
    def _fromGeoJson(cls, data):
        from arcpy.arcobjects.arcobjects import Point, Array
        coordkey = ([d for d in data if d.lower() == 'coordinates']
                     or ['coordinates']).pop()
        if data['type'].lower() == 'linestring':
            coordinates = [data[coordkey]]
        else:
            coordinates = data[coordkey]
        return cls(Array([[Point(*p) for p in part] for part in coordinates]),
                   arcpy.SpatialReference(4326))

for cls in (Dimension,
            Multipatch, Multipoint,
            PointGeometry, Polygon,
            Polyline):
    Geometry.__type_mapping__[cls.__type_string__] = cls

del cls

def AsShape(geojson_struct, esri_json=False):
    """AsShape(geojson_struct, {esri_json})

       Converts Esri JSON or GeoJSON to ArcPy geometry or feature set objects.
       GeoJSON is a geospatial data interchange format for encoding geographic
       data
       structures.

         geojson_struct(Dictionary):
       The geojson_struct includes type and coordinates .

       The following strings are  included for type : Point , LineString ,
       Polygon , MultiPoint , and MultiLineString .

         esri_json{Boolean}:
       Sets whether the input JSON is evaluated as Esri JSON or GeoJSON.  If
       True, the input is evaluated as Esri JSON."""
    if esri_json:
        if not isinstance(geojson_struct, str):
            geojson_struct = json.dumps(geojson_struct)
        from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
        return convertArcObjectToPythonObject(gp.fromEsriJson(geojson_struct))
    else:
        mappings = {
                        'point': PointGeometry,
                        'multipoint': Multipoint,
                        'polygon': Polygon,
                        'multipolygon': Polygon,
                        'multilinestring': Polyline,
                        'linestring': Polyline
                   }
        if isinstance(geojson_struct, str):
            geojson_struct = json.loads(geojson_struct)
        import arcpy
        assert isinstance(geojson_struct, dict),\
                arcpy.GetIDMessage(88023, 'Invalid Geometry Data')
        assert (geojson_struct.get('type', None) or '').lower() in mappings,\
                arcpy.GetIDMessage(88023, 'Invalid Geometry Data')
        return mappings[geojson_struct.get('type').lower()]._fromGeoJson(geojson_struct)

def FromCoordString(coordinate_str, notation):
    """FromCoordString(coordinate_str, notation)

    Convert string in various notation formats (aka notations): DD, DDM, DMS, GARS, GEOREF, UTM, USNG, MGRS to a
    PointGeometry.

     coordinate_str(string):
    A string in a certain format that represents the coordinates of a point.

     notation (string):
    A string represents the format of the coordinate_str. The following formats are supported: MGRS, USNG, UTM, UTMNS,
    GEOREF, GARS, DMS, DMS_1, DMS_2, DDM, DDM_1, DDM_2, DD, DD_1, DD_2, DD_NUMERIC.

    This function is going to return an instance of PointGeometry with spatial reference of WGS_1984.
    """
    from arcpy.geoprocessing._base import gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
    return convertArcObjectToPythonObject(gp._arc_object.FromCoordString(*gp_fixargs((coordinate_str, notation))))

def GenerateOptimalCoordinateSystem(extent, property, custom_name=None):
    """GenerateOptimalCoordinateSystem(extent, property, {custom_name})

    Get a custom coordinate system that matches a specified extent and projection property.

     extent(Extent):
    An arcpy.Extent object that represents the extent of interest. The spatial reference of the extent needs to be in a
    geographic coordinate system.
     property(string):
    A string that represents the projection property of the custom projected coordinate system. The following properties
    are supported: equal_area, conformal, equidistant_one_point, equidistant_meridians, and compromise_world.
    equal_area, equidistant_one_point properties are supported for all extents of interest; conformal,
    equidistant_meridians properties are supported only for large-scale extents; and compromise_world property only
    supports full world extents.
     custom_name(string):
    A string that specifies the name of the custom projected coordinate system. The name will be "Custom_Projection" if
    not specified.

    This function returns an instance of SpatialReference with a custom projected coordinate system matching the
    specified extent and projection property.
    """
    from arcpy.geoprocessing._base import gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
    return convertArcObjectToPythonObject(gp._arc_object.generateoptimalprojectedcoordinatesystem(*gp_fixargs((extent, property, custom_name))))
