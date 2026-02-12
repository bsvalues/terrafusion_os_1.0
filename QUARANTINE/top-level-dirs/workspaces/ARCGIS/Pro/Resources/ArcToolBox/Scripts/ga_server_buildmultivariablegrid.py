"""
 ga_server_buildmultivariablegrid.py

 Front end of 'Build Multi-Variable Grid' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context


if __name__ == '__main__':

    analysis_type = "Build Multi Variable Grid"

    bin_size, bin_size_unit = split_unit(get_value(1))

    input_layers, variable_calculations = get_value(2, as_value=True, val_table='bmvg_parameters')

    params = dict(binType=get_value(0),
                  binSize=bin_size,
                  binSizeUnit=bin_size_unit,
                  inputLayers=input_layers,
                  variableCalculations=variable_calculations,
                  outputName=get_value(3)
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(5, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(4, output)