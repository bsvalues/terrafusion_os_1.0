
import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

zoneIsMD = True
valueIsMD = True

class SummarizeRasterWithin(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Summarize Raster Within"
        self.description = ""
        self.canRunInBackground = False
        self.helpContext = 54010001
        self.statistic = ['MEAN','MAJORITY','MAJORITY_COUNT','MAJORITY_PERCENT','MAXIMUM','MEDIAN', \
            'MINIMUM','MINORITY','MINORITY_COUNT','MINORITY_PERCENT','PERCENTILE','RANGE','STD','SUM','VARIETY']
        self.statistic_float = ['MEAN','MAXIMUM','MEDIAN','MINIMUM','PERCENTILE','RANGE', \
            'STD','SUM']
        self.statistic_default = 'MEAN'
        self.stat_circular_int = ['MEAN', 'MAJORITY', 'MAJORITY_COUNT','MAJORITY_PERCENT', 'MINORITY', \
                                  'MINORITY_COUNT','MINORITY_PERCENT', 'STD', 'VARIETY']
        self.stat_circular_flt = ['MEAN', 'STD']

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter(
            displayName="Input Zone Layer",
            name="inputZoneLayer",
            datatype=[u'DEImageServer', u"GPFeatureLayer", u'GPRasterLayer', u"GPString"], 
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 0

        parameters.append(arcpy.Parameter(
            displayName="Zone Field",
            name="zoneField",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 1

        parameters.append(arcpy.Parameter(
            displayName="Input Raster Layer to Summarize",
            name="inputRasterLayertoSummarize",
            datatype=[u"DEImageServer", u"GPRasterLayer", u"GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 2

        parameters.append(arcpy.Parameter(
            displayName="Output Name",
            name="outputName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 3

        parameters.append(arcpy.Parameter(
            displayName="Statistic Type",
            name="statisticType",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 4

        parameters[-1].filter.type = "ValueList"
        parameters[-1].filter.list = self.statistic
        parameters[-1].value = self.statistic_default

        parameters.append(arcpy.Parameter(
            displayName="Ignore Missing Values",
            name="ignoreMissingValues",
            datatype= u"GPBoolean",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 9

        parameters[-1].filter.list = ['DATA', 'NODATA']
        parameters[-1].value = "DATA"

        parameters.append(arcpy.Parameter(
            displayName="Output Raster",
            name="outputRaster",
            datatype=u"GPRasterLayer",
            parameterType="Derived",
            direction="Output"))
        parameters[-1].displayOrder = 10

        parameters.append(arcpy.Parameter(
            displayName="Process as Multidimensional",
            name="processAsMultidimensional",
            datatype= u"GPBoolean",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 11

        parameters[-1].filter.list = ['ALL_SLICES', 'CURRENT_SLICE']
        parameters[-1].value = "CURRENT_SLICE"

        parameters.append(arcpy.Parameter(
            displayName="Percentile Value",
            name="percentileValue",
            datatype= u"GPDouble",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 5

        parameters[-1].value = 90

        parameters.append(arcpy.Parameter(
            displayName="Percentile Interpolation Type",
            name="percentileInterpolationType",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 6

        parameters[-1].filter.list = ['AUTO_DETECT', 'NEAREST', 'LINEAR']
        parameters[-1].value = "AUTO_DETECT"

        parameters.append(arcpy.Parameter(
            displayName="Calculate Circular Statistics",
            name="circularCalculation",
            datatype= u"GPBoolean",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 7
        parameters[-1].filter.list = ['CIRCULAR', 'ARITHMETIC']
        parameters[-1].value = "ARITHMETIC"

        parameters.append(arcpy.Parameter(
            displayName="Circular Wrap Value",
            name="circularWrapValue",
            datatype= u"GPDouble",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 8
        parameters[-1].value = 360

        return parameters

    def isLicensed(self):
        """Set whether tool is licensed to execute."""
        return True

    def updateParameters(self, parameters):
        """Modify the values and properties of parameters before internal
        validation is performed.  This method is called whenever a parameter
        has been changed."""
        global zoneIsMD
        global valueIsMD

        inputZoneLayer = parameters[0]
        inputRasterLayertoSummarize = parameters[2]
        statisticType = parameters[4]
        percentileValue = parameters[8]
        percentileType = parameters[9]
        calcCirStat = parameters[10].value

        def cirStatValid(kw):
            cirStatDict = {"int":self.stat_circular_int, "float":self.stat_circular_flt}
            regStatDict = {"int":self.statistic, "float":self.statistic_float}
            
            if calcCirStat == True:
                parameters[11].enabled = True
                statisticType.filter.list = cirStatDict[kw]
            else:
                parameters[11].enabled = False
                statisticType.filter.list = regStatDict[kw]
            if statisticType.valueAsText.upper() in cirStatDict[kw]:
                parameters[10].enabled = True
            else:
                parameters[10].value = False
                parameters[10].enabled = False
                parameters[11].enabled = False

        if statisticType.valueAsText.upper() == "PERCENTILE":
            percentileValue.enabled = True      
        else:
            percentileValue.enabled = False            

        if statisticType.valueAsText.upper() == "MEDIAN" or statisticType.valueAsText.upper() == "PERCENTILE":
            percentileType.enabled = True
        else:
            percentileType.enabled = False
            
        if percentileValue.value is None:
            percentileValue.value = 90

        if percentileType.value is None:
            percentileType.value = "AUTO_DETECT"

        # Default zone field
        if not inputZoneLayer.hasBeenValidated:
            try:
                zoneIsMD = isMultidimensional2(inputZoneLayer.valueAsText)                
            except:
                pass

            try:
                if not (inputZoneLayer.value in ["", "#", None]):
                    listN = listFields(inputZoneLayer.valueAsText, ['Single', 'Double', 'Integer', 'SmallInteger', 'String'])
                    parameters[1].filter.list = listN
            except:
                pass

        # Limit statistic by value raster datatype
        #if inputRasterLayertoSummarize.value is not None:
        if not (inputRasterLayertoSummarize.value in ["", "#", None]):
            try:
                valueIsMD = isMultidimensional2(inputRasterLayertoSummarize.valueAsText)                
            except:
                pass
            
            try: #layer
                rasobj = arcpy.sa.Raster(inputRasterLayertoSummarize.valueAsText)
                if rasobj.isInteger:                    
                    cirStatValid('int')
                else:
                    cirStatValid('float')
            except: #image server url
                if integerTest(inputRasterLayertoSummarize.valueAsText):
                    statisticType.filter.list = self.statistic
                else:
                    statisticType.filter.list = self.statistic_float
        else:
            cirStatValid('int')

        return

    def updateMessages(self, parameters):
        """Modify the messages created by internal validation for each tool
        parameter.  This method is called after internal validation."""
        inputZoneLayer = parameters[0]
        inputRasterLayertoSummarize = parameters[2]
        processAsMDParam = parameters[7]
        # 1. zone raster must be integer type
        validateIntegerRaster(inputZoneLayer)
        # 2. filter out local data for zone raster
        validateNonLocalRaster(inputZoneLayer)
        # 3. filter out local data for value raster
        validateNonLocalRaster(inputRasterLayertoSummarize)
        # 4. if none of input rasters is multidimensional, then cannot process as multidimensional        
        if processAsMDParam.value == True:            
            if (not zoneIsMD) and (not valueIsMD):
                processAsMDParam.setIDMessage("ERROR", 10569)
        else:
            processAsMDParam.clearMessage()
        return

    def execute(self, parameters, messages):

        """The source code of the tool."""

        analysis_type = "Summarize Raster Within"

        inputZoneLayer = parameters[0]
        # get first input url
        url = getFeatureOrRasterURL(inputZoneLayer.valueAsText)

        # get 2nd input url
        inputRas = parameters[2].valueAsText
        url02 = getRasterURL(inputRas)
        
        # the 7th parameter
        processAsMD = parameters[7].valueAsText

        # the last parameter
        percentileV = parameters[8].valueAsText
        percentileT = parameters[9].valueAsText
        calcCirStat = parameters[10].valueAsText
        cirWrapVal = parameters[11].valueAsText

        import json
        params = dict(inputZoneLayer=json.dumps({"url":url}),
                     zoneField=parameters[1].valueAsText,
                     inputRasterLayertoSummarize=json.dumps({"url":url02}),
                     outputName=json.dumps({"serviceProperties":{"name":parameters[3].valueAsText}}),
                     statisticType=parameters[4].valueAsText,
                     ignoreMissingValues=parameters[5].valueAsText,
                     processAsMultidimensional=processAsMD,
                     percentileValue=percentileV,
                     percentileInterpolationType=percentileT,
                     circularCalculation=calcCirStat,
                     circularWrapValue=cirWrapVal)

        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask", "pyramid"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        try:
            jdict = json.loads(output)
            arcpy.management.MakeImageServerLayer(appendTokenToURL(jdict['url']), parameters[3].valueAsText)
            parameters[6].value = parameters[3].valueAsText
        except:
            parameters[6].value = output
