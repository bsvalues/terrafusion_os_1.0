"""Provides validation and execution logic for the GTFS Stops To Features tool."""

import os
import arcpy
import gtfs_utils
from spatial_reference_helper import determine_output_spatial_ref


class GTFSStopsToFeatures(gtfs_utils.Tool):  # pylint:disable=too-few-public-methods
    """Converts a GTFS stops.txt file to a feature class."""

    def __init__(self, in_gtfs_stops_file, out_feature_class):
        """Store tool parameter values as instance names.

        Args:
            in_gtfs_stops_file: The input GTFS stops.txt file.
            out_feature_class: The output feature class location.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.in_gtfs_stops_file = in_gtfs_stops_file
        gtfs_dir = os.path.dirname(self.in_gtfs_stops_file)
        self.in_gtfs_stop_times_file = os.path.join(gtfs_dir, "stop_times.txt")
        self.in_gtfs_trips_file = os.path.join(gtfs_dir, "trips.txt")
        self.in_gtfs_routes_file = os.path.join(gtfs_dir, "routes.txt")

        self.out_feature_class = out_feature_class
        self.output_spatial_ref = determine_output_spatial_ref(
            os.path.dirname(self.out_feature_class),
            gtfs_utils.WGS_COORDS
        )
        self.is_shapefile = self._is_output_shapefile(self.out_feature_class)
        self.required_tool_fields = {
            "stops.txt": ("stop_lat", "stop_lon",),
            "routes.txt": ("route_id", "route_type",),
            "trips.txt": ("trip_id", "route_id",),
            "stop_times.txt": ("stop_id", "trip_id",)
            }

        self.stops_table = None
        self.stop_times_table = None
        self.trips_table = None
        self.routes_table = None

    def _can_populate_route_id(self):
        """Check if sufficient data is available to populate stops with associated route_ids.

        Add warnings if it's not possible.
        Args:
            No arguments.
        Returns:
            True: It is possible to populate route info
            False: It is not possible to populate route info
        Raises:
            No exceptions.
        """
        # If the input stops.txt file didn't have a stop_id field, we can't do any joins
        if "stop_id" not in self.stops_table.fields:
            # Unable to populate route info for stops.
            arcpy.AddIDMessage("WARNING", 240030)
            # The stops.txt file is missing the stop_id field.
            arcpy.AddIDMessage("WARNING", 240032)
            return False

        # Both stop_times.txt and trips.txt must exist.
        if not os.path.exists(self.in_gtfs_trips_file) or not os.path.exists(self.in_gtfs_stop_times_file):
            # Unable to populate route info for stops.
            arcpy.AddIDMessage("WARNING", 240030)
            # The stop_times.txt or trips.txt file does not exist in the same folder as the input stops.txt file.
            arcpy.AddIDMessage("WARNING", 240033)
            return False

        # stop_times.txt and trips.txt must have some minimal fields in order to relate stops to routes
        self.trips_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_trips_file, "trips.txt")
        try:
            self.trips_table.validate_required_tool_fields(self.required_tool_fields["trips.txt"])
        except gtfs_utils.Error as err:
            # Unable to populate route info for stops.
            arcpy.AddIDMessage("WARNING", 240030)
            arcpy.AddIDMessage("WARNING", err.message_id, err.add_arg1, err.add_arg2)
            return False

        self.stop_times_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_stop_times_file, "stop_times.txt")
        try:
            self.stop_times_table.validate_required_tool_fields(self.required_tool_fields["stop_times.txt"])
        except gtfs_utils.Error as err:
            # Unable to populate route info for stops.
            arcpy.AddIDMessage("WARNING", 240030)
            arcpy.AddIDMessage("WARNING", err.message_id, err.add_arg1, err.add_arg2)
            return False

        # If we met all those criteria, we can populate route_id for stops.
        return True

    def _can_populate_route_type(self):
        """Check if sufficient data is available to populate stops with associated route_types.

        Add warnings if it's not possible.
        Args:
            No arguments.
        Returns:
            True: It is possible to populate route attributes
            False: It is not possible to populate route attributes
        Raises:
            No exceptions.
        """
        # routes.txt must exist.
        if not os.path.exists(self.in_gtfs_routes_file):
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 240031)
            # The routes.txt file does not exist in the same folder as the input stops.txt file.
            arcpy.AddIDMessage("WARNING", 240034)
            return False

        # routes.txt must have some minimal fields in order to relate stops to routes
        self.routes_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_routes_file, "routes.txt")
        try:
            self.routes_table.validate_required_tool_fields(self.required_tool_fields["routes.txt"])
        except gtfs_utils.Error as err:
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 240031)
            arcpy.AddIDMessage("WARNING", err.message_id, err.add_arg1, err.add_arg2)
            return False

        # If we met all those criteria, we can populate route data.
        return True

    def _make_route_data_table_for_stops(self):
        """Construct a dataframe relating route_ids to stop_ids."""
        # Read stop_times into a dataframe
        self.stop_times_table.gtfs_to_df(["stop_id", "trip_id"])
        # Read trips into a dataframe and join route_id to data table
        self.trips_table.gtfs_to_df(["trip_id", "route_id"])
        self.trips_table.index_df("trip_id")
        self.stop_times_table.data_frame = self.stop_times_table.data_frame.join(
            self.trips_table.data_frame, "trip_id")
        del self.trips_table
        self.stop_times_table.data_frame.drop(["trip_id"], axis="columns", inplace=True)
        # Results in a dataframe with only unique combinations of stop_id and route_id
        self.stop_times_table.drop_duplicates()

    def _get_route_type_for_stops(self):
        """Construct an aggregated dataframe of route_type values for stops using the routes.txt file."""
        # Read routes into a dataframe and join route_type to data table
        self.routes_table.gtfs_to_df(["route_id", "route_type"])
        self.routes_table.index_df("route_id")
        self.stop_times_table.data_frame = self.stop_times_table.data_frame.join(
            self.routes_table.data_frame, "route_id")
        del self.routes_table
        self.stop_times_table.data_frame.drop(columns=["route_id"], inplace=True)
        # Collapse multiple route_ids and route_types into strings of comma separated values
        route_type_df = self._aggregate_route_data("route_type")
        return route_type_df

    def _aggregate_route_data(self, field):
        """Collapse multiple rows with the same stop_id into a single row per stop_id with a list of values."""
        df = self.stop_times_table.data_frame.copy(deep=True)
        # Drop any duplicates in the dataframe to eliminate unnecessary data
        df.drop_duplicates(inplace=True)
        # Drop any rows with null values
        df.dropna(inplace=True)
        # Collapse into a single row per stop_id with a sorted list of unique values for the field for that stop.
        # The resulting dataframe is automatically indexed by stop_id for easy joining later.
        return df.groupby("stop_id")[field].apply(lambda x: sorted(list(set(x))))

    def execute(self):
        """Tool Execution logic."""
        # Initialize GTFS stops
        self.stops_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_stops_file, "stops.txt")

        # Ensure all required fields are present
        self.stops_table.validate_required_tool_fields(self.required_tool_fields["stops.txt"])

        # Read stops into pandas dataframe
        self.stops_table.gtfs_to_df(self.stops_table.fields)
        # Make sure stops table is not empty
        self.stops_table.validate_df_not_empty()
        # Remove unsupported location_types that don't have stop_lat or stop_lon values
        self.stops_table.remove_stops_with_conditionally_required_geometry()
        # Validate lat/lon values
        self.stops_table.validate_lat_lon_values()

        # Populate route_id and route_type fields if possible
        if self._can_populate_route_id():
            route_attribute_fields = ["route_id"]
            self._make_route_data_table_for_stops()
            route_id_df = self._aggregate_route_data("route_id")
            self.stops_table.data_frame = self.stops_table.data_frame.join(route_id_df, "stop_id")
            del route_id_df
            if self._can_populate_route_type():
                route_attribute_fields.append("route_type")
                route_type_df = self._get_route_type_for_stops()
                self.stops_table.data_frame = self.stops_table.data_frame.join(route_type_df, "stop_id")
                del route_type_df
            # Convert route attribute fields to JSON in a single field, route_info
            # Example: {"route_id": ["route_1", "route_2", "route_3"], "route_type": ["0", "2", "3"]}
            self.stops_table.data_frame["route_info"] = self.stops_table.data_frame[route_attribute_fields].apply(
                lambda x: x.to_json(), axis="columns")
            # Drop individual route attribute columns
            self.stops_table.data_frame.drop(columns=route_attribute_fields, inplace=True)

        # Shapefiles cannot have null values, so fill them with empty strings
        if self.is_shapefile:
            self.stops_table.fill_na()

        # Create and populate the output feature class with the data from the stops.txt file
        self.stops_table.gtfs_df_to_table(self.out_feature_class, self.output_spatial_ref, self.is_shapefile)


class ToolValidator(gtfs_utils.ToolValidator):
    """Tool validation logic."""

    def initializeParameters(self):  # pylint: disable=invalid-name
        """Refine the properties of a tool's parameters. This method is called when the tool is opened."""
        self.params[1].schema.geometryTypeRule = "AsSpecified"
        self.params[1].schema.geometryType = "Point"
