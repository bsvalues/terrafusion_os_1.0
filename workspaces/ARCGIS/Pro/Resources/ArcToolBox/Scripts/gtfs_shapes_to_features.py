"""Provides validation and execution logic for the GTFS Shapes To Features tool."""

import os
import uuid
import pandas
import arcpy
import gtfs_utils
import spatial_reference_helper


class GTFSShapesToFeatures(gtfs_utils.Tool):  # pylint:disable=too-few-public-methods,too-many-instance-attributes
    """Converts a GTFS shapes.txt file to a feature class."""

    def __init__(self, in_gtfs_shapes_file, out_feature_class):
        """Store tool parameter values as instance names.

        Args:
            in_gtfs_shapes_file: The input GTFS shapes.txt file.
            out_feature_class: The output feature class location.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.in_gtfs_shapes_file = in_gtfs_shapes_file
        gtfs_dir = os.path.dirname(self.in_gtfs_shapes_file)
        self.in_gtfs_trips_file = os.path.join(gtfs_dir, "trips.txt")
        self.in_gtfs_routes_file = os.path.join(gtfs_dir, "routes.txt")

        self.out_feature_class = out_feature_class
        self.output_spatial_ref = spatial_reference_helper.determine_output_spatial_ref(
            os.path.dirname(self.out_feature_class), gtfs_utils.WGS_COORDS
        )
        self.transformation = None
        self.is_shapefile = self._is_output_shapefile(self.out_feature_class)
        self.populate_route_data = None
        self.output_field_names = None

        self.required_tool_fields = {
            "shapes.txt": ("shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence",),
            "routes.txt": ("route_id",),
            "trips.txt": ("shape_id", "route_id",)
            }

        self.shapes_table = None
        self.trips_table = None
        self.routes_table = None

    def _can_populate_route_data(self):
        """Check if sufficient data is available to populate shapes with helpful route attributes.

        Add warnings if it's not possible.
        Args:
            No arguments.
        Returns:
            True: It is possible to populate route attributes
            False: It is not possible to populate route attributes
        Raises:
            No exceptions.

        """
        # Both trips.txt and routes.txt must exist.
        if not os.path.exists(self.in_gtfs_trips_file) or not os.path.exists(self.in_gtfs_routes_file):
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 2614)
            # The trips.txt or routes.txt file does not exist in the same folder as the input shapes.txt file.
            arcpy.AddIDMessage("WARNING", 2615)
            return False

        # trips.txt and routes.txt must have some minimal fields in order to relate shapes to routes
        self.trips_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_trips_file, "trips.txt")
        try:
            self.trips_table.validate_required_tool_fields(self.required_tool_fields["trips.txt"])
        except gtfs_utils.Error as err:
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 2614)
            arcpy.AddIDMessage("WARNING", err.message_id, err.add_arg1, err.add_arg2)
            return False

        self.routes_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_routes_file, "routes.txt")
        try:
            self.routes_table.validate_required_tool_fields(self.required_tool_fields["routes.txt"])
        except gtfs_utils.Error as err:
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 2614)
            arcpy.AddIDMessage("WARNING", err.message_id, err.add_arg1, err.add_arg2)
            return False

        # If we met all those criteria, we can populate route data.
        return True

    def _populate_and_check_routes_table(self):
        """Read in the routes.txt file and do some validation."""
        # Read in routes.txt file
        try:
            self.routes_table.gtfs_to_df(self.routes_table.fields)
            self.routes_table.validate_fields_not_null(["route_id"])
        except gtfs_utils.Error as err:
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 2614)
            arcpy.AddIDMessage("WARNING", err.message_id, err.add_arg1, err.add_arg2)
            self.populate_route_data = False
            return
        except Exception:  # Don't care why it fails. pylint:disable=broad-except
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 2614)
            self.populate_route_data = False
            return

        if self.is_shapefile:
            # Shapefiles cannot have null values, so fill them with empty strings
            self.routes_table.fill_na()
        self.routes_table.index_df("route_id")
        # Add a route_type_text field so the route type is easier to read by a human
        self.routes_table.populate_route_type_text(self.is_shapefile)

    def _populate_and_check_trips_table(self):
        """Read in the trips.txt file and do some validation."""
        # Read in trips.txt file
        try:
            self.trips_table.gtfs_to_df(self.required_tool_fields["trips.txt"])
            self.trips_table.validate_fields_not_null(["route_id"])
        except gtfs_utils.Error as err:
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 2614)
            arcpy.AddIDMessage("WARNING", err.message_id, err.add_arg1, err.add_arg2)
            self.populate_route_data = False
            return
        except Exception:  # Don't care why it fails. pylint:disable=broad-except
            # Unable to populate route attributes for shapes.
            arcpy.AddIDMessage("WARNING", 2614)
            self.populate_route_data = False
            return

        # Gives us a one-to-one relationship between trips and shapes
        self.trips_table.drop_duplicates()
        # Index for fast look-ups
        self.trips_table.index_df("shape_id")

    def _make_line_from_shape(self, shape_id):
        """Make a polyline object by connecting the lat/lon points for a given shape_id.

        Args:
            shape_id: GTFS shape_id to pull from the table and convert to a polyline
        Returns:
            arcpy polyline object for this shape_id
        Raises:
            No exceptions.
        """
        # Fetch the shape points for this shape_id, in order.
        this_shape_df = self.shapes_table.data_frame.get_group(shape_id).sort_values(by="shape_pt_sequence")

        # Create the polyline feature from the sequence of points
        lats = this_shape_df[self.shapes_table.lat_field].tolist()
        lons = this_shape_df[self.shapes_table.lon_field].tolist()
        array = arcpy.Array()
        for idx, lat in enumerate(lats):
            point = arcpy.Point()
            point.X = float(lons[idx])
            point.Y = float(lat)
            array.add(point)
        polyline = arcpy.Polyline(array, gtfs_utils.WGS_COORDS)

        return polyline

    def _get_route_data_for_shape(self, shape_id):
        """Retrieve helpful route fields for this shape.

        Args:
            shape_id: GTFS shape_id to retrieve route data for
        Returns:
            list of tuples of route attributes associated with this shape_id
        Raises:
            No exceptions.
        """
        # Get the route_ids that have this shape.
        route_ids = []
        try:
            route_ids = self.trips_table.data_frame.loc[shape_id]["route_id"]
            if isinstance(route_ids, pandas.core.series.Series):
                # If more than one route uses the same shape_id, pandas returns a series
                route_ids = route_ids.tolist()
            else:
                # Otherwise (more likely) it returns a single string value of the route_id
                route_ids = [route_ids]
        except KeyError:
            # No trips actually use this shape
            pass

        # Retrieve the data rows for these route_ids.
        route_data = []
        for route_id in route_ids:
            # tuple of (route_id, <other route table properties in table order>)
            route_data.append((route_id,) + tuple(self.routes_table.data_frame.loc[route_id].values))
        return route_data

    def _add_shapes_to_output_table(self):
        """Create the GTFS shapes polylines, populate route attributes, and add them to output feature class."""
        unused_shapes = []
        # Define a value to fill the fields with if route data cannot be found for a particular shape
        if self.is_shapefile:
            # Shapefiles cannot have null values, so use empty strings
            empty_value_filler = ""
        else:
            empty_value_filler = None
        # Group the shapes table by shape_id
        self.shapes_table.group_df("shape_id")
        # Make sure we get the field order correct
        fields = ["shape_id", "Shape@"]
        if self.populate_route_data:
            fields += ["route_id"] + [f for f in self.output_field_names if f not in ["shape_id", "route_id"]]
        with arcpy.da.InsertCursor(  # pylint: disable=no-member
                self.out_feature_class, fields, datum_transformation=self.transformation) as cur:
            for shape in self.shapes_table.data_frame["shape_id"].unique():  # pylint: disable=too-many-nested-blocks
                shape_id = shape[0]
                # Construct the shape polyline geometry object
                shape_polyline = self._make_line_from_shape(shape_id)

                # Gather route attributes if possible
                if self.populate_route_data:
                    route_data = self._get_route_data_for_shape(shape_id)
                    if not route_data:
                        # We could not find any route data for this shape_id, which means our shapes.txt file contains
                        # unused shapes (no trips follow this shape). We will throw a warning later.
                        unused_shapes.append(shape_id)
                        # Add the polyline anyway. Populate the route fields with empty strings
                        empty_tuple = tuple(empty_value_filler for i in range(len(self.routes_table.fields)))
                        cur.insertRow((shape_id, shape_polyline,) + empty_tuple)
                    else:
                        # This is the normal case. We found one or more routes that use this shape_id.
                        for route in route_data:
                            row_to_insert = []
                            for item in route:
                                try:
                                    # Truncate text fields if they're too long
                                    row_to_insert.append(item[:gtfs_utils.TEXT_FIELD_LENGTH])
                                except Exception:  # Don't care why it fails. pylint:disable=broad-except
                                    row_to_insert.append(item)
                            cur.insertRow([shape_id, shape_polyline] + row_to_insert)
                else:
                    # This is for when we were not even trying to populate route data
                    cur.insertRow((shape_id, shape_polyline,))

        if unused_shapes:
            # One or more of the shapes in the GTFS shapes.txt file are not used by any trips in the trips.txt file.
            # These shapes will be included in the tool output, but route attributes will not be populated, and your
            # shapes.txt data might be incorrect. Unused shape_ids: %1
            arcpy.AddIDMessage("WARNING", 2609, ", ".join(unused_shapes))

    def set_symbology(self, param):
        """Explicitly set the symbology of the output layer depending on which fields are available."""
        lyr_loc = os.path.join(arcpy.GetInstallInfo()['InstallDir'], "Resources", "ArcToolBox", "Templates", "Layers")
        if gtfs_utils.GTFS_FIELDS["routes.txt"]["route_color"].name in self.output_field_names:
            # For ordinary feature class output.
            # When the route_color field is present, use it to define line color
            param.symbology = os.path.join(lyr_loc, "GTFSShapesToFeatures.lyrx")
        elif gtfs_utils.GTFS_FIELDS["routes.txt"]["route_color"].shapefile_name in self.output_field_names:
            # For shapefile output.
            # When the shapefile-truncated route_color field is present, use it to define line color
            param.symbology = os.path.join(lyr_loc, "GTFSShapesToFeatures_shp.lyrx")
        else:
            # When the route info fields could not be populated, no color information is available, so just use an
            # ordinary symbology layer that sets the output to gray.
            param.symbology = os.path.join(lyr_loc, "GTFSShapesToFeatures_noRouteData.lyrx")

    def execute(self):
        """Tool Execution logic."""
        # Construct shapes table and make sure required fields are present
        self.shapes_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_shapes_file, "shapes.txt")
        self.shapes_table.validate_required_tool_fields(self.required_tool_fields["shapes.txt"])
        # Read shapes into a pandas dataframe
        self.shapes_table.gtfs_to_df(self.required_tool_fields["shapes.txt"])
        # Make sure the shapes table is not empty
        self.shapes_table.validate_df_not_empty()
        # Make sure the lat/lon values are valid
        self.shapes_table.validate_lat_lon_values()
        # These fields cannot have null values. Lat/lon can't either but were already checked.
        self.shapes_table.validate_fields_not_null(["shape_id", "shape_pt_sequence"])
        # Calculate correct datum transformation
        extent = self.shapes_table.make_extent_from_lat_lon_values()
        self.transformation = spatial_reference_helper.get_datum_transformation(
            gtfs_utils.WGS_COORDS, self.output_spatial_ref, extent
        )

        # Check if sufficient data is available to populate shapes with helpful route attributes
        self.populate_route_data = self._can_populate_route_data()

        # If we are going to populate route attributes, grab the data and do some clean-up
        if self.populate_route_data:
            self._populate_and_check_routes_table()
        if self.populate_route_data:  # Check again because routes table check could have set it to false.
            self._populate_and_check_trips_table()

        # Initialize the output feature class
        workspace = os.path.dirname(self.out_feature_class)
        fields = [self.shapes_table.make_table_field("shape_id", self.is_shapefile, workspace)]
        if self.populate_route_data:
            fields += self.routes_table.make_table_fields_list(self.is_shapefile, workspace)
        self.output_field_names = [f[0] for f in fields]
        gtfs_utils.make_output_table(self.out_feature_class, fields, self.output_spatial_ref, "POLYLINE")

        # Add the shapes to the feature class
        self._add_shapes_to_output_table()


class ToolValidator(gtfs_utils.ToolValidator):
    """Validation code for GTFS Stops To Features tool."""

    def initializeParameters(self):  # pylint: disable=invalid-name
        """Refine the properties of a tool's parameters. This method is called when the tool is opened."""
        self.params[1].schema.geometryTypeRule = "AsSpecified"
        self.params[1].schema.geometryType = "Polyline"
