"""
 overlaylayers_sa.py

 Front end of 'Overlay Layers' Spatial Analysis tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import get_value, param_cleanup, get_url, set_context


if __name__ == '__main__':

    analysis_type = "Overlay Layers"

    params = dict(inputLayer=get_value(0, as_value=True, input_data=True),
                  overlayLayer=get_value(1, as_value=True, input_data=True),
                  outputName=get_value(2, output=True),
                  overlayType=get_value(3),
                  outputType=get_value(4),
                  snapToInput=get_value(5),
                  tolerance=get_value(6))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type, helper_services='analysis')

    output = ga.run_portal_tool(params)
    if isinstance(output, str):
        arcpy.SetParameterAsText(7, get_url(output))
    else:
        arcpy.SetParameter(7, output)
