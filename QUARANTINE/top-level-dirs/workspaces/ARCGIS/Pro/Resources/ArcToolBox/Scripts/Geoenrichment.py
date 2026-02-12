import urllib.request
from urllib.parse import urlparse
import json
import os
import time
import arcpy
import ProcessRestRequest
import aolutils
import sys
import traceback
import copy

from CreateDriveTimeAreas_dt import check_service_area_limits


#Constant variables
TASK_NAME = "EnrichLayer"
GEOENRICH_URL = "GeoEnrichment/enrich"
ID_FIELD_NAME = "ORIG_ID"
#MAX_FEATURES_IN_SPLIT_DRIVETIME = 30
#MAX_FEATURES_IN_SPLIT = 500
#MAX_FEATURES_IN_SPLIT_LINE = 200
#MAX_FEATURES_IN_SPLIT_POLYGON = 30
MAX_VERTICES_IN_SPLIT_DRIVETIME = 30
MAX_VERICES_IN_SPLIT = 50
MIN_SPLIT_PER_THREAD = 50
MIN_SPLIT_PER_THREAD_DRIVETIME = 15
MAX_VERTICES_IN_SPLIT_POLYLINE = 5000
MAX_VERTICES_IN_SPLIT_POLYGON = 10000
MAX_NO_THREADS = 10
GREATER_THAN_8MB = 100000
SIMPLIFY_VERICE_LIMIT = 0.00001
MAX_NO_THREADS = 10

GE_PRIVILEGE = "premium:user:geoenrichment"
NA_PRIVILEGE = "premium:user:networkanalysis"
service_url = "https://geoenrich.arcgis.com/arcgis/rest/services/World/geoenrichmentserver/GeoEnrichment/enrich"
wkspc = "in_memory"
addSimplifyWarning = False
enrichWarningsDesc = {"110000":{"errorCode":100047, "text":"Enrichment may not be available for some features"}}
#geoEnrichWarnings = []

geoEnrichWarnings = []

errorMsgs = {
             100022: "Units {} is not supported for Buffer type {}.",
             100023: "Unable to enrich layer for input spatial reference {}.",
             100041: "Buffer type parameter is supported only for layers containing points and lines.",
             100044: "Distance value should be greater than 0.",
             100045: "Distance and units are required when Buffer type is specified.",
             100046: "Unable to access GeoEnrichment server.",
             100110: "Your user role does not include the GeoEnrichment privilege.",
             100111: "Your user role does not include the network analysis privilege.",
             100124: "The geometry type of input Layer must be points for buffer type {}.",
             100120: "The features in the input layer are beyond max request size limit and cannot be enriched.",
             100126: "The features in the input layer are beyond max request size and hence simplified.",
             100103: "The {measureType} value cannot be greater than {max} {breakUnits}",
             100144: "The Geoenrichment server returned no features."

             }

# End Module variable

travel_mode = {"STRAIGHT_LINE":"",
              "DRIVE_TIME":"Driving",
              "DRIVING_DISTANCE":"Driving",
              "TRUCKING_TIME":"Trucking",
              "TRUCKING_DISTANCE":"Trucking",
              "WALKING_TIME":"Walking",
              "WALKING_DISTANCE":"Walking"}

BUFFER_DIST_LIMIT ={"miles":1000,
                    "meters":1609344,
                    "kilometers":1609.344,
                    "yards":1760000,
                    "feet":5280000}

def verifyInputs():
    '''Verifies parameters of the tool'''
    global shapeType
    global bufferType
    global distance
    global units

    #All shapetypes are now supported
    #if shapeType.lower() not in ["Point","Polyline","Polygon"]:
        #aolutils.AddErrorCode(100021, "The geometry type of Input Layer must be point, line or polygon")
        #return False
    isValid = []
    if bufferType:
        if distance and units:
            if distance[0] <= 0:
                arcpy.AddError(errorMsgs[100044])
                isValid.append(False)
            else:
                # Check for max limit
                if bufferType.lower() == "straight_line":
                    #arcpy.AddMessage(BUFFER_DIST_LIMIT[units])
                    if distance[0] > BUFFER_DIST_LIMIT[units.lower()]:
                        msg_code = 100103
                        msg_params = {
                            "max": BUFFER_DIST_LIMIT[units.lower()],
                            "breakUnits": units,
                            "measureType": bufferType}
                        msg = errorMsgs[msg_code].format(**msg_params)
                        arcpy.gp.AddError(msg, msg_code)
                        isValid.append(False)
                else:
                    travelMode = travel_mode[bufferType]
                    msg = check_service_area_limits(0,"", distance, units, travelMode,False)
                    if msg:
                        arcpy.gp.addError(msg[1], msg[0])
                        isValid.append(False)
    return all(isValid)


def prepareParams(token):
    '''prepare params for geoenrichment service'''
    params = {}
    params["token"] = token
    params["f"] = "json"
    params["returnGeometry"] = "false"

    # DataCollections
    if len(dataCollections) > 0:
        params["dataCollections"] = dataCollections

    if len(analysisVariables) > 0:
        params["analysisVariables"] = analysisVariables

    # set sourcecountry if country is provided\
    if srcCountry:
        params["useData"] = {"sourceCountry": srcCountry}

    # specify studyAreaOptions if Buffer or drivetime is specified
    if bufferType and units and distance:
        if bufferType.lower() == "straight_line":
            areaType = "RingBuffer"
            bufferUnits = "esri{}".format(units)
        else:
            areaType = "DriveTimeBuffer"
        travelMode = travel_mode[bufferType]
        if "time" in bufferType.lower():
            bufferUnits = "esriDriveTimeUnits{}".format(units)
        elif "distance" in bufferType.lower():
            bufferUnits = "esri{}".format(units)
        params["studyAreasOptions"] = {
            "areaType": areaType,
            "bufferUnits": bufferUnits,
            "bufferRadii": distance
        }
        if travelMode:
            params["studyAreasOptions"]["travelMode"] = travelMode

    #calculate spatial reference for insr parameter
    try:
        with arcpy.da.SearchCursor(enrichedLayer,("SHAPE@JSON")) as cursor:
            for row in cursor:
                geometry = json.loads(row[0])
                spref = geometry["spatialReference"]
                if spref:
                    if "wkid" in spref:
                        params["inSR"] = spref["wkid"]
                    elif "wkt" in spref:
                        params["inSR"] = {"wkt":spref["wkt"]}
                if params.get("inSR") is None:
                    arcpy.AddIDMessage("ERROR", 517)
                    raise SystemExit
                break;
    except ValueError:
        raise Exception("Unable to calculate spatial reference")

    #arcpy.AddMessage(json.dumps(params))
    return params


def simplifyLargeFeatures(geom):

    global addSimplifyWarning

    shapeType = geom.type.lower()
    maxOffset = geom.getLength() * SIMPLIFY_VERICE_LIMIT
    if "polyline" in shapeType or "polygon" in shapeType:
        geom = geom._arc_object.generalize(maxOffset)
    else:
        #arcpy.AddMessage("Multipoint, hence cannot be simplified")
        raise Exception("Complex Multipoint data, hence cannot be simplified")
    count = geom.pointCount
    #arcpy.AddMessage("simplified Verice Count: {}".format(count))
    if count > GREATER_THAN_8MB:
        #arcpy.AddMessage("Too many vertices even after simplify")
        raise Exception("Very large Data, hence cannot be simplified")
    elif not addSimplifyWarning:
        addSimplifyWarning = True


    return geom, count


def convertLayerToJSON(cursor, leftOverFeatures=None, verticesCount=0):
    '''converts layer to geometry JSON'''

    global isPoint
    global curves
    global maxVerticesPerSplit
    global maxRowCount

    if leftOverFeatures:
        rowCount = 1
        features = leftOverFeatures
    else:
        rowCount = 0
        features = []

    if verticesCount > maxVerticesPerSplit:
        return features, [], 0
    addMoreFeatures = True

    while addMoreFeatures:
        try:
            row = next(cursor)
            rawGeometry = row[1]
            if isPointCount:
                #densify curveRings(Poly) and curvePaths(line/poly)
                #if any((x in rawGeometry.JSON for x in curves)):
                    #arcpy.AddMessage("densified polygon for OID: {}".format(row[0]))
                    #rawGeometry = rawGeometry.densify("ANGLE",-1,-1)
                currVerticeCount = rawGeometry.pointCount
                #arcpy.AddMessage("Pt Count: {}".format(currVerticeCount))
                if currVerticeCount > GREATER_THAN_8MB :
                    #arcpy.AddMessage("greater than 8MB Pt Count: {}".format(currVerticeCount))
                    try:
                        rawGeometry, currVerticeCount = simplifyLargeFeatures(rawGeometry)
                    except Exception as e:
                        #arcpy.AddMessage(str(e))
                        ERROR_CODES.remove(100126)
                        arcpy.AddError(errorMsgs[100120])
                        raise SystemExit
            else:
                currVerticeCount = 1
            #geometry = json.loads(rawGeometry.JSON)
            geometry = json.loads(rawGeometry._arc_object.getjson(False, False, False, False))
            #remove spatial reference and other values from geometry
##            for key in REMOVE_KEYS_IN_GEOMETRY:
##                if key in geometry:
##                    geometry.pop(key)
            enrichJSON = {"geometry":geometry,"attributes":{ID_FIELD_NAME:row[0]}}
            verticesCount = verticesCount + currVerticeCount
            rowCount = rowCount + 1
            if verticesCount > maxVerticesPerSplit or rowCount > maxRowCount:
                addMoreFeatures = False
                #arcpy.AddMessage("No. of vertices: {}".format(currVerticeCount))
                return features, [enrichJSON], currVerticeCount
            else:
                features.append(enrichJSON)

        except StopIteration:
            #arcpy.AddMessage("Reached end of cursor")
            return features, None, 0



def processResponse(runningThreadCount, outputTable, curr_thread_cycle):
    '''processes response JSON and creates table or appends records'''
    bCreateTable = True
    while runningThreadCount > 0:

        q = ProcessRestRequest.outResponseQueue
        if q.qsize() > 0:
            response = q.get()
            runningThreadCount = q.qsize()
            #runningThreadCount = runningThreadCount - 1
            if response["response"] != "HTTPError":
                arcpy.AddMessage(u"Received enriched values and processing: {}".format(response["name"]))
                enrichedResult = response["response"]
                #aolutils.writeTempFile("enrichresponse{}.json".format(runningThreadCount),json.dumps(enrichedResult))
                #process error and warning message
                if "messages" in enrichedResult and enrichedResult["messages"]:
                    scrubMessages(enrichedResult["messages"])
                if "results" in enrichedResult:
                    # process result featureset
                    enrichedFeatures = enrichedResult["results"][0]["value"]["FeatureSet"][0]
                    # skip if empty featuresets were returned
                    if len(enrichedFeatures["features"]) > 0:
                        if curr_thread_cycle == 0 and bCreateTable:
                            createFeatureClass(enrichedFeatures, outputTable)
                            bCreateTable = False
                        else:
                            appendFeatures(enrichedFeatures, outputTable)
                    else:
                        arcpy.gp.addError(errorMsgs[100144], 100144)
                else:
                    arcpy.AddError("Request failed from Geoenrichment Server:")
                    # arcpy.AddMessage(enrichedResult)
                    if "error" in enrichedResult:
                        msg = enrichedResult["error"]
                        if "details" in msg:
                            arcpy.AddError(msg["details"])
                    else:
                        arcpy.AddMessage(enrichedResult)
                    raise Exception("Error in output data from Geoenrich")
            else:
                #arcpy.AddMessage("HTTP Request Error Start row {}, end row {}".format(response["startRow"], response["endRow"]))
                arcpy.gp.addError(errorMsgs[100046], 100046)
                raise SystemExit
        else:
            time.sleep(1)
    return True

# End def processResponse

def createFeatureClass(enrichedFeatures, outputTable):
    '''Creates a table based on field definitions from JSON'''
    #arcpy.AddMessage("Create Feature Class {}".format(outputTable))
    sEnrichedFeatures = json.dumps(enrichedFeatures)
    rs = arcpy.gp.fromEsriJson(sEnrichedFeatures)
    rs.save(outputTable)
    #arcpy.CopyRows_management(rs, outputTable)
# End def createFeatureClass

def appendFeatures(enrichedFeatures, outputTable):
    '''Adds records in the featuresetJSON to the output table'''
    # create a temp file and write JSON
    #tempTable = arcpy.CreateUniqueName("tempRS", wkspc)
    tempTable = arcpy.CreateUniqueName("tempRS", "in_memory")
    #arcpy.AddMessage("Append Features {}".format(tempTable))
    sEnrichedFeatures = json.dumps(enrichedFeatures)
    rs = arcpy.gp.fromEsriJson(sEnrichedFeatures)
    # save recordset as table and append
    rs.save(tempTable)
    arcpy.Append_management(tempTable, outputTable, "NO_TEST")
    arcpy.Delete_management(tempTable)

# End def appendFeatures

def scrubMessages(messageArray):
    for msg in messageArray:
        msgType = msg["type"]
        msgDesc = msg["description"]
        if "Warning" in msgType:
            arcpy.AddWarning(msgDesc)
            geoEnrichWarnings.append(msg["id"])
        elif "Error" in msg["type"]:
            arcpy.AddError(msgDesc)


# End def scrubWarningMessages

def getThreadName(features):
    '''find the first and last oid and name the thread'''
    try:
        def findOID(feature):
            if "attributes" in list(feature.keys()):
                attributes = list(feature["attributes"].values())
                return str(attributes[0])
        if len(features) > 1:
            return "from OID {} to {}".format(findOID(features[0]), findOID(features[-1]))
        else:
            return "OID {}".format(findOID(features[0]))
    except Exception as e:
        #arcpy.AddMessage(str(e))
        return "Some OIDS"

def initiateThreadCycles(service_url, params, referer, enrichDataTable):

    num_of_threads = 0
    curr_thread_cycle = 0
    with arcpy.da.SearchCursor(enrichedLayer,("OID@", "SHAPE@")) as cursor:
        features = []
        leftOvers = []
        countOfFeaturesInLeftOvers = 0
        while leftOvers != None:
            #arcpy.AddMessage("Thread Cycle : {}".format(curr_thread_cycle))
            threads = []
            while num_of_threads < MAX_NO_THREADS:
                features, leftOvers, countOfFeaturesInLeftOvers = convertLayerToJSON(
                    cursor, leftOvers, countOfFeaturesInLeftOvers)
                #arcpy.AddMessage(features)
                if features:
                    currParams = copy.deepcopy(params)
                    currParams["studyareas"] = features
                    #fix for token expiry
                    token = arcpy.GetSigninToken()
                    if token:
                        currParams["token"] = token.get("token")
                    name = getThreadName(features)
                    #arcpy.AddMessage("Initiating thread :{}".format(name))
                    t = (ProcessRestRequest.ProcessRestReq(name, service_url, currParams, referer, arcpy.env.scratchFolder))
                    t.start()
                    threads.append(t)
                    num_of_threads = num_of_threads + 1
                # no leftovers, so don't have to go back to convertLayerToJSON
                if leftOvers == None:
                    #arcpy.AddMessage("End of thread requests")
                    break
            for t in threads:
                t.join()
            processResponse(num_of_threads, enrichDataTable, curr_thread_cycle)
            curr_thread_cycle = curr_thread_cycle + 1
            num_of_threads = 0
    #Add simplify warning if needed
    if addSimplifyWarning:
        arcpy.gp.addWarning(errorMsgs[100126])
        #aolutils.AddErrorCode(100126, errorMsgs[100126], warning=True)

def getMaxValues(layerCount, bufferType, shapeType):
    '''get max values'''

    verticeSplit = {"Polygon": MAX_VERTICES_IN_SPLIT_POLYGON,
                    "Polyline":MAX_VERTICES_IN_SPLIT_POLYLINE,
                    "Point": MAX_VERICES_IN_SPLIT,
                    "Multipoint": MAX_VERICES_IN_SPLIT}

    #calculate max_row split and MAX_vertice_split
    maxRowCount = layerCount/MAX_NO_THREADS
    if ((not bufferType) or (bufferType.lower() == "straight_line")):
        maxVerticesPerSplit = verticeSplit[shapeType]
        if maxRowCount < MIN_SPLIT_PER_THREAD:
            maxRowCount = MIN_SPLIT_PER_THREAD
        elif maxRowCount > MAX_VERICES_IN_SPLIT:
            maxRowCount = MAX_VERICES_IN_SPLIT
    else:
        maxVerticesPerSplit = MAX_VERTICES_IN_SPLIT_DRIVETIME
        if maxRowCount < MIN_SPLIT_PER_THREAD_DRIVETIME:
            maxRowCount = MIN_SPLIT_PER_THREAD_DRIVETIME
    #arcpy.AddMessage("Max Row Count :{}".format(maxRowCount))
    #arcpy.AddMessage("Max Vertices per split :{}".format(maxVerticesPerSplit))
    return maxRowCount, maxVerticesPerSplit


def geoEnrichLayer(startTime):

    invalidOrgs = ["devext.arcgis.com", "qaext.arcgis.com"]
    activeUrl = urlparse(arcpy.GetActivePortalURL())
    activeUrlHostName = activeUrl.hostname.lower()
    if not activeUrl or ("arcgis.com" not in activeUrlHostName) or (activeUrlHostName in invalidOrgs):
        arcpy.AddIDMessage("ERROR", 1738)
        raise SystemExit()
    
    # get token, referer, service url
    tokeninfo = arcpy.GetSigninToken()  #token = gentoken(tokenUrl, user, password, referer)    
    if not tokeninfo:
        arcpy.AddIDMessage("ERROR", 1738)
        exit()
    token = tokeninfo['token']
    referer = tokeninfo['referer']

    ## check GE privilege
    if not aolutils.checkPrivilege(GE_PRIVILEGE, token, referer):
        arcpy.AddError(errorMsgs[100110])
        return
        #raise Exception("GE Privilege failure")

    # check NA privilege if needed
    if (bufferType and bufferType.lower() != "straight_line"):
        naPrivilege = aolutils.checkPrivilege(NA_PRIVILEGE, token, referer)
        #arcpy.AddMessage("naPrivilege")
        if not naPrivilege:
            arcpy.AddError(errorMsgs[100111])
            return
            #raise Exception("NA Privilege Failure")
    ##geoenrich

    
    #Copy features to enriched layer
    arcpy.CopyFeatures_management(inputLayerName, enrichedLayer)
    params = prepareParams(token)

    # Create Output Data table path
    enrich = "geoenrich"
    enrichDataTable = arcpy.CreateUniqueName(enrich, wkspc)
    # send rest requests to geoenrich server thro threads
    initiateThreadCycles(service_url, params, referer, enrichDataTable)

    # Join enriched table to output layer
    if arcpy.Exists(enrichDataTable):
        OIDField = arcpy.Describe(enrichedLayer).OIDFieldName
        arcpy.JoinField_management(enrichedLayer, OIDField, enrichDataTable, ID_FIELD_NAME)
    else:
        #arcpy.AddMessage("enrich output is missing")
        raise Exception("Unable to enrich layer")
    return startTime

# run the script
if __name__ == '__main__':
    startTime = time.time()
    #Get parameters
    #Input Layer
    inputLayerName = arcpy.GetParameterAsText(0)


    # Source country
    srcCountry = arcpy.GetParameterAsText(2)
    if srcCountry.find("(") > -1:
        srcCountry = srcCountry[srcCountry.rfind("(")+1:srcCountry.rfind(")")]
    elif srcCountry.lower() == "global":
        srcCountry = ""

    # Data Collection
    dataCollections = arcpy.GetParameterAsText(3)
    if dataCollections.find("(")> -1:
        dataCollections = dataCollections[dataCollections.rfind("(")+1:dataCollections.rfind(")")]

    # Variables
    analysisVariables = arcpy.GetParameter(4)
    # Are there any variables selected?
    if len(analysisVariables) > 0:
        dataCollections = ""
        #analysisVariables = analysisVariables.split(";")
        if analysisVariables[0].find("(")> -1:
            analysisVariables = [variable[variable.rfind("(")+1:variable.rfind(")")] for variable in analysisVariables]

    # The rest
    bufferType = arcpy.GetParameterAsText(5)
    distance = [(arcpy.GetParameter(6))]
    units = arcpy.GetParameterAsText(7)

    # Output
    enrichedLayer = arcpy.GetParameterAsText(1)
    arcpy.SetParameterAsText(8, "")

    # Defaults based on shapetype
    dInputLayer = arcpy.Describe(inputLayerName)
    shapeType = dInputLayer.shapeType
    if shapeType.lower() == "polygon":
        bufferType = ""
        distance = ""
        units = ""

    #Determine curves and pointCount
    if shapeType  in ["Polyline", "Polygon", "Multipoint"]:
        isPointCount = True
        curves = []
        if shapeType == "Polyline":
            curves = ["curvePaths"]
        elif shapeType == "Polygon":
            curves = ["curvePaths", "curveRings"]
    else:
        isPointCount = False
        curves = []
    res = arcpy.GetCount_management(inputLayerName)
    inputLayerCount = int(res.getOutput(0))
    maxRowCount, maxVerticesPerSplit = getMaxValues(inputLayerCount, bufferType, shapeType)

    # process parameters
    try:
        if verifyInputs():
            startTime = geoEnrichLayer(startTime)
    except Exception as err:
        #arcpy.AddError(str(err))
        arcpy.AddIDMessage("ERROR", "999999")
        if arcpy.Exists(enrichedLayer):
            arcpy.Delete_management(enrichedLayer)
##        msgs = traceback.format_exception(*sys.exc_info())[1:]
##        for msg in msgs:
##            arcpy.AddMessage(msg.strip())
        #e = sys.exc_info()[1]
        ##arcpy.AddError(e.args[0])
        #arcpy.AddMessage(str(err))
        #raise arcpy.ExecuteError

