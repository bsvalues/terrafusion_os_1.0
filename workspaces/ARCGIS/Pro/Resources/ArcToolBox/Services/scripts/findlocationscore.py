"""---------------------------------------------------------------------------
Name:              FindExistingLocations.py
Purpose:           Finds existing locations by executing a sequence of expressions
Author:            Esri Inc.
Created:           11/7/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2.1
---------------------------------------------------------------------------"""


from __future__ import unicode_literals
import os
import json
import types
import analysisutils
import aolutils
import bufferUtils
import arcpy

errorMsgs = {
    100053: "Required keys {} are missing in attribute expression {}.",
    100054: "Required keys {} are missing in spatial relationship expression {}",
    100055: "Invalid expression, malformed JSON",
    100056: "Invalid layer index in expression {}",
    100057: "Layer index exceeds the number of input layers in expression {}",
    100058: "{} spatial relationship does not support {}/{} geometry types for layer/selectingLayer in expression {}",
    100059: "Invalid spatial relationship {} in expression {}",
    100060: "Query expression failed in expression {}",
    100062: "Invalid distance and/or units in expression {}",
    100078: "Invalid field name in expression {}",
    100262: "Invalid Query: Cannot use OR with 2 expressions that contain different target layers"
}


class ExpressionValidator(object):
    def __init__(self, layers):
        self.layers = layers

    def index_expressions(self, expressions):
        """Add index to expressions."""
        index = -1
        hasGroup = False

        for expression in expressions:
            index = index + 1
            if isinstance(expression, list):
                self.index_expressions(expression)
                hasGroup = True

            if isinstance(expression, dict):
                self._verify_expression(expression)
                expression["index"] = index

        return hasGroup

    def sort_expressions(self, expressions):
        """Sort the expressions."""
        index = -1
        swapLayerIndex = -1
        currentLayerIndex = -1
        swapIndex = -1

        for expression in expressions:
            index += 1
            if isinstance(expression, list):
                self.sort_expressions(expression)
                if swapLayerIndex >= 0:
                    if self._contains_layer(expression, swapLayerIndex, currentLayerIndex):
                        swapExpression = expressions.pop(swapIndex)
                        expressions.insert(index, swapExpression)
                        return self.sort_expressions(expressions)

            if isinstance(expression, dict):
                layerIndex = expression.get("layer")
                selectingLayerIndex = expression.get("selectingLayer")

                if swapLayerIndex >= 0:
                    if layerIndex == swapLayerIndex and selectingLayerIndex != currentLayerIndex:
                        swapExpression = expressions.pop(index)
                        expressions.insert(swapIndex, swapExpression)
                        return self.sort_expressions(expressions)

                if selectingLayerIndex is not None:
                    swapLayerIndex = selectingLayerIndex
                    currentLayerIndex = layerIndex
                    swapIndex = index

    def _contains_layer(self, expressions, swapLayerIndex, currentLayerIndex):
        containsLayer = False

        for expression in expressions:

            if isinstance(expression, list):
                if self._contains_layer(expression, swapLayerIndex, currentLayerIndex):
                    containsLayer = True

            if isinstance(expression, dict):
                layerIndex = expression.get("layer")
                if layerIndex == currentLayerIndex:
                    return False
                if layerIndex == swapLayerIndex:
                    selectingLayerIndex = expression.get("selectingLayer")
                    if selectingLayerIndex != currentLayerIndex:
                        containsLayer = True

        return containsLayer

    def verify_rel_expression(self, expressions):
        """To verify the relationship of expressions. Basically, target layer should not be different if two
        expressions were concatenated with a OR operator. This condition would only appear if one expression
        is built using a spatial relationship with another layer.
        """
        targetIndexes = []
        self._get_target_indexes(expressions, None, targetIndexes)
        if len(set(targetIndexes)) == 1:
            return True
        else:
            return False

    @staticmethod
    def update_where_expression(layer, expression):
        # get field
        values = expression.split(" ")
        fieldName = values[0]
        fieldList = arcpy.ListFields(layer, fieldName)

        if not fieldList:
            expression = json.dumps(expression, ensure_ascii=False, sort_keys=True)
            errMsg = errorMsgs[100078].format(expression)
            analysisutils.AddErrorCode(errMsg, 100078, {"expression": expression})
            raise arcpy.ExecuteError

        field = fieldList[0]
        fieldType = field.type

        # check for in-memory
        d = arcpy.Describe(layer)
        catalogPath = d.catalogPath
        if "in_memory" in catalogPath:
            bInMemory = True
        else:
            bInMemory = False

        # check for between in in-memory
        if bInMemory and fieldType in ["Date", "Double", "Integer", "Single", "SmallIntger"]:
            keywords1 = [" NOT BETWEEN ", " not between ", " BETWEEN ", " between "]
            keywords2 = [" AND ", " and ", " AND ", " and "]
            replaceKeywords1 = [" < ", " < ", " >= ", " >= "]
            replaceKeywords2 = [u" OR {} > ", u" OR {} > ", u" AND {} <= ", u" AND {} <= "]
            index = -1
            for keyword1 in keywords1:
                index = index + 1
                if keyword1 in expression:
                    expression = expression.replace(keyword1, replaceKeywords1[index])
                    expression = expression.replace(keywords2[index], replaceKeywords2[index].format(fieldName))
                    arcpy.AddMessage(u"where expression: {}".format(expression))
                    break

        # check for date field in in-memory or gdb
        if fieldType == "Date" and (bInMemory or ".gdb" in catalogPath):
            expression = expression.replace(" '", " date '")
            arcpy.AddMessage("where expression: {}".format(expression))

        # check for string field in in-memory
        if fieldType == "String" and bInMemory:
            keywords = [" = N'", " <> N'", " LIKE N'", " like N'"]
            replaceKeywords = [" = '", " <> '", " LIKE '", " like '"]
            index = -1
            for keyword in keywords:
                index = index + 1
                if keyword in expression:
                    expression = expression.replace(keyword, replaceKeywords[index])
                    arcpy.AddMessage("where expression: {}".format(expression))
                    break

        return expression

    def _get_target_indexes(self, expressionList, prevIndex, targetIndexes):
        '''To get the target layer indexes from the expression'''
        for i, expression in enumerate(expressionList):
            if isinstance(expression, dict):
                if expression['operator'].strip() == '':
                    targetIndexes.append(expression['layer'])
                    # prevIndex = expression['layer']

                elif expression['operator'] == 'or' and expression['layer'] != prevIndex:
                    targetIndexes.append(expression['layer'])

                if i == 0:
                    prevIndex = expression['layer']

            elif isinstance(expression, list):
                self._get_target_indexes(expression, prevIndex, targetIndexes)

    def _verify_expression(self, currExpression):
        """Verify expression json."""
        if currExpression.get("where"):
            if not self._verify_attribute_expr(currExpression):
                raise arcpy.ExecuteError
        else:
            if not self._verify_location_expr(currExpression):
                raise arcpy.ExecuteError

    def _verify_layer_index(self, currExpression, layerIndex):
        """Verifies whether the layer index is not out of bounds."""
        errorcode = 0
        if not isinstance(layerIndex, int):
            errorcode = 100056
        if layerIndex >= len(self.layers):
            errorcode = 100057
        if errorcode > 0:
            expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
            msg = errorMsgs[errorcode].format(expression)
            analysisutils.AddErrorCode(msg, errorcode, {"expression": expression})
            return False
        return True

    def _verify_attribute_expr(self, currExpression):
        """verifies attribute expression."""
        if self._verify_required_keys(currExpression):
            if self._verify_layer_index(currExpression, currExpression["layer"]):
                return True
        return False

    def _verify_location_expr(self, currExpression):
        """Verifies location expressions."""
        # verify keys
        if self._verify_required_keys(currExpression, isAttribute=False):
            # verify layer indexes
            if (self._verify_layer_index(currExpression, currExpression["layer"]) and
                self._verify_layer_index(currExpression, currExpression["selectingLayer"])):
                # verify sptialrel
                if self._verify_spatial_rel(currExpression):
                    return True
        return False
    
    def _verify_required_keys(self, currExpression, isAttribute=True):
        """Verify keys in a JSON."""
        if isAttribute:
            reqdKeys = ["layer"]
            exprName = "attribute"
        else:
            exprName = "location"
            reqdKeys = ["layer", "spatialRel", "selectingLayer"]
            if "withindistance" in currExpression["spatialRel"]:
                reqdKeys.append("distance")
        missingKeys = []
        for currKey in reqdKeys:
            if currKey not in currExpression:
                missingKeys.append(currKey)
        if len(missingKeys) > 0:
            errorMsg = errorMsgs[100053]
            missingKeys = ";".join(missingKeys)
            expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
            errorMsg = errorMsg.format(missingKeys, exprName, expression)
            params = {"missingKeys": missingKeys, "expression": expression}
            analysisutils.AddErrorCode(errorMsg, 100053, params)
            return False
        else:
            return True

    def _verify_spatial_rel(self, currExpression):
        """Verifies spatialrel keyword and geometry types."""
        spatialRelTypes = ["intersects", "notintersects", "withindistance", "notwithindistance", "completelycontains",
                           "notcompletelycontains", "completelywithin", "notcompletelywithin",
                           "within", "notwithin", "contains", "notcontains", "nearest"]
        spatialRel = currExpression["spatialRel"].lower()
        if spatialRel.lower() not in spatialRelTypes:
            expr = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
            msg = errorMsgs[100059].format(spatialRel, expr)
            analysisutils.AddErrorCode(msg, 100059, {"spatialRel": spatialRel, "expression": expr})
            return False

        # verify geometry combinations
        geometryTypes = ["Multipoint", "Point", "Polyline", "Polygon"]
        lyr = currExpression["layer"]
        lyrGeomType = arcpy.Describe(self.layers[lyr]).shapeType
        selectingLyr = currExpression["selectingLayer"]
        selLyrGeomType = arcpy.Describe(self.layers[selectingLyr]).shapeType
        processError = False

        if "contains" in spatialRel:
            if "point" in lyrGeomType.lower():
                if selLyrGeomType not in geometryTypes[0:2]:
                    processError = True
            elif lyrGeomType == "Polyline":
                if selLyrGeomType not in geometryTypes[0:3]:
                    processError = True
        if "within" in spatialRel and 'distance' not in spatialRel:
            if "point" in selLyrGeomType.lower():
                if lyrGeomType not in geometryTypes[0:2]:
                    processError = True
            elif selLyrGeomType == "Polyline":
                if lyrGeomType not in geometryTypes[0:3]:
                    processError = True
        if processError:
            msg = errorMsgs[100058]
            expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
            msg = msg.format(spatialRel, lyrGeomType, selLyrGeomType, expression)
            params = {"spatialRel": spatialRel, "lyrGeomType": lyrGeomType,
                      "selLyrGeomType": selLyrGeomType, "expression": expression}
            analysisutils.AddErrorCode(msg, 100058, params)
            return False
        else:
            return True


class LocationUtils(object):
    def __init__(self, flyrs, expressions, outFeatures):
        """Initialize properties.

        Args:
            flyrs: a list of layers that will be used to identify locations.
            expressions: a string with search expressions identified.
            outFeatures: absolute path of saving the result.
        Returns:
            No returns.
        Exceptions:
            Exception 100262 if failed to pass the relation expression check (verifyRelExpression).

        """
        self.layers = self.prep_input_layers(flyrs, expressions)
        self.modifiedLayers = []
        self.lyrs = []
        self.selectionSets = []  
        self.selectedFeatures = False
        self.expressionValidator = ExpressionValidator(flyrs)
        self.expressions = json.loads(expressions)

        if not self.expressionValidator.verify_rel_expression(self.expressions):
            analysisutils.AddErrorCode(errorMsgs[100262],
                                       100262, {"expression": expressions})
            raise Exception

        hasGroup = self.expressionValidator.index_expressions(self.expressions)
        self.expressionValidator.sort_expressions(self.expressions)
        self.primaryLayer = self.layers[0]
        self.outFeatures = outFeatures
        self._init_layers(hasGroup)

    def prep_input_layers(self, inputLayers, expressions):
        """Copy the inputLayers into scratchGDB since NEAR_FID won't be able to added to table of database.
        
        Args:
            inputLayers: outputs from GetHostedLayers(). Also compatible with test input layers.
            expressions: a json format string.
        Returns:
            A list of layers (type of FeatureLayer).
        Exceptions:
            No exception.

        """
        if "nearest" in expressions.lower():
            inputFLyrs = []
            for i, tmp_lyr in enumerate(inputLayers):
                desc = arcpy.Describe(tmp_lyr)
                if "scratch.gdb" not in desc.catalogPath:
                    tmp_shapeType = getattr(desc, "shapeType", None)
                    if tmp_shapeType:
                        arcpy.CopyFeatures_management(tmp_lyr, os.path.join(arcpy.env.scratchGDB, 'inputLyr_%i'%i))
                        tmp_flyr = arcpy.MakeFeatureLayer_management(os.path.join(arcpy.env.scratchGDB, 'inputLyr_%i'%i))
                    else:
                        tmp_flyr = arcpy.MakeFeatureLayer_management(tmp_lyr)
                    inputFLyrs.append(tmp_flyr.getOutput(0).name)
                else:
                    tmp_flyr = arcpy.MakeFeatureLayer_management(tmp_lyr)
                    inputFLyrs.append(tmp_flyr.getOutput(0).name)
        else:
            inputFLyrs = [arcpy.MakeFeatureLayer_management(x).getOutput(0) for x in inputLayers]
            inputFLyrs = [x.name for x in inputFLyrs]
        return inputFLyrs

    def _init_layers(self, hasGroup):
        """Initialize layers based on environment."""
        if arcpy.env.extent:
            self.selectedFeatures = True
            layerIndex = -1
            if hasGroup:
                for layer in self.layers:
                    layerIndex = layerIndex + 1
                    (_, selectionSet) = self._get_selectionset_and_oidfield(layer)

                    self.lyrs.append(layer)
                    self.selectionSets.append(selectionSet)
                    arcpy.AddMessage("Saving layer selection {},{}".format(layerIndex, len(selectionSet)))
        else:
            self.selectedFeatures = False

    def find_existing_locations(self):
        """Find existing locations based on the user's inputs."""
        # arcpy.env.extent = None
        selectedLayersIndex = []
        self._select_features(self.expressions, self.selectedFeatures, selectedLayersIndex)
        featcount_bcf = int(arcpy.GetCount_management(self.layers[0]).getOutput(0))
        arcpy.CopyFeatures_management(self.layers[0], self.outFeatures)
        featcount_acf = int(arcpy.GetCount_management(self.outFeatures).getOutput(0))
        if featcount_bcf != featcount_acf:
            arcpy.AddMessage("Not all selected features got copied.")
            raise arcpy.ExecuteError

    def derive_new_locations(self):
        """Core logic of derive new locations."""
        arcpy.env.extent = None
        if os.path.dirname(self.outFeatures) == 'in_memory':
            wkspc = 'in_memory'
        else:
            wkspc = arcpy.env.scratchGDB

        selectedLayersIndex = []
        _, prevFeatures, _ = self.overlay_features(self.expressions, False, wkspc, selectedLayersIndex)
        prev_feat_count = int(arcpy.GetCount_management(prevFeatures).getOutput(0))
        arcpy.CopyFeatures_management(prevFeatures, self.outFeatures)
        out_feat_count = int(arcpy.GetCount_management(self.outFeatures).getOutput(0))
        if prev_feat_count != out_feat_count:
            arcpy.AddMessage("Not all result features got copied.")
            raise arcpy.ExecuteError

    def _get_selectionset_and_oidfield(self, layer):
        """Get the current selection set and the name of oid field.

        Args:
            layer: an instance of feature layer.
        Returns:
            a two item tuple (oid field name, and a list of ids for the selection set of layer).
        Exceptions:
            No exception.
        """
        desc = arcpy.Describe(layer)
        if hasattr(desc, "FIDSet"):
            selectionSetStr = desc.FIDSet
            selection_set = [x for x in selectionSetStr.split(';')]
        else:
            selection_set = []
        oid_field_name = desc.OIDFieldName
        return (oid_field_name, selection_set)

    def _select_features(self, expressions, subgroup, selectedLayersIndex):
        """Select features based on query expressions."""
        if subgroup:
            (oidFieldName, selectionSet1) = self._get_selectionset_and_oidfield(self.primaryLayer)

        firstOperator = ""

        for i, currExpression in enumerate(expressions):
            # verify whether it is final expression or a set of expression
            if isinstance(currExpression, list):
                arcpy.env.extent = None
                operator = self._select_features(currExpression, True, selectedLayersIndex)
                if len(firstOperator) == 0:
                    firstOperator = operator.lower()
            else:
                tmp_sub_group = subgroup if i == 0 else False
                index = currExpression.get("index")
                layerindex = currExpression.get("layer")
                layer = self.layers[layerindex]
                operator = currExpression.get("operator", "and")
                if index == 0:
                    firstOperator = operator.lower()
                # verify whether attribute or location
                whereExpr = currExpression.get("where")
                if whereExpr:
                    whereExpr = ExpressionValidator.update_where_expression(layer, whereExpr)
                    selectionType = self._get_selection_type(selectedLayersIndex, operator, layerindex, tmp_sub_group)
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
                    selectingLayer = self.layers[currExpression.get("selectingLayer")]
                    distance, _, _ = self._get_distance(currExpression)
                    # handle not conditions
                    spatialRel = spatialRel.upper()
                    if "NOT" in spatialRel:
                        spatialRel = spatialRel.replace("NOT", "")
                        invertSpatialRel = True
                    else:
                        invertSpatialRel = False
                    selectionType = self._get_selection_type(selectedLayersIndex, operator, layerindex, tmp_sub_group)

                    # get desktop keyword for spatialRel
                    if spatialRel.upper() != 'NEAREST':
                        spatialRel = self._update_spatial_rel(spatialRel)
                        msg = u"{} {} {} {} {} {}".format(layer, spatialRel,
                                                          selectingLayer, distance, selectionType, invertSpatialRel)
                        arcpy.AddMessage(msg)
                        arcpy.SelectLayerByLocation_management(layer, spatialRel, selectingLayer,
                                                               distance, selectionType, invertSpatialRel)
                    else:
                        self._select_closest_features(layer, selectingLayer, selectionType, invertSpatialRel)

        if subgroup:
            if firstOperator == "or":
                selectionType = "ADD_TO_SELECTION"
            else:
                selectionType = "SUBSET_SELECTION"
            if len(selectionSet1) and selectionSet1[0].strip() != '':
                whereClause = "%s IN (%s)"%(oidFieldName, ",".join(selectionSet1))
                arcpy.SelectLayerByAttribute_management(self.primaryLayer, selectionType, whereClause)

        return firstOperator

    def _select_closest_features(self, layer, selectingLayer, selectionType, invertSpatialRel):
        """Select features from layer that are nearest to the selectingLayer.

        Args:
            layer: a layer instance from which features will be selected from.
            selectingLayer: a layer instance that is used as a reference in location.
            selectionType: type of selection.
            invertSpatialRel: true to select features that are nearest to selectingLayer, false to select
            features that are not nearest to selectingLayer.

        Returns:
            No return.

        Exception:
            No exception.

        """
        # Default of search_radius, location, and angle
        arcpy.Near_analysis(selectingLayer, layer)
        # after the near_analysis, selectingLayer should have two new fields ['NEAR_FID', 'NEAR_DIST']
        closest_ids = []
        with arcpy.da.SearchCursor(selectingLayer, ["NEAR_FID"]) as rows:
            for row in rows:
                closest_id = row[0]
                closest_ids.append(closest_id)

        # Construct the query
        tmpSelectionSet = [str(x) for x in closest_ids]
        tmpSelectionSet = ",".join(tmpSelectionSet)
        tmpOidFieldName = arcpy.Describe(layer).OIDFieldName
        if invertSpatialRel:
            whereClause = "%s NOT IN (%s)"%(tmpOidFieldName, tmpSelectionSet)
        else:
            whereClause = "%s IN (%s)"%(tmpOidFieldName, tmpSelectionSet)

        arcpy.SelectLayerByAttribute_management(layer, selectionType, whereClause)

    def _update_spatial_rel(self, spatialRel):
        """Converts to appropriate desktop spatialrel."""
        spatialRel = spatialRel.upper()
        dt_spatialRel = {"WITHINDISTANCE": "WITHIN_A_DISTANCE_GEODESIC",
                         "COMPLETELYCONTAINS": "COMPLETELY_CONTAINS",
                         "COMPLETELYWITHIN": "COMPLETELY_WITHIN",
                         "INTERSECTS": "INTERSECT"}
        if spatialRel in dt_spatialRel:
            return dt_spatialRel[spatialRel]
        else:
            return spatialRel

    def _get_selection_type(self, selectedLayersIndex, operator, layerIndex, subgroup):
        """Identify the selection type to be used for attribute and location."""
        if operator:
            operator = operator.upper()
        else:
            operator = ""

        if layerIndex not in selectedLayersIndex:
            selectedLayersIndex.append(layerIndex)
            if self.selectedFeatures:
                if subgroup and layerIndex in self.modifiedLayers:
                    lyr = self.lyrs[layerIndex]
                    selectionSet = self.selectionSets[layerIndex]
                    arcpy.AddMessage("Restoring layer selection {},{}".format(layerIndex, len(selectionSet)))
                    tmpSelectionSet = [str(x) for x in selectionSet]
                    tmpSelectionSet = ",".join(tmpSelectionSet)
                    tmpOidFieldName = arcpy.Describe(lyr).OIDFieldName
                    whereClause = "%s IN (%s)"%(tmpOidFieldName, tmpSelectionSet)
                    arcpy.SelectLayerByAttribute_management(lyr, "NEW_SELECTION", whereClause)

                selectionType = "SUBSET_SELECTION"
            else:
                selectionType = "NEW_SELECTION"
        elif subgroup and arcpy.env.extent:
            if operator == "OR":
                selectionType = "ADD_TO_SELECTION"
            elif operator == "AND":
                selectionType = "SUBSET_SELECTION"
        elif subgroup and arcpy.env.extent is None:
            selectionType = "NEW_SELECTION"
        elif operator == "OR":
            selectionType = "ADD_TO_SELECTION"
        elif operator == "AND":
            selectionType = "SUBSET_SELECTION"

        if layerIndex not in self.modifiedLayers:
            self.modifiedLayers.append(layerIndex)

        return selectionType

    def _get_distance(self, currExpression):
        """Concatenates distance and units when needed."""
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
                analysisutils.AddErrorCode(errorMsgs[100062].format(expression), 100062,
                                           {"expression": expression})
                raise arcpy.ExecuteError
        return distance, distanceValue, units

    def overlay_features(self, expressions, subgroup, wkspc, selectedLayersIndex):
        """selects features based on query expressions"""
        firstOperator = ""
        prevFeatures = ""
        prevShapeType = ""
        overlayIndex = 0

        layer_oid_field_name = ''
        upper_level_selection = []
        rel_operator_to_upper_level = ''
        focus_layer_index = 0

        for i, currExpression in enumerate(expressions):
            # verify whether it is final expression or a set of expression
            result_from_group = False
            if isinstance(currExpression, list):
                index = currExpression[0].get("index")
                focus_layer_index = currExpression[0].get("layer")
                layer = self.layers[focus_layer_index]
                (layer_oid_field_name, upper_level_selection) = self._get_selectionset_and_oidfield(layer)
                rel_operator_to_upper_level = currExpression[0].get('operator', "")
                
                operator, prevFeatures, prevShapeType = self.overlay_features(currExpression, True, wkspc, selectedLayersIndex)
                result_from_group = True
                if len(firstOperator) == 0:
                    firstOperator = operator
            else:
                tmp_sub_group = subgroup if i == 0 else False
                index = currExpression.get("index")
                layerindex = currExpression.get("layer")
                layer = self.layers[layerindex]
                dLayer = arcpy.Describe(layer)
                shapeType = dLayer.shapeType
                selectingLayer = ""
                operator = currExpression.get("operator", "and").lower()
                if index == 0:
                    firstOperator = operator
                # verify whether attribute or location
                whereExpr = currExpression.get("where")
                if whereExpr:
                    whereExpr = ExpressionValidator.update_where_expression(layer, whereExpr)
                    selectionType = self._get_selection_type(selectedLayersIndex, operator, layerindex,
                                                             tmp_sub_group)
                    msg = u"{} {} {}".format(layer, whereExpr, selectionType)
                    arcpy.AddMessage(msg)
                    try:
                        arcpy.management.SelectLayerByAttribute(layer, selectionType, whereExpr)
                    except:
                        expression = json.dumps(currExpression, ensure_ascii=False, sort_keys=True)
                        analysisutils.AddErrorCode(errorMsgs[100060], 100060, expression)
                        raise arcpy.ExecuteError

                else:
                    spatialRel = currExpression.get("spatialRel")
                    selectingLayer = self.layers[currExpression.get("selectingLayer")]
                    distance, distanceValue, units = self._get_distance(currExpression)
                    # handle not conditions
                    spatialRel = spatialRel.upper()
                    if "NOT" in spatialRel:
                        spatialRel = spatialRel.replace("NOT", "")
                        invertSpatialRel = True
                    else:
                        invertSpatialRel = False
                    selectionType = self._get_selection_type(selectedLayersIndex, operator, layerindex, tmp_sub_group)

                    if spatialRel == "WITHINDISTANCE" and shapeType != "Point":
                        outfeatures1 = os.path.join(wkspc, "buffer{}".format(index))

                        bufferUtils.createBuffers(selectingLayer, [distanceValue], "", units,
                                                  "dissolve", "disks", "full", "round", outfeatures1, False)

                        tmpFeatures = os.path.join(wkspc, 'tmpFeatures')
                        # Use copyFeatures instead of simpleCopy to honor the selection.
                        arcpy.management.CopyFeatures(layer, tmpFeatures)
                        if invertSpatialRel:
                            outfeatures = os.path.join(wkspc, "erase{}".format(index))
                            arcpy.AddMessage(outfeatures)
                            arcpy.Erase_analysis(tmpFeatures, outfeatures1, outfeatures)
                        else:
                            distancefieldname = "WithinDistance"
                            distancefieldalias = "Within Distance {}".format(units)
                            expression = "{}".format(distanceValue)
                            arcpy.AddField_management(outfeatures1, distancefieldname, 'DOUBLE',
                                                      "", "", "", distancefieldalias)
                            arcpy.CalculateField_management(outfeatures1, distancefieldname, expression, 'PYTHON')
                            outfeatures = os.path.join(wkspc, "intersect{}".format(index))
                            arcpy.AddMessage(outfeatures)
                            arcpy.Intersect_analysis([tmpFeatures, outfeatures1], outfeatures)
                        layer = outfeatures
                        dLayer = arcpy.Describe(layer)
                        shapeType = dLayer.shapeType

                        self.layers[layerindex] = arcpy.management.MakeFeatureLayer(layer).getOutput(0).name
                    elif spatialRel == "INTERSECTS" and shapeType != "Point":
                        tmpFeatures = os.path.join(wkspc, 'tmpFeatures')
                        arcpy.management.CopyFeatures(layer, tmpFeatures)
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

                        self.layers[layerindex] = arcpy.management.MakeFeatureLayer(layer).getOutput(0).name
                    elif spatialRel == 'NEAREST':
                        self._select_closest_features(layer, selectingLayer,
                                                      selectionType, invertSpatialRel)
                    else:  
                        # get desktop keyword for spatialRel
                        spatialRel = self._update_spatial_rel(spatialRel)
                        msg = u"{} {} {} {} {} {}".format(layer, spatialRel, selectingLayer,
                                                          distance, selectionType, invertSpatialRel)
                        arcpy.AddMessage(msg)                   
                        arcpy.SelectLayerByLocation_management(layer, spatialRel, selectingLayer,
                                                               distance, selectionType, invertSpatialRel)

            if not result_from_group:
                prevFeatures = layer
                prevShapeType = shapeType
  
        if focus_layer_index == 0 and rel_operator_to_upper_level.strip() != '':
            if rel_operator_to_upper_level.upper() == 'AND':
                tmp_selection_type = "SUBSET_SELECTION"
            elif rel_operator_to_upper_level.upper() == 'OR':
                tmp_selection_type = "ADD_TO_SELECTION"

            if upper_level_selection and upper_level_selection[0] != "":
                whereClause = "%s IN (%s)"%(layer_oid_field_name, ",".join(upper_level_selection))
                arcpy.SelectLayerByAttribute_management(layer, tmp_selection_type, whereClause)
            prevFeatures = layer

        return firstOperator, prevFeatures, prevShapeType
