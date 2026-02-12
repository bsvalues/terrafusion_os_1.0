"""Entry point for execution of the Connect Network Dataset Transit Sources To Streets tool."""
# Use tool name. pylint:disable=invalid-name

import arcpy
import connect_network_dataset_transit_sources_to_streets
import gtfs_utils


def ConnectNetworkDatasetTransitSourcesToStreets():  # Use tool name. pylint:disable=invalid-name
    """Read parameter values from the tool dialog and perform tool execution."""
    try:
        # Retrieve inputs
        target_feature_dataset = arcpy.GetParameterAsText(0)
        in_streets_features = arcpy.GetParameterAsText(1)
        search_distance = arcpy.GetParameterAsText(2)
        expression = arcpy.GetParameter(3)

        # Initialize tool with inputs
        tool = connect_network_dataset_transit_sources_to_streets.ConnectNetworkDatasetTransitSourcesToStreets(
            target_feature_dataset,
            in_streets_features,
            search_distance,
            expression
            )
        # Execute the tool
        output_tables = tool.execute()

        # Set derived outputs
        # Updated target feature dataset
        arcpy.SetParameterAsText(4, target_feature_dataset)
        # Updated input streets features
        arcpy.SetParameterAsText(5, in_streets_features)
        # Derived output feature classes in the feature dataset
        output_idx = 6
        for output_table in output_tables:
            arcpy.SetParameterAsText(output_idx, output_table)
            output_idx += 1

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
    ConnectNetworkDatasetTransitSourcesToStreets()
