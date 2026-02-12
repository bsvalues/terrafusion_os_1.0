"""
 summarizeNearBy.py

 Front end of 'Summarize NearBy' Spatial Analysis Portal tool.

"""

import arcpy
import json

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import get_value, param_cleanup, set_context


if __name__ == '__main__':

    analysis_type = "SummarizeNearby"

    params = dict(sumNearbyLayer=get_value(0, as_value=True),
                  summaryLayer=get_value(1, as_value=True),
                  outputName=get_value(2, output=True),
                  nearType=get_value(3, as_value=True),
                  distances=get_value(4, as_value=True),
                  units=get_value(5, as_value=True),
                  timeOfDay=get_value(6),
                  timeZoneForTimeOfDay=get_value(7, as_value=True),
                  returnBoundaries=get_value(8, as_value=True),
                  sumShape=get_value(9, as_value=True),
                  shapeUnits=get_value(10, as_value=True),
                  summaryFields=get_value(11, as_list=True),
                  groupByField=get_value(12),
                  minorityMajority=get_value(13, as_value=True),
                  percentShape=get_value(14, as_value=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                   arcpy.env.extent)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type, helper_services='analysis')
    output = ga.run_portal_tool(params)
    if isinstance(output[0], str):
        arcpy.SetParameterAsText(15, json.loads(output[0])['url'])
    else:
        arcpy.SetParameter(15, output[0])

    if output[1] and isinstance(output[1], str):
        arcpy.SetParameterAsText(16, json.loads(output[1])['url'])
    elif output[1]:
        arcpy.SetParameter(16, output[1])
