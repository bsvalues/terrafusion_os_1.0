# coding: utf-8
"""
Tool Name:  Collect Events
Source Name: CollectEvents.py
Version: ArcGIS 10.1
Author: ESRI

This utility converts event data into weighted point data.
"""

################### Imports ########################

import os as OS
import sys as SYS
import arcpy as ARCPY
import arcpy.management as DM
import arcpy.da as DA
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO 
import collections as COLL
import numpy as NUM

################ Output Field Names #################
countFieldName = "ICOUNT"

def execute(parameters, messages):
    inputFC = UTILS.getTextParameter(0, parameters)
    outputFC = UTILS.getTextParameter(1, parameters)

    #### Create SSDataObject ####
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC)
    ssdo.newFieldTypeChecker.checkOID64(silent = False)

    countFieldNameOut, maxCount, N, numUnique, uniqueEventCounts = collectEvents(ssdo, outputFC)
    setDerivedOutput(countFieldNameOut, maxCount, parameters)
    renderResults(parameters, uniqueEventCounts)

def setDerivedOutput(countFieldNameOut, maxCount, parameters = None):
    #### Set Derived Output ####
    try:
        if parameters is None:
            ARCPY.SetParameterAsText(2, countFieldNameOut)
            maxCount = maxCount * 1.0
            ARCPY.SetParameterAsText(3, maxCount)
        else:
            UTILS.setParameterAsText(2, countFieldNameOut, parameters)
            maxCount = maxCount * 1.0
            UTILS.setParameterAsText(3, maxCount, parameters)
    except:
        ARCPY.AddIDMessage("WARNING", 902)

def renderResults(parameters = None, uniqueEventCounts=6):
    import json
    from arcpy.cim.cimloader import GetJSONTypeOBJ
    from arcpy.cim.cimloader import CimJsonEncoder

    #### Set the Default Symbology ####
    if parameters is None:
        params = ARCPY.gp.GetParameterInfo()
    else:
        params = parameters

    pathTemplate = OS.path.join(UTILS.pathLayers, "CollectEventsRenderer.lyrx")
    f = open(pathTemplate, 'r')
    content = f.read()
    f.close()
    cimLayer = GetJSONTypeOBJ(json.loads(content))
    layerDef = cimLayer.layerDefinitions[0]
    ceiling = max(1, uniqueEventCounts - 1)
    layerDef.renderer.breaks = layerDef.renderer.breaks[0:ceiling]
    jsonData = json.dumps(layerDef, cls=CimJsonEncoder)
    ARCPY.gp.SetParameterSymbology(1, "JSONCIMDEF=" + jsonData)

def collectEvents(ssdo, outputFC, silentWarnings = False, sortOutput = True):
    """This utility converts event data into weighted point data by
    dissolving all coincident points into unique points with a new count
    field that contains the number of original features at that
    location.

    INPUTS: 
    inputFC (str): path to the input feature class
    outputFC (str): path to the input feature class
    """

    #### Set Default Progressor for Neigborhood Structure ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84143))

    #### Validate Output Workspace ####
    ERROR.checkOutputPath(outputFC)

    #### True Centroid Warning For Non-Point FCs ####
    if ssdo.shapeType.upper() != "POINT":
        ARCPY.AddIDMessage("WARNING", 1021)

    if ssdo.shapeType.upper() == "POLYLINE":
        isLine = True
    else:
        isLine = False

    #### Assure Enough Observations ####
    cnt = UTILS.getCount(ssdo.inputFC)
    ERROR.errorNumberOfObs(cnt, minNumObs = 4)

    #### Create Search Cursor ####
    rows = DA.SearchCursor(ssdo.inputFC, [ssdo.oidName, "SHAPE@XY"])

    #### Create XY Hash Counter ####
    pointCounts = COLL.defaultdict(NUM.int32)
    N = 0
    badRecords = []

    #### Collect Events ####
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84007), 0, cnt, 1)
    for row in rows:
        oid = row[0]
        centroid = row[1]

        #### Assure Centroid is Valid ####
        if isLine:
            badValues = NUM.isnan(centroid[0]) or NUM.isnan(centroid[1])
        else:
            badValues = centroid.count(None)

        if not badValues:
            pointCounts[centroid] += 1
            N += 1
        else:
            badRecords.append(oid)
    del rows

    #### Assure Enough Observations After Read ####
    ERROR.errorNumberOfObs(N, minNumObs = 4)

    #### Process Any Bad Records Encountered ####
    if not silentWarnings:
        bn = len(badRecords)
        if bn:
            #### Get Set of Bad IDs ####
            badRecords = list(set(badRecords))
            badRecords.sort()
            strBadRecords = [ str(i) for i in badRecords ]
            ERROR.reportBadRecords(cnt, bn, strBadRecords, label = ssdo.oidName)

    #### Create Output Feature Class ####
    ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84006))
    outPath, outName = OS.path.split(outputFC)
    ssdo.newFieldTypeChecker.createFeatureClass(outputFC, "POINT", ssdo.mFlag, 
                                                ssdo.zFlag, ssdo.spatialRefString)

    #### Add Count Field ####
    countFieldNameOut = ARCPY.ValidateFieldName(countFieldName, outPath)
    UTILS.addEmptyField(outputFC, countFieldNameOut, "LONG")
    fieldList = ["SHAPE@", countFieldNameOut]

    #### Set Insert Cursor ####
    rowsOut = DA.InsertCursor(outputFC, fieldList)

    #### Set Progressor for Calculation ####
    ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84003), 0, N, 1)

    ###  Sort by Keys ####
    pointCountsOut = pointCounts
    if sortOutput:
        pointCountsOut = COLL.OrderedDict(sorted(pointCounts.items()))

    for pnt, count in UTILS.iteritems(pointCountsOut):
        #### Create Output Point ####
        pnt = (pnt[0], pnt[1], ssdo.defaultZ)

        #### Create and Populate New Feature ####
        rowResult = [pnt, count]
        rowsOut.insertRow(rowResult)
        ARCPY.SetProgressorPosition()
    
    del rowsOut

    #### Set Stats ####
    numUnique = len(pointCounts)
    maxCount = max(UTILS.itervalues(pointCounts))
    uniqueEventCounts = len(NUM.unique(list(UTILS.itervalues(pointCounts))))

    return countFieldNameOut, maxCount, N, numUnique, uniqueEventCounts
