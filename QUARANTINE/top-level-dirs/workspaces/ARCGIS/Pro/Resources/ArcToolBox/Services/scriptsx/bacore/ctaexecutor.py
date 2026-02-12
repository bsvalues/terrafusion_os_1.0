"""CreateThresholdArea core logic executor."""
# import from common package. noqa. pylint: disable=import-error
import json
from json import JSONDecodeError
from typing import Optional
import re

import arcpy
import arcpy.ba


from common import LogUtils, PAExecutor, PAFeatureLayer, PAOutputFeatureLayer

LOGGER = LogUtils.setup_logger(__name__)


class CTAExecutor(PAExecutor):
    """Core logic for the CreateThresholdArea tool."""
    def __init__(
        self,
        input_layer: PAFeatureLayer,
        output_layer: PAOutputFeatureLayer,
        threshold_variable: str,
        threshold_vals: Optional[str],
        threshold_expression: Optional[str],
        dist_type: str,
        dist_units: Optional[str],
        id_field: Optional[str],
        travel_direction: Optional[str],
        tod: Optional[str],
        timezone_for_tod: Optional[str],
        polygon_detail: Optional[str],
        max_iterations: Optional[str],
        min_step: Optional[str],
        target_perc_diff: Optional[str],
        use_data: Optional[str]
    ):
        self.input_layer = input_layer
        self.output_layer = output_layer
        self.threshold_variable = threshold_variable
        self.threshold_vals = threshold_vals
        self.threshold_expression = threshold_expression
        self.dist_type = dist_type
        self.dist_units = dist_units
        self.id_field = id_field
        self.travel_direction = travel_direction
        self.tod = tod
        self.timezone_for_tod = timezone_for_tod
        self.poly_detail = polygon_detail
        self.max_iterations = max_iterations
        self.min_step = min_step
        self.target_perc_diff = target_perc_diff
        self.use_data = use_data

    def validate_parameters(self) -> bool:
        """Validate input parameters."""
        return True

    def execute(self):
        try:
            dataSource = r"ONLINE;"

            if self.use_data:
                try:
                    use_data_json = json.loads(self.use_data)
                except:
                    raise Exception("Invalid parameter 'UseData'")

                if "sourceCountry" in use_data_json:
                    dataSource += use_data_json["sourceCountry"]

                    if "hierarchy" in use_data_json:
                        dataSource += "|" + use_data_json["hierarchy"]

                    dataSource += ";"

            arcpy.env.baDataSource = dataSource  # type: ignore

            LOGGER.debug("Signin token: {}".format(arcpy.GetSigninToken()))
            """
                distance_type_name referenced by its Name in portal TravelModes                
            """

            if self.dist_type.lower() == "straightline":
                distance_type_name = "straightline"
            else:
                distance_type_json = json.loads(self.dist_type)
                if "Name" in distance_type_json:
                    distance_type_name = distance_type_json["Name"]
                elif "name" in distance_type_json:
                    distance_type_name = distance_type_json["name"]
                else:
                    LOGGER.error(100219, extra={"message_ID": 100219, "paramName": "Distance Type"})
                    raise Exception("Invalid parameter 'DistanceType'")

            input_method = "VALUES"
            if self.threshold_expression:
                input_method = "EXPRESSION"

            if self.travel_direction == "FromFacility":
                travel_direction = "AWAY_FROM_STORES"
            else: # self.travel_direction == "ToFacility":
                travel_direction = "TOWARD_STORES"

            if self.timezone_for_tod == "UTC":
                timeZone = "UTC"
            else:  #self.timezone_for_tod == "GeoLocal":
                timeZone = "TIME_ZONE_AT_LOCATION"

            if distance_type_name.lower() == "straightline":
                LOGGER.debug(f"arcpy.ba.GenerateThresholdRingTradeArea(in_features='{self.input_layer.layer}', "
                             f"out_feature_class='{self.output_layer.data}', threshold_variable='{self.threshold_variable}', "
                             f"threshold_values={self.threshold_vals}, units='{self.dist_units}', id_field='{self.id_field}', "
                             f"minimum_step='{self.min_step}', target_percent_diff='{self.target_perc_diff}', "
                             f"input_method='{input_method}', expression='{self.threshold_expression}')")
                arcpy.ba.GenerateThresholdRingTradeArea(in_features=self.input_layer.layer,
                                                        out_feature_class=self.output_layer.data,
                                                        threshold_variable=self.threshold_variable,
                                                        threshold_values=self.threshold_vals,
                                                        units=self.dist_units,
                                                        id_field=self.id_field,
                                                        minimum_step=self.min_step,
                                                        target_percent_diff=self.target_perc_diff,
                                                        input_method=input_method,
                                                        expression=self.threshold_expression)
            else:
                LOGGER.debug(f"arcpy.ba.GenerateThresholdDriveTimeTradeArea(in_features='{self.input_layer.layer}', "
                             f"out_feature_class='{self.output_layer.data}', threshold_variable='{self.threshold_variable}', "
                             f"threshold_values={self.threshold_vals}, distance_type='{distance_type_name}', "
                             f"units='{self.dist_units}', id_field='{self.id_field}', travel_direction='{travel_direction}', "
                             f"time_of_day='{self.tod}', time_zone='{timeZone}', search_tolerance=None, "
                             f"polygon_detail='{self.poly_detail}', iterations_limit='{self.max_iterations}', "
                             f"minimum_step='{self.min_step}', target_percent_diff='{self.target_perc_diff}', "
                             f"input_method='{input_method}', expression='{self.threshold_expression}')")
                arcpy.ba.GenerateThresholdDriveTimeTradeArea(in_features=self.input_layer.layer,
                                                             out_feature_class=self.output_layer.data,
                                                             threshold_variable=self.threshold_variable,
                                                             threshold_values=self.threshold_vals,
                                                             distance_type=distance_type_name,
                                                             units=self.dist_units,
                                                             id_field=self.id_field,
                                                             travel_direction=travel_direction,
                                                             time_of_day=self.tod,
                                                             time_zone=timeZone,
                                                             search_tolerance=None,
                                                             polygon_detail=self.poly_detail,
                                                             iterations_limit=self.max_iterations,
                                                             minimum_step=self.min_step,
                                                             target_percent_diff=self.target_perc_diff,
                                                             input_method=input_method,
                                                             expression=self.threshold_expression)

        except (JSONDecodeError, TypeError) as e:
            LOGGER.error(100219, extra={"message_ID": 100219, "paramName": "Distance Type"})
            raise e

        except Exception as e:

            message_count = arcpy.GetMessageCount()

            for i in range(message_count):
                return_code = int(arcpy.GetReturnCode(i))  # type: ignore
                message: str = arcpy.GetMessage(i)  # type: ignore

                if return_code == 800:
                    if "Driving Time" in message:
                        LOGGER.error(100310, extra={"message_ID": 100310})
                    elif "ToFacility" in message:
                        LOGGER.error(100309, extra={"message_ID": 100309})
                    elif "Minutes" in message:
                        LOGGER.error(100305, extra={"message_ID": 100305})
                    elif "GeoLocal" in message:
                        LOGGER.error(100311, extra={"message_ID": 100311})
                elif return_code == 892:
                    LOGGER.error(100308, extra={"message_ID": 100308})
                elif return_code == 2717:
                    LOGGER.error(100306, extra={"message_ID": 100306})
                elif return_code == 80332: # All polygons are empty. Reports cannot be generated.
                    LOGGER.error(100307, extra={"message_ID": 100307})
                elif return_code == 80435: # Failed to reach threshold values
                    LOGGER.error(100323, extra={"message_ID": 100323})
                elif return_code == 61039:  # Bad variable type
                    LOGGER.error(100324, extra={"message_ID": 100324})
                elif return_code == 80441: # No locations were found for input feature with OID %s.
                    # parse message to find out point Id
                    message_text = message.split(":", 2)[1] # remove "WARNING XXXX:" part
                    numbers = re.compile("\d+").findall(message_text)
                    pointId = numbers[0] if numbers else ""
                    LOGGER.warning(100325, extra={"message_ID": 100325, "pointId": pointId})
                elif return_code == 80431: # Radius is out of range for feature %s
                    # parse message to find out point Id
                    message_text = message.split(":", 2)[1] # remove "WARNING XXXX:" part
                    numbers = re.compile("\d+").findall(message_text)
                    pointId = numbers[0] if numbers else ""
                    LOGGER.warning(100326, extra={"message_ID": 100326, "pointId": pointId})
                else:
                    # Unknown Error
                    LOGGER.debug(message)

            raise e

