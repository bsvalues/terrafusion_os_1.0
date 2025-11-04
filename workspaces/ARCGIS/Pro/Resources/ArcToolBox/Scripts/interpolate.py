import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_message, get_value, set_context
from rautils import *

class InterpolatePoints(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Interpolate Points"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 54030002

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Point Features",
            name="inputPointFeatures",
            datatype="GPFeatureRecordSetLayer",
            parameterType="Required",
            direction="Input"))
        parameters[-1].filter.list = ["Point", "Multipoint"]

        parameters.append(arcpy.Parameter(
            displayName="Interpolate Field",
            name="interpolateField",
            datatype="Field",
            parameterType="Required",
            direction="Input"))
        parameters[-1].parameterDependencies = ["inputPointFeatures"]
        parameters[-1].filter.list = ['Short','Long','Float','Double']

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Optimize For",
            name="optimizeFor",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].filter.list = ['SPEED', 'BALANCE', 'ACCURACY']
        parameters[-1].value = 'BALANCE'

        parameters.append(arcpy.Parameter(
            displayName="Transform Data to Normal Distribution",
            name="transformData",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input",
            category="Additional Options"))
        parameters[-1].filter.list = ["TRANSFORM", "NO_TRANSFORM"]
        parameters[-1].value = "NO_TRANSFORM"

        parameters.append(arcpy.Parameter(
            displayName="Size of Local Models",
            name="sizeOfLocalModels",
            datatype="GPLong",
            parameterType="Optional",
            direction="Input",
            category="Additional Options"))
        parameters[-1].filter.type = "Range"
        parameters[-1].filter.list = [30, 500]

        parameters.append(arcpy.Parameter(
            displayName="Number of Neighbors",
            name="numberOfNeighbors",
            datatype="GPLong",
            parameterType="Optional",
            direction="Input",
            category="Additional Options"))
        parameters[-1].filter.type = "Range"
        parameters[-1].filter.list = [1, 64]

        parameters.append(arcpy.Parameter(
            displayName="Output Cell Size",
            name="outputCellSize",
            datatype="GPLinearUnit",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].filter.list = ['Meters', 'Kilometers', 'Feet', 'Miles', 'FeetInt', 'MilesInt']

        parameters.append(arcpy.Parameter(
            displayName="Output Prediction Error",
            name="outputPredictionError",
            datatype="GPBoolean",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].filter.list = ["OUTPUT_ERROR", "NO_OUTPUT_ERROR"]
        parameters[-1].value = "NO_OUTPUT_ERROR"

        parameters.append(arcpy.Parameter(
            displayName="Output Raster",
            name="outputRaster",
            datatype="GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Error Raster",
            name="outputErrorRaster",
            datatype="GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        return parameters

    def isLicensed(self):
        """License check"""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        #to be done: should always keep user-modified value for par 4, 5, 6, this cannot be done without CR274486 fixed
        if not parameters[3].hasBeenValidated:
            if parameters[3].valueAsText == 'SPEED':
                parameters[4].value = 'false'
                parameters[5].value = 50
                parameters[6].value = 8
            elif parameters[3].valueAsText == 'BALANCE':
                parameters[4].value = 'false'
                parameters[5].value = 75
                parameters[6].value = 10
            else:
                parameters[4].value = 'true'
                parameters[5].value = 100
                parameters[6].value = 15

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Interpolate Points"

        import json

        params = dict(inputPointFeatures=parameters[0].value,
                      interpolateField=parameters[1].valueAsText,
                      outputName=json.dumps({"serviceProperties":{"name":parameters[2].valueAsText}}),
                      optimizeFor=parameters[3].valueAsText,
                      transformData=parameters[4].value,
                      sizeOfLocalModels=parameters[5].value,
                      numberOfNeighbors=parameters[6].value,
                      outputCellSize=parameters[7].value,
                      outputPredictionError=parameters[8].value,
                      )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        # Remove keys for values that are None, False, '', etc.
        params = dict((k, v) for k, v in params.items() if v and v!='null')

        # arcpy.AddMessage("{}".format(params))

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        # processInfo
        msg = get_message(86246)  # Cross validation statistics are as following:
        arcpy.AddMessage(msg)
        processInfo = json.loads(output[2])
        for i in range(1,6):
            dictMsg = json.loads(processInfo[i])
            keysParams = list(dictMsg["params"].keys())
            diagnosticsName = dictMsg["message"][0]
            diagnosticsValue = dictMsg["params"][keysParams[0]]
            arcpy.AddMessage("{0} = {1}".format(diagnosticsName, diagnosticsValue))

        # prediction raster
        try:
            jdict = json.loads(output[0])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), parameters[2].valueAsText)
            msg = arcpy.GetMessages()
            arcpy.AddMessage(msg)
            parameters[9].value = parameters[2].valueAsText
        except:
            parameters[9].value = output[0]

        # prediction error raster
        if parameters[8].value:
            try:
                outputname_error = parameters[2].valueAsText + "_Errors"
                jdict = json.loads(output[1])
                arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outputname_error)
                msg = arcpy.GetMessages()
                arcpy.AddMessage(msg)
                parameters[10].value = outputname_error
            except:
                parameters[10].value = output[1]


        return
