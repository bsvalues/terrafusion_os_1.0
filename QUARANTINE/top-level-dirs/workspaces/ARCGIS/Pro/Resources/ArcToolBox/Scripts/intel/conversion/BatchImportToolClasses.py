# -*- coding: utf-8 -*-

"""
------------------------------------------------------------------------------
BatchImportToolClasses.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.5, Python 3.6
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 01/16/2018 - elinz - original writeup
* 03/12/2018 - elinz - changed name of class from "ConvertToFeatureClasses" to "BatchImportData"
* 03/29/2018 - elinz - added support to set dataconverter class attribute
                      'layer_time_stamp'
* 05/31/2018 - elinz - added import support for excel worksheets and text files
* 10/18/2018 - elinz - modified code to handle cases where a map is not available.
* 10/31/2018 - elinz - added import support for GeoJSON files.
* 04/18/2019 - elinz - added data filter and sub folders parameters
* 07/16/2019 - elinz - added import support for GPX files.
* 07/23/2019 - elinz - added ability to import into enterprise geodatabases.
* 08/29/2019 - elinz - added support for specifying multiple input folders
                    - updated parameter names and display names based on gp tool review.
* 2019-09-06 - mfunk - update lib references and module name for Pro integration
* 2019-09-17 - mfunk - ID messaging updates
* 2020-07-01 - mfunk - fix validation of options - issue 2229
* 2020-08-03 - elinz - add new parameter for kml ground overlay
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
* 2020-12-29 - elinz - modified input data parameter data type to handle files
* 2021-01-28 - elinz - Fixed issue with filter parameter value raising error
*                      when pattern doesn't include file extension; fixed issue
*                      where files where not found when filter pattern didn't
*                      include file extension
* 2022-10-14 - mfunk - Intel 3219 - update execute to check for AllSource or Pro
------------------------------------------------------------------------------
"""

import os
import sys
import traceback
import datetime
import arcpy

from intel.conversion import BatchImport
from intel.utilities import Utilities as iu
from intel.enumerations import TOOL_CATEGORY_CONVERSION

class DataConverterBaseClass(object):
    """ Base methods for other tool classes """

    @staticmethod
    def isLicensed():
        """ Check for Standard or Advanced """
    
        try:
            license_available = ["Available", "AlreadyInitialized"]
            if arcpy.CheckProduct("ArcEditor") in license_available or arcpy.CheckProduct("ArcInfo") in license_available:
                return True
            else:
                return False  # No Standard or Advanced license
        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)
            return False


class BatchImportData(DataConverterBaseClass):
    """ Define BatchImportData geoprocessing tool """
    def __init__(self):
        """ Tool constructor """

        self.label = "Batch Import Data"
        self.description = "Imports KML, KMZ, shapefiles, Excel worksheets, tabular text files, " \
                           "GeoJSON, and GPX files to feature classes in a single geodatabase."
        self.category = TOOL_CATEGORY_CONVERSION
        self.helpContext = 73040001
        

    def getParameterInfo(self):
        """ Define parameter definitions """

        category_input_data_options = "Advanced Input Data Options"
        category_kml_options = "KML/KMZ Options"

        input_data = arcpy.Parameter(name='in_data',
                                               displayName='Input Data',
                                               direction='Input',
                                               datatype=['DEFolder', 'DEFile'],
                                               parameterType='Required',
                                               multiValue=True)

        target_gdb = arcpy.Parameter(name='target_gdb',
                                                 displayName='Target Geodatabase',
                                                 direction='Input',
                                                 datatype='DEWorkspace',
                                                 parameterType='Required')
        target_gdb.filter.list = ["Local Database", "Remote Database"]

        input_filter = arcpy.Parameter(name='filter',
                                       displayName='Input Data Filter',
                                       direction='Input',
                                       datatype='GPString',
                                       parameterType='Optional',
                                       category=category_input_data_options)

        include_sub_folders = arcpy.Parameter(name='include_sub_folders',
                                           displayName='Include Sub Folders',
                                           direction='Input',
                                           datatype='GPBoolean',
                                           parameterType='Optional',
                                           category=category_input_data_options)
        include_sub_folders.value = 'True'
        include_sub_folders.filter.type = 'ValueList'
        include_sub_folders.filter.list = ['SUBFOLDERS', 'NO_SUBFOLDERS']

        output_gdb = arcpy.Parameter(name='out_geodatabase',
                                                  displayName='Updated Geodatabase',
                                                  direction='Output',
                                                  datatype='DEWorkspace',
                                                  parameterType='Derived')

        # Added include_groundoverlay parameter at Pro 2.7
        include_kml_groundoverlay = arcpy.Parameter(name='include_groundoverlay',
                                                displayName='Include Ground Overlay',
                                                direction='Input',
                                                datatype='GPBoolean',
                                                parameterType='Optional',
                                                category=category_kml_options)
        include_kml_groundoverlay.value = 'True'
        include_kml_groundoverlay.type = 'ValueList'
        include_kml_groundoverlay.filter.list = ['GROUNDOVERLAY', 'NO_GROUNDOVERLAY']

        return [input_data,
                target_gdb,
                input_filter,
                include_sub_folders,
                output_gdb,
                include_kml_groundoverlay]

    def updateParameters(self, parameters):
        """ Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed. """
        return
    
    def updateMessages(self, parameters):
        """ Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation. """

        # Check if data filter parameter contains any file extensions that are not supported
        parameter_index = 2
        if parameters[parameter_index].value is not None:
            valid, err_msg = BatchImport.DataConverterBase.validate_data_filter_extensions(
                parameters[parameter_index].value.split('|'))
            if not valid:
                parameters[parameter_index].setErrorMessage(err_msg)

        # Check if input data paths exists and are directories or files
        parameter_index = 0
        if parameters[parameter_index].value is not None:
            data_paths = self.getInputDataPaths(parameters[0])
            for data_path in data_paths:
                is_valid = True
                if not arcpy.Exists(data_path):
                    is_valid = False
                else:
                    desc = arcpy.Describe(data_path)
                    if hasattr(desc, 'workspaceType'):
                        if not desc.workspaceType == 'FileSystem':
                            is_valid = False
                    if os.path.isfile(data_path):
                        file_name, file_ext = os.path.splitext(data_path)
                        if file_ext.lower() not in BatchImport.DataConverterBase._source_file_extensions:
                            is_valid = False
                if not is_valid:
                    parameters[parameter_index].setErrorMessage(arcpy.GetIDMessage(190237).format(data_path))

        # Check if there are any duplicate input data paths
        parameter_index = 0
        if parameters[parameter_index].value is not None:
            data_paths = self.getInputDataPaths(parameters[0])
            paths = []
            for data_path in data_paths:
                data_path = data_path.lower()
                if data_path in paths:
                    parameters[parameter_index].setErrorMessage(arcpy.GetIDMessage(400))
                paths.append(data_path)

        return

    def getInputDataPaths(self, inputDataParameter):
        """ returns lists of input data paths """
        # doubled quotes causing paths to be skipped
        return [check_path.strip(r"'") for check_path in inputDataParameter.valueAsText.split(';')]

    def execute(self, parameters, messages):
        """ execute convert to feature classes action """
        additional_messaging = False
        try:
            
            data_paths = self.getInputDataPaths(parameters[0])

            output_gdb = parameters[1].valueAsText
            data_filter = parameters[2].valueAsText
            if data_filter is not None:
                data_filter = data_filter.split('|')
                data_filter = BatchImport.DataConverterBase.normalize_data_filter(data_filter)
            include_sub_folders = parameters[3].value
            include_kml_groundoverlay = parameters[5].value

            # Get the map to which output layers will be added
            output_map = None
            if iu.get_application() in ['ARCGIS_PRO', 'ARCGIS_ALLSOURCE']:
                aprx = arcpy.mp.ArcGISProject('CURRENT')
                output_map = aprx.activeMap

            layer_time_stamp = datetime.datetime.now().strftime('%Y-%m-%d %H%M%S')

            # Search root directory for datasets to load
            # arcpy.AddMessage('\nSearching folder {} for source datasets...'.format(data_paths))
            arcpy.AddMessage(arcpy.GetIDMessage(190171).format(', '.join(data_paths)))
            source_file_list = BatchImport.DataConverterBase.find_source_files(data_paths,
                                                                                 recursive=include_sub_folders,
                                                                                 patterns=data_filter)

            # Add progress bar for file list
            step_counter = 1
            file_count = len(source_file_list)
            # initial_message = f"Importing {file_count} datasets..."
            initial_message = arcpy.GetIDMessage(190172).format(file_count)
            arcpy.SetProgressor(type='step',
                                message=initial_message,
                                min_range=0,
                                max_range=file_count,
                                step_value=1)

            # Loop through source files and convert
            for source_file in source_file_list:
                arcpy.AddMessage('-' * 40)
                # arcpy.AddMessage('Source file: {}'.format(source_file))
                arcpy.AddMessage(arcpy.GetIDMessage(190173).format(source_file))

                file_base_name = os.path.basename(source_file)
                file_ext = os.path.splitext(source_file)[1].lower()

                # progress_message = f"... {step_counter} of {file_count}: {file_base_name}"
                progress_message = arcpy.GetIDMessage(190174).format(step_counter, file_count, file_base_name)
                arcpy.SetProgressorLabel(progress_message)
                arcpy.SetProgressorPosition()

                # If source is KMZ or KML file
                if file_ext == '.kmz' or file_ext == '.kml':
                    kml_converter = BatchImport.KMLDataConverter(source_file, output_gdb, output_map, include_kml_groundoverlay)
                    # kml_converter.verbose_messaging = additional_messaging
                    kml_converter.layer_time_stamp = layer_time_stamp
                    kml_converter.convert()

                # If source is a shapefile
                elif file_ext == '.shp':
                    shp_converter = BatchImport.ShapefileDataConverter(source_file, output_gdb, output_map)
                    shp_converter.verbose_messaging = additional_messaging
                    shp_converter.layer_time_stamp = layer_time_stamp
                    shp_converter.convert()

                # If source is an Excel spreadsheet
                elif file_ext == '.xlsx' or file_ext == '.xls':
                    excel_converter = BatchImport.ExcelWorkbookDataConverter(source_file, output_gdb, output_map)
                    # excel_converter.verbose_messaging = additional_messaging
                    excel_converter.layer_time_stamp = layer_time_stamp
                    excel_converter.convert()
                        
                # If source is a text file
                elif file_ext == '.csv' or file_ext == '.txt' or file_ext == '.tab':
                    txt_converter = BatchImport.TextFileDataConverter(source_file, output_gdb, output_map)
                    # txt_converter.verbose_messaging = additional_messaging
                    txt_converter.layer_time_stamp = layer_time_stamp
                    txt_converter.convert()

                # If source is a GeoJSON file
                elif file_ext == '.geojson':
                    geojson_converter = BatchImport.GeoJSONDataConverter(source_file, output_gdb, output_map)
                    # geojson_converter.verbose_messaging = additional_messaging
                    geojson_converter.layer_time_stamp = layer_time_stamp
                    geojson_converter.convert()
                
                # If source is a GPX file
                elif file_ext == '.gpx':
                    gpx_converter = BatchImport.GPXDataConverter(source_file, output_gdb, output_map)
                    # gpx_converter.verbose_messaging = additional_messaging
                    gpx_converter.layer_time_stamp = layer_time_stamp
                    gpx_converter.convert()
                
                step_counter += 1

            # Set derived output parameter
            arcpy.SetParameter(4, output_gdb)
            
            return

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = '{}\n{}\n{}\n{}'.format(self.__class__.__name__,
                                            tbinfo,
                                            str(sys.exc_info()[1]),
                                            arcpy.GetMessages(2))
            arcpy.AddError(pymsg)
            
            return
