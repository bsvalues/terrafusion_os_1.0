"""
 ga_desktop_summarizewithin.py

 Front end of 'Summarize Within' GeoAnalytics Desktop tool.

"""

import arcpy
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context, run_ga_desktop_tool
from gautils.validation import validate_is_projected_cs, validate_desktop_output, \
    validate_greater_than_zero, validate_input_source

if __name__ == '__main__':

    polygon_or_bin = get_value(2).upper()
    if polygon_or_bin == 'POLYGON':
        bin_type = None
        bin_size, bin_size_unit = None, None
        sum_within_layer = get_value(5, as_value = True, local_feature_layer=True)
    else:  # polygon_or_bin == 'BIN'
        bin_type = get_value(3).title()
        bin_size, bin_size_unit = split_unit(get_value(4))
        sum_within_layer = None

    standardSummaryFields, rateFieldsStd = get_value(8, val_table='sum_within_summary_fields', as_value=True, weighted_stats=False)
    weightedSummaryFields, rateFieldsWtd = get_value(9, val_table='sum_within_summary_fields', as_value=True, weighted_stats=True)
    rateFields = list(set(rateFieldsStd+rateFieldsWtd))

    params = dict(summarizedLayer=get_value(0, as_value = True, local_feature_layer=True),
                  output=get_value(1, local_feature_output=True),
                  binType=bin_type,
                  binSize=bin_size,
                  binSizeUnit=bin_size_unit,
                  summaryPolygons=sum_within_layer,
                  sumShape=str(get_value(6, as_value=True)),
                  shapeUnits=get_value(7, dict={**d.area_units, **d.linear_units}),
                  standardSummaryFields=standardSummaryFields,
                  weightedSummaryFields=weightedSummaryFields,
                  groupByField=get_value(10),
                  minorityMajority=get_value(11),
                  percentShape=get_value(12),
                  groupBySummary=get_value(13, local_feature_output=True),
                  rateFields=rateFields
                  )

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    desktop_context=True)
    
    # clean up the group parameter values in execution
    if not params['groupByField']:
        params['minorityMajority'] = None
        params['percentShape'] = None
        params['groupBySummary'] = None
    
    params = param_cleanup(params)
    run_ga_desktop_tool('SummarizeWithin', params, {"output":1})

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
        self.params[13].value = validate_desktop_output(
            self.params[13].valueAsText, True)  # output validation

        summarized_layer = self.params[0].valueAsText
        polygon_or_bin = self.params[2].valueAsText
        sum_shape = self.params[6].value

        if summarized_layer:
            try:
                shapetype = arcpy.Describe(self.params[0]).shapetype
            except:
                shapetype = ""
            if shapetype == 'Point':
                self.params[6].enabled = False
                self.params[7].enabled = False
                self.params[7].value = None
                self.params[9].enabled = False
            else:
                self.params[6].enabled = True
                if sum_shape:
                    self.params[7].enabled = True
                    if shapetype == 'Polygon':
                        self.params[7].filter.list = list(d.area_units.keys())
                    elif shapetype == 'Polyline':
                        self.params[7].filter.list = list(d.linear_units.keys())
                else:
                    self.params[7].enabled = False
                self.params[9].enabled = True

        if polygon_or_bin == 'POLYGON':
            self.params[3].enabled = False
            self.params[3].value = None
            self.params[4].enabled = False
            self.params[4].value = None
            self.params[5].enabled = True
        elif polygon_or_bin == 'BIN':
            self.params[3].enabled = True
            self.params[4].enabled = True
            self.params[5].enabled = False
            self.params[5].value = None
            # if not self.params[3].value:
            #    self.params[3].value = 'SQUARE'
            self.params[4].enabled = True

        if self.params[10].value == None:
            self.params[11].value = False
            self.params[12].value = False
            self.params[13].value = ""
            self.params[11].enabled = False
            self.params[12].enabled = False
            self.params[13].enabled = False

        else:
            self.params[11].enabled = True
            self.params[12].enabled = True
            self.params[13].enabled = True

        # enable percentages if minmaj is checked
        if self.params[11].value:
            self.params[12].enabled = True
        else:
            self.params[12].enabled = False
            self.params[12].value = None

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        summarized_layer = self.params[0].valueAsText
        polygon_or_bin = self.params[2].valueAsText
        bin_size = self.params[4].valueAsText
        summary_polygons = self.params[5].valueAsText
        group_by_summary = self.params[13].valueAsText
        sum_shape = self.params[6].value
        shape_units = self.params[7].value

        group_by_field = self.params[10].value

        if summarized_layer:
            try:
                d_summarized_layer = arcpy.Describe(self.params[0])
            except:
                d_summarized_layer = ""
            # input validation 
            valid_input = validate_input_source(d_summarized_layer)
            if not valid_input[0]:
                self.params[0].setIDMessage('ERROR', valid_input[1])

        if summary_polygons:
            try:
                d_summary_polygons = arcpy.Describe(self.params[5])
            except:
                d_summary_polygons = ""
            # input validation 
            valid_input = validate_input_source(d_summary_polygons)
            if not valid_input[0]:
                self.params[5].setIDMessage('ERROR', valid_input[1])

        if group_by_summary:
            try:
                d_group_by_summary = arcpy.Describe(self.params[13])
            except:
                d_group_by_summary = ""
            if d_group_by_summary.catalogPath.upper().startswith("HTTP"):
                self.params[13].setIDMessage("ERROR", 160938)

        if group_by_field is not None:
            if self.params[13].value is None:
                self.params[13].setIDMessage("ERROR", 735)

        # set polygon_layer or bin_size as required
        if polygon_or_bin == 'POLYGON':
            if self.params[5].value is None:
                self.params[5].setIDMessage("ERROR", 735)
        elif polygon_or_bin == 'BIN':
            if self.params[3].value is None:
                self.params[3].setIDMessage("ERROR", 735)
            if self.params[4].value is None:
                self.params[4].setIDMessage("ERROR", 735)

        #if summary_polygons:
        #    try:
        #        d = arcpy.Describe(self.params[5])
        #    except:
        #        d = ""
        #    if getattr(d, 'shapetype', None) != 'Polygon':
        #        self.params[5].setIDMessage('ERROR', 366)

        if bin_size:
            if not validate_greater_than_zero(bin_size):
                self.params[4].setIDMessage('ERROR', 323)

        if sum_shape == True:
            if shape_units is None:
                if summarized_layer:
                    try:
                        shapetype = arcpy.Describe(self.params[0]).shapetype
                    except:
                        shapetype = ""
                    if shapetype != 'Point':
                        self.params[7].setIDMessage("ERROR", 735)
