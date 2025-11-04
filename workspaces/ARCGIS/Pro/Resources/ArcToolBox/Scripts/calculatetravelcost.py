
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class CalculateTravelCost(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Calculate Travel Cost"
        self.description = "Calculate travel cost for input source layer."
        self.canRunInBackground = False
        self.helpContext = 54050002        

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Source Raster or Features",
            name="inputSourceRasterOrFeatures",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"], #,u'GPFeatureRecordSetLayer',
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Distance Name",
            name="outputDistanceName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Cost Raster",
            name="inputCostRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Surface Raster",
            name="inputSurfaceRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Maximum Distance",
            name="maximumDistance",
            datatype= u"GPDouble",
            parameterType="Optional",
            direction="Input"))        

        parameters.append(arcpy.Parameter(
            displayName="Input Horizontal Raster",
            name="inputHorizontalRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Horizontal Factor",
            name="horizontalFactor",
            datatype= u"GPSAHorizontalFactor",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Vertical Raster",
            name="inputVerticalRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Vertical Factor",
            name="verticalFactor",
            datatype= u"GPSAVerticalFactor",
            parameterType="Optional",
            direction="Input"))

        #source group start, 09
        parameters.append(arcpy.Parameter(
            displayName="Cost Multiplier",
            name="sourceCostMultiplier",
            category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))             

        parameters.append(arcpy.Parameter(
            displayName="Start Cost",
            name="sourceStartCost",
            category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Resistance Rate",
            name="sourceResistanceRate",
            category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Capacity",
            name="sourceCapacity",
            category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))
        
        parameters.append(arcpy.Parameter(
            displayName="Travel Direction",
            name="sourceTravelDirection",
            category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].filter.list = ['FROM_SOURCE', 'TO_SOURCE']
        #source group end, 13

        parameters.append(arcpy.Parameter(
            displayName="Output Backlink Name",
            name="outputBacklinkName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Allocation Name",
            name="outputAllocationName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Allocation Field",
            name="allocationField",
            datatype="GPString",
            parameterType="Optional",
            direction="Input"))        

        parameters.append(arcpy.Parameter(
            displayName="Output Distance Raster",
            name="outputDistanceRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Backlink Raster",
            name="outputBacklinkRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Allocation Raster",
            name="outputAllocationRaster",
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
        inputSourceLayer = parameters[0]
        costMulti = parameters[9]
        startCost = parameters[10]
        sourceResis = parameters[11]
        sourceCap = parameters[12]
        sourceDir = parameters[13]
        allocField = parameters[16]

        # Default zone field
        if not inputSourceLayer.hasBeenValidated:
            if not (inputSourceLayer.value in ["", "#", None]):
                listN = listFields(inputSourceLayer.valueAsText, ['OID', 'Double', 'Single', 'Integer', 'SmallInteger'])
                listNi = listFields(inputSourceLayer.valueAsText, ['OID', 'Integer', 'SmallInteger'])
                listNs = listFields(inputSourceLayer.valueAsText, ['String'])
                listNs.append("FROM_SOURCE") #'FROM_SOURCE', 'TO_SOURCE'
                listNs.append("TO_SOURCE")

                costMulti.filter.list = listN
                startCost.filter.list = listN
                sourceResis.filter.list = listN
                sourceCap.filter.list = listN
                sourceDir.filter.list = listNs
                allocField.filter.list = listNi
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputRasterParam = parameters[0]
        inputRasterParam2 = parameters[2]
        inputRasterParam3 = parameters[3]
        inputRasterParam4 = parameters[5]
        inputRasterParam5 = parameters[7]
        validateNonLocalRaster(inputRasterParam)
        validateNonLocalRaster(inputRasterParam2)
        validateNonLocalRaster(inputRasterParam3)
        validateNonLocalRaster(inputRasterParam4)
        validateNonLocalRaster(inputRasterParam5)

        costMulti = parameters[9]
        startCost = parameters[10]
        sourceResis = parameters[11]
        sourceCap = parameters[12]
        if not (costMulti.value in ["", "#", None]):
            try:
                v = float(costMulti.valueAsText)
                costMulti.clearMessage()
            except:
                pass

        if not (startCost.value in ["", "#", None]):
            try:
                v = float(startCost.valueAsText)
                startCost.clearMessage()
            except:
                pass

        if not (sourceResis.value in ["", "#", None]):
            try:
                v = float(sourceResis.valueAsText)
                sourceResis.clearMessage()
            except:
                pass

        if not (sourceCap.value in ["", "#", None]):
            try:
                v = float(sourceCap.valueAsText)
                sourceCap.clearMessage()
            except:
                pass
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""
        import json

        analysis_type = "Calculate Travel Cost"

        inputZoneLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputZoneLayer.valueAsText)

        outName = parameters[1].valueAsText

        #get cost raster url
        inputCostRas = parameters[2].valueAsText
        url2 = getRasterURL(inputCostRas)
        inputCostRasJS = makeJSONParameter(url2)

        #get surface raster url
        inputSurfRas = parameters[3].valueAsText
        url3 = getRasterURL(inputSurfRas)
        inputSurfRasJS = makeJSONParameter(url3)

        maxDistance = parameters[4].valueAsText

        #get horizontal raster url
        inputHorRas = parameters[5].valueAsText
        url4 = getRasterURL(inputHorRas)
        inputHorRasJS = makeJSONParameter(url4)

        horiFactor = parameters[6].valueAsText

        #get vertical raster url
        inputVerRas = parameters[7].valueAsText
        url5 = getRasterURL(inputVerRas)
        inputVerRasJS = makeJSONParameter(url5)

        vertFactor = parameters[8].valueAsText

        costMultiplier = parameters[9].valueAsText
        startCost = parameters[10].valueAsText
        resisRate = parameters[11].valueAsText
        srcCapacity = parameters[12].valueAsText
        srcDirection = parameters[13].valueAsText

        outDirName = parameters[14].valueAsText
        if outDirName == "" or outDirName == "#" or outDirName == None:
            outDirNameJS = ""
        else:
            outDirNameJS = json.dumps({"serviceProperties":{"name":outDirName}})

        outAllocName = parameters[15].valueAsText
        if outAllocName == "" or outAllocName == "#" or outAllocName == None:
            outAllocNameJS = ""
        else:
            outAllocNameJS = json.dumps({"serviceProperties":{"name":outAllocName}})

        allocField = parameters[16].valueAsText

        params = dict(inputSourceRasterOrFeatures=json.dumps({"url":url}),
                      outputDistanceName=json.dumps({"serviceProperties":{"name":outName}}),
                      inputCostRaster=inputCostRasJS,
                      inputSurfaceRaster=inputSurfRasJS,
                      maximumDistance=maxDistance,
                      inputHorizontalRaster=inputHorRasJS,
                      horizontalFactor=horiFactor,
                      inputVerticalRaster=inputVerRasJS,
                      verticalFactor=vertFactor,
                      sourceCostMultiplier=costMultiplier,
                      sourceStartCost=startCost,
                      sourceResistanceRate=resisRate,
                      sourceCapacity=srcCapacity,
                      sourceTravelDirection=srcDirection,
                      outputBacklinkName=outDirNameJS,
                      outputAllocationName=outAllocNameJS,
                      allocationField=allocField
                     )

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        try:
            jdict = json.loads(output[0])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outName)
            parameters[17].value = outName
        except:
            pass

        try:
            jdict = json.loads(output[1])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outDirName)
            parameters[18].value = outDirName
        except:
            pass

        try:
            jdict = json.loads(output[2])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outAllocName)
            parameters[19].value = outAllocName
        except:
            pass
