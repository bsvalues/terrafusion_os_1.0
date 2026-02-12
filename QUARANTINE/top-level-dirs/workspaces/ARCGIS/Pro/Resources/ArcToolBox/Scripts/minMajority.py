from __future__ import unicode_literals
import sys
import os
import analysisutils
import arcpy
from operator import itemgetter

class MinMaxBin(object):
    ''''class for calculating uniquevalue for each field for a given polygon fid'''

    def __init__(self, polyCursor, minMajorityPercent):
        self.minGroupByFieldText = [""]
        self.maxGroupByFieldText = [""]  
        self.minValue = sys.maxsize
        self.maxValue = -1
        self.maxPercent = None
        self.minPercent = None      
        self.isPercent = minMajorityPercent
        self.cursor = polyCursor        

    def updateMinMax(self, groupByFieldText, shapeValue, shapePercent=None):
        '''updates min max values, fields and total'''
        
        if not isinstance(groupByFieldText, str):
            groupByFieldText = str(groupByFieldText)
        if shapeValue > self.maxValue:
            self.maxValue = shapeValue
            self.maxPercent = shapePercent                       
            self.maxGroupByFieldText = [groupByFieldText]
        elif shapeValue == self.maxValue:
            self.maxGroupByFieldText.append(groupByFieldText)
        if shapeValue < self.minValue:
            self.minValue = shapeValue
            self.minPercent = shapePercent
            self.minGroupByFieldText = [groupByFieldText]
        elif shapeValue == self.minValue:
            self.minGroupByFieldText.append(groupByFieldText)                   
        #arcpy.AddMessage("minValue: {}, maxValue: {}, minFieldValue: {} , maxFieldValue :{}".format(
        #self.minValue, self.maxValue, self.minGroupByFieldText, self.maxGroupByFieldText))

    def updatePolygonRow(self, polygonFID):
        '''update the row in the cursor with FID == polygonFID'''
        try:
            while True:
                row = next(self.cursor)                                    
                if row[0] == polygonFID:
                    break;
            row[1] = ";".join(self.minGroupByFieldText)
            row[2] = ";".join(self.maxGroupByFieldText)
            if self.isPercent:
                row[3] = self.minPercent
                row[4] = self.maxPercent
            self.cursor.updateRow(row)
        except StopIteration:
            #arcpy.AddMessage("Stop Iteration Exception when updating minority, majority")
            raise Exception
    


def addMinorityMajority(fidFieldName, groupByFieldName, groupByTable,
                        outputPolygon, shapeFieldName="Frequency",
                        minMajorityPercent=True, percentShpFieldName="PercentCount", 
                        lyrFIDField="OID@"):        
    '''adds both minority and majority fields based on groupByFieldName'''    
    # keeps track of all the new fields that are added in the routine
    newFields = []    

    # Add minority, Majority Fields
    tblCursorFields = [fidFieldName, groupByFieldName, shapeFieldName]
    polygonCursorFields =[lyrFIDField]
    newFieldName = "Minority_{}".format(groupByFieldName)
    newAlias = newFieldName.replace("_", " ")    
    fieldName, alias = analysisutils.createUniqueFieldName(outputPolygon, newFieldName, newAlias)
    arcpy.AddField_management(outputPolygon, fieldName ,"TEXT","#","#",10000, alias)    
    newFields.append((fieldName,alias, "Text"))
    polygonCursorFields.append(fieldName)
    newFieldName = "Majority_{}".format(groupByFieldName)    
    newAlias = newFieldName.replace("_", " ")
    fieldName, alias = analysisutils.createUniqueFieldName(outputPolygon, newFieldName, newAlias)
    arcpy.AddField_management(outputPolygon, fieldName ,"TEXT","#","#",10000, alias)
    newFields.append((fieldName,alias, "Text"))
    polygonCursorFields.append(fieldName)

    # Add percent fields
    if minMajorityPercent:
        newFieldName = "Minority_{}_Percent".format(groupByFieldName)
        newAlias = newFieldName.replace("_", " ")    
        fieldName, alias = analysisutils.createUniqueFieldName(outputPolygon, newFieldName, newAlias)
        arcpy.AddField_management(outputPolygon, fieldName ,"DOUBLE","#","#","#", alias)    
        newFields.append((fieldName, alias, "Double"))
        polygonCursorFields.append(fieldName)
        newFieldName = "Majority_{}_Percent".format(groupByFieldName)    
        newAlias = newFieldName.replace("_", " ")
        fieldName, alias = analysisutils.createUniqueFieldName(outputPolygon, newFieldName, newAlias)
        arcpy.AddField_management(outputPolygon, fieldName ,"DOUBLE","#","#","#", alias)
        newFields.append((fieldName, alias, "Double"))
        polygonCursorFields.append(fieldName)
        tblCursorFields.append(percentShpFieldName)

    #Use cursors to update min/majority fields
    currentPolygonFID = 0
    minMaxBin = None
    with arcpy.da.UpdateCursor(outputPolygon, polygonCursorFields) as polygonCursor:   
        # Also, open search cursor on interect output class to evaluate min/max
        with arcpy.da.SearchCursor(groupByTable, tblCursorFields) as tableCursor:            
            for tableRow in sorted(tableCursor, key=itemgetter(0)):   
                # first time ever set values and skip this iteration
                if tableRow[0] != currentPolygonFID:   
                    if currentPolygonFID:  # if it's not first row
                        # check polygon fid and update polygon cursor accordingly with min/max values
                        minMaxBin.updatePolygonRow(currentPolygonFID)
                    # update id
                    currentPolygonFID = tableRow[0]
                    # create new bins for next fid
                    minMaxBin = MinMaxBin(polygonCursor, minMajorityPercent)
                if minMaxBin:  # Added to address Coverity CID 278242
                    minMaxBin.updateMinMax(*tableRow[1:])
            # one final write for the last set of records.
            if minMaxBin:
                minMaxBin.updatePolygonRow(currentPolygonFID)
    return newFields

def addPercentShape(wkspc, tableOutput, tblJoinID, tblShpFieldName, 
                    outputPoly, lyrJoinID, lyrShpFieldName, sumUnits=None):
    '''adds percentshape to the given table based on shapeFieldname'''



    #summarize within have not renamed field to point_count yet
    #so had to include frequency as well
    fldName = tblShpFieldName.lower()
    isPolygon = False
    if "count" in fldName or "frequency" in fldName:
        percentageFieldAlias = "Percent of point count"
        percentageFieldName = "PercentCount" 
    elif "length" in fldName:
        percentageFieldAlias = "Percent length"
        percentageFieldName = "PercentLength" 
    elif "area" in fldName:
        isPolygon= True
        percentageFieldAlias = "Percent area"
        percentageFieldName = "PercentArea"         
    else:
        percentageFieldAlias = "percent shape"
        percentageFieldName = "PercentShape"
    #cheap cheat for nearby
    #if "nearby" in tableOutput.lower():
        #percentageFieldAlias = percentageFieldAlias.replace("overlapping",
                                        #"nearby")        
    #arcpy.AddMessage("percent field name : {}".format(percentageFieldName))
    arcpy.AddField_management(tableOutput,percentageFieldName, "DOUBLE",
                              "#", "#", "#", percentageFieldAlias, "NULLABLE", 
                              "NON_REQUIRED", "#")    

    outputPolyFields = [lyrJoinID, lyrShpFieldName]
    if isPolygon:
        outputPolyFields.append("shape@")
    currentTableRowID = 0
    #arcpy.AddMessage(outputPolyFields)
    with arcpy.da.UpdateCursor(tableOutput, [tblJoinID, tblShpFieldName, percentageFieldName]) as tblCursor:
        with arcpy.da.SearchCursor(outputPoly, outputPolyFields) as lyrCursor:
            for tblRow in tblCursor:
                if currentTableRowID != tblRow[0]:                                        
                    while True:
                        lyrRow = next(lyrCursor)
                        if tblRow[0] == lyrRow[0]:
                            if isPolygon:
                                shpGeom = lyrRow[2]
                                totalShape = float(shpGeom.getArea("PRESERVE_SHAPE", sumUnits))
                            else:
                                totalShape = lyrRow[1]
                            break
                    currentTableRowID = tblRow[0]
                if totalShape:
                    tblRow[2] = (float(tblRow[1])/float(totalShape))*100.0
                else:
                    tblRow[2] = 0.0
                tblCursor.updateRow(tblRow) 
    return percentageFieldName, percentageFieldAlias , "DOUBLE"
