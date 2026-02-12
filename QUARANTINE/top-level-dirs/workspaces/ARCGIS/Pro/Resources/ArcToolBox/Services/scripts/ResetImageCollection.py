"""-----------------------------------------------------------------------------
Name:              ResetImageCollection.py
Purpose:           Reset image collection to its original state. It will revert
                   the image collection referenced by the image service back
                   to its original version.
Author:            Esri Inc.
Created:           12/21/2016
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import os

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'ResetImageCollection'

# Define global variable
inic = ""
aisurl = ""


def _delete_adj_tables(tbl_list):
    """
    Delete reserved adjustment tables if existed
    @param tbl_list: table list should include tie point, solution point and
    solution point table
    @return: True for successfully, False otherwise
    """
    try:
        adj_list_len = len(tbl_list)
        if adj_list_len == 7:
            clean_up_list = tbl_list[1:4]
            for tbl in clean_up_list:
                try:
                    if arcpy.Exists(tbl):
                        arcpy.management.Delete(tbl)
                        arcpy.AddMessage("Deleted adjustment table {0}".format(os.path.basename(tbl)))
                except Exception as err:
                    arcpy.AddWarning("Delete table {0} failed.".format(os.path.basename(tbl)))
                    continue
        else:
            # Clean up list is not following convention, don't delete
            return False
        return True
    except Exception as err:
        arcpy.AddWarning("Exception in cleaning up the adjustment tables.")
        return False


if __name__ == '__main__':
    """
    This service tool uses Apply Block Adjustment tool to reset to the original
    FrameXForm.
    """
    inic = arcpy.GetParameterAsText(0)

    resetSuccess = False
    try:
        # 0. Check Image Server extension license
        # if arcpy.CheckExtension("Image") != "Available":
        #     raise LicenseError

        # Get the input image collection
        inic = rasterutils.getInDataPath(inic)
        arcpy.AddMessage("Input image collection is: {}".format(inic))

        # Note: inic will always be a service url, we do not support URL
        # Have to use the admin URL for service update operation
        aisurl = rasterutils.getISAdminUrl(inic)
        icpath = rasterutils.getImageServiceDatasource(inic)
        if icpath.startswith("/enterpriseDatabases"):
            icpath = rasterutils._lookupdatastorepath(icpath)
            # arcpy.AddMessage("Temporary EGDB mosaic dataset path: {}".format(icpath))
        arcpy.AddMessage("Service admin URL: {}")

        if icpath:
            # Stop the service before update
            token, referer = rasterutils.getToken(inic, 5)
            rasterutils.stopService(aisurl, token)

            # Clean up adjustment tables
            icpaths = rasterutils.swapMDPath(icpath, "")
            _delete_adj_tables(icpaths)
            # Reset mosaic datasets
            resetSuccess = rasterutils._resetMosaicDataset(icpath)

        else:
            arcpy.AddError("Cannot find image collection path.")
            resetSuccess = False

    except arcpy.ExecuteError as err:
        arcpy.AddError(err)

    except Exception as err:
        arcpy.AddError(err)

    finally:
        arcpy.SetParameter(1, resetSuccess)
        if inic and aisurl:
            # Restart service
            token, referer = rasterutils.getToken(inic, 10)
            rasterutils.startService(aisurl, token)
