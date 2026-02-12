# coding: utf-8
'''
------------------------------------------------------------------------------
GenerateBlindSpotAreasToolClass
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2018-12-18 - phill - original writeup
* 2018-12-19 - phill - remove map extent & unused methods
* 2019-01-09 - phill - fix union, support for true curves
* 2019-08-30 - mfunk - Updates for inclusion in Pro 2.5
* 2019-09-12 - mfunk - update execption handling
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-04-16 - jjones - updated default output feature name for classes
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
* 2021-01-25 - mfunk - updates to run on Server
* 2021-04-01 - mfunk - fixes for 2621 and 2632
------------------------------------------------------------------------------
'''

import arcpy
import sys
import traceback

from intel.analysis.GenerateBlindSpot import BlindSpotAreas
from intel.enumerations import TOOL_CATEGORY_ANALYIS_BLINDSPOT


class BlindSpotBaseClass(object):

    @staticmethod
    def isLicensed():
        """ Check for Standard or Advanced """

        try:
            valid_product = ["ArcGISPro", "Server", "ArcGISAllSource"]
            valid_license = ["Standard", "Advanced"]

            install_info: dict = arcpy.GetInstallInfo()
            product: str = install_info['ProductName']
            product_license: str = install_info['LicenseLevel']

            if product in valid_product:
                if product_license in valid_license:
                    return True
                else:
                    return False  # when not Standard or Advanced
            else:
                return False  # when not running on Pro or Server

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)
            return False


class GenerateBlindSpotAreas(BlindSpotBaseClass):

    def __init__(self):
        self.label = "Generate Blind Spot Areas"
        self.decription = "Generate Blind Spot Areas creates an output non-visible area, or blind spots, for input Intelligence, Surveillance, Reconnaissance (ISR) or patrol 'visible' buffer features based on start and end times. "
        self.category = TOOL_CATEGORY_ANALYIS_BLINDSPOT
        self.helpContext = 73020001

    def getParameterInfo(self):
        '''
        define parameters
        '''
        # 0
        in_features = arcpy.Parameter(name='in_features',
                                      displayName='Input Features',
                                      direction='Input',
                                      datatype='GPFeatureLayer',
                                      parameterType='Required')
        in_features.filter.list = ['POLYGON']

        # 1
        out_feature_class = arcpy.Parameter(name='out_feature_class',
                                            displayName='Output Features',
                                            direction='Output',
                                            datatype='DEFeatureClass',
                                            parameterType='Required')

        # 2
        clip_features = arcpy.Parameter(name='clip_features',
                                        displayName='Clip Features',
                                        direction='Input',
                                        datatype='GPFeatureRecordSetLayer',
                                        parameterType='Optional')
        clip_features.filter.list = ['POLYGON']
        # 3
        start_time_field = arcpy.Parameter(name='start_time_field',
                                           displayName='Start Time Field',
                                           direction='Input',
                                           datatype='Field',
                                           parameterType='Optional')
        start_time_field.parameterDependencies = [in_features.name]
        start_time_field.filter.list = ['Date']
        # 4
        end_time_field = arcpy.Parameter(name='end_time_field',
                                         displayName='End Time Field',
                                         direction='Input',
                                         datatype='Field',
                                         parameterType='Optional')
        end_time_field.parameterDependencies = [in_features.name]
        end_time_field.filter.list = ['Date']

        return[in_features,
               out_feature_class,
               clip_features,
               start_time_field,
               end_time_field,
               ]

    def updateMessages(self, parameters):
        start_time_err = arcpy.GetIDMessage(190015)
        end_time_err = arcpy.GetIDMessage(190016)
        if parameters[0].value is not None:
            if parameters[3].value is not None and parameters[4].value is None:
                # parameters[4].setErrorMessage('End time must be set')
                parameters[4].setErrorMessage(end_time_err)
            elif parameters[4].value is not None and parameters[3].value is None:
                # parameters[3].setErrorMessage('Start time must be set')
                parameters[3].setErrorMessage(start_time_err)

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def execute(self, parameters, messages):
        try:
            cfl = BlindSpotAreas(parameters[0].valueAsText,
                                 parameters[1].valueAsText,
                                 parameters[2].valueAsText,
                                 parameters[3].valueAsText,
                                 parameters[4].valueAsText,
                                 )
            tool_result = cfl.generate_areas()
            arcpy.SetParameter(1, tool_result[0])

            lyrx = arcpy.mp.LayerFile(tool_result[1])
            arcpy.SetParameterSymbology(1, lyrx)

            del cfl

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}\n{}".format(self.__class__.__name__,
                                             tbinfo,
                                             str(sys.exc_info()[1]),
                                             arcpy.GetMessages(2))
            arcpy.AddError(pymsg)
