"""
 ga_server_findpointclusters.py

 Front end of 'Find Point Clusters' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.utilities import PortalVersion
from gautils.validation import validate_output, validate_greater_than_zero, \
    validate_server_input


if __name__ == '__main__':

    analysis_type = "Find Point Clusters"
    search_distance, search_distance_unit = split_unit(get_value(3))

    if PortalVersion() > 7.1:
        
        search_duration, search_duration_unit = split_unit(get_value(8))
            
        use_time = get_value(7, dict=d.use_time)
        time_method = 'Linear' if use_time == 'TRUE' else 'None'

        params = dict(inputLayer=get_value(0, as_value=True),
                      minFeaturesCluster=get_value(2),
                      searchDistance=search_distance,
                      searchDistanceUnit=search_distance_unit,
                      clusterMethod=get_value(6),
                      timeMethod=time_method,
                      searchDuration=search_duration,
                      searchDurationUnit=search_duration_unit,
                      outputName=get_value(1))
    else:
        
        params = dict(inputLayer=get_value(0, as_value=True),
                      minFeaturesCluster=get_value(2),
                      searchDistance=search_distance,
                      searchDistanceUnit=search_distance_unit,
                      clusterMethod=get_value(6),
                      outputName=get_value(1))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(4, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(5, output)

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.once = True
        # self.params[0].filter.list = ['BigDataFileShare']

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        if PortalVersion() < 6.3:
            self.params[6].filter.list = ["DBSCAN"]
        else:
            self.params[6].filter.list = ["DBSCAN", "HDBSCAN"]

        if PortalVersion() < 7.3:
            self.params[7].enabled = False
            self.params[8].enabled = False

        cluster_method = self.params[6].valueAsText
        if cluster_method == "HDBSCAN":
            self.params[3].enabled = False
            self.params[7].enabled = False
            self.params[8].enabled = False
            self.params[3].value = None
            self.params[7].value = False
            self.params[8].value = None
        elif cluster_method == "DBSCAN":
            self.params[3].enabled = True
            if PortalVersion() >= 7.3:
                self.params[7].enabled = True
                use_time = self.params[7].value
                if use_time:
                    self.params[8].enabled = True
                else:
                    self.params[8].enabled = False
                    self.params[8].value = None

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

        if PortalVersion() < 10.3:  # 11.1
            self.params[3].filter.list = list(d.linear_units_old.values())

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 6.1:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        point_layer = self.params[0].valueAsText
        min_points = self.params[2].value
        search_dist = self.params[3].valueAsText
        use_time = self.params[7].value
        search_dur = self.params[8].valueAsText
        cluster_method = self.params[6].valueAsText

        if point_layer:
            try:
                d = arcpy.Describe(self.params[0])
            except:
                d = ""
            if getattr(d, 'shapetype', None) != 'Point':
                self.params[0].setIDMessage('ERROR', 366)
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])

        if min_points is not None:
            if not min_points > 1:
                self.params[2].setIDMessage('ERROR', 120146,
                                            self.params[2].displayName)

        if search_dist:
            if not validate_greater_than_zero(search_dist):
                self.params[3].setIDMessage('ERROR', 323)

        if cluster_method == "DBSCAN":
            if self.params[3].value is None:
                self.params[3].setIDMessage("ERROR", 735)
            if use_time:
                if not search_dur:
                    self.params[8].setIDMessage("ERROR", 530)
