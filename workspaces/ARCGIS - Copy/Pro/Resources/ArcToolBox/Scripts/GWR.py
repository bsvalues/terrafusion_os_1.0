# coding: utf-8
"""
Tool Name:     GWR (Geographically Weighted Regression)
Source Name:   GWR.py
Version:       ArcGIS Pro 2.3
Author:        Environmental Systems Research Institute Inc.
Description:   Runs GWR and produces standard output.
"""

################ Imports ####################
import sys as SYS
import os as OS
import numpy as NUM
import numpy.linalg as LA
import scipy.spatial as SCPS
import scipy.stats as SCISTAT
import arcpy as ARCPY
import arcpy.management as DM
import arcgisscripting as ARC
import ErrorUtils as ERROR
import SSUtilities as UTILS
import SSDataObject as SSDO
import WeightsUtilities as WU
import Stats as STATS
import locale as LOCALE
LOCALE.setlocale(LOCALE.LC_ALL, '')

fullLayerPath = OS.path.join(ARCPY.GetInstallInfo()["InstallDir"], 
                             "Resources", "ArcToolbox", "Templates", "Layers")

convertFamilyType = {'CONTINUOUS': 'GAUSSIAN',
                     'BINARY': 'LOGIT',
                     'COUNT': 'POISSON'}

################ Output Field Names #################
gwrFCFieldNames = ["RESIDUAL", "STDRESID", "INFLUENCE", 
                   "COOKS_D", "CND_NUMBER"]
gwrFCFieldScaledNames = ["S_RESIDUAL", "S_STDRESID", "INFLUENCE", 
                   "COOKS_D", "CND_NUMBER"]

gwrFCFieldAlias = ["Residual", "Std Residual", "Influence", 
                   "Cook's D", "Condition Number"]
gwrFCFieldScaledAlias = ["Residual (Scaled)", "Std Residual (Scaled)", "Influence", 
                         "Cook's D", "Condition Number"]

gwrNumNeighName = "NUM_NEIGHS"
gwrNumNeighAlias = "Number of Neighbors"

gwrLocalR2Name = "LOCALR2"
gwrLocalR2Alias = "Local R-Squared"

gwrVarScaledName = "S_{0}"
gwrVarScaledAlias = "{0} (Scaled)"

gwrPredFieldName = "PREDICTED"
gwrPredFieldAlias = "Predicted ({0})"
gwrPredFieldScaledName = "S_PREDICT"
gwrPredFieldScaledAlias = "Predicted (Scaled {0})"

gwrInterceptName = "INTRCPT"
gwrInterceptAlias = "Intercept"
gwrInterceptScaledName = "S_INTRCPT"
gwrInterceptScaledAlias = "Intercept (Scaled)"

gwrCoefFieldName = "C_{0}"
gwrCoefFieldAlias = "Coefficient ({0})"
gwrCoefFieldScaledName = "S_C_{0}"
gwrCoefFieldScaledAlias = "Coefficient (Scaled {0})"

gwrSEFieldName = "SE_{0}"
gwrSEFieldAlias = "Std. Error ({0})"
gwrSEFieldScaledName = "S_SE_{0}"
gwrSEFieldScaledAlias = "Std. Error (Scaled {0})"

gwrTTestFieldName = "T_{0}"
gwrTTestFieldAlias = "Pseudo-T ({0})"
gwrTTestFieldScaledName = "S_T_{0}"
gwrTTestFieldScaledAlias = "Pseudo-T (Scaled {0})"

gwrSigFieldName = "SG_{}"
gwrSigFieldAlias = "Significance ({0})"
gwrSigFieldScaledName = "S_SG_{}"
gwrSigFieldScaledAlias = "Significance (Scaled {0})"

ggwrProbFieldName = "PROB_1"
ggwrProbFieldAlias = "Probability of Being 1 ({0})"

ggwrRawFieldName = "RAW_PRED"
ggwrRawFieldAlias = "Raw Predicted ({0})"

ggwrFCFieldNames = ["DEV_RESID", "GINFLUENCE", "LOCALPDEV", "CND_NUMBER"]
ggwrFCFieldAlias = ["Deviance Residual", "GInfluence", 
                    "Local Percent Deviance", "Condition Number"]

################# Global Variables ###################
ggwrFamilyTypes = ["POISSON", "LOGIT", "NEGATIVEBINOMIAL"]
maxConditionNumber = 30
gwrMaxNumNeighs = 1000

def execute(parameters, messages):

    ### Get parameter values ####
    inputFC = UTILS.getTextParameter(0, parameters)
    depVarName = UTILS.getTextParameter(1, parameters).upper()
    modelType = UTILS.getTextParameter(2, parameters).upper()
    indVarNames = UTILS.getTextParameter(3, parameters).upper()
    indVarNames = indVarNames.split(";")
    outputFC = UTILS.getTextParameter(4, parameters)
    outPath, outName = OS.path.split(outputFC)
    neighborType = UTILS.getTextParameter(5, parameters)
    neighborMethod =  UTILS.getTextParameter(6, parameters)
    minNumNeighs = UTILS.getNumericParameter(7, parameters)
    maxNumNeighs = UTILS.getNumericParameter(8, parameters)
    minDistance = UTILS.getTextParameter(9, parameters)
    maxDistance = UTILS.getTextParameter(10, parameters)
    numNeighsInc = UTILS.getNumericParameter(11, parameters)
    distanceInc = UTILS.getTextParameter(12, parameters)
    numIncrements = UTILS.getNumericParameter(13, parameters)
    numNeighs = UTILS.getNumericParameter(14, parameters)
    bandwidth = UTILS.getTextParameter(15, parameters)
    predictInputFC = UTILS.getTextParameter(16, parameters)
    predictVT = parameters[17].value
    predictOutputFC = UTILS.getTextParameter(18, parameters)
    robust = parameters[19].value
    kernel = UTILS.getTextParameter(20, parameters)
    if kernel is None:
        kernel = "BISQUARE"
    rasterDir = UTILS.getTextParameter(21, parameters)
    if modelType == "CONTINUOUS":
        standardize = parameters[23].value
    else:
        standardize = False

    #### Check If User Has the Advanced License to Conduct This Analysis ####
    if not checkLicense() and rasterDir is not None:
        ARCPY.AddIDMessage("ERROR", 110257)
        raise SystemExit()

    #### Create SSDataObject ####
    allVars = [depVarName] + indVarNames
    checker = UTILS.ExecuteNewFieldTypeChecker(inputFC, outputFC, fields = allVars)
    ssdo = SSDO.SSDataObject(inputFC, templateFC = outputFC)
    ssdo.obtainData(ssdo.oidName, allVars, minNumObs = 20)

    #### Get Family ####
    family = convertFamilyType[modelType]

    #### Core Calculation ####
    if neighborMethod == "MANUAL_INTERVALS":
        #### Manual Search for AICc ####
        manualGWR = ManualGWR(ssdo, depVarName, indVarNames, numIncrements,
                              minNumNeighs = minNumNeighs, 
                              numNeighsInc = numNeighsInc,
                              minDistance = minDistance, 
                              distanceInc = distanceInc, 
                              kernel = kernel, family = family,
                              standardize = standardize)
        if manualGWR.useKNN:
            numNeighs = manualGWR.searchCriteria
            bandwidth = None
        else:
            bandwidth = manualGWR.finalBandwidthInput
            numNeighs = None 

        #### Run Core Calculation ####
        gwr = GWR(ssdo, depVarName, indVarNames, 
                  bandwidth = bandwidth, 
                  numNeighs = numNeighs, kernel = kernel,
                  family = family, standardize = standardize,
                  silentMessages = True)

    elif neighborMethod == "USER_DEFINED":
        #### Basic ####
        gwr = GWR(ssdo, depVarName, indVarNames,
                  bandwidth = bandwidth, numNeighs = numNeighs,
                  kernel = kernel, family = family,
                  standardize = standardize)
    else:
        gwr = OptimizedGWR(ssdo, depVarName, indVarNames, 
                           minNumNeighs = minNumNeighs, 
                           maxNumNeighs = maxNumNeighs,
                           minDistance = minDistance, 
                           maxDistance = maxDistance,
                           kernel = kernel, family = family,
                           neighborType = neighborType,
                           standardize = standardize)

    #### Create Report ####
    report = createGWRReport(gwr)
    ARCPY.AddMessage(report)

    #### Create Output ####
    gwr.createOutputFC(outputFC)

    #### Render Results ####
    if gwr.family != "GAUSSIAN":
        if ssdo.shapeType.upper() == "POINT":
            UTILS.buildLocaleCIMLayer("GGWR_Points.lyrx", 4)
        else:
            UTILS.buildLocaleCIMLayer("GGWR_Polygons.lyrx", 4)
    else:
        if gwr.standardize:
            data = {"field": "S_STDRESID"}
        else:
            data = {"field": "STDRESID"}
        if ssdo.shapeType.upper() == "POINT":
            UTILS.buildLocaleCIMLayer("GWR_Points.lyrx", 4, data=data)
        else:
            UTILS.buildLocaleCIMLayer("GWR_Polygons.lyrx", 4, data=data)

    #### Prediction ####
    if predictInputFC is not None:
        varEntry = [vRow[0].value for vRow in predictVT]
        predVarNames = [i.upper() for i in varEntry]
        checker = UTILS.ExecuteNewFieldTypeChecker(predictInputFC, predictOutputFC, fields = predVarNames)
        predictGWR = PredictGWR(gwr, robust = robust)
        predictGWR.createPredictionFC(predictInputFC, predictOutputFC, 
                                        indVarNames = predVarNames)
        d = ARCPY.Describe(predictInputFC)
        if gwr.family == "LOGIT":
            if d.ShapeType.upper() == "POINT":
                predLYR = "GWR_Predict_Points_Binary.lyrx"
            else:
                predLYR = "GWR_Predict_Polygons_Binary.lyrx"
        elif gwr.family == "POISSON":
            if d.ShapeType.upper() == "POINT":
                predLYR = "GWR_Predict_Points_Count.lyrx"
            else:
                predLYR = "GWR_Predict_Polygons_Count.lyrx"
        else:
            if d.ShapeType.upper() == "POINT":
                predLYR = "GWR_Predict_Points.lyrx"
            else:
                predLYR = "GWR_Predict_Polygons.lyrx"
        parameters[18].symbology = OS.path.join(fullLayerPath, 
                                                predLYR)
    else:
        predictGWR = None

    #### Coefficient Rasters ####
    if rasterDir is not None:
        if predictGWR is None:
            predictGWR = PredictGWR(gwr, robust = robust)
        try:
            cellSize = UTILS.strToFloat(ARCPY.env.cellSize)
        except:
            if ssdo.useChordal:
                envelope = UTILS.Envelope(ssdo.extent)
                maxExtent = envelope.maxExtent
                cellSize = envelope.maxExtent / 100
            else:
                cellSize = ssdo.envelope.maxExtent / 100

        #### Get Output FC Prefix ####
        outputPref, ext = OS.path.splitext(outName)
        outRasterLayers = predictGWR.createPredictionRasters(ssdo, cellSize, rasterDir,
                                                                outputPref = outputPref)
        ARCPY.SetParameter(22, outRasterLayers)

    #### Add Charts To The Results ####
    chartList = list()
    if gwr.standardize:
        outFields = {}
        depVarOutName = gwr.scatterFieldNames[0]
        ssdoOut = SSDO.SSDataObject(outputFC)
        outFields[depVarOutName] = ssdoOut.allFields[depVarOutName]
        indVarOutNames = gwr.scatterFieldNames[1:]
        for varName in indVarOutNames:
            outFields[varName] = ssdoOut.allFields[varName]
                
    else:
        outFields = ssdo.fields
        depVarOutName = ssdo.in2OutFieldMap[depVarName]
        indVarOutNames = [ ssdo.in2OutFieldMap[i] for i in indVarNames ]

    chartTitle = ""

    #### Create Scatter Plot Matrix for Xs and Y ####
    smChartFields = []
    smChartFieldsIn = []
    if modelType == 'CONTINUOUS' or modelType == 'COUNT':
        smChartFields = [depVarOutName]
        smChartFieldsIn = [depVarName]
    smChartFields.extend(indVarOutNames)
    smChartFieldsIn.extend(indVarNames)

    if len(smChartFields) < 3:
        if len(smChartFields) == 2:
            chartTitle = ARCPY.GetIDMessage(84888).format(ARCPY.GetIDMessage(220641))
            sChart1 = ARCPY.Chart(chartTitle)
            sChart1.type = 'scatter'
            sChart1.title = chartTitle
            # sChart1.description = 'desc'
            sChart1.xAxis.field = smChartFields[1]
            sChart1.yAxis.field = [smChartFields[0]]
            if gwr.standardize:
                sChart1.xAxis.title = outFields[smChartFields[1]].alias
                sChart1.yAxis.title = outFields[smChartFields[0]].alias
            else:
                sChart1.xAxis.title = outFields[smChartFieldsIn[1]].alias
                sChart1.yAxis.title = outFields[smChartFieldsIn[0]].alias
            sChart1.scatter.showTrendLine = True
            chartList.append(sChart1)
    else:
        if len(smChartFields) > 10:
            ARCPY.AddIDMessage("WARNING", 110249, len(smChartFields))
            smChartFields = smChartFields[:10]
        chartTitle = ARCPY.GetIDMessage(84888).format(ARCPY.GetIDMessage(220642))
        smChart = ARCPY.Chart(chartTitle)
        smChart.type = 'scatterMatrix'
        smChart.title = chartTitle
        smChart.scatterMatrix.fields = smChartFields
        smChart.scatterMatrix.showTrendLine = True
        smChart.scatterMatrix.showHistograms = True
        # smChart.scatterMatrix.showAsRSquared = True
        chartList.append(smChart)

    if modelType == 'BINARY':
        #### Create Box Plot for Xs split By Y####
        chartTitle = ARCPY.GetIDMessage(84896)
        bpChart = ARCPY.Chart(chartTitle)
        bpChart.type = 'boxPlot'
        bpChart.title = chartTitle
        # bpChart.description = 'desc'
        bpChart.xAxis.field = ""
        bpChart.yAxis.field = indVarOutNames
        # bpChart.xAxis.title = 'Predicted'
        bpChart.yAxis.title = ARCPY.GetIDMessage(84897)
        #### Set Box Plot Properties ####
        bpChart.boxPlot.splitCategory = depVarOutName
        bpChart.boxPlot.splitCategoryAsMeanLine = False
        bpChart.boxPlot.standardizeValues = True
        chartList.append(bpChart)

    #### Create Histograms for Residuals/Deviance Residuals ####
    histChartShowComparisonDistribution = True
    histChartShowMean = True
    histChartXfield = ''
    histChartXTitle = ''
    if modelType == 'CONTINUOUS':
        chartTitle = ARCPY.GetIDMessage(84889)
        if gwr.standardize:
            histChartXfield = 'S_STDRESID'
        else:
            histChartXfield = 'STDRESID'
        histChartXTitle = ARCPY.GetIDMessage(84891)
        histChartShowComparisonDistribution = True
        histChartShowMean = True
    elif modelType == 'COUNT':
        chartTitle = ARCPY.GetIDMessage(84890)
        histChartXfield = 'DEV_RESID'
        histChartXTitle = ARCPY.GetIDMessage(84892)
        histChartShowComparisonDistribution = True
        histChartShowMean = True
    elif modelType == 'BINARY':
        chartTitle = ARCPY.GetIDMessage(84890)
        histChartXfield = 'DEV_RESID'
        histChartXTitle = ARCPY.GetIDMessage(84892)
        histChartShowComparisonDistribution = False
        histChartShowMean = False

    histChart = ARCPY.Chart(chartTitle)
    histChart.type = 'histogram'
    histChart.title = chartTitle
    histChart.xAxis.field = histChartXfield
    histChart.xAxis.title = histChartXTitle
    histChart.histogram.showComparisonDistribution = histChartShowComparisonDistribution
    histChart.histogram.showMean = histChartShowMean
    chartList.append(histChart)

    if modelType == 'CONTINUOUS' or modelType == 'COUNT':
        #### Create Scatter Plot for Residuals in CONTINUOUS and COUNT Model ####
        yAxisField = []
        yAxisTitle = ''
        if modelType == 'CONTINUOUS':
            chartTitle = ARCPY.GetIDMessage(84893)
            if gwr.standardize:
                yAxisField = ['S_STDRESID']
            else:
                yAxisField = ['STDRESID']
            yAxisTitle = ARCPY.GetIDMessage(84891)
        elif modelType == 'COUNT':
            chartTitle = ARCPY.GetIDMessage(84894)
            yAxisField = ['DEV_RESID']
            yAxisTitle = ARCPY.GetIDMessage(84892)
        sChart = ARCPY.Chart(chartTitle)
        sChart.type = 'scatter'
        sChart.title = chartTitle
        # sChart.description = 'desc'
        if gwr.standardize:
            sChart.xAxis.field = 'S_PREDICT'
        else:
            sChart.xAxis.field = 'PREDICTED'
        sChart.yAxis.field = yAxisField
        sChart.xAxis.title = ARCPY.GetIDMessage(84895)
        sChart.yAxis.title = yAxisTitle
        sChart.scatter.showTrendLine = False
        chartList.append(sChart)
    elif modelType == 'BINARY':
        #### Create Bar Chart for Y and Predicted Y ####
        chartTitle = ARCPY.GetIDMessage(84898)
        barChart = ARCPY.Chart(chartTitle)
        barChart.type = "bar"
        barChart.title = chartTitle
        if gwr.standardize:
            barChart.xAxis.field = "S_PREDICT"
        else:
            barChart.xAxis.field = "PREDICTED"
        barChart.yAxis.field = ""
        barChart.yAxis.title = ARCPY.GetIDMessage(84785)
        barChart.xAxis.sort = "asc"
        barChart.bar.aggregation = "COUNT"
        barChart.bar.multiSeriesDisplay = "stacked"
        barChart.bar.splitCategory = depVarOutName
        chartList.append(barChart)

    parameters[4].charts = chartList

def warnVectorValues(values):
    nanVals = NUM.isnan(values)
    warnFlag = nanVals.sum() != 0

    #### Check Negative Values ####
    if not warnFlag:
        warnFlag = (values < 0).sum() != 0

        #### Check Perfect Prediction ####
        if not warnFlag:
            warnFlag = (values == 1).sum() != 0

    return warnFlag

def checkLicense():
    product = ARCPY.ProductInfo()
    if product in ["ArcInfo"]:
        return True
    elif product == "ArcServer":
        #### 3D extension is used to verify that server used advance lic ####
        if ARCPY.CheckExtension("3D") == "Available":
            return True
        else:
            return False
    else:
        return False

def globalGWRCoincidentPointChecker(ssdo):
    maxCoin = ssdo.counts.max()
    if maxCoin >= 1000 or maxCoin == ssdo.numObs:
        ARCPY.AddIDMessage("ERROR", 110246, str(maxCoin), str(ssdo.numObs))
        raise SystemExit()
    else:
        coinBool = ssdo.counts != 1
        numWithCoin = coinBool.sum()
        if numWithCoin:
            ARCPY.AddIDMessage("WARNING", 110251, str(numWithCoin))

def gwrCoincidentPointChecker(ssdo, numNeighs, optimizedDefault = False):
    maxCoin = ssdo.counts.max()
    if maxCoin >= numNeighs:
        if optimizedDefault:
            ARCPY.AddIDMessage("ERROR", 110245, str(maxCoin), str(numNeighs))
            raise SystemExit()
        else:
            ARCPY.AddIDMessage("ERROR", 110244, str(maxCoin), str(numNeighs))
            raise SystemExit()

################# Message Functions ##################
def generalGWRMessages(gwr):
    """Creates General Info Table for All GWR Subclasses.

    INPUTS:
    gwr (object): instance of GWR, ManualGWR, OptimizedGWR

    RETURN:
    table (str): tabulated string to print
    """

    header = ARCPY.GetIDMessage(84845)
    rows = []

    #### Number of Features ####
    rows.append([ARCPY.GetIDMessage(84138), "{0}".format(gwr.n)])

    #### Dependent Variable ####
    label = ARCPY.GetIDMessage(84112)
    rows.append([label, gwr.depVarName])

    #### Independent Variables ####
    label = ARCPY.GetIDMessage(84402)
    for varInd, varName in enumerate(gwr.indVarNames):
        if not varInd:
            rows.append([UTILS.buildTableCell(label, rowSpan=len(gwr.indVarNames)), varName])
        else:
            rows.append(["@@none", UTILS.buildTableCell(varName, align="right")])

    #### Distance Band or Number of Neighbors ####
    if gwr.useKNN:
        label = ARCPY.GetIDMessage(84362)
        rows.append([label, "{0}".format(gwr.numNeighs)])

    else:
        label = ARCPY.GetIDMessage(84846) + gwr.distUnitName
        rows.append([label, gwr.createOutputBandwidth(gwr.bandwidth, 
                                                      formatStr = "%0.4f",
                                                      returnUnits = False,
                                                      strip = False)])

    rows.append("EMPTY")
    table = UTILS.outputTextTable(rows, justify = ['left', 'right'],
                                  header = header, pad = 1,
                                  titleFillToken = "-", emphasizeHeadRow=False,
                                  emptyFillToken = "-", force2Txt=False)

    return table

def gaussianGWRMessages(gwr):
    """Creates Global Stat Info Table for All Gaussian GWR Subclasses.

    INPUTS:
    gwr (object): instance of Gaussian GWR, ManualGWR, OptimizedGWR

    RETURN:
    table (str): tabulated string to print
    """

    header = ARCPY.GetIDMessage(84847)
    rows = []

    #### R2 and Adjusted R2 ####
    label = ARCPY.GetIDMessage(84018)
    rows.append([label, UTILS.formatValue(gwr.r2, formatStr = "%0.4f")])

    label = ARCPY.GetIDMessage(84021)
    rows.append([label, UTILS.formatValue(gwr.r2Adj, formatStr = "%0.4f")])

    #### AICc ####
    label = ARCPY.GetIDMessage(84249)
    rows.append([label, UTILS.formatValue(gwr.aicc, formatStr = "%0.4f")])

    #### Sigma-Squared and Sigma-Squared MLE ####
    label = ARCPY.GetIDMessage(84252)
    rows.append([label, UTILS.formatValue(gwr.s2, formatStr = "%0.4f")])

    label = ARCPY.GetIDMessage(84848)
    rows.append([label, UTILS.formatValue(gwr.s2mle, formatStr = "%0.4f")])

    #### Effective Degrees of Freedom ####
    label = ARCPY.GetIDMessage(84849)
    rows.append([label, UTILS.formatValue(gwr.edof, formatStr = "%0.4f")])

    #### Critical T Value ####
    label = ARCPY.GetIDMessage(220499)
    rows.append([label, UTILS.formatValue(gwr.crititcalT, formatStr = "%0.4f")])

    rows.append("EMPTY")
    table = UTILS.outputTextTable(rows, justify = ['left', 'right'],
                                  header = header, pad = 1,
                                  titleFillToken = "-", emphasizeHeadRow=False,
                                  emptyFillToken = "-", force2Txt=False)

    return table

def nonGaussianGWRMessages(gwr):
    """Creates Global Stat Info Table for All Non Gaussian GWR Subclasses.

    INPUTS:
    gwr (object): instance of Non Gaussian GWR, ManualGWR, OptimizedGWR

    RETURN:
    table (str): tabulated string to print
    """

    header = ARCPY.GetIDMessage(84847)
    rows = []

    #### Deviance Reports ####
    label = ARCPY.GetIDMessage(84850)
    rows.append([label, UTILS.formatValue(gwr.globalNullPDev, 
                                          formatStr = "%0.4f")])

    label = ARCPY.GetIDMessage(84851)
    rows.append([label, UTILS.formatValue(gwr.localNullPDev, 
                                          formatStr = "%0.4f")])

    label = ARCPY.GetIDMessage(84852)
    rows.append([label, UTILS.formatValue(gwr.localGlobalPDev, 
                                          formatStr = "%0.4f")])

    #### AICc ####
    label = ARCPY.GetIDMessage(84249)
    rows.append([label, UTILS.formatValue(gwr.aicc, formatStr = "%0.4f")])

    #### Sigma-Squared and Sigma-Squared MLE ####
    label = ARCPY.GetIDMessage(84252)
    rows.append([label, UTILS.formatValue(gwr.s2, formatStr = "%0.4f")])

    label = ARCPY.GetIDMessage(84848)
    rows.append([label, UTILS.formatValue(gwr.s2mle, formatStr = "%0.4f")])

    #### Effective Degrees of Freedom ####
    label = ARCPY.GetIDMessage(84849)
    rows.append([label, UTILS.formatValue(gwr.edof, formatStr = "%0.4f")])

    #### Critical T Value ####
    label = ARCPY.GetIDMessage(220499)
    rows.append([label, UTILS.formatValue(gwr.crititcalT, formatStr = "%0.4f")])

    rows.append("EMPTY")
    table = UTILS.outputTextTable(rows, justify = ['left', 'right'],
                                  header = header, pad = 1,
                                  titleFillToken = "-",
                                  emptyFillToken = "-", emphasizeHeadRow=False,
                                  force2Txt=False)

    return table

def createGWRReport(gwr):
    """Creates Global Stat Info Table for All GWR Subclasses.

    INPUTS:
    gwr (object): instance of GWR, ManualGWR, OptimizedGWR

    RETURN:
    table (str): tabulated string to print
    """

    report = generalGWRMessages(gwr)

    if gwr.continuous:
        report += gaussianGWRMessages(gwr)
    else:
        report += nonGaussianGWRMessages(gwr)

    return report

def getConditionNumber(designMatrix):
    condition = NUM.sqrt(LA.cond(designMatrix))
    #if condition > maxConditionNumber:
    #    condStr = LOCALE.format_string("%0.2f", condition)
    #    ARCPY.AddIDMessage("ERROR", 110155, condStr, str(maxConditionNumber))
    #    raise SystemExit()
    return condition

def createField(name, type=None, aliasName = None):
    """ Method for conveniently creating Field Object
    :param name:
    :param type:
    :return:
    """
    newField = ARCPY.Field()
    newField.name = name
    if type:
        if type.upper() == "INTEGER":
            type = "Long"
        if type.upper() == "SHORT":
            type = "SmallInteger"
        if type.upper() in ["FLOAT", "SINGLE"]:
            type = "Double"
        newField.type = type
    if aliasName:
        newField.aliasName = aliasName
    return newField

def getOutputFCFields(parameters):
    """ Get the list of field names according to user's input.
    The names will be attached to param's schema attribute for model builder
    :param parameters:
    :return:
    """
    modelType = UTILS.getTextParameter(2, parameters).upper()
    standardize = parameters[22].value
    if modelType == 'CONTINUOUS' and standardize:
        return getOutputFCFieldsSTD(parameters)

    fields = []
    descInputFC = ARCPY.Describe(parameters[0].value)
    inputFCFields = dict()
    for fieldObj in descInputFC.fields:
        inputFCFields[fieldObj.name] = fieldObj
    outpath = OS.path.split(UTILS.getTextParameter(4, parameters))[0]
    if outpath is None:
        return []

    fd = inputFCFields[UTILS.getTextParameter(1, parameters)]
    fields.append(createField(fd.name, type=fd.type, aliasName=fd.aliasName))

    for fieldName in UTILS.getTextParameter(3, parameters).split(";"):
        if fieldName in inputFCFields:
            fd = inputFCFields[fieldName]
            fields.append(createField(fd.name, type=fd.type, aliasName=fd.aliasName))
        else:
            return []
    fieldNames = [f.name for f in fields]
    fieldNamesOut = UTILS.createAppendFieldNames(fieldNames, outpath)
    for ind, name in enumerate(fieldNamesOut):
        fields[ind].name = name
    depVarName = fields[0].name.upper()

    #### Add the Calculation Result Fields ####
    #### Intercept ####
    fields.append(createField(gwrInterceptName, type="Double", aliasName=gwrInterceptAlias))

    #### SE ####
    seInterceptName = gwrSEFieldName.format(gwrInterceptName)
    seInterceptAlias = gwrSEFieldAlias.format(gwrInterceptName)
    fields.append(createField(seInterceptName, type="Double", aliasName=seInterceptAlias))

    #### T ####
    tInterceptName = gwrTTestFieldName.format(gwrInterceptName)
    tInterceptAlias = gwrTTestFieldAlias.format(gwrInterceptName)
    fields.append(createField(tInterceptName, type="Double", aliasName=tInterceptAlias))

    #### Sig ####
    sigInterceptName = gwrSigFieldName.format(gwrInterceptName)
    sigInterceptAlias = gwrSigFieldAlias.format(gwrInterceptName)
    fields.append(createField(sigInterceptName, type="Short", aliasName=sigInterceptAlias))

    if parameters[3].value:
        indFieldNames = [f for f in UTILS.getTextParameter(3, parameters).split(";")]
        indVarOut = []
        for fieldName in indFieldNames:
            if fieldName in inputFCFields:
                varName = inputFCFields[fieldName].name.upper()
                indVarOut.append(gwrCoefFieldName.format(varName))
                indVarOut.append(gwrSEFieldName.format(varName))
                indVarOut.append(gwrTTestFieldName.format(varName))
                indVarOut.append(gwrSigFieldName.format(varName))

        indVarOut = UTILS.createAppendFieldNames(indVarOut, outpath)
        for varInd, varName in enumerate(indFieldNames):
            #### Add Coefficient ####
            fieldName = indVarOut[varInd*4]
            alias = gwrCoefFieldAlias.format(varName.upper())
            fields.append(createField(fieldName, type="Double", aliasName=alias))

            #### Add SE ####
            fieldName = indVarOut[varInd * 4 + 1]
            alias = gwrSEFieldAlias.format(varName.upper())
            fields.append(createField(fieldName, type="Double", aliasName=alias))

            #### Add T ####
            fieldName = indVarOut[varInd * 4 + 2]
            alias = gwrTTestFieldAlias.format(varName.upper())
            fields.append(createField(fieldName, type="Double", aliasName=alias))

            #### Add Sig ####
            fieldName = indVarOut[varInd * 4 + 3]
            alias = gwrSigFieldAlias.format(varName.upper())
            fields.append(createField(fieldName, type="Short", aliasName=alias))

    modelType = UTILS.getTextParameter(2, parameters).upper()
    #### Predicted Field ####
    if modelType == 'CONTINUOUS':
        #### Add Prediction Field ####
        alias = gwrPredFieldAlias.format(depVarName)
        fields.append(createField(gwrPredFieldName, type="Double", aliasName=alias))

        #### Other Summary Vectors ####
        if standardize:
            fNames = gwrFCFieldScaledNames
            fAlias = gwrFCFieldScaledAlias
        else:
            fNames = gwrFCFieldNames
            fAlias = gwrFCFieldAlias

        for varInd, varName in enumerate(fNames):
            fields.append(createField(varName, type="Double", aliasName=fAlias[varInd]))

        #### Add Local R2 ####
        fields.append(createField(gwrLocalR2Name, type="Double", aliasName=gwrLocalR2Alias))

    else:
        #### Add Prediction Field ####
        if modelType == "BINARY":
            alias = ggwrProbFieldAlias.format(depVarName)
            fields.append(createField(ggwrProbFieldName, type="Double", aliasName=alias))
            predType = "Integer"

        elif modelType == "COUNT":
            alias = ggwrRawFieldAlias.format(depVarName)
            fields.append(createField(ggwrRawFieldName, type="Double", aliasName=alias))
            predType = "Double"

        alias = gwrPredFieldAlias.format(depVarName)
        fields.append(createField(gwrPredFieldName, type="Double", aliasName=alias))

        #### Other Summary Vectors ####
        for varInd, varName in enumerate(ggwrFCFieldNames):
            fields.append(createField(varName, type="Double", aliasName=ggwrFCFieldAlias[varInd]))

    return fields

def getOutputFCFieldsSTD(parameters):
    """ Get the list of field names according to user's input.
    The names will be attached to param's schema attribute for model builder
    :param parameters:
    :return:
    """
    fields = []
    descInputFC = ARCPY.Describe(parameters[0].value)
    inputFCFields = dict()
    for fieldObj in descInputFC.fields:
        inputFCFields[fieldObj.name] = fieldObj
    outpath = OS.path.split(UTILS.getTextParameter(4, parameters))[0]
    if outpath is None:
        return []

    fd = inputFCFields[UTILS.getTextParameter(1, parameters)]
    fields.append(createField(fd.name, type=fd.type, aliasName=fd.aliasName))
    fields.append(createField(gwrVarScaledName.format(fd.name), 
                              type="Double", 
                              aliasName = gwrVarScaledAlias.format(fd.name)))

    for fieldName in UTILS.getTextParameter(3, parameters).split(";"):
        if fieldName in inputFCFields:
            fd = inputFCFields[fieldName]
            fName = gwrVarScaledName.format(fd.name)
            alias = gwrVarScaledAlias.format(fd.name)
            fields.append(createField(fName, type=fd.type, aliasName=alias))
        else:
            return []
    fieldNames = [f.name for f in fields]
    fieldNamesOut = UTILS.createAppendFieldNames(fieldNames, outpath)
    for ind, name in enumerate(fieldNamesOut):
        fields[ind].name = name
    depVarName = fields[0].name.upper()

    #### Add the Calculation Result Fields ####
    #### Intercept ####
    fieldName = gwrCoefFieldScaledName.format(gwrInterceptName)
    fields.append(createField(fieldName, type="Double", aliasName=gwrInterceptScaledAlias))

    #### SE ####
    fieldName = gwrSEFieldScaledName.format(gwrInterceptName)
    seInterceptAlias = gwrSEFieldScaledAlias.format(gwrInterceptAlias)
    fields.append(createField(fieldName, type="Double", aliasName=seInterceptAlias))

    #### T ####
    fieldName = gwrTTestFieldScaledName.format(gwrInterceptName)
    tInterceptAlias = gwrTTestFieldScaledAlias.format(gwrInterceptAlias)
    fields.append(createField(fieldName, type="Double", aliasName=tInterceptAlias))

    #### Sig ####
    fieldName = gwrSigFieldScaledName.format(gwrInterceptName)
    sigInterceptAlias = gwrSigFieldScaledAlias.format(gwrInterceptAlias)
    fields.append(createField(fieldName, type="Short", aliasName=sigInterceptAlias))

    if parameters[3].value:
        indFieldNames = [f for f in UTILS.getTextParameter(3, parameters).split(";")]
        indVarOut = []
        for fieldName in indFieldNames:
            if fieldName in inputFCFields:
                varName = inputFCFields[fieldName].name.upper()
                indVarOut.append(gwrCoefFieldScaledName.format(varName))
                indVarOut.append(gwrSEFieldScaledName.format(varName))
                indVarOut.append(gwrTTestFieldScaledName.format(varName))
                indVarOut.append(gwrSigFieldScaledName.format(varName))

        indVarOut = UTILS.createAppendFieldNames(indVarOut, outpath)
        for varInd, varName in enumerate(indFieldNames):
            #### Add Coefficient ####
            fieldName = indVarOut[varInd*4]
            alias = gwrCoefFieldScaledAlias.format(varName.upper())
            fields.append(createField(fieldName, type="Double", aliasName=alias))

            #### Add SE ####
            fieldName = indVarOut[varInd * 4 + 1]
            alias = gwrSEFieldScaledAlias.format(varName.upper())
            fields.append(createField(fieldName, type="Double", aliasName=alias))

            #### Add T ####
            fieldName = indVarOut[varInd * 4 + 2]
            alias = gwrTTestFieldScaledAlias.format(varName.upper())
            fields.append(createField(fieldName, type="Double", aliasName=alias))

            #### Add Sig ####
            fieldName = indVarOut[varInd * 4 + 3]
            alias = gwrSigFieldScaledAlias.format(varName.upper())
            fields.append(createField(fieldName, type="Short", aliasName=alias))

    modelType = UTILS.getTextParameter(2, parameters).upper()
    #### Predicted Field ####
    if modelType == 'CONTINUOUS':
        #### Add Prediction Field ####
        alias = gwrPredFieldAlias.format(depVarName)
        fields.append(createField(gwrPredFieldName, type="Double", aliasName=alias))

        #### Scaled Version ####
        alias = gwrPredFieldScaledAlias.format(depVarName)
        fields.append(createField(gwrPredFieldScaledName, type="Double", aliasName=alias))

        #### Other Summary Vectors ####
        for varInd, varName in enumerate(gwrFCFieldNames):
            fields.append(createField(varName, type="Double", aliasName=gwrFCFieldAlias[varInd]))

        #### Add Local R2 ####
        fields.append(createField(gwrLocalR2Name, type="Double", aliasName=gwrLocalR2Alias))

def getPredictFCFields(parameters):
    """
    Get the list of field names according to user's input.
    The names will be attached to param's schema attribute for model builder
    :param parameters:
    :return:
    """

    fields = []
    modelType = UTILS.getTextParameter(2, parameters).upper()
    standardize = parameters[22].value
    doSTD = modelType == 'CONTINUOUS' and standardize

    depVarName = UTILS.getTextParameter(1, parameters)
    descPredFC = ARCPY.Describe(parameters[16].value)
    outpath = OS.path.split(UTILS.getTextParameter(18, parameters))[0]
    predFCFields = dict()
    for fieldObj in descPredFC.fields:
        predFCFields[fieldObj.name] = fieldObj

    predVarNames = [vRow[0].value for vRow in parameters[17].value]
    predVarOutTemp = []
    predCoefOutTemp = []
    predVarFields = []
    for fieldName in predVarNames:
        if fieldName in predFCFields:
            fd = predFCFields[fieldName]
            predVarFields.append(fd)
            if doSTD:
                predVarOutTemp.append(gwrVarScaledName.format(fd.name))
                predCoefOutTemp.append(gwrCoefFieldScaledName.format(fd.name))
            else:
                predVarOutTemp.append(fd.name)
                predCoefOutTemp.append(gwrCoefFieldName.format(fd.name))
        else:
            return []

    #### Add Var/Scaled Var Fields ####
    predVarOut = UTILS.createAppendFieldNames(predCoefOutTemp, outpath)
    for ind, fd in enumerate(predVarFields):
        if doSTD:
            alias = gwrVarScaledAlias.format(fd.name)
            fields.append(createField(predVarOut[ind], type=fd.type, aliasName=alias))
        else:
            fields.append(createField(predVarOut[ind], type=fd.type, aliasName=fd.aliasName))

    #### Add Coefficients ####
    coefVarOut = UTILS.createAppendFieldNames(predCoefOutTemp, outpath)
    for ind, fd in enumerate(predVarFields):
        if doSTD:
            alias = gwrCoefFieldScaledAlias.format(fd.name)
            fields.append(createField(coefVarOut[ind], type="Double", aliasName=alias))
        else:
            alias = gwrCoefFieldAlias.format(fd.name)
            fields.append(createField(coefVarOut[ind], type="Double", aliasName=alias))

    #### Add Prediction Field ####
    if depVarName is not None:
        depVarName = depVarName.upper()
        predType = "Double"
        if modelType == "BINARY":
            alias = ggwrProbFieldAlias.format(depVarName)
            fields.append(createField(ggwrProbFieldName, type="Double", aliasName=alias))
            predType = "Integer"
        elif modelType == "COUNT":
            alias = ggwrRawFieldAlias.format(depVarName)
            fields.append(createField(ggwrRawFieldName, type="Double", aliasName=alias))

        if doSTD:
            #### Raw Dep Var ####
            alias = gwrPredFieldAlias.format(depVarName)
            fields.append(createField(gwrPredFieldName, type=predType, aliasName=alias))

            #### Scaled Dep Var ####
            alias = gwrPredFieldScaledAlias.format(depVarName)
            scaledName = gwrPredFieldScaledName.format(depVarName)
            fields.append(createField(scaledName, type=predType, aliasName=alias))
        else:
            #### Raw Dep Var ####
            alias = gwrPredFieldAlias.format(depVarName)
            fields.append(createField(gwrPredFieldName, type=predType, aliasName=alias))

    #### Add Number of Neighs ####
    # The situations in which the field - "Number of Neighbors" will be added:
    # - Local Weighting Scheme: [Bisquare]
    # - Neighborhood Type:
    #     - [Distanceband]
    #     - [Number of neighbors]
    #         - Neighborhood Selection Method: [Optimized]

    addNumNeighsField = False
    kernel = UTILS.getTextParameter(20, parameters)
    if kernel is None:
        kernel = "BISQUARE"
    if kernel == "BISQUARE":
        neighborType = UTILS.getTextParameter(5, parameters)
        if neighborType == "DISTANCE_BAND":
            addNumNeighsField = True
        elif neighborType == "NUMBER_OF_NEIGHBORS":
            neighborMethod = UTILS.getTextParameter(6, parameters)
            if neighborMethod == "OPTIMIZED":
                addNumNeighsField = True
    if addNumNeighsField:
        fields.append(createField(gwrNumNeighName, type="Long", aliasName=gwrNumNeighAlias))

    fieldNames = [f.name for f in fields]
    fieldNamesOut = UTILS.createAppendFieldNames(fieldNames, outpath)
    for ind, name in enumerate(fieldNamesOut):
        fields[ind].name = name

    return fields

def combineExtets(ext1, ext2):
    """
    combine two Extent to get the extended one
    """
    return ARCPY.Extent(
        min(ext1.XMin, ext2.XMin),
        min(ext1.YMin, ext2.YMin),
        max(ext1.XMax, ext2.XMax),
        max(ext1.YMax, ext2.YMax)
    )

class PredictGWR(object):
    """Predicts Output Features/Rasters based on GWR Results.

    INPUTS:
    gwr (obj): instance of GWR Class
    robost {bool, False}: Whether to remove neighbor features with 
                          abs. std. residuals >= 3.0

    ATTRIBUTES:

    METHODS:
    __setNeighborCalculation
    __setPredictionWeights
    __gaussianMaxKNNInfo
    __gaussianKNNInfo
    __gaussianMaxDistanceInfo
    __gaussianDistanceInfo
    __bisquareKNNInfo
    __bisquareDistanceInfo
    predictCoefficients
    predict
    __getLogitPredictionFields
    getPredictionFields
    createPredictionFC
    createPredictionRasters
    """

    def __init__(self, gwr, robust = False):
        #### check if GWR is supported for current shipset ####
        if not hasattr(ARC._ss, "GWR"):
            ARCPY.AddIDMessage("ERROR", 110472)
            raise SystemExit()

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())
        self.standardize = self.gwr.standardize

        #### Set Robust to False for Non-Continuous ####
        if not self.gwr.continuous:
            self.robust = False

        self.predSSDO = None

        #### Create Local Info Function Pointer ####
        self.__setNeighborCalculation()

        #### Create Prediction Weights ####
        self.__setPredictionWeights()

    def __setNeighborCalculation(self):
        if self.gwr.kernel == "BISQUARE":
            if self.gwr.useKNN:
                self.getLocalInfo = self.__bisquareKNNInfo
            else:
                self.getLocalInfo = self.__bisquareDistanceInfo
        else:
            if self.gwr.useKNN:
                if self.gwr.globalSearch:
                    self.getLocalInfo = self.__gaussianMaxKNNInfo
                else:
                    self.getLocalInfo = self.__gaussianKNNInfo
            else:
                if self.gwr.globalSearch:
                    self.getLocalInfo = self.__gaussianMaxDistanceInfo
                else:
                    self.getLocalInfo = self.__gaussianDistanceInfo

    def __gaussianMaxKNNInfo(self, coordinates):
        """Gaussian Weight Information for KNN with less than 1000 features
        1) KNN Neighbor Search with given numNeighs
        2) Last distance in ordered list of distances is the bandwidth
        3) All locations get weights
        """

        info = self.gwr.kdTree.query(coordinates, k = self.gwr.numNeighs, p = 2)
                                    
        localBandwidth = info[0][-1]

        distances = NUM.sqrt(((coordinates - self.gwr.coords)**2.0).sum(1))

        #### Get Weights ####
        weights = NUM.exp(-.5 * (distances / localBandwidth)**2.0) 

        #### Account for Robust Calc ####
        weights = weights * self.robustWeights

        #### Get Weighted Average of Coefficients ####
        nn = len(weights)
        weights.shape = nn, 1
        return nn, (weights * self.gwr.coef).sum(0) / weights.sum(0)

    def __gaussianKNNInfo(self, coordinates):
        """Gaussian Weight Information for KNN with more than 1000 features
        1) KNN Neighbor Search with knn set to 1000. 
        2) numNeighs index in ordered list of distances is the bandwidth
        2) 1000 features get weights
        """

        info = self.gwr.kdTree.query(coordinates, k = 1000, p = 2)
        distances, neighs = info
        localBandwidth = distances[self.gwr.numNeighs]

        #### Get Weights ####
        weights = NUM.exp(-.5 * (distances / localBandwidth)**2.0) 

        #### Account for Robust Calc ####
        weights = weights * self.robustWeights[neighs]

        #### Get Weighted Average of Coefficients ####
        nn = len(weights)
        weights.shape = nn, 1
        return nn, (weights * self.gwr.coef[neighs]).sum(0) / weights.sum(0)

    def __gaussianMaxDistanceInfo(self, coordinates):
        """Gaussian Weight Information for Distance with less than 1000 features
        1) No neighbor search
        2) Bandwidth given
        2) All locations get weights
        """

        distances = NUM.sqrt(((coordinates - self.gwr.coords)**2.0).sum(1))

        #### Get Weights ####
        weights = NUM.exp(-.5 * (distances / self.gwr.bandwidth)**2.0) 

        #### Account for Robust Calc ####
        weights = weights * self.robustWeights

        #### Get Weighted Average of Coefficients ####
        nn = len(weights)
        weights.shape = nn, 1
        return nn, (weights * self.gwr.coef).sum(0) / weights.sum(0)

    def __gaussianDistanceInfo(self, coordinates):
        """Gaussian Weight Information for Distance with less than 1000 features
        1) KNN Neighbor Search with knn set to 1000.
        2) Bandwidth given
        2) 1000 features get weights
        """

        info = self.gwr.kdTree.query(coordinates, k = 1000, p = 2)
        distances, neighs = info

        #### Get Weights ####
        weights = NUM.exp(-.5 * (distances / self.gwr.bandwidth)**2.0) 

        #### Account for Robust Calc ####
        weights = weights * self.robustWeights[neighs]

        #### Get Weighted Average of Coefficients ####
        nn = len(weights)
        weights.shape = nn, 1
        return nn, (weights * self.gwr.coef[neighs]).sum(0) / weights.sum(0)

    def __bisquareKNNInfo(self, coordinates):
        """Bisquare Weight Information for KNN
        1) KNN Neighbor Search with knn set to 1000.
        2) Last distance in ordered list of distances is the bandwidth
        3) Only neighbors get weights
        """

        info = self.gwr.kdTree.query(coordinates, k = self.gwr.numNeighs, p = 2)
        distances, neighs = info
        localBandwidth = distances[-1]

        #### Get Weights ####
        weights = (1.0 - (distances / localBandwidth)**2.0)**2.0

        #### Account for Robust Calc ####
        weights = weights * self.robustWeights[neighs]

        #### Get Weighted Average of Coefficients ####
        nn = len(weights)
        weights.shape = nn, 1
        return nn, (weights * self.gwr.coef[neighs]).sum(0) / weights.sum(0)

    def __bisquareDistanceInfo(self, coordinates):
        """Bisquare Weight Information for Distance
        1) Distance Search 
        2) Bandwidth given
        3) If less than 20 Neighbors
            a) Do KNN Search Set to 20
            b) Still use given bandwidth
        4) Trim neighbors to limit of 1000 features
        5) Only neighbors get weights
        """

        neighs = self.gwr.kdTree.query_ball_point(coordinates, 
                                                  r = self.gwr.bandwidth, 
                                                  p = 2)
        nn = len(neighs)

        if nn < 1:
            #### Return 0 Coef and Replace Later with NAN or -9999 ####
            return 0, 0.0

        if nn > gwrMaxNumNeighs:
            #### Use KNN Max Num Neighs ####
            info = self.gwr.kdTree.query(coordinates, k = gwrMaxNumNeighs, p = 2)
            distances, neighs = info
        else:
            #### Calculate Distances for Distance Based ####
            distances = NUM.sqrt(((coordinates - self.gwr.coords[neighs])**2.0).sum(1))

        #### Get Weights ####
        weights = (1.0 - (distances / self.gwr.bandwidth)**2.0)**2.0

        #### Account for Robust Calc ####
        weights = weights * self.robustWeights[neighs]

        #### Get Weighted Average of Coefficients ####
        try:
            nn = len(weights)
            weights.shape = nn, 1
        except:
            pass
        return nn, (weights * self.gwr.coef[neighs]).sum(0) / weights.sum(0)

    def __setPredictionWeights(self):
        if self.robust:
            self.robustWeights = NUM.asarray(abs(self.gwr.stdResiduals) < 3.0, dtype = float).ravel()
        else:
            self.robustWeights = NUM.ones(self.gwr.n)

    def predictCoefficients(self, coords, analysisMask = None):
        #### Set Analysis Mask ####
        n = len(coords)
        if analysisMask is None:
            analysisMask = NUM.ones(n, dtype = bool)
        numPredictions = analysisMask.sum()

        #### Set Num Neighs ####
        numNeighs = NUM.zeros((n,), dtype = NUM.int32)

        #### Create Progressor ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84799), 0, numPredictions, 1)

        #### Core Calculation ####
        coefficients = NUM.zeros((n, self.gwr.k), dtype = float) 
        for orderID in UTILS.ssRange(n):
            if analysisMask[orderID]:
                nn, coef = self.getLocalInfo(coords[orderID])
                coefficients[orderID] = coef

                #### Store Neighs ####
                numNeighs[orderID] = nn

                #### Reset Progessor ####
                ARCPY.SetProgressorPosition()

        #### Warn No Neighbors ####
        numNoNeighs = (numNeighs == 0).sum()
        if numNoNeighs:
            if numNoNeighs == numPredictions:
                #### Fail if All Predictions NULL ####
                ARCPY.AddIDMessage("ERROR", 110255)
                raise SystemExit()
            else:
                #### Warning ####
                ARCPY.AddIDMessage("WARNING", 110540)

        return coefficients, numNeighs

    def reverseStandarizePred(self, coef, rawX):
        n = len(rawX)
        reverseCoef = coef.copy()
        reversePred = NUM.zeros(n, dtype=float)
        for ind in range(1, self.gwr.k):
            reverseCoef[:, ind] *= (self.gwr.ySTD / self.gwr.xSTD[ind])
    
        for i in range(n):
            reverseCoef[i, 0] = reverseCoef[i, 0] * self.gwr.ySTD + self.gwr.yMean - NUM.dot(self.gwr.xMean[1:], reverseCoef[i,1:])
            reversePred[i] = NUM.dot(rawX[i], reverseCoef[i])

        return reversePred

    def predictSTD(self, coords, x, rawX, setNumNeighs = False):
        coefficients, numNeighs = self.predictCoefficients(coords)
        if setNumNeighs:
            self.calcNumNeighs = numNeighs

        yHat = (x * coefficients).sum(1).reshape(len(x), 1)
        yReversed = self.reverseStandarizePred(coefficients, rawX)

        #### Reverse Mask Coef/YHat ####
        noNeighs = numNeighs == 0
        if noNeighs.sum():
            coefficients[noNeighs] = NUM.nan
            yHat[noNeighs] = NUM.nan
            yReversed[noNeighs] = NUM.nan 
            
        return yHat, yReversed, coefficients

    def predict(self, coords, x, setNumNeighs = False):
        coefficients, numNeighs = self.predictCoefficients(coords)
        if setNumNeighs:
            self.calcNumNeighs = numNeighs

        yHat = (x * coefficients).sum(1).reshape(len(x), 1)

        #### Reverse Mask Coef/YHat ####
        noNeighs = numNeighs == 0
        if noNeighs.sum():
            coefficients[noNeighs] = NUM.nan
            yHat[noNeighs] = NUM.nan

        return yHat, coefficients

    def __getGGWRPredictionFields(self, outPath, yPredicted, coef):
        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        fieldOrder = []

        #### Add Prediction Field ####
        isLogit = self.gwr.family == "LOGIT"
        if isLogit:
            yPredictedValue = NUM.ones(len(yPredicted), dtype = NUM.int32) * -2147483648
        else:
            yPredictedValue = NUM.ones(len(yPredicted), dtype = float) * NUM.nan

        #### Set NULL Predictions to 0, Round Others ####
        noNull = ~NUM.isnan(yPredicted)
        yPredictedValue[noNull] = NUM.round(yPredicted[noNull])
        fieldData = [yPredicted.ravel(), yPredictedValue.ravel()]
        if self.gwr.family == "LOGIT":
            fieldNames = [ggwrProbFieldName]
            aliasNames = [ggwrProbFieldAlias]
            fieldTypes = ["DOUBLE", "LONG"]
        else:
            fieldNames = [ggwrRawFieldName]
            aliasNames = [ggwrRawFieldAlias]
            fieldTypes = ["DOUBLE", "DOUBLE"]

        fieldNames.append(gwrPredFieldName)
        aliasNames.append(gwrPredFieldAlias)

        for fieldInd, fieldName in enumerate(fieldNames):
            alias = aliasNames[fieldInd].format(self.gwr.depVarName)
            candidateField = SSDO.CandidateField(fieldName, fieldTypes[fieldInd], 
                                                 fieldData[fieldInd],
                                                 alias = alias,
                                                 checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        indVarOut = [gwrInterceptName]
        for varName in self.gwr.indVarNames:
            indVarOut.append(gwrCoefFieldName.format(varName))

        indVarOut = UTILS.createAppendFieldNames(indVarOut, outPath)
        for varInd in range(self.gwr.k):
            #### Add Coefficient ####
            fieldName = indVarOut[varInd]
            if not varInd:
                #### Intercept ####
                alias = gwrInterceptAlias
            else:
                alias = gwrCoefFieldAlias.format(self.gwr.indVarNames[varInd-1])

            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", coef[:,varInd], alias = alias,
                                                 checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Add Number of Neighs ####
        if self.gwr.setNumNeighs:
            alias = gwrNumNeighAlias
            candidateField = SSDO.CandidateField(gwrNumNeighName, "DOUBLE", 
                                                 self.calcNumNeighs,
                                                 alias = alias)
            candidateFields[gwrNumNeighName] = candidateField
            fieldOrder.append(gwrNumNeighName)
        return candidateFields, fieldOrder

    def getPredictionFields(self, outPath, yHat, coef):
        #### GGWR Options ####
        if not self.gwr.continuous:
            family = ARC._ss.GLR_Family(family = self.gwr.family)
            yPredicted = family.inv_link(yHat)
            return self.__getGGWRPredictionFields(outPath, yPredicted, coef)

        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        fieldOrder = []
        alias = gwrPredFieldAlias.format(self.gwr.depVarName)
        candidateField = SSDO.CandidateField(gwrPredFieldName, "DOUBLE",
                                             yHat.ravel(),
                                             alias = alias,
                                             checkNullValues = True)
        candidateFields[gwrPredFieldName] = candidateField
        fieldOrder.append(gwrPredFieldName)

        indVarOut = [gwrInterceptName]
        for varName in self.gwr.indVarNames:
            indVarOut.append(gwrCoefFieldName.format(varName))

        indVarOut = UTILS.createAppendFieldNames(indVarOut, outPath)
        for varInd in range(self.gwr.k):
            #### Add Coefficient ####
            fieldName = indVarOut[varInd]
            if not varInd:
                #### Intercept ####
                alias = gwrInterceptAlias
            else:
                alias = gwrCoefFieldAlias.format(self.gwr.indVarNames[varInd-1])

            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", coef[:,varInd], alias = alias,
                                                 checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Add Number of Neighs ####
        if self.gwr.setNumNeighs:
            alias = gwrNumNeighAlias
            candidateField = SSDO.CandidateField(gwrNumNeighName, "DOUBLE", 
                                                 self.calcNumNeighs,
                                                 alias = alias)
            candidateFields[gwrNumNeighName] = candidateField
            fieldOrder.append(gwrNumNeighName)

        return candidateFields, fieldOrder

    def getPredictionFieldsSTD(self, outPath, yHat, yReversed, coef, xSTD):

        #### Create/Populate Dictionary of Candidate Fields ####
        candidateFields = {}
        fieldOrder = []

        #### Add Standardized Input Variables (Including Scaled Y) ####
        xScaledOut = []
        for varName in self.gwr.indVarNames:
            xScaledOut.append(gwrVarScaledName.format(varName))

        scaledVarOut = UTILS.createAppendFieldNames(xScaledOut, outPath)
        for varInd in range(1, self.gwr.k):
            fieldName = scaledVarOut[varInd - 1]

            #### Add Values ####
            alias = gwrVarScaledAlias.format(self.gwr.indVarNames[varInd - 1])
            data = xSTD[:,varInd].ravel()

            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", data,
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        alias = gwrPredFieldAlias.format(self.gwr.depVarName)
        candidateField = SSDO.CandidateField(gwrPredFieldName, "DOUBLE",
                                             yReversed.ravel(),
                                             alias = alias,
                                             checkNullValues = True)
        candidateFields[gwrPredFieldName] = candidateField
        fieldOrder.append(gwrPredFieldName)

        #### Scaled ####
        alias = gwrPredFieldScaledAlias.format(self.gwr.depVarName)
        candidateField = SSDO.CandidateField(gwrPredFieldScaledName, "DOUBLE",
                                             yHat.ravel(),
                                             alias = alias,
                                             checkNullValues = True)
        candidateFields[gwrPredFieldScaledName] = candidateField
        fieldOrder.append(gwrPredFieldScaledName)

        indVarOut = [gwrCoefFieldScaledName.format(gwrInterceptName)]
        for varName in self.gwr.indVarNames:
            indVarOut.append(gwrCoefFieldScaledName.format(varName))

        indVarOut = UTILS.createAppendFieldNames(indVarOut, outPath)
        for varInd in range(self.gwr.k):
            #### Add Coefficient ####
            fieldName = indVarOut[varInd]
            if not varInd:
                #### Intercept ####
                alias = gwrInterceptScaledAlias
            else:
                alias = gwrCoefFieldScaledAlias.format(self.gwr.indVarNames[varInd-1])

            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", coef[:,varInd], alias = alias,
                                                 checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Add Number of Neighs ####
        if self.gwr.setNumNeighs:
            alias = gwrNumNeighAlias
            candidateField = SSDO.CandidateField(gwrNumNeighName, "DOUBLE", 
                                                 self.calcNumNeighs,
                                                 alias = alias)
            candidateFields[gwrNumNeighName] = candidateField
            fieldOrder.append(gwrNumNeighName)

        return candidateFields, fieldOrder

    def createPredictionFC(self, inputFC, outputFC, indVarNames = None):
        ARCPY.env.overwriteOutput = True

        #### Create Default Field Mapper ####
        if indVarNames is None:
            indVarNames = self.gwr.indVarNames

        #### Create SSDataObject ####
        ssdo = SSDO.SSDataObject(inputFC, explicitSpatialRef = self.gwr.ssdo.spatialRef)
        ssdo.obtainData(ssdo.oidName, indVarNames)
        self.predSSDO = ssdo

        #### Make Sure the PredictInputFC is Within the 30% extended boundary of inputFC ####
        bufferRatio = 0.3 / 2
        if self.gwr.ssdo.useChordal:
            spatialRef = self.gwr.ssdo.spatialRef
            sliceInfo = self.gwr.ssdo.sliceInfo
            bufferDistance = ((sliceInfo.bottomX + sliceInfo.topX) / 2 + sliceInfo.leftY) / 2 * bufferRatio
            bufferedBoundary = self.gwr.ssdo.extent.polygon._arc_object.bufferex(bufferDistance, 9001, 1)
            geoms = ssdo.getShapesAsArray()
            for g in geoms:
                if bufferedBoundary.disjoint(g._arc_object):
                    ARCPY.AddIDMessage("ERROR", 110256)
                    raise SystemExit()
        else:
            extentXmin = self.gwr.ssdo.extent.XMin - self.gwr.ssdo.extent.width * bufferRatio
            extentXmax = self.gwr.ssdo.extent.XMax + self.gwr.ssdo.extent.width * bufferRatio
            extentYmin = self.gwr.ssdo.extent.YMin - self.gwr.ssdo.extent.height * bufferRatio
            extentYmax = self.gwr.ssdo.extent.YMax + self.gwr.ssdo.extent.height * bufferRatio
            geoms = ssdo.getShapesAsArray()
            for g in geoms:
                outOfInputBuffer = False
                if g.centroid.X < extentXmin or g.centroid.X > extentXmax:
                    outOfInputBuffer = True
                if g.centroid.Y < extentYmin or g.centroid.Y > extentYmax:
                    outOfInputBuffer = True
                if outOfInputBuffer:
                    ARCPY.AddIDMessage("ERROR", 110256)
                    raise SystemExit()
            
        #### Create Design Matrix ####
        x = NUM.ones((ssdo.numObs, self.gwr.k), dtype = float)
        xSTD = NUM.ones((ssdo.numObs, self.gwr.k), dtype = float)
        for column, variable in enumerate(indVarNames):
            rawData = ssdo.fields[variable].returnDouble()
            x[:,column + 1] = rawData
            xSTD[:,column + 1] = (rawData - self.gwr.xMean[column + 1]) / self.gwr.xSTD[column + 1] 

        #### Create CKDTree ####
        if ssdo.useChordal:
            #### Chordal Distance XYZ ###
            coords = ssdo.spheroidCoords
        else:
            coords = ssdo.xyCoords

        #### Do Prediction ####
        if self.standardize:
            yHat, yReversed, coef = self.predictSTD(coords, xSTD, x, setNumNeighs = self.gwr.setNumNeighs)
        else:
            yHat, coef = self.predict(coords, x, setNumNeighs = self.gwr.setNumNeighs)

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)

        #### Create/Populate Dictionary of Candidate Fields ####
        if self.standardize:
            candidateFields, fieldOrder = self.getPredictionFieldsSTD(outPath, yHat.ravel(), yReversed.ravel(), coef, xSTD)
        else:
            candidateFields, fieldOrder = self.getPredictionFields(outPath, yHat.ravel(), coef)

        #### Write Data to Output Feature Class ####
        if self.standardize:
            ssdo.output2NewFC(outputFC, candidateFields, fieldOrder = fieldOrder)
        else:
            ssdo.output2NewFC(outputFC, candidateFields, fieldOrder = fieldOrder,
                              appendFields = indVarNames)

    def createPredictionRasters(self, ssdo, cellSize, outputDir, outputPref = None):
        ARCPY.env.overwriteOutput = True
        
        #### Check If User Has the Advanced License to Conduct This Analysis ####
        if not checkLicense() and outputDir is not None:
            ARCPY.AddIDMessage("ERROR", 110257)
            raise SystemExit()

        #### Create Progressor (Study Area) ####
        ARCPY.SetProgressor("default", ARCPY.GetIDMessage(84248))

        #### Get Extent Study Area ####
        if ssdo.shapeType.upper() == "POLYGON":
            polyDict, polyAreas = UTILS.readPolygonFC(ssdo.inputFC,
                                                      spatialRef = ssdo.spatialRef,
                                                      useGeodesic = ssdo.useChordal)
            extent = UTILS.getPolyExtent(polyDict)
        else:
            extent = ssdo.extent

        if self.predSSDO is not None:
            if self.predSSDO.shapeType.upper() == "POLYGON":
                polyDict, polyAreas = UTILS.readPolygonFC(self.predSSDO.inputFC,
                                                          spatialRef=ssdo.spatialRef,
                                                          useGeodesic=ssdo.useChordal)
                predExtent = UTILS.getPolyExtent(polyDict)
            else:
                predExtent = self.predSSDO.extent
            extent = combineExtets(extent, predExtent)

        envelope = UTILS.Envelope(extent)

        #### Cell Info ####
        minX = extent.XMin
        maxX = extent.XMax
        minY = extent.YMin
        maxY = extent.YMax

        #### Columns ####
        nc = NUM.floor(envelope.lenX / cellSize)
        gridWidth = nc * cellSize

        if (minX + gridWidth) < maxX:
            nc += 1.0
            gridWidth += cellSize

        #### Adjust Extent ####
        diffWidth = gridWidth - envelope.lenX
        minX = minX - (diffWidth / 2.0)

        numCols = int(nc)

        #### Rows ####
        nr = NUM.floor(envelope.lenY / cellSize)
        gridHeight = nr * cellSize

        if (maxY - gridHeight) > minY:
          nr += 1.0
          gridHeight += cellSize

        #### Adjust Extent ####
        diffHeight = gridHeight - envelope.lenY
        maxY = maxY + (diffHeight / 2.0)

        numRows = int(nr)

        #### Recalculate MaxX and MinY ####
        maxX = minX + (nc * cellSize)
        minY = maxY - (nr * cellSize)

        #### Create Cube Info Class ####
        cubeInfo = ARC._ss.CubeInfo(numRows, numCols, 1, cellSize)

        #### Get Analysis Polygon to Clip ####
        if ssdo.shapeType.upper() == "POINT":
            #### Use Convex Hull ####
            tempFC = True
            studyAreaFC = UTILS.returnScratchName("rasterBound_FC")
            UTILS.minBoundGeomPoints(ssdo.xyCoords, studyAreaFC,
                                     geomType = "CONVEX_HULL",
                                     spatialRef = ssdo.spatialRef)
        else:
            tempFC = False
            studyAreaFC = ssdo.inputFC

        #### Get Analysis Mask ####
        analysisMask = cubeInfo.get_polygon_mask(studyAreaFC, minX, maxY,
                                                 ssdo.spatialRef)

        if tempFC:
            UTILS.passiveDelete(studyAreaFC)

        if self.predSSDO:
            if self.predSSDO.shapeType.upper() == "POINT":
                #### Use Convex Hull ####
                tempFC = True
                studyAreaFC = UTILS.returnScratchName("rasterBound_FC_pred")
                UTILS.minBoundGeomPoints(self.predSSDO.xyCoords, studyAreaFC,
                                         geomType="CONVEX_HULL",
                                         spatialRef=ssdo.spatialRef)
            else:
                tempFC = False
                studyAreaFC = self.predSSDO.inputFC

            #### Get Analysis Mask ####
            analysisMaskPred = cubeInfo.get_polygon_mask(studyAreaFC, minX, maxY,
                                                         ssdo.spatialRef)
            if tempFC:
                UTILS.passiveDelete(studyAreaFC)

            if analysisMask is not None and analysisMaskPred is not None:
                analysisMask = NUM.logical_or(analysisMask, analysisMaskPred)

        #### Create Count and Summary Variable Analysis Mask ####
        centroids = cubeInfo.return_centroids(minX, maxY)

        #### Convert to 3D for Chordal ####
        if ssdo.useChordal:
            centroids = ARC._ss.lonlat_to_xy(centroids, ssdo.spatialRef)

        #### Create Coefficients ####
        if analysisMask is not None:
            centroidsValid = centroids[analysisMask].copy()

        #### Create Coefficients ####
        coef = NUM.full((len(centroids), self.gwr.k), -9999.0, dtype=float)
        predValidCoef, numNeighs = self.predictCoefficients(centroidsValid)

        #### Reverse Mask Coef ####
        noNeighs = numNeighs == 0
        if noNeighs.sum():
            #### No Neighbors ####
            predValidCoef[noNeighs] = -9999.0 

        if analysisMask is not None:
            coef[analysisMask] = predValidCoef

        #### Create Output Rasters ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84798), 0, self.gwr.k, 1)

        #### Try/Except/Finally for Rasters with Given Spatial Ref ####
        oldSpatialRef = ARCPY.env.outputCoordinateSystem

        #### Store Output Raster Layers ####
        outRasterLayers = []

        try:
            #### Set Spatial Ref ####
            ARCPY.env.outputCoordinateSystem = ssdo.spatialRef

            #### Get Base Workspace Type ####
            baseType = UTILS.getBaseWorkspaceType(outputDir)
            ext = ""
            delRaster = False
            if baseType.upper() == "FILESYSTEM":
                #### Add tif Extension for Folders ####
                ext = ".tif"
                delRaster = True

            #### Create Origin and Intercept Raster ####
            geom = ARCPY.Point(minX, minY)
            values = coef[:,0].reshape(numRows, numCols)
            raster = ARCPY.NumPyArrayToRaster(values, geom, cellSize, cellSize, -9999.)
            if self.standardize:
                interName = "S_INTERCEPT"
            else:
                interName = "INTERCEPT"
            if outputPref is not None:
                interName = outputPref + "_" + interName
            outName = OS.path.join(outputDir, interName) + ext
            if delRaster:
                UTILS.passiveDelete(outName)
            raster.save(outName)
            outRasterLayers.append(raster)
            
            #### Reset Progessor ####
            ARCPY.SetProgressorPosition()

            #### Create Slope Rasters ####
            for varInd, varName in enumerate(self.gwr.indVarNames):
                values = coef[:,varInd+1].reshape(numRows, numCols)
                raster = ARCPY.NumPyArrayToRaster(values, geom, cellSize, cellSize, -9999.)
                if self.standardize:
                    varNameOut = "S_" + varName
                else:
                    varNameOut = varName
                if outputPref is not None:
                    varNameOut = outputPref + "_" + varNameOut
                outName = OS.path.join(outputDir, ARCPY.ValidateFieldName(varNameOut, ARCPY.env.scratchGDB)) + ext
                if delRaster:
                    UTILS.passiveDelete(outName)
                raster.save(outName)
                outRasterLayers.append(raster)

                #### Reset Progessor ####
                ARCPY.SetProgressorPosition()

        except:
            ARCPY.AddIDMessage("ERROR", 110221)
            raise SystemExit()

        finally:
            ARCPY.env.outputCoordinateSystem = oldSpatialRef

        return outRasterLayers

class BaseGWR(object):
    """Computes Geographically Weighted Regression.

    INPUTS:
    ssdo (obj): instance of SSDataObject
    depVarName (str): name of dependent variable field
    indVarNames (list): name of independent variable field(s)
    bandwidth (float): kernel bandwidth for spatial weighting
    kernel (str): "BISQUARE", "GAUSSIAN"

    ATTRIBUTES:
    n (int): # of observations
    k (int): # of independent variables
    q (int): # of restrictions (k - 1)
    dof (int): degrees of freedom (n - k)
    y (array): nx1 array of dependent variable values
    x (array): nxk array of independent variable values
    coef (array): kx1 vector of beta coefficients
    yHat (array): nx1 predicted dependent variables
    yBar (float): mean of dependent variable
    residuals (array): nx1 vector of regression residuals
    edof (float): effective degrees of freedom
    s2 (float): normalized residual sum of squares
    ess (float): Error Sum of Squares
    tss (float): Total Sum of Squares
    varCoef (array): (nxk) Variance-Covariance Matrix
    seCoef (array): (nxk) Standard Errors for Coeffs

    METHODS:
    initialize
    initializeSearch
    calculate
    report
    """

    def __init__(self, ssdo, depVarName, indVarNames, 
                 kernel = "BISQUARE", family = "GAUSSIAN",
                 standardize = False, silentMessages = False):

        #### check if GWR is supported for current shipset ####
        if not hasattr(ARC._ss, "GWR"):
            ARCPY.AddIDMessage("ERROR", 110472)
            raise SystemExit()

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set Family Flag ####
        self.continuous = self.family == "GAUSSIAN"
        if not self.continuous:
            self.standardize = False

        #### Global Coincident Point Checker ####
        if not silentMessages:
            globalGWRCoincidentPointChecker(ssdo)

        #### Initialize Data ####
        self.__initialize()

    def __initialize(self):
        """Performs additional validation and populates the
        SSDataObject."""

        #### Shorthand Attributes ####
        ssdo = self.ssdo

        #### MasterField Can Not Be The Dependent Variable ####
        if ssdo.masterField == self.depVarName:
            ARCPY.AddIDMessage("ERROR", 945, ssdo.masterField,
                               ARCPY.GetIDMessage(84112))
            raise SystemExit()

        #### Remove the MasterField from Independent Vars ####
        if ssdo.masterField in self.indVarNames:
            self.indVarNames.remove(ssdo.masterField)
            ARCPY.AddIDMessage("WARNING", 736, ssdo.masterField)

        #### Remove the Dependent Variable from Independent Vars ####
        if self.depVarName in self.indVarNames:
            self.indVarNames.remove(self.depVarName)
            if not self.silentMessages:
                ARCPY.AddIDMessage("WARNING", 850, self.depVarName)

        #### Raise Error If No Independent Vars ####
        if not len(self.indVarNames):
            ARCPY.AddIDMessage("ERROR", 737)
            raise SystemExit()

        #### Create Dependent Variable ####
        self.allVars = [self.depVarName] + self.indVarNames
        yData = ssdo.fields[self.depVarName].returnDouble()

        #### Round Data and Check Negative ####
        if self.family == "LOGIT":
            yData = UTILS.createBinaryVariable(yData)
        if self.family == "POISSON":
            yData = UTILS.createCountVariable(yData)

        self.n = ssdo.numObs
        self.ids = NUM.arange(self.n, dtype = NUM.int32)
        self.y = NUM.empty((self.n, 1), dtype = float)
        self.y[:,0] = yData

        #### Assure that Variance is Larger than Zero ####
        zeroVarFields = []
        yVar = NUM.var(self.y)
        if NUM.isnan(yVar) or yVar <= 0.0:
            zeroVarFields.append(self.depVarName)

        #### Standardize Y ####
        self.yMean = self.y.mean()
        self.ySTD = self.y.std()
        if self.standardize:
            self.y = (self.y - self.yMean) / self.ySTD

        #### Create Design Matrix ####
        self.k = len(self.indVarNames) + 1
        self.x = NUM.ones((self.n, self.k), dtype = float)
        for column, variable in enumerate(self.indVarNames):
            varData = ssdo.fields[variable].data
            self.x[:,column + 1] = varData
            if varData.var() <= 0.0:
                zeroVarFields.append(variable)

        #### Error for Constant Fields ####
        if len(zeroVarFields):
            zeroNames = ", ".join(zeroVarFields)
            ARCPY.AddIDMessage("ERROR", 1588, zeroNames)
            raise SystemExit()

        #### Standardize Y ####
        self.xMean = self.x.mean(0)
        self.xSTD = self.x.std(0)
        if self.standardize:
            self.x[0:,1:] = (self.x[0:,1:] - self.xMean[1:]) / self.xSTD[1:]

        ##### Check for Near Perfect Global Multicollinearity ####
        xx = NUM.dot(self.x.T, self.x)
        try:
            xxi = LA.inv(xx)
        except:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        #### 2nd CPP Check ####
        can_invert = ARC._ss.global_invert_check(self.x)
        if not can_invert:
            #### Perfect multicollinearity, cannot proceed ####
            ARCPY.AddIDMessage("ERROR", 639)
            raise SystemExit()

        #### Create CKDTree ####
        ssdo = self.ssdo
        if ssdo.useChordal:
            #### Chordal Distance XYZ ###
            self.coords = ssdo.spheroidCoords
        else:
            self.coords = ssdo.xyCoords

        self.kdTree = SCPS.cKDTree(self.coords)

    def __assignLinearUnitInfo(self):
        """Assigns Linear Unit Information."""

        ssdo = self.ssdo
        self.inputUnitName = ssdo.distanceInfo.name
        isFloat = UTILS.isNumeric(self.bandwidth)
        if self.bandwidth is not None and not isFloat:
            #### Linear Unit Passed In ####
            info = ssdo.distanceInfo.getUserLinearUnitInfo(self.bandwidth)
            self.bandwidth, self.userUnitName = info
            self.userBandwidth = ssdo.distanceInfo.convertInputLinearUnit(self.bandwidth, 
                                                                          self.userUnitName)
        else:
            #### When Float, Use Input Info ####
            self.userUnitName = self.inputUnitName 
            self.userBandwidth = self.bandwidth

        #### Prepare the distance unit name for latter use ####
        unitName = self.userUnitName
        if unitName is None:
            unitName = self.inputUnitName
        if unitName:
            self.distUnitName = " (%s)" % UTILS.distanceUnitInfo[unitName][0]
        else:
            self.distUnitName = ""

    def createOutputBandwidth(self, bandwidth, formatStr = "%0.4f",
                              returnUnits = True, strip = False):
        """Creates Output Bandwidth Formatted String in User Supplied Units.

        INPUTS:
        bandwidth (float): distance
        formatStr (str): format string
        returnUnits (bool): whether to return the linear unit
        """

        d = self.ssdo.distanceInfo.convertInputLinearUnit(bandwidth, 
                                                          self.userUnitName)

        if returnUnits:
            displayUnit = UTILS.getDisplayUnit(self.userUnitName, cellSize = d)
            formatedValue = UTILS.formatValue(d, formatStr = formatStr)
            return "{0} {1}".format(formatedValue, displayUnit.lower())
        else:
            if strip:
                return UTILS.humanReadableFloatStr(d, formatStr = formatStr)
            else:
                return UTILS.formatValue(d, formatStr = formatStr)

    def __setNeighborCalculation(self):
        """Sets Neighborhood Calculation Methods based on Kernel Type."""

        self.useKNN = self.numNeighs is not None
        if self.kernel == "BISQUARE":
            self.globalSearch = False
        else:
            self.globalSearch = self.ssdo.numObs < 1000

    def __getMinMaxKNNDistances(self):
        """Get Default Min/Max Search Distances based on KNN."""

        #### Set Progressor ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84426), 0, 
                            self.ssdo.numObs, 1)

        #### Set Minimum/Maximum KNN ####
        maxKNN = min(1000, self.ssdo.numObs)
        if self.ssdo.numObs <= 60:
            minKNN = 5
        else:
            minKNN = 30

        #### Keep Track of Min/Max Distances ####
        minDist = 0.0
        maxDist = 0.0
        minIndex = minKNN - 1
        for coordinates in self.coords:
            info = self.kdTree.query(coordinates, k = maxKNN, p = 2)
            distances = info[0]
            if distances[minIndex] > minDist:
                minDist = distances[minIndex]
            if distances[-1] > maxDist:
                maxDist = distances[-1]

            #### Reset Progessor ####
            ARCPY.SetProgressorPosition()

        return minDist, maxDist

    def __getMinKNNDistances(self):
        """Get Default Min Search Distances based on KNN."""

        #### Set Progressor ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84426), 0, 
                            self.ssdo.numObs, 1)

        #### Set Minimum KNN ####
        if self.ssdo.numObs <= 60:
            minKNN = 5
        else:
            minKNN = 30

        #### Keep Track of Min Distances ####
        minDist = 0.0
        minIndex = minKNN - 1
        for coordinates in self.coords:
            info = self.kdTree.query(coordinates, k = minKNN, p = 2)
            distances = info[0]
            if distances[minIndex] > minDist:
                minDist = distances[minIndex]

            #### Reset Progessor ####
            ARCPY.SetProgressorPosition()

        return minDist

    def __getMaxKNNDistances(self):
        """Get Default Max Search Distances based on KNN."""

        #### Set Progressor ####
        ARCPY.SetProgressor("step", ARCPY.GetIDMessage(84426), 0, 
                            self.ssdo.numObs, 1)

        #### Set Minimum/Maximum KNN ####
        maxKNN = min(1000, self.ssdo.numObs)

        #### Keep Track of Min/Max Distances ####
        maxDist = 0.0
        for coordinates in self.coords:
            info = self.kdTree.query(coordinates, k = maxKNN, p = 2)
            distances = info[0]
            if distances[-1] > maxDist:
                maxDist = distances[-1]

            #### Reset Progessor ####
            ARCPY.SetProgressorPosition()

        return maxDist

    def __setStatistics(self):

        #### Get/Set Statistics ####
        self.coef = self.gwr.coef 
        self.varCoef = self.gwr.var_coef
        self.seCoef = NUM.sqrt(self.varCoef)
        self.v1 = self.gwr.v1
        self.v2 = self.gwr.v2
        self.s2 = self.gwr.s2
        self.s2mle = self.gwr.s2_mle
        self.aicc = self.gwr.aicc
        self.edof = self.gwr.edof 
        self.mdof = self.n - self.v1
        self.yBar = self.gwr.y_bar
        self.influence = self.gwr.influence
        self.yHat = self.gwr.y_hat
        self.residuals = self.gwr.residuals
        self.ess = self.gwr.ess
        self.calcNumNeighs = self.gwr.num_neighs_array
        self.conditionNumbers = self.gwr.condition_numbers

        #### Calculate t-Stats and PVals ####
        self.adjustedAlpha = (.05 * self.k) / self.v1
        self.criticalValue = NUM.abs(self.adjustedAlpha / 2.0)
        self.crititcalT = SCISTAT.t.ppf(1 - self.criticalValue, self.n - 1)
        self.tValues = NUM.ones((self.n, self.k), dtype = float) * NUM.nan
        self.tIsSig = NUM.zeros((self.n, self.k), dtype = int) 
        for col in range(self.k):
            whereNonZeroSE = NUM.where(self.seCoef[:,col] != 0)
            tVals = self.coef[whereNonZeroSE, col] / self.seCoef[whereNonZeroSE, col]
            self.tValues[whereNonZeroSE, col] = tVals
            self.tIsSig[whereNonZeroSE, col] = NUM.abs(tVals) >= self.crititcalT

        #### Set Family Specific Stats ####
        if self.continuous:
            self.__setGaussianStatistics()
        else:
            self.__setNonGaussianStatistics()

    def __setGaussianStatistics(self):
        #### R2 ####
        self.tss = ((self.y - self.yBar)**2.0).sum()
        self.r2 = 1.0 - (self.ess / self.tss)
        self.r2Adj = 1.0 - (1.0 - self.r2) * (self.n - 1) / (self.edof - 1)

        #### Standardized Residuals ####
        scale = NUM.ones(self.n, dtype = float) * NUM.sqrt(self.s2)
        influenceLessOne = self.influence < 1
        scale[influenceLessOne] = NUM.sqrt(self.s2) * NUM.sqrt(1.0 - self.influence[influenceLessOne])
        self.stdResiduals = self.residuals / scale
        influence = NUM.copy(self.influence)
        influence[~influenceLessOne] = .9999
        topCook = self.stdResiduals**2.0 * influence
        botCook = self.v1 * (1.0 - influence)
        self.cooksD = topCook / botCook

        #### Global Stat Warning ####
        globalFlag = self.r2Adj == 1 or self.r2Adj < 0

        #### Check Local PDev ####
        localFlag = warnVectorValues(self.localR2)

        #### Warn for Poor Values ####
        if globalFlag or localFlag:
            ARCPY.AddIDMessage("WARNING", 110259)

        #### Do Reverse Standardization ####
        if self.standardize:
            self.reverseStandarize()

    def __setNonGaussianStatistics(self):

        self.deviance = self.gwr.deviance
        self.globalDeviance = self.gwr.global_deviance
        self.nullDeviance = self.gwr.null_deviance
        self.edof = self.gwr.edof 
        self.v1 = self.gwr.v1
        self.v2 = self.gwr.v2
        self.influence = self.gwr.influence
        self.yHat = self.gwr.y_hat
        self.yPredicted = self.gwr.y_predicted 
        self.residuals = self.gwr.residuals
        self.devResiduals = self.gwr.dev_residuals

        self.globalNullPDev = 1.0 - (self.globalDeviance / self.nullDeviance)
        self.localNullPDev = 1.0 - (self.deviance / self.nullDeviance)
        self.localGlobalPDev = 1.0 - (self.deviance / self.globalDeviance)

        #### Set Predicted Output ####
        self.yPredictedValue = NUM.array(NUM.round(self.yPredicted), dtype = float)

        #### Global Stat Warning ####
        globalFlag = self.localNullPDev == 1 or self.localNullPDev < 0

        #### Check Local PDev ####
        localFlag = warnVectorValues(self.localPDev)

        #### Check Dev Residuals ####
        if not localFlag:
            nanVals = NUM.isnan(self.devResiduals)
            localFlag = nanVals.sum() != 0

        #### Warn for Poor Values ####
        if globalFlag or localFlag:
            ARCPY.AddIDMessage("WARNING", 110259)

    def reverseStandarize(self):
        self.reverseCoef = self.gwr.coef.copy()
        self.reversePred = NUM.zeros(self.n, dtype=float)
        for ind in range(1, self.k):
            self.reverseCoef[:, ind] *= (self.ySTD / self.xSTD[ind])
    
        rawX = NUM.ones((self.n, self.k), dtype=float)
        for column, variable in enumerate(self.indVarNames):
            rawX[:, column+1] = self.ssdo.fields[variable].returnDouble()
    
        for i in range(self.n):
            self.reverseCoef[i, 0] = self.reverseCoef[i, 0] * self.ySTD + self.yMean - NUM.dot(self.xMean[1:], self.reverseCoef[i,1:])
            self.reversePred[i] = NUM.dot(rawX[i], self.reverseCoef[i])

    def addCoefFields(self, outPath):
        """Add Core Coefficient Fields."""

        fieldOrder = []
        candidateFields = {}

        #### Start With Coefficients and SEs ####
        candidateField = SSDO.CandidateField(gwrInterceptName, "DOUBLE", self.coef[:,0],
                                             alias = gwrInterceptAlias)
        candidateFields[gwrInterceptName] = candidateField
        fieldOrder.append(gwrInterceptName)

        seInterceptName = gwrSEFieldName.format(gwrInterceptName)
        seInterceptAlias = gwrSEFieldAlias.format(gwrInterceptName)
        candidateField = SSDO.CandidateField(seInterceptName, "DOUBLE", self.seCoef[:,0],
                                             alias = seInterceptAlias)
        candidateFields[seInterceptName] = candidateField
        fieldOrder.append(seInterceptName)

        tInterceptName = gwrTTestFieldName.format(gwrInterceptName)
        tInterceptAlias = gwrTTestFieldAlias.format(gwrInterceptName)
        candidateField = SSDO.CandidateField(tInterceptName, "DOUBLE", self.tValues[:,0],
                                             alias = tInterceptAlias, checkNullValues = True)
        candidateFields[tInterceptName] = candidateField
        fieldOrder.append(tInterceptName)

        sigInterceptName = gwrSigFieldName.format(gwrInterceptName)
        sigInterceptAlias = gwrSigFieldAlias.format(gwrInterceptName)
        candidateField = SSDO.CandidateField(sigInterceptName, "SHORT", self.tIsSig[:,0],
                                             alias = sigInterceptAlias)
        candidateFields[sigInterceptName] = candidateField
        fieldOrder.append(sigInterceptName)

        indVarOut = []
        for varName in self.indVarNames:
            indVarOut.append(gwrCoefFieldName.format(varName))
            indVarOut.append(gwrSEFieldName.format(varName))
            indVarOut.append(gwrTTestFieldName.format(varName))
            indVarOut.append(gwrSigFieldName.format(varName))

        indVarOut = UTILS.createAppendFieldNames(indVarOut, outPath)
        c = 0
        for varInd, varName in enumerate(self.indVarNames):
            #### Add Coefficient ####
            fieldName = indVarOut[c]
            alias = gwrCoefFieldAlias.format(varName)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.coef[:,varInd+1],
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c+=1

            #### Add SE ####
            fieldName = indVarOut[c]
            alias = gwrSEFieldAlias.format(varName)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.seCoef[:,varInd+1],
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c+=1

            #### Add T ####
            fieldName = indVarOut[c]
            alias = gwrTTestFieldAlias.format(varName)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.tValues[:,varInd+1],
                                                 alias = alias, checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c+=1

            #### Add T Sig ####
            fieldName = indVarOut[c]
            alias = gwrSigFieldAlias.format(varName)
            candidateField = SSDO.CandidateField(fieldName, "SHORT", self.tIsSig[:,varInd+1],
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c+=1

        return fieldOrder, candidateFields

    def addCoefFieldsSTD(self, outPath):
        """Add Core Coefficient Fields."""

        fieldOrder = []
        candidateFields = {}

        #### Add Standardized Input Variables (Including Scaled Y) ####
        xScaledOut = [gwrVarScaledName.format(self.depVarName)]
        for varName in self.indVarNames:
            xScaledOut.append(gwrVarScaledName.format(varName))

        scaledVarOut = UTILS.createAppendFieldNames(xScaledOut, outPath)
        c = 0
        self.scatterFieldNames = []
        for varInd in range(self.k):
            fieldName = scaledVarOut[c]
            self.scatterFieldNames.append(fieldName)

            #### Add Values ####
            if not varInd:
                #### Dep Var ####
                alias = gwrVarScaledAlias.format(self.depVarName)
                data = self.y.ravel()
            else:
                alias = gwrVarScaledAlias.format(self.indVarNames[varInd - 1])
                data = self.x[:,varInd].ravel()

            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", data,
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c += 1

        #### Start With Coefficients and SEs ####
        fieldName = gwrCoefFieldScaledName.format(gwrInterceptName)
        candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.coef[:,0],
                                             alias = gwrInterceptScaledAlias)
        candidateFields[fieldName] = candidateField
        fieldOrder.append(fieldName)

        fieldName = gwrSEFieldScaledName.format(gwrInterceptName)
        seInterceptAlias = gwrSEFieldScaledAlias.format(gwrInterceptAlias)
        candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.seCoef[:,0],
                                             alias = seInterceptAlias)
        candidateFields[fieldName] = candidateField
        fieldOrder.append(fieldName)

        fieldName = gwrTTestFieldScaledName.format(gwrInterceptName)
        tInterceptAlias = gwrTTestFieldScaledAlias.format(gwrInterceptAlias)
        candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.tValues[:,0],
                                             alias = tInterceptAlias, checkNullValues = True)
        candidateFields[fieldName] = candidateField
        fieldOrder.append(fieldName)

        fieldName = gwrSigFieldScaledName.format(gwrInterceptName)
        sigInterceptAlias = gwrSigFieldScaledAlias.format(gwrInterceptAlias)
        candidateField = SSDO.CandidateField(fieldName, "SHORT", self.tIsSig[:,0],
                                             alias = sigInterceptAlias)
        candidateFields[fieldName] = candidateField
        fieldOrder.append(fieldName)

        indVarOut = []
        for varName in self.indVarNames:
            indVarOut.append(gwrCoefFieldScaledName.format(varName))
            indVarOut.append(gwrSEFieldScaledName.format(varName))
            indVarOut.append(gwrTTestFieldScaledName.format(varName))
            indVarOut.append(gwrSigFieldScaledName.format(varName))

        indVarOut = UTILS.createAppendFieldNames(indVarOut, outPath)
        c = 0
        for varInd, varName in enumerate(self.indVarNames):
            #### Add Coefficient ####
            fieldName = indVarOut[c]
            alias = gwrCoefFieldScaledAlias.format(varName)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.coef[:,varInd+1],
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c+=1

            #### Add SE ####
            fieldName = indVarOut[c]
            alias = gwrSEFieldScaledAlias.format(varName)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.seCoef[:,varInd+1],
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c+=1

            #### Add T ####
            fieldName = indVarOut[c]
            alias = gwrTTestFieldScaledAlias.format(varName)
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", self.tValues[:,varInd+1],
                                                 alias = alias, checkNullValues = True)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c+=1

            #### Add T Sig ####
            fieldName = indVarOut[c]
            alias = gwrSigFieldScaledAlias.format(varName)
            candidateField = SSDO.CandidateField(fieldName, "SHORT", self.tIsSig[:,varInd+1],
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)
            c+=1

        return fieldOrder, candidateFields

    def gwrCandidateFields(self, candidateFields, fieldOrder):

        #### Add Prediction Field ####
        if self.standardize:
            #### Reverse Standardize ####
            alias = gwrPredFieldAlias.format(self.depVarName)
            candidateField = SSDO.CandidateField(gwrPredFieldName, "DOUBLE", 
                                                 self.reversePred.ravel(),
                                                 alias = alias)
            candidateFields[gwrPredFieldName] = candidateField
            fieldOrder.append(gwrPredFieldName)

            #### Scaled ####
            alias = gwrPredFieldScaledAlias.format(self.depVarName)
            candidateField = SSDO.CandidateField(gwrPredFieldScaledName, "DOUBLE", 
                                                 self.yHat.ravel(),
                                                 alias = alias)
            candidateFields[gwrPredFieldScaledName] = candidateField
            fieldOrder.append(gwrPredFieldScaledName)

        else:
            alias = gwrPredFieldAlias.format(self.depVarName)
            candidateField = SSDO.CandidateField(gwrPredFieldName, "DOUBLE", 
                                                 self.yHat.ravel(),
                                                 alias = alias)
            candidateFields[gwrPredFieldName] = candidateField
            fieldOrder.append(gwrPredFieldName)

        #### Other Summary Vectors ####
        fieldData = [self.residuals.ravel(), self.stdResiduals.ravel(), 
                     self.influence.ravel(), self.cooksD.ravel(),
                     self.conditionNumbers]

        if self.standardize:
            fNames = gwrFCFieldScaledNames
            fAlias = gwrFCFieldScaledAlias
        else:
            fNames = gwrFCFieldNames
            fAlias = gwrFCFieldAlias

        for varInd, varName in enumerate(fNames):
            alias = fAlias[varInd]
            candidateField = SSDO.CandidateField(varName, "DOUBLE", 
                                                 fieldData[varInd],
                                                 alias = alias)
            candidateFields[varName] = candidateField
            fieldOrder.append(varName)

        #### Add Local R2 ####
        if hasattr(self, "localR2"):
            candidateField = SSDO.CandidateField(gwrLocalR2Name, "DOUBLE", 
                                                 self.localR2.ravel(),
                                                 alias = gwrLocalR2Alias)
            candidateFields[gwrLocalR2Name] = candidateField
            fieldOrder.append(gwrLocalR2Name)

        return candidateFields, fieldOrder

    def ggwrCandidateFields(self, candidateFields, fieldOrder):

        #### Add Prediction Field ####
        fieldData = [self.yPredicted.ravel(), self.yPredictedValue.ravel()]
        if self.family == "LOGIT":
            fieldNames = [ggwrProbFieldName]
            aliasNames = [ggwrProbFieldAlias]
            fieldTypes = ["DOUBLE", "LONG"]
        else:
            fieldNames = [ggwrRawFieldName]
            aliasNames = [ggwrRawFieldAlias]
            fieldTypes = ["DOUBLE", "DOUBLE"]
        
        fieldNames.append(gwrPredFieldName)
        aliasNames.append(gwrPredFieldAlias)

        for fieldInd, fieldName in enumerate(fieldNames):
            alias = aliasNames[fieldInd].format(self.depVarName)
            candidateField = SSDO.CandidateField(fieldName, fieldTypes[fieldInd], 
                                                 fieldData[fieldInd],
                                                 alias = alias)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        #### Other Summary Vectors ####
        fieldData = [self.devResiduals.ravel(), self.influence.ravel(),
                     self.localPDev, self.conditionNumbers]

        for fieldInd, fieldName in enumerate(ggwrFCFieldNames):
            checkNullValues = fieldName in ["LOCALPDEV", "DEV_RESID"]
            alias = ggwrFCFieldAlias[fieldInd]
            candidateField = SSDO.CandidateField(fieldName, "DOUBLE", 
                                                 fieldData[fieldInd],
                                                 alias = alias,
                                                 checkNullValues = checkNullValues)
            candidateFields[fieldName] = candidateField
            fieldOrder.append(fieldName)

        return candidateFields, fieldOrder

    def createOutputFC(self, outputFC):
        ARCPY.env.overwriteOutput = True

        #### Validate Output Workspace ####
        ERROR.checkOutputPath(outputFC)

        #### Prepare Derived Variables for Output Feature Class ####
        outPath, outName = OS.path.split(outputFC)

        #### Create/Populate Dictionary of Candidate Fields ####
        if self.standardize:
            fieldOrder, candidateFields = self.addCoefFieldsSTD(outPath)
        else:
            fieldOrder, candidateFields = self.addCoefFields(outPath)

        #### Predicted Field ####
        if not self.continuous:
           candidateFields, fieldOrder = self.ggwrCandidateFields(candidateFields, fieldOrder)
        else:
           candidateFields, fieldOrder = self.gwrCandidateFields(candidateFields, fieldOrder)

        #### Add Number of Neighbors #### 
        if self.setNumNeighs:
            candidateField = SSDO.CandidateField(gwrNumNeighName, "LONG", 
                                                 self.calcNumNeighs,
                                                 alias = gwrNumNeighAlias)
            candidateFields[gwrNumNeighName] = candidateField
            fieldOrder.append(gwrNumNeighName)

        #### Write Data to Output Feature Class ####
        appendFields = [self.depVarName]
        if not self.standardize:
            appendFields += self.indVarNames

        self.ssdo.output2NewFC(outputFC, candidateFields, appendFields = appendFields,
                               fieldOrder = fieldOrder)

class GWR(BaseGWR):
    """Base Class for Geographically Weighted Regression.

    INPUTS:
    ssdo (obj): instance of SSDataObject
    depVarName (str): name of dependent variable field
    indVarNames (list): name of independent variable field(s)
    bandwidth (float): kernel bandwidth for spatial weighting
    kernel (str): "BISQUARE", "GAUSSIAN"
    family {str, GAUSSIAN}: GAUSSIAN, POISSON, LOGIT, NEGATIVEBINOMIAL

    ATTRIBUTES:
    n (int): # of observations
    k (int): # of independent variables
    q (int): # of restrictions (k - 1)
    dof (int): degrees of freedom (n - k)
    y (array): nx1 array of dependent variable values
    x (array): nxk array of independent variable values
    coef (array): kx1 vector of beta coefficients
    yHat (array): nx1 predicted dependent variables
    yBar (float): mean of dependent variable
    residuals (array): nx1 vector of regression residuals
    edof (float): effective degrees of freedom
    s2 (float): normalized residual sum of squares
    ess (float): Error Sum of Squares
    tss (float): Total Sum of Squares
    varCoef (array): (nxk) Variance-Covariance Matrix
    seCoef (array): (nxk) Standard Errors for Coeffs

    METHODS:
    initialize
    initializeSearch
    calculate
    report
    """

    def __init__(self, ssdo, depVarName, indVarNames, 
                 bandwidth = None, numNeighs = None, 
                 kernel = "BISQUARE", family = "GAUSSIAN",
                 standardize = False, silentMessages = False):

        #### Init Super Class ####
        super(GWR, self).__init__(ssdo, depVarName, indVarNames, 
                                  kernel = kernel, family = family,
                                  standardize = standardize,
                                  silentMessages = silentMessages)

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set Return Num Neighs Flag ####
        self.setNumNeighs = self.kernel == "BISQUARE" and numNeighs is None

        #### Resolve Linear Unit Info ####
        self._BaseGWR__assignLinearUnitInfo()

        #### Set Neighborhood Search Info ####
        self._BaseGWR__setNeighborCalculation()

        #### Calculate Statistic ####
        self.calculate()

    def calculate(self):
        """Performs GWR and related diagnostics."""

        #### Assure Num Neighs < N ####
        if self.numNeighs is not None:
            n = min(1000, self.ssdo.numObs)
            if self.numNeighs > n:
                self.numNeighs = n
                ARCPY.AddIDMessage("WARNING", 110225, n)

            #### Fail Coincident Points too High ####
            if not self.silentMessages:
                gwrCoincidentPointChecker(self.ssdo, self.numNeighs)

        #### Core C++ Calculation ####
        if self.useKNN:
            if self.continuous:
                #### Gaussian ####
                self.gwr = ARC._ss.GWR(self.y, self.x, self.kdTree, 
                                       self.coords,
                                       num_neighs = self.numNeighs,
                                       kernel = self.kernel)
            else:
                #### Other ####
                self.gwr = ARC._ss.GGWR(self.y, self.x, self.kdTree, 
                                        self.coords,
                                        num_neighs = self.numNeighs,
                                        kernel = self.kernel,
                                        family = self.family)

        else:
            if self.continuous:
                #### Gaussian ####
                self.gwr = ARC._ss.GWR(self.y, self.x, self.kdTree, 
                                       self.coords,
                                       bandwidth = self.bandwidth,
                                       kernel = self.kernel)
            else:
                #### Other ####
                self.gwr = ARC._ss.GGWR(self.y, self.x, self.kdTree, 
                                        self.coords,
                                        bandwidth = self.bandwidth,
                                        kernel = self.kernel,
                                        family = self.family)
        #### Do Calculation ####
        success = self.gwr.calculate()
        if success is None:
            raise SystemExit()

        #### Do Local Fit Stat ####
        self.calculateLocalFit()

        #### Set Statistics ####
        self._BaseGWR__setStatistics()

    def calculateLocalFit(self):
        #### Calculate R2 ####
        if self.continuous:
            self.gwr.calculate_local_R2()
            self.localR2 = self.gwr.local_R2
        else:
            self.gwr.calculate_local_pdev()
            self.localPDev = self.gwr.local_pdev


class ManualGWR(BaseGWR):
    """Computes Geographically Weighted Regression.

    INPUTS:
    ssdo (obj): instance of SSDataObject
    depVarName (str): name of dependent variable field
    indVarNames (list): name of independent variable field(s)
    bandwidth (float): kernel bandwidth for spatial weighting
    kernel (str): "BISQUARE", "GAUSSIAN"

    ATTRIBUTES:
    n (int): # of observations
    k (int): # of independent variables
    q (int): # of restrictions (k - 1)
    dof (int): degrees of freedom (n - k)
    y (array): nx1 array of dependent variable values
    x (array): nxk array of independent variable values
    coef (array): kx1 vector of beta coefficients
    yHat (array): nx1 predicted dependent variables
    yBar (float): mean of dependent variable
    residuals (array): nx1 vector of regression residuals
    edof (float): effective degrees of freedom
    s2 (float): normalized residual sum of squares
    ess (float): Error Sum of Squares
    tss (float): Total Sum of Squares
    varCoef (array): (nxk) Variance-Covariance Matrix
    seCoef (array): (nxk) Standard Errors for Coeffs

    METHODS:
    initialize
    initializeSearch
    calculate
    report
    """

    def __init__(self, ssdo, depVarName, indVarNames, numIncrements,
                 minNumNeighs = None, numNeighsInc = None,
                 minDistance = None, distanceInc = None, 
                 kernel = "BISQUARE", family = "GAUSSIAN",
                 standardize = False):

        #### Init Super Class ####
        super(ManualGWR, self).__init__(ssdo, depVarName, indVarNames, 
                                        kernel = kernel, family = family,
                                        standardize = standardize)

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Resolve Linear Unit Info ####
        self.__assignLinearUnitInfo()

        #### Perform Manual Search ####
        if minNumNeighs is not None:
            #### Check Coincident Point Count ####
            gwrCoincidentPointChecker(ssdo, minNumNeighs)

            self.__manualKNN()
        else:
            self.__manualDistance()

        #### Calculate Statistic ####
        self.calculate()

    def __assignLinearUnitInfo(self):
        ssdo = self.ssdo
        self.inputUnitName = ssdo.distanceInfo.name
        if self.minNumNeighs is not None:
            self.userUnitName = self.inputUnitName 
        else:
            #### Get Min Distance and User Unit Name ####
            info = ssdo.distanceInfo.getUserLinearUnitInfo(self.minDistance)
            self.minDistance, self.userUnitName = info

        #### Ignore Linear Unit for Increment (Same as Min Distance) ####
        if not UTILS.isNumeric(self.distanceInc) and self.distanceInc is not None:
            info = ssdo.distanceInfo.getUserLinearUnitInfo(self.distanceInc)
            self.distanceInc = info[0]

        #### Prepare the distance unit name for latter use ####
        unitName = self.userUnitName
        if unitName is None:
            unitName = self.inputUnitName
        if unitName:
            self.distUnitName = " (%s)" % UTILS.distanceUnitInfo[unitName][0]
        else:
            self.distUnitName = ""

    def __manualKNN(self):
        """Build Manual KNN Intervals."""

        #### Assure Min Num Neighs < N or 1000 ####
        if self.minNumNeighs >= min(self.ssdo.numObs, 1000):
            ARCPY.AddIDMessage("ERROR", 110262)
            raise SystemExit()

        self.useKNN = True
        dist = [self.minNumNeighs + (i * self.numNeighsInc) for i in range(self.numIncrements)]
        self.distances = NUM.array(dist, dtype = NUM.int32)

        #### Trim Intervals if Too Large ####
        limitKNN = min(gwrMaxNumNeighs, self.ssdo.numObs)
        knn2Large = self.distances > limitKNN
        num2Large = knn2Large.sum()
        if num2Large:
            #### Removing KNN Too Large ####
            ARCPY.AddIDMessage("WARNING", 110227, num2Large)
            self.distances = self.distances[~knn2Large]
            self.numIncrements = len(self.distances)
        self.userDistances = self.distances

        #### Manual Search for AICc ####
        if self.continuous:
            #### Gaussian ####
            self.gwr = ARC._ss.ManualGWR(self.y, self.x, self.kdTree, 
                                         self.coords,
                                         num_neighs = self.distances, 
                                         kernel = self.kernel)
        else:
            #### Other ####
            self.gwr = ARC._ss.ManualGGWR(self.y, self.x, self.kdTree, 
                                          self.coords,
                                          num_neighs = self.distances, 
                                          kernel = self.kernel,
                                          family = self.family)

        #### Do Calculation ####
        success = self.gwr.calculate()
        if success is None:
            raise SystemExit()

    def __manualDistance(self):
        self.useKNN = False 

        #### Resolve Distance Increments ####
        dist = [self.minDistance + (i * self.distanceInc) for i in range(self.numIncrements)]
        self.distances = NUM.array(dist, dtype = float)
        self.userDistances = UTILS.convertDistances(self.ssdo, 
                                                    self.userUnitName, 
                                                    self.distances)

        #### Manual Search for AICc ####
        if self.continuous:
            #### Gaussian ####
            self.gwr = ARC._ss.ManualGWR(self.y, self.x, self.kdTree, 
                                         self.coords,
                                         bandwidths = self.distances, 
                                         kernel = self.kernel)
        else:
            #### Other ####
            self.gwr = ARC._ss.ManualGGWR(self.y, self.x, self.kdTree, 
                                          self.coords,
                                          bandwidths = self.distances, 
                                          kernel = self.kernel,
                                          family = self.family)

        #### Do Calculation ####
        success = self.gwr.calculate()
        if success is None:
            raise SystemExit()

    def calculate(self):
        """Performs GWR and related diagnostics."""

        self.aiccs = self.gwr.aicc
        self.minIndex = self.aiccs.argmin()
        self.minAICc = self.aiccs[self.minIndex]
        self.searchCriteria = self.distances[self.minIndex]

        #### Create Formatted User Linear Unit for Bandwidth ####
        if not self.useKNN:
            self.finalBandwidth = self.createOutputBandwidth(self.searchCriteria,
                                                             formatStr = "%0.8f")
            self.finalBandwidthInput = self.ssdo.distanceInfo.convertInputLinearUnit(self.searchCriteria, 
                                                          self.userUnitName)
            self.finalBandwidthInput = "{0} {1}".format(self.finalBandwidthInput, self.userUnitName)
                                                            
        #### Print AICc Values ####
        self.printAICc()

    def printAICc(self):
        header = ARCPY.GetIDMessage(84853)
        rows = []
        if not self.useKNN:
            rows.append([ARCPY.GetIDMessage(84846) + self.distUnitName,
                         ARCPY.GetIDMessage(84249)])
            fmt = "%0.4f"
            for ind, aicc in enumerate(self.aiccs):
                d = self.createOutputBandwidth(self.distances[ind], 
                                               formatStr = fmt,
                                               returnUnits = False)
                rows.append([d, UTILS.formatValue(aicc, "%0.4f")])
        else:
            rows.append([ARCPY.GetIDMessage(84362), 
                         ARCPY.GetIDMessage(84249)])
            fmt = "%i"
            for ind, aicc in enumerate(self.aiccs):
                rows.append([UTILS.formatValue(self.userDistances[ind], fmt),
                             UTILS.formatValue(aicc, "%0.4f")])

        rows.append("EMPTY")
        table = UTILS.outputTextTable(rows, justify = ['left', 'right'],
                                      header = header, pad = 1,
                                      titleFillToken = "-",
                                      emptyFillToken = "-")

        ARCPY.AddMessage(table)

class OptimizedGWR(BaseGWR):
    """Computes Geographically Weighted Regression.

    INPUTS:
    ssdo (obj): instance of SSDataObject
    depVarName (str): name of dependent variable field
    indVarNames (list): name of independent variable field(s)
    bandwidth (float): kernel bandwidth for spatial weighting
    kernel (str): "BISQUARE", "GAUSSIAN"

    ATTRIBUTES:
    n (int): # of observations
    k (int): # of independent variables
    q (int): # of restrictions (k - 1)
    dof (int): degrees of freedom (n - k)
    y (array): nx1 array of dependent variable values
    x (array): nxk array of independent variable values
    coef (array): kx1 vector of beta coefficients
    yHat (array): nx1 predicted dependent variables
    yBar (float): mean of dependent variable
    residuals (array): nx1 vector of regression residuals
    edof (float): effective degrees of freedom
    s2 (float): normalized residual sum of squares
    ess (float): Error Sum of Squares
    tss (float): Total Sum of Squares
    varCoef (array): (nxk) Variance-Covariance Matrix
    seCoef (array): (nxk) Standard Errors for Coeffs

    METHODS:
    initialize
    initializeSearch
    calculate
    report
    """

    def __init__(self, ssdo, depVarName, indVarNames, 
                 minNumNeighs = None, maxNumNeighs = None,
                 minDistance = None, maxDistance = None, 
                 kernel = "BISQUARE", family = "GAUSSIAN",
                 neighborType = "NUMBER_OF_NEIGHBORS",
                 standardize = False):

        #### Init Super Class ####
        super(OptimizedGWR, self).__init__(ssdo, depVarName, indVarNames,
                                           kernel = kernel, family = family,
                                           standardize = standardize)

        #### Set Initial Attributes ####
        UTILS.assignClassAttr(self, locals())

        #### Set Search Boundaries ####
        self.__setMinMaxParameters()

        #### Set Linear Unit Info ####
        self.__assignLinearUnitInfo()

        #### Set Return Num Neighs Flag ####
        self.setNumNeighs = self.kernel == "BISQUARE"

        #### Do Golden Search ####
        if self.useDistance:
            self.__optimizeDistance()
        else:
            self.__optimizeKNN()

    def __setMinMaxParameters(self):
        """Sets the Min/Max KNN or Distance Params."""

        n = self.ssdo.numObs
        self.useDistance = self.neighborType != "NUMBER_OF_NEIGHBORS"

        #### Get/Set Distance Thresholds ####
        if self.useDistance:
            if self.minDistance is None:
                if self.maxDistance is None:
                    self.minDistance, self.maxDistance = self._BaseGWR__getMinMaxKNNDistances()
                else:
                    self.minDistance = self._BaseGWR__getMinKNNDistances()
            if self.maxDistance is None:
                self.maxDistance = self._BaseGWR__getMaxKNNDistances()

        else:
            #### Get/Set KNN Thresholds ####
            optimizedDefault = False
            if self.minNumNeighs is None:
                optimizedDefault = True
                if n <= 60:
                    self.minNumNeighs = 5
                else:
                    self.minNumNeighs = 30

            #### Check Coincident Point Count ####
            gwrCoincidentPointChecker(self.ssdo, self.minNumNeighs, 
                                      optimizedDefault = optimizedDefault)

            if self.maxNumNeighs is None:
                self.maxNumNeighs = min(1000, n)


            #### Assure Min Num Neighs < N or 1000 ####
            if self.minNumNeighs >= min(self.ssdo.numObs, 1000):
                ARCPY.AddIDMessage("ERROR", 110262)
                raise SystemExit()

    def __optimizeKNN(self):
        """Perform Golden-Search with a shrinking search window from a pre-defined 
        upper and lower bound for the search"""

        self.useKNN = True
        if self.continuous:
            #### Gaussian ####
            self.gwr = ARC._ss.OptimizedGWR(self.y, self.x, self.kdTree, 
                                            self.coords,
                                            min_num_neighs = self.minNumNeighs,
                                            max_num_neighs = self.maxNumNeighs,
                                            kernel = self.kernel)
        else:
            #### Other ####
            self.gwr = ARC._ss.OptimizedGGWR(self.y, self.x, self.kdTree, 
                                             self.coords,
                                             min_num_neighs = self.minNumNeighs,
                                             max_num_neighs = self.maxNumNeighs,
                                             kernel = self.kernel,
                                             family = self.family)
        #### Do Calculation ####
        success = self.gwr.calculate()
        if success is None:
            raise SystemExit()

        #### Do Local Fit Stat ####
        self.calculateLocalFit()

        self.knn = self.gwr.knn
        self.aiccs = self.gwr.aiccs
        self.numNeighs = self.knn[-1]
        self.calculate()

    def __optimizeDistance(self):
        """Perform Golden-Search with a shrinking search window from a pre-defined 
        upper and lower bound for the search"""

        #### Assure Max is Less than Min ####
        if self.maxDistance <= self.minDistance:
            ARCPY.AddIDMessage("ERROR", 110224)
            raise SystemExit()

        self.useKNN = False
        if self.continuous:
            #### Gaussian ####
            self.gwr = ARC._ss.OptimizedGWR(self.y, self.x, self.kdTree, 
                                            self.coords,
                                            min_distance = self.minDistance,
                                            max_distance = self.maxDistance,
                                            kernel = self.kernel)
        else:
            #### Other ####
            self.gwr = ARC._ss.OptimizedGGWR(self.y, self.x, self.kdTree, 
                                             self.coords,
                                             min_distance = self.minDistance,
                                             max_distance = self.maxDistance,
                                             kernel = self.kernel,
                                             family = self.family)
        #### Do Calculation ####
        success = self.gwr.calculate()
        if success is None:
            raise SystemExit()

        #### Do Local Fit Stat ####
        self.calculateLocalFit()

        self.distances = self.gwr.distances
        self.aiccs = self.gwr.aiccs
        self.bandwidth = self.distances[-1]
        self.calculate()

    def __assignLinearUnitInfo(self):
        """Assigns Linear Unit Information."""

        ssdo = self.ssdo
        self.inputUnitName = ssdo.distanceInfo.name
        minIsFloat = UTILS.isNumeric(self.minDistance)
        maxIsFloat = UTILS.isNumeric(self.maxDistance)
        bothFloat = minIsFloat and maxIsFloat
        if self.useDistance and not bothFloat:
            if minIsFloat:
                #### Min is in Base Units, Max in Linear Unit ####
                info = ssdo.distanceInfo.getUserLinearUnitInfo(self.maxDistance)
                self.maxDistance, self.userUnitName = info
                self.userMaxDistance = ssdo.distanceInfo.convertInputLinearUnit(self.maxDistance, 
                                                                                self.userUnitName)
                self.userMinDistance = ssdo.distanceInfo.convertInputLinearUnit(self.minDistance,
                                                                                self.userUnitName)
            if maxIsFloat:
                info = ssdo.distanceInfo.getUserLinearUnitInfo(self.minDistance)
                self.minDistance, self.userUnitName = info
                self.userMinDistance = ssdo.distanceInfo.convertInputLinearUnit(self.minDistance, 
                                                                                self.userUnitName)
                self.userMaxDistance = ssdo.distanceInfo.convertInputLinearUnit(self.maxDistance, 
                                                                                self.userUnitName)
            if not minIsFloat and not maxIsFloat:
                info = ssdo.distanceInfo.getUserLinearUnitInfo(self.minDistance)
                self.minDistance, self.userUnitName = info
                self.userMinDistance = ssdo.distanceInfo.convertInputLinearUnit(self.minDistance, 
                                                                                self.userUnitName)
                info = ssdo.distanceInfo.getUserLinearUnitInfo(self.maxDistance)
                self.maxDistance, self.userUnitName = info
                self.userMaxDistance = ssdo.distanceInfo.convertInputLinearUnit(self.maxDistance, 
                                                                                self.userUnitName)
        else:
            self.userUnitName = self.inputUnitName

        #### Prepare the distance unit name for latter use ####
        unitName = self.userUnitName
        if unitName is None:
            unitName = self.inputUnitName
        if unitName:
            self.distUnitName = " (%s)" % UTILS.distanceUnitInfo[unitName][0]
        else:
            self.distUnitName = ""

    def calculate(self):
        """Performs GWR and related diagnostics."""
        #### Print AICc Values ####
        self.printAICc()

        #### Set Statistics ####
        self.globalSearch = self.gwr.global_search
        self._BaseGWR__setStatistics()

    def calculateLocalFit(self):
        #### Calculate R2 ####
        if self.continuous:
            self.gwr.calculate_local_R2()
            self.localR2 = self.gwr.local_R2
        else:
            self.gwr.calculate_local_pdev()
            self.localPDev = self.gwr.local_pdev

    def printAICc(self):
        header = ARCPY.GetIDMessage(84854)
        rows = []
        if not self.useKNN:
            rows.append([ARCPY.GetIDMessage(84846) + self.distUnitName,
                         ARCPY.GetIDMessage(84249)])
            cat = self.distances
            fmt = "%0.4f"

            for ind, aicc in enumerate(self.aiccs):
                d = self.createOutputBandwidth(cat[ind], formatStr = fmt,
                                               returnUnits = False)
                rows.append([d, UTILS.formatValue(aicc, "%0.4f")])
        else:
            rows.append([ARCPY.GetIDMessage(84362), 
                         ARCPY.GetIDMessage(84249)])
            cat = self.knn
            fmt = "%i"

            for ind, aicc in enumerate(self.aiccs):
                rows.append([UTILS.formatValue(cat[ind], fmt),
                             UTILS.formatValue(aicc, "%0.4f")])

        rows.append("EMPTY")
        table = UTILS.outputTextTable(rows, justify = ['left', 'right'],
                                      header = header, pad = 1,
                                      titleFillToken = "-",
                                      emptyFillToken = "-")

        ARCPY.AddMessage(table)

        #### Warn for Boundary AICc ####
        if (self.gwr.aicc > self.aiccs[0:-1]).sum():
            ARCPY.AddIDMessage("WARNING", 110306)