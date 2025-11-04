"""Module to check if network dataset meets publishing requirments."""

import os

import arcpy
from arcpy import _na as nax


class AnalyzeNetworkDataset:
    """Determine if the network dataset can be used for publishing routing services."""

    STRICT_SOLVER_TYPES = {"LastMileDelivery"}
    MISSING_TIME_COST = "The network dataset does not have at least one time based cost attribute."
    MISSING_DISTANCE_COST = "The network dataset does not have at least one distance based cost attribute."
    MISSING_DIRECTIONS = "The network dataset does not support generating directions."
    MISSING_TRAVEL_MODES = "The network dataset does not have at least one travel mode."
    MISSING_SA_INDEX = "A service area index has not been created on the network dataset."
    NOT_DISSOLVED = "The network dataset has not been dissolved."
    INVALID_WKS_TYPE = "The network dataset is not stored in a geodatabase."
    MISSING_TRUCK_TIME_COST_ATTRIBUTE = ("The network dataset does not have a travel mode of type Truck or a cost "
                                         "attribute named TruckTravelTime. The geoprocessing services might return "
                                         "unexpected results when the Impedance parameter is set to 'Truck Time'.")
    MISSING_WALK_TIME_COST_ATTRIBUTE = ("The network dataset does not have a travel mode of type Walk or a cost "
                                        "attribute named WalkTime. The geoprocessing services might return "
                                        "unexpected results when the Impedance parameter is set to 'Walk Time'.")
    MISSING_TIME_BASED_TRAVEL_MODE = ("Network has no travel modes with a time based impedance attribute and a "
                                      "distance attribute.")
    MISSING_TIME_ZONE_ATTRIBUTE = "Network has no time zone attribute."
    USING_TRANSIT_EVALUATOR = ("The network data source must have at least one time-based travel mode that does not "
                               "use the Public Transit evaluator.")
    NOT_MGDB = "The network dataset is not stored in a mobile geodatabase."
    ANALYZER_MESSAGES = {  # mapping between analyzer messages and GP message codes
        MISSING_DIRECTIONS: 30055,
        MISSING_TRAVEL_MODES: 30253,
        MISSING_TIME_COST: 30266,
        MISSING_DISTANCE_COST: 30267,
        MISSING_SA_INDEX: 30268,
        NOT_DISSOLVED: 30269,
        INVALID_WKS_TYPE: 30270,
        MISSING_TRUCK_TIME_COST_ATTRIBUTE: 30271,
        MISSING_WALK_TIME_COST_ATTRIBUTE: 30272,
        MISSING_TIME_BASED_TRAVEL_MODE: 30358,
        MISSING_TIME_ZONE_ATTRIBUTE: 30353,
        USING_TRANSIT_EVALUATOR: 30252,
        NOT_MGDB: 30378,
    }
    TIME_UNITS = nax.TimeUnits.__members__

    def __init__(self, network_dataset, solver_types=None):
        """Initialize names that can be used else where.

        Args:
            network_dataset - Can be a network dataset layer or a network dataset catalogf path or a network dataset
                              describe object. If not a describe object, then the network dataset is described which is
                              slow. So it is recommended to pass a network dataset describe object if available.
            solver_types: A tuple of solver types that are published as routing services using the network dataset.

        """
        if not solver_types:
            solver_types = tuple()
        self.solver_types = set(solver_types)

        # Assume a describe object is passed
        self.desc_nd = network_dataset
        if hasattr(self.desc_nd, "dataType"):
            self.nd_path = self.desc_nd.catalogPath
        else:
            # Check if a network dataset layer is passed
            if hasattr(network_dataset, "dataSource"):
                self.nd_path = network_dataset.dataSource
            else:
                if hasattr(network_dataset, "value"):
                    # A GP value object is passed
                    self.nd_path = network_dataset.value
                else:
                    # A network dataset catalog path or a network dataset name is passed
                    self.nd_path = network_dataset

            # Describe the network dataset
            self.desc_nd = arcpy.Describe(network_dataset)
            # In case we get a network dataset name
            self.nd_path = self.desc_nd.catalogPath
        self.nd_feature_dataset = os.path.dirname(self.nd_path)

        # Define derived outputs
        self.analyze_succeedeed = False
        # Define dictionary that stores output from validation
        self.analyze_messages = {
            "errors": [],
            "warnings": [],
        }

    def execute(self):
        """Core execution logic."""
        # Perform critical checks whose violation should result in a failure.

        # Check if the network dataset is stored in a file geodatabase
        network_type = self.desc_nd.networkType
        if network_type == "Geodatabase":
            # Since a geodatabase network dataset is always in a feature dataset, the workspace for the network dataset
            # can be obtained from its catalog path
            nds_workspace = os.path.dirname(self.nd_feature_dataset)
            nds_workspace_type = arcpy.Describe(nds_workspace).workspaceFactoryProgID
            if nds_workspace_type.lower() not in ("esridatasourcesgdb.filegdbworkspacefactory",
                                                  "esridatasourcesgdb.sdeworkspacefactory",
                                                  "esridatasourcesgdb.sqliteworkspacefactory"):
                self.analyze_messages["errors"].append(self.INVALID_WKS_TYPE)
            if "SnapToRoads" in self.solver_types and \
                nds_workspace_type.lower() != "esridatasourcesgdb.sqliteworkspacefactory":
                self.analyze_messages["errors"].append(self.NOT_MGDB)
        else:
            self.analyze_messages["errors"].append(self.INVALID_WKS_TYPE)

        # Check if the network dataset has at least one cost and one distance attribute
        nds_attrs = self.desc_nd.attributes
        time_costs = []
        distance_costs = []
        transit_costs = []  # A list of cost attributes that use transit evaluators.
        for attr in nds_attrs:
            if attr.usageType.lower() == "cost":
                attr_units = attr.units
                if attr_units in self.TIME_UNITS:
                    time_costs.append(attr.name)
                elif attr_units.lower() == "unknown":
                    continue
                else:
                    distance_costs.append(attr.name)
                evaluator_count = attr.evaluatorCount
                if evaluator_count:
                    for index in range(evaluator_count):
                        evaluator_type = getattr(attr, f"evaluatorType{index}")
                        if evaluator_type in ("Public Transit", ):
                            transit_costs.append(attr.name)
        if not time_costs:
            self.analyze_messages["errors"].append(self.MISSING_TIME_COST)
        if not distance_costs:
            self.analyze_messages["errors"].append(self.MISSING_DISTANCE_COST)

        # Check if the network dataset supports directions
        if not self.desc_nd.supportsDirections:
            self.analyze_messages["errors"].append(self.MISSING_DIRECTIONS)

        # Check if the network dataset has at least one travel mode
        nds_travel_modes = arcpy.na.GetTravelModes(self.nd_path)
        time_based_travel_mode_count = 0
        time_based_travel_mode_with_transit_count = 0
        if nds_travel_modes:
            # Check if the network dataset has atleast one time based travel mode
            for travel_mode_name in nds_travel_modes:
                travel_mode = nds_travel_modes[travel_mode_name]
                if travel_mode.impedance == travel_mode.timeAttributeName:
                    time_based_travel_mode_count += 1
                    if travel_mode.impedance in transit_costs:
                        time_based_travel_mode_with_transit_count += 1
        else:
            self.analyze_messages["errors"].append(self.MISSING_TRAVEL_MODES)
        # Checks for solver types that have strict requirements on input network dataset.
        if bool(self.STRICT_SOLVER_TYPES & self.solver_types):
            if not self.desc_nd.timeZoneAttributeName:
                self.analyze_messages["errors"].append(self.MISSING_TIME_ZONE_ATTRIBUTE)
            if time_based_travel_mode_count:
                if time_based_travel_mode_count - time_based_travel_mode_with_transit_count == 0:
                    self.analyze_messages["errors"].append(self.USING_TRANSIT_EVALUATOR)
            else:
                self.analyze_messages["errors"].append(self.MISSING_TIME_BASED_TRAVEL_MODE)

        # Perform recommended checks that result in warnings but not in errors

        # Check if the Service Area index has been created.
        nds_optimizations = self.desc_nd.optimizations
        if "Service Area Index" not in nds_optimizations:
            self.analyze_messages["warnings"].append(self.MISSING_SA_INDEX)

        # Check if the network dataset is dissolved.
        if "Dissolve" not in nds_optimizations:
            self.analyze_messages["warnings"].append(self.NOT_DISSOLVED)

        # Check if the network dataset has truck time and walk time cost attributes
        nds_travel_mode_types = {}
        for tm_name, val in nds_travel_modes.items():
            travel_mode_type = nds_travel_mode_types.setdefault(val.type, [])
            travel_mode_type.append(tm_name)
        if "WalkTime" in time_costs:
            pass
        elif nds_travel_mode_types.get("WALK", None):
            pass
        else:
            self.analyze_messages["warnings"].append(self.MISSING_WALK_TIME_COST_ATTRIBUTE)
        if "TruckTravelTime" in time_costs:
            pass
        elif nds_travel_mode_types.get("TRUCK", None):
            pass
        else:
            self.analyze_messages["warnings"].append(self.MISSING_TRUCK_TIME_COST_ATTRIBUTE)

        # If we do not have any errors, set the analyze output as True.
        if not self.analyze_messages["errors"]:
            self.analyze_succeedeed = True
