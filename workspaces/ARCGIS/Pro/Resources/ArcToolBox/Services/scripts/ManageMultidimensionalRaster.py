
"""-----------------------------------------------------------------------------
Name:           ManageMultidimensionalRaster.py
Purpose:        Run ManageMultidimensionalRaster
Author:         Esri Inc.
Created:        07/04/2020
Copyright:      (c)   Esri, Inc. 2018
ArcGIS Version: 10.81
-----------------------------------------------------------------------------"""
# core libraries
import json

# internal libraries
import arcpy
import rasterutils

TASK_NAME = 'ManageMultidimensionalRaster'

if __name__ == '__main__':

    # Input raster can only be:
    # '{"url":"http://a/a/b/imageserver"}',
    # '{"uri": "\\\\servername\\folder..."}'
    # '{"uri": "/cloudStores/..."}'
    # or '{"itemId":"abcdefghijklmnopqrstuvwxyz"}'
    targetMdimRas = arcpy.GetParameterAsText(0)
    manageMode = arcpy.GetParameterAsText(1)  
    variables = arcpy.GetParameter(2)  #
    inMdimRasters = arcpy.GetParameter(3)
    dimensionName = arcpy.GetParameterAsText(4)  #
    dimensionValue = arcpy.GetParameterAsText(5)
    dimensionDescription = arcpy.GetParameterAsText(6)
    dimensionUnit = arcpy.GetParameterAsText(7)

    try:
        # 0. Check Image Server extension license
        rasterutils.checkImageExtension(taskName=TASK_NAME)

        # Check Raster Analysis privilege for ArcGIS Online
        if rasterutils.RUN_ON_AGOL:
            rasterutils.checkRasterAnalysisPrivilege()

        targetMdimRas = rasterutils.getInDataPath(targetMdimRas)
        if isinstance(targetMdimRas, dict):
            targetMdimRas = json.dumps(targetMdimRas)

        var = ""
        try:
            variables=eval(variables)
        except:
            pass
        if isinstance(variables, list):
            var = ";".join(variables)
        elif isinstance(variables, str):
            var = ";".join(variables.split(","))

        inputMdimRasters = ""
        if inMdimRasters != "":
            byref, ismosaic, inputMdimRasters, allbyref = rasterutils.getHostedDataPath(inMdimRasters)


        # Execute the tool =====================================
        # if len(funcArgs) > 0:

        arcpy.AddMessage("Executing...")
        arcpy.md.ManageMultidimensionalRaster(targetMdimRas,
                                              manageMode,
                                              var,
                                              inputMdimRasters,
                                              dimensionName,
                                              dimensionValue,
                                              dimensionDescription,
                                              dimensionUnit)


        # Stop service
        aisurl = rasterutils.getISAdminUrl(targetMdimRas)
        token, referer = rasterutils.getToken(targetMdimRas, 5)
        # Read and update image service info
        sinfo = rasterutils.getServiceInfo(aisurl, token, referer)        
        newinfo = {
            "properties": {
                "hasLiveData": "true"
            }
        }
        hasLiveData = None
        if sinfo and isinstance(sinfo, dict):
            if "properties" in sinfo:
                if isinstance(sinfo["properties"], dict):
                    if "hasLiveData" in sinfo["properties"]:
                        hasLiveData =  sinfo["properties"]["hasLiveData"]
                    if hasLiveData != "true" or hasLiveData is None:
                        msg = rasterutils.updateService(aisurl, sinfo, newinfo, token, referer)
                    else:
                        try:
                            string_split = targetMdimRas[targetMdimRas.find("/rest/services")+14:targetMdimRas.find("ImageServer")].split("/")
                            params = {"serviceType":"ImageServer"}
                            if len(string_split) == 4:
                                params.update({"serviceName":string_split[2]})
                                params.update({"serviceFolder":string_split[1]})
                            elif len(string_split) == 3:
                                params.update({"serviceName":string_split[1]})
                            analysis_url = targetMdimRas.replace(targetMdimRas[(targetMdimRas.find("/rest/services")+14): len(targetMdimRas)], "/System/PublishingTools/GPServer")
                            task = rasterutils.AnalysisTasks(task="Refresh Service",analysis_url=analysis_url)
                            result = task.analysis_job(params)
                        except:
                            pass


        arcpy.AddMessage("Finished")
        outval = {"url": targetMdimRas}
        arcpy.SetParameterAsText(8, json.dumps(outval))


    except rasterutils.LicenseError as err:
        rasterutils.AddExceptionError(
            TASK_NAME, rasterutils.errorMsgs.get(120302))

    except arcpy.ExecuteError as err:
        arcpy.AddError(arcpy.GetMessages(2))

    except Exception as err:
        rasterutils.AddExceptionError(TASK_NAME, "Unexpected Error occured during service Execution. " + str(err))

