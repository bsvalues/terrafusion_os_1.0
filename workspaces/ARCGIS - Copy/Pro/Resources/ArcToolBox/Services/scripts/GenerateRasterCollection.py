"""-----------------------------------------------------------------------------
Name:              GenerateRasterCollection.py
Purpose:           Generates a raster collection.
Author:            Esri Inc.
Created:           7/17/2017
Copyright:         (c)   Esri, Inc. 2014
ArcGIS Version:    10.6
-----------------------------------------------------------------------------"""
# core libraries
import os
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'GenerateRasterCollection'


if __name__ == '__main__':

    outcollection = arcpy.GetParameterAsText(0)
    collectionbuilder = arcpy.GetParameterAsText(1)
    collectionbuilderargs = arcpy.GetParameterAsText(2)
    inrft = arcpy.GetParameterAsText(3)
    funcargs = arcpy.GetParameterAsText(4)
    collectionprops = arcpy.GetParameterAsText(5)
    generaterasters = arcpy.GetParameterAsText(6)
    basename = arcpy.GetParameterAsText(7)
    context = arcpy.GetParameterAsText(8)

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
        iid = "" # Portal item ID
        isurl = ""  # Image Service URL
        aisurl = ""  # Image Service admin URL

        token = ""
        referer = ""

        outrasjson = outcollection
        iid, isurl, aisurl, outcollection = rasterutils.getOutRasterPath(outcollection)

        arcpy.AddMessage("Output item id is: {0}".format(iid))
        arcpy.AddMessage("Output image service url is: {0}".format(isurl))
        #arcpy.AddMessage("Output image service admin url is: {0}".format(aisurl))
        arcpy.AddMessage("Output cloud raster name is: {0}".format(outcollection))

        # Now parsing the input data source
        try:
            argsdict = json.loads(collectionbuilderargs)
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
                    argsdict[arg] = "\'" + json.dumps(argsdict[arg]) + "\'"
                else:
                    argsdict[arg] = json.dumps(argsdict[arg])

                argslist.append(arg + " " + argsdict[arg])
            collectionbuilderargs = ";".join(argslist)
            #arcpy.AddMessage(collectionbuilderargs)
        except ValueError:
            if collectionbuilderargs != "" and collectionbuilderargs != "#":
                arcpy.AddMessage("Collection Builder Arguments value is not a valid JSON document")
                collectionbuilderargs = "#"
        except:
            collectionbuilderargs = "#"

        # Input rft
        inrft = inrft.replace("\\n", "")

        # Function Arguments
        try:
            funcargsdict = json.loads(funcargs)
            funargslist = []
            for key in funcargsdict.keys():
                # Add single quote around list type argument values
                if isinstance(funcargsdict[key], list):
                    funargslist.append(key + " \'" + json.dumps(funcargsdict[key]) + "\'")
                else:
                    funargslist.append(key + " " + json.dumps(funcargsdict[key]))
            funcargs = ";".join(funargslist)
        except ValueError:
            if (funcargs != "") and (funcargs != "#") and (funcargs != None):
                arcpy.AddMessage("Function Arguments value is not a valid JSON document")
            funcargs = "#"
        except: 
            funcargs = "#"

        # Collection key properties
        try:
            propsdict = json.loads(collectionprops)
            propslist = []
            for key in propsdict.keys():
                # Add single quote around list type argument values
                if isinstance(propsdict[key], list):
                    propslist.append(key + " \'" + json.dumps(propsdict[key]) + "\'")
                else:
                    propslist.append(key + " " + json.dumps(propsdict[key]))
            collectionprops = ";".join(propslist)
        except ValueError:
            if (collectionprops != "") and (collectionprops != "#") and (collectionprops != None):
                arcpy.AddMessage("Collection Properties value is not a valid JSON document")
            collectionprops = "#"
        except: 
            collectionprops = "#"

        if generaterasters.lower() == "true":
            generaterasters = "GENERATE_RASTERS"
        elif generaterasters.lower() == "false":
            generaterasters = "NO_GENERATE_RASTERS"

        # Execute the Generate Raster Collectiontool =====================================
        # Set parallel processing environment
        moreags = rasterutils._parsecontext(context)
        arcpy.env.parallelProcessingFactor = rasterutils.getparallelfactor(moreags)

        #arcpy.env.rasterStatistics = "NONE"
        #arcpy.env.pyramid = "NONE"

        outwksp = "default"
        result = arcpy.GenerateRasterCollection_management(
            outcollection, collectionbuilder, collectionbuilderargs, inrft, funcargs, collectionprops,
            generaterasters, outwksp, "CRF", basename)

        # Update output ========================================================
        # Check if output contains URI
        # 1. If no URI found, return output as is
        # 2. If URI found, update service
        uri = rasterutils.getURI(arcpy.GetMessages(), outcollection)

        if uri == "":
            arcpy.AddMessage("No data store URI returned.")
        else:
            arcpy.AddMessage("Updating service with data store URI.")
            # Get federated token to update image service
            if token == "" or token == "#":
                token, referer = rasterutils.getToken(isurl)
            # Read and update image service info
            sinfo = rasterutils.getServiceInfo(aisurl, token, referer)
            if sinfo != {}:
                msg = rasterutils.updateSource(aisurl, sinfo, uri, token, referer)
                arcpy.AddMessage(msg)
                # # Update Portal Item properties if necessary
                # imsg = rasterutils.updateItemProperties(iid, outrasjson)
                # arcpy.AddMessage(imsg)
                rasterutils.refreshPortalItem(iid)
            else:
                arcpy.AddWarning("No service updated although data store URI generated.")

        # Set output raster parameter
        outval = {"itemId": iid, "url": isurl}
        arcpy.SetParameterAsText(9, json.dumps(outval))

    except rasterutils.LicenseError:
        rasterutils.AddExceptionError(TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))
