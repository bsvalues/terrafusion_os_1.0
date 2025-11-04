"""
 CalculateDensity_standard.py

 Front end of 'Calculate Density' portal analysis tool.

"""

import time
import sys
import json

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context


DEBUG = False


if __name__ == '__main__':

    analysis_type = "CalculateDensity"
    params = dict(inputLayer=get_value(0,as_value=True),
                  outputName=get_value(1, output=True),
                  field=get_value(2),
                  cellSize=get_value(3),
                  cellSizeUnits=get_value(4),
                  radius=get_value(5),
                  radiusUnits=get_value(6),
                  boundingPolygonLayer=get_value(7),
                  areaUnits=get_value(8),
                  classificationType=get_value(9),
                  numClasses=get_value(10))
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent)

    params = param_cleanup(params)

    if DEBUG:
        arcpy.AddWarning(params)
    ga = GeospatialAnalysisTasks(analysis_type, helper_services="analysis")
    output = ga.run_portal_tool(params)
    if isinstance(output, str):
        arcpy.SetParameterAsText(11, json.loads(output)["url"])
    else:
        arcpy.SetParameter(11, output)
