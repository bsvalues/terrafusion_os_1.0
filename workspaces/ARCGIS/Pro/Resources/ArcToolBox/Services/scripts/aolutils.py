
"""---------------------------------------------------------------------------
Name:              aolutils.py
Purpose:           Helper methods for aol scripts
Author:            Esri Inc.
Created:           1/7/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
---------------------------------------------------------------------------"""
from __future__ import unicode_literals
import arcpy
import os
import json
import sys
import re
import copy
import time
import requests
import collections
import gzip
import ast
import debugUtils
import hostedgp as agolgp
import ssl
import locale
import traceback
import creditutils

try:
    from io import cStringIO as sio
except ImportError as ex:
    from io import  StringIO as sio

try:
    from urllib.parse import urlsplit, urlunsplit
except ImportError:
    from urlparse import urlsplit, urlunsplit

#Try using Python2 first
try:
    from urllib import unquote, urlencode, quote
#Switch to Python 3 if the above import failed
except ImportError:
    from urllib.parse import unquote, urlencode, quote

#Deal with the basestring, unicode NameError
try:
    unicode = unicode
except NameError:
    str = str
    unicode = str
    bytes = bytes
    basestring = (str, bytes)
else:
    str = str
    unicode = unicode
    bytes = str
    basestring = basestring

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
    "FindNearest":100030,
    "FindExistingLocations":100061,
    "FindSimilarLocations":100077,
    "DeriveNewLocations":100079,
    "PlanRoutes":100063,
    "ConnectOriginsToDestinations":100080,
    "FieldCalculator":100081,
    "InterpolatePoints":100104,
    "CalculateDensity":100105,
    "CreateViewshed":100121,
    "TraceDownstream":100122,
    "CreateWatersheds":100123,
    "ChooseBestFacilities": 100150,
    "CreateRouteLayers": 100211,
    "JoinFeatures":100215,
    "FindOutliers":100216,
    "BatchGeocode": 100161,
    "AnalyzeGeocodeInput": 100162,
    "FindCentroids": 100254,
    "SummarizeCenterAndDispersion": 100261,
    "FindPointClusters": 100260,
    "GenerateTessellations": 100268
}

errorMsgs = {
    100112: "Your user role doesn't include the publish hosted features privilege.",
    100118: "Your user role does not include the create, update, and delete content privilege.",
    100144: "The {serviceName} utility is not registered with portal",
    100148: "You do not have permissions to access the utility {serviceName}.",
    100149: "Unable to access registered url for utility {serviceName}: {msg}.",
    100242: "You do not have enough credits to perform this operation. \
             Contact your ArcGIS System Administrator for assistance",
    100291: "Failed to publish analysis results as a feature collection because one of the output layers has more than 9,999 features. \
             To keep all features, save your result as a feature layer."
}

PRIVILEGE_PUBLISH = "portal:publisher:publishFeatures"
PRIVILEGE_UPDATE_ITEM = "portal:admin:updateItems"
PRIVILEGE_CREATE_ITEM = "portal:user:createItem"

UNLIMIT_CREDIT_ORGS = ["ConnectED", "Demo and Marketing", "Education Site Licenses",
                       "OEM Plans", "Promotion", "Standard and Small EAs"]

# Default value of maximum # of features to download
DEFAULT_DOWNLOADABLE_FEATCOUNT = 100000

# need to set this for other non-english os
locale.setlocale(locale.LC_ALL, '')


def atof(testStr):
    try:
        return locale.atof(testStr)
    except UnicodeDecodeError:
        return locale.atof(testStr.encode("utf-8", "ignore"))
    except Exception:
        if isinstance(testStr, (unicode, str)):
            if "," in testStr:
                testStr = testStr.replace(",", ".")
                return float(testStr)
        else:
            raise


def getUnits(hostedgp, shapeUnitsPolygon=True):
    '''returns units from user profile
    either hostedgp or userProfile parameter must be sent.
    hostedgp: handle from agolgp.hostedgp method
    not reqd if userprofile param is available.
    userProfile: optional, if the profile json is already available,
    pass it as a param, hostedgp not required.
    '''
    try:
        selfProfile = json.loads(hostedgp.GetSelf())
        user = selfProfile.get("user", {})
        units = user.get("units", None)
        if not units:
            units = selfProfile.get("units", "metric")
            arcpy.AddMessage("units from org :{}".format(units))
    except:
        arcpy.AddMessage("Unable to get units from userprofile")

    if shapeUnitsPolygon:
        return "SquareKilometers" if units.lower() == "metric" else "SquareMiles"
    else:
        return "Kilometers" if units.lower() == "metric" else "Miles"

def useGeodesic(descFC=None, inputFC=None, spRef=None):
    '''provide atleast one of the parameters describe, feature class or spatial reference'''
    if not spRef:
        if not descFC:
            if inputFC:
                descFC = arcpy.Describe(inputFC)
            else:
                arcpy.AddMessage("Provide at least one of the parameters for useGeodesic method")
                raise Exception
        spRef = descFC.spatialReference
    try:
        if spRef.GCSCode !=0 or spRef.GCS:
            return True
        else:
            return False
    except:
        return False


def isWebMercator(descFC=None, inputFC=None, spRef=None, PCSCode=None):
    if PCSCode is None:
        if not spRef:
            if not descFC:
                if inputFC:
                    descFC = arcpy.Describe(inputFC)
                else:
                    arcpy.AddMessage("Provide atleast one of the parameters for isMercator method")
                    raise Exception
            spRef = descFC.spatialReference
        try:
            PCSCode = spRef.PCSCode
        except:
            return False
    if PCSCode in [102100, 3857, 102113]:
        return True
    else:
        return False


def checkPublishingPrivilege(hostedgp, outputName):
    '''checks for publishing privilege'''
    isError = False
    if outputName.createService:
        if not hostedgp.CheckPrivilege(PRIVILEGE_PUBLISH):
            AddErrorCode(100112, errorMsgs[100112])
            isError = True
        if not hostedgp.CheckPrivilege(PRIVILEGE_CREATE_ITEM):
            AddErrorCode(100118, errorMsgs[100118])
            isError = True
    if isError:
        raise Exception
    else:
        arcpy.AddMessage("Publishing Privilege Check: OK")


# Default task_parameters to None on purpose to let NA tools run. Remove the default value once NA tools implemtented
# the new function.
def checkForCredits(task_name, task_parameters=None):
    """checks whether credits available.

    Args:
        task_name: a string of the task_name.
        task_parameters: a dictionary keyed by the parameter name and valued by the parameter value.
    Returns:
        No returns.
    Raises:
        Error with 100242 if CreditsChecker returns False.

    """
    if not creditutils.CreditsChecker(task_name, task_parameters).check():
        AddErrorCode(100242, errorMsgs[100242])
        raise Exception
    else:
        arcpy.AddMessage("Credits Check: OK")

def checkPrivilege(privilege, hostedgp):
    '''returns true if privilege is in user profile
    '''
    ## if hostedgp.CheckPrivilege(privilege):
    ##     return True
    ## return False
    # hostedgp.CheckPrivilege always returns true for the following privileges since portal-self call includes
    # "user" as well as "appInfo" with "privileges". So re-implementing the hostegp.CheckPrivilege logic here until
    # hostedgp.CheckPrivilege is fixed in 10.7.1 anf AGOL release that uses 10.7.1
    # "premium:user:demographics"
    # "premium:user:elevation"
    # "premium:user:geocode"
    # "premium:user:geoenrichment"
    # "premium:user:networkanalysis"
    selfProfile = json.loads(hostedgp.GetSelf())
    if "user" in selfProfile:
        if "privileges" in selfProfile["user"]:
            if privilege in selfProfile["user"]["privileges"]:
                return True
            else:
                return False

    if "appInfo" in selfProfile:
        if "privileges" in selfProfile["appInfo"]:
            if privilege in selfProfile["appInfo"]["privileges"]:
                return True
    return False

def densifyFeatures(feature_class):

    if not feature_class:
        return feature_class
    startTime = time.time()
    out_densify = arcpy.CreateScratchName('densify_', workspace=arcpy.env.workspace)
    arcpy.CopyFeatures_management(feature_class, out_densify)
    arcpy.Densify_edit(out_densify, "DISTANCE", "10 Kilometers")
    AddTimerMessage(startTime, "DensifyFeatures")
    return out_densify

# End densifyFeatures

def addRemoveToolboxes(addToolbox, *reqdToolboxes):
    '''Adds or removes required toolboxes'''
    scriptFolder = sys.path[0]    
    if addToolbox :
        for tbx in reqdToolboxes:
            tbx_path = os.path.join(scriptFolder, tbx)
            arcpy.gp.addToolbox(tbx_path)
    else :
        for tbx in reqdToolboxes:
            tbx_path = os.path.join(scriptFolder, tbx)
            arcpy.gp.removeToolbox(tbx_path)

# End def addRemoveToolboxes


def getFieldAlias(inputLayer, *field_names):
    '''returns field alias '''
    fieldNameDict={}
    for field in arcpy.ListFields(inputLayer):
        fieldNameDict[field.name]=field
    
    aliasNames=[]
    for fieldName in field_names:
        if fieldName in fieldNameDict:
            aliasNames.append(fieldNameDict[fieldName].aliasName)
        else:
            raise Exception("Exception @ getFieldAlias: No such a field named {} in the inputLayer.".format(fieldName))
    
    return aliasNames

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
        if layerProperties.has_key("rendererDef") and not layerProperties.has_key("drawingInfo"):
            rendererDef = layerProperties["rendererDef"]
            if rendererDef.has_key("classificationField"):
                # current size range is from 4-18
                # increment +4
                cbtype = rendererDef.get("classBreaksType")
                updateSymbolSize = True if cbtype == "esriGraduatedSymbols" else False

                # update labels for normalization since the decimal values
                # may not be appropriate for labels Workaround
                updateClassBreaksLabels = True if rendererDef.has_key("normalizationField") else False
            else:
                updateSymbolSize = False
                updateClassBreaksLabels = False
            # update symbology using rendererdef
            outLayerName=arcpy.MakeFeatureLayer_management(data,"outLayer")
            # set transparency if only the geometrytype is polygon
            shapeType = arcpy.Describe(outLayerName).shapeType
            if shapeType == "Polygon":
                outLayerName.transparency = 25
            try:
                outLayerName._arc_object.setsymbology(layerProperties["rendererDef"])
                layerProperties["drawingInfo"] = json.loads(outLayerName._arc_object.getsymbology())
                layerProperties.pop("rendererDef")
                if updateClassBreaksLabels or updateSymbolSize:
                    updateClassBreaksLabelsSymbols(layerProperties["drawingInfo"]["renderer"],
                                                   updateClassBreaksLabels,
                                                   updateSymbolSize)

            except:
                arcpy.AddWarning("unable to support the renderer definition")
                output_desc["layerProperties"][pos].pop("rendererDef")
    output_desc["layerProperties"] = output_desc["layerProperties"][pos]

    return output_desc

# End def createLayerOutDesc

def updateClassBreaksLabelsSymbols(classBreaksRenderer, updateLabels=True, updateSymbols=False):
    '''Updates label values or symbols sizes; temporary fix '''

    classBreaks = classBreaksRenderer["classBreakInfos"]
    if updateLabels:
        for classBreak in classBreaks:
            min = classBreak["classMinValue"]
            max = classBreak["classMaxValue"]
            classBreak["label"] = u"{} - {}".format(min, max)
    if updateSymbols:
        # workaround for increasing size, similar color
        symbolColor = classBreaks[0]["symbol"]["color"]
        for classBreak in classBreaks:
            siz = classBreak["symbol"]["size"]
            classBreak["symbol"]["size"] = siz + 4
            #classBreak["symbol"]["color"] = symbolColor
        # workaround for background fill symbol
        backgroundFillSymbol = {"type": "esriSFS",
                                "style": "esriSFSSolid",
                                "color": [255, 255, 128, 255],
                                "outline": {
                                    "type": "esriSLS",
                                    "style": "esriSLSSolid",
                                    "color": [110,110,110,255],
                                    "width": 1
                                }}
        classBreaksRenderer["backgroundFillSymbol"] = backgroundFillSymbol




# end def updateLabels

def getAccurateFieldName(fieldList, baseFieldName):
    ''' field names in gdbs can be suffixed with _1 with the field name already exists.
    this method returns the fieldname with highest suffix in the fieldList.
    '''
    couldBeFields = [field.name for field in fieldList
                     if (field.name.lower() == baseFieldName.lower()) or
                     re.match(u"^{0}\_\d".format(baseFieldName), field.name)]
    #arcpy.AddMessage(u"couldBEFields: {}".format(couldBeFields))
    if couldBeFields:
        couldBeFields.sort()
        return couldBeFields.pop()
    else:
        return None

# End def getAccurateFieldName

def getFieldName(fieldList, fieldName):
    '''returns field name case as -is'''

    for field in fieldList:
        if field.name.lower() == fieldName.lower():
            return field.name
    return fieldName


def getSummaryField(fieldList, fieldName, summary):
    ''' given the field name and summary finds the possible field name
    returns: field object and not fieldname
    '''

    baseName = u"{}_{}".format(summary, fieldName)
    # is there a better logic to find _1, _2 fields, wild card in ListFields doesn't accept regular expr?
    couldBeFields = [field for field in fieldList
                     if (field.name.lower() == baseName.lower()) or
                     re.match(u"^{0}\_\d".format(baseName), field.name)]
    couldBeFields.sort()
    return couldBeFields.pop()

# End def getSummaryFieldName

def convertSummaryFieldstoArray(summaryFields):
    """Converts multivalue summary fields to array of arrays for easier processing"""
    if summaryFields:
        sumFields = []
        for summaryField in summaryFields:
            if summaryField:
                try:
                    jsonSummary = json.loads(summaryField)
                    statisticType = jsonSummary.get("statisticType", "")
                    statisticField = jsonSummary.get("onStatisticField", "")
                    sumFields.append((statisticField, statisticType.capitalize()))
                except Exception as e:
                    sumField = summaryField.strip("'").split()
                    sumFields.append((sumField[0], sumField[1].capitalize()))
        return sumFields
    else:
        return []

# End def convertSummaryFieldsToArray


def AddTimerMessage(startTime, msg):
    currentTime = time.time()
    elapsedTime = currentTime - startTime
    arcpy.AddMessage(u"Timer: {0:.3f} {1}".format(elapsedTime,msg))
    return currentTime

# End def LogUsageMetering


def LogUsageMetering(taskName, numObjects, cost, startTime, values):
    elapsed = time.time() - startTime
    valuesMsg = taskName + json.dumps(values)

    arcpy.AddMessage(u"NumObjects: {} Cost: {}".format(numObjects, cost))
    arcpy.AddMessage(u"{0} Elapsed: {1:.3f}".format(valuesMsg, elapsed))

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


def createUniqueFieldName(input_layer, field_name, field_alias, fieldList=None):
    """Return unique field name and field alias name."""
    fieldName = field_name
    if fieldList:
        fieldNames = [f.name.lower() for f in fieldList]
    else:
        fieldNames = [f.name.lower() for f in arcpy.ListFields(input_layer, field_name)]
    i = 0
    while (fieldName.lower() in fieldNames):
        i = i + 1
        fieldName = "{0}_{1}".format(field_name, i)
    field_alias = "{0} {1}".format(field_alias, i)
    return fieldName, field_alias


def AddErrorCode(errorCode, errorMsg , params=None , warning=False):
    """Converts errors into JSON format for localization"""
    msg = {}
    msg["messageCode"] = u"AO_{}".format(errorCode)
    if errorMsg[-1]!= ".":
        errorMsg = u"{}.".format(errorMsg)
    msg["message"] = errorMsg
    if params:
        msg["params"] = params
    if warning:
        arcpy.AddWarning(json.dumps(msg))
    else:
        arcpy.AddError(json.dumps(msg))

# End def AddErrorCode

def AddExecuteWarnings(taskName, errorCodes):
    """Find and Log known warnings specified in error codes."""

    try:
        msgs = arcpy.gp.GetAllMessages()
        if msgs:
            warnings = [msg for msg in msgs if msg[1] in errorCodes and msg[0] == 50]
            if warnings:
                for warning in warnings:
                    warningCode = warning[1]
                    try:
                        json.loads(warning[2])
                        arcpy.AddWarning(warning[2])
                    except ValueError:
                        warningMsg = warning[2].split(': ', 1)[-1]
                        AddErrorCode(warningCode, warningMsg, warning=True)
    except:
        msgs = ""


def AddExecuteErrors(taskName, errorCodes, special_error_handlers=None):
    """Find and Log known error codes.

    Args:
        taskName: a string represents the name of the tool that invoke this method.
        errorCodes: a list with each item as a known error code.
        special_error_handlers: a dictionary keyed by the error code and valued by a function
        that will read in the gp error message and format the error properly.
    Returns:
        No returns.

    """
    # Add publishing privilege errors to error codes
    genericErrorCodes = [100112, 100118]
    for code in genericErrorCodes:
        if code not in errorCodes:
            errorCodes.append(code)

    # Drop the errorCodes that are using the special_error_handlers.
    if special_error_handlers is not None:
        errorCodes = [err_code for err_code in errorCodes if err_code not in special_error_handlers]

    # Add warnings from tool if any
    AddExecuteWarnings(taskName, errorCodes)
    # Add error messages from tool
    try:
        msgs = arcpy.gp.GetAllMessages()
        if msgs:
            # Process the errors with special logic
            if special_error_handlers:
                for msg in msgs:
                    if msg[1] in special_error_handlers:
                        # Call the handler to deal with the message.
                        special_error_handlers[msg[1]](msg)

            errors = [msg for msg in msgs if msg[1] in errorCodes and msg[0] == 100]
            if errors:
                for error in errors:
                    errorCode = error[1]
                    try:
                        json.loads(error[2])
                        arcpy.AddError(error[2])
                    except ValueError:
                        errorMsg = error[2].split(': ', 1)[-1]
                        AddErrorCode(errorCode, errorMsg)

            # report all messages for debugging
            arcpy.AddMessage("********* All other tool messages for debugging **********")
            for msg in msgs:
                arcpy.AddMessage(msg)

    except:
        msgs = ""

    # Add tool failed message
    AddExceptionError(taskName)

# End def AddExecuteErrors

def AddExceptionError(taskName, err=None):
    """Catch GPCloudExec and Add toolfailed message"""
    arcpy.AddMessage("AddExceptionError")
    arcpy.AddMessage('Type of err is {}'.format(type(err).__name__))
    if err:
        if isinstance(err, agolgp.GPCloudExec):
            errmsg = str(err)
            if errmsg:
                arcpy.AddError(str(err))
            else:
                pass
                #arcpy.AddMessage("GPCloud Exception")
        else:
            arcpy.AddMessage(type(err))
            if hasattr(err, "message"):
                arcpy.AddMessage(err.message)
        # report task failed
    if taskName in TASK_ERROR_CODES:
        AddErrorCode(TASK_ERROR_CODES[taskName], "{} failed.".format(taskName))
    else:
        arcpy.AddError("{} failed.".format(taskName))
        arcpy.AddMessage("Note to developer: Add task to TASK_ERROR_CODE dictionary in aolutils.py")

# End def AddExceptionError

'''
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
'''
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
            if factoryCode == 0:
                factoryCode = sr.exportToString()
        else:
            factoryCode = 0
        extentMsg = u"Extent: {},{},{},{},{}".format(extent.XMin, extent.YMin, extent.XMax, extent.YMax, factoryCode)
        arcpy.AddMessage(extentMsg)

# End def DebugExtent
#
# def getPortalProperties(owning_system_url, token=None, referer=None):
#     '''Return a dict of portal properties by making a portal self call.'''
#
#     #Make the URL to the portal self from the owning system URL
#     try:
#         if owning_system_url.endswith("/"):
#             portal_self_url.rstrip("/")
#         portal_self_url = owning_system_url + "/sharing/portals/self"
#         query_params_dict = {"f" : "json"}
#         if token:
#             query_params_dict["token"] = token
#         query_params = urllib.urlencode(query_params_dict)
#         request = urllib2.Request(portal_self_url)
#         request.add_data(query_params)
#         request.add_header("Accept-Encoding", "gzip")
#         if referer:
#             request.add_header("Referer", referer)
#         zipped_response = urllib2.urlopen(request)
#         if zipped_response.info().get("Content-Encoding") == "gzip":
#             buf = sio.StringIO(zipped_response.read())
#             response = gzip.GzipFile(fileobj=buf)
#             response_dict = json.load(response)
#             return response_dict
#         else:
#             raise Exception("Failed to get portal properties")
#     except Exception as ex:
#         raise Exception("Failed to get portal properties")
#
# # End def getPortalProperties
# '''
#
#
# def getServiceUrl(owning_system_url, helper_service_key, make_self_call=True):
#     '''Return the URL to the service area GP service based on the owning system URL.'''
#     service_rest_url = ""
#     if make_self_call:
#         portal_properties = getPortalProperties(owning_system_url)
#         service_rest_url = portal_properties["helperServices"][helper_service_key]["url"]
#     else:
#         split_result = urlparse.urlsplit(owning_system_url)
#         agol_env = split_result.netloc.split(".")[0].lower()
#         if agol_env.startswith("dev"):
#             service_host_name = "logisticsdev"
#         elif agol_env.startswith("qa"):
#             service_host_name = "logisticsqa"
#         else:
#             service_host_name = "logistics"
#
#         if helper_service_key == "asyncServiceArea":
#             service_rest_url = u"{0}://{1}.arcgis.com/arcgis/rest/services/World/ServiceAreas/GPServer/GenerateServiceAreas".format(split_result.scheme,
#                                                                                                                                     service_host_name)
#         elif helper_service_key == "asyncClosestFacility":
#             service_rest_url = u"{0}://{1}.arcgis.com/arcgis/rest/services/World/ClosestFacility/GPServer/FindClosestFacilities".format(split_result.scheme,
#                                                                                                                                         service_host_name)
#     return service_rest_url
#
# # End def getServiceUrl

#
#
def convertRestUrl(url):
    '''returns a four value tuple from the rest url to the GP service.
    First value is a string that can be used with arcpy.gp.AddToolbox function.
    Second value is the GP service name.
    Third value is the task name within the GP service.'''

    gpService = collections.namedtuple("GPService", ("toolbox", "serviceName", "taskName", "server"))

    url_split = list(urlsplit(url))
    path = url_split[2].split("/")
    #path.remove("rest")
    #path.remove("GPServer")
    #url_split[2] = "/".join(path[0:3])
    #gpService.toolbox = u"{0};{1}".format(urlparse.urlunsplit(url_split), "/".join(path[3:5]))
    #gpService.serviceName = path[-2]
    path_lower = [p.lower() for p in path]
    index_of_rest = path_lower.index("rest")
    index_of_gpserver = path_lower.index("gpserver")
    url_split[2] = "/".join(path[0:index_of_rest] + ["services"])
    #Shift by 2 as we do not want to include rest/services in service name
    service_name = "/".join(path[index_of_rest + 2 : index_of_gpserver])
    gpService.toolbox = u"{0};{1}".format(urlunsplit(url_split),service_name)
    gpService.serviceName = service_name
    gpService.taskName == "" if path_lower[-1] == "gpserver" else path[-1]
    gpService.server = u"{0}://{1}".format(url_split[0], url_split[1])
    return gpService

# End def convertRestUrl
#
#
#
# def getToken(url, username, password):
#     '''return a user token and the referer'''
#
#     token = {"token": "", "referer" : ""}
#     token_url = url + "/sharing/generateToken"
#     query_params_dict = {"f" : "json"}
#     query_params_dict["username"] = username
#     query_params_dict["password"] = password
#     query_params_dict["client"] = "referer"
#     query_params_dict["referer"] = url
#     query_params = urllib.urlencode(query_params_dict)
#     token_response = json.load(urllib2.urlopen(token_url, query_params))
#     if "token" in token_response:
#         token["token"] = token_response["token"]
#         token["referer"] = query_params_dict["referer"]
#     else:
#         error_messages = []
#         if "error" in token_response:
#             error = token_response["error"]
#             if "message" in error:
#                 error_messages.append(error["message"])
#             if "details" in error:
#                 error_messages += error["details"]
#         raise Exception("\n".join(error_messages))
#     return token
#
# # End def getToken
#
#
#TODO: to replace the request related functionality with the requests library
def checkUrlValidity(checkUrl, token, referer, portalHelperServicesKey):
    '''check whether url is valid by sending a request'''
    params = {"f":"json", "token":token}
    try:
        if "GPServer" in checkUrl:
            checkUrl = "{}GPServer".format(checkUrl[:checkUrl.find("GPServer")])
        resp = requests.post(checkUrl, data=params, verify=False, headers={'referer':referer})
        resp.encoding='utf-8'
        resp = resp.json()
        #arcpy.AddMessage('resp is {}'.format(resp))
        if "error" in (resp):
            code = resp["error"].get("code")
            if  code == 403:
                params = {"serviceName":portalHelperServicesKey}
                msg = errorMsgs[100148].format(**params)
                AddErrorCode(100148, msg, params)
                return False
            else:
                msg = resp["error"].get("message")
                params = {"serviceName":portalHelperServicesKey,
                          "msg" : msg}
                msg = errorMsgs[100149].format(**params)
                AddErrorCode(100149, msg, params)
                return False
        else:
            return True
    except Exception as e:
        arcpy.AddMessage("CheckUrlValidity :{}".format(str(e)))
        params = {"serviceName":portalHelperServicesKey,
                  "msg" : "Check registered URL"}
        msg = errorMsgs[100149].format(**params)
        AddErrorCode(100149, msg, params)
        return False
#
#
#
def gentoken(hostedgp, portalHelperServicesKey, postUrlData=None):
    '''Request token for secure services'''
    try:
        service_base_url, token, referer = getHelperServicesUrl(hostedgp, portalHelperServicesKey)
        #arcpy.AddMessage(u"Service url : {}, referer : {}".format(service_url, referer))
        # construct geoenrich rest url
        if service_base_url.endswith("/"):
            service_base_url.rstrip("/")
        if checkUrlValidity(service_base_url, token, referer, portalHelperServicesKey):
            if postUrlData:
                service_url = "{}/{}".format(service_base_url, postUrlData)
            else:
                service_url = service_base_url
            return service_url, token, referer
        else:
            raise Exception
    except Exception as e:
        raise Exception("Exception @ gentoken:{}".format(str(e)))
#
#
#
#
def getHelperServicesUrl(hostedgp, portalHelperServicesKey):
    '''Return the url for a helper service'''
    portal_properties = hostedgp.GetHelperServices()
    try:
        portal_properties = json.loads(portal_properties)
        if not (portal_properties.get(portalHelperServicesKey) and \
            portal_properties[portalHelperServicesKey].get("url")):
            params = {"serviceName":portalHelperServicesKey}
            msg = errorMsgs[100144].format(**params)
            AddErrorCode(100144, msg, params)
            raise Exception("Failed to find url")
        service_base_url = portal_properties[portalHelperServicesKey]["url"]
        # Get a server token before computing the private service url as generating server tokens fails with
        # private urls to service proxies
        token, referer = hostedgp.GetServerToken(service_base_url,720)
        # Get the private service url in case the service is running on the same machine as the portal
        # A private url should be used only when onprem portals are proxying to ArcGIS Online services
        owningSysParse = requests.utils.urlparse(hostedgp.GetOwningSystem())
        serviceUrlParse = requests.utils.urlparse(service_base_url)
        if owningSysParse.netloc.lower() == serviceUrlParse.netloc.lower():
            #Ensure that webadaptor name for portal is same as the webadaptor name used by the service.
            if owningSysParse.path:
                serviceUrlPath = serviceUrlParse.path[:len(owningSysParse.path)].lower()
                if owningSysParse.path.lower() == serviceUrlPath:
                    service_base_url = hostedgp.GetPrivateUrl(service_base_url)
            else:
                service_base_url = hostedgp.GetPrivateUrl(service_base_url)

        #arcpy.AddMessage(u"Service url : {}, referer : {}".format(service_base_url, referer))
        if checkUrlValidity(service_base_url, token, referer, portalHelperServicesKey):
            return  service_base_url, token, referer
        else:
            raise Exception
    except Exception as e:
        raise Exception("Exception @ getHelperServicesUrl:{}".format(str(e)))
#
#
def getPrivateServiceURL(hostedgp, service_base_url, owning_system_url=''):
    # Get the private service url in case the service is running on the same machine as the portal
    # A private url should be used only when onprem portals are proxying to ArcGIS Online services
    if owning_system_url:
        owningSysParse = requests.utils.urlparse(owning_system_url)
    else:
        owningSysParse = requests.utils.urlparse(hostedgp.GetOwningSystem())
    serviceUrlParse = requests.utils.urlparse(service_base_url)
    if owningSysParse.netloc.lower() == serviceUrlParse.netloc.lower():
        #Ensure that webadaptor name for portal is same as the webadaptor name used by the service.
        if owningSysParse.path:
            serviceUrlPath = serviceUrlParse.path[:len(owningSysParse.path)].lower()
            if owningSysParse.path.lower() == serviceUrlPath:
                service_base_url = hostedgp.GetPrivateUrl(service_base_url)
        else:
            service_base_url = hostedgp.GetPrivateUrl(service_base_url)
    return service_base_url


def get_user_culture() -> str:
    """Get the culture value from the logged-in user profile.

    Returns:
        A string with the user's culture information. If the culture property is missing or the property value is None,
        "en" will be returned. Otherwise the culture property is returned.
    Raises:
        Keyerror if no user information is found from the self profile.

    """
    self_profile = arcpy.GetPortalDescription()
    user = self_profile.get("user")
    if not user:
        arcpy.AddMessage("No user found from portal description.")
        raise KeyError
    culture = user.get("culture", "en")
    if not culture or culture == "en-US":
        culture = "en"

    return culture


def getRemoteToolbox(hostedgp, service_name):
    '''return the toolbox string that can be used to add the remote toolbox using arcpy.gp.AddToolbox
    service_name is the name of the property that defines the url for the service within the helperServices object in
    the portal self call'''

    try:
        service_rest_url, token, referer = getHelperServicesUrl(hostedgp, service_name)
        gp_service = convertRestUrl(service_rest_url)
        tbx = u"{0};token={1};{2}".format(gp_service.toolbox, token, referer)
        return tbx
    except Exception as e:
        raise Exception("Exception @getRemoteToolbox")
#



# def createBufferOutDesc(output_desc, data=None, pos=0, ltype="layer"):
#     ''''create layerOutDescription from outDescription Alternative
#
#     Note: this is an alternative options to the aoutils createLayerOutDesc
#     equivalent because unique value rendering is unfortunately ordered by a
#     string sort by default, not a numeric one. This calls out to
#     sortClassValues to remedy the problem.
#     ''''
#
#     if ltype == "layer" and data:
#         layerProperties = output_desc["layerProperties"][pos]
#         if layerProperties.has_key("rendererDef") and not layerProperties.has_key("drawingInfo"):
#             try:
#                 # update symbology using rendererdef
#                 arcpy.MakeFeatureLayer_management(data, "outLayer")
#                 outLayerName = arcpy.mapping.Layer("outLayer")
#                 outLayerName._arc_object.setsymbology(layerProperties["rendererDef"])
#                 if outLayerName.supports("SYMBOLOGY"):
#                     outLayerName.symbology.classValues = sortClassValues(
#                         outLayerName.symbology.classValues)
#
#                 outLayerName.transparency = 50  # transparency is 50%
#
#                 layerProperties["drawingInfo"] = json.loads(outLayerName._arc_object.getsymbology())
#                 layerProperties.pop("rendererDef")
#             except:
#                 arcpy.AddWarning("unable to support the renderer definition")
#                 output_desc["layerProperties"][pos].pop("rendererDef")
#     output_desc["layerProperties"] = output_desc["layerProperties"][pos]
#     return output_desc

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
        expression = u"!{}!/!{}!".format(countField, areaField)
        arcpy.CalculateField_management(input_layer,
                                        fieldName,
                                        expression,
                                        "PYTHON_9.3")
# End def createNormalizationField


def createShapeAreaField(input_layer, units="", desc=None, area_field_alias=""):
    '''Adds shape Area field'''
    # this routine is used by Buffer, Create Drive Time Areas and summary tools
    shape_field_name = "AnalysisArea"

    if not units or units.lower() == "metric":
        units = "SquareKilometers"
    elif units.lower() == "english":
        units = "SquareMiles"

    # define units
    if "Square" not in units and units not in ["Acres","Hectares"]:
        units = "{}{}".format("Square", units)
    if not area_field_alias:
        area_field_alias = "Area in {}".format(units)
        area_field_alias = area_field_alias.replace("Square", "Square ")

    # Verify whether to calculate geodesic area for WGS_1984
    input_desc = arcpy.Describe(input_layer)
    if useGeodesic(descFC=desc, inputFC=input_layer):
        expression = "!{}.geodesicArea@{}!".format(input_desc.shapeFieldName, units)
    else:
        expression = "!{}.area@{}!".format(input_desc.shapeFieldName, units)

    # Add field and calculate value
    if verifyFieldExists(input_layer, shape_field_name):
        arcpy.AlterField_management(input_layer, shape_field_name,
                                    new_field_alias=area_field_alias)
    else:
        arcpy.AddField_management(input_layer, shape_field_name,
                                  "DOUBLE","#","#","#", area_field_alias)

    #arcpy.AddMessage("{},{}".format(shape_field_name, area_field_alias))
    arcpy.CalculateField_management(input_layer,
                                    shape_field_name,
                                    expression,
                                    "PYTHON_9.3")
    return shape_field_name

# End def createShapeAreaField



def createShapeLengthField(input_layer, units="Kilometers", desc=None):
    '''Adds shape Length field'''
    # this routine is used by Buffer

    if not units or units.lower() == "metric":
        units = "Kilometers"
    elif units.lower() == "english":
        units = "Miles"

    shape_field_name = "AnalysisLength"

    shape_field_alias = "Length in {}".format(units)

    # Verify whether to calculate geodesic area for WGS_1984
    input_desc = arcpy.Describe(input_layer)
    if useGeodesic(descFC=desc, inputFC=input_layer):
        expression = "!{}.geodesicLength@{}!".format(input_desc.shapeFieldName, units)
    else:
        expression = "!{}.length@{}!".format(input_desc.shapeFieldName, units)

    # Add field and calculate value
    if verifyFieldExists(input_layer, shape_field_name):
        arcpy.AlterField_management(input_layer, shape_field_name,
                                    new_field_alias=shape_field_alias)
    else:
        arcpy.AddField_management(input_layer, shape_field_name,
                                  "DOUBLE","#","#","#", shape_field_alias)


    arcpy.CalculateField_management(input_layer,
                                    shape_field_name,
                                    expression,
                                    "PYTHON_9.3")
    return shape_field_name

# End def createShapeLengthField


def selectFeaturesbyExtent(input_layer):
    '''selects features based on arcpy.env.extent'''
    extent = arcpy.env.extent
    #DebugExtent()
    if extent:
        arcpy.env.extent = ""
        sr = extent.spatialReference                
        if sr:
            xydomain = sr.domain.split(" ")            
            if len(xydomain) >= 4:
                xmin1 = atof(xydomain[0])
                ymin1 = atof(xydomain[1])
                xmax1 = atof(xydomain[2])
                ymax1 = atof(xydomain[3])
                arcpy.AddMessage("XY Domain: {},{},{},{}".format(xmin1,ymin1,xmax1,ymax1))

                xmin = extent.XMin
                ymin = extent.YMin
                xmax = extent.XMax
                ymax = extent.YMax

                clip = False
                if xmin < xmin1:
                    xmin = xmin1
                    clip = True
                if ymin < ymin1:
                    ymin = ymin1
                    clip = True
                if xmax > xmax1:
                    xmax = xmax1
                    clip = True
                if ymax > ymax1:
                    ymax = ymax1
                    clip = True

                if clip:
                    #arcpy.AddMessage("Clip extent: {},{},{},{}".format(xmin,ymin,xmax,ymax))
                    extent = arcpy.Extent(xmin,ymin,xmax,ymax)
                    extent.spatialReference = sr
        arcpy.env.extent = extent
        outputCS = arcpy.env.outputCoordinateSystem 
        arcpy.env.outputCoordinateSystem = sr                    
        arcpy.SelectLayerByLocation_management(input_layer, "INTERSECT", extent.polygon, "#","NEW_SELECTION")
        arcpy.env.outputCoordinateSystem = outputCS
        return True
    else:
        return False

# End def selectFeaturesbyExtent

def verifyFieldExists(inputLayer, field_name, fields=None, fieldTypes=[]):
    """Checks if a field exists.
    inputLayer: specify inputLayer if fields array is not available
    field_name: name of the field
    fieldTypes: specify the acceptable field types for the field
    """
    if not fields:
        fields = arcpy.ListFields(inputLayer, field_name)
    if fieldTypes:
        fieldTypes = [tp.lower() for tp in fieldTypes]
    for f in fields:
        if f.name.lower() == field_name.lower():
            if fieldTypes:
                if f.type.lower() in fieldTypes:
                    return True
            else:
                return True
    return False

# End def fieldExists

def reportParamsForCost(hostedgp, taskName, paramsDict):
    '''logs the cost based on the parameter values'''
    # hostedgp.ReportCost(taskName, paramsDict)
    creditutils.CreditsLogger(taskName, paramsDict).report()

# End def report cost


# def callAsyncGPService(tbx, task_name, task_params, ignore_error_codes):
#     '''calls a async GP service and returns the gp result object.
#     @@tbx - full url including the service name and credentials for the remote service.
#     @@task_params - list of parameter values in the order expected by the task.
#     @@ignore_error_codes - list of error codes to ignore from the result when writing the messages
#     from the task output.'''
#
#     start_time = time.time()
#     tbx_added = False
#     service_result = None
#     job_id = ""
#     try:
#         #Add the service
#         arcpy.gp.addToolbox(tbx)
#         tbx_added = True
#         start_time = AddTimerMessage(start_time, "Added remote toolbox")
#
#         #Call the service
#         tbx_name_parts = tbx.split(";")
#         service_name = tbx_name_parts[1].split("/")[-1]
#         gp_task = getattr(arcpy.gp, "{0}_{1}".format(task_name, service_name))
#         service_result = gp_task(*task_params)
#         job_id = service_result.resultID
#         #arcpy.AddMessage(u"Waiting for jobID: {0} to complete on {1}".format(job_id, tbx_name_parts[0]))
#
#         #Wait for job to complete
#         while service_result.status < 4:
#             time.sleep(0.5)
#         start_time = AddTimerMessage(start_time, "Completed call to remote service")
#         #Add messages and return the result
#         severity = service_result.maxSeverity
#         if severity != 0:
#             AddRemoteToolExecuteErrorsAndWarnings(service_result, severity, ignore_error_codes)
#             if severity == 2:
#                 raise arcpy.ExecuteError
#
#     except SystemExit as ex:
#         #raised if cancel was trigged on the caller
#         #try canceling the remote job if it is still executing
#         if service_result:
#             arcpy.AddWarning("Canceling .....")
#             service_result.cancel()
#             raise
#     except Exception as ex:
#         raise
#     finally:
#         if tbx_added:
#             #Remove the GP service as we no longer need to make any calls to it
#             arcpy.gp.removeToolbox(tbx)
#     return service_result
#

def getOutputWkspc(count):
    '''returns in_memory/gdb workspace based on count'''
    #return arcpy.env.scratchGDB
    if count > 1000:
        return arcpy.env.scratchGDB
    else:
        return "in_memory"


def get_featurecount_withinextent(input_lyr, verify_count):
    """Get the count of features within the arcpy.env.extent.

    Args:
        input_lyr: a layer instance.
        verify_count: If true, fail if the layer has zero features.
    Returns:
        an integer with the count of features within arcpy.env.extent.
    Raises:
        100032 if no features within the arcpy.env.extent.
        GPEXT_018 if the # of features within context extent is more than what is defined in maximum feature count
        limitation.

    """
    # Code added to fix the issue of: https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/22394
    # Update the count for feature collection since the count does not honer arcpy.env.extent.
    # The count is not reflecting features within extent even for LAAL in 7.2 (see 
    # https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/24430).
    count = int(arcpy.GetCount_management(input_lyr.name).getOutput(0))
    input_lyr.count = count
    # raise ExecuteError if updated count is 0
    if count == 0 and verify_count:
        layer_name = "feature collection" if input_lyr.layername == "" else input_lyr.layername
        errMsg = "The number of features in {} is zero.".format(layer_name)
        AddErrorCode('100032', errMsg, {"analysisLayer": layer_name})
        raise arcpy.ExecuteError

    return count


def access_fslyr(lyr_url, token=None, referer=None) -> bool:
    """Check if an url represents the feature layer is accessible.

    Args:
        lyr_url: a string represents the URL of a feature layer.
        token: token used to access the feature layer URL.
        referer: referer used to access the feature layer URL.
    Returns:
        True if the url is accessible and False otherwise.

    """
    if token:
        params = {"token": token, "f": "json"}
    else:
        params = {"f": "json"}
    
    headers = {"referer": referer} if referer else {}
    try:
        response = requests.get(lyr_url, params=params, headers=headers)
        if response.status_code == 200:
            # Check if contains error code
            if "error" in response.json():
                error_message = response.json()["error"].get("message")
                arcpy.AddMessage(f"Failed in accessing {lyr_url} due to {error_message}.")
                return False
            return True
        else:
            arcpy.AddMessage(f"Failed in accessing {lyr_url}.")
            return False
    except:
        arcpy.AddMessage(f"Failed in accessing {lyr_url}.")
        return False


def validate_layer_as_nainput(hgp_lyr):
    """Validate if a hostedgp layer object is usable as an input for NA service.

    Args:
        hgp_lyr: an object of hostedgp layer.
    Returns:
        No return. If the hgp_lyr contains token that can't be passed to NA service,
        the name property of the object is replaced with the layer created from the local copy.

    """
    if hasattr(hgp_lyr, 'esriLayerCatalogPath'):
        LAALCatalogPath = hgp_lyr.esriLayerCatalogPath
        if LAALCatalogPath:
            return

    if len(hgp_lyr.name) > 0:
        catalog_path = arcpy.Describe(hgp_lyr.name).catalogPath
        # catalog_path points to URL means the data is not hosted.
        if (catalog_path.startswith("http://") or catalog_path.startswith("https://")):
            if access_fslyr(catalog_path):
                return
            else:
                sign_in_token = arcpy.GetSigninToken()
                if access_fslyr(catalog_path, sign_in_token["token"], sign_in_token["referer"]):
                    return
                else:
                    local_data = arcpy.CreateUniqueName(f"local_{hgp_lyr.name}", arcpy.env.scratchGDB)
                    arcpy.AddMessage(f"local_data: {local_data}")
                    arcpy.management.CopyFeatures(hgp_lyr.name, local_data)
                    tmp_lyr_name = arcpy.management.MakeFeatureLayer(local_data).getOutput(0).name
                    arcpy.AddMessage(f"Created feature layer named {tmp_lyr_name} from local copy.")
                    hgp_lyr.name = tmp_lyr_name


def log_laal_usage(param_name, layer, count):
    """Log the usage of LAAL.

    Args:
        param_name: name of the parameter where the layer is get from.
        layer: output from hostedgp.GetHostedLayer.
        count: # of features fall within the extent.
    Returns:
        No returns.

    """
    debugUtils.debugLayer(param_name, layer)
    # log LAAL layer
    if hasattr(layer, 'esriLayerCatalogPath'):
        LAALCatalogPath = layer.esriLayerCatalogPath
        arcpy.AddMessage('inputLyr esriLayerCatalogPath: {}'.format(LAALCatalogPath))
        if LAALCatalogPath:
            msg = "paramName: {} : LAAL:{}".format(param_name, LAALCatalogPath)
            arcpy.gp._arc_object.LogUsageMetering(7777, msg, count, 0)
    else:
        arcpy.AddMessage('inputLyr does not has an attribute named esriLayerCatalogPath.')


def validate_hosted_layer(hgp_layer, verify_count, max_download_featcount):
    """Validate the hostedLayer.

    Args:
        hgp_layer: output from hostedgp.GetHostedLayer.
        verify_count: If true, fail if the layer has zero features.
        max_download_featcount: an integer represents the maximum limitation of downloadable features.
    Returns:
        count of features that fall within the context extent.
    Raises:
        100032 if no features within the arcpy.env.extent.
        GPEXT_018 if the # of features within context extent is more than what is defined in maximum feature count
        limitation.

    """
    inputLayer = hgp_layer.name
    inputLayerName = hgp_layer.layername
    shapeType = hgp_layer.shapeType
    count = hgp_layer.count
    # if HostedLayer.name length is zero, may be optional, input was not provided.
    if len(inputLayer) > 0:
        # update count of features
        if count > 0:
            #selectFeaturesByExtent only when it is a layer and not table
            if len(shapeType) > 0 :
                desc = arcpy.Describe(hgp_layer.name)
                if not hasattr(desc, "spatialReference") or desc.spatialReference is None or desc.spatialReference.name == "Unknown":
                    if hgp_layer.layername == "":
                        hgp_layer.layername = "feature collection"
                    message = "No spatial reference found for {}. This will either cause the analysis to fail or create an output with no spatial reference.".format(hgp_layer.layername)
                    AddErrorCode('100284', message, params={"inputLayer": hgp_layer.layername}, warning=True)

                # Check if the download feature count exceeds the max_download_featcount.
                # Place the check before selectFeaturesbyExtent to avoid un-necessary downloading.
                if max_download_featcount:
                    catalog_path = desc.catalogPath
                    arcpy.AddMessage("catalog_path is: {}".format(catalog_path))
                    # catalog_path points to URL means need to download the data
                    if (catalog_path.startswith("http://") or catalog_path.startswith("https://")):
                        esri_catalog_path = hgp_layer.esriLayerCatalogPath if hasattr(hgp_layer, 'esriLayerCatalogPath') else ""
                        # Download limitation does not apply to LAAL.
                        count = int(arcpy.GetCount_management(hgp_layer.name).getOutput(0))
                        if not esri_catalog_path.strip() and count > max_download_featcount:
                            message = "The remote feature service {} exceeds the limit of 100,000 features. Create a hosted feature service to analyze large data.".format(catalog_path)
                            msg = {"messageCode": "GPEXT_018", "message": message, "params": {"url": catalog_path}}
                            arcpy.AddError(json.dumps(msg))
                            raise arcpy.ExecuteError

                selectFeaturesbyExtent(inputLayer)
                count = get_featurecount_withinextent(hgp_layer, verify_count)
        # verify count
        elif verify_count:
            # Some layers such as barrier layers are valid even when they have zero features.
            if inputLayerName == "" :
                lyrName = "feature collection"
            else:
                lyrName = inputLayerName
            errMsg = "The number of features in {} is zero.".format(lyrName)
            AddErrorCode('100032',errMsg,{"analysisLayer":lyrName})
            raise arcpy.ExecuteError
    return count


def getHostedLayer(hostedgp, paramName, paramPosition, verify_count=True,
                   max_download_featcount=DEFAULT_DOWNLOADABLE_FEATCOUNT):
    '''gets the layer and verifies zero features.
    hostedgp : hostedgp instance.
    paramName : name to identify the parameter.
    paramPosition:zero based position.
    verify_count: If true, fail if the layer has zero features.
    max_download_featcount: an integer represents the maximum limitation of downloadable features.
    returns...
    '''
    inputLyr = hostedgp.GetHostedLayer(paramPosition)
    count = validate_hosted_layer(inputLyr, verify_count, max_download_featcount)
    changedFields = inputLyr.changedFieldNames
    if changedFields:
        changedFields = json.loads(changedFields)
    
    log_laal_usage(paramName, inputLyr, count)
    return inputLyr, inputLyr.name, inputLyr.layername, inputLyr.shapeType, count, changedFields


def getHostedLayerX(hostedgp, paramName, paramPosition, verify_count=True,
                    max_download_featcount=DEFAULT_DOWNLOADABLE_FEATCOUNT,
                    use_as_soap_input =False):
    '''gets the layer and verifies zero features.
    hostedgp : hostedgp instance.
    paramName : name to identify the parameter.
    paramPosition:zero based position
    verify_count: If true, fail if the layer has zero features.
    max_download_featcount: an integer represents the maximum limitation of downloadable features.
    returns hostedlayer and count
    pass_to_remote: 
    '''
    inputLyr = hostedgp.GetHostedLayer(paramPosition)
    count = validate_hosted_layer(inputLyr, verify_count, max_download_featcount)
    if use_as_soap_input :
        validate_layer_as_nainput(inputLyr)
    log_laal_usage(paramName, inputLyr, count)
    return inputLyr, count


def getHostedLayers(hostedgp, param_name, param_position, for_extractdata, verify_count=True,
                    max_download_featcount=DEFAULT_DOWNLOADABLE_FEATCOUNT):
    """get a list of hosted layers from a certain parameter.
    
    Args:
        hostedgp: instance of hostedgp.
        paramName: name of the parameter.
        paramPosition: an integer represents the index of the parameter.
        verify_count: If true, an error is raised for any layers that has zero features.
        max_download_featcount: an integer represents the maximum limitation of downloadable features.
    Returns:
        A list of host layers.

    """
    input_layers = hostedgp.GetHostedLayers(param_position, for_extractdata)
    feat_counts = []
    for input_lyr in input_layers:
        tmp_count = validate_hosted_layer(input_lyr, verify_count, max_download_featcount)
        log_laal_usage(param_name, input_lyr, tmp_count)
        feat_counts.append(tmp_count)
    return (input_layers, feat_counts)


def getOutDescription(layerName, uniq_id, drawingInfo=None, popupInfo=None, relationships=None):
    '''creates output description for a feature layer output parameter.
    layerName: name for the layer.
    uniq_id, id that uniquely identifies the layer in the output feature service.
    Also, the layer with uniq_id  value 0 will inherit the name of the feature service
    irrespective of the layer name
    drawingInfo (optional): drawingInfo for the feature layer:
    popupInfo (optional): popupInfo for the feature Layer.
    relationships (optional) : relationaships that the layer will participate.
    '''
    outDesc = {}
    outDesc["name"] = layerName
    outDesc["id"] = uniq_id
    properties = {}
    if drawingInfo:
        properties["drawingInfo"] = drawingInfo
    if popupInfo:
        properties["popupInfo"] = popupInfo
    if relationships:
        properties["relationships"] = relationships
    if properties:
        outDesc["properties"] = properties
    return outDesc


def getRelationshipDef(relName, related_id, keyField="JOIN_ID", isOrigin=True, isOneToMany=True, isComposite=True):
    '''returns relationship definition for layers and tables'''

    relationshipDef = {
        "name":"GroupBySummary",
        "relatedTableId":1,
        "cardinality":"esriRelCardinalityOneToMany",
        "role":"esriRelRoleOrigin",
        "keyField":"",
        "composite":True
    }
    relationshipDef["name"]  = relName
    relationshipDef["relatedTableId"] = related_id
    relationshipDef["keyField"] = keyField
    relationshipDef["composite"] = isComposite
    if not isOrigin:
        relationshipDef["role"] = "esriRelRoleDestination"
    if not isOneToMany:
        relationshipDef["cardinality"] = "esriRelCardinalityManyToMany"
    return relationshipDef


def updateChangedFieldNames(fields, changedFieldNames, isMultivalue=False, isStatsField=False):
    '''update fields with changedFieldNames property.
    fields: field parameter, can be a single, multiple value or "field stats" values.
    isMultivalue: is the parameter type multivalue.
    isStatsField: is the parameter accept stats fields eg. ["xx sum", "yy avg"] or ["xx remove", "yy rename zz"].
    '''
    if fields and changedFieldNames:
        if not isinstance(changedFieldNames, dict):
            changedFieldNames = json.loads(changedFieldNames)
        if isMultivalue:
            fieldSplitChar = " " if isStatsField else ";"
            # workaround to replace last value
            fields = "{};".format(fields)
            for field, changedField in changedFieldNames.items():
                field = "{}{}".format(field, fieldSplitChar)
                if field in fields:
                    changedField = "{}{}".format(changedField, fieldSplitChar)
                    fields = fields.replace(field, changedField)
            # remove workaround
            fields = fields.strip(";")
            #arcpy.AddMessage("updatedFields :{}".format(fields))
            return fields
        else:
            if fields in changedFieldNames:
                fields = changedFieldNames[fields]
                #arcpy.AddMessage("updatedFields :{}".format(fields))
                return fields
    return fields



def convertMutiPointToSingleFeatures(inputLayer, paramName, warningMsg, wkspc=None):
    '''Converts multipart features to single features
    inputLayer is the Layer object that should be converted to single features
    inputLayerInfo is a local class that has all the describe info
    paramName is the name of the parameter that is being converted
    paramName is required for adding a warning message
    '''
    if not wkspc:
        # check no of features to determine wkspc
        result = arcpy.GetCount_management(inputLayer)
        count = result.getOutput(0)
        if count > 1000:
            wkspc = arcpy.env.scratchGDB
        else:
            wkspc = "in_memory"

    newLayer = arcpy.CreateUniqueName("singleFeatures", wkspc)
    warningMessage = warningMsg.format(paramName)
    msg = (100048,warningMessage,{"inputLayer":paramName},True)
    arcpy.MultipartToSinglepart_management(inputLayer, newLayer)
    return newLayer, msg

def hexGrids(layerObj):
    if layerObj and layerObj.name:
        try:
            catalogPath = layerObj.esriLayerCatalogPath
        except:
            return False
        # esriLayerCatalogPath will be populated only when it is a local layer
        if catalogPath and "hex_grid" in catalogPath:
            arcpy.AddMessage("hex_grid:{}".format(catalogPath))
            return True
    return False



class HostedToolResult():
    def __init__(self, outputName):
        self.outputName = outputName
        self.layerDescriptions = []
        self.descLayers = []
        self.descDatabasePath = []
       

    def addHostedOutput(self, descLayer, layerDesc, paramPosition):
        '''adds the feature layer or table to result, '''
        self.descLayers.append(descLayer)        
        layerDesc["position"] = paramPosition
        layerDesc["catalogPath"] = descLayer.catalogPath
        if not self.outputName.createService and descLayer.catalogPath:
            count = int(arcpy.GetCount_management(descLayer.catalogPath).getOutput(0))
            if count > 9999:
                AddErrorCode(100291, errorMsgs[100291])
                raise Exception

        if not layerDesc.get("properties"):
            layerDesc["properties"] = {}
        self.layerDescriptions.append(layerDesc)

    def createUniqueIndex(self, relationships, sqlLayer):
        '''create index on keyfield if relrole is origin'''
        indexedFields = []
        for i, relationship in enumerate(relationships):
            role = relationship.get("role")
            keyField = relationship.get("keyField")
            if role == "esriRelRoleOrigin" and keyField not in indexedFields:
                indexName = "RELIDX{}".format(int(time.time()))
                inputLayer = sqlLayer
                arcpy.AddIndex_management(inputLayer, keyField, indexName,"UNIQUE","ASCENDING")
                indexedFields.append(keyField)

    def updatePopup(self, popupInfo, gdbFields, sqlServerFields):
        '''update popup if fieldname in gdbfield is different than sqlserverfields'''
        #arcpy.AddMessage("updatePopup")
        # create changedField list
        changedFieldPair = {}
        gdbRequireFields = [field for field in gdbFields if (not field.required and field.type != "Geometry") or field.type == "OID"]               
        sqlRequireFields = [field for field in sqlServerFields if (not field.required and field.type != "Geometry") or field.type == "OID"]
        for gdbField, sqlField in zip(gdbRequireFields, sqlRequireFields):
            # fix for OID, FID issue with SQL Server and
            # names that change when copied from gdb to sql server
            if gdbField.name != sqlField.name :
                changedFieldPair.update({gdbField.name: sqlField.name})

        sqlFieldNames = [field.name for field in sqlServerFields]
        fieldInfos = popupInfo["fieldInfos"]        
        toRemoveInfo = []
        for fieldInfo in fieldInfos:
            itemName = fieldInfo["fieldName"]
            if itemName.lower() in ["shape_area", "shape_length", "st_area_shape_", "st_length_shape_"]:
                toRemoveInfo.append(fieldInfo)
            elif changedFieldPair.get(itemName):
                fieldInfo["fieldName"] = changedFieldPair[itemName]
                # if fields have changed update popup
                #arcpy.AddMessage("update popup :{}:{}".format(itemName, changedFieldPair[itemName]))
        # remove shape_length, shape_area
        if toRemoveInfo:
            for info in toRemoveInfo:
                #arcpy.AddMessage("removed popup:{}".format(info["fieldName"]))
                fieldInfos.remove(info)      
                    
        


    def addFieldAlias(self, gdbFields, sqlServerFields):
        '''adds alias to sql fields'''
        #arcpy.AddMessage("addFieldAlias")
        # update gdb fieldAliases if provided by the tool
        # else use the default gdb alias created by the tool
        # we rely on explicit mapping between the field names and aliases
        # and do not depend upon the list order of fields.
        # CR316484
        gdbFieldAliasMap = {}
        for field in gdbFields:
            gdbFieldAliasMap[field.name.lower()] = field.aliasName
        # get the matching SQL field names
        sqlFieldNames = [field.name for field in sqlServerFields]
        aliases = []
        for fName in sqlFieldNames:
            # ignore aliases for OBJECTID and SHAPE
            if fName.lower() not in ["objectid", "shape"]:
                alias = gdbFieldAliasMap.get(fName.lower(), fName)
                aliases.append({"name": fName, "alias": alias})
        #arcpy.AddMessage("aliases: {}".format(aliases))
        return aliases


    def removeShapeFields(self, gdbFields):
        '''Remove Shape_length and Shape_Area fields since they will not be copied over'''
        # went with a longer loop to capture all casing
        #arcpy.AddMessage("In removeShapeFields")
        toRemoveFields = []
        for field in gdbFields:
            if field.name.lower() in ["shape_area","shape_length", "st_area_shape_", "st_length_shape_" ]:
                toRemoveFields.append(field)
        if toRemoveFields:
            for field in toRemoveFields:
                #arcpy.AddMessage("removing gdb field : {}".format(field.name))
                gdbFields.remove(field)

    def copyResultToDatabase(self, hostedgp, startTime):
        for _, lyrDescription in enumerate(self.layerDescriptions):
            sqlServerPath = hostedgp.GetOutputCatalogPath(self.outputName).path
            localDataPath = lyrDescription["catalogPath"]
            arcpy.gp._arc_object.SimpleCopy(localDataPath, sqlServerPath)

            paramName = lyrDescription["name"]
            startTime = AddTimerMessage(startTime,"{} : Simple copy to {}".format(paramName, sqlServerPath))
            lyrDescription["catalogPath"] = sqlServerPath
            self.descDatabasePath.append(arcpy.Describe(sqlServerPath))

    def updateRelField(self, relPattern, fieldName, databaseFields):
        if relPattern in fieldName: 
            fieldName = fieldName.split(relPattern)[1]            
            fieldName = getFieldName(databaseFields, fieldName)
            return "{}{}".format(relPattern, fieldName)
        else:
            return fieldName
        

    def updateRelPopupInfo(self, popupInfo, relatedTableId):
        '''update fieldnames in mediainfos based on tablefieldnames'''
        relPattern = "relationships/{}/".format(relatedTableId-1)
        #arcpy.AddMessage(relPattern)
        databaseFields = self.descDatabasePath[relatedTableId].fields
        fieldInfos = popupInfo.get("fieldInfos", [])
        #arcpy.AddMessage(json.dumps(fieldInfos))
        for i, fieldInfo in enumerate(fieldInfos):
            fieldName = fieldInfo["fieldName"]
            fieldName = self.updateRelField(relPattern, fieldName, databaseFields)
            fieldInfos[i]["fieldName"] = fieldName
                
        mediaInfos = popupInfo.get("mediaInfos", []) 
        for i, mediaInfo in enumerate(mediaInfos):            
            #arcpy.AddMessage(fields)
            tooltipField = mediaInfos[i]["value"]["tooltipField"]
            tooltipField = self.updateRelField(relPattern, tooltipField, databaseFields)
            mediaInfos[i]["value"]["tooltipField"] = tooltipField
            fields = mediaInfo["value"]["fields"]
            for j, field in enumerate(fields):
                fieldName = self.updateRelField(relPattern, field, databaseFields)
                mediaInfos[i]["value"]["fields"][j] = fieldName
                  

    def generateHostedResult(self, hostedgp,startTime):
        '''creates feature service.
        hostedgp : hostedgp instance.
        startTime : Time.'''
        if self.outputName.createService:
            self.copyResultToDatabase(hostedgp, startTime)
            for index, lyrDescription in enumerate(self.layerDescriptions):
                paramName = lyrDescription["name"]
                # update alias information
                gdbFields = self.descLayers[index].fields
                if hasattr(self.descLayers[index], "shapeFieldName"):
                    self.removeShapeFields(gdbFields)
                    startTime = AddTimerMessage(startTime, "{} :Remove shape fields".format(paramName))

                # update properties
                properties = lyrDescription["properties"]
                #create field alias
                databaseFields = self.descDatabasePath[index].fields
                alias = self.addFieldAlias(gdbFields, databaseFields)
                properties["alias"] = alias
                startTime = AddTimerMessage(startTime, "{} :Created field alias".format(paramName))

                # update popups from gdbFields
                #startTime = AddTimerMessage(startTime, "popupInfo is {}".format(properties.get("popupInfo", "None")))
                #if properties.get("popupInfo"):
                if "popupInfo" in properties:
                    gdbFieldNames=[f.name for f in gdbFields]
                    databaseFieldNames = [f.name for f in databaseFields]
                    #startTime = AddTimerMessage(startTime, "gdbFields are {}".format(",".join(gdbFieldNames)))
                    #startTime = AddTimerMessage(startTime, "databaseFields are {}".format(",".join(databaseFieldNames)))
                    self.updatePopup(properties["popupInfo"], gdbFields, databaseFields)
                    popupInfo = properties["popupInfo"]                    
                else:
                    popupInfo = None

                # create index for key field for relationships if any
                if properties.get("relationships"):
                    #Update the keyField name to be based on DBMS field name
                    relationships = properties["relationships"]
                    #arcpy.AddMessage(json.dumps(properties["relationships"]))
                    for rel in relationships:
                        #Update keyField casing
                        keyField = rel.get("keyField", None)
                        if keyField:
                            rel["keyField"] = getFieldName(databaseFields, keyField)
                            arcpy.AddMessage(u"Updated keyField for relationship from {0} to {1}".format(keyField,
                                                                                                  rel["keyField"]))
                        #Update mediaInfos based on databasefields  
                        if popupInfo:                            
                            self.updateRelPopupInfo(popupInfo, rel["relatedTableId"])
                    self.createUniqueIndex(relationships, lyrDescription["catalogPath"])

        outputLayerDesc = {}
        outputLayerDesc["layers"] = self.layerDescriptions
        hostedgp.ProcessFeatureOutput(json.dumps(outputLayerDesc, skipkeys=False,
                                                 ensure_ascii=False))
        startTime = AddTimerMessage(startTime, "Created outputs with ProcessFeatureOutput method")
        return startTime
