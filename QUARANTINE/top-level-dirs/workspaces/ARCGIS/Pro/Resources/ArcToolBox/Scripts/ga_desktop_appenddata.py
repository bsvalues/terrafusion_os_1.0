"""
 ga_desktop_appenddata.py

 Front end of 'Append Data' GeoAnalytics Desktop tool. This tool is not exposed to users. 

"""

import arcpy

from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool
from gautils import format_mapping_append


if __name__ == '__main__':

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  appendLayer=get_value(1, as_value = True, local_feature_layer=True))

    ## CONTEXT: ONLY PASS BUT EXTENT FOR APPEND DATA
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)
                                    
    ## set value table variables
    vtf = get_value(3, as_value=True)
    vte = get_value(4, as_value=True)

    ## set fieldMapping param based on format_att_matchhing()
    params["fieldMapping"] = format_mapping_append(vtf, vte)

    params = param_cleanup(params)
    run_ga_desktop_tool('AppendData', params)

    arcpy.SetParameter(5, arcpy.GetParameterAsText(0))

