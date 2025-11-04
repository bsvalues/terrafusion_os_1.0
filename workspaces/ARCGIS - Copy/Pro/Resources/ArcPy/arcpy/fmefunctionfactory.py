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

r""""""
__all__ = ['QuickExport', 'QuickImport']
__alias__ = 'FMEFunctionFactory'
from arcpy.geoprocessing._base import gptooldoc, gp, gp_fixargs
from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject

# Interoperability Tools toolset
@gptooldoc('QuickExport_FMEFunctionFactory', None)
def QuickExport():
    """QuickExport_FMEFunctionFactory()"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
    try:
        retval = convertArcObjectToPythonObject(gp.QuickExport_FMEFunctionFactory(*gp_fixargs((), True)))
        return retval
    except Exception as e:
        raise e

@gptooldoc('QuickImport_FMEFunctionFactory', None)
def QuickImport():
    """QuickImport_FMEFunctionFactory()"""
    from arcpy.geoprocessing._base import gp, gp_fixargs
    from arcpy.arcobjects.arcobjectconversion import convertArcObjectToPythonObject
    try:
        retval = convertArcObjectToPythonObject(gp.QuickImport_FMEFunctionFactory(*gp_fixargs((), True)))
        return retval
    except Exception as e:
        raise e


# End of generated toolbox code
del gptooldoc, gp, gp_fixargs, convertArcObjectToPythonObject