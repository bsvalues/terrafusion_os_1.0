"""
 summarizenearby_dt.py
 
 Front end of "Summarize Nearby" analysis tool.

"""
# pyright: reportUnboundVariable=false
import logging

import arcpy

from common import (DTPATool, PAFeatureLayer, PAOutputFeatureLayer, LogUtils,
                    PALayerUtils, PAErrorProcessor, PrivilegeCheckMixin,
                    ParameterUnpackMixin, IntermCleanMixin)
from stcore import SNExecutor, SummaryFieldUtils, SummaryInputValidateMixin
from stcore import sn_error_codes as ERROR_CODES


LOGGER = LogUtils.setup_logger(__name__)
NA_PRIVILEGE = "premium:user:networkanalysis"
TASK_NAME = "SummarizeNearby"


class SNDTTool(DTPATool, ParameterUnpackMixin, IntermCleanMixin):
    """Module with core logic of SummarizeWithin dekstop tool."""
    NEARBY_MODE = {"DRIVING_TIME": "Driving",
                   "DRIVING_DISTANCE": "Driving",
                   "TRUCKING_TIME": "Trucking",
                   "TRUCKING_DISTANCE": "Trucking",
                   "WALKING_TIME": "Walking",
                   "WALKING_DISTANCE": "Walking",
                   "STRAIGHT_LINE": "straightline"}

    def check_na_service(self, near_type: str) -> bool:
        """Check if the logistics service is usable."""
        if near_type.lower() != "straight_line":
            if "www.arcgis.com" not in arcpy.GetActivePortalURL():
                LOGGER.error(1738, extra={"message_ID": 1738})
                return False
            token_json = arcpy.GetSigninToken()
            if token_json:
                if not PrivilegeCheckMixin.check_agol_privilge(NA_PRIVILEGE,
                                                               token_json["token"],
                                                               token_json["referer"]):
                    LOGGER.error(100111, extra={"message_ID": 100111})
                    return False
            else:
                LOGGER.error(1738, extra={"message_ID": 1738})
                return False

        return True

    def get_parameters(self):
        near_type = self.unpack(param_indexes=[3], as_text=True)[0]
        LOGGER.debug(f"near_type: {near_type}")
        if not self.check_na_service(near_type):
            raise SystemExit
        self.interm_outputs = []
        (nb_layer_val, summary_layer_val, out_lyr_path) = self.unpack(param_indexes=[0, 1, 2],
                                                                      as_text=True)
        nearby_layer = PAFeatureLayer(nb_layer_val,
                                      metadata={"parameterDataType": "Feature Set",
                                                "parameterName": "nearbyLayer"})
        summary_layer = PAFeatureLayer(summary_layer_val,
                                       metadata={"parameterDataType": "Feature Set",
                                                 "parameterName": "summaryLayer"})
        if "multipoint" in summary_layer.shapeType.lower():
            summary_layer = PALayerUtils.convert_multiparts_to_single(summary_layer,
                                                                      wrap_output_as_layer=True)
            self.interm_outputs.append(summary_layer.data)

        if not SummaryInputValidateMixin.validate_dt_output(out_lyr_path):
            raise SystemExit

        output_lyr = PAOutputFeatureLayer(out_lyr_path)

        (distances, time_of_day, keep_empty_boundaries, sum_shape) = self.unpack(param_indexes=[4, 6, 8, 10],
                                                                                 as_text=False)
        (units, timezone_tof, summary_fields, sum_units, gb_field) = self.unpack(param_indexes=[5, 7, 9, 11, 12],
                                                                                 as_text=True)
        if timezone_tof.lower() == "geolocal":
            timezone_tof = "GeoLocal"

        if summary_fields:
            summary_fields = SummaryFieldUtils.convert_summaryfields_toarray(summary_fields)
        else:
            summary_fields = None

        if gb_field:
            (min_maj, perc_shp, grp_summary) = self.unpack(param_indexes=[13, 14, 15],
                                                           as_text=[False, False, True])
        else:
            (min_maj, perc_shp, grp_summary) = (False, False, "")

        if min_maj or perc_shp:
            sum_shape = True
        group_summary_output = PAOutputFeatureLayer(grp_summary) if grp_summary else None
        near_type = self.NEARBY_MODE.get(near_type.upper())
        self.executor = SNExecutor(summary_layer, nearby_layer, output_lyr,
                                   group_summary_output,
                                   nearby_type=near_type,
                                   distances=distances,
                                   distance_units=units,
                                   summary_fields=summary_fields,
                                   groupby_field=gb_field,
                                   calc_minority_majority=min_maj,
                                   calc_percent_shape=perc_shp,
                                   shp_stat_unit=sum_units,
                                   sum_shape=sum_shape,
                                   return_boundaries=True,
                                   keep_boundaries_with_no_features=keep_empty_boundaries,
                                   time_of_day=time_of_day,
                                   time_zone_for_tof=timezone_tof,
                                   call_from_desktop=True)

    def run(self):
        self.executor.execute()
        if self.executor.output_lyr.count == 0:
            LOGGER.warning("000117", extra={"message_ID": "000117"})


if __name__ == "__main__":
    tool_initialized = False

    try:
        sn_tool = SNDTTool(TASK_NAME)
        tool_initialized = True
        sn_tool.run()
    except Exception as err:
        if tool_initialized:
            if sn_tool.executor.output_lyr and arcpy.Exists(sn_tool.executor.output_lyr.data):
                sn_tool.interm_outputs.append(sn_tool.executor.output_lyr.data)
            if sn_tool.executor.groupby_stat_output and arcpy.Exists(sn_tool.executor.groupby_stat_output.data):
                sn_tool.interm_outputs.append(sn_tool.executor.groupby_stat_output.data)
        PAErrorProcessor(TASK_NAME, ERROR_CODES, err, log_tool_failure=True).process()
    finally:
        if tool_initialized:
            sn_tool.clean()
