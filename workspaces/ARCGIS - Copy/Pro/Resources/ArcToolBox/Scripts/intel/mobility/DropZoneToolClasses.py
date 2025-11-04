# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
DropZoneToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2018-07-20 - phill - inital commits
* 2018-07-23 - phill - updates
* 2018-07-24 - phill - remove obstacles
* 2019-05-09 - mfunk - rename and conda packaging move
* 2019-08-14 - mfunk - Paramter/tool fixes for Pro integration
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2020-01-13 - mfunk - module rename for 'intel'
* 2020-01-22 - jjones - moved base class to Drop Zones class
* 2020-04-16 - jjones - updated default output feature name for classes
* 2020-08-10 - mfunk - refactor tool and add type hinting
------------------------------------------------------------------------------
'''

import arcpy
import sys
import traceback

from intel.mobility.DropZoneSuitability import FindDropZones
from intel.enumerations import TOOL_CATEGORY_ANALYSIS_SUITABILITY


class DropZones(object):

    def __init__(self):

        self.label = "Drop Zone Suitability"
        self.description = "Find areas suitable for drop zones"
        self.category = TOOL_CATEGORY_ANALYSIS_SUITABILITY
        self.helpContext = 73030001

    def getParameterInfo(self):
        '''
        define parameter definitions
        '''

        in_slope_raster = arcpy.Parameter(name='in_slope_raster',
                                          direction='Input',
                                          displayName='Input Percent Slope Raster',
                                          datatype='GPRasterLayer',
                                          parameterType='Required')

        in_vegetation_features = arcpy.Parameter(name='in_vegetation_features',
                                                 displayName='Input Combined Vegetation Features',
                                                 direction='Input',
                                                 datatype='GPFeatureLayer',
                                                 parameterType='Required')

        clip_features = arcpy.Parameter(name='clip_features',
                                        displayName='Clip Features',
                                        direction='Input',
                                        datatype='GPFeatureRecordSetLayer',
                                        parameterType='Required')
        clip_features.filter.list = ["POLYGON"]

        out_feature_class = arcpy.Parameter(name='out_feature_class',
                                            displayName='Output Feature Class',
                                            direction='Output',
                                            datatype='DEFeatureClass',
                                            parameterType='Required')

        return[in_slope_raster,
               in_vegetation_features,
               clip_features,
               out_feature_class]

    def isLicensed(self):
        '''
        Requires a Spatial Analyst license
        '''
        license_available = ["Available", "AlreadyInitialized"]
        if arcpy.CheckExtension("Spatial") in license_available:
            return True
        else:
            return False  # No Spatial license available

    def updateParameters(self, parameters):
        '''
        Update parameter options during validation
        '''
        if parameters[0].value and not parameters[0].hasBeenValidated:
            parameters[3].value == 'Drop_Zones'

        return

    def execute(self, parameters, messages):
        dz = FindDropZones(parameters[0].valueAsText,
                           parameters[1].valueAsText,
                           parameters[2].valueAsText,
                           parameters[3].valueAsText)

        arcpy.SetParameter(3, dz.find_drop_zones())
        return
