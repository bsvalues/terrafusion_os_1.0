from __future__ import unicode_literals
import os
import arcpy
import analysisutils
import time
from minMajority import addPercentShape, addMinorityMajority


def aggregatePoints(startTime, pointLayer, polygonLayer,
                    keepEmptyBoundaries, summaryFields,
                    groupFieldName, minMajority, percentPoints, aggregatedPolygons,
                    aggregatedTable, wkspc):

    """Aggregates Points and its attributes for given polygons"""     

    #delete Intermediate FeatureClasses
    intermediateData = []
    # create dictionary for new fields that will be created thro the script
    fieldInfo = {}

    try:
        #arcpy.AddMessage("Aggregating Points")
        fieldMappings, newSummaryFields = analysisutils.createFieldMappings(pointLayer,
                                                                            polygonLayer,
                                                                            summaryFields,
                                                                            groupFieldName)
        # add new field names to fieldInfo
        if newSummaryFields:
            fieldInfo["summaryFields"] = newSummaryFields

        startTime = analysisutils.AddTimerMessage(startTime, "Field Mappings")  

        if (keepEmptyBoundaries):
            boundaryOption = "KEEP_ALL"
        else:
            boundaryOption = "KEEP_COMMON"

        arcpy.SpatialJoin_analysis(polygonLayer, pointLayer,
                                   aggregatedPolygons,"JOIN_ONE_TO_ONE",
                                   boundaryOption, fieldMappings)

        startTime = analysisutils.AddTimerMessage(startTime, "Spatial Join")  


        aggregatedPolygonsFields = arcpy.ListFields(aggregatedPolygons)
        # get accurate field names for further processing
        jnCount = analysisutils.getAccurateFieldName(aggregatedPolygonsFields, "Join_Count")
        targetFID = analysisutils.getAccurateFieldName(aggregatedPolygonsFields, "TARGET_FID")


        # Cleanup output 
        ptCountFieldName, ptCountAlias = analysisutils.createUniqueFieldName(aggregatedPolygons,
                                                                             "Point_Count",
                                                                             "Count of Points",
                                                                             aggregatedPolygonsFields)
        toBeRenamedFields = [(jnCount, ptCountFieldName, ptCountAlias)]
        fieldInfo["shapeField"] = (ptCountFieldName, ptCountAlias, "Integer")

        if groupFieldName :    
            joinidFldName, joinidalias = analysisutils.createUniqueFieldName(aggregatedPolygonsFields,
                                                                             "Join_ID", "Join ID",
                                                                             aggregatedPolygonsFields)
            toBeRenamedFields.append((targetFID, joinidFldName, joinidalias))
            fieldInfo["layerJoinIDField"] = (joinidFldName, joinidalias, "Integer")
        else:        
            arcpy.DeleteField_management(aggregatedPolygons, targetFID)
        analysisutils.renameFields(aggregatedPolygons, toBeRenamedFields)

        startTime = analysisutils.AddTimerMessage(startTime, "Delete fields")  

        if groupFieldName:            
            #arcpy.AddMessage("Aggregating Points based on group by field")
            fieldInfo["groupByField"] = (groupFieldName, groupFieldName, "TEXT")
            # newSummaryFields will not have any info in this case
            fieldMappings, newSummaryFields = analysisutils.createFieldMappings(pointLayer,
                                                                                polygonLayer,
                                                                                summaryFields,
                                                                                groupFieldName,
                                                                                "OneToMany")
            startTime = analysisutils.AddTimerMessage(startTime, "Groupby Field Mappings")  
            oneToManyPolygonOutput = os.path.join(wkspc,
                                                  "oneToManyPolygonOutput")
            intermediateData.append(oneToManyPolygonOutput)
            arcpy.SpatialJoin_analysis(polygonLayer, pointLayer,
                                       oneToManyPolygonOutput,
                                       "JOIN_ONE_TO_MANY",
                                       False,
                                       fieldMappings)
            startTime = analysisutils.AddTimerMessage(startTime, "Groupby Spatial Join")  

            # get accurate field names for further processing
            oneToManyPolygonOutputFields = arcpy.ListFields(oneToManyPolygonOutput)
            jnCount = analysisutils.getAccurateFieldName(oneToManyPolygonOutputFields, "Join_Count")
            targetFID = analysisutils.getAccurateFieldName(oneToManyPolygonOutputFields, "TARGET_FID")

            # Create a stats table from spatial join output \
            # Add Sum of Join_count stats \
            # along with other stats requested by user.
            calculateStats = "{} SUM;".format(jnCount)
            if summaryFields:
                calculateStats += ";".join([" ".join(stat) for stat in summaryFields])
                calculateStats = calculateStats.replace("Stddev","std")

            # Create grouping fields: Add TARGET_FID created from Spatial Join \
            # and groupingfield specified by user.
            groupingFields = "{};{}".format(targetFID, groupFieldName)
            arcpy.Statistics_analysis(oneToManyPolygonOutput, aggregatedTable,
                                      calculateStats, groupingFields)
            startTime = analysisutils.AddTimerMessage(startTime, "Summary Statistics")  
            # get accurate field names for further processing
            aggregatedTableFields = arcpy.ListFields(aggregatedTable)
            sumJoinCount = analysisutils.getAccurateFieldName(aggregatedTableFields, "Sum_Join_Count")

            # Convert Sum_Join_count field name to Point_Count for consistency.
            # Need not verify unique name for these fields 
            #since the table is created only with new fields
            ptCountFldName_tbl = "Point_Count_{0}".format(groupFieldName)
            ptCountAlias =  "Count of Points {0}".format(groupFieldName)
            fieldInfo["tblShapeField"] = (ptCountFldName_tbl, ptCountAlias, "Long")
            fieldInfo["tblJoinField"] = ("Join_ID", "Join ID", "Long")
            fieldsToBeRenamed = [(sumJoinCount, ptCountFldName_tbl, ptCountAlias),
                                 (targetFID, "Join_ID", "Join ID")]
            analysisutils.renameFields(aggregatedTable, fieldsToBeRenamed)
            # if percentPoints add percentPoints field in aggregatedTableOutput
            if percentPoints:
                percentField = addPercentShape(wkspc, aggregatedTable,
                                               "Join_ID", ptCountFldName_tbl,
                                               aggregatedPolygons, joinidFldName,
                                               ptCountFieldName) 
                fieldInfo["tblPercentShapeField"] = percentField
                percentFieldName = percentField[0]
                startTime = analysisutils.AddTimerMessage(startTime, "percentage points")
            else:
                percentFieldName = None
            if minMajority:
                tblFidFieldName = fieldInfo["tblJoinField"][0]
                lyrFidFieldName = fieldInfo["layerJoinIDField"][0]
                newFields = addMinorityMajority(tblFidFieldName, groupFieldName,
                                                aggregatedTable, aggregatedPolygons, 
                                                ptCountFldName_tbl,
                                                percentPoints, percentFieldName, lyrFidFieldName)
                fieldInfo["minMajorityFields"] = newFields
            #remove unnecessary fields
            arcpy.DeleteField_management(aggregatedTable, "FREQUENCY")
            startTime = analysisutils.AddTimerMessage(startTime, "Groupby Delete Fields")  
        return startTime, fieldInfo  
    except Exception:
        import traceback
        import sys
        msgs = traceback.format_exception(*sys.exc_info())[1:]
        for msg in msgs:
            arcpy.AddMessage(msg.strip()) 
    finally:
        if intermediateData:
            analysisutils.cleanupIntermediateData(intermediateData)


# End def aggregatePoints 

if __name__== '__main__':

    arcpy.env.overwriteOutput = True
    arcpy.env.scratchWorkspace = r"D:\MinorityMajority\scratch"   
    startTime = time.time()
    polygonLayer = r"D:\MinorityMajority\data\SFCrime.gdb\testPolygons"
    pointLayer = r"D:\MinorityMajority\data\SFCrime.gdb\CrimePoints_small"
    keepEmptyBoundaries = True
    summarizeLayerShapeType = "Point"
    aggregatedPolygons = r"D:\MinorityMajority\scratch\scratch.gdb\aggPoly"
    keepEmptyBoundaries = True   
    summaryFields = ""
    groupFieldName = "CrimeType"
    minMajority = True
    percentPoints = True
    aggregatedTable = r"D:\MinorityMajority\scratch\scratch.gdb\groupSummary"
    aggregatePoints(startTime, pointLayer, polygonLayer,
                    keepEmptyBoundaries, summaryFields,
                    groupFieldName, minMajority, percentPoints, aggregatedPolygons,
                    aggregatedTable)
