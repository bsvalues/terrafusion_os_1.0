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

import collections
import re
import types

from arcpy import gp
wildcardmatch = gp.wildcardMatch
from arcpy.arcobjects._base import _BaseArcObject
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

__all__ = ['ArrayMixin', 'CursorMixin', 'GeometrySpecializationMixin', 'PointMixin', 'ResultMixin']

pagesize_tuple = collections.namedtuple('PageSize', ['width', 'height'])
bookmark_tuple = collections.namedtuple('Bookmark', ['name', 'extent'])
webmap_tuple = collections.namedtuple('Webmap', ['mapDocument', 'DPI', 'outputSizeHeight', 'outputSizeWidth'])
excludedvalues_re = re.compile("(-?[0-9]+([.][0-9]+)?)( *- *-?[0-9.]+([.][0-9]+)?)?")


class CursorMixin:
    def __iter__(self):
        def _iterwrap():
            for item in self._arc_object:
                yield convertArcObjectToPythonObject(item)
        return _iterwrap()

class ArrayMixin:
    "Allows arcgisscripting array objects to behave similarly to Python lists."
    def __len__(self):
        return self._arc_object.count
    def __iter__(self):
        for index in range(len(self)):
            yield convertArcObjectToPythonObject(self._arc_object.GetObject(index))
    def __getitem__(self, key):
        if isinstance(key, slice):
            return self.__class__([convertArcObjectToPythonObject(self._arc_object.GetObject(i))
                                   for i in range(*key.indices(self._arc_object.count))])
        elif isinstance(key, int):
            if key < 0:
                key += self._arc_object.count
            if key >= self._arc_object.count:
                raise IndexError(f'The index {key} is out of range.')
            return convertArcObjectToPythonObject(self._arc_object.GetObject(key))
        else:
            raise TypeError('Invalid argument type.')
    def __setitem__(self, index, value):
        self._arc_object.Insert(index, (value._arc_object if hasattr(value, '_arc_object') else value))
    def __repr__(self):
        return "<Array %r>" % list(convertArcObjectToPythonObject(x) for x in self)
    def __init__(self, items=[]):
        """Array({items})

             items{Object}:
           Items can include a list, a Point object, or another Array object."""
        _BaseArcObject.__init__(self)
        try:
            for item in iter(items):
                self.append(item)
        except TypeError:
            self.append(items)
    def append(self, value):
        """Array.append(value)

           Appends an object to the array in the last position.

             value(Object):
           Either a point or array object can be appended to the array."""
        if isinstance(value, (tuple, list, types.GeneratorType)):
            self.add(self.__class__(items=value))
        else:
            self.add(value)
    def extend(self, values):
        """Array.extend(items)

           Extends the array by appending elements.

             items(Object):
           Extends the array by adding strings, integers, or lists."""
        for val in values:
            self.append(val)

class GeometrySpecializationMixin:
    "Registry for specializing Geometry instances to Geometry subclasses such as Line, Point, etc."
    __type_mapping__ = {}
    class _passthrough:
        pass
    @classmethod
    def __from_scripting_arc_object__(cls, obj):
        from arcpy.arcobjects.arcobjects import Geometry

        instance = cls._passthrough()
        instance._arc_object = obj
        if obj.type.lower() in cls.__type_mapping__:
            instance.__class__ = cls.__type_mapping__[obj.type.lower()]
        return instance
    def __init__(self, *args, **kwargs):
        from arcpy.geoprocessing._base import gp_fixargs
        if not hasattr(self, '__type_string__'):
            if len(args) >= 1:
                self.__type_string__ = args[0]
                args = args[1:]
                self._arc_object = gp.CreateObject('geometry', self.__type_string__,
                                                   *gp_fixargs(args, True))
            else:
                self._arc_object = gp.CreateObject('geometry')
        else:
            self._arc_object = gp.CreateObject('geometry', self.__type_string__,
                                               *gp_fixargs(args, True))
        for attr, value in list(kwargs.items()):
            setattr(self._arc_object, attr, value)
        self._go()
    def __eq__(self, other):
        try:
            return self.equals(other)
        except ValueError:
            return False
    def __ne__(self, other):
        try:
            return not self.equals(other)
        except ValueError:
            return True
    def __add__(self, other):
        dimension_dict = {'polygon': 4, 'polyline': 2, 'multipoint': 1, 'point': 1}
        dimension = dimension_dict[self.type]
        return convertArcObjectToPythonObject(self._arc_object.intersect(other._arc_object, dimension))
    def __or__(self, other):
        return convertArcObjectToPythonObject(self._arc_object.union(other._arc_object))
    def __sub__(self, other):
        return convertArcObjectToPythonObject(self._arc_object.difference(other._arc_object))
    def __xor__(self, other):
        return convertArcObjectToPythonObject(self._arc_object.symmetricdifference(other._arc_object))
    def __reduce__(self):
        import arcpy
        return (arcpy.FromWKB, (self._arc_object.wkb, self.spatialReference))
    def __iter__(self):
        for idx in range(self.partCount):
            yield self._arc_object.GetPart(idx)
    def __getitem__(self, key):
        from ..geoprocessing._base import gp_fixargs
        if isinstance(key, slice):
            return [convertArcObjectToPythonObject(self._arc_object.GetPart(i)) for i in range(*key.indices(self.partCount))]
        elif isinstance(key, int):
            if key < 0:
                key += self.partCount
            if key >= self.partCount:
                raise IndexError(f'The index {key} is out of range.')
            return convertArcObjectToPythonObject(self._arc_object.GetPart(key))
        else:
            raise TypeError('Invalid argument type.')

    def __len__(self):
        return self.partCount

class ParameterMixin:
    def __init__(self, name=None, displayName=None, direction=None, datatype=None,
                       parameterType=None, enabled=None, category=None, symbology=None,
                       multiValue=None):
        """Parameter({name}, {displayName}, {direction}, {datatype},
           {parameterType}, {enabled}, {category}, {symbology}, {multiValue})

             name{String}:
           The parameter name.

             displayName{String}:
           The parameter label as shown on the tool's dialog box.

             direction{String}:
           Input/Output direction of the parameter.

             datatype{String}:
           The data type of the parameter.

           For a list of parameter data types, see Geoprocessing data types .

             parameterType{String}:
           Can be Required , Optional, or Derived. Derived means that the user
           of your tool does not enter a value for the parameter. Derived types
           are always output parameters.

             enabled{Boolean}:
           False if the parameter is unavailable.

             category{String}:
           The category  of the parameter.

             symbology{String}:
           The path to a layer file (.lyr) used for drawing the output.

             multiValue{Boolean}:
           True if the parameter is a multivalue parameter."""
        super(ParameterMixin, self).__init__()
        for attrib, attribvalue in (('name', name),
                                    ('displayName', displayName),
                                    ('direction', direction),
                                    ('datatype', datatype),
                                    ('parameterType', parameterType),
                                    ('enabled', enabled),
                                    ('category', category),
                                    ('symbology', symbology),
                                    ('multiValue', multiValue)):
            if attribvalue is not None:
                setattr(self, attrib, attribvalue)

class ArcSDESQLExecuteMixin:
    def __init__(self, server=None, instance=None, database=None, user=None, password=None):
        """ArcSDESQLExecute({server}, {instance}, {database}, {user},
           {password})

             server{String}:
           Name of the server on which the database is installed or a valid
           connection file.

             instance{String}:
           The port number.

             database{String}:
           Name of the database.

             user{String}:
           The user name.

             password{String}:
           The password for the user name."""
        from arcpy.geoprocessing._base import gp_fixargs
        _BaseArcObject.__init__(self, *gp_fixargs((server, instance, database, user, password), True))

class NetCDFFilePropertiesMixin:
    def __init__(self, netcdffile=None):
        """NetCDFFileProperties(netcdffile)

             netcdffile(String):
           The input netCDF file."""
        from arcpy.geoprocessing._base import gp_fixargs
        _BaseArcObject.__init__(self, *gp_fixargs((netcdffile,), True))

class SpatialReferenceMixin:
    def __init__(self, item=None, vcs=-1, text=None):
        """SpatialReference({item}, {vcs})

             item{String}:
           The spatial reference can be created in three ways: Using the name of
           the coordinate system  sr = arcpy.SpatialReference("Hawaii Albers
           Equal Area Conic") Using a projection file (.prj) sr =
           arcpy.SpatialReference("c:/coordsystems/NAD 1983.prj") Using a
           coordinate system's factory code (or authority code)   # 32145 is the
           code for:
           #  NAD 1983 StatePlane Vermont FIPS 4400 (Meters)
           sr = arcpy.SpatialReference(32145)

           For more information on coordinate system names and factory codes,
           see geographic_coordinate_systems.pdf and
           projected_coordinate_systems.pdf files in the ArcGIS Documentation
           folder.

             vcs{String / long}:
           A vertical coordinate system is associated with the coordinate system.

           For more information, see Using the spatial reference class ."""
        from arcpy.geoprocessing._base import gp_fixargs
        _BaseArcObject.__init__(self)
        if item:
            self._arc_object.createFromFile(item, vcs)
        elif text:
            self._arc_object.loadFromString(text)
    def __reduce__(self):
        import arcpy
        return (arcpy.SpatialReference, (None, None, self.exportToString(), ))
    def __eq__(self, other):
        try:
            return self.exportToString() == other.exportToString()
        except (ValueError, AttributeError):
            return False
    def __ne__(self, other):
        try:
            return self.exportToString() != other.exportToString()
        except (ValueError, AttributeError):
            return True

class FieldMappingsMixin:
    def __init__(self):
        """FieldMappings()"""
        from arcpy.geoprocessing._base import gp_fixargs
        _BaseArcObject.__init__(self)
    def __iter__(self):
        return iter(self.fieldMappings)

class FieldMapMixin:
    def __init__(self):
        """FieldMap()"""
        from arcpy.geoprocessing._base import gp_fixargs
        _BaseArcObject.__init__(self)

class FieldMixin:
    def __init__(self):
        """Field()"""
        from arcpy.geoprocessing._base import gp_fixargs
        _BaseArcObject.__init__(self)

class ExtentMixin:
    def __init__(self, *args, **kwargs):
        """Extent({XMin}, {YMin}, {XMax}, {YMax}, {ZMin}, {ZMax}, {MMin},
           {MMax}, {spatial_reference})

             XMin{Double}:
           The extent XMin value.

             YMin{Double}:
           The extent YMin value.

             XMax{Double}:
           The extent XMax value.

             YMax{Double}:
           The extent YMax value.

             ZMin{Double}:
           The extent ZMin value. None if no z-value.

             ZMax{Double}:
           The extent ZMax value. None if no z-value.

             MMin{Double}:
           The extent MMin value. None if no m-value.

             MMax{Double}:
           The extent MMax value. None if no m-value.

             spatial_reference{SpatialReference}:
           The spatial reference of the new extent.
           """
        from arcpy.geoprocessing._base import gp_fixargs, gp_fixkwargs
        from arcgisscripting import Extent
        self._arc_object = Extent(*gp_fixargs(args), **gp_fixkwargs(kwargs))
    def __eq__(self, other):
        try:
            return self.equals(other)
        except ValueError:
            return False
    def __ne__(self, other):
        try:
            return not self.equals(other)
        except ValueError:
            return True

class ValueTableMixin:
    def __init__(self, columns=None):
        """ValueTable({columns})

             columns{Integer}:
           The number of columns."""
        from arcpy.geoprocessing._base import gp_fixargs
        _BaseArcObject.__init__(self, *gp_fixargs((columns,), True))

class FieldInfoMixin:
    def __init__(self):
        """FieldInfo()"""
        from arcpy.geoprocessing._base import gp_fixargs
        _BaseArcObject.__init__(self)

class FeatureSetMixin:
    def __init__(self, *args, **kwargs):
        """FeatureSet({table})

             table_path{String}:
           The table to be imported.
             where_clause{String}:
           An SQL expression used to select a subset of records.
             time_filter{String}:
           The time instant or the time extent to query.
             renderer{String}:
           Renderer of the FeatureSet.
             is_renderer{Bool}:
           Specifies the type of the value used with the renderer.
             geojson_geometry_type{String}:
           Specifieds the type of geometry to load from geojson."""
        from arcpy.geoprocessing._base import gp_fixargs, gp_fixkwargs
        _BaseArcObject.__init__(self)
        if args or kwargs:
            self._arc_object.load(*gp_fixargs(args), **gp_fixkwargs(kwargs))

class RecordSetMixin:
    def __init__(self, *args, **kwargs):
        """RecordSet({table})

             table_path{String}:
           Table to be loaded into the RecordSet object.
             where_clause{String}:
           An SQL expression used to select a subset of records."""
        from arcpy.geoprocessing._base import gp_fixargs, gp_fixkwargs
        _BaseArcObject.__init__(self)
        if args or kwargs:
            self._arc_object.load(*gp_fixargs(args), **gp_fixkwargs(kwargs))

class PointMixin:
    "Point creation/manipulation helpers"
    def __repr__(self):
        return "<Point (%s)>" % ', '.join(str(x) if x is not None
                                                 else '#'
                                          for x in (self.X, self.Y,
                                                    self.Z, self.M))
    def __init__(self, X=None, Y=None, Z=None, M=None, ID=None):
        """Point({X}, {Y}, {Z}, {M}, {ID})

             X{Double}:
           The X coordinate of the point.

             Y{Double}:
           The Y coordinate of the point.

             Z{Double}:
           The Z coordinate of the point.

             M{Double}:
           The M value of the point.

             ID{Integer}:
           The shape ID of the point."""
        _BaseArcObject.__init__(self)
        for attr, value in zip(('X', 'Y', 'Z', 'M', 'ID'), (X, Y, Z, M, ID)):
            if value is not None:
                setattr(self, attr, value)

class ResultMixin:
    def __init__(self, toolname='', resultID=''):
        """Result(toolname, resultID)

             toolname(String):
           The name of the executed tool.

             resultID(Integer):
           The job ID."""
        _BaseArcObject.__init__(self, "%s %s" % (str(toolname), str(resultID)))
    def __repr__(self):
        return "<Result %r>" % str(self._arc_object)
    def __str__(self):
        return str(self._arc_object)
    def __unicode__(self):
        return str(self._arc_object)
    def __getitem__(self, key):
        if isinstance(key, slice):
            return [convertArcObjectToPythonObject(self.getOutput(i))
                    for i in range(*key.indices(self.outputCount))]
        elif isinstance(key, int):
            if key < 0:
                key += self.outputCount
            if key >= self.outputCount:
                raise IndexError(f'The index {key} is out of range.')
            return convertArcObjectToPythonObject(self.getOutput(key))
        elif isinstance(key, str):
            return convertArcObjectToPythonObject(self.getOutput(key))
        else:
            raise TypeError('Invalid argument type.')
    def __len__(self):
        return self.outputCount
    def __iter__(self):
        for idx in range(self.outputCount):
            yield self.getOutput(idx)
