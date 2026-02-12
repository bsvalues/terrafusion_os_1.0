from __future__ import unicode_literals

# core libraries
import os
import warnings
import json
#import sys
import numpy
from datetime import datetime

# internal libraries
import arcpy
import analysisutils
import uuid

try:
    unicode=unicode
except NameError:
    str = str
    unicode = str
    bytes = bytes
    basestring = (str, bytes)
else:
    str = str
    unicode = unicode
    bytes = str
    basestring = basestring

#import debugUtils

errorMsgs = {
    100055: "Invalid expression; malformed JSON.",
    100257: "Some of the values in the target fields are invalid and cannot be joined"
}
maxInt=2147483647
arcpy.env.preserveGlobalIds = True


class SpatialJoinFeatures:
    '''joins two features with the given spatial relationship'''
    spatialRelationship = {
                           "intersects": "INTERSECT",
                           "withindistance": "WITHIN_A_DISTANCE",
                           "contains": "CONTAINS_CLEMENTINI",
                           "completelycontains": "COMPLETELY_CONTAINS",
                           "completelywithin":"COMPLETELY_WITHIN",
                           "within": "WITHIN_CLEMENTINI",
                           "identicalto":"ARE_IDENTICAL_TO"
                          }
    # used for reverse selection of JoinLayer
    selectSpatialRelationship =  {
                            "intersects": "INTERSECT",
                            "withindistance": "WITHIN_A_DISTANCE",
                            "contains": "WITHIN_CLEMENTINI",
                            "completelycontains": "COMPLETELY_WITHIN",
                            "completelywithin" : "COMPLETELY_CONTAINS",
                            "within": "CONTAINS_CLEMENTINI",
                            "identicalto": "ARE_IDENTICAL_TO"
                             }
    SHAPE_FIELDS = ["shape_area", "shape_length", "st_area_shape_", "st_length_shape_"]

    def __init__(self, params):

        #targetLayer must be a layer
        self.targetLayer = ""
        self.joinLayer = ""
        self.joinOperation = ""
        self.joinOutput = ""
        self.spatialRel = ""
        self.summaryFields = ""
        self.spatialRelUnits = ""
        self.spatialRelDistance = ""
        self.wkspc = "in_memory"

        for k,v in params.items():
            setattr(self, k, v)

        if self.spatialRelDistance and self.spatialRelUnits:
            self.search_radius  = "{} {}".format(self.spatialRelDistance, self.spatialRelUnits)
        else:
            self.search_radius = None

    def spatialJoin(self):
        '''joins spatially'''

        if self.joinOperation == "JOIN_ONE_TO_MANY":
            arcpy.SpatialJoin_analysis(self.targetLayer,
                                       self.joinLayer,
                                       self.joinOutput,
                                       "JOIN_ONE_TO_MANY", "KEEP_COMMON", "#",
                                       self.spatialRelationship[self.spatialRel],
                                       self.search_radius)

        else:
            fieldMappings, newSummaryFields = analysisutils.createFieldMappings(self.joinLayer,
                                                                                self.targetLayer,
                                                                                self.summaryFields,
                                                                                None)
            arcpy.AddMessage(self.spatialRel)
            if not self.summaryFields:
                fieldMappings = self.addOtherFieldsToFieldMappings(fieldMappings)
            arcpy.SpatialJoin_analysis(self.targetLayer, self.joinLayer,
                                       self.joinOutput, "JOIN_ONE_TO_ONE",
                                       "KEEP_COMMON", fieldMappings,
                                       self.spatialRelationship[self.spatialRel],
                                       self.search_radius)


        #delete unnecessary fields
        deleteFields = []
        descJoinOutput = arcpy.Describe(self.joinOutput)
        joinOutputFields = descJoinOutput.fields
        target_fid = analysisutils.getAccurateFieldName(joinOutputFields, "TARGET_FID")
        deleteFields.append(target_fid)
        if self.joinOperation == "JOIN_ONE_TO_MANY":
            joinCount = analysisutils.getAccurateFieldName(joinOutputFields, "Join_Count")
            deleteFields.append(joinCount)
        arcpy.AddMessage(deleteFields)
        arcpy.DeleteField_management(self.joinOutput, ";".join(deleteFields))
        return True

    def selectFeatures(self):
        '''selects target features based on the spatialRel'''
        targetLyrDesc = arcpy.Describe(self.targetLayer)
        selectionType = "NEW_SELECTION"
        if len(targetLyrDesc.FIDSet) > 0 :
            selectionType = "SUBSET_SELECTION"
        arcpy.SelectLayerByLocation_management(self.targetLayer,
                                                self.spatialRelationship[self.spatialRel],
                                                self.joinLayer, self.search_radius,
                                                selectionType)

    def selectJoinFeatures(self, geometry):
        arcpy.SelectLayerByLocation_management(self.joinLayer,
                                               self.selectSpatialRelationship[self.spatialRel],
                                               geometry, self.search_radius,
                                               "NEW_SELECTION")

    def addOtherFieldsToFieldMappings(self, fieldMappings):
        """Create field mappings."""
        descJoinLayer = arcpy.Describe(self.joinLayer)
        joinLayerFieldInfo = descJoinLayer.fields
        joinLayerFields = [field.name.lower() for field in joinLayerFieldInfo]
        joinLayerFields.remove(descJoinLayer.shapeFieldName.lower())
        joinLayerFields.remove(descJoinLayer.OIDFieldName.lower())
        for fld in self.SHAPE_FIELDS:
            if fld in joinLayerFields:
                joinLayerFields.remove(fld)
        if self.summaryFields:
            summaryFields = [sumStats[0].lower() for sumStats in self.summaryFields]
        else:
            summaryFields = []
        for fieldName in joinLayerFields:
            if fieldName not in summaryFields:
                newFieldMap = arcpy.FieldMap()
                newFieldMap.addInputField(self.joinLayer, fieldName)
                newFieldMap.mergeRule = "First"
                # # Assign name and alias name for output field
                outputField = newFieldMap.outputField
                # outputField.name = u"{0}_{1}".format("First", outputField.name)
                # outputField.aliasName = analysisutils.getSummaryAliasField(outputField.aliasName, "First")
                # Check if field name already exists in current field map.
                i = 0
                tName = outputField.name
                while (fieldMappings.findFieldMapIndex(tName) >= 0):
                    i = i + 1
                    tName = u"{0}_{1}".format(outputField.name, i)
                if i > 0:
                    outputField.name = u"{0}_{1}".format(outputField.name, i)
                    outputField.aliasName = u"{0} {1}".format(outputField.aliasName, i)
                newFieldMap.outputField = outputField
                fieldMappings.addFieldMap(newFieldMap)
        return fieldMappings


class AttributeJoinFeatures:
    '''join attributes based on attributes'''

    SHAPE_FIELDS = ["shape_area","shape_length", "st_area_shape_", "st_length_shape_" ]
    STRING_TYPES = ["String", "Guid"]

    def __init__(self, params):

        # targetLayer must be a layer
        self.targetLayer = ""
        self.joinLayer = ""
        self.joinOperation = ""
        self.joinOutput = ""
        self.summaryFields = ""
        self.recordToMatch = None
        self.wkspc = "in_memory"
        self.attributeRel = ""
        self.spatialRel = ""
        self.spatialRelUnits = ""
        self.spatialRelDistance = ""
        self.descJoinLayer = ""
        self.descTargetLayer = ""

        self.params = params

        for k, v in params.items():
            setattr(self, k, v)

    def addJoinLayerFields(self, targetLayerFieldInfo, joinLayerFieldInfo, joinOIDFieldName,
                           fieldsToJoin=None, excludeFields=None, list_of_new_fields=None):
        if fieldsToJoin is None:
            fieldsToJoin = []
        if excludeFields is None:
            excludeFields = []
        if list_of_new_fields is None:
            list_of_new_fields = []

        for field in joinLayerFieldInfo:
            field_name = field.name
            field_alias = field.aliasName
            field_type = field.type
            fname_lower = field_name.lower()
            if (field.type != 'Geometry') and \
                    (fname_lower not in self.SHAPE_FIELDS) and \
                    (fname_lower not in excludeFields) and \
                    (fname_lower != joinOIDFieldName.lower()):
                # verify fieldnames is not there in already added fields
                if field_name.lower() in list_of_new_fields:
                    (field_name, field_alias) = self.generateNewFieldName(field_name, field_alias, list_of_new_fields)
                    # if a new field was created, make sure the new field name is not there in joinfields
                    (field_name, field_alias) = analysisutils.createUniqueFieldName("", field_name, field_alias,
                                                                                    joinLayerFieldInfo)
                arcpy.AddField_management(self.joinOutput, field_name, field_type,
                                          field.precision, field.scale, field.length,
                                          field_alias, "#", "#", field.domain)
                list_of_new_fields.append(field_name.lower())
                fieldsToJoin.append(field.name)
        return fieldsToJoin

    def generateNewFieldName(self, field_name, field_alias, fieldNamesList):
        i = 0
        # to prevent casing copy it to tmp var
        tmpFName = field_name.lower()
        while (tmpFName in fieldNamesList):
            i = i + 1
            tmpFName = u"{0}_{1}".format(tmpFName, i)
        if i > 0:
            field_name = u"{0}_{1}".format(field_name, i)
            field_alias = u"{0} {1}".format(field_alias, i)
        return field_name, field_alias

    def _compare_val(self, value, value2compare, stats):
        """Compare two value based on the defined stats.

        Args:
            value: the value to compare with.
            value2compare: the value to be compared against.
            stats: a string that is either min or max.
        Returns:
            a boolean. For example, if value is 4 and value2compare is 6 and stats is min, then return False.
        Exceptions:
            No expcetion.

        """
        if value is not None and value2compare is not None:
            return value > value2compare if stats.lower() == 'min' else value < value2compare
        elif value is not None and value2compare is None:
            return False
        elif value is None and value2compare is not None:
            return True
        else:
            return False

    def _get_field_index_by_name(self, lyr_field_names, field_name):
        for i, fname in enumerate(lyr_field_names):
            if fname.lower() == field_name.lower():
                return i
        return None

    def get_recordtomatch_rule(self, fields_to_search=None):
        """Get the field index and related statistics to match record.

        Args:
            fields_to_search: a list of string to search field from.
        Returns:
            A two item tuple (field_index and stats).
        Exception:
            TypeError is raised if recordToMatch is not a json.
            ValueError is raised if orderByFields is not in appropriate format (field name and order).

        """
        if self.recordToMatch:
            if not isinstance(self.recordToMatch, dict):
                self.recordToMatch = json.loads(self.recordToMatch)

            if not isinstance(self.recordToMatch, dict):
                analysisutils.AddErrorCode(errorMsgs[100055], 100055)
                raise Exception
            
            # if the recordToMatch does not contain "orderByFields", use the default rule.
            if "orderByFields" not in self.recordToMatch:
                arcpy.AddMessage('oderByFields is not in {}'.format(self.recordToMatch))
                return (None, None)

            orderByFields = self.recordToMatch["orderByFields"]
            try:
                (fieldName, order) = orderByFields.strip().split(" ")
            except:
                arcpy.AddError("Invalid orderByFields value of {}".format(orderByFields))
                raise ValueError

            if order.upper() not in ["ASC", "DESC"]:
                arcpy.AddError("Fields order can only be ASC or DESC.")
                raise ValueError

            stats = "min" if order.upper() == "ASC" else "max"
            if not fields_to_search:
                fields = arcpy.ListFields(self.joinLayer)
                fields_to_search = [field.name for field in fields]

            fieldIndex = self._get_field_index_by_name(fields_to_search, fieldName)
            if fieldIndex:
                return (fieldIndex, stats)
            else:
                arcpy.AddMessage("joinLayer does not have a field named {}. First record will be kept.".format(fieldName))
                return (None, None)
        else:
            return (None, None)

    def get_row_by_stats(self, cursor, field_index, stats=None):
        """To get a row from a searching cursor based on the defined record to match. For example, keep the record
        with maximum of price.

        Args:
            cursor: an instance of SearchCursor.
            field_index: index of the field to match statistics from.
            stats: a string indicates the statistics to look at. Can only be [None, 'min', 'max']. If the field type
            is date, min indicates the earliest while max indicates the most current. Default is None which will
            select the row with the first appearance.
        Returns:
            An instance of row. None is returned if no rows in the cursor.
        Exceptions:
            No exception.

        """
        if not stats:
            try:
                return cursor.next()
            except:
                return None

        curr_val = None
        row2keep = None
        for row in cursor:
            tmp_val = row[field_index]
            if not row2keep:
                curr_val = tmp_val
                row2keep = row
            elif self._compare_val(curr_val, tmp_val, stats):
                curr_val = tmp_val
                row2keep = row
 
        return row2keep

    def get_output_fieldtype(self, fields, stat_field_name):
        """Get the type of the output statistics field.

        Args:
            fields: a list of Field.
            stat_field_name: name of field to calculate statistics.
        Returns:
            A string indicate the type of the output field.
        Exceptions:
            No field named <stat_field_name> is raised.

        """
        for field in fields:
            if field.name.lower() == stat_field_name.lower():
                return 'DATE' if field.type == 'Date' else 'DOUBLE'

        arcpy.AddError('No field named {}.'.format(stat_field_name))
        raise Exception

    def get_summary_stats(self, joinLyrNumpyArr):
        """Calculate the statistics.

        Args:
            joinLyrNumpyArr: a dictionary keyed by the field name and valued by a numpy array.
        Returns:
            a list of the statistics of each column.
        Exceptions:
            No Exception.

        """
        newRow = []
        for fieldName, stats in self.summaryFields:
            if stats.lower() == "stddev":
                stats = "std"
            fieldArr = joinLyrNumpyArr[fieldName]
            # remove none fields
            # fieldArr = fieldArr[numpy.where(fieldArr != float(maxInt))]
            try:
                fieldArr = fieldArr[numpy.isfinite(fieldArr)]
                #fieldArr = fieldArr[numpy.where(fieldArr != float(maxInt))]
            except TypeError:
                # isfinite is not working for datetime datatype
                # This might not be supported in future.
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    fieldArr = fieldArr[numpy.where(fieldArr != numpy.datetime64('NaT'))]

            if len(fieldArr) > 0:
                stats = getattr(fieldArr, stats.lower())()
                if isinstance(stats, numpy.datetime64):
                    stats = stats.astype(datetime)
                newRow.append(stats)
            else:
                newRow.append(numpy.NaN)
        
        return newRow

    def attributeJoin(self):

        # process joinlayer
        descJoinLayer = arcpy.Describe(self.joinLayer)
        joinLayerFieldInfo = descJoinLayer.fields

        if getattr(descJoinLayer,"shapeType", None):
            if (self.spatialRel and len(descJoinLayer.FIDSet) > 0) or (".gdb" not in descJoinLayer.catalogPath):
                # need to copy features to avoid unnecessary selection/reselection later
                # selection and expression combination doesn't work for SDE Layers, hence copy
                tmpJoinLayer = os.path.join(arcpy.env.scratchGDB, "tmp_joinLayer")
                arcpy.CopyFeatures_management(self.joinLayer, tmpJoinLayer)
                self.joinLayer = "joinLayer"
                arcpy.MakeFeatureLayer_management(tmpJoinLayer, self.joinLayer)
                self.params["joinLayer"] = self.joinLayer
                descJoinLayer = arcpy.Describe(self.joinLayer)
                joinLayerFieldInfo = descJoinLayer.fields

        # if spatialRel is specified,
        if self.spatialRel:
            arcpy.AddMessage("Filter features based on spatial rel")
            #filter target features for performance
            SJFeatures = SpatialJoinFeatures(self.params)
            SJFeatures.selectFeatures()

        arcpy.AddMessage("Filter features based on attribute rel")
        self.targetFields = [attrRel["targetField"].lower() for attrRel in self.attributeRel]
        self.joinFields = [attrRel["joinField"].lower() for attrRel in self.attributeRel]

        #find the joinfields datatypes to support fields with different datatypes in attribute expressions
        joinFieldsDataType = {}
        #arcpy.AddMessage("joinFields:{}".format(self.joinFields))
        for fieldname in self.joinFields:
            fieldType = [field.type for field in descJoinLayer.fields if (field.name.lower() == fieldname.lower())]
            if fieldType:
                joinFieldsDataType[fieldname.lower()] = fieldType.pop()
        arcpy.AddMessage("joinFieldsDataType:{}".format(joinFieldsDataType))

        # find position of target fields for later as well..
        descTargetLayer = arcpy.Describe(self.targetLayer)
        targetLayerFieldInfo = descTargetLayer.fields
        descTargetFields = [field.name.lower() for field in targetLayerFieldInfo]
        # to be used in cursor
        targetFieldsPosition = [descTargetFields.index(fld) for fld in self.targetFields]

        #create output based on featureclass or table
        if getattr(descTargetLayer,"shapeType", None):
            # create schema for output
            fcName = os.path.basename(self.joinOutput)
            shapeType = descTargetLayer.shapeType.upper()
            arcpy.AddMessage("Create Feature Class output:{}".format(shapeType))
            arcpy.CreateFeatureclass_management(self.wkspc, fcName,
                                            shapeType, self.targetLayer,
                                            "SAME_AS_TEMPLATE",
                                            "SAME_AS_TEMPLATE", self.targetLayer)
        else:
            #create schema for output
            arcpy.AddMessage("Create table output")
            tableName = os.path.basename(self.joinOutput)
            arcpy.CreateTable_management(self.wkspc, tableName, self.targetLayer)

        # Add more field to schema as needed

        #new fields in joinOutput apart from targetLayerFields
        list_of_new_fields = []
        list_of_new_fields.extend(descTargetFields)
        # Maintain a fieldlist to join from joinLayer
        fieldsToJoin = []
        #fields that should not be added(ex: fields in attribute relationship, summary stats etc)
        excludeFields = []
        excludeFields.extend(self.joinFields)
        joinOidFieldName = descJoinLayer.OIDFieldName.lower()

        if self.joinOperation == "JOIN_ONE_TO_MANY":
            self.addJoinLayerFields(targetLayerFieldInfo, joinLayerFieldInfo, joinOidFieldName, fieldsToJoin,
                                    excludeFields, list_of_new_fields)
        else:
            if self.summaryFields:
                # Add field for count
                field_name = "Join_Count"
                field_alias = "Join Count"
                field_name, field_alias = analysisutils.createUniqueFieldName("", field_name, field_alias,
                                                                              targetLayerFieldInfo)
                # make sure joincount is not in joinlayerfields as well
                field_name, field_alias = analysisutils.createUniqueFieldName("", field_name, field_alias,
                                                                              joinLayerFieldInfo)
                arcpy.AddField_management(self.joinOutput, field_name, "LONG",
                                          "#", "#", "#", field_alias)
                list_of_new_fields.append(field_name.lower())

                for fieldName, stats in self.summaryFields:
                    field_data_type = self.get_output_fieldtype(joinLayerFieldInfo, fieldName)
                    field_name = "{}_{}".format(stats, fieldName)
                    field_alias = "{} {}".format(stats, fieldName)
                    field_name, field_alias = analysisutils.createUniqueFieldName("", field_name,
                                                                                  field_alias, targetLayerFieldInfo)
                    arcpy.AddField_management(self.joinOutput, field_name, field_data_type,
                                              "#", "#", "#", field_alias)
                    list_of_new_fields.append(field_name.lower())
                    fieldsToJoin.append(fieldName)
                    fieldsToJoin = list(set(fieldsToJoin))
                #excludeFields.extend([fld.lower() for fld in fieldsToJoin])
            #Add rest of the joinLayer Fields
            else:
                self.addJoinLayerFields(targetLayerFieldInfo, joinLayerFieldInfo,
                                        joinOidFieldName, fieldsToJoin,
                                        excludeFields, list_of_new_fields)
            #fieldsToJoin = [descJoinLayer.OIDFieldName]

        #debug fields
        #debugUtils.debugFields(self.joinOutput)

        #define numpy fn for joinLayer
        if getattr(descJoinLayer,"shapeType", None):
            numpyfn = getattr(arcpy.da, "FeatureClassToNumPyArray")
        else:
            numpyfn = getattr(arcpy.da, "TableToNumPyArray")
        arcpy.AddMessage(numpyfn.__name__)


        # create row data and add to output
        descJoinOutput = arcpy.Describe(self.joinOutput)
        joinOutputFieldNames = [field.name if field.type != 'Geometry' else "SHAPE@" for field in descJoinOutput.fields]
        #arcpy.AddMessage(joinOutputFieldNames)
        targetCurFieldNames = [field.name if field.type != 'Geometry' else "SHAPE@" for field in
                               targetLayerFieldInfo]

        # Update the fieldsToJoin to drop the globalid field 
        (field_index, stats_to_match) = self.get_recordtomatch_rule(fieldsToJoin)

        with arcpy.da.InsertCursor(self.joinOutput, joinOutputFieldNames) as outputCur:
            # arcpy.AddMessage(outputCur.fields)
            with arcpy.da.SearchCursor(self.targetLayer, targetCurFieldNames) as targetCursor:
                for targetRow in targetCursor:
                    # need to handle null values
                    expr = ""
                    for i, pos in enumerate(targetFieldsPosition):
                        # define value
                        if targetRow[pos] is None:
                            value = None
                        elif isinstance(targetRow[pos], str) or isinstance(targetRow[pos], unicode):
                            #check whether the joinFieldsType is number
                            if (joinFieldsDataType[self.joinFields[i].lower()]) not in self.STRING_TYPES:
                                try:
                                    value = float(targetRow[pos])
                                except ValueError:
                                    analysisutils.AddErrorCode(errorMsgs[100257], 100257)
                                    raise Exception
                            else:
                                value = "\'{}\'".format(targetRow[pos].replace("'", "''"))
                        else:
                            #check whether the joinFieldType is string
                            if (joinFieldsDataType[self.joinFields[i].lower()]) in self.STRING_TYPES:
                                #convert numeric to string
                                if isinstance(targetRow[pos], float):
                                    valueStr = str(targetRow[pos]).rstrip("0").rstrip(".")
                                    if (valueStr == "-0"):
                                        valueStr = "0"
                                    value = "\'{}\'".format(valueStr)
                                else:
                                    value = "\'{}\'".format(targetRow[pos])
                            else:
                                value = targetRow[pos]
                        # define expr
                        if expr:
                            if value is None:
                                expr = "{} AND {} is NULL".format(expr, self.joinFields[i])
                            elif isinstance(value, str) or isinstance(value, unicode):
                                # expr = "{} AND UPPER({}) = {}".format(expr, self.joinFields[i], value.upper())
                                try:
                                    # check for guid
                                    if isinstance(uuid.UUID(value[1:-1]), uuid.UUID):
                                        expr = "{} AND {} = {}".format(expr, self.joinFields[i], value)
                                except:
                                    expr = "{} AND UPPER({}) = {}".format(expr, self.joinFields[i], value.upper())
                            else:
                                expr = "{} AND {} = {}".format(expr, self.joinFields[i], value)
                        else:
                            if value is None:
                                expr =  "{} is NULL".format(self.joinFields[i])
                            elif isinstance(value, str) or isinstance(value, unicode):
                                # expr = "UPPER({}) = {}".format(self.joinFields[i], value.upper())
                                try:
                                    if isinstance(uuid.UUID(value[1:-1]), uuid.UUID):
                                        expr = "{} = {}".format(self.joinFields[i], value)
                                except:
                                    expr = "UPPER({}) = {}".format(self.joinFields[i], value.upper())
                            else:
                                expr = "{} = {}".format(self.joinFields[i], value)
                        # arcpy.AddMessage(expr)
                    #if spatialRel select features
                    if self.spatialRel:
                        SJFeatures.selectJoinFeatures(targetRow[1])
                    if self.joinOperation == "JOIN_ONE_TO_MANY" or (not self.summaryFields):
                        with arcpy.da.SearchCursor(self.joinLayer, fieldsToJoin, expr) as joinLyrCur:
                            if self.joinOperation == "JOIN_ONE_TO_MANY":
                                # insert new row for every row in cursor
                                for joinRow in joinLyrCur:
                                    newRow = []
                                    newRow.extend(targetRow)
                                    newRow.extend(joinRow)
                                    outputCur.insertRow(newRow)
                                    del(newRow)
                            else:
                                joinRow = self.get_row_by_stats(joinLyrCur, field_index, stats_to_match)
                                if joinRow:
                                    # joinRow = joinLyrCur.next()
                                    newRow = []
                                    # insert targetRow values in cursor
                                    newRow.extend(targetRow)
                                    # add Join_Count, default value 1
                                    # newRow.append(1)
                                    # insert joinRow values in cursor
                                    newRow.extend(joinRow)
                                    outputCur.insertRow(newRow)
                    else:
                        # insert just stats
                        newRow = []
                        newRow.extend(targetRow)
                        # Drop the null_value setup since it is not working for datetime data type
                        joinLyrNumpyArr = numpyfn(self.joinLayer, fieldsToJoin, expr)  # , null_value=maxInt
                        # If there is no selection, continue
                        if len(joinLyrNumpyArr) == 0:
                            # outputCur.insertRow(targetRow)
                            continue
                        elif self.summaryFields:
                            # Add Count of rows for Join_Count field
                            newRow.append(len(joinLyrNumpyArr))
                            #Add stats value
                            stats = self.get_summary_stats(joinLyrNumpyArr)
                            newRow.extend(stats)
                            outputCur.insertRow(newRow)


if __name__== '__main__':

    #Test Spatial Relation: one to Many:
    arcpy.env.overwriteOutput = True
    params = {}
    params["targetLayer"] = r"E:\10.2AOLTesting\MinorityMajority\data\SFCrime.gdb\testPolygons"
    params["joinLayer"] = r"E:\10.2AOLTesting\MinorityMajority\data\SFCrime.gdb\CrimePoints_small"
    params["joinOperation"] = "JOIN_ONE_TO_MANY"
    params["joinOutput"] = r"E:\JoinFeaturesTest\scratch\scratch.gdb\joinOut"
    params["spatialRel"] = "intersects"
    params["summaryFields"] = None
    params["spatialRelUnits"] = "#"
    params["spatialRelDistance"] = "#"
    params["attributeRel"] = "#"
    params["wkspc"] = "in_memory"
    #joinFeatures = JoinFeatures(params)
    #joinFeatures.spatialJoin()

    # one to one

    params["joinOperation"] = "JOIN_ONE_TO_ONE"
    params["summaryFields"] = [("Intensity", "Sum")]
    params["joinOutput"] = r"E:\JoinFeaturesTest\scratch\scratch.gdb\joinOut1"
    #joinFeatures = JoinFeatures(params)
    #joinFeatures.spatialJoin()


    # Test Attribute Join

    #One-to-many
    params = {}
    params["targetLayer"] = r'E:\JoinFeaturesTest\data\hospitals.gdb\State_boundaries'
    params["joinLayer"] = r"E:\JoinFeaturesTest\data\hospitals.gdb\CongressionalDistricts"
    params["joinOperation"] = "JOIN_ONE_TO_MANY"
    params["joinOutput"] = r"E:\JoinFeaturesTest\scratch\scratch.gdb\joinOut3"
    params["summaryFields"] = None
    params["attributeRel"] = [{ "targetField":"STATE_ABBR", "joinField":"STATE_ABBR", "operator":"equal"}]
    params["wkspc"] = "in_memory"
    #joinFeatures = JoinFeatures(params)
    #joinFeatures.attributeJoin()

    #One to One and intersects
    params = {}
    params["wkspc"] = r'E:\JoinFeaturesTest\scratch\scratch.gdb'
    params["targetLayer"] = "targetLayer"
    targetLayer = r'E:\JoinFeaturesTest\data\hospitals.gdb\State_boundaries'
    arcpy.MakeFeatureLayer_management(targetLayer, params["targetLayer"])
    params["joinLayer"] = r"E:\JoinFeaturesTest\data\hospitals.gdb\CongressionalDistricts"
    params["joinOperation"] = "JOIN_ONE_TO_ONE"
    params["joinOutput"] = os.path.join(params["wkspc"], "joinOut4")
    params["summaryFields"] = [("ShortInt", "Sum")]
    params["spatialRel"] = "intersects"
    params["attributeRel"] = [{ "targetField":"STATE_ABBR", "joinField":"STATE_ABBR", "operator":"equal"},
                              { "targetField":"STATE_FIPS", "joinField":"STFIPS", "operator":"equal"}]

    #joinFeatures = JoinFeatures(params)
    #joinFeatures.attributeJoin()
    AttributeJoinFeatures(params).attributeJoin()
