"""
 FindHotSpots.py

 Front end of 'Find Hot Spots' portal analysis tool.

"""

import time
import sys
import json

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context, get_url


DEBUG = False


if __name__ == '__main__':

    analysis_type = "FindHotSpots"
    params = dict(analysisLayer=get_value(0,as_value=True),
                  analysisField=get_value(2),
                  dividedByField=get_value(3),
                  boundingPolygonLayer=get_value(4),
                  aggregationPolygonLayer=get_value(5),
                  outputName=get_value(1, output=True),
                  )
    #params = dict(analysisLayer='{"url":"http://GPPortal.esri.com/server/rest/services/Hosted/us_counties/FeatureServer/0"}', analysisField="ASIAN", outputName='{"serviceProperties":{"name":"Hot_spot"}}')
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent)

    params = param_cleanup(params)

    if DEBUG:
        arcpy.AddWarning(params)
    ga = GeospatialAnalysisTasks(analysis_type, helper_services="analysis")
    output = ga.run_portal_tool(params)
    if isinstance(output[0], str):
        arcpy.SetParameterAsText(6, get_url(output[0]))
    else:
        arcpy.SetParameter(6, output[0])
