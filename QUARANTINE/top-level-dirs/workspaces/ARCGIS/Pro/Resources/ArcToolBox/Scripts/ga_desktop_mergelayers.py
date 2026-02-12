"""
 ga_desktop_mergelayers.py

 Front end of 'Merge Layers' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import get_value, param_cleanup, set_context, run_ga_desktop_tool


if __name__ == '__main__':

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  mergeLayer=get_value(1, as_value = True, local_feature_layer=True),
                  outputName=get_value(2, local_feature_output=True),
                  mergingAttributes=get_value(3, as_value=True, val_table='merge_layers'))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('MergeLayers', params)