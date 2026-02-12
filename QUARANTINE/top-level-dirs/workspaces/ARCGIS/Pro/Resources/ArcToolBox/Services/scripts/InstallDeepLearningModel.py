"""-----------------------------------------------------------------------------
Name:              InstallDeepLearningModel.py
Purpose:           Install the uploaded model package (*.dlpk) from portal 
                   to the Raster Analysis Image Server
Author:            Esri Inc.
Created:           08/27/2016
Copyright:   (c)   Esri, Inc. 2018
ArcGIS Version:    10.7
-----------------------------------------------------------------------------"""
# core libraries

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'InstallDeepLearningModel'


if __name__ == '__main__':
    """
    This service tool is used to install the uploaded model package (*.dlpk) from 
    portal to the Raster Analysis Image Server. The upload model package will be 
    unpacked and saved to the server configuration store.
    """
    modelPackage = arcpy.GetParameterAsText(0)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Get the input image collection
        modelPackage = rasterutils.getInDataPath(modelPackage)
        arcpy.AddMessage("model Package is: {}".format(modelPackage))

        if modelPackage:
            install = arcpy.gp.command(
                "InstallDeepLearningModel " + modelPackage)
            if "is not a valid model package item" in install:
                arcpy.AddError(install)
            else:
                modelind = install.lower().find("models")
                if modelind > -1:
                    install = "[resources]" + install[modelind:]
                arcpy.SetParameterAsText(1, install)

    except arcpy.ExecuteError as err:
        rasterutils.AddExceptionError(TASK_NAME, err)

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        arcpy.AddError(err)

