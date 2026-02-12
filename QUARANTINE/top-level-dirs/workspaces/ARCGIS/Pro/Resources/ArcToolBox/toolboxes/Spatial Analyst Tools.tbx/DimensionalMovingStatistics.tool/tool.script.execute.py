import json

import arcpy
from arcpy.sa import ApplyEnvironment, Utils
from arcpy.ia import Apply

# Convert argument symbols to numerical enum values
nodata_policies = {
    "DATA": -1,
    "NODATA": 0,
    "FILL_NODATA": 3,
}

stat_types = {
    # values from esriGeoAnalysisStatisticsEnum
    "MAJORITY": 1,
    "MAXIMUM": 2,
    "MEAN": 3,
    "MEDIAN": 4,
    "MINIMUM": 5,
    # "MINORITY": 6,
    # "RANGE": 7,
    # "STANDARD_DEVIATION": 8,
    # "STD": 8,
    # "SUM": 9,
    # "VARIETY": 10,
    "PERCENTILE": 12,
    "CIRCULAR_MEAN": 13,
}

interpolation_types = {
    "AUTO_DETECT": 1,
    "NEAREST": 2,
    "LINEAR": 3,
}


def DimensionalMovingStatistics():
    params = arcpy.GetParameterInfo()
    pni = {p.name: ix for ix, p in enumerate(params)}

    in_raster = arcpy.GetParameterAsText(pni["in_raster"])
    dimension = arcpy.GetParameterAsText(pni["dimension"])
    out_raster_name = arcpy.GetParameterAsText(pni["out_raster"])
    backward_window = arcpy.GetParameterAsText(pni["backward_window"])
    forward_window = arcpy.GetParameterAsText(pni["forward_window"])
    nodata_handling = arcpy.GetParameterAsText(pni["nodata_handling"])
    statistics_type = arcpy.GetParameterAsText(pni["statistics_type"])
    percentile_value = arcpy.GetParameterAsText(pni["percentile_value"])
    percentile_interpolation_type = arcpy.GetParameterAsText(pni["percentile_interpolation_type"])
    circular_wrap_value = arcpy.GetParameterAsText(pni["circular_wrap_value"])

    rfx_args = {}
    if not Utils.useDefaultArgumentValue(dimension):
        rfx_args["Dimension"] = str(dimension)
    rfx_args["BackwardWindow"] = int(backward_window)
    rfx_args["ForwardWindow"] = int(forward_window)
    rfx_args["NoDataHandling"] = nodata_policies[nodata_handling]
    rfx_args["StatisticsType"] = stat_types[statistics_type]
    rfx_args["PercentileValue"] = float(percentile_value)
    rfx_args["PercentileInterpolationType"] = interpolation_types[percentile_interpolation_type]
    rfx_args["CircularWrapValue"] = float(circular_wrap_value)

    rfx_args_json = json.dumps(rfx_args)
    arcpy.SetParameterAsText(pni["raster_function_arguments_json"], rfx_args_json)

    if not out_raster_name.endswith(Utils.UNEVALUATED_RASTER_FUNCTION_SIGNAL):
        # Standard GP tool path
        in_raster = arcpy.Raster(in_raster)
        in_raster = ApplyEnvironment(in_raster)
        out_raster_afr = Apply(in_raster, "DimensionalMovingStatistics", rfx_args)
        out_raster_afr = ApplyEnvironment(out_raster_afr)
        out_raster_afr.save(out_raster_name)


if __name__ == "__main__":
    DimensionalMovingStatistics()
