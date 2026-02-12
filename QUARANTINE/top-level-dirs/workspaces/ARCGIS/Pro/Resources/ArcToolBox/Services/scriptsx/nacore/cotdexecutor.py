"""ConnectOriginsToDestinations core logic executor."""
# pylint: disable=import-error,no-name-in-module
import os
from collections import Counter
from typing import Any, Optional, Dict

import arcpy
import arcpy.conversion
import arcpy.management
import arcpy.analysis
from arcpy.da import SearchCursor, InsertCursor, UpdateCursor  # type: ignore

from common import (PAExecutor, PAFeatureLayer, PAOutputFeatureLayer,
                    LogExecutionTime, LogUtils, RemoteToolboxUtils, FieldUtils,
                    ImmutableDict, ToolExit, AOLUtils, PortalUtils)
from common import AnalysisUtils as AUtils
from .nautils import NAUtils


LOGGER = LogUtils.setup_logger(__name__)


class COTDExecutor(PAExecutor):
    """Core logic of ConnectOriginsToDestinations tool."""

    def __init__(
        self,
        origins_layer: PAFeatureLayer,
        destinations_layer: PAFeatureLayer,
        measurement_type: str,
        origins_layer_route_id: Optional[str] = None,
        destinations_layer_route_id: Optional[str] = None,
        time_of_day: Any = None,
        time_zone_for_time_of_day: str = "GeoLocal",
        include_route_layers: bool = False,
        point_barrier_layer: Optional[PAFeatureLayer] = None,
        line_barrier_layer: Optional[PAFeatureLayer] = None,
        polygon_barrier_layer: Optional[PAFeatureLayer] = None,
        route_shape: str = "FollowStreets",
        output_routes_name: str = "Routes",
        output_unassigned_origins_name: str = "UnassignedOrigins",
        output_unassigned_destinations_name: str = "UnassignedDestinations",
        output_workspace: Any = "in_memory",
        portal_description: Optional[ImmutableDict] = None
    ):
        """Initialize the attributes.

        Args:
            origins_layer: Input origins
            destinations_layer: Input destinations
            measurement_type: STRAIGHTLINE or travel mode as strigified json
            origins_layer_route_id: ID field indicating which route the origin belongs to
            destinations_layer_route_id: ID field indicating which route the destination belongs to
            time_of_day: Analysis time of day.
            time_zone_for_time_of_day: Whether the time_of_day value is geolocal or UTC.
            output_routes_name: Name for the output routes layer.
            output_unassigned_origins_name: Name for the output unassigned origins layer.
            output_unassigned_destinations_name: Name for the output unassigned destinations layer.
            include_route_layers: Whether to include route data (for use in Navigator, etc.) in the output
            point_barrier_layer: Point barriers to use in the analysis.
            line_barrier_layer: Line barriers to use in the analysis.
            polygon_barrier_layer: Polygon barriers to use in the analysis.
            route_shape: For network solves, whether routes should follow streets. Can be FollowStreets or StraightLine.
            output_workspace: Location to save the output feature classes.
            portal_description: Description of portal.
        Returns:
            No returns.
        Raises:
            No exceptions.

        """
        self.origins_layer = origins_layer
        if not self.origins_layer.layer_name:
            self.origins_layer.layer_name = "Origins Layer"
        self.destinations_layer = destinations_layer
        if not self.destinations_layer.layer_name:
            self.destinations_layer.layer_name = "Destinations Layer"

        self.measurement_type = "STRAIGHTLINE" if measurement_type.upper() == "STRAIGHTLINE" else measurement_type
        self.origins_layer_route_id = origins_layer_route_id
        self.destinations_layer_route_id = destinations_layer_route_id
        self.time_of_day = time_of_day
        self.time_zone_for_time_of_day = time_zone_for_time_of_day
        self.include_route_layers = include_route_layers
        self.point_barrier_layer = point_barrier_layer
        self.line_barrier_layer = line_barrier_layer
        self.polygon_barrier_layer = polygon_barrier_layer
        self.route_shape = route_shape.upper()
        self.output_workspace = output_workspace

        if portal_description is None:
            self.portal_description = ImmutableDict(arcpy.GetPortalDescription())
        else:
            self.portal_description = portal_description
        self.running_in_portal = PortalUtils.is_portal_env()

        # Determine the directions language based on the culture of the user if generating route layers
        self.directions_language = "en"
        if self.include_route_layers:
            self.directions_language = NAUtils.get_user_culture(self.portal_description)

        # Set up outputs
        self.route_data = None
        self.output_routes_name = output_routes_name
        self.output_unassigned_origins_name = output_unassigned_origins_name
        self.output_unassigned_destinations_name = output_unassigned_destinations_name
        self.output_routes = AUtils.initialize_output_layer(None,
                                                            self.output_routes_name,
                                                            self.output_workspace,
                                                            True)
        self.output_unassigned_origins = AUtils.initialize_output_layer(None,
                                                                        self.output_unassigned_origins_name,
                                                                        self.output_workspace,
                                                                        True)
        self.output_unassigned_destinations = AUtils.initialize_output_layer(None,
                                                                             self.output_unassigned_destinations_name,
                                                                             self.output_workspace,
                                                                             True)
        LOGGER.debug(f"Output routes: {self.output_routes.data}")
        LOGGER.debug(f"Output unassigned origins: {self.output_unassigned_origins.data}")
        LOGGER.debug(f"Output unassigned destinations: {self.output_unassigned_destinations.data}")

        # Get the tool limits
        # Default is infinity for Enterprise and hard-coded to the AGOL service limits if the NA services
        # being called are running in AGOL (directly or proxied).
        # We'll override the defaults by checking with the utility service
        # See https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/7669
        if NAUtils.do_routing_services_use_agol(self.portal_description):
            self.max_stops = 10000
        else:
            self.max_stops = NAUtils.INFINITY
        self.max_stop_pairs = self.max_stops / 2
        self.tool_limits = {}
        # Check utility service to override default limits if possible/necessary
        self._get_service_limits()
        LOGGER.debug(f"Max stop count: {self.max_stops}")
        LOGGER.debug(f"Max stop pairs: {self.max_stop_pairs}")

        self.origins_layer_has_oid64 = arcpy.Describe(self.origins_layer.layer).hasOID64
        self.destinations_layer_has_oid64 = arcpy.Describe(self.destinations_layer.layer).hasOID64

        # All outputs are created in the spatial reference of the origins layer.
        # Note: If this logic ever changes, also update cotdtool.py in get_parameters() where it calls
        # self.check_overwrite_sr().
        if arcpy.env.outputCoordinateSystem:
            self.output_coordinate_system: arcpy.SpatialReference = arcpy.env.outputCoordinateSystem  # type: ignore
            LOGGER.debug("arcpy.env.outputCoordinateSystem is specified and will be used for outputs.")
        else:
            self.output_coordinate_system: arcpy.SpatialReference = self.origins_layer.spatialReference  # type: ignore
            LOGGER.debug("The spatial reference of the Input Origins Layer will be used for outputs.")

        # Actual inputs passed to the service. They will be populated during input preprocessing.
        self.input_stop_pairs = None

        # This will be updated in validate_parameters()
        self.is_travel_mode_time_based = False

        # Other shared parameters
        self.route_layer_item_id_field_name = "RouteLayerItemID"
        self.route_layer_item_url_field_name = "RouteLayerItemURL"
        self.unassigned_status_field_name = "Status"
        self.stop_pair_id_field_name = "InputOrig_FID"
        self.transformation_o = None
        self.transformation_d = None
        self.remote_job_id = None
        self.coincident_od_pair_oids = []
        self.coincident_origin_count = 0
        self.coincident_dest_count = 0
        self.problem_type = None  # Used in the tool definition but not in the executor
        self.task_cost = -1

    def _get_service_limits(self):
        """Get the tool limits imposed by the service."""
        # Determine if routingUtilities is available to check service limits and override default limits for this tool
        # if limits are returned.
        if "routingUtilities" in self.portal_description.get("helperServices", {}):
            try:
                routing_utils_tbx = RemoteToolboxUtils.get_helper_service_url(
                    "routingUtilities", self.portal_description,
                    log_error=False)
                LOGGER.debug(f"Getting tool limits from {routing_utils_tbx}")
                self.tool_limits = NAUtils.get_tool_limits(routing_utils_tbx, "asyncRoute", "FindRoutes")
                self.max_stops = self.tool_limits.get("maximumStops", NAUtils.INFINITY)
                if self.max_stops is None:
                    self.max_stops = NAUtils.INFINITY
                self.max_stop_pairs = self.max_stops / 2
            except Exception:
                LOGGER.debug("Failed to get tool limits from routingUtilities helper service. Using tool default.")
                pass

    def validate_parameters(self) -> bool:
        """Validate the parameters of the executor."""
        LOGGER.debug("Validating input parameters")
        # Fail if we don't have at least one feature in the input origins and destinations layers
        if self.origins_layer.count < 1:
            LOGGER.error(100365, extra={"message_ID": 100365, "originsLayer": self.origins_layer.layer_name})
            return False
        if self.destinations_layer.count < 1:
            LOGGER.error(100366, extra={"message_ID": 100366, "destinationsLayer": self.destinations_layer.layer_name})
            return False

        # Fail if we have more than the allowed number of stop pairs in the inputs
        if self.origins_layer.count > self.max_stop_pairs:
            LOGGER.error(100069, extra={
                "message_ID": 100069,
                "startLayer": self.origins_layer.layer_name,
                "max": self.max_stop_pairs
            })
            return False
        if self.destinations_layer.count > self.max_stop_pairs:
            LOGGER.error(100069, extra={
                "message_ID": 100069,
                "startLayer": self.destinations_layer.layer_name,
                "max": self.max_stop_pairs
            })
            return False

        # Check that if the route ID fields are specified, the fields exist on the inputs
        if self.origins_layer_route_id:
            if not NAUtils.check_field_exists(self.origins_layer_route_id, self.origins_layer):
                return False
        if self.destinations_layer_route_id:
            if not NAUtils.check_field_exists(self.destinations_layer_route_id, self.destinations_layer):
                return False

        # If both origins and destinations have more than one feature, the user must specify the ID fields
        if self.origins_layer.count > 1 and self.destinations_layer.count > 1:
            # The user must specify a value for the origins_layer_route_id
            if not self.origins_layer_route_id:
                LOGGER.error(100137, extra={"message_ID": 100137, "parameterName": "originsLayerRouteIDField"})
                return False
            # The user must specify a value for the destinations_layer_route_id
            if not self.destinations_layer_route_id:
                LOGGER.error(100137, extra={"message_ID": 100137, "parameterName": "destinationsLayerRouteIDField"})
                return False

        # Do checks related to travel mode and measurement units
        # Check if the travel mode is valid. Valid values are "STRAIGHTLINE", a JSON string representing a travel mode,
        # or one of the legacy travel mode names.
        # Also determine if the measurement type is a time-based travel mode.
        legacy_tms = (
            "DRIVINGTIME", "DRIVINGDISTANCE", "WALKINGTIME", "WALKINGDISTANCE", "TRUCKINGTIME", "TRUCKINGDISTANCE",
        )
        if self.measurement_type == "STRAIGHTLINE":
            # Fail if including route layers
            if self.include_route_layers:
                LOGGER.error(100218, extra={"message_ID": 100218})
                return False
            # Fail if using barriers
            for barrier_layer, barrier_type in ((self.point_barrier_layer, "pointBarrierLayer"),
                                                (self.line_barrier_layer, "lineBarrierLayer"),
                                                (self.polygon_barrier_layer, "polygonBarrierLayer")):
                if barrier_layer and barrier_layer.count:
                    LOGGER.error(100263, extra={"message_ID": 100263, "barrierType": barrier_type})
                    return False
        elif self.measurement_type in legacy_tms:
            self.is_travel_mode_time_based = self.measurement_type.upper().endswith("TIME")
        else:  # Assumed to be a JSON travel mode representation
            travel_mode_obj = NAUtils.get_travel_mode_from_json(self.measurement_type)
            if not travel_mode_obj:
                # Travel mode json conversion must have failed. Error was already thrown. Just quit.
                return False
            self.is_travel_mode_time_based = NAUtils.is_travel_mode_time_based(travel_mode_obj)

        return True

    def _make_dict_from_shapes(
        self, input_layer: PAFeatureLayer, cursor_fields: tuple, transformation: Optional[str]
    ) -> Dict:
        """Returns a dictionary of {Route ID: (shape, pair ID)} for use in making stop pairs.

        Args:
            input_layer (PAFeatureLayer): Input layer from which to retrieve shapes
            cursor_fields (tuple): Tuple of field names to use in the cursor.
            transformation (Optional[str]): Datum transformation to use when retrieving shapes.

        Raises:
            arcpy.ExecuteError: Raises an error if RouteIDField values are not unique

        Returns:
            Dict: dictionary of {Route ID: (shape, pair ID)} for use in making stop pairs
        """
        with SearchCursor(
            input_layer.layer,
            cursor_fields,
            spatial_reference=self.output_coordinate_system,
            datum_transformation=transformation
        ) as cursor:
            shapes = {row[1]: (row[0], row[2]) for row in cursor}

        # Throw an error if RouteIDField values are not unique
        if len(shapes) != input_layer.count:
            LOGGER.error(100096, extra={
                "message_ID": 100096,
                "startLayerRouteIDField": cursor_fields[1],
                "startLayer": input_layer.layer_name
            })
            raise arcpy.ExecuteError

        return shapes

    def _preprocess_inputs(self):
        """Use the validated inputs to prepare the inputs in the format required by the remote service.

        In particular, create a stop pairs layer combining the input origins and destinations into one feature class
        depending on the problem type (One To Many, Multiple Many To One, etc.).
        """
        LOGGER.debug("Pre-processing inputs")
        route_name_field = "RouteName"
        route_name_field_max_length = 1024
        stop_pair_name_field = "Name"
        stop_pair_name_field_max_length = 500

        # Create the input stop pairs feature class with desired schema
        LOGGER.debug("Creating input stop pairs feature class")
        self.input_stop_pairs = AOLUtils.create_unique_name("InputPairs", self.output_workspace)
        arcpy.management.CreateFeatureclass(
            self.output_workspace,
            os.path.basename(self.input_stop_pairs),
            "POINT",
            spatial_reference=self.output_coordinate_system
        )
        id_field_type = "BIGINTEGER" if (self.origins_layer_has_oid64 or self.destinations_layer_has_oid64) else "LONG"
        field_defs = [
            [stop_pair_name_field, "TEXT", "", stop_pair_name_field_max_length],
            [route_name_field, "TEXT", "", route_name_field_max_length],
            [self.stop_pair_id_field_name, id_field_type]
        ]
        arcpy.management.AddFields(self.input_stop_pairs, field_defs)

        # Determine the fields to use when reading origins and destinations
        # Use the origins_layer_route_id and destinations_layer_route_id parameter values to construct the RouteName
        # field if the user specifies these parameters. Otherwise, use construct RouteName base on OIDs. The origin and
        # destination OIDs are used as stop names and later populated as OriginOID and DestinationOID in output routes.
        # Origins
        origins_layer_cursor_fields = ("SHAPE@", "OID@")
        if self.origins_layer_route_id:
            self.origins_layer_route_id = FieldUtils.get_fq_field_name(self.origins_layer_route_id,
                                                                       self.origins_layer,
                                                                       self.running_in_portal)
            origins_layer_cursor_fields = ("SHAPE@", self.origins_layer_route_id, "OID@")
        else:
            if self.measurement_type != "STRAIGHTLINE":
                # Check if the origins layer has a well-known field we can use as an ID
                origins_layer_name_field = NAUtils.check_well_known_fields_object(self.origins_layer)
                if origins_layer_name_field:
                    origins_layer_cursor_fields = ("SHAPE@", origins_layer_name_field.name, "OID@")
        # Destinations
        destinations_layer_cursor_fields = ("SHAPE@", "OID@")
        if self.destinations_layer_route_id:
            self.destinations_layer_route_id = FieldUtils.get_fq_field_name(self.destinations_layer_route_id,
                                                                            self.destinations_layer,
                                                                            self.running_in_portal)
            destinations_layer_cursor_fields = ("SHAPE@", self.destinations_layer_route_id, "OID@")
        else:
            if self.measurement_type != "STRAIGHTLINE":
                # Check if the origins layer has a well-known field we can use as an ID
                destination_layer_name_field = NAUtils.check_well_known_fields_object(self.destinations_layer)
                if destination_layer_name_field:
                    destinations_layer_cursor_fields = ("SHAPE@", destination_layer_name_field.name, "OID@")

        # Determine the correct geographic transformations to use when retrieving origins and destinations in the output
        # spatial reference
        self.transformation_o = NAUtils.get_datum_transformation(
            self.origins_layer.spatialReference,  # type: ignore
            self.output_coordinate_system,
            self.origins_layer.extent  # type: ignore
        )
        self.transformation_d = NAUtils.get_datum_transformation(
            self.destinations_layer.spatialReference,  # type: ignore
            self.output_coordinate_system,
            self.destinations_layer.extent  # type: ignore
        )

        # Populate the input stop pairs with origins and destinations
        # We can have the following conditions depending on input origin and destination counts:
        # One To Many --> One origin, multiple destinations. Results in destination count * 2 stop pairs
        # Many To One --> Multiple origins, one destination. Results in origin count * 2 stop pairs
        # One To One --> Multiple origins and destinations but matched specifically as pairs. Results in origin count
        #                stop pairs
        # Multiple One To Many --> Multiple origins and destinations, with each origin matched to many destinations.
        # Multiple Many To One --> Multiple origins and destinations, with each origin matched to a single destination
        #                          but each destination being used by many origins.
        # The way we insert the stop pairs depends on which situation we have.
        LOGGER.debug("Populating input stop pairs feature class based on problem type")
        geom_errors = False  # Whether we encountered errors when inserting inputs
        sp_insert_cursor_fields = ("SHAPE@", route_name_field, stop_pair_name_field, self.stop_pair_id_field_name)
        if (self.origins_layer.count == 1 or self.destinations_layer.count == 1) and \
                not (self.origins_layer_route_id and self.destinations_layer_route_id):
            with InsertCursor(self.input_stop_pairs, sp_insert_cursor_fields) as cur:
                if self.origins_layer.count == 1:
                    # CASE: One To Many
                    self.problem_type = "OneToMany"
                    LOGGER.debug(f"Problem type: {self.problem_type}")
                    # Grab the single origin feature. We will insert it many times into the stop pairs table, once for
                    # each destination.
                    with SearchCursor(
                        self.origins_layer.layer,
                        origins_layer_cursor_fields,
                        spatial_reference=self.output_coordinate_system,
                        datum_transformation=self.transformation_o
                    ) as origins_cursor:
                        origin_row = next(origins_cursor)
                        origin_name = origin_row[1]
                    # Grab each destination and insert it into the stop pairs table along with a copy of the origin
                    row_id = 0
                    for destination_row in SearchCursor(
                        self.destinations_layer.layer,
                        destinations_layer_cursor_fields,
                        spatial_reference=self.output_coordinate_system,
                        datum_transformation=self.transformation_d
                    ):
                        row_id += 1
                        destination_name = destination_row[1]
                        # Make route names unique to ensure we get a route only from this origin to destination with no
                        # other stops
                        route_name = f"Route {row_id} - {origin_name} - {destination_name}"
                        # Check if the origin and destination are spatially coincident. In this case, do not add this
                        # coincident pair to the table. Instead, track it for later processing.
                        # Note: The equals() method can sometimes raise a ValueError where there is bad geometry. Just
                        # skip those points.
                        try:
                            if origin_row[0].equals(destination_row[0]):
                                self.coincident_od_pair_oids.append((origin_row[-1], destination_row[-1]))
                                self.coincident_dest_count += 1
                            else:
                                cur.insertRow((origin_row[0], route_name, origin_row[1], origin_row[-1]))
                                cur.insertRow((destination_row[0], route_name, destination_row[1], destination_row[-1]))
                        except Exception:
                            geom_errors = True
                            continue
                else:
                    # CASE: Many To One
                    self.problem_type = "ManyToOne"
                    LOGGER.debug(f"Problem type: {self.problem_type}")
                    # Grab the single destination feature. We will insert it many times into the stop pairs table, once
                    # for each origin.
                    with SearchCursor(
                        self.destinations_layer.layer,
                        destinations_layer_cursor_fields,
                        spatial_reference=self.output_coordinate_system,
                        datum_transformation=self.transformation_d
                    ) as destinations_cursor:
                        destination_row = next(destinations_cursor)
                        destination_name = destination_row[1]
                    # Grab each origin and insert it into the stop pairs table along with a copy of the destination
                    row_id = 0
                    for origin_row in SearchCursor(
                        self.origins_layer.layer,
                        origins_layer_cursor_fields,
                        spatial_reference=self.output_coordinate_system,
                        datum_transformation=self.transformation_o
                    ):
                        row_id += 1
                        origin_name = origin_row[1]
                        # Make route names unique to ensure we get a route only from this origin to destination with no
                        # other stops
                        route_name = f"Route {row_id} - {origin_name} - {destination_name}"
                        # Check if the origin and destination are spatially coincident. In this case, do not add this
                        # coincident pair to the table. Instead, track it for later processing.
                        # Note: The equals() method can sometimes raise a ValueError where there is bad geometry. Just
                        # skip those points.
                        try:
                            if destination_row[0].equals(origin_row[0]):
                                self.coincident_od_pair_oids.append((origin_row[-1], destination_row[-1]))
                                self.coincident_origin_count += 1
                            else:
                                cur.insertRow((origin_row[0], route_name, origin_row[1], origin_row[-1]))
                                cur.insertRow((destination_row[0], route_name, destination_row[1], destination_row[-1]))
                        except Exception:
                            geom_errors = True
                            continue

        else:
            if self.origins_layer.count == self.destinations_layer.count:
                # CASE: One To One
                self.problem_type = "OneToOne"
                LOGGER.debug(f"Problem type: {self.problem_type}")
                # Store origin and destination route IDs and shapes in a dictionary
                # Fail with route ids are not unique
                origin_shapes = self._make_dict_from_shapes(
                    self.origins_layer, origins_layer_cursor_fields, self.transformation_o
                )
                destination_shapes = self._make_dict_from_shapes(
                    self.destinations_layer, destinations_layer_cursor_fields, self.transformation_d
                )
                # We need to match each origin route id to exactly one destination route id. Fail if the origin route
                # ids are not identical to destination route ids
                if set(origin_shapes.keys()) != set(destination_shapes.keys()):
                    LOGGER.error(100098, extra={
                        "message_ID": 100098,
                        "startLayerRouteIDField": self.origins_layer_route_id,
                        "startLayer": self.origins_layer.layer_name,
                        "endLayerRouteIDField": self.destinations_layer_route_id,
                        "endLayer": self.destinations_layer.layer_name
                    })
                    raise arcpy.ExecuteError
                # Create route pairs and insert them into the stop pairs table
                with InsertCursor(self.input_stop_pairs, sp_insert_cursor_fields) as cur:
                    for origin_id in origin_shapes:
                        origin_row = origin_shapes[origin_id]
                        destination_row = destination_shapes[origin_id]
                        # Check if the origin and destination are spatially coincident. In this case, do not add this
                        # coincident pair to the table. Instead, track it for later processing.
                        # Note: The equals() method can sometimes raise a ValueError where there is bad geometry. Just
                        # skip those points.
                        try:
                            if origin_row[0].equals(destination_row[0]):
                                self.coincident_od_pair_oids.append((origin_row[-1], destination_row[-1]))
                                self.coincident_origin_count += 1
                                self.coincident_dest_count += 1
                            else:
                                cur.insertRow((origin_row[0], origin_id, origin_row[1], origin_row[-1]))
                                cur.insertRow((destination_row[0], origin_id, destination_row[1], destination_row[-1]))
                        except Exception:
                            geom_errors = True
                            continue
            else:
                # Each origin can connect to multiple destinations and vice versa based on the origins_layer_route_id
                # and destinations_layer_route_id fields.
                # First, perform several validation checks
                with SearchCursor(self.origins_layer.layer, self.origins_layer_route_id) as cursor:
                    origin_routeid_counter = Counter(row[0] for row in cursor)
                with SearchCursor(self.destinations_layer.layer, self.destinations_layer_route_id) as cursor:
                    dest_routeid_counter = Counter(row[0] for row in cursor)
                # Fail if either origins or destinations have null route IDs
                if origin_routeid_counter[None] or origin_routeid_counter[""]:
                    LOGGER.error(100271, extra={
                        "message_ID": 100271,
                        "fieldName": self.origins_layer_route_id,
                        "analysisLayer": self.origins_layer.layer_name
                    })
                    raise arcpy.ExecuteError
                if dest_routeid_counter[None] or dest_routeid_counter[""]:
                    LOGGER.error(100271, extra={
                        "message_ID": 100271,
                        "fieldName": self.destinations_layer_route_id,
                        "analysisLayer": self.destinations_layer.layer_name
                    })
                    raise arcpy.ExecuteError
                # Either origin route ids or destination route ids must be unique. Fail if both are not unique.
                origin_routeid_freq = origin_routeid_counter.most_common(1)[0][1]
                dest_routeid_freq = dest_routeid_counter.most_common(1)[0][1]
                if origin_routeid_freq > 1 and dest_routeid_freq > 1:
                    LOGGER.error(100272, extra={
                        "message_ID": 100272,
                        "startLayerRouteIDField": self.origins_layer_route_id,
                        "startLayer": self.origins_layer.layer_name,
                        "endLayerRouteIDField": self.destinations_layer_route_id,
                        "endLayer": self.destinations_layer.layer_name
                    })
                    raise arcpy.ExecuteError
                if origin_routeid_freq == 1:
                    # CASE: Multiple One To Many
                    self.problem_type = "MultipleOneToMany"
                    LOGGER.debug(f"Problem type: {self.problem_type}")
                    # We need to match all the destinations with the corresponding origin route ids since we have unique
                    # origin route ids
                    # Grab the origins as a look-up dictionary
                    origin_shapes = self._make_dict_from_shapes(
                        self.origins_layer, origins_layer_cursor_fields, self.transformation_o
                    )
                    # Construct the stop pairs with destinations and insert them into the stop pairs table
                    with InsertCursor(self.input_stop_pairs, sp_insert_cursor_fields) as stop_pairs_cursor:
                        for dest_row in SearchCursor(
                            self.destinations_layer.layer,
                            destinations_layer_cursor_fields,
                            spatial_reference=self.output_coordinate_system,
                            datum_transformation=self.transformation_d
                        ):
                            route_id = dest_row[1]
                            try:
                                # Find the origin corresponding to this destination
                                origin_row = origin_shapes[route_id]
                            except KeyError:
                                # Throw an error if we could not find a corresponding origin
                                LOGGER.error(100273, extra={
                                    "message_ID": 100273,
                                    "routeId": route_id,
                                    "routeIDField": self.destinations_layer_route_id,
                                    "startLayer": self.destinations_layer.layer_name,
                                    "endLayer": self.origins_layer.layer_name
                                })
                                raise arcpy.ExecuteError
                            # Construct route name based on origin and destination IDs
                            route_name = f"{origin_row[1]} - {dest_row[2]}"  # OriginOID - DestinationOID
                            # Check if the origin and destination are spatially coincident. In this case, do not add
                            # this coincident pair to the table. Instead, track it for later processing.
                            # Note: The equals() method can sometimes raise a ValueError where there is bad geometry.
                            # Just skip those points.
                            try:
                                is_dest_same_as_origin = dest_row[0].equals(origin_row[0])
                                if is_dest_same_as_origin:
                                    self.coincident_od_pair_oids.append((origin_row[-1], dest_row[-1]))
                                    self.coincident_dest_count += 1
                                else:
                                    stop_pairs_cursor.insertRow((origin_row[0], route_name, origin_row[1], origin_row[1]))
                                    stop_pairs_cursor.insertRow((dest_row[0], route_name, dest_row[2], dest_row[2]))
                            except Exception:
                                geom_errors = True
                                continue

                else:
                    # CASE: Multiple Many To One
                    self.problem_type = "MultipleManyToOne"
                    LOGGER.debug(f"Problem type: {self.problem_type}")
                    # We need to match all the origins with the corresponding destination route ids since we have unique
                    # destination route ids
                    # Grab the destinations as a look-up dictionary
                    dest_shapes = self._make_dict_from_shapes(
                        self.destinations_layer, destinations_layer_cursor_fields, self.transformation_d
                    )
                    # Construct the stop pairs with origins and insert them into the stop pairs table
                    with InsertCursor(self.input_stop_pairs, sp_insert_cursor_fields) as stop_pairs_cursor:
                        for origin_row in SearchCursor(
                            self.origins_layer.layer,
                            origins_layer_cursor_fields,
                            spatial_reference=self.output_coordinate_system,
                            datum_transformation=self.transformation_o
                        ):
                            route_id = origin_row[1]
                            try:
                                # Find the destination corresponding to this origin
                                dest_row = dest_shapes[route_id]
                            except KeyError:
                                # Throw an error if we could not find a corresponding origin
                                LOGGER.error(100273, extra={
                                    "message_ID": 100273,
                                    "routeId": route_id,
                                    "routeIDField": self.origins_layer_route_id,
                                    "startLayer": self.origins_layer.layer_name,
                                    "endLayer": self.destinations_layer.layer_name
                                })
                                raise arcpy.ExecuteError
                            # Construct route name based on origin and destination IDs
                            route_name = f"{origin_row[2]} - {dest_row[1]}"  # OriginOID - DestinationOID
                            # Check if the origin and destination are spatially coincident. In this case, do not add
                            # this coincident pair to the table. Instead, track it for later processing.
                            # Note: The equals() method can sometimes raise a ValueError where there is bad geometry.
                            # Just skip those points.
                            try:
                                is_origin_same_as_dest = origin_row[0].equals(dest_row[0])
                                if is_origin_same_as_dest:
                                    self.coincident_od_pair_oids.append((origin_row[-1], dest_row[-1]))
                                    self.coincident_origin_count += 1
                                else:
                                    stop_pairs_cursor.insertRow((origin_row[0], route_name, origin_row[2], origin_row[2]))
                                    stop_pairs_cursor.insertRow((dest_row[0], route_name, dest_row[1], dest_row[1]))
                            except Exception:
                                geom_errors = True
                                continue

        # Fail if after all this preprocessing, we have ended up with zero stop pairs. This can happen if all origins
        # are coincident with destinations or if all origins or all destinations have bad geometry.
        stop_pairs_count = AOLUtils.get_feature_count(self.input_stop_pairs)
        LOGGER.debug(f"Number of stop pairs: {stop_pairs_count}")
        if not stop_pairs_count:
            # All origin-destination pairs are invalid.
            LOGGER.error(100364, extra={"message_ID": 100364})
            if geom_errors:
                # This message will be raised only if checking origin and destination geometry equality or inserting
                # rows actually errors. This should be rare.
                # Geometry errors detected in the inputs.
                LOGGER.error(100361, extra={"message_ID": 100361})
            elif self.coincident_od_pair_oids:
                # All origins are spatially coincident with their assigned destinations.
                LOGGER.error(100362, extra={"message_ID": 100362})

            raise arcpy.ExecuteError

    def execute(self):
        """Execute the core logic of ConnectOriginsToDestinations."""
        # Prepare inputs for use
        with LogExecutionTime("Pre-processed inputs"):
            self._preprocess_inputs()

        # Connect the origins to the destinations
        # This tool has two primary options: connect origins to destinations using straight-line distance or connect
        # origins to destinations using network time/distance. The choice of this option leads to two completely
        # different code paths.
        if self.measurement_type == "STRAIGHTLINE":
            with LogExecutionTime("Connected origins to destinations with straight lines."):
                self._connect_with_straight_lines()
        else:
            with LogExecutionTime("Connected origins to destinations with network."):
                self._connect_with_network()

    def _connect_with_straight_lines(self):
        '''Connect origins to destinations using straight-line distance.'''
        LOGGER.debug("Connecting with straight lines")
        # Set this here because the tool uses it when setting symbology
        self.route_shape = "STRAIGHTLINE"

        # Create the output routes feature class
        LOGGER.debug("Creating output routes feature class")
        arcpy.management.CreateFeatureclass(
            os.path.dirname(self.output_routes.data),
            os.path.basename(self.output_routes.data),
            "POLYLINE",
            spatial_reference=self.output_coordinate_system
        )
        # Set the schema
        origin_oid_field_type = "BIGINTEGER" if self.origins_layer_has_oid64 else "LONG"
        destination_oid_field_type = "BIGINTEGER" if self.destinations_layer_has_oid64 else "LONG"
        field_defs = [
            ["RouteName", "TEXT", "Route Name", 128],
            ["Total_Miles", "DOUBLE", "Straight Line Distance (Miles)"],
            ["Total_Kilometers", "DOUBLE", "Straight Line Distance (Kilometers)"],
            ["OriginOID", origin_oid_field_type, "Origin ID"],
            ["DestinationOID", destination_oid_field_type, "Destination ID"]
        ]
        arcpy.management.AddFields(self.output_routes.data, field_defs)

        # Read through the input stop pairs feature class, find each pair, and store relevant values that we will use
        # to generate line features.
        # The pairs dictionary is structured like
        # {RouteName: [[origin point, destination point], [origin ID, destination ID]]}
        # Since each row in the input stop pairs feature class represents only one point, we dynamically construct the
        # origin/destination lists. The first point found for a given RouteName is the origin, and the second is the
        # destination.
        LOGGER.debug("Defining OD pairs")
        pairs = {}
        # We do not need to set the spatial reference with this SearchCursor because the input stop pairs table is
        # already reliably in our desired output spatial reference. This happened during pre-processing.
        for row in SearchCursor(self.input_stop_pairs, ("SHAPE@", "RouteName", self.stop_pair_id_field_name)):
            if row[1] in pairs:
                # This is a destination
                # Add the destination info onto the existing origin info stored in the dictionary
                # {RouteName: [[origin point], [origin ID]]} ->
                #   {RouteName: [[origin point, destination point], [origin ID, destination ID]]}
                row_value = pairs[row[1]]
                row_value[0].append(row[0].firstPoint)
                row_value[1].append(row[2])
            else:
                # This is an origin
                row_value = [[row[0].firstPoint], [row[2]]]  # {RouteName: [[origin point], [origin ID]]}
            pairs[row[1]] = row_value

        # Create the straight lines from the stop pair point locations and insert them into the output.
        LOGGER.debug("Constructing straight lines from OD pairs")
        fields = ("SHAPE@", "RouteName", "Total_Miles", "Total_Kilometers", "OriginOID", "DestinationOID")
        # We do not need to set the spatial reference with this InsertCursor because the input stop pairs table is
        # already reliably in our desired output spatial reference. This happened during pre-processing.
        with InsertCursor(self.output_routes.data, fields) as cur:
            for route_id in pairs:
                pair = pairs[route_id]  # [[origin point, destination point], [origin ID, destination ID]]
                # Generate the polyline
                line_shape = arcpy.Polyline(arcpy.Array(pair[0]), self.output_coordinate_system)
                # Calculate distance
                distance_miles: float = line_shape.getLength("GEODESIC", "MILES")  # type: ignore
                distance_kilometers = NAUtils.convert_units(distance_miles, "miles", "kilometers", 5)
                # Densify lines longer than 1,000 miles so that they look like curved lines
                if distance_miles > 1000:
                    densified_shape = line_shape.densify("GEODESIC", distance_kilometers * 0.1, 1)  # type: ignore
                    line_shape = densified_shape
                origin_oid, destination_oid = pair[1]
                cur.insertRow((line_shape, route_id, distance_miles, distance_kilometers, origin_oid, destination_oid))

        # Post-process the output to ensure correct schema and populate unassigned origins and destinations tables
        with LogExecutionTime("Post-processed outputs from straight-line origin-destination calculation."):
            self._post_process_output_straight_lines()

    def _post_process_output_straight_lines(self):
        """Post-process the output from straight lines to ensure correct tool output tables and schema."""
        LOGGER.debug("Post-processing straight line output.")
        # Transfer fields from input origins and destinations
        self._transfer_input_fields(self.origins_layer, "From", "OriginOID", self.origins_layer_has_oid64)
        self._transfer_input_fields(self.destinations_layer, "To", "DestinationOID", self.destinations_layer_has_oid64)

        # Add any coincident origins and destinations as unassigned origins and unassigned destinations
        if self.coincident_od_pair_oids:
            # If there are any, add a warning
            LOGGER.warning(100138, extra={"message_ID": 100138})
            # Create unassigned origins and unassigned destinations outputs
            self._save_unassigned_features_straight_lines("ORIGIN")
            self._save_unassigned_features_straight_lines("DESTINATION")
        else:
            LOGGER.debug("No unassigned outputs saved.")
            # We saved no output, so manually set the count to 0
            self.output_unassigned_origins.count = 0
            self.output_unassigned_destinations.count = 0

    def _save_unassigned_features_straight_lines(self, unassigned_feature_type="ORIGIN"):
        """Create output unassigned origins or destinations feature for the straight line case.

        Args:
            unassigned_feature_type (str, optional): Whether the output should be origins or destinations. Defaults to
                "ORIGIN". Any other value will produce destinations.
        """
        LOGGER.debug(f"Saving unassigned {unassigned_feature_type} features")
        # Set variables depending on whether we're currently working with origins or destinations
        if unassigned_feature_type == "ORIGIN":
            coincident_oids = tuple([rtid[0] for rtid in self.coincident_od_pair_oids])
            input_layer = self.origins_layer
            output_layer = self.output_unassigned_origins
            status_value = "Same location as destination"
            transformation = self.transformation_o
        else:
            coincident_oids = tuple([rtid[1] for rtid in self.coincident_od_pair_oids])
            input_layer = self.destinations_layer
            output_layer = self.output_unassigned_destinations
            status_value = "Same location as origin"
            transformation = self.transformation_d
        output_feature_class = output_layer.data

        if input_layer.count == 1:
            # If there is only one feature in this input, there can't be any coincident features because we would have
            # gotten an error earlier. Just return without doing anything.
            output_layer.count = 0
            return

        # Select the features from the input layer matching the IDs of the coincident features
        LOGGER.debug("Selecting coincident input features")
        if len(coincident_oids) == 1:
            expression = f"({coincident_oids[0]})"
        else:
            expression = str(coincident_oids)
        where_clause = f"{input_layer.oidFieldName} IN {expression}"
        with arcpy.EnvManager(
            outputCoordinateSystem=self.output_coordinate_system,
            geographicTransformations=transformation
        ):
            arcpy.analysis.Select(input_layer.layer, output_feature_class, where_clause)

        # Add and populate the Status field
        # If the field already exists, rename the existing field as ORIG_STATUS
        LOGGER.debug("Populating Status field")
        try:
            existing_status_field = FieldUtils.get_field_from_layer(
                self.unassigned_status_field_name, input_layer, True)
        except ToolExit:
            existing_status_field = None
        if existing_status_field:
            orig_status_field_name = NAUtils.get_unique_field_name(
                f"ORIG_{self.unassigned_status_field_name}", [f.name for f in input_layer.fields]
            )
            orig_status_field_alias = f"{existing_status_field.aliasName} (Original)"  # type: ignore
            arcpy.management.AlterField(
                output_feature_class,
                self.unassigned_status_field_name,
                orig_status_field_name,
                orig_status_field_alias
            )
        arcpy.management.AddField(
            output_feature_class,
            self.unassigned_status_field_name,
            "TEXT",
            field_length=30,
            field_alias=self.unassigned_status_field_name
        )
        arcpy.management.CalculateField(
            output_feature_class,
            self.unassigned_status_field_name,
            f"'{status_value}'"
        )

    def _connect_with_network(self):
        """Connect origins to destination using network distance."""
        LOGGER.debug("Connecting with network")
        # Get the tool
        tbx = RemoteToolboxUtils.get_remote_toolbox("asyncRoute", self.portal_description)
        LOGGER.debug("Adding remote toolbox {0}".format(tbx))

        # Figure out what travel mode to use
        travel_mode_types = {
            "STRAIGHTLINE": "Straight Line",
            "DRIVINGTIME": "Driving",
            "DRIVINGDISTANCE": "Driving",
            "WALKINGTIME": "Walking",
            "WALKINGDISTANCE": "Walking",
            "TRUCKINGTIME": "Trucking",
            "TRUCKINGDISTANCE": "Trucking",
            "AUTOMOBILE": "Driving",
            "TRUCK": "Trucking",
            "WALK": "Walking",
            "OTHER": "Travel",
        }
        measurement_type_upper = self.measurement_type.upper()
        if measurement_type_upper in travel_mode_types:
            # The measurement type is either straight lines or a known travel mode keyword
            travel_mode = travel_mode_types[measurement_type_upper]
        else:
            # The user has passed in a custom json travel mode
            travel_mode = self.measurement_type

        # Prepare barriers
        point_barr_lyr = self.point_barrier_layer.layer if self.point_barrier_layer else None
        line_barr_lyr = self.line_barrier_layer.layer if self.line_barrier_layer else None
        poly_barr_lyr = self.polygon_barrier_layer.layer if self.polygon_barrier_layer else None

        # Check if we are saving route data
        if self.include_route_layers:
            populate_directions = True
            LOGGER.debug("Directions language: {0}".format(self.directions_language))
        else:
            populate_directions = False

        task_params = [
            self.input_stop_pairs,
            "Minutes" if self.is_travel_mode_time_based else "Miles",  # measurement units
            "", "", "", "", "",
            self.time_of_day,
            NAUtils.TIME_ZONE_KEYWORDS[self.time_zone_for_time_of_day],
            "",
            point_barr_lyr,
            line_barr_lyr,
            poly_barr_lyr,
            "", "#", "",
            "True Shape" if self.route_shape == "FOLLOWSTREETS" else "Straight Line",
            "", False,
            populate_directions,
            self.directions_language,
            "", "",
            travel_mode,
            "", "", "", "",
            self.include_route_layers
        ]
        ignore_error_codes = (30109,)

        # Call the tool
        service_result = NAUtils.call_async_gp_service(tbx, "FindRoutes", task_params, ignore_error_codes)
        self.remote_job_id = service_result.resultID

        solve_succeeded = False
        if service_result.getOutput(0).lower() == 'true':
            solve_succeeded = True

        # Save the results from the remote tool and post-process them to have the correct schema
        if solve_succeeded:
            with LogExecutionTime("Saved the results from remote tool"):
                if self.include_route_layers:
                    self.route_data = service_result.getOutput(6)
                with LogExecutionTime("Post-processed outputs from network solve."):
                    self._post_process_output_network(service_result.getOutput(1), service_result.getOutput(4))
                self.task_cost = NAUtils.get_remote_task_cost(service_result, 11)
        else:
            # Add an error saying that none of the origins were assigned
            LOGGER.error(100139, extra={"message_ID": 100139})
            if self.include_route_layers:
                # Raise a warning since no route data is generated when there is no solution.
                LOGGER.warning(100217, extra={"message_ID": 100217})
            self.output_routes.count = 0
            self.output_unassigned_origins.count = 0
            self.output_unassigned_destinations.count = 0

    def _post_process_output_network(
        self, service_output_routes: arcpy.FeatureSet, service_output_stops: arcpy.FeatureSet
    ):
        """Post-process the output from the network solve to ensure correct tool output tables and schema.

        Args:
            service_output_routes (arcpy.FeatureSet): Routes returned from the service
            service_output_stops (arcpy.FeatureSet): Stops returned from the service
        """
        LOGGER.debug("Post-processing network output.")

        # --- Copy Routes output with correct schema ---
        LOGGER.debug("Copying output routes with correct schema")

        # Create a FieldMappings object to handle deleting and renaming fields when we call the
        # ExportFeatures tool
        fields_to_delete = ["StopCount", "FirstStopOID", "LastStopOID"]
        tm_int = NAUtils.get_travel_mode_type_as_int(self.measurement_type)
        tm_prefixes = {
            0: "Travel",
            1: "Driving",
            2: "Trucking",
            3: "Walking",
        }
        fields_to_rename = {
            "Name": ("RouteName", "Route Name"),
            "StartTime": ("StartTime", "Start Time"),
            "EndTime": ("EndTime", "End Time"),
            "StartTimeUTC": ("StartTimeUTC", "Start Time"),
            "EndTimeUTC": ("EndTimeUTC", "End Time"),
            "Total_Minutes": ("Total_Minutes", f"{tm_prefixes[tm_int]} Time (Minutes)"),
            "Total_Miles": ("Total_Miles", f"{tm_prefixes[tm_int]} Distance (Miles)"),
            "Total_Kilometers": ("Total_Kilometers", f"{tm_prefixes[tm_int]} Distance (Kilometers)"),
        }
        field_mappings = NAUtils.make_field_maps(
            service_output_routes,
            fields_to_delete,
            fields_to_rename
        )
        # Add RouteLayerItemID and RouteLayerItemURL fields on output routes
        field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
            self.route_layer_item_id_field_name, "Route Layer Item ID", "String", 50))
        field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
            self.route_layer_item_url_field_name, "Route Layer Item", "String", 256))
        # Add OriginOID and DestinationOID fields on output routes
        out_routes_origin_id_field = "OriginOID"
        out_origin_id_field_type = "BigInteger" if self.origins_layer_has_oid64 else "Integer"
        out_routes_destination_id_field = "DestinationOID"
        out_destination_id_field_type = "BigInteger" if self.destinations_layer_has_oid64 else "Integer"
        field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
            out_routes_origin_id_field, "Origin ID", out_origin_id_field_type))
        field_mappings.addFieldMap(NAUtils.make_new_field_map_with_output_field(
            out_routes_destination_id_field, "Destination ID", out_destination_id_field_type))

        # Copy the routes output to its final location using the field mappings
        NAUtils.copy_service_output_to_fc(
            service_output_routes, self.output_routes.data, field_mappings, self.output_coordinate_system)

        # --- Calculate Origin and Destination ID fields in output routes ---
        LOGGER.debug("Calculating ID fields")

        # Transfer the stop pair ID field to the output stops to use in further field calculations
        output_stops_layer = AOLUtils.make_feature_layer(service_output_stops, "Output Stops")
        id_field_type = "BIGINTEGER" if (self.origins_layer_has_oid64 or self.destinations_layer_has_oid64) else "LONG"
        arcpy.management.AddField(output_stops_layer, self.stop_pair_id_field_name, id_field_type)
        # Join based on the defined relationship between the output stops ORIG_FID field and the input feature class's
        # OID field.
        in_oid_field_name = arcpy.Describe(self.input_stop_pairs).oidFieldName
        arcpy.management.AddJoin(output_stops_layer, "ORIG_FID", self.input_stop_pairs, in_oid_field_name)
        arcpy.management.CalculateField(
            output_stops_layer, self.stop_pair_id_field_name,
            f"!{os.path.basename(self.input_stop_pairs)}.{self.stop_pair_id_field_name}!"  # type: ignore
        )
        arcpy.management.RemoveJoin(output_stops_layer)

        # Calculate the OriginOID and DestinationOID fields based on the values from the updated output stops
        desc_output_stops = AOLUtils.describe(output_stops_layer)
        output_stops_oid_field = desc_output_stops.oidFieldName
        join_fields = {
            "FirstStopID": out_routes_origin_id_field,
            "LastStopID": out_routes_destination_id_field
        }
        for fld in join_fields:
            with arcpy.EnvManager(qualifiedFieldNames=False):
                arcpy.management.AddJoin(self.output_routes.layer, fld, output_stops_layer, output_stops_oid_field)
                arcpy.management.CalculateField(
                    self.output_routes.layer, join_fields[fld], f"!{self.stop_pair_id_field_name}!")
                arcpy.management.RemoveJoin(self.output_routes.layer)

        # Delete fields that are no longer necessary
        output_routes_delete_fields = list(join_fields.keys())
        arcpy.management.DeleteField(self.output_routes.data, output_routes_delete_fields)

        # --- Transfer fields from the input origins and destinations to the output routes---

        self._transfer_input_fields(
            self.origins_layer, "From", out_routes_origin_id_field, self.origins_layer_has_oid64)
        self._transfer_input_fields(
            self.destinations_layer, "To", out_routes_destination_id_field, self.destinations_layer_has_oid64)

        # --- Create and populate the output unassigned origins and destinations ---
        # Only create these outputs if we got a partial solution
        if max((self.origins_layer.count, self.destinations_layer.count)) != self.output_routes.count:
            # If there are any, add a warning
            LOGGER.warning(100138, extra={"message_ID": 100138})
            # Create unassigned origins and unassigned destinations outputs
            self._save_unassigned_features_network(
                self.origins_layer, self.output_unassigned_origins,
                out_routes_origin_id_field, service_output_stops
            )
            self._save_unassigned_features_network(
                self.destinations_layer, self.output_unassigned_destinations,
                out_routes_destination_id_field, service_output_stops
            )
        else:
            LOGGER.debug("No unassigned outputs saved.")
            # We saved no output, so manually set the count to 0
            self.output_unassigned_origins.count = 0
            self.output_unassigned_destinations.count = 0

    def _save_unassigned_features_network(
        self, input_layer: PAFeatureLayer, unassigned_layer: PAOutputFeatureLayer, id_field_name: str,
        service_output_stops: arcpy.FeatureSet
    ):
        """Create the output unassigned origins or destinations feature class for the network case.

        Args:
            input_layer (PAFeatureLayer): The input Origins or Destinations layer to use for transferring selected
                origins or destinations to the output.
            unassigned_layer (PAOutputFeatureLayer): Output unassigned Origins or Destinations layer to use.
            id_field_name (str): Field name (such as OriginOID or DestinationOID) in output routes that contains the
                source OIDs. Used for transferring fields via join.
            service_output_stops (arcpy.FeatureSet): Stops returned from the service
        """
        if input_layer.count == 1:
            # If there is only one feature in this input, there can't be any unassigned features because we would have
            # gotten an error earlier. Just return without doing anything.
            unassigned_layer.count = 0
            return

        unassigned_feature_class = unassigned_layer.data
        LOGGER.debug(f"Saving unassigned features to {unassigned_feature_class}")

        # Determine if we are creating unassigned destinations or unassigned origins and set variables accordingly
        coincident_oids = tuple()
        unassigned_feature_type = "Origin" if id_field_name == "OriginOID" else "Destination"
        if unassigned_feature_type == "Origin":
            sequence = 1
            unassigned_status = "Unassigned destination"
            coincident_status = "Same location as destination"
            if self.coincident_od_pair_oids:
                coincident_oids = tuple([rtid[0] for rtid in self.coincident_od_pair_oids])
            transformation = self.transformation_o
            id_field_type = "BIGINTEGER" if self.origins_layer_has_oid64 else "LONG"
        else:
            sequence = 2
            unassigned_status = "Unassigned origin"
            coincident_status = "Same location as origin"
            if self.coincident_od_pair_oids:
                coincident_oids = tuple([rtid[1] for rtid in self.coincident_od_pair_oids])
            transformation = self.transformation_d
            id_field_type = "BIGINTEGER" if self.destinations_layer_has_oid64 else "LONG"

        # Join output routes to input layer in order to create some field mappings
        arcpy.management.AddJoin(input_layer.layer, input_layer.oidFieldName, self.output_routes.layer, id_field_name)
        # Re-Describe the input layer to get the oidFieldName now that there is a join on it
        input_layer_oid_field = AOLUtils.describe(input_layer.layer).oidFieldName

        # Construct some field mappings to create desired schema in output unassigned feature class
        # Keep only the source fields and the source OID fields
        input_field_mappings = arcpy.FieldMappings()
        input_field_mappings.addTable(input_layer.layer)
        source_field_names = [
            f.baseName for f in input_layer.fields
            if f.name not in (input_layer.oidFieldName, input_layer.shapeFieldName)
        ]
        remove_field_names = [f.name for f in input_field_mappings.fields if f.name not in source_field_names]
        for field in remove_field_names:
            field_index = input_field_mappings.findFieldMapIndex(field)
            if field_index != -1:
                input_field_mappings.removeFieldMap(field_index)
        # Add the OID field as ORIG_FID
        orig_fid_field_name = NAUtils.get_unique_field_name("ORIG_FID", source_field_names)
        fm_oid = NAUtils.make_new_field_map_with_output_field(orig_fid_field_name, "ORIG FID", id_field_type)
        fm_oid.addInputField(input_layer.layer, input_layer_oid_field)
        input_field_mappings.addFieldMap(fm_oid)

        # If the input already has a field called "Status", rename it to ORIG_Status
        existing_status_field_index = input_field_mappings.findFieldMapIndex(self.unassigned_status_field_name)
        if existing_status_field_index != -1:
            fm_status: arcpy.FieldMap = input_field_mappings.getFieldMap(existing_status_field_index)  # type: ignore
            existing_status_field = fm_status.outputField
            existing_status_field.name = NAUtils.get_unique_field_name(
                f"ORIG_{self.unassigned_status_field_name}", [f.name for f in input_layer.fields]
            )
            existing_status_field.aliasName = f"{existing_status_field.aliasName} (Original)"
            fm_status.outputField = existing_status_field
            input_field_mappings.replaceFieldMap(existing_status_field_index, fm_status)

        # Construct a where clause to find all features that were either not assigned to a route or that represent
        # coincident features identified during pre-processing
        # For features that didn't participate in output routes.
        where_clause = f"{self.output_routes_name}.{id_field_name} IS NULL"
        # Add onto where clause for coincident features
        coincident_where = ""
        if coincident_oids:
            if len(coincident_oids) == 1:
                coincident_where = f"{input_layer_oid_field} IN ({coincident_oids[0]})"
            else:
                coincident_where = f"{input_layer_oid_field} IN {coincident_oids}"
        if coincident_where:
            where_clause = f"{where_clause} OR {coincident_where}"

        # Copy the input features to output
        with arcpy.EnvManager(
            outputCoordinateSystem=self.output_coordinate_system,
            geographicTransformations=transformation
        ):
            arcpy.conversion.FeatureClassToFeatureClass(
                input_layer.layer,
                os.path.dirname(unassigned_feature_class),
                os.path.basename(unassigned_feature_class),
                where_clause=where_clause,
                field_mapping=input_field_mappings
            )

        # Remove the temporary join
        arcpy.management.RemoveJoin(input_layer.layer)

        # Add and populate the status field
        LOGGER.debug("Populating Status field")
        arcpy.management.AddField(
            unassigned_feature_class,
            self.unassigned_status_field_name,
            "TEXT",
            field_length=30,
            field_alias=self.unassigned_status_field_name
        )
        # Make a look-up dictionary of Status values for relevant points in the output stops
        where_clause = f"Status <> 0 AND (Sequence = {sequence} OR Sequence IS NULL)"
        with SearchCursor(service_output_stops, ("Name", "Status"), where_clause) as output_stops_cursor:
            status_values = {int(row[0]): row[1] for row in output_stops_cursor}
        with UpdateCursor(
            unassigned_feature_class,
            (orig_fid_field_name, self.unassigned_status_field_name)
        ) as cursor:
            for row in cursor:
                # Populate Status with either network status such as "Not located", coincident point status, or generic
                # something-bad-but-unknown-happened status
                status_value = status_values.get(row[0], -1)
                if status_value in NAUtils.NETWORK_LOCATION_STATUS:
                    str_status_value = NAUtils.NETWORK_LOCATION_STATUS[status_value]
                    cursor.updateRow((row[0], str_status_value))
                elif row[0] in coincident_oids:
                    cursor.updateRow((row[0], coincident_status))
                else:
                    cursor.updateRow((row[0], unassigned_status))

        # Delete the ORIG_FID field because we're done with it
        arcpy.management.DeleteField(unassigned_feature_class, orig_fid_field_name)

    def _transfer_input_fields(
            self, input_layer: PAFeatureLayer, input_field_name_prefix: str, output_join_field: str,
            input_layer_has_oid64: bool
        ):
        """Transfers fields from tool inputs to the output routes to ensure correct schema.

        Args:
            input_layer (PAFeatureLayer): Input layer (Origins or Destinations) from which to transfer fields to output
            input_field_name_prefix (str): Field name prefix to use on transferred fields, such as "From" or "To"
            output_join_field (str): Field in the output Routes layer to use for joining with the designated input.
            input_layer_has_oid64 (bool): Whether the input_layer's OID field is 64bit
        """
        # Make a copy of the input data in order to update field names to the desired schema for transferring to output
        # routes. This is definitely a brute-force approach, but I don't see a better way to do this and still match
        # the existing outputs.
        LOGGER.debug("Transferring fields from inputs into output routes")

        # Create some temporary field mappings, and pick and choose which to preserve an use
        input_field_maps = []
        transfer_field_names = []
        temp_field_mappings = arcpy.FieldMappings()
        temp_field_mappings.addTable(input_layer.layer)
        for field_map in temp_field_mappings.fieldMappings:
            output_field = field_map.outputField
            # Skip GUID fields
            if output_field.type.lower() in ("globalid", "guid"):
                continue
            new_field_name = f"{input_field_name_prefix}_{output_field.name}"
            output_field.name = new_field_name
            output_field.aliasName = f"{input_layer.layer_name}: {output_field.aliasName}"
            # Sometimes we can have text fields of length zero. These cause errors when writing rows, so update the
            # length to 256.
            if output_field.length == 0 and output_field.type.lower() in ("string", "text"):
                output_field.length = 256
            field_map.outputField = output_field
            transfer_field_names.append(new_field_name)
            input_field_maps.append(field_map)

        # Copy the original input to a temporary feature class used for joining based on the updated schema defined in
        # the field maps
        input_field_mappings = arcpy.FieldMappings()
        for fm in input_field_maps:
            input_field_mappings.addFieldMap(fm)
        # Add another field map to transfer the OID field from the input as ORIG_FID
        oid_field_name = NAUtils.get_unique_field_name("ORIG_FID", [fld.name for fld in input_layer.fields])
        oid_field_type = "BIGINTEGER" if input_layer_has_oid64 else "LONG"
        fm_oid = NAUtils.make_new_field_map_with_output_field(oid_field_name, "ORIG FID", oid_field_type)
        fm_oid.addInputField(input_layer.layer, input_layer.oidFieldName)
        input_field_mappings.addFieldMap(fm_oid)
        # Copy the inputs
        temp_input_features = AOLUtils.create_unique_name("TempInput", self.output_workspace)
        LOGGER.debug(f"{temp_input_features=}")
        input_lyr_fields = {f.name: f.type for f in arcpy.ListFields(input_layer.layer)}
        LOGGER.debug(f"{input_lyr_fields=}")

        try:
            arcpy.conversion.FeatureClassToFeatureClass(input_layer.layer, os.path.dirname(temp_input_features),
                                                        os.path.basename(temp_input_features),
                                                        field_mapping=input_field_mappings)
            LOGGER.debug(f"perform conversion through FC2FC.")
        except arcpy.ExecuteError as ex:
            # In rare cases, ExportFeatures fails when writing to the in_memory workspace. In this case,
            # write the result to the scratch file geodatabase
            LOGGER.debug(f"Failed to write '{input_layer.layer_name}' to {self.output_workspace} workspace")
            LOGGER.debug(f"Exception details: {str(ex)}")
            scratch_gdb = AOLUtils.get_scratch_wkspc()
            LOGGER.debug(f"Now trying to save to scratch gdb workspace: {scratch_gdb}")
            temp_input_features = AOLUtils.create_unique_name("TempInput", "scratchgdb")
            arcpy.conversion.FeatureClassToFeatureClass(input_layer.layer, scratch_gdb,
                                                        os.path.basename(temp_input_features),
                                                        field_mapping=input_field_mappings)

        # Join fields based on the output routes join field and the ObjectID field from the input feature class
        arcpy.management.JoinField(
            self.output_routes.data, output_join_field,
            temp_input_features, oid_field_name,
            transfer_field_names
        )
