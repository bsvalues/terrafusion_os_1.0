"""-----------------------------------------------------------------------------
Name:              UploadIrregularData.py
Purpose:           This service tool allows the user to upload irregularly
                   distributed table or scientific data (netcdf/hdf/grib) to
                   cloud raster format (CRF)
Author:            Esri Inc.
Created:           11/22/2014
Copyright:   (c)   Esri, Inc. 2014
ArcGIS Version:    10.3
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils
import aolutils

TASK_NAME = 'IntepolateIrregularData'

def getInterMethod(inmethod):
    return {
        "nearest": 0,
        "idw": 4,
        "linear": 2,
        "naturalneighbor": 3,
    }.get(inmethod, 1)

if __name__ == '__main__':
    """Input data can be:
    1. Feature class/table
    2. Scientific data (netcdf file)
        - To do: make feature layer from netcdf file then set input
                 with the feature layer is not ready yet
    3. Scientific data (hdf/grib) - To do: need make point layer support
    """
    # Input data can be complete URL or ItemID
    # ItemID input is supported natively by the Generate Raster tool
    indata = arcpy.GetParameterAsText(0)
    outras = arcpy.GetParameterAsText(1)
    rasinfo = arcpy.GetParameterAsText(2)
    valfield = arcpy.GetParameterAsText(3)
    inmethod = arcpy.GetParameterAsText(4)
    radius = arcpy.GetParameterAsText(5)
    context = arcpy.GetParameterAsText(6)
    ninstance = arcpy.GetParameterAsText(7)

    try:
        # Get the output raster from JSON object that may contains ItemID, image service url or CRF
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123",
        #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
        #  "uri": "http://pds31:29080/suitabilityanalysis_1230414"}
        iid = "" # Portal item ID
        isurl = ""  # Image Service URL
        aisurl = ""  # Image Service admin URL

        token = ""
        referer = ""

        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        #arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))

        # Get the input feature data path from JSON object
        indata = rasterutils.getInDataPath(indata)

        # Execute the Generate Raster tool =====================================
        outsr = rasterutils.getOutSR(context)
        outext, outextsr = rasterutils.getExtent(context)
        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = ninstance

        inrft = "InterpolateIrregularData"
        intbl = "Table " + indata
        # Note: I am using rasinfo as is, because generate raster function takes JSON string
        rasinfo = "RasterInfo \'" + rasinfo + "\'"
        inmethod = "InterpolationMethod " + str(getInterMethod(inmethod.lower()))
        valfield = "ValueField " + valfield
        radius = "Radius " + radius
        rasargs = ";".join([intbl, rasinfo, inmethod, valfield, radius])
        #arcpy.AddMessage(rasargs)
        result = arcpy.GenerateRasterFromRasterFunction_management(
            inrft, outras, rasargs, format="CRF")
        #arcpy.AddMessage(result.getOutput(0))

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outras)

        if uri == "":
            arcpy.AddMessage("No Data store URI.")
        else:
            arcpy.AddMessage("Data store URI: {0}".format(uri))
            # Get federated token to update image service
            if token == "" or token == "#":
                token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                rasterutils.refreshPortalItem(iid)
                arcpy.AddMessage(msg)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(8, json.dumps(outval))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))
        aolutils.AddExceptionError(TASK_NAME, err)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)
