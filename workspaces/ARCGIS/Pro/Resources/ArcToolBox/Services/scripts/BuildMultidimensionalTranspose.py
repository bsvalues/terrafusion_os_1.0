"""-----------------------------------------------------------------------------
Name:              BuildMultidimensionalTranspose.py
Purpose:           BuildMultidimensionalTranspose
Author:            Esri Inc.
Created:           05/01/2019
Copyright:   (c)   Esri, Inc. 2019
ArcGIS Version:    10.8
-----------------------------------------------------------------------------"""
# core libraries
import json
import os

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'BuildMultidimensionalTranspose'

if __name__ == '__main__':

    imageservice = arcpy.GetParameterAsText(0)
    deleteTranspose = arcpy.GetParameterAsText(1)
    context = arcpy.GetParameterAsText(2)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 0. Set GP environment settings
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags, "om")

        # 1. Get input image collection path
        isurl = rasterutils.getInDataPath(imageservice)
        # arcpy.AddMessage(isurl)
        ispath = rasterutils.getImageServiceDatasource(isurl)
        # arcpy.AddMessage(ispath)

        # Converting boolean parameter to keyword
        if deleteTranspose.lower() == "true":
            deleteTranspose = "DELETE_TRANSPOSE"
        else:
            deleteTranspose = "NO_DELETE_TRANSPOSE"

        if ispath:
            if not ispath.lower().endswith(".crf"):
                arcpy.AddError("image service source data is not cloud raster format.")
            else:
                arcpy.management.BuildMultidimensionalTranspose(ispath, deleteTranspose)
        elif ((isinstance(isurl,str)) and isurl.endswith(".crf")):
            arcpy.management.BuildMultidimensionalTranspose(isurl, deleteTranspose)
        else:
            arcpy.AddError("Cannot get the image service source path.")

        outval = {"url": isurl}
        arcpy.SetParameterAsText(3, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
