import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, set_context
from rautils import *

class CalculateDensity(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Calculate Density"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 54030001
        self.luFilter = ['Meters', 'Kilometers', 'Feet', 'Miles', 'FeetInt', 'MilesInt']

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Point or Line Features",
            name="inputPointOrLineFeatures",
            datatype="GPFeatureRecordSetLayer",
            parameterType="Required",
            direction="Input"))
        parameters[-1].filter.list = ["Point", "Multipoint", "Polyline"]

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Count Field",
            name="countField",
            datatype="Field",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].parameterDependencies = ["inputPointOrLineFeatures"]
        parameters[-1].filter.list = ['Short','Long','Float','Double']

        parameters.append(arcpy.Parameter(
            displayName="Search Distance",
            name="searchDistance",
            datatype="GPLinearUnit",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = self.luFilter

        parameters.append(arcpy.Parameter(
            displayName="Output Area Units",
            name="outputAreaUnits",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['Square Meters', 'Square Kilometers', 'Square Feet', 'Square Miles']

        parameters.append(arcpy.Parameter(
            displayName="Output Cell Size",
            name="outputCellSize",
            datatype="GPLinearUnit",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = self.luFilter

        parameters.append(arcpy.Parameter(
            displayName="Output Raster",
            name="outputRaster",
            datatype="GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Input Barrier Features",
            name="inBarriers",
            datatype="GPFeatureRecordSetLayer",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].filter.list = ["Polyline", "Polygon"]

        return parameters

    def isLicensed(self):
        """License check"""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Calculate Density"

        import json

        params = dict(inputPointOrLineFeatures=parameters[0].value,
                      outputName=json.dumps({"serviceProperties":{"name":parameters[1].valueAsText}}),
                      countField=parameters[2].valueAsText,
                      searchDistance=parameters[3].value,
                      outputAreaUnits=parameters[4].valueAsText,
                      outputCellSize=parameters[5].value,
                      inBarriers=parameters[7].value)

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        # Remove keys for values that are None, False, '', etc.
        params = dict((k, v) for k, v in params.items() if v and v!='null')

        arcpy.AddMessage("{}".format(params))

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        # arcpy.AddWarning(output)
        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), parameters[1].valueAsText)
            msg = arcpy.GetMessages()
            arcpy.AddMessage(msg)
            parameters[6].value = parameters[1].valueAsText
        except:
            parameters[6].value = output


        return
