import arcpy
import os
import sys

from geoanalyticssoap import GeospatialAnalysisTasks
from gautils import dicts as d
from gautils import get_value, param_cleanup, set_context
from rautils import *

zoneIsMD = True
valueIsMD = True

class ZonalStatisticsAsTable(object):

    def __init__(self):
        """Define the tool (tool name is the name of the class)."""
        self.label = "Zonal Statistics As Table"
        self.description = "Calculate zonal statistics and output a table."
        self.canRunInBackground = False
        self.helpContext = 54010002
        self.statistic = ['ALL', 'MEAN', 'MAJORITY', 'MAJORITY_COUNT', 'MAJORITY_PERCENT', 'MAXIMUM', 'MEDIAN', \
            'MINIMUM', 'MINORITY', 'MINORITY_COUNT', 'MINORITY_PERCENT', 'PERCENTILE', 'RANGE', 'STD', 'SUM', 'VARIETY', \
            'MIN_MAX', 'MEAN_STD', 'MIN_MAX_MEAN', 'MAJORITY_VALUE_COUNT_PERCENT', 'MINORITY_VALUE_COUNT_PERCENT']
        self.statistic_float = ['ALL', 'MEAN', 'MAXIMUM', 'MEDIAN', 'MINIMUM', 'PERCENTILE', 'RANGE', \
            'STD', 'SUM', 'MIN_MAX', 'MEAN_STD', 'MIN_MAX_MEAN']
        self.statistic_default = 'ALL'
        self.stat_circular_int = ['ALL', 'MEAN', 'MAJORITY', 'MAJORITY_COUNT', 'MAJORITY_PERCENT', 'MINORITY', \
                                  'MINORITY_COUNT', 'MINORITY_PERCENT', 'STD', 'VARIETY', 'MEAN_STD', \
                                  'MAJORITY_VALUE_COUNT_PERCENT', 'MINORITY_VALUE_COUNT_PERCENT']
        self.stat_circular_flt = ['ALL', 'MEAN', 'STD', 'MEAN_STD']

    def getParameterInfo(self):
        """Define parameter definitions"""

        parameters = []

        parameters.append(arcpy.Parameter( 
            displayName="Input Zone Raster or Features",
            name="inputZoneRasterOrFeatures",
            datatype=[u"DEImageServer", u"GPFeatureLayer", u"GPRasterLayer", u"GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 0        

        parameters.append(arcpy.Parameter(
            displayName="Input Value Raster",
            name="inputValueRaster",
            datatype=[u"DEImageServer", u"GPRasterLayer", u"GPString"],
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 2
        
        parameters.append(arcpy.Parameter( 
            displayName="Output Table Name",
            name="outputTableName",
            datatype= u"GPString",
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 3

        parameters.append(arcpy.Parameter( 
            displayName="Zone Field",
            name="zoneField",
            datatype="GPString",
            parameterType="Required",
            direction="Input"))
        parameters[-1].displayOrder = 1

        parameters.append(arcpy.Parameter(
            displayName="Ignore NoData in Calculations",
            name="ignoreNodata",
            datatype= u"GPBoolean",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 4
        
        parameters[-1].filter.list = ["DATA", "NODATA"]
        parameters[-1].value = "DATA"

        parameters.append(arcpy.Parameter(
            displayName="Statistic Type",
            name="statisticType",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 5

        parameters[-1].filter.type = "ValueList"
        parameters[-1].filter.list = self.statistic
        parameters[-1].value = self.statistic_default

        parameters.append(arcpy.Parameter(
            displayName="Percentile Values",
            name="percentileValues",
            datatype= u"GPDouble",
            parameterType="Optional",
            multiValue=True,
            direction="Input"))
        parameters[-1].displayOrder = 6

        parameters[-1].value = 90

        parameters.append(arcpy.Parameter(
            displayName="Process as Multidimensional",
            name="processAsMultidimensional",
            datatype= u"GPBoolean",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 10

        parameters[-1].filter.list = ['ALL_SLICES', 'CURRENT_SLICE']
        parameters[-1].value = "CURRENT_SLICE"
       
        parameters.append(arcpy.Parameter( 
            displayName="Output Table",
            name="outputTable",
            datatype=u"GPTableView",
            parameterType="Derived",
            direction="Output"))
        parameters[-1].displayOrder = 11

        parameters.append(arcpy.Parameter(
            displayName="Percentile Interpolation Type",
            name="percentileInterpolationType",
            datatype= u"GPString",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 7

        parameters[-1].filter.list = ['AUTO_DETECT', 'NEAREST', 'LINEAR']
        parameters[-1].value = "AUTO_DETECT"

        parameters.append(arcpy.Parameter(
            displayName="Calculate Circular Statistics",
            name="circularCalculation",
            datatype= u"GPBoolean",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 8
        parameters[-1].filter.list = ['CIRCULAR', 'ARITHMETIC']
        parameters[-1].value = "ARITHMETIC"

        parameters.append(arcpy.Parameter(
            displayName="Circular Wrap Value",
            name="circularWrapValue",
            datatype= u"GPDouble",
            parameterType="Optional",
            direction="Input"))
        parameters[-1].displayOrder = 9
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
        
        inputZoneLayerParam = parameters[0]
        zoneFieldParam = parameters[3]

        inputRasterLayertoSummarize = parameters[1]
        statisticType = parameters[5]
        percentileValues = parameters[6]
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

        if statisticType.valueAsText.upper() == "PERCENTILE" or statisticType.valueAsText.upper() == "ALL":
            percentileValues.enabled = True
        else:
            percentileValues.enabled = False  

        if statisticType.valueAsText.upper() in ["MEDIAN", "PERCENTILE", "ALL"]:
            percentileType.enabled = True
        else:
            percentileType.enabled = False

        if percentileType.value is None:
            percentileType.value = "AUTO_DETECT"

        # Default zone field        
        if not inputZoneLayerParam.hasBeenValidated:
            try:
                zoneIsMD = isMultidimensional2(inputZoneLayerParam.valueAsText)                
            except:
               pass
            
            try:
                if not (inputZoneLayerParam.value in ["", "#", None]):
                    zoneFieldParam.filter.list = listFields(inputZoneLayerParam.valueAsText, ['Integer', 'SmallInteger', 'String'])
            except:
                pass    

        # Validate statistic type dropdown        
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
        inputZoneLayerParam = parameters[0]
        inputRasterLayertoSummarize = parameters[1]
        processAsMDParam = parameters[7]
        # 1. zone raster must be integer type
        validateIntegerRaster(inputZoneLayerParam)
        # 2. filter out local data for zone raster
        validateNonLocalRaster(inputZoneLayerParam)
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
        import json

        analysis_type = "Zonal Statistics As Table"

        inputZoneLayer = parameters[0]
        # get first input url
        urlZoneRaster = getFeatureOrRasterURL(inputZoneLayer.valueAsText)        
        # 2rd parameter        
        inputRas = parameters[1].valueAsText
        urlValueRaster = getRasterURL(inputRas)
        # 3th parameter
        outName = parameters[2].valueAsText
        # 4th parameter
        zoneField = parameters[3].valueAsText
        # 5th parameter
        ignoreNoData = parameters[4].valueAsText
        # 6th parameter
        statType = parameters[5].valueAsText
        percentileVs = parameters[6].valueAsText
        # 7th parameter
        processAsMD = parameters[7].valueAsText
        percentileT = parameters[9].valueAsText
        calcCirStat = parameters[10].valueAsText
        cirWrapVal = parameters[11].valueAsText

        params = dict(inputZoneRasterOrFeatures=json.dumps({"url":urlZoneRaster}),
                    zoneField=zoneField,
                    inputValueRaster=json.dumps({"url":urlValueRaster}),
                    outputTableName=json.dumps({"serviceProperties":{"name":outName}}),
                    ignoreNodata=ignoreNoData,
                    statisticType=statType,
                    processAsMultidimensional=processAsMD,
                    percentileValues=percentileVs,
                    percentileInterpolationType=percentileT,
                    circularCalculation=calcCirStat,
                    circularWrapValue=cirWrapVal)        
              
        params['context'] = setContext(["outputCoordinateSystem", "extent", "snapRaster", "cellSize", "mask"])

        params = param_cleanup(params)

        ga = GeospatialAnalysisTasks(analysis_type, helper_services='rasterAnalytics')
        output = ga.run_portal_tool(params)

        import json
        outputDict = json.loads(output)

        parameters[8].value = outputDict['url']        
