"""Provides validation and execution logic for the Features To GTFS Stops tool."""

import os
import uuid
import arcpy
import gtfs_utils
from spatial_reference_helper import get_datum_transformation


class FeaturesToGTFSStops(gtfs_utils.Tool):  # pylint:disable=too-few-public-methods
    """Converts a point feature class to a GTFS stops.txt file."""

    def __init__(self, in_features, out_gtfs_stops_file):
        """Store tool parameter values as instance names.

        Args:
            in_features: The input ArcGIS feature class of stops.
            out_gtfs_stops_file: The output GTFS stops.txt file.
        Returns:
            No return value.
        Raises:
            No exceptions.

        """
        self.in_features = in_features
        self.out_gtfs_stops_file = str(out_gtfs_stops_file)

    def execute(self):
        """Tool Execution logic."""
        # Initialize stops table converter
        # Explicitly exclude the route_info field that is automatically added by the GTFS Stops To
        # Features tool so we don't perpetually get warnings about these fields not being in the GTFS spec.
        stops_table = gtfs_utils.FeaturesToGTFSConverter(self.in_features, "stops.txt", ["route_info"])
        # Validate input table's fields
        stops_table.validate_fields()

        # Determine if a transformation is needed if the input features aren't in WGS84
        in_sr = arcpy.Describe(self.in_features).spatialReference
        transformation = get_datum_transformation(in_sr, gtfs_utils.WGS_COORDS, self.in_features)

        # Write out the GTFS text file
        stops_table.table_to_gtfs_csv(self.out_gtfs_stops_file, transformation)


class ToolValidator(gtfs_utils.ToolValidator):
    """Validation code for GTFS Stops To Features tool."""

    pass
