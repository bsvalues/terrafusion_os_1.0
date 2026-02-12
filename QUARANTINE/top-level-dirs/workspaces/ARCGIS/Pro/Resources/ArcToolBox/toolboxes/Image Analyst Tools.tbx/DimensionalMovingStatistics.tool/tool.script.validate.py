import os
import arcpy
from arcpy.sa import Utils


AFR_SIGNAL_VALUE = Utils.UNEVALUATED_RASTER_FUNCTION_SIGNAL


def get_dimensions(raster):
    result = []
    vars = raster.variableNames
    if vars is None:
        return result
    for v in vars:
        dims = raster.getDimensionNames(v)
        if dims is None:
            continue
        for d in dims:
            if d not in result:
                result.append(str(d))
    return result


class ToolValidator:
    def __init__(self) -> None:
        self.params = arcpy.GetParameterInfo()
        self.p_name = {p.name: p for p in self.params}

    def initializeParameters(self) -> None:
        """Refine the properties of a tool's parameters.  This method is
        called when the tool is opened."""

    def updateParameters(self) -> None:
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        # Limit the raster options to multidimensional rasters only
        rfilt = self.p_name["in_raster"].filter
        if rfilt is not None and rfilt.list is not None and len(rfilt.list) > 1:
            good_rasters = []
            for r in rfilt.list:
                try:
                    ras = arcpy.Raster(r, True)
                    if ras.isMultidimensional:  # TODO: is there a faster way?
                        good_rasters.append(r)
                except:
                    pass
            if len(rfilt.list) > len(good_rasters) > 0:
                rfilt.list = good_rasters

        if not self.p_name["in_raster"].hasBeenValidated:
            ras_name = self.p_name["in_raster"].valueAsText
            if ras_name is not None and len(ras_name) > 0:
                # Populate the dimension list with the actual dimensions found in the raster
                try:
                    in_ras = arcpy.Raster(ras_name, True)
                    available_dimensions = get_dimensions(in_ras)
                    if len(available_dimensions) > 0 and available_dimensions != self.p_name["dimension"].filter.list:
                        self.p_name["dimension"].filter.list = available_dimensions
                except:
                    pass

        #  Show or hide detail parameters for various statistics types
        if not self.p_name["statistics_type"].hasBeenValidated:

            if self.p_name["statistics_type"].valueAsText == "PERCENTILE":
                self.p_name["percentile_value"].enabled = True
            else:
                self.p_name["percentile_value"].enabled = False

            if self.p_name["statistics_type"].valueAsText in ("PERCENTILE", "MEDIAN"):
                self.p_name["percentile_interpolation_type"].enabled = True
            else:
                self.p_name["percentile_interpolation_type"].enabled = False

            if self.p_name["statistics_type"].valueAsText == "CIRCULAR_MEAN":
                self.p_name["circular_wrap_value"].enabled = True
            else:
                self.p_name["circular_wrap_value"].enabled = False

    def updateMessages(self) -> None:
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""

        # If a non-multidimensional input raster sneaks through, that's an error
        ras_name = self.p_name["in_raster"].valueAsText
        if ras_name is not None and len(ras_name) > 0:
            try:
                in_ras = arcpy.Raster(ras_name)
                if in_ras.isMultidimensional:
                    self.p_name["in_raster"].clearMessage()
                else:
                    self.p_name["in_raster"].setIDMessage("ERROR", 110289)
            except:
                pass

        # The output raster format must be CRF, and must not be in a file geodatabase
        file_name = self.p_name["out_raster"].valueAsText
        if file_name is not None and file_name.endswith(AFR_SIGNAL_VALUE):
            self.p_name["out_raster"].clearMessage()  # Ignore special signal value
        elif file_name is not None and len(file_name) > 0:
            _, extension = os.path.splitext(file_name)
            dir_name = os.path.dirname(file_name)
            is_crf = extension.lower() == ".crf"
            is_gdb = dir_name.lower().endswith(".gdb")
            if not is_crf:
                # The output multidimensional raster must be saved in Cloud Raster Format (*.crf).
                self.p_name["out_raster"].setIDMessage("ERROR", 45066)
            elif is_gdb:
                # Non file-based workspace
                self.p_name["out_raster"].setIDMessage("ERROR", 10570)
