"""
Name: GenerateDefinitionQueryFromSelectionUtils.py
Version: ArcGIS Pro 3.4
Author: ESRI

Description:
     A utility module meant to be used by GenerateDefinitionQueryFromSelection tool to Generate SQL where clause
"""
import arcpy

# Global variables
max_inClause_size = 1000


def generateSQLWhereClause(layer, fieldName, fieldType, invertWhereClause):
    if not layer.getSelectionSet():
        raise Exception("No features currently selected.")

    ##   generating unique values from a field
    foundNull = False
    uniqueValueSet = set()
    
    for row in arcpy.da.SearchCursor(layer, fieldName):
        if row[0] == None:
            foundNull = True  #not including NULL values in this list
        else:
            uniqueValueSet.add(row[0])
    
    #generating a list with ordered unique values
    sortedValues = list(uniqueValueSet)
    sortedValues.sort()
    
    #breaking them into small chunks to get around some databases' IN operator limitation
    chunks = [sortedValues[i:i + max_inClause_size] for i in range(0, len(sortedValues), max_inClause_size)]
    
    ##   Build a where clause
    subclause_array = []
    if foundNull:  #add an additional clause to include or exclude rows with null value
        subclause_array.append("{} IS {}NULL".format(fieldName, 'NOT ' if invertWhereClause else ''))

    for sublist in chunks:
        subclause = "{} {}IN ".format(fieldName, 'NOT ' if invertWhereClause else '')
        if fieldType in ['String', 'GlobalID', 'Guid']:
            # surrounding value with single quote for string values
            # and escape a single quote with another single quote
            subclause = subclause + "('" + "','".join([s.replace("'", "''") for s in sublist]) + "')"
        else:
            subclause = subclause + "(" + ",".join([str(i) for i in sublist]) + ")"
        subclause_array.append(subclause)
    
    return "(" + (") AND (" if invertWhereClause else ") OR (").join(subclause_array) + ")"

