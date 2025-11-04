"""Entry point for execution of the GTFS To Network Dataset Transit Sources tool."""  # pylint:disable=invalid-name

import arcpy
import gtfs_to_network_dataset_transit_sources
import gtfs_utils


def GTFSToNetworkDatasetTransitSources():  # Use tool name. pylint:disable=invalid-name
    """Read parameter values from the tool dialog and perform tool execution."""
    try:
        # Retrieve inputs
        in_gtfs_folders = arcpy.GetParameter(0)
        target_feature_dataset = arcpy.GetParameterAsText(1)
        interpolate = arcpy.GetParameter(12)
        append = arcpy.GetParameter(13)
        make_lve_shapes = arcpy.GetParameter(14)

        # Initialize tool with inputs
        tool = gtfs_to_network_dataset_transit_sources.GTFSToNetworkDatasetTransitSources(
            [str(f) for f in in_gtfs_folders],
            target_feature_dataset,
            interpolate,
            append,
            make_lve_shapes
            )
        # Execute the tool
        output_tables = tool.execute()

        # Set derived outputs
        # Updated feature dataset
        arcpy.SetParameterAsText(2, target_feature_dataset)
        # Derived output tables
        # The original output parameters are all in a row starting at 3
        output_idx = 3
        for output_table in output_tables[:9]:
            arcpy.SetParameterAsText(output_idx, output_table)
            output_idx += 1
        # The output LVEShapes feature class was added to the data model later and is consequently in a different
        # position in the parameter order. It may not always be present in the output list.
        if len(output_tables) > 9:
            arcpy.SetParameterAsText(15, output_tables[9])

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
    GTFSToNetworkDatasetTransitSources()
