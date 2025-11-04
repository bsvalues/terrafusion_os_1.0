"""
 ga_desktop_calculatefield.py

 Front end of 'Calculate Field' GeoAnalytics Desktop tool.

"""

import arcpy

from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_input_source, validate_desktop_output, verifyFieldExists, validate_time_boundary, \
    time_validation_desktop_instant_only
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    time_bound_split, time_bound_split_unit = split_unit(get_value(9))
    input_layer = get_value(0, as_value = True, local_feature_layer=True)

    field_to_calculate = get_value(2)
    if field_to_calculate == 'NEW_FIELD':
        field_name = get_value(3)
        data_type = get_value(5, dict=d.datatype).title()
    elif field_to_calculate == 'EXISTING_FIELD':
        field_name = get_value(4)
        data_type = [field for field in arcpy.ListFields(get_value(0), field_name)][0].type
        if data_type == 'SmallInteger':
            data_type = 'Integer'
        if data_type == 'Single':
            data_type = 'Double'

    params = dict(inputLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  fieldName=field_name,
                  dataType=data_type,
                  expression=get_value(6),
                  trackAware=str(get_value(7, as_value=True)),
                  trackFields=get_value(8, as_list=True),
                  timeBoundarySplit=time_bound_split,
                  timeBoundarySplitUnit=time_bound_split_unit,
                  timeBoundaryReference=get_value(10, datetime_epoch=True))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)

    params = param_cleanup(params)
    
    run_ga_desktop_tool('CalculateField', params, {"output":1})


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

        input_features = self.params[0].valueAsText

        if input_features:
            try:
                d_input = arcpy.Describe(self.params[0])
            except:
                d_input = ""

            # output validation based on the search layer
            if d_input.datatype.lower().find(
                    "record") > -1 or d_input.datatype.lower().find(
                    "table") > -1:
                self.params[1].value = validate_desktop_output(
                    self.params[1].valueAsText, True)
            else:
                self.params[1].value = validate_desktop_output(
                    self.params[1].valueAsText, False)

        field_to_calculate = self.params[2].value

        if field_to_calculate == "NEW_FIELD":
            self.params[3].enabled = True
            self.params[4].enabled = False
            self.params[5].enabled = True
            self.params[4].value = None
        if field_to_calculate == "EXISTING_FIELD":
            self.params[3].enabled = False
            self.params[4].enabled = True
            self.params[5].enabled = False
            self.params[3].value = None
            self.params[5].value = None

        if self.params[7].value:
            self.params[8].enabled = True
            self.params[9].enabled = True
            self.params[10].enabled = True
        else:
            self.params[8].enabled = False
            self.params[9].enabled = False
            self.params[10].enabled = False

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        field_to_calculate = self.params[2].value
        field_name = self.params[3].value
        existing_field = self.params[4].value
        field_type = self.params[5].value
        track_aware = self.params[7].value
        time_boundary_params = {"split":9, "reference":10}
        time_boundary_split = self.params[time_boundary_params["split"]].valueAsText
        time_boundary_reference = self.params[time_boundary_params["reference"]].valueAsText

        input_layer = self.params[0].value

        if input_layer:
            try:
                d_layer = arcpy.Describe(self.params[0])
            except:
                d_layer = ""

            # input validation
            valid_input = validate_input_source(d_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

            # time validation
            if track_aware == True:
                time_validation_desktop_instant_only(self.params[0], self.params[7], d_layer)

        if field_to_calculate == "NEW_FIELD":
            if field_name is None:
                self.params[3].setIDMessage("ERROR", 735)
            if field_type is None:
                self.params[5].setIDMessage("ERROR", 735)
        if field_to_calculate == "EXISTING_FIELD":
            if existing_field is None:
                self.params[4].setIDMessage("ERROR", 735)

        if track_aware == True:
            if self.params[8].value is None:
                self.params[8].setIDMessage("ERROR", 735)

        if self.params[10].value is not None:
            if self.params[9].value is None:
                self.params[9].setIDMessage("ERROR", 735)

        validate_time_boundary(self, time_boundary_split, time_boundary_reference, time_boundary_params)

        # check if new field entered by the user already exists
        if field_name:
            try:
                if verifyFieldExists(input_layer, field_name):
                    self.params[3].setIDMessage("ERROR", 2598, self.params[3].value)
            except:
                pass
