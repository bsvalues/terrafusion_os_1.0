"""Entry point for execution of the Features To GTFS Shapes tool."""  # pylint:disable=invalid-name

import arcpy
import features_to_gtfs_shapes
import gtfs_utils


def FeaturesToGTFSShapes():  # Use tool name. pylint:disable=invalid-name
    """Read parameter values from the tool dialog and perform tool execution."""
    try:
        in_shape_lines = arcpy.GetParameterAsText(0)
        in_shape_stops = arcpy.GetParameterAsText(1)
        in_gtfs_trips = arcpy.GetParameterAsText(2)
        in_gtfs_stop_times = arcpy.GetParameterAsText(3)
        out_gtfs_shapes = arcpy.GetParameterAsText(4)
        out_gtfs_stop_times = arcpy.GetParameterAsText(5)
        distance_units = arcpy.GetParameterAsText(6)
        tool = features_to_gtfs_shapes.FeaturesToGTFSShapes(
            in_shape_lines,
            in_shape_stops,
            in_gtfs_trips,
            in_gtfs_stop_times,
            out_gtfs_shapes,
            out_gtfs_stop_times,
            distance_units
            )
        tool.execute()
    except gtfs_utils.Error as err:
        arcpy.AddIDMessage("ERROR", err.message_id, err.add_arg1, err.add_arg2)
    except gtfs_utils.GPError:
        pass
    except Exception:  # pylint:disable=broad-except
        import traceback  # Only import for horrible unexpected problems. pylint: disable=import-outside-toplevel
        arcpy.AddError(traceback.format_exc())
        # An unexpected error occurred during tool execution.
        arcpy.AddIDMessage("ERROR", 30206)


if __name__ == "__main__":
    FeaturesToGTFSShapes()
