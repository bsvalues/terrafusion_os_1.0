"""CalculateCompositeIndex tool implementaion"""

import arcpy
from .cciexecutor import CCIExecutor
from .renderer import SpatialStatsRenderer
from common import (PATool, PAFeatureLayer, FeatureServiceLayerPublisher,
                    LogUtils, PAEnvironment,
                    ModelBuilderMixin,
                    AnalysisUtils,
                    PAErrorProcessor,
                    AOLUtils, ParameterUnpackMixin,
                    PALayerUtils)
from typing import Optional, Union, List, Dict
import json
import SSDataObject as SSDO


PARAM_NAMES = {
    "inputLayer": 0,
    "inputVariables": 1,
    "indexMethod": 2,
    "outputIndexReverse": 3,
    "outputIndexMinMax": 4,
    "outputName": 5,
    "context": 6,
    "indexResultLayer": 7,
    "processInfo": 8,
}

TASK_NAME = "CalculateCompositeIndex"
ERROR_CODES = [308, 401, 728, 735, 1585, 1589, 1599, 100358, 110498, 110500, 110501, 110508, 110511, 1105012, 230016]

LOGGER = LogUtils.setup_logger(__name__)

class CCITool(ParameterUnpackMixin, ModelBuilderMixin, PATool):
    """Implement the Calcuate Composite Index"""

    @classmethod
    def get_json_from_param(
        cls,
        parameter_index: int,
        param_name: str,
    ) -> Optional[Union[List, Dict]]:
        """Unpack json from parameter."""
        param_json = None
        param_val = arcpy.GetParameter(parameter_index)
        if not param_val:
            return param_json
        param_json = []
        # from version 2, this parameter becomes ValueTable
        if isinstance(param_val, arcpy.ValueTable):
            try:
                for row in range(param_val.rowCount):
                    tmp_json = {"field": param_val.getValue(row, 0),
                                "reverseVariable": param_val.getValue(row, 1),
                                "weight": float(param_val.getValue(row, 2))}
                    for existing_json in param_json:
                        if existing_json['field'] == tmp_json['field']:
                            LOGGER.error(110182, extra={'message_ID': 110182, "var_name": tmp_json['field']})
                            raise
                    #if tmp_json not in param_json:
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

    
    def _preprocess_min_max(self, min_max_param: List, param_name: str) -> List[List]:
        min_max_VT = min_max_param[0]
        min_val, max_val = None, None

        if min_max_VT.rowCount > 1:
            LOGGER.error(100245, extra={"message_ID": 100245,
                                            "paramName": param_name})
            raise

        try:
            min_val = min_max_VT.getValue(0, 0)
            if min_val in [None, '', '#']:
                min_val = None
            else:
                min_val = float(min_val)
        except:
            pass
            
        try:
            max_val = min_max_VT.getValue(0, 1)
            if max_val in [None, '', '#']:
                max_val = None
            else:
                max_val = float(max_val)
        except:
            pass

        if min_val is None and max_val is None:
            return None
        return [[min_val, max_val]]

    def get_parameters(self):
        """Unpack all the params"""
        input_layer = PAFeatureLayer(PARAM_NAMES['inputLayer'], metadata={'parameterDataType': "Record Set",
                                                                          'parameterName': "inputLayer"})
        local_input = AOLUtils.create_unique_name("localInput", arcpy.env.scratchGDB)
        local_layer = PALayerUtils.create_local_copy(input_layer, local_input, True)
        LOGGER.debug(f"Create the local input at {local_input}")
        if not input_layer.is_table_view:
            self.check_overwrite_sr(input_layer.spatialReference)
        # Get input parameters
        input_variables = self.get_json_from_param(PARAM_NAMES['inputVariables'], 'inputVariables')
        index_method = arcpy.GetParameterAsText(PARAM_NAMES['indexMethod'])
        output_index_reverse = arcpy.GetParameter(PARAM_NAMES['outputIndexReverse'])
        output_min_max_VT = self.unpack([PARAM_NAMES['outputIndexMinMax']], as_text=False)
        output_index_min_max = self._preprocess_min_max(output_min_max_VT, 'outputIndexMinMax')

        if self.is_running_in(PAEnvironment.MODELBUILDER):
            result_layer = AnalysisUtils.initialize_output_layer(specified_out_path=self.get_param_as_text(7))
        else:
            result_layer = AnalysisUtils.initialize_output_layer(input_layer.count,
                                                                "CompositeIndexOutput")
        
        self.executor : CCIExecutor = CCIExecutor(local_layer,
                                                  result_layer,
                                                  input_variables,
                                                  index_method,
                                                  output_index_reverse,
                                                  output_index_min_max)
        
        self.cost_parameters = {'inputLayer': input_layer}

    def log_usage_metering(self):
            """Log the usage metering."""
            values = [self.executor.input_layer.count,
                      self.output_name.output_cost]
            cost = self.executor.input_layer.count * 0.001
            LogUtils.log_usage(self.task_name, self.executor.output_layer.count, cost, values)

    
    def publish_outputs(self):
        """ Publish output as a feature service. """
        process_info = self.executor.process_info if self.is_running_in(PAEnvironment.MODELBUILDER) else None
        publisher = FeatureServiceLayerPublisher(self.output_name, tool_version=self.version,
                                                 process_info=process_info)
        publisher.add_layer_to_publish(self.executor.output_layer,
                                       PARAM_NAMES['indexResultLayer'],
                                       "IndexLayer", layer_index=0)
        publisher.publish()
        # add the process info
        if not self.is_running_in(PAEnvironment.MODELBUILDER):
            arcpy.SetParameterAsText(PARAM_NAMES['processInfo'], json.dumps(self.executor.process_info))

    def set_visualization(self):
        if not self.executor.input_layer.is_table_view:
            renderer = SpatialStatsRenderer.get_index_rendering_info(self.executor.output_layer)
            ssdo_temp = SSDO.SSDataObject(self.executor.output_layer.data)
            ssdo_temp.obtainData(None, ['INDEX_'])
            index_data = ssdo_temp.fields['INDEX_'].data
            lower_bound = index_data.min()
            upper_bound = index_data.max()
            renderer['renderer']['visualVariables'][0]['stops'][0]['value'] = lower_bound
            renderer['renderer']['visualVariables'][0]['stops'][0]['label'] = lower_bound

            delta = (upper_bound - lower_bound) / 8
            for i in range(1, 9):
                renderer['renderer']['visualVariables'][0]['stops'][i]['value'] = lower_bound + i * delta

            renderer['renderer']['visualVariables'][-1]['stops'][-1]['value'] = upper_bound
            renderer['renderer']['visualVariables'][-1]['stops'][-1]['label'] = upper_bound

            self.executor.output_layer.set_drawing(None, renderer)

def execute_tool(version: float):
    """Entry of Calculate Composite Index tool."""
    try:
        cci_tool = CCITool(TASK_NAME, output_name_index=5, context_index=6, version=version)
        cci_tool.run()
    except Exception as err:
        # Show error messages associated with the tool
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err).process()