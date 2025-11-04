"""-----------------------------------------------------------------------------
Name:              DeleteImageFromImageCollection.py
Purpose:           This service remove image item from a image collection, and
                   update the properties of the mosaic dataset referenced by
                   the image layer.
Author:            Esri Inc.
Created:           12/21/2015
Copyright:   (c)   Esri, Inc. 2015
ArcGIS Version:    10.5
-----------------------------------------------------------------------------"""
# core libraries
import json
import os

# internal libraries
import arcpy
import rasterutils
import rastertypes

TASK_NAME = 'DeleteImageFromImageCollection'


def deleteSource(icpath, where):
    """
    :param icpath: mosaic dataset catalog path
    :param where: the where clause
    :return: list of deleted images
    """
    try:
        imglist = []
        # Delete the source image
        temppaths = "in_memory/mdpath"
        arcpy.ExportMosaicDatasetPaths_management(
            icpath, out_table=temppaths, where_clause=where, types_of_paths="RASTER")

        with arcpy.da.SearchCursor(temppaths, ["SourceOID", "Path"]) as cur:
            for row in cur:
                if row[0] > 0 and arcpy.Exists(row[1]):
                    # Try to delete images
                    try:
                        arcpy.Delete_management(row[1])
                        imglist.append(os.path.basename(row[1]))
                    except Exception as exc:
                        arcpy.AddWarning("Failed to delete existing images: {}".format(str(exc)))
                        continue
        return imglist

    except arcpy.ExecuteError as excerr:
        arcpy.AddError(str(excerr))
        arcpy.AddError(arcpy.GetMessages())
        return []

    except Exception as err:
        arcpy.AddError(str(err))
        arcpy.AddError(arcpy.GetMessages())
        return []


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)
    where = arcpy.GetParameterAsText(1)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkHostedImageryPrivilge()

        # 1. Validating input parameters
        # Find the output mosaic dataset referenced by the image layer
        inic = rasterutils.getInDataPath(inic)
        aisurl = rasterutils.getISAdminUrl(inic)

        # 2. Remove Raster Data from the Collection ============================
        if inic:
            if not rasterutils.RUN_ON_AGOL:
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.stopService(aisurl, token)

            # Get image collection catalog path
            # arcpy.AddMessage("Getting image collection catalog path from URL: {}".format(inic))
            icpath = rasterutils.getImageServiceDatasource(inic)
            # arcpy.AddMessage("The image collection path is {}".format(icpath))

            arcpy.AddMessage("Removing item from image collection...")

            # Remove item from collection
            arcpy.RemoveRastersFromMosaicDataset_management(icpath, where)
            # TODO: synchronize the collection
            # arcpy.SynchronizeMosaicDataset_management(
            #         isurl, update_overviews="UPDATE_OVERVIEWS")

            if not rasterutils.RUN_ON_AGOL:
                # Restart service
                token, referer = rasterutils.getToken(inic, 5)
                rasterutils.startService(aisurl, token)
                # TODO: Refresh portal item/image service with updated collection

            outval = {"url": inic}
            arcpy.SetParameterAsText(2, json.dumps(outval))

        else:
            arcpy.AddError("No valid image collection found.")

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        arcpy.AddError(str(err))
