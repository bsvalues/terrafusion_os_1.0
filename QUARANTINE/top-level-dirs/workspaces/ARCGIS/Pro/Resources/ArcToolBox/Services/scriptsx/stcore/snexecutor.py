"""Executor of SummarizeNearby."""
# using modules from common package. noqa. pylint: disable=import-error
from typing import Optional, List, Any

import arcpy
import arcpy.management

from common import (PAFeatureLayer, LogUtils, PAOutputFeatureLayer, ToolExit,
                    PALayerUtils, FieldUtils, AOLUtils)
from cbcore import RingBuffer, BufferUtils, SingleBuffer
from nacore import CDTAExecutor

from .stcommon import SummarizeExecutor, SummaryInputValidateMixin
from .statsutils import StatsCalculatorX


LOGGER = LogUtils.setup_logger(__name__)


class SNExecutor(SummaryInputValidateMixin, SummarizeExecutor):
    TRAVEL_MODE = {"drivingtime": "Driving",
                   "drivingdistance": "Driving",
                   "truckingtime": "Trucking",
                   "truckingdistance": "Trucking",
                   "walkingtime": "Walking",
                   "walkingdistance": "Walking"}
    TIME_NEAR_TYPES = ["drivingtime", "truckingtime", "walkingtime"]
    DISTANCE_NEAR_TYPES = ["straightline", "drivingdistance", "walkingdistance", "truckingdistance"]
    TIME_UNITS = ["Minutes", "Seconds", "Hours"]

    def __init__(self, summary_lyr: PAFeatureLayer,
                 nearby_lyr: PAFeatureLayer,
                 output_lyr: PAOutputFeatureLayer,
                 groupby_stat_output: Optional[PAOutputFeatureLayer],
                 nearby_type: str,
                 distances: List,
                 distance_units: str,
                 summary_fields: Optional[List],
                 groupby_field: Optional[str] = None,
                 calc_minority_majority: bool = False,
                 calc_percent_shape: bool = False,
                 shp_stat_unit: Optional[str] = None,
                 sum_shape: bool = True,
                 return_boundaries: bool = True,
                 keep_boundaries_with_no_features: bool = True,
                 time_of_day: Any = "",
                 time_zone_for_tof: str = "",
                 call_from_desktop: bool = False):
        """Executor of the SummarizeNearby tool.

        Args:
            summary_lyr (PAFeatureLayer): a PAFeatureLayer object to calculate summary from.
            nearby_lyr (PAFeatureLayer): a PAFeatureLayer object to generate boundary from.
            output_lyr (PAOutputFeatureLayer): a PAOutputFeatureLayer to save the summary output.
            groupby_stat_output (Optional[PAOutputFeatureLayer]): a PAOutputFeatureLayer to store the groupby stats.
            nearby_type (str): a string represents the measure of nearby type.
            distances (List): a list of numbers where each number represents a distance value.
            distance_units (str): units of the distance value.
            summary_fields (Optional[List]): a list of tuples where the first item is the name of the field and the
            second item is the type of stats to collect.
            groupby_field (Optional[str], optional): name of the groupby field.. Defaults to None.
            calc_minority_majority (bool, optional): True to calculate the minority and majority values based on the
            groupby field. Defaults to False.
            calc_percent_shape (bool, optional): True to calculate the percent shape of a certain groupby category
            within a certain summary boundary polygon. Defaults to False.
            shp_stat_unit (Optional[str], optional): unit for non-point geometry summary features geometry related
            summary value. Defaults to None.
            sum_shape (bool, optional): True to return shape related statistics and False otherwise. Defaults to True.
            return_boundaries (bool, optional): True to return the boundaries generated from the nearby layer as
            output, False to return the nearby layer itself. Defaults to True.
            keep_boundaries_with_no_features (bool, optional): True to keep all boundary features in the output even if
            there is no summary feature (point) fall into. False to only keep boundary features that have summary
            features fall within. Defaults to True.
            time_of_day (Any, optional): a datetime value represents the time of day of the traffic data to use.
            Defaults to "".
            time_zone_for_tof (str, optional): a string as an indication of whether to interpret the time_of_day
            parameter as GeoLocal (in the time zone of the points) or UTC.
        """
        super(SNExecutor, self).__init__(summary_lyr, None, output_lyr, groupby_stat_output,
                                         summary_fields, groupby_field, calc_minority_majority,
                                         calc_percent_shape, keep_boundaries_with_no_features,
                                         call_from_desktop=call_from_desktop)
        self.nearby_type = nearby_type
        self.distances = distances
        self.distance_units = distance_units
        self.shp_stat_units = shp_stat_unit
        self.sum_shape = sum_shape
        self.return_boundaries = return_boundaries
        self.nearby_layer = nearby_lyr
        self.time_of_day = time_of_day
        self.time_zone_for_tof = time_zone_for_tof
        self.wkspc = AOLUtils.get_output_wkspcx(self.nearby_layer.count * len(self.distances))
        self.join_field = None
        self.remote_task_cost = 0

    def generate_boundary_lyr(self):
        """Generate boundary based on the nearby layer.

        Raises:
            arcpy.ExecuteError: if failed in validating the parameters.
        """
        if not self.return_boundaries:
            temp_fc = AOLUtils.create_unique_name("tempFeatures", self.wkspc)
            self.nearby_layer = PALayerUtils.make_local_copy(self.nearby_layer, temp_fc, True, False)
        if self.nearby_type.lower() == "straightline":
            if len(self.distances) == 1:
                temp_fc = AOLUtils.create_unique_name("outPolyLayer", self.wkspc)
            else:
                # if need to do RingBuffer, hardwire to use the scratchGDB since
                # joinField is not working as expected for certain dataset.
                temp_fc = AOLUtils.create_unique_name("outPolyLayer", "scratchgdb")
            self.join_field = "ORIG_FID"
            calc_fields = True if self.return_boundaries else False
            params = {"input_layer": self.nearby_layer.layer, "output_layer": temp_fc,
                      "distance": self.distances,
                      "units": self.distance_units, "side_type": "FULL",
                      "end_type": "ROUND", "field": "",
                      "dissolve_type": None, "ring_type": "rings",
                      "calc_field": calc_fields, "geodesic": 1}
            if len(self.distances) == 1:
                params["distance"] = self.distances[0]
                SingleBuffer(**params).create()
            else:
                RingBuffer(**params).create()
            LOGGER.debug(f"Created buffer output at {temp_fc}")
            self.summary_boundary_lyr = PAFeatureLayer(temp_fc)
        else:
            self.join_field = "FacilityOID"
            if self.nearby_type.lower() in self.TRAVEL_MODE:
                travel_mode = self.TRAVEL_MODE[self.nearby_type.lower()]
            else:
                travel_mode = self.nearby_type
            LOGGER.debug(f"travel_mode: {travel_mode}")
            tz_tof = self.time_zone_for_tof if self.time_zone_for_tof else "GeoLocal"
            executor = CDTAExecutor(input_layer=self.nearby_layer,
                                    break_values=self.distances,
                                    break_units=self.distance_units,
                                    time_of_day=self.time_of_day,
                                    overlap_policy="Overlap",
                                    time_zone_for_time_of_day=tz_tof,
                                    travel_mode=travel_mode)
            if executor.validate_parameters():
                executor.execute()
                self.summary_boundary_lyr = executor.drive_time_areas_output
                LOGGER.debug(f"Boundary layer generated at {self.summary_boundary_lyr.data}")
                self.remote_task_cost = executor.task_cost
            else:
                LOGGER.debug("Invalid inputs for CreateDriveTimeAreas.")
                raise arcpy.ExecuteError

    def validate_parameters(self):
        """Validate parameters of the executor.

        Raises:
            AO_100043: if either nearby_type or distance_units is invalid.
            AO_100003: if the summary_boundary_lyr is invalid.
        """
        if self.nearby_type.lower() != "straightline" and "Point" not in self.nearby_layer.shapeType:
            LOGGER.error(100042, extra={"message_ID": 100042, "shapeType": self.nearby_layer.shapeType,
                                        "nearType": self.nearby_type})
            return False

        if (
            (self.nearby_type.lower() in self.TIME_NEAR_TYPES and self.distance_units not in self.TIME_UNITS)
            or (self.nearby_type.lower() in self.DISTANCE_NEAR_TYPES and self.distance_units in self.TIME_UNITS)
        ):
            LOGGER.error(100043, extra={"message_ID": 100043, "units": self.distance_units,
                                        "nearType": self.nearby_type})
            return False

        if not self.validate_sum_shape():
            return False

        try:
            self.generate_boundary_lyr()
        except Exception as err:
            LOGGER.debug(f"generate_boundary_lyr failed due to {str(err)}")
            LOGGER.error(110144, extra={"message_ID": 110144})
            return False

        if (
            (not self.validate_summary_boundary())
            or (not self.validate_summary_fields())
            or (not self.validate_groupby_field())
        ):
            return False

        return True

    def _update_field_info(self):
        """Update the field info after the output is generated."""
        if self.fields_info.shapeStatField:
            temp_name = FieldUtils.get_newest_fieldname(self.output_lyr.fields, self.fields_info.shapeStatField.name)
            self.fields_info.shapeStatField.name = temp_name  # type: ignore
        if self.fields_info.summaryFields:
            for finfo in self.fields_info.summaryFields:
                temp_name = FieldUtils.get_newest_fieldname(self.output_lyr.fields, finfo.name)
                finfo.name = temp_name  # type: ignore
        if self.fields_info.minMajorityFields:
            for i, mm_name in enumerate(self.fields_info.minMajorityFields):
                temp_name = FieldUtils.get_newest_fieldname(self.output_lyr.fields, mm_name)
                self.fields_info.minMajorityFields[i] = temp_name  # type: ignore
        if self.fields_info.layerJoinIDField:
            temp_name = FieldUtils.get_newest_fieldname(self.output_lyr.fields,
                                                        self.fields_info.layerJoinIDField)
            self.fields_info.layerJoinIDField = temp_name

    def post_process_stats_output(self):
        """Postprocess the output from the statistics calcultion. Specifically to remove the fields that is
        distance related if no need to return boundaries."""
        if self.return_boundaries:
            if self.join_field:
                try:
                    arcpy.management.DeleteField(self.output_lyr.data, [self.join_field])
                except arcpy.ExecuteError:
                    LOGGER.debug(f"Unable to delete {self.join_field}.")
        else:
            distance_fields = []
            if self.nearby_type.lower() == "straightline":
                distance_fields.append("BUFF_DIST")
                if len(self.distances) == 1:
                    BufferUtils.add_distance_field(self.output_lyr, self.distances[0], self.distance_units)
            else:
                distance_fields.extend(["FromBreak", "ToBreak"])
            if distance_fields:
                try:
                    arcpy.management.DeleteField(self.nearby_layer.data, distance_fields)
                except arcpy.ExecuteError:
                    LOGGER.debug(f"Unable to delete {distance_fields} from nearby_layer.")

            fields_to_join = distance_fields
            if self.fields_info.shapeStatField:
                LOGGER.debug(f"shapeStatField: {self.fields_info.shapeStatField.name}")
            count_field_included = False
            if self.fields_info.shapeStatField:
                fields_to_join.append(self.fields_info.shapeStatField.name)
                if self.fields_info.shapeStatField.name.lower().endswith("count"):
                    count_field_included = True

            if self.fields_info.summaryFields:
                tmp_fields = [fi.name for fi in self.fields_info.summaryFields if fi.name not in fields_to_join]
                fields_to_join.extend(tmp_fields)
                if not count_field_included:
                    for tfield in tmp_fields:
                        if tfield.lower().endswith("count"):
                            count_field_included = True

            if self.fields_info.minMajorityFields:
                tmp_fields = [fi for fi in self.fields_info.minMajorityFields if fi not in fields_to_join]
                fields_to_join.extend(tmp_fields)
            if self.fields_info.layerJoinIDField:
                fields_to_join.append(self.fields_info.layerJoinIDField)

            # check if there is a field for polyline_count or polygon_count
            # see https://devtopia.esri.com/WebGIS/arcgis-portal-analysis/issues/1135
            if not count_field_included:
                ofields = AOLUtils.list_fields(self.output_lyr.data)
                for tmp_field in ofields:
                    if tmp_field.name == "Polygon_Count" or tmp_field.name == "Polyline_Count":
                        fields_to_join.append(tmp_field.name)
                        break

            tmp_oid_field = self.nearby_layer.OIDFieldName
            LOGGER.debug(f"nearby_layer: {self.nearby_layer.data}")
            arcpy.management.JoinField(self.nearby_layer.data, tmp_oid_field, self.output_lyr.data,
                                       self.join_field, fields_to_join)
            # delete the boundary polygon since boundaries are not returned.
            try:
                arcpy.management.Delete(self.output_lyr.data)
            except arcpy.ExecuteError:
                LOGGER.debug(f"Unable to delete the boundary layer at {self.output_lyr.data}")
            self.output_lyr = PAOutputFeatureLayer(self.nearby_layer.data)

    def calculate_statistics(self):
        calculator = StatsCalculatorX(self.summary_lyr,
                                      self.summary_boundary_lyr,
                                      self.summary_fields,  # type: ignore
                                      self.groupby_field,
                                      self.keep_boundaries_with_no_features,
                                      self.output_lyr,
                                      self.groupby_stat_output,
                                      self.calc_minority_majority,
                                      self.calc_percent_shape,
                                      self.fields_info,
                                      self.shp_stat_units,
                                      self.sum_shape,
                                      call_from_desktop=self.call_from_desktop)
        try:
            calculator.calculate()
            self.post_process_stats_output()
        except Exception as err:
            LOGGER.debug("Failed to calculate statistics.")
            raise ToolExit from err
        finally:
            calculator.clean()
