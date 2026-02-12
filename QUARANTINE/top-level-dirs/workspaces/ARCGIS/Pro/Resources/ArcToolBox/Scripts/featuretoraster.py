import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import get_message
from rautils import setContext

import rautils

class ConvertFeatureToRaster(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Convert Feature To Raster"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 54070002

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Features",
            name="inputFeatures",
            datatype="GPFeatureRecordSetLayer",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Value Field",
            name="valueField",
            datatype="Field",
            parameterType="Required",
            direction="Input"))
        parameters[-1].parameterDependencies = ["inputFeatures"]

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Cell Size",
            name="outputCellSize",
            datatype="GPLinearUnit",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].filter.list = ['Meters', 'Kilometers', 'Feet', 'Miles', 'FeetInt', 'MilesInt']

        parameters.append(arcpy.Parameter(
            displayName="Output Raster",
            name="outputRaster",
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
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return

    def getDefaultOutputCellSize(self,inputFeatures):
        """Calculate default cell size from input features"""
        outSR = arcpy.env.outputCoordinateSystem
        if not outSR:
            outSR = arcpy.Describe(inputFeatures).spatialReference

        inputExtent = arcpy.Describe(inputFeatures).extent
        inputSR = arcpy.Describe(inputFeatures).spatialReference
        if outSR.factoryCode != inputSR.factoryCode:
            inputExtent = inputExtent.projectAs(outSR)

        outputCS = min((inputExtent.XMax - inputExtent.XMin),(inputExtent.YMax - inputExtent.YMin))/float(250)

        return outputCS, outSR.linearUnitName

    def is_float(self, text):
        try:
            float(text)
            # check for nan/infinity etc.
            if text.isalpha():
                return False
            return True
        except ValueError:
            return False


    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Convert Feature To Raster"

        # This is a workaround to honor cellSize environment since outputCellSize is a required parameter in service tool
        envCS = arcpy.env.cellSize
        if not parameters[3].value:
            if not self.is_float(envCS):
                outCS = self.getDefaultOutputCellSize(parameters[0].value)
                outCS = str(outCS[0]) + " " + outCS[1]
                parameters[3].value = outCS

                msg = get_message(86248, outCS) #% outCS  # Using default output cell size %s
                arcpy.AddMessage(msg)
            else:
                outSR = arcpy.env.outputCoordinateSystem
                if not outSR:
                    outSR = arcpy.Describe(parameters[0].value).spatialReference
                outCS = envCS + " " + outSR.linearUnitName
                parameters[3].value = outCS

                msg = get_message(86247, outCS) #% outCS  # Using environment cell size %s
                arcpy.AddMessage(msg)

        import json

        url = rautils.getFeatureOrRasterURL(parameters[0].valueAsText)

        params = dict(inputFeature=json.dumps({"url":url}),
                      valueField=parameters[1].valueAsText,
                      outputName=json.dumps({"serviceProperties":{"name":parameters[2].valueAsText}}),
                      outputCellSize=parameters[3].value)

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "pyramid"])

        # Remove keys for values that are None, False, '', etc.
        params = dict((k, v) for k, v in params.items() if v and v!='null')

        arcpy.AddMessage("{}".format(params))

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(rautils.appendTokenToURL(jdict['url']), parameters[2].valueAsText)
            parameters[4].value = parameters[2].valueAsText
        except:
            pass

        return
