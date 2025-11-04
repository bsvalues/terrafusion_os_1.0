"""Entry point for execution of the Copy Network Analysis Layer tool."""  # Use tool name. pylint:disable=invalid-name

import arcpy
import copy_network_analysis_layer
from nat import GPError, ToolExit


if __name__ == "__main__":
    """Read parameter values from the tool dialog and perform tool execution."""
    try:
        na_layer_copier = copy_network_analysis_layer.NALayerCopier(
            arcpy.GetParameter(0),
            arcpy.GetParameterAsText(1)
        )
        out_layer = na_layer_copier.copy_na_layer()
        arcpy.SetParameter(2, out_layer)
    except GPError:
        # This error was handled explicitly in the tool code.
        # It is an error passed through from a GP tool run in the code.
        pass
    except ToolExit:
        # This error was handled explicitly in the tool code.
        pass
    except Exception:  # pylint:disable=broad-except
        import traceback
        arcpy.AddError(traceback.format_exc())
        # An unexpected error occurred during tool execution.
        arcpy.AddIDMessage("ERROR", 30206)
