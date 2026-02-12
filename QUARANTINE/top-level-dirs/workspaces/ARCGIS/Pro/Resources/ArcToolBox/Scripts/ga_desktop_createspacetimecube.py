"""
 ga_desktop_createspacetimecube.py

 Front end of 'Create Space Time Cube' GeoAnalytics Desktop tool. This tool is not exposed. 

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool


if __name__ == '__main__':

    dist_int, dist_int_unit = split_unit(get_value(2))
    time_step_int, time_step_int_unit = split_unit(get_value(3))

    params = dict(pointLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  binSize=dist_int,
                  binSizeUnit=dist_int_unit,
                  timeStepInterval=time_step_int,
                  timeStepIntervalUnit=time_step_int_unit,
                  timeStepAlignment=get_value(4, dict=d.time_alignment),
                  timeStepReference=get_value(5, datetime_epock=True),
                  summaryFields=get_value(6, as_value=True,
                                          val_table='summary_fields_plus')
                  )

    # Different behavior from other summaryFields parameters if default is used
    # (will fail otherwise)
    if params['summaryFields'] == 'null':
        _ = params.pop('summaryFields', 0)

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('CreateSpaceTimeCube', params)
    arcpy.AddIDMessage('INFORMATIVE', 86174)



