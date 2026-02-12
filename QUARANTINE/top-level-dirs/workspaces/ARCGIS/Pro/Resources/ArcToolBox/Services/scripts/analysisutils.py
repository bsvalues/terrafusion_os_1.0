"""---------------------------------------------------------------------------
 Name:        analysisutils.py
 Purpose:     Helper functions for AGO analysis tasks.
 Author:      Esri, Inc.
 Created:     7/1/2013
 Copyright:   (c) Esri, Inc. 2013
---------------------------------------------------------------------------"""
from __future__ import unicode_literals
import arcpy
import time
import os
import json
import re
#import debugUtils

def verifyFieldExists(inputLayer, field_name):
    """Checks if a field exists."""
    if field_name.lower() in [f.name.lower() for f in arcpy.ListFields(inputLayer, field_name)]:
        return True
    else:
        return False

# End def fieldExists

def getAccurateFieldName(fieldList, baseFieldName):
    ''' field names in gdbs can be suffixed with _1 with the field name already exists.
    this method returns the fieldname with highest suffix in the fieldList.
    '''
    couldBeFields = [field.name for field in fieldList
                     if (field.name.lower() == baseFieldName.lower()) or
                     re.match(u"^{0}\_\d".format(baseFieldName), field.name)]
    
    if len(couldBeFields) > 0:
        couldBeFields.sort()
        return couldBeFields.pop()
    else:
        return None

# End def getAccurateFieldName


def __verifySummaryFields(input_layer, summaryFields):
    """Adds error messages if stats is invalid or fieldName does not exist in input_layer or numeric"""
    errorMsg = []
    for (fieldName, summary) in summaryFields:
        if summary.capitalize() not in ["Min","Max","Mean","Sum","Stddev"]:
            errorMsg.append((u"The Summary type {} provided for field {} is invalid".format(summary, fieldName),100006,
                             {"summary":summary,"fieldName":fieldName}))
        fields = [(f.name.lower(),f.type) for f in arcpy.ListFields(input_layer, fieldName)]
        if not fields:
            errorMsg.append((u"The field {} provided for Summary Fields does not exist".format(fieldName),\
                            100004,{"fieldName":fieldName}))
        elif fields[0][1] not in ["Double", "Single", "Integer", "SmallInteger"]:
            errorMsg.append((u"The field {} provided for Summary Fields is not numeric".format(fieldName),\
                            100005,{"fieldName":fieldName}))
    return errorMsg

def getOutputWkspc(inputLayer):
    '''returns in_memory/gdb workspace based on count'''
    res = arcpy.GetCount_management(inputLayer)
    count = int(res.getOutput(0))
    if count > 10:
        return arcpy.env.scratchGDB
    else:
        return "in_memory"

def verifySummaryFields(fieldList, summaryFields, errorMsgs):
    """Adds error messages if stats is invalid or fieldName does not exist in input_layer_info or numeric"""   
    stats = ["min","max","mean","sum","stddev"]    
    fields = dict([(f.name.lower(),f.type) for f in fieldList])
    returnMsgs = []    
    for (fieldName, summary) in summaryFields:
        if summary.lower() not in stats:
            msg = errorMsgs[100006].format(summary, fieldName)
            returnMsgs.append((100006, msg, {"summary":summary,"fieldName":fieldName}))           
        if fieldName.lower() not in fields.keys():            
            msg = errorMsgs[100004].format(fieldName)            
            returnMsgs.append((100004, msg, {"fieldName":fieldName}))            
        elif fields[fieldName.lower()] not in ["Double", "Single", "Integer", "SmallInteger"]:
            msg = errorMsgs[100004].format(fieldName)
            returnMsgs.append((100004, msg, {"fieldName":fieldName}))            
    return returnMsgs

def convertSummaryFieldstoArray(summaryFields):
    """Converts multivalue summary fields to array of arrays for easier processing"""
    sumFields = [summaryField.strip("'").split() for summaryField in summaryFields.split(';')]
    return [[sumField[0],sumField[1].capitalize()] for sumField in sumFields]

# End def convertSummaryFieldsToArray

def createUniqueFieldName(input_layer, field_name, field_alias, fieldList=None):
    """Return unique field name and field alias name."""
    fieldName = field_name
    if fieldList:
        fieldNames = [f.name.lower() for f in fieldList]
    else:
        fieldNames = [f.name.lower() for f in arcpy.ListFields(input_layer, field_name)]
    i = 0
    while (fieldName.lower() in fieldNames):
        i = i + 1        
        fieldName = "{0}_{1}".format(field_name, i)
    if i > 0 :
        field_alias = "{0} {1}".format(field_alias, i)    
    return fieldName, field_alias

# End def createUniqueFieldName

def createUniqueFieldNameThroInfo(input_layer_info, field_name, field_alias):
    """Return unique field name and field alias name when layerinfo is provided."""
    fieldNames = [f.name for f in input_layer_info.fields]
    i = 1
    while (field_name in fieldNames):
        field_name = u"{0}_{1}".format(field_name, i)
        field_alias = u"{0}_{1}".format(field_alias, i)
        i += 1
    return field_name, field_alias

# End def createUniqueFieldName


def renameFields(input_layer, replace_info):
    """Renames a field.
    Pass in a list tuples to rename multiple fields.
    e.g. [(fieldName, newFieldName, newFieldAlias)]
    """

    listOfFieldNames = []

    for field_name, newFieldName, newFieldAlias in replace_info:
        # Verify the new field name is unique.
        newFieldName, newFieldAlias = createUniqueFieldName(input_layer,
                                                            newFieldName,
                                                            newFieldAlias)
        arcpy.AlterField_management(input_layer, field_name,
                                    newFieldName,newFieldAlias)        
    return
# End def renameFields


def createFieldMappings(input_points_layer, input_polygons_layer,
                        summary_fields, group_field_name,
                        join_option="OneToOne"):
    """Create field mappings."""
    newSummaryFields = []    
    fieldMappings = arcpy.FieldMappings()
    # Add other field maps
    if join_option == "OneToOne":
        # Add polygon fields.
        fieldMappings.addTable(input_polygons_layer)

        if summary_fields:
            for sum_field in summary_fields:
                newFieldMap = arcpy.FieldMap()
                newFieldMap.addInputField(input_points_layer, sum_field[0])
                # Assign merge rule for fieldmap.
                newFieldMap.mergeRule = sum_field[1]
                # Assign name and alias name for output field
                outputField = newFieldMap.outputField
                if sum_field[1].lower() == "stddev":
                    outputField.name = u"{0}_{1}".format("STD", outputField.name)
                else:
                    outputField.name = u"{0}_{1}".format(sum_field[1].upper(), outputField.name)
                #outputField.aliasName = u"{0} {1}".format(sum_field[1], outputField.aliasName)
                outputField.aliasName = getSummaryAliasField(outputField.aliasName, sum_field[1])
                
                # Check if stats field name already exists in current field map.
                i = 0
                tName = outputField.name
                while (fieldMappings.findFieldMapIndex(tName) >= 0):
                    i = i+1
                    tName = u"{0}_{1}".format(outputField.name, i)
                if i > 0 :
                    outputField.name = u"{0}_{1}".format(outputField.name, i)
                    outputField.aliasName = u"{0} {1}".format(outputField.aliasName, i)
                    
                # Assign type for output field
                currField = arcpy.ListFields(input_points_layer,sum_field[0])[0]
                if sum_field[1] in ["Stddev","Mean","Sum"]:
                    outputField.type = "Double"
                    if currField.type == "SmallInteger":
                        outputField.scale = 0
                        outputField.precision = 0
                else:
                    outputField.type = currField.type                  
                newFieldMap.outputField = outputField
                fieldMappings.addFieldMap(newFieldMap)
                newSummaryFields.append((outputField.name, outputField.aliasName, outputField.type))
    else:
        # Add grouping field and stats field from the polygon layer \
        # without merge rules.
        newFieldMap = arcpy.FieldMap()
        newFieldMap.addInputField(input_points_layer, group_field_name)
        fieldMappings.addFieldMap(newFieldMap)
        # Create field maps for stats
        if summary_fields:
            for summaryField in summary_fields:
                newFieldMap = arcpy.FieldMap()
                newFieldMap.addInputField(input_points_layer, summaryField[0])
                # Check to avoid duplicate fields in field map.
                if (fieldMappings.findFieldMapIndex(newFieldMap.outputField.name) < 0):
                    fieldMappings.addFieldMap(newFieldMap)
    return fieldMappings, newSummaryFields

def AddTimerMessage(startTime, msg):
    currentTime = time.time()
    elapsedTime = currentTime - startTime
    arcpy.AddMessage("Timer: {0:.3f} {1}".format(elapsedTime,msg))
    return currentTime
# End def createFieldMappings

def selectFeaturesbyExtent(input_layer):
    '''selects features based on arcpy.env.extent'''
    extent = arcpy.env.extent
    #DebugExtent()
    if extent:
        pointsArr = arcpy.Array([extent.upperLeft,
                                 extent.upperRight,
                                 extent.lowerRight,
                                 extent.lowerLeft,
                                 extent.upperLeft])
        selectingPolygon = arcpy.Polygon(pointsArr, extent.spatialReference)
        arcpy.SelectLayerByLocation_management(input_layer,"INTERSECT",selectingPolygon)
    #else:
        #arcpy.AddMessage("Extent not available")

# End def selectFeaturesbyExtent


def DebugExtent():
    """Debug extent."""

    extent = arcpy.env.extent
    if not extent is None:
        sr = extent.spatialReference
        if not sr is None:
            factoryCode = sr.factoryCode
        else:
            factoryCode = 0
        extentMsg = "Extent: {},{},{},{},{}".format(extent.XMin, extent.YMin, extent.XMax, extent.YMax, factoryCode)
        #arcpy.AddMessage(extentMsg)

# End def DebugExtent

def createLayerWithHiddenFields(input_layer):
    '''creates a layer with all fields turned off'''

    fieldInfos = []
    for field in arcpy.ListFields(input_layer):
        visibleType = "HIDDEN"
        ratioType = "NONE"
        fieldInfo = "{0} {0} {1} {2}".format(field.name, visibleType, ratioType)
        fieldInfos.append(fieldInfo)

    #arcpy.AddMessage(str(fieldInfos))
    output_layer = "inLayer"
    arcpy.MakeFeatureLayer_management(input_layer, output_layer,"#","#",";".join(fieldInfos))
    return output_layer

def createLayerWithUseRatioPolicy(input_layer, summaryFields, groupByField=""):
    '''creates a layer with use ratio policy turned on for all the fields'''

    visibleFields = []
    if groupByField:
        uGroupByField = groupByField.upper()
    else:
        uGroupByField = ""

    for fieldName,_ in summaryFields:
        ufieldName = fieldName.upper()
        visibleFields.append(ufieldName)       
        

    fieldInfos = []
    for field in arcpy.ListFields(input_layer):
        fieldName = field.name
        ufieldName = fieldName.upper()

        visibleType = "HIDDEN"
        ratioType = "NONE"
        if uGroupByField and (uGroupByField == ufieldName):
            visibleType = "VISIBLE"
        if ufieldName in visibleFields:
            visibleType = "VISIBLE"
            ratioType = "RATIO"

        fieldInfo = "{0} {0} {1} {2}".format(fieldName, visibleType, ratioType)
        fieldInfos.append(fieldInfo)

    output_layer = "outLayer"
    arcpy.MakeFeatureLayer_management(input_layer, output_layer,"#","#",";".join(fieldInfos))
    return output_layer

# End def createLayerWithUseRatioPolicy

def verifyShapeType(within_layer, summarize_layer):
    withinShapeType = within_layer.shapeType
    summarizeShapeType = summarize_layer.shapeType
    geomTypes = ["Multipoint", "Point", "Polyline","Polygon"]
    if withinShapeType == "Polygon" and \
       summarizeShapeType not in geomTypes[:4]:
        arcpy.gp.addError("The geometry type of Summarize Layer input must be points, lines, or polygons.", 100015)
        return False
    elif withinShapeType == "Polyline" and \
            summarizeShapeType not in geomTypes[:2]:
        arcpy.gp.addError("The geometry type of Summarize Layer input must be points or lines.", 100016)
        return False
    elif withinShapeType == "Point" and \
            summarizeShapeType not in geomTypes[:1]:
        arcpy.gp.addError("The geometry type of Summarize Layer input must be points.", 100017)
        return False
    return True
# End def verifyShapeType


def AddErrorCode(errorMsg,errorCode,params=None, warning=False):
    """Log error codes."""
    msg = {}
    msg["messageCode"] = "AO_{}".format(errorCode)
    if errorMsg[-1]!= ".":
        errorMsg = "{}.".format(errorMsg)
    msg["message"] = errorMsg
    if params:
        msg["params"] = params
    if warning:
        arcpy.gp.addWarning(json.dumps(msg),errorCode)
    else:
        arcpy.gp.addError(json.dumps(msg),errorCode)

# End def AddErrorCode

def verifyUnitsFields(shapeType, units):
    shapeType = shapeType.lower()
    if shapeType == 'point':
        return True
    validUnits = {"polyline":["FEET", "KILOMETERS", "METERS", "MILES", "YARDS"],
                  "polygon": ["ACRES","HECTARES", "SQUAREFEET", "SQUAREKILOMETERS",
                              "SQUAREMETERS", "SQUAREMILES", "SQUAREYARDS"]}
    units = units.strip().upper()
    if units in validUnits[shapeType]:
        return True
    else:
        return False

def convertMutiPointToSingleFeatures(inputLayer, paramName, warningMsg, wkspc=None):
    '''Converts multipart features to single features
    inputLayer is the Layer object that should be converted to single features
    inputLayerInfo is a local class that has all the describe info 
    paramName is the name of the parameter that is being converted
    paramName is required for adding a warning message
    '''
    if not wkspc:
        # check no of features to determine wkspc
        result = arcpy.GetCount_management(inputLayer)
        count = result.getOutput(0)
        if count > 1000:
            wkspc = arcpy.env.scratchGDB
        else:
            wkspc = "in_memory"

    newLayer = arcpy.CreateUniqueName("singleFeatures", wkspc)    
    warningMessage = warningMsg.format(paramName)    
    msg = (warningMessage,100048,{"inputLayer":paramName},True)
    arcpy.MultipartToSinglepart_management(inputLayer, newLayer)
    return newLayer, msg

# End convertMutiPartToSingleFeatures

def cleanupIntermediateData(iData):
    '''delete intermediate data'''
    try:
        for fc in iData:
            arcpy.Delete_management(fc)
    except:
        pass

def getSummaryAliasField(fieldName, summary):
    ALT_TEXT = {"Min":"Minimum", "Max":"Maximum", "Mean":"Average", 
            "Sum":"Sum", "Stddev":"Standard Deviation", "Std":"Standard Deviation"}
    if summary in ALT_TEXT:
        return "{} {}".format(ALT_TEXT[summary], fieldName)
    else:
        return "{} {}".format(summary, fieldName)
    
#def getSummarySymbology(fieldInfo, summarizedLayer, sumShape, summaryLyrShapeType=None):
    #summaryLyrShapeType = summaryLyrShapeType.lower()
    #if "shapeField" in fieldInfo.keys():
        #fieldname, fieldalias, fieldType = fieldInfo["shapeField"] 
    #if "summaryFields" in fieldInfo.keys():
        #summaryFields = fieldInfo["summaryFields"] 
    #else:
        #summaryFields = None
    
    #if sumShape and "polygon" not in summaryLyrShapeType:
        ## graduated symbols
        #lyrFile = "AggregatePoints.lyr"  
        
    #elif summaryFields:
        ## update classification field name to first statistics
        #classificationField = summaryFields[0][0]
        #normalizationField =None
        ## if statistics is sum normalized Class breaks Renderer for polygon and lines
        #if "sum" in classificationField.lower() and "polygon" in summaryLyrShapeType:
            ## Analysis Area
            #normalizationField = "AnalysisArea"

        #if "polygon" in summaryLyrShapeType:
            ## graduated colors on first statistics.
            #drawingInfo = rendererUtils.getGraduatedColorsInfo(summarizedLayer, classificationField, normalizationField)
        #else:
            #drawingInfo = rendererUtils.getGraduatedSymbolsInfo(summarizedLayer,classificationField)
            
    #else:
        ## graduated colors without Normalization   
        #drawingInfo = rendererUtils.getGraduatedColorsInfo(layerData,fieldname)
        
def useGeodesic(descFC=None, inputFC=None, spRef=None):
    '''provide at least one of the parameters describe, feature class or spatial reference'''
    if not spRef:
        if not descFC:
            if inputFC:
                descFC = arcpy.Describe(inputFC)           
            else:
                arcpy.AddMessage("Provide atleast one of the parameters for useGeodesic method")
                raise Exception
        spRef = descFC.spatialReference

    try:
        if spRef.GCSCode !=0 or spRef.GCS:
            return True
        else:
            return False
    except:
        return False
    

def isWebMercator(descFC=None, inputFC=None, spRef=None, PCSCode=None):
    if PCSCode is None:
        if not spRef:
            if not descFC:
                if inputFC:
                    descFC = arcpy.Describe(inputFC)                    
                else:
                    arcpy.AddMessage("Provide atleast one of the parameters for isMercator method")           
                    raise Exception
            spRef = descFC.spatialReference        
        try:
            PCSCode = spRef.PCSCode
        except:
            return False
    if PCSCode in [102100, 3857, 102113]:
        return True
    else:
        return False

class LayerInfo():
    '''keeps generic information on featurelayers'''
    def __init__(self, input_layer):
        desc = arcpy.Describe(input_layer)
        self.spatialRef = desc.spatialReference
        self.shapeType = desc.shapeType
        self.OIDFieldName = desc.OIDFieldName
        self.name = desc.basename
        self.path = desc.catalogPath
        self.fields = desc.fields
        self.layer = input_layer

