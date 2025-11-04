# coding: utf-8
"""---------------------------------------------------------------------------
 Name:        analysisutils.py
 Purpose:     Helper functions for AGO analysis tasks.
 Author:      Esri, Inc.
 Created:     7/1/2013
 Copyright:   (c) Esri, Inc. 2013
---------------------------------------------------------------------------"""
import arcpy
import time
import os
import json
import re
import urllib.request
import urllib.parse
import gzip
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
    baseFieldName = baseFieldName.lower()
    couldBeFields = [field.name for field in fieldList
                     if (field.name.lower() == baseFieldName) or
                     re.match("^{0}\_\d".format(baseFieldName), field.name.lower())]
    #arcpy.AddMessage(u"couldBEFields: {}".format(couldBeFields))
    if len(couldBeFields) > 0:
        couldBeFields.sort()
        return couldBeFields.pop()
    else:
        return None

# End def getAccurateFieldName




def verifySummaryFields(fieldList, summaryFields, errorMsgs):
    """Adds error messages if stats is invalid or fieldName does not exist in input_layer_info or numeric"""
    stats = ["min","max","mean","sum","stddev"]
    fields = dict([(f.name.lower(),f.type) for f in fieldList])
    returnMsgs = []
    if summaryFields:
        for (fieldName, summary) in summaryFields:
            if summary.lower() not in stats:
                msg = errorMsgs[100006].format(summary, fieldName)
                returnMsgs.append((100006, msg, {"summary":summary,"fieldName":fieldName}))
            if fieldName.lower() not in list(fields.keys()):
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
    if fieldList:
        fieldNames = [f.name.lower() for f in fieldList]
    else:
        fieldNames = [f.name.lower() for f in arcpy.ListFields(input_layer, field_name)]
    i = 1
    while (field_name.lower() in fieldNames):
        field_name = "{0}_{1}".format(field_name, i)
        field_alias = "{0}_{1}".format(field_alias, i)
        i += 1
    return field_name, field_alias

# End def createUniqueFieldName

def createUniqueFieldNameThroInfo(input_layer_info, field_name, field_alias):
    """Return unique field name and field alias name when layerinfo is provided."""
    fieldNames = [f.name for f in input_layer_info.fields]
    i = 1
    while (field_name in fieldNames):
        field_name = "{0}_{1}".format(field_name, i)
        field_alias = "{0}_{1}".format(field_alias, i)
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

        ## Add count field from FIDFieldName
        #countFieldMap = arcpy.FieldMap()
        #fidName = arcpy.Describe(input_points_layer).OIDFieldName
        #countFieldMap.addInputField(input_points_layer, fidName)
        #countFieldMap.mergeRule = "Count"
        #outputField = countFieldMap.outputField
        #outputField.name = "Point_Count"
        #outputField.aliasName = "Count of points"
        #outputField.type = "Integer"
        #countFieldMap.outputField = outputField
        #fieldMappings.addFieldMap(countFieldMap)
        #if len(group_field_name) > 0:
            ## need only polygon layers attributes
            #return fieldMappings
        #else:
            ## Add stats field with merge rule.
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
                while (fieldMappings.findFieldMapIndex(outputField.name) >= 0):
                    outputField.name = "{0}_{1}".format(outputField.name, i)
                    outputField.aliasName = "{0} {1}".format(outputField.aliasName, i)
                    i += 1
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
    #arcpy.AddMessage("Timer: {0:.3f} {1}".format(elapsedTime,msg))
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
        #r = arcpy.GetCount_management(input_layer)
        #arcpy.AddMessage("{} count of {}".format(r.getOutput(0), input_layer))
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

def getOutputWkspc(inputLayer):
    '''returns in_memory/gdb workspace based on count'''
    res = arcpy.GetCount_management(inputLayer)
    count = int(res.getOutput(0))
    if count > 1000:
        return arcpy.env.scratchGDB
    else:
        return "in_memory"


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
    ratioFields = []

    if groupByField:
        visibleFields.append(groupByField.upper())

    if summaryFields:
        for fieldName,summary in summaryFields:
            ufieldName = fieldName.upper()
            visibleFields.append(ufieldName)
            if summary.upper() == "SUM":
                ratioFields.append(ufieldName)

    fieldInfos = []
    for field in arcpy.ListFields(input_layer):
        fieldName = field.name
        ufieldName = fieldName.upper()

        visibleType = "HIDDEN"
        ratioType = "NONE"
        if ufieldName in visibleFields:
            visibleType = "VISIBLE"
            if ufieldName in ratioFields:
                ratioType = "RATIO"

        fieldInfo = "{0} {0} {1} {2}".format(fieldName, visibleType, ratioType)
        fieldInfos.append(fieldInfo)
    #arcpy.AddMessage(fieldInfos)
    #arcpy.AddMessage(str(fieldInfos))
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
        arcpy.gp.addError("The geometry type of SummarizeLayer input must be point, line or polygons",100015)
        return False
    elif withinShapeType == "Polyline" and \
         summarizeShapeType not in geomTypes[:2]:
        arcpy.gp.addError("The geometry type of SummarizeLayer input must be point or line",100016)
        return False
    elif withinShapeType == "Point" and \
         summarizeShapeType not in geomTypes[:1]:
        arcpy.gp.addError("The geometry type of SummarizeLayer input must be point", 100017)
        return False
    return True
# End def verifyShapeType



def createShapeAreaField(input_layer, units="", desc=None):
    '''Adds shape Area field'''
    # this routine is used by Buffer and summary tools
    shape_field_name = "AnalysisArea"

    if not units:
        units = "SquareKilometers"


    # define units
    if "Square" not in units and units not in ["Acres","Hectares"]:
        units = "{}{}".format("Square", units)
    shape_field_alias = "Area {}".format(units)
    shape_field_alias = shape_field_alias.replace("Square", "Square ")

    # Verify whether to calculate geodesic area
    if useGeodesic(descFC=desc, inputFC=input_layer):
        expression = "!shape.geodesicArea@{}!".format(units)
    else:
        expression = "!shape.area@{}!".format(units)

    # Add field and calculate value
    if verifyFieldExists(input_layer, shape_field_name):
        arcpy.AlterField_management(input_layer, shape_field_name,
                                    new_field_alias=shape_field_alias)
    else:
        arcpy.AddField_management(input_layer, shape_field_name,
                                  "DOUBLE","#","#","#", shape_field_alias)

    arcpy.CalculateField_management(input_layer,
                                    shape_field_name,
                                    expression,
                                    "PYTHON_9.3")
    return shape_field_name

# End def createShapeAreaField

def createShapeLengthField(input_layer, units="Kilometers", desc=None):
    '''Adds shape Length field'''
    # this routine is used by Buffer
    shape_field_name = "AnalysisLength"

    shape_field_alias = "Length in {}".format(units)

    # Verify whether to calculate geodesic area
    if useGeodesic(descFC=desc, inputFC=input_layer):
        expression = "!shape.geodesicLength@{}!".format(units)
    else:
        expression = "!shape.length@{}!".format(units)

    #arcpy.AddMessage(expression)
    #arcpy.AddMessage(shape_field_alias)

    # Add field and calculate value
   # Add field and calculate value
    if verifyFieldExists(input_layer, shape_field_name):
        arcpy.AlterField_management(input_layer, shape_field_name,
                                    new_field_alias=shape_field_alias)
    else:
        arcpy.AddField_management(input_layer, shape_field_name,
                                  "DOUBLE","#","#","#", shape_field_alias)
    arcpy.CalculateField_management(input_layer,
                                    shape_field_name,
                                    expression,
                                    "PYTHON_9.3")
    return shape_field_name

# End def createShapeLengthField

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
    #result = arcpy.GetCount_management(newLayer)
    #count = result.getOutput(0)
    #arcpy.AddMessage("Count of new Features: {}".format(count))
    return newLayer, msg

# End convertMutiPartToSingleFeatures

def getSummaryAliasField(fieldName, summary):
    ALT_TEXT = {"Min":"Minimum", "Max":"Maximum", "Mean":"Average",
                "Sum":"Sum", "Stddev":"Standard Deviation", "Std":"Standard Deviation"}
    if summary in ALT_TEXT:
        return "{} {}".format(ALT_TEXT[summary], fieldName)
    else:
        return "{} {}".format(summary, fieldName)

def cleanupIntermediateData(iData):
    '''delete intermediate data'''
    try:
        for fc in iData:
            arcpy.Delete_management(fc)
    except:
        pass

def isShpFileOrDBF(outPath):
    '''checks whether gdb or SDE
    available in path and returns False'''
    if outPath and (".gdb" in outPath or ".sde" in outPath):
        return False
    else:
        return True

def checkPrivilege(privilege, token, referer):
    '''checks whether the AO user has given privilege'''
    selfURL = r"https://www.arcgis.com/sharing/rest/portals/self"
    params = {"f":"json", "token":token}
    params = urllib.parse.urlencode(params).encode('utf-8')
    privilegeText = privilege.split(":")[-1].title()
    try:
        req = urllib.request.Request(selfURL)
        req.add_header("referer",referer)
        req.add_header("Accept-Encoding", "gzip")
        zipped_response = urllib.request.urlopen(req, params)
        if zipped_response.info().get("Content-Encoding") == "gzip":
            response = gzip.open(zipped_response, mode='rt')
            selfJSON = json.load(response)
        else:
            selfJSON = json.loads(zipped_response.read().decode('utf-8'))
        privilegeArr = selfJSON["user"]["privileges"]
        if privilege in privilegeArr:
            return True
        else:
            return False

    except Exception as e:
        arcpy.AddError("Unable to determine {} privilege for ArcGIS Online user account".format(privilegeText))
    return False



def useGeodesic(descFC=None, inputFC=None, spRef=None):
    '''provide atleast one of the parameters describe, feature class or spatial reference'''
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

def applySymbology(fieldInfo, summarizedLayer, sumShape, summaryLyrShapeType, shapeUnits=None):
    '''Updates renderer def in tool desc based on the sumShape and updatedSummFields
       summarizeShapeField gives the field, name and alias of newly created summary shape field name,
       it could be point_count, sum_length or sum_area
    '''
    # Determine classification field, if sumShape use the sum shape fields else use the first statistics field

    import sys
    templatePath = os.path.join(os.path.dirname(sys.path[0]), "templates","layers")
    graduatedSymbolsLayer = r"{}".format(os.path.join(templatePath, "GraduatedSymbols.lyr"))
    graduatedColorsLayer = r"{}".format(os.path.join(templatePath, "GraduatedColors.lyrx"))
    symbologyFields = []
    summaryLyrShapeType = summaryLyrShapeType.lower()

    if "shapeField" in fieldInfo.keys():
        fieldname, fieldalias, fieldType = fieldInfo["shapeField"]

    if "summaryFields" in fieldInfo.keys():
        summaryFields = fieldInfo["summaryFields"]
    else:
        summaryFields = None

    if sumShape and "polygon" not in summaryLyrShapeType:
        # graduated symbols
        symbologyFields.append(["VALUE_FIELD", "#", fieldname])
        symbologyLayer = graduatedSymbolsLayer
    elif summaryFields:
        # update classification field name to first statistics
        classificationField = summaryFields[0][0]
        symbologyFields.append(["VALUE_FIELD", "#", classificationField])

        # if statistics is sum normalized Class breaks Renderer for polygon and lines
        if "sum" in classificationField.lower() and "polygon" in summaryLyrShapeType:
            # Analysis Area
            createShapeAreaField(summarizedLayer, shapeUnits)
            normalizationField = "AnalysisArea"
            symbologyFields.append(["NORMALIZATION_FIELD", "#", normalizationField])

        if "polygon" in summaryLyrShapeType:
            # graduated colors on first statistics.
            symbologyLayer = graduatedSymbolsLayer
        else:
            symbologyLayer = graduatedColorsLayer

    else:
        # graduated colors without Normalization
        symbologyFields.append(["VALUE_FIELD", "#", fieldname])
        symbologyLayer = graduatedColorsLayer

    lyrName = arcpy.Describe(summarizedLayer).basename
    arcpy.MakeFeatureLayer_management(summarizedLayer, lyrName)
    arcpy.ApplySymbologyFromLayer_management(lyrName, symbologyLayer, symbologyFields)
    arcpy.SetParameterAsText(2, lyrName)

