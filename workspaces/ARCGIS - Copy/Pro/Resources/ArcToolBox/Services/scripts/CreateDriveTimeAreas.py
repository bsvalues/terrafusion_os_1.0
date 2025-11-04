"""---------------------------------------------------------------------------
Name:              createdrivetimeareas.py
Purpose:           Drive time or drive distance areas
Author:            Esri Inc.
Created:           4/29/2013
Copyright:   (c)   Esri, Inc. 2013
ArcGIS Version:    10.2
---------------------------------------------------------------------------"""

#core libraries
import json
import time
import re
import os
import sys

#Internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import popup
import rendererUtils
import networkanalysis

#constants
TIME_UNITS = ("minutes", "seconds", "hours")
TASK_NAME = "CreateDriveTimeAreas"
MEASURE_TYPES = {
    "Driving" : ("drive time", "drive distance"),
    "Trucking" : ("truck time", "truck distance"),
    "Walking" : ("walk time", "walk distance"),
}

DEBUG = False

MAX_SEARCH_TOLERANCE_KM = 20
ERROR_CODES = {
    100024: "There are no features provided for analysis in {inputLayer}.",
    100039 : "The {inputLayer} must have a point geometry type.",
    100040 : "The number of features in {inputLayer} cannot be greater than {max}.",
    100099: "All break values must be greater than zero.",
    100100: "The features in {inputLayer} are not within the data coverage area. See availability at {url}.",
    100101: "No features in {inputLayer} are within a distance of {max} kilometers from streets.",
    100102: "All features in {inputLayer} must be in the same time zone when using traffic and creating areas with dissolve or split options.",
    100103: "The {measureType} value cannot be greater than {max} {breakUnits}.",
    100117: "Driving a truck is currently not supported outside of North America and Central America.",
    100145: "The following travel mode is invalid: {travelMode}",
    100146: "The chosen break units, {breakUnits}, and travel mode, {travelMode}, are incompatible. They are not mutually time or distance values.",
    100278: "The {measureType} value cannot be greater than {max} {breakUnits} when the option to show unreachable areas as holes is selected.",
    100279: "The {measureType} value cannot be greater than {max} {breakUnits} when the option to include reachable streets is selected.",
    100280: "The {measureType} value cannot be greater than {max} {breakUnits} when walking.",
    100291: "Failed to publish analysis results as a feature collection because one of the output layers has more than 9,999 features. To keep all features, save your result as a feature layer.",
    100297: "Results cannot be stored as a feature collection when including reachable streets."
}

INVALID_LOCATIONS_SOLVER_ERROR_MESSAGE = 'Insufficient number of valid locations in "Facilities".'
DIFFERENT_TIME_ZONE_ERROR_MESSAGE = 'The service area solver does not support facilities in different time zones when generating non-overlapping polygons, merged polygons or non-overlapping lines.'
#parameter index for the restrictions parameter in the ServiceAreas services on logistics.arcgis.com
RESTRICTIONS_PARAMETER_INDEX = 16

def get_popup_content(desc_output, drive_measure_type="Drive Time"):
    """Creates appropriate popup content."""

    service_area_popup = popup.PopupInfo("Create {} Areas Summary".format(drive_measure_type))

    ignore_fields = [desc_output.OIDFieldName, desc_output.ShapeFieldName]
    fields = [f for f in desc_output.fields if f.name not in ignore_fields]

    for field in fields:
        if field.name == 'ToBreak':
            service_area_popup.addFieldInfo(field.name, "{} Break".format(drive_measure_type))

        else:
            # Cleans up alias name, so that any underscores are removed
            # any words are given initial caps
            service_area_popup.addFieldInfo(
                field.name,
                " ".join([p.capitalize()
                           for p in
                           re.split(" |_", field.aliasName)]))

    return service_area_popup.getPopupInfo()

def save_output(hostedgp, break_values, travel_mode_name, drive_time_areas_output,
                output_hosted_name, time_elapsed, include_streets=False, break_units="Minutes"):
    ''''''

    LINE_SYMBOL_WIDTH = 2
    UNIQUE_VALUE_RENDERER_DEF = {
        "type": "uniqueValueDef",
        "uniqueValueFields": ["ToBreak"],
        "fieldDelimiter": ",",
        "baseSymbol": {
            "type": "esriSFS",
            "style": "esriSFSSolid",
            "color": [233, 191, 255, 255],
            "outline": {
                "type": "esriSLS",
                "style": "esriSLSSolid",
                "color": [218, 112, 214, 255],
                "width": 1.0
                }
            },
        "colorRamp": {
            "type": "algorithmic",
            "fromColor": [233, 191, 255, 255],
            "toColor": [132, 0, 168, 255],
            "algorithm": "esriHSVAlgorithm"
        }
    }

    SIMPLE_POLYGON_RENDERER = {
        "type": "simple",
        "label": "",
        "symbol": {
            "type": "esriSFS",
            "style": "esriSFSSolid",
            "color": [76, 0, 115, 255],
            "outline": {
                "type": "esriSLS",
                "style": "esriSLSSolid",
                "color": [218, 112, 214, 255],
                "width": 1.0
                }
            }
        }

    SIMPLE_LINE_RENDERER = {
        "type": "simple",
        "label": "",
        "symbol": {
            "type": "esriSLS",
            "style": "esriSLSSolid",
            "color": [76, 0, 115, 255],
            "width": LINE_SYMBOL_WIDTH,
            "outline": {
                "type": "esriSLS",
                "style": "esriSLSSolid",
                "color": [218, 112, 214, 255],
                "width": 1
            }
        }
    }

    POLYGON_TRANSPARENCY = 50
    LINE_TRANSPARENCY = 0

    CLASS_BREAKS_RENDERER_DEF = {
        "type": "classBreaksDef",
        "classificationField": "FromCumul_Minutes",
        "classificationMethod": "esriClassifyNaturalBreaks",
        "breakCount": 1,
        "baseSymbol": {
            "type": "esriSLS",
            "style": "esriSFSSolid",
            "color": [233, 191, 255, 255],
            "width": LINE_SYMBOL_WIDTH,
            "outline": {
                "type": "esriSLS",
                "style": "esriSLSSolid",
                "color": [218, 112, 214, 255],
                "width": 1
                }
            },
        "colorRamp": {
            "type": "algorithmic",
            "fromColor": [233, 191, 255, 255],
            "toColor": [132, 0, 168, 255],
            "algorithm": "esriHSVAlgorithm"
        }
    }

    break_count = len(break_values)
    ##1. Describe output
    desc_drive_time_areas = arcpy.Describe(drive_time_areas_output)

    #2. Create drawing Info
    if break_count > 1:
        drawingInfo = rendererUtils.getUniqueValueRendererInfo(drive_time_areas_output, ["ToBreak"],
                                                               POLYGON_TRANSPARENCY, UNIQUE_VALUE_RENDERER_DEF,
                                                               False)
        drawingInfo["renderer"]["legendOptions"] = {"title": break_units}
    else:
        SIMPLE_POLYGON_RENDERER["label"] = f"{break_values[0]} {break_units}"
        drawingInfo = {
            "renderer" : SIMPLE_POLYGON_RENDERER,
            "transparency": POLYGON_TRANSPARENCY,
            }

    #3. Create Popup & Output description
    lyrname = "travelareas"
    #popupInfo = get_popup_content(desc_drive_time_areas, drive_measure_type)
    #AnalysisArea should be immidiately after ToBreak field in the display order
    drive_time_areas_field_names = [fld.name for fld in desc_drive_time_areas.fields]
    drive_time_areas_field_names = networkanalysis.update_field_display_order(drive_time_areas_field_names,
                                                                              [("AnalysisArea", "ToBreak")])
    popup_title = "{} Areas Summary".format(travel_mode_name.title())
    popupInfo = popup.feature_layer_popup(desc_drive_time_areas, popup_title,
                                          field_names_display_order=drive_time_areas_field_names)
    time_elapsed = aolutils.AddTimerMessage(time_elapsed, "Created popup")
    outDesc = aolutils.getOutDescription(lyrname, 0, drawingInfo, popupInfo)

    # Service area lines output
    if include_streets:
        lyrname_salines = "Reachable Streets"
        salines = drive_time_areas_output + "Lines"
        desc_salines = arcpy.Describe(salines)
        if break_count > 1:
            renderer_def = dict(CLASS_BREAKS_RENDERER_DEF)
            renderer_def["breakCount"] = break_count
            renderer_def["classificationField"] = f"FromCumul_{break_units}"
            drawing_info_salines = rendererUtils.getDrawingInfo(salines, renderer_def, LINE_TRANSPARENCY, False)
            # modify the renderer created from the renderer def
            salines_renderer = drawing_info_salines["renderer"]
            salines_renderer["minValue"] = 0
            salines_renderer["classificationMethod"] = "esriClassifyManual"
            salines_renderer["authoringInfo"]["classificationMethod"] = "esriClassifyManual"
            salines_renderer["legendOptions"]["title"] = break_units
            for index, class_break in enumerate(salines_renderer["classBreakInfos"]):
                to_break_value = break_values[index]
                from_break_value = break_values[index - 1] if index else 0
                class_break["classMaxValue"] = to_break_value
                class_break["label"] = f"{from_break_value} - {to_break_value}"
        else:
            SIMPLE_LINE_RENDERER["label"] = f"{break_values[0]} {break_units}"
            drawing_info_salines = {
                "renderer" : SIMPLE_LINE_RENDERER,
                "transparency": LINE_TRANSPARENCY,
            }
        popup_title_salines = "{} Reachable Streets Summary".format(travel_mode_name.title())
        popup_info_salines = popup.feature_layer_popup(desc_salines, popup_title_salines)
        time_elapsed = aolutils.AddTimerMessage(time_elapsed, "Created popup")
        out_desc_salines = aolutils.getOutDescription(lyrname_salines, 1, drawing_info_salines, popup_info_salines)

    #4. Create result
    # Need to clear out extent before copying features to SDE so that we can always copy all features
    # Without this CreateDriveTimeAreas may not copy all travel areas depending on the input map extent
    orig_extent = arcpy.env.extent
    arcpy.env.extent = None
    res = aolutils.HostedToolResult(output_hosted_name)
    res.addHostedOutput(desc_drive_time_areas, outDesc, 15)
    if include_streets:
        res.addHostedOutput(desc_salines, out_desc_salines, 16)
    start_time = res.generateHostedResult(hostedgp, time_elapsed)
    arcpy.env.extent = orig_extent

def check_service_area_limits(input_layer_count, input_layer_name, break_values, break_units, travel_mode,
                              check_max_facilities=True, hostedgp=None, show_holes=False, include_streets=False):
    '''Checks if the inputs can be successfully used to create service areas using the World service areas service. 
    If a limit is violated, returns a tuple of the format (error_code, error_msg, error_msg_params) that can be passed
    to aolutils.AddErrorCode to raise an error. If no limits are violated return None.'''
    # Get the tool limits from routing utlities service if available in the portal. Default is the limits imposed
    # by online services
    MAX_FACILITIES_COUNT = 1000
    INFINITY = sys.maxsize
    MAX_BREAK_VALUE = 300
    if not hostedgp:
        hostedgp = agolgp.HostedGP(8, 7)
    max_limit_error_code = 100103
    break_units_lower = break_units.lower()
    failed_limits = None

    # Determine if we are generating time or distance based service areas
    if break_units_lower in TIME_UNITS:
        drive_measure_type = "time"
        default_max_break_value_units = "minutes"
    else:
        drive_measure_type = "distance"
        default_max_break_value_units = "miles"

    # Determine if the travel mode is walking
    walking_mode = ""
    try:
        travel_mode_obj = networkanalysis.get_travel_mode_from_json(travel_mode)
        if "Walking" in travel_mode_obj.restrictions:
            walking_mode = "Walking"
    except (ValueError, TypeError):
        if travel_mode.upper() == "WALKING":
            walking_mode = "Walking"
    arcpy.AddMessage(f"Is Walking Mode: {bool(walking_mode)}")
    # routing_utils_tbx = aolutils.getRemoteToolbox(hostedgp, "routingUtilities")
    routing_utils_tbx = aolutils.getHelperServicesUrl(hostedgp, "routingUtilities")
    arcpy.AddMessage("Getting tool limits from {0}".format(routing_utils_tbx))
    tool_limits = networkanalysis.get_tool_limits(routing_utils_tbx, "asyncServiceArea", "GenerateServiceAreas")
    max_facilities = tool_limits.get("maximumFacilities", None)
    # Get the limit name based on the type of polygons being generated
    if show_holes:
        max_break_value = tool_limits.get(f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueDetailedPolygons", None)
        max_break_value_units = tool_limits.get(f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueUnitsDetailedPolygons", default_max_break_value_units)
        max_limit_error_code = 100278
    elif include_streets:
        max_break_value = tool_limits.get(f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueServiceAreaLines", None)
        max_break_value_units = tool_limits.get(f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueUnitsServiceAreaLines", default_max_break_value_units)
        max_limit_error_code = 100279
    else:
        max_break_value = tool_limits.get(f"maximumBreak{walking_mode}{drive_measure_type.title()}Value", None)
        max_break_value_units = tool_limits.get(f"maximumBreak{walking_mode}{drive_measure_type.title()}ValueUnits",
                                                default_max_break_value_units)
        max_limit_error_code = 100280 if walking_mode else 100103
    MAX_FACILITIES_COUNT = INFINITY if max_facilities is None else max_facilities
    MAX_BREAK_VALUE = INFINITY if max_break_value is None else max_break_value
    arcpy.AddMessage(f"Max facilities count: {MAX_FACILITIES_COUNT}")
    arcpy.AddMessage(f"Max break value {MAX_BREAK_VALUE} {max_break_value_units}")
    max_break_value = networkanalysis.convert_units(MAX_BREAK_VALUE, max_break_value_units, break_units_lower)

    # Fail if any break value is greater than the max supported by logistics service. We report the max supported
    # value in user specified breakUnits. Fail if any break values are less than or equal to zero
    for break_val in break_values:
        if break_val <= 0:
            failed_limits = (100099, ERROR_CODES[100099])
            return failed_limits
        if break_val > max_break_value:
            msg_params = {
                "max": max_break_value,
                "breakUnits": break_units_lower,
                "measureType": drive_measure_type.lower(),
                }
            msg = ERROR_CODES[max_limit_error_code].format(**msg_params)
            failed_limits = (max_limit_error_code, msg, msg_params)
            return failed_limits

    # Fail if we have more than MAX_FACILITIES_COUNT number of features in input layer
    if check_max_facilities and input_layer_count > MAX_FACILITIES_COUNT:
        msg_params = {
            "inputLayer" : input_layer_name,
            "max" : MAX_FACILITIES_COUNT,
        }
        failed_limits = (100040, ERROR_CODES[100040].format(**msg_params), msg_params)
        return failed_limits

    return failed_limits

def create_drive_time_areas(hostedgp, input_layer, break_values, break_units, time_of_day,
                            overlap_policy="Overlap", input_layer_name=None,
                            time_zone_for_time_of_day="GeoLocal", travel_mode="Driving", 
                            filter_input_layer_by_extent=True, point_barrier_layer=None, line_barrier_layer=None,
                            polygon_barrier_layer=None, travel_direction="AwayFromFacility", include_holes=False,
                            include_streets=False):
    '''Call the remote GP tool GenerateServiceAreas and return the output polygons in in_memory workspce and
    the time elapsed to execute the function.
    @@hostedgp is the hosted gp environment from the caller. It is used to get the token and determine the URL
    to remote service.
    @@input_layer is the input layer. It can be obtained from your hostedgp instance using
    hosted_input = hostedgp.GetHostedLayer(input_index).name
    @@input_layer_name is the name of the hosted input layer which is obtained using
    hostedgp.GetHostedLayer(input_index).layername. If this is not specified, the input_layer_name is
    derived from input_layer using os.path.basename which may not be correct.
    @@filter_input_layer_by_extent determines if the features in the input layer will be filtered based on the extent
    '''
    
    global input_layer_count
    global travel_mode_name
    travel_mode_name = ""
    # Initiate start time
    startTime = time.time()
    func_start = startTime

    break_units_lower = break_units.lower()
    point_barrier_layer = networkanalysis.LayerInfo(point_barrier_layer)
    line_barrier_layer = networkanalysis.LayerInfo(line_barrier_layer)
    polygon_barrier_layer = networkanalysis.LayerInfo(polygon_barrier_layer)
    
    #Derive some values based on inputs
    input_layer_desc = arcpy.Describe(input_layer)
    break_values_str = " ".join([str(val) for val in break_values])
    
    if not input_layer_name:
        input_layer_name = os.path.basename(input_layer_desc.catalogPath)
    
    #paramsDict used with AddErrorCode
    input_layer_param_dict = {"inputLayer" : input_layer_name} 
    
    if filter_input_layer_by_extent:
        aolutils.selectFeaturesbyExtent(input_layer)
        input_layer_count = int(arcpy.management.GetCount(input_layer).getOutput(0))
        arcpy.AddMessage("Input features after extent filter applied: {0}".format(input_layer_count))
    #If input is an empty feature service, shapeType may return "Any". So perform input count check
    
    #Fail if we don't have at least one feature in input layer
    if input_layer_count < 1:
        aolutils.AddErrorCode(100024, ERROR_CODES[100024].format(**input_layer_param_dict), input_layer_param_dict)
        raise arcpy.ExecuteError    
    
    #Check if the input layer is a point. Fail otherwise
    if input_layer_desc.shapeType.lower() != "point":
        aolutils.AddErrorCode(100039, ERROR_CODES[100039].format(**input_layer_param_dict), input_layer_param_dict)
        raise arcpy.ExecuteError

    #Check if the user has premium:user:networkanalysis privilege
    if not aolutils.checkPrivilege(networkanalysis.NETWORK_ANALYSIS_PRIVILEGE, hostedgp):
        aolutils.AddErrorCode(100111, networkanalysis.ERROR_CODES.get(100111, ""))
        raise arcpy.ExecuteError

    # Check shape type for barriers
    if point_barrier_layer.count:
        if not point_barrier_layer.describe.shapeType.lower() in networkanalysis.POINT_SHAPE_TYPES:
            msg_params = dict(inputLayer=point_barrier_layer.name, shapeType="point")
            msg_code = 100264
            msg = networkanalysis.NetworkAnalysisTool.ERROR_CODES[msg_code].format(**msg_params)
            aolutils.AddErrorCode(msg_code, msg, msg_params)
            raise arcpy.ExecuteError

    # Check validity of lineBarrierLayer
    if line_barrier_layer.count:
        if not line_barrier_layer.describe.shapeType.lower() in networkanalysis.LINE_SHAPE_TYPES:
            msg_params = dict(inputLayer=line_barrier_layer.name, shapeType="line")
            msg_code = 100264
            msg = networkanalysis.NetworkAnalysisTool.ERROR_CODES[msg_code].format(**msg_params)
            aolutils.AddErrorCode(msg_code, msg, msg_params)
            raise arcpy.ExecuteError

    # Check validity of polygonBarrierLayer
    if polygon_barrier_layer.count:
        if not polygon_barrier_layer.describe.shapeType.lower() in networkanalysis.POLYGON_SHAPE_TYPES:
            msg_params = dict(inputLayer=polygon_barrier_layer.name, shapeType="polygon")
            msg_code = 100264
            msg = networkanalysis.NetworkAnalysisTool.ERROR_CODES[msg_code].format(**msg_params)
            aolutils.AddErrorCode(msg_code, msg, msg_params)
            raise arcpy.ExecuteError
    
    ##If extent is specified select the features that are within the extent
    ##Need to select features only if the input is a feature collection as GetHostedLayer
    ##for feature service inputs already filters based on extent
    #arcpy.AddMessage("arcpy.env.extent: " + str(arcpy.env.extent))
    
    #arcpy.AddMessage(u"Input features before extent filter applied: {0}".format(input_layer_count))
    #if arcpy.env.extent:
    #    #is_input_layer_a_service = True if input_layer_desc.catalogPath.find(".sde") != -1 else False
    #    is_input_layer_a_service = False
    #    if is_input_layer_a_service == False:            
    #        #input_layer = aolutils.selectFeaturesbyExtent(input_layer)
    #        input_layer_count = aolutils.selectFeaturesbyExtent(input_layer)
    #        #input_layer_count = int(arcpy.management.GetCount(input_layer).getOutput(0))
    #        arcpy.AddMessage(u"Input features after extent filter applied: {0}".format(input_layer_count))
    #startTime = aolutils.AddTimerMessage(startTime, "Read Input Layer")
    
    ##Fail if we donlt have at least one feature in input layer
    #if input_layer_count < 1:
    #    aolutils.AddErrorCode(100024, ERROR_CODES[100024].format(**input_layer_param_dict), input_layer_param_dict)
    #    raise arcpy.ExecuteError

    #Fail if we have an invalid travel mode. Valid values are Driving, Trucking, Walking (in any case) and a JSON that
    #represents a travel mode
    try:
        travel_mode_object = networkanalysis.get_travel_mode_from_json(travel_mode)
        travel_mode_name = travel_mode_object.name
    except (ValueError, TypeError) as ex:
        travel_mode_object = None
        if not travel_mode.upper() in ("DRIVING", "WALKING", "TRUCKING"):
            aolutils.AddErrorCode(100145, ERROR_CODES[100145],{"travelMode": travel_mode})
            raise arcpy.ExecuteError

    ##Check if any limits imposed by logistics service is exceeded
    failed_limits = check_service_area_limits(input_layer_count, input_layer_name, break_values, break_units,
                                              travel_mode, True, hostedgp, include_holes, include_streets)
    if failed_limits:
        aolutils.AddErrorCode(*failed_limits)
        raise arcpy.ExecuteError

    output_workspace = "in_memory"
    if DEBUG:
        output_workspace = arcpy.env.scratchGDB

    drive_time_areas_output = "{0}/TravelAreasOutput".format(output_workspace)
    service_area_lines_output = f"{drive_time_areas_output}Lines"    
    arcpy.AddMessage("Output features: {}".format(drive_time_areas_output))


    #Get the URL to the async service area service
    tbx = aolutils.getRemoteToolbox(hostedgp, "asyncServiceArea")
    arcpy.AddMessage("Adding remote toolbox {0}".format(tbx))
    #Call the service
    overlap_policy_keywords = {"Overlap" : "Overlapping",
                               "Dissolve" : "Merge by Break Value",
                               "Split" : "Not Overlapping"}
    time_zone_keywords = {"GeoLocal" : "Geographically Local",
                          "UTC": "UTC"}
    travel_direction_keywords = {"AwayFromFacility": "Away From Facility",
                                 "TowardsFacility": "Towards Facility"}
    analysis_region = ""
    polygon_detail = "High" if include_holes else "Standard"
    service_area_output_type = "Polygons and lines" if include_streets else "Polygons"

    task_params = [input_layer, break_values_str, break_units, analysis_region, travel_direction_keywords[travel_direction], 
                   time_of_day, "", "",
                   overlap_policy_keywords[overlap_policy], "", "", "", "", point_barrier_layer.layer,
                   line_barrier_layer.layer, polygon_barrier_layer.layer, "", "",
                   time_zone_keywords[time_zone_for_time_of_day], travel_mode, "", "", "", "", "", polygon_detail,
                   service_area_output_type]
    ignore_error_codes = (30097, 30113, 30114)
    service_result = networkanalysis.call_async_gp_service(tbx, "GenerateServiceAreas", task_params,
                                                           ignore_error_codes, (RESTRICTIONS_PARAMETER_INDEX,))
    
    #Reset the timer as the callAsyncGPService handles its own timing
    startTime = time.time()

    #Save the results from the remote tool. project the output features to be in the same spatial reference
    #as the inputLayer using copy features. Make sure to clear out the extent before copy
    if DEBUG:
        out_sr = arcpy.env.outputCoordinateSystem
        out_sr_name = out_sr.name if out_sr else "None"
        arcpy.AddMessage("arcpy.env.outputCoordinateSystem: {0} ".format(out_sr_name))
    orig_extent = arcpy.env.extent
    orig_out_sr = arcpy.env.outputCoordinateSystem
    arcpy.env.extent = None
    arcpy.env.outputCoordinateSystem = input_layer_desc.spatialReference
    arcpy.management.CopyFeatures(service_result.getOutput(0), drive_time_areas_output)
    if include_streets:
        arcpy.management.CopyFeatures(service_result.getOutput(4), service_area_lines_output)
    arcpy.env.extent = orig_extent
    arcpy.env.outputCoordinateSystem = orig_out_sr
    startTime = aolutils.AddTimerMessage(startTime, "Saved the results from remote tool")

    #See how many output features we got and in which spatial reference.
    if DEBUG:
        count_output_areas = int(arcpy.management.GetCount(drive_time_areas_output).getOutput(0))
        arcpy.AddMessage("Created {0} drive time areas".format(count_output_areas))
        arcpy.AddMessage("SR of {0} is {1}".format(drive_time_areas_output,
                                                   arcpy.Describe(drive_time_areas_output).spatialReference.name))

    #Delete FacilityID fields from the output
    arcpy.management.DeleteField(drive_time_areas_output, "FacilityID")

    #Add the AnalysisArea field in breakUnits if breakUnits are distance based else add the analysis area based
    #on units in the user profile.    
    desc_drive_time_areas_output = arcpy.Describe(drive_time_areas_output)
    if break_units_lower in TIME_UNITS:
        area_units = aolutils.getUnits(hostedgp, True)
        measure_unit_type = "Time"
    else:
        area_units = "Square{0}".format(break_units)
        measure_unit_type = "Distance"
    
    travel_mode_measure_type = "Travel {0}".format(measure_unit_type)
    aolutils.createShapeAreaField(drive_time_areas_output, area_units, desc_drive_time_areas_output,
                                  area_field_alias="Area (Square {0})".format(area_units.lstrip("Square")))
    
    #Add aliases for the fields specific to polygons. Leave the alias for fields joined from input points as is.
    field_aliases = {
        "FromBreak" : "{0} Start ({1})".format(travel_mode_measure_type, break_units),
        "ToBreak" : "{0} End ({1})".format(travel_mode_measure_type, break_units),
        "Name" : "Name and Size",
        "FacilityOID" : "Facility ID",
    }
    for fld in field_aliases:
        arcpy.management.AlterField(drive_time_areas_output, fld, new_field_alias=field_aliases[fld])

    #Set the travel mode name if we have legacy travel mode keywords
    if not travel_mode_name:
        travel_mode_name = "{0} {1}".format(travel_mode.title(), measure_unit_type)
    func_end = time.time()
    arcpy.AddMessage("Total time to create_drive_time_areas function: {0} seconds".format(round(func_end - func_start),2))
    return drive_time_areas_output, startTime
    

if __name__ == "__main__":
    
    hostedgp = None
    start_time = time.time()
    begin_time = start_time
    try:
        hostedgp = agolgp.HostedGP(8, 7)        
        output_hosted_name = hostedgp.GetOutputName(7)
        # check credits balance
        aolutils.checkForCredits(TASK_NAME)
        #check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, output_hosted_name)
        system_error_codes = [30096, 30097, 30109, 30120, 30122, 30123]

        
        #hosted_input = hostedgp.GetHostedLayer(0)
        hosted_input, input_layer_count = aolutils.getHostedLayerX(hostedgp, "inputLayer", 0, use_as_soap_input=True)
        start_time = aolutils.AddTimerMessage(start_time,  "Read hosted input")
        #get the inputs
        break_values = arcpy.GetParameter(1)
        break_units = arcpy.GetParameterAsText(2)
        travel_mode = arcpy.GetParameterAsText(3)
        overlap_policy = arcpy.GetParameterAsText(4)
        time_of_day = arcpy.GetParameter(5)
        time_zone_for_time_of_day = arcpy.GetParameterAsText(6)
        point_barrier_layer, point_barrier_count = aolutils.getHostedLayerX(hostedgp, "pointBarrierLayer",
                                                                            9, False, use_as_soap_input=True)
        line_barrier_layer, line_barrier_count = aolutils.getHostedLayerX(hostedgp, "lineBarrierLayer",
                                                                          10, False, use_as_soap_input=True)
        polygon_barrier_layer, polygon_barrier_count = aolutils.getHostedLayerX(hostedgp, "polygonBarrierLayer",
                                                                                11, False, use_as_soap_input=True)
        travel_direction = arcpy.GetParameterAsText(12)
        show_holes = arcpy.GetParameter(13)
        include_streets = arcpy.GetParameter(14)
        # Do not pass barrier layer if their count is zero. For example, there might not be any barrier features within
        # the map extent and in this case the barrier layer has all the barrier features which is not what we want to
        # use in the analysis.
        point_barrier_layer = point_barrier_layer if point_barrier_count else None
        line_barrier_layer = line_barrier_layer if line_barrier_count else None
        polygon_barrier_layer = polygon_barrier_layer if polygon_barrier_count else None
        input_layer = hosted_input.name
        input_layer_name = hosted_input.layername
        if not input_layer_name:
            input_layer_name = "Input Layer"
        #input_layer_count = hosted_input.count
        if include_streets and not output_hosted_name.createService:
            aolutils.AddErrorCode(100297, ERROR_CODES[100297])
            raise arcpy.ExecuteError
        elif not include_streets and not output_hosted_name.createService:
            if input_layer_count * len(break_values) > 9999:
                aolutils.AddErrorCode(100291, ERROR_CODES[100291])
                raise arcpy.ExecuteError
        
        #Create the inmemory drive time areas
        #travel mode name is determined inside the function
        travel_mode_name = ""
        drive_time_areas_output, time_elapsed = create_drive_time_areas(hostedgp, input_layer,
                                                                        break_values, break_units,
                                                                        time_of_day, overlap_policy,
                                                                        input_layer_name,
                                                                        time_zone_for_time_of_day, travel_mode, False,
                                                                        point_barrier_layer, line_barrier_layer,
                                                                        polygon_barrier_layer, travel_direction,
                                                                        show_holes, include_streets)

        save_output(hostedgp, break_values, travel_mode_name, drive_time_areas_output, output_hosted_name, time_elapsed,
                    include_streets, break_units)
        
        #Reset the timer as save_output function does its own timing.
        start_time = time.time()
        #report metering info
        overlap_policy_values = {
            "Overlap" : 1,
            "Dissolve" : 2,
            "Split" : 3,
        }
        travel_mode_values = {
            "Driving" : 1,
            "Trucking" : 2,
            "Walking" : 3,
        }
        time_zone_values = {
            "GeoLocal" : 0,
            "UTC" : 1
            }
        break_units_values = {
            "Minutes" : 1,
            "Seconds" : 2,
            "Hours" : 3,
            "Miles" : 4,
            "Kilometers" : 5,
            "Meters" : 6,
            "Feet": 7,
            "Yards": 8
        }
        output_return_type = 2 if output_hosted_name.createService else 1
        time_of_day_value = time.mktime(time_of_day.timetuple()) * 1000 if time_of_day else None
        values = [
            1,                          # input is always point
            input_layer_count,          #num objects is total input points processed.
            len(break_values),          # number of breaks
            break_units_values.get(break_units,0), #units for breaks
            travel_mode_values.get(travel_mode, 0), # travel mode
            overlap_policy_values.get(overlap_policy, 0), #overlap policy
            time_of_day_value,
            time_zone_values.get(time_zone_for_time_of_day,0),
            output_return_type          # output is feature collection or feature service
        ]
        aolutils.LogUsageMetering(TASK_NAME, input_layer_count, 0, begin_time, values)
        start_time = aolutils.AddTimerMessage(start_time, "Completed metering")
        #report cost
        paramsDict = {
            "inputLayer":{
                "count": input_layer_count,
                "shapeType": hosted_input.shapeType
                },
            "breakValues": break_values,
            "breakUnits": break_units,
            "travelMode" : travel_mode,
            "overlapPolicy" : overlap_policy,
            "timeOfDay": time_of_day_value,
            "timeZoneForTimeOfDay" : time_zone_for_time_of_day,
        }
        aolutils.reportParamsForCost(hostedgp, TASK_NAME, paramsDict)
        start_time = aolutils.AddTimerMessage(start_time, "Completed cost reporting")
        
    except arcpy.ExecuteError as err:
        #Check if we need to handle any error codes reported from the remote service
        if err.args:
            exception_args = err.args[0]
            #arcpy.AddMessage("exception args: {0}".format(exception_args))
            if 30137 in exception_args:
                msg_code = 100100
                msg_params = {
                    "inputLayer" : input_layer_name,
                    "url" : "http://www.arcgis.com/home/item.html?id=b7a893e8e1e04311bd925ea25cb8d7c7"
                    }
                msg = ERROR_CODES[msg_code].format(**msg_params)
                aolutils.AddErrorCode(msg_code, msg, msg_params)
            if 30146 in exception_args:
                msg_code = 100117
                aolutils.AddErrorCode(msg_code, ERROR_CODES[msg_code])
            if 30024 in exception_args:          
                #30024 code is returned when solve returns a failure. Check for special solve failure cases for which
                #we have created ERROR_CODES.
                #Check if we got 30024 due to invalid locations
                solve_failed_messages = exception_args[30024]
                if INVALID_LOCATIONS_SOLVER_ERROR_MESSAGE in solve_failed_messages:
                    msg_code = 100101
                    msg_params ={
                        "inputLayer" : input_layer_name,
                        "max" : MAX_SEARCH_TOLERANCE_KM,
                        }
                    msg = ERROR_CODES[msg_code].format(**msg_params)
                    aolutils.AddErrorCode(msg_code, msg, msg_params)
                elif "\n".join(solve_failed_messages).find(DIFFERENT_TIME_ZONE_ERROR_MESSAGE) != -1:
                    msg_code = 100102
                    msg_params = {"inputLayer" : input_layer_name}
                    msg = ERROR_CODES[msg_code].format(**msg_params)
                    aolutils.AddErrorCode(msg_code, msg, msg_params)
                else:
                    #log any other  solver failed messages
                    arcpy.AddMessage(solve_failed_messages)
            if 30150 in exception_args:
                #30150 is returned when there is a mismatch between travel mode and break units.
                msg_code = 100146
                msg_params = {
                    "breakUnits" : break_units,
                    "travelMode" : networkanalysis.get_travel_mode_from_json(travel_mode).name,
                    }
                msg = ERROR_CODES[msg_code].format(**msg_params)
                aolutils.AddErrorCode(msg_code, msg, msg_params)
            if 30095 in exception_args:
                # Barrier limit exceeded
                msg_code = 0
                for msg_txt in exception_args[30095]:
                    if "PolygonBarriers" in msg_txt:
                        msg_code = 100267
                        limit = 2000
                        break
                    elif "PolylineBarriers" in msg_txt:
                        msg_code = 100266
                        limit = 500
                        break
                    elif "Barriers" in msg_txt:
                        msg_code = 100265
                        limit = 250
                        break
                if msg_code:
                    msg = networkanalysis.NetworkAnalysisTool.ERROR_CODES[msg_code]
                    aolutils.AddErrorCode(msg_code, msg, {"limit": limit})
                
        #Add the generic tak failed message
        aolutils.AddExecuteErrors(TASK_NAME, system_error_codes)

    except SystemExit as ex:
        #Will be raised when the script is being cancelled.
        arcpy.AddMessage("No outputs as script was canceled")    

    except Exception as err:
        import traceback
        import sys
        msgs = traceback.format_exception(*sys.exc_info())[1:]
        for msg in msgs:
            arcpy.AddMessage(msg.strip())        
        aolutils.AddExceptionError(TASK_NAME, err)

    finally:
        if hostedgp:
            hostedgp.Cleanup()        
            aolutils.AddTimerMessage(start_time, "Performed cleanup")
