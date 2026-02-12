'''
 ==================================================
 defenseGRGTools.py
 --------------------------------------------------
 requirements: ArcGIS Pro
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description:
 Gridded Reference Graphic (GRG) Tool logic module.
 ==================================================
'''

import os
import re

import arcpy

try:
    from . import defenseHelper
    from . import defenseGRGUtilities
    from . import defenseGRGReferenceGrid
except ImportError:
    import defenseHelper
    import defenseGRGUtilities
    import defenseGRGReferenceGrid

# String constants shared by tools:
angleTypes = ["DEGREES", "MILS", "RADS", "GRADS"]
defaultAngleType = angleTypes[0]   # "DEGREES"

distanceTypes = ["METERS", "KILOMETERS", "MILES", "NAUTICAL_MILES", "FEET", "US_SURVEY_FEET"]
defaultDistanceType = distanceTypes[0] # "METERS"

labelStartPositions = ['UPPER_LEFT', 'LOWER_LEFT', 'UPPER_RIGHT', 'LOWER_RIGHT']
defaultLabelStartPosition = labelStartPositions[0]

labelFormats = ['ALPHA_NUMERIC', 'ALPHA_ALPHA', 'NUMERIC']
defaultLabelFormat = labelFormats[0]

labelSeparators = ['-',',','.','/']
defaultLabelSeparator = labelSeparators[0]
 
gridSystems = ["MGRS", "USNG"]
defaultGridSystem = gridSystems[0]

gridSizes = ['GRID_ZONE_DESIGNATOR',
                '100000M_GRID',
                '10000M_GRID',
                '1000M_GRID',
                '100M_GRID',
                '50M_GRID',
                '25M_GRID',
                '10M_GRID']
defaultGridSize = gridSizes[0]

largeGridOptions = ["NO_LARGE_GRIDS", "ALLOW_LARGE_GRIDS"]
defaultGridOption = largeGridOptions[0]

addDistanceToCenterOptions = ['ADD_DISTANCE', 'DONT_ADD_DISTANCE']
minFeaturesExpected = 5

class GenerateGRGFromPoint(object):
    '''
    Generate a Gridded Reference Graphic (GRG) from an selected location on the map.
    '''
    def __init__(self):
        ''' Point Target GRG constructor '''
        self.label = "Generate Grid From Point"
        self.description = "Generate a Gridded Reference Graphic (GRG) from an selected location on the map."
        self.category = "Gridded Reference Graphic"
        self.helpContext = 74030001

    def isLicensed(self):
        """Allow the tool to execute, only if the ArcGIS Advanced is available."""
        # Check for Advanced license needed by Sort_management(Shape)
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.GetInstallInfo()['ProductName'] == 'Server':
                return True
            if arcpy.GetInstallInfo()['ProductName'] == 'ArcGISPro':
                if not (arcpy.CheckProduct("ArcInfo") in license_available):
                    raise Exception
        except Exception:
            return False
        return True

    def getParameterInfo(self):
        '''
        Define parameter definitions
        '''

        # Parameter 0 - in_feature
        input_start_location = arcpy.Parameter()
        input_start_location.name='in_feature'
        input_start_location.displayName='Input Feature'
        input_start_location.direction='Input'
        input_start_location.datatype='GPFeatureRecordSetLayer'
        input_start_location.parameterType='Required'
        input_start_location.enabled=True
        input_start_location.multiValue=False
        input_start_location.filter.list = ['POINT']

        # Parameter 1 - out_feature_class
        output_features = arcpy.Parameter()
        output_features.name='out_feature_class'
        output_features.displayName='Output Feature Class'
        output_features.direction='Output'
        output_features.datatype=u'DEFeatureClass'
        output_features.parameterType='Required'
        output_features.enabled=True
        output_features.multiValue=False
        output_features.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                            "..", "Templates", "Layers", "MT_GRG.lyrx"))

        # Parameter 2 - horizontal_cells
        horizontal_cells = arcpy.Parameter()
        horizontal_cells.name='horizontal_cells'
        horizontal_cells.displayName='Number of Rows'
        horizontal_cells.direction='Input'
        horizontal_cells.datatype='GPLong'
        horizontal_cells.parameterType='Optional'
        horizontal_cells.enabled=True
        horizontal_cells.multiValue=False
        horizontal_cells.value = 10
        horizontal_cells.category='Cell Options'

        # Parameter 3 - vertical_cells
        vertical_cells = arcpy.Parameter()
        vertical_cells.name='vertical_cells'
        vertical_cells.displayName='Number of Columns'
        vertical_cells.direction='Input'
        vertical_cells.datatype='GPLong'
        vertical_cells.parameterType='Optional'
        vertical_cells.enabled=True
        vertical_cells.multiValue=False
        vertical_cells.value = 10
        vertical_cells.category='Cell Options'

        # Parameter 4 - cell_width
        cell_width = arcpy.Parameter()
        cell_width.name='cell_width'
        cell_width.displayName='Cell Width'
        cell_width.direction='Input'
        cell_width.datatype='GPDouble'
        cell_width.parameterType='Optional'
        cell_width.enabled=True
        cell_width.multiValue=False
        cell_width.value = 1000.0
        cell_width.category='Cell Options'

        # Parameter 5 - cell_height
        cell_height = arcpy.Parameter()
        cell_height.name='cell_height'
        cell_height.displayName='Cell Height'
        cell_height.direction='Input'
        cell_height.datatype='GPDouble'
        cell_height.parameterType='Optional'
        cell_height.enabled=True
        cell_height.multiValue=False
        cell_height.value = 1000.0
        cell_height.category='Cell Options'

        # Parameter 6 - cell_units
        cell_units = arcpy.Parameter()
        cell_units.name='cell_units'
        cell_units.displayName='Cell Units'
        cell_units.direction='Input'
        cell_units.datatype='GPString'
        cell_units.parameterType='Optional'
        cell_units.enabled=True
        cell_units.multiValue=False
        cell_units.filter.type = 'ValueList'
        cell_units.filter.list = distanceTypes
        cell_units.value = defaultDistanceType
        cell_units.category='Cell Options'

        # Parameter 7 - label_start_position
        label_start_position = arcpy.Parameter()
        label_start_position.name='label_start_position'
        label_start_position.displayName='Label Start Position'
        label_start_position.direction='Input'
        label_start_position.datatype='GPString'
        label_start_position.parameterType='Optional'
        label_start_position.category='Label Options'
        label_start_position.enabled=True
        label_start_position.multiValue=False
        label_start_position.filter.type = 'ValueList'
        label_start_position.filter.list = labelStartPositions
        label_start_position.value = defaultLabelStartPosition

        # Parameter 8 - label_format
        label_format = arcpy.Parameter()
        label_format.name='label_format'
        label_format.displayName='Label Format'
        label_format.direction='Input'
        label_format.datatype='GPString'
        label_format.parameterType='Optional'
        label_format.category='Label Options'
        label_format.enabled=True
        label_format.multiValue=False
        label_format.filter.type = 'ValueList'
        label_format.filter.list = labelFormats
        label_format.value = defaultLabelFormat

        # Parameter 9 - label_separator
        label_separator = arcpy.Parameter()
        label_separator.name='label_separator'
        label_separator.displayName='Label Separator'
        label_separator.direction='Input'
        label_separator.datatype='GPString'
        label_separator.parameterType='Optional'
        label_separator.category='Label Options'
        label_separator.enabled=False
        label_separator.multiValue=False
        label_separator.filter.type = 'ValueList'
        label_separator.filter.list = labelSeparators
        label_separator.value = defaultLabelSeparator

        # Parameter 10 - grid_angle
        grid_angle = arcpy.Parameter()
        grid_angle.name='grid_angle'
        grid_angle.displayName='Grid Rotation Angle'
        grid_angle.direction='Input'
        grid_angle.datatype='GPDouble'
        grid_angle.parameterType='Optional'
        grid_angle.enabled=True
        grid_angle.multiValue=False
        grid_angle.value = 0

        # Parameter 11 - grid_angle_units
        grid_angle_units = arcpy.Parameter()
        grid_angle_units.name='grid_angle_units'
        grid_angle_units.displayName='Grid Rotation Angular Units'
        grid_angle_units.direction='Input'
        grid_angle_units.datatype='GPString'
        grid_angle_units.parameterType='Optional'
        grid_angle_units.enabled=True
        grid_angle_units.multiValue=False
        grid_angle_units.filter.type = 'ValueList'
        grid_angle_units.filter.list = angleTypes
        grid_angle_units.value = defaultAngleType

        return [input_start_location,   # 0
                output_features,        # 1
                horizontal_cells,       # 2
                vertical_cells,         # 3
                cell_width,             # 4
                cell_height,            # 5
                cell_units,             # 6
                label_start_position,   # 7
                label_format,           # 8
                label_separator,        # 9
                grid_angle,             # 10
                grid_angle_units]       # 11

    def updateParameters(self, parameters):
        '''
        Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed.
        '''
        if parameters[8].value == "ALPHA_ALPHA":
            parameters[9].enabled = True
        else:
            parameters[9].enabled = False

        return

    def updateMessages(self, parameters):
        ''' Tool Method '''

        gridAngle = parameters[10].value
        gridUnits = parameters[11].value

        gridAngle = defenseHelper.convertFromUnitNameToDegrees(gridAngle, gridUnits)

        if  gridAngle < -89 or gridAngle > 89:
            parameters[10].setErrorMessage("Grid angle must be between -89 and 89 degrees")
        return

    def execute(self, parameters, messages):
        ''' execute for toolbox'''

        pointTargets = parameters[0].value # Input Location(s)
        output       = parameters[1].valueAsText  # Output
        rows         = parameters[2].value # Number Horizontal Cells
        cols         = parameters[3].value # Number Vertical Cells
        cellWidth    = parameters[4].value # Cell Width
        cellHeight   = parameters[5].value # Cell Height
        cellUnits    = parameters[6].value # Cell Units
        labelStart   = parameters[7].value # Labeling Start Postiton
        labelStyle   = parameters[8].value # Labeling Format
        labelSeparator    = parameters[9].value # Labeling Seperator
        gridRotationAngle = parameters[10].value # Grid Angle
        gridRotationAngleUnits = parameters[11].value # Grid Angle Units

        out_grg = defenseGRGUtilities.GRGFromPoint(pointTargets, output, \
                rows, cols, \
                cellWidth, cellHeight, cellUnits, \
                labelStart, labelStyle, labelSeparator, gridRotationAngle, gridRotationAngleUnits)

        return out_grg

class GenerateGRGFromArea(object):
    '''
    Generate a Gridded Reference Graphic (GRG) from an selected area on the map.
    '''
    def __init__(self):
        '''
        Generate GRG From Area tool constructor method
        '''
        self.label = "Generate Grid From Area"
        self.description = "Generate a Gridded Reference Graphic (GRG) from an selected area on the map."
        self.category = "Gridded Reference Graphic"
        self.helpContext = 74030002

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def getParameterInfo(self):
        '''
        Define parameter definitions
        '''

        # Parameter 0 - in_feature
        input_area_features = arcpy.Parameter()
        input_area_features.name='in_feature'
        input_area_features.displayName='Input Feature'
        input_area_features.direction='Input'
        input_area_features.datatype='GPFeatureRecordSetLayer'
        input_area_features.parameterType='Required'
        input_area_features.enabled=True
        input_area_features.multiValue=False
        input_area_features.filter.list = ['POLYGON']

        # Parameter 1 - out_feature_class
        output_features = arcpy.Parameter()
        output_features.name ='out_feature_class'
        output_features.displayName ='Output Feature Class'
        output_features.direction='Output'
        output_features.datatype='DEFeatureClass'
        output_features.parameterType='Required'
        output_features.enabled=True
        output_features.multiValue=False
        output_features.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                            "..", "Templates", "Layers", "MT_GRG.lyrx"))

        # Parameter 2 - cell_width
        cell_width = arcpy.Parameter()
        cell_width.name='cell_width'
        cell_width.displayName='Cell Width'
        cell_width.direction='Input'
        cell_width.datatype='GPDouble'
        cell_width.parameterType='Optional'
        cell_width.enabled=True
        cell_width.multiValue=False
        cell_width.value = 1000.0
        cell_width.category='Cell Options'

        # Parameter 3 - cell_height
        cell_height = arcpy.Parameter()
        cell_height.name='cell_height'
        cell_height.displayName='Cell Height'
        cell_height.direction='Input'
        cell_height.datatype='GPDouble'
        cell_height.parameterType='Optional'
        cell_height.enabled=True
        cell_height.multiValue=False
        cell_height.value = 1000.0
        cell_height.category='Cell Options'

        # Parameter 4 - cell_units
        cell_units = arcpy.Parameter()
        cell_units.name='cell_units'
        cell_units.displayName='Cell Units'
        cell_units.direction='Input'
        cell_units.datatype='GPString'
        cell_units.parameterType='Optional'
        cell_units.enabled=True
        cell_units.multiValue=False
        cell_units.filter.type = 'ValueList'
        cell_units.filter.list = distanceTypes
        cell_units.value = defaultDistanceType
        cell_units.category='Cell Options'

        # Parameter 5 - label_start_position
        label_start_position = arcpy.Parameter()
        label_start_position.name='label_start_position'
        label_start_position.displayName='Label Start Position'
        label_start_position.direction='Input'
        label_start_position.datatype='GPString'
        label_start_position.parameterType='Optional'
        label_start_position.category='Label Options'
        label_start_position.enabled=True
        label_start_position.multiValue=False
        label_start_position.filter.type = 'ValueList'
        label_start_position.filter.list = labelStartPositions
        label_start_position.value = defaultLabelStartPosition

        # Parameter 6 - label_format
        label_format = arcpy.Parameter()
        label_format.name='label_format'
        label_format.displayName='Label Format'
        label_format.direction='Input'
        label_format.datatype='GPString'
        label_format.parameterType='Optional'
        label_format.category='Label Options'
        label_format.enabled=True
        label_format.multiValue=False
        label_format.filter.type = 'ValueList'
        label_format.filter.list = labelFormats
        label_format.value = defaultLabelFormat

        # Parameter 7 - label_separator
        label_separator = arcpy.Parameter()
        label_separator.name='label_separator'
        label_separator.displayName='Label Separator'
        label_separator.direction='Input'
        label_separator.datatype='GPString'
        label_separator.parameterType='Optional'
        label_separator.category='Label Options'
        label_separator.enabled=False
        label_separator.multiValue=False
        label_separator.filter.type = 'ValueList'
        label_separator.filter.list = labelSeparators
        label_separator.value = defaultLabelSeparator

        return [input_area_features,   # 0
                output_features,       # 1
                cell_width,            # 2
                cell_height,           # 3
                cell_units,            # 4
                label_start_position,  # 5
                label_format,          # 6
                label_separator]       # 7

    def updateParameters(self, parameters):
        '''
        Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed.
        '''
        if parameters[6].value == "ALPHA_ALPHA":
            parameters[7].enabled = True
        else:
            parameters[7].enabled = False
        return

    def updateMessages(self, parameters):
        ''' Tool Method '''
        return

    def execute(self, parameters, messages):
        ''' execute for toolbox'''

        input_area_features = parameters[0].valueAsText
        output_features = parameters[1].valueAsText
        cell_width = parameters[2].value
        cell_height = parameters[3].value
        cell_units =  parameters[4].value        
        label_start_position = parameters[5].value
        label_format =  parameters[6].value
        label_separator = parameters[7].value

        out_grg = defenseGRGUtilities.GRGFromArea(
                        input_area_features,  
                        output_features,      
                        cell_width,           
                        cell_height,          
                        cell_units,           
                        label_start_position, 
                        label_format,           
                        label_separator)
         
        return out_grg

class GenerateReferenceSystemGRGFromArea(object):
    '''
    Build polygon features of MGRS or USNG gridded reference graphics.
    '''
    def __init__(self):
        ''' Define Reference Grid From Area constructor '''
        self.label = "Generate Reference System Grid From Area"
        self.description = "Generate an MGRS or USNG gridded reference graphic from an selected area on the map."
        self.category = "Gridded Reference Graphic"
        self.helpContext = 74030003

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def getParameterInfo(self):
        '''
        Define parameter definitions
        '''

        in_features = arcpy.Parameter()
        in_features.name='in_features'
        in_features.displayName='Input Feature'
        in_features.direction='Input'
        in_features.datatype='GPFeatureRecordSetLayer'
        in_features.parameterType='Required'
        in_features.enabled=True
        in_features.multiValue=False
        in_features.filter.list = ['POLYGON']
      
        output_features = arcpy.Parameter()
        output_features.name='output_feature_class'
        output_features.displayName='Output Feature Class'
        output_features.direction='Output'
        output_features.datatype='DEFeatureClass'
        output_features.parameterType='Required'
        output_features.enabled=True
        output_features.multiValue=False
        output_features.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                            "..", "Templates", "Layers", "MT_GRG.lyrx"))

        grid_reference_system = arcpy.Parameter()
        grid_reference_system.name='grid_reference_system'
        grid_reference_system.displayName='Grid Reference System'
        grid_reference_system.direction='Input'
        grid_reference_system.datatype='GPString'
        grid_reference_system.parameterType='Required'
        grid_reference_system.enabled=True
        grid_reference_system.multiValue=False
        grid_reference_system.filter.type = 'ValueList'
        grid_reference_system.filter.list = gridSystems
        grid_reference_system.value = defaultGridSystem

        grid_square_size = arcpy.Parameter()
        grid_square_size.name='grid_square_size'
        grid_square_size.displayName='Grid Square Size'
        grid_square_size.direction='Input'
        grid_square_size.datatype='GPString'
        grid_square_size.parameterType='Required'
        grid_square_size.enabled=True
        grid_square_size.multiValue=False
        grid_square_size.filter.type = 'ValueList'
        grid_square_size.filter.list = gridSizes
        grid_square_size.value = defaultGridSize

        large_grid_handling = arcpy.Parameter()
        large_grid_handling.name='large_grid_handling'
        large_grid_handling.displayName='Large Grid Handling'
        large_grid_handling.direction='Input'
        large_grid_handling.datatype='GPString'
        large_grid_handling.parameterType='Optional'
        large_grid_handling.enabled=True
        large_grid_handling.multiValue=False
        large_grid_handling.filter.type = 'ValueList'
        large_grid_handling.filter.list = largeGridOptions
        large_grid_handling.value = defaultGridOption

        return [in_features,            # 0
                output_features,        # 1
                grid_reference_system,  # 2
                grid_square_size,       # 3
                large_grid_handling]    # 4

    def updateParameters(self, parameters):
        '''
        Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed.
        '''
        return

    def updateMessages(self, parameters):
        '''
        Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation
        '''
        return

    def execute(self, parameters, messages):
        ''' execute for toolbox'''

        inFeatures          = parameters[0].value   # 0
        outputFeatures      = parameters[1].value   # 1
        gridReferenceSystem = parameters[2].value   # 2
        gridSquareSize      = parameters[3].value   # 3
        largeGridHandling   = parameters[4].value   # 4

        referenceGridBuilder = defenseGRGReferenceGrid.ReferenceGrid(
                                    inFeatures,
                                    gridReferenceSystem,
                                    gridSquareSize,
                                    largeGridHandling)

        outGrid = referenceGridBuilder.Build(outputFeatures)

        return outGrid

class NumberFeatures(object):
    '''
    Number input features within a specified area.
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
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
    
            # Parameter 0 - in_features
            # Parameter 1 - field_to_number
            # Parameter 2 - in_area
            # Parameter 3 - spatial_sort_method
            # Parameter 4 - new_field_type
            # Parameter 5 - out_feature_class 
            # Parameter 6 - starting_number
            # Parameter 7 - increment_by
            # Parameter 8 - center_point
            # Parameter 9 - add_distance_and_bearing

            if self.params[0].altered or self.params[1].altered:
                try:
                    # Only enable new_field_type if field_to_number does not exist in in_features
                    inputTable = self.params[0].valueAsText
                    upperFieldName = self.params[1].valueAsText.upper()
                    upperFieldNames = [f.name.upper() for f in arcpy.ListFields(inputTable)]
                    existingField = upperFieldName in upperFieldNames
                    self.params[4].enabled = not existingField
                except: 
                    pass

            if self.params[3].altered:
                isCenterOption = self.params[3].valueAsText in ['CENTER', 'COUNTERCLOCKWISE', 'CLOCKWISE']
                self.params[8].enabled = isCenterOption 
                self.params[9].enabled = isCenterOption
                if not isCenterOption:
                    # Reset these values in case previously set when Center option was enabled
                    self.params[8].value = None
                    self.params[9].value = False

            return

        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
             parameter.  This method is called after internal validation."""

            # Parameter 0 - in_features
            # Parameter 1 - field_to_number
            # Parameter 2 - in_area
            # Parameter 3 - spatial_sort_method
            # Parameter 4 - new_field_type
            # Parameter 5 - out_feature_class 
            # Parameter 6 - starting_number
            # Parameter 7 - increment_by
            # Parameter 8 - center_point
            # Parameter 9 - add_distance_and_bearing

            if self.params[1].altered:
                # IMPORTANT: Clear Message on this parameters or validation will fail if 
                # field_to_number is set to a new field name
                self.params[1].clearMessage()

                fieldName = self.params[1].valueAsText
                # Check for a valid field name
                if fieldName not in [None, "#", ""]:
                    validFieldName = arcpy.ValidateFieldName(fieldName)
                    isValidFieldName = validFieldName == fieldName
                    if not isValidFieldName:
                        self.params[1].setIDMessage("ERROR", 544, fieldName)
    
            return

    def __init__(self):
        '''
        Number Features constructor
        '''
        self.label = "Number Features"
        self.description = "Add a sequential number to input features, optionally within a selected area."
        self.category = "Gridded Reference Graphic\\Number and Letter"
        self.helpContext = 74030004

    def isLicensed(self):
        """Check for Advanced license needed by Sort_management(Shape)"""
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.GetInstallInfo()['ProductName'] == 'Server':
                return True
            if arcpy.GetInstallInfo()['ProductName'] == 'ArcGISPro':
                if not (arcpy.CheckProduct("ArcInfo") in license_available):
                    raise Exception
        except Exception:
            return False
        return True

    def getParameterInfo(self):
        '''
        Define parameter definitions
        '''

        # Parameter 0 - in_features
        # Parameter 1 - field_to_number
        # Parameter 2 - in_area
        # Parameter 3 - spatial_sort_method
        # Parameter 4 - new_field_type
        # Parameter 5 - out_feature_class 
        # Parameter 6 - starting_number
        # Parameter 7 - increment_by
        # Parameter 8 - center_point
        # Parameter 9 - add_distance_and_bearing

        # Parameter 0 - in_features
        input_features = arcpy.Parameter()
        input_features.name='in_features'
        input_features.displayName='Input Features'
        input_features.direction='Input'
        input_features.datatype = 'GPFeatureRecordSetLayer'
        input_features.parameterType='Required'
        input_features.enabled=True
        input_features.multiValue=False
        input_features.filter.list = ['POINT', 'POLYLINE', 'LINE', 'MULTIPOINT', 'POLYGON']
        input_features.displayOrder = 0

        # Parameter 1 - field_to_number
        field_to_number = arcpy.Parameter()
        field_to_number.name = 'field_to_number'
        field_to_number.displayName = 'Field to Number (Existing or New)'
        field_to_number.direction = 'Input'
        field_to_number.datatype = 'Field'
        field_to_number.parameterType = 'Required'
        field_to_number.enabled = True
        field_to_number.multiValue=False
        field_to_number.filter.list = ['Short', 'Long', 'Integer', 'Text']
        field_to_number.parameterDependencies = ['in_features']
        field_to_number.displayOrder = 1

        # Parameter 2 - in_area
        input_area = arcpy.Parameter()
        input_area.name = 'in_area'
        input_area.displayName = 'Input Area to Number'
        input_area.direction = 'Input'
        input_area.datatype = 'GPFeatureRecordSetLayer'
        input_area.parameterType = 'Optional'
        input_area.enabled = True
        input_area.multiValue = False
        input_area.filter.list = ['POLYGON']
        input_area.displayOrder = 3

        # Parameter 3 - spatial_sort_method
        # Spatial Sort Method, spatial_sort_method {String} [UR, UL, LR, LL, PEANO, NONE]
        # Note: uses values from Sort_management tool
        # Specifies how features are spatially sorted. 
        # UR - Sorting starts at the upper right corner. This is the default. (left to right, top to bottom)
        # UL - Sorting starts at the upper left corner.
        # LR - Sorting starts at the lower right corner.
        # LL - Sorting starts at the lower left corner.
        # PEANO - Sorting uses a space filling curve algorithm, also known as a Peano curve.
        # CENTER - Sort from a center point (mean center used if no center point supplied)
        # CLOCKWISE - Sort from a center point working outward in intervals by angle
        # COUNTERCLOCKWISE - Sort from a center point working outward in intervals by reverse angle
        # NONE - Do not use a spatial sort (use same ordering as feature class)
        spatial_sort_method = arcpy.Parameter()
        spatial_sort_method.name = 'spatial_sort_method'
        spatial_sort_method.displayName = 'Spatial Sort Method'
        spatial_sort_method.direction = 'Input'
        spatial_sort_method.datatype = 'GPString'
        spatial_sort_method.parameterType = 'Optional'
        spatial_sort_method.enabled = True
        spatial_sort_method.multiValue = False
        spatial_sort_method.filter.type = 'ValueList'
        spatial_sort_method.filter.list = defenseGRGUtilities.supportedSortMethods
        spatial_sort_method.value = spatial_sort_method.filter.list[0]
        spatial_sort_method.displayOrder = 4

        # Parameter 4 - new_field_type
        # Note: only enabled if a new field is selected in field_to_number
        # Field Type new_field_type {String}:
        # Note: uses a subset of the values from the AddField tool
        # The field type of the new field. This parameter is only used when the
        # field name does not exist in the input table.
        # TEXT-Any string of characters.
        # SHORT-Whole numbers between -32,768 and 32,767.
        # LONG-Whole numbers between -2,147,483,648 and 2,147,483,647.
        new_field_type = arcpy.Parameter()
        new_field_type.name = 'new_field_type'
        new_field_type.displayName = 'Field Type For New Field'
        new_field_type.direction = 'Input'
        new_field_type.datatype = 'GPString'
        new_field_type.parameterType = 'Optional'
        new_field_type.enabled = False
        new_field_type.multiValue = False
        new_field_type.filter.type = 'ValueList'
        new_field_type.filter.list = ['SHORT', 'LONG', 'TEXT'] 
        new_field_type.value = new_field_type.filter.list[1]
        new_field_type.displayOrder = 2

        # Parameter 5 - out_feature_class
        output_features = arcpy.Parameter()
        output_features.name = 'out_feature_class'
        output_features.displayName = 'Output Feature Class'
        output_features.direction = 'Output'
        output_features.datatype = 'DEFeatureClass'
        output_features.parameterType = 'Derived'
        output_features.enabled = True
        output_features.parameterDependencies = ['in_features']

        # Parameter 6 - Starting Number
        # starting_number 
        starting_number = arcpy.Parameter()
        starting_number.name = 'starting_number'
        starting_number.displayName = 'Starting With'
        starting_number.parameterType = 'Optional'
        starting_number.direction = 'Input'
        starting_number.datatype = 'GPLong'
        starting_number.value = 1
        starting_number.enabled = True 
        starting_number.displayOrder = 5

        # Parameter 7 - Increment By
        # increment_by 
        increment_by = arcpy.Parameter()
        increment_by.name = 'increment_by'
        increment_by.displayName = 'Increment By'
        increment_by.parameterType = 'Optional'
        increment_by.direction = 'Input'
        increment_by.datatype = 'GPLong'
        increment_by.value = 1
        increment_by.enabled = True 
        increment_by.displayOrder = 6

        # Parameter 8 - center_point
        center_point = arcpy.Parameter()
        center_point.name = 'center_point'
        center_point.displayName = 'Center Point'
        center_point.direction = 'Input'
        center_point.datatype = 'GPFeatureRecordSetLayer'
        center_point.parameterType = 'Optional'
        center_point.enabled = False
        center_point.multiValue = False
        center_point.filter.list = ['POINT']
        center_point.displayOrder = 7

        # Parameter 9 - add_distance_and_bearing
        add_distance_and_bearing = arcpy.Parameter()
        add_distance_and_bearing.name = 'add_distance_and_bearing'
        add_distance_and_bearing.displayName = 'Add Distance and Bearing to Center'
        add_distance_and_bearing.parameterType = 'Optional'
        add_distance_and_bearing.direction = 'Input'
        add_distance_and_bearing.datatype = 'GPBoolean'
        add_distance_and_bearing.value = False
        add_distance_and_bearing.enabled = False
        add_distance_and_bearing.filter.list = addDistanceToCenterOptions
        add_distance_and_bearing.displayOrder = 8

        return [
                input_features,        # 0
                field_to_number,       # 1
                input_area,            # 2
                spatial_sort_method,   # 3
                new_field_type,        # 4
                output_features,       # 5
                starting_number,       # 6
                increment_by,          # 7
                center_point,          # 8
                add_distance_and_bearing  # 9
               ]

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

        input_features = parameters[0].valueAsText
        field_to_number = parameters[1].valueAsText
        input_area = parameters[2].valueAsText
        spatial_sort_method = parameters[3].valueAsText
        new_field_type = parameters[4].valueAsText
        starting_number = parameters[6].value
        increment_by    = parameters[7].value
        center_point = parameters[8].valueAsText
        add_distance_and_bearing = parameters[9].value

        inputFeatureCount = int(arcpy.GetCount_management(input_features).getOutput(0))
        if inputFeatureCount < minFeaturesExpected:
            arcpy.AddIDMessage("WARNING", 201003, str(inputFeatureCount)) # Number of input features less than expected:

        if spatial_sort_method is None:
            spatial_sort_method = 'UR'

        if new_field_type is None:
            new_field_type = 'SHORT'

        if input_area is None and arcpy.env.extent is not None:
            input_area = arcpy.env.extent.polygon

        defenseGRGUtilities.NumberFeatures(input_features,
                                    field_to_number,
                                    input_area,
                                    spatial_sort_method,
                                    starting_number,
                                    increment_by,
                                    new_field_type,
                                    center_point,
                                    add_distance_and_bearing)

        parameters[5].value = parameters[0].value # Derived from input

        return input_features

class LetterFeatures(object):
    '''
    Add incrementing letters to input features within a specified area.
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
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
    
            # Parameter 0 - in_features
            # Parameter 1 - field_to_letter
            # Parameter 2 - in_area
            # Parameter 3 - spatial_sort_method
            # Parameter 4 - lettering_format
            # Parameter 5 - starting_letter
            # Parameter 6 - omit_letters
            # Parameter 7 - center_point
            # Parameter 8 - add_distance_and_bearing 
            # Parameter 9 - out_feature_class 

            if self.params[3].altered:
                isCenterOption = self.params[3].valueAsText in ['CENTER', 'COUNTERCLOCKWISE', 'CLOCKWISE']
                self.params[7].enabled = isCenterOption 
                self.params[8].enabled = isCenterOption
                if not isCenterOption:
                    # Reset these values in case previously set when Center option was enabled
                    self.params[7].value = None
                    self.params[8].value = False

            return

        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
             parameter.  This method is called after internal validation."""

            # Parameter 0 - in_features
            # Parameter 1 - field_to_letter
            # Parameter 2 - in_area
            # Parameter 3 - spatial_sort_method
            # Parameter 4 - lettering_format
            # Parameter 5 - starting_letter
            # Parameter 6 - omit_letters
            # Parameter 7 - center_point
            # Parameter 8 - add_distance_and_bearing 
            # Parameter 9 - out_feature_class 

            if self.params[1].altered:
                # IMPORTANT: Clear Message on this parameter or validation will fail if 
                # field_to_number is set to a new field name
                self.params[1].clearMessage()

                fieldName = self.params[1].valueAsText
                # Check for a valid field name
                if fieldName not in [None, "#", ""]:
                    validFieldName = arcpy.ValidateFieldName(fieldName)
                    isValidFieldName = validFieldName == fieldName
                    if not isValidFieldName:
                        self.params[1].setIDMessage("ERROR", 544, fieldName)

            if self.params[5].altered:
                starting_letter = self.params[5].valueAsText
                if starting_letter not in [None, "#", ""]:
                    starting_letter = starting_letter.strip().upper()
                    # Just do basic validation that it is a letter
                    if re.match('^[A-Z][A-Z]?$', starting_letter) is None:
                        self.params[5].setIDMessage("ERROR", 200826, starting_letter)

            if self.params[6].altered:
                omit_letters = self.params[6].valueAsText
                if omit_letters not in [None, "#", ""] and len(omit_letters) > 0:
                    omit_letters = omit_letters.strip().upper()
                    # Just do basic validation that it is a list of single letters
                    if re.match('^([A-Z])(;\s*[A-Z])*$', omit_letters) is None:
                        self.params[6].setIDMessage("ERROR", 200826, omit_letters)

            if self.params[5].altered or self.params[6].altered:
                # Ensure starting letter is not in omit letters 
                starting_letter = self.params[5].valueAsText
                omit_letters = self.params[6].valueAsText

                if starting_letter not in [None, "#", ""] and omit_letters not in [None, "#", ""]:
                    starting_letter = starting_letter.strip()[0].upper()
                    omit_letters = omit_letters.strip().upper()
                    if starting_letter in omit_letters:
                        self.params[6].setIDMessage("ERROR", 556, starting_letter)

            return

    def __init__(self):
        '''
        Number Features constructor
        '''
        self.label = "Letter Features"
        self.description = "Add sequential letters to input features, optionally within a selected area."
        self.category = "Gridded Reference Graphic\\Number and Letter"
        self.helpContext = 74030005

    def isLicensed(self):
        """Check for Advanced license needed by Sort_management(Shape)"""
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.GetInstallInfo()['ProductName'] == 'Server':
                return True
            if arcpy.GetInstallInfo()['ProductName'] == 'ArcGISPro':
                if not (arcpy.CheckProduct("ArcInfo") in license_available):
                    raise Exception
        except Exception:
            return False
        return True

    def getParameterInfo(self):
        '''
        Define parameter definitions
        '''

        # Parameter 0 - in_features
        # Parameter 1 - field_to_letter
        # Parameter 2 - in_area
        # Parameter 3 - spatial_sort_method
        # Parameter 4 - lettering_format
        # Parameter 5 - starting_letter
        # Parameter 6 - omit_letters
        # Parameter 7 - center_point
        # Parameter 8 - add_distance_and_bearing 
        # Parameter 9 - out_feature_class 

        # Parameter 0 - in_features
        input_features = arcpy.Parameter()
        input_features.name='in_features'
        input_features.displayName='Input Features'
        input_features.direction='Input'
        input_features.datatype = 'GPFeatureRecordSetLayer'
        input_features.parameterType='Required'
        input_features.enabled=True
        input_features.multiValue=False
        input_features.filter.list = ['POINT', 'POLYLINE', 'LINE', 'MULTIPOINT', 'POLYGON']

        # Parameter 1 - field_to_letter
        field_to_letter = arcpy.Parameter()
        field_to_letter.name = 'field_to_letter'
        field_to_letter.displayName = 'Field to Letter (Existing or New)'
        field_to_letter.direction = 'Input'
        field_to_letter.datatype = 'Field'
        field_to_letter.parameterType = 'Required'
        field_to_letter.enabled = True
        field_to_letter.multiValue=False
        field_to_letter.filter.list = ['Text']
        field_to_letter.parameterDependencies = ['in_features']

        # Parameter 2 - in_area
        input_area = arcpy.Parameter()
        input_area.name = 'in_area'
        input_area.displayName = 'Input Area to Letter'
        input_area.direction = 'Input'
        input_area.datatype = 'GPFeatureRecordSetLayer'
        input_area.parameterType = 'Optional'
        input_area.enabled = True
        input_area.multiValue = False
        input_area.filter.list = ['POLYGON']

        # Parameter 3 - spatial_sort_method
        # See NumberFeatures Tool spatial_sort_method for more info
        spatial_sort_method = arcpy.Parameter()
        spatial_sort_method.name = 'spatial_sort_method'
        spatial_sort_method.displayName = 'Spatial Sort Method'
        spatial_sort_method.direction = 'Input'
        spatial_sort_method.datatype = 'GPString'
        spatial_sort_method.parameterType = 'Optional'
        spatial_sort_method.enabled = True
        spatial_sort_method.multiValue = False
        spatial_sort_method.filter.type = 'ValueList'
        spatial_sort_method.filter.list = defenseGRGUtilities.supportedSortMethods 
        spatial_sort_method.value = spatial_sort_method.filter.list[0]

        # Parameter 4 - Lettering Format ("A, B, C", "AA, AB, AC", "AA, BB, CC")
        lettering_format = arcpy.Parameter()
        lettering_format.name = 'lettering_format'
        lettering_format.displayName = 'Lettering Format'
        lettering_format.direction = 'Input'
        lettering_format.datatype = 'GPString'
        lettering_format.parameterType = 'Optional'
        lettering_format.enabled = True
        lettering_format.multiValue = False
        lettering_format.filter.type = 'ValueList'
        lettering_format.filter.list = defenseHelper.NumbersToLetters.SupportedLetteringFormats
        lettering_format.value = lettering_format.filter.list[0]

        # Parameter 5 - Starting Letter
        # starting_letter 
        starting_letter = arcpy.Parameter()
        starting_letter.name = 'starting_letter'
        starting_letter.displayName = 'Starting Letter'
        starting_letter.parameterType = 'Optional'
        starting_letter.direction = 'Input'
        starting_letter.datatype = 'GPString'
        starting_letter.value = 'A'
        starting_letter.enabled = True

        # Parameter 6 - Omit Letters
        # omit_letters
        omit_letters = arcpy.Parameter()
        omit_letters.name = 'omit_letters'
        omit_letters.displayName = 'Omit Letters'
        omit_letters.parameterType = 'Optional'
        omit_letters.direction = 'Input'
        omit_letters.datatype = 'GPString'
        omit_letters.multiValue = True
        omit_letters.enabled = True

        # Parameter 7 - center_point
        center_point = arcpy.Parameter()
        center_point.name = 'center_point'
        center_point.displayName = 'Center Point'
        center_point.direction = 'Input'
        center_point.datatype = 'GPFeatureRecordSetLayer'
        center_point.parameterType = 'Optional'
        center_point.enabled = False
        center_point.multiValue = False
        center_point.filter.list = ['POINT']

        # Parameter 8 - add_distance_and_bearing
        add_distance_and_bearing = arcpy.Parameter()
        add_distance_and_bearing.name = 'add_distance_and_bearing'
        add_distance_and_bearing.displayName = 'Add Distance and Bearing to Center'
        add_distance_and_bearing.parameterType = 'Optional'
        add_distance_and_bearing.direction = 'Input'
        add_distance_and_bearing.datatype = 'GPBoolean'
        add_distance_and_bearing.enabled = False
        add_distance_and_bearing.value = False
        add_distance_and_bearing.filter.list = addDistanceToCenterOptions

        # Parameter 9 - out_feature_class
        output_features = arcpy.Parameter()
        output_features.name = 'out_feature_class'
        output_features.displayName = 'Output Feature Class'
        output_features.direction = 'Output'
        output_features.datatype = 'DEFeatureClass'
        output_features.parameterType = 'Derived'
        output_features.parameterDependencies = ['in_features']
        output_features.enabled = True

        return [input_features,        # 0
                field_to_letter,       # 1
                input_area,            # 2
                spatial_sort_method,   # 3
                lettering_format,      # 4
                starting_letter,       # 5
                omit_letters,          # 6
                center_point,          # 7
                add_distance_and_bearing,   # 8
                output_features]       # 9

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

        input_features = parameters[0].valueAsText
        field_to_letter = parameters[1].valueAsText
        input_area = parameters[2].valueAsText
        spatial_sort_method = parameters[3].valueAsText
        lettering_format = parameters[4].valueAsText
        starting_letter = parameters[5].valueAsText
        omit_letters = parameters[6].valueAsText
        center_point = parameters[7].valueAsText
        add_distance_and_bearing = parameters[8].value

        inputFeatureCount = int(arcpy.GetCount_management(input_features).getOutput(0))
        if inputFeatureCount < minFeaturesExpected:
            arcpy.AddIDMessage("WARNING", 201003, str(inputFeatureCount)) # Number of input features less than expected:

        if spatial_sort_method is None:
            spatial_sort_method = 'UR'

        if lettering_format is None or \
            lettering_format not in defenseHelper.NumbersToLetters.SupportedLetteringFormats:
            lettering_format = defenseHelper.NumbersToLetters.SupportedLetteringFormats[0]

        if starting_letter in [None, "#", "", "A"]:
            if lettering_format == defenseHelper.NumbersToLetters.SupportedLetteringFormats[0]:
                starting_letter = 'A'
            else:
                starting_letter = 'AA'

        omitLettersList = []
        if omit_letters not in [None, '#', '']:
            try:
                defaultDelimiter = ';'
                omitlist = omit_letters.split(defaultDelimiter)
                # Strip whitespace and ensure uppercase
                omitLettersCheckList = [omitletter.strip().upper() for omitletter in omitlist]

                # TODO: decide if this should be in validation, just skip here for now
                for omitletter in omitLettersCheckList:
                    if omitletter is None or (len(omitletter) != 1) or \
                       not (ord(omitletter) in range(ord('A'), ord('Z'))):
                        arcpy.AddIDMessage("WARNING", 200826, str(omitletter)) # Not a valid ASCII letter, or could not convert letter(s) to value:
                    else:
                        omitLettersList.append(omitletter)
            except:
                arcpy.AddIDMessage("ERROR", 200826, str(omit_letters)) # Not a valid ASCII letter, or could not convert letter(s) to value:
                omitLettersList = []

        starting_number = -1
        increment_by = 1
        new_field_type = 'TEXT'

        if input_area is None and arcpy.env.extent is not None:
            input_area = arcpy.env.extent.polygon

        defenseGRGUtilities.NumberFeatures(input_features,
                                    field_to_letter,
                                    input_area,
                                    spatial_sort_method,
                                    starting_number,
                                    increment_by,
                                    new_field_type,
                                    center_point,
                                    add_distance_and_bearing,
                                    True,
                                    lettering_format,
                                    starting_letter,
                                    omitLettersList)

        parameters[9].value = parameters[0].value # Derived from input

        return input_features

class LetterIntersections(object):
    '''
    Add incrementing letters to intersection points of input line features within a specified area.
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
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""

            # Parameter 0 - in_features
            # Parameter 1 - out_feature_class
            # Parameter 2 - field_to_letter
            # Parameter 3 - input_area
            # Parameter 4 - spatial_sort_method
            # Parameter 5 - lettering_format
            # Parameter 6 - starting_letter
            # Parameter 7 - omit_letters
            # Parameter 8 - min_out_point_distance 
            # Parameter 9 - center_point
            # Parameter 10 - add_distance_and_bearing 

            if self.params[4].altered:
                isCenterOption = self.params[4].valueAsText in ['CENTER', 'COUNTERCLOCKWISE', 'CLOCKWISE']
                self.params[9].enabled = isCenterOption 
                self.params[10].enabled = isCenterOption
                if not isCenterOption:
                    # Reset these values in case previously set when Center option was enabled
                    self.params[9].value = None
                    self.params[10].value = False

            return

        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
             parameter.  This method is called after internal validation."""

            # Parameter 0 - in_features
            # Parameter 1 - out_feature_class
            # Parameter 2 - field_to_letter
            # Parameter 3 - input_area
            # Parameter 4 - spatial_sort_method
            # Parameter 5 - lettering_format
            # Parameter 6 - starting_letter
            # Parameter 7 - omit_letters
            # Parameter 8 - min_out_point_distance 
            # Parameter 9 - center_point
            # Parameter 10 - add_distance_and_bearing 

            if self.params[2].altered:
                # IMPORTANT: Clear Message on this parameters or validation will fail if 
                # field_to_letter is set to a new field name
                self.params[2].clearMessage()

                fieldName = self.params[2].valueAsText
                # Check for a valid field name
                if fieldName not in [None, "#", ""]:
                    validFieldName = arcpy.ValidateFieldName(fieldName)
                    isValidFieldName = validFieldName == fieldName
                    if not isValidFieldName:
                        self.params[2].setIDMessage("ERROR", 544, fieldName)

            if self.params[6].altered:
                starting_letter = self.params[6].valueAsText
                if starting_letter not in [None, "#", ""]:
                    starting_letter = starting_letter.strip().upper()
                    # Just do basic validation that it is a letter
                    if re.match('^[A-Z][A-Z]?$', starting_letter) is None:
                        self.params[6].setIDMessage("ERROR", 200826, starting_letter)

            if self.params[7].altered:
                omit_letters = self.params[7].valueAsText
                if omit_letters not in [None, "#", ""] and len(omit_letters) > 0:
                    omit_letters = omit_letters.strip().upper()
                    # Just do basic validation that it is a list of single letters
                    if re.match('^([A-Z])(;\s*[A-Z])*$', omit_letters) is None:
                        self.params[7].setIDMessage("ERROR", 200826, omit_letters)

            if self.params[6].altered or self.params[7].altered:
                # Ensure starting letter is not in omit letters 
                starting_letter = self.params[6].valueAsText
                omit_letters = self.params[7].valueAsText

                if starting_letter not in [None, "#", ""] and omit_letters not in [None, "#", ""]:
                    starting_letter = starting_letter.strip()[0].upper()
                    omit_letters = omit_letters.strip().upper()
                    if starting_letter in omit_letters:
                        self.params[7].setIDMessage("ERROR", 556, starting_letter)

            return

    def __init__(self):
        '''
        Letter Intersections constructor
        '''
        self.label = "Letter Intersections"
        self.description = "Add a sequential letters to intersection points of input line features, optionally within a selected area."
        self.category = "Gridded Reference Graphic\\Number and Letter"
        self.helpContext = 74030007 

    def isLicensed(self):
        """Check for Advanced license needed by Sort_management(Shape)"""
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.GetInstallInfo()['ProductName'] == 'Server':
                return True
            if arcpy.GetInstallInfo()['ProductName'] == 'ArcGISPro':
                if not (arcpy.CheckProduct("ArcInfo") in license_available):
                    raise Exception
        except Exception:
            return False
        return True

    def getParameterInfo(self):
        '''
        Define parameter definitions
        '''

        # Parameter 0 - in_features
        # Parameter 1 - out_feature_class
        # Parameter 2 - field_to_letter
        # Parameter 3 - input_area
        # Parameter 4 - spatial_sort_method
        # Parameter 5 - lettering_format
        # Parameter 6 - starting_letter
        # Parameter 7 - omit_letters
        # Parameter 8 - min_out_point_distance 
        # Parameter 9 - center_point
        # Parameter 10 - add_distance_and_bearing 

        # Parameter 0 - in_features
        input_features = arcpy.Parameter()
        input_features.name='in_features'
        input_features.displayName='Input Line Features'
        input_features.direction='Input'
        input_features.datatype = 'GPFeatureRecordSetLayer'
        input_features.parameterType='Required'
        input_features.enabled=True
        input_features.multiValue=False
        input_features.filter.list = ['POLYLINE', 'LINE']

        # Parameter 1 - out_features
        output_features = arcpy.Parameter()
        output_features.name = 'out_feature_class'
        output_features.displayName = 'Output Intersection Points Feature Class'
        output_features.direction = 'Output'
        output_features.datatype = 'DEFeatureClass'
        output_features.parameterType = 'Required'
        output_features.enabled = True

        # Parameter 2 - field_to_letter
        field_to_letter = arcpy.Parameter()
        field_to_letter.name = 'field_to_letter'
        field_to_letter.displayName = 'Field to Letter (New Field Name)'
        field_to_letter.direction = 'Input'
        field_to_letter.datatype = 'Field'
        field_to_letter.parameterType = 'Required'
        field_to_letter.enabled = True
        field_to_letter.multiValue=False
        field_to_letter.filter.list = ['Text']

        # Parameter 3 - in_area
        input_area = arcpy.Parameter()
        input_area.name = 'in_area'
        input_area.displayName = 'Input Area to Letter'
        input_area.direction = 'Input'
        input_area.datatype = 'GPFeatureRecordSetLayer'
        input_area.parameterType = 'Optional'
        input_area.enabled = True
        input_area.multiValue = False
        input_area.filter.list = ['POLYGON']

        # Parameter 4 - spatial_sort_method
        # See NumberFeatures Tool spatial_sort_method for more info
        spatial_sort_method = arcpy.Parameter()
        spatial_sort_method.name = 'spatial_sort_method'
        spatial_sort_method.displayName = 'Spatial Sort Method'
        spatial_sort_method.direction = 'Input'
        spatial_sort_method.datatype = 'GPString'
        spatial_sort_method.parameterType = 'Optional'
        spatial_sort_method.enabled = True
        spatial_sort_method.multiValue = False
        spatial_sort_method.filter.type = 'ValueList'
        spatial_sort_method.filter.list = defenseGRGUtilities.supportedSortMethods 
        spatial_sort_method.value = spatial_sort_method.filter.list[0]

        # Parameter 5 - Lettering Format ("A, B, C", "AA, AB, AC", "AA, BB, CC")
        lettering_format = arcpy.Parameter()
        lettering_format.name = 'lettering_format'
        lettering_format.displayName = 'Lettering Format'
        lettering_format.direction = 'Input'
        lettering_format.datatype = 'GPString'
        lettering_format.parameterType = 'Optional'
        lettering_format.enabled = True
        lettering_format.multiValue = False
        lettering_format.filter.type = 'ValueList'
        lettering_format.filter.list = defenseHelper.NumbersToLetters.SupportedLetteringFormats
        lettering_format.value = lettering_format.filter.list[0]

        # Parameter 6 - Starting Letter
        # starting_letter 
        starting_letter = arcpy.Parameter()
        starting_letter.name = 'starting_letter'
        starting_letter.displayName = 'Starting Letter'
        starting_letter.parameterType = 'Optional'
        starting_letter.direction = 'Input'
        starting_letter.datatype = 'GPString'
        starting_letter.value = 'A'
        starting_letter.enabled = True

        # Parameter 7 - Omit Letters
        # omit_letters
        omit_letters = arcpy.Parameter()
        omit_letters.name = 'omit_letters'
        omit_letters.displayName = 'Omit Letters'
        omit_letters.parameterType = 'Optional'
        omit_letters.direction = 'Input'
        omit_letters.datatype = 'GPString'
        omit_letters.multiValue = True
        omit_letters.enabled = True

        # Parameter 8 - Minimum Distance Between Output Points - min_out_point_distance
        min_out_point_distance = arcpy.Parameter()
        min_out_point_distance.name = 'min_out_point_distance'
        min_out_point_distance.displayName = 'Minimum Distance Between Output Points'
        min_out_point_distance.direction = 'Input'
        min_out_point_distance.datatype = 'GPLinearUnit'
        min_out_point_distance.parameterType = 'Optional'
        min_out_point_distance.value = '50 Meters'

        # Parameter 9 - center_point
        center_point = arcpy.Parameter()
        center_point.name = 'center_point'
        center_point.displayName = 'Center Point'
        center_point.direction = 'Input'
        center_point.datatype = 'GPFeatureRecordSetLayer'
        center_point.parameterType = 'Optional'
        center_point.enabled = False
        center_point.multiValue = False
        center_point.filter.list = ['POINT']

        # Parameter 10 - add_distance_and_bearing
        add_distance_and_bearing = arcpy.Parameter()
        add_distance_and_bearing.name = 'add_distance_and_bearing'
        add_distance_and_bearing.displayName = 'Add Distance and Bearing to Center'
        add_distance_and_bearing.parameterType = 'Optional'
        add_distance_and_bearing.direction = 'Input'
        add_distance_and_bearing.datatype = 'GPBoolean'
        add_distance_and_bearing.value = False
        add_distance_and_bearing.enabled = False
        add_distance_and_bearing.filter.list = addDistanceToCenterOptions

        return [input_features,         # 0
                output_features,        # 1
                field_to_letter,        # 2
                input_area,             # 3
                spatial_sort_method,    # 4
                lettering_format,       # 5
                starting_letter,        # 6    
                omit_letters,           # 7
                min_out_point_distance, # 8
                center_point,           # 9
                add_distance_and_bearing]  # 10

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

        input_features = parameters[0].valueAsText
        output_features = parameters[1].valueAsText
        field_to_number = parameters[2].valueAsText
        input_area = parameters[3].valueAsText
        spatial_sort_method = parameters[4].valueAsText
        lettering_format = parameters[5].valueAsText
        starting_letter = parameters[6].valueAsText
        omit_letters = parameters[7].valueAsText
        min_out_point_distance = parameters[8].valueAsText
        center_point = parameters[9].valueAsText
        add_distance_and_bearing = parameters[10].value

        inputFeatureCount = int(arcpy.GetCount_management(input_features).getOutput(0))
        if inputFeatureCount < minFeaturesExpected:
            arcpy.AddIDMessage("WARNING", 201003, str(inputFeatureCount)) # Number of input features less than expected:

        if spatial_sort_method is None:
            spatial_sort_method = 'UR'

        if lettering_format is None or \
            lettering_format not in defenseHelper.NumbersToLetters.SupportedLetteringFormats:
            lettering_format = defenseHelper.NumbersToLetters.SupportedLetteringFormats[0]

        if starting_letter in [None, '#', '', 'A']:
            if lettering_format == defenseHelper.NumbersToLetters.SupportedLetteringFormats[0]:
                starting_letter = 'A'
            else:
                starting_letter = 'AA'

        omitLettersList = []
        if omit_letters not in [None, '#', '']:
            try:
                defaultDelimiter = ';'
                omitlist = omit_letters.split(defaultDelimiter)
                # Strip whitespace and ensure uppercase
                omitLettersCheckList = [omitletter.strip().upper() for omitletter in omitlist]

                # TODO: decide if this should be in validation, just skip here for now
                for omitletter in omitLettersCheckList:
                    if omitletter is None or (len(omitletter) != 1) or \
                       not (ord(omitletter) in range(ord('A'), ord('Z'))):
                        arcpy.AddIDMessage("WARNING", 200826, str(omitletter)) # Not a valid ASCII letter, or could not convert letter(s) to value:
                    else:
                        omitLettersList.append(omitletter)
            except:
                arcpy.AddIDMessage("ERROR", 200826, str(omit_letters)) # Not a valid ASCII letter, or could not convert letter(s) to value:
                omitLettersList = []

        starting_number = -1
        increment_by = 1
        new_field_type = 'TEXT'

        ###########################################
        # Tool main processing

        deleteme = []

        try:

            # 1. Identify intersections
            baseIntersectionsName = 'Intersections_'
            intersectionsFC = arcpy.CreateUniqueName(baseIntersectionsName, arcpy.env.scratchGDB)

            if input_area is None and arcpy.env.extent is not None:
                input_area = arcpy.env.extent.polygon

            # In case this is a large road network, for performance, limit the roads selection to the Area of Interest
            if input_area is not None:
                arcpy.SelectLayerByLocation_management(input_features, 
                    "INTERSECT", input_area, "#", "NEW_SELECTION")

            arcpy.analysis.Intersect(input_features, intersectionsFC, "ALL", None, "POINT")

            # Verify that intersect produced output
            if not arcpy.Exists(intersectionsFC) or \
               int(arcpy.GetCount_management(intersectionsFC).getOutput(0)) < 1 :
                arcpy.AddIDMessage("ERROR", 201004, str(intersectionsFC))
                return None

            deleteme.append(intersectionsFC)
            desc = arcpy.Describe(intersectionsFC)
            isMultipoint = desc.shapeType == "Multipoint"
            if isMultipoint:
                # TRICKY: If a mulipoint output has been created by Intersect, convert it back to regular points
                intersectionsFCPoints = arcpy.CreateUniqueName(baseIntersectionsName, arcpy.env.scratchGDB)
                arcpy.management.FeatureVerticesToPoints(intersectionsFC, intersectionsFCPoints, "ALL")
                deleteme.append(intersectionsFCPoints)
                intersectionsFC = intersectionsFCPoints

            if input_area is None:
                selectionLayer = intersectionsFC
            else:
                selectionLayer = arcpy.SelectLayerByLocation_management(intersectionsFC, 
                    "INTERSECT", input_area, "#", "NEW_SELECTION")

            arcpy.CopyFeatures_management(selectionLayer, output_features)

            # Remove repeats within min_out_point_distance
            if min_out_point_distance not in [None, '#', '']:
                arcpy.DeleteIdentical_management(output_features, "Shape", min_out_point_distance, 0)

            # Verify that select by location produced some output
            if not arcpy.Exists(output_features) or \
               int(arcpy.GetCount_management(output_features).getOutput(0)) < 1 :
                arcpy.AddIDMessage("ERROR", 201004, str(output_features))
                return None

            defenseGRGUtilities.NumberFeatures(output_features,
                                        field_to_number,
                                        input_area,
                                        spatial_sort_method,
                                        starting_number,
                                        increment_by,
                                        new_field_type,
                                        center_point,
                                        add_distance_and_bearing,
                                        True,
                                        lettering_format,
                                        starting_letter,
                                        omitLettersList)

            if input_area is not None:
                arcpy.SelectLayerByAttribute_management(input_features, "CLEAR_SELECTION")

        except:
            tb = sys.exc_info()[2] # Get the traceback object
            defenseHelper.staceTrace(tb)
        finally:
            defenseHelper.removeDatasetList(deleteme)

        return output_features

class NumberFeaturesBySector(object):
    '''
    Number input features within a specified area.
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
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
    
            # Parameter 0 - in_features
            # Parameter 1 - sector_polygons
            # Parameter 2 - field_to_number
            # Parameter 3 - new_field_type
            # Parameter 4 - spatial_sort_method
            # Parameter 5 - increment_by
            # Parameter 6 - center_point
            # Parameter 7 - add_distance_and_bearing
            # Parameter 8 - out_feature_class  

            # See if this is an existing or new field
            if self.params[0].altered or self.params[2].altered:
                try:
                    # Only enable new_field_type if field_to_number does not exist in in_features
                    inputTable = self.params[0].valueAsText
                    upperFieldName = self.params[2].valueAsText.upper()
                    upperFieldNames = [f.name.upper() for f in arcpy.ListFields(inputTable)]
                    existingField = upperFieldName in upperFieldNames
                    self.params[3].enabled = not existingField
                except: 
                    pass

            if self.params[1].altered:
                try:
                    # Disable spatial_sort_method, increment_by if these fields exist in sector polygons
                    sectorInputTable = self.params[1].valueAsText
                    fieldNames = [f.name for f in arcpy.ListFields(sectorInputTable)]
                    schemaPresent = ("StartNumber" in fieldNames) and ("SortMethod" in fieldNames)
                    self.params[4].enabled = not schemaPresent
                    self.params[5].enabled = not schemaPresent
                    if schemaPresent:
                        # Enable center option if using schema for a feature class
                        self.params[6].enabled = True 
                        self.params[7].enabled = True

                except: 
                    pass

            if self.params[4].altered:
                isCenterOption = self.params[4].valueAsText in ['CENTER', 'COUNTERCLOCKWISE', 'CLOCKWISE']
                self.params[6].enabled = isCenterOption 
                self.params[7].enabled = isCenterOption
                if not isCenterOption:
                    # Reset these values in case previously set when Center option was enabled
                    self.params[6].value = None
                    self.params[7].value = False

            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
             parameter.  This method is called after internal validation."""

            # Parameter 0 - in_features
            # Parameter 1 - sector_polygons
            # Parameter 2 - field_to_number
            # Parameter 3 - new_field_type
            # Parameter 4 - spatial_sort_method
            # Parameter 5 - increment_by
            # Parameter 6 - center_point
            # Parameter 7 - add_distance_and_bearing
            # Parameter 8 - out_feature_class 

            if self.params[2].altered:
                # IMPORTANT: Clear Message on this parameters or validation will fail if 
                # field_to_number is set to a new field name
                # TODO: must also check that this is a valid field name and 
                # any other potential errors since we are clearing these messages
                self.params[2].clearMessage()

                fieldName = self.params[2].valueAsText
                # Check for a valid field name
                if fieldName not in [None, "#", ""]:
                    validFieldName = arcpy.ValidateFieldName(fieldName)
                    isValidFieldName = validFieldName == fieldName
                    if not isValidFieldName:
                        self.params[2].setIDMessage("ERROR", 544, fieldName)

            return

    def __init__(self):
        '''
        NumberFeaturesBySector constructor
        '''
        self.label = "Number Features By Sector"
        self.description = "Add a sequential number to input features, optionally within a selected area."
        self.category = "Gridded Reference Graphic\\Number and Letter"
        self.helpContext = 74030006

    def isLicensed(self):
        """Check for Advanced license needed by Sort_management(Shape)"""
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.GetInstallInfo()['ProductName'] == 'Server':
                return True
            if arcpy.GetInstallInfo()['ProductName'] == 'ArcGISPro':
                if not (arcpy.CheckProduct("ArcInfo") in license_available):
                    raise Exception
        except Exception:
            return False
        return True

    def getParameterInfo(self):
        '''
        Define parameter definitions
        '''

        # Parameter 0 - in_features
        # Parameter 1 - sector_polygons
        # Parameter 2 - field_to_number
        # Parameter 3 - new_field_type
        # Parameter 4 - spatial_sort_method
        # Parameter 5 - increment_by
        # Parameter 6 - center_point
        # Parameter 7 - add_distance_and_bearing
        # Parameter 8 - out_feature_class 

        # Parameter 0 - in_features
        input_features = arcpy.Parameter()
        input_features.name='in_features'
        input_features.displayName='Input Features'
        input_features.direction='Input'
        input_features.datatype = 'GPFeatureRecordSetLayer'
        input_features.parameterType='Required'
        input_features.enabled=True
        input_features.multiValue=False
        input_features.filter.list = ['POINT', 'POLYLINE', 'LINE', 'MULTIPOINT', 'POLYGON']

        # Parameter 1 - sector_polygons
        sector_polygons = arcpy.Parameter()
        sector_polygons.name='sector_polygons'
        sector_polygons.displayName='Sector Polygons'
        sector_polygons.direction='Input'
        sector_polygons.datatype = 'GPFeatureRecordSetLayer'
        sector_polygons.parameterType='Required'
        sector_polygons.enabled=True
        sector_polygons.multiValue=False
        sector_polygons.filter.list = ['POLYGON']

        # Parameter 2 - field_to_number
        field_to_number = arcpy.Parameter()
        field_to_number.name = 'field_to_number'
        field_to_number.displayName = 'Field to Number (Existing or New)'
        field_to_number.direction = 'Input'
        field_to_number.datatype = 'Field'
        field_to_number.parameterType = 'Required'
        field_to_number.enabled = True
        field_to_number.multiValue=False
        field_to_number.filter.list = ['Short', 'Long', 'Integer', 'Text']
        field_to_number.parameterDependencies = ['in_features']

        # Parameter 3 - new_field_type
        # Note: only enabled if a new field is selected in field_to_number
        # Field Type new_field_type {String}:
        # Note: uses a subset of the values from the AddField tool
        # The field type of the new field. This parameter is only used when the
        # field name does not exist in the input table.
        # TEXT-Any string of characters.
        # SHORT-Whole numbers between -32,768 and 32,767.
        # LONG-Whole numbers between -2,147,483,648 and 2,147,483,647.
        new_field_type = arcpy.Parameter()
        new_field_type.name = 'new_field_type'
        new_field_type.displayName = 'Field Type For New Field'
        new_field_type.direction = 'Input'
        new_field_type.datatype = 'GPString'
        new_field_type.parameterType = 'Optional'
        new_field_type.enabled = False
        new_field_type.multiValue = False
        new_field_type.filter.type = 'ValueList'
        new_field_type.filter.list = ['SHORT', 'LONG', 'TEXT'] 
        new_field_type.value = new_field_type.filter.list[1]

        # Parameter 4 - spatial_sort_method
        # See NumberFeatures Tool spatial_sort_method for more info
        spatial_sort_method = arcpy.Parameter()
        spatial_sort_method.name = 'spatial_sort_method'
        spatial_sort_method.displayName = 'Spatial Sort Method'
        spatial_sort_method.direction = 'Input'
        spatial_sort_method.datatype = 'GPString'
        spatial_sort_method.parameterType = 'Optional'
        spatial_sort_method.enabled = True
        spatial_sort_method.multiValue = False
        spatial_sort_method.filter.type = 'ValueList'
        spatial_sort_method.filter.list = defenseGRGUtilities.supportedSortMethods 
        spatial_sort_method.value = spatial_sort_method.filter.list[0]

        # Parameter 5 - increment_by
        increment_by = arcpy.Parameter()
        increment_by.name = 'increment_by'
        increment_by.displayName = 'Increment Sectors By'
        increment_by.parameterType = 'Optional'
        increment_by.direction = 'Input'
        increment_by.datatype = 'GPLong'
        increment_by.value = '1000'
        increment_by.enabled = True 

        # Parameter 6 - center_point
        center_point = arcpy.Parameter()
        center_point.name = 'center_point'
        center_point.displayName = 'Center Point'
        center_point.direction = 'Input'
        center_point.datatype = 'GPFeatureRecordSetLayer'
        center_point.parameterType = 'Optional'
        center_point.enabled = False
        center_point.multiValue = False
        center_point.filter.list = ['POINT']
        center_point.category='Center Options'

        # Parameter 7 - add_distance_and_bearing
        add_distance_and_bearing = arcpy.Parameter()
        add_distance_and_bearing.name = 'add_distance_and_bearing'
        add_distance_and_bearing.displayName = 'Add Distance and Bearing to Center'
        add_distance_and_bearing.parameterType = 'Optional'
        add_distance_and_bearing.direction = 'Input'
        add_distance_and_bearing.datatype = 'GPBoolean'
        add_distance_and_bearing.value = False
        add_distance_and_bearing.enabled = False
        add_distance_and_bearing.multiValue = False
        add_distance_and_bearing.filter.list = addDistanceToCenterOptions
        add_distance_and_bearing.category='Center Options'

        # Parameter 8 - out_feature_class
        output_features = arcpy.Parameter()
        output_features.name = 'out_feature_class'
        output_features.displayName = 'Output Feature Class'
        output_features.direction = 'Output'
        output_features.datatype = 'DEFeatureClass'
        output_features.parameterType = 'Derived'
        output_features.parameterDependencies = ['in_features']
        output_features.enabled = True

        return [input_features,        # 0
                sector_polygons,       # 1
                field_to_number,       # 2
                new_field_type,        # 3
                spatial_sort_method,   # 4
                increment_by,          # 5 
                center_point,          # 6
                add_distance_and_bearing,  # 7
                output_features]       # 8

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

        input_features = parameters[0].valueAsText
        sector_polygons = parameters[1].valueAsText
        field_to_number = parameters[2].valueAsText
        new_field_type = parameters[3].valueAsText
        spatial_sort_method = parameters[4].valueAsText
        sector_increment = parameters[5].value
        center_point = parameters[6].valueAsText
        add_distance_and_bearing = parameters[7].value

        if sector_increment < 10:
            sector_increment = 1000

        if new_field_type is None:
            new_field_type = 'SHORT'

        if arcpy.env.extent is not None:
            input_area = arcpy.env.extent.polygon
        else:
            input_area = None

        inputFeatureCount = int(arcpy.GetCount_management(input_features).getOutput(0))
        if inputFeatureCount < minFeaturesExpected:
            arcpy.AddIDMessage("WARNING", 201003, str(inputFeatureCount)) # Number of input features less than expected:

        defenseGRGUtilities.NumberBySector(input_features,
                                    sector_polygons,
                                    field_to_number,
                                    input_area,
                                    new_field_type,
                                    spatial_sort_method,
                                    sector_increment,
                                    center_point,
                                    add_distance_and_bearing)

        parameters[8].value = parameters[0].value # Derived from input

        return input_features

