"""---------------------------------------------------------------------------
Name:              SummarizeNearby.py
Purpose:           Summarize nearby features attributes for AGOL 
Author:            Esri Inc.
Created:           5/6/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.1
---------------------------------------------------------------------------"""

import os
import arcpy
import hostedgp as agolgp
import aolutils
import time
import CreateDriveTimeAreas
import summarytoolutils as sumutils
import SummarizeWithinCore as sumwithincore
import bufferUtils

# import importlib
# importlib.reload(sumutils)
# importlib.reload(bufferUtils)
# importlib.reload(sumwithincore)


# declare constants/ module variables

REQD_TOOLBOXES = u"Workflows.tbx"

TASK_NAME = "SummarizeNearby"

ERROR_CODES = [100004, 100005, 100006, 100024, 100018, 100019, 100042, 100030,
               100043, 100048, 100063, 100111, 100052, 100125, 100145]

NA_PRIVILEGE = "premium:user:networkanalysis"

errorMsgs = {100111: "Your user role does not include the network analysis privilege.",
             100042: "The geometry type {} of Nearby Layer is not supported for Near type {}.",
             100043: "Units {} are not supported for Near type {}.",
             100018: "Sum Units {} is not applicable for {} shape type",
             100019: "At least one of the parameters Summarize Shape or Summary Fields is required.",
             100004: "The field {} provided for Summary Fields does not exist.",
             100005: "The field {} provided for Summary Fields is not numeric.",
             100006: "The Summary type {} provided for field {} is invalid.",
             100052: "The field name {} does not exist in the {}",
             100048: "The input layer {} contains multipoint geometry and has been converted to single point geometry",
             100125: "The groupby field {} must be an integer, text or date."}

travelMode = {"drivingtime": "Driving",
              "drivingdistance": "Driving",
              "truckingtime": "Trucking",
              "truckingdistance": "Trucking",
              "walkingtime": "Walking",
              "walkingdistance": "Walking"}

# End constants and module variables


def verifyParameters():
    """verifies parameters for summarizeNearby tool"""
    # global values are read-only no overwriting in this method
    global nearbyLayershapeType
    global nearType
    global units
    global sumShape
    global sumUnits
    global updatedSummFields
    global summarizeLayer
    global summarizeLayerShapeType
    global groupFieldName
    global summarizeLayerName

    isValid = []

    # nearType staraightline can only support shapetypes polyline, polygon
    if (nearType.lower() != "straightline" and "Point" not in nearbyLayershapeType):
        msg = errorMsgs[100042].format(nearbyLayershapeType, nearType)
        paramsDict = {"shapeType": nearbyLayershapeType, "nearType": nearType}
        aolutils.AddErrorCode(100042, msg, paramsDict)
        isValid.append(False)
    timeNearTypes = ["drivingtime", "truckingtime", "walkingtime"]
    distanceNearTypes = ["straightline", "drivingdistance", "walkingdistance", "truckingdistance"]
    timeUnits = ["Minutes", "Seconds", "Hours"]    
    if (nearType.lower() in timeNearTypes and units not in timeUnits) or \
       (nearType.lower() in distanceNearTypes and units in timeUnits):
        msg = errorMsgs[100043].format(units, nearType)
        aolutils.AddErrorCode(100043, msg, {"units": units, "nearType": nearType})	
        isValid.append(False)

    # verify other params
    resp = sumutils.verifySummaryToolParams(sumShape, sumUnits, updatedSummFields, 
                                            summarizeLayer, summarizeLayerShapeType, summarizeLayerName,
                                            groupFieldName, errorMsgs)
    isValid.extend(resp)
    # arcpy.AddMessage("verify parameters")
    return all(isValid)

# End def verifyParameters


def updateFieldInfo(featureClass, fieldInfo):

    outputFields = arcpy.ListFields(featureClass)
    if "shapeField" in fieldInfo:
        shapeField, alias, fType = fieldInfo["shapeField"]
        shapeField = aolutils.getAccurateFieldName(outputFields, shapeField)
        fieldInfo["shapeField"] = (shapeField, alias, fType)
    if "summaryFields" in fieldInfo:
        statsFields = fieldInfo["summaryFields"]
        newStatsField = []
        for fName, alias, fType in statsFields:
            fName = aolutils.getAccurateFieldName(outputFields, fName)
            newStatsField.append((fName, alias, fType))
        fieldInfo["summaryFields"] = newStatsField
    if "minMajorityFields" in fieldInfo:
        minMajFields = fieldInfo["minMajorityFields"]
        newMinMajFields = []
        for fName, alias, fType in minMajFields:
            fName = aolutils.getAccurateFieldName(outputFields, fName)
            newMinMajFields.append((fName, alias, fType))
        fieldInfo["minMajorityFields"] = newMinMajFields
    if "layerJoinIDField" in fieldInfo:
        shapeField, alias, fType = fieldInfo["layerJoinIDField"]
        shapeField = aolutils.getAccurateFieldName(outputFields, shapeField)
    pass


def getJoinFields(fieldInfo):
    '''returns joinfields reqd for joining to input layer'''

    joinFields = []    
    if "distanceFields" in fieldInfo:
        joinFields.extend([info[0] for info in fieldInfo["distanceFields"]])
    if "shapeField" in fieldInfo:
        joinFields.append(fieldInfo["shapeField"][0])
    if "summaryFields" in fieldInfo:
        sFields = [sField[0] for sField in fieldInfo["summaryFields"]]
        joinFields.extend(sFields)
    if "minMajorityFields" in fieldInfo:
        sFields = [sField[0] for sField in fieldInfo["minMajorityFields"]]
        joinFields.extend(sFields)
    if "layerJoinIDField" in fieldInfo:
        joinFields.append(fieldInfo["layerJoinIDField"][0])
    return joinFields


def summarizeNearby(startTime):

    global hostedgp
    global nearType
    global nearbyLayer
    global distances
    global units
    global timeOfDay
    global timeZoneForTimeOfDay
    global summarizeLayer
    global summarizeLayerShapeType
    global nearbyLayershapeType
    global summarizedOutput
    global sumShape
    global sumUnits
    global updatedSummFields
    global groupFieldName
    global minorityMajority
    global shapePercent
    global groupByTable
    global returnBoundaries
    global wkspc

    # fix for bug https://devtopia.esri.com/WebGIS/arcgis-portal-app/issues/15022
    if not returnBoundaries:
        tempFeatureClass = os.path.join(wkspc, "tempFeatures")
        # copy input features
        arcpy.CopyFeatures_management(nearbyLayer, tempFeatureClass)
        nearbyLayer = tempFeatureClass

    # Create nearby polygons 
    if nearType.lower() == "straightline":
        withinLayer = arcpy.CreateUniqueName("outPolyLayer", wkspc)
        joinField = "ORIG_FID"
        if returnBoundaries:
            calcFields = True
        else:
            calcFields = False
        bufferUtils.createBuffers(nearbyLayer, distances, 
                                  "", units, None,
                                  "rings", None, None, 
                                  withinLayer, calcFields)
        startTime = aolutils.AddTimerMessage(startTime, "Generated Buffer polygons")
    else:
        joinField = "FacilityOID"
        if nearType.lower() in travelMode:
            travel_Mode = travelMode[nearType.lower()]
        else:
            travel_Mode = nearType
        (withinLayer, _time) = CreateDriveTimeAreas.create_drive_time_areas(hostedgp,
                                                                            nearbyLayer,
                                                                            distances,
                                                                            units,
                                                                            timeOfDay,
                                                                            time_zone_for_time_of_day=timeZoneForTimeOfDay,
                                                                            travel_mode=travel_Mode)
        startTime = aolutils.AddTimerMessage(startTime, "Generated DriveTime/Distance Polygons")

    #run summarize within

    startime, fieldInfo = sumwithincore.summarizeWithin(startTime, withinLayer, summarizeLayer, 
                                                        summarizeLayerShapeType, summarizedOutput, True,
                                                        sumShape, sumUnits, updatedSummFields, groupFieldName,
                                                        minorityMajority, shapePercent, groupByTable, wkspc) 

    startTime = aolutils.AddTimerMessage(startTime, "Summarize Within Core")

    if returnBoundaries:
        # remove joinfield facilityOID, since it's confusing 
        arcpy.DeleteField_management(summarizedOutput, [joinField])  
        # AnalysisArea calculation is done in drivetime tool already hence do it only for buffer
        if nearType.lower() == "straightline":
            aolutils.createShapeAreaField(summarizedOutput, sumUnits)
        startTime = aolutils.AddTimerMessage(startTime, "Create AnalysisArea field")

    else:
        # update FieldInfo
        if nearType.lower() == "straightline":
            fieldInfo["distanceFields"] = [("BUFF_DIST", "Buffer Distance", "Double")]    
            if len(distances) == 1:
                # update calcDistance just for single buffer distances:      
                bufferUtils.calcDistanceField(summarizedOutput, distances[0], units)
        else:
            fieldInfo["distanceFields"] = [("FromBreak", "Drive Time Start", "Double"),
                                          ("ToBreak", "Drive Time End", "Double")]

        joinFields = getJoinFields(fieldInfo)
        # remove distanceFields if any from original Features
        # because joinField tool will create _1 fields otherwise
        distanceFields = [info[0] for info in fieldInfo["distanceFields"]]
        if distanceFields:
            try:
                arcpy.DeleteField_management(nearbyLayer, distanceFields)
            except:
                # don't care if it didn't work
                pass
        tempFCOIDField = arcpy.Describe(nearbyLayer).OIDFieldName
        arcpy.JoinField_management(nearbyLayer, tempFCOIDField, summarizedOutput, joinField, joinFields)
        summarizedOutput = nearbyLayer
        fieldInfo["withinLayerShapeType"] = nearbyLayershapeType
        # need to update fieldnames after join
        updateFieldInfo(nearbyLayer, fieldInfo)
        startTime = aolutils.AddTimerMessage(startTime, "Join fields with original features")

    return startTime, fieldInfo


def reportLogAndMeteringInfo(begin_time):
    """compute Log and usage metering."""

    numObjects = WithinLayerCount + summarizeLayerCount
    cost = numObjects * 0.002
    listOfNearType = ["drivingdistance", "drivingtime", "straightline", "truckingdistance",
                      "truckingtime", "walkingdistance", "walkingtime"]

    if nearType.lower() in listOfNearType:
        nearTypeCount = listOfNearType.index(nearType.lower())
    else:
        nearTypeCount = 7

    if sumShape:
        sumShapeCount = 1
    else:
        sumShapeCount = 2

    if len(groupFieldName) > 0:
        groupFieldCount = 2
    else:
        groupFieldCount = 1

    if updatedSummFields:    
        summaryFieldsCount = len(updatedSummFields)    
    else:
        summaryFieldsCount = 0

    if shapePercent:
        shapePercentCount = 1
    else:
        shapePercentCount = 0

    if outputName.createService:
        returnType = 2
    else:
        returnType = 1
    values = [WithinLayerCount, summarizeLayerCount, nearTypeCount,
              sumShapeCount, summaryFieldsCount, groupFieldCount,
              shapePercentCount, returnType]
    aolutils.LogUsageMetering(TASK_NAME, numObjects, cost, begin_time, values)
    return

# End def reportLogAndMeteringInfo   


if __name__ == '__main__':

    # Initialize context
    hostedgp = None
    # timer messages
    startTime = time.time()
    beginTime = startTime  
    
    try:
        # initialize
        hostedgp = agolgp.HostedGP(15, 14)
        outputName = hostedgp.GetOutputName(14)
        # check for publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        # Get nearby type (StraightLine, DrivingDistance, DrivingTime)
        nearType = arcpy.GetParameterAsText(2)
        if "straightline" not in nearType.lower():
            if aolutils.checkPrivilege(NA_PRIVILEGE, hostedgp):
                arcpy.AddMessage("Network analysis privilege check: OK")
            else:
                aolutils.AddErrorCode(100111, errorMsgs[100111])
        
        naservice_input = True if (nearType and nearType.lower() != "straightline") else False

        # timer messages
        startTime = time.time()
        beginTime = startTime

        # Input point features to count (summarize).
        nearbyLyr, WithinLayerCount = aolutils.getHostedLayerX(hostedgp, "nearby layer", 0,
                                                               use_as_soap_input=naservice_input)
        nearbyLayer = nearbyLyr.name
        withinLayerName = nearbyLyr.layername
        nearbyLayershapeType = nearbyLyr.shapeType.lstrip("esriGeometry") 
        if len(withinLayerName) == 0:
            withinLayerName = "NearbyLayer"
        startTime = aolutils.AddTimerMessage(startTime, "Get Nearby Layer")

        # Input polygon boundaries.
        summarizeLyr, summarizeLayerCount = aolutils.getHostedLayerX(hostedgp, "summary layer", 1)
        summarizeLayer = summarizeLyr.name
        summarizeLayerName = summarizeLyr.layername
        summarizeLayerShapeType = summarizeLyr.shapeType.lstrip("esriGeometry")
        summarizeLyrChangedFieldNames = summarizeLyr.changedFieldNames

        if len(summarizeLayerName) == 0:
            summarizeLayerName = "nearby features"
        startTime = aolutils.AddTimerMessage(startTime, "Get Summarize Layer")

        # set env extent to None: workaround
        arcpy.env.extent = None

        # distances
        distances = arcpy.GetParameter(3)

        # distance units
        units = arcpy.GetParameterAsText(4)

        # time of day
        timeOfDay = arcpy.GetParameter(5)

        timeZoneForTimeOfDay = arcpy.GetParameterAsText(6)
        # return drive and distance polygons
        returnBoundaries = arcpy.GetParameter(7)

        # Total Area of polygons, length of lines or count of points
        sumShape = arcpy.GetParameter(8)

        # units for sumShape
        sumUnits = arcpy.GetParameterAsText(9)
        # Additional field statistics .
        summaryFields = arcpy.GetParameter(10)
        if summarizeLyrChangedFieldNames:
            summaryFields = aolutils.updateChangedFieldNames(arcpy.GetParameterAsText(10),
                                                             summarizeLyrChangedFieldNames,
                                                             True, True)
            summaryFields = summaryFields.split(";")
        # create a simpler data structure for processing later     
        updatedSummFields = aolutils.convertSummaryFieldstoArray(summaryFields)

        # Group attributes when calculating statistics.
        groupFieldName = arcpy.GetParameterAsText(11)
        groupFieldName = aolutils.updateChangedFieldNames(groupFieldName,
                                                          summarizeLyrChangedFieldNames)

        if groupFieldName:
            # minority, majority for groupByField
            minorityMajority = arcpy.GetParameter(12)
            shapePercent = arcpy.GetParameter(13)
        else:
            minorityMajority = False
            shapePercent = False

        if minorityMajority or shapePercent:
            sumShape = True

        # get default sumUnits from profile when needed
        if sumShape and not sumUnits and \
           "Point" not in summarizeLayerShapeType:       
            if "Polyline" in summarizeLayerShapeType:
                sumUnits = aolutils.getUnits(hostedgp, shapeUnitsPolygon=False)
            else:
                sumUnits = aolutils.getUnits(hostedgp)
            # arcpy.AddMessage("sumunits set to user profile: {}".format(sumUnits))

        # output parameters
        wkspc = aolutils.getOutputWkspc(WithinLayerCount * len(distances))	
        summarizedOutput = os.path.join(wkspc, "summarizedNearbyLayer")         
        # arcpy.AddMessage(u"summarizedOutput {}".format(summarizedOutput))                                                    

        if len(groupFieldName) > 0:
            groupByTable = os.path.join(wkspc, "summaryNearbyTable")     
            # arcpy.AddMessage(u"groupByTable {}".format(groupByTable))                                                           
        else:
            groupByTable = ""

        paramsDict = {"sumNearbyLayer": {"count": WithinLayerCount, "shapeType": nearbyLyr.shapeType},
                      "summaryLayer": {"count": summarizeLayerCount, "shapeType": summarizeLyr.shapeType},
                      "nearType": nearType,
                      "distances": distances,
                      "units": units,
                      "sumShape": sumShape,
                      "shapeUnits": sumUnits,
                      "summaryFields": summaryFields,
                      "groupByField": groupFieldName,
                      "percentShape": shapePercent}
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        # We'll set the output parameters later when the tool is successful.
        arcpy.SetParameterAsText(16, "")
        arcpy.SetParameterAsText(17, "")
        startTime = aolutils.AddTimerMessage(startTime, "Get Parameters")

        if not verifyParameters():
            raise Exception
        else:
            # convert multipoint to single features
            if nearbyLayershapeType == "Multipoint":
                wkspcPoints = aolutils.getOutputWkspc(WithinLayerCount)
                nearbyLayer, msg = aolutils.convertMutiPointToSingleFeatures(pointLayer,
                                                                             withinLayerName, errorMsgs[100048],
                                                                             wkspcPoints)
                # append True for warning
                # msg.append(True)
                aolutils.AddErrorCode(*msg)
            startTime, fieldInfo = summarizeNearby(startTime)
            sumutils.processResults(startTime, fieldInfo, 16, 17,
                                    hostedgp, outputName, summarizedOutput,
                                    summarizeLayerName, summarizeLayerShapeType,
                                    sumShape, groupFieldName, groupByTable, False,
                                    returnBoundaries=returnBoundaries)

            # report tool and metering information
            reportLogAndMeteringInfo(beginTime)    

            # report cost
            time_of_day_value = time.mktime(timeOfDay.timetuple()) * 1000 if timeOfDay else 0
            paramsDict["timeOfDay"] = time_of_day_value,
            aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        # arcpy.AddMessage(str(err))
        aolutils.AddExecuteErrors(TASK_NAME, ERROR_CODES)

    except Exception as err:
        # import traceback
        # import sys
        # msgs = traceback.format_exception(*sys.exc_info())[1:]
        # for msg in msgs:
        #     arcpy.AddMessage(msg.strip())
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()
            startTime = aolutils.AddTimerMessage(startTime, "Cleanup")

# End Module SummarizeNearby.py 
