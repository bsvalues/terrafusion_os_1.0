"""-----------------------------------------------------------------------------
Name:              GenerateRaster.py
Purpose:           Apply analysis on the Cloud Raster Format
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

TASK_NAME = 'GenerateRaster'
ERROR_CODES = []
errorMsgs = {}


if __name__ == '__main__':

    inrft = arcpy.GetParameterAsText(0)
    outras = arcpy.GetParameterAsText(1)
    funcargs = arcpy.GetParameterAsText(2)
    rasprops = arcpy.GetParameterAsText(3)
    context = arcpy.GetParameterAsText(4)

    try:
        loggingEnabled = rasterutils.GPMessagesLogger(context)
    except:
        arcpy.AddMessage("Logging is not enabled")
        pass

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        # Get the output raster from JSON object that may contains ItemID, image service url or CRF
        # Example:
        # {"itemId": "no213u0uiif8924989h98h0123",
        #  "url": "http://rdvmags02.esri.com/arcgis/rest/services/Hosted/testis",
        #  "uri": "http://pds31:29080/suitabilityanalysis_1230414"}
        token = ""
        referer = ""

        outrasjson = outras
        iid, isurl, aisurl, outras = rasterutils.getOutRasterPath(outras)
        outras = rasterutils.appendcrf(outras)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        #arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outras))

        # Execute the Generate Raster tool =====================================
        # Load input raster arguments and propertis as JSON string
        # Now translating it to parameter string acceptable by the tool
        try:
            #arcpy.AddMessage(funcargs)
            argsdict = json.loads(funcargs)
            argslist = []
            #arcpy.AddMessage(str(argsdict))
            for arg in argsdict:
                # Note: the raster input supported here does not included nested raster function chain
                # Check if an argument value contains addtional dictionary
                if isinstance(argsdict[arg], dict):
                    raskeys = {"itemId", "url", "uri", "itemIds", "urls", "uris"}
                    if argsdict[arg].keys() & raskeys:
                        argsdict[arg] = rasterutils.getInDataPath(argsdict[arg])

                # Add single quote around list type argument values
                if isinstance(argsdict[arg], list) or isinstance(argsdict[arg], dict):
                    argsdict[arg] = "\'" + json.dumps(argsdict[arg], ensure_ascii=False) + "\'"
                    #argsdict[arg] = urllib.quote(unicode(argsdict[arg]).encode('utf-8'), safe='~()*!.')
                else:
                    argsdict[arg] = json.dumps(argsdict[arg], ensure_ascii=False)
                argslist.append(arg + " " + argsdict[arg])
            funcargs = ";".join(argslist)
            #arcpy.AddMessage(funcargs)
        except ValueError:
            if funcargs != "" and funcargs != "#":
                arcpy.AddMessage("Raster Arguments value is not a valid JSON document")
                funcargs = "#"
        except:
            funcargs = "#"

        try:
            propsdict = json.loads(rasprops)
            propslist = []
            for key in propsdict.keys():
                # Add single quote around list type argument values
                if isinstance(propsdict[key], list):
                    propslist.append(key + " \'" + json.dumps(propsdict[key]) + "\'")
                else:
                    propslist.append(key + " " + json.dumps(propsdict[key]))
            rasprops = ";".join(propslist)
        except ValueError:
            if (rasprops != "") and (rasprops != "#") and (rasprops != None):
                arcpy.AddMessage("Raster Properties value is not a valid JSON document")
            rasprops = "#"
        except: 
            rasprops = "#"

        #arcpy.AddMessage(funcargs)
        #arcpy.AddMessage(rasprops)

        moreags = rasterutils._parsecontext(context)
        # Set output extent and spatial reference
        outsr = rasterutils.getOutSR(context)
        # Note: the extent must always be in input raster's projection
        outext, extsr = rasterutils.getExtent(context)

        arcpy.env.outputCoordinateSystem = outsr
        arcpy.env.geographicTransformations = rasterutils.getGeoTrans(context)
        arcpy.env.extent = outext
        # arcpy.AddMessage("Output coordinate system: {}".format(outsr))
        # arcpy.AddMessage("Output extent: {}".format(outext))

        # Set output pixel size
        rmethod = rasterutils.getResamplingMethod(context)
        arcpy.env.resamplingMethod = rmethod
        arcpy.env.cellSize = rasterutils.getCellsize(context)
        arcpy.env.snapRaster = rasterutils.getSnapRaster(context)
        arcpy.env.compression = rasterutils.getcompression(context)
        #set mask env
        arcpy.env.mask = rasterutils.getMask(context)
        # Set parallel processing environment
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)
        arcpy.env.recycleProcessingWorkers = rasterutils.getRecycleProcessingWorkers(moreags)
        arcpy.env.retryOnFailures = rasterutils.getRetryOnRandomFailures(moreags)


        #inrft = inrft.replace("\\", "/")
        #inrft = inrft.replace("\\n", "")
        arcpy.AddMessage(inrft)
        arcpy.AddMessage(outras)
        arcpy.AddMessage(funcargs)
        # Set process as multidimensional option
        asmd = "ALL_SLICES"
        if "processAsMultidimensional" in moreags:
            asmd = moreags["processAsMultidimensional"]
            if type(asmd) == bool and not asmd:
                asmd = "CURRENT_SLICE"
            else:
                asmd = "ALL_SLICES"

        transpose = "NO_TRANSPOSE"
        if "buildTranspose" in moreags:
            transpose = moreags["buildTranspose"]
            if transpose and type(transpose) == bool:
                transpose = "TRANSPOSE"
            else:
                transpose = "NO_TRANSPOSE"

        result = arcpy.GenerateRasterFromRasterFunction_management(
            inrft, outras, funcargs, rasprops, format="CRF", process_as_multidimensional=asmd)
        
        if rasterutils.isEndeavour() and rasterutils.isServerDebugLogs():
            arcpy.AddMessage("********* All other tool messages for debugging **********")
            msgs = arcpy.gp.GetAllMessages()
            for msg in msgs:
                if msg[0] == 0:
                    arcpy.AddMessage(msg[2])

        uri = rasterutils.getURI(arcpy.GetMessages(), outras)
        # Call build transpose if
        if uri and asmd == "ALL_SLICES" and transpose == "TRANSPOSE":
            arcpy.management.BuildMultidimensionalTranspose(uri)

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        if not uri:
            arcpy.AddMessage("No data store URI returned.")
        else:
            arcpy.AddMessage("Updating service with data store URI.")
            # Get federated token to update image service
            if token == "" or token == "#":
                token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            newinfo = {
                "properties": {
                    "path": uri,
                    "isManaged": "true"
                }
            }
            # Set resampling type
            rmethodlist = ["NEAREST", "BILINEAR", "CUBIC", "MAJORITY"]
            # rmethodlist = ["NEAREST", "BILINEAR", "CUBIC", "MAJORITY", "BILINEAR_PLUS",
            #                "BILINEAR_GAUSSBLUR", "BILINEAR_GAUSSBLUR_PLUS",
            #                "AVERAGE", "MINIMUM", "MAXIMUM", "VECTOR_AVERAGE"]
            try:
                rindex = rmethodlist.index(rmethod)
            except:
                rindex = 0
            newinfo["properties"]["defaultResamplingMethod"] = rindex
            if "sourceType" in moreags:
                if str(moreags["sourceType"]).lower() == "thematic":
                    newinfo["properties"]["defaultResamplingMethod"] = 0

            if sinfo != {}:
                msg = rasterutils.updateService(aisurl, sinfo, newinfo, token, referer)
                arcpy.AddMessage(msg)
                # # Update Portal Item properties if necessary
                # imsg = rasterutils.updateItemProperties(iid, outrasjson)
                # arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(5, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        rasterutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
