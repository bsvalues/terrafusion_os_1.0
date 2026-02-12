"""-----------------------------------------------------------------------------
Name:              AlterProcessingStates.py
Purpose:           Alter the processing states key property of image collection
                   that used to store the block adjustment status.
Author:            Esri Inc.
Created:           12/21/2016
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'AlterProcessingStates'


class LicenseError(Exception):
    pass


def parseStates(newstates):
    """
    :param newstates: String of the new states
    :return: JSON dictionary of valid states
    """
    try:
        return json.loads(newstates)
    except Exception as err:
        arcpy.AddError("Valid orthomapping states should be JSON.")
        return None


if __name__ == '__main__':
    inic = arcpy.GetParameterAsText(0)
    newstates = arcpy.GetParameterAsText(1)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # 1. Get image collection catalog path
        inras = rasterutils.getInDataPath(inic)
        aisurl = rasterutils.getISAdminUrl(inras)

        # arcpy.AddMessage("Getting image collection catalog path from URL: {}".format(inras))
        arcpy.AddMessage("Setting image collection orthomapping states")
        icpath = rasterutils.getImageServiceDatasource(inras)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))
        # arcpy.AddMessage("The image collection path is {}".format(icpath))
        if icpath:
            orthostates = parseStates(newstates)
            if orthostates:
                finalstates = rasterutils._setOrthomappingStates(icpath, orthostates)
                if finalstates:
                    arcpy.AddMessage("Successfully set new orthomapping states.")
                    outval = {"orthomapping": finalstates}
                    arcpy.SetParameterAsText(2, json.dumps(outval))
            else:
                arcpy.AddError("No orthomapping states found in image collection")

            # Restart service to refresh the keymetadata
            token, referer = rasterutils.getToken(inras, 5)
            rasterutils.stopService(aisurl, token)
            rasterutils.startService(aisurl, token)
        else:
            arcpy.AddError("Cannot alter the processing states of image service. Access denied.")

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(err)

    except Exception as err:
        arcpy.AddError(err)
