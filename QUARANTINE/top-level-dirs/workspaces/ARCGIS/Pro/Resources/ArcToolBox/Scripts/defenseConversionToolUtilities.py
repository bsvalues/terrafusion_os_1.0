'''
 ==================================================
 defenseConversionToolUtilities.py
 --------------------------------------------------
 requirments: ArcGIS Pro
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description:
 Utility module for defense conversion tools.
'''

import os
import sys

import arcpy

try:
    from . import defenseHelper
except ImportError:
    import defenseHelper

debug = False
srWGS84 = arcpy.SpatialReference(4326) # GCS_WGS_1984

unitsAngle = ["DEGREES", "MILS", "RADS", "GRADS"]
unitsDistance = ["METERS", "KILOMETERS",
                 "MILES", "NAUTICAL_MILES",
                 "FEET", "US_SURVEY_FEET"]
formatsCoordinateNotation = ["DD_1", "DD_2",
                             "DDM_1", "DDM_2",
                             "DMS_1", "DMS_2",
                             "GARS", "GEOREF",
                             "UTM", "MGRS",
                             "USNG"]
formatsLineTypes = ["GEODESIC", "GREAT_CIRCLE", "RHUMB_LINE", "NORMAL_SECTION"]
joinExcludeFields = ['OBJECTID', 'OID', 'ObjectID',
                     'SHAPE', 'Shape', 'Shape_Length', 'Shape_Area', 'JoinID']

def addNotation(notationType, fieldToAdd, joinFieldName, outputTable, scratchTable,
                inputXField, inputYField, inputCoordinateFormat, inputSpatialReference):
    ''' Convert CoordinateNotation and Join to OutputTable '''
    try:
        arcpy.AddMessage(arcpy.GetIDMessage(200003).format(notationType, fieldToAdd)) # Converting and appending {0} with fields {1} ...

        # Delete the output table if exists so env.OverwriteOutput not required
        if arcpy.Exists(scratchTable):
            arcpy.Delete_management(scratchTable)

        arcpy.ConvertCoordinateNotation_management(outputTable,
                                                   scratchTable,
                                                   inputXField,
                                                   inputYField,
                                                   inputCoordinateFormat,
                                                   notationType,
                                                   joinFieldName,
                                                   inputSpatialReference)
        arcpy.JoinField_management(outputTable, joinFieldName,
                                   scratchTable, joinFieldName,
                                   fieldToAdd)

        # TRICKY DDLat, DDLon, etc. names are hard-coded in ConvertCoordinateNotation 
        # so fieldToAdd is not used and we need to work-around that here       
        if notationType == 'DD_NUMERIC' :
             # We need to rename these to have both DD and DD_NUMERIC in same output table
            arcpy.AlterField_management(outputTable, 'DDLat', 'DDLatNumeric', 'DDLatNumeric')
            arcpy.AlterField_management(outputTable, 'DDLon', 'DDLonNumeric', 'DDLonNumeric')

        return True

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return False

def convertCoordinateNotations(inputTable,
                       inputCoordinateFormat,
                       inputXField,
                       inputYField,
                       outputTable,
                       inputSpatialReference):
    '''
    inputTable - input table, each row will be a separate line feature in output
    inputCoordinateFormat - coordinate notation format of input vertices
    inputXField - field in inputTable for vertex x-coordinate, or full coordinate
    inputYField - field in inputTable for vertex y-coordinate, or None
    outputTable -  output table containing converted coordinate notations
    inputSpatialReference - spatial reference of input coordinates
    
    returns table
    
    inputCoordinateFormat must be one of the following:
    •    DD_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    •    DD_2: Longitude and latitude values are in two separate fields.
    •    DDM_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    •    DDM_2: Longitude and latitude values are in two separate fields.
    •    DMS_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    •    DMS_2: Longitude and latitude values are in two separate fields.
    •    GARS: Global Area Reference System. Based on latitude and longitude, it divides and subdivides the world into cells.
    •    GEOREF: World Geographic Reference System. A grid-based system that divides the world into 15-degree quadrangles and then subdivides into smaller quadrangles.
    •    UTM_ZONES: The letter N or S after the UTM zone number designates only North or South hemisphere.
    •    UTM_BANDS: The letter after the UTM zone number designates one of the 20 latitude bands. N or S does not designate a hemisphere.
    •    USNG: United States National Grid. Almost exactly the same as MGRS but uses North American Datum 1983 (NAD83) as its datum.
    •    MGRS: Military Grid Reference System. Follows the UTM coordinates and divides the world into 6-degree longitude and 20 latitude bands, 
    •        but MGRS then further subdivides the grid zones into smaller 100,000-meter grids. These 100,000-meter grids are then divided into 10,000-meter, 1,000-meter, 100-meter, 10-meter, and 1-meter grids.
    •    SHAPE: Only available when a point feature layer is selected as input. The coordinates of each point are used to define the output format
    '''
    deleteme = []

    try:
        scratch = 'memory'

        joinFieldName = "JoinID"
           
        # if debug:
        #     arcpy.AddMessage("Copying %s to %s" % (inputTable, outputTable))
        arcpy.CopyRows_management(inputTable, outputTable)
        
        outputTable = defenseHelper.addUniqueID(outputTable, joinFieldName)

        # Check that none of these fields exist in dataset, if so rename them with unique 
        # field name before we proceed to next step
        fieldsToCheck = ["DDLat", "DDLon", "DDLatNumeric", "DDLonNumeric", 
                         "DDMLat", "DDMLon", "DMSLat", "DMSLon", "UTM_BANDS", 
                         "MGRS", "USNG", "GARS", "GEOREF"]
        renamedFieldsList = defenseHelper.checkForDuplicateFields(outputTable, fieldsToCheck)

        # TRICKY: Make sure we didn't rename the conversion fields: inputXField, inputYField
        if (len(renamedFieldsList) > 0):
            for field_name, newFieldName, newFieldAlias in renamedFieldsList:
                if field_name == inputXField:
                    inputXField = newFieldName
                elif field_name == inputYField:
                    inputYField = newFieldName

        # {"format":"field_name(s)", ...}
        notationsToAdd = {"DD_NUMERIC":"DDLat; DDLon",
                          "DD":"DDLat; DDLon",
                          "DDM":"DDMLat; DDMLon",
                          "DMS":"DMSLat; DMSLon",
                          "UTM_BANDS":"UTM_BANDS",
                          "MGRS":"MGRS",
                          "USNG":"USNG",
                          "GARS":"GARS",
                          "GEOREF":"GEOREF"}

        for notationFormat in notationsToAdd:
            scratchTable =  arcpy.CreateUniqueName("cc_temp", scratch)
            deleteme.append(scratchTable)

            if not addNotation(notationFormat, notationsToAdd[notationFormat],
                               joinFieldName, outputTable, scratchTable, 
                               inputXField, inputYField, inputCoordinateFormat, inputSpatialReference):
                raise Exception("Failed to convert notation {0}.".format(notationFormat))

        return outputTable

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
        return None
    finally:
        defenseHelper.removeDatasetList(deleteme)

def polylineToPolygon(inputPolylines, inputIDFieldName, outputPolygons):
    '''
    Converts polyline to polygon features. All closed features will
    be converted to polygons. Unclosed polylines, or polylines with
    less than 2 vertices will not convert.
    
    inputPolylines - input polyline feature class
    idFieldName - field in inputPolylines to separate individual features
    outputPolygons - polygon feature class to be created
    
    returns polygon feature class
    '''
    try:
        #Create output Poly FC
        sr = arcpy.Describe(inputPolylines).spatialReference
        # if debug:
        #     arcpy.AddMessage("Spatial reference is " + str(sr.name))
        #     arcpy.AddMessage("Creating output feature class...")
        outpolygonsFC = arcpy.CreateFeatureclass_management(os.path.dirname(outputPolygons),
                                                            os.path.basename(outputPolygons),
                                                            "POLYGON",
                                                            "#",
                                                            "#",
                                                            "#",
                                                            sr)
        
        inFields = ["SHAPE@"]
        if inputIDFieldName:
            #Add ID field
            # if debug:
            #     arcpy.AddMessage("Adding ID field: %s ..." % str(inputIDFieldName))
            arcpy.AddField_management(outpolygonsFC,inputIDFieldName, "TEXT")
            inFields = ["SHAPE@", inputIDFieldName]

        # if debug:
        #     arcpy.AddMessage("Converting Polylines to Polygons...")

        #Open Search cursor on polyline
        #Open Insert cursor on polygons
        with arcpy.da.SearchCursor(inputPolylines, inFields) as inRows, \
             arcpy.da.InsertCursor(outpolygonsFC, inFields) as outRows:

            polyArray = arcpy.Array()
            rowCount = 0
            for row in inRows:
                rowCount += 1
                # Provide feedback, since this method may take a while for large datasets
                # if debug and not (rowCount % 100):
                #     arcpy.AddMessage('Processing Row: ' + str(rowCount))

                if inputIDFieldName:
                    inID = str(row[1])

                # Polyline will only have one part
                featShape = row[0]
                if (featShape is None):
                    arcpy.AddIDMessage("WARNING", 200010, str(rowCount)) # Output Row: ' + str(rowCount) + ' missing feature geometry (check input data). Skipping.
                    continue

                polyline = featShape.getPart(0)

                polyArray.removeAll()
                polyArray.append(polyline)

                outPoly = arcpy.Polygon(polyArray, sr)

                if inputIDFieldName:
                    outRows.insertRow([outPoly, inID])
                else:
                    outRows.insertRow([outPoly])

        return outputPolygons
    
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)
        return None

# TODO: combine addUniqueRowID with similar method defenseHelper.addUniqueID
# (only difference is type of field created, LONG vs. TEXT)
def addUniqueRowID(dataset, fieldName="JoinID"):
    '''
    Adds a unique row "ID" to each row in an input table
    
    dataset - table to get the ID field
    fieldName - name of the field to add. Default is "JoinID"
    
    returns orignal table
    '''
    try:
        counter = 1

        # add unique ID field if it does not already exist
        desc = arcpy.Describe(dataset)
        if not fieldName in [field.name for field in desc.Fields] :
            # if debug: arcpy.AddMessage("Adding Text field: " + str(fieldName))
            arcpy.AddField_management(dataset, fieldName, "TEXT")
    
        # add unique numbers to each row
        updatedFields = [str(fieldName)]
        arcpy.AddMessage(arcpy.GetIDMessage(200002)) # Adding unique row IDs...
        with arcpy.da.UpdateCursor(dataset, updatedFields) as rows:
            for row in rows:
                row[0] = counter
                rows.updateRow(row)
                counter += 1
        
        # set output
        return dataset        
    
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None

def _formatLat(sLat):
    '''
    For DD latitude fields with "S" hemisphere indicators,
    change to "-"
    '''
    if sLat[-1:] == "S":
        sLat = -1.0 * float(sLat[:-1])
    else:
        sLat = float(sLat[:-1])
    return sLat

def _formatLon(sLon):
    '''
    for DD longitude fields with "W" hemisphere indicators,
    change to "-"
    '''
    if sLon[-1:] == "W":
        sLon = -1.0 * float(sLon[:-1])
    else:
        sLon = float(sLon[:-1])
    return sLon

def _tableFieldNames(inputTable, excludeList):
    '''
    Uses arcpy.ListFields to get a list of field NAMES
    
    inputTable - input table to get field names from
    excludeList - list of field names that will NOT be included in the returned list
    
    returns list of strings
    '''
    try:
        fieldNames = []
        #if debug: arcpy.AddMessage("Excluding fields: {0}".format(excludeList))
        for f in arcpy.ListFields(inputTable):
            if excludeList:
                if not f.name in excludeList:
                    #if debug: arcpy.AddMessage("Adding {0}.".format(f.name))
                    fieldNames.append(f.name)
            else:
                fieldNames.append(f.name)
        return fieldNames
    
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None
    
def _checkSpatialRef(inputSpatialReference):
    '''
    if None make it WGS_84, if it is an object, make it a string
    '''
    if not inputSpatialReference:
        arcpy.AddMessage(arcpy.GetIDMessage(200004).format(srWGS84.name)) # Defaulting to {0}
        inputSpatialReference = srWGS84
    elif not isinstance(inputSpatialReference, str):
        inputSpatialReference = inputSpatialReference.exportToString()
    return inputSpatialReference

############### TOOL METHODS ############### 

def tableTo2PointLine(inputTable,
                        inputStartCoordinateFormat,
                        inputStartXField,
                        inputStartYField,
                        inputEndCoordinateFormat,
                        inputEndXField,
                        inputEndYField,
                        outputLineFeatures,
                        inputLineType,
                        inputSpatialReference):
    '''
    Creates line features from a start point coordinate and an endpoint coordinate.

    inputTable - Input Table
    inputStartCoordinateFormat - Start Point Format (from Value List)
    inputStartXField - Start X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)(from Input Table)
    inputStartYField - Start Y Field (latitude)(from Input Table)
    inputEndCoordinateFormat - End Point Format (from Value List)
    inputEndXField - End X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)(from Input Table)
    inputEndYField - End Y Field (latitude) (from Input Table)
    outputLineFeatures - Output Line
    inputLineType - Line Type (from Value List)
    inputSpatialReference - Spatial Reference, default is GCS_WGS_1984

    returns line feature class

    inputStartCoordinateFormat and inputEndCoordinateFormat must be one of the following:
    * DD_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DD_2: Longitude and latitude values are in two separate fields.
    * DDM_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DDM_2: Longitude and latitude values are in two separate fields.
    * DMS_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DMS_2: Longitude and latitude values are in two separate fields.
    * GARS: Global Area Reference System. Based on latitude and longitude, it divides and subdivides the world into cells.
    * GEOREF: World Geographic Reference System. A grid-based system that divides the world into 15-degree quadrangles and then subdivides into smaller quadrangles.
    * UTM_ZONES: The letter N or S after the UTM zone number designates only North or South hemisphere.
    * UTM_BANDS: The letter after the UTM zone number designates one of the 20 latitude bands. N or S does not designate a hemisphere.
    * USNG: United States National Grid. Almost exactly the same as MGRS but uses North American Datum 1983 (NAD83) as its datum.
    * MGRS: Military Grid Reference System. Follows the UTM coordinates and divides the world into 6-degree longitude and 20 latitude bands, 
    *       but MGRS then further subdivides the grid zones into smaller 100,000-meter grids. These 100,000-meter grids are then divided into 10,000-meter, 1,000-meter, 100-meter, 10-meter, and 1-meter grids.
    
    inputLineType must be one of the following:
    * GEODESIC:
    * GREAT_CIRCLE:
    * RHUMB_LINE:
    * NORMAL_SECTION:

    '''
    deleteme = []

    try:
        joinFieldName   = "JoinID"
        startXFieldName = "startX"
        startYFieldName = "startY"
        endXFieldName   = "endX"
        endYFieldName   = "endY"

        scratch = "memory"
        
        inputSpatialReference = _checkSpatialRef(inputSpatialReference)
            
        copyRows = arcpy.CreateUniqueName("copyRows", scratch)
        deleteme.append(copyRows)

        arcpy.CopyRows_management(inputTable, copyRows)
        originalTableFieldNames = _tableFieldNames(inputTable, joinExcludeFields)
        addUniqueRowID(copyRows, joinFieldName)
        
        #Convert Start Point
        arcpy.AddMessage(arcpy.GetIDMessage(200005)) # Formatting start point...
        startCCN = arcpy.CreateUniqueName("startCCN", scratch)
        deleteme.append(startCCN)

        arcpy.ConvertCoordinateNotation_management(copyRows,
                                                   startCCN,
                                                   inputStartXField,
                                                   inputStartYField,
                                                   inputStartCoordinateFormat,
                                                   "DD_NUMERIC",
                                                   joinFieldName)
        arcpy.AddField_management(startCCN, startXFieldName, "DOUBLE")
        arcpy.CalculateField_management(startCCN, startXFieldName, "!DDLon!","PYTHON_9.3")
        arcpy.AddField_management(startCCN, startYFieldName, "DOUBLE")
        arcpy.CalculateField_management(startCCN, startYFieldName, "!DDLat!","PYTHON_9.3")
        arcpy.JoinField_management(copyRows, joinFieldName,
                                   startCCN, joinFieldName,
                                   [startXFieldName, startYFieldName]) 

        #Convert End Point
        arcpy.AddMessage(arcpy.GetIDMessage(200006)) # Formatting end point...
        endCCN = arcpy.CreateUniqueName("endCCN", scratch)
        deleteme.append(endCCN)

        arcpy.ConvertCoordinateNotation_management(copyRows,
                                                   endCCN,
                                                   inputEndXField,
                                                   inputEndYField,
                                                   inputEndCoordinateFormat,
                                                   "DD_NUMERIC",
                                                   joinFieldName)
        arcpy.AddField_management(endCCN, endXFieldName, "DOUBLE")
        arcpy.CalculateField_management(endCCN, endXFieldName, "!DDLon!","PYTHON_9.3")
        arcpy.AddField_management(endCCN, endYFieldName, "DOUBLE")
        arcpy.CalculateField_management(endCCN, endYFieldName, "!DDLat!","PYTHON_9.3")
        arcpy.JoinField_management(copyRows, joinFieldName,
                                   endCCN, joinFieldName,
                                   [endXFieldName, endYFieldName])

        #XY TO LINE
        arcpy.AddMessage(arcpy.GetIDMessage(200007).format(inputLineType)) # Connecting start point to end point as {0}...
        arcpy.XYToLine_management(copyRows,
                                  outputLineFeatures,
                                  startXFieldName, startYFieldName,
                                  endXFieldName, endYFieldName,
                                  inputLineType,
                                  joinFieldName,
                                  inputSpatialReference)
        
        #Join original table fields to output
        arcpy.AddMessage(arcpy.GetIDMessage(200008)) # Joining fields from input table to output line features...
        arcpy.JoinField_management(outputLineFeatures, joinFieldName,
                                   copyRows, joinFieldName,
                                   originalTableFieldNames)

        arcpy.DeleteField_management(outputLineFeatures, [joinFieldName,
                                                startXFieldName, startYFieldName,
                                                endXFieldName, endYFieldName])

        return outputLineFeatures

    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None
    finally:
        defenseHelper.removeDatasetList(deleteme)

def tableToEllipse(inputTable,
                   inputCoordinateFormat,
                   inputXField,
                   inputYField,
                   inputMajorAxisField,
                   inputMinorAxisField,
                   inputDistanceUnits,
                   outputEllipseFeatures,
                   inputAzimuthField,
                   inputAzimuthUnits,
                   inputSpatialReference):

    '''
    inputTable - input table, each row will be a separate line feature in output
    inputCoordinateFormat - coordinate notation format of input vertices
    inputXField - field in inputTable for vertex x-coordinate, or full coordinate
    inputYField - field in inputTable for vertex y-coordinate, or None
    inputMajorAxisField -
    inputMinorAxisField - 
    inputDistanceUnits -
    outputEllipseFeatures - polyline feature class to create
    inputAzimuthField - field in inputTable of rotation of ellipse from north
    inputAzimuthUnits - angular units of azimuth (rotation)
    inputSpatialReference - spatial reference of input coordinates
    
    returns polygon ellipse feature class
    
    inputCoordinateFormat must be one of the following:
    * DD_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DD_2: Longitude and latitude values are in two separate fields.
    * DDM_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DDM_2: Longitude and latitude values are in two separate fields.
    * DMS_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DMS_2: Longitude and latitude values are in two separate fields.
    * GARS: Global Area Reference System. Based on latitude and longitude, it divides and subdivides the world into cells.
    * GEOREF: World Geographic Reference System. A grid-based system that divides the world into 15-degree quadrangles and then subdivides into smaller quadrangles.
    * UTM_ZONES: The letter N or S after the UTM zone number designates only North or South hemisphere.
    * UTM_BANDS: The letter after the UTM zone number designates one of the 20 latitude bands. N or S does not designate a hemisphere.
    * USNG: United States National Grid. Almost exactly the same as MGRS but uses North American Datum 1983 (NAD83) as its datum.
    * MGRS: Military Grid Reference System. Follows the UTM coordinates and divides the world into 6-degree longitude and 20 latitude bands, 
    *       but MGRS then further subdivides the grid zones into smaller 100,000-meter grids. These 100,000-meter grids are then divided into 10,000-meter, 1,000-meter, 100-meter, 10-meter, and 1-meter grids.
    
    inputAzimuthUnits must be one of the following:
    * DEGREES
    * MILS
    * RADS
    * GRAD
    
    inputDistanceUnits must be one of the following:
    * METERS
    * KILOMETERS
    * MILES
    * NAUTICAL_MILES
    * FEET
    * US_SURVEY_FEET
    '''
    deleteme = []

    try:
        scratch = 'memory'

        joinFieldName = 'JoinID'
        deleteJoinFieldName = 'JoinID_1'

        inputSpatialReference = _checkSpatialRef(inputSpatialReference)
            
        copyRows = arcpy.CreateUniqueName("copyRows", scratch)
        deleteme.append(copyRows)

        arcpy.CopyRows_management(inputTable, copyRows)
        originalTableFieldNames = _tableFieldNames(inputTable, joinExcludeFields)
        addUniqueRowID(copyRows, joinFieldName)
        
        copyCCN = arcpy.CreateUniqueName("copyCCN", scratch)
        deleteme.append(copyCCN)

        arcpy.ConvertCoordinateNotation_management(copyRows,
                                                   copyCCN,
                                                   inputXField,
                                                   inputYField,
                                                   inputCoordinateFormat,
                                                   "DD_NUMERIC",
                                                   joinFieldName,
                                                   inputSpatialReference)
    
        #Table To Ellipse
        copyEllipse = arcpy.CreateUniqueName("copyEllipse", scratch)
        deleteme.append(copyEllipse)

        arcpy.TableToEllipse_management(copyCCN,
                                        copyEllipse,
                                        "DDLon", "DDLat",
                                        inputMajorAxisField,
                                        inputMinorAxisField,
                                        inputDistanceUnits,
                                        inputAzimuthField,
                                        inputAzimuthUnits,
                                        joinFieldName,
                                        inputSpatialReference)
        
        #Polyline To Polygon
        polylineToPolygon(copyEllipse, joinFieldName, outputEllipseFeatures)
        
        #Join original table fields to output
        arcpy.AddMessage(arcpy.GetIDMessage(200008)) # Joining fields from input table to output line features...
        #arcpy.AddMessage("Joining fields from input table to output line features...")
        arcpy.JoinField_management(outputEllipseFeatures, joinFieldName,
                                   copyRows, joinFieldName) 
        
        arcpy.DeleteField_management(outputEllipseFeatures,
                                     [joinFieldName, deleteJoinFieldName])

        return outputEllipseFeatures
    
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None
    finally:
        defenseHelper.removeDatasetList(deleteme)

def tableToLineOfBearing(inputTable,
                         inputCoordinateFormat,
                         inputXField,
                         inputYField,
                         inputBearingUnits,
                         inputBearingField,
                         inputDistanceUnits,
                         inputDistanceField,
                         outputLineFeatures,
                         inputLineType,
                         inputSpatialReference):
    '''
    Tool method for converting a table of starting points, bearings, and distances
    to line features.
    
    inputTable - input table, each row will be a separate line feature in output
    inputCoordinateFormat - coordinate notation format of input vertices
    inputXField - field in inputTable for vertex x-coordinate, or full coordinate
    inputYField - field in inputTable for vertex y-coordinate, or None
    inputBearingUnits -
    inputBearingField -
    inputDistanceUnits -
    inputDistanceField -
    outputLineFeatures - polyline feature class to create
    inputLineType - 
    inputSpatialReference - spatial reference of input coordinates
    
    returns polyline feature class
    
    inputCoordinateFormat must be one of the following:
    * DD_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DD_2: Longitude and latitude values are in two separate fields.
    * DDM_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DDM_2: Longitude and latitude values are in two separate fields.
    * DMS_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DMS_2: Longitude and latitude values are in two separate fields.
    * GARS: Global Area Reference System. Based on latitude and longitude, it divides and subdivides the world into cells.
    * GEOREF: World Geographic Reference System. A grid-based system that divides the world into 15-degree quadrangles and then subdivides into smaller quadrangles.
    * UTM_ZONES: The letter N or S after the UTM zone number designates only North or South hemisphere.
    * UTM_BANDS: The letter after the UTM zone number designates one of the 20 latitude bands. N or S does not designate a hemisphere.
    * USNG: United States National Grid. Almost exactly the same as MGRS but uses North American Datum 1983 (NAD83) as its datum.
    * MGRS: Military Grid Reference System. Follows the UTM coordinates and divides the world into 6-degree longitude and 20 latitude bands, 
    *       but MGRS then further subdivides the grid zones into smaller 100,000-meter grids. These 100,000-meter grids are then divided into 10,000-meter, 1,000-meter, 100-meter, 10-meter, and 1-meter grids.
    
    inputBearingUnits must be one of the following:
    * DEGREES
    * MILS
    * RADS
    * GRAD
    
    inputDistanceUnits must be one of the following:
    * METERS
    * KILOMETERS
    * MILES
    * NAUTICAL_MILES
    * FEET
    * US_SURVEY_FEET
    
    inputLineType must be one of the following:
    * GEODESIC:
    * GREAT_CIRCLE:
    * RHUMB_LINE:
    * NORMAL_SECTION:
    
    '''
    deleteme = []

    try:
        joinFieldName = "JoinID"
        scratch = 'memory'
            
        inputSpatialReference = _checkSpatialRef(inputSpatialReference)
            
        copyRows = arcpy.CreateUniqueName("copyRows", scratch)
        deleteme.append(copyRows)

        arcpy.CopyRows_management(inputTable, copyRows)
        originalTableFieldNames = _tableFieldNames(inputTable, joinExcludeFields)
        addUniqueRowID(copyRows, joinFieldName)
        
        arcpy.AddMessage(arcpy.GetIDMessage(200005)) # Formatting start point...

        copyCCN = arcpy.CreateUniqueName("copyCCN", scratch)
        deleteme.append(copyCCN)

        arcpy.ConvertCoordinateNotation_management(copyRows,
                                                   copyCCN,
                                                   inputXField,
                                                   inputYField,
                                                   inputCoordinateFormat,
                                                   "DD_NUMERIC",
                                                   joinFieldName,
                                                   inputSpatialReference)
        
        
        arcpy.AddMessage(arcpy.GetIDMessage(200009).format(inputLineType)) #Creating lines as {0}...
        arcpy.BearingDistanceToLine_management(copyCCN,
                                               outputLineFeatures,
                                               "DDLon",
                                               "DDLat",
                                               inputDistanceField,
                                               inputDistanceUnits,
                                               inputBearingField,
                                               inputBearingUnits,
                                               inputLineType,
                                               joinFieldName,
                                               inputSpatialReference)
        
        # Join original table fields to output
        arcpy.AddMessage(arcpy.GetIDMessage(200008)) # Joining fields from input table to output line features...
        arcpy.JoinField_management(outputLineFeatures, joinFieldName,
                                   copyRows, joinFieldName,
                                   originalTableFieldNames)
        arcpy.DeleteField_management(outputLineFeatures,
                                     [joinFieldName])
        
        return outputLineFeatures
    
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None
    finally:
        defenseHelper.removeDatasetList(deleteme)

def tableToPoint(inputTable,
                 inputCoordinateFormat,
                 inputXField,
                 inputYField,
                 outputPointFeatures,
                 inputSpatialReference):
    '''
    Converts table of coordinate formats to point features.
    
    inputTable - input table, each row will be a separate line feature in output
    inputCoordinateFormat - coordinate notation format of input vertices
    inputXField - field in inputTable for vertex x-coordinate, or full coordinate
    inputYField - field in inputTable for vertex y-coordinate, or None
    outputPointFeatures - output point features to create
    inputSpatialReference - spatial reference of input coordinates
    
    returns point feature class
    
    inputCoordinateFormat must be one of the following:
    * DD_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DD_2: Longitude and latitude values are in two separate fields.
    * DDM_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DDM_2: Longitude and latitude values are in two separate fields.
    * DMS_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DMS_2: Longitude and latitude values are in two separate fields.
    * GARS: Global Area Reference System. Based on latitude and longitude, it divides and subdivides the world into cells.
    * GEOREF: World Geographic Reference System. A grid-based system that divides the world into 15-degree quadrangles and then subdivides into smaller quadrangles.
    * UTM_ZONES: The letter N or S after the UTM zone number designates only North or South hemisphere.
    * UTM_BANDS: The letter after the UTM zone number designates one of the 20 latitude bands. N or S does not designate a hemisphere.
    * USNG: United States National Grid. Almost exactly the same as MGRS but uses North American Datum 1983 (NAD83) as its datum.
    * MGRS: Military Grid Reference System. Follows the UTM coordinates and divides the world into 6-degree longitude and 20 latitude bands, 
    *       but MGRS then further subdivides the grid zones into smaller 100,000-meter grids. These 100,000-meter grids are then divided into 10,000-meter, 1,000-meter, 100-meter, 10-meter, and 1-meter grids.

    '''

    deleteme = []

    try:

        inputSpatialReference = _checkSpatialRef(inputSpatialReference)
        if (inputCoordinateFormat == 'DD_2') and (inputSpatialReference is not None) and \
            (inputSpatialReference != arcpy.SpatialReference(4326)): 
            # default is GCS_WGS_1984 - if the SR is different, create feature class first using XYTableToPoint/MakeXYEventLayer

            # make scratch name for temp FC
            scratch = 'memory'

            scratch_name = arcpy.CreateUniqueName("xyTempResults", scratch)
            deleteme.append(scratch_name)
            layername = os.path.basename(scratch_name) + "-layer"

            tempLayerOut = arcpy.management.MakeXYEventLayer(inputTable,
                                                        inputXField,
                                                        inputYField,
                                                        layername,
                                                        inputSpatialReference)

            arcpy.management.CopyFeatures(tempLayerOut, scratch_name)

            # Use the geometry of the scratch feature class, with SHAPE keyword, ingnores X and Y values
            arcpy.ConvertCoordinateNotation_management(scratch_name,
                                                   outputPointFeatures,
                                                   inputXField,
                                                   inputYField,
                                                   "SHAPE",
                                                   "#",
                                                   "#",
                                                   inputSpatialReference)
        else:
            #Using Geographic coordinates
            arcpy.ConvertCoordinateNotation_management(inputTable,
                                                   outputPointFeatures,
                                                   inputXField,
                                                   inputYField,
                                                   inputCoordinateFormat,
                                                   "DD_NUMERIC",
                                                   "#",
                                                   inputSpatialReference)
   
        return outputPointFeatures
    
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None
    finally:
        defenseHelper.removeDatasetList(deleteme)

def tableToPolygon(inputTable,
                   inputCoordinateFormat,
                   inputXField,
                   inputYField,
                   outputPolygonFeatures,
                   inputLineField,
                   inputSortField,
                   inputSpatialReference):
    '''
    Tool method for converting a table of vertices to polygon features.
    
    inputTable - input table, each row is a vertex
    inputCoordinateFormat - coordinate notation format of input vertices
    inputXField - field in inputTable for vertex x-coordinate, or full coordinate
    inputYField - field in inputTable for vertex y-coordinate, or None
    outputPolygonFeatures - polygon feature class to create
    inputLineField - field in inputTable to identify separate polygons
    inputSortField - field in inputTable to sort vertices
    inputSpatialReference - spatial reference of input coordinates
    
    returns polygon feature class
    
    inputCoordinateFormat must be one of the following:
    * DD_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DD_2: Longitude and latitude values are in two separate fields.
    * DDM_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DDM_2: Longitude and latitude values are in two separate fields.
    * DMS_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DMS_2: Longitude and latitude values are in two separate fields.
    * GARS: Global Area Reference System. Based on latitude and longitude, it divides and subdivides the world into cells.
    * GEOREF: World Geographic Reference System. A grid-based system that divides the world into 15-degree quadrangles and then subdivides into smaller quadrangles.
    * UTM_ZONES: The letter N or S after the UTM zone number designates only North or South hemisphere.
    * UTM_BANDS: The letter after the UTM zone number designates one of the 20 latitude bands. N or S does not designate a hemisphere.
    * USNG: United States National Grid. Almost exactly the same as MGRS but uses North American Datum 1983 (NAD83) as its datum.
    * MGRS: Military Grid Reference System. Follows the UTM coordinates and divides the world into 6-degree longitude and 20 latitude bands, 
    *       but MGRS then further subdivides the grid zones into smaller 100,000-meter grids. These 100,000-meter grids are then divided into 10,000-meter, 1,000-meter, 100-meter, 10-meter, and 1-meter grids.
        
    '''
    deleteme = []

    try:
        scratch = 'memory'
            
        inputSpatialReference = _checkSpatialRef(inputSpatialReference)
        
        copyRows = arcpy.CreateUniqueName("copyRows", scratch)
        deleteme.append(copyRows)

        arcpy.CopyRows_management(inputTable, copyRows)

        copyCCN = arcpy.CreateUniqueName("copyCCN", scratch)
        deleteme.append(copyCCN)
        
        arcpy.ConvertCoordinateNotation_management(copyRows,
                                                   copyCCN,
                                                   inputXField,
                                                   inputYField,
                                                   inputCoordinateFormat,
                                                   "DD_NUMERIC",
                                                   "#",
                                                   inputSpatialReference)
        
        copyPointsToLine = arcpy.CreateUniqueName("copyPointsToLine", scratch)
        deleteme.append(copyPointsToLine)

        arcpy.PointsToLine_management(copyCCN,
                                      copyPointsToLine,
                                      inputLineField,
                                      inputSortField,
                                      "CLOSE")
        
        polylineToPolygon(copyPointsToLine, inputLineField, outputPolygonFeatures)
        
        return outputPolygonFeatures
    
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None
    finally:
        defenseHelper.removeDatasetList(deleteme)

def tableToPolyline(inputTable,
                    inputCoordinateFormat,
                    inputXField,
                    inputYField,
                    outputPolylineFeatures,
                    inputLineField,
                    inputSortField,
                    inputSpatialReference):
    '''
    Converts a table of vertices to one or more polyline features.
    
    inputTable - input table, each row is a vertex
    inputCoordinateFormat - coordinate notation format of input vertices
    inputXField - field in inputTable for vertex x-coordinate, or full coordinate
    inputYField - field in inputTable for vertex y-coordinate, or None
    outputPolylineFeatures - polyline feature class to create
    inputLineField - field in inputTable to identify separate polylines
    inputSortField - field in inputTable to sort vertices
    inputSpatialReference - spatial reference of input coordinates
    
    returns polyline feature class
    
    inputCoordinateFormat must be one of the following:
    * DD_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DD_2: Longitude and latitude values are in two separate fields.
    * DDM_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DDM_2: Longitude and latitude values are in two separate fields.
    * DMS_1: Both longitude and latitude values are in a single field. Two values are separated by a space, a comma, or a slash.
    * DMS_2: Longitude and latitude values are in two separate fields.
    * GARS: Global Area Reference System. Based on latitude and longitude, it divides and subdivides the world into cells.
    * GEOREF: World Geographic Reference System. A grid-based system that divides the world into 15-degree quadrangles and then subdivides into smaller quadrangles.
    * UTM_ZONES: The letter N or S after the UTM zone number designates only North or South hemisphere.
    * UTM_BANDS: The letter after the UTM zone number designates one of the 20 latitude bands. N or S does not designate a hemisphere.
    * USNG: United States National Grid. Almost exactly the same as MGRS but uses North American Datum 1983 (NAD83) as its datum.
    * MGRS: Military Grid Reference System. Follows the UTM coordinates and divides the world into 6-degree longitude and 20 latitude bands, 
    *       but MGRS then further subdivides the grid zones into smaller 100,000-meter grids. These 100,000-meter grids are then divided into 10,000-meter, 1,000-meter, 100-meter, 10-meter, and 1-meter grids.
     
    '''
    deleteme = []

    try:
        scratch = 'memory'

        joinFieldName = "JoinID"
            
        inputSpatialReference = _checkSpatialRef(inputSpatialReference)
        
        copyRows = arcpy.CreateUniqueName("copyRows", scratch)
        deleteme.append(copyRows)

        arcpy.CopyRows_management(inputTable, copyRows)
        addUniqueRowID(copyRows, joinFieldName)
        
        copyCCN = arcpy.CreateUniqueName("copyCCN", scratch)
        deleteme.append(copyCCN)

        arcpy.ConvertCoordinateNotation_management(copyRows,
                                                   copyCCN,
                                                   inputXField,
                                                   inputYField,
                                                   inputCoordinateFormat,
                                                   "DD_NUMERIC",
                                                   joinFieldName,
                                                   inputSpatialReference)
        
        arcpy.PointsToLine_management(copyCCN,
                                      outputPolylineFeatures,
                                      inputLineField,
                                      inputSortField,
                                      "NO_CLOSE")
        
        return outputPolylineFeatures
    
    except:
        tb = sys.exc_info()[2] # Get the traceback object
        defenseHelper.staceTrace(tb)

        return None
    finally:
        defenseHelper.removeDatasetList(deleteme)