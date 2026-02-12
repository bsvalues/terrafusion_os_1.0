"""---------------------------------------------------------------------------
Name:              ChooseBestFacilities.py
Purpose:           Choose best locations for facilities by allocating locations
                   that have demand for these facilities in a way that satisfies
                   a given goal.
Author:            Esri Inc.
Created:           01/04/2016
Copyright:   (c)   Esri, Inc. 2016
ArcGIS Version:    March 2016 update
---------------------------------------------------------------------------"""

#core libraries
import time

#internal libraries
import arcpy
import hostedgp as agolgp
import aolutils
import rendererUtils
import networkanalysis
import popup

###Constants used in Debugging
DEBUG = False
OUT_WORKSPACE = "in_memory"
#OUT_WORKSPACE = arcpy.env.scratchGDB
if DEBUG:
    OUT_WORKSPACE = arcpy.env.scratchGDB
    arcpy.env.overwriteOutput = True
###

###Constants about tool info
TASK_NAME = "ChooseBestFacilities"
PARAM_NAMES = {
    "goal" : 0,
    "demandLocationsLayer" : 1,
    "demand" : 2,
    "demandField" : 3,
    "maxTravelRange" : 4,
    "maxTravelRangeField" : 5,
    "maxTravelRangeUnits" : 6,
    "travelMode" : 7,
    "timeOfDay" : 8,
    "timeZoneForTimeOfDay" : 9,
    "travelDirection" : 10,
    "requiredFacilitiesLayer" : 11,
    "requiredFacilitiesCapacity" : 12,
    "requiredFacilitiesCapacityField" : 13,
    "candidateFacilitiesLayer" : 14,
    "candidateCount" : 15,
    "candidateFacilitiesCapacity" : 16,
    "candidateFacilitiesCapacityField" : 17,
    "percentDemandCoverage" : 18,
    "outputName" : 19,
    "context" : 20,
    "pointBarrierLayer": 21,
    "lineBarrierLayer": 22,
    "polygonBarrierLayer": 23,
    "allocatedDemandLocationsLayer" : 24,
    "allocationLinesLayer" : 25,
    "assignedFacilitiesLayer" : 26,
    }
###

###Constants for defining renderers
# Color blind safe colors obtained from http://www.visualisingdata.com/2015/11/colour-swatch-alternatives-to-green-and-red/
SYMBOL_COLOR = [233, 191, 255, 255]
UNASSIGNED_SYMBOL_COLOR = [215, 25, 28, 255]
ASSIGNED_SYMBOL_COLOR = [77, 140, 38, 255]
REQUIRED_SYMBOL_COLOR = [1, 133, 113, 255]
SYMBOL_OUTLINE_COLOR = [255, 255, 115, 255]
LINE_BASE_SYMBOL = {
    "type": "esriSLS",
    "style": "esriSLSSolid",
    "color": SYMBOL_COLOR,
    "width" : 2.0, #arcgis.com map viewer will show symbol size as this value +1
    "outline": {
        "type": "esriSLS",
        "style": "esriSLSSolid",
        "color": SYMBOL_OUTLINE_COLOR,
        "width": 2.0
        }
    }
POINT_BASE_SYMBOL = {
    "type":"esriSMS",
    "style":"esriSMSCircle",
    "color":SYMBOL_COLOR,
    "size": 10.0,
    "outline": {
        "color":SYMBOL_OUTLINE_COLOR,
        "width":1.0
        }
    }

UNIQUE_VALUE_RENDERER_DEF = {
    "type": "uniqueValueDef",
    "uniqueValueFields": ["FacilityOID"],
    "fieldDelimiter": ",",
    "baseSymbol": POINT_BASE_SYMBOL,
    "colorRamp": {
        "type": "multipart",
        "colorRamps": [
            {
             "type": "algorithmic",
             "fromColor": [132, 0, 168, 255],
             "toColor": [231, 150, 255, 255],
             "algorithm": "esriHSVAlgorithm"
             },
            {
             "type": "algorithmic",
             "fromColor": [133, 188, 255, 255],
             "toColor": [0, 78, 186, 255],
             "algorithm": "esriHSVAlgorithm"
            },
            {
             "type": "algorithmic",
             "fromColor": [112, 224, 0, 255],
             "toColor": [0, 163, 54, 255],
             "algorithm": "esriHSVAlgorithm"
            }
            ]
        }
    }
LINE_TRANSPARENCY = 25

###

def save_outputs(choose_best_facilities, output_hosted_name):
    '''Symbolize the outputs, create popups and save the outputs to hosted feature service or
    a feature collection'''

     ##Create results
    with networkanalysis.LogExecutionTime("Created result symbology"):
        res = aolutils.HostedToolResult(output_hosted_name)
        out_allocation_lines_layer_name = "Allocation Lines"
        out_assigned_facilities_layer_name = "Assigned Facilities"
        out_allocated_demand_locations_layer_name = "Allocated Demand Locations"
        allocated_demand_field = "FacilityOID"
        is_percent_coverage = True if choose_best_facilities.goal == "PercentCoverage" else False
        OUT_ASSIGNED_FACILITIES_LAYER_ID = 0
        OUT_ALLOCATED_DEMAND_LOCATIONS_LAYER_ID = 1
        OUT_ALLOCATION_LINES_LAYER_ID = 2
        DEMAND_LOCATION_SYMBOL_SIZE = 8

        # The symbology for results is based on the concept of three unique colors for chosen, required and candidate
        # facilities. The required facilities are drawn using a different marker (diamond). For cover a percentage of
        # demand goal, since a demand can be assigned to multiple facilities, we only use two unique colors, but 
        # still retain the diamond marker for required facilities. 

        if choose_best_facilities.assignedFacilities and choose_best_facilities.allocatedDemandLocations and choose_best_facilities.allocationLines:
            #Create drawing Info for allocation lines using a unique value renderer based on FacilityOID field
            desc_out_allocation_lines = arcpy.Describe(choose_best_facilities.allocationLines)
            desc_out_assigned_facilities = arcpy.Describe(choose_best_facilities.assignedFacilities)
            desc_out_allocated_demand_locations = arcpy.Describe(choose_best_facilities.allocatedDemandLocations)
            # Set labels specific to cover a percentage of demand goal
            chosen_label = "Chosen"
            required_label = "Required"
            unallocated_label = "Unallocated" if is_percent_coverage else "Unallocated Demand Location"
            required_color = ASSIGNED_SYMBOL_COLOR if is_percent_coverage else REQUIRED_SYMBOL_COLOR 

            #Get Oids for chosen and required facilities so that they can be assigned different markers
            required_facility_oids = []
            chosen_facility_oids = []
            with arcpy.da.SearchCursor(choose_best_facilities.assignedFacilities, ("OID@", "FacilityType"),
                                       "DemandCount <> 0" ) as cursor:
                for row in cursor:
                    if row[1] == "Required":
                        required_facility_oids.append(str(row[0]))
                    elif row[1] == "Chosen":
                        chosen_facility_oids.append(str(row[0]))
       
            renderer_def_allocation_lines = dict(UNIQUE_VALUE_RENDERER_DEF)
            renderer_def_allocation_lines["baseSymbol"] = LINE_BASE_SYMBOL
            drawing_info_allocation_lines = rendererUtils.getUniqueValueRendererInfo(choose_best_facilities.allocationLines,
                                                                                     ["FacilityOID"], LINE_TRANSPARENCY,
                                                                                     renderer_def_allocation_lines,
                                                                                     False)

            # Change the label and symbol color for allocation line so that we have only two symbols, one symbol color
            # for lines to chosen facilities and another symbol color for lines to required facilities
            for unique_value in drawing_info_allocation_lines["renderer"]["uniqueValueInfos"]:
                if unique_value["value"] in chosen_facility_oids:
                    unique_value["label"] = "{} Facility".format(chosen_label)
                    unique_value["symbol"]["color"] = ASSIGNED_SYMBOL_COLOR
                elif unique_value["value"] in required_facility_oids:
                    unique_value["label"] = "{} Facility".format(required_label)
                    unique_value["symbol"]["color"] = required_color
                else:
                    unique_value["label"] = "Unassigned Facility"
                    unique_value["symbol"]["color"] = UNASSIGNED_SYMBOL_COLOR

            # Use a square marker symbol for assigned facilities
            assigned_facilities_symbol = dict(POINT_BASE_SYMBOL)
            assigned_facilities_symbol["style"] = "esriSMSSquare"
            renderer_def_assigned_facilities = dict(UNIQUE_VALUE_RENDERER_DEF)
            renderer_def_assigned_facilities["baseSymbol"] = assigned_facilities_symbol
            drawing_info_assigned_facilities = rendererUtils.getUniqueValueRendererInfo(choose_best_facilities.assignedFacilities,
                                                                                   ["FacilityOID"], 0, 
                                                                                   rendererDef=renderer_def_assigned_facilities,
                                                                                   showOtherValues=True,
                                                                                   dataWhereClause="DemandCount <> 0")

            # Change the color for the various facilities symbol
            unassigned_facilities_symbol = dict(assigned_facilities_symbol)
            unassigned_facilities_symbol["color"] = UNASSIGNED_SYMBOL_COLOR
            req_facilities_symbol = dict(assigned_facilities_symbol)
            req_facilities_symbol["color"] = required_color
            req_facilities_symbol["size"] = 15
            req_facilities_symbol["style"] = "esriSMSDiamond"
            assigned_facilities_symbol["color"] = ASSIGNED_SYMBOL_COLOR
            assigned_facilities_renderer = drawing_info_assigned_facilities["renderer"]
            assigned_facilities_renderer["defaultLabel"] = "Unassigned"
            assigned_facilities_renderer["defaultSymbol"] = unassigned_facilities_symbol
            for unique_value in assigned_facilities_renderer["uniqueValueInfos"]:
                if unique_value["value"] in required_facility_oids:
                    # unique_value["symbol"]["style"] = "esriSMSDiamond"
                    # unique_value["symbol"]["size"] = 15
                    # unique_value["symbol"]["color"] = required_color
                    unique_value["symbol"] = req_facilities_symbol
                    unique_value["label"] = required_label
                elif unique_value["value"] in chosen_facility_oids:
                    # unique_value["symbol"]["color"] = ASSIGNED_SYMBOL_COLOR
                    unique_value["symbol"] = assigned_facilities_symbol
                    unique_value["label"] = chosen_label
                else:
                    # unique_value["symbol"]["color"] = UNASSIGNED_SYMBOL_COLOR
                    unique_value["symbol"] = unassigned_facilities_symbol
                    unique_value["label"] = "Unassigned"

            # For Cover a percentage of demand goal, the demand locations layer does not populate FacilityOID field
            # since a demand can be allocated to more than one facility. In such cases use AllocatedDemand field to
            # determine if the demand was allocated to any facility.
            if is_percent_coverage:
                allocated_demand_field = "AllocatedDemand"
            #Use the default circle marker for allocated demand points
            drawing_info_allocated_demand_locations = rendererUtils.getUniqueValueRendererInfo(choose_best_facilities.allocatedDemandLocations,
                                                                                               [allocated_demand_field], 0, 
                                                                                               rendererDef=dict(UNIQUE_VALUE_RENDERER_DEF),
                                                                                               showOtherValues=True,
                                                                                               dataWhereClause="{} IS NOT NULL".format(allocated_demand_field))

            #Change the symbol and label for all other values in unique value renderer for allocated demand points
            allocated_demand_locations_symbol = dict(POINT_BASE_SYMBOL)
            allocated_demand_locations_symbol["color"] = ASSIGNED_SYMBOL_COLOR
            allocated_demand_locations_symbol["size"] = DEMAND_LOCATION_SYMBOL_SIZE
            unallocated_demand_locations_symbol = dict(POINT_BASE_SYMBOL)
            unallocated_demand_locations_symbol["color"] = UNASSIGNED_SYMBOL_COLOR
            unallocated_demand_locations_symbol["size"] = DEMAND_LOCATION_SYMBOL_SIZE
            allocated_demand_locations_renderer = drawing_info_allocated_demand_locations["renderer"]
            allocated_demand_locations_renderer["defaultLabel"] = unallocated_label
            allocated_demand_locations_renderer["defaultSymbol"] = unallocated_demand_locations_symbol
            #Change the label for allocated demand location symbol 
            for unique_value in allocated_demand_locations_renderer["uniqueValueInfos"]:
                if unique_value["value"] in chosen_facility_oids:
                    unique_value["label"] = "Chosen Facility"
                    # unique_value["symbol"]["color"] = ASSIGNED_SYMBOL_COLOR
                    unique_value["symbol"] = allocated_demand_locations_symbol
                elif unique_value["value"] in required_facility_oids:
                    unique_value["label"] = "Required Facility"
                    unique_value["symbol"] = dict(allocated_demand_locations_symbol)
                    unique_value["symbol"]["color"] = REQUIRED_SYMBOL_COLOR
                elif is_percent_coverage:
                    unique_value["label"] = "Allocated"
                    unique_value["symbol"] = allocated_demand_locations_symbol
                else:
                    unique_value["label"] = "Facility {}".format(unique_value["label"])
                unique_value["symbol"]["size"] = DEMAND_LOCATION_SYMBOL_SIZE
            
            #create popups
            popup_allocation_lines = popup.feature_layer_popup(desc_out_allocation_lines,
                                                               "Summary of {}".format(out_allocation_lines_layer_name))
            popup_assigned_facilities = popup.feature_layer_popup(desc_out_assigned_facilities,
                                                                  "Summary of {}".format(out_assigned_facilities_layer_name))
            popup_allocated_demand_locations = popup.feature_layer_popup(desc_out_allocated_demand_locations,
                                                                         "Summary of {}".format(out_allocated_demand_locations_layer_name))
        
            #Create one to many relationship between assigned facilities and allocated demand locations and between
            #assigned facilities and allocated lines.
            #When one layer has mutiple releationships, but relationships are assigned id 0 which causes query related
            #records to not work correctly on the output feature service. So until this is fixed in hosted
            #feature services, skip creating assigned facilities and allocated lines relationship.
            facility_to_demand_locations_rel_name = "AssignedFacilitiesToAllocatedDemandLocations"
            #facility_to_allocation_lines_rel_name = "AssignedFacilitiesToAllocationLines"
            facility_to_demand_locations_rel_def = aolutils.getRelationshipDef(facility_to_demand_locations_rel_name,
                                                                               OUT_ALLOCATED_DEMAND_LOCATIONS_LAYER_ID,
                                                                               "FacilityOID", isOrigin=True,
                                                                               isComposite=False)
            #facility_to_allocation_lines_rel_def = aolutils.getRelationshipDef(facility_to_allocation_lines_rel_name,
            #                                                                   OUT_ALLOCATION_LINES_LAYER_ID,
            #                                                                   "FacilityOID", isOrigin=True,
            #                                                                   isComposite=False)

            demand_locations_rel_def = aolutils.getRelationshipDef(facility_to_demand_locations_rel_name,
                                                                   OUT_ASSIGNED_FACILITIES_LAYER_ID, "FacilityOID",
                                                                   isOrigin=False, isComposite=False)
            #allocation_lines_rel_def = aolutils.getRelationshipDef(facility_to_allocation_lines_rel_name,
            #                                                       OUT_ASSIGNED_FACILITIES_LAYER_ID, "FacilityOID",
            #                                                       isOrigin=False, isComposite=False)
            
            out_description_assigned_facilities = aolutils.getOutDescription(out_assigned_facilities_layer_name,
                                                                             OUT_ASSIGNED_FACILITIES_LAYER_ID,
                                                                             drawing_info_assigned_facilities,
                                                                             popup_assigned_facilities,
                                                                             [facility_to_demand_locations_rel_def])

            #out_description_assigned_facilities = aolutils.getOutDescription(out_assigned_facilities_layer_name,
            #                                                                 OUT_ASSIGNED_FACILITIES_LAYER_ID,
            #                                                                 drawing_info_assigned_facilities, None,
            #                                                                 [facility_to_demand_locations_rel_def,
            #                                                                  facility_to_allocation_lines_rel_def])

            out_description_allocated_demand_locations = aolutils.getOutDescription(out_allocated_demand_locations_layer_name,
                                                                                    OUT_ALLOCATED_DEMAND_LOCATIONS_LAYER_ID,
                                                                                    drawing_info_allocated_demand_locations,
                                                                                    popup_allocated_demand_locations,
                                                                                    [demand_locations_rel_def])
            #out_description_allocation_lines = aolutils.getOutDescription(out_allocation_lines_layer_name,
            #                                                              OUT_ALLOCATION_LINES_LAYER_ID,
            #                                                              drawing_info_allocation_lines, None,
            #                                                              [allocation_lines_rel_def])

            out_description_allocation_lines = aolutils.getOutDescription(out_allocation_lines_layer_name,
                                                                          OUT_ALLOCATION_LINES_LAYER_ID,
                                                                          drawing_info_allocation_lines,
                                                                          popup_allocation_lines)
            

            #Need to add all point layers first to feature service followed by line layers
            res.addHostedOutput(desc_out_assigned_facilities, out_description_assigned_facilities,
                                PARAM_NAMES["assignedFacilitiesLayer"])
            res.addHostedOutput(desc_out_allocated_demand_locations, out_description_allocated_demand_locations,
                                PARAM_NAMES["allocatedDemandLocationsLayer"])
            res.addHostedOutput(desc_out_allocation_lines, out_description_allocation_lines,
                                PARAM_NAMES["allocationLinesLayer"])
    
    res.generateHostedResult(hostedgp, time.time())

if __name__ == "__main__":
    
    hostedgp = None
    
    try:
        hostedgp = agolgp.HostedGP(PARAM_NAMES["context"], PARAM_NAMES["outputName"])
        output_hosted_name = hostedgp.GetOutputName(PARAM_NAMES["outputName"])
        handled_error_codes = list(networkanalysis.ChooseBestFacilities.ERROR_CODES.keys())
        # check credits balance
        aolutils.checkForCredits(TASK_NAME)
        #check publishing privilege
        aolutils.checkPublishingPrivilege(hostedgp, output_hosted_name)
        #Check if the user has networkanalysis privilege
        if not aolutils.checkPrivilege(networkanalysis.NETWORK_ANALYSIS_PRIVILEGE, hostedgp):
            aolutils.AddErrorCode(100111, networkanalysis.ERROR_CODES.get(100111, ""))
            raise arcpy.ExecuteError
        
        #Read the inputs
        with networkanalysis.LogExecutionTime("Read inputs"):
            goal = arcpy.GetParameterAsText(PARAM_NAMES["goal"])
            hosted_demand_locations_layer, demand_locations_layer_count = aolutils.getHostedLayerX(hostedgp,
                                                                                                   "demandLocationsLayer", 
                                                                                                   PARAM_NAMES["demandLocationsLayer"],
                                                                                                   use_as_soap_input=True)
            demand = arcpy.GetParameter(PARAM_NAMES["demand"])
            demand_field = arcpy.GetParameterAsText(PARAM_NAMES["demandField"])
            max_travel_range = arcpy.GetParameter(PARAM_NAMES["maxTravelRange"])
            max_travel_range_field = arcpy.GetParameterAsText(PARAM_NAMES["maxTravelRangeField"])
            max_travel_range_units = arcpy.GetParameterAsText(PARAM_NAMES["maxTravelRangeUnits"])
            travel_mode = arcpy.GetParameterAsText(PARAM_NAMES["travelMode"])
            time_of_day = arcpy.GetParameter(PARAM_NAMES["timeOfDay"])
            time_zone_for_time_of_day = arcpy.GetParameterAsText(PARAM_NAMES["timeZoneForTimeOfDay"])
            travel_direction = arcpy.GetParameterAsText(PARAM_NAMES["travelDirection"])
            hosted_required_facilities_layer, required_facilities_layer_count = aolutils.getHostedLayerX(hostedgp,
                                                                                                         "requiredFacilitiesLayer", 
                                                                                                         PARAM_NAMES["requiredFacilitiesLayer"],
                                                                                                         use_as_soap_input=True)
            required_facilities_capacity = arcpy.GetParameter(PARAM_NAMES["requiredFacilitiesCapacity"])
            required_facilities_capacity_field = arcpy.GetParameterAsText(PARAM_NAMES["requiredFacilitiesCapacityField"])
            hosted_candidate_facilities_layer, candidate_facilities_layer_count = aolutils.getHostedLayerX(hostedgp,
                                                                                                           "candidateFacilitiesLayer",
                                                                                                           PARAM_NAMES["candidateFacilitiesLayer"],
                                                                                                           use_as_soap_input=True)
            candidate_count = arcpy.GetParameter(PARAM_NAMES["candidateCount"])
            candidate_facilities_capacity = arcpy.GetParameter(PARAM_NAMES["candidateFacilitiesCapacity"])
            candidate_facilities_capacity_field = arcpy.GetParameterAsText(PARAM_NAMES["candidateFacilitiesCapacityField"])
            percent_demand_coverage = arcpy.GetParameter(PARAM_NAMES["percentDemandCoverage"])
            point_barrier_layer, point_barrier_count = aolutils.getHostedLayerX(hostedgp, "pointBarrierLayer",
                                                                                PARAM_NAMES["pointBarrierLayer"], False,
                                                                                use_as_soap_input=True)
            line_barrier_layer, line_barrier_count = aolutils.getHostedLayerX(hostedgp, "lineBarrierLayer",
                                                                              PARAM_NAMES["lineBarrierLayer"], False,
                                                                              use_as_soap_input=True)
            polygon_barrier_layer, polygon_barrier_count = aolutils.getHostedLayerX(hostedgp, "polygonBarrierLayer",
                                                                                    PARAM_NAMES["polygonBarrierLayer"],
                                                                                    False, use_as_soap_input=True)
            # Do not pass barrier layer if their count is zero. For example, there might not be any barrier features within
            # the map extent and in this case the barrier layer has all the barrier features which is not what we want to
            # use in the analysis.
            point_barrier_layer = point_barrier_layer if point_barrier_count else None
            line_barrier_layer = line_barrier_layer if line_barrier_count else None
            polygon_barrier_layer = polygon_barrier_layer if polygon_barrier_count else None

        #Execute choose best facilities
        # routing_utils_toolbox = aolutils.getRemoteToolbox(hostedgp, "routingUtilities")
        routing_utils_toolbox = aolutils.getHelperServicesUrl(hostedgp, "routingUtilities")
        user_profile_distance_units = aolutils.getUnits(hostedgp, False)
        if not output_hosted_name.createService and demand_locations_layer_count > 9999:
            aolutils.AddErrorCode(100291, networkanalysis.ERROR_CODES[100291])
            raise arcpy.ExecuteError

        choose_best_facilities = networkanalysis.ChooseBestFacilities(goal, hosted_demand_locations_layer, demand,
                                                                      demand_field, max_travel_range,
                                                                      max_travel_range_field, max_travel_range_units,
                                                                      travel_mode, time_of_day,
                                                                      time_zone_for_time_of_day, travel_direction,
                                                                      hosted_required_facilities_layer,
                                                                      required_facilities_capacity,
                                                                      required_facilities_capacity_field,
                                                                      hosted_candidate_facilities_layer,
                                                                      candidate_count, candidate_facilities_capacity,
                                                                      candidate_facilities_capacity_field,
                                                                      percent_demand_coverage, routing_utils_toolbox,
                                                                      OUT_WORKSPACE,
                                                                      preferred_distance_units=user_profile_distance_units,
                                                                      point_barrier_layer=point_barrier_layer,
                                                                      line_barrier_layer=line_barrier_layer,
                                                                      polygon_barrier_layer=polygon_barrier_layer)
        choose_best_facilities.errorFunc = aolutils.AddErrorCode
        choose_best_facilities.warningFunc = aolutils.AddErrorCode
        tbx = aolutils.getRemoteToolbox(hostedgp, "asyncLocationAllocation")
        choose_best_facilities.execute(tbx)
        
        #Save the outputs as hosted feature service or a feature collection
        save_outputs(choose_best_facilities, output_hosted_name)
        
        ##Report metering
        #Create an array of numeric values indicating each parameter value.
        travel_mode_type_values = {
            "OTHER" : 0,
            "AUTOMOBILE" : 1,
            "TRUCK" : 2,
            "WALK" : 3,
        }
        goal_values = {
            "Allocate" : 0,
            "MinimizeImpedance" : 1,
            "MaximizeCoverage" : 2,
            "MaximizeCapacitatedCoverage" : 3,
            "PercentCoverage" : 4,
            }
        max_travel_range_unit_values = {
            "Seconds" : 0,
            "Minutes" : 1,
            "Hours" : 2,
            "Days" : 3,
            "Meters": 4,
            "Kilometers": 5,
            "Feet" : 6,
            "Yards" : 7,
            "Miles" : 8,
            }
        time_zone_values = {
            "UTC" : 0,
            "GeoLocal" : 1,
            }
        travel_direction_values = {
            "DemandToFacility" : 0,
            "FacilityToDemand" : 1,
            }
        time_of_day_value = time.mktime(time_of_day.timetuple()) * 1000 if time_of_day else None
        travel_mode_type_value = travel_mode_type_values.get(choose_best_facilities.travelModeObject.type, 0)
        values = [
            goal_values.get(goal, 0),
            demand_locations_layer_count, 
            demand,             
            1 if demand_field else 0,        
            max_travel_range,
            1 if max_travel_range_field else 0,
            max_travel_range_unit_values.get(max_travel_range_units, 1),
            travel_mode_type_value,
            time_of_day_value,
            time_zone_values.get(time_zone_for_time_of_day, 1),
            travel_direction_values.get(travel_direction, 1),
            required_facilities_layer_count,
            required_facilities_capacity,
            1 if required_facilities_capacity_field else 0,
            candidate_facilities_layer_count,
            candidate_count,
            candidate_facilities_capacity,
            1 if candidate_facilities_capacity_field else 0,
            percent_demand_coverage,
            2 if output_hosted_name.createService else 1, # output is feature collection or feature service
            ]
        #num objects is total input demand locations processed.
        #cost is 0 as the billing happens at logistics.arcgis.com
        aolutils.LogUsageMetering(TASK_NAME, demand_locations_layer_count, 0, time.time(), values)

        ##Report cost
        with networkanalysis.LogExecutionTime("Completed cost reporting"):
            params_dict = {
                "goal" : goal,
                "demandLocationsLayer": {
                    "count": demand_locations_layer_count,
                    "shapeType": hosted_demand_locations_layer.shapeType
                    },
                "demand" : demand,
                "demandField" : demand_field,
                "maxTravelRange" : max_travel_range,
                "maxTravelRangeField" : max_travel_range_field,
                "maxTravelRangeUnits" : max_travel_range_units,
                "travelMode" :  travel_mode_type_value,
                "timeOfDay" : time_of_day_value,
                "timeZoneForTimeOfDay" : time_zone_for_time_of_day,
                "travelDirection": travel_direction,
                "requiredFacilitiesLayer": {
                    "count" : required_facilities_layer_count,
                    "shapeType": hosted_required_facilities_layer.shapeType
                    },
                "requiredFacilitiesCapacity": required_facilities_capacity,
                "requiredFacilitiesCapacityField" : required_facilities_capacity_field,
                "candidateFacilitiesLayer": {
                    "count" : candidate_facilities_layer_count,
                    "shapeType": hosted_candidate_facilities_layer.shapeType
                    },
                "candidateCount": candidate_count,
                "candidateFacilitiesCapacity": candidate_facilities_capacity,
                "candidateFacilitiesCapacityField" : candidate_facilities_capacity_field,
                "percentDemandCoverage" : percent_demand_coverage,
                }
            
            aolutils.reportParamsForCost(hostedgp, TASK_NAME, params_dict)
        
    except arcpy.ExecuteError as ex:
        networkanalysis.log_error_call_stack()
        aolutils.AddExecuteErrors(TASK_NAME, handled_error_codes)
        #Add any error messages that do not have predefined error codes
        arcpy.AddMessage(str(ex))

    except SystemExit as ex:
        #Will be raised when the script is being cancelled.
        arcpy.AddMessage("No outputs as script was canceled")

    except Exception as err:
        networkanalysis.log_error_call_stack()
        aolutils.AddExceptionError(TASK_NAME, err)
    finally:
        if hostedgp:
            hostedgp.Cleanup()