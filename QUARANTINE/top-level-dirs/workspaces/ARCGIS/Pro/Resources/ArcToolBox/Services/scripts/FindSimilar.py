#-*-coding:UTF-8 -*-
"""---------------------------------------------------------------------------
Name:              FindSimilar.py
Purpose:           Similarity Search for AGOL
Author:            Esri Inc.
Created:           1/31/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""

#from __future__ import unicode_literals
import os
import json
import arcpy
import hostedgp as agolgp
import aolutils
import popup
import time
from arcpy import ExecuteError
import rendererUtils
from findlocationscore import ExpressionValidator

import importlib
#importlib.reload(findlocationsutils)
importlib.reload(rendererUtils)

# ****Constant variables****

REQD_TOOLBOXES = "Workflows.tbx"
TASK_NAME = u"FindSimilarLocations"
error_ID = [308,401,728,735,1585,1589,1599]
costFactor = 0.001

def getPopupContent(descOutput, joinFields = None):
    '''Creates appropriate popup content'''

    # create popup content for count always
    similar_popupInfo = popup.PopupInfo("Find Similar Locations Summary")
    similar_popupInfo.addFieldInfo("SIMRANK", "Similarity Rank")
    similar_popupInfo.addFieldInfo("MATCH_ID", "Input Reference ID")
    similar_popupInfo.addFieldInfo("CAND_ID", "Candidate Search ID")
    similar_popupInfo.addFieldInfo("SIMINDEX", "Sum Squared Value Differences", True)
    for field in descOutput.fields:
        fieldName = field.name
        if fieldName in analysisField or fieldName in joinFields:
            fType = field.type
            if fType == "Double" or fType == "Single":
                similar_popupInfo.addFieldInfo(fieldName, fieldName, True)
            else:
                similar_popupInfo.addFieldInfo(fieldName, fieldName)

    return similar_popupInfo.getPopupInfo()

if __name__ == '__main__':
    # Initialize context
    
    hostedgp = None
    # timer messages
    startTime = time.time()
    beginTime = startTime
    
    try:
        hostedgp = agolgp.HostedGP(6, 5)
        outputName = hostedgp.GetOutputName(5)
        #check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, outputName)

        aolutils.addRemoveToolboxes(True, REQD_TOOLBOXES)

        # The feature service for the locations to match.
        inputServices, inputFeatures, inputLayersName, inputShape,\
        inputCount, inChangedFields = aolutils.getHostedLayer(hostedgp,\
        "Analysis Layer", 0)
        # The feature service for potential locations.
        searchServices, searchFeatures, searchLayersName, searchShape,\
        searchCount, searchChangedFields = aolutils.getHostedLayer(hostedgp,\
         "Search Layer", 1)

        startTime = aolutils.AddTimerMessage(startTime, "Get Analysis Layers")
        # The numeric field to be evaluated.
        analysisField = arcpy.GetParameterAsText(2)
        analysisField = aolutils.updateChangedFieldNames(analysisField, inChangedFields)

        inputQuery = arcpy.GetParameterAsText(3)
        if inputQuery:
            if inChangedFields:
                for field, changedField in inChangedFields.items():
                    if field in inputQuery:
                        inputQuery = inputQuery.replace(field, changedField)
            if "fid =" in inputQuery:
                descFID = arcpy.Describe(inputFeatures).oidFieldName
                inputQuery = inputQuery.replace("fid", descFID)                                     
            inputQuery = ExpressionValidator.update_where_expression(inputFeatures, inputQuery)
            arcpy.SelectLayerByAttribute_management(inputFeatures, "NEW_SELECTION", inputQuery)
            selectLayer1 = arcpy.MakeFeatureLayer_management(inputFeatures, 'selectLayer1').getOutput(0)
            desc1 = arcpy.Describe(selectLayer1)
            fidString = desc1.FIDSet
            if fidString:
                selectionSet1 = [int(x) for x in fidString.split(';')]
                count1 = len(selectionSet1)
            if inputLayersName == searchLayersName:
                selectLayer2 = arcpy.MakeFeatureLayer_management(searchFeatures, 'selectLayer2').getOutput(0)
                desc2 = arcpy.Describe(selectLayer2)
                fidString2 = desc2.FIDSet
                if not fidString2:
                    searchLayer = arcpy.SelectLayerByAttribute_management(searchFeatures, "NEW_SELECTION")
                    desc2 = arcpy.Describe(searchLayer)
                    fidString2 = desc2.FIDSet
                    selectionSet2 = [int(x) for x in fidString2.split(';')]
                else:
                    selectionSet2 = [int(x) for x in fidString2.split(';')]
                count2 = len(selectionSet2)
                removeLayer = arcpy.SelectLayerByAttribute_management(searchFeatures, "REMOVE_FROM_SELECTION", inputQuery)
                desc3 = arcpy.Describe(removeLayer)
                fidString3 = desc3.FIDSet
                if fidString3:
                    selectionSet3 = [int(x) for x in fidString3.split(';')]
                    searchCount = len(selectionSet3)

        numberResults = arcpy.GetParameterAsText(4)
        if numberResults == "0" or int(numberResults) > int(searchCount):
            numberResults = searchCount
        startTime = aolutils.AddTimerMessage(startTime, "Get the number of results {}".format(numberResults))

        paramsDict = {"inputLayer": {"count": inputCount, "shapeType": inputShape},
                      "searchLayer": {"count": searchCount, "shapeType": searchShape},
                      "analysisField": analysisField, "numberResults": numberResults}
        aolutils.checkForCredits(TASK_NAME, paramsDict)

        # The extra parameter for AGOL, the number of parameters in toolbox
        arcpy.SetParameterAsText(7, "")
        # Get cloud output paths
        r = arcpy.GetCount_management(inputFeatures)
        count = int(r.getOutput(0))
        outCount = count + int(numberResults)
        # wkspc = aolutils.getOutputWkspc(outCount)
        wkspc = arcpy.env.scratchGDB
        scratchFeatures = os.path.join(wkspc,"SimilarOutput")

        #Execute tool

        try:
            result = arcpy.gp.SimilaritySearch_workflows(inputFeatures, \
                                                    searchFeatures, \
                                                    scratchFeatures, \
                                                    "NO_COLLAPSE", \
                                                    "MOST_SIMILAR", \
                                                    "ATTRIBUTE_VALUES", \
                                                    numberResults, \
                                                    analysisField)
        except:
            info = arcpy.gp.GetAllMessages()
            noVariance = ""
            for i in info:
                # arcpy.AddMessage(i)
                if i[1] == 1584:
                    missingFd = i[2].split(":")[2].strip(".")
                    errormsg = u"Field(s) {} must be in both the reference and candidate search layers.".format(missingFd)
                    aolutils.AddErrorCode(100088, errormsg,{"attribute":missingFd})
                    raise Exception
                elif i[1] == 1588:
                    noVariance = i[2].split(":")[2]
                elif i[1] == 728:
                    fieldName = i[2].split(":")[1].split(" ")[2]
                    paramName = inputLayersName
                    errormsg = u"The field name {} does not exist in the {}.".format(fieldName, paramName)
                    aolutils.AddErrorCode(100052, errormsg,{"fieldName":fieldName,"paramName":paramName})
                elif i[1] == 1585:
                    errormsg = u"The following fields lack sufficient variation for use in this analysis: {}.".format(noVariance)
                    aolutils.AddErrorCode(100089, errormsg,{"attribute":noVariance})
                elif i[1] == 735:
                    aolutils.AddErrorCode(735, "Please provide at least one valid analysis field to base similarity on.")
                elif i[1] == 1589:
                    aolutils.AddErrorCode(100090, "This tool requires at least 2 candidate search locations that are not also reference locations.")
                elif i[1] == 1599:
                    aolutils.AddErrorCode(1599, "Too few records for analysis. This tool requires at least 1 reference location in the Input Layer to compute results.")
                elif i[1] in error_ID:
                    aolutils.AddErrorCode(i[1],i[2].split(":")[1])
            raise Exception

        startTime = aolutils.AddTimerMessage(startTime, "Find Similar Run")
        
        # Get processing messages
        info = arcpy.gp.GetAllMessages()
        
        processInfo = []
        for i in info:
            if "messageCode" in i[2]:
                if not processInfo:
                    intro = '{"messageCode": "SS_00003", "message": "The following report outlines the summary of your Find Similar Locations result:", "params": {}, "style": "<b></b><br></br>"}'                   
                    processInfo.append(intro) 
                processInfo.append(str(i[2]))
        
        # Join fields to output from Search Layer
        descSearch = arcpy.Describe(searchFeatures)
        uid = descSearch.oidFieldName
        removeFields = [uid, descSearch.shapeFieldName]

        scrachFields = [f.name for f in arcpy.ListFields(scratchFeatures)]
        searchFields = [d.name for d in arcpy.ListFields(searchFeatures) if d.name not in removeFields]
        joinFields = list(set(searchFields).difference(set(scrachFields)))
        if joinFields:
            arcpy.JoinField_management(scratchFeatures, 'CAND_ID', searchFeatures, uid, joinFields)

        returnType = 1
        if outputName.createService == True:
            return_type = 2

        descOutput = arcpy.Describe(scratchFeatures)
        outshape = descOutput.shapeType.lower()
        pt_count = int(arcpy.GetCount_management(scratchFeatures).getOutput(0))
        drawingInfo = rendererUtils.getSimilarRenderingInfo(int(numberResults), outshape)

        popupInfo = getPopupContent(descOutput, joinFields)

        res = aolutils.HostedToolResult(outputName)
        outDesc = aolutils.getOutDescription("FindSimilarLayer", 0, drawingInfo, popupInfo)

        res.addHostedOutput(descOutput, outDesc, 7)
        startTime = res.generateHostedResult(hostedgp, startTime)

        startTime = aolutils.AddTimerMessage(startTime, "Create Output Layer")

        arcpy.SetParameterAsText(8, json.dumps(processInfo))

        values = [inputCount,
                  searchCount,
                  len(analysisField.split(";")),
                  numberResults,
                  returnType]
        cost = (int(inputCount) + int(searchCount)) * costFactor

        aolutils.LogUsageMetering(TASK_NAME, searchCount, cost, beginTime, values)

        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)

    except arcpy.ExecuteError as err:
        aolutils.AddExecuteErrors(TASK_NAME, error_ID)

    except Exception as err:
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()

# End Module FindSimilar.py
