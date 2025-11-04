"""---------------------------------------------------------------------------
Name:              CostReport.py
Purpose:           To estimate and report the credits taken for a certain
                   online analysis tool.
Author:            Esri Inc.
Created:           2/12/2018
Copyright:   (c)   Esri, Inc. 2012
ArcGIS Version:    10.6.1
---------------------------------------------------------------------------"""
# pylint: disable=W0703, W0702, C0103
# noqa: E722

import json
import os
import threading
import re
import requests

try:
    from urllib import quote
except ImportError:
    from urllib.parse import quote

import arcpy  # pylint: disable=E0401
import hostedgp as agolgp  # pylint: disable=E0401


from feature_count_query_utils import FeatureCountQuery, TessellationFeatureCountQuery

try:
    unicode = unicode
except NameError:
    str = str  # pylint: disable=W0622
    unicode = str
    bytes = bytes  # pylint: disable=W0622
    basestring = (str, bytes)
else:
    str = str
    unicode = unicode
    bytes = str
    basestring = basestring

# criteria for timeout (1 min)
TIMEOUT_CRITERIA = 60

RECORD_COUNT_KEYNAME = 'totalRecords'
COST_KEYNAME = 'cost'
MAX_COST_KEYNAME = 'maximumCost'


ERROR_CODES = ['001', '002', '003', 900003, 900005, 100245,
               900007, 900008, 900009]
ERROR_MSGS = {'001': 'Invalid parameter {} value.',
              '002': 'Parameter missing {}.',
              '003': 'Invalid parameter {}:property {} is missing.',
              900003: 'Unable to get the feature count from {}.',
              900005: '{} cost estimation failed.',
              100245: 'Invalid expression for {}, malformed JSON.',
              900007: 'Unsupported parameter type of {}.',
              900008: 'Unsupported tool {} for cost estimation.',
              900009: 'Unable to get the GeoEnrichment layer Feature Count.'}


#region calculator
class CostProcessor:
    """Get cost from count."""

    def __init__(self, feature_count, multiplier, base_multiplier=1.0):
        """Setup the properties.

        Args:
            feature_count: an integer represents the total # of features involved in the calculation.
            multiplier: the multiplier to convert feature count to cost.
            base_multiplier: base multiplier for cost (default of 1.0).
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.feature_count = feature_count
        self.multiplier = multiplier
        self.base_multiplier = base_multiplier

    def get(self):
        """Get the cost.

        Returns:
            a float with the cost calculated.
        Raises:
            No exceptions.

        """
        cost = self.feature_count * self.multiplier * self.base_multiplier
        return float("{0:.3f}".format(cost))

    @staticmethod
    def log(task_name, execution_count, feature_count):
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
                raise ValueError("feature_count should always be non-negative.")
            arcpy.AddMessage("{} has {} features to log.".format(task_name, feature_count))
            arcpy.gp._arc_object.LogUsageMetering(5555, task_name, 1, float(feature_count))
        except Exception as err:
            arcpy.AddError("ReportCost failed due to {}".format(str(err)))
            raise Exception


def verify_custom_geservice() -> bool:
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
                ge_url_parse_res = requests.utils.urlparse(ge_url)
                # Customized service should always be a proxy item
                return not ge_url_parse_res.path.startswith("/arcgis")
    return False


def default_calculator(cost_reporter):
    """Default calculator for credits estimation.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    context = None
    layers = []

    for param in cost_reporter.parameters:
        if param:
            if param.param_type == 'context':
                context = param
            elif param.param_type == 'layer':
                layers.append(param)

    feature_count = 0
    for lyr in layers:
        if lyr.multiple_values:
            for val in lyr.value:
                feature_count += get_layer_featurecount(val, context)
        else:
            feature_count += get_layer_featurecount(lyr.value, context)

    if cost_reporter.log_cost:
        CostProcessor.log(cost_reporter.name, 1, feature_count)
        return

    cost = CostProcessor(feature_count, cost_reporter.multiplier, cost_reporter.base_multiplier).get()
    return json.dumps({RECORD_COUNT_KEYNAME: feature_count,
                       COST_KEYNAME: cost})


def extractdata_calculator(cost_reporter):
    """Credits calculator of ExtractData.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    context = None
    drawing_extent = None
    input_layers = None

    for param in cost_reporter.parameters:
        if param:
            if param.param_type == 'context':
                context = param
            elif param.param_type == 'extent':
                drawing_extent = param
            elif param.param_type == 'layer':
                input_layers = param

    # Check if the context is valid
    if context and context.value:
        tmp_extent = context.value["extent"]
        if tmp_extent["xmin"] == tmp_extent["xmax"] or tmp_extent["ymin"] == tmp_extent["ymax"]:
            return json.dumps({RECORD_COUNT_KEYNAME: 0, COST_KEYNAME: 0.000})

    feature_count = 0
    for val in input_layers.value:
        feature_count += get_layer_featurecount(val, context, drawing_extent)

    if cost_reporter.log_cost:
        CostProcessor.log(cost_reporter.name, 1, feature_count)
        return

    cost = CostProcessor(feature_count, cost_reporter.multiplier, cost_reporter.base_multiplier).get()
    return json.dumps({RECORD_COUNT_KEYNAME: feature_count,
                       COST_KEYNAME: cost})


def summarize_nearby_calculator(cost_reporter):
    """Credit calculator for the tool of summarizeNearby.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    sum_nearby_lyr = None
    summary_lyr = None
    near_type = None
    distances = None
    context = None

    for param in cost_reporter.parameters:
        if param.name.lower() == 'sumnearbylayer' and param.param_type == 'layer':
            sum_nearby_lyr = param
        elif param.name.lower() == 'summarylayer' and param.param_type == 'layer':
            summary_lyr = param
        elif param.name == 'nearType':
            near_type = param
        elif param.name == 'distances':
            distances = param

        if param.param_type == 'context':
            context = param

    if cost_reporter.log_cost and near_type.value.lower() != "straightline":
        # No need to log the cost. Cost has already been logged by NA server.
        CostProcessor.log(cost_reporter.name, 1, 0)
        return

    tot_sum_near = get_layer_featurecount(sum_nearby_lyr.value, context)

    if near_type.value == 'StraightLine':
        if summary_lyr is None:
            add_error_code('002', ERROR_MSGS['002'].format('summaryLayer'))

        tot_sum = get_layer_featurecount(summary_lyr.value, context)
        if cost_reporter.log_cost:
            CostProcessor.log(cost_reporter.name, 1, tot_sum + tot_sum_near)
            return

        cost = CostProcessor((tot_sum + tot_sum_near), cost_reporter.multiplier, cost_reporter.base_multiplier).get()
        return json.dumps({RECORD_COUNT_KEYNAME: tot_sum + tot_sum_near,
                           COST_KEYNAME: cost})
    else:
        if distances is None:
            add_error_code('002', ERROR_MSGS['002'].format('distances'))

        dist_count = len(distances.value)

        namultiplier = cost_reporter.info.get('namultiplier')
        if not namultiplier:
            add_error_code('003', ERROR_MSGS['003'].format('info', 'namultiplier'))
        # Set feature count to tot_sum_near * dist_count since cost is multiplied together.
        cost = CostProcessor(tot_sum_near * dist_count, namultiplier, cost_reporter.base_multiplier).get()
        return json.dumps({RECORD_COUNT_KEYNAME: tot_sum_near,
                           MAX_COST_KEYNAME: cost})


def create_drivetimearea_calculator(cost_reporter):
    """Credit calculator for the tool createDriveTimeAreas.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    # No need to log the cost in tools. Cost has been logged in NA server.
    if cost_reporter.log_cost:
        CostProcessor.log(cost_reporter.name, 1, 0)
        return

    input_layer = None
    context = None
    # default to a length of 3
    break_values = [0, 0, 0]

    for param in cost_reporter.parameters:
        if param.name.lower() == 'inputlayer':
            input_layer = param
        elif param.name.lower() == 'breakvalues':
            if param.value:
                break_values = param.value
            else:
                arcpy.AddWarning('Missing required BreakValues parameter! Default to 3 break values!')

        if param.param_type == 'context':
            context = param

    tot_rec = get_layer_featurecount(input_layer.value, context)
    cost = CostProcessor(tot_rec * len(break_values), cost_reporter.multiplier, cost_reporter.base_multiplier).get()
    return json.dumps({RECORD_COUNT_KEYNAME: tot_rec, MAX_COST_KEYNAME: cost})


def find_nearest_calculator(cost_reporter):
    """Credit calculator for the tool find nearest.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    analysis_lyr = None
    near_lyr = None
    measurement_type = None
    max_count = -1
    context = None

    for param in cost_reporter.parameters:
        if param.name.lower() == 'analysislayer':
            analysis_lyr = param
        elif param.name.lower() == 'nearlayer':
            near_lyr = param
        elif param.name.lower() == 'measurementtype':
            measurement_type = param
            if not param.value:
                measurement_type.value = "StraightLine"
        elif param.name.lower() == 'maxcount' and isinstance(param.value, int):
            max_count = param.value

        if param.param_type.lower() == 'context':
            context = param

    # Log the cost as 0 if measurement_type is not StraightLine (cost has been logged on NA server).
    if cost_reporter.log_cost and measurement_type.value.lower() != "straightline":
        CostProcessor.log(cost_reporter.name, 1, 0)
        return

    namultiplier = cost_reporter.info.get('namultiplier')
    if not namultiplier:
        add_error_code('003', ERROR_MSGS['003'].format('info', 'namultiplier'))

    tot_ana = get_layer_featurecount(analysis_lyr.value, context)

    if measurement_type.value.lower() != 'straightline':
        tot_near = get_layer_featurecount(near_lyr.value, context)
        if max_count != -1:
            num_routes = min(max_count, tot_near) * tot_ana
        else:
            # tot_near can not be more than 100.
            num_routes = min(tot_near, 100) * tot_ana
        # cost = (tot_ana + tot_near) * cost_report.multiplier * cost_report.base_multiplier
        cost = CostProcessor(num_routes, namultiplier, cost_reporter.base_multiplier).get()
        return json.dumps({RECORD_COUNT_KEYNAME: (tot_ana + tot_near),
                           MAX_COST_KEYNAME: cost})
    else:
        tot_near = get_layer_featurecount(near_lyr.value, context)
        if cost_reporter.log_cost:
            CostProcessor.log(cost_reporter.name, 1, tot_ana + tot_near)
            return

        cost = CostProcessor(tot_ana + tot_near, cost_reporter.multiplier, cost_reporter.base_multiplier).get()
        return json.dumps({RECORD_COUNT_KEYNAME: (tot_ana + tot_near),
                           COST_KEYNAME: cost})


def enrich_layer_calculator(cost_reporter):
    """"Credit calculator for the tool enrichLayer.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    # Log cost as 0 at tool level. Cost has been logged on EnrichLayer server.
    if cost_reporter.log_cost:
        CostProcessor.log(cost_reporter.name, 1, 0)
        return

    input_layer = None
    input_collections = []
    analysis_variables = []
    country = ''
    buffer_type = 'StraightLine'
    context = None

    for param in cost_reporter.parameters:
        if param.name.lower() == 'inputlayer':
            input_layer = param
        elif param.name.lower() == 'country':
            if param.value:
                country = param.value
            else:
                arcpy.AddWarning('Failed to get country parameter. Default value applied.')
        elif param.name.lower() == 'datacollections':
            if param.value:
                input_collections = param.value
            else:
                arcpy.AddWarning('Failed to get the datacollections parameter. Default value applied.')
        elif param.name.lower() == 'analysisvariables':
            if param.value:
                analysis_variables = param.value
            else:
                arcpy.AddWarning('Failed to get the analysisVariables parameter. Default value applied')
        elif param.name.lower() == 'buffertype':
            if param.value:
                buffer_type = param.value
            else:
                arcpy.AddWarning('Failed to get the bufferType parameter')

        if param.param_type == 'context':
            context = param

    totrecs = get_layer_featurecount(input_layer.value, context)

    if len(input_collections):
        var_count = get_geoenrichment_featurecount(country, input_collections)
    else:
        var_count = 0

    var_count += len(analysis_variables)
    custom_ge_service = verify_custom_geservice()
    if custom_ge_service:
        cost = 0
    else:
        cost = CostProcessor(totrecs * var_count, cost_reporter.multiplier, cost_reporter.base_multiplier).get()

    if buffer_type != 'StraightLine':
        namultiplier = cost_reporter.info.get('namultiplier', 1.0)
        nacost = namultiplier * totrecs
        cost += nacost
        res = {RECORD_COUNT_KEYNAME: totrecs,
               MAX_COST_KEYNAME: cost}
    else:
        res = {RECORD_COUNT_KEYNAME: totrecs,
               COST_KEYNAME: cost}

    if custom_ge_service:
        res["additionalInfo"] = {"messages": [{"messageCode": "AO_100286",
                                               "message": "Credit estimate is based on the use of a custom GeoEnrichment service."}]}
    return json.dumps(res)


def connect_originstodestinations_calculator(cost_reporter):  # no-qa. pylint: disable=C0103
    """Credit calculator for the tool connect origins to destinations.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    origin_lyr = None
    dest_lyr = None
    measure_type = None
    context = None

    for param in cost_reporter.parameters:
        if param.name.lower() == 'originslayer':
            origin_lyr = param
        elif param.name.lower() == 'destinationslayer':
            dest_lyr = param
        elif param.name.lower() == 'measurementtype':
            measure_type = param
            if measure_type.value is None:
                measure_type.value = "DrivingTime"
                arcpy.AddWarning("measureType is missing and it is default to DrivingTime")

        if param.param_type == 'context':
            context = param

    origin_feat_count = get_layer_featurecount(origin_lyr.value, context)
    dest_feat_count = get_layer_featurecount(dest_lyr.value, context)

    if measure_type.value.lower() == 'straightline':
        if cost_reporter.log_cost:
            CostProcessor.log(cost_reporter.name, 1, origin_feat_count + dest_feat_count)
            return

        cost = CostProcessor(origin_feat_count + dest_feat_count, cost_reporter.multiplier,
                             cost_reporter.base_multiplier).get()
        return json.dumps({RECORD_COUNT_KEYNAME: origin_feat_count + dest_feat_count,
                           COST_KEYNAME: cost})

    else:
        if cost_reporter.log_cost:
            # Log cost as 0 at tool level. NA server has logged the cost already.
            CostProcessor.log(cost_reporter.name, 1, 0)
            return

        namultiplier = cost_reporter.info.get('namultiplier')
        if not namultiplier:
            add_error_code('003', ERROR_MSGS['003'].format('info', 'namultiplier'))

        cost = CostProcessor(max([origin_feat_count, dest_feat_count]), namultiplier,
                             cost_reporter.base_multiplier).get()
        # Check with Nitin (why not using the max of [originFeatCount
        # destFeatCount])
        return json.dumps({RECORD_COUNT_KEYNAME: max([origin_feat_count, dest_feat_count]),
                           MAX_COST_KEYNAME: cost})


def plan_routes_calculator(cost_reporter):
    """Credit calculator for the tool plan routes.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    if cost_reporter.log_cost:
        CostProcessor.log(cost_reporter.name, 1, 0)
        return

    route_count = 0

    for param in cost_reporter.parameters:
        if param.name.lower() == 'routecount':
            if param.value is not None:
                route_count = param.value
            else:
                arcpy.AddWarning('Failed to get routeCount from info! rootCount default to 0!')

    cost = CostProcessor(route_count, cost_reporter.multiplier, cost_reporter.base_multiplier).get()
    return json.dumps({RECORD_COUNT_KEYNAME: route_count,
                       MAX_COST_KEYNAME: cost})


def choose_bestfacilities_calculator(cost_reporter):  # no-qa. pylint: disable=C0103
    """Credit calculator for the tool chooseBestFacilities.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    # Log cost as 0 at tool level. Cost has been logged on NA server.
    if cost_reporter.log_cost:
        CostProcessor.log(cost_reporter.name, 1, 0)
        return

    demand_loc_lyr = None
    context = None

    for param in cost_reporter.parameters:
        if param.name.lower() == 'demandlocationslayer':
            demand_loc_lyr = param

        if param.param_type == 'context':
            context = param

    demand_lyr_featcount = get_layer_featurecount(demand_loc_lyr.value, context)
    cost = CostProcessor(demand_lyr_featcount, cost_reporter.multiplier, cost_reporter.base_multiplier).get()
    return json.dumps({RECORD_COUNT_KEYNAME: demand_lyr_featcount,
                       MAX_COST_KEYNAME: cost})


def aggregate_points_calculator(cost_reporter):
    """credit calculator for the tool AggregatePoints.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    point_lyr = None
    polygon_lyr = None
    bin_type = ""
    bin_size = None
    bin_size_unit = ""
    context = None

    for param in cost_reporter.parameters:
        if param.name.lower() == 'pointlayer':
            point_lyr = param.value
        elif param.name.lower() == 'polygonlayer':
            polygon_lyr = param.value
        elif param.name.lower() == 'bintype':
            bin_type = param.value
        elif param.name.lower() == 'binsize':
            bin_size = param.value
        elif param.name.lower() == 'binsizeunit':
            bin_size_unit = param.value

        if param.param_type == 'context':
            context = param

    point_lyr_count = get_layer_featurecount(point_lyr, context)
    arcpy.AddMessage("point_lyr_count: {}".format(point_lyr_count))
    if polygon_lyr:
        poly_lyr_count = get_layer_featurecount(polygon_lyr, context)
        total_count = point_lyr_count + poly_lyr_count
        cost_key = COST_KEYNAME
        if cost_reporter.log_cost:
            CostProcessor.log(cost_reporter.name, 1, total_count)
            return
    else:
        if cost_reporter.log_cost:
            arcpy.AddMessage("Log cost can't be from tessellation prediction.")
            raise Exception

        tessellation_count = TessellationFeatureCountQuery(point_lyr, bin_type,
                                                           bin_size, bin_size_unit).query()
        arcpy.AddMessage("tessellation_count: {}".format(tessellation_count))
        total_count = point_lyr_count + tessellation_count
        cost_key = MAX_COST_KEYNAME

    cost = CostProcessor(total_count, cost_reporter.multiplier,
                         cost_reporter.base_multiplier).get()
    return json.dumps({RECORD_COUNT_KEYNAME: total_count,
                       cost_key: cost})


def summarize_within_calculator(cost_reporter):
    """credit calculator for the tool SummarizeWithin.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    summary_layer = None
    summary_within_layer = None
    bin_type = ""
    bin_size = None
    bin_size_unit = ""
    context = None

    for param in cost_reporter.parameters:
        if param.name.lower() == 'summarylayer':
            summary_layer = param.value
        elif param.name.lower() == 'sumwithinlayer':
            summary_within_layer = param.value
        elif param.name.lower() == 'bintype':
            bin_type = param.value
        elif param.name.lower() == 'binsize':
            bin_size = param.value
        elif param.name.lower() == 'binsizeunit':
            bin_size_unit = param.value

        if param.param_type == 'context':
            context = param

    summary_layer_featurecount = get_layer_featurecount(summary_layer, context)
    arcpy.AddMessage("summary_layer_featurecount: {}".format(summary_layer_featurecount))
    if summary_within_layer:
        total_count = get_layer_featurecount(summary_within_layer, context) + summary_layer_featurecount
        cost_key = COST_KEYNAME
        if cost_reporter.log_cost:
            CostProcessor.log(cost_reporter.name, 1, total_count)
            return
    else:
        if cost_reporter.log_cost:
            arcpy.AddMessage("Log cost can't be from tessellation prediction.")
            raise Exception

        tessellation_count = TessellationFeatureCountQuery(summary_layer, bin_type,
                                                           bin_size, bin_size_unit).query()
        arcpy.AddMessage("tessellation_count: {}".format(tessellation_count))
        cost_key = MAX_COST_KEYNAME
        total_count = summary_layer_featurecount + tessellation_count

    cost = CostProcessor(total_count, cost_reporter.multiplier,
                         cost_reporter.base_multiplier).get()
    return json.dumps({RECORD_COUNT_KEYNAME: total_count,
                       cost_key: cost})


def generate_tessellation_calculator(cost_reporter):
    """credit calculator for the tool GenerateTessellations.

    Args:
        cost_reporter: an instance of costReporter.
    Returns:
        a json string with values of totalRecords and cost.
    Raises:
        No exceptions.

    """
    extent_layer = None
    context = None
    tessellation_layer = None
    bin_type = ""
    bin_size = None
    bin_size_unit = ""

    for param in cost_reporter.parameters:
        if param.name.lower() == 'extentlayer':
            extent_layer = param.value
        elif param.name.lower() == 'tessellationlayer':
            tessellation_layer = param.value
        elif param.name.lower() == 'bintype':
            bin_type = param.value
        elif param.name.lower() == 'binsize':
            bin_size = param.value
        elif param.name.lower() == 'binsizeunit':
            bin_size_unit = param.value

        if param.param_type == 'context':
            context = param

    if tessellation_layer:
        # tessellation_layer is a dictionary containing the feature count information.
        tessellation_count = get_layer_featurecount(tessellation_layer, context)
        if cost_reporter.log_cost:
            CostProcessor.log(cost_reporter.name, 1, tessellation_count)
            return
    else:
        if cost_reporter.log_cost:
            arcpy.AddMessage("Log cost can't be from tessellation prediction.")
            raise Exception

        if extent_layer:
            extent = extent_layer
        elif context and context.value:
            extent = context.value
        else:
            arcpy.AddMessage("Error: Invalid extent for tessellation generation.")
            raise Exception

        tessellation_count = TessellationFeatureCountQuery(extent, bin_type,
                                                           bin_size, bin_size_unit).query()

    cost = CostProcessor(tessellation_count, cost_reporter.multiplier,
                         cost_reporter.base_multiplier).get()
    return json.dumps({RECORD_COUNT_KEYNAME: tessellation_count,
                       MAX_COST_KEYNAME: cost})


def get_layer_featurecount(layer, context, extent=None):
    """Get the total # of features from a layer.

    Args:
        layer: the value of the parameter with type of layer.
        context: an instance of parameter with param_type as context.
        extent: an instance of parameter with param_type as extent (default to None).
    Returns:
        The total # of features of the layer.
    Raises:
        RuntimeError if not able to get the count from an url.

    """
    if isinstance(layer, int):
        return layer
    # add the logic for reporting cost
    elif isinstance(layer, dict) and "count" in layer and "shapeType" in layer:
        return layer.get("count", 0)
    else:
        if context and context.value:
            context = context.value
        else:
            context = None

        if extent and extent.value:
            extent = extent.value
        else:
            extent = None
        try:
            return FeatureCountQuery(layer, context, extent).query()
        except Exception as err:
            add_error_code(900003, ERROR_MSGS[900003].format(layer),
                           params={'layer': layer})


def get_geoenrichment_featurecount(country, input_collections):
    """Construct url to get the Geoenrichment counts if dataCollections are not optional.

    Args:
        country: a string with the country name.
        input_collections: a collection of input.
    Returns:
        The total # of features of layers for geo-enrichment.
    Raises:
        Error of 900009.

    """
    try:
        from .feature_count_query_utils import GeoenrichmentFeatureCountQuery
    except (ImportError, ModuleNotFoundError):
        from feature_count_query_utils import GeoenrichmentFeatureCountQuery

    try:
        return GeoenrichmentFeatureCountQuery(country, input_collections).query()
    except Exception:
        add_error_code(900009, ERROR_MSGS[900009])
#endregion


class _CostConfiguration(threading.local):
    """Loader and binding of the cost configuration. A thread is sharing one configuration."""

    config_file_name = 'toolCostMetadata.json'

    def __init__(self):
        """Initialize the path of the configuration setting.

        Args:
            No arguments.
        Returns:
            No returns.
        Raises:
            Exception of missing configuration file.

        """
        super(_CostConfiguration, self).__init__()
        self.configuration_file = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                               self.config_file_name)

        if not os.path.exists(self.configuration_file):
            arcpy.AddError('{} file is missing.'.format(self.config_file_name))
            raise Exception

        self.__config = None
        self.__token = ''

    def _get_config(self):
        """To read in the configuration from the metadata json file."""
        if not self.__config:
            # lazy initialization
            with open(self.configuration_file) as json_data:
                self.__config = json.load(json_data)

        return self.__config

    @property
    def token(self):
        """Expose Token attribute to be set externally for debugging purpose."""
        return self.__token

    @token.setter
    def token(self, value):
        """Setter of the Token attribute."""
        if isinstance(value, basestring):
            self.__token = value
        else:
            arcpy.AddError('TypeError: token must be an instance of basestring!')
            raise Exception

    @property
    def configuration(self):
        """Getter of configuration setup as a dictionary."""
        return self._get_config()

    def get_configuration_by_toolname(self, tool_name):
        """Getter of the configuration for a certain tool.

        Args:
            tool_name: a string represents the name of the standard analysis tool.
        Returns:
            A dictionary with the parameters associate info of the desired tool.

        """
        self._get_config()

        tools = self.configuration.get('tools', None)
        if tools:
            for tool in tools:
                if tool['name'] == tool_name:
                    return tool

        return None

    def get_base_multiplier(self):
        """Getter of the default multiplier (it will multiply all the calculated credits)."""
        self._get_config()

        try:
            return float(self.configuration.get('multiplier'))
        except Exception as err:
            arcpy.AddError('Unable to get the default multiplier value because {}'.format(str(err)))
            raise IOError


_CONFIGURATION = _CostConfiguration()


class _Parameter(object):
    """Class module used to store the values of a certain parameter."""

    SUPPORTED_TYPES = ['layer', 'context', 'extent', 'double', 'string', 'long']

    def __init__(self, name, param_type, param_value, optional=False, multiple_values=False):
        """Initialize the parameter's attributes.

        Args:
            name: a string as of the name of the parameter.
            param_type: type of the parameter. Can only be one of the SUPPORTED_TYPES.
            param_value: the value of the parameter.
            optional: a boolean indicating whether the parameter is optional or not.
            multiple_values: a boolean indicating whether the parameter containing multiple values.
        Returns:
            No return.
        Raises:
            No exception.

        """
        self.name = name
        if not param_type.lower() in self.SUPPORTED_TYPES:
            arcpy.AddError('Unsupported param_type of {}'.format(type))
            raise ValueError

        self.param_type = param_type
        self.optional = optional
        self.multiple_values = multiple_values
        self.parse_content(param_value)

    def parse_content(self, content):
        """Parse the content to the value property."""
        # If parameter is multiple_values, then value property is a list.
        if self.multiple_values:
            if isinstance(content, basestring):
                content = json.loads(content)
            self.value = []
            for content_item in content:
                tmp_value = self._parse(content_item)
                if tmp_value:
                    self.value.append(tmp_value)
        else:
            self.value = self._parse(content)

        if not self.value and not self.optional:
            add_error_code('002', ERROR_MSGS['002'].format(self.name))

    def _parse(self, content):
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
        if not content:
            return None

        if self.param_type.lower() == 'layer':
            # With layer type, the input_val can be a dict with key of "url", or a dict with key of "featureset", or
            # even an integer represents the count of the layer.
            if isinstance(content, basestring):
                content = json.loads(content)

            # Check if the url is valid
            if isinstance(content, dict) and 'url' in content:
                if not self.verify_url(content['url']):
                    arcpy.AddError('Malformed URL of {}'.format(content['url']))
                    raise Exception

            return content

        elif self.param_type.lower() == 'context':
            if isinstance(content, basestring):
                content = json.loads(content)
            arcpy.AddMessage("content: {}".format(content))
            # Sometimes context is used to save some other values not only for extent. Relax the check.
            if not isinstance(content, dict) or "extent" not in content:
                arcpy.AddMessage('Unusable context: {} for credit estimation.'.format(content))
                content = None

            # The value of context type _Parameter is a dict with at least one key of "extent"
            return content

        elif self.param_type.lower() == 'extent':
            if isinstance(content, basestring):
                content = json.loads(content)

            if not isinstance(content, dict):
                # Relax the check.
                arcpy.AddMessage('Invalid extent value of {}.'.format(content))
                content = None

            # The value of context type _Parameter is a dict with at least one key of "extent"
            return content

        elif self.param_type.lower() == 'double':
            try:
                return float(content)
            except ValueError:
                arcpy.AddMessage('Unable to convert {} to float'.format(content))
                return None

        elif self.param_type.lower() == 'long':
            try:
                return long(content)
            # In python 3, there is no 'long integer'.
            except NameError:
                return int(content)
            except ValueError:
                arcpy.AddError('Unable to convert {} to long/int'.format(content))
                return None

        elif self.param_type.lower() == 'string':
            if isinstance(content, basestring):
                return content
            elif isinstance(content, dict) or isinstance(content, list):
                return json.dumps(content, ensure_ascii=False)
            else:
                arcpy.AddError('TypeError: Unable to convert {} to string'.format(content))
                return None

        else:
            add_error_code(900007, ERROR_MSGS[900007].format(self.param_type.lower()),
                           params={'type': self.param_type.lower()})

    @staticmethod
    def verify_url(url):
        """Django url validation regex.

        Args:
            url: a string represents the URL to verify.
        Returns:
            True if the url is valid and False otherwise.
        Raises:
            No exception.

        """
        regex = re.compile(
            r'^(?:http|ftp)s?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?][\S| ]+)$', re.IGNORECASE)

        if re.match(regex, url):
            return True
        else:
            return False


class _CostReporterFactory(object):
    """A factory class to create an instance of CostReporter. The factory class is going to do the following things in
    order:
    1. Unpack the user input parameters.
    2. Find the appropriate parameter info and assign them to CostReporter as property.
    3. return an instance of CostReporter if no exception raised, None otherwise."""

    CREDIT_REPORT_FUNCTIONS = {'default': default_calculator,
                               'extractdata': extractdata_calculator,
                               'createdrivetimeareas': create_drivetimearea_calculator,
                               'enrichlayer': enrich_layer_calculator,
                               'summarizenearby': summarize_nearby_calculator,
                               'findnearest': find_nearest_calculator,
                               'planroutes': plan_routes_calculator,
                               'connectoriginstodestinations': connect_originstodestinations_calculator,
                               'choosebestfacilities': choose_bestfacilities_calculator,
                               'aggregatepoints': aggregate_points_calculator,
                               'summarizewithin': summarize_within_calculator,
                               'generatetessellations': generate_tessellation_calculator}

    def __init__(self, task_name, input_params):
        """Initialize the attributes.

        Args:
            task_name: A string represents the name of a task to estimate.
            input_params: input_params can either be a string or a dictionary. For credit prediction REST call,
            input_params is a string with all the parameters concatenated. But for credit check and log in backend,
            the input_params is constructed at tool level and pass in as a dictionary.
        Returns:
            No return.
        Raises:
            TypeError is task_name or input_param_str is not string.
            Error 100245 if failed to create a CostReporter by parsing the input_param_str.

        """
        if not isinstance(task_name, basestring):
            arcpy.AddError('taskName must be an instance of either string or unicode!')
            raise TypeError

        self.task_name = task_name

        self.config_dict = _CONFIGURATION.get_configuration_by_toolname(task_name)
        self.base_multiplier = _CONFIGURATION.get_base_multiplier()
        if self.config_dict is None:
            add_error_code(900008, ERROR_MSGS[900008].format(task_name), params={'ToolName': task_name})

        # The following processing is to process the input_param_str if it is in json format.
        if isinstance(input_params, dict):
            params_dict = input_params
        elif isinstance(input_params, basestring):
            try:
                params_dict = json.loads(input_params)
            except Exception:
                try:
                    input_params = input_params.replace('"{', '{').replace('}"', '}')
                    input_params = input_params.replace('\r\n', '').replace('\\n', '').replace('\\"', '"')
                    params_dict = json.loads(input_params)
                except Exception:
                    add_error_code(100245, ERROR_MSGS[100245].format(input_params),
                                   params={'paramName': input_params})
        else:
            arcpy.AddError("Invalid type of parameters for estimation.")
            raise TypeError

        # Change all the key to lower case
        self.input_params_dict = {k.lower(): v for k, v in params_dict.items()}
        # This allows to pass in hardwired token for testing purpose.
        _CONFIGURATION.token = self.input_params_dict.get('token', '')

    def create(self):
        """Create an instance of CostReporter."""
        reporter = CostReporter(self.task_name, self.base_multiplier)

        # Create properties for reporter based on the configuration.
        for key, value in self.config_dict.items():
            if key == 'multiplier':
                reporter.__setattr__(key, float(self.config_dict[key]))
            elif key == 'function':
                reporter.__setattr__(key, self.CREDIT_REPORT_FUNCTIONS[value])
            elif key == 'parameters':
                reporter.__setattr__(key, [] + self._pull_parameter_input(value))
            # For info and description etc.
            else:
                reporter.__setattr__(key, value)

        return reporter

    def _pull_parameter_input(self, param_def_list):
        """To query the parameter information from input based on the parameter definition of the metadata json.

        Args:
            param_def_list: a list with the parameters definition.
        Returns:
            A list of instances of _Parameter.
        Raises:
            IOError if both name and type are None.

        """
        parameters = []
        # Go through the parameter defition list. Any parameters that are not on the list will not be parsed.
        for param in param_def_list:
            param_name = param.get('name', None)
            param_type = param.get('type', None)
            optional = param.get('optional', False)
            multi_val = param.get('multivalue', False)

            # Check the parameter (name and type can not be None)
            if param_name is None or param_type is None:
                arcpy.AddError('Invalid parameter info. Check the metadata file!')
                raise IOError

            if self.input_params_dict.get(param_name.lower(), None):
                param_item = _Parameter(param_name, param_type, self.input_params_dict[param_name.lower()],
                                        optional=optional, multiple_values=multi_val)
            else:
                param_item = None

            if param_item:
                parameters.append(param_item)
            elif not optional:
                add_error_code('002', ERROR_MSGS['002'].format(param_name))

        return parameters


class CostReporter(object):
    """Class with input parameters binded as configuration for cost estimation."""

    # These attributes are currently available on the json metadata file. Will update if needed.
    __slot__ = ['name', 'parameters', 'function', 'multiplier', 'description', 'info']

    def __init__(self, name, base_multiplier=1.0):
        """Initialize the attributes of name and base_multiplier.

        Args:
            name: name of the CostReporter (name is from the task name usually.)
            base_multiplier: a non-negative double value that will be applied to the estimated cost.
        Returns:
            No return.
        Raises:
            No exception.

        """
        self.name = name
        self.base_multiplier = base_multiplier
        self.log_cost = False

    def report(self):
        """To report the result of cost estimation."""
        res = self.__getattribute__('function')(self)
        if 'errorCode' in res:
            add_error_code(900005, ERROR_MSGS[900005].format(self.name),
                           params={'TaskName': self.name})
        else:
            return res

    def log(self):
        # Set the log_cost property to True, so the binded function is aware this is going to log the cost only.
        self.log_cost = True
        self.__getattribute__('function')(self)


def add_error_code(error_code, error_msg, params=None, warning_flag=False):
    """Convert errors into JSON format for localization."""
    msg = {}
    if isinstance(error_code, basestring):
        msg["messageCode"] = u'GPEXT_{}'.format(error_code)
    else:
        msg["messageCode"] = u"AO_{}".format(error_code)

    if error_msg[-1] != ".":
        error_msg = u"{}.".format(error_msg)
    msg["message"] = error_msg
    if params:
        msg["params"] = params
    if warning_flag:
        arcpy.AddWarning(json.dumps(msg))
    else:
        arcpy.AddError(json.dumps(msg))
        raise arcpy.ExecuteError


def main():
    """Entry-point of the tool."""
    task_name = arcpy.GetParameterAsText(0)
    parameters = arcpy.GetParameterAsText(1)

    try:
        reporter = _CostReporterFactory(task_name, parameters).create()
        arcpy.SetParameterAsText(2, reporter.report())
        arcpy.AddMessage('Credit estimation complete successfully.')
    except Exception:
        arcpy.AddMessage("Credit Estimation Failed")
        raise Exception


if __name__ == '__main__':
    main()
