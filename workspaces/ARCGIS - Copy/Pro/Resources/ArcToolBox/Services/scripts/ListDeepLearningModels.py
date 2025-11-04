"""-----------------------------------------------------------------------------
Name:              ListDeepLearningModels.py
Purpose:           This service tool is used to list all the
                   installed deep learning models on the Raster Analysis Image Server.
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

TASK_NAME = 'ListDeepLearningModels'


class LicenseError(Exception):
    pass


if __name__ == '__main__':
    """
    This service tool is used to list all the
    installed deep learning models on the Raster Analysis Image Server.
    """

    try:
       # Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)
        deepLearningModels = arcpy.gp.command("listdeeplearningmodels")
        if deepLearningModels:
          arcpy.SetParameterAsText(0, deepLearningModels)

    except arcpy.ExecuteError as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

    except Exception as err:
        rasterutils.AddExceptionError(
            TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))