"""
 mergelayers_sa.py

 Front end of 'Merge Layers' Spatial Analysis tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import get_value, get_url, param_cleanup, set_context


if __name__ == '__main__':

    analysis_type = "Merge Layers"

    # TODO: some work to do on mergingAttributes in validation
    params = dict(inputLayer=get_value(0, as_value=True, input_data=True),
                  mergeLayer=get_value(1, as_value=True, input_data=True),
                  outputName=get_value(2, output=True),
                  mergingAttributes=get_value(3, as_list=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type, helper_services='analysis')

    output = ga.run_portal_tool(params)
    if isinstance(output, str):
        arcpy.SetParameterAsText(4, get_url(output))
    else:
        arcpy.SetParameter(4, output)
