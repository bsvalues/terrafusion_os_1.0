# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
intelPointsToTrackSegmentsToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 3/26/2017 - phill - original writeup
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2019-10-14 - mfunk - fix import references for performance
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-01-22 - jjones - refactored base class into Points to Tracks class
* 2022-02-08 - mfunk - Issues 2822 and 2902, add error_on_duplicate_timestamps
                       and keep_input_fields.
------------------------------------------------------------------------------
'''

import arcpy

from intel.movement.PointsToTrackSegments import PointsToTrackSegmentsLogic
from intel.enumerations import TOOL_CATEGORY_CONVERSION


class PointsToTrackSegments:
    '''
    '''

    def __init__(self):
        '''
        Tool constructor
        '''

        self.label = "Points To Track Segments"
        self.description = "Creates track segment lines from points."
        self.category = TOOL_CATEGORY_CONVERSION
        self.helpContext = 73040002

        self._include_velocity_options = ["INCLUDE_VELOCITY",
                                          "EXCLUDE_VELOCITY"]
        self._handle_timestamps_options = ["ERROR_DUPLICATE_TIMESTAMPS",
                                           "ALLOW_DUPLICATE_TIMESTAMPS"]
        self._keep_input_fields_options = ["KEEP_INPUT_FIELDS",
                                           "DISCARD_INPUT_FIELDS"]

    def getParameterInfo(self):
        '''
        define parameters
        '''
        input_features = arcpy.Parameter(name='in_features',
                                         displayName='Input Features',
                                         direction='Input',
                                         datatype='GPFeatureLayer',
                                         parameterType='Required')
        input_features.filter.list = ["Point"]

        input_datefield = arcpy.Parameter(name='date_field',
                                          displayName='Date Field',
                                          direction='Input',
                                          datatype='Field',
                                          parameterType='Required')
        input_datefield.parameterDependencies = [input_features.name]
        input_datefield.filter.list = ["Date"]

        output_features = arcpy.Parameter(name='out_feature_class',
                                          displayName='Output Feature Class',
                                          direction='Output',
                                          datatype='DEFeatureClass',
                                          parameterType='Required')
        output_features.value = 'out_tracks'

        input_trackId = arcpy.Parameter(name='group_field',
                                        displayName='Group Field',
                                        direction='Input',
                                        datatype='Field',
                                        parameterType='Optional')
        input_trackId.parameterDependencies = [input_features.name]
        input_trackId.filter.list = ['String', 'Integer', 'Short']

        include_velocity = arcpy.Parameter(name='include_velocity',
                                           displayName='Include Velocity Fields',
                                           direction='Input',
                                           datatype='GPBoolean',
                                           parameterType='Optional')
        include_velocity.filter.type = 'ValueList'
        include_velocity.filter.list = self._include_velocity_options
        include_velocity.value = True

        out_point_features = arcpy.Parameter(name='out_point_feature_class',
                                             displayName='Output Sequence Points',
                                             direction='Output',
                                             datatype='DEFeatureClass',
                                             parameterType='Optional')

        error_on_duplicate_timestamps = arcpy.Parameter(name='error_on_duplicate_timestamps',
                                                        displayName='Error On Duplicate Timestamps',
                                                        direction='Input',
                                                        datatype='GPBoolean',
                                                        parameterType='Optional')
        error_on_duplicate_timestamps.filter.type = "ValueList"
        error_on_duplicate_timestamps.filter.list = self._handle_timestamps_options
        error_on_duplicate_timestamps.value = True

        keep_input_fields = arcpy.Parameter(name="keep_input_fields",
                                            displayName="Keep Input Fields",
                                            direction="Input",
                                            datatype="GPBoolean",
                                            parameterType="Optional")
        keep_input_fields.filter.type = "ValueList"
        keep_input_fields.filter.list = self._keep_input_fields_options
        keep_input_fields.value = False
        keep_input_fields.enabled = False  # disabled until user sets out_point_features

        return[input_features,
               input_datefield,
               output_features,
               input_trackId,
               include_velocity,
               out_point_features,
               error_on_duplicate_timestamps,
               keep_input_fields,
               ]

    def isLicensed(self):
        '''
        Returns True, there is no licensing requirements beyond a basic ArcGIS license.
        '''
        try:
            return True
        except Exception:
            return False

    def updateParameters(self, parameters):
        # enable keep_input_fields(7) if out_point_features(5) is set
        if parameters[5].altered:
            if parameters[5].value is not None:
                parameters[7].enabled = True
            else:
                parameters[7].enabled = False
        else:
            parameters[7].enabled = False

    def updateMessages(self, parameters):
        # Tell user if input_features has Unknown spatial reference
        if parameters[0].altered and parameters[0].hasBeenValidated:
            if parameters[0].value is not None:
                if arcpy.Exists(parameters[0].value):
                    sr: arcpy.SpatialReference = arcpy.Describe(parameters[0].valueAsText).spatialReference
                    if sr.type == 'Unknown':
                        message: str = arcpy.GetIDMessage(190199)
                        parameters[0].setErrorMessage(message)

    def execute(self, parameters, messages):

        # Handle parameter keywords
        param4 = parameters[4].valueAsText
        include_velocity: bool = False
        if param4 == 'true' or param4 == self._include_velocity_options[0]:
            include_velocity = True

        param6 = parameters[6].valueAsText
        error_on_duplicates: bool = False
        if param6 == 'true' or param6 == self._handle_timestamps_options[0]:
            error_on_duplicates = True

        param7 = parameters[7].valueAsText
        keep_fields: bool = False
        if param7 == 'true' or param7 == self._keep_input_fields_options[0]:
            keep_fields = True

        tl = PointsToTrackSegmentsLogic(parameters[0].valueAsText,
                                        parameters[1].valueAsText,
                                        parameters[2].valueAsText,
                                        parameters[3].valueAsText,
                                        include_velocity,
                                        parameters[5].valueAsText,
                                        error_on_duplicates,
                                        keep_fields,
                                        )
        point_track_results = tl.generate()
        if point_track_results is not None:
            arcpy.SetParameter(2, point_track_results[0])
            if point_track_results[1] is not None:
                arcpy.SetParameter(5, point_track_results[1])

        del tl
