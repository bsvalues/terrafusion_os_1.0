"""FindSimilarLocations tool implementaion"""
# import from common package. noqa. pylint: disable=import-error
# functions called implicitly in __init__. noqa. pylint: disable=attribute-defined-outside-init
from typing import Union, Dict, List, Optional, Tuple
import json

import arcpy
import arcpy.management

import SSUtilities as UTILS
from common import (PATool, PAFeatureLayer, FeatureServiceLayerPublisher,
                    LogUtils, ModelBuilderMixin,
                    AnalysisUtils, PopupInfo, Renderer,
                    PAErrorProcessor,
                    AOLUtils, ParameterUnpackMixin,
                    PAEnvironment)
from loccore import ExpUtils
from .fslexecutor import FSLExecutor


PARAM_NAMES = {"analysisLayer": 0,
               "searchLayer": 1,
               "analysisField": 2,
               "inputQuery": 3,
               "numberResults": 4,
               "outputName": 5,
               "context": 6,
               "criteriaField": 7,
               "similarResultLayer": 8}

TASK_NAME = "FindSimilarLocations"
ERROR_CODES = [308, 401, 728, 735, 1585, 1589, 1599]

LOGGER = LogUtils.setup_logger(__name__)


class FSLTool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implement the Find Similar Locations"""

    @classmethod
    def get_json_from_param(
        cls,
        parameter_index: int,
        param_name: str,
        is_multival: bool
    ) -> Optional[Union[List, Dict]]:
        """Unpack json from parameter."""
        param_json = None
        if not is_multival:
            param_val = cls.get_param_as_text(parameter_index)
            LOGGER.debug(f"param_val: {param_val}")
            if not param_val:
                return param_json
            try:
                param_json = json.loads(param_val)
            except ValueError:
                LOGGER.error(100245, extra={"message_ID": 100245,
                                            "paramName": param_name})
                raise
        else:
            param_val = arcpy.GetParameter(parameter_index)
            if not param_val:
                return param_json
            param_json = []
            # from version 2, this parameter becomes ValueTable
            if isinstance(param_val, arcpy.ValueTable):
                try:
                    for row in range(param_val.rowCount):
                        tmp_json = {"referenceField": param_val.getValue(row, 0),
                                    "candidateField": param_val.getValue(row, 1)}
                        if tmp_json not in param_json:
                            param_json.append(tmp_json)
                    if not param_json:
                        return None
                except arcpy.ExecuteError:
                    LOGGER.error(100245, extra={"message_ID": 100245,
                                                "paramName": param_name})
                    raise
            else:
                for pval in param_val:  # type: ignore
                    try:
                        pjson = json.loads(pval)
                        if pjson not in param_json:
                            param_json.append(pjson)
                    except ValueError:
                        LOGGER.error(100245, extra={"message_ID": 100245,
                                                    "paramName": param_name})
                        raise

        return param_json

    def _preprocess_inputs(
        self,
        input_layer: PAFeatureLayer,
        search_layer: PAFeatureLayer,
        input_query: str
    ) -> Tuple:
        """Preprocess input parameters."""
        if input_query:
            input_query = ExpUtils.parse_single_where_clause(input_layer, input_query)
            LOGGER.debug(f"input_query: {input_query}")
            tmp_lyr = arcpy.management.SelectLayerByAttribute(input_layer.layer, "NEW_SELECTION",
                                                              input_query).getOutput(0).name  # type: ignore
            new_input_layer = PAFeatureLayer(tmp_lyr, select_features_in_extent=False)
            new_input_layer.layer_name = input_layer.layer_name
            input_layer = new_input_layer
            input_layer.count = AOLUtils.get_feature_count(input_layer.layer)
            LOGGER.debug(f"input_layer.count: {input_layer.count}")
            # TODO: this logic needs to update in the future (currently it is written
            # to follow the same pattern as previous implementation because there is
            # not a good way to tell if input_layer and search_layer is created from
            # the same data source).
            if (
                input_layer.layer_name == search_layer.layer_name
                or (input_layer.layer_name == "inputLayer" and search_layer.layer_name == "searchLayer")
            ):
                if not search_layer.FIDSet:
                    tmp_sel_lyr = arcpy.management.SelectLayerByAttribute(search_layer.layer,
                                                                          "NEW_SELECTION")
                else:
                    tmp_sel_lyr = search_layer.layer
                tmp_search_lyr = arcpy.management.SelectLayerByAttribute(tmp_sel_lyr,
                                                                         "REMOVE_FROM_SELECTION",
                                                                         input_query).getOutput(0).name  # type: ignore
                tmp_srh_layer = PAFeatureLayer(tmp_search_lyr, select_features_in_extent=False)
                tmp_srh_layer.layer_name = search_layer.layer_name
                search_layer = tmp_srh_layer
                # reset the count
                search_layer.count = AOLUtils.get_feature_count(search_layer.layer)
                LOGGER.debug(f"search_layer.count: {search_layer.count}")
        return (input_layer, search_layer, input_query)

    def get_parameters(self):
        """Unpack all the parameters"""
        input_layer = PAFeatureLayer(0, metadata={"parameterDataType": "Feature Set",
                                                  "parameterName": "inputLayer"})
        self.check_overwrite_sr(input_layer.spatialReference)  # type: ignore

        search_layer = PAFeatureLayer(1, metadata={"parameterDataType": "Feature Set",
                                                   "parameterName": "searchLayer"})
        if self.is_running_in(PAEnvironment.MODELBUILDER):
            result_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(8))
        else:
            result_layer = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                "FindSimilarLayer")
        analysis_fields = self.get_param(2)
        input_query = self.get_param_as_text(3)
        number_results = UTILS.getNumericParameter(4)
        criteria_fields = self.get_json_from_param(7, "criteriaFields", True)
        # criteria_fields = self.get_param_as_text(8)
        LOGGER.debug(f"criteria_fields: {criteria_fields}")
        LOGGER.debug(f"number_results: {number_results} and type as {type(number_results)}")
        (input_layer, search_layer, input_query) = self._preprocess_inputs(input_layer,
                                                                           search_layer,
                                                                           input_query)
        LOGGER.debug(f"input_layer FIDSet: {input_layer.FIDSet}")
        LOGGER.debug(f"search_layer FIDSet: {search_layer.FIDSet}")

        if number_results is None:
            number_results = 0

        if number_results == 0 or number_results > search_layer.count:
            if number_results > search_layer.count:
                LOGGER.warning(1586, extra={"message_ID": 1586,
                                            "maxValue": search_layer.count})
            number_results = search_layer.count

        self.cost_parameters = {"inputLayer": input_layer,
                                "searchLayer": search_layer,
                                "analysisField": analysis_fields,
                                "numberResults": number_results,
                                "criteriaField": criteria_fields}

        self.executor: FSLExecutor = FSLExecutor(input_layer,
                                                 search_layer,
                                                 result_layer,
                                                 analysis_fields,
                                                 criteria_fields,
                                                 input_query,
                                                 number_results,  # type: ignore
                                                 ERROR_CODES)

    def set_visualization(self):
        """Set the renderer to the output_layer."""
        fields = AOLUtils.list_fields(self.executor.output_layer.data)
        scratch_fields = [f.name for f in fields]
        search_desc = AOLUtils.describe(self.executor.search_layer.layer)
        uid = search_desc.oidFieldName
        rmv_fields = [uid, search_desc.shapeFieldName]
        sfields = AOLUtils.list_fields(self.executor.search_layer.layer)
        search_fields = [f.name for f in sfields if f.name not in rmv_fields]
        join_fields = list(set(search_fields).difference(set(scratch_fields)))
        if join_fields:
            arcpy.management.JoinField(self.executor.output_layer.layer, "CAND_ID",
                                       self.executor.search_layer.layer, uid, join_fields)
            fields = AOLUtils.list_fields(self.executor.output_layer.layer)
        popup_info = self.get_popup_content(fields, join_fields)
        self.executor.output_layer.set_popup(popup_info, popup_info.title)
        drawing_info = self._get_drawing_info(self.executor.number_results,
                                              self.executor.output_layer.shapeType.lower())
        self.executor.output_layer.set_drawing(None, drawing_info)

    def publish_outputs(self):
        """Publish the outputs as a feature service."""
        process_info = self.executor.process_info if self.is_running_in(PAEnvironment.MODELBUILDER) else None
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version,
                                                 process_info=process_info)
        publisher.add_layer_to_publish(self.executor.output_layer,
                                       PARAM_NAMES["similarResultLayer"],
                                       "FindSimilarLayer", layer_index=0)
        publisher.publish()
        # add the process info
        if not self.is_running_in(PAEnvironment.MODELBUILDER):
            arcpy.SetParameterAsText(9, json.dumps(self.executor.process_info))

    def log_usage_metering(self):
        """Log the usage metering."""
        values = [self.executor.input_layer.shapeType,
                  self.executor.input_layer.count,
                  self.output_name.output_cost]
        cost = self.executor.input_layer.count * 0.001
        LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, values)

    def _get_drawing_info(self, num_results: int, shape_type: str):
        """Get the renderer json"""
        if shape_type == "point":
            rfile = "similar_points.json"
        elif shape_type == "polyline":
            rfile = "similar_lines.json"
        else:
            rfile = "similar_polygons.json"
        renderer = Renderer.get_drawing_from_json(rfile)

        if num_results > 5:
            for i in range(1, 6):
                level = float(num_results) / 5
                max_val = int(round(level * (i)))
                min_val = int(round(level * (i - 1))) + 1
                renderer["renderer"]["classBreakInfos"][i]["classMaxValue"] = max_val
                renderer["renderer"]["classBreakInfos"][i]["label"] = f"{min_val} - {max_val}"
        else:
            for i in range(num_results, 5):
                del renderer["renderer"]["classBreakInfos"][num_results + 1]
        if num_results > 800:
            for i in range(1, 6):
                if shape_type == "point":
                    renderer["renderer"]["classBreakInfos"][i]["symbol"]["width"] = 8
                    renderer["renderer"]["classBreakInfos"][i]["symbol"]["height"] = 8
                elif shape_type == 'polyline':
                    renderer["renderer"]["classBreakInfos"][i]["symbol"]["width"] = 1

        elif num_results > 100:
            for i in range(1, 6):
                if shape_type == "point":
                    renderer["renderer"]["classBreakInfos"][i]["symbol"]["width"] = 10
                    renderer["renderer"]["classBreakInfos"][i]["symbol"]["height"] = 10
                elif shape_type == 'polyline':
                    renderer["renderer"]["classBreakInfos"][i]["symbol"]["width"] = 2
        return renderer

    def get_popup_content(self, fields: List, join_fields: List):
        '''Creates appropriate popup content'''
        # create popup content for count always
        similar_popup = PopupInfo("Find Similar Locations Summary")
        similar_popup.add_field_info("SIMRANK", "Similarity Rank")
        similar_popup.add_field_info("MATCH_ID", "Input Reference ID")
        similar_popup.add_field_info("CAND_ID", "Candidate Search ID")
        similar_popup.add_field_info("SIMINDEX", "Sum Squared Value Differences", True)
        af_lc = [f.lower() for f in self.executor.analysis_fields]
        jf_lc = [f.lower() for f in join_fields]
        for field in fields:
            fname = field.name
            if fname.lower() in af_lc or fname.lower() in jf_lc:
                ftype = field.type
                if ftype == "Double" or ftype == "Single":
                    similar_popup.add_field_info(fname, fname, True)
                else:
                    similar_popup.add_field_info(fname, fname)

        return similar_popup


def execute_tool(version: float):
    """Entry of Find Similar Locations tool."""
    try:
        fsl_tool = FSLTool(TASK_NAME, output_name_index=5, context_index=6,
                           version=version)
        fsl_tool.run()
    except Exception as err:
        # Show error messages associated with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()
