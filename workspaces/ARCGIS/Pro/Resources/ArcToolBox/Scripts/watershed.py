
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class Watershed(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Watershed"
        self.description = "Create watershed for input pour points data."
        self.canRunInBackground = False
        self.helpContext = 54020005

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Flow Direction Raster",
            name="inputFlowDirectionRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Pour Point Raster or Features",
            name="inPourPointRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"], #,u'GPFeatureRecordSetLayer',
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Pour Point Field",
            name="pourPointField",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Raster",
            name="outputRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        return parameters

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""

        inputPourLayer = parameters[1]
        pourField = parameters[3]

        # Default zone field
        if not inputPourLayer.hasBeenValidated:
            if not (inputPourLayer.value in ["", "#", None]):
                try:
                    listN = listFields(inputPourLayer.valueAsText, ['OID', 'Integer', 'SmallInteger', 'Single', 'Double'])
                    pourField.filter.list = listN
                    l1 = len(listN)
                    if l1 > 0:
                        if l1 < 2:
                            pourField.value = listN[0]
                        else:
                            pourField.value = listN[1]
                except:
                    pass
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        inputRasterParam2 = parameters[1]
        validateNonLocalRaster(inputRasterParam)
        validateNonLocalRaster(inputRasterParam2)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Watershed"

        inputRas = parameters[0].valueAsText
        url0 = getRasterURL(inputRas)

        inputPourLayer = parameters[1]
        url = getFeatureOrRasterURL(inputPourLayer.valueAsText)

        outName = parameters[2].valueAsText
        pourField = parameters[3].valueAsText

        import json
        params = dict(inputFlowDirectionRaster=json.dumps({"url":url0}),
                     inPourPointRasterOrFeatures=json.dumps({"url":url}),
                     outputName=json.dumps({"serviceProperties":{"name":outName}}),
                     pourPointField=pourField
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outName)
            parameters[4].value = outName
        except:
            pass
