# COPYRIGHT 2018 ESRI
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
"Data Access Module"
from arcgisscripting import da

__all__ = [item for item in dir(da) if not item.startswith("_")]

locals().update(da.__dict__)
del da


def CreateTable(path, fields=None, shape=None, configuration=None):
    """CreateTable(path, fields=None, shape=None, configuration=None)

       creates Table or FeatureClass.

    INPUTS:
      path (String): full path to new table
      fields: define new fields
         1. numpy.dtype() records
         2. sequance of arcpy.arcobjects.arcobjects.Field, the same as da.Describe()['fields']
         3. sequance of field descriptions (Field Name, Field Type, Field Alias=None, Field Length=None, IsNullable=True, Default Value = None), the same as arcpy.management.AddFields
      shape:
        define Shape field. Geometry type (String) or a tuple of (geometry_type, spacialreference=None, has_z=False, has_m=False)
        Spacial Reference can be: WKID, string, or arcpy.SpatialReference()
      configuration {String}:
        the configuration keyword applies to enterprise geodatabase

    OUTPUTS:
      tuple of path and list of added field names. Field names can be corrected and differ from the input
    """

    from arcgisscripting import da

    tobj, fields = da._createTable(path, fields, shape, configuration)
    return (path, fields)
