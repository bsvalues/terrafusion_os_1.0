"""
 ga_desktop_findPointClusters.py

 Front end of 'Find Point Clusters' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils import dicts as d
from gautils.validation import validate_output, validate_greater_than_zero, \
    validate_desktop_output, validate_input_source, time_validation_desktop_instant_only


if __name__ == '__main__':

    search_distance, search_distance_unit = split_unit(get_value(4))
    search_duration, search_duration_unit = split_unit(get_value(6))

    use_time = get_value(5, dict=d.use_time)
    time_method = 'Linear' if use_time == 'TRUE' else 'None'

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  minFeaturesCluster=get_value(3, as_value=True),
                  searchDistance=search_distance,
                  searchDistanceUnit=search_distance_unit,
                  clusterMethod=get_value(2),
                  timeMethod=time_method,
                  searchDuration=search_duration,
                  searchDurationUnit=search_duration_unit,
                  output=get_value(1, local_feature_output=True))
                  
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('FindPointClusters', params, {"output":1})

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        self.params[1].value = validate_desktop_output(
            self.params[1].valueAsText, False)  # output validation

        cluster_method = self.params[2].valueAsText
        if cluster_method == "HDBSCAN":
            self.params[4].enabled = False
            self.params[5].enabled = False
            self.params[6].enabled = False
            self.params[4].value = None
            self.params[5].value = False
            self.params[6].value = None
        elif cluster_method == "DBSCAN":
            self.params[4].enabled = True
            self.params[5].enabled = True
            use_time = self.params[5].value
            if use_time:
                self.params[6].enabled = True
            else:
                self.params[6].enabled = False
                self.params[6].value = None

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        point_layer = self.params[0].valueAsText
        min_points = self.params[3].value
        search_dist = self.params[4].valueAsText
        cluster_method = self.params[2].valueAsText
        use_time = self.params[5].value
        search_dur = self.params[6].valueAsText

        if point_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""

            # input validation
            valid_input = validate_input_source(d_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

            # time validation
            if use_time:
                time_validation_desktop_instant_only(self.params[0], self.params[5], d_layer)

        if cluster_method == "DBSCAN":
            if self.params[4].value is None:
                self.params[4].setIDMessage("ERROR", 735)
            if use_time:
                if not search_dur:
                    self.params[6].setIDMessage("ERROR", 530)

        if min_points is not None:
            if not min_points > 1:
                self.params[3].setIDMessage('ERROR', 120146,
                                            self.params[3].displayName)

        if search_dist:
            if not validate_greater_than_zero(search_dist):
                self.params[4].setIDMessage('ERROR', 323)
