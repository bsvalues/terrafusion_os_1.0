"""-----------------------------------------------------------------------------
Name:              DeleteImageCollection.py
Purpose:           Delete image collection and items
Author:            Esri Inc.
Created:           1/7/2017
Copyright:   (c)   Esri, Inc. 2017
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import time
import os
# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'DeleteImageCollection'


if __name__ == '__main__':

    inic = arcpy.GetParameterAsText(0)

    deleteSuccess = True
    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkHostedImageryPrivilge()

        if isinstance(inic, str):
            inicdict = list(rasterutils.getJSON(inic))
            if inicdict:
                inicdict = inicdict[0]
                arcpy.AddMessage("JSON object found is: "+str(inicdict))
        else:
            inicdict = inic

        if isinstance(inicdict, dict) and "itemId" in inicdict:
            iid = inicdict["itemId"]
            isurl, aisurl = rasterutils.getISUrlFromItemID(iid)
            del inicdict["itemId"]
            inicdict["url"] = isurl

        deleteSuccess = rasterutils.deleteHostedItem(inicdict)
    
    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages())

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except Exception as err:
        arcpy.AddError(err)

    finally:
        arcpy.SetParameter(1, deleteSuccess)