"""
 aggregatepoints.py

 Front end of 'Aggregate Points' GeoAnalytics tool.

"""

import time
import sys

import arcpy
import json

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context


if __name__ == '__main__':

    analysis_type = "AggregatePoints"
    params = dict(pointLayer=get_value(0, as_value=True),
                  polygonLayer=get_value(1, as_value=True),
                  outputName=get_value(2, output=True),
                  keepBoundariesWithNoPoints=get_value(3, as_value=True),
                  summaryFields=get_value(4, as_list=True),
                  groupByField=get_value(5),
                  minorityMajority=get_value(6, as_value=True),
                  percentPoints=get_value(7, as_value=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type, helper_services='analysis')
    output = ga.run_portal_tool(params)
    if isinstance(output[0], str):
        arcpy.SetParameterAsText(8, json.loads(output[0])['url'])
    else:
        arcpy.SetParameter(8, output[0])

    if output[1] and isinstance(output[1], str):
        arcpy.SetParameterAsText(9, json.loads(output[1])['url'])
    elif output[1]:
        arcpy.SetParameter(9, output[1])



