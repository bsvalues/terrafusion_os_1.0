"""
 ga_desktop_summarizecenteranddispersion.py

 Front end of 'Summarize Center And Dispersion' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.utilities import format_scad_summary_types_desktop
from gautils.validation import validate_desktop_output, validate_input_source


if __name__ == '__main__':

    analysis_type = "Summarize Center And Dispersion"

    centralFeature = get_value(1)
    meanCenter = get_value(2)
    medianCenter = get_value(3)
    ellipse = get_value(4)

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  summaryType=format_scad_summary_types_desktop(centralFeature, meanCenter, medianCenter, ellipse),
                  centralFeatureLayer=get_value(1, local_feature_output=True),
                  meanCenterLayer=get_value(2, local_feature_output=True),
                  medianCenterLayer=get_value(3, local_feature_output=True),
                  ellipseLayer=get_value(4, local_feature_output=True),
                  ellipseSize=get_value(5, dict=d.ellipse_size),
                  weightField=get_value(6),
                  groupFields=get_value(7, as_list=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    run_ga_desktop_tool('SummarizeCenterAndDispersion', params, {"centralFeatureLayer":1, "meanCenterLayer":2, "medianCenterLayer":3, "ellipseLayer":4})


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

        self.params[5].enabled = False

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""
        # Output validation
        self.params[1].value = validate_desktop_output(self.params[1].valueAsText, False)
        self.params[2].value = validate_desktop_output(self.params[2].valueAsText, False)
        self.params[3].value = validate_desktop_output(self.params[3].valueAsText, False)
        self.params[4].value = validate_desktop_output(self.params[4].valueAsText, False)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""
        input_layer = self.params[0].value
        centralfeature_layer = self.params[1].value
        meancenter_layer = self.params[2].value
        mediancenter_layer = self.params[3].value
        ellipse_layer = self.params[4].value
        
        # Describe input layer
        if input_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""
        # Input validation (event layers, https)
        valid_input = validate_input_source(d_layer)
        if not valid_input[0]:
            self.params[0].setIDMessage('ERROR', valid_input[1])

        # At least one summary type is required
        if centralfeature_layer == None and meancenter_layer == None and mediancenter_layer == None and ellipse_layer == None:
            self.params[1].setIDMessage("ERROR", 530)
            self.params[2].setIDMessage("ERROR", 530)
            self.params[3].setIDMessage("ERROR", 530)
            self.params[4].setIDMessage("ERROR", 530)

        # Show ellipse size if ellipse is selected
        if ellipse_layer:
            self.params[5].enabled = True
            if not self.params[5].altered:
                self.params[5].value = "1_STANDARD_DEVIATION"
            if self.params[5].value is None:
                self.params[5].setIDMessage("ERROR", 530)
        else:
            self.params[5].enabled = False
            self.params[5].value = ""