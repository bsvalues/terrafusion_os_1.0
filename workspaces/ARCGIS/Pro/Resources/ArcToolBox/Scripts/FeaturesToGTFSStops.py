"""Entry point for execution of the Features To GTFS Stops tool."""  # Use tool name. pylint:disable=invalid-name

import arcpy
import features_to_gtfs_stops
import gtfs_utils


def FeaturesToGTFSStops():  # Use tool name. pylint:disable=invalid-name
    """Read parameter values from the tool dialog and perform tool execution."""
    try:
        tool = features_to_gtfs_stops.FeaturesToGTFSStops(arcpy.GetParameterAsText(0), arcpy.GetParameterAsText(1))
        tool.execute()
    except gtfs_utils.Error as err:
        arcpy.AddIDMessage("ERROR", err.message_id, err.add_arg1, err.add_arg2)
    except gtfs_utils.GPError:
        pass
    except Exception:  # pylint:disable=broad-except
        import traceback
        arcpy.AddError(traceback.format_exc())
        # An unexpected error occurred during tool execution.
        arcpy.AddIDMessage("ERROR", 30206)


if __name__ == "__main__":
    FeaturesToGTFSStops()
