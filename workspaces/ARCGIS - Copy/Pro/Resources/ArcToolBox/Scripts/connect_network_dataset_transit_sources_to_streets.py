"""Provides validation and execution logic for the Connect Network Dataset Transit Sources To Streets tool."""

import os
import uuid
import arcpy
import gtfs_utils


class InOutFCs:  # pylint:disable=too-few-public-methods
    """Defines the tool's input and output feature classes from the network data model."""

    def __init__(self, target_feature_dataset):
        """Set the output feature class and table paths based on the data model."""
        nd_model = gtfs_utils.NetworkDataModel()
        self.stops = os.path.join(target_feature_dataset, nd_model.stops.table_name)
        self.stops_on_streets = os.path.join(target_feature_dataset, nd_model.stops_on_streets.table_name)
        self.stop_connectors = os.path.join(target_feature_dataset, nd_model.stop_connectors.table_name)


class ConnectNetworkDatasetTransitSourcesToStreets(gtfs_utils.Tool):
    """Creates features to connect transit stops and lines to a streets feature class for use in a network dataset."""

    # pylint: disable=too-few-public-methods
    # pylint: disable=too-many-instance-attributes

    def __init__(self, target_feature_dataset, in_streets_features, search_distance, expression):
        """Store tool parameter values as instance names.

        Args:
            target_feature_dataset: The feature dataset where the network dataset will be created. Must contain a
                feature class called Stops.
            in_streets_features: The street features that the transit data should connect to and which will be used in
                creating the network dataset.
            search_distance: Linear unit describing the distance from the transit stop to search for a street feature to
                which it can connect.
            expression: A SQL expression controlling characteristics of the streets to which stops can connect.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.target_feature_dataset = target_feature_dataset
        self.in_streets_features = in_streets_features
        self.search_distance = search_distance
        self.expression = expression

        # Initialize input and output feature class paths
        self.io_fc_paths = InOutFCs(target_feature_dataset)

        # Make sure the Stops feature class exists in the target feature dataset
        if not arcpy.Exists(self.io_fc_paths.stops):
            # Target feature dataset must contain a feature class called Stops.
            raise gtfs_utils.Error(2840)

        # Make global variables for some fields we will refer to frequently
        self.field_id = "ID"  # Corresponds to data model ID field in Stops table
        self.field_loc_type = "GStopType"
        self.field_parent_id = "ParentID"
        self.field_whlchr = "GWheelchairBoarding"
        self.field_conn_type = "ConnectorType"
        self.where_parent_station = "%s = 1" % self.field_loc_type
        self.where_entrance = "%s = 2" % self.field_loc_type
        # Ensure required fields are present in the input Stops table before we go too far
        self.stops_fields = [f.name for f in arcpy.ListFields(self.io_fc_paths.stops)]
        self._validate_required_fields()

        # Initialize some helpful global variables
        self.spatial_ref = arcpy.Describe(self.target_feature_dataset).spatialReference
        self.handle_whlchr = self.field_whlchr in self.stops_fields
        self.parent_stations = {}
        self.parent_station_connectors = []
        self.parent_stations_with_entrances = []
        self.parent_stations_to_delete = []

    def execute(self):
        """Tool Execution logic. Returns a list of output tables that were created or updated in the feature dataset."""
        try:

            # Throw a warning if spatial references don't match
            if not do_spatial_refs_match(self.target_feature_dataset, self.in_streets_features):
                # The spatial reference of the input streets feature class is different from the spatial reference of
                # the target feature dataset.
                arcpy.AddIDMessage("WARNING", 2841)

            # Make a copy of the Stops feature class. We will subsequently snap the copy to the streets.
            arcpy.management.CopyFeatures(self.io_fc_paths.stops, self.io_fc_paths.stops_on_streets)

            # Modify Stops and snapped stops to deal with parent stations and station entrances
            if set([self.field_parent_id, self.field_loc_type]).issubset(set(self.stops_fields)):
                self._handle_parent_stations()

            # Snap the stops to the streets network.
            # Select only the streets matching the user's expression, if any.
            # The most likely problem here is that the SQL expression is invalid, and this will raise a GPError.
            in_streets_layer = arcpy.management.MakeFeatureLayer(
                self.in_streets_features, "StreetLayer", self.expression
                )
            # Perform the snap (note: requires Editor-level license)
            num_streets = int(arcpy.management.GetCount(in_streets_layer).getOutput(0))
            if num_streets >= 1000000:
                # To avoid performance and machine resource issues in the Snap tool, if the streets dataset is over a
                # certain threshold size (chosen somewhat arbitrarily to be closer to the size of a country instead of a
                # metropolitan area), first reduce the input data size that the Snap tool has to handle by extracting
                # only the streets within the search distance (plus small buffer).
                # See https://devtopia.esri.com/ArcGISPro/Network-Analyst/issues/7002
                # and https://devtopia.esri.com/ArcGISPro/geoprocessing/issues/5050
                # Set up a distance for selection with a 5% size buffer from the user's search distance
                search_val, units = self.search_distance.split(" ")
                # Locales that use a comma as a decimal may return numbers like 10,5, so replace commas with periods
                # before converting to float.
                search_val = float(search_val.replace(",", "."))
                select_distance = f"{search_val + (0.05 * search_val)} {units}"
                # Select streets within the buffered search distance of stops
                # Use planar distance because that's what the Snap tool uses (no option for geodesic)
                arcpy.management.SelectLayerByLocation(
                    in_streets_layer, "WITHIN_A_DISTANCE", self.io_fc_paths.stops_on_streets, select_distance)
                # Export the selected features to a temporary feature class because running the Snap tool on the layer
                # with the selection still behaves poorly, but running it on a truly smaller dataset is better.
                temp_selected_streets_name = arcpy.ValidateTableName(
                    "TempStreets_" + uuid.uuid4().hex, arcpy.env.scratchGDB)  # pylint: disable=no-member
                temp_selected_streets = os.path.join(
                    arcpy.env.scratchGDB, temp_selected_streets_name)  # pylint: disable=no-member
                arcpy.conversion.ExportFeatures(in_streets_layer, temp_selected_streets)
                # Perform the snap
                snap_env = [temp_selected_streets, "EDGE", self.search_distance]
                arcpy.edit.Snap(self.io_fc_paths.stops_on_streets, [snap_env])
                # Clean up temporary extracted streets
                arcpy.management.Delete(temp_selected_streets)
            else:
                # This is the normal case. Just run the Snap tool on the data as is.  For a city-sized dataset (typical)
                # for what most users are doing, this will work fine.
                snap_env = [in_streets_layer, "EDGE", self.search_distance]
                arcpy.edit.Snap(self.io_fc_paths.stops_on_streets, [snap_env])

            # Temporarily put Stops and Snapped stops into same scratch feature class for input to PointsToLine
            # pragma pylint: disable=no-member
            temp_stops_fc_name = arcpy.ValidateTableName("TempStopsSnapped_" + uuid.uuid4().hex, arcpy.env.scratchGDB)
            temp_stops_combined = os.path.join(arcpy.env.scratchGDB, temp_stops_fc_name)
            arcpy.management.CopyFeatures(self.io_fc_paths.stops, temp_stops_combined)
            arcpy.management.Append(self.io_fc_paths.stops_on_streets, temp_stops_combined)
            # pragma pylint: enable=no-member

            # Create a straight line connecting the original stop location to the snapped stop location
            # Use the ID field to define unique pairs of stops, each of which gets its own line.
            arcpy.management.PointsToLine(temp_stops_combined, self.io_fc_paths.stop_connectors, self.field_id)

            # Clean up temporary combined stops
            arcpy.management.Delete(temp_stops_combined)

            # Update the connector lines feature class we just created to match the data model
            # Change the name of the ID field to match the data model
            arcpy.management.AlterField(
                self.io_fc_paths.stop_connectors, self.field_id, "StopID", clear_field_alias="CLEAR_ALIAS")
            # Add a field to the data designating that this is a connector directly from the stops to the streets
            arcpy.management.AddField(self.io_fc_paths.stop_connectors, self.field_conn_type, "SHORT")
            arcpy.management.CalculateField(self.io_fc_paths.stop_connectors, self.field_conn_type, 0)
            # Transfer the wheelchair boarding field to the connector lines
            # For regular stops, the line inherits the value from the stop.
            if self.handle_whlchr:
                arcpy.management.JoinField(self.io_fc_paths.stop_connectors, "StopID", self.io_fc_paths.stops,
                                           self.field_id, self.field_whlchr)
            else:
                # If the input Stops didn't have a wheelchair field, add one to the connectors and leave it Null
                arcpy.management.AddField(self.io_fc_paths.stop_connectors, self.field_whlchr, "SHORT")

            # Insert line features for parent stations and station entrances
            if set([self.field_parent_id, self.field_loc_type]).issubset(set(self.stops_fields)):
                self._insert_parent_station_lines()

            # Adds vertices in streets at the locations of snapped stops using Integrate. These vertices are essential
            # for network dataset connectivity when the snapped stops are used as junctions.
            # Because the snapped stops are directly on top of the streets, and we don't want the streets or stops to
            # move, use cluster tolerance of 0.
            arcpy.management.Integrate([[self.in_streets_features, 1], [self.io_fc_paths.stops_on_streets, 2]],
                                       "0 meters")

            # Return the updated and newly-produced output feature classes in the feature dataset
            return [self.io_fc_paths.stops, self.io_fc_paths.stops_on_streets, self.io_fc_paths.stop_connectors]

        except arcpy.ExecuteError:
            # Catch any errors from GP tools and pass them through cleanly so we don't get a nasty traceback.
            # The most likely problem here is in creating the outputs if the output already exists and can't be,
            # overwritten, such as if it already participates in a network dataset.
            # Also likely is an invalid SQL expression for selecting streets.
            raise gtfs_utils.GPError()

    def _validate_required_fields(self):
        """Validate that the input Stops table has the required fields."""
        required_fields = [self.field_id]
        # Compare in lower case because SDE switches the case around. Oracle is all upper. Postgres is all lower.
        required_fields_lower = [f.lower() for f in required_fields]
        actual_fields = [f.lower() for f in self.stops_fields]
        if not set(required_fields_lower).issubset(set(actual_fields)):
            missing_fields = [f for f in required_fields if f.lower() not in actual_fields]
            # The Stops feature class in the target feature dataset is missing one or more required fields: %s
            raise gtfs_utils.Error(2842, ", ".join(missing_fields))
        if self.field_parent_id in self.stops_fields and self.field_loc_type not in self.stops_fields:
            # The Stops feature class contains the ParentID field but is missing the GStopType field. Consequently, any
            # parent stations will be treated as ordinary stops, and all stops will be snapped directly to the streets.
            arcpy.AddIDMessage("WARNING", 2843)

    def _make_polyline(self, point1, point2):
        """Generate a straight line between two points. Returns the polyline object."""
        array = arcpy.Array()
        array.add(point1)  # Use firstPoint to convert from PointGeometry to Point
        array.add(point2)
        return arcpy.Polyline(array, self.spatial_ref)

    def _determine_wheelchair_boarding(self, stop_whlchr, parent_station_id):
        """Determine the correct GWheelchairBoarding value for a connector feature.

        If the stop's GWheelchairBoarding value is 1 or 2, use this value explicitly.  Otherwise, if it's null or 0,
        the stop (hence, connector line) inherits the value from the parent station. Applies to both connectors between
        stops and parent stations and connectors between station entrances and parent stations.
        """
        if stop_whlchr in [None, 0]:
            # In this case, the stop (hence, connector line) inherits the wheelchair boarding value from
            # the parent station
            return self.parent_stations[parent_station_id][1]
        # Otherwise, leave it as is.
        return stop_whlchr

    def _handle_parent_stations(self):
        """Handle parent stations and station entrances in the original and snapped stops."""
        # Log information about parent stations in the input Stops for later look-up
        self._store_parent_stations()

        # Delete any station entrances from Stops. These will only be in the snapped version to connect to streets.
        self._delete_station_entrances_from_stops()

        # Remove parent stations with valid entrances from snapped stops.
        # They will be connected to streets through the entrances.
        self._delete_parents_with_entrances_from_snapped_stops()

        # Generate the line geometries between stops and their parent stations.
        # Also delete stops that have a parent station from the snapped stops because these should be connected to the
        # parent station and not the street.
        self._connect_stops_to_parents()

    def _store_parent_stations(self):
        """Create a dictionary of {parent station stop ID: (point object, wheelchair boarding)} for later use."""
        fields = [gtfs_utils.SHAPE_CURSOR, self.field_id]
        if self.handle_whlchr:
            fields.append(self.field_whlchr)
        # pragma pylint: disable=no-member
        for row in arcpy.da.SearchCursor(self.io_fc_paths.stops, fields, self.where_parent_station):
            # pragma pylint: enable=no-member
            # Use firstPoint to convert from PointGeometry to Point
            if self.handle_whlchr:
                self.parent_stations[row[1]] = (row[0].firstPoint, row[2])
            else:
                self.parent_stations[row[1]] = (row[0].firstPoint, None)

    def _delete_station_entrances_from_stops(self):
        """Delete station entrances from Stops. These will only be in the snapped version to connect to streets.

        Also make a list of parent stations with entrances for later use
        """
        self.parent_stations_with_entrances = []
        # pragma pylint: disable=no-member
        with arcpy.da.UpdateCursor(self.io_fc_paths.stops, [self.field_parent_id], self.where_entrance) as cur:
            # pragma pylint: enable=no-member
            for row in cur:
                self.parent_stations_with_entrances.append(row[0])
                cur.deleteRow()
        self.parent_stations_with_entrances = list(set(self.parent_stations_with_entrances))

    def _delete_parents_with_entrances_from_snapped_stops(self):
        """Delete parent stations with valid entrances from snapped stops.

        They will be connected to streets through the entrances.
        """
        if self.parent_stations_with_entrances:
            with arcpy.da.UpdateCursor(  # pylint: disable=no-member
                self.io_fc_paths.stops_on_streets,
                [self.field_id],
                self.where_parent_station
            ) as cur:
                for row in cur:
                    if row[0] in self.parent_stations_with_entrances:
                        cur.deleteRow()

    def _connect_stops_to_parents(self):
        """Generate the line geometries between stops and their parent stations.

        Also delete stops that have a parent station from the snapped stops because these should be connected to the
        parent station and not the street.
        """
        if not self.parent_stations:
            return
        fields = [gtfs_utils.SHAPE_CURSOR, self.field_parent_id, self.field_id]
        if self.handle_whlchr:
            fields.append(self.field_whlchr)
        where = "%s IS NOT NULL And (%s = 0 Or %s IS NULL)" % (self.field_parent_id,
                                                               self.field_loc_type,
                                                               self.field_loc_type)
        # pragma pylint: disable=no-member
        with arcpy.da.UpdateCursor(self.io_fc_paths.stops_on_streets, fields, where) as cur:
            # pragma pylint: enable=no-member
            for row in cur:
                parent_station_id = row[1]
                if parent_station_id not in self.parent_stations:
                    # This is a data problem, but we can get around it by just
                    # snapping the stop to the street instead of the missing parent station
                    continue
                # Generate a straight line between the stop and its parent station
                polyline = self._make_polyline(row[0].firstPoint, self.parent_stations[parent_station_id][0])
                if polyline.length != 0:
                    # Keep the line for later when we'll add it to the connectors feature class
                    if self.handle_whlchr:
                        whlchr = self._determine_wheelchair_boarding(row[3], parent_station_id)
                    else:
                        whlchr = None
                    # [(ID, polyline geometry, ConnectoryType=1, GWheelchairBoarding), (), ...]
                    self.parent_station_connectors.append((row[2], polyline, 1, whlchr))
                else:
                    # If the stop and parent station are in the same place, don't generate a line because
                    # this will cause network build errors.  Instead, we'll delete the parent_station later.
                    self.parent_stations_to_delete.append(parent_station_id)
                # Delete this row from the snapped stops because the stop snaps to its parent station and not the
                # street
                cur.deleteRow()
        self.parent_stations_to_delete = list(set(self.parent_stations_to_delete))

    def _insert_parent_station_lines(self):
        """Insert the previously-created special-case line connectors for parent stations and station entrances."""
        # Delete parent stations that are coincident with stops because these are useless.
        if self.parent_stations_to_delete:
            # pragma pylint: disable=no-member
            with arcpy.da.UpdateCursor(self.io_fc_paths.stops, [self.field_id], self.where_parent_station) as cur:
                # pragma pylint: enable=no-member
                for row in cur:
                    if row[0] in self.parent_stations_to_delete:
                        cur.deleteRow()

        # Insert the connector lines between child stops and parent stations that we created earlier
        # into the main connectors feature class
        if self.parent_station_connectors:
            with arcpy.da.InsertCursor(  # pylint: disable=no-member
                self.io_fc_paths.stop_connectors,
                ["StopID", gtfs_utils.SHAPE_CURSOR, self.field_conn_type, self.field_whlchr]
            ) as cur:
                for connector in self.parent_station_connectors:
                    cur.insertRow(connector)

        # Generate lines connecting parent stations with their street entrances
        # Delete the parent stations from the snapped stops since they will connect to streets at entrances
        if self.parent_stations_with_entrances:
            station_entrance_connectors = []
            with arcpy.da.UpdateCursor(  # pylint: disable=no-member
                self.io_fc_paths.stops_on_streets,
                [gtfs_utils.SHAPE_CURSOR, self.field_id, self.field_parent_id, self.field_whlchr],
                self.where_entrance
            ) as cur:
                for row in cur:
                    parent_station_id = row[2]
                    # Generate a straight line between the parent station and the street entrance
                    polyline = self._make_polyline(self.parent_stations[parent_station_id][0], row[0].firstPoint)
                    if polyline.length == 0:
                        # If the station entrance and parent station are in the same place, don't generate a line
                        # because this will cause network build errors.  Just delete the entrance because we don't need
                        # it. This should only happen if the parent station coincidentally falls exactly on top of a
                        # street feature (very unlikely).
                        cur.deleteRow()
                        continue
                    # Keep the line for later when we'll add it to the connectors feature class
                    whlchr = self._determine_wheelchair_boarding(row[3], parent_station_id)
                    # [(ID, polyline geometry, ConnectorType=2), (), ...]
                    station_entrance_connectors.append((row[1], polyline, 2, whlchr))

            # Add the lines to the connector features
            if station_entrance_connectors:
                with arcpy.da.InsertCursor(  # pylint: disable=no-member
                    self.io_fc_paths.stop_connectors,
                    ["StopID", gtfs_utils.SHAPE_CURSOR, self.field_conn_type, self.field_whlchr]
                ) as cur:
                    for connector in station_entrance_connectors:
                        cur.insertRow(connector)


def do_spatial_refs_match(target_feature_dataset, in_streets_features):
    """Return True if the spatial refs of the target feature dataset and street features match. False otherwise."""
    if not (arcpy.Exists(target_feature_dataset) and arcpy.Exists(in_streets_features)):
        # If one of them doesn't even exist, don't bother checking. Just return True, and something else will need
        # to deal with the fact that they don't exist.
        return True

    # Spatial reference objects returned by da.Describe (but not regular Describe) can be compared reliably.
    spatial_ref_fd = arcpy.da.Describe(target_feature_dataset)["spatialReference"]  # pylint: disable=no-member
    spatial_ref_streets = arcpy.da.Describe(in_streets_features)["spatialReference"]  # pylint: disable=no-member
    return spatial_ref_fd == spatial_ref_streets


# Validation flags to prevent redoing slow validation checks if the parameter hasn't changed. Because of limitations of
# the ToolValidator class framework, these must be global variables stored outside the class, even though this isn't the
# best coding practice.
VFLAG_MISSING_STOPS_ERROR = False
VFLAG_NETWORK_EXISTS_ERROR = False


class ToolValidator:
    """Tool validation logic specific to this tool."""

    def __init__(self):
        """Initialize shared variables."""
        self.params = arcpy.GetParameterInfo()
        nd_model = gtfs_utils.NetworkDataModel()
        self.out_schema_dict = nd_model.make_schema_dict()
        self.out_geometry_type_dict = nd_model.make_geometry_type_dict()

    def initializeParameters(self):  # pylint: disable=invalid-name
        """Refine the properties of a tool's parameters. This method is called when the tool is opened."""

    def updateParameters(self):  # pylint: disable=invalid-name
        """Modify the values and properties of parameters before internal validation is performed.

        This method is called whenever a parameter has been changed.
        """
        # Set derived outputs preemptively to make Model Builder happy
        if self.params[1].valueAsText:
            self.params[5].value = self.params[1].value
            self.params[5].schema.geometryTypeRule = "AsSpecified"
            self.params[5].schema.geometryType = "Polyline"
        target_feature_dataset = self.params[0].valueAsText
        if target_feature_dataset:
            self.params[4].value = target_feature_dataset
            out_tables = ["Stops", "StopsOnStreets", "StopConnectors"]
            for idx, table in enumerate(out_tables):
                self.params[6+idx].value = os.path.join(target_feature_dataset, table)
                self.params[6+idx].schema.additionalFields = self.out_schema_dict[table]
                self.params[6+idx].schema.geometryTypeRule = "AsSpecified"
                self.params[6+idx].schema.geometryType = self.out_geometry_type_dict[table]

    def updateMessages(self):  # pylint: disable=invalid-name
        """Modify the messages created by internal validation for each tool parameter.

        This method is called after internal validation.
        """
        param_fd = self.params[0]
        param_streets = self.params[1]

        # Check contents of feature dataset
        # Skip check if the parameters is derived (from Model Builder output)
        if not param_fd.isInputValueDerived() and param_fd.altered and param_fd.valueAsText:
            global VFLAG_MISSING_STOPS_ERROR
            global VFLAG_NETWORK_EXISTS_ERROR
            if param_fd.hasBeenValidated:
                # The parameter has already been validated and has not been changed by the user since the last
                # validation check. Skip slow checks by just reapplying the existing validation error if relevant.
                if VFLAG_MISSING_STOPS_ERROR:
                    # Target feature dataset must contain a feature class called Stops.
                    param_fd.setIDMessage("Error", 2840)
                if VFLAG_NETWORK_EXISTS_ERROR:
                    # The feature dataset contains a network dataset, so the tool cannot overwrite or edit the existing
                    # output feature classes.
                    param_fd.setIDMessage("Error", 240015)
            else:
                # The parameter has a fresh value.  Do slow checks.
                VFLAG_MISSING_STOPS_ERROR = False
                VFLAG_NETWORK_EXISTS_ERROR = False
                feature_dataset = str(param_fd.valueAsText)
                if arcpy.Exists(feature_dataset):
                    with arcpy.EnvManager(workspace=os.path.dirname(feature_dataset)):
                        fcs = arcpy.ListFeatureClasses(feature_dataset=os.path.basename(feature_dataset))
                        # Handle the case where the table names are qualified
                        fcs = [arcpy.ParseTableName(fc, os.path.dirname(feature_dataset)).split(", ")[2] for fc in fcs]
                        # Ensure the target feature dataset contains the necessary feature class
                        if "Stops" not in fcs:
                            # Target feature dataset must contain a feature class called Stops.
                            param_fd.setIDMessage("Error", 2840)
                            VFLAG_MISSING_STOPS_ERROR = True
                        # Ensure there isn't already a network dataset in the feature dataset.  The tool will overwrite
                        # existing StopsOnStreets and StopConnectors features, and if they participate in a network
                        # dataset (or really any other controller dataset), the tool won't be able to overwrite them
                        # and will fail.  There's no convenient arcpy function to determine if a feature class
                        # participates in a controller dataset, so as a reasonably quick check (instead of describing
                        # the network), just see if the two output feature classes exist and a network exists in the
                        # same feature dataset.  It's conceivable that a network is present and the two feature classes
                        # don't participate in it, but it's unlikely, and at that point I would question what the user
                        # was trying to do anyway.
                        if "StopsOnStreets" in fcs or "StopConnectors" in fcs:
                            with arcpy.EnvManager(workspace=feature_dataset):
                                networks = arcpy.ListDatasets(feature_type="Network")
                            if networks:
                                # The feature dataset contains a network dataset, so the tool cannot overwrite or edit
                                # the existing output feature classes.
                                param_fd.setIDMessage("Error", 240015)
                                VFLAG_NETWORK_EXISTS_ERROR = True

        # Throw a warning if spatial references don't match
        if not param_fd.isInputValueDerived() and not param_streets.isInputValueDerived():
            if (param_fd.altered or param_streets.altered) and param_fd.valueAsText and param_streets.valueAsText:
                if not do_spatial_refs_match(param_fd.value, param_streets.value):
                    # The spatial reference of the input streets feature class is different from the spatial reference
                    # of the target feature dataset.
                    param_streets.setIDMessage("Warning", 2841)
