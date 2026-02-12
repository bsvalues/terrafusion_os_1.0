import popup
import aolutils
import arcpy
import rendererUtils
import debugUtils
import math
import os

import importlib
importlib.reload(rendererUtils)
importlib.reload(popup)
importlib.reload(aolutils)


ALT_TEXT = {"Min": "Minimum", "Max": "Maximum", "Mean": "Average",
            "Sum": "Sum", "Stddev": "Standard Deviation"}


def verifySummaryToolParams(sumShape, sumUnits, summaryFields, 
                           summarizeLayer, summarizeLayerShapeType,
                           summarizeLayerName,
                           groupFieldName, errorMsg):
    isValid = []
    # verify sufficient input parameters
    if not sumShape and len(summaryFields) == 0 :
        aolutils.AddErrorCode(100019, errorMsg[100019])        
        isValid.append(False)
   
    
    # verify units based on geometry type
    if sumShape:
        if sumUnits and not verifyUnitsFields(summarizeLayerShapeType,
                                                               sumUnits):
            msg = errorMsg[100018].format(sumUnits, summarizeLayerShapeType)
            aolutils.AddErrorCode(100018, msg, {"sumUnits":sumUnits,
                                                "shapeType":summarizeLayerShapeType})
            isValid.append(False)
    
           
    # verify summaryFields exist in summarizeLayer   
    fieldList = arcpy.ListFields(summarizeLayer)
    if summaryFields:
        msgs = verifySummaryFields(fieldList, summaryFields, errorMsg)
        if msgs:
            for msg in msgs:
                aolutils.AddErrorCode(*msg)
            isValid.append(False)     
    
    # verify groupBy Field in summarizeLayer
    if groupFieldName:
        res = verifyGroupByField(groupFieldName, fieldList, errorMsg, summarizeLayerName)        
        isValid.append(res)    
    return isValid

def verifyGroupByField(fieldName,fieldList, errorMsgs, layerName):
    '''verifies groupbyField'''
    if aolutils.verifyFieldExists("", fieldName, fieldList):
        fTypes = dict([(f.name.lower(),f.type.lower()) for f in fieldList])       
        if fTypes[fieldName.lower()] not in ["integer", "smallinteger","string", "date", "text"]:
            msg = errorMsgs[100125].format(fieldName)
            aolutils.AddErrorCode(100125, msg, {"fieldName":fieldName})            
            return False       
    else:        
        msg = errorMsgs[100052].format(fieldName, layerName)
        aolutils.AddErrorCode(100052, msg, {"paramName":layerName})
        return False
    return True
        
#checkGroupBytable exists:


def checkForEmptyGroupByTable(outTable):
    '''returns True if the table is empty'''
    res = arcpy.GetCount_management(outTable)
    count = int(res.getOutput(0))
    if count > 0 :
        return False
    else:
        return True
      
        
def findSumShapeFieldName(shapeType, sumUnits):
    '''Finds the summarizeShape's field name for given geometry type and units'''

    # treat MultiPoints similar to points
    if shapeType == "esriGeometryMultipoint":
        shapeType = "esriGeometryPoint"

    classificationFieldNames = {"esriGeometryPoint":["Point_Count","Count of points"],	                            
                                "esriGeometryPolyline":["SUM_Length","Summarized length in"],
                                "esriGeometryPolygon":["SUM_Area", "Summarized area in"]}
    fieldname = classificationFieldNames[shapeType][0]	
    fieldalias = classificationFieldNames[shapeType][1]	
    if shapeType != "esriGeometryPoint":
        if sumUnits:
            unitsSuffix = sumUnits
        else:
            if shapeType == "esriGeometryPolyline":
                unitsSuffix = "Kilometers"
            elif shapeType == "esriGeometryPolygon":
                unitsSuffix = "SquareKilometers"
        fieldname = u"{}_{}".format(fieldname, unitsSuffix)
        fieldalias = u"{} {}".format(fieldalias,unitsSuffix.replace("Square","Square "))
    return fieldname, fieldalias

# End def findSumShapeFieldName 	

def getPopupFields(popupInfo, descSummarizedLayer, fieldInfo):
    '''Creates appropriate popup content'''   
    # omit fid, shape
    layerFields = descSummarizedLayer.fields
    layerOIDField = descSummarizedLayer.OIDFieldName.lower()
    layerShapeField = descSummarizedLayer.shapeFieldName.lower()
    analysisArea = "analysisarea"
    toOmitFieldNames = [layerShapeField, layerOIDField, analysisArea]
    # Add summarized shape field
    if "shapeField" in fieldInfo.keys():
        shapeFieldName, shapeFieldAlias, shapeFieldType = fieldInfo["shapeField"] 
        if shapeFieldType.lower() == "long":
            popupInfo.addFieldInfo(shapeFieldName,shapeFieldAlias)
        else:
            popupInfo.addFieldInfo(shapeFieldName,shapeFieldAlias,True,4)
        toOmitFieldNames.append(shapeFieldName.lower())			
    # Add summary fields
    if "summaryFields" in fieldInfo.keys():        
        for fName,fAlias, fType in fieldInfo["summaryFields"]:             
            if fType.lower() == "double" :                
                popupInfo.addFieldInfo(fName,fAlias,True,4)
            else:
                popupInfo.addFieldInfo(fName, fAlias)
            toOmitFieldNames.append(fName.lower())  
    #Add minMajority fields and percentShape
    if "minMajorityFields" in fieldInfo.keys():
        for name, alias, ftype in fieldInfo["minMajorityFields"]:
            popupInfo.addFieldInfo(name, alias)
            toOmitFieldNames.append(name.lower())        
        
    # Add all other fields    	
    for field in layerFields:
        if field.name.lower() not in toOmitFieldNames: 						
            label = field.aliasName.replace("_"," ")
            if field.type.lower() == "double":								
                popupInfo.addFieldInfo(field.name,label,True,4)
            else:
                popupInfo.addFieldInfo(field.name,label)
    return                                      

# End def getPopupContent 


def getPopupContent(descSummarizedLayer, summarizeLayerName, fieldInfo, relTableId=None, relTableFields=None):
    '''creates popup fields and charts'''   
    
    title =  u"Summary of {}".format(summarizeLayerName)
    popupInfo = popup.PopupInfo(title)	                             
    getPopupFields(popupInfo, descSummarizedLayer, fieldInfo) 
    
    if "groupByField" in fieldInfo.keys():
        #Add groupbyfield from the table(invisible);specification requirement     
        groupByField = fieldInfo["groupByField"][0]
        popupInfo.addFieldInfo(groupByField, groupByField, visible=False, relTableId=relTableId)
        
        
        if "tblPercentShapeField" in fieldInfo.keys():
            ##Add field from the table(invisible);specification requirement  
            percentFieldName, pAlias, pType = fieldInfo["tblPercentShapeField"]                       
            ##Add chart
            if "area" not in pAlias.lower():                
                title= "{} by {}".format(pAlias, groupByField)
                fieldNames = [percentFieldName]
                tooltipField = groupByField
                popupInfo.addFieldInfo(percentFieldName, pAlias, True,
                                       visible=False, relTableId=relTableId)
                popupInfo.addMediaInfo(title, fieldNames, tooltipField, chart_type="piechart", relTableId=relTableId)
            
        if "tblShapeField" in fieldInfo.keys():
            
            shpFieldName, shpFieldAlias, ftype = fieldInfo["tblShapeField"]
            if ftype.lower() == "long":
                popupInfo.addFieldInfo(shpFieldName, shpFieldAlias,
                                       visible=False, relTableId=relTableId)
                shpFieldAlias = shpFieldAlias.replace(groupByField, "")
            else:
                popupInfo.addFieldInfo(shpFieldName, shpFieldAlias, True,4,
                                       visible=False, relTableId=relTableId)
            #Add sumshape chart
            title= "{} by {}".format(shpFieldAlias, groupByField)
            fieldNames = [shpFieldName]
            tooltipField = groupByField
            popupInfo.addMediaInfo(title, fieldNames, tooltipField, relTableId=relTableId)
        
        if "summaryFields" in fieldInfo.keys():                       
            for fName,fAlias,fType in fieldInfo["summaryFields"]:                 
                #Add stats field from table(invisible);specification requirement
                if fType.lower() == "double" :                
                    popupInfo.addFieldInfo(fName,fAlias,True,4, visible=False, relTableId=relTableId)
                else:
                    popupInfo.addFieldInfo(fName,fAlias,visible=False, relTableId=relTableId)            
                #Add chart for summary field
                title = "{} by {}".format(fAlias, groupByField)                
                fieldNames = [fName]                
                popupInfo.addMediaInfo(title, fieldNames, groupByField, relTableId=relTableId)
                
                
    return popupInfo.getPopupInfo()  



def getDrawingInfo(hexGrids, fieldInfo, summarizedLayer, sumShape, summaryLyrShapeType=None, returnBoundaries=True):
    '''Updates renderer def in tool desc based on the sumShape and updatedSummFields
       summarizeShapeField gives the field, name and alias of newly created summary shape field name,
       it could be point_count, sum_length or sum_area	
    '''
    # Determine classification field, if sumShape use the sum shape fields else use the first statistics field
    
    if "withinLayerShapeType" in fieldInfo.keys():
        withinShpType = fieldInfo["withinLayerShapeType"]
    else:
        withinShpType = "Polygons"        
    summaryLyrShapeType = summaryLyrShapeType.lower()
    if "shapeField" in fieldInfo.keys():
        fieldname, fieldalias, fieldType = fieldInfo["shapeField"] 
    if "summaryFields" in fieldInfo.keys():
        summaryFields = fieldInfo["summaryFields"] 
    else:
        summaryFields = None

    if hexGrids:
        if sumShape:
            return rendererUtils.getGraduatedColorsInfo(summarizedLayer,fieldname)
        else:
            return rendererUtils.getGraduatedColorsInfo(summarizedLayer, summaryFields[0][0])

    if sumShape and "polygon" not in summaryLyrShapeType:
        # graduated symbols

        drawingInfo = rendererUtils.getGraduatedSymbolsInfo(summarizedLayer, fieldname, withinShpType)            
    elif summaryFields:
        # update classification field name to first statistics		             
        classificationField = summaryFields[0][0]        
        normalizationField = None
        # if statistics is sum normalized Class breaks Renderer	for polygon and lines		
        if "sum" in classificationField.lower() and "polygon" in summaryLyrShapeType and returnBoundaries:
            # Analysis Area
            normalizationField = "AnalysisArea"		

        if "polygon" in summaryLyrShapeType:
            # graduated colors on first statistics.
            drawingInfo = rendererUtils.getGraduatedColorsInfo(summarizedLayer, classificationField, normalizationField)	
        else:	
            drawingInfo = rendererUtils.getGraduatedSymbolsInfo(summarizedLayer,classificationField, withinShpType)           
            
    else:
        # graduated colors without Normalization   
        drawingInfo = rendererUtils.getGraduatedColorsInfo(summarizedLayer, fieldname)
        
    return drawingInfo

# End def defineRenderer

def verifySummaryFields(fieldList, summaryFields, errorMsgs):
    """Adds error messages if stats is invalid or fieldName does not exist in input_layer_info or numeric"""   
    stats = ["min","max","mean","sum","stddev"]    
    fields = dict([(f.name.lower(),f.type) for f in fieldList])
    returnMsgs = []    
    for (fieldName, summary) in summaryFields:
        if summary.lower() not in stats:
            msg = errorMsgs[100006].format(summary, fieldName)
            returnMsgs.append((100006, msg, {"summary":summary,"fieldName":fieldName}))           
        if fieldName.lower() not in fields:            
            msg = errorMsgs[100004].format(fieldName)            
            returnMsgs.append((100004, msg, {"fieldName":fieldName}))            
        elif fields[fieldName.lower()] not in ["Double", "Single", "Integer", "SmallInteger", "Date"]:
            msg = errorMsgs[100005].format(fieldName)
            returnMsgs.append((100005, msg, {"fieldName":fieldName}))
    return returnMsgs

def verifyUnitsFields(shapeType, units):
    shapeType = shapeType.lower()
    if 'point' in shapeType.lower():
        return True
    validUnits = {"polyline":["FEET", "KILOMETERS", "METERS", "MILES", "YARDS"],
                  "polygon": ["ACRES","HECTARES", "SQUAREFEET", "SQUAREKILOMETERS",
                              "SQUAREMETERS", "SQUAREMILES", "SQUAREYARDS"]}
    units = units.strip().upper()
    if units in validUnits[shapeType]:
        return True
    else:
        return False
    
def processResults(startTime, fieldInfo, layerParamPosition, tblParamPosition,
                   hostedgp, outputName, summarizedOutput, summarizeLayerName,
                   summarizeLayerShapeType, sumShape, groupFieldName, groupByTable,
                   hexGrids=False, returnBoundaries=True):
     
    #global summarizedOutput
    #global summarizeLayerShapeType
    #global groupFieldName
    #global sumShape
    #global returnBoundaries
    #global hostedgp
    
    #arcpy.AddMessage(fieldInfo)
    # create desc object to create popup and other info	
    descSummarizedOutput = arcpy.Describe(summarizedOutput)

    # get Drawing Info		
    
    drawingInfo = getDrawingInfo(hexGrids, fieldInfo, summarizedOutput, sumShape, 
                                summarizeLayerShapeType, returnBoundaries)	

    startTime = aolutils.AddTimerMessage(startTime, "Define renderer")		  


    # layerName
    layerName = "SummarizedOutput"
    
    #check if groupby returned output
    if groupFieldName:
        groupByTableDoesNotExist = checkForEmptyGroupByTable(groupByTable)                       
    else:
        groupByTableDoesNotExist = True       

    # 5. create output
    if groupByTableDoesNotExist:

        #Create Feature Service tool output
        toolOutput = aolutils.HostedToolResult(outputName)	
        # get popupInfo
        popupInfo = getPopupContent(descSummarizedOutput, summarizeLayerName, fieldInfo)        
        # create layer description
        layerOutDesc = aolutils.getOutDescription(layerName, 0, drawingInfo, popupInfo)	
        # add layer to feature service output
        toolOutput.addHostedOutput(descSummarizedOutput, layerOutDesc, layerParamPosition)			

    else:

        # define table and layer relationship def
        relationshipName = "groupBySummary"
        fieldList = descSummarizedOutput.fields
        layerKeyField = fieldInfo["layerJoinIDField"][0]
        
        tblKeyField = fieldInfo["tblJoinIDField"][0]
        lyrRelationshipDef = aolutils.getRelationshipDef(relationshipName, 1, layerKeyField)
        relationshipId = 0
        tblRelDef = aolutils.getRelationshipDef(relationshipName, relationshipId , tblKeyField, False)
        # create layer description
        descGroupByTable =  arcpy.Describe(groupByTable)
        tableFields = descGroupByTable.fields
        popupInfo = getPopupContent(descSummarizedOutput, 
                                             summarizeLayerName, fieldInfo, 
                                             relationshipId, tableFields)        


       
        layerOutDesc = aolutils.getOutDescription(layerName, 0, drawingInfo, 
                                                  popupInfo, [lyrRelationshipDef])	
        # create table description
        tableName = "GroupBySummary"
        tableOutDesc = aolutils.getOutDescription(tableName, 1, relationships=[tblRelDef])

        # Create Feature Service tool output	
        toolOutput = aolutils.HostedToolResult(outputName)	
        # add layer to feature service output
        toolOutput.addHostedOutput(descSummarizedOutput, layerOutDesc, layerParamPosition)	
        # add table to feature service output
        toolOutput.addHostedOutput(descGroupByTable, tableOutDesc, tblParamPosition)			
        #arcpy.AddMessage("created layer and table description")

    # create Feature Service
    startTime = toolOutput.generateHostedResult(hostedgp, startTime)
    
    return True
