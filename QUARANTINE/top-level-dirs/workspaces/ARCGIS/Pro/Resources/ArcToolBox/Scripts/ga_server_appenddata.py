"""
 ga_server_appenddata.py

 Front end of 'Append Data' GeoAnalytics Server tool.

"""
import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context, valuetable_to_list
from gautils import format_field_mapping, format_expression_mapping, format_mapping_append
from gautils.validation import validate_server_input
from gautils.utilities import PortalVersion


if __name__ == '__main__':

    analysis_type = "Append Data"
    params = dict(inputLayer=get_value(0, as_value=True),
                  appendLayer=get_value(1, as_value=True))

    ## CONTEXT: ONLY PASS BUT EXTENT FOR APPEND DATA
    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store="",
                                    geoanalytics=True)
    ## set value table variables
    vtf = get_value(3, as_value=True)
    vte = get_value(4, as_value=True)

    ## set fieldMapping param based on format_att_matchhing()
    params["fieldMapping"] = format_mapping_append(vtf, vte)

    params = param_cleanup(params)
    
    ga = GeospatialAnalysisTasks(analysis_type)
    ga.run_portal_tool(params)

    arcpy.SetParameter(5, params['inputLayer'])

class ToolValidator(object):
    """Class for validating a tool's parameter values and controlling
    the behavior of the tool's dialog."""

    def __init__(self):
        """Setup arcpy and the list of tool parameters."""
        self.params = arcpy.GetParameterInfo()
        # self.params[4].controlCLSID = "{F604736F-06D8-47CD-AC15-7055F7FCDAC1}"
        # self.params[1].filter.list = ['BigDataFileShare']

    def initializeParameters(self):
        """Refine the properties of a tool's parameters. This method is
        called when the tool is opened."""

    def updateParameters(self):
        """Modify the values and properties of parameters before internal
        validation is performed. This method is called whenever a parameter
        has been changed."""

        input_layer = self.params[0].value
        append_layer = self.params[1].value
        append_method = self.params[2].value

        # Expose field mapping only if user requested
        self.params[3].enabled = False
        self.params[4].enabled = False
        if append_method == "FIELD_MAPPING":
            self.params[3].enabled = True
            self.params[4].enabled = True

            if PortalVersion() < 2023.2: # 11.2 supports bigint
                unsupported_field_types = ['BigInteger']
            else:
                unsupported_field_types = []

            try:
                in_desc = arcpy.Describe(input_layer)
            except:
                in_desc = ""
            if hasattr(in_desc, "fields"):
                ifields = [f.name for f in in_desc.fields
                           if f.type not in unsupported_field_types]
                self.params[3].filters[0].list = ifields
                self.params[4].filters[0].list = ifields
            else:
                self.params[3].filters[0].list = []
                self.params[4].filters[0].list = []

            try:
                append_desc = arcpy.Describe(append_layer)
            except:
                append_desc = ""
            if hasattr(append_desc, "fields"):
                afields = [f.name for f in append_desc.fields
                           if f.type not in unsupported_field_types]
                self.params[3].filters[1].list = afields
            else:
                self.params[3].filters[1].list = []

        else:
            self.params[3].value = None
            self.params[4].value = None
            self.params[3].enabled = False
            self.params[4].enabled = False

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        if PortalVersion() < 6.1:
            if self.params[0].valueAsText:
                self.params[0].setIDMessage('ERROR', 120184)
            else:
                self.params[0].setIDMessage('WARNING', 120184)

        input_layer = self.params[0].value
        append_layer = self.params[1].value
        append_method = self.params[2].value

        if input_layer:
            try:
                d_input_layer = arcpy.Describe(self.params[0])
            except:
                d_input_layer = ""
            if hasattr(d_input_layer, "catalogPath"):
                if not 'SERVICES/HOSTED/' in d_input_layer.catalogPath.upper() or not d_input_layer.catalogPath.upper().startswith(
                        'HTTP'):
                    self.params[0].setIDMessage("ERROR", 120151,
                                                self.params[0].value)

        if append_layer:
            try:
                i = arcpy.Describe(self.params[0])
            except:
                i = ""

            try:
                o = arcpy.Describe(self.params[1])
            except:
                o = ""
            if getattr(i, 'shapetype', None) != getattr(o, 'shapetype', None):
                self.params[1].setIDMessage('ERROR', 468)
            validate = validate_server_input(self.params[1].valueAsText)
            if not validate[0]:
                self.params[1].setIDMessage('ERROR', validate[1])

        if append_method == "FIELD_MAPPING":
            if self.params[3].value is None:
                self.params[3].setIDMessage("ERROR", 735)