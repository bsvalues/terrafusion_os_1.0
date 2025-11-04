'''
==================================================
Copyright 2016-2019 Esri
==================================================
defenseDistanceAndDirectionTools.py
--------------------------------------------------
requirements: ArcGIS Pro
author: ArcGIS Solutions
contact: support@esri.com
company: Esri
==================================================
description:
Distance and Direction Toolset Tools
==================================================
'''

import os

import arcpy

try:
    from . import defenseHelper
    from . import defenseDistanceAndDirectionUtilities
    from . import defenseVisibilityUtilities
except ImportError:
    import defenseHelper
    import defenseDistanceAndDirectionUtilities
    import defenseVisibilityUtilities

######################### Globals ####################################

supportedDistanceUnits = ['METERS', 'KILOMETERS', 'MILES', 'NAUTICAL_MILES', 'FEET', 'US_SURVEY_FEET']
defaultDistanceUnit = supportedDistanceUnits[0] # "METERS"

supportedAngleUnits = ["DEGREES", "MILS", "RADS", "GRADS"]
defaultAngleUnit = supportedAngleUnits[0]   # "DEGREES"

supportedRangeRingTypes = ['INTERVAL', 'MIN_MAX']

msgPositiveValueRequired = "Positive integer values are required."
msgUnsupportedOperation = "Unsupported Operation: "

# ----------------------------------------------------------------------------------
# GenerateRangeRings Tool
# ----------------------------------------------------------------------------------
class GenerateRangeRings(object):

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
    
            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
             parameter.  This method is called after internal validation."""

            if self.params[2].altered:
                if self.params[2].value == supportedRangeRingTypes[0]:
                    self.params[6].enabled = True
                    self.params[7].enabled = True
                    self.params[8].enabled = False
                    self.params[9].enabled = False
                    # Tricky, set required error messages if required parameters for this option are empty
                    if (self.params[6].value is None):
                        self.params[6].setIDMessage("ERROR", 530)
                    if (self.params[7].value is None):
                        self.params[7].setIDMessage("ERROR", 530)
                if self.params[2].value == supportedRangeRingTypes[1]:
                    self.params[6].enabled = False
                    self.params[7].enabled = False
                    self.params[8].enabled = True
                    self.params[9].enabled = True
                    # Tricky, set required error messages if required parameters for this option are empty
                    if (self.params[8].value is None):
                        self.params[8].setIDMessage("ERROR", 530)
                    if (self.params[9].value is None):
                        self.params[9].setIDMessage("ERROR", 530)

            for check_index in range(6, 9):
                if self.params[check_index].altered:
                    if self.params[check_index].value <= 0:
                        self.params[check_index].setWarningMessage(msgPositiveValueRequired)

            if self.params[3].altered:  # if out_feature_class_radials set, number_of_radials required
                if (self.params[4].value is None):
                    self.params[4].setIDMessage("ERROR", 530)
            if self.params[4].altered:  # if number_of_radials set,  out_feature_class_radials required
                if (self.params[3].value is None):
                    self.params[3].setIDMessage("ERROR", 530)

            return
        # end Class ToolValidator
    
    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Generate Range Rings'
        self.description = 'Creates a concentric circle from a center, with a number of rings, ' + \
            'and the distance between rings, or as a minimum range and a maximum range.'
        self.category = 'Distance and Direction'
        self.helpContext = 74010001
        self.canRunInBackground = False
        
    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_features'
        param_1.displayName = 'Input Features (Center Points)'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'        
        param_1.datatype = 'GPFeatureRecordSetLayer'
        param_1.filter.list = ['POINT']
        param_1.displayOrder = 0
       
        # out_feature_class_rings
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class_rings'
        param_2.displayName = 'Output Feature Class (Rings)'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                            "..", "Templates", "Layers", "MT_RangeRings.lyrx"))
        param_2.displayOrder = 8

        # range_rings_type
        param_3 = arcpy.Parameter()
        param_3.name = 'range_rings_type'
        param_3.displayName = 'Range Ring Type'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'GPString'
        param_3.value = supportedRangeRingTypes[0]
        param_3.filter.list = supportedRangeRingTypes
        param_3.displayOrder = 1

        # out_feature_class_radials
        param_4 = arcpy.Parameter()
        param_4.name = 'out_feature_class_radials'
        param_4.displayName = 'Output Feature Class (Radials)'
        param_4.parameterType = 'Optional'
        param_4.direction = 'Output'
        param_4.datatype = 'DEFeatureClass'
        param_4.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__), 
                                         "..", "Templates", "Layers", "MT_RangeRadials.lyrx"))
        param_4.enabled = True 
        param_4.displayOrder = 9

        # number_of_radials 
        param_5 = arcpy.Parameter()
        param_5.name = 'number_of_radials'
        param_5.displayName = 'Number of Radials'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'GPLong'
        param_5.value = ''
        param_5.enabled = True 
        param_5.displayOrder = 7

        # distance_units
        param_6 = arcpy.Parameter()
        param_6.name = 'distance_units'
        param_6.displayName = 'Distance Units'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = 'GPString'
        param_6.value = supportedDistanceUnits[0] # Meters
        param_6.filter.list = supportedDistanceUnits
        param_6.displayOrder = 2

        # in_number_of_rings
        param_7 = arcpy.Parameter()
        param_7.name = 'number_of_rings'
        param_7.displayName = 'Number of Rings'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input'
        param_7.datatype = 'GPLong'
        param_7.value = '4'
        param_7.enabled = True 
        param_7.displayOrder = 3

        # interval_between_rings
        param_8 = arcpy.Parameter()
        param_8.name = 'interval_between_rings'
        param_8.displayName = 'Interval Between Rings'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'GPDouble'
        param_8.value = '100'
        param_8.enabled = True 
        param_8.displayOrder = 4

        # minimum_range
        param_9 = arcpy.Parameter()
        param_9.name = 'minimum_range'
        param_9.displayName = 'Minimum Range'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = 'GPDouble'
        param_9.value = '200'
        param_9.enabled = False 
        param_9.displayOrder = 5

        # maximum_range
        param_10 = arcpy.Parameter()
        param_10.name = 'maximum_range'
        param_10.displayName = 'Maximum Range'
        param_10.parameterType = 'Optional'
        param_10.direction = 'Input'
        param_10.datatype = 'GPDouble'
        param_10.value = '1000'
        param_10.enabled = False 
        param_10.displayOrder = 6

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, \
            param_9, param_10]
        
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

        inputCenterFeatures = parameters[0].valueAsText
        outputRingFeatures = parameters[1].valueAsText
        inputRangeRingOperationType = parameters[2].value
        outputRadialFeatures = parameters[3].valueAsText
        inputNumberOfRadials = parameters[4].value
        inputDistanceUnits = parameters[5].value
        inputNumberOfRings = parameters[6].value
        inputDistanceBetween = parameters[7].value
        inputMinimumRange = parameters[8].value
        inputMaximumRange = parameters[9].value

        optionalSpatialReference = arcpy.env.outputCoordinateSystem

        if inputNumberOfRadials == "#" or inputNumberOfRadials == "" or inputNumberOfRadials is None :
            inputNumberOfRadials = 0
            outputRadialFeatures = None

        if outputRadialFeatures == "#" or outputRadialFeatures == "" or outputRadialFeatures is None:
            inputNumberOfRadials = 0
            outputRadialFeatures = None

        if inputDistanceUnits == "#" or inputDistanceUnits is None:
            inputDistanceUnits = supportedDistanceUnits[0]

        # Call tool method
        if inputRangeRingOperationType == supportedRangeRingTypes[0]:
            rr = defenseDistanceAndDirectionUtilities.rangeRingsFromInterval(inputCenterFeatures,
                                                       inputNumberOfRings,
                                                       inputDistanceBetween,
                                                       inputDistanceUnits,
                                                       inputNumberOfRadials,
                                                       outputRingFeatures,
                                                       outputRadialFeatures,
                                                       optionalSpatialReference)
        elif inputRangeRingOperationType == supportedRangeRingTypes[1]:
            rr = defenseDistanceAndDirectionUtilities.rangeRingsFromMinMax(inputCenterFeatures,
                                                     inputMinimumRange,
                                                     inputMaximumRange,
                                                     inputDistanceUnits,
                                                     inputNumberOfRadials,
                                                     outputRingFeatures,
                                                     outputRadialFeatures,
                                                     optionalSpatialReference)
        else:
            arcpy.AddIDMessage("ERROR", 200251, msgUnsupportedOperation, inputRangeRingOperationType)
            return None, None

        # Set output
        return rr[0], rr[1]

# ----------------------------------------------------------------------------------
# GenerateRangeRingsFromTable Tool
# ----------------------------------------------------------------------------------
class GenerateRangeRingsFromTable(object):
    
    class ToolValidator(object):
        """Class for validating a tool's parameter values and controlling
        the behavior of the tool's dialog."""
    
        def __init__(self, parameters):
            """Setup arcpy and the list of tool parameters."""
            self.params = parameters
    
        def initializeParameters(self):
            """Refine the properties of a tool's parameters.  This method is
            called when the tool is opened."""

            # Get list of type names from InputTable [1]
            inputTable = self.params[1].valueAsText
            lookupNamesField = self.params[8].valueAsText
            typeNames = self.updateTypes(inputTable, lookupNamesField)
            self.params[3].filter.list = typeNames
            if len(typeNames) > 1:
                self.params[3].value = typeNames[0]
   
            return
    
        def updateParameters(self):
            """Modify the values and properties of parameters before internal
            validation is performed.  This method is called whenever a parameter
            has been changed."""
    
            try :

                if self.params[1].altered or self.params[8].altered :
                    # Update list of type names from Input Table [1]
                    inputTable = self.params[1].valueAsText
                    lookupNamesField = self.params[8].valueAsText
                    typeNames = self.updateTypes(inputTable, lookupNamesField)
                    self.params[3].filter.list = typeNames
            except:
                pass

            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
             parameter.  This method is called after internal validation."""

            if self.params[4].value == supportedRangeRingTypes[0]: # INTERVAL
                self.params[9].enabled = False
                self.params[10].enabled = False
                # IMPORTANT: Clear Message on unused optional parameters or validation will fail
                self.params[9].clearMessage()
                self.params[10].clearMessage()
                self.params[11].enabled = True
                self.params[12].enabled = True
            elif self.params[4].value == supportedRangeRingTypes[1]: # MIN_MAX
                self.params[11].enabled = False
                self.params[12].enabled = False
                # IMPORTANT: Clear Message
                self.params[11].clearMessage()
                self.params[12].clearMessage()
                self.params[9].enabled = True
                self.params[10].enabled = True

            if self.params[6].altered:  # if number_of_radials set,  out_feature_class_radials required
                if (self.params[5].value is None):
                    self.params[5].setIDMessage("ERROR", 530)
            if self.params[5].altered:  # if out_feature_class_radials set, number_of_radials required
                if (self.params[6].value is None):
                    self.params[6].setIDMessage("ERROR", 530)

            return
    
        def updateTypes(self, inputTable, lookupNamesField):
            '''Update the list of available names in Input Table Name Field'''

            # Make a list of 'name' field from the input table
            names = []
            try:
                with arcpy.da.SearchCursor(inputTable, [lookupNamesField]) as tableRows:
                    for row in tableRows:
                        name = str(row[0])
                        names.append(name)
            except:
                msg = "ERROR LOADING INPUT TABLE. May need to set Names Field."
                names.append(msg)
            return names

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Generate Range Rings From Lookup Table'
        self.description =  'Creates a concentric circle from a center, with a number of rings, ' + \
            'and the distance between rings, or as a minimum range and a maximum range from a table.'
        self.category = 'Distance and Direction'
        self.helpContext = 74010002
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_features'
        param_1.displayName = 'Input Features (Center Points)'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureRecordSetLayer'
        param_1.filter.list = ['POINT']
        param_1.displayOrder = 0

        # in_table
        param_2 = arcpy.Parameter()
        param_2.name = 'in_table'
        param_2.displayName = 'Input Lookup Table'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = 'DETable'
        param_2.displayOrder = 1

        # out_feature_class_rings
        param_3 = arcpy.Parameter()
        param_3.name = 'out_feature_class_rings'
        param_3.displayName = 'Output Feature Class (Rings)'
        param_3.parameterType = 'Required'
        param_3.direction = 'Output'
        param_3.datatype = 'DEFeatureClass'
        param_3.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                            "..", "Templates", "Layers", "MT_RangeRings.lyrx"))
        param_3.displayOrder = 6

        # selected_type
        param_4 = arcpy.Parameter()
        param_4.name = 'lookup_name'
        param_4.displayName = 'Selected Name'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'GPString'
        # param_4.value = ''
        # param_4.filter.list = ['Name 1', 'Name 2'], this gets set on update
        param_4.displayOrder = 2

        # range_rings_type
        param_5 = arcpy.Parameter()
        param_5.name = 'range_rings_type'
        param_5.displayName = 'Range Ring Type'
        param_5.parameterType = 'Required'
        param_5.direction = 'Input'
        param_5.datatype = 'GPString'
        param_5.value = supportedRangeRingTypes[0]  # INTERVAL
        param_5.filter.list = supportedRangeRingTypes
        param_5.displayOrder = 3

        # out_feature_class_radials
        param_6 = arcpy.Parameter()
        param_6.name = 'out_feature_class_radials'
        param_6.displayName = 'Output Feature Class (Radials)'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Output'
        param_6.datatype = 'DEFeatureClass'
        param_6.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                            "..", "Templates", "Layers", "MT_RangeRadials.lyrx"))
        param_6.enabled = True 
        param_6.displayOrder = 7

        # number_of_radials 
        param_7 = arcpy.Parameter()
        param_7.name = 'number_of_radials'
        param_7.displayName = 'Number of Radials'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input'
        param_7.datatype = 'GPLong'
        param_7.value = ''
        param_7.enabled = True 
        param_7.displayOrder = 5

        # distance_units
        param_8 = arcpy.Parameter()
        param_8.name = 'distance_units'
        param_8.displayName = 'Distance Units'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'GPString'
        param_8.value = supportedDistanceUnits[0]
        param_8.filter.list = supportedDistanceUnits
        param_8.displayOrder = 4

        # lookup_name_field
        param_9 = arcpy.Parameter()
        param_9.name = 'lookup_name_field'
        param_9.displayName = 'Input Table Selected Name Field'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = 'Field'
        param_9.filter.list = ["Text"]
        param_9.value = 'Name'
        param_9.parameterDependencies = ['in_table']
        param_9.category = 'Input Table Options'
        param_9.displayOrder = 8

        # min_range_field
        param_10 = arcpy.Parameter()
        param_10.name = 'min_range_field'
        param_10.displayName = 'Input Table Minimum Range'
        param_10.parameterType = 'Optional'
        param_10.direction = 'Input'
        param_10.datatype = 'Field'
        param_10.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_10.value = 'Min'
        param_10.parameterDependencies = ['in_table']
        param_10.category = 'Input Table Options'
        param_10.enabled = False
        param_10.displayOrder = 9

        # max_range_field
        param_11 = arcpy.Parameter()
        param_11.name = 'max_range_field'
        param_11.displayName = 'Input Table Maximum Range'
        param_11.parameterType = 'Optional'
        param_11.direction = 'Input'
        param_11.datatype = 'Field'
        param_11.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_11.value = 'Max'
        param_11.parameterDependencies = ['in_table']
        param_11.category = 'Input Table Options'
        param_11.enabled = False
        param_11.displayOrder = 10

        # number_of_rings_field
        param_12 = arcpy.Parameter()
        param_12.name = 'number_of_rings_field'
        param_12.displayName = 'Number of Rings Field'
        param_12.parameterType = 'Optional'
        param_12.direction = 'Input'
        param_12.datatype = 'Field'
        param_12.filter.list = ["Long", "Short", "Integer"]
        param_12.value = 'Rings'
        param_12.parameterDependencies = ['in_table']
        param_12.category = 'Input Table Options'
        param_12.enabled = True
        param_12.displayOrder = 11

        # ring_interval_field
        param_13 = arcpy.Parameter()
        param_13.name = 'ring_interval_field'
        param_13.displayName = 'Ring Interval Field'
        param_13.parameterType = 'Optional'
        param_13.direction = 'Input'
        param_13.datatype = 'Field'
        param_13.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_13.value = 'Intervals'
        param_13.parameterDependencies = ['in_table']
        param_13.category = 'Input Table Options'
        param_13.enabled = True
        param_13.displayOrder = 12

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, \
            param_9, param_10, param_11, param_12, param_13]

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

        inputCenterFeatures = parameters[0].valueAsText
        inputTable = parameters[1].valueAsText
        outputRingFeatures = parameters[2].valueAsText
        inputSelectedLookupName = parameters[3].value
        inputRangeRingOperationType = parameters[4].value
        outputRadialFeatures = parameters[5].valueAsText
        inputNumberOfRadials = parameters[6].value
        inputDistanceUnits = parameters[7].value
        inputLookupNameField = parameters[8].valueAsText
        inputMinimumRangeField = parameters[9].valueAsText
        inputMaximumRangeField = parameters[10].valueAsText
        inputNumberOfRingsField = parameters[11].valueAsText
        inputDistanceBetweenField = parameters[12].valueAsText

        optionalSpatialReference = arcpy.env.outputCoordinateSystem

        if inputNumberOfRadials == "#" or inputNumberOfRadials == "" or inputNumberOfRadials is None :
            inputNumberOfRadials = 0
            outputRadialFeatures = None

        if outputRadialFeatures == "#" or outputRadialFeatures == "" or outputRadialFeatures is None:
            inputNumberOfRadials = 0
            outputRadialFeatures = None

        foundLookupValue = False
        if inputRangeRingOperationType == supportedRangeRingTypes[0]: # INTERVAL
            inputMinOrRingCountField = inputNumberOfRingsField
            inputMaxOrDistanceBetweenField = inputDistanceBetweenField
        else: 
            inputMinOrRingCountField = inputMinimumRangeField
            inputMaxOrDistanceBetweenField = inputMaximumRangeField

        foundLookupValue = False
        try: 
            cursorFields = [inputLookupNameField, inputMinOrRingCountField, inputMaxOrDistanceBetweenField]
            with arcpy.da.SearchCursor(inputTable, cursorFields) as cursor:
                for row in cursor:
                    if str(inputSelectedLookupName) == str(row[0]):
                        inputMinOrRingCount = row[1]
                        inputMaxOrDistanceBetween = row[2]
                        foundLookupValue = True
                        break
        except:
            pass # check handled below if not found

        # Abort if lookup values are not found
        if not foundLookupValue:
            raise Exception("Lookup value: " + inputSelectedLookupName + 
                            "  was not found in table: " + inputTable + " with columns: " + inputLookupNameField + 
                            ", " + inputMinOrRingCountField +  ", " + inputMaxOrDistanceBetweenField) #TODO convert to message

        # Call tool method
        if inputRangeRingOperationType == supportedRangeRingTypes[0]: #INTERVAL
            rr = defenseDistanceAndDirectionUtilities.rangeRingsFromInterval(inputCenterFeatures,
                                                       int(inputMinOrRingCount),         # inputNumberOfRings
                                                       float(inputMaxOrDistanceBetween), # inputDistanceBetween
                                                       inputDistanceUnits,
                                                       inputNumberOfRadials,
                                                       outputRingFeatures,
                                                       outputRadialFeatures,
                                                       optionalSpatialReference)
        elif inputRangeRingOperationType == supportedRangeRingTypes[1]:
            rr = defenseDistanceAndDirectionUtilities.rangeRingsFromMinMax(inputCenterFeatures,
                                                     inputMinOrRingCount,         # Min
                                                     inputMaxOrDistanceBetween,   # Max
                                                     inputDistanceUnits,
                                                     inputNumberOfRadials,
                                                     outputRingFeatures,
                                                     outputRadialFeatures,
                                                     optionalSpatialReference)
        else:
            arcpy.AddIDMessage("ERROR", 200251, msgUnsupportedOperation, inputRangeRingOperationType)
            return None, None

        # Set output
        return rr[0], rr[1]

class GenerateRangeFans(object):

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Generate Range Fans'
        self.description = 'Generates a range fan or sector with specified near and far distances and viewing angles.'
        self.category = 'Distance and Direction'
        self.helpContext = 74010003
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_observer_features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_features'
        param_1.displayName = 'Input Points'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureRecordSetLayer'
        param_1.filter.list = ['POINT']

        # out_range_fan_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_range_fan_feature_class'
        param_2.displayName = 'Output Range Fan Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_RangeFanOutput.lyrx"))

        # inner_radius
        param_3 = arcpy.Parameter()
        param_3.name = 'inner_radius'
        param_3.displayName = 'Minimum Distance'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'GPDouble'

        # outer_radius
        param_4 = arcpy.Parameter()
        param_4.name = 'outer_radius'
        param_4.displayName = 'Maximum Distance'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'GPDouble'

        # horizontal_start_angle
        param_5 = arcpy.Parameter()
        param_5.name = 'horizontal_start_angle'
        param_5.displayName = 'Horizontal Start Angle'
        param_5.parameterType = 'Required'
        param_5.direction = 'Input'
        param_5.datatype = 'GPDouble'

        # horizontal_end_angle
        param_6 = arcpy.Parameter()
        param_6.name = 'horizontal_end_angle'
        param_6.displayName = 'Horizontal End Angle'
        param_6.parameterType = 'Required'
        param_6.direction = 'Input'
        param_6.datatype = 'GPDouble'

        param_7 = arcpy.Parameter()
        param_7.name='distance_units'
        param_7.displayName='Distance Units'
        param_7.direction='Input'
        param_7.datatype='GPString'
        param_7.parameterType='Optional'
        param_7.enabled=True
        param_7.multiValue=False
        param_7.filter.type = 'ValueList'
        param_7.filter.list = supportedDistanceUnits
        param_7.value = defaultDistanceUnit
        param_7.category='Units Options'

        param_8 = arcpy.Parameter()
        param_8.name='angle_units'
        param_8.displayName='Angular Units'
        param_8.direction='Input'
        param_8.datatype='GPString'
        param_8.parameterType='Optional'
        param_8.enabled=True
        param_8.multiValue=False
        param_8.filter.type = 'ValueList'
        param_8.filter.list = supportedAngleUnits
        param_8.value = defaultAngleUnit
        param_8.category='Units Options'

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8]

    def isLicensed(self):
        '''Tool Method'''
        return True  # tool can be executed

    def updateParameters(self, parameters):
        '''Tool Method'''
        return

    def updateMessages(self, parameters):
        '''Tool Method'''
        return

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputObserverPoints = parameters[0].valueAsText
        rangeFanOutput      = parameters[1].valueAsText
        innerRadiusInput    = parameters[2].value
        outerRadiusInput    = parameters[3].value
        leftAzimuthInput    = parameters[4].value
        rightAzimuthInput   = parameters[5].value
        distanceUnit        = parameters[6].value
        angleUnit           = parameters[7].value

        if distanceUnit is None : 
            distanceUnit = defaultDistanceUnit

        if angleUnit is None :
            angleUnit = defaultAngleUnit

        innerRadiusInputMeters = defenseHelper.convertFromUnitNameToMeters(innerRadiusInput, distanceUnit)
        outerRadiusInputMeters = defenseHelper.convertFromUnitNameToMeters(outerRadiusInput, distanceUnit)  
        leftAzimuthInputDegrees = defenseHelper.convertFromUnitNameToDegrees(leftAzimuthInput, angleUnit)
        rightAzimuthInputDegrees = defenseHelper.convertFromUnitNameToDegrees(rightAzimuthInput, angleUnit)

        output = defenseVisibilityUtilities.createRangeFan(inputObserverPoints, rangeFanOutput, 
                                 innerRadiusInputMeters, outerRadiusInputMeters, 
                                 leftAzimuthInputDegrees, rightAzimuthInputDegrees)

        return output

# ----------------------------------------------------------------------------------
# GenerateRangeFansFromFeatures Tool
# ----------------------------------------------------------------------------------
class GenerateRangeFansFromFeatures(object):

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Generate Range Fans From Features'
        self.description =  'Generates a range fan or sector with specified near and far distances and viewing angles from feature fields.'
        self.category = 'Distance and Direction'
        self.helpContext = 74010004
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_features'
        param_1.displayName = 'Input Features'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureLayer'
        param_1.filter.list = ['POINT']

        # output_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'output_feature_class'
        param_2.displayName = 'Output Range Fan Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_RangeFanOutput.lyrx"))

        # inner_radius_field
        param_3 = arcpy.Parameter()
        param_3.name = 'inner_radius_field'
        param_3.displayName = 'Minimum Distance Field'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'Field'
        param_3.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_3.parameterDependencies = ['in_features']

        # outer_radius_field
        param_4 = arcpy.Parameter()
        param_4.name = 'outer_radius_field'
        param_4.displayName = 'Maximum Distance Field'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'Field'
        param_4.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_4.parameterDependencies = ['in_features']

        # start_angle_field
        param_5 = arcpy.Parameter()
        param_5.name = 'start_angle_field'
        param_5.displayName = 'Horizontal Start Angle Field'
        param_5.parameterType = 'Required'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_5.parameterDependencies = ['in_features']

        # end_angle_field
        param_6 = arcpy.Parameter()
        param_6.name = 'end_angle_field'
        param_6.displayName = 'Horizontal End Angle Field'
        param_6.parameterType = 'Required'
        param_6.direction = 'Input'
        param_6.datatype = 'Field'
        param_6.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_6.parameterDependencies = ['in_features']

        param_7 = arcpy.Parameter()
        param_7.name='distance_units'
        param_7.displayName='Distance Units'
        param_7.direction='Input'
        param_7.datatype='GPString'
        param_7.parameterType='Optional'
        param_7.enabled=True
        param_7.multiValue=False
        param_7.filter.type = 'ValueList'
        param_7.filter.list = supportedDistanceUnits
        param_7.value = defaultDistanceUnit
        param_7.category='Units Options'

        param_8 = arcpy.Parameter()
        param_8.name='angle_units'
        param_8.displayName='Angular Units'
        param_8.direction='Input'
        param_8.datatype='GPString'
        param_8.parameterType='Optional'
        param_8.enabled=True
        param_8.multiValue=False
        param_8.filter.type = 'ValueList'
        param_8.filter.list = supportedAngleUnits
        param_8.value = defaultAngleUnit
        param_8.category='Units Options'

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8]

    def isLicensed(self):
        '''Tool Method'''
        return True  # tool can be executed

    def updateParameters(self, parameters):
        '''Tool Method'''
        return

    def updateMessages(self, parameters):
        '''Tool Method'''
        return

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputFeatures       = parameters[0].valueAsText
        rangeFanOutput      = parameters[1].valueAsText
        innerRadiusField    = parameters[2].valueAsText
        outerRadiusField    = parameters[3].valueAsText
        leftAzimuthField    = parameters[4].valueAsText
        rightAzimuthField   = parameters[5].valueAsText
        distanceUnit        = parameters[6].valueAsText
        angleUnit           = parameters[7].valueAsText

        if distanceUnit is None : 
            distanceUnit = defaultDistanceUnit

        if angleUnit is None :
            angleUnit = defaultAngleUnit

        output = defenseVisibilityUtilities.createRangeFansFromFeatures(
                                    inputFeatures, rangeFanOutput, 
                                    innerRadiusField, outerRadiusField, 
                                    leftAzimuthField, rightAzimuthField,
                                    distanceUnit, angleUnit)

        return output

# ----------------------------------------------------------------------------------
# GenerateRangeRingsFromFeatures Tool
# ----------------------------------------------------------------------------------
class GenerateRangeRingsFromFeatures(object):

    lastRadialsFC = None
    lastRadialsField = None

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

            if self.params[3].altered or self.params[4].altered:
                # Tricky: if either RadialsFC or RadialsField has been cleared 
                # (now None, but previously set), then clear the other value
                if (self.params[3].value is None) and \
                     (GenerateRangeRingsFromFeatures.lastRadialsFC is not None):
                    self.params[4].value = ""
                elif (self.params[4].value is None) and \
                     (GenerateRangeRingsFromFeatures.lastRadialsField is not None):
                    self.params[3].value = ""
                # If the RadialsField has been set, then set the RadialsFC output name for convenience
                elif (self.params[3].value is None) and (self.params[4].value is not None):
                    self.params[3].value = arcpy.CreateUniqueName("Radials", arcpy.env.scratchWorkspace)
                # Tricky: store last values so we can see when these are cleared
                GenerateRangeRingsFromFeatures.lastRadialsFC = self.params[3].value
                GenerateRangeRingsFromFeatures.lastRadialsField = self.params[4].value

            return
    
        def updateMessages(self):
            """Modify the messages created by internal validation for each tool
             parameter.  This method is called after internal validation."""

            if self.params[2].value == supportedRangeRingTypes[0]: # INTERVAL
                self.params[5].enabled = False
                self.params[6].enabled = False
                # IMPORTANT: Clear Message on unused optional parameters or validation will fail
                self.params[5].clearMessage()
                self.params[6].clearMessage()
                self.params[7].enabled = True
                self.params[8].enabled = True
                # Tricky, set error messages if required parameters for this option are empty
                if (self.params[7].value is None):
                    self.params[7].setIDMessage("ERROR", 530)
                if (self.params[8].value is None):
                    self.params[8].setIDMessage("ERROR", 530)
            elif self.params[2].value == supportedRangeRingTypes[1]: # MIN_MAX
                self.params[7].enabled = False
                self.params[8].enabled = False
                # IMPORTANT: Clear Message
                self.params[7].clearMessage()
                self.params[8].clearMessage()
                self.params[5].enabled = True
                self.params[6].enabled = True
                # Tricky, set error messages if required parameters for this option are empty
                if (self.params[5].value is None):
                    self.params[5].setIDMessage("ERROR", 530)
                if (self.params[6].value is None):
                    self.params[6].setIDMessage("ERROR", 530)

            # if number_of_radials field set, then out_feature_class_radials required
            if (self.params[3].value is None) and (self.params[4].value is not None):
                self.params[3].setIDMessage("ERROR", 530)

            # if out_feature_class_radials set, then number_of_radials required
            if (self.params[4].value is None) and (self.params[3].value is not None):
                self.params[4].setIDMessage("ERROR", 530)

            return

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Generate Range Rings From Features'
        self.description =  'Generates range rings with specified parameters from feature fields.'
        self.category = 'Distance and Direction'
        self.helpContext = 74010005
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_features'
        param_1.displayName = 'Input Features'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureLayer'
        param_1.filter.list = ['POINT']

        # output_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'output_feature_class'
        param_2.displayName = 'Output Range Ring Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_RangeRings.lyrx"))

        # range_rings_type
        param_3 = arcpy.Parameter()
        param_3.name = 'range_rings_type'
        param_3.displayName = 'Range Ring Type'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'GPString'
        param_3.value = supportedRangeRingTypes[0]  # INTERVAL
        param_3.filter.list = supportedRangeRingTypes

        # out_feature_class_radials
        param_4 = arcpy.Parameter()
        param_4.name = 'out_feature_class_radials'
        param_4.displayName = 'Output Feature Class (Radials)'
        param_4.parameterType = 'Optional'
        param_4.direction = 'Output'
        param_4.datatype = 'DEFeatureClass'
        param_4.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                            "..", "Templates", "Layers", "MT_RangeRadials.lyrx"))
        param_4.enabled = True 

        # radial_count_field
        param_5 = arcpy.Parameter()
        param_5.name = 'radial_count_field'
        param_5.displayName = 'Radial Count Field'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'Field'
        param_5.filter.list = ["Long", "Short", "Integer"]
        param_5.parameterDependencies = ['in_features']

        # min_range_field
        param_6 = arcpy.Parameter()
        param_6.name = 'min_range_field'
        param_6.displayName = 'Minimum Range Field'
        param_6.parameterType = 'Optional'
        param_6.enabled = False
        param_6.direction = 'Input'
        param_6.datatype = 'Field'
        param_6.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_6.parameterDependencies = ['in_features']

        # max_range_field
        param_7 = arcpy.Parameter()
        param_7.name = 'max_range_field'
        param_7.displayName = 'Maximum Range Field'
        param_7.parameterType = 'Optional'
        param_7.enabled = False
        param_7.direction = 'Input'
        param_7.datatype = 'Field'
        param_7.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_7.parameterDependencies = ['in_features']

        # ring_count_field
        param_8 = arcpy.Parameter()
        param_8.name = 'ring_count_field'
        param_8.displayName = 'Ring Count Field'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'Field'
        param_8.filter.list = ["Long", "Short", "Integer"]
        param_8.parameterDependencies = ['in_features']

        # ring_interval_field
        param_9 = arcpy.Parameter()
        param_9.name = 'ring_interval_field'
        param_9.displayName = 'Ring Interval Field'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = 'Field'
        param_9.filter.list = ["Long", "Short", "Integer", "Double", "Float"]
        param_9.parameterDependencies = ['in_features']

        param_10 = arcpy.Parameter()
        param_10.name='distance_units'
        param_10.displayName='Distance Units'
        param_10.direction='Input'
        param_10.datatype='GPString'
        param_10.parameterType='Optional'
        param_10.enabled=True
        param_10.multiValue=False
        param_10.filter.type = 'ValueList'
        param_10.filter.list = supportedDistanceUnits
        param_10.value = defaultDistanceUnit
        # param_10.category='Units Options'

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, 
                param_9, param_10]

    def isLicensed(self):
        '''Tool Method'''

        # Tricky: this is the only method called once per tool open so put state initialization here
        GenerateRangeRingsFromFeatures.lastRadialsFC = None
        GenerateRangeRingsFromFeatures.lastRadialsField = None

        return True  # tool can be executed

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

        inputFeatures       = parameters[0].valueAsText
        outputRangeRings    = parameters[1].valueAsText
        inputRangeRingOperationType = parameters[2].value
        outputRadialFeatures        = parameters[3].valueAsText
        inputNumberOfRadialsField   = parameters[4].valueAsText
        inputMinimumRangeField      = parameters[5].valueAsText
        inputMaximumRangeField      = parameters[6].valueAsText
        inputNumberOfRingsField     = parameters[7].valueAsText
        inputDistanceBetweenField   = parameters[8].valueAsText
        distanceUnit                = parameters[9].valueAsText

        isMinMax = inputRangeRingOperationType == supportedRangeRingTypes[1]

        if distanceUnit is None : 
            distanceUnit = defaultDistanceUnit

        defenseDistanceAndDirectionUtilities.rangeRingsFromFeatures(
                                            inputFeatures,
                                            outputRangeRings,
                                            inputMinimumRangeField,
                                            inputMaximumRangeField,
                                            inputNumberOfRingsField,
                                            inputDistanceBetweenField,
                                            distanceUnit, 
                                            isMinMax)

        if not (outputRadialFeatures is None or inputNumberOfRadialsField is None):
            defenseDistanceAndDirectionUtilities.rangeRadialsFromFeatures(
                                                inputFeatures,
                                                outputRadialFeatures,
                                                inputNumberOfRadialsField,
                                                inputMinimumRangeField,
                                                inputMaximumRangeField,
                                                inputNumberOfRingsField,
                                                inputDistanceBetweenField,
                                                distanceUnit, 
                                                isMinMax)

        return outputRangeRings, outputRadialFeatures

