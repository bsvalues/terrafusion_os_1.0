"""
 ga_server_summarizewithin.py

 Front end of 'Summarize Within' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, split_unit, set_context
from gautils.utilities import PortalVersion
from gautils.validation import validate_output, validate_is_projected_cs, validate_greater_than_zero, validate_server_input


if __name__ == '__main__':

    analysis_type = "Summarize Within"

    polygon_or_bin = get_value(2)
    if polygon_or_bin == 'POLYGON':
        bin_type = None
        bin_size, bin_size_unit = None, None
        sum_within_layer = get_value(5, as_value=True)
    else:  # polygon_or_bin == 'BIN'
        bin_type = get_value(3)
        bin_size, bin_size_unit = split_unit(get_value(4))
        sum_within_layer = None

    standardSummaryFields, rateFieldsStd = get_value(8, val_table='sum_within_summary_fields', as_value=True, weighted_stats=False)
    weightedSummaryFields, rateFieldsWtd = get_value(9, val_table='sum_within_summary_fields', as_value=True, weighted_stats=True)
    rateFields = list(set(rateFieldsStd+rateFieldsWtd))

    if PortalVersion() < 10.3:  # 11.1
        sunits = get_value(7, dict={**d.area_units_old, **d.linear_units_old})
    else:
        sunits = get_value(7, dict={**d.area_units, **d.linear_units})

    params = dict(summarizedLayer=get_value(0, as_value=True),
                  outputName=get_value(1),
                  binType=bin_type,
                  binSize=bin_size,
                  binSizeUnit=bin_size_unit,
                  summaryPolygons=sum_within_layer,
                  sumShape=get_value(6, as_value=True),
                  shapeUnits=sunits,
                  standardSummaryFields=standardSummaryFields,
                  weightedSummaryFields=weightedSummaryFields)

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(11, dict=d.datastore),
                                    geoanalytics=True)

    if PortalVersion() >= 6.1:
        params['groupByField'] = get_value(12)
        params['minorityMajority'] = get_value(13)
        params['percentShape'] = get_value(14)
    if PortalVersion() >= 10.1:
        params['rateFields'] = str(rateFields).replace(",", ";").replace("[", "").replace("]", "").replace("'", "")

    params = param_cleanup(params)

    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    if isinstance(output, list):
        arcpy.SetParameterAsText(10, output[0])
        if output[1]:
            arcpy.SetParameterAsText(15, output[1])
    else:
        arcpy.SetParameterAsText(10, output)


class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        self.once = True

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""
        return

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[8].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text",
                                     "Date"]
            self.params[9].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double"]
            self.params[12].filter.list = ["Short", "Long", "BigInteger", "Text", "Date"]

        if self.once:
            self.once = False
            if PortalVersion() < 6.1:
                self.params[12].enabled = False
                self.params[13].enabled = False
                self.params[14].enabled = False

        summarized_layer = self.params[0].valueAsText
        polygon_or_bin = self.params[2].valueAsText
        sum_shape = self.params[6].value

        output_name = self.params[1].valueAsText
        if output_name:
            self.params[1].value = validate_output(output_name)

        if summarized_layer:
            try:
                shapetype = arcpy.Describe(self.params[0]).shapetype
            except:
                shapetype = ""
            if sum_shape:
                if PortalVersion() < 10.3:  # 11.1
                    if shapetype == 'Polygon':
                        self.params[7].filter.list = list(d.area_units_old.keys())
                        self.params[7].enabled = True
                    elif shapetype == 'Polyline':
                        self.params[7].filter.list = list(d.linear_units_old.keys())
                        self.params[7].enabled = True
                    elif shapetype == 'Point':
                        self.params[7].enabled = False
                else:
                    if shapetype == 'Polygon':
                        self.params[7].filter.list = list(d.area_units.keys())
                        self.params[7].enabled = True
                    elif shapetype == 'Polyline':
                        self.params[7].filter.list = list(d.linear_units.keys())
                        self.params[7].enabled = True
                    elif shapetype == 'Point':
                        self.params[7].enabled = False
            else:
                self.params[7].enabled = False
                self.params[7].value = None

            if shapetype == 'Point':
                self.params[9].enabled = False
            else:
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

        if PortalVersion() < 6.1:
            if self.params[12].value == None:
                self.params[13].value = False
                self.params[13].enabled = False
                self.params[14].value = False
                self.params[14].enabled = False

            else:
                self.params[13].enabled = True
                self.params[14].enabled = True

            # enable percentages if minmaj is checked
            if self.params[13].value:
                self.params[14].enabled = True
            else:
                self.params[14].enabled = False
                self.params[14].value = None

        if PortalVersion() < 9.1:  # Weighted SD and VAR not available before 10.9.1
            self.params[9].filters[1].list = ["COUNT", "SUM", "MEAN", "MIN", "MAX", "RANGE"]
            self.params[8].filters[2].list = ["Count"]
            self.params[9].filters[2].list = ["Count"]

        if PortalVersion() < 10.1 and PortalVersion() > 9.1:  # Weighted COUNT, SUM, MIN, MAX, and RANGE removed at 11.0.0
            # Only allow Count quantity type
            self.params[8].filters[2].list = ["Count"]
            self.params[9].filters[2].list = ["Count"]
            self.params[9].filters[1].list = ["COUNT", "SUM", "MEAN", "MIN", "MAX", "STDDEV", "VAR", "RANGE"]

        if PortalVersion() < 10.3:  # 11.1
            self.params[4].filter.list = list(d.linear_units_old.values())


    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""


        summarized_layer = self.params[0].valueAsText
        polygon_or_bin = self.params[2].valueAsText
        bin_size = self.params[4].valueAsText
        summary_polygons = self.params[5].valueAsText
        sum_shape = self.params[6].value
        shape_units = self.params[7].value

        validate = validate_server_input(self.params[0].valueAsText)
        if not validate[0]:
            self.params[0].setIDMessage('ERROR', validate[1])

        # set polygon_layer or bin_size as required
        if polygon_or_bin == 'POLYGON':
            if self.params[5].value is None:
                self.params[5].setIDMessage("ERROR", 735)
        elif polygon_or_bin == 'BIN':
            if self.params[3].value is None:
                self.params[3].setIDMessage("ERROR", 735)
            if self.params[4].value is None:
                self.params[4].setIDMessage("ERROR", 735)

        if summary_polygons:
            try:
                d = arcpy.Describe(self.params[5])
            except:
                d = ""
            if getattr(d, 'shapetype', None) != 'Polygon':
                self.params[5].setIDMessage('ERROR', 366)
            validate = validate_server_input(self.params[5].valueAsText)
            if not validate[0]:
                self.params[5].setIDMessage('ERROR', validate[1])

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

