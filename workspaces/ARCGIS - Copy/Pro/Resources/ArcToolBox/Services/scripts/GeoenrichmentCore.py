import json
import os
import time
import re
import arcpy
import ProcessRestRequest
import aolutils
import requests
from CreateDriveTimeAreas import check_service_area_limits

#import importlib
#importlib.reload(ProcessRestRequest)


#from CreateDriveTimeAreas import check_service_area_limits
from copy import deepcopy

#Constant variables
TASK_NAME = u"EnrichLayer"
OID_FIELD_NAME = "ENRICH_FID"

#affects only straightline:
BUFFER_DIST_LIMIT ={"Miles":1000,
                    "Meters":1609344,
                    "Kilometers":1609.344,
                    "Yards":1760000,
                    "Feet":5280000}

# End of constants

# Module variable

errorMsgs = {
             100022: "Units {} are not supported for Buffer type {}.",
             100023: "Unable to enrich layer for input spatial reference {}",
             100041: "Buffer type parameter is only supported for layers containing points or lines.",
             100044: "Distance value should be greater than 0.",
             100045: "Distance and units are required when Buffer type is specified.",
             100046: "Unable to access GeoEnrichment server",
             100047: "Enrichment may not be available for some features",
             100110: "Your user role does not include the geoEnrichment privilege",
             100111: "Your user role does not include the network analysis privilege.",
             100124: "The geometry type of Input Layer must be points for buffer type {}.",
             100120: "The features in the input layer are beyond max request size limit and are not enriched",
             100126: "The input layer contains features with geometry too complex for the requested service. Results will be based on a simplified geometry.",
             100103: "The {measureType} value cannot be greater than {max} {breakUnits}",
             100143: "The {serviceName} utility is not registered with portal",
             100160: "Some of the features have invalid geometry and have been removed from the result.",
             100159: "The number of datacollections is greater than the max limit of {}",
             100242: "You do not have enough credits to perform this operation. \
                        Contact your ArcGIS System Administrator for assistance",
             100243: "Some of the features in your result are not enriched.",
             100281: "Requested analysis variables are from multiple hierarchies. This may result in inconsistent results.",
             100283: "There are too many features or complex shapes in the dataset. Consider reducing the number of features before running Enrich Layer. For example, you can filter the dataset and run the tool in batches, or reduce the size of the map extent.",
             100287: "Data is not available for countries with the following country codes: {country}.",
             100288: "Unable to detect the country for one or more features.",
             100293: "One or more features were not enriched because travel mode area creation failed. Verify that input features are located within the data coverage area of your network analysis service or use straight line distance.",
             100294: "One or more features cross demographic boundaries. Enrichment variables have been estimated using proportional aggregation."
             }


#for backward compatibility
travel_mode = {"straightline":None,
              "drivingtime":"Driving",
              "drivingdistance":"Driving",
              "truckingtime":"Trucking",
              "truckingdistance":"Trucking",
              "walkingtime":"Walking",
              "walkingdistance":"Walking"}
# End Module variable


class ConvertLayerToJSON:
    ''' converts features geometry to json geom list'''

    # constants
    GREATER_THAN_8MB = 100000
    SIMPLIFY_VERTICE_LIMIT = 0.00001

    def __init__(self, cursor, maxVerticesPerSplit, isCountVertices=True,
                 maxRowCount=50):
        self.cursor = cursor
        self.isCountVertices = isCountVertices
        self.maxVerticesPerSplit = maxVerticesPerSplit
        self.maxRowCount = maxRowCount
        self.nullGeometries = []
        self.simplifiedFeatures = []
        self.tooManyVerticesToSimplify = []
        self.leftOverFeatures = []
        self.leftOverVerticeCount = 0

    def convertFeatures(self):
        '''converts features to array list of geom JSON based on maxverticespersplit'''

        # number of vertices
        verticesCount = 0
        # features to be goeenriched
        features = []
        if self.leftOverFeatures:
            rowCount = 1
            features = self.leftOverFeatures
            self.leftOverFeatures = []
            #check if the verticecount is already greater than maxverticecount
            if self.leftOverVerticeCount >= self.maxVerticesPerSplit:
                self.leftOverVerticeCount = 0
                return features
            else:
                verticesCount = self.leftOverVerticeCount
                self.leftOverVerticeCount = 0
        else:
            rowCount = 0
            features = []

        #start new run
        addMoreFeatures = True

        while addMoreFeatures:
            try:
                row = next(self.cursor)
                #arcpy.AddMessage(row)
                rawGeometry = row[1]
                if self.isCountVertices:
                    try:
                        currVerticeCount = rawGeometry.pointCount
                        if currVerticeCount > self.GREATER_THAN_8MB:
                            try:
                                rawGeometry = self.generalizeGeom(rawGeometry)
                                currVerticeCount = rawGeometry.pointCount
                                arcpy.AddMessage("simplified Verice Count: {}".format(currVerticeCount))
                                self.simplifiedFeatures.append(row[0])
                            except Exception as e:
                                # arcpy.AddMessage(str(e))
                                self.tooManyVerticesToSimplify.append(row[0])
                                continue
                    except:
                        # Invalid Geometry warning
                        self.nullGeometries.append(row[0])
                        continue
                else:
                    currVerticeCount = 1
                try:
                    geometry = json.loads(rawGeometry._arc_object.getjson(False, False, False, False))
                except:
                    # _arc_object.getjson doesn't work for generalized geometries !!!
                    # .getjson method works for generalized polygon geom
                    # but not for points and lines
                    # need to follow up with Dave and check the py wrapper.
                    geometry = json.loads(rawGeometry.getjson(False, False, False, False))
                # decode unicode since geoenrichment doesn't support unicode characters
                # asciigeometry = dict((key.encode('ascii'), value)
                #                      for key, value in geometry.items())
                enrichJSON = {"geometry": geometry, "attributes": {OID_FIELD_NAME: row[0]}}
                verticesCount = verticesCount + currVerticeCount
                rowCount = rowCount + 1
                if verticesCount > self.maxVerticesPerSplit or rowCount > self.maxRowCount:
                    addMoreFeatures = False
                    #arcpy.AddMessage("No. of vertices: {}".format(verticesCount-currVerticeCount))
                    self.leftOverFeatures = [enrichJSON]
                    self.leftOverVerticeCount = currVerticeCount
                    return features
                else:
                    #arcpy.AddMessage("No. of vertices: {}".format(verticesCount-currVerticeCount))
                    features.append(enrichJSON)

            except StopIteration:
                arcpy.AddMessage("Reached end of cursor")
                self.leftOverFeatures = None
                self.leftOverVerticeCount = 0
                return features
            except Exception as e:
                arcpy.AddMessage(str(e))
                self.nullGeometries.append(row[0])
                continue


    def generalizeGeom(self, geom):
        '''generalize geom'''
        shapeType = geom.type.lower()
        if "polyline" in shapeType or "polygon" in shapeType:
            maxOffset = geom.getLength() * self.SIMPLIFY_VERTICE_LIMIT
            geom = geom._arc_object.generalize(maxOffset)
            if geom.pointCount > self.GREATER_THAN_8MB:
                raise Exception("Too many vertices even after simplify")
        else:
            raise Exception("Multipoint, hence cannot be simplified")
        return geom


# noinspection PyPep8Naming
class SendGeoenrichRequest:
    '''sends geoenrich requests and returns a table output'''
    # Warning messages that originally from Geoenrichment REST service but has been localized as a AO message.
    # The dictionary keyed by the ID from the Geoenrichment REST and valued by the ID of the AO message.
    LOCALIZED_WARNINGS = {10030406: 100281, 20010605: 100287, 20010604: 100288, 20010208: 100293,
                          10050046: 100294}

    def __init__(self, enrichDataTable, maxVerticesPerSplit, maxRowCount, isCountVertices=True, maxNoOfThreads=10):
        '''initialize varibales'''
        self.enrichDataTable = enrichDataTable
        self.maxVerticesPerSplit = maxVerticesPerSplit
        self.maxRowCount = maxRowCount
        self.maxThreads = maxNoOfThreads
        self.isCountVertices = isCountVertices
        self.isOutputTableCreated = False
        self.geoEnrichMessages = []
        self.geLocalizedMessages = []
        self.interm_res_table = []

    def initiateThreadCycles(self, service_url, enrichedLayer, params, referer):
        arcpy.AddMessage(service_url)
        num_of_threads = 0
        curr_thread_cycle = 0
        with arcpy.da.SearchCursor(enrichedLayer, ("OID@", "SHAPE@")) as cursor:
            convertLayerToJSON = ConvertLayerToJSON(cursor,
                                                    self.maxVerticesPerSplit,
                                                    self.isCountVertices,
                                                    self.maxRowCount)
            features = []
            while convertLayerToJSON.leftOverFeatures is not None:
                arcpy.AddMessage("Thread Cycle : {}".format(curr_thread_cycle))
                threads = []
                while num_of_threads < self.maxThreads:
                    features  = convertLayerToJSON.convertFeatures()
                    # arcpy.AddMessage(features)
                    if features:
                        #if not deepcopy, will risk overwriting the features
                        thisParams = deepcopy(params)
                        thisParams["studyareas"] = features
                        params["studyareas"] = features
                        name = self.getThreadName(features)
                        arcpy.AddMessage("Initiating thread :{}".format(name))
                        #arcpy.AddMessage(thisParams)
                        #arcpy.AddMessage(referer)
                        t = ProcessRestRequest.ProcessRestReq(name,
                                                              service_url,
                                                              thisParams, referer,
                                                              arcpy.env.scratchFolder)
                        t.start()
                        threads.append(t)
                        num_of_threads = num_of_threads + 1
                    # no leftovers, so don't have to go back to convertLayerToJSON
                    if convertLayerToJSON.leftOverFeatures is None:
                        arcpy.AddMessage("End of thread requests")
                        break
                self.processResponse(num_of_threads)
                for t in threads:
                    t.join()
                curr_thread_cycle = curr_thread_cycle + 1
                num_of_threads = 0
            
            if self.interm_res_table:
                arcpy.Append_management(self.interm_res_table, self.enrichDataTable, "NO_TEST")
                for tmp_table in self.interm_res_table:
                    arcpy.Delete_management(tmp_table)
                self.interm_res_table = []
                
        # Add warnings if needed
        if convertLayerToJSON.nullGeometries:
            aolutils.AddErrorCode(100160, errorMsgs[100160], warning=True)
        if convertLayerToJSON.simplifiedFeatures:
            aolutils.AddErrorCode(100126, errorMsgs[100126], warning=True)
        if convertLayerToJSON.tooManyVerticesToSimplify:
            aolutils.AddErrorCode(100120, errorMsgs[100120], warning=True)

    def getThreadName(self, features):
        '''find the first and last oid and name the thread'''
        try:
            def findOID(feature):
                if "attributes" in feature:
                    # arcpy.AddMessage("attributes :{}".format(feature["attributes"].values()))
                    return str(list(feature["attributes"].values())[0])

            if len(features) > 1:
                return "from OID {} to {}".format(findOID(features[0]), findOID(features[-1]))
            else:
                return "OID {}".format(findOID(features[0]))
        except Exception as e:
            arcpy.AddMessage(str(e))
            return "Some OIDS"

    def processResponse(self, runningThreadCount):
        """processes response JSON and creates table or appends records"""
        while runningThreadCount > 0:
            q = ProcessRestRequest.outResponseQueue
            if q.qsize() > 0:
                response = q.get()
                runningThreadCount = runningThreadCount - 1
                if response.get("response", "") != "HTTPError":
                    # arcpy.AddMessage(u"Received and processing: {}".format(response["name"]))
                    enrichedResult = response.get("response", "")
                    if "results" in enrichedResult:
                        if "messages" in enrichedResult:
                            self.scrubWarningMessages(enrichedResult["messages"])
                        # process warning message and result featureset
                        if enrichedResult["results"][0]["value"]["FeatureSet"]:
                            enrichedFeatures = enrichedResult["results"][0]["value"]["FeatureSet"][0]
                        else:
                            enrichedFeatures = None
                            arcpy.AddMessage("Geoenrich returned empty featureset")

                        # skip if empty featuresets were returned
                        if enrichedFeatures and len(enrichedFeatures["features"]) > 0:
                            if self.isOutputTableCreated:
                                self.appendFeatures(enrichedFeatures)
                            else:
                                self.createFeatureClass(enrichedFeatures)
                                self.isOutputTableCreated = True
                    elif "error" in enrichedResult:
                        error = enrichedResult.get("error", {})
                        if error.get("code", 0) == 401:
                            aolutils.AddErrorCode(100242, errorMsgs[100242], warning=True)
                        else:
                            arcpy.AddMessage("Req threw Exception:{}".format(error))
                        raise Exception
                    else:
                        arcpy.AddMessage("Error in input data from Geoenrich")
                        #arcpy.AddMessage(enrichedResult)
                        # if enrichedResult.has_key("messages"):
                        # for msg in enrichedResult["messages"]:
                        # arcpy.AddMessage(msg["description"])
                        raise Exception
                else:
                    # arcpy.AddMessage(u"HTTP Request Error {}".format(response.get("response", "")))
                    aolutils.AddErrorCode(100046, errorMsgs[100046])
                    raise Exception
            else:
                time.sleep(1)
        
        if len(self.interm_res_table) >= 99:
            arcpy.Append_management(self.interm_res_table, self.enrichDataTable, "NO_TEST")
            for tmp_table in self.interm_res_table:
                arcpy.Delete_management(tmp_table)
            self.interm_res_table = []

        return True

    # End def processResponse

    def createFeatureClass(self, enrichedFeatures):
        '''Creates a table based on field definitions from JSON'''
        arcpy.AddMessage(u"Create Feature Class {}".format(self.enrichDataTable))
        sEnrichedFeatures = json.dumps(enrichedFeatures)
        rs = arcpy.gp.fromEsriJson(sEnrichedFeatures)
        rs.save(self.enrichDataTable)
        # arcpy.CopyRows_management(rs, outputTable)

    # End def createFeatureClass

    def appendFeatures(self, enrichedFeatures):
        '''Adds records in the featuresetJSON to the output table'''
        # create a temp file and write JSON
        # tempTable = arcpy.CreateUniqueName("tempRS", wkspc)
        tempTable = arcpy.CreateUniqueName("tempRS", "in_memory")
        # arcpy.AddMessage(u"Append Features {}".format(tempTable))
        sEnrichedFeatures = json.dumps(enrichedFeatures)
        rs = arcpy.gp.fromEsriJson(sEnrichedFeatures)
        # save recordset as table and append
        rs.save(tempTable)
        # arcpy.Append_management(tempTable, self.enrichDataTable, "NO_TEST")
        # arcpy.Delete_management(tempTable)
        self.interm_res_table.append(tempTable)

        # End def appendFeatures

    def get_existing_localized_message(self, message_code: int):
        for message in self.geLocalizedMessages:
            if message.get("messageCode") == message_code:
                return message
        return None

    def scrubWarningMessages(self, messageArray):
        '''gather messages from geserver from every request'''
        msgTypes = ["esriJobMessageTypeError", "esriJobMessageTypeWarning", "unknown"]
        for msg in messageArray:
            if msg.get("type") in msgTypes:
                desc = msg.get("description")
                msg_id = msg.get("id")

                if msg_id in self.LOCALIZED_WARNINGS:
                    if msg_id in [20010604, 20010605, 20010208]:
                        relate_msg = self.get_existing_localized_message(100047)
                        if not relate_msg:
                            self.geLocalizedMessages.append({"messageCode": 100047})

                    if msg_id == 20010605:
                        existing_msg = self.get_existing_localized_message(self.LOCALIZED_WARNINGS[msg_id])

                        cty_name = re.findall("Data is not available for country (.+).", desc)
                        # arcpy.AddMessage(f"cty_name: {cty_name}")
                        if len(cty_name) != 1:
                            arcpy.AddMessage(f"Invalid message {desc} for {msg_id}.")
                        elif existing_msg and cty_name[0] not in existing_msg["params"]["country"]:
                            existing_msg["params"]["country"] += f", {cty_name[0]}"
                        elif not existing_msg:
                            tmp_message = {"messageCode": self.LOCALIZED_WARNINGS[msg_id],
                                           "params": {"country": cty_name[0]}}
                            self.geLocalizedMessages.append(tmp_message)
                    else:
                        existing_msg = self.get_existing_localized_message(self.LOCALIZED_WARNINGS[msg_id])
                        if not existing_msg:
                            self.geLocalizedMessages.append({"messageCode": self.LOCALIZED_WARNINGS[msg_id]})

                elif desc:
                    arcpy.AddMessage(msg_id)
                    arcpy.AddMessage(desc)
                    self.geoEnrichMessages.append(desc)
    # End def scrubWarningMessages


class GeoEnrichFeatures:
    '''geoenrich features'''

    MAX_NO_THREADS = 10
    MAX_VERTICES_IN_SPLIT = 50
    MAX_VERTICES_IN_SPLIT_DRIVETIME = 30
    MAX_VERTICES_IN_SPLIT_POLYLINE = 20000
    MAX_VERTICES_IN_SPLIT_POLYGON = 50000
    MIN_SPLIT_PER_THREAD = 30
    MIN_SPLIT_PER_THREAD_DRIVETIME = 15

    def __init__(self, service_url, token, referer, **params):

        self.startTime = None
        self.service_url = service_url
        self.token = token
        self.referer = referer
        self.inputLayer = None
        self.inputLayerShapeType = None
        self.inputLayerCount = None
        self.dataCollections = []
        self.analysisVariables = []
        self.srcCountry = ""
        self.bufferType = ""
        self.distance = ""
        self.units = ""
        self.returnBoundaries = False
        self.hostedgp = None
        self.langcode = "en"


        self.max_data_collections = 20
        #number of vertices: equal to max_row_count for points
        #different for polyline and polygon
        self.max_vertices_in_split = 50
        #max number of rows in every request
        self.max_row_count = 50
        #Do we need to count vertices?
        self.countVertices = False

        #intermediate Data
        self.enrichedLayer = ""
        self.enrichDataTable = ""

        #warningMessages
        self.warningMessages = True

        # set param values
        for k, v in params.items():
            setattr(self, k, v)

        #update current maxLimits  based on the service
        self.updateServiceBasedLimits()


    def geoEnrich(self, startTime):

        self.startTime = startTime

        if self.inputLayerShapeType:
            self.inputLayerShapeType = self.inputLayerShapeType.lstrip("esriGeometry")

        #verify parameters
        if not self.verifyInputs():
            raise Exception("Verify Inputs failed")
        self.startTime = aolutils.AddTimerMessage(self.startTime, "Verify Input")

        #Create output data
        wkspc = aolutils.getOutputWkspc(self.inputLayerCount)
        #wkspc = arcpy.env.scratchGDB
        self.enrichedLayer = os.path.join(wkspc, "enrichedLayer")
        #Copy features to enriched layer
        arcpy.CopyFeatures_management(self.inputLayer, self.enrichedLayer)
        self.startTime = aolutils.AddTimerMessage(self.startTime, "Copy Input features")

        #prepare parameters
        ge_params = self.prepareParams()
        self.startTime = aolutils.AddTimerMessage(self.startTime, "Parameter preparation")
        if self.inputLayerShapeType in ["Polyline", "Polygon"]:
            self.isCountVertices = True
        else:
            self.isCountVertices = False

        #finalize vertice split and row count based on the shapetype and count of features
        self.getMaxValues()
        # Create Output Data table path
        enrich = "geoenrich"
        self.enrichDataTable = os.path.join(wkspc, enrich)

        # send rest requests to geoenrich server thro threads
        geOutput = SendGeoenrichRequest(self.enrichDataTable,
                                        self.max_vertices_in_split,
                                        self.max_row_count,
                                        self.isCountVertices,
                                        self.MAX_NO_THREADS)
        try:
            geOutput.initiateThreadCycles(self.service_url,
                                      self.enrichedLayer,
                                      ge_params,
                                      self.referer)
        except Exception as e:
            if geOutput.isOutputTableCreated:
                aolutils.AddErrorCode(100243, errorMsgs[100243], warning=True)
            else:
                raise Exception("Exception at SendGeoenrichmentRequest:{}".format(str(e)))
        self.startTime = aolutils.AddTimerMessage(self.startTime, "Completed Rest request")

        # Join enriched table to output layer
        if geOutput.isOutputTableCreated:
            # report geoenrich warnings or errors
            if geOutput.geLocalizedMessages and self.warningMessages:
                for msg in geOutput.geLocalizedMessages:
                    msg_params = msg.get("params")
                    if msg_params:
                        msg_text = errorMsgs[msg["messageCode"]].format(**msg_params)
                    else:
                        msg_text = errorMsgs[msg["messageCode"]]
                    aolutils.AddErrorCode(msg["messageCode"], msg_text, params=msg.get("params"), warning=True)

            if geOutput.geoEnrichMessages and self.warningMessages:
                aolutils.AddErrorCode(100047, errorMsgs[100047], warning=True)
                for msg in set(geOutput.geoEnrichMessages):
                    aolutils.AddErrorCode(100000, msg, warning=True)

            if not self.returnBoundaries:
                OIDField = arcpy.Describe(self.enrichedLayer).OIDFieldName
                arcpy.JoinField_management(self.enrichedLayer, OIDField,
                                           self.enrichDataTable, OID_FIELD_NAME)
                startTime = aolutils.AddTimerMessage(startTime, "Join Field")
            else:
                #Join inputLayer attributes and enrichdatatable
                descEnrichDataTable = arcpy.Describe(self.enrichDataTable)
                spatial_reference = descEnrichDataTable.spatialReference
                has_m = "ENABLED" if descEnrichDataTable.hasM else "DISABLED"
                has_z = "ENABLED" if descEnrichDataTable.hasZ else "DISABLED"
                out_path = wkspc
                out_name = "polygonOutput"
                polygonOutput = os.path.join(out_path, out_name)
                arcpy.CreateFeatureclass_management(out_path, out_name,
                                                    "POLYGON", "#",
                                                    has_m, has_z, spatial_reference)
                #Add Enrich_fid field to identify features
                arcpy.AddField_management(polygonOutput, OID_FIELD_NAME, "LONG",
                                          "#", "#", "#","#","NON_NULLABLE","REQUIRED")
                #Add shapes and Enrich_fid from enrichDataTable
                with arcpy.da.InsertCursor(polygonOutput, ["shape@", OID_FIELD_NAME]) as updateCur:
                    with arcpy.da.SearchCursor(self.enrichDataTable, ["shape@", OID_FIELD_NAME]) as searCur:
                        for row in searCur:
                            updateCur.insertRow(row)
                #Add fields from enrichedLayer (inputLayer)
                OIDField = arcpy.Describe(self.enrichedLayer).OIDFieldName
                arcpy.JoinField_management(polygonOutput, OID_FIELD_NAME,
                                           self.enrichedLayer, OIDField)
                #Add fields from enrichDataTable
                removeFieldNames = [OID_FIELD_NAME, "Shape_Length", "Shape_Area"]
                removeFieldTypes = ["OID", "Geometry"]
                joinFields = [field.name for field in descEnrichDataTable.fields \
                              if (field.name not in removeFieldNames) and \
                              (field.type not in removeFieldTypes)]
                arcpy.JoinField_management(polygonOutput, OID_FIELD_NAME,
                                           self.enrichDataTable, OID_FIELD_NAME,
                                           joinFields)
                self.enrichedLayer = polygonOutput
        else:
            for msg in set(geOutput.geoEnrichMessages):
                aolutils.AddErrorCode(100000, msg)
            raise Exception("enrich output is missing")
        return self.enrichedLayer

    def verifyInputs(self):
        '''Verifies parameters of the tool'''
        arcpy.AddMessage(self.inputLayerShapeType)
        isValid = []
        if self.bufferType:
            # if polygon, distance must not be specified
            if self.inputLayerShapeType  == "Polygon":
                aolutils.AddErrorCode(100041, errorMsgs[100041])
                isValid.append(False)
            # if it's not point, only straightline buffer is supported
            if "Point" not in self.inputLayerShapeType and \
                    (self.bufferType.lower() != "straightline"):
                msg = errorMsgs[100124].format(self.bufferType)
                aolutils.AddErrorCode(100124, msg,
                                      {"bufferType": self.bufferType})
                isValid.append(False)
            # check appropriate units
            timeBufferTypes = ["drivingtime", "truckingtime", "walkingtime"]
            distanceBufferTypes = ["straightline", "drivingdistance",
                                   "walkingdistance", "truckingdistance"]
            timeUnits = ["Minutes", "Seconds", "Hours"]
            if (self.bufferType.lower() in timeBufferTypes and self.units not in timeUnits) or \
                    (self.bufferType.lower() in distanceBufferTypes and self.units in timeUnits):
                msg = errorMsgs[100022].format(self.units, self.bufferType)
                aolutils.AddErrorCode(100022, msg,
                                      {"units": self.units,
                                       "bufferType": self.bufferType})
                isValid.append(False)
            # check distance value
            if all(isValid) and self.distance:
                if self.distance[0] <= 0:
                    aolutils.AddErrorCode(100044, errorMsgs[100044])
                    isValid.append(False)
                else:
                    # Check for max limit
                    if self.bufferType.lower() == "straightline":
                        #arcpy.AddMessage(BUFFER_DIST_LIMIT[self.units])
                        if self.distance[0] > BUFFER_DIST_LIMIT[self.units]:
                            msg_code = 100103
                            msg_params = {
                                "max": BUFFER_DIST_LIMIT[self.units],
                                "breakUnits": self.units,
                                "measureType": self.bufferType}
                            msg = errorMsgs[msg_code].format(**msg_params)
                            aolutils.AddErrorCode(msg_code, msg, msg_params)
                            #arcpy.AddMessage("Added error code")
                            isValid.append(False)
                    else:
                        if self.bufferType.lower() in travel_mode:
                            travelMode = travel_mode[self.bufferType.lower()]
                        else:
                            travelMode = self.bufferType
                        if self.hostedgp:
                            msg = check_service_area_limits(0, "",
                                                            self.distance,
                                                            self.units,
                                                            travelMode,
                                                            False,
                                                            self.hostedgp)
                            if msg:
                                aolutils.AddErrorCode(*msg)
                                isValid.append(False)
            if all(isValid) and (not self.units or not self.distance):
                aolutils.AddErrorCode(100045, errorMsgs[100045])
                isValid.append(False)
        # verify dataCollections count
        len_dataColl = len(self.dataCollections)
        len_dc_analysisVar = len(set([avar.split(".")[0] for avar in self.analysisVariables]))
        if (len_dataColl + len_dc_analysisVar) > self.max_data_collections:
            msg = errorMsgs[100159].format(self.max_data_collections)
            aolutils.AddErrorCode(100159, msg,
                                  {"maxDataCollections": self.max_data_collections})
            isValid.append(False)
        return all(isValid)

    def prepareParams(self):
        '''prepare params for geoenrichment service'''
        params = {}
        params["token"] = self.token
        params["f"] = "json"

        # DataCollections
        dcKeyGlobalFacts = False
        if len(self.dataCollections) > 0:
            params["dataCollections"] = self.dataCollections
            dcKeyGlobalFacts = any("keyglobalfacts" in dataColl.lower()
                                   for dataColl in self.dataCollections)

        avKeyGlobalFacts = False
        if len(self.analysisVariables) > 0:
            params["analysisVariables"] = self.analysisVariables
            avKeyGlobalFacts = any("keyglobalfacts" in var.lower()
                                   for var in self.analysisVariables)

        # set sourcecountry if country is provided and keyGlobalfacts is not specified.
        if (self.srcCountry) and (not (dcKeyGlobalFacts or avKeyGlobalFacts)):
            params["useData"] = {"sourceCountry": self.srcCountry}

        # specify studyAreaOptions
        params["studyAreasOptions"] = {"aggregateMultipleCountries": True}
        if self.bufferType and self.units and self.distance:
            if self.bufferType.lower() == "straightline":
                areaType = "RingBuffer"
                bufferUnits = "esri{}".format(self.units)
            else:
                bufferUnits = self.units
                areaType = "NetworkServiceArea"
                if travel_mode.get(self.bufferType.lower()):
                    travelMode = travel_mode[self.bufferType.lower()]
                else:
                    try:
                        travelMode = json.dumps(json.loads(self.bufferType))
                    except:
                        raise Exception("Failed to parse travel mode")
                params["studyAreasOptions"]["travelMode"] = travelMode
            params["studyAreasOptions"].update({
                "areaType": areaType,
                "bufferUnits": bufferUnits,
                "bufferRadii": self.distance,
            })
        #arcpy.AddMessage(json.dumps(params["studyAreasOptions"]))
        # calculate spatial reference for insr parameter
        try:
            sr = arcpy.Describe(self.enrichedLayer).spatialReference
            if sr:
                if sr.factoryCode > 0 :
                    params["inSR"] = sr.factoryCode
                else:
                    params["inSR"] = {"wkt": sr.exportToString()}

        except ValueError:
            msg = errorMsgs[100023].format(sr.name)
            aolutils.AddErrorCode(100023, msg, {"spref": sr.name})
            raise Exception("Invalid SR")
        # set returnGeometry
        if self.returnBoundaries:
            params["returngeometry"] = True
            params["outSR"] = params["inSR"]
        
        # set langcode
        params["langcode"] = self.langcode

        # arcpy.AddMessage(json.dumps(params))
        return params

    def updateServiceBasedLimits(self):
        '''
        The default values for maximum data collections = 20 and maxRowCount =50
        But, good to check the service for it
        '''
        try:
            limit_url = "{}servicelimits".format(self.service_url.rstrip("enrich"))
            # arcpy.AddMessage(limit_url)
            limit_req_url = "{}?token={}&f=json".format(limit_url, self.token)
            headers = {}
            headers["referer"] = self.referer
            headers["Accept-Encoding"] = "gzip"
            resp = requests.get(limit_req_url, headers=headers, verify=False)
            respJson = resp.json()
            serviceLimits = respJson.get("serviceLimits", {})
            limitValues = serviceLimits.get("value", "")
            for val in limitValues:
                paramName = val.get("paramName", "")
                if paramName == "optimalBatchStudyAreasNumber":
                    self.max_row_count = val.get("value", self.max_row_count)
                elif paramName == "maximumDataCollections":
                    self.max_data_collections = val.get("value", self.max_data_collections)
        except Exception as e:
            arcpy.AddMessage("Unable to update service Limits:{}".format(str(e)))
        return

    def getMaxValues(self):
        '''get max values'''

        verticeSplit = {"Polygon": self.MAX_VERTICES_IN_SPLIT_POLYGON,
                        "Polyline": self.MAX_VERTICES_IN_SPLIT_POLYLINE,
                        "Point": self.max_row_count,
                        "Multipoint": self.max_row_count}

        # calculate max_row split and MAX_vertice_split
        maxRowCount = self.inputLayerCount / self.MAX_NO_THREADS
        if ((not self.bufferType) or (self.bufferType.lower() == "straightline")):
            self.max_vertices_in_split = verticeSplit[self.inputLayerShapeType]
            if maxRowCount < self.MIN_SPLIT_PER_THREAD:
                self.max_row_count = self.MIN_SPLIT_PER_THREAD
            elif maxRowCount < self.max_row_count:
                arcpy.AddMessage("2")
                self.max_row_count = maxRowCount
        else:
            self.max_vertices_in_split = self.MAX_VERTICES_IN_SPLIT_DRIVETIME
            if maxRowCount < self.MIN_SPLIT_PER_THREAD_DRIVETIME:
                self.max_row_count = self.MIN_SPLIT_PER_THREAD_DRIVETIME
            elif maxRowCount < self.max_row_count:
                self.max_row_count = maxRowCount
        arcpy.AddMessage("Max Row Count :{}".format(self.max_row_count))
        arcpy.AddMessage("Max Vertices per split :{}".format(self.max_vertices_in_split))
