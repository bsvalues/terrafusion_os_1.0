"""-----------------------------------------------------------------------------
Name:              GetProcessingStates.py
Purpose:           Get current orthomapping image collection states
Author:            Esri Inc.
Created:           1/1/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = u'GetProcessingStates'


if __name__ == '__main__':
    inic = arcpy.GetParameterAsText(0)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # 1. Get image collection catalog path
        inras = rasterutils.getInDataPath(inic)

        # arcpy.AddMessage("Getting image collection catalog path from URL: {}".format(inras))
        icpath = rasterutils.getImageServiceDatasource(inras)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))
        # arcpy.AddMessage("The image collection path is {}".format(icpath))

        orthostates = rasterutils._getOrthomappingStates(icpath)

        if orthostates:
            arcpy.SetParameterAsText(1, json.dumps(orthostates))
        else:
            arcpy.AddError("No orthomapping states found in image collection")

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(err)

    except Exception as err:
        arcpy.AddError(err)
