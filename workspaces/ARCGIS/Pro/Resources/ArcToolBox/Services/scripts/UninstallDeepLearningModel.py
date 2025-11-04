"""-----------------------------------------------------------------------------
Name:              UninstallDeepLearningModel.py
Purpose:           Used to uninstall the uploaded model package (*.dlpk) from 
                   Raster Analysis Image Server
Author:            Esri Inc.
Created:           08/27/2018
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.7
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'UninstallDeepLearningModel'


class LicenseError(Exception):
    pass


if __name__ == '__main__':
    """
    This service tool is used to uninstall the uploaded model package (*.dlpk) from 
    Raster Analysis Image Server
    """
    modelPackage = arcpy.GetParameterAsText(0)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)
        modelPackage = rasterutils.getInDataPath(modelPackage)

        if modelPackage:
            uninstall = arcpy.gp.command(
                "UninstallDeepLearningModel " + modelPackage)

            if "Failed to uninstall:" in uninstall:
                arcpy.AddError(uninstall)
            else:
                arcpy.SetParameterAsText(1, uninstall)

    except arcpy.ExecuteError as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

    except Exception as err:
        arcpy.AddError(err)

