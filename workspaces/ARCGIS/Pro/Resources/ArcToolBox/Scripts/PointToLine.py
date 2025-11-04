import os
import arcpy

def convertPoints():
    lineMethod = dict(CONTINUOUS = True, TWO_POINT = False) # line Construction Method, Continuous or Two-point
    arcpy.env.overwriteOutput = True

    inPts = arcpy.GetParameterAsText(0)  # Input point FC
    outFeatures = arcpy.GetParameterAsText(1)  # Output FC
    IDField = arcpy.GetParameterAsText(2)  # Feature Field
    sortField = arcpy.GetParameterAsText(3)  # Sort Field
    closeLine = arcpy.GetParameterAsText(4)  # Close Line or Leave Open
    lineConstruct = arcpy.GetParameterAsText(5)  # Line construction method
    if lineConstruct in ["", "#"]:
        lineConstruct = "CONTINUOUS"  # default
    continuous = lineMethod[lineConstruct]  # Boolean, true if continuous
    attrSource = arcpy.GetParameterAsText(6)  # attribute source, NONE, BOTH_ENDS, START, END
    if attrSource in ["NONE", "", "#"]:
        transField, attrSource = None, None
    else: # BOTH_ENDS, START, END
        transField = arcpy.GetParameterAsText(7).split(';') # transfer field
        if transField[0] in ["", "#"]: transField = None

    if IDField in ["", "#"]: IDField = None

    if sortField in ["", "#"]:
        cursorSort = IDField
    else:
        if IDField:
            cursorSort = IDField + ";" + sortField
        else:
            cursorSort = sortField

    close = None
    if not isinstance(closeLine, bool):
        if closeLine.lower() == "false":
            close = False
        else:
            close = True

    convertPointsToLine(inPts, outFeatures, IDField, cursorSort, close, continuous, transField, attrSource)


def getZM(propType, hasMZ):
    envValue = getattr(arcpy.env, propType).upper()

    if envValue in ['ENABLED', 'DISABLED']:
        return envValue
    else:
        if hasMZ:
            return "ENABLED"
        else:
            return "DISABLED"


def has_nan(point):
    """Check if point has a nan"""
    from numpy import isnan

    try:
        return isnan(point.X)
    except (TypeError, Exception):
        return False


def convertPointsToLine(inPts, outFeatures, IDField, cursorSort, close, continuous, transField, attrSource):
    # Assign empty values to cursor and row objects
    iCur, sRow, feat = None, None, None

    try:
        desc = arcpy.Describe(inPts)
        OIDFieldName = getattr(desc, "OIDFieldName", None)

        # Create the output feature class
        outPath, outFC = os.path.split(outFeatures)
        arcpy.CreateFeatureclass_management(outPath, outFC, "POLYLINE", "",
                                            getZM("outputMFlag", desc.hasM),
                                            getZM("outputZFlag", desc.hasZ),
                                            inPts)

        outFields = [] # track the fields to be written in the output

        # If there is an IDField, add the equivalent to the output
        fName = IDField
        if IDField:
            f = arcpy.ListFields(inPts, IDField)[0]
            fName = arcpy.ValidateFieldName(f.name, outPath)
            arcpy.AddField_management(outFeatures, fName, f.type, f.precision, f.scale, f.length,
                                      f.aliasName, f.isNullable, f.required, f.domain)
            outFields.append(fName)

        # If there is transField, add the fields to the output, add start first
        if transField:
            tfDict = {}
            for tsFName in transField:
                tsField = arcpy.ListFields(inPts, tsFName)[0]
                tfDict[tsFName] = [[],[]]  # name, values
                if attrSource != 'END': # when attrSource is 'START' or 'BOTH_ENDS'
                    tsName = arcpy.ValidateFieldName('START_' + tsField.name, outPath)
                    tsAlias = 'START_' + tsField.aliasName
                    if tsField.type == 'OID': # add OID field as long to avoid the failure of addfield
                        arcpy.AddField_management(outFeatures, tsName, 'Long', tsField.precision, tsField.scale, tsField.length,
                                              tsAlias, True, False, tsField.domain)  # Nullable yes, required no
                    else:
                        arcpy.AddField_management(outFeatures, tsName, tsField.type, tsField.precision, tsField.scale, tsField.length,
                                              tsAlias, tsField.isNullable, tsField.required, tsField.domain)
                    tfDict[tsFName][0].append(tsName)
                    outFields.append(tsName)

                if attrSource != 'START': # when attrSource is 'END' or 'BOTH_ENDS'
                    tsName = arcpy.ValidateFieldName('END_' + tsField.name, outPath)
                    tsAlias = 'END_' + tsField.aliasName
                    if tsField.type == 'OID':
                        arcpy.AddField_management(outFeatures, tsName, 'Long', tsField.precision, tsField.scale, tsField.length,
                                              tsAlias, True, False, tsField.domain)
                    else:
                        arcpy.AddField_management(outFeatures, tsName, tsField.type, tsField.precision, tsField.scale, tsField.length,
                                              tsAlias, tsField.isNullable, tsField.required, tsField.domain)
                    tfDict[tsFName][0].append(tsName)
                    outFields.append(tsName)

        # Open an insert cursor for the new feature class
        outFields.append('SHAPE@')
        iCur = arcpy.da.InsertCursor(outFeatures, outFields)

        # Create an array needed to create features
        array = arcpy.Array()

        # Initialize a variable for keeping track of a feature's ID.
        ID = ...   # Ellipsis is used here to avoid using any real value that can exist in Line Field (issue #6518)
        fields = ["SHAPE@"]
        sqlPostfix = None # sql postfix used to sort the table, None if not specified, otherwise, ORDER BY (IDField,) sortField
        numCursorSort = 0
        if cursorSort:
            fields += cursorSort.split(";")
            numCursorSort = len(cursorSort.split(";"))
            if desc.path.lower() != "in_memory" and arcpy.Describe(desc.catalogPath).dataType == "FeatureClass":  # otherwise, if inputs are from in_memory or shapefile, ORDER BY will not work
                 sqlPostfix = "ORDER BY " + cursorSort.replace(";", ", ")
        # OID
        if OIDFieldName:
            fields.append(OIDFieldName)
        if transField:
            fields += transField

        currentValue = None
        nullFields = set() # to record which line/sort fields have null values
        nullGeom = [] # to record which feature has null geometry
        
        # Initialize a progress bar
        count = int(arcpy.GetCount_management(inPts).getOutput(0))
        if count:
            arcpy.SetProgressor("step", arcpy.GetIDMessage(86601), 0, count)

        if arcpy.env.extent:
            polygon = arcpy.env.extent.polygon
        else:
            polygon = None

        with arcpy.da.SearchCursor(inPts, fields, None, None,
                                   sql_clause=(None, sqlPostfix),
                                   spatial_filter=polygon) as sCur:
            sortedCur = sCur
            if cursorSort and not sqlPostfix:   # if inputs are from in_memory or shapefile, use sorted() to sort rows
                sortedCur = sorted(sCur, key = lambda row: (row[1:numCursorSort+1]))

            for sRow in sortedCur:
                shape = sRow[0]
                if shape:
                    pt = shape.getPart(0)
                    if not pt or (pt and has_nan(pt)):
                        if OIDFieldName:
                            nullGeom.append(str(sRow[1+numCursorSort]))   # add oid of the feature with null geometry
                        else:
                            arcpy.AddIDMessage('WARNING', 957)
                        arcpy.SetProgressorPosition()
                        continue
                else:
                    if OIDFieldName:
                        nullGeom.append(str(sRow[1+numCursorSort]))
                    else:
                        arcpy.AddIDMessage('WARNING', 957)
                    arcpy.SetProgressorPosition()
                    continue

                if IDField:
                    currentValue = sRow[1]
                    if currentValue is None:
                        if ID == ...:
                            nullFields.add(IDField)   # if encounter Null in IDField for the first time, add warning for this field and skip
                        arcpy.SetProgressorPosition()
                        continue
                
                if cursorSort != IDField:
                    if sRow[numCursorSort] is None:
                        nullFields.add(fields[numCursorSort])   # if encounter Null in sort field, add warning for this field and skip
                        arcpy.SetProgressorPosition()
                        continue

                if ID == ...:
                    ID = currentValue

                if ID != currentValue:
                    if array.count >= 2:

                        # To close, add first point to the end
                        if close:
                            array.add(array.getObject(0))
                            # add first value of transfer fields to the lists
                            if transField:
                                for tfSrcFd in tfDict.keys():
                                    tfDict[tfSrcFd][1].append(tfDict[tfSrcFd][1][0])

                        if continuous:
                            feat = []
                            if IDField:
                                if ID is not None:  # in case the value is None/Null
                                    feat.append(ID)

                            if transField:  # add transfer values to the output
                                for tfSrcFd, tfTgt in tfDict.items():
                                    if attrSource != 'END':
                                        feat.append(tfTgt[1][0])
                                    if attrSource != 'START':
                                        feat.append(tfTgt[1][-1])

                            geom = arcpy.Polyline(array, desc.spatialReference,
                                                  desc.hasZ, desc.hasM)
                            feat.append(geom)
                            iCur.insertRow(feat)

                        else:
                            for ptIdx in range(len(array)-1):
                                feat = []
                                if IDField:
                                    if ID is not None:
                                        feat.append(ID)

                                if transField:  # add transfer values to the output
                                    for tfSrcFd, tfTgt in tfDict.items():
                                        if attrSource != 'END':
                                            feat.append(tfTgt[1][ptIdx])
                                        if attrSource != 'START':
                                            feat.append(tfTgt[1][ptIdx+1])

                                geom = arcpy.Polyline(array[ptIdx:ptIdx+2], desc.spatialReference,
                                                      desc.hasZ, desc.hasM)
                                feat.append(geom)                            
                                iCur.insertRow(feat)

                    else:
                        if ID is not ...:  # exclude the case where line field value is NULL or the initialized value
                            arcpy.AddIDMessage("WARNING", 1059, str(ID))

                    array.removeAll()
                    # clear values of transfer fields
                    if transField:
                        for tfSrcFd in tfDict.keys():
                            tfDict[tfSrcFd][1].clear()

                array.add(pt)

                if transField:
                    for tfSrcFdIdx,tfSrcFd in enumerate(transField):
                        tfSrcVal = sRow[-len(transField) + tfSrcFdIdx]
                        tfDict[tfSrcFd][1].append(tfSrcVal)

                ID = currentValue
                arcpy.SetProgressorPosition()

        # Add the last feature
        if array.count > 1:
            # To close, add first point to the end
            if close:
                array.add(array.getObject(0))
                # add first value of transfer fields to the lists
                if transField:
                    for tfSrcFd in tfDict.keys():
                        tfDict[tfSrcFd][1].append(tfDict[tfSrcFd][1][0])

            if continuous:
                feat = []
                if IDField:
                    # Changed ID to currentValue to address Coverity CID 278237
                    if currentValue is not None:  # in case the value is None/Null
                        feat.append(currentValue)

                if transField:  # add transfer values to the output
                    for tfSrcFd, tfTgt in tfDict.items():
                        if attrSource != 'END':
                            feat.append(tfTgt[1][0])
                        if attrSource != 'START':
                            feat.append(tfTgt[1][-1])

                geom = arcpy.Polyline(array, desc.spatialReference,
                                      desc.hasZ, desc.hasM)
                feat.append(geom)
                iCur.insertRow(feat)

            else:
                for ptIdx in range(len(array)-1):
                    feat = []
                    if IDField:
                        if currentValue is not None:  # in case the value is None/Null
                            feat.append(currentValue)

                    if transField:  # add transfer values to the output
                        for tfSrcFd, tfTgt in tfDict.items():
                            if attrSource != 'END':
                                feat.append(tfTgt[1][ptIdx])
                            if attrSource != 'START':
                                feat.append(tfTgt[1][ptIdx+1])

                    geom = arcpy.Polyline(array[ptIdx:ptIdx+2], desc.spatialReference,
                                          desc.hasZ, desc.hasM)
                    feat.append(geom)
                    iCur.insertRow(feat)

        else:
            if ID is not ...:   # exclude the case where line field value is the initialized value
                arcpy.AddIDMessage("WARNING", 1059, str(ID))

        array.removeAll()

    except Exception as err:
        import traceback
        arcpy.AddError(
            traceback.format_exception_only(type(err), err)[0].rstrip())

    finally:
        if iCur:
            del iCur
        if sortedCur:
            del sortedCur
        if sRow:
            del sRow
        if feat:
            del feat
        if nullFields:
            arcpy.AddIDMessage("WARNING", 1086, "{}".format(', '.join(list(nullFields))))
            del nullFields
        if nullGeom:
            arcpy.AddIDMessage("WARNING", 40401, "{}".format(', '.join(nullGeom)))
            del nullGeom

        try:
            # Update the spatial index(es)
            r = arcpy.CalculateDefaultGridIndex_management(outFeatures)
            arcpy.AddSpatialIndex_management(outFeatures, r[0], r[1], r[2])
        except Exception as e:
            pass


if __name__ == '__main__':
    convertPoints()
