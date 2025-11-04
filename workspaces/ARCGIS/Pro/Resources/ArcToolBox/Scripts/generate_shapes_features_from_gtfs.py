"""Provides validation and execution logic for the Generate Shapes Features From GTFS tool."""

import os
import uuid
import numpy as np
import pandas
import arcpy
import gtfs_utils
import spatial_reference_helper


# GTFS files required to run this tool. Left global so tool validator can see it.
REQUIRED_GTFS_FILES = ("stops.txt", "routes.txt", "trips.txt", "stop_times.txt")


def do_required_gtfs_files_exist(gtfs_folder):
    """Check if the required GTFS files are present in the input GTFS directory."""
    for gtfs_file in REQUIRED_GTFS_FILES:
        if not os.path.exists(os.path.join(gtfs_folder, gtfs_file)):
            return False
    return True


class GenerateShapesFeaturesFromGTFS(gtfs_utils.Tool):
    """Generates polyline features representing shapes for a GTFS dataset based on GTFS stop sequences."""

    # pylint: disable=too-few-public-methods
    # pylint: disable=too-many-instance-attributes

    def __init__(
            self, in_gtfs_folder, out_shape_lines, out_shape_stops, out_gtfs_trips, network_modes=("3", "5", "11",),
            network_data_source=None, travel_mode=None, drive_side="Right", bearing_tolerance=30,
            max_bearing_angle=65):  # pylint: disable=too-many-arguments
        """Store tool parameter values as instance names.

        Args:
            in_gtfs_folder: A folder containing valid GTFS data.  The GTFS stops.txt, trips.txt, routes.txt,
                and stop_times.txt files must be present in the input folder.
            out_shape_lines: A line feature class representing the estimated route shapes. The user can edit this and
                use it as input to the GTFS Shapes To Features tool.
            out_shape_stops: A point feature class of GTFS transit stops with an ID associating them with each shape
                line. In cases where the same GTFS stop gets visited by multiple shapes, this feature class will contain
                multiple copies of that stop, one for each shape it is associated with. This feature class useful with
                definition queries when editing one shape line at a time and is used as input to the GTFS Shapes To
                Features tool for linear referencing.
            out_gtfs_trips: The new GTFS trips.txt file containing the shape_id field.
            network_modes = Modes of transit for which line shapes should be generated using network-derived routes. The
                user would typically select modes such as buses which run on streets. Shapes for all modes not selected
                will be generated using straight lines. The options are a list of strings representations of integer
                codes corresponding to the list of supported GTFS route_type values (currently "0", "1", "2", "3", "4",
                "5", "6", "7", "11", and "12") and the keyword "OTHER" for any modes not included in this list. The
                parameter is specified as a list or tuple of strings.
            network_data_source: A network dataset, network dataset layer, or portal service URL to use for calculating
                network routes.
            travel_mode: A travel mode name or object on the network data source most appropriate for calculating routes
            drive_side: Indicates whether the transit vehicles drive on the left or right side of the road. Specify as
                "Left" or "Right".
            bearing_tolerance: Used to fine-tune the output. Indicates the maximum allowed angle between the stop's
                estimated direction of travel and the angle of the network edge the stop could locate on. If the angles
                differ by more than the bearing_tolerance, then Network Analyst assumes that this is not the correct
                network edge to locate the stop on, and it will continue searching other nearby network edges for a more
                appropriate one.
            max_bearing_angle Used to fine-tune the output. The bearing for each stop is estimated by averaging the
                angles between that stop and the previous stop and next stop along the route. When the route follows a
                relatively straight road, this angle is a good representation of the bearing. However, if the route goes
                around a corner, makes a U-turn, follows a very twisty road, or diverts into a parking lot or side road,
                then the average angle is not a good estimate of actual bearing, and using this estimate can cause the
                stop to locate far away from where it should and worsen the quality of the tool output. Consequently,
                the tool is configured to NOT use a bearing estimate if the difference in angle from the previous stop
                and to the next stop is greater than the max_bearing_angle. In this situation, the stop will revert to
                the normal locating behavior and will snap to the closest non-restricted network edge.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.in_gtfs_folder = in_gtfs_folder
        self.in_gtfs_stop_times_file = os.path.join(self.in_gtfs_folder, "stop_times.txt")
        self.in_gtfs_stops_file = os.path.join(self.in_gtfs_folder, "stops.txt")
        self.in_gtfs_trips_file = os.path.join(self.in_gtfs_folder, "trips.txt")
        self.in_gtfs_routes_file = os.path.join(self.in_gtfs_folder, "routes.txt")

        self.out_shape_lines = out_shape_lines
        self.out_shape_stops = out_shape_stops
        self.is_shapefile_stops = self._is_output_shapefile(self.out_shape_stops)
        self.out_gtfs_trips = out_gtfs_trips

        # Network options
        self.network_modes = network_modes
        self.network_data_source = network_data_source
        self.travel_mode = travel_mode
        self.drive_side = drive_side
        self.bearing_tolerance = bearing_tolerance
        self.max_bearing_angle = max_bearing_angle

        self.required_tool_fields = {
            "stops.txt": ("stop_id", "stop_lat", "stop_lon",),
            "stop_times.txt": ("trip_id", "stop_id", "stop_sequence",),
            "trips.txt": ("trip_id", "route_id",),
            "routes.txt": ("route_id", "route_type",)
            }

        self.sequence_shape_dict_network = {}  # {(stop sequence): shape_id}
        self.sequence_shape_dict_straight = {}  # {(stop sequence): shape_id}
        self.trip_shape_dict = {}  # {trip_id: shape_id}
        self.bearings_dict = {}  # {shape_id: [bearings]}
        self.chunks = []
        self.lengthy_sequences = []
        self.stop_times_table = None
        self.stops_table = None
        self.trips_table = None
        self.routes_table = None
        self.route = None
        self.route_result = None

        # Prepare from variables for dealing with spatial reference and extents
        self.output_spatial_ref_stops = spatial_reference_helper.determine_output_spatial_ref(
            os.path.dirname(self.out_shape_stops), gtfs_utils.WGS_COORDS
        )
        self.output_spatial_ref_shapes = spatial_reference_helper.determine_output_spatial_ref(
            os.path.dirname(self.out_shape_lines), gtfs_utils.WGS_COORDS
        )
        self.stops_extent = None

        self.use_network = len(self.network_modes) > 0
        # Determine if the desired network is a service
        self.is_service = self.use_network and self.network_data_source.startswith("http")
        # If we're using a local network dataset, check out the Network Analyst extension license. This is only
        # applicable for Concurrent Use licensing, but it won't hurt anything for Single Use or Named User. For Single
        # Use and Named User, we will check if it's available and fail out if not.
        if self.use_network and not self.is_service:
            # Make sure the license is available.
            if arcpy.CheckExtension("network").lower() == "available":
                arcpy.CheckOutExtension("network")
            else:
                # The operation failed because no Network Analyst license is present.
                raise gtfs_utils.Error(30218)

        # Initialize service limits
        self.max_stops_total = None
        self.max_stops_per_route = None
        if self.use_network:
            self._get_service_limits()

    def execute(self):
        """Tool Execution logic."""
        self._initialize_gtfs()
        self._get_unique_stop_sequences()
        self._make_gtfs_trips()
        self._make_stops()
        self._make_shapes()

    def _initialize_gtfs_table(self, gtfs_file, gtfs_file_name):
        """Read a GTFS file into a pandas dataframe and do some basic validation."""
        # Initialize table
        table = gtfs_utils.GTFSToFeaturesConverter(gtfs_file, gtfs_file_name)
        # Ensure all required fields are present
        table.validate_required_tool_fields(self.required_tool_fields[gtfs_file_name])
        # Read data into pandas dataframe
        table.gtfs_to_df(table.fields)
        # Make sure table is not empty
        table.validate_df_not_empty()
        # These fields cannot have null values.
        table.validate_fields_not_null(self.required_tool_fields[gtfs_file_name])
        return table

    def _initialize_gtfs(self):
        """Read relevant GTFS files into pandas dataframes and do some validation and preparation."""
        # Make sure the input GTFS folder has the correct tables.
        if not do_required_gtfs_files_exist(self.in_gtfs_folder):
            # Input GTFS folder %s is missing required GTFS files. The required GTFS files are: stops.txt, routes.txt,
            # trips.txt, and stop_times.txt.
            raise gtfs_utils.Error(3116, self.in_gtfs_folder)

        # GTFS stops
        self.stops_table = self._initialize_gtfs_table(self.in_gtfs_stops_file, "stops.txt")
        # Validate stop_id unique
        self.stops_table.validate_fields_unique(["stop_id"])
        # Validate lat/lon values
        self.stops_table.validate_lat_lon_values()
        # Calculate geometry objects
        self.stops_table.calculate_point_shapes()
        # Shapefiles cannot have null values, so fill them with empty strings
        if self.is_shapefile_stops:
            self.stops_table.fill_na()
        # Index by stop_id
        self.stops_table.index_df("stop_id")

        # GTFS stop_times
        self.stop_times_table = self._initialize_gtfs_table(self.in_gtfs_stop_times_file, "stop_times.txt")
        # Find stops that are in stop_times but are not in stops.
        # Use self.stops_table.data_frame.index because we already indexed stops by stop_id.
        bad_stops = self.stop_times_table.find_bad_column_values("stop_id", self.stops_table.data_frame.index)
        if bad_stops:
            # The stop_times.txt file contains stop_id values that are not present in the stops.txt file. These stops
            # will be ignored when generating shapes. Missing stop_ids: %s" % str(bad_stops)
            arcpy.AddIDMessage("WARNING", 3117, str(bad_stops))
            self.stop_times_table.delete_rows_with_bad_values("stop_id", bad_stops)

        # GTFS trips
        self.trips_table = self._initialize_gtfs_table(self.in_gtfs_trips_file, "trips.txt")
        # Validate trip_id unique
        self.trips_table.validate_fields_unique(["trip_id"])
        # Index by trip_id
        self.trips_table.index_df("trip_id")

        # GTFS routes
        self.routes_table = self._initialize_gtfs_table(self.in_gtfs_routes_file, "routes.txt")
        # Validate route_id unique
        self.routes_table.validate_fields_unique(["route_id"])
        # Calculate a field indicating if this route should use the network for its shape
        network_mode_dict = {}
        for mode in gtfs_utils.GTFS_ROUTE_TYPES:
            network_mode_dict[mode] = mode in self.network_modes  # {"0": True, "1": False, ...}
        self.routes_table.data_frame["use_network"] = self.routes_table.data_frame["route_type"].map(network_mode_dict)
        # Handle any non-standard modes that didn't map in the line above. These will have been left as nan values in
        # the dataframe column. Fill nan with True or False depending on whether the user has specified that "OTHER"
        # modes should use the network.
        self.routes_table.data_frame["use_network"].fillna("OTHER" in self.network_modes, inplace=True)
        # Index by route_id
        self.routes_table.index_df("route_id")

        # Calculate extent of stops. Used later when determining datum transformation.
        self.stops_extent = self.stops_table.make_extent_from_lat_lon_values()

    def _get_unique_stop_sequences(self):
        """Find the unique sequences of stops from stop_times.txt. Each unique sequence is a new shape."""
        # Sort the stop_times table by trip_id and then stop_sequence to ensure that stop visits are correctly ordered
        self.stop_times_table.sort_df(["trip_id", "stop_sequence"])
        self.stop_times_table.index_df("trip_id")
        # Loop through the stop_times table
        current_shape_id = 1
        for trip_id, stop in self.stop_times_table.data_frame.groupby(["trip_id"], sort=True):
            try:
                # Figure out the route_type for this trip
                trip_id = trip_id[0]
                route_id = self.trips_table.data_frame.at[trip_id, "route_id"]
                use_network = self.routes_table.data_frame.at[route_id, "use_network"]
            except KeyError:
                # This indicates a data issue.  Either the trip_id from stop_times is not in trips, or the route_id from
                # trips is not in routes.  This doesn't impact the success of the tool, so just fall back to the user's
                # use_network value for OTHER since we can't determine the route_type.
                use_network = "OTHER" in self.network_modes
            # Get the ordered sequence of stops visited by this trip
            stop_seq = tuple(stop["stop_id"].values.tolist())
            try:
                # Check if we've already seen this sequence, and if so, use that shape_id
                if use_network:
                    shape_id = self.sequence_shape_dict_network[stop_seq]
                else:
                    shape_id = self.sequence_shape_dict_straight[stop_seq]
            except KeyError:
                # Otherwise, we need a new shape_id
                shape_id = current_shape_id
                if use_network:
                    self.sequence_shape_dict_network[stop_seq] = shape_id
                else:
                    self.sequence_shape_dict_straight[stop_seq] = shape_id
                current_shape_id += 1
            # Store this trip's shape_id
            self.trip_shape_dict[trip_id] = str(shape_id)

    def _make_gtfs_trips(self):
        """Create a new gtfs trips.txt with the shape_id field added."""
        # Add the shape_id column to the trips table by mapping our dictionary of trips and shapes
        self.trips_table.data_frame["shape_id"] = pandas.Series(self.trip_shape_dict)
        self.trips_table.reset_index()

        # If the trip_id wasn't present in self.trip_shape_dict, the new shape_id column in the table will
        # have a value of NaN. This means that the trips.txt file had a trip_id value that was not included in
        # stop_times.txt, so the trip effectively has no stops and is not used.  This is a data problem, although it
        # doesn't really affect the outcome of this tool. Since we're generating a new trips.txt file anyway, remove the
        # bad rows and warn the user that we did so.
        if self.trips_table.field_has_null("shape_id"):
            # One or more of the trip_id values in the GTFS trips.txt file are not used by any stops in the
            # stop_times.txt file. No shapes will be created for these trip_ids, and the trips will be removed from the
            # output trips.txt file.
            arcpy.AddIDMessage("WARNING", 3118)
            self.trips_table.remove_rows_with_null("shape_id")

        # Write the updated trips.txt file.
        self.trips_table.write_df_rows_to_csv(self.out_gtfs_trips)

    def _make_stops(self):
        """Create and populate the output shape stops table from known stop sequences and locations."""
        # Determine if a datum transformation is required
        transformation = spatial_reference_helper.get_datum_transformation(
            gtfs_utils.WGS_COORDS, self.output_spatial_ref_stops, self.stops_extent
        )

        # Create and populate the output stops feature class
        field_descriptions = [["shape_id", "LONG"], ["sequence", "LONG"]]
        field_descriptions += self.stops_table.make_table_fields_list(
            self.is_shapefile_stops, os.path.dirname(self.out_shape_stops))
        # Override default text field length for stop_id if needed. It is critical to maintain stop_id as is.
        max_stop_id_length = self.stops_table.get_max_string_length_in_index()
        if max_stop_id_length > gtfs_utils.TEXT_FIELD_LENGTH:
            stop_id_field_desc = ["stop_id", "TEXT", None, max_stop_id_length]
            field_descriptions = [stop_id_field_desc if f[0] == "stop_id" else f for f in field_descriptions]
        gtfs_utils.make_output_table(self.out_shape_stops, field_descriptions, gtfs_utils.WGS_COORDS, "POINT")
        # Truncate text fields so they fit in the table. This will not cause a problem, as all fields besides stop_id
        # are merely informative and are not used in the code. The table is indexed by stop_id, and the truncation
        # method does not apply to the index field.
        self.stops_table.truncate_text_fields()

        # Construct a list of field names for use in cursor
        fields_to_write = [f[0] for f in field_descriptions] + ["SHAPE@"]
        stop_id_idx = fields_to_write.index("stop_id")

        # Write the entire data frame to the output table
        # Stops are repeated in the output feature class for each stop sequence (shape) they participate in
        def insert_stop_sequence(sequence, shape_id, stop_id_idx, cur):
            """Insert a stop sequence into the output stops table."""
            for order, stop in enumerate(sequence):
                row = self.stops_table.data_frame.loc[stop].tolist()
                row = [shape_id, order + 1] + row
                row.insert(stop_id_idx, stop)
                cur.insertRow(row)

        with arcpy.da.InsertCursor(  # pylint: disable=no-member
            self.out_shape_stops, fields_to_write, datum_transformation=transformation
        ) as cur:
            for sequence in self.sequence_shape_dict_network:
                shape_id = self.sequence_shape_dict_network[sequence]
                insert_stop_sequence(sequence, shape_id, stop_id_idx, cur)
            for sequence in self.sequence_shape_dict_straight:
                shape_id = self.sequence_shape_dict_straight[sequence]
                insert_stop_sequence(sequence, shape_id, stop_id_idx, cur)

    def _make_shapes(self):
        """Create the output shapes feature class and populate it with network and/or straight shape lines."""
        # Create the output Shapes feature class
        fields = [["shape_id", "LONG"]]
        gtfs_utils.make_output_table(self.out_shape_lines, fields, gtfs_utils.WGS_COORDS, "POLYLINE")

        # Create the line shapes and insert them into the output table
        self._generate_network_shapes()
        self._generate_straight_line_shapes()

    def _get_stop_geometry(self, stop_id):
        """Retrieve the stop geometry object from the dataframe."""
        # There should be no key errors here because we've already checked for and removed bad stops in stop_times.
        return self.stops_table.data_frame.at[stop_id, gtfs_utils.PTSHAPE_FIELD]

    def _generate_straight_line_shapes(self):
        """Generate polylines shapes by connecting ordered stop locations with straight lines."""
        # If there is nothing in the dictionary of shapes that should be calculated with straight lines there is nothing
        # to do here, so just return.
        if not self.sequence_shape_dict_straight:
            return

        # Generate a polyline for each unique stop sequence and insert them into the output table.
        transformation = spatial_reference_helper.get_datum_transformation(
            gtfs_utils.WGS_COORDS, self.output_spatial_ref_shapes, self.stops_extent
        )
        with arcpy.da.InsertCursor(  # pylint: disable=no-member
            self.out_shape_lines,
            ["shape_id", "SHAPE@"],
            datum_transformation=transformation
        ) as cur:
            for sequence in self.sequence_shape_dict_straight:
                shape_id = self.sequence_shape_dict_straight[sequence]
                # Make a straight-line shape
                shape_polyline = self._generate_straight_line_from_sequence(sequence)
                cur.insertRow((shape_id, shape_polyline,))

    def _generate_straight_line_from_sequence(self, stop_sequence):
        """Construct a polyline feature by connecting sequential stops with straight lines."""
        # Create an array of point geometries
        array = arcpy.Array()
        for stop in stop_sequence:
            stop_shp = self._get_stop_geometry(stop).firstPoint
            array.add(stop_shp)

        # Construct the polyline from the points
        polyline = arcpy.Polyline(array, gtfs_utils.WGS_COORDS)
        return polyline

    def _calculate_bearings(self, stop_sequence):
        """Return a list of bearing angles for a given stop sequence.

        Bearing and BearingTol are used to more precisely control how points get located on the network.  By indicating
        the vehicle's direction (its bearing) at a particular stop, we can better choose the correct nearby street to
        locate on. For example, if a transit stop is closer to a side street than to the centerline of the main street
        where the bus travels, the bearing of the bus traveling down the main street can cause the stop to correctly
        locate on the main street instead of the side street. This leads to more accurate routing results.

        More information about Bearing and BearingTol:
        ##### TODO: Update with Pro link once available.
        http://desktop.arcgis.com/en/arcmap/latest/extensions/network-analyst/bearing-and-bearingtol-what-are.htm

        We estimate bearings for transit stops by getting the angle between adjacent stops. This works well for stops
        along straight roads, such as in a grid-based city, and less well along curvy roads or where buses make a lot of
        turns.
        """
        bearings = []
        previous_angle = None
        for idx, current_stop in enumerate(stop_sequence):
            if idx == len(stop_sequence)-1:
                # This is the last stop in the sequence, so just use the previous angle as the bearing.
                bearings.append(previous_angle)
                angle_to_next = None
            else:
                # Calculate the angle from this stop to the next one in the sequence
                current_stop_geom = self._get_stop_geometry(current_stop)
                next_stop_geom = self._get_stop_geometry(stop_sequence[idx+1])
                angle_to_next = current_stop_geom.angleAndDistanceTo(next_stop_geom, "GEODESIC")[0]
                if previous_angle is None:
                    # This is the first stop, so use the angle to the second stop as the bearing
                    bearings.append(angle_to_next)
                else:
                    # If this is an intermediate stop, estimate the bearing based on the angle between this stop and the
                    # previous and next one. If the angle to the next one and the angle from the previous one are very
                    # different, the route is probably going around a corner, and we can't reliably estimate what the
                    # bearing should be by averaging, so don't try to use a bearing for this one.
                    diff = abs(angle_to_next - previous_angle)
                    if diff >= self.max_bearing_angle:
                        bearings.append(None)
                    else:
                        # If they're sufficiently similar angles, use some trigonometry to average the angle from the
                        # previous stop to this one and the angle of this one to the next one
                        angle_to_next_rad = np.deg2rad(angle_to_next)
                        previous_angle_rad = np.deg2rad(previous_angle)
                        bearing = np.rad2deg(
                            np.arctan2(
                                (np.sin(previous_angle_rad) + np.sin(angle_to_next_rad))/2,
                                (np.cos(previous_angle_rad) + np.cos(angle_to_next_rad))/2
                                )
                            )
                        bearings.append(bearing)
            previous_angle = angle_to_next

        return bearings

    def _populate_bearings_dict(self):
        """Calculate the bearings for each stop in each unique stop sequence and store them in a dictionary."""
        for sequence in self.sequence_shape_dict_network:
            # {shape_id: [list of bearings values in stop order]}
            self.bearings_dict[self.sequence_shape_dict_network[sequence]] = self._calculate_bearings(sequence)

    def _get_service_limits(self):
        """Get the maximum allowed stops and stops per route for network solves."""
        # If using a local network dataset or a service with no limits, manually set the service limits.
        # The idea is to simply prevent trying to solve ludicrously large problems all in one go.
        # We don't have a good sense of how many simple routes we can reasonably solve at once,
        # and to some extent, this depends on the user's machine. An analysis of existing GTFS datasets
        # shows that routes nearly always have fewer than 200 stops. Larger agencies are more likely to
        # be able to calculate their route shapes by other means (like GPS trackers) anyway, so this tool
        # is more likely to be run by agencies with fewer total stops.  Note that the raw number of stops
        # is not equivalent to the number of stops that will be used as inputs to the route solver in this
        # tool, however, because each stop will be used once per shape it participates in.
        # The limits set here are somewhat arbitrary.
        self.max_stops_total = 10000
        self.max_stops_per_route = 500
        if self.is_service:
            # If using a service, get the particular limits of that service.
            # At the time of this writing, the ArcGIS Online Route service limits were
            # 10,000 total stops and 150 stops per route.
            limits = arcpy.nax.GetWebToolInfo("asyncRoute", "FindRoutes", self.network_data_source)["serviceLimits"]
            service_max_stops_total = limits["maximumStops"]
            if service_max_stops_total:
                self.max_stops_total = service_max_stops_total
            service_max_stops_per_route = limits["maximumStopsPerRoute"]
            if service_max_stops_per_route:
                self.max_stops_per_route = service_max_stops_per_route

    def _chunk_stops(self):
        """Chunk the stop sequences up into manageable problem sizes for route solves based on self.max_stops_total.

        If any sequence exceeds self.max_stops_per_route, put that in a separate list to handle differently.
        """
        total_stops_in_chunk = 0
        current_chunk = []
        for sequence in self.sequence_shape_dict_network:
            num_stops = len(sequence)
            if num_stops > self.max_stops_per_route:
                # If the number of stops in this shape exceeds the maximum stops per route limit, save it for handling
                # later
                self.lengthy_sequences.append(sequence)
                continue
            if total_stops_in_chunk + num_stops > self.max_stops_total:
                # We've finished the chunk and need to start the next one
                self.chunks.append(current_chunk)
                current_chunk = [sequence]
                total_stops_in_chunk = num_stops
            else:
                # Continue adding sequences to the current chunk
                current_chunk.append(sequence)
                total_stops_in_chunk += len(sequence)
        # Finish up last chunk
        self.chunks.append(current_chunk)

    def _initialize_route(self):
        """Create a Route solver object and set solver settings."""
        # Reset variables to hopefully clear memory
        self.route = None
        self.route_result = None
        # Create new route object
        self.route = arcpy.nax.Route(self.network_data_source)
        # Analysis settings
        self.route.travelMode = self.travel_mode
        self.route.routeShapeType = arcpy.nax.RouteShapeType.TrueShapeWithMeasures
        self.route.findBestSequence = False
        self.route.returnToStart = False
        self.route.ignoreInvalidLocations = True
        # Locating settings
        # Keep the search tolerance quite small. Transit stops should be located quite close to roads, and if there is
        # no available road nearby, the user's network is probably misssing the road or driveway. It's better to exclude
        # the stop than to locate the stop on some random faraway road.
        try:
            self.route.searchTolerance = 50
            self.route.searchToleranceUnits = arcpy.nax.DistanceUnits.Meters
        except ValueError:
            # This is most likely an older portal (pre 11.0) that does not support locate settings. Services on these
            # portals always use the service's default search tolerance, and we cannot change it.
            pass
        # For best performance, don't output unnecessary stuff
        self.route.allowSaveRouteData = False
        self.route.returnDirections = False
        self.route.returnRouteEdges = False
        self.route.returnRouteJunctions = False
        self.route.returnRouteTurns = False
        # But allow saving layer file because this is useful for debugging
        self.route.allowSaveLayerFile = True

    def _insert_stops_from_chunk(self, chunk_idx):
        """Insert stop sequences from a chunk into the Route.

        Return a list of the RouteName values that were used in this chunk for post-solve checking.
        """
        route_names = []  # Route names used in this chunk. Used for checking route success later.
        with self.route.insertCursor(
                arcpy.nax.RouteInputDataType.Stops, ["SHAPE@", "Name", "RouteName", "Bearing", "BearingTol"]
                ) as cur:
            for sequence in self.chunks[chunk_idx]:
                shape_id = self.sequence_shape_dict_network[sequence]
                route_names.append(shape_id)
                for idx, stop_id in enumerate(sequence):
                    stop_shp = self._get_stop_geometry(stop_id)
                    cur.insertRow(
                        [stop_shp, stop_id, shape_id, self.bearings_dict[shape_id][idx], self.bearing_tolerance]
                        )
        return route_names

    def _insert_stops_in_lengthy_sequence(self, sequence):
        """For a sequence that exceeds self.max_stops_per_route, chunk it up and insert as separate RouteNames."""
        # Chunk up the lengthy sequence and make matching chunks for bearings
        # This makes chunks of the max length with an overlap of one stop so the routes in each chunk will meet up.
        # Example: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] with a cap of 4 will yield
        # [1, 2, 3, 4], [4, 5, 6 7], [7, 8, 9, 10]
        sequences = [
            sequence[i:i+self.max_stops_per_route] for i in range(0, len(sequence), self.max_stops_per_route-1)]
        # If the last chunk has only one item, we throw it out since it's included in the previous chunk, and you
        # can't solve a route with only one stop.
        if len(sequences[-1]) == 1:
            sequences.pop()
        shape_id = self.sequence_shape_dict_network[sequence]
        # Get the bearings associated with this sequence
        bearings = [
            self.bearings_dict[shape_id][i:i+self.max_stops_per_route] for i in range(
                0, len(sequence), self.max_stops_per_route-1
                )
            ]
        if len(bearings[-1]) == 1:
            bearings.pop()

        # Insert the stops in each chunk
        # Use a separate RouteName for each chunk so as to calculate several routes, none of which have too many stops.
        # We will stitch together the resulting polylines later.
        with self.route.insertCursor(
                arcpy.nax.RouteInputDataType.Stops, ["SHAPE@", "Name", "RouteName", "Bearing", "BearingTol"]) as cur:
            for seq_idx, seq in enumerate(sequences):
                for idx, stop_id in enumerate(seq):
                    stop_shp = self._get_stop_geometry(stop_id)
                    cur.insertRow([stop_shp, stop_id, seq_idx, bearings[seq_idx][idx], self.bearing_tolerance])

    def _write_routes_direct_to_output(self):
        """Write the route results directly to the output file assuming no need for post-processing."""
        transformation = spatial_reference_helper.get_datum_transformation(
            self.route_result.spatialReference,
            self.output_spatial_ref_shapes,
            self.route_result.extent(arcpy.nax.RouteOutputDataType.Routes)
        )
        routes_in_results = []  # Store the RouteNames that made it into the output. These solved successfully.
        with arcpy.da.InsertCursor(  # pylint: disable=no-member
            self.out_shape_lines, ["shape_id", "SHAPE@"], datum_transformation=transformation
        ) as cur:
            for row in self.route_result.searchCursor(arcpy.nax.RouteOutputDataType.Routes, ["Name", "SHAPE@"]):
                routes_in_results.append(row[0])
                cur.insertRow(row)
        return routes_in_results

    @staticmethod
    def _identify_failed_routes(in_routes, out_routes):
        """Identify which routes failed to solve by comparing input RouteNames with those in the output."""
        # Each shape_id was solved as a separate route using a separate RouteName in the route solver. If any are
        # missing from the list of route Names in the route result output, then these routes failed.
        return [route for route in in_routes if str(route) not in out_routes]

    def _stitch_together_polylines_and_write_to_output(self, shape_id):
        """Stitch together multiple polylines into one final polyline and write it to the output file.

        This is used to handle cases where the stop sequence exceeds the self.max_stops_per_route and
        the sequence is chunked up and solved as multiple routes.
        """
        transformation = spatial_reference_helper.get_datum_transformation(
            self.route_result.spatialReference,
            self.output_spatial_ref_shapes,
            self.route_result.extent(arcpy.nax.RouteOutputDataType.Routes)
        )
        array_of_vertices = arcpy.Array()
        for row in self.route_result.searchCursor(arcpy.nax.RouteOutputDataType.Routes, ["SHAPE@"]):
            polyline = row[0]
            if not polyline:
                # Handles weird cases when the route goes nowhere. This should only happen with bad data.
                continue
            # getPart() retrieves an array of arrays of points representing the vertices of the polyline.
            # Loop through each part (unclear why these polylines even have multiple parts) and put all the
            # vertices into one big array.
            for part in polyline.getPart():
                array_of_vertices.extend(part)
        # Construct one big polyline from the list of all the vertices in the component polylines.
        final_polyline = arcpy.Polyline(array_of_vertices, polyline.spatialReference)
        # Write to output.
        with arcpy.da.InsertCursor(  # pylint: disable=no-member
            self.out_shape_lines, ["shape_id", "SHAPE@"], datum_transformation=transformation
        ) as cur:
            cur.insertRow([shape_id, final_polyline])

    def _generate_network_shapes(self):
        """Generate polyline shapes by calculating routes along a road network."""
        # If there is nothing in the dictionary of shapes that should be calculated on a network, there is nothing to do
        # here, so just return.
        if not self.sequence_shape_dict_network:
            return

        # Calculate bearings estimates for all stop sequences
        self._populate_bearings_dict()

        # Chunk up stops into chunks that don't exceed service limits
        self._chunk_stops()

        # For each chunk, solve routes and write the results to the output file
        failed_shape_ids = []
        for chunk_idx in range(0, len(self.chunks)):
            # Calculating shapes along the road network, chunk %1 of %2
            msg = arcpy.GetIDMessage(86501) % (str(chunk_idx + 1), str(len(self.chunks)))
            arcpy.AddMessage(msg)
            # Initialize the route with settings
            self._initialize_route()
            # Insert stops
            input_route_names = self._insert_stops_from_chunk(chunk_idx)
            # Solve the route
            self.route_result = self.route.solve()
            # Uncomment to save route layer data for debugging
            # out_lyr = os.path.join(os.path.dirname(self.out_gtfs_trips), f"Route_{chunk_idx}.lyr")
            # self.route_result.saveAsLayerFile(out_lyr)
            # If the route solve completely failed, put all the shapes into the queue for straight lines.
            if not self.route_result.solveSucceeded:
                # Uncomment for debugging
                # for msg in self.route_result.solverMessages(arcpy.nax.MessageSeverity.Error):
                #     arcpy.AddWarning(msg)
                failed_shape_ids += input_route_names
                for sequence in self.chunks[chunk_idx]:
                    shape_id = self.sequence_shape_dict_network[sequence]
                    self.sequence_shape_dict_straight[sequence] = shape_id
                continue

            # Uncomment to report solver warnings for debugging purposes
            # for msg in self.route_result.solverMessages(arcpy.nax.MessageSeverity.Warning):
            #     arcpy.AddWarning(msg)
            # Write route lines to output and also grab route names / shape_ids that were written
            output_route_names = self._write_routes_direct_to_output()
            # Determine if any individual routes / shape_ids failed to generate on the network
            failed_routes = self._identify_failed_routes(input_route_names, output_route_names)
            # If there were failures, fall back to generating straight lines for those shape_ids
            if failed_routes:
                for sequence in self.chunks[chunk_idx]:
                    shape_id = self.sequence_shape_dict_network[sequence]
                    if shape_id in failed_routes:
                        failed_shape_ids.append(shape_id)
                        self.sequence_shape_dict_straight[sequence] = shape_id

        # Special handling for stop sequences that exceed self.max_stops_per_route
        # For each of these, run a separate route analysis, chunking up the stops
        # into acceptable lengths, then stitch together the resulting route polylines
        # into one big line, and write the final line to the output file.
        for sequence in self.lengthy_sequences:
            self._initialize_route()
            self._insert_stops_in_lengthy_sequence(sequence)
            self.route_result = self.route.solve()
            shape_id = self.sequence_shape_dict_network[sequence]
            # Uncomment to save route layer data for debugging
            # out_lyr = os.path.join(os.path.dirname(self.out_gtfs_trips), f"Route_Lengthy_{shape_id}.lyr")
            # self.route_result.saveAsLayerFile(out_lyr)
            # Handle failed solves. Put this shape_id in the queue for straight-line shapes
            if not self.route_result.solveSucceeded:
                failed_shape_ids.append(shape_id)
                self.sequence_shape_dict_straight[sequence] = shape_id
                # Uncomment to report solver errors for debugging
                # for msg in self.route_result.solverMessages(arcpy.nax.MessageSeverity.Error):
                #     arcpy.AddWarning(msg)
                continue
            self._stitch_together_polylines_and_write_to_output(shape_id)

        # Add a warning if generating a route for any shapes failed.
        if failed_shape_ids:
            # Calculating shapes along the network failed for %s shape_ids. Straight-line shape features will be
            # generated for the affected shape_ids: %s
            num_network_shapes = len(self.sequence_shape_dict_network)
            num_failed = len(failed_shape_ids)
            failed_ratio = str(num_failed) + "/" + str(num_network_shapes)  # Example: 5/150
            arcpy.AddIDMessage("WARNING", 3119, failed_ratio, str(failed_shape_ids))


# Validation flags to prevent redoing slow validation checks if the parameter hasn't changed. Because of limitations of
# the ToolValidator class framework, these must be global variables stored outside the class, even though this isn't the
# best coding practice.
VFLAG_SERVICE_MISSING_SOLVER_ERROR = False


class ToolValidator:
    """Base class for the tool validation logic used by every python tool.

    The class does not provide implementation for any methods. The sub class is responsible for proving the
    implementation of methods as desrised by the validation logic specific to the tool.
    """

    def __init__(self):
        """Set arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.param_gtfs_folder = self.params[0]
        self.param_network_modes = self.params[4]
        self.param_network_data_source = self.params[5]
        self.param_travel_mode = self.params[6]
        self.param_drive_side = self.params[7]
        self.param_bearing_tolerance = self.params[8]
        self.param_max_bearing_angle = self.params[9]

    def initializeParameters(self):  # pylint: disable=invalid-name
        """Refine the properties of a tool's parameters. This method is called when the tool is opened."""
        # Set output geometry type
        self.params[1].schema.geometryTypeRule = "AsSpecified"
        self.params[1].schema.geometryType = "Polyline"
        self.params[2].schema.geometryTypeRule = "AsSpecified"
        self.params[2].schema.geometryType = "Point"

        # Set output schema
        shape_id_field = arcpy.Field()
        shape_id_field.name = "shape_id"
        shape_id_field.type = "Integer"
        sequence_field = arcpy.Field()
        sequence_field.name = "sequence"
        sequence_field.type = "Integer"
        # Shapes - complete schema
        self.params[1].schema.additionalFields = [shape_id_field]
        # Stops - schema does not include fields derived from input text file
        self.params[2].schema.additionalFields = [shape_id_field, sequence_field]

    def updateParameters(self):  # pylint: disable=invalid-name
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        """
        # Disable network-related parameters if no network_modes are selected
        network_params = [
            self.param_network_data_source,
            self.param_travel_mode,
            self.param_drive_side,
            self.param_bearing_tolerance,
            self.param_max_bearing_angle
            ]
        if not self.param_network_modes.valueAsText:
            for param in network_params:
                param.enabled = False
        else:
            for param in network_params:
                param.enabled = True

    def updateMessages(self):  # pylint: disable=invalid-name
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        """
        # Add error to the append parameter if the target_feature_dataset doesn't have the data model tables in it.
        # Skip check if the parameters is derived (from Model Builder output)
        if not self.param_gtfs_folder.isInputValueDerived() and self.param_gtfs_folder.altered and \
                self.param_gtfs_folder.valueAsText:
            in_gtfs_folder = self.param_gtfs_folder.valueAsText
            if not do_required_gtfs_files_exist(in_gtfs_folder):
                # Input GTFS folder %s is missing required GTFS files. The required GTFS files are: stops.txt,
                # routes.txt, trips.txt, and stop_times.txt.
                self.param_gtfs_folder.setIDMessage("Error", 3116, in_gtfs_folder)

        # Make the travel mode and network data source parameters required when at least one network mode is selected.
        # The 735 error code doesn't display an actual error but displays the little red star to indicate that the
        # parameter is required.
        if self.param_network_modes.valueAsText:
            if not self.param_network_data_source.valueAsText:
                self.param_network_data_source.setIDMessage("Error", 735, self.param_network_data_source.displayName)
            if not self.param_travel_mode.valueAsText:
                self.param_travel_mode.setIDMessage("Error", 735, self.param_travel_mode.displayName)
        else:
            self.param_network_data_source.clearMessage()
            self.param_travel_mode.clearMessage()

        # Ensure that if the network data source is a service, the Route solver is supported.
        # It is possible for a portal to be configured with only some solvers available.
        if self.param_network_data_source.enabled:
            global VFLAG_SERVICE_MISSING_SOLVER_ERROR
            network = self.param_network_data_source.valueAsText
            service_type = "asyncRoute"
            if self.param_network_data_source.hasBeenValidated:
                # The parameter has already been validated and has not been changed by the user since the last
                # validation check. Skip slow checks by just reapplying the existing validation error if relevant.
                if VFLAG_SERVICE_MISSING_SOLVER_ERROR:
                    self.set_missing_solver_error(network)
            else:
                # The parameter has changed since the last validation check. Perform check
                VFLAG_SERVICE_MISSING_SOLVER_ERROR = False
                # Only check it if it's a service and not arcgis.com. We know AGOL will always have all services.
                if network and network.startswith("http") and "www.arcgis.com" not in network:
                    try:
                        # Ensure that "helperServices" has the "asyncRoute" key. If it doesn't, the Route solver is not
                        # supported by the service, and we can't use this portal.
                        service_info = arcpy.GetPortalDescription(network)["helperServices"][service_type]
                        if not service_info:
                            self.set_missing_solver_error(network)
                    except KeyError:
                        self.set_missing_solver_error(network)

    def set_missing_solver_error(self, network):
        """Add an error flag to the network data soure parameter indicating that the required solver is missing."""
        # Friendly translated name of the async service for injection into message 30180
        service_name = arcpy.GetIDMessage(30336)
        # Portal "%1" is not configured with the "%2" web tool.
        self.param_network_data_source.setIDMessage("Error", 30180, network, service_name)
        global VFLAG_SERVICE_MISSING_SOLVER_ERROR
        VFLAG_SERVICE_MISSING_SOLVER_ERROR = True
