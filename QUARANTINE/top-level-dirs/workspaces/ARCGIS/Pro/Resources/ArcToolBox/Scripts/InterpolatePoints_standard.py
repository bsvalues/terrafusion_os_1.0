"""
 InterpolatePoints_standard.py

 Front end of 'Interpolate Points' portal analysis tool.

"""

import json
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import get_value, param_cleanup


DEBUG = False


if __name__ == '__main__':

    analysis_type = "Interpolate Points"
    params = dict(inputLayer=get_value(0,as_value=True),
                  field=get_value(2),
                  outputName=get_value(1, output=True),
                  interpolateOption=get_value(3),
                  outputPredictionError=get_value(4, as_value=True),
                  classificationType=get_value(5),
                  numClasses=get_value(6),
                  classBreaks=get_value(7, as_value=True),
                  boundingPolygonLayer=get_value(8),
                  predictAtPointLayer=get_value(9),
                  )

    params = param_cleanup(params)

    if DEBUG:
        arcpy.AddWarning(params)
    ga = GeospatialAnalysisTasks(analysis_type, "analysis")
    output = ga.run_portal_tool(params)
    if isinstance(output[0], str):
        arcpy.SetParameterAsText(10, json.loads(output[0])['url'])
    else:
        arcpy.SetParameter(10, output[0])
    if output[1] and isinstance(output[1], str):
        arcpy.SetParameterAsText(11, json.loads(output[1])['url'])
    elif output[1]:
        arcpy.SetParameter(11, output[1])
    if output[2] and isinstance(output[2], str):
        arcpy.SetParameterAsText(12, json.loads(output[2])['url'])
    elif output[2]:
        arcpy.SetParameter(12, output[2])
