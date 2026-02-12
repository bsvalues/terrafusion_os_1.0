"""Create supporting files that store frequently accessed information about a network dataset."""

import os
import sys
import logging
import configparser
import fnmatch
import json
import urllib.request
import urllib.error
import urllib.parse
import io
import uuid
import base64
import locale
import collections
import shutil
import pprint
import time
import traceback
import requests
import socket
import xml.dom.minidom as DOM
import pickle

import arcpy
import nast


class CreateSupportingFiles:
    """Allows creation of various supporting files for a network dataset."""

    logger = logging.getLogger(__name__)  # logger used by the class
    RESTRICTION_USAGE_VALUES = {  # Keywords for variuos restriction usage numeric values
        "-1.0": "PROHIBITED",
        "5.0": "AVOID_HIGH",
        "2.0": "AVOID_MEDIUM",
        "1.3": "AVOID_LOW",
        "0.5": "PREFER_MEDIUM",
        "0.8": "PREFER_LOW",
        "0.2": "PREFER_HIGH"
    }

    TOOL_LIMITS = {
        "FindClosestFacilities": collections.OrderedDict((
            ("maximumFeaturesAffectedByPointBarriers", None),
            ("maximumFeaturesAffectedByLineBarriers", None),
            ("maximumFeaturesAffectedByPolygonBarriers", None),
            ("maximumFacilities", None),
            ("maximumFacilitiesToFind", None),
            ("maximumIncidents", None),
            ("forceHierarchyBeyondDistance", None),
            ("forceHierarchyBeyondDistanceUnits", "Miles"),
        )),
        "FindRoutes": collections.OrderedDict((
            ("maximumFeaturesAffectedByPointBarriers", None),
            ("maximumFeaturesAffectedByLineBarriers", None),
            ("maximumFeaturesAffectedByPolygonBarriers", None),
            ("maximumStops", None),
            ("maximumStopsPerRoute", None),
            ("forceHierarchyBeyondDistance", None),
            ("forceHierarchyBeyondDistanceUnits", "Miles")
        )),
        "GenerateOriginDestinationCostMatrix": collections.OrderedDict((
            ("maximumFeaturesAffectedByPointBarriers", None),
            ("maximumFeaturesAffectedByLineBarriers", None),
            ("maximumFeaturesAffectedByPolygonBarriers", None),
            ("maximumOrigins", None),
            ("maximumDestinations", None),
            ("forceHierarchyBeyondDistance", None),
            ("forceHierarchyBeyondDistanceUnits", "Miles")
        )),
        "GenerateServiceAreas": collections.OrderedDict(( 
            ("maximumFeaturesAffectedByPointBarriers", None),
            ("maximumFeaturesAffectedByLineBarriers", None),
            ("maximumFeaturesAffectedByPolygonBarriers", None),
            ("maximumFacilities", None),
            ("maximumNumberOfBreaks", None),
            ("maximumBreakTimeValue", None),
            ("maximumBreakTimeValueUnits", "Minutes"),
            ("maximumBreakDistanceValue", None),
            ("maximumBreakDistanceValueUnits", "Miles"),
            ("maximumBreakTimeValueDetailedPolygons", None),
            ("maximumBreakTimeValueUnitsDetailedPolygons", "Minutes"),
            ("maximumBreakDistanceValueDetailedPolygons", None),
            ("maximumBreakDistanceValueUnitsDetailedPolygons", "Miles"),
            ("forceHierarchyBeyondBreakTimeValue", None),
            ("forceHierarchyBeyondBreakTimeValueUnits", "Minutes"),
            ("forceHierarchyBeyondBreakDistanceValue", None),
            ("forceHierarchyBeyondBreakDistanceValueUnits", "Miles"),
        )),
        "SolveLocationAllocation": collections.OrderedDict((
            ("maximumFeaturesAffectedByPointBarriers", None),
            ("maximumFeaturesAffectedByLineBarriers", None),
            ("maximumFeaturesAffectedByPolygonBarriers", None),
            ("maximumFacilities", None),
            ("maximumFacilitiesToFind", None),
            ("maximumDemandPoints", None),
            ("forceHierarchyBeyondDistance", None),
            ("forceHierarchyBeyondDistanceUnits", "Miles"),
        )),
        "SolveVehicleRoutingProblem": collections.OrderedDict((
            ("maximumFeaturesAffectedByPointBarriers", None),
            ("maximumFeaturesAffectedByLineBarriers", None),
            ("maximumFeaturesAffectedByPolygonBarriers", None),
            ("maximumOrders", None),
            ("maximumRoutes", None),
            ("maximumOrdersPerRoute", None),
            ("forceHierarchyBeyondDistance", None),
            ("forceHierarchyBeyondDistanceUnits", "Miles"),
        )),
        "EditVehicleRoutingProblem": collections.OrderedDict((
            ("maximumFeaturesAffectedByPointBarriers", None),
            ("maximumFeaturesAffectedByLineBarriers", None),
            ("maximumFeaturesAffectedByPolygonBarriers", None),
            ("maximumOrders", None),
            ("maximumRoutes", None),
            ("maximumOrdersPerRoute", None),
            ("forceHierarchyBeyondDistance", None),
            ("forceHierarchyBeyondDistanceUnits", "Miles"),
        )),
        "SolveLastMileDelivery": collections.OrderedDict((
            ("maximumFeaturesAffectedByPointBarriers", None),
            ("maximumFeaturesAffectedByLineBarriers", None),
            ("maximumFeaturesAffectedByPolygonBarriers", None),
            ("maximumOrders", None),
            ("maximumRoutes", None),
            ("maximumOrdersPerRoute", None),
            ("maximumRouteDurationHours", None),
            ("maximumGeodesicDistance", None),
            ("maximumGeodesicDistanceUnits", None),
            ("forceHierarchyBeyondDistance", None),
            ("forceHierarchyBeyondDistanceUnits", "Miles"),
        )),
        "SnapToRoads": collections.OrderedDict((
            ("maximumPoints", None),
            ("maximumGeodesicDistance", None),
            ("maximumGeodesicDistanceUnits", None),
            ("maximumGeodesicDistanceWhenWalking", None),
            ("maximumGeodesicDistanceUnitsWhenWalking", None),
        )),
    }

    SERVICE_NAMES = {
        "asyncClosestFacility": ["FindClosestFacilities"],
        "asyncLocationAllocation": ["SolveLocationAllocation"],
        "asyncRoute": ["FindRoutes"],
        "asyncServiceArea": ["GenerateServiceAreas"],
        "asyncVRP": ["SolveVehicleRoutingProblem"],
        "syncVRP": ["EditVehicleRoutingProblem"],
        "asyncODCostMatrix": ["GenerateOriginDestinationCostMatrix"],
        "asyncFleetRouting": ["SolveLastMileDelivery"],
        "snapToRoads": ["SnapToRoads"],
    }

    TIME_UNITS = ('Minutes', 'Hours', 'Days', 'Seconds')

    class NetworkDatasetAttributes(object):
        '''Store info about network dataset attributes such as default restrictions, time costs,
        distance costs and default impedance attribute'''

        def __init__(self, nds_desc, populate_attribute_parameters=True):
            '''Derive info from network dataset attributes'''

            time_costs = []
            distance_costs = []
            other_costs = []
            count = 0
            self.defaultRestrictionAttributes = []
            self.restrictions = []
            self.timeCosts = {}
            self.distanceCosts = {}
            self.otherCosts = {}
            self.defaultImpedanceAttribute = ""
            self.attributeParameters = {}

            attributes = nds_desc.attributes
            for attribute in attributes:
                usage_type = attribute.usageType
                name = attribute.name
                unit = attribute.units
                use_by_default = attribute.useByDefault 
                if usage_type == "Restriction":
                    if use_by_default:
                        self.defaultRestrictionAttributes.append(name)
                    self.restrictions.append(name)
                elif usage_type == "Cost":
                    #Determine if it is time based or distance based
                    if unit in CreateSupportingFiles.TIME_UNITS:
                        time_costs.append((name, unit))
                        if use_by_default:  
                            self.defaultImpedanceAttribute = name
                    elif unit.lower() == "unknown":
                        other_costs.append((name, unit))
                    else:
                        distance_costs.append((name, unit))
                        if use_by_default:
                            self.defaultImpedanceAttribute = name
                else:
                    pass

                #populate all the attribute parameters and their default values.
                #Store this in a dict with key of row id and value as a list
                if populate_attribute_parameters:
                    parameter_count = attribute.parameterCount
                    if parameter_count:
                        for i in range(parameter_count):
                            param_name = getattr(attribute, "parameterName" + str(i))
                            param_default_value = None
                            if hasattr(attribute, "parameterDefaultValue" + str(i)):
                                param_default_value = str(getattr(attribute, "parameterDefaultValue" + str(i)))
                                if param_name.upper() == "RESTRICTION USAGE" and param_default_value in CreateSupportingFiles.RESTRICTION_USAGE_VALUES:
                                    param_default_value = CreateSupportingFiles.RESTRICTION_USAGE_VALUES[param_default_value]
                            count += 1
                            self.attributeParameters[count] = (name, param_name, param_default_value)
        
            # If the network dataset does not define the default cost attribute, use in this order
            #     - first time based cost attribute
            #     - first distance based cost attribute
            #     - first cost attribute
            if not self.defaultImpedanceAttribute:
                if time_costs:
                    self.defaultImpedanceAttribute = time_costs[0][0]
                elif distance_costs:
                    self.defaultImpedanceAttribute = distance_costs[0][0]
                elif other_costs:
                    self.defaultImpedanceAttribute = other_costs[0][0]
                else:
                    self.defaultImpedanceAttribute = ""

            #Return costs as dicts of name: unit
            self.timeCosts = dict(time_costs)
            self.distanceCosts = dict(distance_costs)
            self.otherCosts = dict(other_costs)

            return

    def __init__(self, *args, **kwargs):
        '''Constructor'''

        # Initialize instance attributes
        self.templateNDS = None
        self.templateNDSDesc = None
        self.templateNDSTravelModes = None
        self.travelModesJSON = None
        self.templateNDSWorkspaceDomains = None

        for arg_name in sorted(kwargs):
            self.logger.debug("{0}: {1}".format(arg_name, kwargs[arg_name]))

        # Store tool parameter values as instance attributes
        self.networkDatasets = kwargs.get("network_datasets", None)
        if self.networkDatasets:
            self.networkDatasets = nast.NASolverTool.strip_quotes(self.networkDatasets.split(";"))
            self.templateNDS = self.networkDatasets[0]
            self.templateNDSDesc = arcpy.Describe(self.templateNDS)

        self.supportingFilesFolder = kwargs.get("supporting_files_folder", None)
        self.localizedTravelModesFolder = kwargs.get("localized_travel_modes_folder", None)
        self.serviceLimits = kwargs.get("service_limits", None)

        # Initialize derived outputs
        self.ndsPropertiesFile = os.path.join(self.supportingFilesFolder, "NetworkDatasetProperties.ini")
        self.travelModesFile = os.path.join(self.supportingFilesFolder, "DefaultTravelModes.json")
        self.localizedTravelModesFile = os.path.join(self.supportingFilesFolder, "DefaultTravelModesLocalized.json")
        self.toolInfoFile = os.path.join(self.supportingFilesFolder, "ToolInfo.json")

        # Initialize the file gdb used to store the schema for network source features
        self.na_filegdb = os.path.join(self.supportingFilesFolder, "nainputs.gdb")
        if not os.path.exists(self.na_filegdb):
            arcpy.management.CreateFileGDB(os.path.dirname(self.na_filegdb), os.path.basename(self.na_filegdb))

    def execute(self):
        '''Main execution logic'''
        
        #Create the network dataset properties file
        # parser = configparser.ConfigParser(interpolation=None)
        # #Add a new section with property names and values for each network dataset
        # for network in self.networkDatasets:
        #     network_props = self._getNetworkProperties(network)
        #     parser.add_section(network)
        #     for prop in sorted(network_props):
        #         parser.set(network, prop, str(network_props[prop]))

        # #Write the properties to a ini file
        # self.logger.info("Writing network dataset properties to {0}".format(self.ndsPropertiesFile))
        # with open(self.ndsPropertiesFile, "w") as config_file:
        #     parser.write(config_file)

        #Store the default travel modes
        self._getTravelModes()

        #Store network dataset description as JSON
        template_nds_description = self._getNDSDescription()
        
        #Get service limits
        service_limits = self._getServiceLimits()

        #Write tool info with network dataset description and service limits to a json file
        tool_info_json = {
            "networkDataset" : template_nds_description,
            "serviceLimits": service_limits,
        }
        #Save the localized travel modes to a new file
        self.logger.info("Saving tool info to {0}".format(self.toolInfoFile))
        self._saveJSONToFile(self.toolInfoFile, tool_info_json)

    def _saveJSONToFile(self, file_path, json_content):
        '''Write out the json content to a file'''

        with open(file_path, "w", encoding="utf-8") as json_fp:
            json_fp.write(json.dumps(json_content, sort_keys=True, indent=2, ensure_ascii=False))
            json_fp.write("\n")

    def _getNetworkProperties(self, network):
        '''Populate a dict containing properties for the network dataset'''

        property_names = ("time_attribute", "time_attribute_units", "distance_attribute",
                         "distance_attribute_units", "restrictions", "default_restrictions",
                         "attribute_parameter_values", "feature_locator_where_clause", "Extent",
                         "travel_modes", "default_custom_travel_mode", "walk_time_attribute",
                         "walk_time_attribute_units", "truck_time_attribute", "truck_time_attribute_units",
                         "non_walking_restrictions", "walking_restriction", "trucking_restriction",
                         "time_neutral_attribute", "time_neutral_attribute_units")
        populate_attribute_parameters = True
        esmp_travel_mode_names = ("DRIVING TIME", "DRIVING DISTANCE", "TRUCKING TIME", "TRUCKING DISTANCE",
                                  "WALKING TIME", "WALKING DISTANCE", "RURAL DRIVING TIME", "RURAL DRIVING DISTANCE")
        default_time_attr = ""
        default_distance_attr = ""
        default_impedance_attr = ""
        default_travel_mode_name = ""
        default_travel_mode = None
        default_restriction_attrs = []
        time_costs = {}
        distance_costs = {}
        restrictions = []
        enable_hierarchy = False
        hierarchy = 0
        attribute_parameters = {}
        network_properties = dict.fromkeys(property_names, "")
        
        nds_desc = arcpy.Describe(network)
        nds_type = nds_desc.networkType
        is_sdc_nds = (nds_type == 'SDC')

        nds_travel_modes = {k.upper() : v for k,v in arcpy.na.GetTravelModes(nds_desc.catalogPath).items()}
        # Store travel mode names grouped by type
        nds_travel_mode_types = {}
        for k,v in nds_travel_modes.items():
            travel_mode_type = nds_travel_mode_types.setdefault(v.type, [])
            travel_mode_type.append(k)

        #Build a list of restriction, time and distance cost attributes
        #Get default attributes for geodatabase network datasets.
        nds_attributes = self.NetworkDatasetAttributes(nds_desc, populate_attribute_parameters)
        default_impedance_attr = nds_attributes.defaultImpedanceAttribute
        default_restriction_attrs = nds_attributes.defaultRestrictionAttributes
        time_costs = nds_attributes.timeCosts
        distance_costs = nds_attributes.distanceCosts
        restrictions = nds_attributes.restrictions
        attribute_parameters = nds_attributes.attributeParameters
        
        #Set the default time and distance attributes based on default travel mode. If a default travel mode is not
        #set use the default cost attribute. If even a defualt cost attribute is not set, use the first time based
        #cost attribute in alphabetical order and last distance based cost attribute.
        first_time_cost_attribute = sorted(time_costs.keys())[0]
        default_travel_mode_name = nds_desc.defaultTravelModeName
        # If a default travel mode is not defined, use the first travel mode as default
        if not default_travel_mode_name:
            default_travel_mode_name = sorted(nds_travel_modes.keys())[0]
        if default_travel_mode_name and default_travel_mode_name.upper() in nds_travel_modes:
            default_travel_mode = nds_travel_modes[default_travel_mode_name.upper()]
            default_time_attr = default_travel_mode.timeAttributeName
            default_distance_attr = default_travel_mode.distanceAttributeName
        elif default_impedance_attr in time_costs:
            default_time_attr = default_impedance_attr
        elif default_impedance_attr in distance_costs:
            default_distance_attr = default_impedance_attr
        
        if default_time_attr == "":
            #if there is no default use the first one in the list
            default_time_attr = first_time_cost_attribute
        
        if default_distance_attr == "":
            #Use the last one in case a default is not set
            default_distance_attr = sorted(distance_costs.keys())[-1]
         
        network_properties["time_attribute"] = default_time_attr
        network_properties["time_attribute_units"] = time_costs[default_time_attr]
        #Set the walk time and truck travel time attribute and their units. If the attributes with name
        #WalkTime and TruckTravelTime do not exist, use the first travel mode of type WALK or TRUCK. Otherwise use the
        #first time cost attribute.
        if "WalkTime" in time_costs:
            walk_time_attribute = "WalkTime"
        elif nds_travel_mode_types.get("WALK", None):
            first_walk_type_travel_mode = sorted(nds_travel_mode_types["WALK"])[0]
            walk_time_attribute = nds_travel_modes[first_walk_type_travel_mode].timeAttributeName
        else:
            walk_time_attribute = first_time_cost_attribute
        network_properties["walk_time_attribute"] = walk_time_attribute
        network_properties["walk_time_attribute_units"] = time_costs[walk_time_attribute]
        if "TruckTravelTime" in time_costs:
            truck_time_attribute = "TruckTravelTime"
        elif nds_travel_mode_types.get("TRUCK", None):
            first_truck_type_travel_mode = sorted(nds_travel_mode_types["TRUCK"])[0]
            truck_time_attribute = nds_travel_modes[first_truck_type_travel_mode].timeAttributeName
        else:
            truck_time_attribute = first_time_cost_attribute
        network_properties["truck_time_attribute"] = truck_time_attribute
        network_properties["truck_time_attribute_units"] = time_costs[truck_time_attribute]

        time_neutral_attribute = "Minutes" if "Minutes" in time_costs else first_time_cost_attribute
        network_properties["time_neutral_attribute"] = time_neutral_attribute
        network_properties["time_neutral_attribute_units"] = time_costs[time_neutral_attribute]

        network_properties["distance_attribute"] = default_distance_attr
        network_properties["distance_attribute_units"] = distance_costs[default_distance_attr]
        
        #Set complete restrictions, default restrictions and non-walking restrictions
        network_properties["restrictions"] = ";".join(restrictions)
        network_properties["default_restrictions"] = ";".join(default_restriction_attrs)
        network_properties["non_walking_restrictions"] = ";".join(fnmatch.filter(restrictions, "Driving*"))
        walking_restriction = "Walking" if "Walking" in restrictions else ""
        trucking_restriction = "Driving a Truck" if "Driving a Truck" in restrictions else ""
        network_properties["walking_restriction"] = walking_restriction
        network_properties["trucking_restriction"] = trucking_restriction

        #Set attribute parameters
        if populate_attribute_parameters and attribute_parameters:
            network_properties["attribute_parameter_values"] = pickle.dumps(attribute_parameters)
        
        #Update the feature locator where clause
        if is_sdc_nds:
            source_names = ["SDC Edge Source"]
        else:    
            all_source_names = [source.name for source in nds_desc.sources]
            turn_source_names = [turn_source.name for turn_source in nds_desc.turnSources]
            source_names = list(set(all_source_names) - set(turn_source_names))
        search_query = [('"' + source_name + '"', "#") for source_name in source_names]
        search_query = [" ".join(s) for s in search_query]
        network_properties["feature_locator_where_clause"] = ";".join(search_query)
        
        #store the extent
        extent = nds_desc.Extent
        extent_coords = (str(extent.XMin),str(extent.YMin), str(extent.XMax),
                        str(extent.YMax))
        network_properties["Extent"] = pickle.dumps(extent_coords)
        
        #Store the travel modes in a dict with key as a two value tuple (travel mode type, isModeTimeBased) 
        #and value as travel mode name
        
        travel_modes = {}
        for travel_mode_name in nds_travel_modes:
            nds_travel_mode = json.loads(str(nds_travel_modes[travel_mode_name]))
            travel_mode_impedance = nds_travel_mode["impedanceAttributeName"]
            is_impedance_time_based = None
            if travel_mode_impedance in time_costs:
                is_impedance_time_based = True
            elif travel_mode_impedance in distance_costs:
                is_impedance_time_based = False
            else:
                continue
            if travel_mode_name in esmp_travel_mode_names:
                travel_mode_type = travel_mode_name.split(" ")[0]
            else:
                travel_mode_type = travel_mode_name
            travel_modes[(travel_mode_type, is_impedance_time_based)] = travel_mode_name

        network_properties["travel_modes"] = pickle.dumps(travel_modes)

        #store the travel mode that is used to set the custom travel mode settings parameters
        #default_custom_travel_mode_name = "Driving Time"
        default_custom_travel_mode_name = "DRIVING TIME"
        default_custom_travel_mode = nds_travel_modes.get(default_custom_travel_mode_name, default_travel_mode)
        if default_custom_travel_mode:
            default_custom_travel_mode = str(default_custom_travel_mode)
        network_properties["default_custom_travel_mode"] = default_custom_travel_mode

        return network_properties

    def _getTravelModes(self):
        """Save travel modes used by default for all the routing services."""

        #Store the travel mode name and travel mode ID mappings
        TRAVEL_MODE_IDS = {
            "Driving Time": "FEgifRtFndKNcJMJ",
            "Driving Distance" : "iKjmHuBSIqdEfOVr",
            "Trucking Time" : "ZzzRtYcPLjXFBKwr",
            "Trucking Distance" : "UBaNfFWeKcrRVYIo",
            "Walking Time" : "caFAgoThrvUpkFBW",
            "Walking Distance" : "yFuMFwIYblqKEefX",
            "Rural Driving Time" : "NmNhNDUwZmE1YTlj",
            "Rural Driving Distance" : "Yzk3NjI1NTU5NjVj",
        }
        #File name that contains translations
        LOCALIZED_FILE_NAME = "DefaultTravelModeNamesAndDescriptions.json"
        BOM = "\ufeff"
        default_travel_mode_name = ""
        default_travel_mode_id = ""
       
        #Get all the travel modes defined in the template network dataset
        self.templateNDSTravelModes = arcpy.na.GetTravelModes(self.templateNDSDesc.catalogPath)
        nds_attributes = self.templateNDSDesc.attributes

        #Get the default travel mode. If the network dataset does not define default travel mode, use any travel mode
        #as default
        if hasattr(self.templateNDSDesc, "defaultTravelModeName"):
            default_travel_mode_name = self.templateNDSDesc.defaultTravelModeName
        if not default_travel_mode_name:
            if "Driving Time" in self.templateNDSTravelModes:
                default_travel_mode_name = "Driving Time"
            else:
                default_travel_mode_name = next(iter(self.templateNDSTravelModes.keys()))
        
        #Modify the attribute parameters stored with network dataset travel modes so that they store only those
        #attribute parameters that are relevant to restriction and time and distance attributes used in the travel mode
        travel_modes = {}
        for travel_mode_name in self.templateNDSTravelModes:
            #Generate a new id if a travel mode name is not a esmp travel mode.
            if travel_mode_name in TRAVEL_MODE_IDS:
                travel_mode_id = TRAVEL_MODE_IDS[travel_mode_name]
            else:
                # Create a new 16 digit code. For JSON serialization, the new id should be a str and not bytes
                travel_mode_id = base64.b64encode(uuid.uuid4().hex.encode("utf-8"))[0:16].decode("utf-8")
            travel_mode = json.loads(str(self.templateNDSTravelModes[travel_mode_name]))
            attribute_parameters = travel_mode.get("attributeParameterValues", [])
            applicable_attributes = travel_mode.get("restrictionAttributeNames", []) + [travel_mode.get("timeAttributeName", ""),
                                                                                        travel_mode.get("distanceAttributeName", "") ]
            applicable_attribute_parameters = [attr_param for attr_param in attribute_parameters
                                               if attr_param["attributeName"] in applicable_attributes]

            applicable_attribute_parameters = []
            for attr_param in attribute_parameters:
                if attr_param["attributeName"] in applicable_attributes:
                    #Use string keyword for the restriction usage value
                    if attr_param["parameterName"].upper() == "RESTRICTION USAGE":
                        param_value = "{0:.1f}".format(attr_param["value"])
                        attr_param["value"] = self.RESTRICTION_USAGE_VALUES.get(param_value, param_value)
                    applicable_attribute_parameters.append(attr_param)
            travel_mode["attributeParameterValues"] = applicable_attribute_parameters
            travel_mode["id"] = travel_mode_id
            travel_modes[travel_mode_id] = travel_mode

            #Determine the default travel mode id
            if travel_mode_name == default_travel_mode_name:
                default_travel_mode_id = travel_mode_id

        #Prepare the json to be written to the output file.
        self.travelModesJSON = {
            "supportedTravelModes": list(travel_modes.values()),
            "defaultTravelMode": default_travel_mode_id,
        }
       
        #Save the JSON descriptions to a file
        self.logger.info("Saving travel modes to {0}".format(self.travelModesFile))
        self._saveJSONToFile(self.travelModesFile, self.travelModesJSON)

        #Get localized travel mode names and descriptions
        localized_travel_modes = {}
        if self.localizedTravelModesFolder:
            #Get a list of all the *.json file
            for root, dirs, files in os.walk(self.localizedTravelModesFolder):
                for filename in files:
                    if filename == LOCALIZED_FILE_NAME:
                        with io.open(os.path.join(root,filename), "r", encoding="utf-8") as fp:
                            localized_travel_mode_str = fp.read()
                        if localized_travel_mode_str.startswith(BOM):
                            localized_travel_mode_str = localized_travel_mode_str.lstrip(BOM)
                        # ensure only name and description are used from the localized travel modes
                        localized_travel_mode_dict = {}
                        for tm_id, tm in json.loads(localized_travel_mode_str).items():
                            localized_travel_mode_dict[tm_id] = {k:v for k,v in tm.items() if k in ("name", "description")}

                        localized_travel_modes[os.path.basename(root)] = localized_travel_mode_dict
            #Save the localized travel modes to a new file
            self.logger.info("Saving localized travel modes to {0}".format(self.localizedTravelModesFile))
            self._saveJSONToFile(self.localizedTravelModesFile, localized_travel_modes)

    def _getNDSDescription(self):
        '''Store the description of the template network dataset as a dict in JSON'''

        attribute_parameter_values = []
        attribute_parameter_prop_names = ("attributeName", "parameterName", "parameterType", "value")
        nds_attributes = []
        nds_attribute_prop_names = ("name", "dataType", "units", "usageType", "parameterNames",
                                    "restrictionUsageParameterName", "trafficSupport")
        nds_traffic_support_type = "NONE"
        default_cost_attribute = ""
        default_restrictions = []
        
        #Get network dataset traffic support type
        if hasattr(self.templateNDSDesc, "trafficSupportType"):
            nds_traffic_support_type = self.templateNDSDesc.trafficSupportType
        else:
            #Calculate based on other properties
            supports_historical_traffic = self.templateNDSDesc.supportsHistoricalTrafficData
            supports_live_traffic = self.templateNDSDesc.supportsLiveTrafficData

            if supports_historical_traffic:
                if supports_live_traffic:
                    live_traffic_data = self.templateNDSDesc.liveTrafficData
                    if live_traffic_data.trafficFeedLocation:
                        nds_traffic_support_type = "HISTORICAL_AND_LIVE"
                    else:
                        nds_traffic_support_type = "HISTORICAL"
                else:
                    nds_traffic_support_type = "HISTORICAL"

        #Get information about network dataset attributes including attribute parameter values
        for nds_attribute in self.templateNDSDesc.attributes:
            nds_attribute_name = nds_attribute.name
           
            nds_attribute_traffic_support_type = self._getNDSAttributeTrafficSupportType(nds_attribute,
                                                                                         nds_traffic_support_type)
            nds_attribute_parameter_names = []
            nds_attribute_restriction_usage_parameter_name = None
            parameter_count = nds_attribute.parameterCount
            if parameter_count:
                for i in range(parameter_count):
                    param_name = getattr(nds_attribute, "parameterName" + str(i))
                    nds_attribute_parameter_names.append(param_name)
                    param_data_type = getattr(nds_attribute, "parameterType" + str(i))
                    param_usage_type = getattr(nds_attribute, "parameterUsageType" + str(i))
                    if param_usage_type.lower() == "restriction":
                        nds_attribute_restriction_usage_parameter_name = param_name
                    param_default_value = None
                    if hasattr(nds_attribute, "parameterDefaultValue" + str(i)):
                        param_default_value = str(getattr(nds_attribute, "parameterDefaultValue" + str(i)))
                        #if param_name.upper() == "RESTRICTION USAGE" and param_default_value in self.RESTRICTION_USAGE_VALUES:
                        if nds_attribute_restriction_usage_parameter_name and param_default_value in self.RESTRICTION_USAGE_VALUES:
                            param_default_value = self.RESTRICTION_USAGE_VALUES[param_default_value]

                    attribute_parameter_values.append(dict(list(zip(attribute_parameter_prop_names,
                                                               (nds_attribute_name, param_name, param_data_type,
                                                                param_default_value)
                                                               ))
                                                           )
                                                      )
            
            nds_attributes.append(dict(list(zip(nds_attribute_prop_names,
                                           (nds_attribute_name, nds_attribute.dataType, nds_attribute.units,
                                            nds_attribute.usageType, nds_attribute_parameter_names,
                                            nds_attribute_restriction_usage_parameter_name,
                                            nds_attribute_traffic_support_type)
                                           ))
                                       )
                                  )

        #Get default cost and restriction attributes
        nds_attrs = self.NetworkDatasetAttributes(self.templateNDSDesc, False)
        default_cost_attribute = nds_attrs.defaultImpedanceAttribute
        default_restrictions = nds_attrs.defaultRestrictionAttributes

        # Get the spatial reference for network dataset
        nd_sr = self.templateNDSDesc.spatialReference
        nd_sr_wkid = nd_sr.factoryCode
        # Factory code can be zero for custom spatial reference.
        # See https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/8207
        if nd_sr_wkid:
            nd_sr_json = {
                "wkid": 102100 if nd_sr_wkid == 3857 else nd_sr_wkid
            }
        else:
            nd_sr_json = {
                "wkt": nd_sr.exportToString()
            }

        network_dataset_description = {
            "attributeParameterValues": attribute_parameter_values,
            "defaultCostAttribute" : default_cost_attribute,
            "defaultRestrictions" : default_restrictions,
            "networkAttributes": nds_attributes,
            "supportedTravelModes": self.travelModesJSON.get("supportedTravelModes", []),
            "trafficSupport": nds_traffic_support_type,
            "spatialReference": nd_sr_json,
            "networkSources": self._getNetworkSourceInfo(),
        }

        return network_dataset_description

    def _getNDSAttributeTrafficSupportType(self, nds_attribute, nds_traffic_support_type):
        '''Calculates traffic support type for a network dataset attribute'''

        attr_traffic_support_type = "NONE"

        if hasattr(nds_attribute, "trafficSupportType"):
            attr_traffic_support_type = nds_attribute.trafficSupportType
        else:
            #Traffic support type for an attribute with NetworkEdgeTraffic evaluator is equal to the traffic support
            #type of the network dataset.
            evaluator_count = nds_attribute.evaluatorCount
            if evaluator_count:
                for i in range(evaluator_count):
                    evaluator_type = getattr(nds_attribute, "evaluatorType{0}".format(i))
                    if evaluator_type.lower() == "networkedgetraffic":
                        attr_traffic_support_type = nds_traffic_support_type
                        break

        return attr_traffic_support_type

    def _getServiceLimits(self):
        '''return service limits for each tool within a GP service'''

        tool_limits = {}
        if self.serviceLimits:
            for limit in self.serviceLimits.split(";"):
                tool_name, limit_name, limit_value = limit.split(" ")
                if limit_value == "#":
                    limit_value = None
                else:
                    try:
                        limit_value = nas.str_to_float(limit_value)
                    except Exception as ex:
                        pass
                tool_limits.setdefault(tool_name, dict())
                tool_limits[tool_name][limit_name] = limit_value
        else:
            #if service limits is not specified, assume all limits to be None
            tool_limits = self.TOOL_LIMITS

        service_names = self.SERVICE_NAMES
        service_limits = dict.fromkeys(service_names, {})
        for service_name in service_names:
            service_limits[service_name] = {tool_name: tool_limits[tool_name] 
                                            for tool_name in service_names[service_name]}
        return service_limits
    
    def _templateNDSWorkspaceDomains(self):
        """Populate the coded value domains defined at the workspace of the template network dataset."""
        template_nds_workspace = os.path.dirname(os.path.dirname(self.templateNDSDesc.catalogPath))
        domains = {}
        for domain in arcpy.da.ListDomains(template_nds_workspace):
            if domain.domainType == "CodedValue":
                domains[domain.name] = {
                    "name": domain.name,
                    "type": "codedValue",
                    "codedValues": [{"code": key, "name": val} for key,val in domain.codedValues.items()]
                }
        self.templateNDSWorkspaceDomains = domains

    def _getNetworkSourceInfo(self):
        """Return a list of info about the network dataset sources."""
        network_sources = []
        self._templateNDSWorkspaceDomains()  # update self.templateNDSWorkspaceDomains
        for src in self.templateNDSDesc.sources:
            src_info = {
                "name": src.name,
                "elementType": f"esriNET{src.elementType}",
                "sourceType": f"esriNST{src.sourceType}",
                "id": src.sourceID,
                "schema": self._getNetworkSourceSchema(src.name),
            }
            network_sources.append(src_info)
        return network_sources
    
    def _getNetworkSourceDomains(self, src_feature_class):
        """Return coded value domain names defined for the fields on the network source feature class."""
        field_domains = {}
        if self.templateNDSWorkspaceDomains:
            for fld in arcpy.ListFields(src_feature_class):
                fld_domain = fld.domain
                if fld_domain and fld_domain in self.templateNDSWorkspaceDomains:
                    field_domains[fld.name] = fld_domain
        return field_domains

    def _getNetworkSourceSchema(self, src_name):
        """Return the schema as JSON for a network source."""
        feature_dataset = os.path.dirname(self.templateNDSDesc.catalogPath)
        src_feature_class = os.path.join(feature_dataset, src_name)
        schema_feature_class_name = arcpy.ValidateTableName("Schema_" + src_name, self.na_filegdb)
        schema_feature_class = arcpy.management.CreateFeatureclass(self.na_filegdb, schema_feature_class_name,
                                                                   template=src_feature_class,
                                                                   has_z="SAME_AS_TEMPLATE", has_m="SAME_AS_TEMPLATE",
                                                                   spatial_reference=src_feature_class).getOutput(0)
        schema_json_file = os.path.join(self.supportingFilesFolder, f"Schema_{src_name}.json")
        arcpy.conversion.FeaturesToJSON(schema_feature_class, schema_json_file, "NOT_FORMATTED", "Z_VALUES", "M_VALUES")
        with open(schema_json_file, "r", encoding="utf-8") as schema_json_fp:
            src_schema_json = json.load(schema_json_fp)
        try:
            os.remove(schema_json_file)
            arcpy.management.Delete(schema_feature_class)
        except Exception:
            # Ok to skip any execption when cleaning up
            pass
        field_domains = self._getNetworkSourceDomains(src_feature_class)
        if field_domains:
            for fld in src_schema_json["fields"]:
                fld_name = fld["name"]
                if fld_name in field_domains:
                    fld["domain"] = self.templateNDSWorkspaceDomains[field_domains[fld_name]]
        return src_schema_json