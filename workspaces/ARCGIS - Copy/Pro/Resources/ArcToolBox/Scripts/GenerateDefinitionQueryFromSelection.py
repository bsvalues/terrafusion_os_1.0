"""
Tool Name:  Generate Definition Query From Selection
Source Name: GenerateDefinitionQueryFromSelection.py
Version: ArcGIS Pro 3.4
Author: ESRI

Description:
         This tool takes a feature layer or standalone table, and it generate a definition query 
		 using the selected features or rows.
"""

import arcpy
import GenerateDefinitionQueryFromSelectionUtils

# Global variables
valid_field_types = ['String', 'SmallInteger', 'Integer', 'BigInteger', 'Guid', 'GlobalID']


# Main module
#
def main():
    selectionLayer = arcpy.GetParameter(0)
    method = arcpy.GetParameterAsText(1)
    fieldParam = arcpy.GetParameterInfo()[2]
    defQueryName = arcpy.GetParameterAsText(3)
    invertWhereClause = arcpy.GetParameter(4)
    appendActiveQuery = arcpy.GetParameter(5)
    overwriteWhereClause = arcpy.GetParameter(6)
    whereClause = arcpy.GetParameterAsText(7)

    # Generate where clause when value not passed in. 
    # Typically when the tool is called from python command line
    # When overwriteWhereClause is false or user passed in whereClause is empty, auto-generate where clause
    autoGenerateWhereClause = not overwriteWhereClause or not whereClause.strip()
    
    if autoGenerateWhereClause:
        layerDesc = arcpy.Describe(selectionLayer)
        fieldName = ""
        fieldType = ""
        if method == "MATCH_SELECTION":
            if hasattr(layerDesc, "globalIDFieldName") and layerDesc.hasGlobalID:
                fieldName = layerDesc.globalIDFieldName
                fieldType = "GlobalID"
            else:  
                fieldName = layerDesc.OIDFieldName # picking the objectid field in this case
                fieldType = "OID"
        else:
            fieldName = fieldParam.valueAsText
            if not fieldName:  #make sure the value is not empty
                arcpy.AddIDMessage('ERROR', 45030, fieldParam.name, "USE_FIELD_VALUES")
            if not fieldName.strip(): #make sure the value is not empty
                arcpy.AddIDMessage('ERROR', 45030, fieldParam.name, "USE_FIELD_VALUES")
            
            flds = [fld for fld in layerDesc.fields if fld.name.lower() == fieldName.lower()]
            if len(flds)  == 0:  #throwing error if field is not found
                arcpy.AddIDMessage('ERROR', 417)

            fieldType = flds[0].type
            if fieldType not in valid_field_types: #checking if the field type is one of acceptable types
                arcpy.AddIDMessage('ERROR', 640, fieldName, '[' + ', '.join(valid_field_types) + ']')
        
        whereClause = GenerateDefinitionQueryFromSelectionUtils.generateSQLWhereClause(selectionLayer, fieldName, fieldType, invertWhereClause)

    # updating the layer or standalone table's definition query with the where-clause
    activeDefQuery = selectionLayer.definitionQuery
    if appendActiveQuery and activeDefQuery: #when asked, appending the where clause from the active definition query
        whereClause = "({}) AND ({})".format(activeDefQuery, whereClause)

    defQueries = selectionLayer.listDefinitionQueries()
    for dq in defQueries:
        dq["isActive"] = False
    defQueries.append({'name': defQueryName, 'sql': whereClause, 'isActive': True}) #making the new definition query the active one
    selectionLayer.updateDefinitionQueries(defQueries)

    arcpy.SetParameter(8, selectionLayer)


if __name__ == "__main__":
    main()