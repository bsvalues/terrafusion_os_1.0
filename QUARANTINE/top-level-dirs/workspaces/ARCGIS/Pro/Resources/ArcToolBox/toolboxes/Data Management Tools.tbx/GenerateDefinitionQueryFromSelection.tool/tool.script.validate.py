import arcpy
from datetime import datetime
import GenerateDefinitionQueryFromSelectionUtils

# Global variables
max_inClause_size = 1000
supported_data_types = ['FeatureLayer', 'TableView', 'AnnotationLayer', 'DimensionLayer']

def reset():
    arcpy.GetParameterInfo()[7].value = "" # resetting where clause parameter


class ToolValidator:
  # Class to add custom behavior and properties to the tool and tool parameters.

    def __init__(self):
        # Set self.params for use in other validation methods.
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        # Customize parameter properties. This method gets called when the
        # tool is opened.
        self.params[2].enabled = False
        self.params[3].value = "Query {}".format(datetime.now().strftime("%Y%m%d_%H%M%S"))
        self.params[5].enabled = False  #appendActiveQuery parameter
        self.params[7].enabled = False  #whereClause parameter


    def updateParameters(self):
        # Modify the values and properties of parameters before internal
        # validation is performed.
        inputTableParam = self.params[0]
        methodParam = self.params[1]
        fieldParam = self.params[2]
        queryNameParam = self.params[3]
        invertWhereClauseParam = self.params[4]
        appendActiveQuery = self.params[5]
        overwriteWhereClauseParam = self.params[6]
        whereClauseParam = self.params[7]
        
        # enabling/disabling some parameters
        methodParam.enabled =  not overwriteWhereClauseParam.value
        invertWhereClauseParam.enabled =  not overwriteWhereClauseParam.value
        whereClauseParam.enabled =  overwriteWhereClauseParam.value

        layer = inputTableParam.value
        if layer == None:  #bail out when a layer is not picked
            reset()
            return

        layerDesc = None
        if inputTableParam.altered:
            #bail out if layer doesn't have selection
            layerDesc = arcpy.Describe(layer)
            if (layerDesc.datatype not in supported_data_types) or (layer.getSelectionSet() == None):
                reset()
                return        

        if methodParam.altered: 
            fieldParam.enabled = (methodParam.value == "USE_FIELD_VALUES") and (not overwriteWhereClauseParam.value)
        
        
        fieldName = ""
        if methodParam.value == "MATCH_SELECTION":
            #give preference to globalID when exists over objectid field
            if hasattr(layerDesc, "globalIDFieldName") and layerDesc.hasGlobalID:
                fieldName = layerDesc.globalIDFieldName
            else:
                fieldName = layerDesc.OIDFieldName

            appendActiveQuery.value = appendActiveQuery.enabled = False
        else:
            if fieldParam.value:
                fieldName = fieldParam.valueAsText                    

            appendActiveQuery.enabled = True if layer.definitionQuery else False
        
        # bail out when field is not selected by user or auto detected
        if not fieldName.strip():
            reset()
            return
        
        # bail out when field is not found
        flds = [fld for fld in layerDesc.fields if fld.name.lower() == fieldName.lower()]
        if len(flds)  == 0:
            reset()
            return
        
        invertWhereClause = invertWhereClauseParam.value
        if overwriteWhereClauseParam.value: #display auto generated where clause to modify
            #only (re)generate if where clause is empty
            if not whereClauseParam.value :
                whereClauseParam.value = GenerateDefinitionQueryFromSelectionUtils.generateSQLWhereClause(layer, fieldName, flds[0].type, invertWhereClause)
            elif not whereClauseParam.value.strip():
                whereClauseParam.value = GenerateDefinitionQueryFromSelectionUtils.generateSQLWhereClause(layer, fieldName, flds[0].type, invertWhereClause)
        else:
            whereClauseParam.value = ""

        return

    def updateMessages(self):
        # Modify the messages created by internal validation for each tool
        # parameter. This method is called after internal validation.
        inputTableParam = self.params[0]
        queryNameParam = self.params[3]
        
        if inputTableParam.altered:
            layerDesc = arcpy.Describe(inputTableParam)
            if layerDesc.datatype not in supported_data_types:
                inputTableParam.setIDMessage("Error", 732, inputTableParam.name, inputTableParam.value)
                return
        
        if inputTableParam.value is not None:
            selectionSet = inputTableParam.value.getSelectionSet()
            if (not selectionSet):
                inputTableParam.setIDMessage("Error", 346)
            else:
                selectionCount = len(selectionSet)
                if selectionCount > 10000:
                    inputTableParam.setIDMessage("Error", 521)
        
        if queryNameParam.altered:
            defQNames = [dq["name"] for dq in inputTableParam.value.listDefinitionQueries() if dq["name"] == queryNameParam.value]
            if len(defQNames) != 0:
                queryNameParam.setIDMessage("Warning", 4007)

        return