'''
 ==================================================
 defenseConversionTools.py
 --------------------------------------------------
 Requirements: ArcGIS Pro
 Author: ArcGIS Solutions
 Contact: support@esri.com
 Company: Esri
 ==================================================
 Description: Conversion Toolset 
 ==================================================
'''

import arcpy

try:
    from . import defenseConversionToolUtilities
except ImportError:
    import defenseConversionToolUtilities

# String constants shared by tools:
defaultcoordinateFormat = 'DD_2'
coordinateFormats = ['DD_1', 'DD_2', 'DDM_1', 'DDM_2', 'DMS_1', 'DMS_2', 'GARS', 'GEOREF', 'UTM_BANDS', 'UTM_ZONES', 'USNG', 'MGRS']
singleFieldTypes = ["DD_1", "DDM_1", "DMS_1", "GARS", "GEOREF", "UTM_BANDS", "UTM_ZONES", "USNG", "MGRS"]
defaultLineType = "GEODESIC"
lineTypes = ["GEODESIC", "GREAT_CIRCLE", "RHUMB_LINE", "NORMAL_SECTION"]
defaultAngleType = "DEGREES"
angleTypes = ["DEGREES", "MILS", "RADS", "GRADS"]
defaultDistanceType = "METERS"
distanceTypes = ["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"]

# Other shared objects
srWGS84 = arcpy.SpatialReference(4326)  # GCS_WGS_1984

# -----------------------------------------------------------------------------
# GenerateCoordinateNotations Tool
# -----------------------------------------------------------------------------
class GenerateCoordinateNotations(object):

    class ToolValidator(object):
    
        def __init__(self, parameters):
            """Setup arcpy and the list of tool parameters."""
            self.params = parameters
    
        def initializeParameters(self):
            """Refine the properties of a tool's parameters.  This method is
            called when the tool is opened."""
            #0 - Input Table
            #1 - Output Table
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Output Coordinate System (Optional)                
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
            #0 - Input Table
            #1 - Output Table
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Output Coordinate System (Optional)   
            if self.params[3].value in singleFieldTypes:
                self.params[4].value = self.params[2].value
                self.params[4].enabled = False
            else:
                self.params[4].enabled = True

            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            #0 - Input Table
            #1 - Output Table
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Output Coordinate System (Optional)
            if not self.params[3].value in singleFieldTypes:
                if self.params[4].value == None or self.params[4].value == "":
                    self.params[4].setIDMessage("ERROR", 530)
               
            return

        # END ToolValidator

    def __init__(self):
        '''Tool Class Constructor'''
        self.label = 'Generate Coordinate Notations'
        self.description = 'Converts source coordinates in a table to multiple coordinate formats.  ' + \
            'This tool uses an input table with coordinates and outputs a new table with fields for ' + \
            'the following coordinate formats: Decimal Degrees, Decimal Degrees Minutes, ' + \
            'Degrees Minutes Seconds, Universal Transverse Mercator, Military Grid Reference System, ' + \
            'U.S. National Grid, Global Area Reference System, and World Geographic Reference System'
        self.category = 'Conversion'
        self.helpContext = 74020007
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_table
        param_1 = arcpy.Parameter()
        param_1.name = 'in_table'
        param_1.displayName = 'Input Table'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPTableView'
        param_1.displayOrder = 0

        # out_table
        param_2 = arcpy.Parameter()
        param_2.name = 'out_table'
        param_2.displayName = 'Output Table'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DETable'
        # param_2.value = 'convertedCoordsTable'
        param_2.displayOrder = 4

        # x_or_lon_field
        param_3 = arcpy.Parameter()
        param_3.name = 'x_or_lon_field'
        param_3.displayName = 'X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.parameterDependencies = ["in_table"]
        param_3.displayOrder = 2

        # in_coordinate_format
        param_4 = arcpy.Parameter()
        param_4.name = 'in_coordinate_format'
        param_4.displayName = 'Input Coordinate Format'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'GPString'
        param_4.value = defaultcoordinateFormat
        param_4.filter.list = coordinateFormats
        param_4.displayOrder = 1

        # y_or_lat_field
        param_5 = arcpy.Parameter()
        param_5.name = 'y_or_lat_field'
        param_5.displayName = 'Y Field (latitude)'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.parameterDependencies = ["in_table"]
        param_5.displayOrder = 3

        # coordinate_system
        param_6 = arcpy.Parameter()
        param_6.name = 'coordinate_system'
        param_6.displayName = 'Output Coordinate System'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = 'GPSpatialReference'
        param_6.displayOrder = 5

        return [param_1, param_2, param_3, param_4, param_5, param_6]

    def isLicensed(self):
        '''Tool Method'''
        return True

    def updateParameters(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateParameters()

    def updateMessages(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateMessages()

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputTable = parameters[0].valueAsText
        outputTable = parameters[1].valueAsText
        inputXField = parameters[2].valueAsText
        inputCoordinateFormat = parameters[3].valueAsText
        inputYField = parameters[4].valueAsText
        optionalSpatialReference = parameters[5].value
        optionalSpatialReferenceAsText = parameters[5].valueAsText

        if optionalSpatialReferenceAsText is None or optionalSpatialReferenceAsText == "#" \
            or optionalSpatialReferenceAsText == "":
            optionalSpatialReference = srWGS84 #GCS_WGS_1984

        output = defenseConversionToolUtilities.convertCoordinateNotations(inputTable,
                           inputCoordinateFormat,
                           inputXField,
                           inputYField,
                           outputTable,
                           optionalSpatialReference)

        return output

    # END GenerateCoordinateTable

# -----------------------------------------------------------------------------
# CoordinateTableToPoint Tool
# -----------------------------------------------------------------------------
class CoordinateTableToPoint(object):

    class ToolValidator(object):
        """Class for validating a tool's parameter values and controlling
        the behavior of the tool's dialog."""
        
        def __init__(self, parameters):
            """Setup arcpy and the list of tool parameters."""
            self.params = parameters
    
        def initializeParameters(self):
            """Refine the properties of a tool's parameters.  This method is
            called when the tool is opened."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Output Coordinate System (Optional)
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Output Coordinate System (Optional)
            if self.params[3].altered:
                if self.params[3].value in singleFieldTypes:
                    self.params[4].value = self.params[2].value
                    self.params[4].enabled = False
                else:
                    self.params[4].enabled = True
            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Output Coordinate System (Optional)
            if not self.params[3].value in singleFieldTypes:
                if self.params[4].value == None or self.params[4].value == "":
                    self.params[4].setIDMessage("ERROR", 530)
            return

        # END ToolValidator

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Coordinate Table To Point'
        self.description = 'Creates point features from tabular coordinates.'
        self.category = 'Conversion'
        self.helpContext = 74020004
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_table
        param_1 = arcpy.Parameter()
        param_1.name = 'in_table'
        param_1.displayName = 'Input Table'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPTableView'
        param_1.displayOrder = 0

        # out_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class'
        param_2.displayName = 'Output Point Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.displayOrder = 4

        # x_or_lon_field
        param_3 = arcpy.Parameter()
        param_3.name = 'x_or_lon_field'
        param_3.displayName = 'X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.parameterDependencies = ["in_table"]
        param_3.displayOrder = 2

        # in_coordinate_format
        param_4 = arcpy.Parameter()
        param_4.name = 'in_coordinate_format'
        param_4.displayName = 'Input Coordinate Format'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'GPString'
        param_4.value = defaultcoordinateFormat
        param_4.filter.list = coordinateFormats
        param_4.displayOrder = 1

        # y_or_lat_field
        param_5 = arcpy.Parameter()
        param_5.name = 'y_or_lat_field'
        param_5.displayName = 'Y Field (latitude)'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.parameterDependencies = ["in_table"]
        param_5.displayOrder = 3

        # coordinate_system
        param_6 = arcpy.Parameter()
        param_6.name = 'coordinate_system'
        param_6.displayName = 'Output Coordinate System'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = 'GPSpatialReference'
        param_6.displayOrder = 5

        return [param_1, param_2, param_3, param_4, param_5, param_6]

    def isLicensed(self):
        '''Tool Method'''
        return True

    def updateParameters(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateParameters()

    def updateMessages(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateMessages()

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputTable = parameters[0].valueAsText
        outputPointFeatures   = parameters[1].valueAsText
        inputXField = parameters[2].valueAsText
        inputCoordinateFormat = parameters[3].valueAsText
        inputYField = parameters[4].valueAsText
        optionalSpatialReference = parameters[5].value
        optionalSpatialReferenceAsText = parameters[5].valueAsText

        if optionalSpatialReferenceAsText == "#" or optionalSpatialReferenceAsText == "":
            optionalSpatialReference = srWGS84 #GCS_WGS_1984

        outputPointFeaturesOut = defenseConversionToolUtilities.tableToPoint(inputTable,
                                    inputCoordinateFormat,
                                    inputXField,
                                    inputYField,
                                    outputPointFeatures,
                                    optionalSpatialReference)

        return outputPointFeaturesOut

    # END CoordinateNotationToPoint

# -----------------------------------------------------------------------------
# CoordinateTableToEllipse Tool
# -----------------------------------------------------------------------------
class CoordinateTableToEllipse(object):

    class ToolValidator(object):
    
        def __init__(self, parameters):
            """Setup arcpy and the list of tool parameters."""
            self.params = parameters
    
        def initializeParameters(self):
            """Refine the properties of a tool's parameters.  This method is
            called when the tool is opened."""
            #0 - Input Table
            #1 - Output Ellipse
            #2 - X Field
            #3 - Major Field
            #4 - Minor Field
            #5 - Input Coordinate Format
            #6 - Distance Units
            #7 - Y Field
            #8 - Azimuth Field
            #9 - Azimuth Units
            #10 - Output Coordinate System
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
            #0 - Input Table
            #1 - Output Ellipse
            #2 - X Field
            #3 - Major Field
            #4 - Minor Field
            #5 - Input Coordinate Format
            #6 - Distance Units
            #7 - Y Field
            #8 - Azimuth Field
            #9 - Azimuth Units
            #10 - Output Coordinate System
            if self.params[5].altered:
                if self.params[5].value in singleFieldTypes:
                    self.params[7].value = self.params[2].value
                    self.params[7].enabled = False
                else:
                    self.params[7].enabled = True
                    
            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            #0 - Input Table
            #1 - Output Ellipse
            #2 - X Field
            #3 - Major Field
            #4 - Minor Field
            #5 - Input Coordinate Format
            #6 - Distance Units
            #7 - Y Field
            #8 - Azimuth Field
            #9 - Azimuth Units
            #10 - Output Coordinate System
            if not self.params[5].value in singleFieldTypes:
                if self.params[7].value == None or self.params[7].value == "":
                    self.params[7].setIDMessage("ERROR", 530)

            return
            
        # END ToolValidator

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Coordinate Table To Ellipse'
        self.description = 'Creates ellipse features from tabular coordinates and input data values. ' + \
            'This tool uses an input table with coordinate values for ellipse centers and values for major ' + \
            'and minor axis lengths.'
        self.category = 'Conversion'
        self.helpContext = 74020002
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_table
        param_1 = arcpy.Parameter()
        param_1.name = 'in_table'
        param_1.displayName = 'Input Table'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPTableView'
        param_1.displayOrder = 0

        # out_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class'
        param_2.displayName = 'Output Ellipse Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.displayOrder = 7

        # x_or_lon_field
        param_3 = arcpy.Parameter()
        param_3.name = 'x_or_lon_field'
        param_3.displayName = 'X Field (longitude, UTM, MGRS, USNG, GARS, GeoRef)'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.parameterDependencies = ["in_table"]
        param_3.displayOrder = 2

        # major_field
        param_4 = arcpy.Parameter()
        param_4.name = 'major_field'
        param_4.displayName = 'Major Field'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'Field'
        param_4.parameterDependencies = ["in_table"]
        param_4.displayOrder = 4

        # minor_field
        param_5 = arcpy.Parameter()
        param_5.name = 'minor_field'
        param_5.displayName = 'Minor Field'
        param_5.parameterType = 'Required'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.parameterDependencies = ["in_table"]
        param_5.displayOrder = 5

        # in_coordinate_format
        param_6 = arcpy.Parameter()
        param_6.name = 'in_coordinate_format'
        param_6.displayName = 'Input Coordinate Format'
        param_6.parameterType = 'Required'
        param_6.direction = 'Input'
        param_6.datatype = 'GPString'
        param_6.value = defaultcoordinateFormat
        param_6.filter.list = coordinateFormats
        param_6.displayOrder = 1

        # distance_units
        param_7 = arcpy.Parameter()
        param_7.name = 'distance_units'
        param_7.displayName = 'Distance Units'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input'
        param_7.datatype = 'GPString'
        param_7.value = defaultDistanceType
        param_7.filter.list = distanceTypes
        param_7.displayOrder = 6

        # y_or_lat_field
        param_8 = arcpy.Parameter()
        param_8.name = 'y_or_lat_field'
        param_8.displayName = 'Y Field (latitude)'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'Field'
        param_8.parameterDependencies = ["in_table"]
        param_8.displayOrder = 3

        # azimuth_field
        param_9 = arcpy.Parameter()
        param_9.name = 'azimuth_field'
        param_9.displayName = 'Azimuth Field'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = 'Field'
        param_9.parameterDependencies = ["in_table"]
        param_9.displayOrder = 8

        # azimuth_units
        param_10 = arcpy.Parameter()
        param_10.name = 'azimuth_units'
        param_10.displayName = 'Azimuth Units'
        param_10.parameterType = 'Optional'
        param_10.direction = 'Input'
        param_10.datatype = 'GPString'
        param_10.value = defaultAngleType
        param_10.filter.list = angleTypes
        param_10.displayOrder = 9

        # coordinate_system
        param_11 = arcpy.Parameter()
        param_11.name = 'coordinate_system'
        param_11.displayName = 'Output Coordinate System'
        param_11.parameterType = 'Optional'
        param_11.direction = 'Input'
        param_11.datatype = 'GPSpatialReference'
        param_11.displayOrder = 10

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11]

    def isLicensed(self):
        '''Tool Method'''
        return True

    def updateParameters(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateParameters()

    def updateMessages(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateMessages()

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputTable = parameters[0].valueAsText # Input Table
        outputEllipseFeatures = parameters[1].valueAsText # Output Ellipse
        inputXField = parameters[2].valueAsText # X Field (Longitude, UTM, MGRS, USNG, GARS, GeoRef) - from inputTable
        inputMajorAxisField = parameters[3].valueAsText # Major Field - from inputTable
        inputMinorAxisField = parameters[4].valueAsText # Minor Field - from inputTable
        inputCoordinateFormat = parameters[5].valueAsText # Input Coordinate Format
        inputDistanceUnits = parameters[6].valueAsText # Distance Units - from valuelist
        inputYField = parameters[7].valueAsText # Y Field (Latitude)
        inputAzimuthField = parameters[8].valueAsText # Azimuth Field - from inputTable
        inputAzimuthUnits = parameters[9].valueAsText # Azimuth Units - from valuelist
        optionalSpatialReference = parameters[10].value # Spatial Reference
        optionalSpatialReferenceAsText = parameters[10].valueAsText

        if optionalSpatialReferenceAsText == "#" or optionalSpatialReferenceAsText == "":
            optionalSpatialReference = srWGS84 #GCS_WGS_1984

        outputEllipseFeaturesOut = defenseConversionToolUtilities.tableToEllipse(inputTable,
                                           inputCoordinateFormat,
                                           inputXField,
                                           inputYField,
                                           inputMajorAxisField,
                                           inputMinorAxisField,
                                           inputDistanceUnits,
                                           outputEllipseFeatures,
                                           inputAzimuthField,
                                           inputAzimuthUnits,
                                           optionalSpatialReference)

        return outputEllipseFeaturesOut

    # END TableToEllipse

# -----------------------------------------------------------------------------
# CoordinateTableTo2PointLine Tool
# -----------------------------------------------------------------------------
class CoordinateTableTo2PointLine(object):

    class ToolValidator(object):
    
        def __init__(self, parameters):
            """Setup arcpy and the list of tool parameters."""
            self.params = parameters
    
        def initializeParameters(self):
            """Refine the properties of a tool's parameters.  This method is
            called when the tool is opened."""
            #0 - Input Table
            #1 - Output Lines
            #2 - Start X Field
            #3 - End X Field
            #4 - Input Coordinate Format
            #5 - Start Y Field (Optional)
            #6 - End Y Field (Optional)
            #7 - Line Type (Optional)
            #8 - Output Coordinate System (Optional)         
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
            #0 - Input Table
            #1 - Output Lines
            #2 - Start X Field
            #3 - End X Field
            #4 - Input Coordinate Format
            #5 - Start Y Field (Optional)
            #6 - End Y Field (Optional)
            #7 - Line Type (Optional)
            #8 - Output Coordinate System (Optional)         
            if self.params[4].altered:
                if self.params[4].value in singleFieldTypes:
                    self.params[5].value = self.params[2].value
                    self.params[5].enabled = False
                    self.params[6].value = self.params[3].value
                    self.params[6].enabled = False
                else:
                    self.params[5].enabled = True
                    self.params[6].enabled = True

            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            #0 - Input Table
            #1 - Output Lines
            #2 - Start X Field
            #3 - End X Field
            #4 - Input Coordinate Format
            #5 - Start Y Field (Optional)
            #6 - End Y Field (Optional)
            #7 - Line Type (Optional)
            #8 - Output Coordinate System (Optional)         
            if not self.params[4].value in singleFieldTypes:
                if self.params[5].value == None or self.params[5].value == "":
                    self.params[5].setIDMessage("ERROR", 530)
                if self.params[6].value == None or self.params[6].value == "":
                    self.params[6].setIDMessage("ERROR", 530)

            return
            
        # END ToolValidator

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Coordinate Table To 2-Point Line'
        self.description = 'Creates a line feature from start and end point coordinates. ' + \
            'This tool uses an input table with coordinate pairs and outputs line features.'
        self.category = 'Conversion'
        self.helpContext = 74020001
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_table
        param_1 = arcpy.Parameter()
        param_1.name = 'in_table'
        param_1.displayName = 'Input Table'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPTableView'
        param_1.displayOrder = 0

        # out_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class'
        param_2.displayName = 'Output Line Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.displayOrder = 7
        # Possible TODO: add symbology if desired:
        # param_8.symbology =         
 
        # start_x_or_lon_field
        param_3 = arcpy.Parameter()
        param_3.name = 'start_x_or_lon_field'
        param_3.displayName = 'Start X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.parameterDependencies = ["in_table"]
        param_3.displayOrder = 2

        # end_x_or_lon_field
        param_4 = arcpy.Parameter()
        param_4.name = 'end_x_or_lon_field'
        param_4.displayName = 'End X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'Field'
        param_4.parameterDependencies = ["in_table"]
        param_4.displayOrder = 5

        # in_coordinate_format
        param_5 = arcpy.Parameter()
        param_5.name = 'in_coordinate_format'
        param_5.displayName = 'Input Coordinate Format'
        param_5.parameterType = 'Required'
        param_5.direction = 'Input'
        param_5.datatype = 'GPString'
        param_5.value = defaultcoordinateFormat
        param_5.filter.list = coordinateFormats
        param_5.displayOrder = 1

        # start_y_or_lat_field
        param_6 = arcpy.Parameter()
        param_6.name = 'start_y_or_lat_field'
        param_6.displayName = 'Start Y Field (latitude)'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = 'Field'
        param_6.parameterDependencies = ["in_table"]
        param_6.displayOrder = 3

        # end_y_or_lat_field
        param_7 = arcpy.Parameter()
        param_7.name = 'end_y_or_lat_field'
        param_7.displayName = 'End Y Field (latitude)'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input'
        param_7.datatype = 'Field'
        param_7.parameterDependencies = ["in_table"]
        param_7.displayOrder = 6

        # line_type
        param_8 = arcpy.Parameter()
        param_8.name = 'line_type'
        param_8.displayName = 'Line Type'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'GPString'
        param_8.value = defaultLineType
        param_8.filter.list = lineTypes
        param_8.displayOrder = 7

        # coordinate_system
        param_9 = arcpy.Parameter()
        param_9.name = 'coordinate_system'
        param_9.displayName = 'Output Coordinate System'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = 'GPSpatialReference'
        param_9.displayOrder = 8

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9]

    def isLicensed(self):
        '''Tool Method'''
        return True

    def updateParameters(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateParameters()

    def updateMessages(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateMessages()

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputTable = parameters[0].valueAsText # Input Table
        outputLineFeatures = parameters[1].valueAsText # Output Line
        inputStartXField = parameters[2].valueAsText # Start X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)(from Input Table)
        inputEndXField = parameters[3].valueAsText # End X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)(from Input Table)
        inputEndCoordinateFormat = inputStartCoordinateFormat = parameters[4].valueAsText # Start Point Format (from Value List)
        inputStartYField = parameters[5].valueAsText # Start Y Field (latitude)(from Input Table)
        inputEndYField = parameters[6].valueAsText # End Y Field (latitude) (from Input Table)
        inputLineType = parameters[7].valueAsText # Line Type (from Value List)
        optionalSpatialReference = parameters[8].value # Spatial Reference
        optionalSpatialReferenceAsText = parameters[8].valueAsText

        if optionalSpatialReferenceAsText == "#" or optionalSpatialReferenceAsText == "":
            optionalSpatialReference = srWGS84 #GCS_WGS_1984

        outputLineFeaturesOut = defenseConversionToolUtilities.tableTo2PointLine(inputTable,
                                              inputStartCoordinateFormat,
                                              inputStartXField,
                                              inputStartYField,
                                              inputEndCoordinateFormat,
                                              inputEndXField,
                                              inputEndYField,
                                              outputLineFeatures,
                                              inputLineType,
                                              optionalSpatialReference)

        # Set output
        return outputLineFeaturesOut

    # END TableTo2PointLine

# -----------------------------------------------------------------------------
# CoordinateTableToPolygon Tool
# -----------------------------------------------------------------------------
class CoordinateTableToPolygon(object):
    '''
    Use an input table to create polygons
    '''

    class ToolValidator(object):
        """Class for validating a tool's parameter values and controlling
        the behavior of the tool's dialog."""
          
        def __init__(self, parameters):
            """Setup arcpy and the list of tool parameters."""
            self.params = parameters
    
        def initializeParameters(self):
            """Refine the properties of a tool's parameters.  This method is
            called when the tool is opened."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Line Grouping Field (Optional)
            #6 - Sort Field (Optional)
            #7 - Output Coordinate System (Optional)
        
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Line Grouping Field (Optional)
            #6 - Sort Field (Optional)
            #7 - Output Coordinate System (Optional)
            if self.params[3].altered:
                if self.params[3].value in singleFieldTypes:
                    self.params[4].value = self.params[2].value
                    self.params[4].enabled = False
                else:
                    self.params[4].enabled = True

            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Line Grouping Field (Optional)
            #6 - Sort Field (Optional)
            #7 - Output Coordinate System (Optional)
            if not self.params[3].value in singleFieldTypes:
                if self.params[4].value == None or self.params[4].value == "":
                    self.params[4].setIDMessage("ERROR", 530)

            return

        # END ToolValidator

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Coordinate Table To Polygon'
        self.description = 'Converts an input table of vertex points to one or more polygon features.'
        self.category = 'Conversion'
        self.helpContext = 74020005
        self.canRunInBackground = False
        
    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_table
        param_1 = arcpy.Parameter()
        param_1.name = 'in_table'
        param_1.displayName = 'Input Table'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPTableView'
        param_1.displayOrder = 0
     
        # out_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class'
        param_2.displayName = 'Output Polygon Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.displayOrder = 4

        # x_or_lon_field
        param_3 = arcpy.Parameter()
        param_3.name = 'x_or_lon_field'
        param_3.displayName = 'X Field (Longitude, UTM, MGRS, USNG, GARS, GeoRef)'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.parameterDependencies = ["in_table"]
        param_3.displayOrder = 2

        # in_coordinate_format
        param_4 = arcpy.Parameter()
        param_4.name = 'in_coordinate_format'
        param_4.displayName = 'Input Coordinate Format'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'GPString'
        param_4.value = defaultcoordinateFormat
        param_4.filter.list = coordinateFormats
        param_4.displayOrder = 1
        
        # y_or_lat_field
        param_5 = arcpy.Parameter()
        param_5.name = 'y_or_lat_field'
        param_5.displayName = 'Y Field (Latitude)'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.parameterDependencies = ["in_table"]
        param_5.displayOrder = 3
             
        # line_group_field
        param_6 = arcpy.Parameter()
        param_6.name = 'line_group_field'
        param_6.displayName = 'Line Grouping Field'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = 'Field'
        param_6.parameterDependencies = ["in_table"]
        param_6.displayOrder = 5
                
        # sort_field
        param_7 = arcpy.Parameter()
        param_7.name = 'sort_field'
        param_7.displayName = 'Sort Field'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input' 
        param_7.datatype = 'Field'
        param_7.parameterDependencies = ["in_table"]
        param_7.displayOrder = 6
                
        # coordinate_system
        param_8 = arcpy.Parameter()
        param_8.name = 'coordinate_system'
        param_8.displayName = 'Output Coordinate System'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'GPSpatialReference'
        param_8.displayOrder = 7
               
        return [param_1,
                param_2,
                param_3,
                param_4,
                param_5,
                param_6,
                param_7,
                param_8]
    
    def isLicensed(self):
        '''Tool Method'''
        return True
        
    def updateParameters(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateParameters()
            
    def updateMessages(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateMessages()
            
    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputTable = parameters[0].valueAsText
        outputPolygonFeatures = parameters[1].valueAsText
        inputXField = parameters[2].valueAsText
        inputCoordinateFormat = parameters[3].valueAsText
        inputYField = parameters[4].valueAsText 
        inputLineField = parameters[5].valueAsText
        inputSortField = parameters[6].valueAsText
        optionalSpatialReference = parameters[7].value
        optionalSpatialReferenceAsText = parameters[7].valueAsText
            
        if optionalSpatialReferenceAsText == "#" or optionalSpatialReferenceAsText == "":
            optionalSpatialReference = srWGS84 #GCS_WGS_1984
        
        #call tool method
        outputPolygonFeaturesOut = defenseConversionToolUtilities.tableToPolygon(inputTable,
                                                         inputCoordinateFormat,
                                                         inputXField,
                                                         inputYField,
                                                         outputPolygonFeatures,
                                                         inputLineField,
                                                         inputSortField,
                                                         optionalSpatialReference)
        #set output
        return outputPolygonFeaturesOut

    # END TableToPolygon

# -----------------------------------------------------------------------------
# CoordinateTableToPolyline Tool
# -----------------------------------------------------------------------------
class CoordinateTableToPolyline(object):

    class ToolValidator(object):
    
        def __init__(self, parameters):
            """Setup arcpy and the list of tool parameters."""
            self.params = parameters
    
        def initializeParameters(self):
            """Refine the properties of a tool's parameters.  This method is
            called when the tool is opened."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Line Grouping Field (Optional)
            #6 - Sort Field (Optional)
            #7 - Output Coordinate System (Optional)

            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Line Grouping Field (Optional)
            #6 - Sort Field (Optional)
            #7 - Output Coordinate System (Optional)

            if self.params[3].altered:
                if self.params[3].value in singleFieldTypes:
                    self.params[4].value = self.params[2].value
                    self.params[4].enabled = False
                else:
                    self.params[4].enabled = True
 
            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""
            #0 - Input Table
            #1 - Output Features
            #2 - X Field
            #3 - Input Coordinate Format
            #4 - Y Field (Optional)
            #5 - Line Grouping Field (Optional)
            #6 - Sort Field (Optional)
            #7 - Output Coordinate System (Optional)

            if not self.params[3].value in singleFieldTypes:
                if self.params[4].value == None or self.params[4].value == "":
                    self.params[4].setIDMessage("ERROR", 530)
           
            return
            
        # END ToolValidator

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Coordinate Table To Polyline'
        self.description = 'Creates polyline features from tabular coordinates.'
        self.category = 'Conversion'
        self.helpContext = 74020006
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_table
        param_1 = arcpy.Parameter()
        param_1.name = 'in_table'
        param_1.displayName = 'Input Table'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPTableView'
        param_1.displayOrder = 0
     
        # out_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class'
        param_2.displayName = 'Output Polyline Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.displayOrder = 4

        # x_or_lon_field
        param_3 = arcpy.Parameter()
        param_3.name = 'x_or_lon_field'
        param_3.displayName = 'X Field (Longitude, UTM, MGRS, USNG, GARS, GeoRef)'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.parameterDependencies = ["in_table"]
        param_3.displayOrder = 2

        # in_coordinate_format
        param_4 = arcpy.Parameter()
        param_4.name = 'in_coordinate_format'
        param_4.displayName = 'Input Coordinate Format'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'GPString'
        param_4.value = defaultcoordinateFormat
        param_4.filter.list = coordinateFormats
        param_4.displayOrder = 1
        
        # y_or_lat_field
        param_5 = arcpy.Parameter()
        param_5.name = 'y_or_lat_field'
        param_5.displayName = 'Y Field (Latitude)'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.parameterDependencies = ["in_table"]
        param_5.displayOrder = 3
             
        # line_group_field
        param_6 = arcpy.Parameter()
        param_6.name = 'line_group_field'
        param_6.displayName = 'Line Grouping Field'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = 'Field'
        param_6.parameterDependencies = ["in_table"]
        param_6.displayOrder = 5
                
        # sort_field
        param_7 = arcpy.Parameter()
        param_7.name = 'sort_field'
        param_7.displayName = 'Sort Field'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input' 
        param_7.datatype = 'Field'
        param_7.parameterDependencies = ["in_table"]
        param_7.displayOrder = 6
                
        # coordinate_system
        param_8 = arcpy.Parameter()
        param_8.name = 'coordinate_system'
        param_8.displayName = 'Output Coordinate System'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'GPSpatialReference'
        param_8.displayOrder = 7

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8]

    def isLicensed(self):
        '''Tool Method'''
        return True

    def updateParameters(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateParameters()

    def updateMessages(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateMessages()

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputTable = parameters[0].valueAsText # Input Table
        outputPolylineFeatures = parameters[1].valueAsText # Output Polygon Features
        inputXField = parameters[2].valueAsText # X Field (Longitude, UTM, MGRS, USNG, GARS, GeoRef) - from inputTable
        inputCoordinateFormat = parameters[3].valueAsText # Input Coordinate Format - from ValueList
        inputYField = parameters[4].valueAsText # Y Field (Latitude)
        inputLineField = parameters[5].valueAsText # Line Field (optional) - from inputTable
        inputSortField = parameters[6].valueAsText # Sort Field (optional) - from inputTable
        optionalSpatialReference = parameters[7].value # Spatial Reference
        optionalSpatialReferenceAsText = parameters[7].valueAsText

        if optionalSpatialReferenceAsText == "#" or optionalSpatialReferenceAsText == "":
            optionalSpatialReference = srWGS84 #GCS_WGS_1984

        outputPolylineFeaturesOut = defenseConversionToolUtilities.tableToPolyline(inputTable,
                                            inputCoordinateFormat,
                                            inputXField,
                                            inputYField,
                                            outputPolylineFeatures,
                                            inputLineField,
                                            inputSortField,
                                            optionalSpatialReference)

        return outputPolylineFeaturesOut

    # END TableToPolyline

# -----------------------------------------------------------------------------
# CoordinateTableToLineOfBearing Tool
# -----------------------------------------------------------------------------
class CoordinateTableToLineOfBearing(object):

    class ToolValidator(object):
    
        def __init__(self, parameters):
            """Setup arcpy and the list of tool parameters."""
            self.params = parameters
    
        def initializeParameters(self):
            """Refine the properties of a tool's parameters.  This method is
            called when the tool is opened."""
            #0 - Input Table
            #1 - Output Bearing Lines
            #2 - X Field
            #3 - Bearing Field
            #4 - Distance Field
            #5 - Input Coordinate Format
            #6 - Bearing Units
            #7 - Distance Units
            #8 - Y Field (Optional)
            #9 - Line Type (Optional)
            #10 - Output Coordinate System (Optional)

            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""

            #0 - Input Table
            #1 - Output Bearing Lines
            #2 - X Field
            #3 - Bearing Field
            #4 - Distance Field
            #5 - Input Coordinate Format
            #6 - Bearing Units
            #7 - Distance Units
            #8 - Y Field (Optional)
            #9 - Line Type (Optional)
            #10 - Output Coordinate System (Optional)

            if self.params[5].altered:
                if self.params[5].value in singleFieldTypes:
                    self.params[8].value = self.params[2].value
                    self.params[8].enabled = False
                else:
                    self.params[8].enabled = True

            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
            parameter.  This method is called after internal validation."""

            #0 - Input Table
            #1 - Output Bearing Lines
            #2 - X Field
            #3 - Bearing Field
            #4 - Distance Field
            #5 - Input Coordinate Format
            #6 - Bearing Units
            #7 - Distance Units
            #8 - Y Field (Optional)
            #9 - Line Type (Optional)
            #10 - Output Coordinate System (Optional)

            if not self.params[5].value in singleFieldTypes:
                if self.params[8].value == None or self.params[8].value == "":
                    self.params[8].setIDMessage("ERROR", 530)

            return

         # END ToolValidator
   
    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Coordinate Table To Line Of Bearing'
        self.description = 'Creates lines of bearing from tabular coordinates.   '
        self.category = 'Conversion'
        self.helpContext = 74020003
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_table
        param_1 = arcpy.Parameter()
        param_1.name = 'in_table'
        param_1.displayName = 'Input Table'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPTableView'
        param_1.displayOrder = 0

        # out_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class'
        param_2.displayName = 'Output Bearing Lines Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.displayOrder = 8
        # Possible TODO: add symbology if desired:
        # param_2.symbology = 
 
        # x_or_lon_field
        param_3 = arcpy.Parameter()
        param_3.name = 'x_or_lon_field'
        param_3.displayName = 'X Field (longitude, UTM, MGRS, USNG, GARS, GEOREF)'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.parameterDependencies = ["in_table"]
        param_3.displayOrder = 2

        # bearing_field
        param_4 = arcpy.Parameter()
        param_4.name = 'bearing_field'
        param_4.displayName = 'Bearing Field'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'Field'
        param_4.parameterDependencies = ["in_table"]
        param_4.displayOrder = 5

        # distance_field
        param_5 = arcpy.Parameter()
        param_5.name = 'distance_field'
        param_5.displayName = 'Distance Field'
        param_5.parameterType = 'Required'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.parameterDependencies = ["in_table"]
        param_5.displayOrder = 7

        # in_coordinate_format
        param_6 = arcpy.Parameter()
        param_6.name = 'in_coordinate_format'
        param_6.displayName = 'Input Coordinate Format'
        param_6.parameterType = 'Required'
        param_6.direction = 'Input'
        param_6.datatype = 'GPString'
        param_6.value = defaultcoordinateFormat
        param_6.filter.list = coordinateFormats
        param_6.displayOrder = 1

        # bearing_units
        param_7 = arcpy.Parameter()
        param_7.name = 'bearing_units'
        param_7.displayName = 'Bearing Units'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input'
        param_7.datatype = 'GPString'
        param_7.value = defaultAngleType
        param_7.filter.list = angleTypes
        param_7.displayOrder = 4

        # distance_units
        param_8 = arcpy.Parameter()
        param_8.name = 'distance_units'
        param_8.displayName = 'Distance Units'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'GPString'
        param_8.value = defaultDistanceType
        param_8.filter.list = distanceTypes
        param_8.displayOrder = 6

        # y_or_lat_field
        param_9 = arcpy.Parameter()
        param_9.name = 'y_or_lat_field'
        param_9.displayName = 'Y Field (latitude)'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = 'Field'
        param_9.parameterDependencies = ["in_table"]
        param_9.displayOrder = 3

        # line_type
        param_10 = arcpy.Parameter()
        param_10.name = 'line_type'
        param_10.displayName = 'Line Type'
        param_10.parameterType = 'Optional'
        param_10.direction = 'Input'
        param_10.datatype = 'GPString'
        param_10.value = defaultLineType
        param_10.filter.list = lineTypes
        param_10.displayOrder = 9

        # coordinate_system
        param_11 = arcpy.Parameter()
        param_11.name = 'coordinate_system'
        param_11.displayName = 'Output Coordinate System'
        param_11.parameterType = 'Optional'
        param_11.direction = 'Input'
        param_11.datatype = 'GPSpatialReference'
        param_11.displayOrder = 10

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10, param_11]

    def isLicensed(self):
        '''Tool Method'''
        return True

    def updateParameters(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateParameters()

    def updateMessages(self, parameters):
        '''Tool Method'''
        validator = getattr(self, 'ToolValidator', None)
        if validator:
            return validator(parameters).updateMessages()

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputTable = parameters[0].valueAsText # Input Table
        outputLineFeatures = parameters[1].valueAsText # Output Lines
        inputXField = parameters[2].valueAsText # X Field (Longitude, UTM, MGRS, USNG, GARS, GeoRef) - from inputTable
        inputBearingField = parameters[3].valueAsText # Bearing Field - from inputTable
        inputDistanceField = parameters[4].valueAsText # Distance Field - from inputTable
        inputCoordinateFormat = parameters[5].valueAsText # Input Coordinate Format
        inputBearingUnits = parameters[6].valueAsText # Bearing Units - from ValueList
        inputDistanceUnits = parameters[7].valueAsText # Distance Units - from ValueList
        inputYField = parameters[8].valueAsText # Y Field (Latitude)
        inputLineType = parameters[9].valueAsText # Line Type - from ValueList
        optionalSpatialReference = parameters[10].value # Spatial Reference
        optionalSpatialReferenceAsText = parameters[10].valueAsText

        if optionalSpatialReferenceAsText == "#" or optionalSpatialReferenceAsText == "":
            optionalSpatialReference = srWGS84 #GCS_WGS_1984

        outputLineFeaturesOut = defenseConversionToolUtilities.tableToLineOfBearing(inputTable,
                                                 inputCoordinateFormat,
                                                 inputXField,
                                                 inputYField,
                                                 inputBearingUnits,
                                                 inputBearingField,
                                                 inputDistanceUnits,
                                                 inputDistanceField,
                                                 outputLineFeatures,
                                                 inputLineType,
                                                 optionalSpatialReference)

        return outputLineFeaturesOut

    # END CoordinateTableToLineOfBearing

