"""Entry point for execution of the Generate Shapes Features From GTFS tool."""  # pylint:disable=invalid-name

import arcpy
import generate_shapes_features_from_gtfs
import gtfs_utils


def GenerateShapesFeaturesFromGTFS():  # Use tool name. pylint:disable=invalid-name
    """Read parameter values from the tool dialog and perform tool execution."""
    try:
        in_gtfs_folder = arcpy.GetParameterAsText(0)
        out_shape_lines = arcpy.GetParameterAsText(1)
        out_shape_stops = arcpy.GetParameterAsText(2)
        out_gtfs_trips = arcpy.GetParameterAsText(3)
        network_modes = arcpy.GetParameter(4)
        network_data_source = arcpy.GetParameterAsText(5)
        travel_mode = arcpy.GetParameter(6)
        drive_side = arcpy.GetParameterAsText(7)
        bearing_tolerance = arcpy.GetParameter(8)
        max_bearing_angle = arcpy.GetParameter(9)
        tool = generate_shapes_features_from_gtfs.GenerateShapesFeaturesFromGTFS(
            in_gtfs_folder,
            out_shape_lines,
            out_shape_stops,
            out_gtfs_trips,
            network_modes,
            network_data_source,
            travel_mode,
            drive_side,
            bearing_tolerance,
            max_bearing_angle
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
    GenerateShapesFeaturesFromGTFS()
