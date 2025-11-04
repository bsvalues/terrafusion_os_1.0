"""
 ga_desktop_copydatasetfrombigdataconnection.py

 Front end of 'Copy Dataset From Big Data Connection' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import get_value, param_cleanup, run_ga_desktop_tool, set_context
from gautils.validation import validate_desktop_output, validate_server_input
from gautils import BigDataConnectionFile

import ntpath

if __name__ == '__main__':
    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True)
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)

    input_path = str(get_value(0, as_value=True))
    bdc, dataset = ntpath.split(input_path)
    bdc = str(bdc).strip("'")
    big_data_connection = BigDataConnectionFile(bdc)
    validation_dict = BigDataConnectionFile.validate_input_bdc_sourcepath(big_data_connection)
    if validation_dict["source_path_validates"]:
        run_ga_desktop_tool('CopyDataset', params)
    else:
        path = validation_dict["source_folder_path"]
        arcpy.AddIDMessage("ERROR", 120363, path, bdc)



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

        in_bdc = self.params[0]
        if in_bdc:
            # Validate the output data type based on the input type (table vs. geometry)
            try:
                d_bdc = arcpy.Describe(in_bdc)
            except:
                d_bdc = ""

            if hasattr(d_bdc, 'shapetype'):
                self.params[1].value = validate_desktop_output(
                    self.params[1].valueAsText, False)  # output validation
            else:
                self.params[1].value = validate_desktop_output(
                    self.params[1].valueAsText, True)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        in_bdc = self.params[0].valueAsText
        validate = validate_server_input(in_bdc)
        if validate[0]:
            self.params[0].setIDMessage('ERROR', 120295)

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True
