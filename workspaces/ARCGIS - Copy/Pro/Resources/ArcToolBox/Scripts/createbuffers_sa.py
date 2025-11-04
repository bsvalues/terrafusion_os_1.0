"""
 createbuffers_sa.py

 Front end of 'Create Buffers' standard portal tool.

"""

import time
import sys
import json

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context


DEBUG = False


if __name__ == '__main__':

    analysis_type = "Create Buffers"
    # todo: need to figure out how to incorporate 'field'
    # todo: can't make composite datatype work on UI. Limitation?
    params = dict(inputLayer=get_value(0, as_value=True),
                  outputName=get_value(1, output=True),
                  distances=get_value(2, as_list=True),
                  field=get_value(3),
                  units=get_value(4),
                  dissolveType=get_value(5),
                  ringType=get_value(6),
                  sideType=get_value(7),
                  endType=get_value(8))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent)

    params = param_cleanup(params)

    if DEBUG:
        arcpy.AddWarning(params)
    ga = GeospatialAnalysisTasks(analysis_type, helper_services='analysis')
    output = ga.run_portal_tool(params)
    if isinstance(output, str):
        arcpy.SetParameterAsText(9, json.loads(output)["url"])
    else:
        arcpy.SetParameter(9, output)
