'''
 ==================================================
 defenseVisibilityTools.py
 --------------------------------------------------
 requirements: ArcGIS Pro
 author: ArcGIS Solutions
 contact: support@esri.com
 company: Esri
 ==================================================
 description:
 Visibility Tool logic module.
 ==================================================
'''

import os
import sys

import arcpy

try:
    from . import defenseVisibilityUtilities
except ImportError:
    import defenseVisibilityUtilities

supportedHighLowTypes = ['HIGHEST', 'LOWEST']
defaultHighLowType = supportedHighLowTypes[0]

supportedPeakOrValleyTypes = ['PEAKS', 'VALLEYS']
defaultPeakOrValleyType = supportedPeakOrValleyTypes[0]

class FindHighestLowestPoint(object):

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Find Highest Or Lowest Point'
        self.description = 'Finds the highest or lowest point (or points if several have the same elevation) of the input surface within a defined area.'
        self.category = "Visibility"
        self.helpContext = 74040001
        self.canRunInBackground = False

    def isLicensed(self):
        """Allow the tool to execute, only if the ArcGIS Spatial Analyst extension is available."""
        try:
            if arcpy.CheckExtension("Spatial") != "Available":
                raise Exception
        except Exception:
            return False
        return True

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_surface
        param_1 = arcpy.Parameter()
        param_1.name = 'in_surface'
        param_1.displayName = 'Input Surface'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = ["GPRasterLayer", "DEMosaicDataset", "GPMosaicLayer"]
        param_1.displayOrder = 0

        # out_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class'
        param_2.displayName = 'Output Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        output_layer_file_path = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_Highest_Point_Output.lyrx"))
        param_2.symbology = output_layer_file_path
        param_2.displayOrder = 1

        # high_low_operation_type
        param_3 = arcpy.Parameter()
        param_3.name = 'high_low_operation_type'
        param_3.displayName = 'Highest or Lowest Point'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'GPString'
        param_3.value = defaultHighLowType
        param_3.filter.list = supportedHighLowTypes
        param_3.displayOrder = 2

        # in_feature
        param_4 = arcpy.Parameter()
        param_4.name = 'in_feature'
        param_4.displayName = 'Input Area'
        param_4.parameterType = 'Optional'
        param_4.direction = 'Input'
        param_4.datatype = 'GPFeatureRecordSetLayer'
        param_4.multiValue=False
        param_4.filter.list = ['POLYGON']
        param_4.displayOrder = 3

        return [param_1, param_2, param_3, param_4]

    def updateParameters(self, parameters):
        '''Tool Method'''

        surface = parameters[0].value
        if surface is None:
            # if the surface param is not set, set it to the first raster layer found in the current map
            rasterLayer = defenseVisibilityUtilities.FindFirstRasterLayer()
            if rasterLayer is not None:
                parameters[0].value = rasterLayer

    def updateMessages(self, parameters):
        '''Tool Method'''
        return

    def execute(self, parameters, messages):
        '''Tool Execution'''

        input_surface = parameters[0].valueAsText
        output_point_features = parameters[1].valueAsText
        highOrLowOperation = parameters[2].valueAsText
        input_area = parameters[3].valueAsText

        if highOrLowOperation == supportedHighLowTypes[0]:
            hi_low_Switch = 'MAXIMUM'
        else:
            hi_low_Switch = 'MINIMUM'

        output = defenseVisibilityUtilities.hi_lowPointByArea(
                      input_area,
                      input_surface,
                      hi_low_Switch,
                      output_point_features)

        return output

class FindLocalPeaksValleys(object):

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Find Local Peaks Or Valleys'
        self.description = 'Finds the highest local maximums or minimums within the defined area. Peaks are found by inverting the surface and then finding the sinks in the surface. These points are then used to extract elevation values from the original surface, sorted based on elevation.'
        self.category = "Visibility"
        self.helpContext = 74040002
        self.canRunInBackground = False

    def isLicensed(self):
        """Allow the tool to execute, only if the ArcGIS Spatial Analyst extension is available."""
        try:
            if arcpy.CheckExtension("Spatial") != "Available":
                raise Exception
        except Exception:
            return False  # tool cannot be executed

        # Allow the tool to execute, only if the ArcGIS Advanced is available.
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.GetInstallInfo()['ProductName'] == 'Server':
                return True
            if arcpy.GetInstallInfo()['ProductName'] == 'ArcGISPro':
                if not (arcpy.CheckProduct("ArcInfo") in license_available):
                    raise Exception
        except Exception:
            return False  # tool cannot be executed

        return True  # tool can be executed

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_surface
        param_1 = arcpy.Parameter()
        param_1.name = 'in_surface'
        param_1.displayName = 'Input Surface'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = ["GPRasterLayer", "DEMosaicDataset", "GPMosaicLayer"]
        param_1.displayOrder = 0

        # out_feature_class
        param_2 = arcpy.Parameter()
        param_2.name = 'out_feature_class'
        param_2.displayName = 'Output Feature Class'
        param_2.parameterType = 'Required'
        param_2.direction = 'Output'
        param_2.datatype = 'DEFeatureClass'
        param_2.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_Highest_Point_Output.lyrx"))
        param_2.displayOrder = 1

        param_3 = arcpy.Parameter()
        param_3.name = 'peak_valley_op_type'
        param_3.displayName = 'Peaks or Valleys'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = 'GPString'
        param_3.value = defaultPeakOrValleyType
        param_3.filter.list = supportedPeakOrValleyTypes
        param_3.displayOrder = 2

        # num_peaks
        param_4 = arcpy.Parameter()
        param_4.name = 'num_peaks_valleys'
        param_4.displayName = 'Number of Peaks or Valleys'
        param_4.parameterType = 'Required'
        param_4.direction = 'Input'
        param_4.datatype = 'GPLong'
        param_4.value = '10'
        param_4.displayOrder = 3

        # in_feature
        param_5 = arcpy.Parameter()
        param_5.name = 'in_feature'
        param_5.displayName = 'Input Area'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'GPFeatureRecordSetLayer'
        param_5.multiValue=False
        param_5.filter.list = ['POLYGON']
        param_1.displayOrder = 4

        return [param_1, param_2, param_3, param_4, param_5]

    def updateParameters(self, parameters):
        '''Tool Method'''
        surface = parameters[0].value
        if surface is None:
            # if the surface param is not set, set it to the first raster layer found in the current map
            rasterLayer = defenseVisibilityUtilities.FindFirstRasterLayer()
            if rasterLayer is not None:
                parameters[0].value = rasterLayer

        return

    def updateMessages(self, parameters):
        '''Tool Method'''

        numberOfPeaks = parameters[3].value

        if  numberOfPeaks < 1 or numberOfPeaks > 100:
            parameters[3].setErrorMessage("Number Of Peaks must be between 1 and 100")
        return

    def execute(self, parameters, messages):
        '''Tool Execution'''

        input_surface = parameters[0].valueAsText
        output_peak_features = parameters[1].valueAsText
        peaks_or_valleys = parameters[2].valueAsText
        number_of_peaks_or_valleys = parameters[3].valueAsText
        input_area = parameters[4].valueAsText

        if peaks_or_valleys == supportedPeakOrValleyTypes[0]:
            hi_low_switch = 'MAXIMUM'
        else:
            hi_low_switch = 'MINIMUM'

        out_findLocalPeaksValleys = defenseVisibilityUtilities.findLocalPeaksOrValleys(input_area,
                                                                number_of_peaks_or_valleys,
                                                                input_surface,
                                                                output_peak_features,
                                                                hi_low_switch)

        return out_findLocalPeaksValleys

class LinearLineOfSight(object):

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Linear Line Of Sight'
        self.description = 'Creates line(s) of sight between observers and targets.'
        self.canRunInBackground = False
        self.category = "Visibility"
        self.helpContext = 74040003

    def isLicensed(self):
        """Allow the tool to execute, only if ArcGIS Advanced and ArcGIS 3D Analyst extension is available."""
        try:
            if arcpy.CheckExtension("3D") != "Available":
                raise Exception
        except Exception:
            return False  # tool cannot be executed

        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.GetInstallInfo()['ProductName'] == 'Server':
                return True
            if arcpy.GetInstallInfo()['ProductName'] == 'ArcGISPro':
                if not (arcpy.CheckProduct("ArcInfo") in license_available):
                    raise Exception
        except Exception:
            return False

        return True  # tool can be executed

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_observer_features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_observer_features'
        param_1.displayName = 'Observers'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureRecordSetLayer'
        param_1.filter.list = ['POINT']
        param_1.displayOrder = 0

        # in_target_features
        param_2 = arcpy.Parameter()
        param_2.name = 'in_target_features'
        param_2.displayName = 'Targets'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = 'GPFeatureRecordSetLayer'
        param_2.filter.list = ['POINT']
        param_2.displayOrder = 1

        # in_surface
        param_3 = arcpy.Parameter()
        param_3.name = 'in_surface'
        param_3.displayName = 'Input Elevation Surface'
        param_3.parameterType = 'Required'
        param_3.direction = 'Input'
        param_3.datatype = ["GPRasterLayer", "DEMosaicDataset", "GPMosaicLayer"]
        param_3.displayOrder = 2

        # out_los_feature_class
        param_4 = arcpy.Parameter()
        param_4.name = 'out_los_feature_class'
        param_4.displayName = 'Output Line Of Sight Feature Class'
        param_4.parameterType = 'Required'
        param_4.direction = 'Output'
        param_4.datatype = 'DEFeatureClass'
        param_4.displayOrder = 3
        param_4.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_LLOS_OutputLLOS.lyrx"))

        # out_sight_line_feature_class
        param_5 = arcpy.Parameter()
        param_5.name = 'out_sight_line_feature_class'
        param_5.displayName = 'Output Sight Line Feature Class'
        param_5.parameterType = 'Required'
        param_5.direction = 'Output'
        param_5.datatype = 'DEFeatureClass'
        param_5.displayOrder = 4
        param_5.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_LLOS_OutputSightLines.lyrx"))

        # out_observer_feature_class
        param_6 = arcpy.Parameter()
        param_6.name = 'out_observer_feature_class'
        param_6.displayName = 'Output Observer Feature Class'
        param_6.parameterType = 'Required'
        param_6.direction = 'Output'
        param_6.datatype = 'DEFeatureClass'
        param_6.displayOrder = 5
        param_6.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_LLOS_Output_Observers.lyrx"))

        # out_target_feature_class
        param_7 = arcpy.Parameter()
        param_7.name = 'out_target_feature_class'
        param_7.displayName = 'Output Target Feature Class'
        param_7.parameterType = 'Required'
        param_7.direction = 'Output'
        param_7.datatype = 'DEFeatureClass'
        param_7.displayOrder = 6
        param_7.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_LLOS_Output_Targets.lyrx"))

        # in_obstruction_features
        param_8 = arcpy.Parameter()
        param_8.name = 'in_obstruction_features'
        param_8.displayName = 'Input Obstruction Features'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'GPFeatureLayer'
        param_8.category='Visibility Options'
        param_8.displayOrder = 9

        # observer_height_above_surface
        param_9 = arcpy.Parameter()
        param_9.name = 'observer_height_above_surface'
        param_9.displayName = 'Observer Height Above Surface (meters)'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = 'GPDouble'
        param_9.value = 2
        param_9.category='Visibility Options'
        param_9.displayOrder = 7

        # target_height_above_surface
        param_10 = arcpy.Parameter()
        param_10.name = 'target_height_above_surface'
        param_10.displayName = 'Target Height Above Surface (meters)'
        param_10.parameterType = 'Optional'
        param_10.direction = 'Input'
        param_10.datatype = 'GPDouble'
        param_10.value = 0
        param_10.category='Visibility Options'
        param_10.displayOrder = 8

        # add_profile_attachment
        param_11 = arcpy.Parameter()
        param_11.name = 'add_profile_attachment'
        param_11.displayName = 'Add Profile Graph Attachment To Sight Line'
        param_11.parameterType = 'Optional'
        param_11.direction = 'Input'
        param_11.datatype = 'GPBoolean'
        param_11.value = False
        param_11.filter.list = ['ADD_PROFILE_GRAPH','NO_PROFILE_GRAPH']
        param_11.category='Visibility Options'
        param_11.displayOrder = 10

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, 
                param_9, param_10, param_11]

    def updateParameters(self, parameters):
        '''Tool Method'''
        surfaceName = parameters[2].valueAsText
        if surfaceName is None:
            # if the surface param is not set, set it to the first raster layer found in the current map
            surfaceName = defenseVisibilityUtilities.FindFirstRasterLayer()
            if surfaceName is not None:
                parameters[2].value = surfaceName

        # Set outputs from Suface (if not already set)
        if surfaceName is not None:
            if parameters[3].value is None: 
                parameters[3].value = arcpy.ValidateTableName(surfaceName + '_LineOfSight', arcpy.env.scratchWorkspace)
            if parameters[4].value is None: 
                parameters[4].value = arcpy.ValidateTableName(surfaceName + '_SightLines', arcpy.env.scratchWorkspace)
            if parameters[5].value is None: 
                parameters[5].value = arcpy.ValidateTableName(surfaceName + '_Observers', arcpy.env.scratchWorkspace)
            if parameters[6].value is None: 
                parameters[6].value = arcpy.ValidateTableName(surfaceName + '_Targets', arcpy.env.scratchWorkspace)

    def updateMessages(self, parameters):
        '''Tool Method'''
        return

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputObserverFeatures = parameters[0].valueAsText # Observers
        inputTargetFeatures = parameters[1].valueAsText   # Targets
        inputSurface = parameters[2].valueAsText          # Input Elevation Surface
        outputLineOfSight = parameters[3].valueAsText     # Output Line Of Sight Features
        outputSightLines = parameters[4].valueAsText      # Output Sight Lines
        outputObservers = parameters[5].valueAsText       # Output Observers
        outputTargets = parameters[6].valueAsText         # Output Targets
        inputObstructionFeatures = parameters[7].valueAsText # Input Obstruction Features - optional
        inputObserverHeight = parameters[8].value         # Observer Height Above Surface - optional
        inputTargetHeight = parameters[9].value           # Target Height Above Surface - optional
        addProfileGraphToSurfaceLine = parameters[10].value # Add Profile Graph Attachment

        llos = defenseVisibilityUtilities.linearLineOfSight(inputObserverFeatures,
                                                inputObserverHeight,
                                                inputTargetFeatures,
                                                inputTargetHeight,
                                                inputSurface,
                                                outputLineOfSight,
                                                outputSightLines,
                                                outputObservers,
                                                outputTargets,
                                                inputObstructionFeatures,
                                                addProfileGraphToSurfaceLine)
        if (llos is None) or (len(llos) < 4):
            return None

        # Set output
        return llos[0], llos[1], llos[2], llos[3]

class RadialLineOfSight(object):

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Radial Line Of Sight'
        self.description = 'Shows the areas visible (green) and not visible (red) to an observer at a specified distance and viewing angle.'
        self.canRunInBackground = False
        self.category = "Visibility"
        self.helpContext = 74040004

    def isLicensed(self):
        """Allow the tool to execute, only if the ArcGIS 3D Analyst extension is available."""
        try:
            if arcpy.CheckExtension("3D") != "Available":
                raise Exception
        except Exception:
            return False  # tool cannot be executed
        return True  # tool can be executed

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_observer_features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_observer_features'
        param_1.displayName = 'Input Observer Features'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureRecordSetLayer'
        param_1.filter.list = ['POINT']
        param_1.displayOrder = 0

        # in_surface
        param_2 = arcpy.Parameter()
        param_2.name = 'in_surface'
        param_2.displayName = 'Input Surface'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = ["GPRasterLayer", "DEMosaicDataset", "GPMosaicLayer"]
        param_2.displayOrder = 3

        # out_feature_class
        param_3 = arcpy.Parameter()
        param_3.name = 'out_feature_class'
        param_3.displayName = 'Output Visibility'
        param_3.parameterType = 'Required'
        param_3.direction = 'Output'
        param_3.datatype = 'DEFeatureClass'
        param_3.displayOrder = 4
        param_3.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_Radial_Line_Of_Sight_Output.lyrx"))

        # radius
        param_4 = arcpy.Parameter()
        param_4.name = 'radius'
        param_4.displayName = 'Radius Of Observer (meters)'
        param_4.parameterType = 'Optional'
        param_4.direction = 'Input'
        param_4.datatype = 'GPDouble'
        param_4.value = '1000'
        param_4.category='Visibility Options'
        param_4.displayOrder = 2

        # observer_height_above_surface
        param_5 = arcpy.Parameter()
        param_5.name = 'observer_height_above_surface'
        param_5.displayName = 'Observer Height Above Surface (meters)'
        param_5.parameterType = 'Optional'
        param_5.direction = 'Input'
        param_5.datatype = 'GPDouble'
        param_5.value = '2'
        param_5.category='Visibility Options'
        param_5.displayOrder = 1

        return [param_1, param_2, param_3, param_4, param_5]

    def updateParameters(self, parameters):
        '''Tool Method'''
        surfaceName = parameters[1].valueAsText
        if surfaceName is None:
            # if the surface param is not set, set it to the first raster layer found in the current map
            surfaceName = defenseVisibilityUtilities.FindFirstRasterLayer()
            if surfaceName is not None:
                parameters[1].value = surfaceName

    def updateMessages(self, parameters):
        '''Tool Method'''
        return

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputObserverFeatures = parameters[0].valueAsText # Input Observer Features
        inputSurface = parameters[1].valueAsText # Input Surface
        outputVisibility = parameters[2].valueAsText # Output Visibility
        inputRadiusOfObserver = parameters[3].value # Radius Of Observer
        inputObserverHeight = parameters[4].value # Observer Height Above Surface

        inputSpatialReference = arcpy.env.outputCoordinateSystem

        if inputSpatialReference is None:
            inputSpatialReference = arcpy.SpatialReference(54032) # World Azimuthal Equidistant

        outputVisibilityOut = defenseVisibilityUtilities.radialLineOfSight(inputObserverFeatures,
                                              inputObserverHeight,
                                              inputRadiusOfObserver,
                                              inputSurface,
                                              outputVisibility,
                                              inputSpatialReference)

        # Set output
        return outputVisibilityOut

class RadialLineOfSightAndRange(object):

    def __init__(self):
        '''Tool Constructor'''

        self.label = 'Radial Line Of Sight And Range'
        self.description = 'Shows visible areas to one or more observers. Shows the areas visible (green) and not visible (red) to an observer at a specified distance and viewing angle.'
        self.category = "Visibility"
        self.helpContext = 74040005
        self.canRunInBackground = False

    def getParameterInfo(self):
        '''Tool Parameters'''

        # in_observer_features
        param_1 = arcpy.Parameter()
        param_1.name = 'in_observer_features'
        param_1.displayName = 'Input Observer'
        param_1.parameterType = 'Required'
        param_1.direction = 'Input'
        param_1.datatype = 'GPFeatureRecordSetLayer'
        param_1.displayOrder = 0
        param_1.filter.list = ['POINT']

        # in_surface
        param_2 = arcpy.Parameter()
        param_2.name = 'in_surface'
        param_2.displayName = 'Input Surface'
        param_2.parameterType = 'Required'
        param_2.direction = 'Input'
        param_2.datatype = ["GPRasterLayer", "DEMosaicDataset", "GPMosaicLayer"]
        param_2.displayOrder = 1

        # out_viewshed_feature_class
        param_3 = arcpy.Parameter()
        param_3.name = 'out_viewshed_feature_class'
        param_3.displayName = 'Output Viewshed Feature Class'
        param_3.parameterType = 'Required'
        param_3.direction = 'Output'
        param_3.datatype = 'DEFeatureClass'
        param_3.displayOrder = 2
        param_3.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_Radial_Line_Of_Sight_Output.lyrx"))

        # out_fov_feature_class
        param_4 = arcpy.Parameter()
        param_4.name = 'out_fov_feature_class'
        param_4.displayName = 'Output Field of View Outline Feature Class'
        param_4.parameterType = 'Required'
        param_4.direction = 'Output'
        param_4.datatype = 'DEFeatureClass'
        param_4.displayOrder = 3
        param_4.symbology = os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_RLOSSectorOutline.lyr"))

        # out_range_radius_feature_class
        param_5 = arcpy.Parameter()
        param_5.name = 'out_range_radius_feature_class'
        param_5.displayName = 'Output Range Outline Feature Class'
        param_5.parameterType = 'Required'
        param_5.direction = 'Output'
        param_5.datatype = 'DEFeatureClass'
        param_5.displayOrder = 4
        param_5.symbology =os.path.normpath(os.path.join(os.path.dirname(__file__),
                                "..", "Templates", "Layers", "MT_RLOSRadiusOutline.lyr"))

        # observer_offset
        param_6 = arcpy.Parameter()
        param_6.name = 'observer_height_offset'
        param_6.displayName = 'Observer Height Offset (meters)'
        param_6.parameterType = 'Optional'
        param_6.direction = 'Input'
        param_6.datatype = 'GPDouble'
        param_6.value = 2
        param_6.category='Visibility Options'
        param_6.displayOrder = 9

        # inner_radius
        param_7 = arcpy.Parameter()
        param_7.name = 'inner_radius'
        param_7.displayName = 'Minimum Distance (meters)'
        param_7.parameterType = 'Optional'
        param_7.direction = 'Input'
        param_7.datatype = 'GPDouble'
        param_7.value = 1000
        param_7.category='Visibility Options'
        param_7.displayOrder = 5

        # outer_radius
        param_8 = arcpy.Parameter()
        param_8.name = 'outer_radius'
        param_8.displayName = 'Maximum Distance (meters)'
        param_8.parameterType = 'Optional'
        param_8.direction = 'Input'
        param_8.datatype = 'GPDouble'
        param_8.value = 3000
        param_8.category='Visibility Options'
        param_8.displayOrder = 6

        # horizontal_start_angle
        param_9 = arcpy.Parameter()
        param_9.name = 'horizontal_start_angle'
        param_9.displayName = 'Horizontal Start Angle (degrees)'
        param_9.parameterType = 'Optional'
        param_9.direction = 'Input'
        param_9.datatype = 'GPDouble'
        param_9.value = 0
        param_9.category='Visibility Options'
        param_9.displayOrder = 7

        # horizontal_end_angle
        param_10 = arcpy.Parameter()
        param_10.name = 'horizontal_end_angle'
        param_10.displayName = 'Horizontal End Angle (degrees)'
        param_10.parameterType = 'Optional'
        param_10.direction = 'Input'
        param_10.datatype = 'GPDouble'
        param_10.value = 360
        param_10.category='Visibility Options'
        param_10.displayOrder = 8

        return [param_1, param_2, param_3, param_4, param_5, param_6, param_7, param_8, param_9, param_10]

    def isLicensed(self):
        """Allow the tool to execute, only if the ArcGIS 3D Analyst extension is available."""
        try:
            if arcpy.CheckExtension("3D") != "Available":
                raise Exception
        except Exception:
            return False  # tool cannot be executed
        return True  # tool can be executed

    def updateParameters(self, parameters):
        '''Tool Method'''
        surfaceName = parameters[1].valueAsText
        if surfaceName is None:
            # if the surface param is not set, set it to the first raster layer found in the current map
            surfaceName = defenseVisibilityUtilities.FindFirstRasterLayer()
            if surfaceName is not None:
                parameters[1].value = surfaceName

        # Set outputs from Suface (if not already set)
        if surfaceName is not None:         
            if parameters[2].value is None: 
                parameters[2].value = arcpy.ValidateTableName(surfaceName + '_Viewshed', arcpy.env.scratchWorkspace)
            if parameters[3].value is None: 
                parameters[3].value = arcpy.ValidateTableName(surfaceName + '_FieldOfView', arcpy.env.scratchWorkspace)
            if parameters[4].value is None: 
                parameters[4].value = arcpy.ValidateTableName(surfaceName + '_Range', arcpy.env.scratchWorkspace)

    def updateMessages(self, parameters):
        '''Tool Method'''
        return

    def execute(self, parameters, messages):
        '''Tool Execution'''

        inputObserverPoints = parameters[0].valueAsText
        elevationRaster     = parameters[1].valueAsText
        viewshed    = parameters[2].valueAsText
        sectorWedge = parameters[3].valueAsText
        fullWedge   = parameters[4].valueAsText
        observerOffsetInput = parameters[5].valueAsText
        innerRadiusInput    = parameters[6].valueAsText
        outerRadiusInput    = parameters[7].valueAsText
        leftAzimuthInput    = parameters[8].valueAsText
        rightAzimuthInput   = parameters[9].valueAsText

        defenseVisibilityUtilities.createViewshed(inputObserverPoints, elevationRaster, \
            outerRadiusInput, leftAzimuthInput, rightAzimuthInput, observerOffsetInput, \
            innerRadiusInput, viewshed, sectorWedge, fullWedge)

        return viewshed, sectorWedge, fullWedge
