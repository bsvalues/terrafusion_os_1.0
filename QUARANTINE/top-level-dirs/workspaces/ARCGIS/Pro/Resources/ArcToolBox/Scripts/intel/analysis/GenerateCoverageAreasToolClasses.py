# coding: utf-8
'''
------------------------------------------------------------------------------
GenerateCoverageAreasToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2018-12-18 - phill - fix parameter and class names
* 2019-01-07 - phill - fix range, exta fields, messages
* 2019-08-30 - mfunk - Updates for inclusion in Pro 2.5
* 2019-09-12 - mfunk - Update messaging and execption handling
* 2019-10-03 - mfunk - class name fixes for doc clarification
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-04-16 - jjones - updated default output feature name for classes
* 2020-05-04 - mfunk - update for #2032 - delete intermediate data
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
* 2021-01-25 - mfunk - updates to run on Server
------------------------------------------------------------------------------
'''

import arcpy
import sys
import traceback
from intel.analysis.GenerateCoverageAreasLogic import GenerateCoverageAreasLogic
from intel.utilities import MsgType
from intel.enumerations import TOOL_CATEGORY_ANALYIS_BLINDSPOT


class GenerateCoverageAreasBaseClass(object):

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


class GenerateCoverageAreas(GenerateCoverageAreasBaseClass):
    def __init__(self):
        self.label = "Generate Coverage Areas"
        self.category = TOOL_CATEGORY_ANALYIS_BLINDSPOT
        self.helpContext = 73020002

        self.message = MsgType()

    def getParameterInfo(self):
        '''
        define parameters
        '''

        in_features = arcpy.Parameter(name='in_features',
                                      displayName='Input Features',
                                      direction='Input',
                                      datatype='GPFeatureLayer',
                                      parameterType='Required')

        output_features = arcpy.Parameter(name='out_feature_class',
                                          displayName='Output Coverage Area',
                                          direction='Output',
                                          datatype='DEFeatureClass',
                                          parameterType='Required')

        buffer_type = arcpy.Parameter(name='buffer_type',
                                      displayName='Buffer Type',
                                      direction='Input',
                                      datatype=['GPLinearUnit', 'Field'],
                                      parameterType='Required')
        buffer_type.parameterDependencies = [in_features.name]

        buffer_unit = arcpy.Parameter(name='range_unit',
                                      displayName='Range Unit',
                                      direction='Input',
                                      datatype='GPString',
                                      parameterType='Optional')
        buffer_unit.filter.list = ["Meters", "Kilometers", "Feet", "Miles", "NauticalMiles"]
        #buffer_unit.value = 'Meters'

        start = arcpy.Parameter(name='start_time_field',
                                displayName='Start Time Field',
                                direction='Input',
                                datatype='Field',
                                parameterType='Optional')
        start.parameterDependencies = [in_features.name]
        start.filter.list = ['Date']

        end = arcpy.Parameter(name='end_time_field',
                              displayName='End Time Field',
                              direction='Input',
                              datatype='Field',
                              parameterType='Optional')
        end.parameterDependencies = [in_features.name]
        end.filter.list = ['Date']

        return[in_features,  #0
               output_features, #1
               buffer_type,      #2
               buffer_unit,     #3
               start,           #4
               end,             #5
               ]

    def updateMessages(self, parameters):
        start_time_err = arcpy.GetIDMessage(190015)
        end_time_err = arcpy.GetIDMessage(190016)
        if parameters[0].value is not None and parameters[5].value is not None:
            if parameters[4].value is None:
                # parameters[4].setErrorMessage('Start time must be set.')
                parameters[4].setErrorMessage(start_time_err)
        elif parameters[0].value is not None and parameters[4].value is not None:
            if parameters[5].value is None:
                # parameters[5].setErrorMessage('End time must be set.')
                parameters[5].setErrorMessage(end_time_err)

    def updateParameters(self, parameters):
        if parameters[0].valueAsText:
            infieldnames = [f.name for f in arcpy.Describe(parameters[0]).fields]
            if parameters[2].valueAsText in infieldnames:
                parameters[3].enabled = True
            else:
                parameters[3].enabled = False
        else:
            parameters[3].enabled = False

        if parameters[0].value and not parameters[0].hasBeenValidated:
            parameters[1].value == 'Coverage_Areas'

        return

    def execute(self, parameters, messages):

        cfb = GenerateCoverageAreasLogic(parameters[0].valueAsText,
                                         parameters[1].valueAsText,
                                         parameters[2].valueAsText,
                                         parameters[3].valueAsText,
                                         parameters[4].valueAsText,
                                         parameters[5].valueAsText)
        arcpy.SetParameter(1, cfb.generate())
