"""
 ga_server_mergelayers.py

 Front end of 'Merge Layers' GeoAnalytics Server tool.

"""

import arcpy

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from gautils.utilities import PortalVersion
from gautils.validation import validate_output, validate_server_input


if __name__ == '__main__':

    analysis_type = "Merge Layers"

    params = dict(inputLayer=get_value(0, as_value=True),
                  mergeLayer=get_value(1, as_value=True),
                  outputName=get_value(2),
                  mergingAttributes=get_value(3, as_value=True, val_table='merge_layers'))

    params['context'] = set_context(arcpy.env.outputCoordinateSystem,
                                    arcpy.env.extent,
                                    data_store=get_value(5, dict=d.datastore),
                                    geoanalytics=True)

    params = param_cleanup(params)
    
    ga = GeospatialAnalysisTasks(analysis_type)
    output = ga.run_portal_tool(params)
    arcpy.SetParameterAsText(4, output)

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

        
        # Support for bigint
        if PortalVersion() >= 2023.2: # 11.2
            self.params[3].filters[0].list = ["Short", "Long", "BigInteger", "Float", "Double", "Text",
                                     "Date", "OID"]

        inputLayer = self.params[0].value
        mergeLayer = self.params[1].value
        mergeValues = self.params[3].values
        if inputLayer and mergeLayer:
            if PortalVersion() < 2023.2: # 11.2 Support for bigint
                field_types = ['SmallInteger', 'Integer', 'Single', 'Double', 'String', 'Date', "OID"]
            else:
                field_types = ['SmallInteger', 'Integer', 'BigInteger', 'Single', 'Double', 'String', 'Date', "OID"]
            try:
                self.params[3].filters[2].list = [f.aliasName for f in
                                                  arcpy.Describe(
                                                      inputLayer).fields
                                                  if f.type in field_types]
                self.params[3].values = [[i[0].value, i[1], i[2]]
                                         if i[1] != 'REMOVE'
                                         else [i[0].value, i[1], None]
                                         for i in mergeValues]
            except:
                pass

        output_name = self.params[2].valueAsText
        if output_name:
            self.params[2].value = validate_output(output_name)

    def updateMessages(self):
        """Modify the messages created by internal validation for each tool
        parameter. This method is called after internal validation."""

        try:
            if PortalVersion() < 6.4:
                if self.params[0].valueAsText:
                    self.params[0].setIDMessage('ERROR', 120184)
                else:
                    self.params[0].setIDMessage('WARNING', 120184)
        except:
            pass

        inputLayer = self.params[0].value
        mergeLayer = self.params[1].value

        if inputLayer and mergeLayer:
            try:
                if arcpy.Describe(self.params[0]).shapeType != arcpy.Describe(
                        self.params[1]).shapeType:
                    self.params[1].setIDMessage('ERROR', 468)
            except:
                pass
        if inputLayer:
            validate = validate_server_input(self.params[0].valueAsText)
            if not validate[0]:
                self.params[0].setIDMessage('ERROR', validate[1])
        if mergeLayer:
            validate = validate_server_input(self.params[1].valueAsText)
            if not validate[0]:
                self.params[1].setIDMessage('ERROR', validate[1])

        self.params[3].clearMessage()
        if self.params[3].hasError() and self.params[3].message.find(
                '000800') > -1:
            self.params[3].clearMessage()