"""---------------------------------------------------------------------------
Name:              aolutils.py
Purpose:           Helper methods for aol scripts
Author:            Esri Inc.
Created:           1/7/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
---------------------------------------------------------------------------"""
import arcpy
import os
import json
import sys
import re
import copy
import time
import urllib.request
import urllib.parse
import collections
import gzip
import ast

#try:
#    import cStringIO as sio
#except ImportError as ex:
#    import StringIO as sio

TASK_ERROR_CODES = {
    "AggregatePoints":100001,
    "FindHotSpots":100007,
    "CreateBuffers":100012,
    "OverlayLayers":100013,
    "SummarizeWithin":100014,
    "EnrichLayer":100020,
    "SummarizeNearby":100025,
    "ExtractData":100026,
    "DissolveBoundaries":100027,
    "CreateDriveTimeAreas":100028,
    "MergeLayers":100029,
    "FindNearest":100030
}

def addRemoveToolboxes(addToolbox, *reqdToolboxes):
    '''Adds or removes required toolboxes'''
    scriptFolder = os.path.dirname(sys.path[0])
    tbx_path = os.path.join(os.path.dirname(scriptFolder),"toolboxes")
    if addToolbox :
        for tbx in reqdToolboxes:
            arcpy.gp.addToolbox(os.path.join (tbx_path, tbx))
    else :
        for tbx in reqdToolboxes:
            arcpy.gp.removeToolbox(os.path.join (tbx_path, tbx))

# End def addRemoveToolboxes


def getFieldAlias(inputLayer, *field_names):
    '''returns field alias '''
    return [arcpy.ListFields(inputLayer,fieldName)[0].aliasName for fieldName in field_names]

# End def getFieldAlias


def createOutputLocations(hostedgp, output_name):
    ''' Provides the storage location on cloud server'''
    return hostedgp.GetOutputCatalogPath(output_name).path


# End def createOutputLocations


def createOutputLayer(hostedgp, output_name, tool_desc, sdsPath):
    #str = json.dumps(tool_desc)
    #arcpy.AddMessage(str)
    #arcpy.AddMessage(json.dumps(tool_desc))
    return hostedgp.ProcessOutput(output_name, json.dumps(tool_desc), sdsPath)


# End def createOutputLayer


def createLayerOutDesc(outputDesc, data=None, pos=0, ltype="layer"):
    '''create layerOutDescription from outDescription Alternative'''

    output_desc = copy.deepcopy(outputDesc)
    if ltype == "layer" and data:
        layerProperties = output_desc["layerProperties"][pos]
        if "rendererDef" in layerProperties and not "drawingInfo" in layerProperties:
            try:
                # update symbology using rendererdef
                arcpy.MakeFeatureLayer_management(data,"outLayer")
                outLayerName = arcpy.mapping.Layer("outLayer")
                outLayerName._arc_object.setsymbology(layerProperties["rendererDef"])
                layerProperties["drawingInfo"] = json.loads(outLayerName._arc_object.getsymbology())
                layerProperties.pop("rendererDef")
            except:
                arcpy.AddWarning("unable to support the renderer definition")
                output_desc["layerProperties"][pos].pop("rendererDef")

    output_desc["layerProperties"] = output_desc["layerProperties"][pos]
    return output_desc

# End def createLayerOutDesc


def getSummaryField(fieldList, fieldName, summary):
    ''' given the field name and summary finds the possible field name'''
    baseName = "{}_{}".format(summary, fieldName)
    #fieldList = arcpy.ListFields(aggregatedPolygons, "{0}*".format(baseName))
    #fieldList = arcpy.ListFields(aggregatedPolygons, baseName + "*")
    # is there a better logic to find _1, _2 fields, wild card in ListFields doesn't accept regular expr?
    couldBeFields = [field for field in fieldList
                     if (field.name.lower() == baseName.lower()) or
                     re.match("^{0}\_\d".format(baseName), field.name)]
    arcpy.AddMessage("baseName: {}, count :{}".format(baseName, len(couldBeFields)))
    couldBeFields.sort()
    return couldBeFields.pop()

# End def getSummaryFieldName

def convertSummaryFieldstoArray(summaryFields):
    """Converts multivalue summary fields to array of arrays for easier processing"""
    if summaryFields:
        sumFields = [summaryField.strip("'").split() for summaryField in summaryFields.split(';')]
        return [[sumField[0], sumField[1].capitalize()] for sumField in sumFields
                if sumField[1].lower() in ["min","max","sum","mean","stddev"]]
    else:
        return None

# End def convertSummaryFieldsToArray


def AddTimerMessage(startTime, msg):
    currentTime = time.time()
    elapsedTime = currentTime - startTime
    arcpy.AddMessage("Timer: {0:.3f} {1}".format(elapsedTime,msg))
    return currentTime

# End def LogUsageMetering


def LogUsageMetering(taskName, numObjects, cost, startTime, values):
    elapsed = time.time() - startTime
    valuesMsg = taskName + json.dumps(values)

    arcpy.AddMessage("NumObjects: {} Cost: {}".format(numObjects, cost))
    arcpy.AddMessage("{0} Elapsed: {1:.3f}".format(valuesMsg, elapsed))

    #arcpy.gp._arc_object.LogUsageMetering(5555, taskName, numObjects, cost)
    arcpy.gp._arc_object.LogUsageMetering(7777, valuesMsg, numObjects, elapsed)

# End def LogUsageMetering


def GetShapeTypeCode(shapeType):
    if shapeType == 'esriGeometryPolyline':
        code = 2
    elif shapeType == 'esriGeometryPolygon':
        code = 3
    else:
        code = 1
    return code

# End def GetShapeTypeCode


def createUniqueFieldName(input_layer, field_name, field_alias):
    """Return unique field name and field alias name."""
    fieldNames = [f.name for f in arcpy.ListFields(input_layer, field_name)]
    i = 1
    while (field_name in fieldNames):
        field_name = "{0}_{1}".format(field_name, i)
        field_alias = "{0}_{1}".format(field_alias, i)
        i += 1
    return field_name, field_alias

# End def createUniqueFieldName


def AddErrorCode(errorCode, errorMsg , params=None , warning=False):
    """Converts errors into JSON format for localization"""
    msg = {}
    msg["messageCode"] = "AO_{}".format(errorCode)
    if errorMsg[-1]!= ".":
        errorMsg = "{}.".format(errorMsg)
    msg["message"] = errorMsg
    if params:
        msg["params"] = params
    if warning:
        arcpy.gp.addWarning(json.dumps(msg),errorCode)
    else:
        arcpy.gp.addError(json.dumps(msg),errorCode)

# End def AddErrorCode


def AddExecuteErrors(taskName, errorCodes):
    """Find and Log known error codes."""

    errors = [msg for msg in arcpy.gp.GetAllMessages()
              if msg[1] in errorCodes]
    if errors:
        for error in errors:
            errorCode = error[1]
            errorMsg = error[2].split(': ', 1)[-1]
            try:
                json.loads(errorMsg)
            except ValueError:
                AddErrorCode(errorCode, errorMsg)

    # Add tool failed message
    AddExceptionError(taskName)
    # report all messages for debugging
    arcpy.AddMessage("********* All other tool messages for debugging **********")
    for msg in arcpy.gp.GetAllMessages():
        arcpy.AddMessage(msg)
# End def AddExecuteErrors

def AddExceptionError(taskName, err=None):
    """Catch GPCloudExec and Add toolfailed message"""

    if err:
        #import types
        #if types.TypeType(err) is agolgp.GPCloudExec:
        #    errmsg = str(err)
        #    if errmsg:
        #        arcpy.AddError(str(err))
        #else:
        arcpy.AddMessage(str(err))
        # report task failed
    if taskName in TASK_ERROR_CODES:
        AddErrorCode(TASK_ERROR_CODES[taskName], "{} failed.".format(taskName))
    else:
        arcpy.AddError("{} failed.".format(taskName))
        arcpy.AddMessage("Note to developer: Add task to TASK_ERROR_CODE dictionary in aolutils.py")

# End def AddExceptionError

def AddRemoteToolExecuteErrorsAndWarnings(result, severity, ignore_error_codes=None):
    """Log error and warning messages from execution of remote tools. Messages that have
    codes matching with ignore_error_codes are not logged.
    Note that this function is similar to AddExecuteErrors. But a new
    function is required as when executing remote tools, arcpy.gp.GetAllMessages()
    does not return the actual messages from the result object. Also result.getAllMessages()
    does not populate the error codes for the error messages.
    """

    messages = result.getMessages(severity).split("\n")
    msg_function = arcpy.AddWarning if severity == 1 else arcpy.AddError
    #Do not report any blank messages or messages that start with Failed
    for msg in messages:
        if msg:
            if not msg.startswith("Failed"):
                #Do not include error and warning codes
                if msg.find(": ") != -1:
                    code, message = msg.split(": ",1)
                    try:
                        code = long(code.split(" ")[-1])
                        if ignore_error_codes and code in ignore_error_codes:
                            continue
                    except ValueError as ex:
                        message = msg
                else:
                    message = msg
                msg_function(message)

# End def AddRemoteToolExecuteErrorsAndWarnings

def DebugLayer(parameter, layer):
    """Debug layer."""

    arcpy.AddMessage(u'{} Layer: {},{},{},{}'.format(parameter, layer.name, layer.layername, layer.shapeType, layer.count))
    d = arcpy.Describe(layer.name)
    arcpy.AddMessage(u'{} data path: {}'.format(parameter, d.catalogPath))

# End def DebugLayer

def DebugExtent():
    """Debug extent."""

    extent = arcpy.env.extent
    if not extent is None:
        sr = extent.spatialReference
        if not sr is None:
            factoryCode = sr.factoryCode
        else:
            factoryCode = 0
        extentMsg = "Extent: {},{},{},{},{}".format(extent.XMin, extent.YMin, extent.XMax, extent.YMax, factoryCode)
        arcpy.AddMessage(extentMsg)

# End def DebugExtent

def getPortalProperties(owning_system_url):
    '''Return a dict of portal properties by making a portal self call.'''

    #Make the URL to the portal self from the owning system URL
    try:
        if owning_system_url.endswith("/"):
            # Changed to address Coverity CID 278247
            owning_system_url.rstrip("/")
        portal_self_url = owning_system_url + "/sharing/portals/self"
        query_params_dict = {"f" : "json"}
        query_params = urllib.parse.urlencode(query_params_dict)
        request = urllib.request.Request(portal_self_url)
        request.add_data(query_params)
        request.add_header("Accept-Encoding", "gzip")
        zipped_response = urllib.request.urlopen(request)
        if zipped_response.info().get("Content-Encoding") == "gzip":
            buf = sio.StringIO(zipped_response.read())
            response = gzip.GzipFile(fileobj=buf)
            response_dict = json.load(response)
            return response_dict
        else:
            raise Exception("Failed to get portal properties")
    except Exception as ex:
        raise Exception("Failed to get portal properties")

# End def getPortalProperties

def getServiceUrl(owning_system_url, helper_service_key, make_self_call=True):
    '''Return the URL to the service area GP service based on the owning system URL.'''
    service_rest_url = ""
    if make_self_call:
        portal_properties = getPortalProperties(owning_system_url)
        service_rest_url = portal_properties["helperServices"][helper_service_key]["url"]
    else:
        split_result = urllib.parse.urlsplit(owning_system_url)
        agol_env = split_result.netloc.split(".")[0].lower()
        if agol_env.startswith("dev"):
            service_host_name = "logisticsdev"
        elif agol_env.startswith("qa"):
            service_host_name = "logisticsqa"
        else:
            service_host_name = "logistics"

        if helper_service_key == "asyncServiceArea":
            service_rest_url = "{0}://{1}.arcgis.com/arcgis/rest/services/World/ServiceAreas/GPServer/GenerateServiceAreas".format(split_result.scheme,
                                                                                                                                   service_host_name)
        elif helper_service_key == "asyncClosestFacility":
            service_rest_url = "{0}://{1}.arcgis.com/arcgis/rest/services/World/ClosestFacility/GPServer/FindClosestFacilities".format(split_result.scheme,
                                                                                                                                       service_host_name)
    return service_rest_url

# End def getServiceUrl

def convertRestUrl(url):
    '''returns a four value tuple from the rest url to the GP service.
    First value is a string that can be used with arcpy.gp.AddToolbox function.
    Second value is the GP service name.
    Third value is the task name within the GP service.'''

    gpService = collections.namedtuple("GPService", ("toolbox", "serviceName", "taskName", "server"))

    url_split = list(urllib.parse.urlsplit(url))
    path = url_split[2].split("/")
    path.remove("rest")
    path.remove("GPServer")
    url_split[2] = "/".join(path[0:3])
    #There is a bug in addToolbox which causes it to fail if the URL has https. So for now replace
    #https with http
    #if url_split[0].lower() == "https":
        #url_split[0] = "http"
    gpService.toolbox = "{0};{1}".format(urllib.parse.urlunsplit(url_split), "/".join(path[3:5]))

    gpService.serviceName = path[-2]
    gpService.taskName = path[-1]
    gpService.server = "{0}://{1}".format(url_split[0], url_split[1])
    return gpService

# End def convertRestUrl

def getToken(url, username, password):
    '''return a user token and the referer'''

    token = {"token": "", "referer" : ""}
    token_url = url + "/sharing/generateToken"
    query_params_dict = {"f" : "json"}
    query_params_dict["username"] = username
    query_params_dict["password"] = password
    query_params_dict["client"] = "referer"
    query_params_dict["referer"] = url
    query_params = urllib.parse.urlencode(query_params_dict)
    token_response = json.load(urllib.request.urlopen(token_url, query_params))
    if "token" in token_response:
        token["token"] = token_response["token"]
        token["referer"] = query_params_dict["referer"]
    else:
        error_messages = []
        if "error" in token_response:
            error = token_response["error"]
            if "message" in error:
                error_messages.append(error["message"])
            if "details" in error:
                error_messages += error["details"]
        raise Exception("\n".join(error_messages))
    return token

# End def getToken

def createBufferOutDesc(output_desc, data=None, pos=0, ltype="layer"):
    '''create layerOutDescription from outDescription Alternative

    Note: this is an alternative options to the aoutils createLayerOutDesc
    equivalent because unique value rendering is unfortunately ordered by a
    string sort by default, not a numeric one. This calls out to
    sortClassValues to remedy the problem.
    '''

    if ltype == "layer" and data:
        layerProperties = output_desc["layerProperties"][pos]
        if "rendererDef" in layerProperties and not "drawingInfo" in layerProperties:
            try:
                # update symbology using rendererdef
                arcpy.MakeFeatureLayer_management(data, "outLayer")
                outLayerName = arcpy.mapping.Layer("outLayer")
                outLayerName._arc_object.setsymbology(layerProperties["rendererDef"])

                if outLayerName.supports("SYMBOLOGY"):
                    outLayerName.symbology.classValues = sortClassValues(
                        outLayerName.symbology.classValues)

                outLayerName.transparency = 50  # transparency is 50%

                layerProperties["drawingInfo"] = json.loads(outLayerName._arc_object.getsymbology())
                layerProperties.pop("rendererDef")
            except:
                arcpy.AddWarning("unable to support the renderer definition")
                output_desc["layerProperties"][pos].pop("rendererDef")
    output_desc["layerProperties"] = output_desc["layerProperties"][pos]
    return output_desc

# End def createBufferOutputDesc

def sortClassValues(classvalues):
    """Convert a list of sorted number strings to a list of sorted numbers"""
    newvalues = [ast.literal_eval(i) for i in classvalues]
    newvalues.sort()
    return newvalues

# End def sortClassValues

def createNormalizationField(input_layer, countField, areaField, fieldNameAndAlias=None):
    '''creates count by area given the field names'''
    if not fieldNameAndAlias:
        fieldName = "CountByTotalArea"
        fieldAlias = "Count by total area"
    else:
        fieldName = fieldNameAndAlias[0]
        fieldAlias = fieldNameAndAlias[1]

    if not verifyFieldExists(input_layer, fieldName):
        arcpy.AddField_management(input_layer, fieldName,"DOUBLE","#","#","#",fieldAlias)
        expression = "!{}!/!{}!".format(countField, areaField)
        arcpy.CalculateField_management(input_layer,
                                        fieldName,
                                        expression,
                                        "PYTHON_9.3")
# End def

def createShapeAreaField(input_layer, units=None):
    '''Adds shape Area field'''
    #Note: this routine is used by SummarizeWithin, SUmmarizeNearby
    if not units:
        units = "SquareMiles"
    elif "Square" not in units and units not in ["Acres","Hectares"]:
        units = "{}{}".format("Square", units)
    shape_field_name = "AnalysisArea"
    shape_field_alias = "Total Area in {}".format(units)
    shape_field_alias = shape_field_alias.replace("Square", "Square ")
    # Add the new field and calculate the value.    
    describe = arcpy.Describe(input_layer)
    spref = describe.spatialReference
    if spref.GCSCode != 0 or spref.PCSCode == 102100 or spref.PCSCode == 3857:
        expression = "!shape.geodesicArea@{}!".format(units)
    else:
        expression = "!shape.area@{}!".format(units)
    #arcpy.AddMessage(shape_field_alias)
    if not verifyFieldExists(input_layer, shape_field_name):
        arcpy.AddField_management(input_layer, shape_field_name,"DOUBLE","#","#","#",shape_field_alias)
    arcpy.CalculateField_management(input_layer,
                                    shape_field_name,
                                    expression,
                                    "PYTHON_9.3")
    return shape_field_name

# End def createShapeAreaField

def selectFeaturesbyExtent(input_layer):
    '''selects features based on arcpy.env.extent'''
    extent = arcpy.env.extent
    #DebugExtent()
    if extent:
        pointsArr = arcpy.Array([extent.upperLeft,
                                 extent.upperRight,
                                 extent.lowerRight,
                                 extent.lowerLeft,
                                 extent.upperLeft])
        selectingPolygon = arcpy.Polygon(pointsArr, extent.spatialReference)  
        #outPolygon = os.path.join(arcpy.env.scratchGDB,"outPolygon")
        #arcpy.CopyFeatures_management(selectingPolygon,outPolygon)
        arcpy.SelectLayerByLocation_management(input_layer, "INTERSECT", selectingPolygon, "#","NEW_SELECTION")
        #arcpy.SelectLayerByLocation_management(input_layer,"INTERSECT", outPolygon)
        #r = arcpy.GetCount_management(input_layer)
        #arcpy.AddMessage("{} count of {}".format(r.getOutput(0), input_layer))
    return input_layer

# End def selectFeaturesbyExtent

def verifyFieldExists(inputLayer, field_name):
    """Checks if a field exists."""
    if field_name.lower() in [f.name.lower() for f in arcpy.ListFields(inputLayer, field_name)]:
        return True
    else:
        return False

# End def fieldExists 

def reportParamsForCost(hostedgp, taskName, paramsDict):
    '''logs the cost based on the parameter values'''
    if not isinstance(taskName, unicode):
        taskName= unicode(taskName)
    hostedgp.ReportCost(taskName, paramsDict)
# End def report cost

def callAsyncGPService(tbx, task_name, task_params, ignore_error_codes):
    '''calls a async GP service and returns the gp result object.
    @@tbx - full url including the service name and credentials for the remote service.
    @@task_params - list of parameter values in the order expected by the task.
    @@ignore_error_codes - list of error codes to ignore from the result when writing the messages
    from the task output.'''

    start_time = time.time()
    tbx_added = False
    service_result = None
    job_id = ""
    try:
        #Add the service
        arcpy.gp.addToolbox(tbx)
        tbx_added = True
        start_time = AddTimerMessage(start_time, "Added remote toolbox")

        #Call the service
        tbx_name_parts = tbx.split(";")
        service_name = tbx_name_parts[1].split("/")[-1]
        gp_task = getattr(arcpy.gp, "{0}_{1}".format(task_name, service_name))
        service_result = gp_task(*task_params)
        job_id = service_result.resultID
        arcpy.AddMessage("Waiting for jobID: {0} to complete on {1}".format(job_id, tbx_name_parts[0]))

        #Wait for job to complete
        while service_result.status < 4:
            time.sleep(0.5)
        start_time = AddTimerMessage(start_time, "Completed call to remote service")
        #Add messages and return the result
        severity = service_result.maxSeverity
        if severity != 0:
            AddRemoteToolExecuteErrorsAndWarnings(service_result, severity, ignore_error_codes)
            if severity == 2:
                raise arcpy.ExecuteError

    except SystemExit as ex:
        #raised if cancel was trigged on the caller
        #try canceling the remote job if it is still executing
        if service_result:
            arcpy.AddWarning("Canceling .....")                
            service_result.cancel()
            raise
    except Exception as ex:
        raise
    finally:
        if tbx_added:
            #Remove the GP service as we no longer need to make any calls to it
            arcpy.gp.removeToolbox(tbx)

    return service_result


class LayerInfo():
    '''keeps generic information on featurelayers'''
    def __init__(self, input_layer):
        desc = arcpy.Describe(input_layer)
        self.spatialRef = desc.spatialReference
        self.shapeType = desc.shapeType
        self.shapeFieldName = desc.shapeFieldName
        self.OIDFieldName = desc.OIDFieldName
        self.name = desc.basename
        self.path = desc.catalogPath
        self.fields = desc.fields
        self.layer = input_layer

def checkPrivilege(privilege, token, referer):
    '''checks whether the AO user has given privilege'''
    selfURL = r"https://www.arcgis.com/sharing/rest/portals/self"
    params = {"f":"json", "token":token}
    params = urllib.parse.urlencode(params).encode('utf-8')
    privilegeText = privilege.split(":")[-1].title()
    try:
        req = urllib.request.Request(selfURL)
        req.add_header("referer",referer)
        req.add_header("Accept-Encoding", "gzip")
        zipped_response = urllib.request.urlopen(req, params)
        if zipped_response.info().get("Content-Encoding") == "gzip":
            response = gzip.open(zipped_response, mode='rt')
            selfJSON = json.load(response)
        else:
            selfJSON = json.loads(zipped_response.read().decode('utf-8'))
        privilegeArr = selfJSON["user"]["privileges"]
        if privilege in privilegeArr:
            return True
        else:
            return False

    except Exception as e:
        arcpy.AddError("Unable to determine {} privilege for ArcGIS Online user account".format(privilegeText))
    return False



def writeTempFile(name, content):
    fileName = os.path.join(arcpy.env.scratchFolder, name)
    tmpFile = open(fileName, "w")
    tmpFile.write(content)
    tmpFile.close()
    arcpy.AddMessage(fileName)
# End def report cost
