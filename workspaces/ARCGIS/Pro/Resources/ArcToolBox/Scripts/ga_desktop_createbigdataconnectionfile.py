"""
 ga_desktop_createbigdataconnectionfile.py

 Front end of 'Create Big Data Connection' GeoAnalytics Desktop tool.

"""

import arcpy
import os
import json

from gautils import get_value, param_cleanup, run_ga_desktop_tool
from gautils import dicts as d
from gautils.validation import invalid_bdc_characters


if __name__ == '__main__':

    mfcname = str(get_value(1))

    params = dict(connectionFile=os.path.join(get_value(0), mfcname + ".mfc"),
                  connectionType=get_value(2),
                  bigDataConnectionSourcePath=get_value(3),
                  geometryFieldsVisible=get_value(4, dict=d.visible_geometry),
                  timeFieldsVisible=get_value(5, dict=d.visible_time)
                  )

    params = param_cleanup(params)
    registration_result = {}
    try:
        registration_result = run_ga_desktop_tool('CreateBigDataConnection', params)['registrationResult']
        registration_result = json.loads(registration_result)
    except Exception as e:
        arcpy.AddIDMessage("ERROR", 120379)

    if registration_result != {} and registration_result is not None:
        
        def get_results(result_type):
            count = registration_result[result_type]['size']
            datasets = [i.strip("'") for i in registration_result[result_type]['datasets']]
            msg = "\n"
            for dataset in datasets:
                msg += "- {0}\n".format(dataset)
            
            return count, msg

        success_count, success_msg = get_results('Succeeded')
        failed_count, failed_msg = get_results('Failed')
        
        if success_count == 0:
            arcpy.AddIDMessage("WARNING", 120284, success_count, success_msg)
        else:
            arcpy.AddIDMessage("INFORMATIVE", 120284, success_count, success_msg)
        arcpy.AddIDMessage("INFORMATIVE", 120286, failed_count, failed_msg)

    mfc = params['connectionFile']
    arcpy.SetParameterAsText(6, mfc)


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
        if self.params[3].valueAsText:
            self.params[3].value = self.params[3].valueAsText.strip()

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        output_name = self.params[1].value
        if output_name:
            invalid_chars = invalid_bdc_characters(output_name)
            if invalid_chars:
                self.params[1].setIDMessage("ERROR", 120274)

        if self.params[3].value is None:
            self.params[3].setIDMessage("ERROR", 735)

        # Validation that subfolders exist in the specified folder
        else:
            path = self.params[3].valueAsText
            try:
                list_subfolders_with_paths = [f.path for f in os.scandir(path)
                                              if f.is_dir()]
                if len(list_subfolders_with_paths) < 1:
                    self.params[3].setIDMessage("ERROR", 120275)
            except Exception as e:
                # This is to handle when it doesn't exist (like in MB)
                pass

        # Set output parameter as MFC path
        if self.params[0].value:
            if output_name:
                mfc = os.path.join(self.params[0].valueAsText, output_name + ".mfc")
                self.params[6].value = mfc

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True
