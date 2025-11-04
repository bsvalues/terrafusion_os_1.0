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

arcobject_to_python_class_mapping = {}

def initialize_conversion_mapping():
    from arcpy.arcobjects.arcobjects import FieldInfo, Field, Index, Cursor, Row, \
                                            Geometry, SpatialReference, FieldMappings, \
                                            FieldMap, Point, Extent, RandomNumberGenerator, \
                                            Array, ValueTable, FieldInfo, NetCDFFileProperties, \
                                            Result, RecordSet, Parameter, Schema, Filter, \
                                            ArcSDESQLExecute, Annotation
    from arcpy._mp import ob_conversion
    from arcpy.charts import _ob_conversion as ob_conversion_charts

    for k, v in (
        ("geoprocessing annotation object", Annotation),
        ("geoprocessing describe field object",  Field),
        ("geoprocessing describe index object",  Index),
        ("geoprocessing cursor object",  Cursor),
        ("geoprocessing row object",  Row),
        ("geoprocessing describe data object",  None),
        ("geoprocessing describe geometry object",  Geometry),
        ("geoprocessing spatial reference object",  SpatialReference),
        ("geoprocessing field mapping object",  FieldMappings),
        ("geoprocessing field map object",  FieldMap),
        ("geoprocessing point object",  Point),
        ("geoprocessing extent object",  Extent),
        ("geoprocessing random number generator object",  RandomNumberGenerator),
        ("geoprocessing array object",  Array),
        ("geoprocessing value table object",  ValueTable),
        ("geoprocessing field info object",  FieldInfo),
        ("geoprocessing NetCDF Workspace object",  NetCDFFileProperties),
        ("geoprocessing server result object",  Result),
        ("geoprocessing record set object",  RecordSet),
        ("geoprocessing parameter object",  Parameter),
        ("geoprocessing schema object",  Schema),
        ("geoprocessing filter object",  Filter),
        ("geoprocessing ArcSDE SQL Execute object",  ArcSDESQLExecute),
    ):
        arcobject_to_python_class_mapping[k] = v

    for k, v in ob_conversion:
        arcobject_to_python_class_mapping[k] = v

    for k, v in ob_conversion_charts:
        arcobject_to_python_class_mapping[k] = v

def convertArcObjectToPythonObject(obj):
    try:
        name=type(obj).__name__
        if name in arcobject_to_python_class_mapping:
            obj_conversion = arcobject_to_python_class_mapping[name]
            if obj_conversion is None:
                return obj
            else:
                from ._base import FromScriptingArcObject
                return FromScriptingArcObject(obj_conversion, obj)
    except AttributeError:
        pass

    if isinstance(obj, (int, float, complex, str)):
        return obj
    elif isinstance(obj, (list, tuple)):
        return type(obj)(convertArcObjectToPythonObject(o) for o in obj)
    elif isinstance(obj, dict):
        return dict((convertArcObjectToPythonObject(k),
                     convertArcObjectToPythonObject(v))
                            for (k, v) in list(obj.items()))
    else:
        return obj
