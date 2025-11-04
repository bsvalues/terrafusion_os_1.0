# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
FindOverlapsToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2019-09-27 - mfunk - fix output tool parameter options
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-01-28 - jjones - refactored module to take advantage of new count Overlapping Features GP tool
* 2020-04-16 - jjones - updated default output feature name for classes
* 2020-08-31 - mfunk - update output feature names based on input features
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
------------------------------------------------------------------------------
'''

import os
import arcpy
from intel.analysis.FindOverlapsLogic import Find_Overlaps
from intel.enumerations import TOOL_CATEGORY_ANALYSIS
from intel.utilities import ParameterValidation

class FindOverlaps(ParameterValidation):

    def __init__(self):
        self.label = "Find Overlaps"
        self.description = "Find overlapping areas in polygon feature class"
        self.category = TOOL_CATEGORY_ANALYSIS
        self.helpContext = 73010001

    def getParameterInfo(self):
        '''
        define parameter definitions
        '''
        input_features = arcpy.Parameter(name='in_features',
                                         displayName='Input Features',
                                         direction='Input',
                                         datatype='GPFeatureLayer',
                                         parameterType='Required')
        input_features.filter.list = ['POLYGON']

        output_intersection = arcpy.Parameter(name='out_intersection',
                                              displayName='Output Intersections',
                                              direction='Output',
                                              datatype='DEFeatureClass',
                                              parameterType='Required')
        output_intersection.filter.list = ['POLYGON']

        output_centroid = arcpy.Parameter(name='out_centroid',
                                          displayName='Output Centroids',
                                          direction='Output',
                                          datatype='DEFeatureClass',
                                          parameterType='Required')
        output_centroid.filter.list = ['POINT']

        groupfield = arcpy.Parameter(name='group_field',
                                     displayName='Group Field',
                                     direction='Input',
                                     datatype='Field',
                                     parameterType='Optional')
        groupfield.parameterDependencies = [input_features.name]
        groupfield.filter.list = ['Short', 'Long', 'Text']

        return [input_features,
                output_intersection,
                output_centroid,
                groupfield
                ]

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        # Set the output featureclass names with the base of input features
        if parameters[0].value and not parameters[0].hasBeenValidated:
            if not parameters[1].altered and not parameters[2].altered:

                input_path: str
                # Get the input features "path"
                input_path = parameters[0].valueAsText

                # Extract the feature class basename and workspace
                input_workspace, input_name = os.path.split(input_path)

                # what if input is a shapefile?
                if input_name[-4:] == ".shp":
                    # strip ".shp" from the name
                    input_name = input_name[:-4]

                # create output names names
                overlap_name = self.validate_output_name(os.path.join(input_workspace, f'{input_name}_overlaps'))
                centroid_name = self.validate_output_name(os.path.join(input_workspace,f'{input_name}_centroids'))

                # set the output featureclass name parameters
                parameters[1].value = overlap_name
                parameters[2].value = centroid_name

        return

    def updateMessages(self, parameters):
        return

    def isLicensed(self):
        '''
        Check for License
        '''
        try:
            return True
        except Exception:
            return False

    def execute(self, parameters, messages):
        fo = Find_Overlaps(parameters[0].valueAsText,
                           parameters[1].valueAsText,
                           parameters[2].valueAsText,
                           parameters[3].valueAsText)

        intersections, centroids = fo.generate_overlaps()
        arcpy.SetParameter(1, intersections)
        arcpy.SetParameter(2, centroids)
