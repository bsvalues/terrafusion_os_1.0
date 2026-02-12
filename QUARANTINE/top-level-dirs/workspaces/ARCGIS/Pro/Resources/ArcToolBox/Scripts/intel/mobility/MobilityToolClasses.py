# -*- coding: utf-8 -*-

'''
------------------------------------------------------------------------------
MobilityToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2018-10-10 - mfunk - original writeup
* 2019-05-09 - mfunk - renaming and updates
* 2019-05-14 - mfunk - updates from GP tool review
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-02-03 - mfunk - updateMessage to check start/end points fall within surface
* 2020-03-27 - mfunk - remove baseclass
* 2020-04-16 - jjones - updated default output feature name for classes
------------------------------------------------------------------------------
'''

import arcpy
import sys
import traceback

from intel.mobility.LeastCostPath import LeastCostPathLogic
from intel.utilities import Utilities as iu
from intel.utilities.MobilityUtilities import is_point_inside_surface
from intel.enumerations import TOOL_CATEGORY_ANALYSIS_SUITABILITY


class LeastCostPath(object):

    def __init__(self):
        '''
        LCP tool class constructor
        '''
        self.label = "Least Cost Path"
        self.description = "Find shortest path (least cost) across a cost surface."
        self.category = TOOL_CATEGORY_ANALYSIS_SUITABILITY
        self.helpContext = 73030002

    def __del__(self):
        '''
        LCP  tool class destructor
        '''
        pass

    def isLicensed(self):
        '''
        Requires a Spatial Analyst license
        '''
        license_available = ["Available", "AlreadyInitialized"]
        if arcpy.CheckExtension("Spatial") in license_available:
            return True
        else:
            return False  # No Spatial license available

    def getParameterInfo(self):
        '''
        LCP tool class parameter definitions
        '''
        # 0
        in_cost_surface = arcpy.Parameter(name='in_cost_surface',
                                          displayName='Input Cost Surface',
                                          direction='Input',
                                          datatype='GPRasterLayer',
                                          parameterType='Required')
        # 1
        in_start_point = arcpy.Parameter(name='in_start_point',
                                         displayName='Input Starting Point',
                                         direction='Input',
                                         datatype='GPFeatureRecordSetLayer',
                                         parameterType='Required')
        in_start_point.filter.list = ['POINT']
        # 2
        in_end_point = arcpy.Parameter(name='in_end_point',
                                       displayName='Input Ending Point',
                                       direction='Input',
                                       datatype='GPFeatureRecordSetLayer',
                                       parameterType='Required')
        in_end_point.filter.list = ['POINT']
        # 3
        out_path_feature_class = arcpy.Parameter(name='out_path_feature_class',
                                                 displayName='Output Path Feature Class',
                                                 direction='Output',
                                                 datatype='DEFeatureClass',
                                                 parameterType="Required")
        # 4
        handle_zeros = arcpy.Parameter(name='handle_zeros',
                                       displayName='Zero Cost Handled As',
                                       direction='Input',
                                       datatype='GPString',
                                       parameterType='Optional')
        handle_zeros.filter.list = iu.handle_zeros_list
        handle_zeros.value = iu.handle_zeros_list[0]
        # 5
        out_start_point = arcpy.Parameter(name='out_start_point',
                                          displayName='Output Start Point',
                                          direction='Output',
                                          datatype='DEFeatureClass',
                                          parameterType='Derived')
        # 6
        out_end_point = arcpy.Parameter(name='out_end_point',
                                        displayName='Output End Point',
                                        direction='Output',
                                        datatype='DEFeatureClass',
                                        parameterType='Derived')

        return [in_cost_surface,
                in_start_point,
                in_end_point,
                out_path_feature_class,
                handle_zeros,
                out_start_point,
                out_end_point]

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        # Check that start points fall within surface extents
        # If surface has changed and has been validated...
        if parameters[0].altered and parameters[0].hasBeenValidated:
            # if the surface value is not None...
            if parameters[0].value:
                # if the start point has changed and is validated...
                if parameters[1].altered and parameters[1].hasBeenValidated:
                    # if the point is not None...
                    if parameters[1].value:
                        # if the point dataset exists...
                        if arcpy.Exists(parameters[1].value):
                            # if the surface exists...
                            if arcpy.Exists(parameters[0].value):
                                # if there is at lest one point...
                                if int(arcpy.GetCount_management(parameters[1].value)[0]) > 0:
                                    # if the point is NOT over the surface...
                                    if not is_point_inside_surface(parameters[1].value,
                                                                    parameters[0].value):
                                        # ERROR: "Point is outside of Input Cost Surface."
                                        parameters[1].setErrorMessage(arcpy.GetIDMessage(190145))

        # Check that end points fall within surface extents
        # If surface has changed and has been validated...
        if parameters[0].altered and parameters[0].hasBeenValidated:
            # if the surface value is not None...
            if parameters[0].value:
                # if the end point has changed and is validated...
                if parameters[2].altered and parameters[2].hasBeenValidated:
                    # if the point is not None...
                    if parameters[2].value:
                        # if the point dataset exists...
                        if arcpy.Exists(parameters[2].value):
                            # if the surface exists...
                            if arcpy.Exists(parameters[0].value):
                                # if there is at lest one point...
                                if int(arcpy.GetCount_management(parameters[2].value)[0]) > 0:
                                    # if the point is NOT over the surface...
                                    if not is_point_inside_surface(parameters[2].value,
                                                                    parameters[0].value):
                                        # ERROR: "Point is outside of Input Cost Surface."
                                        parameters[2].setErrorMessage(arcpy.GetIDMessage(190145))

        return

    def execute(self, parameters, messages):
        '''
        LCP tool class execution
        calls intelMobilityLeastCostPath.py
        '''
        try:
            mlcp = LeastCostPathLogic(parameters[0].valueAsText,
                                      parameters[1].valueAsText,
                                      parameters[2].valueAsText,
                                      parameters[3].valueAsText,
                                      parameters[4].valueAsText)
            mlcp_result = mlcp.calculate()

            arcpy.SetParameter(3, mlcp_result[0])
            arcpy.SetParameter(5, mlcp_result[1])
            arcpy.SetParameter(6, mlcp_result[2])

            del mlcp
            return
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)