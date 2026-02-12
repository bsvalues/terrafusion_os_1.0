# coding: utf-8
'''
------------------------------------------------------------------------------
GenerateCoverageAreasLogic.py
------------------------------------------------------------------------------
requirements: ArcGIS 2.8, Python 3.7
author: ArcGIS Solutions for Intelligence
contact: intelsolutions@esri.com
company: Esri
------------------------------------------------------------------------------
* 2019-09-12 - mfunk - Update messaging and execption handling
* 2019-10-03 - mfunk - class name fixes for doc clarification
* 2020-01-14 - mfunk - module rename for 'intel'
* 2020-05-04 - mfunk - update for #2032 - delete intermediate data
* 2020-12-03 - jjones - reorganized into intel Subfolders, fixed relative imports
* 2020-12-16 - mfunk - begin tool refactor
* 2021-05-21 - mfunk - fixes for issue 1535
* 2022-11-01 - mfunk - Buffer to PairwiseBuffer
------------------------------------------------------------------------------
'''

import os
import sys
import traceback
import arcpy
from typing import List, Tuple, Optional

from intel.utilities import MsgType, \
                            create_scratch_geodatabase, \
                            create_temp_table_name, \
                            DEBUG, \
                            getLicenseLevel
from intel.enumerations import ArcGISProLicenseEnum


class GenerateCoverageAreasLogic:

    def __init__(self,
                 input_features: str,
                 output_features: str,
                 buffertype: str,
                 bufferunit: Optional[str] = None,
                 start: Optional[str] = None,
                 end: Optional[str] = None):
        '''
        constructor
        '''
        self._input_features = input_features
        self._buffertype = buffertype
        self._bufferunit = bufferunit
        self._start = start
        self._end = end
        self._output_features = output_features
        self.message = MsgType()

        # store temp datasets for removal
        self._delete_intermediate = []
        self._temp_scratch = None
        self._delete_temp_scratch_flag = False

        self._current_license_type = getLicenseLevel()

    def __del__(self):
        '''
        destructor
        '''
        # cleanup temp datasets
        self._cleanup()

    @property
    def input_features(self):
        return self._input_features

    @input_features.setter
    def input_features(self, value):
        self._input_features = value

    @property
    def buffertype(self):
        return self._buffertype

    @buffertype.setter
    def buffertype(self, value):
        self._buffertype = value

    @property
    def bufferunit(self):
        return self._bufferunit

    @bufferunit.setter
    def bufferunit(self, value):
        self._bufferunit = value

    @property
    def start(self):
        return self._start

    @start.setter
    def start(self, value):
        self._start = value

    @property
    def end(self):
        return self._end

    @end.setter
    def end(self, value):
        self._end = value

    @property
    def output_features(self):
        return self._output_features

    @output_features.setter
    def output_features(self, value):
        self._output_features = value

    @staticmethod
    def _analysisBuffer(inputFeatures: str,
                        outputFeatures: str,
                        bufType: str) -> str:
        """_analysisBuffer Buffers inputFeatures.

        Standard license only

        Wrapper for using Buffer in the Anaysis toolbox.
        Returns polygon features buffered by either a distance or
        field value.

        :param inputFeatures: path to input features to be buffered
        :type inputFeatures: String
        :param outputFeatures: path to output buffer features to be created
        :type outputFeatures: String
        :param bufType: either distance value or field name of inputFeatures
        :type bufType: String
        :return: path to output features
        :rtype: string
        """
        if DEBUG:
            arcpy.AddMessage("Analysis Buffer -- Standard license")
        arcpy.analysis.PairwiseBuffer(inputFeatures,
                                      outputFeatures,
                                      bufType)
        return outputFeatures

    @staticmethod
    def _geoAnalysticsCreateBuffer(inputFeatures: str,
                                   outputFeatures: str,
                                   distance: Optional[str] = None,
                                   field: Optional[str] = None) -> str:
        """_geoAnalysticsCreateBuffer Buffers inputFeatures.

        Advanced license only

        Wrapper for using CreateBuffer in the Geoanalytics
        toolbox.
        Returns polygon features buffered by either a distance
        or field value.

        :param inputFeatures: path to input features to be buffered
        :type inputFeatures: String
        :param outputFeatures: path to output buffer features to be created
        :type outputFeatures: String
        :param distance: Linear unit (value and unit) to buffer by, defaults to None
        :type distance: String, optional
        :param field: inputFeatures field name to buffer by, defaults to None
        :type field: String, optional
        :return: path to output features
        :rtype: String
        """

        inFeatureLayer: str = "inFeatureLayer"
        arcpy.management.MakeFeatureLayer(inputFeatures, inFeatureLayer)

        if DEBUG:
            arcpy.AddMessage("Geoanalytics CreateBuffer -- Advanced license")
        method: str = "GEODESIC"
        dissolve: str = "NONE"
        if distance is not None:
            bufType: str = "DISTANCE"
            if DEBUG:
                arcpy.AddMessage(f"Geoanalytics CreateBuffer - Advanced license - {bufType}")
            arcpy.gapro.CreateBuffers(inFeatureLayer,
                                      outputFeatures,
                                      method,
                                      buffer_type=bufType,
                                      buffer_distance=distance,
                                      dissolve_option=dissolve)
        # TEXT fields not supported --- errors with 'Invalid field type'
        # else:
        #     bufType = "FIELD"
        #     if DEBUG:
        #         arcpy.AddMessage(f"Geoanalytics CreateBuffer - Advanced license - {bufType}")
        #     arcpy.gapro.CreateBuffers(inFeatureLayer,
        #                               outputFeatures,
        #                               method,
        #                               buffer_type=bufType,
        #                               buffer_field=field,
        #                               dissolve_option=dissolve)
        else:
            # EXPRESSION type with TEXT field input doesn't fail but produces
            # empty output.
            bufType = "EXPRESSION"
            bufExpression: str = f'$feature["{field}"]'
            if DEBUG:
                arcpy.AddMessage(f"Geoanalytics CreateBuffer - Advanced license - {bufType} with @@{bufExpression}@@")

            arcpy.gapro.CreateBuffers(inFeatureLayer,
                                      outputFeatures,
                                      method,
                                      buffer_type=bufType,
                                      buffer_expression=bufExpression,
                                      dissolve_option=dissolve)

        return outputFeatures

    def _makeAssetBuffer(self,
                         inputfeatures: str,
                         start: Optional[str] = None,
                         end: Optional[str] = None,
                         distance: Optional[str] = None,
                         fldDist: Optional[str] = None) -> str:
        """_makeAssetBuffer [summary]

        [extended_summary]

        :param inputfeatures: [description]
        :type inputfeatures: [type]
        :param start: [description], defaults to None
        :type start: [type], optional
        :param end: [description], defaults to None
        :type end: [type], optional
        :param distance: [description], defaults to None
        :type distance: [type], optional
        :param fldDist: [description], defaults to None
        :type fldDist: [type], optional
        :return: [description]
        :rtype: [type]
        """
        try:

            infeatures = 'infeatures'
            arcpy.management.MakeFeatureLayer(inputfeatures, infeatures)

            buffer: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)

            # Cannot use CreateBuffer in gapro as it does NOT support TEXT
            # field inputs for linear units. Commenting this part out in the
            # hope that future versions will support this option the same as
            # standard arcpy.analysis.Buffer.
            #
            # # Get license (advanced or standard)
            # # Basic license should not be able to open tool
            # if self._current_license_type == ArcGISProLicenseEnum.Advanced:
            #     # CreateBuffer (Advanced License)
            #     if distance:
            #         if DEBUG:
            #             arcpy.AddMessage(f"CreateBuffer - distance: {distance}")
            #         buffer = self._geoAnalysticsCreateBuffer(infeatures,
            #                                                  buffer,
            #                                                  distances=distance)
            #     else:
            #         if DEBUG:
            #             arcpy.AddMessage(f"CreateBuffer - fldDist: {fldDist}")
            #         buffer = self._geoAnalysticsCreateBuffer(infeatures,
            #                                                  buffer,
            #                                                  field=fldDist)
            # else:
            #     # Buffer (Standard License)
            #     if distance is not None:
            #         buffer = self._analysisBuffer(infeatures, buffer, distance)
            #     else:
            #         buffer = self._analysisBuffer(infeatures, buffer, fldDist)

            # Buffer (Standard & Advanced License)
            if arcpy.Exists(buffer):
                arcpy.management.Delete(buffer)
            if distance is not None:
                buffer = self._analysisBuffer(infeatures, buffer, distance)
            else:
                buffer = self._analysisBuffer(infeatures, buffer, fldDist)

            # add temp buffer to cleanup pile
            self._delete_intermediate.append(buffer)

            bufferDesc = arcpy.Describe(buffer)
            bufferFields = bufferDesc.fields
            deletefields = []

            if start is not None and end is not None:
                # Create and calculate start time field
                startFieldName = 'time_start'
                arcpy.management.AddField(buffer, startFieldName, 'DATE')
                expression = f"!{start}!"
                arcpy.management.CalculateField(buffer, startFieldName, expression)

                # Create and calculate end time field
                endFieldName = 'time_end'
                arcpy.management.AddField(buffer, endFieldName, 'DATE')
                expression = f"!{end}!"
                arcpy.management.CalculateField(buffer, endFieldName, expression)

                for f in bufferFields:
                    if f.required or f.name == startFieldName or f.name == endFieldName:
                        continue
                    else:
                        deletefields.append(f.name)
            else:
                for f in bufferFields:
                    if f.required:
                        continue
                    else:
                        deletefields.append(f.name)
            # Issue 2274 - Skipping the delete as this adds a significant 
            # amount of processing time to the overall run. For larger datasets
            # this can mulitply the time to compete. Going forward we will accept
            # the original fields in favor of faster complete times with both
            # Standard and Advanced licenses.
            # arcpy.DeleteField_management(buffer, deletefields)

            return buffer

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def generate(self):

        try:

            # get the scratch geodatabase
            if arcpy.env.scratchGDB is None:
                self._temp_scratch = create_scratch_geodatabase()
                arcpy.env.scratchGDB = self._temp_scratch
                self._delete_temp_scratch_flag = True

            # make a copy of input features so we can manipulate them
            features: str = create_temp_table_name(workspace=arcpy.env.scratchGDB)
            if DEBUG:
                arcpy.AddMessage(f"using features: {features}")
            if arcpy.Exists(features):
                arcpy.management.Delete(features)
            arcpy.management.CopyFeatures(self._input_features, features)
            self._delete_intermediate.append(features)
            inputfeatures: str = 'inputfeatures'
            arcpy.management.MakeFeatureLayer(features, inputfeatures)
            inCopyDescribe = arcpy.Describe(inputfeatures)
            inCopyFields = inCopyDescribe.fields

            # if we get a field name that is in our list of fields for the features
            if DEBUG:
                arcpy.AddMessage(f"buffer unit: {self._bufferunit}, buffer type: {self._buffertype}")
            if self._buffertype in [f.name for f in inCopyFields]:
                # Next check if the field is missing units...
                if DEBUG:
                    arcpy.AddMessage("buffer type is in fields list...")
                if self._bufferunit is None:
                    if DEBUG:
                        arcpy.AddMessage("...buffer unit is None")
                    output = self._makeAssetBuffer(inputfeatures,
                                                   start=self._start,
                                                   end=self._end,
                                                   distance=None,
                                                   fldDist=self._buffertype)
                # If the field contains units...
                else:
                    if DEBUG:
                        arcpy.AddMessage("buffer unit is not none...")
                    tempField = 'temprange'
                    arcpy.management.AddField(inputfeatures, tempField, "TEXT")

                    calcFieldExpression = f'"!{self._buffertype}! {self._bufferunit}"'
                    if DEBUG:
                        arcpy.AddMessage(f"expression: {calcFieldExpression}")
                    arcpy.management.CalculateField(inputfeatures,
                                                    tempField,
                                                    calcFieldExpression,
                                                    expression_type=r'Python3')

                    output = self._makeAssetBuffer(inputfeatures,
                                                   start=self._start,
                                                   end=self._end,
                                                   distance=None,
                                                   fldDist=tempField)
            # otherwise we have a Linear Unit
            else:
                if DEBUG:
                    arcpy.AddMessage("buffer field is not in the list....")
                output = self._makeAssetBuffer(inputfeatures,
                                               start=self._start,
                                               end=self._end,
                                               distance=self._buffertype,
                                               fldDist=None)

            arcpy.management.CopyFeatures(output, self._output_features)
            self._delete_intermediate.append(output)

            return self._output_features

        except Exception:
            tb = sys.exc_info()[2]
            tbinfo = traceback.format_tb(tb)[0]
            pymsg = "{}:\n{}\n{}".format(tbinfo,
                                         str(sys.exc_info()[1]),
                                         arcpy.GetMessages(2))
            arcpy.AddError(pymsg)

    def _cleanup(self):
        """_cleanup Clean up and remove temp dataset

        Clean up and remove temp datasets
        """
        arcpy.AddMessage(arcpy.GetIDMessage(190012))
        for i in self._delete_intermediate:
            # "Removing intermedate datasets... "
            if arcpy.Exists(i):
                arcpy.management.Delete(i)
                if DEBUG:
                    arcpy.AddMessage(f"...{i}")

        # Remove temp folder and geodatabase if it was created
        if self._delete_temp_scratch_flag is True:
            if self._temp_scratch is not None:
                if DEBUG:
                    arcpy.AddMessage(f"Removing: {self._temp_scratch}")
                arcpy.management.Delete(self._temp_scratch)
                arcpy.management.Delete(os.path.dirname(self._temp_scratch))
                self._temp_scratch = None
        return True
