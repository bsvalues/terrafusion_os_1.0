"""---------------------------------------------------------------------------
Name:              FindExistingLocations.py
Purpose:           Finds existing locations by executing a sequence of expressions
Author:            Esri Inc.
Created:           11/7/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2.1
---------------------------------------------------------------------------"""


from __future__ import unicode_literals
import arcpy
import os
import json
import types
import analysisutils
import aolutils
import bufferUtils


errorMsgs = {
    100053:u"Required keys {} are missing in attribute expression {}",
    100054:u"Required keys {} are missing in spatial relationship expression {}",
    100055:u"Invalid expression, malformed JSON",
    100056:u"Invalid layer index in expression {}",
    100057:u"Layer index exceeds the number of input layers in expression {}",
    100058:u"{} spatial relationship does not support {}/{} geometry types for layer/selectingLayer in expression {}",
    100059:u"Invalid spatial relationship {} in expression {}",
    100060:u"Query expression failed in expression {}",
    100062:u"Invalid distance and/or units in expression {}",
    100078:u"Invalid field name in expression {}",
    100262:u"Invalid Query: Cannot use OR with 2 expressions that contain different target layers"
}

def getErrorMessages():
    return errorMsgs

def getTargetIndexes(expressionList, prevIndex, targetIndexes):
    '''To get the target layer indexes from the expression'''
    for i, expression in enumerate(expressionList):
        if isinstance(expression, dict):
            if expression['operator'].strip() == '':
                targetIndexes.append(expression['layer'])
                #prevIndex = expression['layer']

            elif expression['operator'] == 'or' and expression['layer']!=prevIndex:
                targetIndexes.append(expression['layer'])

            if i == 0:
                prevIndex = expression['layer']

        elif isinstance(expression, list):
            getTargetIndexes(expression, prevIndex, targetIndexes)


def verifyRelExpression(expressions):
    '''To verify the relationship of expressions..
    Basically, target layer should not be different if two expressions were 
    concatenated with a OR operator. This condition would only appear if one 
    expression is built using a spatial relationship with another layer.
    '''
    targetIndexes = []
    getTargetIndexes(expressions, None, targetIndexes)
    if len(set(targetIndexes)) == 1:
        return True
    else:
        return False

def verifyExpression(currExpression):
    '''verify json '''
    if currExpression.get("where"):
        if not verifyAttributeExpr(currExpression):
            raise arcpy.ExecuteError
    else:
        if not verifyLocationExpr(currExpression):
            raise arcpy.ExecuteError


#End def verifyExpression

def verifyAttributeExpr(currExpression):
    '''verifies attribute expression'''
    if verifyRequiredKeys(currExpression):
        if verifyLayerIndex(currExpression,currExpression["layer"]):
            return True
    return False

# End verifyAttributeKeys

def verifyLocationExpr(currExpression):
    ''' verifies location expressions '''
    # verify keys
    if verifyRequiredKeys(currExpression, isAttribute=False):
        # verify layer indexes
        if (verifyLayerIndex(currExpression,currExpression["layer"]) and \
            verifyLayerIndex(currExpression,currExpression["selectingLayer"])):
            #verify sptialrel
            if verifySpatialRel(currExpression):
                return True
    return False

def verifyRequiredKeys(currExpression, isAttribute=True):
    '''verify keys in a JSON'''
    if isAttribute:
        reqdKeys = ["layer"]
        exprName = "attribute"
    else:
        exprName = "location"
        reqdKeys = ["layer","spatialRel","selectingLayer"]
        if "withindistance" in currExpression["spatialRel"]:
            reqdKeys.append("distance")
    missingKeys = []
    for currKey in reqdKeys:
        if not currKey in currExpression:
            missingKeys.append(currKey)
    if len(missingKeys) > 0:
        errorMsg = errorMsgs[100053]
        missingKeys = ";".join(missingKeys)
        expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
        errorMsg = errorMsg.format(missingKeys, exprName, expression)
        params = {"missingKeys":missingKeys, "expression":expression}
        analysisutils.AddErrorCode(errorMsg, 100053, params)
        return False
    else:
        return True

def verifyLayerIndex(currExpression,layerIndex):
    '''verifies whether the layer index is not out of bounds'''
    errorcode = 0
    if not isinstance(layerIndex, int):
        errorcode = 100056
    if layerIndex >= len(layers):
        errorcode = 100057
    if errorcode > 0 :
        expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
        msg = errorMsgs[errorcode].format(expression)
        analysisutils.AddErrorCode(msg, errorcode, {"expression":expression})
        return False
    return True

# End def verifyLayerIndex

def verifySpatialRel(currExpression):
    '''verifies spatialrel keyword and geometry types'''
    spatialRelTypes = ["intersects", "notintersects", "withindistance", "notwithindistance", "completelycontains",
                       "notcompletelycontains", "completelywithin", "notcompletelywithin",
                       "within", "notwithin","contains", "notcontains"]
    spatialRel = currExpression["spatialRel"].lower()
    if spatialRel.lower() not in spatialRelTypes:
        expr = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
        msg = errorMsgs[100059].format(spatialRel, expr)
        analysisutils.AddErrorCode(msg,100059,{"spatialRel":spatialRel,"expression":expr})
        return False

    # verify geometry combinations
    geometryTypes = ["Multipoint", "Point", "Polyline", "Polygon"]
    lyr = currExpression["layer"]
    lyrGeomType = arcpy.Describe(layers[lyr]).shapeType
    selectingLyr = currExpression["selectingLayer"]
    selLyrGeomType = arcpy.Describe(layers[selectingLyr]).shapeType
    processError = False

    if "contains" in spatialRel:
        if "point" in lyrGeomType.lower():
            if not selLyrGeomType in geometryTypes[0:2]:
                processError = True
        elif lyrGeomType == "Polyline":
            if not selLyrGeomType in geometryTypes[0:3]:
                processError = True
    if "within" in spatialRel and 'distance' not in spatialRel:
        if "point" in selLyrGeomType.lower():
            if not lyrGeomType in geometryTypes[0:2]:
                processError = True
        elif selLyrGeomType == "Polyline":
            if not lyrGeomType in geometryTypes[0:3]:
                processError = True
    if processError:
        msg = errorMsgs[100058]
        expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
        msg = msg.format(spatialRel,lyrGeomType,selLyrGeomType,expression)
        params = {"spatialRel":spatialRel,"lyrGeomType":lyrGeomType,
                  "selLyrGeomType":selLyrGeomType, "expression":expression}
        analysisutils.AddErrorCode(msg, 100058, params)
        return False
    else:
        return True

# End def verifySpatialRel


def getSelectionType(selectedLayersIndex, operator, layerIndex, subgroup):
    '''identifies the selection type to be used for attribute and location '''

    if operator:
        operator = operator.upper()
    else:
        operator = ""

    if layerIndex not in selectedLayersIndex:
        selectedLayersIndex.append(layerIndex)
        if selectedFeatures:
            if subgroup and layerIndex in modifiedLayers:
                lyr = lyrs[layerIndex]
                selectionSet = selectionSets[layerIndex]
                arcpy.AddMessage("Restoring layer selection {},{}".format(layerIndex, len(selectionSet)))
                tmpSelectionSet = [str(x) for x in selectionSet]
                tmpSelectionSet = ",".join(tmpSelectionSet)
                tmpOidFieldName = arcpy.Describe(lyr).OIDFieldName
                whereClause="%s IN (%s)"%(tmpOidFieldName, tmpSelectionSet)
                arcpy.SelectLayerByAttribute_management(lyr, "NEW_SELECTION", whereClause)

            selectionType = "SUBSET_SELECTION"
        else:
            selectionType = "NEW_SELECTION"
    elif operator == "OR":
        selectionType = "ADD_TO_SELECTION"
    elif operator == "AND":
        selectionType = "SUBSET_SELECTION"

    if layerIndex not in modifiedLayers:
        modifiedLayers.append(layerIndex)

    return selectionType

# End getSelectionType


def getCount(layer):
    '''count the number of features'''
    result = arcpy.GetCount_management(layer)
    count = result.getOutput(0)
    arcpy.AddMessage("Count of features: {}".format(count))


def IndexExpressions(expressions):
    index = -1
    hasGroup = False

    for expression in expressions:
        index = index + 1
        if isinstance(expression, list):
            IndexExpressions(expression)
            hasGroup = True

        if isinstance(expression, dict):
            verifyExpression(expression)
            expression["index"] = index

    return hasGroup


def ContainsLayer(expressions, swapLayerIndex, currentLayerIndex):

    containsLayer = False

    for expression in expressions:

        if isinstance(expression, list):
            if ContainsLayer(expression, swapLayerIndex, currentLayerIndex):
                containsLayer = True;

        if isinstance(expression, dict):
            layerIndex = expression.get("layer")
            if layerIndex == currentLayerIndex:
                return False
            if layerIndex == swapLayerIndex:
                selectingLayerIndex = expression.get("selectingLayer")
                if selectingLayerIndex != currentLayerIndex:
                    containsLayer = True

    return containsLayer


def SortExpressions(expressions):

    index = -1
    swapLayerIndex = -1
    currentLayerIndex = -1
    swapIndex = -1

    for expression in expressions:
        index = index + 1
        if isinstance(expression, list):
            SortExpressions(expression)
            if swapLayerIndex >= 0:
                if ContainsLayer(expression, swapLayerIndex, currentLayerIndex):
                    swapExpression = expressions.pop(swapIndex)
                    expressions.insert(index, swapExpression)
                    return SortExpressions(expressions)

        if isinstance(expression, dict):
            layerIndex = expression.get("layer")
            selectingLayerIndex = expression.get("selectingLayer")

            if swapLayerIndex >= 0:
                if layerIndex == swapLayerIndex and selectingLayerIndex != currentLayerIndex:
                    swapExpression = expressions.pop(index)
                    expressions.insert(swapIndex, swapExpression)
                    return SortExpressions(expressions)

            if selectingLayerIndex is not None:
                swapLayerIndex = selectingLayerIndex
                currentLayerIndex = layerIndex
                swapIndex = index


def updateSpatialRel(spatialRel):
    '''converts to appropriate desktop spatialrel'''
    spatialRel = spatialRel.upper()
    dt_spatialRel = {"WITHINDISTANCE":"WITHIN_A_DISTANCE_GEODESIC",
                     "COMPLETELYCONTAINS":"COMPLETELY_CONTAINS",
                     "COMPLETELYWITHIN":"COMPLETELY_WITHIN", "INTERSECTS":"INTERSECT"}
    if spatialRel in dt_spatialRel:
        return dt_spatialRel[spatialRel]
    else:
        return spatialRel

def getDistance(currExpression):
    '''Concatenates distance and units when needed'''
    distance = "#"
    distanceValue = 0
    units = "Meters"
    if "withindistance" in currExpression["spatialRel"].lower():
        distanceValue = currExpression.get("distance")
        processError = False
        if isinstance(distanceValue, int) or isinstance(distanceValue, float):
            if distanceValue > 0:
                units = currExpression.get("units", "Meters")
                if units.lower() in ["feet", "kilometers", "meters", "miles", "nauticalmiles", "yards"]:
                    distance = "{} {}".format(distanceValue, units)
                else:
                    processError = True
            else:
                processError = True
        else:
            processError = True
        if processError:
            expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
            analysisutils.AddErrorCode(errorMsgs[100062].format(expression),
                                       100062,
                                       {"expression":expression})
            raise arcpy.ExecuteError
    return distance, distanceValue, units

def updateWhereExpression(layer, expression):

    #get field
    #arcpy.AddMessage(u"where expression: {}".format(expression))
    values = expression.split(" ")
    #arcpy.AddMessage(str(values))
    fieldName = values[0]
    #arcpy.AddMessage(u"field name: {}".format(fieldName))
    # fieldList = arcpy.ListFields(layer, fieldName)
    fieldList = []
    fieldTypes = []
    for field in arcpy.ListFields(layer):
        if field.name.split(".")[-1] == fieldName:
            fieldList.append(fieldName)
            fieldTypes.append(field.type)

    if not fieldList:
        expression = json.dumps(expression, ensure_ascii=False, sort_keys=True)
        errMsg = errorMsgs[100078].format(expression)
        analysisutils.AddErrorCode(errMsg, 100078, {"expression":expression})
        raise arcpy.ExecuteError

    field = fieldList[0]
  # fieldType = field.type
    fieldType = fieldTypes[0]

    #check for in-memory
    d = arcpy.Describe(layer)
    catalogPath = d.catalogPath
    if "in_memory" in catalogPath:
        bInMemory = True
    else:
        bInMemory = False

    #check for between in in-memory
    if bInMemory and fieldType in ["Date","Double","Integer","Single","SmallIntger"]:
        keywords1 = [" NOT BETWEEN "," not between "," BETWEEN "," between "]
        keywords2 = [" AND "," and "," AND "," and "]
        replaceKeywords1 = [" < "," < "," >= "," >= "]
        replaceKeywords2 = [u" OR {} > ",u" OR {} > ",u" AND {} <= ",u" AND {} <= "]
        index = -1
        for keyword1 in keywords1:
            index = index + 1
            if keyword1 in expression:
                expression = expression.replace(keyword1,replaceKeywords1[index])
                expression = expression.replace(keywords2[index],replaceKeywords2[index].format(fieldName))
                arcpy.AddMessage(u"where expression: {}".format(expression))
                break

    #check for date field in in-memory or gdb
    if fieldType == "Date" and (bInMemory or ".gdb" in catalogPath):
        expression = expression.replace(" '"," date '")
        arcpy.AddMessage(u"where expression: {}".format(expression))

    #check for string field in in-memory
    if fieldType == "String" and bInMemory:
        keywords = [" = N'"," <> N'"," LIKE N'"," like N'"]
        replaceKeywords = [" = '"," <> '"," LIKE '"," like '"]
        index = -1
        for keyword in keywords:
            index = index + 1
            if keyword in expression:
                expression = expression.replace(keyword,replaceKeywords[index])
                arcpy.AddMessage(u"where expression: {}".format(expression))
                break

    return expression


def selectFeatures(layers, primaryLayer, expressions, subgroup):
    '''selects features based on query expressions'''
    if subgroup:
        #selectionSet1 = primaryLayer._arc_object.getselectionset()
        selectionSetStr = arcpy.Describe(primaryLayer).FIDSet
        selectionSet1= [x for x in selectionSetStr.split(';')]
        oidFieldName=arcpy.Describe(primaryLayer).OIDFieldName
        #selectionSet1 = primaryLayer.getSelectionSet()

    firstOperator = ""
    selectedLayersIndex = []
    #arcpy.AddMessage(expressions)

    for currExpression in expressions:
        # verify whether it is final expression or a set of expression
        if isinstance(currExpression, list):
            operator = selectFeatures(layers, primaryLayer, currExpression, True)
            if len(firstOperator) == 0:
                firstOperator = operator.lower()
        else:
            index = currExpression.get("index")
            layerindex = currExpression.get("layer")
            layer = layers[layerindex]
            operator = currExpression.get("operator", "and")
            if index == 0:
                firstOperator = operator.lower()
            # verify whether attribute or location
            whereExpr = currExpression.get("where")
            if whereExpr:
                whereExpr = updateWhereExpression(layer, whereExpr)
                selectionType = getSelectionType(selectedLayersIndex, operator, layerindex, subgroup)
                msg = u"{} {} {}".format(layer, whereExpr, selectionType)
                arcpy.AddMessage(msg)
                try:
                    arcpy.SelectLayerByAttribute_management(layer, selectionType, whereExpr)
                except:
                    expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
                    analysisutils.AddErrorCode(errorMsgs[100060], 100060, expression)
                    raise arcpy.ExecuteError

            else:
                spatialRel = currExpression.get("spatialRel")
                selectingLayer = layers[currExpression.get("selectingLayer")]
                distance, _, _ = getDistance(currExpression)
                # handle not conditions
                spatialRel = spatialRel.upper()
                if "NOT" in spatialRel:
                    spatialRel = spatialRel.replace("NOT","")
                    invertSpatialRel = True
                else:
                    invertSpatialRel = False
                selectionType = getSelectionType(selectedLayersIndex, operator, layerindex, subgroup)

                # get desktop keyword for spatialRel
                spatialRel = updateSpatialRel(spatialRel)
                msg = u"{} {} {} {} {} {}".format(layer, spatialRel,
                                                selectingLayer, distance, selectionType, invertSpatialRel)
                arcpy.AddMessage(msg)
                arcpy.SelectLayerByLocation_management(layer, spatialRel, selectingLayer, 
                                    distance, selectionType, invertSpatialRel)

    if subgroup:
        if firstOperator == "or":
            selectionType = "ADD_TO_SELECTION"
        else:
            selectionType = "SUBSET_SELECTION"
        if len(selectionSet1) and selectionSet1[0].strip() != '':
            whereClause="%s IN (%s)"%(oidFieldName, ",".join(selectionSet1))
            arcpy.SelectLayerByAttribute_management(primaryLayer, selectionType, whereClause)

    return firstOperator

def initLayers(flayers, hasGroup):
    
    flyrs = []
    fselectionSets = []

    if arcpy.env.extent:
        fselectedFeatures = True
        if hasGroup:
            layerIndex = -1
            for layer in flayers:
                layerIndex = layerIndex + 1
                #lyr = arcpy.mapping.Layer(layer)
                desc = arcpy.Describe(layer)
                fidString = desc.FIDSet #lyr.getSelectionSet()
                selectionSet = set([int(x) for x in fidString.split(';')])
                flyrs.append(layer)
                fselectionSets.append(selectionSet)
                arcpy.AddMessage("Saving layer selection {},{}".format(layerIndex, len(selectionSet)))
    else:
        fselectedFeatures = False

    return fselectedFeatures, flyrs, fselectionSets


def findExistingLocations(flyrs, expressions, outFeatures):
    global layers
    global modifiedLayers
    global lyrs
    global selectionSets
    global selectedFeatures

    layers = flyrs
    modifiedLayers=[]
    lyrs = []
    selectionSets = []  
    selectedFeatures=False

    expressions=json.loads(expressions)
    if not verifyRelExpression(expressions):
        analysisutils.AddErrorCode(errorMsgs[100262],\
                100262,{"expression":expressions})
        raise Exception
                
    hasGroup = IndexExpressions(expressions)
    SortExpressions(expressions)
    primaryLayer = layers[0]
      
    if arcpy.env.extent:
        selectedFeatures = True
        layerIndex = -1
        
        for layer in layers:
            layerIndex = layerIndex + 1
            desc = arcpy.Describe(layer)
            fidString = desc.FIDSet
            selectionSet = set([int(x) for x in fidString.split(';')])

            lyrs.append(layer)
            selectionSets.append(selectionSet)
            arcpy.AddMessage("Saving layer selection {},{}".format(layerIndex, len(selectionSet)))
    else:
        selectedFeatures = False
        #if hasGroup:
        #    primaryLayer = arcpy.MakeFeatureLayer_management(layers[0], 'primaryLayer').getOutput(0)

    arcpy.env.extent = None
    selectFeatures(layers, primaryLayer, expressions, selectedFeatures)
    arcpy.CopyFeatures_management(layers[0], outFeatures)

def overlayFeatures(expressions, subgroup, wkspc):
    '''selects features based on query expressions'''

    firstOperator = ""
    prevFeatures = ""
    prevShapeType = ""
    overlayIndex = 0
    selectedLayersIndex = []
    #arcpy.AddMessage(expressions)

     
    for currExpression in expressions:
        # verify whether it is final expression or a set of expression
        if isinstance(currExpression, list):
            operator, prevFeatures, prevShapeType = overlayFeatures(currExpression, True, wkspc)
            if len(firstOperator) == 0:
                firstOperator = operator
        else:
            index = currExpression.get("index")
            layerindex = currExpression.get("layer")
            layer = layers[layerindex]
            dLayer = arcpy.Describe(layer)
            shapeType = dLayer.shapeType
            selectingLayer = ""
            operator = currExpression.get("operator", "and").lower()
            if index == 0:
                firstOperator = operator
            # verify whether attribute or location
            whereExpr = currExpression.get("where")
            if whereExpr:
                whereExpr = updateWhereExpression(layer, whereExpr)
                selectionType = getSelectionType(selectedLayersIndex, operator, layerindex, \
                                subgroup)
                msg = u"{} {} {}".format(layer, whereExpr, selectionType)
                arcpy.AddMessage(msg)
                try:
                    arcpy.gp.SelectLayerByAttribute_management(layer, selectionType, whereExpr)
                except:
                    expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
                    analysisutils.AddErrorCode(errorMsgs[100060], 100060, expression)
                    raise arcpy.ExecuteError

            else:
                spatialRel = currExpression.get("spatialRel")
                selectingLayer = layers[currExpression.get("selectingLayer")]
                distance, distanceValue, units = getDistance(currExpression)
                # handle not conditions
                spatialRel = spatialRel.upper()
                if "NOT" in spatialRel:
                    spatialRel = spatialRel.replace("NOT","")
                    invertSpatialRel = True
                else:
                    invertSpatialRel = False
                selectionType = getSelectionType(selectedLayersIndex, operator, layerindex, subgroup)

                if spatialRel == "WITHINDISTANCE" and shapeType != "Point":
                    outfeatures1 = os.path.join(wkspc, "buffer{}".format(index))
                                       
                    bufferUtils.createBuffers(selectingLayer, [distanceValue], "", units, \
                                    "dissolve", "disks", "full", "round", outfeatures1, False)

                    tmpFeatures = os.path.join(wkspc, 'tmpFeatures')
                    arcpy.gp._arc_object.SimpleCopy(layer, tmpFeatures)
                    if invertSpatialRel:
                        outfeatures = os.path.join(wkspc, "erase{}".format(index))
                        arcpy.AddMessage(outfeatures)
                        arcpy.Erase_analysis(tmpFeatures, outfeatures1, outfeatures)
                    else:
                        distancefieldname = "WithinDistance"
                        distancefieldalias = "Within Distance {}".format(units)
                        expression = "{}".format(distanceValue)
                        arcpy.AddField_management(outfeatures1, distancefieldname, 'DOUBLE', \
                                                    "", "", "", distancefieldalias)
                        arcpy.CalculateField_management(outfeatures1, distancefieldname, expression, 'PYTHON')
                        outfeatures = os.path.join(wkspc, "intersect{}".format(index))
                        arcpy.AddMessage(outfeatures)
                        arcpy.Intersect_analysis([tmpFeatures, outfeatures1], outfeatures)
                    layer = outfeatures
                    dLayer = arcpy.Describe(layer)
                    shapeType = dLayer.shapeType
                elif spatialRel == "INTERSECTS" and shapeType != "Point":
                    tmpFeatures = os.path.join(wkspc, 'tmpFeatures')
                    arcpy.gp._arc_object.SimpleCopy(layer, tmpFeatures)
                    if invertSpatialRel:
                        outfeatures = os.path.join(wkspc, "erase{}".format(index))
                        arcpy.AddMessage(outfeatures)
                        arcpy.Erase_analysis(tmpFeatures, selectingLayer, outfeatures)
                    else:
                        outfeatures = os.path.join(wkspc, "intersect{}".format(index))
                        arcpy.AddMessage(outfeatures)
                        arcpy.Intersect_analysis([tmpFeatures, selectingLayer], outfeatures)
                    layer = outfeatures
                    dLayer = arcpy.Describe(layer)
                    shapeType = dLayer.shapeType
                else:  
                    # get desktop keyword for spatialRel
                    spatialRel = updateSpatialRel(spatialRel)
                    msg = u"{} {} {} {} {} {}".format(layer, spatialRel, selectingLayer, \
                                                distance, selectionType, invertSpatialRel)
                    arcpy.AddMessage(msg)                   
                    arcpy.SelectLayerByLocation_management(layer, spatialRel, selectingLayer, \
                                                distance, selectionType, invertSpatialRel)

            #getCount(layer)

        if prevFeatures and prevFeatures != layer and prevFeatures != selectingLayer:
            overlayIndex = overlayIndex + 1
            outfeatures = os.path.join(wkspc, "{}{}".format(operator, overlayIndex))
            infeatures = [prevFeatures, layer]
            msg = u"{} {}".format(operator, infeatures)
            arcpy.AddMessage(msg)

            if operator == "or" and shapeType == "Polygon" and prevShapeType == "Polygon":
                arcpy.Union_analysis(infeatures, outfeatures)
            else:
                arcpy.Intersect_analysis(infeatures, outfeatures)

            arcpy.AddMessage(outfeatures)
            prevFeatures = outfeatures
            dPrevFeatures = arcpy.Describe(prevFeatures)
            prevShapeType = dPrevFeatures.shapeType
        else:
            prevFeatures = layer
            prevShapeType = shapeType

    return firstOperator, prevFeatures, prevShapeType


def deriveNewLocations(flyrs, expressions, outFeatures):
    global layers
    global modifiedLayers
    global selectedFeatures
    global selectionSets
    global lyrs

    selectedFeatures=False

    layers = flyrs

    errorMsgs = getErrorMessages()

    try:
        expressions = json.loads(expressions)
    except:
        analysisutils.AddErrorCode(errorMsgs[100055],100055)

    if not verifyRelExpression(expressions):
        analysisutils.AddErrorCode(errorMsgs[100262],\
                100262,{"expression":expressions})
        raise Exception

    hasGroup = IndexExpressions(expressions)
    SortExpressions(expressions)
    modifiedLayers = []

    selectedFeatures, lyrs, selectionSets = initLayers(flyrs, hasGroup)
    arcpy.env.extent = None

    # If in_memory, write to in_memory
    if os.path.dirname(outFeatures) == 'in_memory':
        wkspc = 'in_memory'
    else:
        wkspc = arcpy.env.scratchGDB

    operator, prevFeatures, prevShapeType = overlayFeatures(expressions, False, wkspc)
    arcpy.CopyFeatures_management(prevFeatures, outFeatures)