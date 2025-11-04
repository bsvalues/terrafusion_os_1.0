"""Entry point for execution of the Calculate Transit Service Frequency tool."""  # pylint:disable=invalid-name

import arcpy
import gtfs_utils
from calculate_transit_service_frequency import TransitFrequencyCalculator, analysis_type_str_to_enum, \
    value_table_to_time_window, units_str_to_enum, cell_size_to_meters


def CalculateTransitServiceFrequency():  # Use tool name. pylint:disable=invalid-name
    """Read parameter values from the tool dialog and perform tool execution."""
    try:
        poi_fc = arcpy.GetParameter(5)
        network = arcpy.GetParameterAsText(6)
        travel_mode = arcpy.GetParameter(7)
        cutoff = arcpy.GetParameter(8)
        barriers = arcpy.GetParameter(11)
        exclude_modes = arcpy.GetParameter(14)
        analysis_params = {
            "transit_fd": arcpy.GetParameterAsText(0),
            "analysis_type": analysis_type_str_to_enum(arcpy.GetParameterAsText(1)),
            "out_fc": arcpy.GetParameterAsText(2),
            "time_windows": value_table_to_time_window(arcpy.GetParameter(3)),
            "separate_lines": arcpy.GetParameter(4),
            "poi_fc": poi_fc if poi_fc else None,
            "network": network if network else None,
            "travel_mode": travel_mode if travel_mode else None,
            "cutoff": cutoff if cutoff else None,
            "cutoff_units": units_str_to_enum(arcpy.GetParameterAsText(9)),
            "cell_size_meters": cell_size_to_meters(arcpy.GetParameterAsText(10)),
            "barriers": barriers if barriers else None,
            "wheelchair": arcpy.GetParameter(12),
            "bicycle": arcpy.GetParameter(13),
            "exclude_modes": exclude_modes if exclude_modes else [],
            "use_lve_shapes": arcpy.GetParameterAsText(15) == "CARTOGRAPHIC_LINES"
        }
        tool = TransitFrequencyCalculator(**analysis_params)
        tool.calculate_transit_frequency()
        # Set symbology on the output. Create a modified lyrx from a template, inserting the user's field names.
        symbol_lyrx = tool.get_symbology_layer()
        arcpy.SetParameterSymbology(2, symbol_lyrx)
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
    CalculateTransitServiceFrequency()
