"""
 summarizewithin_dt.py
 
 Front end of "Summarize Within" analysis tool.

"""
# pyright: reportUnboundVariable=false
import logging

import arcpy

from common import (DTPATool, PAFeatureLayer, PAOutputFeatureLayer, LogUtils,
                    PALayerUtils, PAErrorProcessor, IntermCleanMixin,
                    ParameterUnpackMixin)
from stcore import SWExecutor, SummaryFieldUtils, SummaryInputValidateMixin
from stcore import sw_error_codes as ERROR_CODES

LOGGER = LogUtils.setup_logger(__name__)

TASK_NAME = "SummarizeWithin"


class SWDTTool(DTPATool, ParameterUnpackMixin, IntermCleanMixin):
    """Module with core logic of SummarizeWithin dekstop tool."""

    def get_parameters(self):
        """Implement the abstract function of get_parameters."""
        self.interm_outputs = []
        (sb_lyr_val, summary_lyr_val, out_lyr_path) = self.unpack(param_indexes=[0, 1, 2],
                                                                  as_text=True)
        summary_bound_lyr = PAFeatureLayer(sb_lyr_val, metadata={"parameterDataType": "Feature Set",
                                                                 "parameterName": "sumWithinLayer"})
        summary_lyr = PAFeatureLayer(summary_lyr_val, metadata={"parameterDataType": "Feature Set",
                                                                "parameterName": "summaryLayer"})
        if "multipoint" in summary_lyr.shapeType.lower():
            summary_lyr = PALayerUtils.convert_multiparts_to_single(summary_lyr,
                                                                    wrap_output_as_layer=True)
            self.interm_outputs.append(summary_lyr.data)
        if not SummaryInputValidateMixin.validate_dt_output(out_lyr_path):
            raise SystemExit
        output_lyr = PAOutputFeatureLayer(out_lyr_path)

        (keep_empty_boundary, count_length_area) = self.unpack(param_indexes=[3, 5],
                                                               as_text=False)
        (summary_fields, length_area_units, groupby_field) = self.unpack(param_indexes=[4, 6, 7],
                                                                         as_text=True)
        if length_area_units:
            length_area_units = length_area_units.replace(" ", "")

        if summary_fields.strip() != "":
            summary_fields = SummaryFieldUtils.convert_summaryfields_toarray(summary_fields) 
        else:
            summary_fields = None

        if groupby_field.strip() == "":
            groupby_field = None

        if groupby_field:
            (min_majority, percent_shp, grp_summary) = self.unpack(param_indexes=[8, 9, 10],
                                                                   as_text=[False, False, True])
        else:
            (min_majority, percent_shp, grp_summary) = (False, False, None)

        if percent_shp or min_majority:
            count_length_area = True

        group_summary_output = PAOutputFeatureLayer(grp_summary) if grp_summary else None
        self.executor = SWExecutor(summary_lyr, summary_bound_lyr, output_lyr,
                                   group_summary_output, summary_fields, groupby_field,
                                   calc_minority_majority=min_majority,
                                   calc_percent_shape=percent_shp,
                                   keep_boundaries_with_no_features=keep_empty_boundary,
                                   sum_shape=count_length_area,
                                   shp_stat_unit=length_area_units,
                                   call_from_desktop=True)

    def run(self):
        self.executor.execute()
        if self.executor.output_lyr.count == 0:
            LOGGER.warning("000117", extra={"message_ID": "000117"})


if __name__ == "__main__":
    tool_initialized = False

    try:
        sw_tool = SWDTTool(TASK_NAME)
        tool_initialized = True
        sw_tool.run()
    except Exception as err:
        # Clean the output if the tool execution failed
        if tool_initialized:
            if sw_tool.executor.output_lyr and arcpy.Exists(sw_tool.executor.output_lyr.data):
                sw_tool.interm_outputs.append(sw_tool.executor.output_lyr.data)
            if sw_tool.executor.groupby_stat_output and arcpy.Exists(sw_tool.executor.groupby_stat_output.data):
                sw_tool.interm_outputs.append(sw_tool.executor.groupby_stat_output.data)
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err, log_tool_failure=True).process()
    finally:
        if tool_initialized:
            sw_tool.clean()
