"""Provides validation and execution logic for the Features To GTFS Shapes tool."""

import csv
import random
from operator import itemgetter
import arcpy
import gtfs_utils
import spatial_reference_helper


class FeaturesToGTFSShapes(gtfs_utils.Tool):
    """Generates a new shapes.txt file and adds shape_dist_traveled to stop_times.txt based on map features."""

    # pylint:disable=too-few-public-methods, too-many-instance-attributes

    def __init__(self, in_shape_lines, in_shape_stops, in_gtfs_trips,  # pylint:disable=too-many-arguments
                 in_gtfs_stop_times, out_gtfs_shapes, out_gtfs_stop_times, distance_units="Miles"):
        """Store tool parameter values as instance names.

        Args:
            in_shape_lines: Line feature class representing the GTFS shapes. The feature class need only have line
                geometry and a shape_id field. Ideally this feature class was created using the Generate Shapes Features
                From GTFS tool, and the shape geometry was reviewed and edited by the user.
            in_shape_stops: Point feature class representing GTFS stops with one copy of each stop per shape that the
                stop participates in. The feature class must have point geometry and a stop_id and shape_id field.
                Ideally this feature class was created using the Generate Shapes Features From GTFS tool and not edited
                by the user.
            in_gtfs_trips: A GTFS trips.txt file that includes the correctly-populated shape_id column matching the
                shape_id values in in_shape_lines and in_shape_stops. Ideally this file is the trips.txt file that was
                updated when the user ran the Generate Shapes Features From GTFS tool.
            in_gtfs_stop_times: The original stop_times.txt file from the GTFS dataset that was used when running the
                Generate Shapes Features From GTFS tool.
            out_gtfs_shapes: The new GTFS shapes.txt file that will be created based on the in_shape_lines.
            out_gtfs_stop_times: The new GTFS stop_times.txt file that will be created. This will be a copy of the
                in_gtfs_stop_times file with the shape_dist_traveled field correctly populated.
            distance_units: The distance units to use when populating the shape_dist_traveled field in the output GTFS
                files. Can be Meters, Kilometers, or Miles.

        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.in_shape_lines = in_shape_lines
        self.in_shape_stops = in_shape_stops
        self.in_gtfs_trips = in_gtfs_trips
        self.in_gtfs_stop_times = in_gtfs_stop_times

        self.out_gtfs_shapes = out_gtfs_shapes
        self.out_gtfs_stop_times = out_gtfs_stop_times

        self.distance_units = distance_units.upper()

        self.trips_table = None
        self.stop_times_table = None
        self.shape_id_field_type = None
        self.stop_shape_ids = None

        self.required_tool_fields = {
            "stop_times.txt": ("trip_id", "stop_id", "stop_sequence",),
            "trips.txt": ("trip_id", "shape_id",)
            }

        self.num_shapes = None
        self.final_stoptimes_tabledata = {}  # {shape_id: {stop_id: shape_dist_traveled}}

        # If the input shape lines and stops are not in WGS84, a transformation might be needed.
        spatial_ref_lines = spatial_reference_helper.determine_output_spatial_ref(
            self.in_shape_lines, gtfs_utils.WGS_COORDS
        )
        self.transformation_shape_lines = spatial_reference_helper.get_datum_transformation(
            spatial_ref_lines, gtfs_utils.WGS_COORDS, self.in_shape_lines
        )
        spatial_ref_stops = spatial_reference_helper.determine_output_spatial_ref(
            self.in_shape_stops, gtfs_utils.WGS_COORDS
        )
        self.transformation_shape_stops = spatial_reference_helper.get_datum_transformation(
            spatial_ref_stops, gtfs_utils.WGS_COORDS, self.in_shape_stops
        )

        self._set_random_seed()

    def execute(self):
        """Execute the tool."""
        # Check schema of input feature classes
        do_in_fcs_have_correct_schema(self.in_shape_lines, self.in_shape_stops)

        # Read and store input GTFS files and do validation
        self._initialize_gtfs()

        # Store some useful info for later
        self.shape_id_field_type = [f.type for f in arcpy.ListFields(self.in_shape_stops, "shape_id")][0]
        self.stop_shape_ids = self._get_stop_shape_ids()
        self.num_shapes = int(arcpy.GetCount_management(self.in_shape_lines).getOutput(0))

        # Create the shapes.txt file
        self._generate_shapes_file()

        # Create the updated stop_times.txt file
        self._write_stop_times_with_shape_dist_traveled()

    @staticmethod
    def _set_random_seed():
        """Set the random seed based on the environment variable or generate one from scratch."""
        # Grab a random seed we can use if there isn't one in the environment variable.
        seed = random.randrange(1000000000)
        # See if there is one in the current environment
        random_env = arcpy.env.randomGenerator  # pylint:disable=no-member
        if random_env:
            try:
                # Retrieve the seed portion of the randomGenerator environment variable
                env_seed = int(random_env.exportToString().split(" ")[0])
                if env_seed:
                    # Only set it if it's non-zero and valid
                    seed = env_seed
            except Exception:  # pylint:disable=broad-except
                pass
        # Set the seed, which is global to this module
        random.seed(seed)
        # Random Seed: {0}
        msg = arcpy.GetIDMessage(84821)
        arcpy.AddMessage(msg.format(str(seed)))

    def _initialize_gtfs(self):
        """Read in the input GTFS files, do some validation, and store them in a pandas dataframe."""
        # Set the progressor so the user is informed since this can take a while
        # Initializing input GTFS files...
        msg = arcpy.GetIDMessage(86502)
        arcpy.AddMessage(msg)
        arcpy.SetProgressor("default", msg)

        # Construct trips table and do validation and indexing
        self.trips_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_trips)
        self.trips_table.validate_required_tool_fields(self.required_tool_fields["trips.txt"])
        self.trips_table.gtfs_to_df(self.required_tool_fields["trips.txt"])
        # Make sure the trips table is not empty
        self.trips_table.validate_df_not_empty()
        # These fields cannot have null values.
        self.trips_table.validate_fields_not_null(("trip_id",))
        # Index by trip_id for fast lookups
        self.trips_table.index_df("trip_id")

        # Construct stop_times table and do validation
        self.stop_times_table = gtfs_utils.GTFSToFeaturesConverter(self.in_gtfs_stop_times)
        self.stop_times_table.validate_required_tool_fields(self.required_tool_fields["stop_times.txt"])
        # Read table into a pandas dataframe
        self.stop_times_table.gtfs_to_df(self.stop_times_table.fields)
        # Make sure the table is not empty
        self.stop_times_table.validate_df_not_empty()
        # These fields cannot have null values.
        self.stop_times_table.validate_fields_not_null(self.required_tool_fields["stop_times.txt"])

        arcpy.ResetProgressor()

    def _generate_shapes_file(self):
        """Create the new GTFS shapes.txt file from the input shape polylines."""
        # Set up a progressor so user can see progress
        # Generating output shapes.txt file...
        msg = arcpy.GetIDMessage(86503)
        # Goes from 0 to the number of shapes with an increment of 1
        arcpy.SetProgressor("step", msg, 0, self.num_shapes, 1)
        arcpy.AddMessage(msg)

        with open(self.out_gtfs_shapes, 'w', encoding="utf-8") as out_shapes:
            writer = csv.writer(out_shapes, lineterminator='\n')

            # Write the headers
            writer.writerow(["shape_id", "shape_pt_lat", "shape_pt_lon", "shape_pt_sequence", "shape_dist_traveled"])

            # Use a Search Cursor and explode to points to get shape polyline vertices
            # These will populate the shape_pt_lat and shape_pt_lon values.
            shape_pt_seq = 1
            shape_dist_traveled = 0
            current_shape_id = None
            previous_point = None
            count = 0
            for row in arcpy.da.SearchCursor(  # pylint:disable=no-member
                    self.in_shape_lines,
                    ["shape_id", "SHAPE@Y", "SHAPE@X"],
                    spatial_reference=gtfs_utils.WGS_COORDS,
                    datum_transformation=self.transformation_shape_lines,
                    explode_to_points=True
            ):
                count += 1
                arcpy.SetProgressorPosition(count)
                shape_id, shape_pt_lat, shape_pt_lon = row
                current_point = arcpy.Point(shape_pt_lon, shape_pt_lat)
                if shape_id != current_shape_id:
                    # Starting a new shape
                    current_shape_id = shape_id
                    shape_pt_seq = 1
                    shape_dist_traveled = 0
                else:
                    # Continuing the current shape
                    # Create a line segment between the previous vertex and this one to calculate geodesic length
                    line_segment = arcpy.Polyline(arcpy.Array([previous_point, current_point]), gtfs_utils.WGS_COORDS)
                    # Add the length of this segment to the shape_dist_traveled up to this point
                    shape_dist_traveled += line_segment.getLength("GEODESIC", self.distance_units)

                # Write row to shapes.txt file
                writer.writerow([shape_id, shape_pt_lat, shape_pt_lon, shape_pt_seq, shape_dist_traveled])

                # Increment counters
                shape_pt_seq += 1
                previous_point = current_point

        # Done with the progressor
        arcpy.ResetProgressor()

    def _get_stop_shape_ids(self):
        """Return a list of unique shape_id values in the input stops table."""
        return [str(r[0]) for r in arcpy.da.SearchCursor(  # pylint:disable=no-member
            self.in_shape_stops, "shape_id", sql_clause=("DISTINCT", None))]

    def _get_stop_info_for_shape(self, shape_id):
        """Return dictionaries of {sequence: stop_id} and {sequence: geometry object} for this shape."""
        # Check that the shape_id is even present in the input stops table, and if not, throw a warning
        if shape_id not in self.stop_shape_ids:
            # The input shape stops feature class has no stops with shape_id %s. The output GTFS shapes.txt file will
            # contain entries for this shape_id, but no corresponding entries in the output GTFS stop_times.txt file
            # will have updated shape_dist_traveled field information.
            arcpy.AddIDMessage("WARNING", 3120, str(shape_id))
            return {}, {}
        # Select stops relevant to this shape
        if self.shape_id_field_type in ["Integer", "SmallInteger"]:
            where = """"shape_id" = %s""" % shape_id
        else:
            # Assuming string
            where = """"shape_id" = '%s'""" % shape_id
        with arcpy.EnvManager(overwriteOutput=True):
            stops_layer = arcpy.management.MakeFeatureLayer(self.in_shape_stops, f"StopsLayer", where)
        # Populate dictionaries
        sequence_stopid_dict = {}  # {sequence: stop_id}
        sequence_geom_dict = {}  # {sequence: geometry object}
        for row in arcpy.da.SearchCursor(  # pylint:disable=no-member
            stops_layer,
            ["SHAPE@", "stop_id", "sequence"],
            spatial_reference=gtfs_utils.WGS_COORDS,
            datum_transformation=self.transformation_shape_stops
        ):
            sequence_stopid_dict[row[2]] = row[1]
            sequence_geom_dict[row[2]] = row[0]
        return sequence_stopid_dict, sequence_geom_dict

    # The linear referencing logic is quite complicated, and I couldn't figure out how to simplify it to satisfy pylint.
    def _calculate_stops_shape_dist_traveled(self):
        # pylint:disable=too-many-locals, too-many-branches, too-many-statements
        """Linear reference stops for each shape and populate a master dictionary with shape_dist_traveled.

        Throw a warning if the final shape_dist_traveled calculated for stops along a shape are out of order.
        """
        # Set up a progressor so user can see progress
        # Linear referencing stops against shape polylines...
        msg = arcpy.GetIDMessage(86504)
        # Goes from 0 to the number of shapes with an increment of 1
        arcpy.SetProgressor("step", msg, 0, self.num_shapes, 1)
        arcpy.AddMessage(msg)

        shapes_with_warnings = []  # Track shapes that don't linear reference in the right order

        # Loop through each shape
        count = 0
        for line in arcpy.da.SearchCursor(  # pylint:disable=no-member
            self.in_shape_lines,
            ["SHAPE@", "shape_id"],
            spatial_reference=gtfs_utils.WGS_COORDS,
            datum_transformation=self.transformation_shape_lines
        ):
            count += 1
            arcpy.SetProgressorPosition(count)
            polyline = line[0]
            shape_id = str(line[1])

            # Get info about stops relevant to this shape for quick look-ups
            sequence_stopid_dict, sequence_geom_dict = self._get_stop_info_for_shape(shape_id)

            if not polyline:
                # Degenerate case where shape polygon is None
                shape_dist_dict_item = {}  # {stop_id: shape_dist_traveled}
                for sequence_pt in sorted(sequence_stopid_dict.keys()):
                    stop_id = str(sequence_stopid_dict[sequence_pt])
                    # Set shape_dist_traveled for all stops in this sequence to 0
                    shape_dist_dict_item[stop_id] = 0
                # Preserve the final shape_dist_traveled info to the master dictionary
                self.final_stoptimes_tabledata[shape_id] = shape_dist_dict_item
                # The polyline representing shape_id %s has 0 length. This shape_id will not be included in the output
                # shapes.txt file, and the shape_dist_traveled value for all stops associated with this shape_id in the
                # output stop_times.txt file will be 0.
                arcpy.AddIDMessage("WARNING", 3124, shape_id)
                continue

            # Prepare variables for linear referencing
            sequence_keys = list(sequence_geom_dict.keys())  # Sequence numbers of stops that need to be linear ref'd
            total_pts = len(sequence_keys)
            lin_ref_dict = {}  # {sequence: dist along line}
            times_attempted = {pt: 0 for pt in sequence_keys}

            # In a random order, linear reference the stops along the line, and try again if they end up out of
            # sequence, until all have been addressed. When a point has been addressed, remove it from sequence_keys.
            # Linear reference the point along the line segment between the prior and next linear referenced points to
            # increase the likelihood of getting the stops in the right order.
            while sequence_keys:
                # Randomly choose one of the points in our remaining list that we still need to linear reference
                random_pt = random.choice(sequence_keys)

                # Make sure we haven't already tried this one a bajillion times
                if times_attempted[random_pt] > total_pts:
                    # This is to cut off infinite loops.  If we've already tried this point more times than once per
                    # item in the list, assume it's impossible to get the order correct and just give up.
                    # Hopefully one day I can come up with a better way to deal with this case.
                    lin_ref_dict[random_pt] = polyline.measureOnLine(
                        sequence_geom_dict[random_pt], use_percentage=False)
                    sequence_keys.remove(random_pt)
                    continue
                times_attempted[random_pt] += 1

                # Figure out how to slice the polyline when linear referencing this point based on the points that have
                # already been linear referenced. We will linear reference the current point only along the segment
                # between the closest prior and next points that have already been linear referenced rather than along
                # the whole line to increase the chances of getting the overall linear referenced order correct. This
                # better handles cases where the line doubles back on itself or where stops are closer to other parts of
                # the line.
                used_keys = sorted(list(lin_ref_dict.keys()) + [random_pt])
                this_key_idx = used_keys.index(random_pt)
                prior_key = None
                next_key = None
                # Start with the full original polyline
                line_start_dist = 0
                line_end_dist = polyline.length  # Units here are in the polyline's native units and don't matter.
                # Narrow this down to a smaller subset polyline if possible
                if this_key_idx > 0:
                    # Start at the location of the closest prior linear-referenced point
                    prior_key = used_keys[this_key_idx - 1]
                    line_start_dist = lin_ref_dict[prior_key]
                if this_key_idx < len(used_keys) - 1:
                    # End at the location of the next point
                    next_key = used_keys[this_key_idx + 1]
                    line_end_dist = lin_ref_dict[next_key]

                # Get the segment of the total polyline to use for linear referencing
                polyline_segment = polyline.segmentAlongLine(line_start_dist, line_end_dist, use_percentage=False)
                if polyline_segment.length == 0:
                    # The line segment we're linear referencing along has 0 length, meaning the start and end distance
                    # is the same or there was some other geometry issue. That's kind of weird and hard to interpret.
                    # Throw this point away as well as the prior and next ones and try again later.
                    if prior_key is not None:
                        del lin_ref_dict[prior_key]
                        sequence_keys.append(prior_key)
                    if next_key is not None:
                        del lin_ref_dict[next_key]
                        sequence_keys.append(next_key)
                    continue

                # Linear reference along the segment
                measure_along_segment = polyline_segment.measureOnLine(
                    sequence_geom_dict[random_pt], use_percentage=False)
                if prior_key is not None and measure_along_segment == 0:
                    if sequence_geom_dict[random_pt].equals(sequence_geom_dict[prior_key]):
                        # Special case where this point is in the same location as the prior point, so this is okay, and
                        # we keep it.
                        lin_ref_dict[random_pt] = lin_ref_dict[prior_key]
                        sequence_keys.remove(random_pt)
                        continue
                    # This linear referenced to the very start of the line, so either this or the prior one is bad.
                    # Remove the prior one, add it back to the list to process, and don't add this one.
                    del lin_ref_dict[prior_key]
                    sequence_keys.append(prior_key)
                    continue
                if next_key is not None and measure_along_segment == polyline_segment.length:
                    if sequence_geom_dict[random_pt].equals(sequence_geom_dict[next_key]):
                        # Special case where this point is in the same location as the next point, so this is okay, and
                        # we keep it.
                        lin_ref_dict[random_pt] = lin_ref_dict[next_key]
                        sequence_keys.remove(random_pt)
                        continue
                    # This linear referenced to the very end of the line, so either this or the next one is bad.
                    # Remove the next one, add it back to the list to process, and don't add this one.
                    del lin_ref_dict[next_key]
                    sequence_keys.append(next_key)
                    continue

                # Preserve the total distance long the line for this point. This will become shape_dist_traveled.
                lin_ref_dict[random_pt] = line_start_dist + measure_along_segment

                # We're done with this point, so remove it from the list to consider
                sequence_keys.remove(random_pt)

            # So far we have calculated the distance along the line that each point falls in whatever native units the
            # polyline had. What we want is geodesic units. Convert measure distance to geodesic shape_dist_traveled for
            # each stop_id
            shape_dist_dict_item = {}  # {stop_id: shape_dist_traveled}
            check_sorting = []  # List to use to check that linear referencing is in the correct sequence
            for sequence_pt in sorted(lin_ref_dict.keys()):
                stop_id = str(sequence_stopid_dict[sequence_pt])
                shape_dist_traveled = polyline.segmentAlongLine(
                    0, lin_ref_dict[sequence_pt], use_percentage=False).getLength("GEODESIC", self.distance_units)
                shape_dist_dict_item[stop_id] = shape_dist_traveled
                check_sorting.append([sequence_pt, shape_dist_traveled])

            # Preserve the final shape_dist_traveled info to the master dictionary
            self.final_stoptimes_tabledata[shape_id] = shape_dist_dict_item

            # Check if the stops came out in the right order. If they didn't, something is wrong with the user's input
            # shape or the way it got linear referenced. A common issue is routes that backtrack on themselves.
            if sorted(check_sorting, key=itemgetter(1, 0)) != sorted(check_sorting, key=itemgetter(0, 1)):
                shapes_with_warnings.append(shape_id)

        # Done with the progressor
        arcpy.ResetProgressor()

        # Add a warning for shapes that did not linear reference in the correct order.
        if shapes_with_warnings:
            # For some shapes, the measured distance of stops along the shape line does not match the correct sequence
            # of the stops. This likely indicates a problem with the geometry of the shapes.  The shape_dist_traveled
            # field will be added to your output stop_times.txt file and populated, but the values may be incorrect.
            # Affected shape_ids: %s
            arcpy.AddIDMessage("WARNING", 3121, str(shapes_with_warnings))

    def _map_stop_times(self, trip, stop):
        """Return shape_dist_traveled for a particular stop_id for a particular trip_id.

        Used to map this data into the stop_times dataframe.
        """
        try:
            shape_id = self.trips_table.data_frame.at[trip, "shape_id"]
            return self.final_stoptimes_tabledata[shape_id][stop]
        except KeyError:
            # Some data problem meant that we couldn't calculate shape_dist_traveled for this shape and stop combo
            return None

    def _write_stop_times_with_shape_dist_traveled(self):
        """Calculate shape_dist_traveled for stops along each shape and write the new stop_times.txt file."""
        # Linear reference the stops along the shapes and preserve the resulting shape_dist_traveled values in a master
        # dictionary that we'll reference later.
        self._calculate_stops_shape_dist_traveled()

        # Populate the shape_dist_traveled field in the stop_times dataframe.
        # Set the progressor so the user is informed since this can take a while
        # Populating shape_dist_traveled for stops_times.txt
        msg = arcpy.GetIDMessage(86505)
        arcpy.AddMessage(msg)
        arcpy.SetProgressor("default", msg)
        self.stop_times_table.data_frame["shape_dist_traveled"] = self.stop_times_table.data_frame.apply(
            lambda x: self._map_stop_times(x["trip_id"], x["stop_id"]), axis=1)

        # Create and populate the output stop_times.txt file
        self.stop_times_table.write_df_rows_to_csv(self.out_gtfs_stop_times)

        arcpy.ResetProgressor()


def do_in_fcs_have_correct_schema(in_shape_lines, in_shape_stops):
    """Verify that the input feature classes have the required fields."""
    if "shape_id" not in [f.name for f in arcpy.ListFields(in_shape_lines)]:
        # Input shape lines feature class is missing a required field. Required fields: shape_id
        raise gtfs_utils.Error(3122)
    if not set(["shape_id", "stop_id"]).issubset({f.name for f in arcpy.ListFields(in_shape_stops)}):
        # Input shape stops feature class is missing a required field. Required fields: shape_id, stop_id
        raise gtfs_utils.Error(3123)
    if [f.type for f in arcpy.ListFields(in_shape_lines, "shape_id")][0] not in ["Integer", "SmallInteger", "String"]:
        # The shape_id field must be an integer or a string.
        raise gtfs_utils.Error(3138)
    if [f.type for f in arcpy.ListFields(in_shape_stops, "shape_id")][0] not in ["Integer", "SmallInteger", "String"]:
        # The shape_id field must be an integer or a string.
        raise gtfs_utils.Error(3138)


class ToolValidator(gtfs_utils.ToolValidator):
    """Validation code for GTFS Stops To Features tool.

    Inherits from generic class.
    """
