# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
lHLZToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2019-08-14 - mfunk - original writeup
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2019-12-19 - mfunk - update licensing for tools.
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-04-16 - jjones - updated default output feature name for classes
* 2020-09-11 - mfunk - fix output history - issue 2033
* 2021-08-17 - mfunk - add logger and error handling
------------------------------------------------------------------------------
'''

import arcpy
import traceback
import sys

from intel.mobility.HLZSuitability import HLZSuitability, DOFToFeatures, ObstacleFeatures
from intel.enumerations import TOOL_CATEGORY_ANALYSIS_SUITABILITY
from intel.utilities import DEBUG, \
                            Logger
from intel.utilities.ErrorHandlers import general_error_logger

class HLZToolBase(object):
    """HLZToolBase HLZ base class for commong properties and methods

    HLZ base class for commong properties and methods

    """
    _error_features_no_sr = arcpy.GetIDMessage(190106)
    _warn_features_field_text = arcpy.GetIDMessage(190107)

    def __init__(self):
        self._logger = Logger()
        self._logger.create_logger(self.__class__.__name__)
        if DEBUG:
            self._logger.debug(f"DEBUG is {DEBUG}")

    def isLicensed(self):
        '''
        Requires Spatial Analyst and 3D Analyst
        '''
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.CheckExtension("Spatial") in license_available and arcpy.CheckExtension("3D") in license_available:
                return True
            else:
                return False  # No Spatial or 3D license available
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}'.format(tbinfo, str(sys.exc_info()[1]), arcpy.GetMessages(2))
            arcpy.AddError(pymsg)
            return False


class DOFToObstacleFeatures(HLZToolBase):

    def __init__(self):
        '''
        DOF tool class constructor
        '''
        self.label = "DOF To Obstacle Features"
        self.description = "Convert US Federal Aviation Administration (FAA) Digital Obstacle File (DOF) to obstruction points and obstruction area features."
        self.category = TOOL_CATEGORY_ANALYSIS_SUITABILITY
        self.helpContext = 73030003

    def __del__(self):
        '''
        DOF tool class destructor
        '''
        pass

    def getParameterInfo(self):
        '''
        DOF tool class parameter definitions
        '''
        # 0
        in_table = arcpy.Parameter(name='in_table',
                                   displayName='Input Table',
                                   direction='Input',
                                   datatype='GPTableView',
                                   parameterType='Required')
        # 1
        out_obstacle_features = arcpy.Parameter(name='out_obstacle_features',
                                                displayName='Output Obstacle Features',
                                                direction='Output',
                                                datatype='DEFeatureClass',
                                                parameterType='Required')
        # 2
        out_obstacle_buffers = arcpy.Parameter(name='out_obstacle_buffers',
                                               displayName='Output Obstacle Buffers',
                                               direction='Output',
                                               datatype='DEFeatureClass',
                                               parameterType='Required')
        # 3
        clip_features = arcpy.Parameter(name='clip_features',
                                        displayName='Clip Features',
                                        direction='Input',
                                        datatype='GPFeatureLayer',
                                        parameterType='Optional')
        clip_features.filter.list = ['POLYGON']

        return [in_table,
                out_obstacle_features,
                out_obstacle_buffers,
                clip_features,
                ]

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if parameters[0].value and not parameters[0].hasBeenValidated:
            parameters[1].value == 'DOF_Obstacles'
            parameters[2].value == 'DOF_Buffers'

        return

    @general_error_logger
    def execute(self, parameters, messages):
        '''
        DOF tool class execution
        calls HLZSuitability.py
        '''
        hlz_dof_obstacles = DOFToFeatures(parameters[0].valueAsText,
                                            parameters[1].valueAsText,
                                            parameters[2].valueAsText,
                                            parameters[3].valueAsText,
                                            )
        hlz_dof_results = hlz_dof_obstacles.calculate()
        arcpy.SetParameter(1, hlz_dof_results[0])
        arcpy.SetParameter(2, hlz_dof_results[1])

        del hlz_dof_obstacles
        return


class GenerateObstacleFeatures(HLZToolBase):

    def __init__(self):
        '''
        Generate Obstacles Features tool class constructor
        '''
        self.label = "Generate Obstacle Features"
        self.description = "Convert features with a height field into to obstruction points and obstruction area features."
        self.category = TOOL_CATEGORY_ANALYSIS_SUITABILITY
        self.helpContext = 73030004

    def __del__(self):
        '''
        Generate Obstacle Features  tool class destructor
        '''
        pass

    def getParameterInfo(self):
        '''
        Features tool class parameter definitions
        '''
        # 0
        in_features = arcpy.Parameter(name='in_features',
                                      displayName='Input Features',
                                      direction='Input',
                                      datatype='GPFeatureLayer',
                                      parameterType='Required')
        # 1
        height_field = arcpy.Parameter(name='height_field',
                                       displayName='Height Field',
                                       direction='Input',
                                       datatype='Field',
                                       parameterType='Required')
        height_field.parameterDependencies = [in_features.name]
        height_field.filter.list = ['Short', 'Long', 'Integer', 'Double', 'Text']
        # 2
        out_obstacle_features = arcpy.Parameter(name='out_obstacle_features',
                                                displayName='Output Obstacle Features',
                                                direction='Output',
                                                datatype='DEFeatureClass',
                                                parameterType='Required')

        # 3
        out_obstacle_buffers = arcpy.Parameter(name='out_obstacle_buffers',
                                               displayName='Output Obstacle Buffers',
                                               direction='Output',
                                               datatype='DEFeatureClass',
                                               parameterType='Required')
        # 4
        clip_features = arcpy.Parameter(name='clip_features',
                                        displayName='Clip Features',
                                        direction='Input',
                                        datatype='GPFeatureLayer',
                                        parameterType='Optional')
        clip_features.filter.list = ['POLYGON']

        return [in_features,
                height_field,
                out_obstacle_features,
                out_obstacle_buffers,
                clip_features,
                ]

    def updateMessages(self, parameters):

        # 0: Error if in_features have an Unknown SR
        if parameters[0].altered:
            if arcpy.Describe(parameters[0].valueAsText).spatialReference.name == "Unknown":
                parameters[0].setErrorMessage(self._error_features_no_sr.format(parameters[0].valueAsText))

        # 1: Warn users if text field selected:
        if parameters[1].altered:
            field_name = parameters[1].valueAsText
            fields = [field for field in arcpy.ListFields(parameters[0].valueAsText) if field.name == field_name]
            select_field = fields[0]
            field_type = select_field.type
            if field_type == "String" or field_type == "Text":
                parameters[1].setWarningMessage(self._warn_features_field_text)

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if parameters[0].value and not parameters[0].hasBeenValidated:
            parameters[2].value == 'Obstacle_Features'
            parameters[3].value == 'Obstacle_Buffers'

        return

    @general_error_logger
    def execute(self, parameters, messages):
        '''
        Generate Obstacle Features tool class execution
        calls HLZSuitability.py
        '''
        hlz_feature_obstacles = ObstacleFeatures(parameters[0].valueAsText,
                                                    parameters[1].valueAsText,
                                                    parameters[2].valueAsText,
                                                    parameters[3].valueAsText,
                                                    parameters[4].valueAsText,
                                                )
        obstacle_results = hlz_feature_obstacles.calculate()
        arcpy.SetParameter(2, obstacle_results[0])
        arcpy.SetParameter(3, obstacle_results[1])

        del hlz_feature_obstacles
        return


class GenerateHLZSuitability(HLZToolBase):

    def __init__(self):
        '''
       Generate HLZ Suitability tool class constructor
        '''
        self.label = "Generate HLZ Suitability"
        self.description = "Uses the reclassified land cover, reclassified slope, and obstacle buffers to generate a Helicopter Landing Zone (HLZ) suitability raster."
        self.category = TOOL_CATEGORY_ANALYSIS_SUITABILITY
        self.helpContext = 73030005

    def __del__(self):
        '''
        Generate HLZ Suitability tool class tool class destructor
        '''
        pass

    def getParameterInfo(self):
        '''
        Generate HLZ Suitabiilty From Reclassified Inputs tool class parameter definitions
        '''
        # 0
        in_slope_raster = arcpy.Parameter(name='in_slope_raster',
                                          displayName='Input Slope Raster',
                                          direction='Input',
                                          datatype='GPRasterLayer',
                                          parameterType='Required')
        # 1
        in_land_cover_raster = arcpy.Parameter(name='in_land_cover_raster',
                                               displayName='Input Land Cover Raster',
                                               direction='Input',
                                               datatype='GPRasterLayer',
                                               parameterType='Required')
        # 2
        in_obstacle_buffer_features = arcpy.Parameter(name='in_obstacle_buffer_features',
                                                      displayName='Input Obstacle Buffer Features',
                                                      direction='Input',
                                                      datatype='GPFeatureLayer',
                                                      parameterType='Required')
        in_obstacle_buffer_features.filter.list = ["POLYGON"]
        # 3
        out_raster = arcpy.Parameter(name='out_raster',
                                     displayName='Output Raster',
                                     direction='Output',
                                     datatype='DERasterDataset',
                                     parameterType='Required')

        return [in_slope_raster,
                in_land_cover_raster,
                in_obstacle_buffer_features,
                out_raster,
                ]

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        return

    @general_error_logger
    def execute(self, parameters, messages):
        '''
        Generate HLZ Suitability From Reclassified Inputs tool class execution
        calls HLZSuitability.py
        '''
        hlz_suitability = HLZSuitability(parameters[0].valueAsText,
                                            parameters[1].valueAsText,
                                            parameters[2].valueAsText,
                                            parameters[3].valueAsText)
        arcpy.SetParameter(3, hlz_suitability.calculate())

        del hlz_suitability
        return
