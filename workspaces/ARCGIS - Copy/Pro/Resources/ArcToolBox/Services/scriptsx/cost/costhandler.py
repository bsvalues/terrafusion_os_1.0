"""Module in charge of calculate cost."""
# no-qa. pylint: disable=logging-format-interpolation
# no-qa. layer parameter input value type. pylint: disable=invalid-name
# no-qa. pylint: disable=unbalanced-tuple-unpacking
# noqa. pylint: disable=import-error
import json
from abc import ABC, abstractmethod
from typing import Union, Optional, List, Dict

import requests
import urllib3
import arcpy

from common import PAFeatureLayer, RemoteToolboxUtils, LogUtils, COST_KEY, PAOutputFeatureLayer
from .featurecountcalc import (FeatServiceCountCalculator, FeatCollectionCountCalculator,
                               TessellFeatCountCalculator, ELFeatCountCalculator,
                               H3HexagonFeatCountCalculator, CatalogPathCountCalculator)

BASESTRING = (str, bytes)
LOGGER = LogUtils.setup_logger(__name__)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)  # type: ignore

RECORD_COUNT_KEY = 'totalRecords'
MAX_COST_KEY = 'maximumCost'
FEATSERVICE_KEY = 'url'
FEATCOLL_KEY = 'featureSet'
CPATH_KEY = 'catalogPath'

PARAM_VALUE_TYPE = Optional[Union[Dict, List, str, float, int, PAFeatureLayer]]
LAYER_PARAM_TYPE = Union[int, Dict, List]

__all__ = ["Parameter", "TaskCostHandler", "DefaultHandler", "EDHandler", "SNHandler", "FNHandler",
           "CDTAHandler", "COTDHandler", "PRHandler", "CBFHandler", "GTHandler", "APHandler", "SWHandler",
           "CTAHandler"]


class Parameter:
    """Class module used to store the values of a certain parameter.

    Attributes
    ----------
        name : 'str'
            name of the parameter.
        param_type : 'str'
            type of the parameter (can only be one of the SUPPORTED_TYPES).
        optional : 'bool'
            True if the parameter is optional and False if it is required.
        multiple_values : 'bool'
            True if the parameter has multiple values (so value property is a []) and False otherwise.
        value : 'Any'
            Value of the parameter.

    """

    # Currently supported types of Parameter.
    SUPPORTED_TYPES = ['layer', 'context', 'extent', 'double', 'string', 'long']

    def __init__(self, name: str, param_type: str,
                 param_value: PARAM_VALUE_TYPE, optional: bool = False,
                 multiple_values: bool = False):
        """Initialize the parameter object's properties.

        Args:
            name: name of the parameter.
            param_type: a string with the type of the parameter. Can only be one of the SUPPORTED_TYPES.
            param_value: value of the parameter.
            optional: a boolean indicating whether the parameter is optional or not for the tool.
            multiple_values: a boolean indicating whether the parameter could contain multiple values. The value of the
            parameter is a list if multiple_values is true.
        Returns:
            No return.
        Raises:
            GPEXT_002 if failed to parse the value and the value is not optional.

        """
        self.name = name
        self.param_type = param_type.lower()
        if self.param_type not in self.SUPPORTED_TYPES:
            LOGGER.error('Unsupported param_type of {}'.format(type))
            raise ValueError

        self.optional = optional
        self.multiple_values = multiple_values
        self.value = self.parse(param_value)

        if (self.value is None or self.value == []) and not self.optional:
            LOGGER.error('002', extra={"message_ID": '002', 'name': self.name})
            raise AttributeError

    def __bool__(self):
        """Overwrite the __bool__ metamethod so to make the check of if an object is empty work."""
        if self.value is None or self.value == []:
            return False
        return True

    def parse(self, content: PARAM_VALUE_TYPE) -> PARAM_VALUE_TYPE:
        """Parse the content to the value property.

        Args:
            content: the parameter value to parse.
        Returns:
            A list if this parameter contains multiple values. Otherwise, the value property can be: 1) a dictionary
            if the parameter type is layer, context, or extent; 2) a string if the parameter type is a string; and 3)
            int if the parameter type is long; and 4) float if the parameter type is double.

        """
        # If parameter is multiple_values, then value property is a list.
        try:
            if self.multiple_values and isinstance(content, int):
                return content
            elif self.multiple_values and isinstance(content, list):
                values = []
                for content_item in content:
                    values.append(self._parse(content_item))
                return values
            elif self.multiple_values and isinstance(content, BASESTRING):
                content = json.loads(content)
                if isinstance(content, list):
                    values = []
                    for content_item in content:
                        values.append(self._parse(content_item))
                    return values
            else:
                return self._parse(content)
        except:  # noqa. pylint: disable=bare-except
            LOGGER.debug(f"Unable to parse {content}.")
            return None

    def _parse(self, content: PARAM_VALUE_TYPE) -> PARAM_VALUE_TYPE:
        """Convert the input to the desired type of value.

        Args:
            content: content of the parameter value (can be in different types (i.e., string, dict, etc...)).
        Returns:
            Value meets the parameter type.
        Raises:
            TypeError exception is raised if failed to convert the value to desired type.
            Malformed URL will be raised if the url failed to pass the verify_url function.
            ValueError exception is raised if no extent found from the context value dict.
            Error 900007 if param_type is not supported.

        """
        if content is None:
            return content

        if self.param_type == 'layer':
            # With layer type, the input_val can be a dict with key of "url", or a dict with key of "featureset", or
            # a dictionary with keys named count and shapeType.
            if isinstance(content, BASESTRING):
                content = json.loads(content)

            # Check if the url is valid
            if isinstance(content, dict) and 'url' in content:
                if not RemoteToolboxUtils.verify_url(content['url']):
                    LOGGER.error(f"Malformed URL of {content['url']}")
                    raise ValueError
            # unpack the PAFeatureLayer count and shapeType information
            elif isinstance(content, PAFeatureLayer) or isinstance(content, PAOutputFeatureLayer):
                shape_type = content.shapeType if hasattr(content, "shapeType") else ""  # type: ignore
                content = {"count": content.count, "shapeType": shape_type}  # type: ignore

            return content

        elif self.param_type.lower() == 'context':
            try:
                if isinstance(content, BASESTRING):
                    content = json.loads(content)
            except ValueError:
                LOGGER.debug("Unable to parse {} as context value. context value is set to None.".format(content))
                content = None

            LOGGER.debug("content: {}".format(content))

            # Sometimes context is used to save some other values not only for extent. Relax the check and set content
            # to None so it won't fail the following analysis.
            if not isinstance(content, dict) or "extent" not in content:
                LOGGER.debug('Unusable context: {} for credit estimation.'.format(content))
                content = None

            # The value of context type _Parameter is a dict with at least one key of "extent"
            return content

        elif self.param_type.lower() == 'extent':
            if isinstance(content, BASESTRING):
                content = json.loads(content)

            if not isinstance(content, dict):
                # Relax the check.
                LOGGER.debug('Invalid extent value of {}.'.format(content))
                content = None

            # The value of context type _Parameter is a dict with at least one key of "extent"
            return content

        elif self.param_type == 'double':
            try:
                return float(content)  # type: ignore
            except ValueError:
                LOGGER.debug('Unable to convert {} to float'.format(content))
                return None

        elif self.param_type == 'long':
            try:
                return int(content)  # type: ignore
            except ValueError:
                LOGGER.debug('Unable to convert {} to long/int'.format(content))
                return None

        elif self.param_type.lower() == 'string':
            if isinstance(content, BASESTRING):
                return content
            elif isinstance(content, dict) or isinstance(content, list):
                return json.dumps(content, ensure_ascii=False)
            else:
                LOGGER.debug('Unable to convert {} to string'.format(content))
                return None

        else:
            LOGGER.error(900007, extra={"message_ID": 900007, 'type': self.param_type.lower()})


class TaskCostHandler(ABC):
    """Abstract class defining the interface of calculator for cost."""

    def __init__(self, task_name: str, base_multiplier: float, log_cost: bool,
                 report_cost: bool = False,
                 estimate_rus_charge: bool = False):
        """Unpack the parameters of cost_reporter.

        Args:
            cost_reporter: an instance of costReporter.
            base_multiplier: an float value with the base multiplier for all tool.
            log_cost: a boolean indicating whether to log the cost or not.
            report_cost: a boolean indicating whether to raise the cost as a warning.
            estimate_rus_charge: a boolean indicating whether to estimate only remote
            utility service charge.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.task_name = task_name
        self.base_multiplier = base_multiplier
        self.log_cost = log_cost
        # All the properties below will be filled when the CostHandlerFactory created an instance of CostHandler.
        self.parameters = []
        self.multiplier: Optional[float] = None
        self.description: str = ""
        self.info: Optional[dict] = None
        self.rep_cost = report_cost
        self.exact_cost = None
        self.estimate_rus_charge = estimate_rus_charge

    def get_parameters_by_type(self, parameter_type: str) -> Optional[List[Parameter]]:
        """Get the parameters of the reporter by type.

        Args:
            parameter_type: a string represents the type of the parameter.
        Returns:
            A list with each item as a Parameter.
        Raises:
            No exceptions.

        """
        parameters = []
        for parameter in self.parameters:
            if parameter.param_type == parameter_type.lower():
                parameters.append(parameter)
        return parameters if parameters else None

    def get_parameters_by_names(self, parameter_names: List[str]) -> List[Parameter]:
        """Get a list of parameters in the order of names.

        Args:
            parameter_names: a list with item as name of parameters to fetch.
        Returns:
            A list of Parameter instance. If a certain parameter name is not found, the item will be None.
        Raises:
            No exceptions.

        """
        params_dict = {}
        parameter_names = [x.lower() for x in parameter_names]
        for parameter in self.parameters:
            if parameter.name.lower() in parameter_names:
                params_dict[parameter.name.lower()] = parameter

        parameters = []
        for param_name in parameter_names:
            parameters.append(params_dict.get(param_name))

        return parameters

    def get_layer_feature_count(self, layer: Parameter, context: Optional[Parameter],
                                extent: Optional[Parameter] = None,
                                bin_type: Optional[str] = None,
                                bin_size: Optional[float] = None,
                                bin_size_unit: Optional[str] = None,
                                h3_resolution: Optional[int] = None) -> int:
        """Get the count of features within the context/extent. Count is the number of features within extent if
        extent is not None. Otherwise count is the number of features within context.

        Args:
            layer: an instance of Parameter with type of Layer.
            context: an instance of Parameter with type of context or None.
            extent: an instance of Parameter with type of extent or None.
            bin_type: a string specify the type of customed bin (i.e., Hexagon, Triangle etc.)
            bin_size: a float specify the size of the customed bin.
            bin_size_unit: a string specify the unit of the customed bin size.
            h3_resolution: resolution of the H3 hexagon.
        Returns:
            An integer with number of features within the desired extent. If the layer has multiple_values, the count
            is the total number of features for each layer value.
        Raises:
            AO_900003 if unable to get count of the layer.
            AO_100269 if both extent_layer and context is None and tessellation based count is calculated.

        """
        if layer and isinstance(layer.value, int):
            return layer.value

        context_value = context.value if context else None

        if bin_type:
            extent_layer = layer.value if layer else None
            if extent_layer is None and context_value is None:
                LOGGER.error(100269, extra={"message_ID": 100269})

            extent = extent_layer if extent_layer else context_value
            if bin_type.upper() != "H3_HEXAGON":
                return TessellFeatCountCalculator(extent, bin_type, bin_size, bin_size_unit).calc()
            else:
                return H3HexagonFeatCountCalculator(extent, h3_resolution).calc()
        else:
            extent_value = extent.value if extent else None

            if layer.multiple_values:
                tot_count = 0
                for layer_value in layer.value:  # type: ignore
                    tot_count += self.query_layer_feature_count(layer_value, context_value, extent_value)  # type: ignore
                return tot_count
            else:
                return self.query_layer_feature_count(layer.value, context_value, extent_value)  # type: ignore

    def query_layer_feature_count(self, layer_value: LAYER_PARAM_TYPE, context_value: Optional[Dict],
                                  extent_value: Optional[Dict] = None) -> int:
        """Query the count of features of a certain layer within the context/extent.

        Args:
            layer_value: the value of the Layer Parameter.
            context_value: the value of the Context Parameter.
            extent: the value of the Extent parameter.
        Returns:
            An integer with the count of features based on query.
        Raises:
            No exceptions.

        """
        if isinstance(layer_value, int):
            return layer_value

        # json sent inside of tool in the old-school format {"count": 0, "shapeType": ""}
        if isinstance(layer_value, dict) and "count" in layer_value and "shapeType" in layer_value:
            return layer_value.get("count", 0)
        # dict sent for credits estimation.
        else:
            try:
                if isinstance(layer_value, dict) and FEATSERVICE_KEY in layer_value:
                    feature_count = FeatServiceCountCalculator(layer_value, context_value, extent_value).calc()
                elif isinstance(layer_value, dict) and FEATCOLL_KEY in layer_value:
                    feature_count = FeatCollectionCountCalculator(layer_value, context_value, extent_value).calc()
                elif isinstance(layer_value, dict) and CPATH_KEY in layer_value:
                    feature_count = CatalogPathCountCalculator(layer_value, context_value, extent_value).calc()
                else:
                    LOGGER.error("Malformed layer_value of {}".format(layer_value))
                    raise Exception

                if feature_count is None:
                    raise Exception

                return feature_count
            except Exception as err:  # noqa. pylint: disable=bare-except
                LOGGER.error(900003, extra={"message_ID": 900003, 'add_argument1': layer_value})
                raise Exception from err

    def get_cost(self, feature_count: int, multiplier: Optional[float] = None,
                 base_multiplier: Optional[float] = None) -> float:
        """Get cost from feature count.

        Args:
            feature_count: an integer represents the total # of features involved in the calculation.
            multiplier: a float to multiple the feature count.
            base_multiplier: a float of the base_mulitplier. Kept this parameter just in case during a certain period
            of time a discount will be applied to all tools.
        Returns:
            A float value represents the calculated cost.
        Raises:
            No exceptions.

        """
        multiplier = self.multiplier if multiplier is None else multiplier
        base_multiplier = self.base_multiplier if base_multiplier is None else base_multiplier
        if not multiplier:
            LOGGER.debug("multiplier can't be None.")
            raise RuntimeError
        cost = feature_count * multiplier * base_multiplier
        return float("{0:.3f}".format(cost))

    def report_cost(self, feature_count: Optional[int] = None):
        """Raise a warning message with the cost so it can be used by client app.

        Args:
            feature_count (int): the number of features to yield the cost.
            cost (Optional[float]): the total cost to yield.
        """
        if feature_count is None and self.exact_cost is None:
            LOGGER.debug("Unable to report cost.")
            res = {COST_KEY: -1}
        elif self.exact_cost is not None:
            res = {COST_KEY: self.exact_cost}
        else:
            res = {COST_KEY: self.get_cost(feature_count)}  # type: ignore
        LOGGER.warning(json.dumps(res))

    def log(self, execution_count: int, feature_count: int):
        """Log the cost to the database.

        Args:
            task_name: the name of the analysis tool.
            execution_count: an integer represents the number of executions.
            feature_count: the total # of features to log cost for.
        Returns:
            No returns.
        Raises:
            Cost log failed.

        """
        try:
            if feature_count < 0:
                LOGGER.error("Feature count to log should always be non-negative.")
                raise ValueError
            LOGGER.debug("{} has {} features to log.".format(self.task_name, feature_count))
            arcpy.gp._arc_object.LogUsageMetering(5555, self.task_name,  # noqa. pylint: disable=protected-access
                                                  execution_count, float(feature_count))
            if self.rep_cost:
                self.report_cost(feature_count)
        except Exception as err:
            LOGGER.error("LogCost failed due to {}".format(str(err)))
            raise arcpy.ExecuteError

    @abstractmethod
    def handle(self):
        """Process (either estimate or log) the cost of the task based on the parameters.

        Args:
            No arguments.
        Returns:
            A json string with the total # of features and cost if no need to log the cost.
        Raises:
            No exceptions.

        """
        raise NotImplementedError


class DefaultHandler(TaskCostHandler):
    """Default cost handler."""

    def handle(self):
        """Process the cost in default way."""
        context = self.get_parameters_by_names(["context"])[0]
        layers = self.get_parameters_by_type("layer")

        feature_count = 0
        if layers:
            for lyr in layers:  # noqa. pylint: disable=not-an-iterable
                feature_count += self.get_layer_feature_count(lyr, context)

        if self.log_cost:
            self.log(1, feature_count)
            return
        cost = self.get_cost(feature_count)
        return json.dumps({RECORD_COUNT_KEY: feature_count,
                           COST_KEY: cost})


class EDHandler(TaskCostHandler):
    """Cost handler of ExtractData."""

    def handle(self):
        """Process the cost with the ExtractData logic."""
        (context, drawing_extent, input_layers) = self.get_parameters_by_names(["context", "Extent", "InputLayers"])

        # Check if the context is valid
        if context and context.value:
            tmp_extent = context.value.get("extent")  # type: ignore
            # return 0 if the extent is not a polygon.
            if tmp_extent and not drawing_extent:
                if tmp_extent["xmin"] == tmp_extent["xmax"] or tmp_extent["ymin"] == tmp_extent["ymax"]:
                    return json.dumps({RECORD_COUNT_KEY: 0, COST_KEY: 0.000})
        feature_count = self.get_layer_feature_count(input_layers, context, drawing_extent)

        if self.log_cost:
            self.log(1, feature_count)
            return

        cost = self.get_cost(feature_count)
        return json.dumps({RECORD_COUNT_KEY: feature_count, COST_KEY: cost})


class SNHandler(TaskCostHandler):
    """Cost handler of summarizeNearby"""

    def handle(self):
        """Process the cost with the summarizeNearby logic."""
        params = self.get_parameters_by_names(["sumnearbylayer", "summarylayer", "nearType", "distances", "context"])
        (sum_nearby_lyr, summary_lyr, near_type, distances, context) = params

        if self.log_cost:
            # Only log the cost for the analysis side
            try:
                nb_fcnt = self.get_layer_feature_count(sum_nearby_lyr, context)
            except Exception as err:
                nb_fcnt = 0
                LOGGER.debug("Unable to get the nearby layer feature count.")
            tot_sum = self.get_layer_feature_count(summary_lyr, context) + nb_fcnt
            self.log(1, tot_sum)
            return

        tot_sum_near = self.get_layer_feature_count(sum_nearby_lyr, context)

        if near_type.value.lower() == 'straightline':  # type: ignore
            if self.estimate_rus_charge:
                return json.dumps({RECORD_COUNT_KEY: 0, COST_KEY: 0})
            if summary_lyr is None:
                LOGGER.error('002', extra={"message_ID": "002", "add_argument1": "summaryLayer"})
                raise Exception

            tot_sum = self.get_layer_feature_count(summary_lyr, context)
            cost = self.get_cost(tot_sum + tot_sum_near)
            return json.dumps({RECORD_COUNT_KEY: tot_sum + tot_sum_near, COST_KEY: cost})
        else:
            if distances is None:
                LOGGER.error('002', extra={"message_ID": "002", "add_argument1": "distances"})
                raise Exception

            dist_count = len(distances.value)  # type: ignore
            namultiplier = self.info.get('namultiplier') if self.info else None
            if not namultiplier:
                LOGGER.error('003', extra={"message_ID": "003", "add_argument1": "info",
                                           "add_argument2": "namultiplier"})
                raise Exception
            # Set feature count to tot_sum_near * dist_count since cost is multiplied together.
            cost = self.get_cost(tot_sum_near * dist_count, namultiplier)
            return json.dumps({RECORD_COUNT_KEY: tot_sum_near, MAX_COST_KEY: cost})


class FNHandler(TaskCostHandler):
    """Cost handler of FindNearest."""

    def handle(self):
        """Logic of handling cost related with FindNearest tool."""
        parameters = self.get_parameters_by_names(["analysislayer", "nearlayer", "measurementtype",
                                                   "maxcount", "context"])
        (analysis_lyr, near_lyr, measurement_type, max_count_param, context) = parameters
        if measurement_type is not None and measurement_type.value is None:
            measurement_type.value = "StraightLine"

        max_count = -1

        if max_count_param:
            max_count = max_count_param.value

        # Log the cost as 0 if measurement_type is not StraightLine (cost has been logged on NA server).
        if self.log_cost and measurement_type.value.lower() != "straightline":  # type: ignore
            self.log(1, 0)
            return

        namultiplier = self.info.get('namultiplier') if self.info else None
        if not namultiplier:
            LOGGER.error('003', extra={"message_ID": "003", "add_argument1": "namultiplier"})
            raise KeyError

        tot_ana = self.get_layer_feature_count(analysis_lyr, context)

        if measurement_type.value.lower() != 'straightline':  # type: ignore
            tot_near = self.get_layer_feature_count(near_lyr, context)
            if max_count != -1:
                num_routes = min(max_count_param.value, tot_near) * tot_ana  # type: ignore
            else:
                # tot_near can not be more than 100.
                num_routes = min(tot_near, 100) * tot_ana
            # cost = (tot_ana + tot_near) * cost_report.multiplier * cost_report.base_multiplier
            cost = self.get_cost(num_routes, namultiplier)  # type: ignore
            return json.dumps({RECORD_COUNT_KEY: (tot_ana + tot_near),
                               MAX_COST_KEY: cost})
        else:
            if self.estimate_rus_charge:
                return json.dumps({RECORD_COUNT_KEY: 0, COST_KEY: 0})
            tot_near = self.get_layer_feature_count(near_lyr, context)
            if self.log_cost:
                self.log(1, tot_ana + tot_near)
                return
            cost = self.get_cost(tot_ana + tot_near)
            return json.dumps({RECORD_COUNT_KEY: (tot_ana + tot_near),
                               COST_KEY: cost})


class CDTAHandler(TaskCostHandler):
    """Cost handler of CreateDriveTimeArea."""

    def handle(self):
        """Handle the cost of CreateDriveTimeArea tool."""
        # No need to log the cost in tools. Cost has been logged in NA server.
        if self.log_cost:
            self.log(1, 0)
            return

        (input_layer, context, break_values) = self.get_parameters_by_names(["inputlayer", "context", "breakvalues"])
        if not break_values:
            LOGGER.debug('Missing required BreakValues parameter! Default to 3 break values!')
            break_values = [0, 0, 0]
        else:
            break_values = break_values.value

        tot_rec = self.get_layer_feature_count(input_layer, context)
        cost = self.get_cost(tot_rec * len(break_values))  # type: ignore
        return json.dumps({RECORD_COUNT_KEY: tot_rec, MAX_COST_KEY: cost})


class COTDHandler(TaskCostHandler):
    """Cost handler of ConnectOriginsToDestinations."""

    def handle(self):
        """Handle cost of ConnectOriginsToDestinations."""
        (origin_lyr, dest_lyr, measure_type, context) = self.get_parameters_by_names(['originslayer',
                                                                                      'destinationslayer',
                                                                                      'measurementtype',
                                                                                      'context'])
        if measure_type and measure_type.value is None:
            measure_type.value = "DrivingTime"
            LOGGER.debug("measureType is missing and it is default to DrivingTime")

        origin_feat_count = self.get_layer_feature_count(origin_lyr, context)
        dest_feat_count = self.get_layer_feature_count(dest_lyr, context)

        if measure_type.value.lower() == 'straightline':  # type: ignore
            if self.estimate_rus_charge:
                return json.dumps({RECORD_COUNT_KEY: 0, COST_KEY: 0})
            if self.log_cost:
                self.log(1, origin_feat_count + dest_feat_count)
                return
            cost = self.get_cost(origin_feat_count + dest_feat_count)
            return json.dumps({RECORD_COUNT_KEY: origin_feat_count + dest_feat_count,
                               COST_KEY: cost})
        else:
            if self.log_cost:
                # Log cost as 0 at tool level. NA server has logged the cost already.
                self.log(1, 0)
                return

            orgmultiplier = self.info.get('namultiplier') if self.info else None
            if not orgmultiplier:
                LOGGER.error('003', extra={"message_ID": '003', "add_argument1": 'namultiplier'})
                raise KeyError

            cost = self.get_cost(max([origin_feat_count, dest_feat_count]), orgmultiplier)
            return json.dumps({RECORD_COUNT_KEY: max([origin_feat_count, dest_feat_count]),
                               MAX_COST_KEY: cost})


class PRHandler(TaskCostHandler):
    """Cost handler of PlanRoutes"""

    def handle(self):
        """Handle the cost of PlanRoutes."""
        if self.log_cost:
            self.log(1, 0)
            return

        route_count_param = self.get_parameters_by_names(["routecount"])[0]
        if not route_count_param:
            route_count = 0
            LOGGER.debug('Failed to get routeCount from info! routeCount default to 0!')
        else:
            route_count = route_count_param.value
        cost = self.get_cost(route_count)  # type: ignore
        return json.dumps({RECORD_COUNT_KEY: route_count, MAX_COST_KEY: cost})


class CBFHandler(TaskCostHandler):
    """Cost handler of ChooseBestFacilities."""

    def handle(self):
        """Handle the cost of ChooseBestFacilities."""
        # Log cost as 0 at tool level. Cost has been logged on NA server.
        if self.log_cost:
            self.log(1, 0)
            return

        (demand_loc_lyr, context) = self.get_parameters_by_names(["demandlocationslayer", "context"])

        demand_lyr_featcount = self.get_layer_feature_count(demand_loc_lyr, context)
        cost = self.get_cost(demand_lyr_featcount)
        return json.dumps({RECORD_COUNT_KEY: demand_lyr_featcount, MAX_COST_KEY: cost})


class ELHandler(TaskCostHandler):
    """Cost handler of EnrichLayer."""
    def verify_custom_geservice(self) -> bool:
        """Utility function used to check if the geoenrichment service is pointing to a customized service.

        Returns:
            True if the geoenrichment service is a customized service and False otherwise.
        """
        portal_desc = arcpy.GetPortalDescription()
        if isinstance(portal_desc, dict):
            helper_service = portal_desc.get("helperServices")
            if helper_service:
                ge_url = helper_service.get("geoenrichment", {}).get("url")
                if ge_url:
                    ge_url_parse_res = requests.utils.urlparse(ge_url)  # type: ignore
                    # Customized service should always be a proxy item
                    return not ge_url_parse_res.path.startswith("/arcgis")
        return False

    def handle(self):
        """Handle the cost of EnrichLayer."""
        # Log cost as 0 at tool level. Cost has been logged on EnrichLayer server.
        if self.log_cost:
            self.log(1, 0)
            return
        params = self.get_parameters_by_names(["inputlayer", "country", "datacollections", "analysisvariables",
                                               "buffertype", "context"])
        (input_layer, country, input_coll, ana_vars, buffer_type, context) = params

        input_coll = [] if not input_coll else input_coll.value
        ana_vars = [] if not ana_vars else ana_vars.value
        country = "" if not country else country.value
        buffer_type = "StraightLine" if not buffer_type else buffer_type.value

        totrecs = self.get_layer_feature_count(input_layer, context)

        if input_coll:
            var_count = ELFeatCountCalculator(country, input_coll).calc()  # type: ignore
        else:
            var_count = 0

        var_count += len(ana_vars)  # type: ignore
        custom_ge_service = self.verify_custom_geservice()
        cost = 0 if custom_ge_service else self.get_cost(totrecs * var_count)

        if buffer_type != 'StraightLine':
            namultiplier = self.info.get('namultiplier', 1.0) if self.info else 1.0
            nacost = namultiplier * totrecs
            cost += nacost
            res = {RECORD_COUNT_KEY: totrecs,
                   MAX_COST_KEY: cost}
        else:
            res = {RECORD_COUNT_KEY: totrecs,
                   COST_KEY: cost}

        if custom_ge_service:
            res["additionalInfo"] = {"messages": [{"messageCode": "AO_100286",
                                                   "message": "Credit estimate is based on the use of a custom GeoEnrichment service."}]}
        return json.dumps(res)


class GTHandler(TaskCostHandler):
    """Cost handler of GenerateTessellations."""

    def handle(self):
        """Handle cost of GenerateTessellations."""
        parameters = self.get_parameters_by_names(["extentlayer", "context", "tessellationlayer", "bintype",
                                                   "binsize", "binsizeunit", "binresolution"])
        (extent_layer, context, tessellation_layer, bin_type, bin_size, bin_size_unit, bin_res) = parameters
        if bin_type:
            bin_type = bin_type.value
        if bin_size:
            bin_size = bin_size.value
        if bin_size_unit:
            bin_size_unit = bin_size_unit.value
        if bin_res:
            bin_res = bin_res.value
        
        # the following logic used when output has already been generated.
        if tessellation_layer:
            tessellation_count = self.get_layer_feature_count(tessellation_layer, context)
            if self.log_cost:
                self.log(1, tessellation_count)
                return
        else:
            if self.log_cost:
                LOGGER.error("Log cost can't be from tessellation prediction.")
                raise Exception
            tessellation_count = self.get_layer_feature_count(extent_layer, context, None, bin_type,
                                                              bin_size, bin_size_unit,
                                                              bin_res)

        cost = self.get_cost(tessellation_count)
        # H3_Hexagon feature count estimation is quite a ballpark and not garuanteed
        # to be more than what it actually cost
        ckey = COST_KEY if bin_type and bin_type.upper() == "H3_HEXAGON" else MAX_COST_KEY
        return json.dumps({RECORD_COUNT_KEY: tessellation_count,
                           ckey: cost})


class APHandler(TaskCostHandler):
    """Cost handler of AggregatePoints."""

    def handle(self):
        """Process the cost with the AggregatePoints logic."""
        parameters = self.get_parameters_by_names(["pointlayer", "polygonlayer", "bintype", "binsize",
                                                   "binsizeunit", "context"])

        (point_lyr, polygon_lyr, bin_type, bin_size, bin_size_unit, context) = parameters

        if bin_type:
            bin_type = bin_type.value
            bin_size = bin_size.value
            bin_size_unit = bin_size_unit.value

        point_lyr_count = self.get_layer_feature_count(point_lyr, context)
        LOGGER.debug(f"point_lyr_count: {point_lyr_count}")
        if polygon_lyr:
            poly_lyr_count = self.get_layer_feature_count(polygon_lyr, context)
            total_count = point_lyr_count + poly_lyr_count
            cost_key = COST_KEY
            if self.log_cost:
                self.log(1, total_count)
                return
        else:
            if self.log_cost:
                LOGGER.error("Log cost can't be from tessellation prediction.")
                raise Exception
            tessellation_count = self.get_layer_feature_count(point_lyr, None, None,
                                                              bin_type, bin_size, bin_size_unit)  # type: ignore
            LOGGER.debug(f"tessellation_count: {tessellation_count}")
            total_count = point_lyr_count + tessellation_count
            cost_key = MAX_COST_KEY

        cost = self.get_cost(total_count)
        return json.dumps({RECORD_COUNT_KEY: total_count, cost_key: cost})


class SWHandler(TaskCostHandler):
    """Cost handler of SummarizeWithin."""

    def handle(self):
        """Handle cost of SummarizeWithin."""
        params = self.get_parameters_by_names(["summarylayer", "sumwithinlayer", "bintype", "binsize",
                                               "binsizeunit", "context"])
        (summary_layer, summary_within_layer, bin_type, bin_size, bin_size_unit, context) = params
        if bin_type:
            bin_type = bin_type.value
            bin_size = bin_size.value
            bin_size_unit = bin_size_unit.value

        summary_layer_featurecount = self.get_layer_feature_count(summary_layer, context)
        LOGGER.debug(f"summary_layer_featurecount: {summary_layer_featurecount}")
        if summary_within_layer:
            total_count = self.get_layer_feature_count(summary_within_layer, context) + summary_layer_featurecount
            cost_key = COST_KEY
            if self.log_cost:
                self.log(1, total_count)
                return
        else:
            if self.log_cost:
                LOGGER.error("Log cost can't be from tessellation prediction.")
                raise Exception
            tessellation_count = self.get_layer_feature_count(summary_layer, context, None,
                                                              bin_type, bin_size, bin_size_unit)  # type: ignore
            LOGGER.debug(f"tessellation_count: {tessellation_count}")
            cost_key = MAX_COST_KEY
            total_count = summary_layer_featurecount + tessellation_count
        cost = self.get_cost(total_count)
        return json.dumps({RECORD_COUNT_KEY: total_count, cost_key: cost})


class CTAHandler(TaskCostHandler):
    """Cost handler of CreateThresholdAreas."""

    def handle(self):
        """Handle the cost of CreateThresholdAreas tool."""
        # No need to log the cost in tools since it will be charged in remote service
        if self.log_cost:
            self.log(1, 0)
            return

        (input_layer, context) = self.get_parameters_by_names(["inputLayer", "context"])
        tot_rec = self.get_layer_feature_count(input_layer, context)
        cost = self.get_cost(tot_rec)
        return json.dumps({RECORD_COUNT_KEY: tot_rec, MAX_COST_KEY: cost})


class NoCostHandler(TaskCostHandler):
    """Cost handler of free tools (i.e., CV, CW, and TD)."""

    def handle(self):
        """Handle the cost of free tools."""
        if self.log_cost:
            self.log(1, 0)
            return
        context = self.get_parameters_by_names(["context"])[0]
        layers = self.get_parameters_by_type("layer")

        feature_count = 0
        for lyr in layers:  # type: ignore
            feature_count += self.get_layer_feature_count(lyr, context)
        return json.dumps({RECORD_COUNT_KEY: feature_count, COST_KEY: 0})
