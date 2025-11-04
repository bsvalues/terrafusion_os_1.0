from __future__ import unicode_literals
import os
import arcpy
import analysisutils
import time
from minMajority import addPercentShape, addMinorityMajority
#import debugUtils

def aggregatePoints(startTime, pointLayer, polygonLayer,
                    keepEmptyBoundaries, summaryFields,
                    groupFieldName, minMajority, percentPoints, aggregatedPolygons,
                    aggregatedTable, wkspc):
    
    """Aggregates Points and its attributes for given polygons"""
        
    # create dictionary for new fields that will be created thro the script
    fieldInfo = {}

    point_layer = os.path.join(wkspc, "pointlayer")
    arcpy.CopyFeatures_management(pointLayer, point_layer)
    polygon_layer = os.path.join(wkspc, "polygonlayer")
    arcpy.CopyFeatures_management(polygonLayer, polygon_layer)
    pointLayer = point_layer
    polygonLayer = polygon_layer
    
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
                               boundaryOption,fieldMappings)

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
    fieldInfo["shapeField"] = (ptCountFieldName, ptCountAlias, "Long")
    
    if groupFieldName :    
        joinidFldName, joinidalias = analysisutils.createUniqueFieldName(aggregatedPolygonsFields,
                                                              "Join_ID", "Join ID",
                                                              aggregatedPolygonsFields)
        toBeRenamedFields.append((targetFID, joinidFldName, joinidalias))
        fieldInfo["layerJoinIDField"] = (joinidFldName, joinidalias, "Long")
    else:        
        arcpy.DeleteField_management(aggregatedPolygons, targetFID)
    analysisutils.renameFields(aggregatedPolygons, toBeRenamedFields)
    startTime = analysisutils.AddTimerMessage(startTime, "Delete fields")  

    if groupFieldName:
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
        groupingFields = u"{};{}".format(targetFID, groupFieldName)
        arcpy.Statistics_analysis(oneToManyPolygonOutput, aggregatedTable,
                                  calculateStats, groupingFields)
        startTime = analysisutils.AddTimerMessage(startTime, "Summary Statistics")  
        # get accurate field names for further processing
        aggregatedTableFields = arcpy.ListFields(aggregatedTable)
        sumJoinCount = analysisutils.getAccurateFieldName(aggregatedTableFields, "Sum_Join_Count")
        
        # Convert Sum_Join_count field name to Point_Count for consistency.
        # Need not verify unique name for these fields 
        #since the table is created only with new fields
        ptCountFldName_tbl = "Point_Count"
        ptCountAlias =  "Count of Points"
        fieldInfo["tblShapeField"] = (ptCountFldName_tbl, ptCountAlias, "Long")
        fieldInfo["tblJoinIDField"] = ("Join_ID", "Join ID", "Long")
        fieldsToBeRenamed = [(sumJoinCount, ptCountFldName_tbl, ptCountAlias),
                             (targetFID, "Join_ID", "Join ID")]
        if summaryFields:
            for fname, stats in summaryFields:
                fAlias = analysisutils.getSummaryAliasField(fname, stats)
                fieldName = "{}_{}".format(stats,fname)
                fieldName = fieldName.lower()
                fieldName = fieldName.replace("stddev","std")
                fieldsToBeRenamed.append((fieldName, "#", fAlias))
        
        analysisutils.renameFields(aggregatedTable, fieldsToBeRenamed)
        # if percentPoints add percentPoints field in aggregatedTableOutput
        if percentPoints:
            percentField = addPercentShape(wkspc, aggregatedTable,
                                            "Join_ID", ptCountFldName_tbl,
                                            aggregatedPolygons, joinidFldName,
                                            ptCountFieldName) 
            fieldInfo["tblPercentShapeField"] = percentField
            percentFieldName = percentField[0]
            startTime = analysisutils.AddTimerMessage(startTime, "Percentage points")  
        else:            
            percentFieldName = None
            
        if minMajority:
            tblFidFieldName = fieldInfo["tblJoinIDField"][0]            
            lyrFidFieldName = fieldInfo["layerJoinIDField"][0]
            #debugUtils.debugFields(aggregatedTable)
            newFields = addMinorityMajority(tblFidFieldName, groupFieldName,
                                aggregatedTable, aggregatedPolygons, 
                                ptCountFldName_tbl,
                                percentPoints, percentFieldName, lyrFidFieldName)
            fieldInfo["minMajorityFields"] = newFields
        #remove unnecessary fields
        arcpy.DeleteField_management(aggregatedTable, "FREQUENCY")
        startTime = analysisutils.AddTimerMessage(startTime, "Groupby delete Fields")  
    return startTime, fieldInfo   

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
