import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

class DistanceAccumulation(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Distance Accumulation"
        self.description = "Calculate accumulated distance for input source layer."
        self.canRunInBackground = False
        self.helpContext = 54050011

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Source Raster or Features",
            name="inputSourceRasterOrFeatures",
            datatype=[u'DEImageServer', u'GPFeatureLayer', u'GPRasterLayer', u'GPString'],
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Distance Accumulation Raster Name",
            name="outputDistanceAccumulationRasterName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Barrier Raster or Features",
            name="inputBarrierRasterOrFeatures",
            datatype=[u'DEImageServer', u'GPFeatureLayer', u'GPRasterLayer', u'GPString'],
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Surface Raster",
            name="inputSurfaceRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Input Cost Raster",
            name="inputCostRaster",
            datatype=["DEImageServer", "GPRasterLayer", "GPString"],
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
            displayName="Output Back Direction Raster Name",
            name="outputBackDirectionRasterName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Source Direction Raster Name",
            name="outputSourceDirectionRasterName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Output Source Location Raster Name",
            name="outputSourceLocationRasterName",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Initial Accumulation Value or Field",
            name="sourceInitialAccumulation",
            #category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters.append(arcpy.Parameter(
            displayName="Maximum Accumulation Value or Field",
            name="sourceMaximumAccumulation",
            #category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))        

        parameters.append(arcpy.Parameter(
            displayName="Cost Multiplier Value or Field",
            name="sourceCostMultiplier",
            #category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))             

        parameters.append(arcpy.Parameter(
            displayName="Direction Field or Keyword",
            name="sourceDirection",
            #category="Source Characteristics",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))
       
        parameters[-1].filter.list = ['TO_SOURCE', 'FROM_SOURCE']
        parameters[-1].value = ''

        parameters.append(arcpy.Parameter(
            displayName="Distance Method",
            name="distanceMethod",            
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))

        parameters[-1].filter.list = ['PLANAR', 'GEODESIC']
        parameters[-1].value = 'PLANAR'          
        
        parameters.append(arcpy.Parameter(
            displayName="Output Distance Accumulation Raster",
            name="outputDistanceAccumulationRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Back Direction Raster",
            name="outputBackDirectionRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Source Direction Raster",
            name="outputSourceDirectionRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))

        parameters.append(arcpy.Parameter(
            displayName="Output Source Location Raster ",
            name="outputSourceLocationRaster",
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
        srcInitAcc = parameters[12]
        srcMaxAcc = parameters[13]
        costMulti = parameters[14]
        sourceDir = parameters[15]        

        # Default zone field
        if not inputSourceLayer.hasBeenValidated:
            if not (inputSourceLayer.value in ["", "#", None]):
                listN = listFields(inputSourceLayer.valueAsText, ['OID', 'Double', 'Single', 'Integer', 'SmallInteger'])
                listNi = listFields(inputSourceLayer.valueAsText, ['OID', 'Integer', 'SmallInteger'])
                listNs = listFields(inputSourceLayer.valueAsText, ['String'])
                listNs.append("FROM_SOURCE") #'FROM_SOURCE', 'TO_SOURCE'
                listNs.append("TO_SOURCE")
                
                srcInitAcc.filter.list = listN
                srcMaxAcc.filter.list = listN
                costMulti.filter.list = listN                
                sourceDir.filter.list = listNs
        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        # Allow double for source init accumulation, etc controls
        srcInitAcc = parameters[12]
        srcMaxAcc = parameters[13]
        costMulti = parameters[14]

        if not (srcInitAcc.value in ["", "#", None]):
            try:
                v = float(srcInitAcc.valueAsText)
                srcInitAcc.clearMessage()
            except:
                pass

        if not (srcMaxAcc.value in ["", "#", None]):
            try:
                v = float(srcMaxAcc.valueAsText)
                srcMaxAcc.clearMessage()
            except:
                pass

        if not (costMulti.value in ["", "#", None]):
            try:
                v = float(costMulti.valueAsText)
                costMulti.clearMessage()
            except:
                pass

        # Block local raster
        inSourceRaster = parameters[0]
        inBarrierRaster = parameters[2]
        inSurfaceRaster = parameters[3]
        inCostRaster = parameters[4]
        inVertRaster = parameters[5]
        inHoriRaster = parameters[7]
        validateNonLocalRaster(inSourceRaster)
        validateNonLocalRaster(inBarrierRaster)
        validateNonLocalRaster(inSurfaceRaster)
        validateNonLocalRaster(inCostRaster)
        validateNonLocalRaster(inVertRaster)
        validateNonLocalRaster(inHoriRaster)
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""
        import json

        analysis_type = "Distance Accumulation"

        inputSourceLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputSourceLayer.valueAsText)

        outName = parameters[1].valueAsText

        #get surface raster url
        inputBarrierRas = parameters[2].valueAsText
        urlBarrier = getRasterURL(inputBarrierRas)
        inputBarrierJS = makeJSONParameter(urlBarrier)

        #get surface raster url
        inputSurfRas = parameters[3].valueAsText
        urlSurfRas = getRasterURL(inputSurfRas)
        inputSurfRasJS = makeJSONParameter(urlSurfRas)

        #get cost raster url
        inputCostRas = parameters[4].valueAsText
        urlCostRas = getRasterURL(inputCostRas)
        inputCostRasJS = makeJSONParameter(urlCostRas)

        #get cost raster url
        inputVertRas = parameters[5].valueAsText
        urlVertRas = getRasterURL(inputVertRas)
        inputVertRasJS = makeJSONParameter(urlVertRas)

        vertFactor = parameters[6].valueAsText

        #get horizontal raster url
        inputHorRas = parameters[7].valueAsText
        urlHorRas = getRasterURL(inputHorRas)
        inputHorRasJS = makeJSONParameter(urlHorRas)

        horiFactor = parameters[8].valueAsText

        outBackDirName = parameters[9].valueAsText
        if outBackDirName == "" or outBackDirName == "#" or outBackDirName == None:
            outBackDirNameJS = ""
        else:
            outBackDirNameJS = json.dumps({"serviceProperties":{"name":outBackDirName}})

        outSourceDirName = parameters[10].valueAsText
        if outSourceDirName == "" or outSourceDirName == "#" or outSourceDirName == None:
            outSourceDirNameJS = ""
        else:
            outSourceDirNameJS = json.dumps({"serviceProperties":{"name":outSourceDirName}})

        outSourceLocName = parameters[11].valueAsText
        if outSourceLocName == "" or outSourceLocName == "#" or outSourceLocName == None:
            outSourceLocNameJS = ""
        else:
            outSourceLocNameJS = json.dumps({"serviceProperties":{"name":outSourceLocName}})

        sourceInitAcc = parameters[12].valueAsText

        sourceMaxAcc = parameters[13].valueAsText

        costMultiplier = parameters[14].valueAsText
        
        srcDirection = parameters[15].valueAsText

        distMethod = parameters[16].valueAsText

        params = dict(inputSourceRasterOrFeatures=json.dumps({"url":url}),
                      outputDistanceAccumulationRasterName=json.dumps({"serviceProperties":{"name":outName}}),
                      inputBarrierRasterOrFeatures=inputBarrierJS,
                      inputSurfaceRaster=inputSurfRasJS,
                      inputCostRaster=inputCostRasJS,
                      inputVerticalRaster=inputVertRasJS,
                      verticalFactor=vertFactor,                     
                      inputHorizontalRaster=inputHorRasJS,
                      horizontalFactor=horiFactor,
                      outputBackDirectionRasterName=outBackDirNameJS,
                      outputSourceDirectionRasterName=outSourceDirNameJS,
                      outputSourceLocationRasterName=outSourceLocNameJS,
                      sourceInitialAccumulation=sourceInitAcc,
                      sourceMaximumAccumulation=sourceMaxAcc,                   
                      sourceCostMultiplier=costMultiplier,                     
                      sourceDirection=srcDirection,
                      distanceMethod=distMethod
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
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outBackDirName)
            parameters[18].value = outBackDirName
        except:
            pass

        try:
            jdict = json.loads(output[2])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outSourceDirName)
            parameters[19].value = outSourceDirName
        except:
            pass

        try:
            jdict = json.loads(output[3])
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), outSourceLocName)
            parameters[20].value = outSourceLocName
        except:
            pass
