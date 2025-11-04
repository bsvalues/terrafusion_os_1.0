import sys
import os
import analysisutils
import arcpy
import time
from arcpy import ExecuteError
from minMajority import addPercentShape, addMinorityMajority
import statisticsgen

import importlib
importlib.reload(statisticsgen)

checkNoneCodeBlock = """
def convertNoneToZero(sum_shape):
    if sum_shape == None:
        return 0
    else:
        return sum_shape
"""

def verifyFieldInfoFieldNames(fieldInfo, outputFields):
    '''verify field names in fieldInfo'''   
    
    if "shapeField" in fieldInfo:
        shapeField, alias, fType = fieldInfo["shapeField"]
        shapeField = analysisutils.getAccurateFieldName(outputFields,shapeField)
        fieldInfo["shapeField"] = (shapeField, alias, fType)
    if "summaryFields" in fieldInfo:
        statsFields = fieldInfo["summaryFields"]
        newStatsField = []
        for fName, alias, fType in statsFields:
            fName = analysisutils.getAccurateFieldName(outputFields, fName)
            newStatsField.append((fName, alias, fType))
        fieldInfo["summaryFields"] = newStatsField

def appendShpFieldNameWithGroupByField(calculateStats, groupFieldName, fieldInfo):
    '''add groupByfieldname to shapefield name'''
    statsList = calculateStats.split(";")
    shapeField, stats = statsList[0].split(" ")
    shapeField = "{}_{}".format(shapeField, groupFieldName)
    fieldInfo["tblShapeField"] = (shapeField, shapeField, "Double")
    return "{} {}".format(shapeField, stats)


def addShapeField(inputLayer, inputLayerDesc, units):
    '''Adds shape area or length field in given units'''
    #arcpy.AddMessage("addShapeField units :{}".format(units))
    shapeType = inputLayerDesc.shapeType
    if "Square" in units:
        unitsText = units.replace("Square","Square " )
    else:
        unitsText = units
    if shapeType == "Polyline":
        fieldname = "Length_{}".format(units)
        expression = "!{}.length@".format(inputLayerDesc.shapeFieldName)
        fieldalias = "Summarized length in {}".format(unitsText)
    else:
        fieldname = "Area_{}".format(units)
        expression = "!{}.area@".format(inputLayerDesc.shapeFieldName)
        fieldalias = "Summarized area in {}".format(unitsText)
    fieldList = inputLayerDesc.fields
    fieldname, fieldalias = analysisutils.createUniqueFieldName(inputLayer, fieldname,
                                                                fieldalias, fieldList)
    #arcpy.AddMessage("SummarizeShape, fieldName:{}, fieldAlias :{}".format(fieldname, fieldalias))
    # Add the new field
    arcpy.AddField_management(inputLayer, fieldname, "DOUBLE",
                              "#", "#", "#", fieldalias, "NULLABLE", "NON_REQUIRED", "#")

    # Verify spatial reference and calculate geodesic area if needed
    spref = inputLayerDesc.spatialReference    
    if analysisutils.useGeodesic(descFC=inputLayerDesc):
        expression = expression.replace("area","geodesicArea")
        expression = expression.replace("length","geodesicLength")	
    #Add units
    expression = "{}{}!".format(expression, units)
    #Calculate Field based on the expresiion
    arcpy.CalculateField_management(inputLayer, fieldname, expression, "PYTHON_9.3")
    return fieldname, fieldalias

# End def addShapeField

def handleNullValues(keepBoundaries, fieldName, summarizedOutput):
    '''converts null values to zero'''        
    if keepBoundaries:
        #convert null values to zero
        expr = "convertNoneToZero(!{}!)".format(fieldName)
        codeBlock = checkNoneCodeBlock
        #arcpy.AddMessage("expr:{}".format(expr))
        result = arcpy.CalculateField_management(summarizedOutput, fieldName,
                                    expr, "PYTHON", codeBlock)
    else:
        expr = "{} IS NULL".format(fieldName)
        lyrName = "tempLayer"
        arcpy.MakeFeatureLayer_management(summarizedOutput, lyrName , expr)
        arcpy.DeleteFeatures_management(lyrName)
#End def convertNullValuesToZero

def updateShpSummaryFields(summaryFields, shapeType):
    '''remove shape_length and shape_area'''
    if "line" in shapeType:
        shpField = "shape_length"
    elif "polygon" in shapeType.lower():
        shpField = "shape_area"
    else:
        return False
    shpStatsPos = None
    for i, (fieldName, summary) in enumerate(summaryFields):
        if fieldName.lower() == shpField and summary.lower() == "sum":
            shpStatsPos = i
    if shpStatsPos is not None:
        summaryFields.pop(shpStatsPos)
        return True
    else:
        return False

def addShapeLengthAreaField(intersectLayer, inputLayer, summFields):
    '''deletes shapelength or shapeArea field from summary layer
    Consequence of supporting Shape_Length, Shape_Area summary'''
    fields = [fieldName.lower() for (fieldName, summary) in summFields]
    joinFields = []
    if "shape_length" in fields:
        joinFields.append("SHAPE_LENGTH")
    if "shape_area" in fields:
        joinFields.append("SHAPE_AREA")
    arcpy.AddMessage("Join Fields: ")
    arcpy.AddMessage(joinFields)
    if joinFields:
        try:
            # join shape_length/shape_area fields
            inputLyrDesc = arcpy.Describe(inputLayer)
            inputLyrOID = inputLyrDesc.OIDFieldName
            intersectJoinField = "FID_{}".format(inputLyrDesc.basename)
            arcpy.JoinField_management(intersectLayer, intersectJoinField,
                                     inputLayer, inputLyrOID, ";".join(joinFields))
            # rename join fields to shapelength, shapearea
            fieldList = arcpy.Describe(intersectLayer).fields
            #arcpy.AddMessage("addShapeLengthAreaField")
            #arcpy.AddMessage([field.name for field in fieldList])
            renFields = []
            for fieldName in joinFields:
                currFieldName = analysisutils.getAccurateFieldName(fieldList, fieldName)
                if currFieldName.upper() != fieldName:
                    for i, (fName, summary) in enumerate(summFields):
                        if fName.upper() == fieldName:
                            renFields.append((i, currFieldName))
            #arcpy.AddMessage("renfields :{}".format(renFields))
            if renFields:
                for pos, fName in renFields:
                    summFields[pos][0] = fName
            arcpy.AddMessage(summFields)
        except:
            pass

def summarizeWithin(startTime,
                    withinLayer,
                    summarizeLayer,
                    summarizeLayerShapeType,
                    summarizedOutput,
                    keepEmptyBoundaries,
                    countLengthArea,
                    lengthAreaUnits,
                    summaryFields,
                    groupFieldName,
                    minMajority,
                    percentShape,
                    groupSummary,
                    wkspc):


    #check for shapeFields in summaryFields
    if updateShpSummaryFields(summaryFields, summarizeLayerShapeType):
        countLengthArea = True

    isPointGeom = False
    if "point" in summarizeLayerShapeType.lower():
        isPointGeom = True

    # if  isPointGeom and not groupFieldName:
    #     from AggregatePointsCore import aggregatePoints
    #     return aggregatePoints(startTime, summarizeLayer, withinLayer,
    #                            keepEmptyBoundaries, summaryFields,
    #                            groupFieldName, minMajority, percentShape,
    #                            summarizedOutput, groupSummary, wkspc)

    
    # retains new field names created throughout the script
    fieldInfo = {}
        
    # Use MakeFeatureLayer tool to support Use Ratio policy	     
    summarizeLayer_ratio = analysisutils.createLayerWithUseRatioPolicy(summarizeLayer, summaryFields, groupFieldName)
    startTime = analysisutils.AddTimerMessage(startTime, "Make Ratio Layer")	
    arcpy.CopyFeatures_management(withinLayer, summarizedOutput)
    startTime = analysisutils.AddTimerMessage(startTime, "Copy Input Fetures")
    withinLayer_noFields = analysisutils.createLayerWithHiddenFields(summarizedOutput)
    startTime = analysisutils.AddTimerMessage(startTime, "Make Hidden Layer")
    descSummarizedOutput = arcpy.Describe(summarizedOutput)

    #find the intersecting values
    intersectOut = os.path.join(wkspc,"intersectOut")
    #arcpy.AddMessage("intersectOut: {}".format(intersectOut))
    arcpy.analysis.PairwiseIntersect([summarizeLayer_ratio, withinLayer_noFields], intersectOut, "ALL", "#", "INPUT")
    # delete shapefields if added to summarizeLayer_ratio
    if summaryFields:
        addShapeLengthAreaField(intersectOut, summarizeLayer, summaryFields)

    startTime = analysisutils.AddTimerMessage(startTime, "Intersect layers")
    descIntersectOut = arcpy.Describe(intersectOut)

    #Calculate statistics
    withinLayerFIDFieldName = "FID_{}".format(descSummarizedOutput.basename)		
    # stores the stats that needs to be calulated 
    statFields = []    
    # fields that needs to be joined to the layer from stats out
    joinFields = []
    # rename stats field names in table
    renameTableFields = []

    #Do we need to compute Count, length or Area
    if countLengthArea:
        if summarizeLayerShapeType.lower() in ['polyline','polygon']:
            shapeFieldName, shapeFieldAlias = addShapeField(intersectOut, descIntersectOut,
                                                            lengthAreaUnits)
            statFields.append("{} SUM".format(shapeFieldName))
            shapeFieldName = "SUM_{}".format(shapeFieldName)
            joinFields.append(shapeFieldName)
            fieldInfo["shapeField"] = (shapeFieldName, shapeFieldAlias, "Double")
            renameTableFields.append((shapeFieldName, "#", shapeFieldAlias))
        else:
            shapeFieldName = "Point_Count"
            shapeFieldAlias = "Count of Points"
            fieldInfo["shapeField"] = (shapeFieldName, shapeFieldAlias, "Long")
            renameTableFields.append(("Frequency", shapeFieldName, shapeFieldAlias))
            #Frequency field is created by Summary Statistics and will give the count of points
            #joinFields.append("Frequency")
            joinFields.append(shapeFieldName)

        startTime = analysisutils.AddTimerMessage(startTime, "Calculated Shape Fields")

    # Do we need attribute statistics

    meanFields = []
    weightedFields = []
    weightedSumFields = []
    weightedMeanFields = []
    weightPrefix = "w_"
    weightField = "{}shape".format(weightPrefix)
    sumWeightField = "{}_{}".format("SUM", weightField)
    #fields that require stddev stats    
    stddevFields = []
    #fields that have stddev stats value
    stddevStatsFields = []


    if summaryFields and len(summaryFields) > 0 :
        fieldInfo["summaryFields"] = []
        for fieldname,summary in summaryFields:
            if summary.upper() == "STDDEV":
                summary = "Std"
            if isPointGeom:               
                statFields.append("{} {}".format(fieldname, summary))
            else:
                if (summary.upper() == "MEAN"):
                    wfieldname = "{}{}".format(weightPrefix, fieldname)
                    summary = "MEAN"
                    wstatType = "SUM"
                    statFields.append("{} {}".format(wfieldname, wstatType))
                    #joinFields.append("{}_{}".format(statType, fieldname))
                    meanFields.append(fieldname)
                    weightedFields.append(wfieldname)
                    weightedSumFields.append("{}_{}".format(wstatType, wfieldname))
                    weightedMeanFields.append("{}_{}".format(summary, fieldname))
                elif (summary == "Std"):                      
                    stddevFields.append(fieldname)                    
                else:
                    statFields.append("{} {}".format(fieldname, summary))
                #joinFields.append("{}_{}".format(statType, fieldname))
            fldName = "{}_{}".format(summary.upper(), fieldname)
            joinFields.append(fldName)
            if summary == "Std":
                stddevStatsFields.append(fldName)
            fldAlias = analysisutils.getSummaryAliasField(fieldname, summary)
            renameTableFields.append((fldName, "#", fldAlias))
            fieldInfo["summaryFields"].append((fldName, fldAlias, "Double"))

        #compute weighted fields for weighted mean
        
        if ((not isPointGeom) and ((len(meanFields) > 0) or (len(stddevFields) > 0))):
            #create shape field for both weighted mean and weighted stddev
            arcpy.AddField_management(intersectOut, weightField, "DOUBLE")
            if summarizeLayerShapeType.lower() == 'polyline':
                expression = "!{}.length!".format(descIntersectOut.shapeFieldName)
            else:
                expression = "!{}.area!".format(descIntersectOut.shapeFieldName)
            #arcpy.AddMessage(expression)
            arcpy.CalculateField_management(intersectOut, weightField, expression, "PYTHON")
            if len(meanFields) > 0:
                #create other fields only for weighted mean
                statFields.append("{} {}".format(weightField, "SUM"))
                index = 0
                for fieldname in meanFields:
                    arcpy.AddField_management(intersectOut, weightedFields[index], "DOUBLE")
                    expression = "!{}! * !{}!".format(meanFields[index], weightField)
                    arcpy.CalculateField_management(intersectOut, weightedFields[index], expression, "PYTHON")
                    index = index + 1
                startTime = analysisutils.AddTimerMessage(startTime, "Calculated weighted mean")

    #Statistics_analysis requires at least one statistics field
    countField = ""
    if len(statFields) == 0:
        statFields.append("{} COUNT".format(withinLayerFIDFieldName))
        countField = "COUNT_{}".format(withinLayerFIDFieldName)

    # Calculate stats without groupByField

    statsOut = os.path.join(wkspc,"statsout")
    fieldInfo["intermediateData"] = [statsOut]
    calculateStats = ";".join(statFields)
    #arcpy.AddMessage("Summary Stats calculate stats: {}".format(calculateStats))
    #arcpy.AddMessage("Summary Stats case field: {}".format(withinLayerFIDFieldName))
    arcpy.Statistics_analysis(intersectOut,statsOut,calculateStats,[withinLayerFIDFieldName])
    startTime = analysisutils.AddTimerMessage(startTime, "Calculated summary statistics")

    if (not isPointGeom):
        #compute weighted mean fields
        index = 0
        for fieldname in meanFields:
            arcpy.AddField_management(statsOut, weightedMeanFields[index], "DOUBLE")
            expression = "!{}! / !{}!".format(weightedSumFields[index], sumWeightField)
            #arcpy.AddMessage(expression)
            arcpy.CalculateField_management(statsOut, weightedMeanFields[index], expression, "PYTHON")
            index = index + 1

        #compute weighted stddev fields
        if (stddevFields):
            statGen = statisticsgen.StatisticsGen(intersectOut, withinLayerFIDFieldName, weightField )
            cursorFields = [withinLayerFIDFieldName]
            for field in stddevStatsFields:        
                arcpy.AddField_management(statsOut, field, "DOUBLE")
            cursorFields.extend(stddevStatsFields)    
            with arcpy.da.UpdateCursor(statsOut, cursorFields) as cursor:        
                for row in cursor:
                    currFieldValue = row[0]
                    resp = statGen.standardDeviation(stddevFields, currFieldValue)
                    newRow = [currFieldValue]
                    newRow.extend(resp[currFieldValue])
                    cursor.updateRow(newRow)       

    if len(joinFields) > 0 :
        OIDField = descSummarizedOutput.OIDFieldName
        #arcpy.AddMessage("joinFields {}".format(joinFields))
        if renameTableFields:
            analysisutils.renameFields(statsOut, renameTableFields)
        arcpy.JoinField_management(summarizedOutput, OIDField, statsOut, withinLayerFIDFieldName, joinFields)

        #verify field names in fieldInfo are accurate after the join
        summarizedOutputFields = arcpy.ListFields(summarizedOutput)
        verifyFieldInfoFieldNames(fieldInfo, summarizedOutputFields)

    # convert null values :since JoinField will create null values.#
    try :

        if (countLengthArea):
            handleNullValues(keepEmptyBoundaries, shapeFieldName, summarizedOutput)
        if (summaryFields):
            #As per scott, update null to zero only for sum
            if "sum" in [stats.lower() for field,stats in summaryFields]:
                for (fName,alias,type) in fieldInfo["summaryFields"]:
                    if "sum" in fName.lower():
                        handleNullValues(True, fName, summarizedOutput)
                    
        
    except ExecuteError:
        #arcpy.AddMessage("Tool Error: Unable to convert zero to None")
        pass

    startTime = analysisutils.AddTimerMessage(startTime, "Created Summarized layer")

    #Do we need to group? Yes, create an additional table      

    if groupFieldName and len(groupFieldName) > 0:
        fieldInfo["groupByField"] = (groupFieldName, groupFieldName, "Text")
        #arcpy.AddMessage("Summary Stats calculate stats: {}".format(calculateStats))
        #arcpy.AddMessage("Summary Stats case field: {},{}".format(withinLayerFIDFieldName, groupFieldName))
        arcpy.Statistics_analysis(intersectOut,groupSummary,
                                  calculateStats,[withinLayerFIDFieldName,
                                                  groupFieldName])
        startTime = analysisutils.AddTimerMessage(startTime, "Calculated groupBy Statistics")
        if (not isPointGeom):
            #compute weighted mean fields
            if len(meanFields) > 0:
                index = 0
                for fieldname in meanFields:
                    arcpy.AddField_management(groupSummary, weightedMeanFields[index], "DOUBLE")
                    expression = "!{}! / !{}!".format(weightedSumFields[index], sumWeightField)
                    #arcpy.AddMessage(expression)
                    arcpy.CalculateField_management(groupSummary, weightedMeanFields[index],
                                                    expression, "PYTHON")
                    index = index + 1

                weightedSumFields.append(sumWeightField)
                arcpy.DeleteField_management(groupSummary, weightedSumFields)
                startTime = analysisutils.AddTimerMessage(startTime, "Calculated groupBy Weighted Mean")
            #compute weighted stddev fields
            if len(stddevFields)> 0:
                statGen = statisticsgen.StatisticsGen(intersectOut, withinLayerFIDFieldName, weightField, groupFieldName)
                cursorFields = [withinLayerFIDFieldName, groupFieldName]
                for field in stddevStatsFields:        
                    arcpy.AddField_management(groupSummary, field, "DOUBLE")
                cursorFields.extend(stddevStatsFields)    
                with arcpy.da.UpdateCursor(groupSummary, cursorFields) as cursor:
                    try:
                        while(1):
                            row = next(cursor)
                            #arcpy.AddMessage("Row :{}".format(row))
                            currFieldValue = row[0]
                            resp = statGen.standardDeviation(stddevFields, currFieldValue)
                            #arcpy.AddMessage("resp:{}".format(resp))
                            number_rows = len(list(resp.keys()))
                            for i in range(number_rows):
                                 newRow = row[0:2]
                                 #arcpy.AddMessage("newRow:{}".format(newRow))
                                 newRow.extend(resp[row[1]])
                                 cursor.updateRow(newRow)
                                 row = next(cursor)
                    except StopIteration:
                        pass           

        #compute fieldnames for calculating minorityMajority and percentShape
        if minMajority or percentShape:
            if "point" in shapeFieldName.lower():
                tblShpFieldName = "Frequency"
            else:
                tblShpFieldName = shapeFieldName
            lyrShpFieldName = fieldInfo["shapeField"][0]

        # calculate percentshape if needed
        if percentShape:

            newFields = addPercentShape(wkspc, groupSummary, withinLayerFIDFieldName,
                                        tblShpFieldName, summarizedOutput,
                                        "OID@", lyrShpFieldName, lengthAreaUnits)
            fieldInfo["tblPercentShapeField"] = newFields
            percentShpFieldName = newFields[0]
            startTime = analysisutils.AddTimerMessage(startTime, "Added Percentage Shape")
        else:
            percentShpFieldName = None

        if minMajority:
            newFields = addMinorityMajority(withinLayerFIDFieldName, groupFieldName,
                                groupSummary, summarizedOutput, tblShpFieldName,
                                percentShape, percentShpFieldName)
            fieldInfo["minMajorityFields"] = newFields

            startTime = analysisutils.AddTimerMessage(startTime, "Added Minority Majority")

        # clean_up fields that are not needed and rename others
        deleteFields = []
        renameGroupByTableFields = []        
        if (countLengthArea):
            if summarizeLayerShapeType.lower() == 'point':                
                #Rename frequency to count_points  
                #shapeFieldName = "{}_{}".format(shapeFieldName, groupFieldName)
                #shapeFieldAlias = "{} {}".format(shapeFieldAlias, groupFieldName)
                renameGroupByTableFields.append(("Frequency", shapeFieldName, shapeFieldAlias))
                fieldInfo["tblShapeField"] = (shapeFieldName, shapeFieldAlias, "Long")
                renameTableFields.pop(0)
            else:
                fieldInfo["tblShapeField"] = (shapeFieldName, shapeFieldAlias, "Double")
                deleteFields.append("Frequency")
        
        renameGroupByTableFields.append((withinLayerFIDFieldName, "Join_ID", "Join ID"))
        # rename the stats field again on the groupBy table
        renameGroupByTableFields.extend(renameTableFields)
        fieldInfo["tblJoinIDField"] = ("Join_ID", "Join ID", "Long")

        if countField:
            deleteFields.append(countField)
        if deleteFields:
            arcpy.DeleteField_management(groupSummary, deleteFields)
        if renameGroupByTableFields:
            #arcpy.AddMessage(renameGroupByTableFields)
            analysisutils.renameFields(groupSummary, renameGroupByTableFields)
        startTime = analysisutils.AddTimerMessage(startTime, "Created GroupBySummary Layer")


        # Finally, add Join_ID field to the layer if groupByField is provided

        fieldName, fieldAlias = analysisutils.createUniqueFieldName(summarizedOutput, "Join_ID", "JOIN ID")
        arcpy.AddField_management(summarizedOutput,fieldName, "LONG","#","#","#", fieldAlias)
        expression = "!{}!".format(descSummarizedOutput.OIDFieldName)
        arcpy.CalculateField_management(summarizedOutput, fieldName, expression, "PYTHON")
        fieldInfo["layerJoinIDField"] = (fieldName, fieldAlias, "Long")
        startTime = analysisutils.AddTimerMessage(startTime, "Created Join_ID field ")

    return startTime, fieldInfo


if __name__ == '__main__':

    pass

##    arcpy.env.overwriteOutput = True
##    arcpy.env.workspace = r"C:\Users\arok5348\Documents\ArcGIS\Projects\SummarizeTools\UnitedStates.gdb"
##    arcpy.env.scratchGDB = r"D:\MinorityMajority\scratch"
##    startTime = time.time()
##    withinLayer = r"States"
##    summarizeLayer = r"OneCounty"
##    summarizeLayerShapeType = "Polygon"
##    summarizedOutput = r"C:\Users\arok5348\Documents\ArcGIS\Projects\SummarizeTools\SummarizeTools.gdb\xyzOut"
##    keepEmptyBoundaries = False
##    countLengthArea = True
##    lengthAreaUnits = "SQUAREKILOMETERS"
##    summaryFields = [["SHAPE_Length", "Mean"],["SHAPE_Length","Min"]]
##    groupFieldName = ""
##    minMajority = False
##    percentShape = False
##    groupSummary = ""
##    summarizeWithin(startTime,
##                    withinLayer,
##                    summarizeLayer,
##                    summarizeLayerShapeType,
##                    summarizedOutput,
##                    keepEmptyBoundaries,
##                    countLengthArea,
##                    lengthAreaUnits,
##                    summaryFields,
##                    groupFieldName,
##                    minMajority,
##                    percentShape,
##                    groupSummary,
##                    arcpy.env.scratchGDB)
