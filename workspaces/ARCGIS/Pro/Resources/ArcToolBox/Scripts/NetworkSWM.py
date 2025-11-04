# coding: utf-8
"""
Tool Name:     Generate Spatial Weights From Network
Source Name:   Network2SWM.py
Version:       ArcGIS 10.0
Author:        Environmental Systems Research Institute Inc.
Description:   Creates spatial weights in SWM format from a combination
               of network data and feature classes. 
"""


################### Imports ########################

import os as OS
import locale as LOCALE
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.nax as NAX
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO 
import WeightsUtilities as WU 
import numpy as NUM
import collections as COLL

#### Constants ####
naTypeMap = {'POINT': NAX.OriginDestinationCostMatrixInputDataType.PointBarriers, 
             'MULTIPOINT': NAX.OriginDestinationCostMatrixInputDataType.PointBarriers,
             'POLYLINE': NAX.OriginDestinationCostMatrixInputDataType.LineBarriers, 
             'LINE': NAX.OriginDestinationCostMatrixInputDataType.LineBarriers, 
             'POLYGON': NAX.OriginDestinationCostMatrixInputDataType.PointBarriers}

naDistUnitMap = {"FEET": 3, "FOOT": 3, "US_FEET": 3, "US_FOOT": 3, "FOOT_US": 3, 
                 "METERS": 9, "METER": 9, "KILOMETER": 10, "KILOMETERS": 10, 
                 "MILE": 5, "MILES": 5, "US_MILES": 5, "US_MILE": 5, "MILE_US": 5,
                 "INTERNATIONAL FEET": 3, "STATUTE MILES": 5, "INTERNATIONAL MILES": 5}

def execute(parameters, messages):
    """Retrieves the parameters from the User Interface and executes the
    appropriate commands."""

    #### Process Dialogue Inputs ####
    inputFC = UTILS.getTextParameter(0, parameters)
    masterField = UTILS.getTextParameter(1, parameters, fieldName = True)
    swmFile = UTILS.getTextParameter(2, parameters)
    inputNetwork = UTILS.getTextParameter(3, parameters)
    travelMode = UTILS.getTextParameter(4, parameters)

    #### Distance-Based ####
    cutoff = UTILS.getTextParameter(5, parameters)

    #### Time-Based ####
    if cutoff is None:
        cutoff = UTILS.getTextParameter(6, parameters)

    #### Cost-Based ####
    if cutoff is None:
        cutoff = UTILS.getNumericParameter(7, parameters)

    numberOfNeighs = UTILS.getNumericParameter(8, parameters)

    #### Time of Day as DT or None ####
    timeOfDay = UTILS.getTextParameter(9, parameters)
    if timeOfDay is not None:
        timeOfDay = parameters[9].value 

    timeZone = UTILS.getTextParameter(10, parameters)
    inputBarrier = UTILS.getTextParameter(11, parameters)
    searchTolerance = UTILS.getTextParameter(12, parameters)

    #### Set Default Search Tolerance if Empty ####
    if searchTolerance is None:
        searchTolerance = '5000 Meters'

    #### Assign to appropriate spatial weights method ####
    fixed = True
    spaceConcept = UTILS.getTextParameter(13, parameters)
    if spaceConcept.upper() == "INVERSE":
        fixed = False

    exponent = UTILS.getNumericParameter(14, parameters)
    rowStandard = parameters[15].value

    networkSWM(inputFC, masterField, swmFile, inputNetwork, travelMode,
               cutoff = cutoff, numberOfNeighs = numberOfNeighs,
               timeOfDay = timeOfDay, timeZone = timeZone,
               inputBarrier = inputBarrier, searchTolerance = searchTolerance, 
               fixed = fixed, exponent = exponent, rowStandard = rowStandard)

def networkSWM(inputFC, masterField, swmFile, netSource, travelMode, 
               cutoff = None, numberOfNeighs = None, 
               timeOfDay = None, timeZone = None,
               inputBarrier = None, searchTolerance = None, 
               fixed = True, exponent = 1.0, rowStandard = True):

    """Creates spatial weights in SWM format from a combination
    of network data and feature classes.

    INPUTS: 
    inputFC (str): path to the input feature class
    masterField (str): field in table that serves as the mapping
    swmFile (str): path to the SWM file
    netSource (str): network dataset source
    travelMode (str): analysis travel mode
    cutoff {str or float, "#"}: impedance threshold (linear/temporal unit of float)
    numberOfNeighs {int, "#"}: number of neighbors to return
    inputBarrier {str, "#"}: path to the input barrier feature class
    searchTolerance {linear measure, "#"}: snap tolerance for network (4)
    fixed {bool, True}: Invert impedance as weight or return a weight = 1? 
    exponent {float, 1.0}: distance decay
    rowStandard {bool, True}: row standardize weights?
    """

    #### Check and Store Service Info ####
    isService = False
    try:
        serviceInfo = NAX.GetWebToolInfo('asyncODCostMatrix', 
                                         'GenerateOriginDestinationCostMatrix', 
                                         netSource)
        isService = True
    except ValueError:
        pass
    
    #### Check out Network Analyst ####
    if not isService:
        try:
            ARCPY.CheckOutExtension("Network")
        except:
            ARCPY.AddIDMessage("ERROR", 849)
            raise SystemExit()

    #### Get Master Field Map From inputFC ####
    ssdo = SSDO.SSDataObject(inputFC,
                             useChordal = False)
    ssdo.obtainData(ssdo.oidName, [masterField], minNumObs = 2)
    masterIDs = ssdo.fields[masterField].data
    uniqueIDs = NUM.unique(masterIDs) 
    numObs = ssdo.numObs

    #### Unique ID Check ####
    if len(uniqueIDs) != numObs:
        ARCPY.AddIDMessage("ERROR", 644, masterField)
        ARCPY.AddIDMessage("ERROR", 643)
        raise SystemExit()

    numPossNeighs = numObs - 1
    hasID64 = masterIDs.dtype == NUM.int64

    #### Assess Service Limits ####
    if isService:
        maxDest = serviceInfo['serviceLimits']['maximumOrigins']
        if numObs > maxDest:
            ARCPY.AddIDMessage("ERROR", 30096, 'Origins', "{0}".format(int(maxDest)))
            raise SystemExit()

    #### New Travel Mode Overwrite Params ####
    travelModes = NAX.GetTravelModes(netSource)
    travelModeInfo = travelModes[travelMode]

    #### Get Spatial Ref From Net Data Set ####
    netDesc = None
    if not isService:
        netDesc = ARCPY.Describe(netSource)
        netSpatialRef = netDesc.SpatialReference
        netSpatName = netSpatialRef.Name
    else:
        netSpatName = ssdo.spatialRefName

    #### Set Maximum Neighbor Argument ####
    if numberOfNeighs is None:
        numberOfNeighs = min( [numPossNeighs, 30] )
        ARCPY.AddIDMessage("WARNING", 1012, numberOfNeighs)

    if numberOfNeighs >= numObs:
        numberOfNeighs = numPossNeighs
        ARCPY.AddIDMessage("WARNING", 1013, numberOfNeighs)

    if numberOfNeighs == 0:
        numberOfNeighs = numPossNeighs

    #### All Features are Related.  Force Inverse Impedance ####
    if (numObs - numberOfNeighs) <= 1:
        if fixed:
            ARCPY.AddIDMessage("WARNING", 974)
            fixed = 0

    #### Add Self Neighbor For OD Solve ####
    numberOfNeighsOD = numberOfNeighs + 1

    ##### Make OD Cost Matrix Layer ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84132))
    odcm = NAX.OriginDestinationCostMatrix(netSource)
    odcm.travelMode = travelMode

    tol, units = UTILS.linearUnitSplit(searchTolerance)
    try:
        #### Skip for Older Portals Which Ignore Anyways ####
        odcm.searchTolerance = UTILS.strToFloat(tol)
        units = UTILS.getDisplayUnit(units)
        odcm.searchToleranceUnits = NAX.DistanceUnits(naDistUnitMap[units.upper()])
    except:
        #### Search Tolerance Doesn't Work for Enterprise < 11 ####
        ARCPY.AddIDMessage("WARNING", 110487)
        pass

    odcm.defaultDestinationCount = numberOfNeighsOD
    odcm.lineShapeType = NAX.LineShapeType.NoLine

    #### Get/Set Total Impedance Units/Field ####
    impedance = travelModeInfo.impedance

    if impedance == travelModeInfo.distanceAttributeName:
        impedanceField = "Total_Distance"
        if cutoff is not None:
            cutoffValue, cutoffUnits = UTILS.linearUnitSplit(cutoff)
            cutoffUnits = UTILS.getDisplayUnit(cutoffUnits)
            odcm.distanceUnits = NAX.DistanceUnits(naDistUnitMap[cutoffUnits.upper()])
            odcm.defaultImpedanceCutoff = UTILS.strToFloat(cutoffValue)
    elif impedance == travelModeInfo.timeAttributeName:
        impedanceField = "Total_Time"
        if cutoff is not None:
            cutoffValue, cutoffUnits = cutoff.split(" ")
            odcm.timeUnits = NAX.TimeUnits[cutoffUnits.capitalize()]
            odcm.defaultImpedanceCutoff = UTILS.strToFloat(cutoffValue)
    else:
        impedanceField = "Total_Cost"
        if cutoff is not None:
            odcm.defaultImpedanceCutoff = cutoff

    #### Time of Day ####
    if timeOfDay is not None:
        odcm.timeOfDay = timeOfDay 

    #### Time Zone ####
    if timeZone == "UTC":
        odcm.timeZone = 1

    #### Add Field Mappings for Master Field ####
    fmd = odcm.fieldMappings(NAX.OriginDestinationCostMatrixInputDataType.Destinations,
                             True)
    fmd["Name"].mappedFieldName = masterField
    fmo = odcm.fieldMappings(NAX.OriginDestinationCostMatrixInputDataType.Origins,
                             True)
    fmo["Name"].mappedFieldName = masterField

    #### Add Destination Locations and Assure Enough on Network ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84133)) 
    destLayer = "OD_Destinations"
    DM.MakeFeatureLayer(inputFC, destLayer)
    if not isService:
        try:
            NAX.CalculateLocations(destLayer, netSource, searchTolerance, travel_mode=travelMode)
        except ARCPY.ExecuteError:
            for msg in range(0, ARCPY.GetMessageCount()):
                if ARCPY.GetSeverity(msg) == 2:
                    ARCPY.AddReturnMessage(msg)
            raise SystemExit()

        sid = ARCPY.AddFieldDelimiters(destLayer, 'SourceID')
        wc = "{0} > -1".format(sid) 
        DM.SelectLayerByAttribute(destLayer, "NEW_SELECTION", where_clause=wc)
        cnt = UTILS.getCount(destLayer)
        if cnt < 2:
            UTILS.passiveDelete(destLayer)
            ARCPY.AddIDMessage("ERROR", 110001)
            raise SystemExit()

    #### Load Destinations ####
    odcm.load(NAX.OriginDestinationCostMatrixInputDataType.Destinations, destLayer, fmd)

    #### Add Barriers ####
    if inputBarrier is not None:
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84147))
        barDesc = ARCPY.Describe(inputBarrier)
        barShapeType = barDesc.ShapeType.upper()
        barrierType = naTypeMap[barShapeType]
        odcm.load(barrierType, inputBarrier)
    else:
        inputBarrier = "#"

    #### Create Origin Layer Name ####
    originLayer = "OD_Origins"

    #### Initialize Spatial Weights Matrix File ####
    hierarchyBool = travelModeInfo.useHierarchy == 'USE_HIERARCHY'
    addConcept = WU.wTypeDispatch[fixed].split("_")[0]
    forceFixed = (fixed == True)
    restrictions = ";".join(travelModeInfo.restrictions)
    restrictions = restrictions.replace("'", "")
    restrictions = restrictions.replace(";", "|")
    uturnPolicy = travelModeInfo.uTurns

    swmWriter = WU.SWMWriter(swmFile, masterField, netSpatName, 
                             numObs, rowStandard,
                             inputFC = inputFC, wType = 10,
                             inputNet = netSource, 
                             impedanceField = impedance,
                             barrierFC = inputBarrier,
                             uturnPolicy = uturnPolicy,
                             restrictions = restrictions,
                             useHierarchy = hierarchyBool,
                             searchTolerance = searchTolerance,
                             addConcept = addConcept,
                             exponent = exponent,
                             forceFixed = forceFixed,
                             hasID64 = hasID64)

    #### Create FieldList for Subset Searching ####
    fieldList = ['OriginName', 'DestinationName', impedanceField] 

    #### Get Chunks if Necessary ####
    numOrigins = int(10000000. / numObs)
    allMaster = NUM.sort(masterIDs)
    chunkedIDs = UTILS.chunk(allMaster, numOrigins)
    sqlStrings = UTILS.sqlChunkStrings(originLayer, masterField, chunkedIDs)
    numChunks = len(sqlStrings)

    #### Keep Track of Features That Snap to Network ####
    snappedFeatures = set([])

    for chunkNum in UTILS.ssRange(numChunks):
        progMsg = ARCPY.GetIDMessage(84145).format(chunkNum + 1, numChunks)
        ARCPY.SetProgressor("default", progMsg)
        
        #### Make Origins from Chunk of Destinations ####
        sqlValue = sqlStrings[chunkNum]
        if numChunks == 1:
            DM.MakeFeatureLayer(inputFC, originLayer)
        else:
            DM.MakeFeatureLayer(inputFC, originLayer, sqlValue)

        odcm.load(NAX.OriginDestinationCostMatrixInputDataType.Origins, originLayer, fmo, False)

        #### Solve OD Matrix and Select Data ####
        solver = odcm.solve()

        #### Get Field Indices ####
        result_fields = solver.fieldNames(NAX.OriginDestinationCostMatrixOutputDataType.Lines)
        resIndices = [result_fields.index(i) for i in fieldList]

        #### Set Tool Progressor and Process Information ####
        numLinks = solver.count(NAX.OriginDestinationCostMatrixOutputDataType.Lines)
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84127), 0, numLinks * 2, 1)

        #### Use Search Cursor ####
        sparse = COLL.defaultdict(dict)
        idList = []
        with solver.searchCursor(NAX.OriginDestinationCostMatrixOutputDataType.Lines, result_fields) as rows:
            for row in rows:
                masterID = int(row[resIndices[0]])
                neighID = int(row[resIndices[1]])
                impValue = row[resIndices[2]]

                #### Obtain Impedance and Create Weight ####
                weight = WU.distance2Weight(impValue, wType = fixed, 
                                            exponent = exponent)

                #### Add to Sparse Structure ####
                if masterID not in sparse:
                    idList.append(masterID)
                    snappedFeatures.add(masterID)
                    sparse.setdefault(masterID, [[], []])
                else:
                    sparse[masterID][0].append(neighID)
                    sparse[masterID][1].append(weight)

                #### Progress ####
                ARCPY.SetProgressorPosition()

            #### Write Results ####
            for masterID in idList:
                neighs, weights = sparse[masterID]
                swmWriter.swm.writeEntry(masterID, neighs, weights) 

                #### Progress ####
                ARCPY.SetProgressorPosition()

    #### Clean Layers ####
    UTILS.passiveDelete(destLayer)
    UTILS.passiveDelete(originLayer)

    #### Add Empty SWM Entries for Features Not Snapped to Network ####
    notSnapped = snappedFeatures.symmetric_difference(allMaster)
    for masterID in notSnapped:
        swmWriter.swm.writeEntry(masterID, [], [])

    #### Report Warning/Max Neighbors ####
    swmWriter.reportNeighInfo()

    #### Clean Up ####
    swmWriter.close()

    #### Report Spatial Weights Summary ####
    swmWriter.report()

    #### Report SWM File is Large ####
    swmWriter.reportLargeSWM()
