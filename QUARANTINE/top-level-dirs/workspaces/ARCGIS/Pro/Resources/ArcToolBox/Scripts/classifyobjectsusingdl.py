import arcpy
import os
import sys
import json

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *
from urllib.parse import urlsplit

class ClassifyObjectsUsingDeepLearning(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Classify Objects Using Deep Learning"
        self.description = "Runs a trained deep learning model on an input raster and an optional feature class to \
                           produce a feature class or table in which each input object has an assigned class label."
        self.canRunInBackground = False
        self.helpContext = "54080003"

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Raster",
            name="inputRaster",
            datatype=[u'DEImageServer', u'GPRasterLayer', u"DEMapServer", u"GPFeatureLayer",
                      u"GPMapServerLayer", u"GPInternetTiledLayer", u"GPString"],
            parameterType="Required",
            direction="Input"))

        parameters[-1].displayOrder = 0

        parameters.append(arcpy.Parameter(
            displayName="Input Model",
            name="inputModel",
            datatype=u"DEFile",
            parameterType="Required",
            direction="Input"
        ))
        parameters[-1].filter.list = ["","dlpk_remote"]

        parameters[-1].displayOrder = 2

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype=u"GPString",
            parameterType="Required",
            direction="Input"))

        parameters[-1].displayOrder = 3

        parameters.append(arcpy.Parameter(
            displayName="Input Features",
            name="inputFeatures",
            datatype=[u'GPFeatureLayer', u"GPMapServerLayer", u"GPString"],
            parameterType="Optional",
            direction="Input"))

        parameters[-1].displayOrder = 1

        parameters.append(arcpy.Parameter(
            displayName="Model Arguments",
            name="modelArguments",
            datatype=u"GPValueTable",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].columns = [["GPString", "Name"], ["GPString", "Value"]]

        parameters[-1].displayOrder = 4

        parameters.append(arcpy.Parameter(
            displayName="Class Label Field ",
            name="classLabelField",
            datatype=u"GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].value = "ClassLabel"

        parameters[-1].displayOrder = 5

        parameters.append(arcpy.Parameter(
            displayName="Processing Mode ",
            name="processingMode",
            datatype=u"GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].filter.list = ["PROCESS_AS_MOSAICKED_IMAGE", "PROCESS_ITEMS_SEPARATELY"]
        parameters[-1].value = "PROCESS_AS_MOSAICKED_IMAGE"

        parameters[-1].displayOrder = 6

        parameters.append(arcpy.Parameter(
            displayName="Out Objects",
            name="outObjects",
            datatype=u"DEFeatureClass",
            parameterType="Derived",
            direction="Output"))

        parameters[-1].displayOrder = 7

        return parameters

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        if not parameters[1].hasBeenValidated:
            if not (parameters[1].value in ["", "#", None]):
                url_inputModel = parameters[1].valueAsText
                url_split = urlsplit(url_inputModel).path.split('/')
                if url_split[-2] == "items":
                    itemid = url_split[-1]
                else:
                    parameters[1].setErrorMessage("Invalid model")

                modeljson = json.dumps({"itemId": itemid})

                # Run QueryDeepLearningModelInfo service tool to obtain model arguments information
                ga = GeospatialAnalysisTasks("Query Deep Learning Model Info", helper_services='rasterAnalytics')
                params_querymodel = dict(model=modeljson)
                try:
                    output = ga.run_portal_tool(params_querymodel)
                except:
                    parameters[1].setErrorMessage("Invalid model")
                if isinstance(output, list):
                    jdict = json.loads(output[0])
                elif isinstance(output, str):
                    jdict = json.loads(output)
                else:
                    parameters[1].setErrorMessage("Invalid model")
                    
                argslist = []
                pars_list = None
                try:
                    pars_list = json.loads(jdict["modelInfo"])["ParameterInfo"]
                except:
                    parameters[1].setErrorMessage("Invalid model")
                if  pars_list:
                    for par in pars_list:
                        if not par["name"] in ["rasters", "model", "device"]:
                            argslist.append([par["name"], par["value"]])
                if len(argslist) > 0:
                    # Update modelArguments parameter value
                    parameters[4].value = argslist

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Classify Objects Using Deep Learning"

        inputRaster = parameters[0]
        inputFeatures = parameters[3]
        # get input url
        url = getFeatureOrRasterURL(inputRaster.valueAsText)
        inFeatures = getFeatureOrRasterURL(inputFeatures.valueAsText)
        # input model url
        inputModel = parameters[1].valueAsText

        if inputModel.endswith('.dlpk_remote'):
            inputModel = inputModel[:-12]

        # output name
        outputName = parameters[2].valueAsText
        # model arguments: either empty or a json string
        modelArguments = parameters[4].value
        if modelArguments:
            argdict = {}
            for each in modelArguments:
                argdict[each[0]] = each[1]
            modelArguments = json.dumps(argdict)

        classLabelField = parameters[5].valueAsText

        processingMode = False
        if parameters[6].value == "PROCESS_ITEMS_SEPARATELY":
            processingMode = True

        params = dict(
                      inputRaster=json.dumps({"url": url}),
                      inputFeatures=json.dumps({"url": inFeatures}),
                      model=json.dumps({"url": inputModel}),
                      modelArguments=modelArguments,
                      classLabelField=classLabelField,
                      outputFeatureClass=json.dumps({"serviceProperties": {"name": outputName}}),
                      processAllRasterItems=processingMode
                      )

        params['context'] = setContext(["extent", "cellSize", "parallelProcessingFactor", "processorType"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        parameters[7].value = output
