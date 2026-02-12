"""
 ga_desktop_refreshbigdataconnectionfile.py

 Front end of 'Refresh Big Data Connection' GeoAnalytics Desktop tool.

"""

import arcpy
import json

from gautils import get_value, param_cleanup, run_ga_desktop_tool
from gautils import dicts as d
from gautils import BigDataConnectionFile

if __name__ == '__main__':

    params = dict(connectionFile=get_value(0),
                  geometryFieldsVisible=get_value(1, dict=d.visible_geometry),
                  timeFieldsVisible=get_value(2, dict=d.visible_time),
                  )

    params = param_cleanup(params)

    refresh_result = {}
    big_data_connection = BigDataConnectionFile(params["connectionFile"])
    validation_dict = BigDataConnectionFile.validate_input_bdc_sourcepath(big_data_connection)
    
    if validation_dict["source_path_validates"]:
        refresh_result = run_ga_desktop_tool('RefreshBigDataConnection', params)['refreshResult']
        refresh_result = json.loads(refresh_result)
    else:
        path = validation_dict["source_folder_path"]
        arcpy.AddIDMessage("ERROR", 120363, path, str(params["connectionFile"]))

    if refresh_result != {} and refresh_result is not None:

        def get_results(result_type):
            count = refresh_result[result_type]['size']
            datasets = [i.strip("'") for i in refresh_result[result_type]['datasets']]
            msg = "\n"
            for dataset in datasets:
                msg += "- {0}\n".format(dataset)

            return count, msg

        success_count, success_msg = get_results('Succeeded')
        failed_count, failed_msg = get_results('Failed')
        skipped_count, skipped_msg = get_results('Skipped')

        if success_count == 0:
            arcpy.AddIDMessage("WARNING", 120284, success_count, success_msg)
        else:
            arcpy.AddIDMessage("INFORMATIVE", 120284, success_count, success_msg)
        arcpy.AddIDMessage("INFORMATIVE", 120285, skipped_count, skipped_msg)
        arcpy.AddIDMessage("INFORMATIVE", 120286, failed_count, failed_msg)

    else:
        pass

    bdc = arcpy.GetParameterAsText(0)
    arcpy.SetParameterAsText(3, bdc)


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters.
        This method is called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        if self.params[0].value:
            self.params[3].value = self.params[0].value

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True
